import { Router } from "express"
import healthRouter from "./health.routes.js"

const v1Router = Router();

//No Auth Required
v1Router.use("/health", healthRouter);

//Auth Required

export default v1Router;