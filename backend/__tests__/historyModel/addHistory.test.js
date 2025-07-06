import { User, History } from "../../models";
import AddHistory from "../../utils/AddHistory";
import AppError from "../../utils/AppError";

//JestSetup
import { assertDatabaseConnected, closeDatabase } from '../../config/db.config.js';

beforeAll(() => assertDatabaseConnected());
afterAll(() => closeDatabase());


describe("add History Test Suite", () => {

    it("Creates a properly formated history", async () => {
        const t = await sequelize.transaction();

        try {
            const user = await User.create({
                username: "Frank",
                password: "StrongPass!1",
                email: "StrongPass@gmail.com"
            },
                { transaction: t });

            const Action = new AddHistory("AUTH", `New user registered for ${user.username}`, user.id, null)

            await Action.log(t)

            await t.commit()

            const test = await History.findOne({
                where: {
                    userId: user.id
                }
            })

            const message = test.action;

            console.log(message);

            await user.destroy();
        }
        catch (err) {

            t.rollback();
            throw new Error(err);
        }

    });


    it("Fails with bad type", async () => {
        expect(() => { new AddHistory("bad-type", `New user registered for a`, 1, null) }).toThrow(AppError);
    })


    it("Fails with bad userId", async () => {


        const user = await User.create({
            username: "Frank",
            password: "StrongPass!1",
            email: "StrongPass@gmail.com"
        });

        const Action = new AddHistory("AUTH", `New user registered for ${user.username}`, -1, null)

        expect(await Action.log()).toThrow();

        await user.destroy();
    })
})