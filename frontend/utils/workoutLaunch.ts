// Simplified in-memory buffer for instant workout launching

import type { CachedSession } from "@/utils/activeWorkoutCache";
import { log } from "@/utils/devLog";

export interface LaunchPreset {
  name: string;
  dayIndex: number;
  workoutId: number;
  exercises: Array<{
    id: number;
    sets?: Array<{ reps?: number; weight?: string | number | null }>;
    setsCount?: number;
    reps?: number;
  }>;
}

// Single source of truth for workout data
let currentWorkoutData: CachedSession | null = null;
let launchPreset: LaunchPreset | null = null;

export const setLaunchPreset = (preset: LaunchPreset) => {
  launchPreset = preset;
};

export const getLaunchPreset = (): LaunchPreset | null => {
  // Do NOT consume on read. Keep it until we finish/cancel the workout,
  // because React 18 dev double-mount can cause an immediate unmount/remount.
  return launchPreset;
};

export const setPrewarmedWorkout = (data: CachedSession) => {
  currentWorkoutData = data;
  log("[Workout] Data ready", `${data.exercises.length} exercises`);
};

export const getPrewarmedWorkout = (): CachedSession | null => {
  return currentWorkoutData;
};

export const clearWorkoutData = () => {
  currentWorkoutData = null;
  launchPreset = null;
};