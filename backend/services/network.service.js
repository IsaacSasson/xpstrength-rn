import mapSequelizeError from "../utils/mapSequelizeError.js";
import AppError from "../utils/AppError.js";
import { User, Auth } from "../models/index.js";
import { sequelize } from "../config/db.config.js";
import AppHistory from "../utils/AddHistory.js";
import { generateWebSocketToken } from "../utils/security.js";

//Logs user out and unauthorizes them
export async function logoutUser(res, userId) {
  try {
    //Remove refresh token

    await sequelize.transaction(async (t) => {
      //Unauthorize them
      await Auth.unauthorize(userId, t);

      //Log
      const action = new AppHistory(
        "NETWORK",
        `user with id ${userId} logged out of their account`,
        userId,
        null
      );

      await action.log(t);

      return;
    });
    return;
  } catch (err) {
    throw mapSequelizeError(err);
  }
}

//Gives wsToken
export async function wsToken(user) {
  return await generateWebSocketToken(user);
}

export default { logoutUser, wsToken };
