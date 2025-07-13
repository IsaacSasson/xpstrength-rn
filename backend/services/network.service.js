import mapSequelizeError from "../utils/mapSequelizeError.js";
import AppError from "../utils/AppError.js";
import { User, Auth } from "../models/index.js";
import { sequelize } from "../config/db.config.js";
import AppHistory from "../utils/AddHistory.js";

//Logs user out and unauthorizes them
export async function logoutUser(res, userId) {
  try {
    //Remove refresh token
    res.clearCookie("refreshToken", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      path: "/api/v1/auth/refresh-token",
    });
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
export async function wsToken(input_information) {
  return;
}

export default { logoutUser, wsToken };
