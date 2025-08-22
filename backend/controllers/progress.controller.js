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

export async function getPersonalBest(req, res, next) {
  const user = req?.user ?? null;

  try {
    if (!user) {
      throw new AppError("Malfored user data.", 400, "BAD_DATA");
    }

    const PBData = await progressService.getPB(user);

    return res.status(200).json({
      data: {
        PBData,
      },
      message: "User succesfully retrieved their personal best data",
    });
  } catch (err) {
    next(err);
  }
}

export async function getStats(req, res, next) {
  const user = req?.user ?? null;

  try {
    if (!user) {
      throw new AppError("Malfored user data.", 400, "BAD_DATA");
    }

    const Stats = await progressService.getStats(user);

    return res.status(200).json({
      data: {
        Stats,
      },
      message: "User succesfully retrieved their Stats",
    });
  } catch (err) {
    next(err);
  }
}

export async function createGoal(req, res, next) {
  try {
    const user = req?.user ?? null;
    const body = req?.body ?? null;
    const name = body?.name ?? null;
    const type = body?.type ?? null;
    const details = body?.details ?? null;
    const total = body?.total ?? null;
    if (!user || !name || !type || !details || !total) {
      throw new AppError("Malformed goal data provided", 400, "BAD_DATA");
    }

    const goal = await progressService.createGoal(
      user,
      name,
      type,
      details,
      total
    );

    return res.status(201).json({
      data: {
        goal,
      },
      message: "Succesfully created a new goal!",
    });
  } catch (err) {
    next(err);
  }
}

export async function putGoal(req, res, next) {
  try {
    const user = req?.user ?? null;
    const body = req?.body ?? null;
    const id = body?.id ?? null;
    const name = body?.name ?? null;
    const type = body?.type ?? null;
    const details = body?.details ?? null;
    const total = body?.total ?? null;
    const current = body?.current ?? null;
    if (!user || !id) {
      throw new AppError("Malformed user data provided", 400, "BAD_DATA");
    }

    const goal = await progressService.updateGoal(
      user,
      id,
      name,
      type,
      details,
      total,
      current
    );

    return res.status(201).json({
      data: {
        goal,
      },
      message: "Succesfully updated old goal",
    });
  } catch (err) {
    next(err);
  }
}

export async function deleteGoal(req, res, next) {
  try {
    const user = req?.user ?? null;
    const id = req?.body?.id ?? null;

    if (!user || !id) {
      throw new AppError("Malformed user data provided", 400, "BAD_DATA");
    }
    await progressService.deleteGoal(user, id);

    return res.status(201).json({
      message: "Goal succesfully deleted",
    });
  } catch (err) {
    next(err);
  }
}

export async function getGoals(req, res, next) {
  try {
    const user = req?.user ?? null;
    if (!user) {
      throw new AppError("Malfored User Id", 400, "BAD_DATA");
    }

    const goals = await progressService.getGoals(user);

    return res.status(200).json({
      data: {
        goals,
      },
      message: "Succesfully retrived user goals",
    });
  } catch (err) {
    next(err);
  }
}

export default {
  getWorkoutHistory,
  getWorkoutHistoryPaginated,
  getPersonalBest,
  getStats,
  createGoal,
  getGoals,
  putGoal,
  deleteGoal,
};
