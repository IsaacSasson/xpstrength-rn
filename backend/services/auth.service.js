import mapSequelizeError from '../utils/mapSequelizeError.js';
import AppError from '../utils/AppError.js';
import { User, Auth } from '../models/index.js';
import { sequelize } from '../config/db.config.js';
import AppHistory from '../utils/AddHistory.js'
import bcrypt from "bcrypt";

import { generateRefreshToken, generateAuthToken, verifyRefreshToken } from '../utils/security.js';

//Registers new user to the DB
export async function registerUser(userInfo) {
    try {
        if (userInfo === null || userInfo === "" || Object.keys(userInfo).length === 0) {
            throw new AppError("Failed to register with null user data", 400, "BAD_DATA");
        }
        const result = await sequelize.transaction(async t => {
            const user = await User.create(
                {
                    username: userInfo.username,
                    password: userInfo.password,
                    email: userInfo.email,
                    profilePic: userInfo.profilePic ?? null,
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

        //get safe data to return
        const { password, ...safeResult } = result.get?.({ plain: true }) || result;

        return safeResult

    } catch (err) {
        throw mapSequelizeError(err);
    }
};

//Logs user in, gives user accessToken and refreshToken in http header
export async function loginUser(authData) {
    try {
        if (authData === null || authData === "" || Object.keys(authData).length === 0) {
            throw new AppError("Failed to register with null auth data", 400, "BAD_DATA");
        }

        const { username, password } = authData;

        if (!username || !password) {
            throw new AppError("password or username not provided", 400, "BAD_DATA")
        }

        const user = await User.findOne({ where: { username: username } });
        if (!user || !user.id) {
            throw new AppError("incorrect password or username", 401, "UNAUTHENTICATED");
        }


        const match = await bcrypt.compare(password, user.password);

        if (!match) {
            throw new AppError("incorrect password or username", 401, "UNAUTHENTICATED");
        }

        const refreshToken = await generateRefreshToken(user);
        const accessToken = await generateAuthToken(user);

        await sequelize.transaction(async t => {
            await Auth.authorize(user.id);

            const action = new AppHistory(
                "AUTH",
                `${user.username} loggedIn successfully for account with id ${user.id}`,
                user.id,
                null
            );

            await action.log(t);

            return
        });

        return { accessToken, refreshToken };
    } catch (err) {
        throw mapSequelizeError(err);
    }
};

//Users gets a new access token and
export async function accessToken(token, res) {
    try {
        const { user, payload } = await verifyRefreshToken(token);

        if (!user || !user.id) {
            throw new AppError("user not found", 404, "NOT_FOUND");
        }

        const authRow = await Auth.findOne({ where: { userId: user.id } });
        if (!authRow || !authRow.authorized) {
            throw new AppError("User is not authorized", 403, "UNAUTHORIZED");
        }

        let refreshToken = null

        //if they have less than 10 days left on their expiration, refresh their refresh token
        const TEN_DAYS = 10 * 24 * 60 * 60 * 1000;

        const msUntilExpiry = payload.exp * 1000 - Date.now();
        if (msUntilExpiry <= TEN_DAYS && msUntilExpiry > 0) {
            refreshToken = await generateRefreshToken(user)
        }

        const accessToken = await generateAuthToken(user);

        return { accessToken, refreshToken };
    } catch (err) {
        //If the users refresh token fails, in anyway remove it
        res.clearCookie('refreshToken', {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'strict',
            path: '/api/v1/auth/refresh-token'
        });
        throw mapSequelizeError(err);
    }
};

//User Forgets their password so they request a new password
export async function forgotPassword(email) {

    try {
        const result = sequelize.transaction(async t => {
            const user = User.findOne({ where: { email: email } });
            if (!user) {
                throw new AppError("There is no user with that email address", 404, "BAD_REFERENCE");
            }

        })
        return result;
    } catch (err) {
        throw mapSequelizeError(err)
    }
};

//User has password reset token and attempts to change password with new password info
export async function resetPassword(input_information) {
    return;
}

//User gets email of forgotten username
export async function forgotUsername(input_information) {
    return;
};


export default { registerUser, loginUser, accessToken, resetPassword, forgotUsername, forgotPassword }