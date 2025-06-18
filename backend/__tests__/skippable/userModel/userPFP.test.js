import User from "../../../models/user.model.js";
import fs from "fs/promises";

describe("Profile picture validation", () => {
    it("should reject code disguised as image", async () => {

        const maliciousBuffer = Buffer.concat([
            Buffer.from([0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A]), // PNG magic bytes
            Buffer.from("<?php DROP TABLE Users; ?>")
        ]);

        await expect(User.create({
            username: "maliciousUser",
            password: "StrongPass1!",
            email: "malicious@example.com",
            profilePic: maliciousBuffer
        })).rejects.toThrow(/Invalid image uploaded/);
    });
});

describe("Profile picture saved", () => {
    it("should save profile picture", async () => {

        const safeBuffer = await fs.readFile("./__tests__/Images/goodPFP.jpg");

        const user = await User.create({
            username: "safeUser",
            password: "StrongPass1!",
            email: "safeUser@example.com",
            profilePic: safeBuffer
        });

        expect(user.profilePic).toBeDefined();

        user.destroy();

    });
});
