import { careerRepository } from "./career.repository";
import { deleteFromCloudinary } from "../../lib/cloudinary";
import type {
  CreateCareerRequest,
  UpdateCareerRequest,
  CareerQueryRequest,
} from "./career.schema";

function generateSlug(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .trim();
}

async function ensureUniqueSlug(
  slug: string,
  excludeId?: number
): Promise<string> {
  const existing = await careerRepository.findBySlug(slug);
  if (!existing || existing.id === excludeId) return slug;

  let counter = 1;
  let newSlug = `${slug}-${counter}`;
  while (true) {
    const dup = await careerRepository.findBySlug(newSlug);
    if (!dup || dup.id === excludeId) return newSlug;
    counter++;
    newSlug = `${slug}-${counter}`;
  }
}

export const careerService = {
  list: (query: CareerQueryRequest) => careerRepository.findPaginated(query),

  getBySlug: async (slug: string) => {
    const career = await careerRepository.findBySlug(slug);
    if (!career) return null;

    // Auto-close: if deadline has passed and status is still PUBLISHED, set to CLOSED
    if (
      (career.status === "PUBLISHED" || career.status === ("CLOSED" as any)) &&
      career.deadline
    ) {
      const now = new Date();
      if (now > career.deadline && career.status === "PUBLISHED") {
        await careerRepository.update(career.id, { status: "CLOSED" as any });
      }
    }

    // Increment views for PUBLISHED and CLOSED
    if (career.status === "PUBLISHED" || career.status === ("CLOSED" as any)) {
      await careerRepository.incrementViews(career.id);
    }

    return career;
  },

  getById: (id: number) => careerRepository.findById(id),

  create: async (data: CreateCareerRequest & { authorId: number; authorType?: string }) => {
    const slug = data.slug
      ? await ensureUniqueSlug(generateSlug(data.slug))
      : await ensureUniqueSlug(generateSlug(data.title));

    let publishedAt: Date | null = null;
    let deadline: Date | null = null;

    if (data.deadline) {
      deadline = new Date(data.deadline);
    }

    return careerRepository.create({
      title: data.title,
      slug,
      institutionName: data.institutionName,
      logo: (data as any).logo || null,
      logoPublicId: (data as any).logoPublicId || null,
      position: data.position,
      province: data.province || null,
      city: data.city || null,
      jobType: data.jobType,
      description: data.description || null,
      requirements: data.requirements || null,
      deadline,
      recruitmentEmail: data.recruitmentEmail || null,
      recruitmentUrl: data.recruitmentUrl || null,
      contactPerson: data.contactPerson || null,
      contactPhone: data.contactPhone || null,
      categoryId: data.categoryId,
      status: data.status as any,
      authorId: data.authorId,
      authorType: (data as any).authorType || "ALUMNI",
      publishedAt,
    });
  },

  update: async (id: number, data: UpdateCareerRequest) => {
    const existing = await careerRepository.findById(id);
    if (!existing) throw new Error("Career not found");

    if (
      data.logo !== undefined &&
      existing.logoPublicId &&
      data.logo !== existing.logo
    ) {
      await deleteFromCloudinary(existing.logoPublicId);
    }

    const updateData: any = { ...data };

    if (data.slug !== undefined) {
      updateData.slug = await ensureUniqueSlug(generateSlug(data.slug), id);
    } else if (data.title && data.title !== existing.title) {
      updateData.slug = await ensureUniqueSlug(generateSlug(data.title), id);
    }

    if (data.deadline !== undefined) {
      updateData.deadline = data.deadline ? new Date(data.deadline) : null;
    }

    return careerRepository.update(id, updateData);
  },

  remove: async (id: number) => {
    const existing = await careerRepository.findById(id);
    if (!existing) throw new Error("Career not found");

    if (existing.logoPublicId) {
      await deleteFromCloudinary(existing.logoPublicId);
    }

    return careerRepository.remove(id);
  },

  approve: async (id: number, approvedById: number) => {
    return careerRepository.update(id, {
      status: "PUBLISHED",
      publishedAt: new Date(),
      approvedById,
      approvedAt: new Date(),
    });
  },

  reject: async (id: number) => {
    return careerRepository.update(id, {
      status: "DRAFT",
    });
  },

  filterOptions: async () => {
    const [provinces, jobTypes] = await Promise.all([
      careerRepository.findDistinctProvinces("PUBLISHED"),
      careerRepository.findDistinctJobTypes("PUBLISHED"),
    ]);
    return { provinces, jobTypes };
  },
};
