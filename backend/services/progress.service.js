import mapSequelizeError from "../utils/mapSequelizeError.js";
import AppError from "../utils/AppError.js";
import FriendEmitters from "../io/emitters/friends.js";
import {
  User,
  WorkoutLog,
  PersonalBest,
  Stats,
  Goal,
} from "../models/index.js";
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

export async function createGoal(user, name, type, details, total) {
  return await sequelize.transaction(async (t) => {
    const goal = await Goal.create(
      {
        userId: user.id,
        name,
        type,
        details,
        total,
        current: 0,
      },
      { transaction: t }
    );

    const newHistory = new AddHistory(
      "PROGRESS",
      "User succesfully created a new Goal",
      user.id,
      goal.id
    );

    await newHistory.log(t);

    return {
      id: goal.id,
      name: goal.name,
      type: goal.type,
      details: goal.details,
      total: goal.total,
      updatedAt: goal.updatedAt,
      createdAt: goal.createdAt,
    };
  });
}

export async function updateGoal(
  user,
  id,
  name,
  type,
  details,
  total,
  current
) {
  let res = await sequelize.transaction(async (t) => {
    const goal = await Goal.findOne({
      where: { id: id, userId: user.id },
      transaction: t,
    });

    if (!goal) {
      throw new AppError(
        "Could not find goal owned by user with ID provided",
        400,
        "BAD_DATA"
      );
    }

    goal.name = name ?? goal.name;
    goal.type = type ?? goal.type;
    goal.details = details ?? goal.details;
    goal.total = total ?? goal.total;
    goal.current = current ?? goal.current;

    goal.save({ transaction: t });

    const newHistory = new AddHistory(
      "PROGRESS",
      "User succesfully updated a Goal",
      user.id,
      id
    );

    await newHistory.log(t);

    return {
      id: goal.id,
      name: goal.name,
      type: goal.type,
      details: goal.details,
      total: goal.total,
      current: goal.current,
      updatedAt: goal.updatedAt,
      createdAt: goal.createdAt,
    };
  });

  if (name || type || details || total || current) {
    FriendEmitters.profileUpdatedEmitter(user.id);
  }

  return res;
}

export async function deleteGoal(user, id) {
  return await sequelize.transaction(async (t) => {
    const goal = await Goal.findOne({
      where: { id: id, userId: user.id },
      transaction: t,
    });

    if (!goal) {
      throw new AppError(
        "Could not find goal owned by user with ID provided",
        400,
        "BAD_DATA"
      );
    }

    goal.destroy({ transaction: t });

    const newHistory = new AddHistory(
      "PROGRESS",
      "User succesfully deleted a Goal",
      user.id,
      id
    );

    await newHistory.log(t);

    return;
  });
}

export async function getGoals(user) {
  try {
    const goals = await Goal.findAll({
      where: { userId: user.id },
      attributes: [
        "id",
        "name",
        "type",
        "details",
        "total",
        "updatedAt",
        "createdAt",
        "current",
      ],
      raw: true,
    });

    return goals;
  } catch (err) {
    throw mapSequelizeError(err);
  }
}

export default {
  getWorkoutHistory,
  getPB,
  getStats,
  createGoal,
  getGoals,
  updateGoal,
  deleteGoal,
};
