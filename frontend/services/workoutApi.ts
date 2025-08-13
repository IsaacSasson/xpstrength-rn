// Path: /services/workoutApi.ts
import { api } from "@/utils/api";
import { handleApiError } from "@/utils/handleApiError";
import AsyncStorage from "@react-native-async-storage/async-storage";

/* ---------------------------- Unit helpers ---------------------------- */
// Exact constants to avoid drift when users flip units frequently
const LBS_TO_KG = 0.45359237;
const KG_TO_LBS = 1 / LBS_TO_KG;

const toNum = (v: any) => Number(v);

const UNIT_KEY = "unit_preference";

// Load unit preference for UI fallback parsing when strings omit units
const getUnitPreference = async (): Promise<"imperial" | "metric"> => {
  const saved = await AsyncStorage.getItem(UNIT_KEY);
  return saved === "metric" ? "metric" : "imperial";
};

// Display-side converters (used in hydration)
const lbsToKg = (lbs: number) => lbs * LBS_TO_KG;

/* ---------------------------- Parsing helpers ---------------------------- */
// Robustly parse string or number weights into whole lbs for the API.
// - "60", "60 kg", "60kgs", "135 lbs", 135 -> lbs
// - If unit is missing, fall back to current unit preference.
const parseWeightStringToLbs = (
  input: unknown,
  fallbackUnit: "imperial" | "metric"
): number => {
  // Object form { value, unit } defensively supported
  if (input && typeof input === "object") {
    const maybe = input as any;
    if (typeof maybe.value === "number") {
      const val = maybe.value;
      const u = String(maybe.unit ?? (fallbackUnit === "metric" ? "kg" : "lbs")).toLowerCase();
      if (u.startsWith("kg")) return Math.round(val * KG_TO_LBS);
      return Math.round(val);
    }
  }

  if (typeof input === "number") {
    // Numbers are assumed to already be lbs in this codebase
    return Math.max(0, Math.round(input));
  }

  if (typeof input === "string") {
    const s = input.trim().toLowerCase();
    const numMatch = s.match(/(\d+(?:\.\d+)?)/);
    const unitMatch = s.match(/\b(kg|kgs|kilogram|kilograms|lb|lbs)\b/);
    const raw = numMatch ? parseFloat(numMatch[1]) : 0;

    if (unitMatch) {
      const u = unitMatch[1];
      if (u.startsWith("kg")) return Math.max(0, Math.round(raw * KG_TO_LBS));
      return Math.max(0, Math.round(raw));
    }

    // No explicit unit -> use preference
    if (fallbackUnit === "metric") return Math.max(0, Math.round(raw * KG_TO_LBS));
    return Math.max(0, Math.round(raw));
  }

  return 0;
};

const parseReps = (input: unknown): number => {
  if (typeof input === "number") return Math.max(0, Math.round(input));
  if (typeof input === "string") {
    const n = parseFloat(input);
    return Number.isFinite(n) ? Math.max(0, Math.round(n)) : 0;
  }
  return 0;
};

/* ---------------------------- Plan extractor ---------------------------- */
const extractPlan = (result: any): number[] | null => {
  const candidates = [
    result?.plan,
    result?.data?.plan,
    result?.data?.weeklyPlan?.plan,
    result?.weeklyPlan?.plan,
    result?.data?.newPlan, // deleteCustomWorkout response
  ];
  const arr = candidates.find((c: any) => Array.isArray(c));
  return arr ? arr.map(toNum) : null;
};

/* ------------------------- Transformers -------------------------- */
// Component Exercise -> API exerciseObj2 (server expects lbs as `weight`)
export const transformExerciseToAPI = (exercise: any) => {
  return {
    ...exercise,
    __transform__: async () => {
      const unitPref = await getUnitPreference();

      const sets = (exercise.sets || []).map((set: any) => {
        const reps = parseReps(set.reps);
        const lbs = parseWeightStringToLbs(set.weight, unitPref); // normalize to whole lbs
        return {
          reps,
          weight: Math.max(0, lbs), // API payload uses `weight` in lbs
        };
      });

      const transformed = {
        exercise: toNum(exercise.originalExerciseId),
        sets,
        cooldown: 60,
      };

      return transformed;
    },
  };
};

// API exerciseObj2 -> Component Exercise (hydrate with unit-aware display strings)
export const transformExerciseFromAPI = async (
  apiExercise: any,
  exerciseDatabase: any[]
) => {
  const unit = await getUnitPreference();

  const exerciseDetails = exerciseDatabase.find(
    (ex) => toNum(ex.id) === toNum(apiExercise.exercise)
  );

  let sets;
  if (Array.isArray(apiExercise.sets)) {
    sets = apiExercise.sets.map((set: any) => {
      const rawLbs = Number(set.weight || 0);
      if (unit === "metric") {
        const kg = lbsToKg(rawLbs);
        return {
          reps: String(parseReps(set.reps)),
          weight: `${kg.toFixed(1)} kg`,
        };
      }
      return {
        reps: String(parseReps(set.reps)),
        weight: `${Math.round(rawLbs)} lbs`,
      };
    });
  } else {
    // Legacy summary shape fallback
    const count = toNum(apiExercise.sets) || 1;
    const baseLbs = Number(apiExercise.weight || 0);
    sets = Array.from({ length: count }, () => {
      if (unit === "metric") {
        const kg = lbsToKg(baseLbs);
        return {
          reps: String(parseReps(apiExercise.reps)),
          weight: `${kg.toFixed(1)} kg`,
        };
      }
      return {
        reps: String(parseReps(apiExercise.reps)),
        weight: `${Math.round(baseLbs)} lbs`,
      };
    });
  }

  return {
    id: `ex_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
    name: exerciseDetails?.name || `Exercise ${apiExercise.exercise}`,
    sets,
    notes: "",
    originalExerciseId: String(apiExercise.exercise),
  };
};

/* ----------------------------- Types ----------------------------- */
export interface CustomWorkout {
  id: number;
  name: string;
  exercises: any[];
  userId?: number;
  createdAt?: string;
  updatedAt?: string;
}

/* ------------------------------ API ------------------------------ */
export const workoutApi = {
  /* ----------- Custom Workouts ----------- */
  async createCustomWorkout(
    name: string,
    exercises: any[]
  ): Promise<{ success: boolean; workout?: CustomWorkout; error?: string }> {
    try {
      const validExercises = exercises.filter((ex) => ex.originalExerciseId);
      if (validExercises.length === 0) {
        return {
          success: false,
          error:
            "No valid exercises found. Please add exercises from the exercise library.",
        };
      }

      const transformedExercises = [];
      for (const ex of validExercises) {
        transformedExercises.push(await transformExerciseToAPI(ex).__transform__());
      }

      const response = await api.post("/api/v1/user/custom-workout", {
        data: { exercises: transformedExercises, name },
      });

      if (!response.ok) {
        const errorDetails = await handleApiError(response);
        return {
          success: false,
          error: errorDetails.error || "Failed to create workout",
        };
      }

      const result = await response.json();

      let workoutData;
      if (result.data?.newCustomWorkout)
        workoutData = result.data.newCustomWorkout;
      else if (result.workout) workoutData = result.workout;
      else if (result.data) workoutData = result.data;
      else workoutData = result;

      if (!workoutData || !workoutData.id) {
        return { success: false, error: "Server did not return a workout ID" };
      }

      const workout: CustomWorkout = {
        id: toNum(workoutData.id),
        name: workoutData.name,
        exercises: workoutData.exercises || [],
        userId:
          workoutData.userId != null ? toNum(workoutData.userId) : undefined,
        createdAt: workoutData.createdAt,
        updatedAt: workoutData.updatedAt,
      };

      return { success: true, workout };
    } catch (error) {
      return { success: false, error: "Network error occurred" };
    }
  },

  async updateCustomWorkout(
    id: number,
    name: string,
    exercises: any[]
  ): Promise<{ success: boolean; workout?: CustomWorkout; error?: string }> {
    try {
      const validExercises = exercises.filter((ex) => ex.originalExerciseId);
      if (validExercises.length === 0) {
        return {
          success: false,
          error:
            "No valid exercises found. Please add exercises from the exercise library.",
        };
      }

      const transformedExercises = [];
      for (const ex of validExercises) {
        transformedExercises.push(await transformExerciseToAPI(ex).__transform__());
      }

      const response = await api.put("/api/v1/user/custom-workout", {
        data: { exercises: transformedExercises, name, id },
      });

      if (!response.ok) {
        const errorDetails = await handleApiError(response);
        return {
          success: false,
          error: errorDetails.error || "Failed to update workout",
        };
      }

      const result = await response.json();

      let workoutData;
      if (result.data?.updatedCustomWorkout)
        workoutData = result.data.updatedCustomWorkout;
      else if (result.data?.newCustomWorkout)
        workoutData = result.data.newCustomWorkout;
      else if (result.workout) workoutData = result.workout;
      else if (result.data) workoutData = result.data;
      else workoutData = { id, name, exercises: [] };

      const workout: CustomWorkout = {
        id: toNum(workoutData.id ?? id),
        name: workoutData.name ?? name,
        exercises: workoutData.exercises || [],
        userId:
        workoutData.userId != null ? toNum(workoutData.userId) : undefined,
        createdAt: workoutData.createdAt,
        updatedAt: workoutData.updatedAt,
      };

      return { success: true, workout };
    } catch (error) {
      return { success: false, error: "Network error occurred" };
    }
  },

  async getCustomWorkouts(): Promise<{
    success: boolean;
    workouts?: CustomWorkout[];
    error?: string;
  }> {
    try {
      const response = await api.get("/api/v1/user/custom-workouts");

      if (!response.ok) {
        const errorDetails = await handleApiError(response);
        return {
          success: false,
          error: errorDetails.error || "Failed to fetch workouts",
        };
      }

      const result = await response.json();

      const workoutsData =
        result.data?.customWorkouts ?? result.customWorkouts ?? [];

      const workouts: CustomWorkout[] = workoutsData.map((w: any) => ({
        id: toNum(w.id),
        name: w.name,
        exercises: w.exercises || [],
        userId: w.userId != null ? toNum(w.userId) : undefined,
        createdAt: w.createdAt,
        updatedAt: w.updatedAt,
      }));

      return { success: true, workouts };
    } catch (error) {
      return { success: false, error: "Network error occurred" };
    }
  },

  async deleteCustomWorkout(
    id: number
  ): Promise<{ success: boolean; plan?: number[]; error?: string }> {
    try {
      const response = await api.delete("/api/v1/user/custom-workout", {
        body: JSON.stringify({ data: { id } }),
      });

      if (!response.ok) {
        const errorDetails = await handleApiError(response);
        return {
          success: false,
          error: errorDetails.error || "Failed to delete workout",
        };
      }

      const result = await response.json();

      const planArr = extractPlan(result) ?? null;
      return { success: true, plan: planArr || undefined };
    } catch (error) {
      return { success: false, error: "Network error occurred" };
    }
  },

  /* --------------- Workout Plan --------------- */
  async getWorkoutPlan(): Promise<{
    success: boolean;
    plan?: number[];
    error?: string;
  }> {
    try {
      const response = await api.get("/api/v1/user/workout-plan");

      if (!response.ok) {
        const errorDetails = await handleApiError(response);
        return {
          success: false,
          error: errorDetails.error || "Failed to fetch workout plan",
        };
      }

      const result = await response.json();

      const planArr = extractPlan(result);
      if (!planArr || planArr.length !== 7) {
        return { success: false, error: "Invalid plan shape from server" };
      }

      return { success: true, plan: planArr };
    } catch (error) {
      return { success: false, error: "Network error occurred" };
    }
  },

  async updateWorkoutPlan(
    plan: number[]
  ): Promise<{ success: boolean; plan?: number[]; error?: string }> {
    try {
      const normalized = plan.map(toNum);

      const response = await api.put("/api/v1/user/workout-plan", {
        data: { newPlan: normalized },
      });

      if (!response.ok) {
        const errorDetails = await handleApiError(response);
        return {
          success: false,
          error: errorDetails.error || "Failed to update workout plan",
        };
      }

      const result = await response.json();

      const planArr = extractPlan(result) ?? normalized;
      return { success: true, plan: planArr };
    } catch (error) {
      return { success: false, error: "Network error occurred" };
    }
  },
};