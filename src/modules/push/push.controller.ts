import type { Request, Response } from "express";
import { pushService } from "./push.service";
import { subscribeSchema } from "./push.schema";
import { getVapidPublicKey } from "../../lib/vapid";
import type { AuthenticatedRequest } from "../../middlewares/auth";

export const pushController = {
  vapidPublicKey: (_req: Request, res: Response) => {
    return res.json({
      status: 200,
      message: "success",
      data: { publicKey: getVapidPublicKey() },
    });
  },

  subscribe: async (req: AuthenticatedRequest, res: Response) => {
    if (!req.user) {
      return res.status(401).json({ status: 401, message: "Unauthorized" });
    }

    const parsed = subscribeSchema.safeParse(req.body);

    if (!parsed.success) {
      return res.status(400).json({
        status: 400,
        message: "Invalid payload",
        errors: parsed.error.flatten().fieldErrors,
      });
    }

    try {
      await pushService.subscribe(req.user.id, parsed.data);
      return res.json({ status: 200, message: "success" });
    } catch (error: any) {
      return res.status(400).json({
        status: 400,
        message: error.message || "Failed to subscribe",
      });
    }
  },

  unsubscribe: async (req: AuthenticatedRequest, res: Response) => {
    if (!req.user) {
      return res.status(401).json({ status: 401, message: "Unauthorized" });
    }

    const { endpoint } = req.body;

    if (!endpoint) {
      return res.status(400).json({
        status: 400,
        message: "Endpoint is required",
      });
    }

    try {
      await pushService.unsubscribe(req.user.id, endpoint);
      return res.json({ status: 200, message: "success" });
    } catch (error: any) {
      return res.status(400).json({
        status: 400,
        message: error.message || "Failed to unsubscribe",
      });
    }
  },

  test: async (req: AuthenticatedRequest, res: Response) => {
    if (!req.user) {
      return res.status(401).json({ status: 401, message: "Unauthorized" });
    }

    try {
      const count = await pushService.sendTest(req.user.id);
      return res.json({
        status: 200,
        message: `Test notification sent to ${count} subscription(s)`,
      });
    } catch (error: any) {
      return res.status(400).json({
        status: 400,
        message: error.message || "Failed to send test notification",
      });
    }
  },
};
