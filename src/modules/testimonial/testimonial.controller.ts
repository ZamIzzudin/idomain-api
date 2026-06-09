import type { Request, Response } from "express";
import { testimonialService } from "./testimonial.service";
import {
  createTestimonialSchema,
  updateTestimonialSchema,
  testimonialQuerySchema,
} from "./testimonial.schema";
import type { AuthenticatedRequest } from "../../middlewares/auth";
import { uploadToCloudinary } from "../../lib/cloudinary";

export const testimonialController = {
  list: async (req: Request, res: Response) => {
    const parsed = testimonialQuerySchema.safeParse(req.query);
    if (!parsed.success) {
      return res.status(400).json({
        status: 400,
        message: "Invalid query parameters",
        errors: parsed.error.flatten().fieldErrors,
      });
    }
    const result = await testimonialService.list(parsed.data);
    return res.json({ status: 200, message: "success", ...result });
  },

  listPublished: async (_req: Request, res: Response) => {
    const items = await testimonialService.listPublished();
    return res.json({ status: 200, message: "success", data: items });
  },

  getById: async (req: Request, res: Response) => {
    const item = await testimonialService.getById(Number(req.params.id));
    if (!item) return res.status(404).json({ status: 404, message: "Testimonial not found" });
    return res.json({ status: 200, message: "success", data: item });
  },

  create: async (req: AuthenticatedRequest, res: Response) => {
    try {
      const payload: any = {
        name: req.body.name,
        institution: req.body.institution || undefined,
        testimonial: req.body.testimonial,
      };

      const parsed = createTestimonialSchema.safeParse(payload);
      if (!parsed.success) {
        return res.status(400).json({
          status: 400,
          message: "Invalid payload",
          errors: parsed.error.flatten().fieldErrors,
        });
      }

      if (req.file) {
        const result = await uploadToCloudinary(req.file.buffer, "testimonials");
        payload.photo = result.secure_url;
        payload.photoPublicId = result.public_id;
      }

      const item = await testimonialService.create(payload);
      return res.status(201).json({ status: 201, message: "success", data: item });
    } catch (error: any) {
      console.error("Testimonial create error:", error);
      return res.status(500).json({ status: 500, message: error.message || "Failed to create testimonial" });
    }
  },

  update: async (req: AuthenticatedRequest, res: Response) => {
    try {
      const payload: any = {};
      if (req.body.name) payload.name = req.body.name;
      if (req.body.institution !== undefined) payload.institution = req.body.institution;
      if (req.body.testimonial) payload.testimonial = req.body.testimonial;

      if (req.file) {
        const result = await uploadToCloudinary(req.file.buffer, "testimonials");
        payload.photo = result.secure_url;
        payload.photoPublicId = result.public_id;
      } else if (req.body.removePhoto === "true") {
        payload.photo = null;
        payload.photoPublicId = null;
      }

      const item = await testimonialService.update(Number(req.params.id), payload);
      return res.json({ status: 200, message: "success", data: item });
    } catch (error: any) {
      return res.status(400).json({ status: 400, message: error.message || "Failed to update testimonial" });
    }
  },

  remove: async (req: AuthenticatedRequest, res: Response) => {
    try {
      await testimonialService.remove(Number(req.params.id));
      return res.json({ status: 200, message: "Successfully removed testimonial" });
    } catch (error: any) {
      return res.status(400).json({ status: 400, message: error.message || "Failed to delete testimonial" });
    }
  },
};
