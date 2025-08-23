import { Router } from "express";
import {
  getWorkoutHistory,
  getWorkoutHistoryPaginated,
  getPersonalBest,
  getStats,
  createGoal,
  getGoals,
  putGoal,
  deleteGoal,
  getSpotlights,
  createSpotlight,
  equipSpotlight,
  unequipSpotlight,
  deleteSpotlight,
} from "../controllers/progress.controller.js";
const progressRouter = Router();

//Returns array of all past workouts
progressRouter.get("/workout-history", getWorkoutHistory);

//Same thing but is paginated
progressRouter.get(
  "/workout-history/:page/:pageSize",
  getWorkoutHistoryPaginated
);

//Returns personal best Object
progressRouter.get("/pb", getPersonalBest);

//Returns muscle category stats that we tracked
progressRouter.get("/stats", getStats);

//Returns custom user Goals that user made
progressRouter.get("/goals", getGoals);

//Allows user to create a customGoal
progressRouter.post("/goal", createGoal);

//Allows user to update a customGoal
progressRouter.put("/goal", putGoal);

//Allows user to delete a customGoal
progressRouter.delete("/goal", deleteGoal);

//Returns user custom Spotlights they made from spotlight service
progressRouter.get("/spotlights", getSpotlights);

//Create new Spotlight
progressRouter.post("/spotlight", createSpotlight);

//Delete Spotlight
progressRouter.delete("/spotlight", deleteSpotlight);

//Equips a spotlight to a users active spotlight slots ( Can also create spotlight if it doesn't exist)
progressRouter.put("/equip-spotlight", equipSpotlight);

//Unequips a spotlight from a users active spotlight slots
progressRouter.put("/unequip-spotlight", unequipSpotlight);

//Gets list of milestones user has acomplished with attached images
//progressRouter.get("/milestones");

//Add Photo to user completed milestone
//progressRouter.post("/milestone");

export default progressRouter;
