import WorkoutLog from "../../models/workoutLog.model.js";
import exercises from "../../../shared/exercises.json" with { type: "json" };

export async function personalBestValidator(value) {
  if (value === null || typeof value !== "object" || Array.isArray(value)) {
    throw new Error(
      "personalBestRecord must be an object keyed by exercise ID"
    );
  }

  const userId = this.userId;

  for (const [key, workoutId] of Object.entries(value)) {
    const exerciseId = Number(key);

    if (!Number.isInteger(exerciseId)) {
      throw new Error(`Exercise ID "${key}" is not a valid integer`);
    }
    if (exerciseId < 0 || exerciseId >= exercises.length) {
      throw new Error(
        `Exercise ID ${exerciseId} does not exist in available exercises`
      );
    }

    if (typeof workoutId !== "number" || !Number.isFinite(workoutId)) {
      throw new Error(
        `Workout log ID for exercise ${exerciseId} must be a finite number`
      );
    }

    const log = await WorkoutLog.findOne({ where: { id: workoutId, userId } });
    if (!log) {
      throw new Error(`Unknown workoutLog ID ${workoutId} for this user`);
    }
  }
}
