import { sequelize } from "../../config/db.config.js";
import User from "../../models/user.model.js";
import ExerciseLog from "../../models/exerciseLog.model.js";
import exercises from "../../../shared/exercises.json" with { type: "json" };

describe.skip("ExerciseLog – auto-creation & validation", () => {
    const makeUser = async () =>
        await User.create({
            username: `_${Date.now()}`,
            password: "StrongPass12!",
            email: `log_${Date.now()}@mail.com`,
        });

    const findLog = async user =>
        await ExerciseLog.findOne({ where: { userId: user.id } });

    const goodHistory = {
        1: { reps: 10, sets: 4, notes: "Felt strong" },
        2: { reps: 8, sets: 3, notes: "Drop-set last set" },
    };

    beforeAll(async () => {
        await sequelize.sync({ force: true });
    });

    afterAll(async () => {
        await sequelize.close();
    });

    it("auto-creates an empty ExerciseLog when a user is inserted", async () => {
        const user = await makeUser();

        const log = await findLog(user);
        expect(log).not.toBeNull();
        expect(log.exerciseHistory).toEqual({});

        await user.destroy();
    });

    it("rejects a manual attempt to create a *second* log for the same user", async () => {
        const user = await makeUser();

        await expect(
            ExerciseLog.create({ userId: user.id })
        ).rejects.toThrow();

        await user.destroy();
    });

    it("rejects an update when exerciseHistory is not an object", async () => {
        const user = await makeUser();
        const log = await findLog(user);

        await expect(
            log.update({ exerciseHistory: ["wrong", "type"] })
        ).rejects.toThrow();

        await user.destroy();
    });

    it("rejects an update when an exercise ID is not numeric", async () => {
        const user = await makeUser();
        const log = await findLog(user);

        const bad = { benchPress: { reps: 10, sets: 4, notes: "oops" } };

        await expect(
            log.update({ exerciseHistory: bad })
        ).rejects.toThrow();

        await user.destroy();
    });

    it("rejects an update when an exercise ID is out of range", async () => {
        const user = await makeUser();
        const log = await findLog(user);

        const badId = exercises.length;
        const bad = { [badId]: { reps: 5, sets: 5, notes: "bad id" } };

        await expect(
            log.update({ exerciseHistory: bad })
        ).rejects.toThrow();

        await user.destroy();
    });

    it("rejects an update missing a required key", async () => {
        const user = await makeUser();
        const log = await findLog(user);

        const missing = { 1: { reps: 10, notes: "no sets key" } };

        await expect(
            log.update({ exerciseHistory: missing })
        ).rejects.toThrow();

        await user.destroy();
    });

    it("rejects an update where notes exceed 500 characters", async () => {
        const user = await makeUser();
        const log = await findLog(user);

        const long = "x".repeat(501);
        const bad = { 2: { reps: 8, sets: 3, notes: long } };

        await expect(
            log.update({ exerciseHistory: bad })
        ).rejects.toThrow();

        await user.destroy();
    });

    it("successfully updates with a valid exercise history", async () => {
        const user = await makeUser();
        const log = await findLog(user);

        const updated = await log.update({ exerciseHistory: goodHistory });
        expect(Object.keys(updated.exerciseHistory)).toHaveLength(2);

        await user.destroy();
    });
});
