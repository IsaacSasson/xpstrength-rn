export async function statsValidator(object) {

    if (object === null || typeof object !== "object" || Array.isArray(object)) {
        throw new Error("Stats must be a plain object.");
    }
    const REQUIRED = ["sets", "reps", "volume"];

    for (const key of REQUIRED) {
        if (!(key in object)) throw new Error(`Missing property: ${key}`);
    }

    for (const key of Object.keys(object)) {
        if (!REQUIRED.includes(key)) {
            throw new Error(`Unexpected property: ${key}`);
        }
    }

    for (const key of REQUIRED) {
        const value = object[key];

        if (!Number.isInteger(value) || value < 0) {
            throw new Error(`${key} must be a positive integer (received: ${value})`);
        }
    }

    return object;
}
