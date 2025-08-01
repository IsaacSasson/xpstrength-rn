import { Router } from "express";
import { upload } from "../config/upload.config.js";

import {
  getProfilePicture,
  postProfilePicture,
  getProfile,
  patchProfile,
  deleteAccount,
  getHistory,
  getHistoryPaginated,
  getWorkoutPlan,
  putWorkoutPlan,
  getCustomWorkouts,
  postCustomWorkout,
  deleteCustomWorkout,
  postLogWorkout,
  putCustomWorkout,
  getExerciseHistory,
  postSaveNotes,
} from "../controllers/user.controller.js";

const userRouter = Router();

//Get your user profile Data
userRouter.get("/profile", getProfile);

//Update your user profile Data
userRouter.patch("/update-profile", patchProfile);

//Get Profile Picture
userRouter.get("/profile-pic", getProfilePicture);

//Save Profile Picture
userRouter.post("/profile-pic", upload.single("newPFP"), postProfilePicture);

//Delete your user Account
userRouter.delete("/delete-account", deleteAccount);

//Get Exercise History
userRouter.get("/exercise-history", getExerciseHistory);

//Save Notes for a specific exercise
userRouter.post("/save-notes/:exerciseId", postSaveNotes);

//Get your history ("Only of type USER, FRIEND, MILESTONE, or STATS") paginated by page and pageSize
userRouter.get("/history/:page/:pageSize", getHistoryPaginated);

//Get all your history ("Only of type USER, FRIEND, MILESTONE, or STATS")
userRouter.get("/history", getHistory);

//Get your weekly workout plan
userRouter.get("/workout-plan", getWorkoutPlan);

//Update your weekly workout plan
userRouter.put("/workout-plan", putWorkoutPlan);

//Get all custom workouts
userRouter.get("/custom-workouts", getCustomWorkouts);

//Create a new custom workout
userRouter.post("/custom-workout", postCustomWorkout);

//Update a previously made custom workout
userRouter.put("/custom-workout", putCustomWorkout);

//Delete a custom workout saved
userRouter.delete("/custom-workout", deleteCustomWorkout);

//User Logs a completed workout
userRouter.post("/log-workout", postLogWorkout);

export default userRouter;
