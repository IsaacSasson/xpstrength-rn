import User from "../../models/user.model.js";
import WorkoutLog from "../../models/workoutLog.model.js";
import exercises from "../../../shared/exercises.json" with { type: "json" };

describe.skip("WorkoutLog validation checks", () => {

    const makeUser = async () =>
        await User.create({
            username: "logUser",
            password: "StrongPass12!",
            email: "logUser@example.com",
        });

    const validExercises = [
        { exercise: 1, reps: 12, sets: 3, cooldown: 60 },
        { exercise: 2, reps: 10, sets: 4, cooldown: 90 },
    ];

    it("rejects a WorkoutLog when an exercise ID is outside the allowed range", async () => {
        const user = await User.create({
            username: `_${Date.now()}`,
            password: "StrongPass12!",
            email: `log_${Date.now()}@mail.com`
        });

        const badId = exercises.length + 1;
        await expect(
            WorkoutLog.create({
                userId: user.id,
                length: 25,
                exercises: [
                    { exercise: badId, reps: 10, sets: 3, cooldown: 60 }
                ]
            })
        ).rejects.toThrow();

        await user.destroy();
    });

    it("rejects when length is not numeric", async () => {
        const user = await makeUser();

        await expect(
            WorkoutLog.create({
                userId: user.id,
                length: "not-a-number",
                exercises: validExercises,
            })
        ).rejects.toThrow();

        await user.destroy();
    });


    it("rejects when exercises is not an array", async () => {
        const user = await makeUser();

        await expect(
            WorkoutLog.create({
                userId: user.id,
                length: 45,
                exercises: { exercise: 1, reps: 10, sets: 3, cooldown: 60 },
            })
        ).rejects.toThrow();

        await user.destroy();
    });


    it("rejects when an exercise object is missing a required key", async () => {
        const user = await makeUser();
        const missingKey = [{ exercise: 1, reps: 10, cooldown: 60 }]; // no “sets”

        await expect(
            WorkoutLog.create({
                userId: user.id,
                length: 30,
                exercises: missingKey,
            })
        ).rejects.toThrow();

        await user.destroy();
    });

    it("rejects when an exercise object has a wrong value type", async () => {
        const user = await makeUser();
        const wrongType = [{ exercise: "benchPress", reps: 10, sets: 3, cooldown: 60 }];

        await expect(
            WorkoutLog.create({
                userId: user.id,
                length: 60,
                exercises: wrongType,
            })
        ).rejects.toThrow();

        await user.destroy();
    });

    it("successfully saves a valid workout log", async () => {
        const user = await makeUser();

        const log = await WorkoutLog.create({
            userId: user.id,
            length: 75,
            exercises: validExercises,
        });

        expect(log).toHaveProperty("id");
        expect(log.length).toBe(75);
        expect(log.exercises).toHaveLength(2);

        await user.destroy();
    });
});
