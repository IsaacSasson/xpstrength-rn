import { sequelize } from "../config/db.config.js";
import { Reports } from "../models/index.js";
import AppError from "../utils/AppError.js";
import mapSequelizeError from "../utils/mapSequelizeError.js";

export async function reportUser(reportObj, offenderId, userId) {
  try {
    await sequelize.transaction(async (t) => {
      await Reports.create(
        { userId, offenderId, report: reportObj },
        { transaction: t }
      );
    });
  } catch (err) {
    throw mapSequelizeError(err);
  }
}

export default { reportUser };
