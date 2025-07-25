import mapSequelizeError from "../utils/mapSequelizeError.js";
import AppError from "../utils/AppError.js";
import {
  User,
  WorkoutLog,
  ExerciseLog,
  CustomWorkout,
  WorkoutPlan,
} from "../models/index.js";
import { sequelize } from "../config/db.config.js";
import AppHistory from "../utils/AddHistory.js";
import { workoutAddXP } from "../utils/xpSystem.js";

export async function getProfileData(user) {
  try {
    const { password, createdAt, updatedAt, ...safeUser } =
      user.get?.({ plain: true }) || user;

    return safeUser;
  } catch (err) {
    throw mapSequelizeError(err);
  }
}

export async function setProfileData(input_data) {
  return;
}

export async function deleteAccount(input_data) {
  return;
}

export async function getHistory(input_data, paginated = false) {
  return;
}

export async function getWorkoutPlan(user) {
  try {
    return await sequelize.transaction(async (t) => {
      const userId = user?.id;
      if (!user || userId == null) {
        throw new AppError("Unknown user or userId", 400, "BAD_DATA");
      }

      const workoutPlan = await WorkoutPlan.findOne({
        where: { userId: userId },
        transaction: t,
      });

      if (!workoutPlan) {
        throw new AppError(
          "No workoutPlan found for user!",
          500,
          "database-error"
        );
      }

      //No Need TO Log
      return workoutPlan;
    });
  } catch (err) {
    throw mapSequelizeError(err);
  }
}

export async function setWorkoutPlan(user, newPlan) {
  try {
    return await sequelize.transaction(async (t) => {
      const userId = user?.id;
      if (!user || userId == null) {
        throw new AppError("Unknown user or userId", 400, "BAD_DATA");
      }

      const workoutPlan = await WorkoutPlan.findOne({
        where: { userId: userId },
        transaction: t,
      });

      if (!workoutPlan) {
        throw new AppError(
          "No workoutPlan found for user!",
          500,
          "database-error"
        );
      }

      workoutPlan.plan = newPlan;
      const newWorkoutPlan = await workoutPlan.save({ transaction: t });

      const history = new AppHistory(
        "USER",
        `User successfully updated their workoutPlan`,
        userId,
        null
      );
      await history.log(t);

      return newWorkoutPlan;
    });
  } catch (err) {
    console.log("Testing is caught?");
    throw mapSequelizeError(err);
  }
}

export async function getCustomWorkouts(user) {
  try {
    return await sequelize.transaction(async (t) => {
      const userId = user?.id;
      if (!user || userId == null) {
        throw new AppError("Unknown user or userId", 400, "BAD_DATA");
      }

      const customWorkouts = await CustomWorkout.findAll({
        where: { userId: userId },
        transaction: t,
      });

      if (!customWorkouts) {
        throw new AppError("No custom workouts found for user!", 400, "");
      }

      //No Need TO Log
      return customWorkouts;
    });
  } catch (err) {
    throw mapSequelizeError(err);
  }
}

export async function createCustomWorkout(customWorkout, name, user) {
  try {
    return await sequelize.transaction(async (t) => {
      const userId = user?.id;
      if (user == null || userId == null) {
        throw new AppError("Unknown user or userId", 400, "BAD_DATA");
      }
      const newCustomWorkout = await CustomWorkout.create(
        {
          userId: userId,
          name: name,
          exercises: customWorkout,
        },
        { transaction: t }
      );

      const history = new AppHistory(
        "USER",
        `User successfully created a new customWorkout with name of ${newCustomWorkout.name}`,
        userId,
        null
      );
      await history.log(t);

      return newCustomWorkout;
    });
  } catch (err) {
    throw mapSequelizeError(err);
  }
}

export async function updateCustomWorkout(id, newExercises, newName, user) {
  try {
    return await sequelize.transaction(async (t) => {
      const userId = user?.id;
      if (user == null || userId == null) {
        throw new AppError("Unknown user or userId", 400, "BAD_DATA");
      }

      const oldCustomWorkout = await CustomWorkout.findOne({
        where: { userId, id },
        transaction: t,
      });

      if (!oldCustomWorkout) {
        throw new AppError(
          `Could not find customWorkout with id ${id} belonging to user`,
          400,
          "BAD_DATA"
        );
      }

      oldCustomWorkout.exercises = newExercises;
      oldCustomWorkout.name = newName;
      oldCustomWorkout.changed("exercises", true);
      oldCustomWorkout.changed("name", true);
      const updateCustomWorkout = await oldCustomWorkout.save({
        transaction: t,
      });

      const history = new AppHistory(
        "USER",
        `User successfully updated their customWorkout with id of ${updateCustomWorkout.id}`,
        userId,
        null
      );
      await history.log(t);

      return updateCustomWorkout;
    });
  } catch (err) {
    throw mapSequelizeError(err);
  }
}

export async function deleteCustomWorkout(input_data) {
  return;
}

//Updates previous exerciseHistory, logs the workout, and addsXP sending back events to frontend for updates
export async function logWorkout(user, workout) {
  try {
    const newWorkout = await sequelize.transaction(async (t) => {
      const newWorkoutLog = [];
      const prevExerciseHistory = await ExerciseLog.findOne({
        where: { userId: user.id },
        transaction: t,
      });

      if (prevExerciseHistory == null) {
        throw new AppError("No exercise-history found", 400);
      }
      let exerciseId = null;
      let exerciseWeight = null;
      let exerciseNotes = null;
      let exerciseReps = null;
      let exerciseSets = null;
      let exerciseCooldown = null;

      const exerciseLogs = workout.exercises;
      const workoutLength = workout.length;

      if (!exerciseLogs || workoutLength == null) {
        throw new AppError("INVALID WORKOUT DATA", 400, "BAD_DATA");
      }

      for (const exerciseLog of exerciseLogs) {
        exerciseId = exerciseLog.id;
        exerciseWeight = exerciseLog.weight;
        exerciseNotes = exerciseLog.notes;
        exerciseReps = exerciseLog.reps;
        exerciseSets = exerciseLog.sets;
        exerciseCooldown = exerciseLog.cooldown;

        if (
          exerciseId == null ||
          exerciseWeight == null ||
          exerciseReps == null ||
          exerciseCooldown == null ||
          exerciseSets == null
        ) {
          throw new AppError("INVALID EXERCISE LOG DATA", 400, "BAD_DATA");
        }

        let newHistory = {
          reps: exerciseReps,
          sets: exerciseSets,
          weight: exerciseWeight,
          cooldown: exerciseCooldown,
          notes: exerciseNotes ?? "No Notes",
        };

        let newLog = {
          reps: exerciseReps,
          sets: exerciseSets,
          weight: exerciseWeight,
          cooldown: exerciseCooldown,
          exercise: exerciseId,
        };

        prevExerciseHistory.exerciseHistory = {
          ...prevExerciseHistory.exerciseHistory,
          [exerciseId]: newHistory,
        };
        newWorkoutLog.push(newLog);
      }

      await prevExerciseHistory.save({ transaction: t });

      const newWorkout = await WorkoutLog.create(
        {
          length: workoutLength,
          exercises: newWorkoutLog,
          userId: user.id,
        },
        { transaction: t }
      );

      const history = new AppHistory(
        "USER",
        `User successfully logged their workout with workout Id ${newWorkout.id}`,
        user.id,
        null
      );
      await history.log(t);
      user.totalWorkouts += 1;
      user.totalTimeWorkedOut += workoutLength;
      await user.save({ transaction: t });

      return newWorkout;
    });

    const { events, newXp, xpPerCategory } = await workoutAddXP(
      user,
      newWorkout
    );

    return { events, newXp, xpPerCategory };
  } catch (err) {
    throw mapSequelizeError(err);
  }
}

export default {
  getProfileData,
  setProfileData,
  deleteAccount,
  getHistory,
  getWorkoutPlan,
  setWorkoutPlan,
  getCustomWorkouts,
  createCustomWorkout,
  updateCustomWorkout,
  deleteCustomWorkout,
  logWorkout,
};
