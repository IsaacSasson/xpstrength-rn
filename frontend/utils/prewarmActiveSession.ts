// Path: /utils/prewarmActiveSession.ts
import { makeCacheKey, readCachedSession, writeCachedSession } from "@/utils/activeWorkoutCache";
import { setPrewarmedWorkout } from "@/utils/workoutLaunch";
import type { UnitSystem } from "@/context/WorkoutContext";
import { log } from "@/utils/devLog";

interface PrewarmParams {
  launchPreset: {
    name?: string;
    workoutId: number;
    exercises: Array<{
      id: number;
      sets?: Array<{ reps?: number; weight?: string | number | null }>;
      setsCount?: number;
      reps?: number;
    }>;
  };
  unitSystem: UnitSystem;
  getExerciseMeta: (id: number | string) => any | undefined;
  parseWeight: (s: string) => { value: number; unit: UnitSystem };
  convertWeight: (value: number, from: UnitSystem, to: UnitSystem) => number;
}

export async function prewarmActiveSession(params: PrewarmParams): Promise<void> {
  const { launchPreset, unitSystem, getExerciseMeta, parseWeight, convertWeight } = params;
  
  if (!launchPreset?.exercises?.length) return;

  try {
    // Generate single cache key
    const exerciseIds = launchPreset.exercises.map(ex => ex.id);
    const cacheKey = makeCacheKey(launchPreset.workoutId, unitSystem, exerciseIds);
    
    // Try cache first
    const cached = await readCachedSession(cacheKey);
    if (cached?.exercises?.length) {
      setPrewarmedWorkout(cached);
      return;
    }

    log("[Workout] Building", `${exerciseIds.length} exercises`);

    // Build workout data
    const exercises = launchPreset.exercises.map((ex, i) => {
      const meta = getExerciseMeta(ex.id);
      const name = meta?.name || `Exercise ${ex.id}`;

      let sets: Array<{ id: number; reps: number; lbs: number; checked: boolean }>;

      if (Array.isArray(ex.sets) && ex.sets.length > 0) {
        sets = ex.sets.map((s, j) => {
          const reps = Number(s?.reps) || 0;
          let lbs = 0;
          
          if (s?.weight != null) {
            const parsed = parseWeight(String(s.weight));
            lbs = convertWeight(parsed.value, parsed.unit, unitSystem);
          }
          
          return { id: j + 1, reps, lbs, checked: false };
        });
      } else {
        const count = ex.setsCount || 3;
        const defaultReps = ex.reps || 10;
        sets = Array.from({ length: count }, (_, j) => ({
          id: j + 1,
          reps: defaultReps,
          lbs: 0,
          checked: false,
        }));
      }

      return {
        id: ex.id,
        name,
        images: meta?.images || [],
        primaryMuscles: meta?.primaryMuscles || [],
        secondaryMuscles: meta?.secondaryMuscles || [],
        sets,
        notes: "",
      };
    });

    const workoutData = {
      title: launchPreset.name || "Workout",
      exercises,
    };

    // Cache for future use (async, don't wait)
    writeCachedSession(cacheKey, workoutData);
    
    // Set immediately for current use
    setPrewarmedWorkout(workoutData);
    
  } catch (error) {
    log("[Workout] Prewarm failed", error);
  }
}