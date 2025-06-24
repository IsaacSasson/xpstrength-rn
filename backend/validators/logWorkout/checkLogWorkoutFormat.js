import exercises from "../../../shared/exercises.json" with { type: "json"};

export async function checkLogWorkoutFormat(value) {
    if (!Array.isArray(value)) {
        throw new Error("Value stored is not an array");
    }
    const REQUIRED = {
        exercise: 'number',
        reps: 'number',
        sets: 'number',
        cooldown: 'number'
    };

    value.forEach((obj, idx) => {
        for (const [key, type] of Object.entries(REQUIRED)) {
            if (!(key in obj))
                throw new Error(`Item ${idx}: missing “${key}” key`);

            if (typeof obj[key] !== type || !Number.isFinite(obj[key]))
                throw new Error(`Item ${idx}: “${key}” must be a finite ${type}`);
        }
        if (obj.exercise < 0 || obj.exercise > exercises.length - 1) {
            throw new Error('Unknown Exercise ID');
        }
    })
}