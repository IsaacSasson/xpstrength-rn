import { sequelize } from "../../config/db.config.js";
import User from "../../models/user.model.js";
import WorkoutLog from "../../models/workoutLog.model.js";
import PersonalBest from "../../models/personalBests.model.js";

describe.skip("PersonalBest – validation when updating the auto-created row", () => {
    const makeUser = async () =>
        await User.create({
            username: `_${Date.now()}`,
            password: "StrongPass12!",
            email: `pb_${Date.now()}@mail.com`,
        });

    const createWorkoutLog = async user =>
        await WorkoutLog.create({
            userId: user.id,
            length: 20,
            exercises: [{ exercise: 0, reps: 10, sets: 3, cooldown: 60 }],
        });

    const findPersonalBest = async user =>
        await PersonalBest.findOne({ where: { userId: user.id } });

    const chest = id => [{ exercise: 0, workoutId: id }];

    beforeAll(async () => {
        await sequelize.sync({ force: true });
    });

    afterAll(async () => {
        await sequelize.close();
    });

    it("rejects when workoutId belongs to another user", async () => {
        const userA = await makeUser();
        const userB = await makeUser();

        const logA = await createWorkoutLog(userA);
        const logB = await createWorkoutLog(userB);

        const pbA = await findPersonalBest(userA);

        await expect(
            pbA.update({ chest: chest(logB.id) })
        ).rejects.toThrow();

        await userA.destroy();
        await userB.destroy();
    });

    it("rejects when chest is not an array", async () => {
        const user = await makeUser();
        await createWorkoutLog(user);
        const pb = await findPersonalBest(user);

        await expect(
            pb.update({ chest: { exercise: 0, workoutId: 999 } })
        ).rejects.toThrow();

        await user.destroy();
    });

    it("rejects when an item is missing a required key", async () => {
        const user = await makeUser();
        await createWorkoutLog(user);
        const pb = await findPersonalBest(user);

        const missing = [{ exercise: 1 }];

        await expect(
            pb.update({ chest: missing })
        ).rejects.toThrow();

        await user.destroy();
    });

    it("rejects when an item has the wrong value type", async () => {
        const user = await makeUser();
        const log = await createWorkoutLog(user);
        const pb = await findPersonalBest(user);

        const wrong = [{ exercise: "benchPress", workoutId: log.id }];

        await expect(
            pb.update({ chest: wrong })
        ).rejects.toThrow();

        await user.destroy();
    });

    it("successfully updates with a valid personal-best record", async () => {
        const user = await makeUser();
        const log = await createWorkoutLog(user);
        const pb = await findPersonalBest(user);

        const updated = await pb.update({ chest: chest(log.id) });

        expect(updated.chest).toHaveLength(1);
        expect(updated.chest[0].workoutId).toBe(log.id);

        await user.destroy();
    });

    it("rejects a manual attempt to create a second PersonalBest row", async () => {
        const user = await makeUser();

        await expect(
            PersonalBest.create({ userId: user.id })
        ).rejects.toThrow();

        await user.destroy();
    });
});
