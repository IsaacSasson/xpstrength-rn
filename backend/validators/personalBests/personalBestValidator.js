import WorkoutLog from '../../models/workoutLog.model.js'

export async function personalBestValidator(value) {
    if (!Array.isArray(value)) {
        throw new Error("personalBestRecord is not an array");
    }

    const REQUIRED = {
        exercise: 'number',
        workoutId: 'number'
    };

    for (const [idx, obj] of value.entries()) {
        for (const [key, type] of Object.entries(REQUIRED)) {
            if (!(key in obj))
                throw new Error(`Item ${idx}: missing “${key}” key`);

            if (typeof obj[key] !== type || !Number.isFinite(obj[key]))
                throw new Error(`Item ${idx}: “${key}” must be a finite ${type}`);
        }

        const userId = this.userId;
        const id = obj.workoutId
        const log = await WorkoutLog.findOne({ where: { id: id, userId: userId } });
        if (!log) {
            throw new Error("Unknown workoutLogID for this user")
        }
    }
}