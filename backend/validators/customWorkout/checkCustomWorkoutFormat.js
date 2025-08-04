import exercises from "../../../shared/exercises.json" with { type: "json" };

/**
 * Validate an array of exercise objects that belong to a custom workout.
 *
 * Expected shape of each element:
 * {
 *   exercise: Number (0-based index into exercises.json)
 *   cooldown: Number (seconds, ≥ 0)
 *   sets: [
 *     { reps: Number (≥ 0), weight: Number (≥ 0) },
 *     ...
 *   ]   // must contain at least one set
 * }
 *
 * @param {any} value – the value to validate
 * @throws {Error} – if validation fails
 */
export function checkCustomWorkoutFormat(value) {
  /* 1. Top-level check */
  if (!Array.isArray(value)) {
    throw new Error("Value stored is not an array of exercises");
  }

  /* 2. Per-exercise checks */
  value.forEach((obj, idx) => {
    const requiredKeys = ["exercise", "cooldown", "sets"];

    // ----- shape & primitive fields -----
    requiredKeys.forEach((key) => {
      if (!(key in obj)) {
        throw new Error(`Item ${idx}: missing “${key}” key`);
      }
    });

    const { exercise: exId, cooldown, sets } = obj;

    if (typeof exId !== "number" || !Number.isFinite(exId)) {
      throw new Error(`Item ${idx}: “exercise” must be a finite number`);
    }
    if (exId < 0 || exId >= exercises.length) {
      throw new Error(`Item ${idx}: unknown exercise ID ${exId}`);
    }

    if (typeof cooldown !== "number" || !Number.isFinite(cooldown) || cooldown < 0) {
      throw new Error(`Item ${idx}: “cooldown” must be a non-negative number`);
    }

    // ----- sets array -----
    if (!Array.isArray(sets) || sets.length === 0) {
      throw new Error(`Item ${idx}: “sets” must be a non-empty array`);
    }

    sets.forEach((setObj, setIdx) => {
      const setKeys = ["reps", "weight"];

      setKeys.forEach((k) => {
        if (!(k in setObj)) {
          throw new Error(`Item ${idx}, set ${setIdx}: missing “${k}” key`);
        }
        const v = setObj[k];
        if (typeof v !== "number" || !Number.isFinite(v) || v < 0) {
          throw new Error(`Item ${idx}, set ${setIdx}: “${k}” must be a non-negative number`);
        }
      });
    });
  });
}
