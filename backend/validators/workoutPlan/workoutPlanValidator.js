import CustomWorkout from "../../models/customWorkout.model.js";

export async function workoutPlanValidator(plan) {
  if (!Array.isArray(plan)) {
    throw new Error("Workout plan is not an array");
  }

  if (plan.length !== 7) {
    throw new Error("Workout plan is not 7 indecises long");
  }

  for (const [index, element] of plan.entries()) {
    if (
      !Number.isInteger(element) ||
      !Number.isFinite(element) ||
      Number.isNaN(element)
    ) {
      throw new Error("Element type is not a proper Integer");
    }

    if (element == -1) {
      continue;
    }

    const plannedWorkout = await CustomWorkout.findOne({
      where: { id: element, userId: this.userId },
    });
    if (!plannedWorkout) {
      throw new Error(
        "Custom Workout does not exist in users planned workouts."
      );
    }
  }
}
