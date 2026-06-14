import { settingRepository } from "./setting.repository";
import { deleteFromCloudinary } from "../../lib/cloudinary";
import type { BulkUpsertRequest } from "./setting.schema";

// Single-image setting keys stored as JSON { url, publicId }
const IMAGE_KEYS = [
  "site_logo",
  "site_favicon",
  "about_image",
  "home_about_image",
];

// Array-of-images setting keys stored as JSON array of { url, publicId } strings
const IMAGE_ARRAY_KEYS = ["hero_banners", "about_gallery"];

// Object setting keys that may contain customIconUrl with { url, publicId }
const SOCIAL_LINKS_KEY = "social_links";

function extractPublicIdFromValue(value: string | null): string | null {
  if (!value) return null;
  try {
    const parsed = JSON.parse(value);
    if (parsed && typeof parsed === "object" && parsed.publicId) {
      return parsed.publicId;
    }
  } catch {
    // Legacy: raw URL, no publicId
  }
  return null;
}

function extractPublicIdsFromArray(value: string | null): string[] {
  if (!value) return [];
  try {
    const arr = JSON.parse(value);
    if (!Array.isArray(arr)) return [];
    return arr
      .map((item: string) => extractPublicIdFromValue(item))
      .filter((id: string | null): id is string => !!id);
  } catch {
    return [];
  }
}

function extractPublicIdsFromSocialLinks(value: string | null): string[] {
  if (!value) return [];
  try {
    const arr = JSON.parse(value);
    if (!Array.isArray(arr)) return [];
    return arr
      .map((item: any) =>
        item?.customIconUrl
          ? extractPublicIdFromValue(item.customIconUrl)
          : null
      )
      .filter((id: string | null): id is string => !!id);
  } catch {
    return [];
  }
}

export const settingService = {
  list: () => settingRepository.findAll(),

  listByCategory: (category: string) =>
    settingRepository.findByCategory(category),

  get: (key: string) => settingRepository.findByKey(key),

  bulkUpsert: async (data: BulkUpsertRequest) => {
    const results = [];

    for (const s of data.settings) {
      const newValue = s.value ?? null;
      const existing = await settingRepository.findByKey(s.key);

      // 1. Single-image keys
      if (IMAGE_KEYS.includes(s.key)) {
        if (existing?.value) {
          const oldPublicId = extractPublicIdFromValue(existing.value);
          const newPublicId = extractPublicIdFromValue(newValue);
          if (oldPublicId && oldPublicId !== newPublicId) {
            await deleteFromCloudinary(oldPublicId);
          }
        }
      }

      // 2. Image-array keys (banners, gallery)
      if (IMAGE_ARRAY_KEYS.includes(s.key)) {
        if (existing?.value) {
          const oldIds = extractPublicIdsFromArray(existing.value);
          const newIds = extractPublicIdsFromArray(newValue);
          const removed = oldIds.filter((id) => !newIds.includes(id));
          for (const id of removed) {
            await deleteFromCloudinary(id);
          }
        }
      }

      // 3. Social links (custom icons)
      if (s.key === SOCIAL_LINKS_KEY) {
        if (existing?.value) {
          const oldIds = extractPublicIdsFromSocialLinks(existing.value);
          const newIds = extractPublicIdsFromSocialLinks(newValue);
          const removed = oldIds.filter((id) => !newIds.includes(id));
          for (const id of removed) {
            await deleteFromCloudinary(id);
          }
        }
      }

      const result = await prismaSettingUpsert(s.key, newValue, s.category);
      results.push(result);
    }

    return results;
  },

  remove: async (key: string) => {
    const existing = await settingRepository.findByKey(key);

    if (IMAGE_KEYS.includes(key)) {
      const oldPublicId = extractPublicIdFromValue(existing?.value ?? null);
      if (oldPublicId) await deleteFromCloudinary(oldPublicId);
    } else if (IMAGE_ARRAY_KEYS.includes(key)) {
      const oldIds = extractPublicIdsFromArray(existing?.value ?? null);
      for (const id of oldIds) await deleteFromCloudinary(id);
    } else if (key === SOCIAL_LINKS_KEY) {
      const oldIds = extractPublicIdsFromSocialLinks(existing?.value ?? null);
      for (const id of oldIds) await deleteFromCloudinary(id);
    }

    return settingRepository.remove(key);
  },
};

import { prisma } from "../../lib/prisma";
async function prismaSettingUpsert(
  key: string,
  value: string | null,
  category: string
) {
  return prisma.siteSetting.upsert({
    where: { key },
    update: { value, category },
    create: { key, value, category },
  });
}
