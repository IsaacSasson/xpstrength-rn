import authService from '../services/auth.service.js'
import AppError from '../utils/AppError.js';

//allows a user to register an account
export async function postRegister(req, res, next) {
    try {
        const data = req.body?.data;

        const user = await authService.registerUser(data);
        return res.status(201).json(user);
    } catch (err) {
        next(err);
    }
};

export async function postLogin(req, res, next) {
    try {
        const { username, password } = req.body?.data;

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

export async function getRefreshToken(req, res, next) {
    try {
        const token = req?.cookies?.refreshToken;
        if (!token) {
            throw new AppError('No refresh token provided', 401, 'NO_TOKEN');
        }

        const { accessToken, refreshToken } = await authService.refreshToken(token);

        if (refreshToken) {
            res.cookie('refreshToken', refreshToken, {
                httpOnly: true,
                secure: process.env.NODE_ENV === 'production',
                sameSite: 'strict',
                path: '/api/v1/auth/refresh-token',
                maxAge: 60 * 24 * 60 * 60 * 1000
            });
        } else {
            res.clearCookie('refreshToken', {
                httpOnly: true,
                secure: process.env.NODE_ENV === 'production',
                sameSite: 'strict',
                path: '/api/v1/auth/refresh-token'
            });
            throw new AppError('user forced to disconnect', 401, 'UNAUTHENTICATED');
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

export default { postRegister, postForgotPassword, postResetPassword, getRefreshToken, postForgotPassword };