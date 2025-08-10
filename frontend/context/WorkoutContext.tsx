// Path: /context/WorkoutContext.tsx
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

export interface WorkoutContextType {
  // Data
  workoutPlan: number[]; // -1=rest, 0=unassigned, >0=workoutId
  customWorkouts: CustomWorkout[];
  exerciseDatabase: any[];

  // Unit System
  unitSystem: UnitSystem;
  setUnitSystem: (unit: UnitSystem) => Promise<void>;

  // Weight Conversion Functions (context-aware defaults)
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

  // assign a single day to: -1 (rest), 0 (unassigned), or >0 (workout id)
  setPlanDay: (dayIndex: number, value: number) => Promise<boolean>;
}

/* ----------------------------- Constants ----------------------------- */
const REST = -1;
const UNASSIGNED = 0;
const EMPTY_PLAN = Array(7).fill(UNASSIGNED) as number[];
const UNIT_KEY = "unit_preference";

// High precision conversion factor for exact conversions
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

/* ------------------------------------------------------------------
   MODULE-SCOPE PURE HELPERS (exported)
   These are safe to import directly anywhere:
   import { parseWeight, formatWeight, convertWeight, convertWeightString } from "@/context/WorkoutContext";
-------------------------------------------------------------------*/

// Convert value between units (pure)
export const convertWeight = (weight: number, fromUnit: UnitSystem, toUnit: UnitSystem): number => {
  if (fromUnit === toUnit) return weight;
  if (fromUnit === "imperial" && toUnit === "metric") {
    return Number((weight * LBS_TO_KG_FACTOR).toFixed(1));
  }
  if (fromUnit === "metric" && toUnit === "imperial") {
    return Number((weight * KG_TO_LBS_FACTOR).toFixed(1));
  }
  return weight;
};

// Format value with unit (pure). If unit omitted, defaults to "imperial"
export const formatWeight = (weight: number, unit: UnitSystem = "imperial"): string => {
  const rounded = Number(weight.toFixed(1));
  return unit === "metric" ? `${rounded} kg` : `${Math.round(rounded)} lbs`;
};

// Parse a weight string like "135", "135 lbs", "60 kg"
// Fallback unit can be provided; defaults to "imperial" if omitted.
export const parseWeight = (
  weightString: string,
  fallbackUnit: UnitSystem = "imperial"
): { value: number; unit: UnitSystem } => {
  const s = (weightString || "").toString().trim();
  const match = s.match(/(\d+(?:\.\d+)?)\s*(lbs?|kgs?|kg|lb)?/i);

  if (match) {
    const value = parseFloat(match[1]);
    const raw = (match[2] || "").toLowerCase();
    if (raw) {
      const unit: UnitSystem = raw.startsWith("kg") ? "metric" : "imperial";
      return { value, unit };
    }
    return { value, unit: fallbackUnit };
  }

  // No number found; return zero with fallback unit
  return { value: 0, unit: fallbackUnit };
};

// Convert a weight string to a target unit (pure)
export const convertWeightString = (
  weightString: string,
  targetUnit: UnitSystem = "imperial"
): string => {
  const { value, unit } = parseWeight(weightString, targetUnit);
  const converted = convertWeight(value, unit, targetUnit);
  return formatWeight(converted, targetUnit);
};

/* ----------------------------- Internal Helpers ----------------------------- */
const extractPlanArray = (res: any): number[] | null => {
  const candidates = [
    res?.plan,
    res?.data?.plan,
    res?.data?.weeklyPlan?.plan,
    res?.weeklyPlan?.plan,
  ];
  const arr = candidates.find((c: any) => Array.isArray(c));
  return arr ? arr.map((n: any) => Number(n)) : null;
};

const extractWorkoutsList = (res: any): any[] => {
  return res?.workouts ?? res?.data?.customWorkouts ?? res?.data?.workouts ?? [];
};

/* ----------------------------- Provider ----------------------------- */
export const WorkoutProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { isAuthenticated, isLoading: authLoading, user } = useAuth();

  // State
  const [workoutPlan, setWorkoutPlan] = useState<number[]>(EMPTY_PLAN);
  const [customWorkouts, setCustomWorkouts] = useState<CustomWorkout[]>([]);
  const [exerciseDatabase, setExerciseDatabase] = useState<any[]>([]);
  const [unitSystem, setUnitSystemState] = useState<UnitSystem>("imperial");
  const [isLoading, setIsLoading] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasInitialized, setHasInitialized] = useState(false);

  /* ----------------------------- Unit System Functions ----------------------------- */

  // Load unit preference from storage
  const loadUnitPreference = useCallback(async () => {
    try {
      const saved = await AsyncStorage.getItem(UNIT_KEY);
      if (saved === "imperial" || saved === "metric") {
        setUnitSystemState(saved);
      }
    } catch (error) {
      console.error("Failed to load unit preference:", error);
    }
  }, []);

  // Save unit preference and update state
  const setUnitSystem = useCallback(async (unit: UnitSystem) => {
    try {
      await AsyncStorage.setItem(UNIT_KEY, unit);
      setUnitSystemState(unit);
    } catch (error) {
      console.error("Failed to save unit preference:", error);
    }
  }, []);

  // Context-facing wrappers that **default to current unitSystem** where relevant
  const formatWeightCtx = useCallback(
    (weight: number, unit?: UnitSystem) => formatWeight(weight, unit ?? unitSystem),
    [unitSystem]
  );

  const parseWeightCtx = useCallback(
    (weightString: string) => parseWeight(weightString, unitSystem),
    [unitSystem]
  );

  const convertWeightStringCtx = useCallback(
    (weightString: string, targetUnit?: UnitSystem) =>
      convertWeightString(weightString, targetUnit ?? unitSystem),
    [unitSystem]
  );

  /* ----------------------------- Data Loading ----------------------------- */
  const loadData = useCallback(
    async (isRefresh = false) => {
      if (!isAuthenticated) {
        console.log("🚫 Not authenticated, skipping workout data fetch");
        return;
      }

      try {
        if (!isRefresh) setIsLoading(true);
        else setIsRefreshing(true);
        setError(null);

        console.log("🔄 Loading workout data for user:", user?.username);

        // 1. Local exercise DB
        console.log("📚 Loading exercise database...");
        const exercises = loadExercises();
        setExerciseDatabase(exercises);
        console.log("✅ Exercise database loaded:", exercises.length, "exercises");

        // 2. Fetch plan + workouts
        console.log("🌐 Fetching workout plan and custom workouts from API...");
        const [planResult, workoutsResult] = await Promise.all([
          workoutApi.getWorkoutPlan(),
          workoutApi.getCustomWorkouts(),
        ]);

        // --- Workout Plan ---
        if (planResult?.success) {
          const planArray = extractPlanArray(planResult);
          if (planArray && planArray.length === 7) {
            console.log("✅ Workout plan loaded:", planArray);
            setWorkoutPlan(planArray.map(Number));
          } else {
            console.warn("⚠️ Plan missing/invalid, using empty (UNASSIGNED) plan:", planResult);
            setWorkoutPlan(EMPTY_PLAN);
          }
        } else {
          console.warn("⚠️ Failed to load workout plan:", planResult?.error);
          if (!isRefresh) setError(planResult?.error || "Failed to load workout plan");
          setWorkoutPlan(EMPTY_PLAN);
        }

        // --- Custom Workouts ---
        const list = extractWorkoutsList(workoutsResult);
        if (workoutsResult?.success && Array.isArray(list)) {
          console.log("✅ Custom workouts loaded:", list.length, "workouts");
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
          console.warn("⚠️ Failed to load custom workouts:", workoutsResult?.error);
          if (!isRefresh) {
            setError(workoutsResult?.error || "Failed to load custom workouts");
          }
          setCustomWorkouts([]);
        }

        setHasInitialized(true);
        console.log("🎉 Workout data loading complete!");
      } catch (err) {
        console.error("❌ Error loading workout data:", err);
        setError("Failed to load workout data");
        setWorkoutPlan(EMPTY_PLAN);
        setCustomWorkouts([]);
      } finally {
        setIsLoading(false);
        setIsRefreshing(false);
      }
    },
    [isAuthenticated, user]
  );

  const refreshData = useCallback(async () => {
    await loadData(true);
  }, [loadData]);

  /* ----------------------------- Workout CRUD ----------------------------- */
  const createWorkout = useCallback(
    async (
      name: string,
      exercises: any[],
      days?: string[]
    ): Promise<{ success: boolean; workout?: CustomWorkout; error?: string }> => {
      if (!isAuthenticated) return { success: false, error: "Not authenticated" };

      try {
        console.log("🆕 Creating workout:", name, "with", exercises.length, "exercises");
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
                if (idx !== undefined) newPlan[idx] = newWorkout.id; // assign (>0)
              });

              workoutApi.updateWorkoutPlan(newPlan).then((res) => {
                if (!res.success) {
                  console.error("Failed to update workout plan on server:", res.error);
                }
              });

              return newPlan;
            });
          }

          return { success: true, workout: newWorkout };
        }

        console.error("❌ Failed to create workout:", result.error);
        return { success: false, error: result.error };
      } catch (err) {
        console.error("❌ Error creating workout:", err);
        return { success: false, error: "Failed to create workout" };
      }
    },
    [isAuthenticated]
  );

  const updateWorkout = useCallback(
    async (
      id: number,
      name: string,
      exercises: any[],
      days?: string[]
    ): Promise<{ success: boolean; workout?: CustomWorkout; error?: string }> => {
      if (!isAuthenticated) return { success: false, error: "Not authenticated" };

      try {
        console.log("📝 Updating workout:", id, name);
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
              // remove existing assignments of this workout -> set to UNASSIGNED (0)
              const newPlan = currentPlan.map((workoutId) =>
                workoutId === id ? UNASSIGNED : workoutId
              );

              // then assign days
              days.forEach((day) => {
                const idx = DAY_TO_INDEX[day];
                if (idx !== undefined) newPlan[idx] = id;
              });

              workoutApi.updateWorkoutPlan(newPlan).then((res) => {
                if (!res.success) {
                  console.error("Failed to update workout plan on server:", res.error);
                }
              });

              return newPlan;
            });
          }

          return { success: true, workout: updatedWorkout };
        }

        console.error("❌ Failed to update workout:", result.error);
        return { success: false, error: result.error };
      } catch (err) {
        console.error("❌ Error updating workout:", err);
        return { success: false, error: "Failed to update workout" };
      }
    },
    [isAuthenticated]
  );

  const deleteWorkout = useCallback(
    async (id: number) => {
      if (!isAuthenticated) return { success: false, error: "Not authenticated" };

      try {
        console.log("🗑️ Deleting workout:", id);
        const result = await workoutApi.deleteCustomWorkout(id);

        if (result.success) {
          setCustomWorkouts((prev) => prev.filter((w) => w.id !== id));

          setWorkoutPlan((prev) => {
            // Clear any day that was assigned to this id -> UNASSIGNED
            const newPlan = prev.map((workoutId) => (workoutId === id ? UNASSIGNED : workoutId));
            workoutApi.updateWorkoutPlan(newPlan).then((res) => {
              if (!res.success) {
                console.error("Failed to update workout plan on server:", res.error);
              }
            });
            return newPlan;
          });

          return result;
        }

        console.error("❌ Failed to delete workout:", result.error);
        return result;
      } catch (err) {
        console.error("❌ Error deleting workout:", err);
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
        console.log("📅 Updating workout plan:", normalizedPlan);

        const result = await workoutApi.updateWorkoutPlan(normalizedPlan);

        if (result.success) {
          console.log("✅ Workout plan updated successfully");
          setWorkoutPlan(normalizedPlan);
          return result;
        }

        console.error("❌ Failed to update workout plan:", result.error);
        return result;
      } catch (err) {
        console.error("❌ Error updating workout plan:", err);
        return { success: false, error: "Failed to update workout plan" };
      }
    },
    [isAuthenticated]
  );

  /* ----------------------------- set a single day ----------------------------- */
  const setPlanDay = useCallback(
    async (dayIndex: number, value: number): Promise<boolean> => {
      try {
        if (dayIndex < 0 || dayIndex > 6) {
          console.error("setPlanDay: invalid dayIndex", dayIndex);
          return false;
        }

        const basePlan =
          Array.isArray(workoutPlan) && workoutPlan.length === 7 ? workoutPlan : EMPTY_PLAN;

        const nextPlan = [...basePlan];
        nextPlan[dayIndex] = Number(value); // -1 rest, 0 unassigned, >0 workoutId

        const res = await updateWorkoutPlan(nextPlan);
        return !!res?.success;
      } catch (e) {
        console.error("setPlanDay error:", e);
        return false;
      }
    },
    [workoutPlan, updateWorkoutPlan]
  );

  /* ----------------------------- Helper Functions ----------------------------- */
  const getWorkoutById = useCallback(
    (id: number): CustomWorkout | undefined =>
      customWorkouts.find((w) => Number(w.id) === Number(id)),
    [customWorkouts]
  );

  const getWorkoutForDay = useCallback(
    (dayIndex: number): CustomWorkout | null => {
      if (dayIndex < 0 || dayIndex > 6) return null;

      const val = Number(workoutPlan[dayIndex]);
      // only return a workout if it's a positive id
      if (val > 0) return getWorkoutById(val) ?? null;

      return null; // rest (-1) or unassigned (0) -> no workout object
    },
    [workoutPlan, getWorkoutById]
  );

  const clearError = useCallback(() => setError(null), []);

  /* ----------------------------- Initialization Effects ----------------------------- */

  // Load unit preference on mount
  useEffect(() => {
    loadUnitPreference();
  }, [loadUnitPreference]);

  /* ----------------------------- Auth Effect ----------------------------- */
  useEffect(() => {
    console.log("🔍 WorkoutContext auth effect:", {
      isAuthenticated,
      authLoading,
      hasInitialized,
      username: user?.username,
    });

    if (authLoading) return;

    if (isAuthenticated && !hasInitialized) {
      console.log("🔐 Authenticated, loading workout data for:", user?.username);
      setTimeout(() => loadData(false), 100);
    } else if (!isAuthenticated && hasInitialized) {
      console.log("🔓 Logged out, clearing workout data...");
      setWorkoutPlan(EMPTY_PLAN);
      setCustomWorkouts([]);
      setError(null);
      setHasInitialized(false);
    } else {
      console.log("⏸️ Not loading workout data because:", {
        isAuthenticated: isAuthenticated ? "✅" : "❌",
        authNotLoading: !authLoading ? "✅" : "❌",
        notInitialized: !hasInitialized ? "✅" : "❌",
      });
    }
  }, [isAuthenticated, authLoading, hasInitialized, loadData, user]);

  /* ----------------------------- Context Value ----------------------------- */
  const contextValue: WorkoutContextType = {
    workoutPlan,
    customWorkouts,
    exerciseDatabase,
    unitSystem,
    setUnitSystem,

    // Note: we expose the pure convertWeight directly (no defaulting)
    convertWeight,
    // but context wrappers for these to apply current unitSystem defaults
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
