import { prisma } from "../../lib/prisma";
import type { NotificationQueryRequest } from "./notification.schema";

export const notificationRepository = {
  findPaginated: async (alumniId: number, query: NotificationQueryRequest) => {
    const { page, limit, unreadOnly, sortOrder } = query;

    const where: any = { alumniId };
    if (unreadOnly) where.isRead = false;

    const orderBy: any = { createdAt: sortOrder };

    const [items, total] = await Promise.all([
      prisma.notification.findMany({
        where,
        orderBy,
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.notification.count({ where }),
    ]);

    return {
      items,
      total,
      page,
      perPage: limit,
      totalPages: Math.ceil(total / limit),
    };
  },

  unreadCount: (alumniId: number) =>
    prisma.notification.count({
      where: { alumniId, isRead: false },
    }),

  markAsRead: (id: number, alumniId: number) =>
    prisma.notification.updateMany({
      where: { id, alumniId },
      data: { isRead: true },
    }),

  markAllAsRead: (alumniId: number) =>
    prisma.notification.updateMany({
      where: { alumniId, isRead: false },
      data: { isRead: true },
    }),

  remove: (id: number, alumniId: number) =>
    prisma.notification.deleteMany({
      where: { id, alumniId },
    }),

  create: (data: {
    alumniId: number;
    type: string;
    title: string;
    body?: string | null;
    url?: string | null;
    careerId?: number | null;
  }) =>
    prisma.notification.create({
      data,
    }),

  createMany: (data: {
    alumniIds: number[];
    type: string;
    title: string;
    body?: string | null;
    url?: string | null;
    careerId?: number | null;
  }) =>
    prisma.notification.createMany({
      data: data.alumniIds.map((alumniId) => ({
        alumniId,
        type: data.type,
        title: data.title,
        body: data.body || null,
        url: data.url || null,
        careerId: data.careerId || null,
      })),
    }),
};
