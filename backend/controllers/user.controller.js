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
  const user = req?.user ?? null;
  const currentPassword = req?.body?.data?.currentPassword ?? null;
  const newPassword = req?.body?.data?.newPassword ?? null;
  const newUsername = req?.body?.data?.newUsername ?? null;
  const newEmail = req?.body?.data?.newEmail ?? null;
  const newPFP = req?.body?.data?.newPFP ?? null;
  try {
    if (!user) {
      throw new AppError("Malfored User ID", 400, "BAD_DATA");
    }
    const { newAccessToken, newProfile } = userService.patchProfile(
      user,
      currentPassword,
      newPassword,
      newUsername,
      newEmail,
      newPFP
    );

    return res.status(201).json({
      data: {
        newAccessToken: newAccessToken,
        newProfile: newProfile,
      },
      message: "Succesfully updated user profile!",
    });
  } catch (err) {
    next(err);
  }
}

export async function deleteAccount(req, res, next) {
  const user = req?.user ?? null;

  try {
    if (!user) {
      throw new AppError("Malfored user ID", 400, "BAD_DATA");
    }
    await userService.deleteAccount(user);

    return res.status(204).json({
      message: "User succesfully deleted.",
    });
  } catch (err) {
    next(err);
  }
}

export async function getHistory(req, res, next) {
  const user = req?.user ?? null;

  try {
    if (!user) {
      throw new AppError("Malfored user ID", 400, "BAD_DATA");
    }
    const history = await userService.getHistory(user, false);

    return res.status(200).json({
      data: {
        userHistory: history,
      },
      message: "User succesfully retrived their history!",
    });
  } catch (err) {
    next(err);
  }
}

export async function getHistoryPaginated(req, res, next) {
  const user = req?.user ?? null;
  const block = req?.params?.page ?? null;
  const blockSize = req?.params?.pageSize ?? null;
  console.log("Paginated Ran");
  try {
    if (!user || block == null || blockSize == null) {
      throw new AppError("Malfored request parameters.", 400, "BAD_DATA");
    }

    if (block < 0 || blockSize < 0) {
      throw new AppError("Page and/or Pagesize must be positive!");
    }
    const start = block * blockSize;
    const end = (block + 1) * blockSize;

    const history = await userService.getHistory(user, { start, end });

    return res.status(200).json({
      data: {
        userHistory: history,
      },
      message: "User succesfully retrived their paginated history!",
    });
  } catch (err) {
    next(err);
  }
}

export async function getWorkoutPlan(req, res, next) {
  const user = req?.user ?? null;

  try {
    if (!user) {
      throw new AppError("Malfored user ID", 400, "BAD_DATA");
    }

    const weeklyPlan = await userService.getWorkoutPlan(user);
    return res.status(200).json({
      data: {
        weeklyPlan: weeklyPlan,
      },
      message: "User succesfully their custom workout plans!",
    });
  } catch (err) {
    next(err);
  }
}

export async function putWorkoutPlan(req, res, next) {
  const user = req?.user ?? null;
  const newPlan = req?.body?.data?.newPlan ?? null;

  try {
    if (!user || !newPlan) {
      throw new AppError("Malfored data payload", 400, "BAD_DATA");
    }

    const weeklyPlan = await userService.setWorkoutPlan(user, newPlan);
    return res.status(200).json({
      data: {
        weeklyPlan: weeklyPlan,
      },
      message: "User succesfully updated their custom workout plans!",
    });
  } catch (err) {
    next(err);
  }
}

export async function getCustomWorkouts(req, res, next) {
  const user = req?.user ?? null;

  try {
    if (!user) {
      throw new AppError("Malfored user ID", 400, "BAD_DATA");
    }

    const customWorkouts = await userService.getCustomWorkouts(user);

    return res.status(200).json({
      data: {
        customWorkouts: customWorkouts,
      },
      message: "User succesfully retrieved all their custom workouts!",
    });
  } catch (err) {
    next(err);
  }
}

export async function postCustomWorkout(req, res, next) {
  const user = req?.user ?? null;
  const customWorkout = req?.body?.data?.exercises ?? null;
  const name = req?.body?.data?.name ?? null;
  try {
    if (!user || !customWorkout || !name) {
      throw new AppError("Malformed CustomWorkout Data", 400, "BAD_DATA");
    }
    const newCustomWorkout = await userService.createCustomWorkout(
      customWorkout,
      name,
      user
    );
    return res.status(201).json({
      data: {
        newCustomWorkout: newCustomWorkout,
      },
      message: "New CustomWorkout sucessfully created!",
    });
  } catch (err) {
    next(err);
  }
}

export async function putCustomWorkout(req, res, next) {
  const user = req?.user ?? null;
  const customWorkout = req?.body?.data?.exercises ?? null;
  const name = req?.body?.data?.name ?? null;
  const id = req?.body?.data?.id ?? null;
  try {
    if (!user || !customWorkout || !name || !id) {
      throw new AppError("Malformed CustomWorkout Data", 400, "BAD_DATA");
    }
    const updatedCustomWorkout = await userService.updateCustomWorkout(
      id,
      customWorkout,
      name,
      user
    );
    return res.status(201).json({
      data: {
        updatedCustomWorkout: updatedCustomWorkout,
      },
      message: `Successfully updated custom workout with id ${id}`,
    });
  } catch (err) {
    next(err);
  }
}

export async function deleteCustomWorkout(req, res, next) {
  const user = req?.user ?? null;
  const id = req?.body?.data?.id ?? null;
  try {
    if (!user || !id) {
      throw new AppError("Malformed CustomWorkout Data", 400, "BAD_DATA");
    }
    const newPlan = await userService.deleteCustomWorkout(id, user);
    return res.status(201).json({
      data: {
        newPlan: newPlan,
      },
      message: `Successfully deleted custom workout with id ${id} and returned new workoutPlan after customWorkout deleted.`,
    });
  } catch (err) {
    next(err);
  }
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

export async function getExerciseHistory(req, res, next) {
  const user = req?.user ?? null;

  try {
    if (!user) {
      throw new AppError("Malfored user data", 400, "BAD_DATA");
    }

    const exerciseHistory = await userService.getExerciseHistory(user);

    return res.status(200).json({
      data: {
        exerciseHistory,
      },
      message: "User succesfully retieved their exercise history.",
    });
  } catch (err) {
    next(err);
  }
}

export async function postSaveNotes(req, res, next) {
  const user = req?.user ?? null;
  const notes = req?.body?.data?.notes ?? null;
  const exerciseId = req?.params?.exerciseId;

  try {
    if (!user || !notes || !exerciseId) {
      throw new AppError(
        "Invalid ExerciseID, Note, or User DATA",
        400,
        "BAD_DATA"
      );
    }
    await userService.saveNotes(user, notes, exerciseId);
    return res.status(201).json({
      message: `User succesfully saved their note for exercise with id ${exerciseID}`,
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
  putWorkoutPlan,
  getCustomWorkouts,
  postCustomWorkout,
  putCustomWorkout,
  deleteCustomWorkout,
  postLogWorkout,
  getExerciseHistory,
  postSaveNotes,
};
