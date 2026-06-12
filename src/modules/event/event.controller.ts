import type { Request, Response } from "express";
import { eventService } from "./event.service";
import {
  createEventSchema,
  updateEventSchema,
  eventQuerySchema,
} from "./event.schema";
import type { AuthenticatedRequest } from "../../middlewares/auth";
import { uploadToCloudinary } from "../../lib/cloudinary";

export const eventController = {
  list: async (req: Request, res: Response) => {
    const parsed = eventQuerySchema.safeParse(req.query);

    if (!parsed.success) {
      return res.status(400).json({
        status: 400,
        message: "Invalid query parameters",
        errors: parsed.error.flatten().fieldErrors,
      });
    }

    const result = await eventService.list(parsed.data);

    return res.json({
      status: 200,
      message: "success",
      ...result,
    });
  },

  filterOptions: async (_req: Request, res: Response) => {
    const options = await eventService.filterOptions();
    return res.json({ status: 200, message: "success", data: options });
  },

  getBySlug: async (req: Request, res: Response) => {
    const slug = req.params.slug as string;
    const event = await eventService.getBySlug(slug);

    if (!event) {
      return res.status(404).json({ status: 404, message: "Event not found" });
    }

    return res.json({ status: 200, message: "success", data: event });
  },

  getById: async (req: Request, res: Response) => {
    const { id } = req.params;
    const event = await eventService.getById(Number(id));

    if (!event) {
      return res.status(404).json({ status: 404, message: "Event not found" });
    }

    return res.json({ status: 200, message: "success", data: event });
  },

  create: async (req: AuthenticatedRequest, res: Response) => {
    try {
      const payload: any = {
        title: req.body.title,
        slug: req.body.slug || undefined,
        content: req.body.content || undefined,
        excerpt: req.body.excerpt || undefined,
        author: req.body.author || undefined,
        tags: req.body.tags ? JSON.parse(req.body.tags) : undefined,
        eventDate: req.body.eventDate,
        endDate: req.body.endDate || undefined,
        location: req.body.location || undefined,
        status: req.body.status || undefined,
        publishedAt: req.body.publishedAt || undefined,
        metaTitle: req.body.metaTitle || undefined,
        metaDescription: req.body.metaDescription || undefined,
        metaKeywords: req.body.metaKeywords
          ? JSON.parse(req.body.metaKeywords)
          : undefined,
      };

      const parsed = createEventSchema.safeParse(payload);
      if (!parsed.success) {
        return res.status(400).json({
          status: 400,
          message: "Invalid payload",
          errors: parsed.error.flatten().fieldErrors,
        });
      }

      if (req.file) {
        const result = await uploadToCloudinary(req.file.buffer, "events");
        payload.featuredImage = result.secure_url;
        payload.featuredImagePublicId = result.public_id;
      }

      const event = await eventService.create(payload);

      return res.status(201).json({
        status: 201,
        message: "success",
        data: event,
      });
    } catch (error: any) {
      console.error("Event create error:", error);
      return res.status(500).json({
        status: 500,
        message: error.message || "Failed to create event",
      });
    }
  },

  update: async (req: AuthenticatedRequest, res: Response) => {
    const { id } = req.params;

    try {
      const payload: any = {};

      if (req.body.title) payload.title = req.body.title;
      if (req.body.slug !== undefined) payload.slug = req.body.slug;
      if (req.body.content !== undefined) payload.content = req.body.content;
      if (req.body.excerpt !== undefined) payload.excerpt = req.body.excerpt;
      if (req.body.author !== undefined) payload.author = req.body.author;
      if (req.body.tags !== undefined)
        payload.tags = JSON.parse(req.body.tags);
      if (req.body.eventDate !== undefined) payload.eventDate = req.body.eventDate;
      if (req.body.endDate !== undefined) payload.endDate = req.body.endDate || null;
      if (req.body.location !== undefined) payload.location = req.body.location;
      if (req.body.status !== undefined) payload.status = req.body.status;
      if (req.body.publishedAt !== undefined) payload.publishedAt = req.body.publishedAt || null;
      if (req.body.metaTitle !== undefined) payload.metaTitle = req.body.metaTitle;
      if (req.body.metaDescription !== undefined)
        payload.metaDescription = req.body.metaDescription;
      if (req.body.metaKeywords !== undefined)
        payload.metaKeywords = JSON.parse(req.body.metaKeywords);

      if (req.file) {
        const result = await uploadToCloudinary(req.file.buffer, "events");
        payload.featuredImage = result.secure_url;
        payload.featuredImagePublicId = result.public_id;
      } else if (String(req.body.removeImage) === "true") {
        payload.featuredImage = null;
        payload.featuredImagePublicId = null;
      }

      const parsed = updateEventSchema.safeParse(payload);
      if (!parsed.success) {
        return res.status(400).json({
          status: 400,
          message: "Invalid payload",
          errors: parsed.error.flatten().fieldErrors,
        });
      }

      const event = await eventService.update(Number(id), payload);
      return res.json({ status: 200, message: "success", data: event });
    } catch (error: any) {
      return res.status(400).json({
        status: 400,
        message: error.message || "Failed to update event",
      });
    }
  },

  remove: async (req: AuthenticatedRequest, res: Response) => {
    const { id } = req.params;

    try {
      await eventService.remove(Number(id));
      return res.json({
        status: 200,
        message: `Successfully removed event ${id}`,
      });
    } catch (error: any) {
      return res.status(400).json({
        status: 400,
        message: error.message || "Failed to delete event",
      });
    }
  },
};
