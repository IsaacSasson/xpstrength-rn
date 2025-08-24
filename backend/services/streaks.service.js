import { DateTime } from "luxon";
import { sequelize } from "../config/db.config.js";
import { Streak, WorkoutPlan } from "../models/index.js";
import AppError from "../utils/AppError.js";
import mapSequelizeError from "../utils/mapSequelizeError.js";
import EventService from "../services/eventsOutbox.service.js";
import { buckets } from "../io/state/buckets.js";
import { streakAddXP } from "../utils/xpSystem.js";

function gapDaysFromPrevRequired(plan, idx) {
  for (let d = 1; d <= 7; d++) {
    const j = (idx - d + 7) % 7;
    if (plan[j] !== -1) return d;
  }
  return 7;
}

export async function updateStreak(user, opts = {}) {
  const userId = user.id;

  const { now = new Date(), zone = "America/New_York" } = opts;
  const bucket = buckets.get(userId);
  try {
    const streak = await sequelize.transaction(async (t) => {
      // 1) Load plan
      const planRow = await WorkoutPlan.findOne({
        where: { userId },
        attributes: ["plan"],
        transaction: t,
      });

      if (
        !planRow ||
        !Array.isArray(planRow.plan) ||
        planRow.plan.length !== 7
      ) {
        throw new AppError("Invalid or missing workout plan", 400, "BAD-DATA");
      }
      const plan = planRow.plan;

      // 2) Load streak (locked)
      const streak = await Streak.findOne({
        where: { userId },
        transaction: t,
      });
      if (!streak) {
        throw new AppError("Streak not found", 400, "BAD_DATA");
      }

      const nowDT = DateTime.fromJSDate(now, { zone });
      const todayStart = nowDT.startOf("day");
      const todayIdx = todayStart.weekday - 1; // 0..6 (Mon..Sun)

      // If today is a rest day, no streak changes
      if (plan[todayIdx] === -1) {
        return streak;
      }

      // Idempotency: if we've already counted a workout today, do nothing
      const lastAtDT = DateTime.fromJSDate(streak.updatedAt ?? now, { zone });
      if (lastAtDT >= todayStart) {
        return streak;
      }

      // 3) Compute the single backward window that ended at start of today
      const gapDays = gapDaysFromPrevRequired(plan, todayIdx); // 1..7
      const windowEnd = todayStart; // start of today
      const windowStart = windowEnd.minus({ hours: 24 * gapDays });

      // 4) Decide streak based on whether last workout time falls in that window
      const continued = lastAtDT >= windowStart && lastAtDT < windowEnd;
      const nextStreak = continued ? streak.currentStreak + 1 : 1;

      streak.currentStreak = nextStreak;
      if (nextStreak > streak.highestStreak) {
        streak.highestStreak = nextStreak;
      }
      // Count today's workout now
      streak.set("updatedAt", now);

      await streak.save({
        transaction: t,
      });
      streakAddXP(user, bucket, streak);
      return streak;
    });

    return streak;
  } catch (err) {
    throw mapSequelizeError(err);
  }
}

export async function getStreakData(userId) {
  try {
    let StreakData = await Streak.findOne({
      where: { userId: userId },
      attributes: ["currentStreak", "highestStreak", "updatedAt"],
    });

    return {
      currentStreak: StreakData.currentStreak,
      highestStreak: StreakData.highestStreak,
      updatedAt: StreakData.updatedAt,
    };
  } catch (err) {
    throw mapSequelizeError(err);
  }
}

export default { getStreakData, updateStreak };
