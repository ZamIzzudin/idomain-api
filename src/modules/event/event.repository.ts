import { prisma } from "../../lib/prisma";
import type { EventQueryRequest } from "./event.schema";

export const eventRepository = {
  findPaginated: async (query: EventQueryRequest) => {
    const { page, limit, search, status, tag, upcoming, sortOrder } = query;

    const where: any = {};

    if (search) {
      where.OR = [
        { title: { contains: search, mode: "insensitive" } },
        { content: { contains: search, mode: "insensitive" } },
        { location: { contains: search, mode: "insensitive" } },
      ];
    }

    if (status) {
      where.status = status;
    }

    if (tag) {
      where.tags = { has: tag };
    }

    if (upcoming === "true") {
      where.eventDate = { gte: new Date() };
    }

    const orderBy: any = { eventDate: sortOrder };

    const [items, total] = await Promise.all([
      prisma.event.findMany({
        where,
        orderBy,
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.event.count({ where }),
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
    prisma.event.findUnique({ where: { slug } }),

  findById: (id: number) =>
    prisma.event.findUnique({ where: { id } }),

  create: (data: {
    title: string;
    slug: string;
    content?: string;
    excerpt?: string;
    author?: string;
    tags?: string[];
    featuredImage?: string | null;
    featuredImagePublicId?: string | null;
    eventDate: Date;
    endDate?: Date | null;
    location?: string;
    status?: "DRAFT" | "PUBLISHED" | "ARCHIVED";
    metaTitle?: string;
    metaDescription?: string;
    metaKeywords?: string[];
    publishedAt?: Date | null;
  }) => prisma.event.create({ data }),

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
      eventDate?: Date;
      endDate?: Date | null;
      location?: string;
      status?: "DRAFT" | "PUBLISHED" | "ARCHIVED";
      metaTitle?: string;
      metaDescription?: string;
      metaKeywords?: string[];
      publishedAt?: Date | null;
    }
  ) => prisma.event.update({ where: { id }, data }),

  remove: (id: number) =>
    prisma.event.delete({ where: { id } }),

  incrementViews: (id: number) =>
    prisma.event.update({
      where: { id },
      data: { views: { increment: 1 } },
    }),

  findDistinctTags: async () => {
    const results = await prisma.event.findMany({
      select: { tags: true },
      where: { status: "PUBLISHED" },
    });
    const tagSet = new Set<string>();
    results.forEach((r) => r.tags.forEach((t) => tagSet.add(t)));
    return Array.from(tagSet).sort();
  },
};
