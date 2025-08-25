import { Router } from "express";
import { upload } from "../config/upload.config.js";

import {
  getMilestoneData,
  getOwnedMilestones,
  uploadMilestonePhoto,
  getMilestoneImage,
} from "../controllers/milestone.controller.js";

const milestoneRouter = Router();

//Gets milestone data for every milestone currently at time of call
milestoneRouter.get("/milestone-data", getMilestoneData);

//Gets milestone user has already unlocked
milestoneRouter.get("/milestones", getOwnedMilestones);

//Allows user to post milestone image
milestoneRouter.post(
  "/milestone-image",
  upload.single("milestoneImage"),
  uploadMilestonePhoto
);

//Gets milestone Image for a specific owned milestone image Id
milestoneRouter.get("/:milestone/image", getMilestoneImage);
