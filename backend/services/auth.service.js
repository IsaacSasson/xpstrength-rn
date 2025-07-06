import mapSequelizeError from '../utils/mapSequelizeError.js';
import AppError from '../utils/AppError.js';
import { User } from '../models/index.js';
import { sequelize } from '../config/db.config.js';
import AppHistory from '../utils/AddHistory.js'

export async function registerUser(input_information) {
    try {
        if (input_information === null || input_information === "") {
            throw new AppError("Failed to register with null user data", 400, "BAD_DATA");
        }
        const result = await sequelize.transaction(async t => {
            const user = await User.create(
                {
                    username: input_information.username,
                    password: input_information.password,
                    email: input_information.email,
                    profilePic: input_information.profilePic ?? null,
                    authority: "basic",
                    level: 0,
                    xp: 0,
                    totalFriends: 0,
                    totalWorkouts: 0,
                    totalTimeWorkedOut: 0,
                    totalCoins: 0,
                    shopUnlocks: []
                },
                { transaction: t }
            );

            const action = new AppHistory(
                "AUTH",
                `${user.username} registered for an account with id ${user.id}`,
                user.id,
                null
            );

            await action.log(t);
            return user;
        });

        return result;
    } catch (err) {
        throw mapSequelizeError(err);
    }
};

export async function loginUser(input_information) {
    return;
};

export async function refreshToken(input_information) {
    return;
};

export async function resetPassword(input_information) {
    return;
};

export async function forgotUsername(input_information) {
    return;
};


export default { registerUser, loginUser, refreshToken, refreshToken, resetPassword, forgotUsername }