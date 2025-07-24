import userService from "../services/user.service.js";
import AppError from "../utils/AppError.js";

export async function getProfile(req, res, next) {
  const user = req?.user ?? null;
  try {
    if (!user) {
      throw new AppError("No user DATA", 400, "BAD_DATA");
    }
    const cleanedData = await userService.getProfileData(user);
    return res.status(200).json({
      data: {
        profileData: cleanedData,
      },
      message: "User Profile succesfully recieved!",
    });
  } catch (err) {
    next(err);
  }
}

export async function patchProfile(req, res, next) {
  return;
}

export async function deleteAccount(req, res, next) {
  return;
}

export async function getHistory(req, res, next) {
  return;
}

export async function getHistoryPaginated(req, res, next) {
  return;
}

export async function getWorkoutPlan(req, res, next) {
  return;
}

export async function patchWorkoutPlan(req, res, next) {
  return;
}

export async function getCustomWorkout(req, res, next) {
  return;
}

export async function postCustomWorkout(req, res, next) {
  return;
}

export async function patchCustomWorkout(req, res, next) {
  return;
}

export async function deleteCustomWorkout(req, res, next) {
  return;
}

export async function postLogWorkout(req, res, next) {
  try {
    const user = req?.user;
    const workoutLog = req?.body?.data?.log;

    if (!user || !workoutLog) {
      throw new AppError("WorkoutLog Data Malformed", 400, "BAD_DATA");
    }

    const { events, newXp, xpPerCategory } = await userService.logWorkout(
      user,
      workoutLog
    );

    return res.status(201).json({
      data: {
        events,
        userGainedXP: newXp,
        muscleCategoryGainedXP: xpPerCategory,
      },
      message: "User workout succesfully logged!",
    });
  } catch (err) {
    next(err);
  }
}

export default {
  getProfile,
  patchProfile,
  deleteAccount,
  getHistory,
  getHistoryPaginated,
  getWorkoutPlan,
  patchWorkoutPlan,
  getCustomWorkout,
  postCustomWorkout,
  patchCustomWorkout,
  deleteCustomWorkout,
  postLogWorkout,
};
