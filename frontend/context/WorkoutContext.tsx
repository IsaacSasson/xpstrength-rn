import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  ReactNode,
} from "react";
import { workoutApi } from "@/services/workoutApi";
import { loadExercises } from "@/utils/loadExercises";
import { useAuth } from "@/context/AuthProvider";
import AsyncStorage from "@react-native-async-storage/async-storage";

/* ----------------------------- Types ----------------------------- */
export interface CustomWorkout {
  id: number;
  name: string;
  exercises: any[];
  userId?: number;
  createdAt?: string;
  updatedAt?: string;
}

export type UnitSystem = "imperial" | "metric";

/* Session types used by Active Workout screen */
export interface SessionSet {
  id: number;
  reps: number;
  lbs: number;      // stored in the current unitSystem (lbs or kg numeric)
  checked?: boolean;
}
export interface SessionExercise {
  id: string | number;
  name: string;
  images?: string[];
  instructions?: string;
  primaryMuscles?: string[];
  secondaryMuscles?: string[];
  sets: SessionSet[];
  notes?: string;
}
export interface ActiveSession {
  id: string;
  title: string;
  dayIndex: number;
  workoutId: number;
  startedAt: number;
  exercises: SessionExercise[];
}

export interface WorkoutContextType {
  // Data
  workoutPlan: number[]; // -1=rest, 0=unassigned, >0=workoutId
  customWorkouts: CustomWorkout[];
  exerciseDatabase: any[];
  exerciseIndex: Record<string, any>;
  getExerciseMeta: (id: number | string) => any | undefined;

  // Unit System
  unitSystem: UnitSystem;
  setUnitSystem: (unit: UnitSystem) => Promise<void>;

  // Weight helpers
  convertWeight: (weight: number, fromUnit: UnitSystem, toUnit: UnitSystem) => number;
  formatWeight: (weight: number, unit?: UnitSystem) => string;
  parseWeight: (weightString: string) => { value: number; unit: UnitSystem };
  convertWeightString: (weightString: string, targetUnit?: UnitSystem) => string;

  // Loading states
  isLoading: boolean;
  isRefreshing: boolean;
  error: string | null;

  // Actions
  refreshData: () => Promise<void>;
  createWorkout: (
    name: string,
    exercises: any[],
    days?: string[]
  ) => Promise<{ success: boolean; workout?: CustomWorkout; error?: string }>;
  updateWorkout: (
    id: number,
    name: string,
    exercises: any[],
    days?: string[]
  ) => Promise<{ success: boolean; workout?: CustomWorkout; error?: string }>;
  deleteWorkout: (id: number) => Promise<{ success: boolean; error?: string }>;
  updateWorkoutPlan: (plan: number[]) => Promise<{ success: boolean; error?: string }>;

  // Helpers
  getWorkoutById: (id: number) => CustomWorkout | undefined;
  getWorkoutForDay: (dayIndex: number) => CustomWorkout | null;
  clearError: () => void;

  // Single-day assignment helper
  setPlanDay: (dayIndex: number, value: number) => Promise<boolean>;

  // Active workout session
  activeSession: ActiveSession | null;
  startActiveSession: (dayIndex: number) => boolean;
  clearActiveSession: () => void;
}

/* ----------------------------- Constants ----------------------------- */
const REST = -1;
const UNASSIGNED = 0;
const EMPTY_PLAN = Array(7).fill(UNASSIGNED) as number[];
const UNIT_KEY = "unit_preference";

const LBS_TO_KG_FACTOR = 0.45359237;
const KG_TO_LBS_FACTOR = 1 / LBS_TO_KG_FACTOR;

const DAY_TO_INDEX: Record<string, number> = {
  Sunday: 0,
  Monday: 1,
  Tuesday: 2,
  Wednesday: 3,
  Thursday: 4,
  Friday: 5,
  Saturday: 6,
};

const WorkoutContext = createContext<WorkoutContextType | undefined>(undefined);

/* ----------------------------- Pure helpers ----------------------------- */
export const convertWeight = (weight: number, fromUnit: UnitSystem, toUnit: UnitSystem): number => {
  if (fromUnit === toUnit) return weight;
  if (fromUnit === "imperial" && toUnit === "metric") return Number((weight * LBS_TO_KG_FACTOR).toFixed(1));
  if (fromUnit === "metric" && toUnit === "imperial") return Number((weight * KG_TO_LBS_FACTOR).toFixed(1));
  return weight;
};

export const formatWeight = (weight: number, unit: UnitSystem = "imperial"): string => {
  const rounded = Number(weight.toFixed(1));
  return unit === "metric" ? `${rounded} kg` : `${Math.round(rounded)} lbs`;
};

const WEIGHT_RE = /(\d+(?:\.\d+)?)\s*(lbs?|kgs?|kg|lb)?/i;

export const parseWeight = (
  weightString: string,
  fallbackUnit: UnitSystem = "imperial"
): { value: number; unit: UnitSystem } => {
  const s = (weightString || "").toString().trim();
  const match = s.match(WEIGHT_RE);
  if (match) {
    const value = parseFloat(match[1]);
    const raw = (match[2] || "").toLowerCase();
    if (raw) {
      const unit: UnitSystem = raw.startsWith("kg") ? "metric" : "imperial";
      return { value, unit };
    }
    return { value, unit: fallbackUnit };
  }
  return { value: 0, unit: fallbackUnit };
};

export const convertWeightString = (
  weightString: string,
  targetUnit: UnitSystem = "imperial"
): string => {
  const { value, unit } = parseWeight(weightString, targetUnit);
  const converted = convertWeight(value, unit, targetUnit);
  return formatWeight(converted, targetUnit);
};

/* ----------------------------- Internal helpers ----------------------------- */
const extractPlanArray = (res: any): number[] | null => {
  const candidates = [res?.plan, res?.data?.plan, res?.data?.weeklyPlan?.plan, res?.weeklyPlan?.plan];
  const arr = candidates.find((c: any) => Array.isArray(c));
  return arr ? arr.map((n: any) => Number(n)) : null;
};

const extractWorkoutsList = (res: any): any[] => {
  return res?.workouts ?? res?.data?.customWorkouts ?? res?.data?.workouts ?? [];
};

/* ----------------------------- Provider ----------------------------- */
export const WorkoutProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { isAuthenticated, isLoading: authLoading, user } = useAuth();

  // Core data
  const [workoutPlan, setWorkoutPlan] = useState<number[]>(EMPTY_PLAN);
  const [customWorkouts, setCustomWorkouts] = useState<CustomWorkout[]>([]);
  const [exerciseDatabase, setExerciseDatabase] = useState<any[]>([]);
  const [exerciseIndex, setExerciseIndex] = useState<Record<string, any>>({});

  // Units
  const [unitSystem, setUnitSystemState] = useState<UnitSystem>("imperial");

  // UI state
  const [isLoading, setIsLoading] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasInitialized, setHasInitialized] = useState(false);

  // Active workout session
  const [activeSession, setActiveSession] = useState<ActiveSession | null>(null);

  /* ----------------------------- Unit prefs ----------------------------- */
  const loadUnitPreference = useCallback(async () => {
    try {
      const saved = await AsyncStorage.getItem(UNIT_KEY);
      if (saved === "imperial" || saved === "metric") setUnitSystemState(saved);
    } catch (error) {
      console.error("Failed to load unit preference:", error);
    }
  }, []);

  const setUnitSystem = useCallback(async (unit: UnitSystem) => {
    try {
      await AsyncStorage.setItem(UNIT_KEY, unit);
      setUnitSystemState(unit);
    } catch (error) {
      console.error("Failed to save unit preference:", error);
    }
  }, []);

  const formatWeightCtx = useCallback(
    (weight: number, unit?: UnitSystem) => formatWeight(weight, unit ?? unitSystem),
    [unitSystem]
  );
  const parseWeightCtx = useCallback((weightString: string) => parseWeight(weightString, unitSystem), [unitSystem]);
  const convertWeightStringCtx = useCallback(
    (weightString: string, targetUnit?: UnitSystem) => convertWeightString(weightString, targetUnit ?? unitSystem),
    [unitSystem]
  );

  /* ----------------------------- Exercise meta index ----------------------------- */
  const buildExerciseIndex = useCallback((list: any[]) => {
    // Build a plain-object index for O(1) lookups by id
    const idx: Record<string, any> = Object.create(null);
    for (let i = 0; i < list.length; i++) {
      const item = list[i];
      const key = String(item?.id ?? "");
      if (key) idx[key] = item;
    }
    return idx;
  }, []);

  const getExerciseMeta = useCallback(
    (id: number | string) => {
      const key = String(id);
      return exerciseIndex[key];
    },
    [exerciseIndex]
  );

  /* ----------------------------- Data loading ----------------------------- */
  const loadData = useCallback(
    async (isRefresh = false) => {
      if (!isAuthenticated) return;

      try {
        if (!isRefresh) setIsLoading(true);
        else setIsRefreshing(true);
        setError(null);

        // Local exercises JSON load (client-side)
        const exercises = loadExercises();
        setExerciseDatabase(exercises);
        setExerciseIndex(buildExerciseIndex(exercises));

        const [planResult, workoutsResult] = await Promise.all([
          workoutApi.getWorkoutPlan(),
          workoutApi.getCustomWorkouts(),
        ]);

        if (planResult?.success) {
          const planArray = extractPlanArray(planResult);
          if (planArray && planArray.length === 7) setWorkoutPlan(planArray.map(Number));
          else setWorkoutPlan(EMPTY_PLAN);
        } else {
          if (!isRefresh) setError(planResult?.error || "Failed to load workout plan");
          setWorkoutPlan(EMPTY_PLAN);
        }

        const list = extractWorkoutsList(workoutsResult);
        if (workoutsResult?.success && Array.isArray(list)) {
          const transformed: CustomWorkout[] = list.map((w: any) => ({
            id: Number(w.id),
            name: w.name,
            exercises: w.exercises || [],
            userId: w.userId != null ? Number(w.userId) : undefined,
            createdAt: w.createdAt,
            updatedAt: w.updatedAt,
          }));
          setCustomWorkouts(transformed);
        } else {
          if (!isRefresh) setError(workoutsResult?.error || "Failed to load custom workouts");
          setCustomWorkouts([]);
        }

        setHasInitialized(true);
      } catch (err) {
        console.error("Error loading workout data:", err);
        setError("Failed to load workout data");
        setWorkoutPlan(EMPTY_PLAN);
        setCustomWorkouts([]);
        setExerciseIndex({});
      } finally {
        setIsLoading(false);
        setIsRefreshing(false);
      }
    },
    [isAuthenticated, user, buildExerciseIndex]
  );

  const refreshData = useCallback(async () => {
    await loadData(true);
  }, [loadData]);

  /* ----------------------------- CRUD ----------------------------- */
  const createWorkout = useCallback(
    async (name: string, exercises: any[], days?: string[]) => {
      if (!isAuthenticated) return { success: false, error: "Not authenticated" };
      try {
        const result = await workoutApi.createCustomWorkout(name, exercises);
        if (result.success && result.workout) {
          const newWorkout: CustomWorkout = {
            id: Number(result.workout.id),
            name: result.workout.name,
            exercises: result.workout.exercises || [],
            userId: result.workout.userId != null ? Number(result.workout.userId) : undefined,
            createdAt: result.workout.createdAt,
            updatedAt: result.workout.updatedAt,
          };
          setCustomWorkouts((prev) => [...prev, newWorkout]);

          if (days && days.length > 0) {
            setWorkoutPlan((currentPlan) => {
              const newPlan = [...currentPlan];
              days.forEach((day) => {
                const idx = DAY_TO_INDEX[day];
                if (idx !== undefined) newPlan[idx] = newWorkout.id;
              });
              workoutApi.updateWorkoutPlan(newPlan).then((res) => {
                if (!res.success) console.error("Failed to update workout plan on server:", res.error);
              });
              return newPlan;
            });
          }

          return { success: true, workout: newWorkout };
        }
        return { success: false, error: result.error };
      } catch (err) {
        console.error("Error creating workout:", err);
        return { success: false, error: "Failed to create workout" };
      }
    },
    [isAuthenticated]
  );

  const updateWorkout = useCallback(
    async (id: number, name: string, exercises: any[], days?: string[]) => {
      if (!isAuthenticated) return { success: false, error: "Not authenticated" };
      try {
        const result = await workoutApi.updateCustomWorkout(id, name, exercises);
        if (result.success && result.workout) {
          const updatedWorkout: CustomWorkout = {
            id: Number(result.workout.id),
            name: result.workout.name,
            exercises: result.workout.exercises || [],
            userId: result.workout.userId != null ? Number(result.workout.userId) : undefined,
            createdAt: result.workout.createdAt,
            updatedAt: result.workout.updatedAt,
          };
          setCustomWorkouts((prev) => prev.map((w) => (w.id === id ? updatedWorkout : w)));

          if (days && days.length > 0) {
            setWorkoutPlan((currentPlan) => {
              const newPlan = currentPlan.map((workoutId) => (workoutId === id ? UNASSIGNED : workoutId));
              days.forEach((day) => {
                const idx = DAY_TO_INDEX[day];
                if (idx !== undefined) newPlan[idx] = id;
              });
              workoutApi.updateWorkoutPlan(newPlan).then((res) => {
                if (!res.success) console.error("Failed to update workout plan on server:", res.error);
              });
              return newPlan;
            });
          }

          return { success: true, workout: updatedWorkout };
        }
        return { success: false, error: result.error };
      } catch (err) {
        console.error("Error updating workout:", err);
        return { success: false, error: "Failed to update workout" };
      }
    },
    [isAuthenticated]
  );

  const deleteWorkout = useCallback(
    async (id: number) => {
      if (!isAuthenticated) return { success: false, error: "Not authenticated" };
      try {
        const result = await workoutApi.deleteCustomWorkout(id);
        if (result.success) {
          setCustomWorkouts((prev) => prev.filter((w) => w.id !== id));
          setWorkoutPlan((prev) => {
            const newPlan = prev.map((workoutId) => (workoutId === id ? UNASSIGNED : workoutId));
            workoutApi.updateWorkoutPlan(newPlan).then((res) => {
              if (!res.success) console.error("Failed to update workout plan on server:", res.error);
            });
            return newPlan;
          });
        }
        return result;
      } catch (err) {
        console.error("Error deleting workout:", err);
        return { success: false, error: "Failed to delete workout" };
      }
    },
    [isAuthenticated]
  );

  const updateWorkoutPlan = useCallback(
    async (plan: number[]) => {
      if (!isAuthenticated) return { success: false, error: "Not authenticated" };
      try {
        const normalizedPlan = plan.map(Number);
        const result = await workoutApi.updateWorkoutPlan(normalizedPlan);
        if (result.success) setWorkoutPlan(normalizedPlan);
        return result;
      } catch (err) {
        console.error("Error updating workout plan:", err);
        return { success: false, error: "Failed to update workout plan" };
      }
    },
    [isAuthenticated]
  );

  /* ----------------------------- Single-day assignment ----------------------------- */
  const setPlanDay = useCallback(
    async (dayIndex: number, value: number): Promise<boolean> => {
      try {
        if (dayIndex < 0 || dayIndex > 6) return false;
        const basePlan = Array.isArray(workoutPlan) && workoutPlan.length === 7 ? workoutPlan : EMPTY_PLAN;
        const nextPlan = [...basePlan];
        nextPlan[dayIndex] = Number(value);
        const res = await updateWorkoutPlan(nextPlan);
        return !!res?.success;
      } catch (e) {
        console.error("setPlanDay error:", e);
        return false;
      }
    },
    [workoutPlan, updateWorkoutPlan]
  );

  /* ----------------------------- Helpers ----------------------------- */
  const getWorkoutById = useCallback(
    (id: number): CustomWorkout | undefined => customWorkouts.find((w) => Number(w.id) === Number(id)),
    [customWorkouts]
  );

  const getWorkoutForDay = useCallback(
    (dayIndex: number): CustomWorkout | null => {
      if (dayIndex < 0 || dayIndex > 6) return null;
      const val = Number(workoutPlan[dayIndex]);
      if (val > 0) return getWorkoutById(val) ?? null;
      return null;
    },
    [workoutPlan, getWorkoutById]
  );

  const clearError = useCallback(() => setError(null), []);

  /* ----------------------------- Active session builder ----------------------------- */
  const startActiveSession = useCallback(
    (dayIndex: number): boolean => {
      const w = getWorkoutForDay(dayIndex);
      if (!w || !w.exercises || w.exercises.length === 0) return false;

      // Minimal session; heavy enrichment happens in ActiveWorkout
      const session: ActiveSession = {
        id: `sess_${Date.now()}`,
        title: w.name || "Workout",
        dayIndex,
        workoutId: w.id,
        startedAt: Date.now(),
        exercises: w.exercises.map((ex: any) => ({
          id: Number(ex.exercise ?? ex.id),
          name: `Exercise ${Number(ex.exercise ?? ex.id)}`,
          images: [],
          instructions: "",
          primaryMuscles: [],
          secondaryMuscles: [],
          sets: Array.isArray(ex.sets)
            ? ex.sets.map((s: any, i: number) => ({
                id: i + 1,
                reps: Number(s?.reps) || 0,
                lbs: 0,
                checked: false,
              }))
            : Array.from({ length: Math.max(Number(ex.sets ?? 0), 0) }, (_, i) => ({
                id: i + 1,
                reps: Number(ex.reps ?? 0),
                lbs: 0,
                checked: false,
              })),
          notes: "",
        })),
      };

      setActiveSession(session);
      return true;
    },
    [getWorkoutForDay]
  );

  const clearActiveSession = useCallback(() => {
    setActiveSession(null);
  }, []);

  /* ----------------------------- Init effects ----------------------------- */
  useEffect(() => {
    loadUnitPreference();
  }, [loadUnitPreference]);

  useEffect(() => {
    if (authLoading) return;

    if (isAuthenticated && !hasInitialized) {
      setTimeout(() => loadData(false), 100);
    } else if (!isAuthenticated && hasInitialized) {
      setWorkoutPlan(EMPTY_PLAN);
      setCustomWorkouts([]);
      setError(null);
      setHasInitialized(false);
      setActiveSession(null);
      setExerciseIndex({});
      setExerciseDatabase([]);
    }
  }, [isAuthenticated, authLoading, hasInitialized, loadData, user]);

  /* ----------------------------- Context value ----------------------------- */
  const contextValue: WorkoutContextType = {
    workoutPlan,
    customWorkouts,
    exerciseDatabase,
    exerciseIndex,
    getExerciseMeta,

    unitSystem,
    setUnitSystem,

    convertWeight,
    formatWeight: formatWeightCtx,
    parseWeight: parseWeightCtx,
    convertWeightString: convertWeightStringCtx,

    isLoading,
    isRefreshing,
    error,
    refreshData,
    createWorkout,
    updateWorkout,
    deleteWorkout,
    updateWorkoutPlan,
    getWorkoutById,
    getWorkoutForDay,
    clearError,
    setPlanDay,

    activeSession,
    startActiveSession,
    clearActiveSession,
  };

  return <WorkoutContext.Provider value={contextValue}>{children}</WorkoutContext.Provider>;
};

/* ----------------------------- Hook ----------------------------- */
export const useWorkouts = (): WorkoutContextType => {
  const context = useContext(WorkoutContext);
  if (context === undefined) {
    throw new Error("useWorkouts must be used within a WorkoutProvider");
  }
  return context;
};