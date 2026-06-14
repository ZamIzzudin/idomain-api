import type { Request, Response } from "express";
import { categoryService } from "./category.service";
import {
  createCategorySchema,
  updateCategorySchema,
  categoryQuerySchema,
} from "./category.schema";
import type { AuthenticatedRequest } from "../../middlewares/auth";

export const categoryController = {
  list: async (req: Request, res: Response) => {
    const parsed = categoryQuerySchema.safeParse(req.query);

    if (!parsed.success) {
      return res.status(400).json({
        status: 400,
        message: "Invalid query parameters",
        errors: parsed.error.flatten().fieldErrors,
      });
    }

    const items = await categoryService.list(parsed.data);

    return res.json({ status: 200, message: "success", data: items });
  },

  create: async (req: AuthenticatedRequest, res: Response) => {
    const parsed = createCategorySchema.safeParse(req.body);

    if (!parsed.success) {
      return res.status(400).json({
        status: 400,
        message: "Invalid payload",
        errors: parsed.error.flatten().fieldErrors,
      });
    }

    try {
      const category = await categoryService.create(parsed.data);
      return res.status(201).json({
        status: 201,
        message: "success",
        data: category,
      });
    } catch (error: any) {
      return res.status(400).json({
        status: 400,
        message: error.message,
      });
    }
  },

  update: async (req: AuthenticatedRequest, res: Response) => {
    const { id } = req.params;
    const parsed = updateCategorySchema.safeParse(req.body);

    if (!parsed.success) {
      return res.status(400).json({
        status: 400,
        message: "Invalid payload",
        errors: parsed.error.flatten().fieldErrors,
      });
    }

    try {
      const category = await categoryService.update(
        Number(id),
        parsed.data
      );
      return res.json({ status: 200, message: "success", data: category });
    } catch (error: any) {
      return res.status(400).json({
        status: 400,
        message: error.message,
      });
    }
  },

  remove: async (req: AuthenticatedRequest, res: Response) => {
    const { id } = req.params;

    try {
      await categoryService.remove(Number(id));
      return res.json({
        status: 200,
        message: `Successfully removed category ${id}`,
      });
    } catch (error: any) {
      return res.status(400).json({
        status: 400,
        message: error.message,
      });
    }
  },
};
