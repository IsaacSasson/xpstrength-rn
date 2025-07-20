import exercises from '../../../shared/exercises.json' with {type: "json"};

export async function isValidExerciseHistory(value) {

    if (value === null || typeof value !== "object" || Array.isArray(value)) {
        throw new Error("Exercise history must be an object keyed by an exercise Id.")
    }

    const REQUIRED = {
        sets: "number",
        reps: "number",
        notes: "string",
        weight: "string"
    }
    for (const [id, log] of Object.entries(value)) {
        if (!Number.isInteger(Number(id))) {
            throw new Error("Exercise Id is not a number");
        }
        if (id < 0 || id > exercises.length - 1) {
            throw new Error("Exercise Id does not exist in known store");
        }

        if (log === null || typeof log !== "object" || Array.isArray(log)) {
            throw new Error(`Log for exercise ${id} is not an object`);
        }
        for (const [name, type] of Object.entries(REQUIRED)) {
            if (!(name in log)) {
                throw new Error(`Key of ${name} is not in log`);
            }
            if (typeof (log[name]) != type) {
                throw new Error(`Type of ${type} is not allowed for Key of ${name}`);
            }
            if (type === "number") {
                if (log[name] < 0) {
                    throw new Error("value can't be less than zero");
                }
            }
            else if (type === "string") {
                if (log[name].length < 1 || log[name].length > 500) {
                    throw new Error("notes cannot me larger than 500 characters or less than 0.")
                }
            }
        }
    }
}