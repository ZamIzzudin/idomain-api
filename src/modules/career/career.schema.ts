import { z } from "zod";

export const createCareerSchema = z.object({
  title: z.string().min(1),
  slug: z.string().optional(),
  institutionName: z.string().min(1),
  position: z.string().min(1),
  province: z.string().optional().nullable(),
  city: z.string().optional().nullable(),
  jobType: z.string().min(1),
  description: z.string().optional(),
  requirements: z.string().optional(),
  deadline: z.string().optional(),
  recruitmentEmail: z.string().email().optional().nullable(),
  recruitmentUrl: z.string().url().optional().nullable(),
  contactPerson: z.string().optional().nullable(),
  contactPhone: z.string().optional().nullable(),
  categoryId: z.number().int().min(1),
  status: z
    .enum(["DRAFT", "PENDING_REVIEW", "PUBLISHED", "CLOSED", "EXPIRED"])
    .optional(),
});

export const updateCareerSchema = z.object({
  title: z.string().min(1).optional(),
  slug: z.string().optional(),
  institutionName: z.string().min(1).optional(),
  position: z.string().min(1).optional(),
  province: z.string().optional().nullable(),
  city: z.string().optional().nullable(),
  jobType: z.string().min(1).optional(),
  description: z.string().optional().nullable(),
  requirements: z.string().optional().nullable(),
  deadline: z.string().optional().nullable(),
  recruitmentEmail: z.string().email().optional().nullable(),
  recruitmentUrl: z.string().url().optional().nullable(),
  contactPerson: z.string().optional().nullable(),
  contactPhone: z.string().optional().nullable(),
  categoryId: z.number().int().min(1).optional(),
  status: z
    .enum(["DRAFT", "PENDING_REVIEW", "PUBLISHED", "CLOSED", "EXPIRED"])
    .optional(),
  logo: z.string().nullable().optional(),
  logoPublicId: z.string().nullable().optional(),
});

export const careerQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(10),
  search: z.string().optional(),
  status: z
    .enum(["DRAFT", "PENDING_REVIEW", "PUBLISHED", "CLOSED", "EXPIRED"])
    .or(z.string().transform((v) => v.split(",").filter(Boolean)))
    .optional(),
  categoryId: z.coerce.number().int().optional(),
  category: z.string().optional(),
  jobType: z.string().optional(),
  province: z.string().optional(),
  city: z.string().optional(),
  authorId: z.coerce.number().int().optional(),
  sortOrder: z.enum(["asc", "desc"]).default("desc"),
});

export type CreateCareerRequest = z.infer<typeof createCareerSchema>;
export type UpdateCareerRequest = z.infer<typeof updateCareerSchema>;
export type CareerQueryRequest = z.infer<typeof careerQuerySchema>;
