import { prisma } from "../../lib/prisma";

export const categoryRepository = {
  findAll: (query?: { type?: "KLINIS" | "NON_KLINIS"; sortOrder?: "asc" | "desc" }) => {
    const where: any = {};
    if (query?.type) where.type = query.type;

    return prisma.careerCategory.findMany({
      where,
      orderBy: [{ sortOrder: query?.sortOrder || "asc" }, { name: "asc" }],
    });
  },

  findById: (id: number) =>
    prisma.careerCategory.findUnique({ where: { id } }),

  findBySlug: (slug: string) =>
    prisma.careerCategory.findUnique({ where: { slug } }),

  findByName: (name: string) =>
    prisma.careerCategory.findUnique({ where: { name } }),

  create: (data: {
    name: string;
    slug: string;
    type?: "KLINIS" | "NON_KLINIS";
    sortOrder?: number;
  }) => prisma.careerCategory.create({ data }),

  update: (
    id: number,
    data: {
      name?: string;
      slug?: string;
      type?: "KLINIS" | "NON_KLINIS";
      sortOrder?: number;
    }
  ) => prisma.careerCategory.update({ where: { id }, data }),

  remove: (id: number) => prisma.careerCategory.delete({ where: { id } }),

  countCareers: (id: number) =>
    prisma.career.count({ where: { categoryId: id } }),
};
