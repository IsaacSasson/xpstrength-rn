import goalTypes from '../../../shared/goal_types.json' with { type: "json"};

export async function typeGoalCheck(value) {
    if (value && !goalTypes.some(obj => value === obj.type)) {
        throw new Error("Unknown goal type");
    }
}