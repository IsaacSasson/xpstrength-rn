import User from "../../models/user.model.js";
import Goal from "../../models/goal.model.js";
import forbiddenWords from "../../validations/forbiddenWords.js";
import goalTypes from "../../../shared/goal_types.json" with { type: "json" };

describe.skip("Goal Validation Checks", () => {
    it("Rejects forbidden words in the name field", async () => {
        const user = await User.create({
            username: "goalUser",
            password: "StrongPass12!",
            email: "goalUser@gmail.com",
        });

        const badName = `My ${forbiddenWords[0]} Goal`;

        await expect(
            Goal.create({
                userId: user.id,
                name: badName,
                type: goalTypes[0].type,
                total: 5,
                current: 0,
            })
        ).rejects.toThrow();

        await user.destroy();
    });

    it("Rejects an unknown goal type", async () => {
        const user = await User.create({
            username: "goalUser",
            password: "StrongPass12!",
            email: "goalUser@gmail.com",
        });

        await expect(
            Goal.create({
                userId: user.id,
                name: "ValidName",
                type: "unknownType",
                total: 5,
                current: 0,
            })
        ).rejects.toThrow();

        await user.destroy();
    });

    it("Rejects when current exceeds total (create)", async () => {
        const user = await User.create({
            username: "goalUser",
            password: "StrongPass12!",
            email: "goalUser@gmail.com",
        });

        await expect(
            Goal.create({
                userId: user.id,
                name: "ValidName",
                type: goalTypes[0].type,
                total: 3,
                current: 4,
            })
        ).rejects.toThrow();

        await user.destroy();
    });

    it("Rejects when current exceeds total (update)", async () => {
        const user = await User.create({
            username: "goalUser",
            password: "StrongPass12!",
            email: "goalUser@gmail.com",
        });

        const goal = await Goal.create({
            userId: user.id,
            name: "ValidName",
            type: goalTypes[0].type,
            total: 5,
            current: 2,
        });

        goal.current = 6;

        await expect(goal.save()).rejects.toThrow();

        await user.destroy();
    });

    it("Successfully saves with all valid fields", async () => {
        const user = await User.create({
            username: "goalUser",
            password: "StrongPass12!",
            email: "goalUser@gmail.com",
        });

        const goal = await Goal.create({
            userId: user.id,
            name: "Run 5 KM",
            type: goalTypes[0].type,
            total: 5,
            current: 0,
        });

        goal.current = 3;
        await expect(goal.save())
            .resolves
            .toHaveProperty("current", 3);

        await user.destroy();
    });
});
