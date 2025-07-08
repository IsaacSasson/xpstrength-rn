import { User, Friend } from '../models/index.js'
import { sequelize } from "../config/db.config.js";

export async function getFriendData(user) {
    if (!user) {
        throw new Error("User was not passed along to get Friend Data");
    }

    try {
        const userId = user.id
        const friendData = await sequelize.transaction(async (t) => {
            const friend = Friend.findOne({ where: { userId } });
            if (!friend) {
                throw new Error("associating friend row not found for this user ID");
            }
            return friend
        })

        return friendData;
    } catch (err) {
        throw new Error("Failed to properly get friend data")
    }
}