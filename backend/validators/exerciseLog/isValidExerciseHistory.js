import exercises from "../../../shared/exercises.json" with { type: "json" };

/**
 * Validate an exercise-history object with sets array shape.
 *
 * Expected shape:
 * {
 *   "<exerciseId>": {
 *     cooldown: Number (≥ 0),
 *     notes: String (1-500 chars),
 *     sets: [
 *       { reps: Number (≥ 0), weight: Number (≥ 0) },
 *       ...
 *     ]  // must contain at least one set
 *   },
 *   ...
 * }
 */
export function isValidExerciseHistory(value) {
  // ---------- top-level ----------
  if (value === null || typeof value !== "object" || Array.isArray(value)) {
    throw new Error("Exercise history must be an object keyed by exercise IDs");
  }

  Object.entries(value).forEach(([idStr, log]) => {
    // Validate ID
    const id = Number(idStr);
    if (!Number.isInteger(id)) {
      throw new Error(`Key “${idStr}” is not a valid integer exercise ID`);
    }
    if (id < 0 || id >= exercises.length) {
      throw new Error(`Exercise ID ${id} does not exist in known store`);
    }

    // Validate log object
    if (log === null || typeof log !== "object" || Array.isArray(log)) {
      throw new Error(`Log for exercise ${id} must be an object`);
    }

    // Required keys
    const requiredKeys = ["cooldown", "notes", "sets"];
    requiredKeys.forEach((k) => {
      if (!(k in log)) {
        throw new Error(`Exercise ${id}: missing “${k}” field`);
      }
    });

    // Cooldown check
    if (typeof log.cooldown !== "number" || !Number.isFinite(log.cooldown) || log.cooldown < 0) {
      throw new Error(`Exercise ${id}: “cooldown” must be a non-negative number`);
    }

    // Notes check
    if (typeof log.notes !== "string") {
      throw new Error(`Exercise ${id}: “notes” must be a string`);
    }
    if (log.notes.length === 0 || log.notes.length > 500) {
      throw new Error(`Exercise ${id}: “notes” must be 1–500 characters long`);
    }

    // Sets array check
    if (!Array.isArray(log.sets) || log.sets.length === 0) {
      throw new Error(`Exercise ${id}: “sets” must be a non-empty array`);
    }

    log.sets.forEach((setObj, setIdx) => {
      if (setObj === null || typeof setObj !== "object" || Array.isArray(setObj)) {
        throw new Error(`Exercise ${id}, set ${setIdx}: must be an object`);
      }
      const setKeys = ["reps", "weight"];
      setKeys.forEach((k) => {
        if (!(k in setObj)) {
          throw new Error(`Exercise ${id}, set ${setIdx}: missing “${k}”`);
        }
        const v = setObj[k];
        if (typeof v !== "number" || !Number.isFinite(v) || v < 0) {
          throw new Error(`Exercise ${id}, set ${setIdx}: “${k}” must be a non-negative number`);
        }
      });
    });
  });
}
