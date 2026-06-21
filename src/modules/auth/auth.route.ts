import { Router } from "express";
import { authController } from "./auth.controller";
import { isAuthenticated } from "../../middlewares/auth";
import {
  requirePermission,
  forbidSelfAction,
  forbidLastSuperadmin,
  forbidSelfDemote,
} from "../../middlewares/role";

export const authRouter = Router();

// Public
authRouter.post("/login", authController.login);

// Protected - self
authRouter.get("/me", isAuthenticated, authController.me);

// User management (RBAC guarded)
authRouter.get(
  "/list",
  isAuthenticated,
  requirePermission("user.view"),
  authController.userList
);
authRouter.post(
  "/register",
  isAuthenticated,
  requirePermission("user.create"),
  authController.register
);
authRouter.put(
  "/adjust/:id",
  isAuthenticated,
  requirePermission("user.update"),
  forbidSelfDemote,
  authController.adjust
);
authRouter.delete(
  "/takedown/:id",
  isAuthenticated,
  requirePermission("user.delete"),
  forbidSelfAction,
  forbidLastSuperadmin,
  authController.takedown
);
