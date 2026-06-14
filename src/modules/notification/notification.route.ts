import { Router } from "express";
import { notificationController } from "./notification.controller";
import { isAuthenticated } from "../../middlewares/auth";

export const notificationRouter = Router();

notificationRouter.get("/", isAuthenticated, notificationController.list);
notificationRouter.get(
  "/unread-count",
  isAuthenticated,
  notificationController.unreadCount
);
notificationRouter.put(
  "/:id/read",
  isAuthenticated,
  notificationController.markAsRead
);
notificationRouter.put(
  "/read-all",
  isAuthenticated,
  notificationController.markAllAsRead
);
notificationRouter.delete(
  "/:id",
  isAuthenticated,
  notificationController.remove
);
