import { Auth, User } from '../../models/index.js';

describe.skip('Auth model', () => {

    const createUser = (username = `u_${Date.now()}`) =>
        User.create({
            username,
            password: 'StrongPass!1',
            email: `${username}@mail.com`,
        });

    it('defaults to unauthorized = false', async () => {
        const user = await createUser();

        const authRow = await Auth.findOne({ where: { userId: user.id } });
        expect(authRow).not.toBeNull();
        expect(authRow.authorized).toBe(false);

        await user.destroy();
    });

    it('authorize() sets authorized = true', async () => {
        const user = await createUser();

        await Auth.authorize(user.id);
        const updated = await Auth.findOne({ where: { userId: user.id } });
        expect(updated.authorized).toBe(true);

        await user.destroy();
    });

    it('unauthorize() sets authorized = false', async () => {
        const user = await createUser();

        await Auth.authorize(user.id);
        await Auth.unauthorize(user.id);
        const updated = await Auth.findOne({ where: { userId: user.id } });
        expect(updated.authorized).toBe(false);

        await user.destroy();
    });

    it('rejects duplicate Auth rows per user', async () => {
        const user = await createUser();

        await expect(
            Auth.create({ userId: user.id })
        ).rejects.toThrow();

        await user.destroy();
    });

    it('is deleted when the user is deleted (CASCADE)', async () => {
        const user = await createUser();
        const authRow = await Auth.findOne({ where: { userId: user.id } });
        expect(authRow).not.toBeNull();

        await user.destroy();

        const shouldBeGone = await Auth.findOne({ where: { userId: user.id } });
        expect(shouldBeGone).toBeNull();
    });
});
