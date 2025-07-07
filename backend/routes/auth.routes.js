import { Router } from "express";
import { postRegister, postForgotPassword, postResetPassword, postLogin, postRefreshToken } from "../controllers/auth.controller.js";

const authRouter = Router()

authRouter.post("/register", postRegister);

authRouter.post("/login", postLogin);

authRouter.post("/refresh-token", postRefreshToken);

authRouter.post("/forgotPassword", postForgotPassword);

authRouter.post("/resetPassword", postResetPassword);

export default authRouter