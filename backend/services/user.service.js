import mapSequelizeError from "../utils/mapSequelizeError.js";
import AppError from "../utils/AppError.js";
import bcrypt from "bcrypt";

import {
  User,
  WorkoutLog,
  ExerciseLog,
  CustomWorkout,
  WorkoutPlan,
  History,
} from "../models/index.js";
import { sequelize } from "../config/db.config.js";
import { Op } from "sequelize";
import AppHistory from "../utils/AddHistory.js";
import { workoutAddXP } from "../utils/xpSystem.js";
import { generateAuthToken } from "../utils/security.js";

export async function getProfileData(user) {
  try {
    const { password, profilePic, ...safeUser } =
      user.get?.({ plain: true }) || user;

    return safeUser;
  } catch (err) {
    throw mapSequelizeError(err);
  }
}

export async function getProfilePic(user) {
  //GET PFP
  try {
    return user.profilePic;
  } catch (err) {
    throw mapSequelizeError(err);
  }
}

export async function saveProfilePic(newPFP, user) {
  //Change PFP
  try {
    await sequelize.transaction(async (t) => {
      const userId = user.id;
      if (newPFP) {
        user.profilePic = newPFP;
        const history = new AppHistory(
          "USER",
          `User succesfully updated their profile picture`,
          userId,
          null
        );
        await history.log(t);

        await user.save({ transaction: t });
      }
    });
  } catch (err) {
    throw mapSequelizeError(err);
  }
}

export async function setProfileData(
  user,
  currentPassword,
  newPassword,
  newUsername,
  newEmail,
  newFitnessGoal
) {
  try {
    const userId = user.id;
    return await sequelize.transaction(async (t) => {
      if (!currentPassword && (newEmail || newPassword || newUsername)) {
        throw new AppError(
          "Current password not sent to update restricted data",
          400,
          "BAD_DATA"
        );
      }
      let match = null;
      if (currentPassword) {
        match = await bcrypt.compare(currentPassword, user.password);

        if (match) {
          if (newUsername) {
            user.username = newUsername;
            const history = new AppHistory(
              "USER",
              `User succesfully updated their username`,
              userId,
              null
            );
            await history.log(t);
          }

          if (newEmail) {
            user.email = newEmail;
            const history = new AppHistory(
              "USER",
              `User succesfully updated their email`,
              userId,
              null
            );
            await history.log(t);
          }

          if (newPassword) {
            user.password = newPassword;
            const history = new AppHistory(
              "USER",
              `User succesfully updated their password`,
              userId,
              null
            );
            await history.log(t);
          }
        } else {
          throw new AppError("Invalid Password", 403, "FORBIDDEN");
        }
      }

      if (newFitnessGoal) {
        user.fitnessGoal = newFitnessGoal;
        const history = new AppHistory(
          "USER",
          `User succesfully updated their Fitness Goal`,
          userId,
          null
        );
        await history.log(t);
      }

      await user.save({ transaction: t });

      const newAccessToken = await generateAuthToken(user);

      const newProfile = {
        usernameChanged: match && newUsername ? newUsername : "Not Changed",
        emailChanged: match && newEmail ? newEmail : "Not Changed",
        passwordChanged: match && newPassword ? "Changed" : "Not Changed",
        fitnessGoalChanged: newFitnessGoal ? "Changed" : "Not Changed",
      };

      return { newAccessToken, newProfile };
    });
  } catch (err) {
    throw mapSequelizeError(err);
  }
}

export async function deleteAccount(user) {
  try {
    const userId = user.id;

    await sequelize.transaction(async (t) => {
      const user = await User.findOne({
        where: { id: userId },
        transaction: t,
      });
      await user.destroy({ transaction: t });
    });

    return;
  } catch (err) {
    throw mapSequelizeError(err);
  }
}

export async function getHistory(user, paginated = false) {
  try {
    const userId = user.id;
    let history = null;
    if (paginated) {
      const { start, end } = paginated;

      //Ensures non negative limits
      const limit = Math.max(end - start, 0);
      history = await History.findAll({
        where: {
          userId,
          type: {
            [Op.or]: ["USER", "FRIEND", "MILESTONE", "STATS"],
          },
        },
        order: [["createdAt", "DESC"]],
        attributes: ["action"],
        offset: start,
        limit,
      });
    } else {
      history = await History.findAll({
        where: {
          userId,
          type: {
            [Op.or]: ["USER", "FRIEND", "MILESTONE", "STATS"],
          },
        },
        order: [["createdAt", "DESC"]],
        attributes: ["action"],
      });
    }
    if (!history) {
      throw new AppError("History not found for user", 404, "NOT_FOUND");
    }
    return history;
  } catch (err) {
    throw mapSequelizeError(err);
  }
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
        throw new AppError(
          "No custom workouts found for user!",
          400,
          "BAD_DATA"
        );
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

//Delete a customWorkout
export async function deleteCustomWorkout(id, user) {
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

      await oldCustomWorkout.destroy({ transaction: t });

      const oldWorkoutPlan = await WorkoutPlan.findOne({
        where: { userId },
        transaction: t,
      });

      if (!oldWorkoutPlan) {
        throw new AppError(
          `Could not find workoutPlan for user`,
          500,
          "Database Error"
        );
      }

      const oldPlan = oldWorkoutPlan.plan;

      const newPlan = oldPlan.reduce((acc, customWorkoutId) => {
        if (customWorkoutId == id) {
          acc.push(-1);
        } else {
          acc.push(customWorkoutId);
        }
        return acc;
      }, []);

      oldWorkoutPlan.plan = newPlan;
      const newWorkoutPlan = await oldWorkoutPlan.save({ transaction: t });

      const history = new AppHistory(
        "USER",
        `User successfully deleted their customWorkout with id of ${id}`,
        userId,
        null
      );
      await history.log(t);

      return newWorkoutPlan;
    });
  } catch (err) {
    throw mapSequelizeError(err);
  }
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
      let exerciseNotes = null;
      let exerciseSets = null;
      let exerciseCooldown = null;

      const exerciseLogs = workout.exercises;
      const workoutLength = workout.length;

      if (!exerciseLogs || workoutLength == null) {
        throw new AppError("INVALID WORKOUT DATA", 400, "BAD_DATA");
      }

      for (const exerciseLog of exerciseLogs) {
        exerciseId = exerciseLog.exercise;
        exerciseNotes = exerciseLog.notes;
        exerciseSets = exerciseLog.sets;
        exerciseCooldown = exerciseLog.cooldown;
        if (
          exerciseId == null ||
          exerciseCooldown == null ||
          exerciseSets == null
        ) {
          throw new AppError("INVALID EXERCISE LOG DATA", 400, "BAD_DATA");
        }

        let newHistory = {
          sets: exerciseSets,
          cooldown: exerciseCooldown,
          notes: exerciseNotes ?? "No Notes",
        };

        let newLog = {
          sets: exerciseSets,
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

export async function getExerciseHistory(user) {
  try {
    const exerciseHistory = await ExerciseLog.findOne({
      where: { userId: user.id },
    });
    if (!exerciseHistory) {
      throw new AppError(
        "Exercise History not found for user",
        400,
        "BAD_DATA"
      );
    }

    return exerciseHistory.exerciseHistory;
  } catch (err) {
    throw mapSequelizeError(err);
  }
}

export async function saveNotes(user, notes, exerciseId) {
  try {
    return sequelize.transaction(async (t) => {
      const exerciseHistory = await ExerciseLog.findOne({
        where: { userId: user.id },
        transaction: t,
      });

      if (!exerciseHistory) {
        throw new AppError(
          "ExerciseHistory not found for userID",
          404,
          "NOT_FOUND"
        );
      }

      if (exerciseHistory.exerciseHistory[exerciseId]) {
        exerciseHistory.exerciseHistory[exerciseId].notes = notes;
      } else {
        exerciseHistory.exerciseHistory[exerciseId] = {
          notes: notes,
          sets: [{ reps: 0, weight: 0 }],
          cooldown: 0,
        };
      }

      exerciseHistory.changed("exerciseHistory", true);
      await exerciseHistory.save({ transaction: t });
    });
  } catch (err) {
    throw mapSequelizeError(err);
  }
}

export default {
  getProfilePic,
  saveProfilePic,
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
  getExerciseHistory,
  saveNotes,
};
