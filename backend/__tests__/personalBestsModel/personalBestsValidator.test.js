import { sequelize } from '../../config/db.config.js';
import User from '../../models/user.model.js';
import WorkoutLog from '../../models/workoutLog.model.js';
import PersonalBest from '../../models/personalBests.model.js';

/** Creates a fresh user */
const makeUser = async () =>
    User.create({
        username: `u_${Date.now()}`,
        password: 'StrongPass12!',
        email: `pb_${Date.now()}@mail.com`,
    });

const createWorkoutLog = async user =>
    WorkoutLog.create({
        userId: user.id,
        length: 20,
        exercises: [{ exercise: 0, reps: 10, sets: 3, cooldown: 60 }],
    });

const findPersonalBest = user =>
    PersonalBest.findOne({ where: { userId: user.id } });

const makePbRecord = workoutId => [{ exercise: 0, workoutId }];


describe.skip('PersonalBest – validator', () => {
    beforeAll(async () => {
        await sequelize.sync({ force: true });
    });

    afterAll(async () => {
        await sequelize.close();
    });

    it('rejects when workoutId belongs to another user', async () => {
        const userA = await makeUser();
        const userB = await makeUser();

        const logA = await createWorkoutLog(userA);
        const logB = await createWorkoutLog(userB);

        const pbA = await findPersonalBest(userA);

        await expect(
            pbA.update({ personalBests: makePbRecord(logB.id) })
        ).rejects.toThrow();

        await userA.destroy();
        await userB.destroy();
    });

    it('rejects when personalBests is not an array', async () => {
        const user = await makeUser();
        await createWorkoutLog(user);
        const pb = await findPersonalBest(user);

        await expect(
            pb.update({ personalBests: { exercise: 0, workoutId: 123 } })
        ).rejects.toThrow();

        await user.destroy();
    });

    it('rejects when an item is missing a required key', async () => {
        const user = await makeUser();
        await createWorkoutLog(user);
        const pb = await findPersonalBest(user);

        const missingKey = [{ exercise: 1 }];

        await expect(
            pb.update({ personalBests: missingKey })
        ).rejects.toThrow();

        await user.destroy();
    });

    it('rejects when an item has the wrong value type', async () => {
        const user = await makeUser();
        const log = await createWorkoutLog(user);
        const pb = await findPersonalBest(user);

        const wrongType = [{ exercise: 'benchPress', workoutId: log.id }];

        await expect(
            pb.update({ personalBests: wrongType })
        ).rejects.toThrow();

        await user.destroy();
    });

    it('rejects when exercise id is out of range', async () => {
        const user = await makeUser();
        const log = await createWorkoutLog(user);
        const pb = await findPersonalBest(user);

        const outOfRange = [{ exercise: 9999, workoutId: log.id }];

        await expect(
            pb.update({ personalBests: outOfRange })
        ).rejects.toThrow();

        await user.destroy();
    });


    it('successfully updates with a valid personal-best record', async () => {
        const user = await makeUser();
        const log = await createWorkoutLog(user);
        const pb = await findPersonalBest(user);

        const updated = await pb.update({ personalBests: makePbRecord(log.id) });

        expect(updated.personalBests).toHaveLength(1);
        expect(updated.personalBests[0].workoutId).toBe(log.id);

        await user.destroy();
    });

    it('rejects a manual attempt to create a second PersonalBest row', async () => {
        const user = await makeUser();

        await expect(
            PersonalBest.create({ userId: user.id })
        ).rejects.toThrow();

        await user.destroy();
    });
});
