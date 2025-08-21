import mapSequelizeError from "../utils/mapSequelizeError.js";
import AppError from "../utils/AppError.js";
import { User, WorkoutLog } from "../models/index.js";
import { sequelize } from "../config/db.config.js";
import { Op } from "sequelize";
import AddHistory from "../utils/AddHistory.js";

export async function getWorkoutHistory(user, paginated = false) {
  try {
    const userId = user.id;
    let workoutLogs = null;
    if (paginated) {
      const { start, end } = paginated;

      //Ensures non negative limits
      const limit = Math.max(end - start, 0);
      workoutLogs = await WorkoutLog.findAll({
        where: {
          userId,
        },
        order: [["createdAt", "DESC"]],
        offset: start,
        limit,
      });
    } else {
      workoutLogs = await WorkoutLog.findAll({
        where: {
          userId,
        },
        order: [["createdAt", "DESC"]],
      });
    }
    if (!workoutLogs) {
      throw new AppError("Workoutlogs not found for user", 404, "NOT_FOUND");
    }
    return workoutLogs;
  } catch (err) {
    throw mapSequelizeError(err);
  }
}

export default { getWorkoutHistory };
