import mapSequelizeError from "../utils/mapSequelizeError.js";
import AppError from "../utils/AppError.js";
import { User, WorkoutLog, ExerciseLog } from "../models/index.js";
import { sequelize } from "../config/db.config.js";
import AppHistory from "../utils/AddHistory.js";
import { workoutAddXP } from "../utils/xpSystem.js";

export async function getProfileData(input_data) {
  return;
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

export async function workoutPlan(input_data) {
  return;
}

export async function setWorkoutPlan(input_data) {
  return;
}

export async function customWorkouts(input_data) {
  return;
}

export async function createCustomWorkout(input_data) {
  return;
}

export async function setCustomWorkouts(input_data) {
  return;
}

export async function deleteCustomWorkout(input_data) {
  return;
}

//Updates previous exerciseHistory, logs the workout, and addsXP sending back events to frontend for updates
export async function logWorkout(user, workout) {
  try {
    const newWorkoutLog = await sequelize.transaction(async (t) => {
      const newExerciseLog = [];
      const prevExerciseLog = await ExerciseLog.findOne({
        where: { userId: user.id },
        transaction: t,
      });

      if (prevExerciseLog == null) {
        throw new AppError("No exercise-history found", 400);
      }
      let exerciseId = null;
      let exerciseWeight = null;
      let exerciseNotes = null;
      let exerciseReps = null;
      let exerciseSets = null;
      let exerciseCooldown = null;

      const workoutLogs = workout.exercises;
      const workoutLength = workout.length;

      if (!workoutLogs || workoutLength == null) {
        throw new AppError("INVALID WORKOUT DATA", 400, "BAD_DATA");
      }

      for (const exerciseLog of workoutLogs) {
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

        prevExerciseLog.exerciseHistory[exerciseId] = newHistory;
        newExerciseLog.push(newLog);
      }

      await prevExerciseLog.save({ transaction: t });

      const newWorkout = await WorkoutLog.create(
        {
          length: workoutLength,
          exercises: newExerciseLog,
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

      return newWorkout;
    });

    const newEvents = await workoutAddXP(user, newWorkoutLog);

    return newEvents;
  } catch (err) {
    throw mapSequelizeError(err);
  }
}

export default {
  getProfileData,
  setProfileData,
  deleteAccount,
  getHistory,
  workoutPlan,
  setWorkoutPlan,
  customWorkouts,
  createCustomWorkout,
  setCustomWorkouts,
  deleteCustomWorkout,
  logWorkout,
};
