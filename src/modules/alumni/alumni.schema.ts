import { z } from "zod";

export const createAlumniSchema = z.object({
  name: z.string().min(1),
  email: z.string().email().optional().nullable(),
  password: z.string().min(6).optional().nullable(),
  contactNumber: z.string().min(1).optional().nullable(),
  graduationYear: z.number().int().min(1900).max(2100),
  degree: z.string().min(1).optional().nullable(),
  specialization: z.string().min(1).optional().nullable(),
  institution: z.string().min(1).optional().nullable(),
  photo: z.string().min(1).optional().nullable(),
  photoPublicId: z.string().min(1).optional().nullable(),
});

export const updateAlumniSchema = z.object({
  name: z.string().min(1).optional(),
  email: z.string().email().optional().nullable(),
  password: z.string().min(6).optional().nullable(),
  contactNumber: z.string().min(1).optional().nullable(),
  graduationYear: z.number().int().min(1900).max(2100).optional(),
  degree: z.string().min(1).optional().nullable(),
  specialization: z.string().min(1).optional().nullable(),
  institution: z.string().min(1).optional().nullable(),
  photo: z.string().min(1).optional().nullable(),
  photoPublicId: z.string().min(1).optional().nullable(),
  status: z.number().int().optional(),
  isApproved: z.boolean().optional(),
});

export const alumniQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  perPage: z.coerce.number().int().min(1).max(100).default(12),
  q: z.string().optional(),
  graduationYear: z.coerce.number().int().optional(),
  specialization: z.string().optional(),
  sort: z.enum(["name_asc", "name_desc", "year_asc", "year_desc", "newest"]).default("newest"),
  approved: z.enum(["true", "false", "all"]).optional(),
});

export const alumniRegisterSchema = z.object({
  name: z.string().min(1),
  email: z.string().email(),
  password: z.string().min(6),
  contactNumber: z.string().min(1).optional().nullable(),
  graduationYear: z.number().int().min(1900).max(2100),
  degree: z.string().min(1).optional().nullable(),
  specialization: z.string().min(1).optional().nullable(),
  institution: z.string().min(1).optional().nullable(),
});

export const alumniLoginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

export type CreateAlumniRequest = z.infer<typeof createAlumniSchema>;
export type UpdateAlumniRequest = z.infer<typeof updateAlumniSchema>;
export type AlumniQueryRequest = z.infer<typeof alumniQuerySchema>;
export type AlumniRegisterRequest = z.infer<typeof alumniRegisterSchema>;
export type AlumniLoginRequest = z.infer<typeof alumniLoginSchema>;
