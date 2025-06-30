import { Router } from 'express';
import { healthCheck } from "../controllers/health.controller.js";
import error from '../middleware/error.middleware.js';

const healthRouter = Router();

healthRouter.get("/", healthCheck, error)

export default healthRouter