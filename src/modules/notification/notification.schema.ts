import { z } from "zod";

export const notificationQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  unreadOnly: z.coerce.boolean().optional(),
  sortOrder: z.enum(["asc", "desc"]).default("desc"),
});

export type NotificationQueryRequest = z.infer<typeof notificationQuerySchema>;
