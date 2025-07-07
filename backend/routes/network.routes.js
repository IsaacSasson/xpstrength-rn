import { Router } from "express";
import { postConnectWebsocket, postEventSync, postLogoutUser } from "../controllers/network.controller.js";

const networkRouter = Router()

networkRouter.post("/logout", postLogoutUser);

networkRouter.post("/sync", postEventSync)

networkRouter.post("/connect", postConnectWebsocket)

export default networkRouter