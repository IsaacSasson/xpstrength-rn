import AppError from "../utils/AppError.js";
import progressService from "../services/progress.service.js";

export async function getWorkoutHistory(req, res, next) {
  const user = req?.user ?? null;
  try {
    if (!user) {
      throw new AppError("Malformed User ID", 400, "BAD_DATA");
    }
    const workoutLogs = await progressService.getWorkoutHistory(user, false);

    return res.status(200).json({
      data: {
        workoutHistory: workoutLogs,
      },
      message: "User succesfully retrieved their workout history!",
    });
  } catch (err) {
    next(err);
  }
}

export async function getWorkoutHistoryPaginated(req, res, next) {
  const user = req?.user ?? null;
  const block = req?.params?.page ?? null;
  const blockSize = req?.params?.pageSize ?? null;
  console.log("ran Paginated version");
  try {
    if (!user || block == null || blockSize == null) {
      throw new AppError("Malfored request parameters.", 400, "BAD_DATA");
    }

    if (block < 0 || blockSize < 0) {
      throw new AppError(
        "Page and/or Pagesize must be positive!",
        400,
        "BAD_PARAMS"
      );
    }
    const start = block * blockSize;
    const end = (block + 1) * blockSize;

    const workoutLogs = await progressService.getWorkoutHistory(user, {
      start,
      end,
    });

    return res.status(200).json({
      data: {
        workoutHistory: workoutLogs,
      },
      message: "User succesfully retrived their paginated workout history!",
    });
  } catch (err) {
    next(err);
  }
}

export default { getWorkoutHistory, getWorkoutHistoryPaginated };
