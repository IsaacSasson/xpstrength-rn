import User from "../../models/user.model.js";
import WorkoutLog from "../../models/workoutLog.model.js";
import PersonalBest from "../../models/personalBests.model.js";

describe.skip("PersonalBest validation checks", () => {
    const makeUser = async () =>
        await User.create({
            username: `_${Date.now()}`,
            password: "StrongPass12!",
            email: `pb_${Date.now()}@mail.com`,
        });

    const makeValidChest = logId => [
        { exercise: 0, workoutId: logId }
    ];


    it("rejects when workoutId belongs to another user", async () => {
        const userA = await makeUser();
        const userB = await makeUser();

        const logOfB = await WorkoutLog.create({
            userId: userB.id,
            length: 20,
            exercises: [{ exercise: 0, reps: 10, sets: 3, cooldown: 60 }],
        });

        await expect(
            PersonalBest.create({
                userId: userA.id,
                chest: makeValidChest(logOfB.id),
            })
        ).rejects.toThrow("Unknown workoutLogID for this user");

        await userA.destroy();
        await userB.destroy();
    });

    it("rejects when the chest field is not an array", async () => {
        const user = await makeUser();

        await expect(
            PersonalBest.create({
                userId: user.id,
                chest: { exercise: 0, workoutId: 999 },
            })
        ).rejects.toThrow("personalBestRecord is not an array");

        await user.destroy();
    });

    it("rejects when an item is missing a required key", async () => {
        const user = await makeUser();

        const log = await WorkoutLog.create({
            userId: user.id,
            length: 15,
            exercises: [{ exercise: 1, reps: 8, sets: 3, cooldown: 45 }],
        });

        const missingKey = [{ exercise: 1 }];

        await expect(
            PersonalBest.create({
                userId: user.id,
                chest: missingKey,
            })
        ).rejects.toThrow(/missing.*workoutId/i);

        await user.destroy();
    });

    it("rejects when an item has a wrong value type", async () => {
        const user = await makeUser();

        const log = await WorkoutLog.create({
            userId: user.id,
            length: 10,
            exercises: [{ exercise: 2, reps: 6, sets: 4, cooldown: 30 }],
        });

        const wrongType = [{ exercise: "benchPress", workoutId: log.id }];

        await expect(
            PersonalBest.create({
                userId: user.id,
                chest: wrongType,
            })
        ).rejects.toThrow(/exercise.*must be a finite number/i);

        await user.destroy();
    });

    it("successfully saves a valid personal-best record", async () => {
        const user = await makeUser();

        const log = await WorkoutLog.create({
            userId: user.id,
            length: 25,
            exercises: [{ exercise: 3, reps: 12, sets: 4, cooldown: 60 }],
        });

        const pb = await PersonalBest.create({
            userId: user.id,
            chest: makeValidChest(log.id),
        });

        expect(pb).toHaveProperty("id");
        expect(pb.chest).toHaveLength(1);
        expect(pb.chest[0].workoutId).toBe(log.id);

        await user.destroy();
    });
});
