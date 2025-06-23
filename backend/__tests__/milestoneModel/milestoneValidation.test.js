import User from "../../models/user.model.js";
import Milestone from "../../models/milestone.model.js";

describe.skip("Milestone Validation Checks", () => {
    it("Stops Duplicates", async () => {
        const user = await User.create({
            username: "testUser",
            password: "StrongPass12!",
            email: "test@gmail.com"
        });

        const milestoneData = await Milestone.findOne({ where: { userId: user.id } });

        milestoneData.milestones = [1, 2, 1];
        expect(milestoneData.save()).rejects.toThrow();

        await user.destroy();
    });

    it("Forces Ids to be a number", async () => {
        const user = await User.create({
            username: "testUser",
            password: "StrongPass12!",
            email: "test@gmail.com"
        });

        const milestoneData = await Milestone.findOne({ where: { userId: user.id } });

        milestoneData.milestones = [1, "2"];
        expect(milestoneData.save()).rejects.toThrow();

        await user.destroy();
    });

    it("Milestone must exist in global referecne", async () => {
        const user = await User.create({
            username: "testUser",
            password: "StrongPass12!",
            email: "test@gmail.com"
        });

        const milestoneData = await Milestone.findOne({ where: { userId: user.id } });

        milestoneData.milestones = [1, 10, -1];
        expect(milestoneData.save()).rejects.toThrow();

        await user.destroy();
    });

    it("Milestone succesfully updates", async () => {
        const user = await User.create({
            username: "testUser",
            password: "StrongPass12!",
            email: "test@gmail.com"
        });

        const milestoneData = await Milestone.findOne({ where: { userId: user.id } });

        milestoneData.milestones = [1, 2, 3];
        await expect(milestoneData.save())
            .resolves
            .toHaveProperty("milestones", [1, 2, 3]);

        await user.destroy();
    });
})