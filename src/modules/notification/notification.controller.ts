import type { Request, Response } from "express";
import { notificationService } from "./notification.service";
import { notificationQuerySchema } from "./notification.schema";
import type { AuthenticatedRequest } from "../../middlewares/auth";

export const notificationController = {
  list: async (req: AuthenticatedRequest, res: Response) => {
    if (!req.user) {
      return res.status(401).json({ status: 401, message: "Unauthorized" });
    }

    const parsed = notificationQuerySchema.safeParse(req.query);

    if (!parsed.success) {
      return res.status(400).json({
        status: 400,
        message: "Invalid query parameters",
        errors: parsed.error.flatten().fieldErrors,
      });
    }

    const result = await notificationService.list(req.user.id, parsed.data);

    return res.json({
      status: 200,
      message: "success",
      ...result,
    });
  },

  unreadCount: async (req: AuthenticatedRequest, res: Response) => {
    if (!req.user) {
      return res.status(401).json({ status: 401, message: "Unauthorized" });
    }

    const count = await notificationService.unreadCount(req.user.id);

    return res.json({ status: 200, message: "success", data: { count } });
  },

  markAsRead: async (req: AuthenticatedRequest, res: Response) => {
    const { id } = req.params;

    if (!req.user) {
      return res.status(401).json({ status: 401, message: "Unauthorized" });
    }

    await notificationService.markAsRead(Number(id), req.user.id);
    return res.json({ status: 200, message: "success" });
  },

  markAllAsRead: async (req: AuthenticatedRequest, res: Response) => {
    if (!req.user) {
      return res.status(401).json({ status: 401, message: "Unauthorized" });
    }

    await notificationService.markAllAsRead(req.user.id);
    return res.json({ status: 200, message: "success" });
  },

  remove: async (req: AuthenticatedRequest, res: Response) => {
    const { id } = req.params;

    if (!req.user) {
      return res.status(401).json({ status: 401, message: "Unauthorized" });
    }

    await notificationService.remove(Number(id), req.user.id);
    return res.json({ status: 200, message: "success" });
  },
};
