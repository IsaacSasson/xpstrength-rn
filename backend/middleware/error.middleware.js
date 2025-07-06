import AppError from '../utils/AppError.js';

export default function error(err, req, res, next) {
    if (err instanceof AppError) {
        return res.status(err.status).json({
            error: err.message,
            code: err.code,
        });
    }

    if (!err.isApp) {
        err = new AppError(
            err.message || "Internal server error",
            err.status || 500,
            err.code || "INTERNAL_ERROR"
        );
    }
    return res.status(err.status).json({
        error: err.message,
        code: err.code,
    });
}