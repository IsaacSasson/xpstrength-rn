import { User, WorkoutLog, PersonalBest, Stats } from "../models/index.js";
import AddHistory from "./AddHistory.js";
import { sequelize } from "../config/db.config.js";
import AddEvent from "./AddEvent.js";
import exerciseJson from "../../shared/exercises.json" with { type: "json" };
import AppError from "./AppError.js";

const userLevelUpRewards = { coins: 100 };

const muscleLevelUpRewards = {
  chest: 300,
  legs: 350,
  back: 250,
  core: 300,
  biceps: 400,
  triceps: 400,
  shoulders: 500,
};

const personalBestsRewards = { pb: 100, firstTime: 20 };

const baseUser = 120;
const under30 = 0.9;
const under60 = 1;
const under90 = 1.2;
const max = 1.5;

/**
 * @param {import("../models").User} user
 * @param {import("../models").WorkoutLog} workout
 */
export async function workoutAddXP(user, workout) {
  const userId = user.id;
  const length = workout.length;
  const workoutId = workout.id;
  const baseMultiplier =
    length > 90 * 60
      ? max
      : length > 60 * 60
      ? under90
      : length > 30 * 60
      ? under60
      : under30;
  const baseXP = baseUser * baseMultiplier;

  const exercises = workout.exercises;
  const userStats = await Stats.findOne({ where: { userId } });
  if (!userStats)
    throw new AppError("STATS not found for user", 400, "BAD_DATA");

  const userPB = await PersonalBest.findOne({ where: { userId } });
  if (!userPB)
    throw new AppError("PB records not found for user", 400, "BAD_DATA");

  let muscleLevelUpXP = 0;
  let pbLevelUpXP = 0;
  let events = [];

  for (const exerciseLog of exercises) {
    muscleLevelUpXP += await addXpToCoreMuscle(
      exerciseLog,
      userStats,
      userId,
      events,
      workoutId
    );
    pbLevelUpXP += await addXpFromNewPB(
      exerciseLog,
      userPB,
      events,
      workoutId,
      userId
    );
  }

  const newXp = baseXP + pbLevelUpXP + muscleLevelUpXP;
  const oldXp = user.xp;
  const totalXp = Math.round(newXp + oldXp);
  const oldLevel = user.level;
  let newLevel = oldLevel;
  let userCoins = user.totalCoins;

  await sequelize.transaction(async (t) => {
    while (totalXp >= (await totalXpForUserLevel(newLevel + 1))) {
      newLevel += 1;
      userCoins += userLevelUpRewards.coins;

      const newEvent = new AddEvent(userId, "userLevelUp", null, workoutId, {
        newLevel,
        rewards: userLevelUpRewards,
      });

      const history = new AddHistory(
        "USER",
        `User successfully leveled up to level ${newLevel}`,
        userId,
        null
      );
      await history.log(t);
      const event = await newEvent.forward(t);
      events.push(event);
    }

    user.xp = totalXp;
    user.level = newLevel;
    user.totalCoins = userCoins;
    await user.save({ transaction: t });
  });

  return events;
}

export async function addXpToCoreMuscle(
  exerciseLog,
  stats,
  userId,
  events,
  workoutId
) {
  const reps = exerciseLog.reps;
  const sets = exerciseLog.sets;
  const weight = exerciseLog.weight;
  const cooldown = exerciseLog.cooldown;
  const exerciseId = Number(exerciseLog.exercise);

  if (
    !Number.isInteger(exerciseId) ||
    exerciseId < 0 ||
    exerciseId >= exerciseJson.length
  ) {
    throw new AppError("Invalid exercise ID", 400, "BAD_DATA");
  }

  const volume = reps * sets * weight;
  const scaledVolume = Math.max(volume * (60 / cooldown), volume);

  const muscleCategory = exerciseJson[exerciseId].muscleCategory.toLowerCase();
  const oldXp = stats[muscleCategory].xp;
  const oldLevel = stats[muscleCategory].level;
  const totalXp = oldXp + Math.round(scaledVolume);

  let newLevel = oldLevel;
  let userXp = 0;

  await sequelize.transaction(async (t) => {
    while (totalXp >= (await totalXpForMuscleLevel(newLevel + 1))) {
      newLevel += 1;
      const reward = Math.round(
        muscleLevelUpRewards[muscleCategory] * (newLevel / 15)
      );
      userXp += reward;

      const newEvent = new AddEvent(userId, "muscleLevelUp", null, workoutId, {
        newLevel,
        type: muscleCategory,
        rewards: { userXP: reward },
      });

      const history = new AddHistory(
        "USER",
        `User successfully leveled up ${muscleCategory} to level ${newLevel}`,
        userId,
        null
      );
      await history.log(t);
      const event = await newEvent.forward(t);
      events.push(event);
    }

    stats[muscleCategory].xp = totalXp;
    stats[muscleCategory].level = newLevel;
    stats[muscleCategory].volume += volume;
    stats[muscleCategory].weight += weight;
    stats[muscleCategory].reps += reps;
    stats.total.sets += sets;
    stats.total.reps += reps;
    stats.total.weight += weight;

    await stats.save({ transaction: t });
  });

  return userXp;
}

export async function addXpFromNewPB(
  exerciseLog,
  pb,
  events,
  workoutId,
  userId
) {
  const exerciseId = Number(exerciseLog.exercise);
  const weight = exerciseLog.weight;
  const personalBests = pb.personalBests
  const cmp = personalBests[exerciseId] ?? null;

  const firstTimeReward = personalBestsRewards.firstTime;
  const pbReward = personalBestsRewards.pb;

  if (cmp === null) {
    await sequelize.transaction(async (t) => {
      personalBests[exerciseId] = workoutId;
      pb.personalBests = personalBests
      await pb.save({ transaction: t });

      const newEvent = new AddEvent(
        userId,
        "firstTimeCompletingExercise",
        null,
        workoutId,
        { exerciseId, log: exerciseLog, rewards: { userXp: firstTimeReward } }
      );

      const history = new AddHistory(
        "USER",
        `User completed exercise for the first time (ID ${exerciseId})`,
        userId,
        null
      );
      await history.log(t);
      const event = await newEvent.forward(t);
      events.push(event);
    });
    return firstTimeReward;
  }

  const cmpWorkoutLog = await WorkoutLog.findOne({
    where: { id: cmp, userId },
  });
  const cmpExerciseLog = cmpWorkoutLog?.exercises[exerciseId];

  if (!cmpExerciseLog) {
    throw new AppError("Unknown workoutLog stored in PB", 400, "BAD_DATA");
  }

  if (cmpExerciseLog.weight < weight) {
    await sequelize.transaction(async (t) => {
      pb[exerciseId] = workoutId;
      await pb.save({ transaction: t });

      const newEvent = new AddEvent(
        userId,
        "newPersonalBest",
        null,
        workoutId,
        {
          exerciseId,
          log: exerciseLog,
          oldLog: cmpExerciseLog,
          rewards: { userXp: pbReward },
        }
      );

      const history = new AddHistory(
        "USER",
        `User achieved a new personal best for exercise ID ${exerciseId}`,
        userId,
        null
      );
      await history.log(t);
      const event = await newEvent.forward(t);
      events.push(event);
    });
    return pbReward;
  } else {
    return 0;
  }
}

export async function milestoneAddXP(user, milestone) {
  return;
}

export async function steakAddXP(user) {
  return;
}

export async function userXpDelta(level) {
  const B = 100;
  const G = 1.1;
  const A = 0.6;
  const C = 0.1;
  const CAP = 7200;
  const K = 7200;

  const boost = 1 + A * Math.exp(-C * (level - 1));
  const raw = B * Math.pow(G, level - 1) * boost;

  return Math.floor((raw * CAP) / (raw + K));
}

export async function muscleXpDelta(M) {
  const level = Math.min(Math.max(Math.floor(M), 1), 1000);
  const a = 2000;
  const E = 0.25;
  const B2 = 120;
  const H = 1.17;
  const Km = 20000;
  const CAP2 = 20000;

  const linPart = a * level * Math.exp(-E * (level - 1));
  const expPart =
    B2 * Math.pow(H, level - 1) * (1 - Math.exp(-E * (level - 1)));
  const raw = linPart + expPart;
  return Math.floor((CAP2 * raw) / (raw + Km));
}

export async function totalXpForUserLevel(level) {
  let total = 0;
  for (let L = 1; L <= level; L++) {
    total += await userXpDelta(L);
  }
  return total;
}

export async function totalXpForMuscleLevel(level) {
  let total = 0;
  for (let L = 1; L <= level; L++) {
    total += await muscleXpDelta(L);
  }
  return total;
}
