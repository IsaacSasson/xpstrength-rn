import WorkoutLog from '../../models/workoutLog.model.js'
import exercises from '../../../shared/exercises.json' with { type: "json" };

export async function personalBestValidator(value) {
  // must be an object, not null or an array
  if (value === null || typeof value !== "object" || Array.isArray(value)) {
    throw new Error("personalBestRecord must be an object keyed by exercise Id.");
  }

  for (const [id, record] of Object.entries(value)) {
    // check that the key is an integer exercise index
    const exerciseId = Number(id);
    if (!Number.isInteger(exerciseId)) {
      throw new Error(`Exercise Id "${id}" is not an integer`);
    }
    if (exerciseId < 0 || exerciseId > exercises.length - 1) {
      throw new Error(`Exercise Id "${exerciseId}" does not exist in known store`);
    }

    // each record must be an object
    if (record === null || typeof record !== "object" || Array.isArray(record)) {
      throw new Error(`Record for exercise ${exerciseId} is not an object`);
    }

    // must have a finite numeric workoutId
    if (!("workoutId" in record)) {
      throw new Error(`Key "workoutId" is not in record for exercise ${exerciseId}`);
    }
    if (typeof record.workoutId !== "number" || !Number.isFinite(record.workoutId)) {
      throw new Error(`"workoutId" must be a finite number for exercise ${exerciseId}`);
    }

    // verify the workoutLog belongs to this user
    const userId = this.userId;
    const log = await WorkoutLog.findOne({
      where: { id: record.workoutId, userId }
    });
    if (!log) {
      throw new Error(`Unknown workoutLogID "${record.workoutId}" for this user`);
    }
  }
}
