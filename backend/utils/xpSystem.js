import { User, WorkoutLog, PersonalBest, Stats } from "../models";
import AddHistory from "./AddHistory.js";
import { sequelize } from "../config/db.config.js";
import AddEvent from "./AddEvent.js";
import exerciseJson from '../../shared/exercises.json' with {type: "json"};

const userLevelUpRewards = {
  coins: 100,
};

const muscleLevelUpRewards = {
  chest: 300,
  legs: 350,
  back: 250,
  core: 300,
  biceps: 400,
  triceps: 400,
  shoulders: 500
}

const baseUser = 120;

const under30 = 0.9;
const under60 = 1;
const under90 = 1.2;
const max = 1.5;

/**
 * Muscle Level Ups, PR's, and BASE XP
 * @param {import("../models").User} user
 * @param {import("../models").WorkoutLog} workout
 */
export async function workoutAddXP(user, workout) {
  const userId = user.id;
  const length = workout.length;
  const baseMultipliyer =
    length > 90 * 60
      ? max
      : length > 60 * 60
      ? under90
      : length > 30 * 60
      ? under60
      : under30;
  const baseXP = baseUser * baseMultipliyer;

  const exercises = workout.exercises;

  const userStats = await Stats.findOne({ where: { userId } });
  const userPB = await PersonalBest.findOne({ where: { userId } });
  let muscleLevelUpXP = 0;
  let pbLevelUpXP = 0;

  let events = [];

  for (const exerciseLog of exercises) {
    muscleLevelUpXP += await addXpToCoreMuscle(exerciseLog, userStats, userId, events, workout.id);
    pbLevelUpXP += await addXpFromNewPB(exerciseLog, pb, events);
  }

  const newXp = baseXP + pbLevelUpXP + muscleLevelUpXP;
  const oldXp = user.xp;
  const totalXp = Math.round(newXp + oldXp);
  const oldLevel = user.level;
  let newLevel = oldLevel;
  let userCoins = user.totalCoins;

  //Keep Leveling Up User if Need Be
  await sequelize.transaction(async (t) => {
    while (totalXp < (await totalXpForUserLevel(newLevel + 1))) {
      newLevel += 1;
      userCoins += userLevelUpRewards.coins;

      //Event that user Leveled Up Here
      const event = new AddEvent(
        (userId = userId),
        (type = "userLevelUp"),
        (actordId = null),
        (resourceId = workout.id),
        (payload = { newLevel: newLevel, rewards: userLevelUpRewards })
      );

      events.push(event);

      const history = new AddHistory(
        (type = "USER"),
        (message = `User succesfully level'ed up to level ${newLevel}`),
        (userId = userId),
        (actorId = null)
      );

      await history.log(t);
      await event.forward(t);
    }

    user.xp = totalXp;
    user.level = newLevel;
    user.totalCoins = userCoins;
    await user.save({ transaction: t });
  });

  return events;
}

export async function addXpToCoreMuscle(exerciseLog, stats, userId, events, workoutId) {
  const reps = exerciseLog.reps;
  const sets = exerciseLog.sets;
  const weight = exerciseLog.weight;
  const id = exerciseLog.exercise;

  const volume = reps * sets * weight;

  const muscleCategory = exerciseJson[parseInt(id)].muscleCategory.toLowerCase()

  const oldXp = stats.muscleCategory.xp;
  const oldLevel = stats.muscleCategory.level;
  const totalXp = stats.muscleCategory.xp + Math.round(Math.max((volume * (60 / exerciseLog.cooldown), volume)))
  let newLevel = oldLevel;
  let userXp = 0;

   await sequelize.transaction(async (t) => {
    while (totalXp < (await totalXpForMuscleLevel(newLevel + 1))) {
      newLevel += 1;
      userXp += Math.round(muscleLevelUpRewards.muscleCategory * (newLevel / 15));

      //Event that muscle Leveled Up Here
      const event = new AddEvent(
        (userId = userId),
        (type = "muscleLevelUp"),
        (actordId = null),
        (resourceId = workoutId),
        (payload = { newLevel: newLevel, type: muscleCategory, rewards: { userXP: Math.round(muscleLevelUpRewards.muscleCategory * (newLevel / 15))} })
      );

      events.push(event);

      const history = new AddHistory(
        (type = "USER"),
        (message = `User succesfully level'ed up their muscleCategory level of ${muscleCategory} to ${newLevel}`),
        (userId = userId),
        (actorId = null)
      );

      await history.log(t);
      await event.forward(t);
    }

  stats.muscleCategory.xp = totalXp;
  stats.muscleCategory.level = newLevel;
  stats.muscleCategory += volume;
  stats.muscleCategory.weight += weight;
  stats.muscleCategory.reps += reps;
  stats.total.sets += sets;
  stats.total.reps += reps;
  stats.total.weight += weight;

  await stats.save( {transaction: t});
  
  })

  return userXp;
};

export async function addXpFromNewPB(exerciseLog, pb) {}

//TODO later for milestone adding xp
export async function milestoneAddXP(user, milestone) {
  return;
}

export async function userXpDelta(level) {
  const B = 100; // base XP
  const G = 1.1; // exponential growth factor
  const A = 0.6; // early‐level boost amplitude
  const C = 0.1; // boost decay rate
  const CAP = 7200; // asymptotic max ΔXP
  const K = 7200; // “half‐saturation” constant

  // 1) compute old boosted‐raw value
  const boost = 1 + A * Math.exp(-C * (level - 1));
  const raw = B * Math.pow(G, level - 1) * boost;

  // 2) saturate via:  f(raw) = CAP * raw / (raw + K)
  return Math.floor((raw * CAP) / (raw + K));
}

export async function muscleXpDelta(M) {
  // Clamp M into [1, 1000]
  const level = Math.min(Math.max(Math.floor(M), 1), 1000);

  // Internal tuning constants:
  const a = 2000; // linear slope
  const E = 0.25; // blend-rate (linear → exponential)
  const B = 120; // exponential base at M=1
  const H = 1.17; // exponential growth factor
  const Km = 20000; // half‑saturation constant
  const CAP = 20000; // asymptotic ceiling

  // 1) raw blend: linear component + exponential component
  const linPart = a * level * Math.exp(-E * (level - 1));
  const expPart = B * Math.pow(H, level - 1) * (1 - Math.exp(-E * (level - 1)));
  const raw = linPart + expPart;

  // 2) Michaelis–Menten saturation into [0, CAP]
  const delta = (CAP * raw) / (raw + Km);

  return Math.floor(delta);
}

export async function totalXpForUserLevel(level) {
  let total = 0;
  for (let L = 1; L <= level; L++) {
    let x = await userXpDelta(L);
    total += x;
  }
  return total;
}

export async function totalXpForMuscleLevel(level) {
  let total = 0;
  for (let L = 1; L <= level; L++) {
    let x = await muscleXpDelta(L);
    total += x;
  }
  return total;
}
