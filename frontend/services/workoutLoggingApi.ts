import { api } from "@/utils/api";
import { handleApiError } from "@/utils/handleApiError";

/* ----------------------------- Types ----------------------------- */
export type UnitSystem = "imperial" | "metric";
export type MuscleCategory =
  | "chest"
  | "legs"
  | "back"
  | "core"
  | "biceps"
  | "triceps"
  | "shoulders";

export interface WorkoutLogSet {
  reps: number;
  // weight is always sent to the backend in lbs
  weight: number;
}

export interface WorkoutLogExercise {
  exercise: number;     // canonical exercise ID
  cooldown: number;     // seconds
  notes?: string;
  sets: WorkoutLogSet[];
}

export interface WorkoutLogPayload {
  length: number; // workout duration in seconds
  exercises: WorkoutLogExercise[];
}

export interface WorkoutEvent {
  id: number;
  type: "userLevelUp" | "muscleLevelUp" | "firstTimeCompletingExercise" | "newPersonalBest";
  payload: any;
  createdAt: string;
}

// Backend returns per-exercise XP bucketed by the 7 canonical categories
export type MuscleXpByExercise = Record<
  string,
  Partial<Record<MuscleCategory, number>>
>;

export interface LogWorkoutResponse {
  success: boolean;
  events?: WorkoutEvent[];
  userGainedXP?: number;
  muscleCategoryGainedXP?: MuscleXpByExercise;
  error?: string;
}

/* ----------------------------- Converters ----------------------------- */
// Convert frontend exercise data to backend format
export const convertExerciseToLogFormat = (
  exercise: any,
  convertWeight: (weight: number, from: UnitSystem, to: UnitSystem) => number,
  unitSystem: UnitSystem
): WorkoutLogExercise => {
  const exerciseId = Number(exercise.id);

  // Only log completed sets; backend expects whole-number lbs
  const sets: WorkoutLogSet[] = (exercise.sets || [])
    .filter((set: any) => set.checked)
    .map((set: any) => {
      const weightInLbs =
        unitSystem === "metric"
          ? convertWeight(set.lbs, "metric", "imperial")
          : set.lbs;
      return {
        reps: Number(set.reps),
        weight: Math.round(Number(weightInLbs) || 0),
      };
    });

  return {
    exercise: exerciseId,
    cooldown: 60,
    notes: exercise.notes || "",
    sets,
  };
};

/* ----------------------------- API ----------------------------- */
export const workoutLoggingApi = {
  async logWorkout(workoutData: WorkoutLogPayload): Promise<LogWorkoutResponse> {
    try {
      const response = await api.post("/api/v1/user/log-workout", {
        data: { log: workoutData },
      });

      if (!response.ok) {
        const errorDetails = await handleApiError(response);
        return {
          success: false,
          error: errorDetails.error || "Failed to log workout",
        };
      }

      const result = await response.json();
      return {
        success: true,
        events: result?.data?.events || [],
        userGainedXP: result?.data?.userGainedXP || 0,
        // Assume backend already returns only the 7 canonical categories
        muscleCategoryGainedXP: result?.data?.muscleCategoryGainedXP || {},
      };
    } catch (error) {
      console.error("❌ Error logging workout:", error);
      return {
        success: false,
        error: "Network error occurred",
      };
    }
  },
};