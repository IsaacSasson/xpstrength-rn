import authService from '../services/auth.service.js'

//allows a user to register an account
export async function postRegister(req, res, next) {
    try {
        const data = req.body.data;

        const user = await authService.registerUser(data);
        res.status(201).json(user);
    } catch (err) {
        next(err);
    }
}

export async function postForgotPassword(req, res, next) {
    try {
        const email = req.body.email;

        const response = await authService.forgotPassword(email);
        res.status(200).json(response);
    } catch (err) {
        next(err);
    }
}

export async function postResetPassword(req, res, next) {
    try {
        const email = req.body.email;

        const response = await authService.forgotPassword(email);
        res.status(200).json(response);
    } catch (err) {
        next(err);
    }

}

export default { postRegister, postForgotPassword, postResetPassword };