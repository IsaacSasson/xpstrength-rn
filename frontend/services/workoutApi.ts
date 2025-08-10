// Path: /services/workoutApi.ts
import { api } from "@/utils/api";
import { handleApiError } from "@/utils/handleApiError";
import AsyncStorage from "@react-native-async-storage/async-storage";

/* ---------------------------- Helpers ---------------------------- */
const toNum = (v: any) => Number(v);

const UNIT_KEY = "unit_preference";

// Load unit preference (imperial by default)
const getUnitPreference = async (): Promise<"imperial" | "metric"> => {
  const saved = await AsyncStorage.getItem(UNIT_KEY);
  return saved === "metric" ? "metric" : "imperial";
};

// Convert kg <-> lbs
const lbsToKg = (lbs: number) => lbs * 0.453592;
const kgToLbs = (kg: number) => kg / 0.453592;

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
// Component Exercise -> API exerciseObj2
export const transformExerciseToAPI = (exercise: any) => {
  return {
    ...exercise,
    __transform__: async () => {
      const unit = await getUnitPreference();
      const sets = exercise.sets.map((set: any) => {
        // Extract numeric weight from string like "25.5 lbs" or "12 kg"
        const weightMatch = set.weight.match(/(\d+(?:\.\d+)?)/);
        let weight = weightMatch ? parseFloat(weightMatch[1]) : 0;

        // If metric, convert kg -> lbs before sending
        if (unit === "metric") {
          weight = kgToLbs(weight);
        }

        const reps = parseInt(set.reps) || 0;

        return {
          reps: Math.max(0, reps),
          weight: Math.max(0, weight),
        };
      });

      const transformed = {
        exercise: toNum(exercise.originalExerciseId),
        sets,
        cooldown: 60,
      };

      console.log(`Transforming exercise "${exercise.name}":`, {
        original: exercise,
        transformed,
      });

      return transformed;
    },
  };
};

// API exerciseObj2 -> Component Exercise
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
      let weight = set.weight || 0;
      // Convert lbs -> kg if metric
      if (unit === "metric") {
        weight = lbsToKg(weight);
      }
      return {
        reps: String(set.reps || 0),
        weight: `${unit === "metric" ? weight.toFixed(1) + " kg" : weight + " lbs"}`,
      };
    });
  } else {
    sets = Array.from({ length: apiExercise.sets || 1 }, () => {
      let weight = apiExercise.weight || 0;
      if (unit === "metric") {
        weight = lbsToKg(weight);
      }
      return {
        reps: String(apiExercise.reps || 0),
        weight: `${unit === "metric" ? weight.toFixed(1) + " kg" : weight + " lbs"}`,
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

      console.log("Creating workout with data:", {
        name,
        exercises: transformedExercises,
      });

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
      console.log("Create workout API response:", result);

      let workoutData;
      if (result.data?.newCustomWorkout)
        workoutData = result.data.newCustomWorkout;
      else if (result.workout) workoutData = result.workout;
      else if (result.data) workoutData = result.data;
      else workoutData = result;

      if (!workoutData || !workoutData.id) {
        console.error("No workout ID found in response:", result);
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

      console.log("Successfully extracted workout ID:", workout.id);
      return { success: true, workout };
    } catch (error) {
      console.error("Create workout error:", error);
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

      console.log("Updating workout with data:", {
        id,
        name,
        exercises: transformedExercises,
      });

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
      console.log("Update workout API response:", result);

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

      console.log("Successfully processed update for workout ID:", workout.id);
      return { success: true, workout };
    } catch (error) {
      console.error("Update workout error:", error);
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
      console.log("Get custom workouts response:", result);

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
      console.error("Get workouts error:", error);
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
      console.log("Delete workout response:", result);

      const planArr = extractPlan(result) ?? null;
      return { success: true, plan: planArr || undefined };
    } catch (error) {
      console.error("Delete workout error:", error);
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
      console.log("Get workout plan response:", result);

      const planArr = extractPlan(result);
      if (!planArr || planArr.length !== 7) {
        return { success: false, error: "Invalid plan shape from server" };
      }

      return { success: true, plan: planArr };
    } catch (error) {
      console.error("Get workout plan error:", error);
      return { success: false, error: "Network error occurred" };
    }
  },

  async updateWorkoutPlan(
    plan: number[]
  ): Promise<{ success: boolean; plan?: number[]; error?: string }> {
    try {
      const normalized = plan.map(toNum);
      console.log("Updating workout plan with:", normalized);

      const response = await api.put("/api/v1/user/workout-plan", {
        data: { newPlan: normalized },
      });

      if (!response.ok) {
        const errorDetails = await handleApiError(response);
        console.error("Workout plan update failed:", errorDetails);
        return {
          success: false,
          error: errorDetails.error || "Failed to update workout plan",
        };
      }

      const result = await response.json();
      console.log("Workout plan update response:", result);

      const planArr = extractPlan(result) ?? normalized;
      return { success: true, plan: planArr };
    } catch (error) {
      console.error("Update workout plan error:", error);
      return { success: false, error: "Network error occurred" };
    }
  },
};
