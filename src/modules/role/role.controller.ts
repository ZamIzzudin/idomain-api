import type { Request, Response } from "express";
import type { AuthenticatedRequest } from "../../middlewares/auth";
import { roleService } from "./role.service";
import { createRoleSchema, updateRoleSchema } from "./role.schema";

export const roleController = {
  list: async (_req: AuthenticatedRequest, res: Response) => {
    const items = await roleService.list();
    return res.json({ status: 200, message: "success", items });
  },

  permissions: async (_req: AuthenticatedRequest, res: Response) => {
    const items = await roleService.permissions();
    return res.json({ status: 200, message: "success", items });
  },

  create: async (req: AuthenticatedRequest, res: Response) => {
    const parsed = createRoleSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({
        status: 400,
        message: "Invalid payload",
        errors: parsed.error.flatten().fieldErrors,
      });
    }
    try {
      const role = await roleService.create(parsed.data);
      return res.status(201).json({ status: 201, message: "success", data: role });
    } catch (error: any) {
      return res.status(400).json({ status: 400, message: error.message });
    }
  },

  update: async (req: AuthenticatedRequest, res: Response) => {
    const { id } = req.params;
    const parsed = updateRoleSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({
        status: 400,
        message: "Invalid payload",
        errors: parsed.error.flatten().fieldErrors,
      });
    }
    try {
      const role = await roleService.update(Number(id), parsed.data);
      return res.json({ status: 200, message: "success", data: role });
    } catch (error: any) {
      return res.status(400).json({ status: 400, message: error.message });
    }
  },

  remove: async (req: AuthenticatedRequest, res: Response) => {
    const { id } = req.params;
    try {
      await roleService.remove(Number(id));
      return res.json({
        status: 200,
        message: `Successfully removed role ${id}`,
      });
    } catch (error: any) {
      return res.status(400).json({ status: 400, message: error.message });
    }
  },
};
