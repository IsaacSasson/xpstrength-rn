import { P } from "pino";
import userService from "../services/user.service";
import AppError from "../utils/AppError";

export async function getProfile(req, res, next) {
  return;
}

export async function patchProfile(req, res, next) {
  return;
}

export async function deleteAccount(req, res, next) {
  return;
}

export async function getHistory(req, res, next) {
  return;
}

export async function getHistoryPaginated(req, res, next) {
  return;
}

export async function getWorkoutPlan(req, res, next) {
  return;
}

export async function patchWorkoutPlan(req, res, next) {
  return;
}

export async function getCustomWorkout(req, res, next) {
  return;
}

export async function postCustomWorkout(req, res, next) {
  return;
}

export async function patchCustomWorkout(req, res, next) {
  return;
}

export async function deleteCustomWorkout(req, res, next) {
  return;
}

export async function postLogWorkout(req, res, next) {
  return;
}

export default {
  getProfile,
  patchProfile,
  deleteAccount,
  getHistory,
  getHistoryPaginated,
  getWorkoutPlan,
  patchWorkoutPlan,
  getCustomWorkout,
  postCustomWorkout,
  patchCustomWorkout,
  deleteCustomWorkout,
  postLogWorkout,
};
