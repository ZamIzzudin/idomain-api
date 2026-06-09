import { prisma } from "../../lib/prisma";
import type { ArticleQueryRequest } from "./article.schema";

export const articleRepository = {
  findPaginated: async (query: ArticleQueryRequest) => {
    const { page, limit, search, status, tag, sortOrder } = query;

    const where: any = {};

    if (search) {
      where.OR = [
        { title: { contains: search, mode: "insensitive" } },
        { content: { contains: search, mode: "insensitive" } },
        { author: { contains: search, mode: "insensitive" } },
      ];
    }

    if (status) {
      where.status = status;
    }

    if (tag) {
      where.tags = { has: tag };
    }

    const orderBy: any = { createdAt: sortOrder };

    const [items, total] = await Promise.all([
      prisma.article.findMany({
        where,
        orderBy,
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.article.count({ where }),
    ]);

    return {
      items,
      total,
      page,
      perPage: limit,
      totalPages: Math.ceil(total / limit),
    };
  },

  findBySlug: (slug: string) =>
    prisma.article.findUnique({ where: { slug } }),

  findById: (id: number) =>
    prisma.article.findUnique({ where: { id } }),

  create: (data: {
    title: string;
    slug: string;
    content?: string;
    excerpt?: string;
    author?: string;
    tags?: string[];
    featuredImage?: string | null;
    featuredImagePublicId?: string | null;
    status?: "DRAFT" | "PUBLISHED" | "ARCHIVED";
    metaTitle?: string;
    metaDescription?: string;
    metaKeywords?: string[];
    publishedAt?: Date | null;
  }) => prisma.article.create({ data }),

  update: (
    id: number,
    data: {
      title?: string;
      slug?: string;
      content?: string;
      excerpt?: string;
      author?: string;
      tags?: string[];
      featuredImage?: string | null;
      featuredImagePublicId?: string | null;
      status?: "DRAFT" | "PUBLISHED" | "ARCHIVED";
      metaTitle?: string;
      metaDescription?: string;
      metaKeywords?: string[];
      publishedAt?: Date | null;
    }
  ) => prisma.article.update({ where: { id }, data }),

  remove: (id: number) =>
    prisma.article.delete({ where: { id } }),

  incrementViews: (id: number) =>
    prisma.article.update({
      where: { id },
      data: { views: { increment: 1 } },
    }),

  findDistinctTags: async () => {
    const results = await prisma.article.findMany({
      select: { tags: true },
      where: { status: "PUBLISHED" },
    });
    const tagSet = new Set<string>();
    results.forEach((r) => r.tags.forEach((t) => tagSet.add(t)));
    return Array.from(tagSet).sort();
  },
};
