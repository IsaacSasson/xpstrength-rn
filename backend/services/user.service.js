import mapSequelizeError from "../utils/mapSequelizeError.js";
import AppError from "../utils/AppError.js";
import { User } from "../models/index.js";
import { sequelize } from "../config/db.config.js";
import AppHistory from "../utils/AddHistory.js";

export async function getProfileData(input_data) {
  return;
}

export async function setProfileData(input_data) {
  return;
}

export async function deleteAccount(input_data) {
  return;
}

export async function getHistory(input_data, paginated = false) {
  return;
}

export async function workoutPlan(input_data) {
  return;
}

export async function setWorkoutPlan(input_data) {
  return;
}

export async function customWorkouts(input_data) {
  return;
}

export async function createCustomWorkout(input_data) {
  return;
}

export async function setCustomWorkouts(input_data) {
  return;
}

export async function deleteCustomWorkout(input_data) {
  return;
}

export async function logWorkout(input_data) {
  return;
}

export default {
  getProfileData,
  setProfileData,
  deleteAccount,
  getHistory,
  workoutPlan,
  setWorkoutPlan,
  customWorkouts,
  createCustomWorkout,
  setCustomWorkouts,
  deleteCustomWorkout,
  logWorkout,
};
