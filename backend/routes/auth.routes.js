import { Router } from "express";
import error from "../middleware/error.middleware.js";
import { postRegister } from "../controllers/auth.controller.js";

const authRouter = Router()

authRouter.post("/register", postRegister, error);

export default authRouter