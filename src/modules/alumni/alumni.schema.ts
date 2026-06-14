import { z } from "zod";

export const workHistorySchema = z.object({
  institutionName: z.string().min(1),
  startYear: z.number().int().min(1900).max(2100),
  endYear: z.number().int().min(1900).max(2100).optional().nullable(),
  province: z.string().min(1).optional().nullable(),
  city: z.string().min(1).optional().nullable(),
});

export const createAlumniSchema = z.object({
  name: z.string().min(1),
  email: z.string().email().optional().nullable(),
  password: z.string().min(6).optional().nullable(),
  contactNumber: z.string().min(1).optional().nullable(),
  graduationYear: z.number().int().min(1900).max(2100),
  batch: z.number().int().min(1900).max(2100).optional().nullable(),
  degreePrefix: z.string().min(1).optional().nullable(),
  degreeSuffix: z.string().min(1).optional().nullable(),
  specialization: z.string().min(1).optional().nullable(),
  province: z.string().min(1).optional().nullable(),
  city: z.string().min(1).optional().nullable(),
  photo: z.string().min(1).optional().nullable(),
  photoPublicId: z.string().min(1).optional().nullable(),
});

export const updateAlumniSchema = z.object({
  name: z.string().min(1).optional(),
  email: z.string().email().optional().nullable(),
  password: z.string().min(6).optional().nullable(),
  contactNumber: z.string().min(1).optional().nullable(),
  graduationYear: z.number().int().min(1900).max(2100).optional(),
  batch: z.number().int().min(1900).max(2100).optional().nullable(),
  degreePrefix: z.string().min(1).optional().nullable(),
  degreeSuffix: z.string().min(1).optional().nullable(),
  specialization: z.string().min(1).optional().nullable(),
  province: z.string().min(1).optional().nullable(),
  city: z.string().min(1).optional().nullable(),
  photo: z.string().min(1).optional().nullable(),
  photoPublicId: z.string().min(1).optional().nullable(),
  status: z.number().int().optional(),
  isApproved: z.boolean().optional(),
  emailVisible: z.boolean().optional(),
  contactNumberVisible: z.boolean().optional(),
  notifEnabled: z.boolean().optional(),
  notifReceiveAll: z.boolean().optional(),
  preferredCategories: z.array(z.string()).optional(),
});

export const alumniQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  perPage: z.coerce.number().int().min(1).max(100).default(12),
  q: z.string().optional(),
  graduationYear: z.coerce.number().int().optional(),
  specialization: z.string().optional(),
  province: z.string().optional(),
  city: z.string().optional(),
  sort: z.enum(["name_asc", "name_desc", "year_asc", "year_desc", "newest", "pending_first"]).default("newest"),
  approved: z.enum(["true", "false", "all"]).optional(),
});

export const alumniRegisterSchema = z.object({
  name: z.string().min(1),
  email: z.string().email(),
  password: z.string().min(6),
  contactNumber: z.string().min(1).optional().nullable(),
  graduationYear: z.number().int().min(1900).max(2100),
  batch: z.number().int().min(1900).max(2100).optional().nullable(),
  degreePrefix: z.string().min(1).optional().nullable(),
  degreeSuffix: z.string().min(1).optional().nullable(),
  specialization: z.string().min(1).optional().nullable(),
  province: z.string().min(1).optional().nullable(),
  city: z.string().min(1).optional().nullable(),
  photo: z.string().min(1).optional().nullable(),
});

export const alumniLoginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

export const alumniLookupSchema = z.object({
  name: z.string().min(1),
  batch: z.coerce.number().int().min(1900).max(2100),
});

export const alumniClaimSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
  contactNumber: z.string().min(1).optional().nullable(),
  degreePrefix: z.string().min(1).optional().nullable(),
  degreeSuffix: z.string().min(1).optional().nullable(),
  specialization: z.string().min(1).optional().nullable(),
  province: z.string().min(1).optional().nullable(),
  city: z.string().min(1).optional().nullable(),
  photo: z.string().min(1).optional().nullable(),
  batch: z.number().int().min(1900).max(2100).optional().nullable(),
});

export const createWorkHistorySchema = z.object({
  institutionName: z.string().min(1),
  startYear: z.number().int().min(1900).max(2100),
  endYear: z.number().int().min(1900).max(2100).optional().nullable(),
  province: z.string().min(1).optional().nullable(),
  city: z.string().min(1).optional().nullable(),
});

export const updateWorkHistorySchema = z.object({
  institutionName: z.string().min(1).optional(),
  startYear: z.number().int().min(1900).max(2100).optional(),
  endYear: z.number().int().min(1900).max(2100).optional().nullable(),
  province: z.string().min(1).optional().nullable(),
  city: z.string().min(1).optional().nullable(),
});

export type CreateAlumniRequest = z.infer<typeof createAlumniSchema>;
export type UpdateAlumniRequest = z.infer<typeof updateAlumniSchema>;
export type AlumniQueryRequest = z.infer<typeof alumniQuerySchema>;
export type AlumniRegisterRequest = z.infer<typeof alumniRegisterSchema>;
export type AlumniLoginRequest = z.infer<typeof alumniLoginSchema>;
export type CreateWorkHistoryRequest = z.infer<typeof createWorkHistorySchema>;
export type UpdateWorkHistoryRequest = z.infer<typeof updateWorkHistorySchema>;
export type AlumniLookupRequest = z.infer<typeof alumniLookupSchema>;
export type AlumniClaimRequest = z.infer<typeof alumniClaimSchema>;
