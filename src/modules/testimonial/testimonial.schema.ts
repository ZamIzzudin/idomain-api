import { z } from "zod";

export const createTestimonialSchema = z.object({
  name: z.string().min(1),
  institution: z.string().optional(),
  testimonial: z.string().min(1),
});

export const updateTestimonialSchema = z.object({
  name: z.string().min(1).optional(),
  institution: z.string().optional(),
  testimonial: z.string().min(1).optional(),
});

export const testimonialQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(10),
  search: z.string().optional(),
  sortOrder: z.enum(["asc", "desc"]).default("desc"),
});

export type CreateTestimonialRequest = z.infer<typeof createTestimonialSchema>;
export type UpdateTestimonialRequest = z.infer<typeof updateTestimonialSchema>;
export type TestimonialQueryRequest = z.infer<typeof testimonialQuerySchema>;
