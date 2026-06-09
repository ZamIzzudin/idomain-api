import { testimonialRepository } from "./testimonial.repository";
import { deleteFromCloudinary } from "../../lib/cloudinary";
import type {
  CreateTestimonialRequest,
  UpdateTestimonialRequest,
  TestimonialQueryRequest,
} from "./testimonial.schema";

export const testimonialService = {
  list: (query: TestimonialQueryRequest) => testimonialRepository.findPaginated(query),

  listPublished: () => testimonialRepository.findAllPublished(),

  getById: (id: number) => testimonialRepository.findById(id),

  create: (data: CreateTestimonialRequest & { photo?: string | null; photoPublicId?: string | null }) =>
    testimonialRepository.create({
      name: data.name,
      institution: data.institution,
      testimonial: data.testimonial,
      photo: data.photo,
      photoPublicId: data.photoPublicId,
    }),

  update: async (id: number, data: UpdateTestimonialRequest & { photo?: string | null; photoPublicId?: string | null; status?: number }) => {
    const existing = await testimonialRepository.findById(id);
    if (!existing) throw new Error("Testimonial not found");

    if (data.photo !== undefined && existing.photoPublicId) {
      if (data.photo !== existing.photo) {
        await deleteFromCloudinary(existing.photoPublicId);
      }
    }

    return testimonialRepository.update(id, data);
  },

  remove: async (id: number) => {
    const existing = await testimonialRepository.findById(id);
    if (!existing) throw new Error("Testimonial not found");

    if (existing.photoPublicId) {
      await deleteFromCloudinary(existing.photoPublicId);
    }

    return testimonialRepository.remove(id);
  },
};
