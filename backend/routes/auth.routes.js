import { Router } from "express";
import { postRegister, postForgotPassword, postResetPassword, postLogin, getAccessToken } from "../controllers/auth.controller.js";

const authRouter = Router()

authRouter.post("/register", postRegister);

authRouter.post("/login", postLogin);

authRouter.get("/access-token", getAccessToken);

authRouter.post("/forgotPassword", postForgotPassword);

authRouter.post("/resetPassword", postResetPassword);

export default authRouter