import AppError from "../utils/AppError.js";
import mapSequelizeError from "../utils/mapSequelizeError.js";
import { verifyAuthToken } from "../utils/security.js";

export default async function authMiddle(req, res, next) {
    try {
        const authHeader = req.headers.authorization || "";
        const parts = authHeader.split(" ");

        if (parts.length !== 2 || parts[0] !== "Bearer") {
            throw new AppError("Missing or malformed access token", 401, "NO_TOKEN");
        }
        const token = parts[1];

        const payload = await verifyAuthToken(token);

        req.user = payload;

        return next()

    } catch (err) {
        return next(mapSequelizeError(err));
    }
}