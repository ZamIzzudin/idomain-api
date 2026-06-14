import { Router } from "express";
import { pushController } from "./push.controller";
import { isAuthenticated } from "../../middlewares/auth";

export const pushRouter = Router();

// Public
pushRouter.get("/vapid-public-key", pushController.vapidPublicKey);

// Protected
pushRouter.post("/subscribe", isAuthenticated, pushController.subscribe);
pushRouter.post("/unsubscribe", isAuthenticated, pushController.unsubscribe);
pushRouter.post("/test", isAuthenticated, pushController.test);
