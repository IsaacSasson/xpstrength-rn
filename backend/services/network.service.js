import mapSequelizeError from "../utils/mapSequelizeError.js";
import AppError from "../utils/AppError.js";
import { User } from '../models/index.js';
import { sequelize } from '../config/db.config.js';
import AppHistory from '../utils/AddHistory.js'

//Logs user out and unauthorizes them
export async function logoutUser(input_information) {
    return;
}

export async function socketToken(input_information) {
    return
}

export default { logoutUser, socketToken }