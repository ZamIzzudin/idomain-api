import { z } from "zod";

export const upsertSettingSchema = z.object({
  key: z.string().min(1),
  value: z.string().optional().nullable(),
  category: z.string().min(1),
});

export const bulkUpsertSchema = z.object({
  settings: z.array(upsertSettingSchema),
});

export type UpsertSettingRequest = z.infer<typeof upsertSettingSchema>;
export type BulkUpsertRequest = z.infer<typeof bulkUpsertSchema>;
