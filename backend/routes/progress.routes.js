import { Router } from "express";

const progressRouter = Router();

//Returns array of all past workouts
progressRouter.get("/workout-history");

//Same thing but is paginated
progressRouter.get("/workout-history/:page/:pageSize");

//Returns personal best Object
progressRouter.get("/pb");

//Returns muscle category stats that we tracked
progressRouter.get("/stats");

//Returns custom user Goals that user made
progressRouter.get("/goal");

//Allows user to create a customGoal
progressRouter.post("/goal");

//Returns user custom Spotlights they made from spotlight service
progressRouter.get("/spotlights");

//Equips a spotlight to a users active spotlight slots ( Can also create spotlight if it doesn't exist)
progressRouter.post("/equip-spotlight");

//Unequips a spotlight from a users active spotlight slots
progressRouter.post("/unequip-spotlight");

//Gets list of milestones user has acomplished
progressRouter.get("/milestones");

export default Router;
