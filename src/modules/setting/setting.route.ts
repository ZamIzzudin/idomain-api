import { Router } from "express";
import { settingController } from "./setting.controller";
import { isAuthenticated } from "../../middlewares/auth";

export const settingRouter = Router();

// Public
settingRouter.get("/", settingController.list);
settingRouter.get("/category/:category", settingController.listByCategory);
settingRouter.get("/:key", settingController.get);

// Protected
settingRouter.put("/", isAuthenticated, settingController.bulkUpsert);
settingRouter.delete("/:key", isAuthenticated, settingController.remove);
