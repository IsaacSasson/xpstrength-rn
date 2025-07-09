import authService from '../services/auth.service.js'
import AppError from '../utils/AppError.js';

//Validate, send

//allows a user to register an account
export async function postRegister(req, res, next) {
    if (!req.body?.data) {
        return next(new AppError("Missing register payload", 400, "BAD_DATA"));
    }

    const data = req.body?.data;

    try {
        const user = await authService.registerUser(data);
        return res.status(201).json(user);
    } catch (err) {
        next(err);
    }
};

export async function postLogin(req, res, next) {

    if (!req.body?.data) {
        return next(new AppError("Missing login payload", 400, "BAD_DATA"));
    }

    const { username, password } = req.body.data;

    try {

        const { accessToken, refreshToken } = await authService.loginUser({ username, password });

        res.cookie('refreshToken', refreshToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'strict',
            path: '/api/v1/auth/refresh-token',
            maxAge: 60 * 24 * 60 * 60 * 1000
        });

        return res.status(200).json({ data: { accessToken } })
    } catch (err) {
        next(err);
    }
};

//Returns accessToken for user, and resets refresh token
export async function getAccessToken(req, res, next) {

    if (!req?.cookies?.refreshToken) {
        throw new AppError('No refresh token provided', 401, 'NO_TOKEN');
    }

    try {
        const token = req?.cookies?.refreshToken;

        const { accessToken, refreshToken } = await authService.accessToken(token, res);

        if (refreshToken) {
            res.cookie('refreshToken', refreshToken, {
                httpOnly: true,
                secure: process.env.NODE_ENV === 'production',
                sameSite: 'strict',
                path: '/api/v1/auth/refresh-token',
                maxAge: 60 * 24 * 60 * 60 * 1000
            });
        }

        return res.status(200).json({ data: { accessToken } })
    } catch (err) {
        next(err);
    }
}


export async function postForgotPassword(req, res, next) {
    try {
        const email = req.body?.email;

        const response = await authService.forgotPassword(email);
        res.status(200).json(response);
    } catch (err) {
        next(err);
    }
}

export async function postResetPassword(req, res, next) {
    try {
        const email = req.body.email;

        const response = await authService.resetPassword(email);
        res.status(200).json(response);
    } catch (err) {
        next(err);
    }

}

export default { postRegister, postForgotPassword, postResetPassword, getAccessToken, postForgotPassword };