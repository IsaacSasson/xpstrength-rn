import mapSequelizeError from "../utils/mapSequelizeError.js";
import AppError from "../utils/AppError.js";
import { User, WorkoutLog, PersonalBest, Stats } from "../models/index.js";
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

export async function getPB(user) {
  try {
    const userId = user.id;
    return await sequelize.transaction(async (t) => {
      const row = await PersonalBest.findOne({
        where: { userId },
        attributes: ["personalBests"],
        transaction: t,
        raw: true,
      });
      let result = {};
      const bests = row?.personalBests || {};
      let data = null;
      for (const key of Object.keys(bests)) {
        data = await WorkoutLog.findOne({
          where: { id: bests[key] },
          attributes: ["exercises", "updatedAt"],
          transaction: t,
          raw: true,
        });
        for (const value of data.exercises) {
          if (value.exercise === parseInt(key)) {
            result[key] = {
              sets: value.sets,
              cooldown: value.cooldown,
              timestamp: data["updatedAt"],
              PR: value.sets.reduce((prev, curr) => {
                if (prev < curr.weight) {
                  return curr.weight;
                }
                return prev;
              }, 0),
            };
            break;
          }
        }
      }
      return result;
    });
  } catch (err) {
    throw mapSequelizeError(err);
  }
}

export async function getStats(user) {
  try {
    const userId = user.id;
    const stats = await Stats.findOne({
      where: { userId },
      attributes: [
        "total",
        "chest",
        "core",
        "back",
        "shoulders",
        "triceps",
        "biceps",
        "legs",
      ],
      raw: true,
    });

    return stats;
  } catch (err) {
    throw mapSequelizeError(err);
  }
}

export default { getWorkoutHistory, getPB, getStats };
