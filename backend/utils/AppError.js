export default class AppError extends Error {
    constructor(message, status = 500, code = 'UNKNOWN') {
        super(message);
        this.status = status;
        this.code = code;
        this.isApp = true;
        Error.captureStackTrace(this, this.constructor)
    }
}