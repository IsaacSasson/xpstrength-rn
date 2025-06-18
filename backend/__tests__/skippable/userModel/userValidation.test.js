import User from "../../../models/user.model.js";

describe("User model validation", () => {
    it("should not allow bad words in username", async () => {
        await expect(User.create({
            username: "fuck",
            password: "Good123!",
            email: "badword@example.com"
        })).rejects.toThrow(/Username contains inappropriate language/);
    });

    it("should fail on weak password", async () => {
        await expect(User.create({
            username: "cleanuser",
            password: "weakpass",
            email: "weak@example.com"
        })).rejects.toThrow();
    });

    it("Forces Password", async () => {
        await expect(User.create({
            username: "cleanuser",
            email: "weak@example.com"
        })).rejects.toThrow();
    });

    it("Forces Email", async () => {
        await expect(User.create({
            username: "cleanuser",
            password: "StrongPass1!",
        })).rejects.toThrow();
    });

    it("Forces Username", async () => {
        await expect(User.create({
            password: "StrongPass1!",
            email: "weak@example.com"
        })).rejects.toThrow();
    });


    it("should reject duplicate shopUnlocks", async () => {
        await expect(User.create({
            username: "shopuser",
            password: "StrongPass1!",
            email: "shop@example.com",
            shopUnlocks: [1, 1]
        })).rejects.toThrow(/Shop ID is duplicated in array/);
    });

    it("should reject invalid shop IDs", async () => {
        await expect(User.create({
            username: "shopeuser",
            password: "StrongPass1!",
            email: "shop@example.com",
            shopUnlocks: [0, 1, 2, 100]
        })).rejects.toThrow(/Shop item ID not found in global reference/)
    });

    it("should reject IDs that are not numbers", async () => {
        await expect(User.create({
            username: "shopeuser",
            password: "StrongPass1!",
            email: "shop@example.com",
            shopUnlocks: [1, "1", "2", 3]
        })).rejects.toThrow(/Shop item ID is not a number/)
    })
});
