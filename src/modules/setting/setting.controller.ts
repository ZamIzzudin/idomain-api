import type { Request, Response } from "express";
import { settingService } from "./setting.service";
import { bulkUpsertSchema } from "./setting.schema";
import type { AuthenticatedRequest } from "../../middlewares/auth";

export const settingController = {
  list: async (_req: Request, res: Response) => {
    const settings = await settingService.list();

    return res.json({
      status: 200,
      message: "success",
      data: settings,
    });
  },

  listByCategory: async (req: Request, res: Response) => {
    const category = req.params.category as string;
    const settings = await settingService.listByCategory(category);

    return res.json({
      status: 200,
      message: "success",
      data: settings,
    });
  },

  get: async (req: Request, res: Response) => {
    const key = req.params.key as string;
    const setting = await settingService.get(key);

    if (!setting) {
      return res.status(404).json({ status: 404, message: "Setting not found" });
    }

    return res.json({ status: 200, message: "success", data: setting });
  },

  bulkUpsert: async (req: AuthenticatedRequest, res: Response) => {
    const parsed = bulkUpsertSchema.safeParse(req.body);

    if (!parsed.success) {
      return res.status(400).json({
        status: 400,
        message: "Invalid payload",
        errors: parsed.error.flatten().fieldErrors,
      });
    }

    try {
      const results = await settingService.bulkUpsert(parsed.data);
      return res.json({
        status: 200,
        message: "Settings saved successfully",
        data: results,
      });
    } catch (error: any) {
      return res.status(500).json({
        status: 500,
        message: error.message || "Failed to save settings",
      });
    }
  },

  remove: async (req: AuthenticatedRequest, res: Response) => {
    const key = req.params.key as string;

    try {
      await settingService.remove(key);
      return res.json({ status: 200, message: "Setting removed successfully" });
    } catch (error: any) {
      return res.status(400).json({
        status: 400,
        message: error.message || "Failed to remove setting",
      });
    }
  },
};
