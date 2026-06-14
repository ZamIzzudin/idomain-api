import { prisma } from "../../lib/prisma";

export const pushRepository = {
  upsert: async (data: {
    alumniId: number;
    endpoint: string;
    p256dh: string;
    auth: string;
  }) => {
    const existing = await prisma.pushSubscription.findUnique({
      where: {
        alumniId_endpoint: {
          alumniId: data.alumniId,
          endpoint: data.endpoint,
        },
      },
    });

    if (existing) {
      return prisma.pushSubscription.update({
        where: { id: existing.id },
        data: {
          p256dh: data.p256dh,
          auth: data.auth,
        },
      });
    }

    return prisma.pushSubscription.create({ data });
  },

  remove: (alumniId: number, endpoint: string) =>
    prisma.pushSubscription.deleteMany({
      where: { alumniId, endpoint },
    }),

  removeAllByAlumni: (alumniId: number) =>
    prisma.pushSubscription.deleteMany({
      where: { alumniId },
    }),

  findByAlumniIds: async (alumniIds: number[]) => {
    if (alumniIds.length === 0) return [];
    return prisma.pushSubscription.findMany({
      where: { alumniId: { in: alumniIds } },
      include: {
        alumni: {
          select: {
            id: true,
            notifReceiveAll: true,
            preferredCategories: true,
          },
        },
      },
    });
  },

  findByAlumniId: (alumniId: number) =>
    prisma.pushSubscription.findMany({
      where: { alumniId },
    }),
};
