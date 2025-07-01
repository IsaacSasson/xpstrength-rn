import { sequelize } from '../../config/db.config.js';
import User from '../../models/user.model.js';
import Stats from '../../models/stats.model.js';

const makeUser = async () =>
    User.create({
        username: `u_${Date.now()}`,
        password: 'StrongPass12!',
        email: `stats_${Date.now()}@mail.com`,
    });

const GOOD = { sets: 1, reps: 1, volume: 1 };

describe.skip('Stats – validator & auto-create behaviour', () => {

    beforeAll(async () => {
        await sequelize.sync({ force: true });
    });

    afterAll(async () => {
        await sequelize.close();
    });

    it('creates a Stats row automatically when a User is created', async () => {
        const user = await makeUser();
        const stats = await Stats.findOne({ where: { userId: user.id } });

        expect(stats).not.toBeNull();
        await user.destroy();
    });

    it('rejects an attempt to create a second Stats row for the same user', async () => {
        const user = await makeUser();

        await expect(
            Stats.create({
                userId: user.id, total: GOOD, chest: GOOD, core: GOOD, back: GOOD,
                shoulders: GOOD, triceps: GOOD, biceps: GOOD, legs: GOOD
            })
        ).rejects.toThrow();

        await user.destroy();
    });

    describe('update() re-validates the JSON payloads', () => {
        let user, stats;
        beforeEach(async () => {
            user = await makeUser();
            stats = await Stats.findOne({ where: { userId: user.id } });
        });
        afterEach(async () => {
            await user.destroy();
        });

        it('rejects when an unexpected key is present', async () => {
            await expect(
                stats.update({ total: { ...GOOD, foo: 99 } })
            ).rejects.toThrow();
        });

        it('rejects when a required key is missing', async () => {
            await expect(
                stats.update({ total: { sets: 5, reps: 5 } })
            ).rejects.toThrow();
        });

        it('rejects when a value is negative or not an integer', async () => {
            await expect(
                stats.update({ total: { sets: -1, reps: 10, volume: 50 } })
            ).rejects.toThrow();

            await expect(
                stats.update({ total: { sets: 2, reps: 10.5, volume: 40 } })
            ).rejects.toThrow();
        });

        it('accepts zeros as valid values', async () => {
            const zeroed = { sets: 0, reps: 0, volume: 0 };
            const updated = await stats.update({ total: zeroed });
            expect(updated.total).toEqual(zeroed);
        });

        it('accepts a legitimate non-zero update', async () => {
            const updated = await stats.update({ total: { sets: 4, reps: 8, volume: 320 } });
            expect(updated.total.reps).toBe(8);
        });
    });
});
