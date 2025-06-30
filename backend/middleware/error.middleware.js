import AppError from '../utils/AppError.js';

export default function error(err, req, res, next) {
    if (err instanceof AppError) {
        return res.status(err.status).json({
            error: err.message,
            code: err.code,
        });
    }

    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
}
