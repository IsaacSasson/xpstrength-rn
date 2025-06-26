import { sequelize } from "../../config/db.config.js";
import User from "../../models/user.model.js";
import CustomWorkout from "../../models/customWorkout.model.js";
import WorkoutPlan from "../../models/workoutPlan.model.js";

describe("WorkoutPlan model – validator coverage (user-hook scenario)", () => {
    let userA, userB, customA;

    /* --------------------------------------------------------------- */
    /*  Bootstrap / teardown                                           */
    /* --------------------------------------------------------------- */
    beforeAll(async () => {
        await sequelize.sync({ force: true });

        // Create two users – the user-creation hook should also create WorkoutPlan rows
        userA = await User.create({
            username: `userA_${Date.now()}`,
            password: "StrongPass12!",
            email: `a_${Date.now()}@mail.com`,
        });

        userB = await User.create({
            username: `userB_${Date.now()}`,
            password: "StrongPass12!",
            email: `b_${Date.now()}@mail.com`,
        });

        // Custom workout owned by userA
        customA = await CustomWorkout.create({
            userId: userA.id,
            name: "Chest Blast",
            exercises: [{ exercise: 1, sets: 3, reps: 4, cooldown: 9 }],
        });
    });

    afterAll(async () => {
        await userA.destroy();
        await userB.destroy();
        await sequelize.close();
    });

    const updatePlan = async newPlan => {
        const planRow = await WorkoutPlan.findOne({ where: { userId: userA.id } });
        return planRow.update({ plan: newPlan });
    };

    /* --------------------------------------------------------------- */
    /*  Sanity check: row really exists & defaults are intact          */
    /* --------------------------------------------------------------- */
    it("creates a WorkoutPlan row with default [-1 …] when the user is formed", async () => {
        const planRow = await WorkoutPlan.findOne({ where: { userId: userA.id } });

        expect(planRow).toBeDefined();
        expect(planRow.plan).toEqual([-1, -1, -1, -1, -1, -1, -1]);
    });

    /* --------------------------------------------------------------- */
    /*  Happy-path update                                              */
    /* --------------------------------------------------------------- */
    it("accepts updating to a plan referencing an existing CustomWorkout (same user)", async () => {
        const valid = [customA.id, -1, -1, -1, -1, -1, -1];
        const planRow = await updatePlan(valid);
        expect(planRow.plan).toEqual(valid);
    });

    /* --------------------------------------------------------------- */
    /*  Negative-path updates                                          */
    /* --------------------------------------------------------------- */
    it("rejects an update when the plan is *not* an array", async () => {
        await expect(updatePlan("not-array")).rejects.toThrow(/Workout plan is not an array/i);
    });

    it("rejects an update when the plan length ≠ 7", async () => {
        await expect(updatePlan([-1, -1])).rejects.toThrow(/Workout plan is not 7 indecises long/i);
    });

    it("rejects an update containing a non-integer value", async () => {
        await expect(updatePlan([1.5, -1, -1, -1, -1, -1, -1])).rejects.toThrow(
            /Element type is not a proper Integer/i
        );
    });

    it("rejects an update containing NaN", async () => {
        await expect(updatePlan([NaN, -1, -1, -1, -1, -1, -1])).rejects.toThrow(
            /Element type is not a proper Integer/i
        );
    });

    it("rejects an update referencing a workout ID that does *not* exist", async () => {
        await expect(updatePlan([9999, -1, -1, -1, -1, -1, -1])).rejects.toThrow(
            /Planned Workout does not exist/i
        );
    });

    it("rejects an update referencing a workout that belongs to *another* user", async () => {
        // Workout for userB, so userA shouldn't be allowed to reference it
        const foreign = await CustomWorkout.create({
            userId: userB.id,
            name: "Leg Day",
            exercises: [{ exercise: 1, sets: 3, reps: 4, cooldown: 9 }],
        });

        await expect(updatePlan([foreign.id, -1, -1, -1, -1, -1, -1])).rejects.toThrow(
            /Planned Workout does not exist/i
        );
    });
});
