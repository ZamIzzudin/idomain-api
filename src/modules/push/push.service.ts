import { pushRepository } from "./push.repository";
import { notificationService } from "../notification/notification.service";
import { sendPushNotification } from "../../lib/vapid";
import type { SubscribeRequest } from "./push.schema";

export const pushService = {
  subscribe: async (alumniId: number, data: SubscribeRequest) => {
    return pushRepository.upsert({
      alumniId,
      endpoint: data.endpoint,
      p256dh: data.keys.p256dh,
      auth: data.keys.auth,
    });
  },

  unsubscribe: async (alumniId: number, endpoint: string) => {
    await pushRepository.remove(alumniId, endpoint);
    return true;
  },

  unsubscribeAll: async (alumniId: number) => {
    await pushRepository.removeAllByAlumni(alumniId);
    return true;
  },

  sendTest: async (alumniId: number) => {
    const subscriptions = await pushRepository.findByAlumniId(alumniId);
    if (subscriptions.length === 0) {
      throw new Error("No push subscription found for this user");
    }

    const payload = {
      title: "Test Notifikasi IDOMAIN",
      body: "Notifikasi push berhasil! Anda akan menerima pemberitahuan lowongan baru.",
      url: "/career",
    };

    for (const sub of subscriptions) {
      try {
        await sendPushNotification(
          {
            endpoint: sub.endpoint,
            p256dh: sub.p256dh,
            auth: sub.auth,
          },
          payload
        );
      } catch (error) {
        console.error("Push send error:", error);
      }
    }

    return subscriptions.length;
  },

  broadcastNewCareer: async (career: {
    id: number;
    title: string;
    slug: string;
    categoryId: number;
    category: { name: string };
  }) => {
    // 1. Create in-app notifications for matching alumni
    const notifiedCount = await notificationService.createForMatchingAlumni(career);

    // 2. Send push notifications to matching alumni with subscriptions
    const subscriptions = await pushRepository.findByAlumniIds(
      await getMatchingAlumniIds(career)
    );

    if (subscriptions.length === 0) return { inAppCount: notifiedCount, pushCount: 0 };

    const categoryName = career.category.name;
    const payload = {
      title: `Lowongan Baru: ${career.title}`,
      body: `Ada lowongan baru di kategori ${categoryName}. Klik untuk melihat detail.`,
      url: `/career/${career.slug}`,
    };

    let pushCount = 0;
    for (const sub of subscriptions) {
      try {
        await sendPushNotification(
          {
            endpoint: sub.endpoint,
            p256dh: sub.p256dh,
            auth: sub.auth,
          },
          payload
        );
        pushCount++;
      } catch (error: any) {
        // If subscription is invalid/expired, it will be cleaned up naturally
        console.error(`Push failed for alumni ${sub.alumniId}:`, error?.statusCode || error?.message);
      }
    }

    return { inAppCount: notifiedCount, pushCount };
  },
};

async function getMatchingAlumniIds(career: {
  category: { name: string };
}): Promise<number[]> {
  const { prisma } = await import("../../lib/prisma");
  const matchingAlumni = await prisma.alumni.findMany({
    where: {
      notifEnabled: true,
      status: 1,
      OR: [
        { notifReceiveAll: true },
        { preferredCategories: { has: career.category.name } },
      ],
    },
    select: { id: true },
  });
  return matchingAlumni.map((a) => a.id);
}
