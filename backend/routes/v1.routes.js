import { Router } from "express"
import healthRouter from "./health.routes.js"
import authRouter from "./auth.routes.js";

const v1Router = Router();

//No Auth Required
v1Router.use("/health", healthRouter);
v1Router.use("/auth", authRouter)

//Auth Required

export default v1Router;