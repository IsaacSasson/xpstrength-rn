import User from "../../models/user.model.js";
import CustomWorkout from "../../models/customWorkout.model.js";
import forbiddenWords from "../../validators/general/forbiddenWords.js";
import exercises from "../../../shared/exercises.json" with { type: "json" };

describe.skip("CustomWorkout validation checks", () => {

    const makeUser = async () =>
        await User.create({
            username: "workoutUser",
            password: "StrongPass12!",
            email: "workoutUser@example.com",
        });

    const validExercises = [
        { exercise: 1, reps: 12, sets: 3, cooldown: 60 },
        { exercise: 2, reps: 10, sets: 4, cooldown: 90 },
    ];

    it("rejects a customWorkout that references an unknown exercise ID", async () => {
        const user = await User.create({
            username: `_${Date.now()}`,
            password: "StrongPass12!",
            email: `cw_${Date.now()}@mail.com`
        });

        const badId = -1;
        await expect(
            CustomWorkout.create({
                userId: user.id,
                name: "Bad Workout",
                exercises: [
                    { exercise: badId, reps: 8, sets: 4, cooldown: 45 }
                ]
            })
        ).rejects.toThrow();

        await user.destroy();
    });

    it("rejects forbidden words in the name field", async () => {
        const user = await makeUser();
        const badName = `My ${forbiddenWords[0]} workout`;

        await expect(
            CustomWorkout.create({
                userId: user.id,
                name: badName,
                exercises: validExercises,
            })
        ).rejects.toThrow();

        await user.destroy();
    });

    it("rejects when exercises is not an array", async () => {
        const user = await makeUser();

        await expect(
            CustomWorkout.create({
                userId: user.id,
                name: "Leg Day",
                exercises: "not-an-array",
            })
        ).rejects.toThrow();

        await user.destroy();
    });

    it("rejects when an exercise object is missing a required key", async () => {
        const user = await makeUser();
        const missingKey = [{ exercise: 1, reps: 10, cooldown: 60 }]; // no “sets”

        await expect(
            CustomWorkout.create({
                userId: user.id,
                name: "Push Day",
                exercises: missingKey,
            })
        ).rejects.toThrow();

        await user.destroy();
    });

    it("rejects when an exercise object has a wrong value type", async () => {
        const user = await makeUser();
        const wrongType = [{ exercise: "benchPress", reps: 10, sets: 3, cooldown: 60 }];

        await expect(
            CustomWorkout.create({
                userId: user.id,
                name: "Chest Blast",
                exercises: wrongType,
            })
        ).rejects.toThrow();

        await user.destroy();
    });

    it("successfully saves a valid custom workout", async () => {
        const user = await makeUser();

        const workout = await CustomWorkout.create({
            userId: user.id,
            name: "Upper Body Strength",
            exercises: validExercises,
        });

        // simple positive assertion
        expect(workout).toHaveProperty("id");
        expect(workout.exercises).toHaveLength(2);

        await user.destroy();
    });
});
