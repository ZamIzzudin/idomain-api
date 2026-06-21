import { Router } from "express";
import { roleController } from "./role.controller";
import { isAuthenticated } from "../../middlewares/auth";
import { requirePermission } from "../../middlewares/role";

export const roleRouter = Router();

// All role routes require authentication
roleRouter.use(isAuthenticated);

// Read
roleRouter.get("/", requirePermission("role.view"), roleController.list);
roleRouter.get(
  "/permissions",
  requirePermission("role.view"),
  roleController.permissions
);

// Write
roleRouter.post("/", requirePermission("role.create"), roleController.create);
roleRouter.put("/:id", requirePermission("role.update"), roleController.update);
roleRouter.delete(
  "/:id",
  requirePermission("role.delete"),
  roleController.remove
);
