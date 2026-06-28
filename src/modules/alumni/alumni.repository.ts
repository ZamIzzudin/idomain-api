import { prisma } from "../../lib/prisma";
import type { AlumniQueryRequest } from "./alumni.schema";

export const alumniRepository = {
  findPaginated: async (
    query: AlumniQueryRequest,
    batches?: number[] | null,
  ) => {
    const { page, perPage, q, graduationYear, specialization, province, city, sort, approved } = query;

    const where: any = { status: 1 };

    if (approved === "true") {
      where.isApproved = true;
    } else if (approved === "false") {
      where.isApproved = false;
    }

    // Batch-scope filter: when a non-null scope is provided, restrict to alumni
    // whose batch is in the scope. Alumni without a batch are excluded for
    // scoped users (mirrors the canAccessAlumniByBatch guard).
    if (batches) {
      where.batch = { in: batches };
    }

    if (q) {
      where.OR = [
        { name: { contains: q, mode: "insensitive" } },
        { specialization: { contains: q, mode: "insensitive" } },
        { degreePrefix: { contains: q, mode: "insensitive" } },
        { degreeSuffix: { contains: q, mode: "insensitive" } },
        { email: { contains: q, mode: "insensitive" } },
        { province: { contains: q, mode: "insensitive" } },
        { city: { contains: q, mode: "insensitive" } },
      ];
    }

    if (graduationYear) {
      where.graduationYear = graduationYear;
    }

    if (specialization) {
      where.specialization = { contains: specialization, mode: "insensitive" };
    }

    if (province) {
      where.province = { contains: province, mode: "insensitive" };
    }

    if (city) {
      where.city = { contains: city, mode: "insensitive" };
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
        case "pending_first":
          return [
            { isApproved: "asc" },
            { createdAt: "desc" },
          ];
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
        include: {
          workHistories: {
            orderBy: { startYear: "desc" },
          },
        },
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
    prisma.alumni.findUnique({
      where: { id },
      include: {
        workHistories: {
          orderBy: { startYear: "desc" },
        },
      },
    }),

  findByEmail: (email: string) =>
    prisma.alumni.findFirst({ where: { email } }),

  findClaimableByNameAndYear: (name: string, batch: number) =>
    prisma.alumni.findMany({
      where: {
        name: { contains: name, mode: "insensitive" },
        batch,
        password: null,
        status: 1,
      },
      orderBy: { createdAt: "asc" },
      take: 10,
    }),

  create: (data: {
    name: string;
    email?: string | null;
    password?: string | null;
    contactNumber?: string | null;
    graduationYear: number;
    batch?: number | null;
    degreePrefix?: string | null;
    degreeSuffix?: string | null;
    specialization?: string | null;
    province?: string | null;
    city?: string | null;
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
      batch?: number | null;
      degreePrefix?: string | null;
      degreeSuffix?: string | null;
      specialization?: string | null;
      province?: string | null;
      city?: string | null;
      photo?: string | null;
      photoPublicId?: string | null;
      status?: number;
      isApproved?: boolean;
      emailVisible?: boolean;
      contactNumberVisible?: boolean;
      notifEnabled?: boolean;
      notifReceiveAll?: boolean;
      preferredCategories?: string[];
    }
  ) => prisma.alumni.update({ where: { id }, data }),

  remove: (id: number) =>
    prisma.alumni.delete({ where: { id } }),

  findDistinctYears: async (batches?: number[] | null) => {
    const where: any = { status: 1, isApproved: true };
    if (batches) where.batch = { in: batches };
    const results = await prisma.alumni.findMany({
      where,
      select: { graduationYear: true },
      distinct: ["graduationYear"],
      orderBy: { graduationYear: "desc" },
    });
    return results.map((r) => r.graduationYear);
  },

  findDistinctSpecializations: async (batches?: number[] | null) => {
    const where: any = { status: 1, isApproved: true, specialization: { not: null } };
    if (batches) where.batch = { in: batches };
    const results = await prisma.alumni.findMany({
      where,
      select: { specialization: true },
      distinct: ["specialization"],
      orderBy: { specialization: "asc" },
    });
    return results.map((r) => r.specialization).filter(Boolean) as string[];
  },

  findDistinctProvinces: async (batches?: number[] | null) => {
    const where: any = { status: 1, isApproved: true, province: { not: null } };
    if (batches) where.batch = { in: batches };
    const results = await prisma.alumni.findMany({
      where,
      select: { province: true },
      distinct: ["province"],
      orderBy: { province: "asc" },
    });
    return results.map((r) => r.province).filter(Boolean) as string[];
  },

  findDistinctCities: async (province?: string, batches?: number[] | null) => {
    const where: any = { status: 1, isApproved: true, city: { not: null } };
    if (province) {
      where.province = { contains: province, mode: "insensitive" };
    }
    if (batches) where.batch = { in: batches };
    const results = await prisma.alumni.findMany({
      where,
      select: { city: true },
      distinct: ["city"],
      orderBy: { city: "asc" },
    });
    return results.map((r) => r.city).filter(Boolean) as string[];
  },

  getStats: async (batches?: number[] | null) => {
    const scopeWhere = batches ? { status: 1, batch: { in: batches } } : { status: 1 };

    const total = await prisma.alumni.count({
      where: { ...scopeWhere, isApproved: true },
    });

    const pendingCount = await prisma.alumni.count({
      where: { ...scopeWhere, isApproved: false },
    });

    const byProvince = await prisma.alumni.groupBy({
      by: ["province"],
      where: { ...scopeWhere, isApproved: true, province: { not: null } },
      _count: { province: true },
      orderBy: { _count: { province: "desc" } },
    });

    const byYear = await prisma.alumni.groupBy({
      by: ["graduationYear"],
      where: { ...scopeWhere, isApproved: true },
      _count: { graduationYear: true },
      orderBy: { graduationYear: "asc" },
    });

    const bySpecialization = await prisma.alumni.groupBy({
      by: ["specialization"],
      where: { ...scopeWhere, isApproved: true, specialization: { not: null } },
      _count: { specialization: true },
      orderBy: { _count: { specialization: "desc" } },
      take: 10,
    });

    const byBatch = await prisma.alumni.groupBy({
      by: ["batch"],
      where: { ...scopeWhere, isApproved: true, batch: { not: null } },
      _count: { batch: true },
      orderBy: { batch: "asc" },
    });

    return {
      total,
      pendingCount,
      byProvince: byProvince.map((r) => ({
        province: r.province as string,
        count: r._count.province,
      })),
      byYear: byYear.map((r) => ({
        year: r.graduationYear,
        count: r._count.graduationYear,
      })),
      byBatch: byBatch.map((r) => ({
        batch: r.batch as number,
        count: r._count.batch,
      })),
      bySpecialization: bySpecialization.map((r) => ({
        specialization: r.specialization as string,
        count: r._count.specialization,
      })),
    };
  },

  bulkCreate: async (dataList: Array<{
    name: string;
    graduationYear: number;
    batch?: number | null;
    degreePrefix?: string | null;
    degreeSuffix?: string | null;
  }>) => {
    return prisma.alumni.createMany({
      data: dataList.map((d) => ({
        ...d,
        isApproved: true,
      })),
    });
  },

  exportAll: async (batches?: number[] | null) => {
    const where: any = { status: 1 };
    if (batches) where.batch = { in: batches };
    return prisma.alumni.findMany({
      where,
      orderBy: { name: "asc" },
      select: {
        name: true,
        graduationYear: true,
        batch: true,
        degreePrefix: true,
        degreeSuffix: true,
        specialization: true,
        email: true,
        contactNumber: true,
      },
    });
  },
};

// Work History repository
export const workHistoryRepository = {
  findByAlumniId: (alumniId: number) =>
    prisma.workHistory.findMany({
      where: { alumniId },
      orderBy: { startYear: "desc" },
    }),

  findById: (id: number) =>
    prisma.workHistory.findUnique({ where: { id } }),

  create: (data: {
    alumniId: number;
    institutionName: string;
    startYear: number;
    endYear?: number | null;
    province?: string | null;
    city?: string | null;
  }) => prisma.workHistory.create({ data }),

  update: (
    id: number,
    data: {
      institutionName?: string;
      startYear?: number;
      endYear?: number | null;
      province?: string | null;
      city?: string | null;
    }
  ) => prisma.workHistory.update({ where: { id }, data }),

  remove: (id: number) =>
    prisma.workHistory.delete({ where: { id } }),
};
