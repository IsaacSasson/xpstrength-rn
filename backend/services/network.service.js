import mapSequelizeError from "../utils/mapSequelizeError";
import AppError from "../utils/AppError";
import { User } from '../models/index.js';
import { sequelize } from '../config/db.config.js';
import AppHistory from '../utils/AddHistory.js'

//Logs user out and unauthorizes them
export async function logoutUser(input_information) {
    return;
}

//Compares and checks users hash of user data from DB to their DB and sends them events to update the frontend
export async function eventChanges(input_information) {
    return
}

//Initializes a Websocket Connection with the User and Websocket Class
//Possibly handle all websocket stuff here, just connect calls Init?? future
export async function connectWS(params) {
    return
}

export default { logoutUser, userEventChanges, connectUserWS }