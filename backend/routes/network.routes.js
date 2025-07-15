import { Router } from "express";
import {
  postLogoutUser,
  getWsToken,
} from "../controllers/network.controller.js";

const networkRouter = Router();

networkRouter.post("/logout", postLogoutUser);

networkRouter.get("/websocket-token", getWsToken);

export default networkRouter;
