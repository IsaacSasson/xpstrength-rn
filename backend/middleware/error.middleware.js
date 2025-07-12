import AppError from "../utils/AppError.js";

export default function error(err, req, res, next) {
  if (!err.isApp) {
    err = new AppError(
      err.message || "Internal server error",
      err.status || 500,
      err.code || "INTERNAL_ERROR"
    );
  }

  if (process.env.NODE_ENV === "development") {
    console.log(`\x1b[31m${err.message}\x1b[0m`);
  }

  return res.status(err.status).json({
    error: err.message,
    code: err.code,
  });
}
