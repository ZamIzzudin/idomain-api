import { z } from "zod";

export const createCategorySchema = z.object({
  name: z.string().min(1),
  slug: z.string().optional(),
  type: z.enum(["KLINIS", "NON_KLINIS"]).optional(),
  sortOrder: z.number().int().optional(),
});

export const updateCategorySchema = z.object({
  name: z.string().min(1).optional(),
  slug: z.string().optional(),
  type: z.enum(["KLINIS", "NON_KLINIS"]).optional(),
  sortOrder: z.number().int().optional(),
});

export const categoryQuerySchema = z.object({
  type: z.enum(["KLINIS", "NON_KLINIS"]).optional(),
  sortOrder: z.enum(["asc", "desc"]).default("asc"),
});

export type CreateCategoryRequest = z.infer<typeof createCategorySchema>;
export type UpdateCategoryRequest = z.infer<typeof updateCategorySchema>;
export type CategoryQueryRequest = z.infer<typeof categoryQuerySchema>;
