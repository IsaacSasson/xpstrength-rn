import { Event, User } from '../../models/index.js';
import eventsTypes from '../../../shared/events.json' with { type: 'json' };

describe.skip('Event model', () => {

    const createUser = (username = `u_${Date.now()}`) =>
        User.create({
            username,
            password: 'StrongPass!1',
            email: `${username}@mail.com`,
        });

    it('inserts a valid event row', async () => {
        const user = await createUser();
        const actor = await createUser();

        const row = await Event.create({
            userId: user.id,
            type: eventsTypes[0],
            actorId: actor.id,
            resourceId: 123,
            payload: { foo: 'bar' },
        });

        expect(row.id).toBeDefined();
        expect(row.type).toBe(eventsTypes[0]);
        expect(row.seenAt).toBeNull();

        await user.destroy();
        await actor.destroy();
    });

    it('rejects an invalid "type"', async () => {
        const user = await createUser();

        await expect(
            Event.create({
                userId: user.id,
                type: 'not-in-enum',
                actorId: null,
                resourceId: 1,
            })
        ).rejects.toThrow();

        await user.destroy();
    });

    it('markSeen updates correct rows only', async () => {
        const user = await createUser();

        const a = await Event.create({ userId: user.id, type: eventsTypes[0], resourceId: 1 });
        const b = await Event.create({ userId: user.id, type: eventsTypes[1], resourceId: 2 });

        await Event.markSeen(user.id, a.id);

        await a.reload();
        await b.reload();

        expect(a.seenAt).not.toBeNull();
        expect(b.seenAt).toBeNull();

        await user.destroy();
    });

    it('FK cascade & SET NULL work as expected', async () => {
        const owner = await createUser();
        const actor = await createUser();

        const evt = await Event.create({
            userId: owner.id,
            type: eventsTypes[0],
            actorId: actor.id,
            resourceId: 5,
        });

        await owner.destroy();
        const stillThere = await Event.findByPk(evt.id);
        expect(stillThere).toBeNull();

        await actor.destroy()

        const owner2 = await createUser();
        const actor2 = await createUser();
        const evt2 = await Event.create({
            userId: owner2.id,
            type: eventsTypes[1],
            actorId: actor2.id,
            resourceId: 6,
        });

        await actor2.destroy();
        await evt2.reload();
        expect(evt2.actorId).toBeNull();

        await owner2.destroy();
    });
});
