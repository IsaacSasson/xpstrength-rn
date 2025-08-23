import mapSequelizeError from "../utils/mapSequelizeError.js";
import AppError from "../utils/AppError.js";
import { Spotlight, User, PersonalBest, Milestone } from "../models/index.js";
import { sequelize } from "../config/db.config.js";
import progressService from "./progress.service.js";

//Complete, fetches all possible spotlights a user has
export async function getSpotlights(user) {
  try {
    const spotlights = await Spotlight.findAll({
      where: { userId: user.id },
      raw: true,
    });

    const result = await Promise.all(
      spotlights.map(async (spotlight) => {
        const type = spotlight.type;
        let payload = "Failed to retrieve";
        if (type === "exercise") {
          payload = spotlight.payload;
        } else if (type === "personalGoal") {
          payload = await progressService.updateGoal(user, spotlight.goalId);
        } else if (type === "milestone") {
          payload = spotlight.payload;
          return;
        }
        return {
          type: spotlight.type,
          id: spotlight.id,
          display: payload,
          equipped: spotlight.equipped,
        };
      })
    );

    return result;
  } catch (err) {
    throw mapSequelizeError(err);
  }
}

//For websocket access only by server never allowed from user
export async function getEquippedSpotlights(userId) {
  try {
    const spotlights = await Spotlight.findAll({
      where: { userId, equipped: true },
      raw: true,
    });

    let result = await Promise.all(
      spotlights.map(async (spotlight) => {
        const type = spotlight.type;
        let payload = "Failed to retrieve";
        if (type === "exercise") {
          payload = spotlight.payload;
        } else if (type === "personalGoal") {
          payload = await progressService.updateGoal(userId, spotlight.goalId);
        } else if (type === "milestone") {
          payload = spotlight.payload;
          return;
        }
        return {
          type: spotlight.type,
          id: spotlight.id,
          display: payload,
          equipped: spotlight.equipped,
        };
      })
    );

    return result;
  } catch (err) {
    throw mapSequelizeError(err);
  }
}

//Do a check if autoEquip to emit event
//If a user updates their goal, the updated value should be reflected in the spotlight
export async function createSpotlight(user, referenceIds, type, autoEquip) {
  try {
    let equipped = autoEquip ? true : false;
    let newSpotlight = null;
    let result = null;
    if (type === "exercise") {
      //referenceId represent the exerciseObj ID from the user PB Index 0 is the exerciseID and index 1 is the workoutLog
      const userPB = await progressService.getPB(user);

      const exercise = userPB[referenceIds[0]];

      newSpotlight = await Spotlight.create({
        userId: user.id,
        type: type,
        workoutId: referenceIds[1],
        payload: { exerciseId: referenceIds[0], PR: exercise },
        equipped: equipped,
      });

      result = {
        id: newSpotlight.id,
        type: newSpotlight.type,
        display: newSpotlight.payload,
        equipped: newSpotlight.equipped,
      };
    } else if (type === "personalGoal") {
      //referenceID represents an ID of the usersGoal index 0 is the id of goal
      const userGoal = await progressService.updateGoal(user, referenceIds[0]);
      newSpotlight = await Spotlight.create({
        userId: user.id,
        type: type,
        goalId: referenceIds[0],
        equipped: equipped,
      });

      result = {
        id: newSpotlight.id,
        type: newSpotlight.type,
        display: userGoal,
        equipped: newSpotlight.equipped,
      };
    } else if (type === "milestone") {
      //referenceID represents the unique id of the milestone
      const mileStone = await Milestone.findOne({
        where: {
          userId: user.id,
          id: referenceIds[0],
          attributes: ["milestone, createdAt"],
          raw: true,
        },
      });

      if (!mileStone) {
        throw new AppError(
          "User does not have that milestone completed!",
          400,
          "BAD_DATA"
        );
      }

      newSpotlight = await Spotlight.create({
        userId: user.id,
        type: type,
        milestoneId: referenceIds[0],
        payload: {
          milestone: mileStone["milestone"],
          timestamp: mileStone["createdAt"],
        },
        equipped: equipped,
      });

      result = {
        id: newSpotlight.id,
        type: newSpotlight.type,
        display: newSpotlight,
        equipped: newSpotlight.equipped,
      };
    } else {
      throw new AppError(
        "Unknown type provided to create spotlight",
        400,
        "BAD_DATA"
      );
    }

    if (autoEquip) {
      console.log("Emitting Equipped");
    }
    return result;
  } catch (err) {
    throw mapSequelizeError(err);
  }
}

export async function deleteSpotlight(user, spotlightId) {
  try {
    const spotlight = await Spotlight.findOne({
      where: { userId: user.id, id: spotlightId },
    });

    if (!spotlight) {
      throw new AppError("Spotlight not found to delete", 400, "BAD_DATA");
    }
    if (spotlight.equipped) {
      console.log("Emitting Spotlight removed from equipped");
    }

    await spotlight.destroy();

    return;
  } catch (err) {
    throw mapSequelizeError(err);
  }
}

export async function equipSpotlight(user, spotlightId) {
  try {
    const spotlight = await Spotlight.findOne({
      where: { userId: user.id, id: spotlightId },
    });

    if (!spotlight) {
      throw new AppError("Spotlight not found to delete", 400, "BAD_DATA");
    }

    if (spotlight.equipped) {
      throw new AppError("Spotlight is already equipped");
    }

    spotlight.equipped = true;
    spotlight.save();

    console.log("Emitting Equipped");

    return;
  } catch (err) {
    throw mapSequelizeError(err);
  }
}

export async function unequipSpotlight(user, spotlightId) {
  try {
    const spotlight = await Spotlight.findOne({
      where: { userId: user.id, id: spotlightId },
    });

    if (!spotlight) {
      throw new AppError("Spotlight not found to delete", 400, "BAD_DATA");
    }

    if (!spotlight.equipped) {
      throw new AppError("Spotlight is already unequipped", 400, "BAD_DATA");
    }

    spotlight.equipped = false;
    spotlight.save();

    console.log("Emitting unequip");

    return;
  } catch (err) {
    throw mapSequelizeError(err);
  }
}

export default {
  getSpotlights,
  equipSpotlight,
  unequipSpotlight,
  deleteSpotlight,
  createSpotlight,
  getEquippedSpotlights,
};
