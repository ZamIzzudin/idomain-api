import { notificationRepository } from "./notification.repository";
import { prisma } from "../../lib/prisma";
import type { NotificationQueryRequest } from "./notification.schema";

export const notificationService = {
  list: (alumniId: number, query: NotificationQueryRequest) =>
    notificationRepository.findPaginated(alumniId, query),

  unreadCount: (alumniId: number) =>
    notificationRepository.unreadCount(alumniId),

  markAsRead: async (id: number, alumniId: number) => {
    await notificationRepository.markAsRead(id, alumniId);
    return true;
  },

  markAllAsRead: async (alumniId: number) => {
    await notificationRepository.markAllAsRead(alumniId);
    return true;
  },

  remove: async (id: number, alumniId: number) => {
    await notificationRepository.remove(id, alumniId);
    return true;
  },

  createForMatchingAlumni: async (career: {
    id: number;
    title: string;
    slug: string;
    categoryId: number;
    category: { name: string };
  }) => {
    const categoryName = career.category.name;

    const matchingAlumni = await prisma.alumni.findMany({
      where: {
        notifEnabled: true,
        status: 1,
        OR: [
          { notifReceiveAll: true },
          { preferredCategories: { has: categoryName } },
        ],
      },
      select: { id: true },
    });

    const alumniIds = matchingAlumni.map((a) => a.id);

    if (alumniIds.length === 0) return 0;

    await notificationRepository.createMany({
      alumniIds,
      type: "NEW_CAREER",
      title: `Lowongan Baru: ${career.title}`,
      body: `Ada lowongan baru di kategori ${categoryName}. Klik untuk melihat detail.`,
      url: `/career/${career.slug}`,
      careerId: career.id,
    });

    return alumniIds.length;
  },
};
