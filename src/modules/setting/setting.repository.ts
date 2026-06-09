import { prisma } from "../../lib/prisma";

export const settingRepository = {
  findAll: () =>
    prisma.siteSetting.findMany({
      orderBy: [{ category: "asc" }, { key: "asc" }],
    }),

  findByCategory: (category: string) =>
    prisma.siteSetting.findMany({
      where: { category },
      orderBy: { key: "asc" },
    }),

  findByKey: (key: string) =>
    prisma.siteSetting.findUnique({ where: { key } }),

  upsert: (data: { key: string; value: string | null; category: string }) =>
    prisma.siteSetting.upsert({
      where: { key: data.key },
      update: { value: data.value, category: data.category },
      create: data,
    }),

  bulkUpsert: async (settings: { key: string; value: string | null; category: string }[]) => {
    const results = [];
    for (const s of settings) {
      const result = await prisma.siteSetting.upsert({
        where: { key: s.key },
        update: { value: s.value, category: s.category },
        create: s,
      });
      results.push(result);
    }
    return results;
  },

  remove: (key: string) =>
    prisma.siteSetting.delete({ where: { key } }),
};
