import { settingRepository } from "./setting.repository";
import type { BulkUpsertRequest } from "./setting.schema";

export const settingService = {
  list: () => settingRepository.findAll(),

  listByCategory: (category: string) =>
    settingRepository.findByCategory(category),

  get: (key: string) => settingRepository.findByKey(key),

  bulkUpsert: (data: BulkUpsertRequest) =>
    settingRepository.bulkUpsert(
      data.settings.map((s) => ({
        key: s.key,
        value: s.value ?? null,
        category: s.category,
      }))
    ),

  remove: (key: string) => settingRepository.remove(key),
};
