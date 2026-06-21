import { z } from "zod";

export const loginSchema = z.object({
  username: z.string().min(1),
  password: z.string().min(1),
});

export const registerSchema = z.object({
  username: z.string().min(1),
  password: z.string().min(1),
  displayName: z.string().min(1).optional(),
  roleId: z.number().int().positive().optional(),
});

export const adjustSchema = z.object({
  username: z.string().min(1).optional(),
  displayName: z.string().min(1).optional(),
  password: z.string().min(1).optional(),
  roleId: z.number().int().positive().optional(),
  status: z.number().int().min(0).max(1).optional(),
});

export const userQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(10),
  search: z.string().optional(),
  roleId: z.coerce.number().int().positive().optional(),
  sortOrder: z.enum(["asc", "desc"]).default("desc"),
  sortBy: z.enum(["createdAt", "username", "displayName"]).default("createdAt"),
});

export type LoginRequest = z.infer<typeof loginSchema>;
export type RegisterRequest = z.infer<typeof registerSchema>;
export type AdjustRequest = z.infer<typeof adjustSchema>;
export type UserQueryRequest = z.infer<typeof userQuerySchema>;
