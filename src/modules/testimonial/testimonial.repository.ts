import { prisma } from "../../lib/prisma";
import type { TestimonialQueryRequest } from "./testimonial.schema";

export const testimonialRepository = {
  findPaginated: async (query: TestimonialQueryRequest) => {
    const { page, limit, search, sortOrder } = query;

    const where: any = { status: 1 };

    if (search) {
      where.OR = [
        { name: { contains: search, mode: "insensitive" } },
        { institution: { contains: search, mode: "insensitive" } },
        { testimonial: { contains: search, mode: "insensitive" } },
      ];
    }

    const orderBy: any = { createdAt: sortOrder };

    const [items, total] = await Promise.all([
      prisma.testimonial.findMany({
        where,
        orderBy,
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.testimonial.count({ where }),
    ]);

    return { items, total, page, perPage: limit, totalPages: Math.ceil(total / limit) };
  },

  findAllPublished: () =>
    prisma.testimonial.findMany({
      where: { status: 1 },
      orderBy: { createdAt: "desc" },
    }),

  findById: (id: number) =>
    prisma.testimonial.findUnique({ where: { id } }),

  create: (data: {
    name: string;
    institution?: string;
    testimonial: string;
    photo?: string | null;
    photoPublicId?: string | null;
  }) => prisma.testimonial.create({ data }),

  update: (
    id: number,
    data: {
      name?: string;
      institution?: string;
      testimonial?: string;
      photo?: string | null;
      photoPublicId?: string | null;
      status?: number;
    }
  ) => prisma.testimonial.update({ where: { id }, data }),

  remove: (id: number) =>
    prisma.testimonial.delete({ where: { id } }),
};
