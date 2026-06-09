import { prisma } from "../../lib/prisma";
import type { AlumniQueryRequest } from "./alumni.schema";

export const alumniRepository = {
  findPaginated: async (query: AlumniQueryRequest) => {
    const { page, perPage, q, graduationYear, specialization, sort, approved } = query;

    const where: any = { status: 1 };

    // Default: only show approved alumni (for public)
    if (approved === "true") {
      where.isApproved = true;
    } else if (approved === "false") {
      where.isApproved = false;
    }
    // "all" or undefined: no filter on isApproved

    if (q) {
      where.OR = [
        { name: { contains: q, mode: "insensitive" } },
        { institution: { contains: q, mode: "insensitive" } },
        { specialization: { contains: q, mode: "insensitive" } },
        { degree: { contains: q, mode: "insensitive" } },
        { email: { contains: q, mode: "insensitive" } },
      ];
    }

    if (graduationYear) {
      where.graduationYear = graduationYear;
    }

    if (specialization) {
      where.specialization = { contains: specialization, mode: "insensitive" };
    }

    const orderBy: any = (() => {
      switch (sort) {
        case "name_asc":
          return { name: "asc" };
        case "name_desc":
          return { name: "desc" };
        case "year_asc":
          return { graduationYear: "asc" };
        case "year_desc":
          return { graduationYear: "desc" };
        case "newest":
        default:
          return { createdAt: "desc" };
      }
    })();

    const [items, total] = await Promise.all([
      prisma.alumni.findMany({
        where,
        orderBy,
        skip: (page - 1) * perPage,
        take: perPage,
      }),
      prisma.alumni.count({ where }),
    ]);

    return {
      items,
      total,
      page,
      perPage,
      totalPages: Math.ceil(total / perPage),
    };
  },

  findById: (id: number) =>
    prisma.alumni.findUnique({ where: { id } }),

  findByEmail: (email: string) =>
    prisma.alumni.findFirst({ where: { email } }),

  create: (data: {
    name: string;
    email?: string | null;
    password?: string | null;
    contactNumber?: string | null;
    graduationYear: number;
    degree?: string | null;
    specialization?: string | null;
    institution?: string | null;
    photo?: string | null;
    photoPublicId?: string | null;
    isApproved?: boolean;
  }) => prisma.alumni.create({ data }),

  update: (
    id: number,
    data: {
      name?: string;
      email?: string | null;
      password?: string | null;
      contactNumber?: string | null;
      graduationYear?: number;
      degree?: string | null;
      specialization?: string | null;
      institution?: string | null;
      photo?: string | null;
      photoPublicId?: string | null;
      status?: number;
      isApproved?: boolean;
    }
  ) => prisma.alumni.update({ where: { id }, data }),

  remove: (id: number) =>
    prisma.alumni.delete({ where: { id } }),

  findDistinctYears: async () => {
    const results = await prisma.alumni.findMany({
      where: { status: 1, isApproved: true },
      select: { graduationYear: true },
      distinct: ["graduationYear"],
      orderBy: { graduationYear: "desc" },
    });
    return results.map((r) => r.graduationYear);
  },

  findDistinctSpecializations: async () => {
    const results = await prisma.alumni.findMany({
      where: { status: 1, isApproved: true, specialization: { not: null } },
      select: { specialization: true },
      distinct: ["specialization"],
      orderBy: { specialization: "asc" },
    });
    return results.map((r) => r.specialization).filter(Boolean) as string[];
  },
};
