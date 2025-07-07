import { Router } from "express";
import error from "../middleware/error.middleware.js";
import { postRegister, postForgotPassword, postResetPassword } from "../controllers/auth.controller.js";

const authRouter = Router()

authRouter.post("/register", postRegister, error);

authRouter.post("/forgotPassword", postForgotPassword, error);

authRouter.post("/resetPassword", postResetPassword, error);

export default authRouter