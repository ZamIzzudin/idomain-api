import { z } from "zod";

export const createEventSchema = z.object({
  title: z.string().min(1),
  content: z.string().optional(),
  excerpt: z.string().optional(),
  author: z.string().optional(),
  tags: z.array(z.string()).optional(),
  eventDate: z.string().min(1),
  endDate: z.string().optional(),
  location: z.string().optional(),
  status: z.enum(["DRAFT", "PUBLISHED", "ARCHIVED"]).optional(),
  metaTitle: z.string().optional(),
  metaDescription: z.string().optional(),
  metaKeywords: z.array(z.string()).optional(),
});

export const updateEventSchema = z.object({
  title: z.string().min(1).optional(),
  content: z.string().optional(),
  excerpt: z.string().optional(),
  author: z.string().optional(),
  tags: z.array(z.string()).optional(),
  eventDate: z.string().min(1).optional(),
  endDate: z.string().optional(),
  location: z.string().optional(),
  status: z.enum(["DRAFT", "PUBLISHED", "ARCHIVED"]).optional(),
  metaTitle: z.string().optional(),
  metaDescription: z.string().optional(),
  metaKeywords: z.array(z.string()).optional(),
  featuredImage: z.string().nullable().optional(),
  featuredImagePublicId: z.string().nullable().optional(),
});

export const eventQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(10),
  search: z.string().optional(),
  status: z.enum(["DRAFT", "PUBLISHED", "ARCHIVED"]).optional(),
  tag: z.string().optional(),
  upcoming: z.enum(["true", "false"]).optional(),
  sortOrder: z.enum(["asc", "desc"]).default("desc"),
});

export type CreateEventRequest = z.infer<typeof createEventSchema>;
export type UpdateEventRequest = z.infer<typeof updateEventSchema>;
export type EventQueryRequest = z.infer<typeof eventQuerySchema>;
