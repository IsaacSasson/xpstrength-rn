import AppError from "../utils/AppError.js";
import mapSequelizeError from "../utils/mapSequelizeError.js";
import { verifyAuthToken } from "../utils/security.js";
import { Auth } from '../models/index.js';

export default async function authMiddle(req, res, next) {
    try {
        const authHeader = req.headers.authorization;
        if (!authHeader) {
            throw new AppError("No authorization header provided", 401, "NO_TOKEN");
        }
        const [scheme, token] = authHeader.split(" ");
        if (scheme !== "Bearer" || !token) {
            throw new AppError("Missing or malformed access token", 401, "NO_TOKEN");
        }

        const payload = await verifyAuthToken(token);

        const authRow = await Auth.findOne({ where: { userId: payload.id } });
        if (!authRow || !authRow.authorized) {

            res.clearCookie('refreshToken', {
                httpOnly: true,
                secure: process.env.NODE_ENV === 'production',
                sameSite: 'strict',
                path: '/api/v1/auth/refresh-token'
            });

            throw new AppError("User is not authorized", 403, "UNAUTHORIZED");
        }

        req.user = payload;
        return next();

    } catch (err) {
        if (err instanceof AppError) {
            return next(err);
        }
        return next(mapSequelizeError(err));
    }
}
