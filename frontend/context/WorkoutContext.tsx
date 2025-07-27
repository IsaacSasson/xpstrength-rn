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

/* ----------------------------- Types ----------------------------- */
export interface CustomWorkout {
  id: number;
  name: string;
  exercises: any[];
  userId?: number;
  createdAt?: string;
  updatedAt?: string;
}

export interface WorkoutContextType {
  // Data
  workoutPlan: number[];
  customWorkouts: CustomWorkout[];
  exerciseDatabase: any[];

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
}

/* ----------------------------- Constants ----------------------------- */
const EMPTY_PLAN = Array(7).fill(-1) as number[];
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

/* ----------------------------- Helpers ----------------------------- */
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
  return (
    res?.workouts ??
    res?.data?.customWorkouts ??
    res?.data?.workouts ??
    []
  );
};

/* ----------------------------- Provider ----------------------------- */
export const WorkoutProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { isAuthenticated, isLoading: authLoading, user } = useAuth();

  // State
  const [workoutPlan, setWorkoutPlan] = useState<number[]>(EMPTY_PLAN);
  const [customWorkouts, setCustomWorkouts] = useState<CustomWorkout[]>([]);
  const [exerciseDatabase, setExerciseDatabase] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasInitialized, setHasInitialized] = useState(false);

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
            setWorkoutPlan(planArray);
          } else {
            console.warn("⚠️ Plan missing/invalid, using empty plan:", planResult);
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
                if (idx !== undefined) newPlan[idx] = newWorkout.id;
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

          setCustomWorkouts((prev) =>
            prev.map((w) => (w.id === id ? updatedWorkout : w))
          );

          if (days && days.length > 0) {
            setWorkoutPlan((currentPlan) => {
              const newPlan = currentPlan.map((workoutId) =>
                workoutId === id ? -1 : workoutId
              );

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
            const newPlan = prev.map((workoutId) => (workoutId === id ? -1 : workoutId));
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

  /* ----------------------------- Helper Functions ----------------------------- */
  const getWorkoutById = useCallback(
    (id: number): CustomWorkout | undefined =>
      customWorkouts.find((w) => Number(w.id) === Number(id)),
    [customWorkouts]
  );

  const getWorkoutForDay = useCallback(
    (dayIndex: number): CustomWorkout | null => {
      if (dayIndex < 0 || dayIndex > 6) return null;

      const workoutId = Number(workoutPlan[dayIndex]);
      if (workoutId === -1) return null;

      return getWorkoutById(workoutId) ?? null;
    },
    [workoutPlan, getWorkoutById]
  );

  const clearError = useCallback(() => setError(null), []);

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
  };

  return (
    <WorkoutContext.Provider value={contextValue}>
      {children}
    </WorkoutContext.Provider>
  );
};

/* ----------------------------- Hook ----------------------------- */
export const useWorkouts = (): WorkoutContextType => {
  const context = useContext(WorkoutContext);
  if (context === undefined) {
    throw new Error("useWorkouts must be used within a WorkoutProvider");
  }
  return context;
};
