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

export async function postForgotUsername(req, res, next) {
    if (!req?.body?.data) {
        return next(new AppError("Missing data payload", 400, "BAD_DATA"));
    }

    const email = req.body.data.email;

    if (!email) {
        return next(new AppError("Missing email paylaod", 400, "BAD_DATA"));
    }

    try {
        await authService.forgotUsername(email);
        return res.status(200).json({ message: `Username succesfully sent to ${email}` });
    } catch (err) {
        next(err);
    }
}

export async function postForgotPassword(req, res, next) {
    if (!req?.body?.data) {
        return next(new AppError("Missing data payload", 400, "BAD_DATA"));
    }

    const username = req.body.data.username;

    if (!username) {
        return next(new AppError("Missing username paylaod", 400, "BAD_DATA"));
    }

    try {
        await authService.forgotPassword(username, req);
        return res.status(200).json({ message: `Password reset link succesfully sent to ${username}` });
    } catch (err) {
        next(err);
    }
}

export async function getResetPassword(req, res, next) {
    try {
        return res.status(200)
    } catch (err) {
        next(err);
    }

}

export async function patchResetPassword(req, res, next) {
    if (!req?.body?.data) {
        return next(new AppError("Missing data payload", 400, "BAD_DATA"));
    }

    const resetToken = req.body.data.resetToken;
    const newPassword = req.body.data.newPassword;

    if (!resetToken || !newPassword) {
        return next(new AppError("Missing resetToken or password data", 400, "BAD_DATA"));
    }

    try {
        await authService.resetPassword(resetToken, newPassword);
        return res.status(200).json({ message: "Password succesfully changed, try logging in with new password." })
    } catch (err) {
        next(err);
    }

}

export default { postRegister, postForgotPassword, patchResetPassword, getAccessToken, postForgotPassword, getResetPassword };