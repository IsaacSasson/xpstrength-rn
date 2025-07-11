import { Router } from "express";
import { postRegister, postForgotPassword, patchResetPassword, postLogin, getAccessToken, postForgotUsername, getResetPassword } from "../controllers/auth.controller.js";

const authRouter = Router()

authRouter.post("/register", postRegister);

authRouter.post("/login", postLogin);

authRouter.get("/access-token", getAccessToken);

authRouter.post("/forgotUsername", postForgotUsername);

authRouter.post("/forgotPassword", postForgotPassword);

authRouter.patch("/resetPassword/:token", patchResetPassword);

authRouter.get("/resetPassword/:token", getResetPassword);

export default authRouter