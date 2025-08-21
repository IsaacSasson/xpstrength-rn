import { Router } from "express";
import healthRouter from "./health.routes.js";
import authRouter from "./auth.routes.js";
import authMiddle from "../middleware/auth.middleware.js";
import networkRouter from "./network.routes.js";
import userRouter from "./user.routes.js";
import progressRouter from "./progress.routes.js";
import error from "../middleware/error.middleware.js";

const v1Router = Router();

//No Auth Required
v1Router.use("/health", healthRouter);
v1Router.use("/auth", authRouter);

//Auth Required
v1Router.use("/network", authMiddle, networkRouter);
v1Router.use("/user", authMiddle, userRouter);
v1Router.use("/progress", authMiddle, progressRouter);

//Global Error Handling
v1Router.use(error);

export default v1Router;
