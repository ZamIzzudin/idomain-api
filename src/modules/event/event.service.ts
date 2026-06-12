import { eventRepository } from "./event.repository";
import { deleteFromCloudinary } from "../../lib/cloudinary";
import type {
  CreateEventRequest,
  UpdateEventRequest,
  EventQueryRequest,
} from "./event.schema";

function generateSlug(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .trim();
}

async function ensureUniqueSlug(slug: string, excludeId?: number): Promise<string> {
  const existing = await eventRepository.findBySlug(slug);
  if (!existing || existing.id === excludeId) return slug;

  let counter = 1;
  let newSlug = `${slug}-${counter}`;
  while (true) {
    const dup = await eventRepository.findBySlug(newSlug);
    if (!dup || dup.id === excludeId) return newSlug;
    counter++;
    newSlug = `${slug}-${counter}`;
  }
}

export const eventService = {
  list: (query: EventQueryRequest) => eventRepository.findPaginated(query),

  getBySlug: async (slug: string) => {
    const event = await eventRepository.findBySlug(slug);
    if (event && event.status === "PUBLISHED") {
      await eventRepository.incrementViews(event.id);
    }
    return event;
  },

  getById: (id: number) => eventRepository.findById(id),

  create: async (data: CreateEventRequest) => {
    const slug = data.slug
      ? await ensureUniqueSlug(generateSlug(data.slug))
      : await ensureUniqueSlug(generateSlug(data.title));

    let publishedAt: Date | null = null;
    if (data.publishedAt) {
      publishedAt = new Date(data.publishedAt);
    } else if (data.status === "PUBLISHED") {
      publishedAt = new Date();
    }

    return eventRepository.create({
      title: data.title,
      slug,
      content: data.content,
      excerpt: data.excerpt,
      author: data.author,
      tags: data.tags,
      eventDate: new Date(data.eventDate),
      endDate: data.endDate ? new Date(data.endDate) : null,
      location: data.location,
      status: data.status as any,
      metaTitle: data.metaTitle,
      metaDescription: data.metaDescription,
      metaKeywords: data.metaKeywords,
      publishedAt,
    });
  },

  update: async (id: number, data: UpdateEventRequest) => {
    const existing = await eventRepository.findById(id);
    if (!existing) throw new Error("Event not found");

    if (data.featuredImage !== undefined && existing.featuredImagePublicId) {
      if (data.featuredImage !== existing.featuredImage) {
        await deleteFromCloudinary(existing.featuredImagePublicId);
      }
    }

    const updateData: any = { ...data };

    // Handle slug update
    if (data.slug !== undefined) {
      updateData.slug = await ensureUniqueSlug(generateSlug(data.slug), id);
    } else if (data.title && data.title !== existing.title) {
      updateData.slug = await ensureUniqueSlug(generateSlug(data.title), id);
    }

    if (data.eventDate) {
      updateData.eventDate = new Date(data.eventDate);
    }

    if (data.endDate !== undefined) {
      updateData.endDate = data.endDate ? new Date(data.endDate) : null;
    }

    // Handle publishedAt
    if (data.publishedAt !== undefined) {
      updateData.publishedAt = data.publishedAt ? new Date(data.publishedAt) : null;
    } else if (data.status === "PUBLISHED" && existing.status !== "PUBLISHED") {
      updateData.publishedAt = new Date();
    }

    return eventRepository.update(id, updateData);
  },

  remove: async (id: number) => {
    const existing = await eventRepository.findById(id);
    if (!existing) throw new Error("Event not found");

    if (existing.featuredImagePublicId) {
      await deleteFromCloudinary(existing.featuredImagePublicId);
    }

    return eventRepository.remove(id);
  },

  filterOptions: () =>
    eventRepository.findDistinctTags().then((tags) => ({ tags })),
};
