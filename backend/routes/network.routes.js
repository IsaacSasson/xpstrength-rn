import { Router } from "express";
import { postLogoutUser, getSocketToken } from "../controllers/network.controller.js";

const networkRouter = Router()

networkRouter.post("/logout", postLogoutUser);

networkRouter.post("/websocket-token", getSocketToken)


export default networkRouter