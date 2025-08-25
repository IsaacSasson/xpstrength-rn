import mapSequelizeError from "../utils/mapSequelizeError.js";
import AppError from "../utils/AppError.js";
import {
  Milestone,
  WorkoutPlan,
  WorkoutLog,
  User,
  Friend,
  Streak,
  Goal,
} from "../models";
import buckets from "../io/state/buckets.js";
import milestoneAddXP from "../utils/xpSystem.js";
import milestoneTable from "../../shared/milestones.json" with { type: "json"};
import { fn, col } from "sequelize";

//User gets their unlocked milestones
export async function getMilestones(user) {
  try {
    const rows = await Milestone.findAll({
      where: { userId: user.id },
      attributes: ["milestone"], 
      order: [["milestone", "ASC"]],
      raw: true,
    });
    return rows; 
  } catch (err) {
    throw mapSequelizeError(err);
  }
}

//We get the milestone data for users
export async function getMilestoneData() {
  try {
  const [rows, totalUsers] = await Promise.all([
    Milestone.findAll({
      attributes: [
        "milestone",
        [fn("COUNT", col("id")), "usersUnlocked"],
      ],
      group: ["milestone"],
      order: [["milestone", "ASC"]],
      raw: true,
    }),
    User.count(),
  ]);
  return {
    totalUsers,
    counts: rows.map(r => ({ milestone: Number(r.milestone), usersUnlocked: Number(r.usersUnlocked) })),
  };
} catch (err) {
  throw mapSequelizeError(err);
}
}


export async function uploadMilestonePhoto(user, photo, milestoneId) {
try {
  const milestone = await Milestone.findOne(
    {where: 
    {userId: user.id, milestone: milestoneId}
  })

  if (!milestone) {
    throw new AppError("Milestone is not unlocked for user", 400, "BAD_DATA");
  }

  milestone.image = photo;
  milestone.save();

  return
} catch (err) {

}
}

export async function evaluateAndAwardMilestones(user, milestoneIds = [], opts = {}) {
  const { now = new Date(), zone = "America/New_York" } = opts;
  const bucket = buckets.get(user.id) ?? null;

  try {
    return await sequelize.transaction(async (t) => {
      // ---------- 1) PRELOAD DATA ----------
      // Put all heavy reads you’ll need inside here so downstream checks are cheap.

      //TODO

      // ---------- 2) LOAD OWNED + CLEAN INPUT ----------
      const ownedRows = await Milestone.findAll({
        where: { userId: user.id },
        attributes: ["milestone"],
        transaction: t,
        lock: t.LOCK.UPDATE,
        raw: true,
      });
      const owned = new Set(ownedRows.map(r => Number(r.milestone)));

      const candidates = Array.from(
        new Set(
          (milestoneIds || [])
            .map(n => Number(n))
            .filter(Number.isFinite)
            .filter(id => id >= 0)
        )
      ).filter(id => !owned.has(id));

      for (const id of candidates) {
        let passed = false;

        switch (id) {
          //TODO WITH MILESTONE ID
          default:
            // Unknown milestone id → skip
            passed = false;
            break;
          }

          if (!passed) continue;

          //Create Milestone Object
          const [row, created] = await Milestone.findOrCreate({
            where: { userId: user.id, milestone: id },
            defaults: {
              userId: user.id,
              milestone: id,
            },
            transaction: t,
            lock: t.LOCK.UPDATE,
          });

        if (!created) {
          continue;
        }
        await milestoneAddXP(user, id, milestoneTable[id].xp, bucket);
      }
    });
    } catch(err) {
        throw mapSequelizeError(err)
    }
}

//Unique Milestone checkers Below

export default {
  getMilestones,
  getMilestoneData,
  uploadMilestonePhoto,
  evaluateAndAwardMilestones,
};
