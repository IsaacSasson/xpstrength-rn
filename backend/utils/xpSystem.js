import { User, WorkoutLog, PersonalBest, Stats } from "../models/index.js";
import AddHistory from "./AddHistory.js";
import { sequelize } from "../config/db.config.js";
import AddEvent from "./AddEvent.js";
import exerciseJson from "../../shared/exercises.json" with { type: "json" };
import AppError from "./AppError.js";

const userLevelUpRewards = { coins: 100 };

const muscleLevelUpRewards = {
  chest: 30,
  legs: 35,
  back: 25,
  core: 30,
  biceps: 40,
  triceps: 40,
  shoulders: 50,
};


const muscleXPScaler = {
  chest: 0.1,
  legs: 0.1,
  back: 0.1,
  core: 0.3,
  biceps: 0.3,
  triceps: 0.3,
  shoulders: 0.3,
};
const personalBestsRewards = { pb: 200, firstTime: 25 };

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
  let xpPerCategory = {};

  for (const exerciseLog of exercises) {
    const {userXp, xpGainedPerCategory} = await addXpToCoreMuscle(
      exerciseLog,
      userStats,
      userId,
      events,
      workoutId,
      xpPerCategory
    );

    xpPerCategory = xpGainedPerCategory;
    muscleLevelUpXP += userXp;

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

  return {events, newXp, xpPerCategory};
}

export async function addXpToCoreMuscle(
  exerciseLog,
  stats,
  userId,
  events,
  workoutId,
  xpGainedPerCategory
) {
  const sets = exerciseLog.sets.length
  let reps = 0
  let weight = 0
  for(const setObj of exerciseLog.sets) {
    reps += setObj.reps;
    weight += setObj.weight;
  }

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
  const muscleCategory = exerciseJson[exerciseId].muscleCategory.toLowerCase();
  
  //The max XP they can get for a workout is their volume but we decrease the amount by how long they rest
  //If someone benches 245 for 5 reps and 5 sets but they take a 5 min break we divide by that volume
  //We also scale it based on how big that muscle group is so it doesnt grow disproportianly compared to the weight
  const scaledVolume = Math.max(volume * (60 / Math.max(cooldown, 1)), volume) * muscleXPScaler[muscleCategory]

  //Return to the user xp gained per muscle category from the exercise
  xpGainedPerCategory = { ...xpGainedPerCategory, [exerciseId]: {[muscleCategory]: scaledVolume}}

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
    stats[muscleCategory].sets += sets;
    stats.total.sets += sets;
    stats.total.reps += reps;
    stats.total.weight += weight;

    stats.changed(muscleCategory, true);
    stats.changed('total', true);
    await stats.save({ transaction: t });
  });

  return {userXp, xpGainedPerCategory};
}

export async function addXpFromNewPB(
  exerciseLog,
  pb,
  events,
  workoutId,
  userId
) {
  const exerciseId = Number(exerciseLog.exercise);
  let weight = 0
  for(const setObj of exerciseLog.sets) {
    //Maximum Weight they lifted
    weight = Math.max(weight, setObj.weight);
  }
  const personalBests = pb.personalBests
  const cmp = personalBests[exerciseId] ?? null;

  const firstTimeReward = personalBestsRewards.firstTime;
  const pbReward = personalBestsRewards.pb;

  if (cmp === null) {
    await sequelize.transaction(async (t) => {
      personalBests[exerciseId] = workoutId;
      pb.changed("personalBests", true);
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


  const cmpExerciseLog = cmpWorkoutLog?.exercises.reduce( (acc, obj)=> {
    if(Number(obj.exercise) === exerciseId) {
      acc = obj
    }
    return acc;
  }, null)

  if (!cmpExerciseLog) {
    throw new AppError("Unknown workoutLog stored in PB", 400, "BAD_DATA");
  }
  
  let cmpWeight = 0
  for(const setObj of cmpExerciseLog.sets) {
    //Maximum Weight they lifted
    cmpWeight = Math.max(cmpWeight, setObj.cmpWeight);
  }

  if (cmpWeight < weight) {
    await sequelize.transaction(async (t) => {
      pb[exerciseId] = workoutId;
      pb.changed("personalBests", true);
      await pb.save({ transaction: t });

      const newEvent = new AddEvent(
        userId,
        "newPersonalBest",
        null,
        workoutId,
        {
          exerciseId,
          newWeight: weight,
          oldWeight: cmpWeight,
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

export async function milestoneAddXP(UserObj, milestoneId, milestoneReward, bucket) {
  try {
      let userId = UserObj.id;
      let user = await User.findOne({where: { id: userId}});
      const newXp = milestoneReward
      const oldXp = user.xp;
      const totalXp = Math.round(newXp + oldXp);
      const oldLevel = user.level;
      let newLevel = oldLevel;
      let userCoins = user.totalCoins;
      
      let events = []
      
      await sequelize.transaction(async (t) => {
        while (totalXp >= (await totalXpForUserLevel(newLevel + 1))) {
          newLevel += 1;
          userCoins += userLevelUpRewards.coins;

          events.push({newLevel, rewards: userLevelUpRewards})

          const history = new AddHistory(
            "USER",
            `User successfully leveled up to level ${newLevel}`,
            user.id,
            null
          );
          await history.log(t);
        }

        user.xp = totalXp;
        user.level = newLevel;
        user.totalCoins = userCoins;
        await user.save({ transaction: t });
      });

      if (bucket) {
        await EventService.createEvent(
          userId,
          "milestoneComplete",
          userId,
          milestoneId,
          {
            milestoneXPBonus: newXp,
          },
          bucket.sockets.values().next().value,
          true
        );
      } else {
        await EventService.createEvent(
          userId,
          "milestoneComplete",
          userId,
          milestoneId,
          {
            milestoneXPBonus: newXp,
          },
          null,
          false
        );
      }

      for (const event of events) {
        if (bucket) {
          await EventService.createEvent(
            userId,
            "userLevelUp",
            userId,
            streak.id,
            event,
            bucket.sockets.values().next().value,
            true
          );
        } else {
          await EventService.createEvent(
            userId,
            "userLevelUp",
            userId,
            streak.id,
            event,
            null,
            false
          );
        }
      }

      return;
    } catch (err) {
    console.log(err);
  }
}

export async function streakAddXP(user, bucket, streak) {
    try 
    {
      if (streak.currentStreak % 7 === 0 && streak.currentStreak !== 0) {

        const user = await User.findOne({where: { id: user.id}});

        let xpBonus = streak.currentStreak / 7;
        const userId = user.id;
        const baseXP = 100;
        const newXp = baseXP * xpBonus;
        console.log(newXp, oldXp);
        const oldXp = user.xp;
        const totalXp = Math.round(newXp + oldXp);
        const oldLevel = user.level;
        let newLevel = oldLevel;
        let userCoins = user.totalCoins;
        
        let events = []
        
        await sequelize.transaction(async (t) => {
          while (totalXp >= (await totalXpForUserLevel(newLevel + 1))) {
            newLevel += 1;
            userCoins += userLevelUpRewards.coins;

            events.push({newLevel, rewards: userLevelUpRewards})

            const history = new AddHistory(
              "USER",
              `User successfully leveled up to level ${newLevel}`,
              user.id,
              null
            );
            await history.log(t);
          }

          user.xp = totalXp;
          user.level = newLevel;
          user.totalCoins = userCoins;
          await user.save({ transaction: t });
        });

        if (bucket) {
          await EventService.createEvent(
            userId,
            "consistentStreakXP",
            userId,
            streak.id,
            {
              streakXPBonus: newXp,
            },
            bucket.sockets.values().next().value,
            true
          );
        } else {
          await EventService.createEvent(
            userId,
            "consistentStreakXP",
            userId,
            streak.id,
            {
              streakXPBonus: newXp,
            },
            null,
            false
          );
        }

        for (const event of events) {
          if (bucket) {
            await EventService.createEvent(
              userId,
              "userLevelUp",
              userId,
              streak.id,
              event,
              bucket.sockets.values().next().value,
              true
            );
          } else {
            await EventService.createEvent(
              userId,
              "userLevelUp",
              userId,
              streak.id,
              event,
              null,
              false
            );
          }
        }

        return;
      }
      return;
    } catch(err) {
      console.log(err);
    }
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
