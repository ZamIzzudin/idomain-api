import { Router } from "express";
import { authController } from "./auth.controller";
import { isAuthenticated } from "../../middlewares/auth";

export const authRouter = Router();

// Public
authRouter.post("/login", authController.login);

// Protected
authRouter.get("/me", isAuthenticated, authController.me);
authRouter.get("/list", isAuthenticated, authController.userList);
authRouter.post("/register", isAuthenticated, authController.register);
authRouter.put("/adjust/:id", isAuthenticated, authController.adjust);
authRouter.delete("/takedown/:id", isAuthenticated, authController.takedown);
