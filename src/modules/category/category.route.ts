import { Router } from "express";
import { categoryController } from "./category.controller";
import { isAuthenticated } from "../../middlewares/auth";

export const categoryRouter = Router();

// Public
categoryRouter.get("/", categoryController.list);

// Protected - Admin only
categoryRouter.post("/", isAuthenticated, categoryController.create);
categoryRouter.put("/:id", isAuthenticated, categoryController.update);
categoryRouter.delete("/:id", isAuthenticated, categoryController.remove);
