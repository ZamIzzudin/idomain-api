import { prisma } from "../../lib/prisma";
import type { CareerQueryRequest } from "./career.schema";

export const careerRepository = {
  findPaginated: async (query: CareerQueryRequest) => {
    const {
      page,
      limit,
      search,
      status,
      categoryId,
      category,
      jobType,
      province,
      city,
      authorId,
      sortOrder,
    } = query;

    const where: any = {};

    if (search) {
      where.OR = [
        { title: { contains: search, mode: "insensitive" } },
        { position: { contains: search, mode: "insensitive" } },
        { institutionName: { contains: search, mode: "insensitive" } },
        { description: { contains: search, mode: "insensitive" } },
      ];
    }

    if (status) {
      if (Array.isArray(status)) {
        where.status = { in: status };
      } else {
        where.status = status;
      }
    }

    if (categoryId) {
      where.categoryId = categoryId;
    }

    if (category) {
      where.category = { slug: category };
    }

    if (jobType) {
      where.jobType = jobType;
    }

    if (province) {
      where.province = { contains: province, mode: "insensitive" };
    }

    if (city) {
      where.city = { contains: city, mode: "insensitive" };
    }

    if (authorId) {
      where.authorId = authorId;
    }

    const orderBy: any = { createdAt: sortOrder };

    const [items, total] = await Promise.all([
      prisma.career.findMany({
        where,
        orderBy,
        skip: (page - 1) * limit,
        take: limit,
        include: {
          category: true,
          author: {
            select: {
              id: true,
              name: true,
              photo: true,
            },
          },
        },
      }),
      prisma.career.count({ where }),
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
    prisma.career.findUnique({
      where: { slug },
      include: {
        category: true,
        author: {
          select: {
            id: true,
            name: true,
            photo: true,
          },
        },
      },
    }),

  findById: (id: number) =>
    prisma.career.findUnique({
      where: { id },
      include: {
        category: true,
        author: {
          select: {
            id: true,
            name: true,
            photo: true,
          },
        },
      },
    }),

  create: (data: {
    title: string;
    slug: string;
    institutionName: string;
    logo?: string | null;
    logoPublicId?: string | null;
    position: string;
    province?: string | null;
    city?: string | null;
    jobType: string;
    description?: string | null;
    requirements?: string | null;
    deadline?: Date | null;
    recruitmentEmail?: string | null;
    recruitmentUrl?: string | null;
    contactPerson?: string | null;
    contactPhone?: string | null;
    categoryId: number;
    status?: "DRAFT" | "PENDING_REVIEW" | "PUBLISHED" | "CLOSED" | "EXPIRED";
    authorId: number;
    publishedAt?: Date | null;
  }) =>
    prisma.career.create({
      data,
      include: {
        category: true,
        author: {
          select: {
            id: true,
            name: true,
            photo: true,
          },
        },
      },
    }),

  update: (
    id: number,
    data: {
      title?: string;
      slug?: string;
      institutionName?: string;
      logo?: string | null;
      logoPublicId?: string | null;
      position?: string;
      province?: string | null;
      city?: string | null;
      jobType?: string;
      description?: string | null;
      requirements?: string | null;
      deadline?: Date | null;
      recruitmentEmail?: string | null;
      recruitmentUrl?: string | null;
      contactPerson?: string | null;
      contactPhone?: string | null;
      categoryId?: number;
      status?: "DRAFT" | "PENDING_REVIEW" | "PUBLISHED" | "CLOSED" | "EXPIRED";
      publishedAt?: Date | null;
      expiredAt?: Date | null;
      approvedById?: number | null;
      approvedAt?: Date | null;
    }
  ) =>
    prisma.career.update({
      where: { id },
      data,
      include: {
        category: true,
        author: {
          select: {
            id: true,
            name: true,
            photo: true,
          },
        },
      },
    }),

  remove: (id: number) => prisma.career.delete({ where: { id } }),

  incrementViews: (id: number) =>
    prisma.career.update({
      where: { id },
      data: { views: { increment: 1 } },
    }),

  findDistinctProvinces: async (status?: string) => {
    const results = await prisma.career.findMany({
      select: { province: true },
      where: status ? { status: status as any } : {},
    });
    const provSet = new Set<string>();
    results.forEach((r) => {
      if (r.province) provSet.add(r.province);
    });
    return Array.from(provSet).sort();
  },

  findDistinctJobTypes: async (status?: string) => {
    const results = await prisma.career.findMany({
      select: { jobType: true },
      where: status ? { status: status as any } : {},
    });
    const typeSet = new Set<string>();
    results.forEach((r) => typeSet.add(r.jobType));
    return Array.from(typeSet).sort();
  },
};
