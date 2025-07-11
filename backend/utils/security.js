import { User } from '../models/index.js'
import { sequelize } from '../config/db.config.js';
import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';
import AppError from './AppError.js';
dotenv.config();

const RESET_SECRET = process.env.PASS_RESET_SECRET;
const RESET_EXPIRES = process.env.PASS_RESET_EXPIRES || "1m";

const REFRESH_SECRET = process.env.REFRESH_SECRET;
const REFRESH_EXPIRES = process.env.REFRESH_EXPIRES || "1m";

const AUTH_SECRET = process.env.AUTH_SECRET;
const AUTH_EXPIRES = process.env.AUTH_EXPIRES || "1m";

const WS_SECRET = process.env.WS_SECRET;
const WS_EXPIRES = process.env.WS_EXPIRES || "1m";

if (!RESET_SECRET || !REFRESH_SECRET || !AUTH_SECRET || !WS_SECRET) {
    throw new Error("JWT_SECRETS not loaded in enviorment");
}

//Generate Token for Password Resetting, returns token GIVEN TO USER IN EMAIL FOR PASSWORD RESET
export async function generatePasswordResetToken(user) {
    if (!user || !user.id) {
        throw new AppError('Invalid user for password-reset token', 400, 'BAD_DATA');
    }

    const payload = { id: user.id };
    return jwt.sign(payload, RESET_SECRET, { expiresIn: RESET_EXPIRES });
}

//Verify password Reset Token, returns user
export async function verifyResetToken(token) {
    let payload;

    try {
        payload = jwt.verify(token, RESET_SECRET);
    } catch (err) {
        throw new AppError("Invalid or expired password reset token", 401, "INVALID_TOKEN");
    }

    const user = await User.findByPk(payload.id);
    if (!user) {
        throw new AppError('User not found for this reset token', 404, 'NOT_FOUND');
    }

    return user;
}

//Generate long-term refreshToken, returns token on LOGIN and WEBSOCKET CONNECT, returns user
export async function generateRefreshToken(user) {
    if (!user || !user.id) {
        throw new AppError('Invalid user for refresh token', 400, 'BAD_DATA');
    }

    const payload = { id: user.id };

    //Note Changes checks if authorized is true and if RefreshToken Valid |  Logout unauthorizes user
    //await Auth.authorize(user.id);
    //Handle auth in top level login

    return jwt.sign(payload, REFRESH_SECRET, { expiresIn: REFRESH_EXPIRES });
}

//Verifys refresh-token given to user
export async function verifyRefreshToken(token) {
    let payload;

    try {
        payload = jwt.verify(token, REFRESH_SECRET)
    } catch (err) {
        throw new AppError("Invalid or expired refresh token", 401, "INVALID_TOKEN");
    }

    const user = await User.findByPk(payload.id);
    if (!user) {
        throw new AppError('User not found for this refresh token', 404, 'NOT_FOUND');
    }

    return { user, payload }
}

//Generate shortTerm authorization token GIVEN TO USER ON /refresh
export async function generateAuthToken(user) {
    if (!user || !user.id) {
        throw new AppError('Invalid user for auth token', 400, 'BAD_DATA');
    }

    const payload = {
        id: user.id,
        username: user.username,
        email: user.email,
        authority: user.authority,
        level: user.level,
        xp: user.xp,
        totalFriends: user.totalFriends,
        totalWorkouts: user.totalWorkouts,
        totalTimeWorkedOut: user.totalTimeWorkedOut,
        totalCoins: user.totalCoins,
        shopUnlocks: user.shopUnlocks,
    }

    return jwt.sign(payload, AUTH_SECRET, { expiresIn: AUTH_EXPIRES });
}

//Verify Auth Token Authenticity
export async function verifyAuthToken(token) {
    let payload;

    try {
        payload = jwt.verify(token, AUTH_SECRET)
    } catch (err) {
        throw new AppError("Invalid or expired auth token", 401, "INVALID_TOKEN");
    }

    const user = await User.findByPk(payload.id);
    if (!user) {
        throw new AppError('User not found for this auth token', 404, 'NOT_FOUND');
    }

    return user
}

//Generate a WEBSOCKET Token used for WEBSOCKET AUTHORTIZATION
export async function generateWebSocketToken(user) {
    if (!user || !user.id) {
        throw new AppError('Invalid user for WS token', 400, 'BAD_DATA');
    }

    const payload = {
        id: user.id,
    }

    return jwt.sign(payload, WS_SECRET, { expiresIn: WS_EXPIRES });
}

//VERIFY WEBSOCKET TOKEN
export async function verifyWebSocketToken(token) {
    let payload;

    try {
        payload = jwt.verify(token, WS_SECRET)
    } catch (err) {
        throw new AppError("Invalid or expired WS token", 401, "INVALID_TOKEN");
    }

    const user = await User.findByPk(payload.id);
    if (!user) {
        throw new AppError('User not found for this WS TOKEN', 404, 'NOT_FOUND');
    }

    return { user, payload };
}

export default { generatePasswordResetToken, verifyResetToken, generateRefreshToken, verifyRefreshToken, generateAuthToken, verifyAuthToken, generateWebSocketToken, verifyWebSocketToken };