import { UniqueConstraintError, ValidationError, ForeignKeyConstraintError, ConnectionError } from 'sequelize';
import AppError from './AppError.js';

export default function mapSequelizeError(err) {

    if (process.env.NODE_ENV === "development") {
        console.error(err);
    }
    if (err instanceof UniqueConstraintError) {
        const field = Object.keys(err.fields)[0];
        return new AppError(`Duplicate value for “${field}”`, 409, 'DUPLICATE');
    }

    if (err instanceof ValidationError) {
        return new AppError(
            'Input failed validation',
            400,
            'VALIDATION',
        );
    }

    if (err instanceof ForeignKeyConstraintError) {
        return new AppError('Invalid reference', 400, 'BAD_REFERENCE');
    }

    if (err instanceof ConnectionError) {
        return new AppError('Database unavailable', 503, 'DB_DOWN');
    }

    return err;
}
