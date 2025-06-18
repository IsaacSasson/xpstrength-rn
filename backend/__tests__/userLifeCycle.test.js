import User from "../models/user.model.js";
import Friend from "../models/friend.model.js";
import Milestone from "../models/milestone.model.js";


describe("Checks user creation and deletion", () => {
    it("should delete Friend and Milestone when User is deleted", async () => {
        const user = await User.create({
            username: "cascadeuser",
            password: "StrongPass1!",
            email: "cascade@example.com"
        });

        const friend = await Friend.findOne({ where: { userId: user.id } });
        const milestone = await Milestone.findOne({ where: { userId: user.id } });

        expect(friend).toBeTruthy();
        expect(milestone).toBeTruthy();

        // Delete user
        await user.destroy();

        // Verify related rows gone
        const deletedFriend = await Friend.findOne({ where: { userId: user.id } });
        const deletedMilestone = await Milestone.findOne({ where: { userId: user.id } });

        expect(deletedFriend).toBeNull();
        expect(deletedMilestone).toBeNull();
    });
});
