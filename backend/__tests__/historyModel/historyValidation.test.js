import { sequelize } from '../../config/db.config.js';
import User from '../../models/user.model.js';
import History from '../../models/history.model.js';

const makeUser = async () =>
    User.create({
        username: `u_${Date.now()}`,
        password: 'StrongPass12!',
        email: `h_${Date.now()}@mail.com`,
    });

const GOOD_TEXT = 'Finished chest workout';

const BAD_TEXTS = [
    'ThisContainsABaaaaaaaaaaaaaaaaaFuckaaaadWord',
    'X'.repeat(120),
];

describe.skip('History – validator & cascade behaviour', () => {

    beforeAll(async () => {
        await sequelize.sync({ force: true });
    });

    afterAll(async () => {
        await sequelize.close();
    });

    it('creates successfully with clean text', async () => {
        const user = await makeUser();
        const record = await History.create({
            userId: user.id,
            action: GOOD_TEXT,
        });

        expect(record.id).toBeGreaterThan(0);
        expect(record.action).toBe(GOOD_TEXT);

        await user.destroy();
    });

    it(`rejects bad string`, async () => {
        for (let bad of BAD_TEXTS) {

            const user = await makeUser();

            await expect(
                History.create({ userId: user.id, action: bad })
            ).rejects.toThrow();

            await user.destroy();
        }
    });

    it('deletes History rows when the parent User is destroyed', async () => {
        const user = await makeUser();

        const h1 = await History.create({ userId: user.id, action: GOOD_TEXT });
        const h2 = await History.create({ userId: user.id, action: 'Logged out' });

        expect(await History.count({ where: { userId: user.id } })).toBe(2);

        await user.destroy();

        const leftovers = await History.count({ where: { userId: user.id } });
        expect(leftovers).toBe(0);
    });
});
