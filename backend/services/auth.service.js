import mapSequelizeError from '../utils/mapSequelizeError.js';
import AppError from '../utils/AppError.js';
import { User, Auth } from '../models/index.js';
import { sequelize } from '../config/db.config.js';
import AppHistory from '../utils/AddHistory.js'
import { generateRefreshToken, generateAuthToken, verifyRefreshToken } from '../utils/security.js';

//Registers new user to the DB
export async function registerUser(userInfo) {
    try {
        if (userInfo === null || userInfo === "") {
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

        return result;
    } catch (err) {
        throw mapSequelizeError(err);
    }
};

//Logs user in
export async function loginUser(authData) {
    try {
        const { username, password } = authData;
        const user = User.findOne({ where: { username: username } });
        if (!user || !user.id) {
            throw new AppError("incorrect password or username", 401, "UNAUTHENTICATED");
        }
        hashedPassword = await bcrypt.hash(password, parseInt(process.env.SALT_ROUNDS, 10));

        if (hashedPassword !== user.password) {
            throw new AppError("incorrect password username", 401, "UNAUTHENTICATED");
        }

        const refreshToken = await generateRefreshToken(user);
        const accessToken = await generateAuthToken(user);

        const result = await sequelize.transaction(async t => {
            await Auth.authorize(user.id);

            const action = new AppHistory(
                "AUTH",
                `${user.username} loggedIn successfully for account with id ${user.id}`,
                user.id,
                null
            );

            await action.log(t);

            //TODO Connect User to WebSocket
            return user;
        });

        return { accessToken, refreshToken };
    } catch (err) {
        throw mapSequelizeError(err);
    }
};

//Users gets a new refresh token
export async function refreshToken(token) {
    try {
        if (!token) {
            throw new AppError("missing refresh token", 401, "NO_TOKEN");
        }

        const user = await verifyRefreshToken(token);
        if (!user || !user.id) {
            throw new AppError("user not found", 404, "NOT_FOUND");
        }

        const Authenticated = await Auth.findOne({ where: { userId: user.id } });
        if (!Authenticated.authorized) {
            return { accessToken: null, refreshToken: null };
        }

        const refreshToken = await generateRefreshToken(user);
        const accessToken = await generateAuthToken(user);

        return { accessToken, refreshToken };
    } catch (err) {
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


export default { registerUser, loginUser, refreshToken, refreshToken, resetPassword, forgotUsername, forgotPassword }