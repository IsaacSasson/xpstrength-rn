import mapSequelizeError from "../utils/mapSequelizeError.js";
import AppError from "../utils/AppError.js";
import { Spotlight, User, PersonalBest } from "../models/index.js";
import { sequelize } from "../config/db.config.js";
import AddHistory from "../utils/AddHistory.js";
import progressService from "./progress.service.js";

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
          //Update when you do Milestones
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
        equipped: equipped,
      });

      result = {
        id: newSpotlight.id,
        type: newSpotlight.type,
        display: exercise,
        equipped: newSpotlight.equipped,
      };
    } else if (type === "personalGoal") {
      //referenceID represents an ID of the usersGoal index 0 is the id of goal
      const userGoal = await progressService.updateGoal(user, referenceIds[0]);
      const newSpotlight = await Spotlight.create({
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

      //Update when you do milestones
      return;
    } else {
      throw new AppError(
        "Unknown type provided to create spotlight",
        400,
        "BAD_DATA"
      );
    }

    if (autoEquip) {
      //Call Update Profile for other users
    }
    return result;
  } catch (err) {
    throw mapSequelizeError(err);
  }
}

export async function deleteSpotlight(user, spotlightId) {
  try {
  } catch (err) {
    throw mapSequelizeError(err);
  }
}

export async function equipSpotlight(user, spotlightId) {
  try {
  } catch (err) {
    throw mapSequelizeError(err);
  }
}

export async function unequipSpotlight(user, spotlightId) {
  try {
  } catch (err) {
    throw mapSequelizeError(err);
  }
}
