import { z } from "zod";

export const createArticleSchema = z.object({
  title: z.string().min(1),
  content: z.string().optional(),
  excerpt: z.string().optional(),
  author: z.string().optional(),
  tags: z.array(z.string()).optional(),
  status: z.enum(["DRAFT", "PUBLISHED", "ARCHIVED"]).optional(),
  metaTitle: z.string().optional(),
  metaDescription: z.string().optional(),
  metaKeywords: z.array(z.string()).optional(),
});

export const updateArticleSchema = z.object({
  title: z.string().min(1).optional(),
  content: z.string().optional(),
  excerpt: z.string().optional(),
  author: z.string().optional(),
  tags: z.array(z.string()).optional(),
  status: z.enum(["DRAFT", "PUBLISHED", "ARCHIVED"]).optional(),
  metaTitle: z.string().optional(),
  metaDescription: z.string().optional(),
  metaKeywords: z.array(z.string()).optional(),
});

export const articleQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(10),
  search: z.string().optional(),
  status: z.enum(["DRAFT", "PUBLISHED", "ARCHIVED"]).optional(),
  tag: z.string().optional(),
  sortOrder: z.enum(["asc", "desc"]).default("desc"),
});

export type CreateArticleRequest = z.infer<typeof createArticleSchema>;
export type UpdateArticleRequest = z.infer<typeof updateArticleSchema>;
export type ArticleQueryRequest = z.infer<typeof articleQuerySchema>;
