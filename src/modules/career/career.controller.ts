import type { Request, Response } from "express";
import { careerService } from "./career.service";
import {
  createCareerSchema,
  updateCareerSchema,
  careerQuerySchema,
} from "./career.schema";
import type { AuthenticatedRequest } from "../../middlewares/auth";
import { uploadToCloudinary } from "../../lib/cloudinary";
import { pushService } from "../push/push.service";
import { prisma } from "../../lib/prisma";

// Resolve the correct author info based on authorType
// For ADMIN authors, the authorId points to a User, not an Alumni
async function resolveAuthor(career: any) {
  if (!career) return career;
  if (career.authorType === "ADMIN") {
    const admin = await prisma.user.findUnique({
      where: { id: career.authorId },
      select: { id: true, displayName: true },
    });
    return {
      ...career,
      author: admin
        ? { id: admin.id, name: admin.displayName || "Admin", photo: null }
        : career.author,
    };
  }
  return career;
}

async function resolveAuthors(careers: any[]) {
  // Batch resolve admin authors
  const adminIds = careers
    .filter((c) => c.authorType === "ADMIN")
    .map((c) => c.authorId)
    .filter((v, i, a) => a.indexOf(v) === i); // unique

  let adminMap: Record<number, { name: string; photo: null }> = {};
  if (adminIds.length > 0) {
    const admins = await prisma.user.findMany({
      where: { id: { in: adminIds } },
      select: { id: true, displayName: true },
    });
    adminMap = Object.fromEntries(
      admins.map((a) => [a.id, { name: a.displayName || "Admin", photo: null }])
    );
  }

  return careers.map((c) => {
    if (c.authorType === "ADMIN" && adminMap[c.authorId]) {
      return { ...c, author: { id: c.authorId, ...adminMap[c.authorId] } };
    }
    return c;
  });
}

export const careerController = {
  list: async (req: Request, res: Response) => {
    const parsed = careerQuerySchema.safeParse(req.query);

    if (!parsed.success) {
      return res.status(400).json({
        status: 400,
        message: "Invalid query parameters",
        errors: parsed.error.flatten().fieldErrors,
      });
    }

    const result = await careerService.list(parsed.data);
    result.items = await resolveAuthors(result.items);

    return res.json({
      status: 200,
      message: "success",
      ...result,
    });
  },

  filterOptions: async (_req: Request, res: Response) => {
    const options = await careerService.filterOptions();
    return res.json({ status: 200, message: "success", data: options });
  },

  getBySlug: async (req: Request, res: Response) => {
    const slug = req.params.slug as string;
    const career = await careerService.getBySlug(slug);

    if (!career) {
      return res.status(404).json({ status: 404, message: "Career not found" });
    }

    const resolved = await resolveAuthor(career);
    return res.json({ status: 200, message: "success", data: resolved });
  },

  getById: async (req: Request, res: Response) => {
    const { id } = req.params;
    const career = await careerService.getById(Number(id));

    if (!career) {
      return res.status(404).json({ status: 404, message: "Career not found" });
    }

    const resolved = await resolveAuthor(career);
    return res.json({ status: 200, message: "success", data: resolved });
  },

  create: async (req: AuthenticatedRequest, res: Response) => {
    try {
      const payload: any = {
        title: req.body.title,
        slug: req.body.slug || undefined,
        institutionName: req.body.institutionName,
        position: req.body.position,
        province: req.body.province || undefined,
        city: req.body.city || undefined,
        jobType: req.body.jobType,
        description: req.body.description || undefined,
        requirements: req.body.requirements || undefined,
        deadline: req.body.deadline || undefined,
        recruitmentEmail: req.body.recruitmentEmail || undefined,
        recruitmentUrl: req.body.recruitmentUrl || undefined,
        contactPerson: req.body.contactPerson || undefined,
        contactPhone: req.body.contactPhone || undefined,
        categoryId: req.body.categoryId ? Number(req.body.categoryId) : undefined,
        status: req.body.status || undefined,
      };

      const parsed = createCareerSchema.safeParse(payload);
      if (!parsed.success) {
        return res.status(400).json({
          status: 400,
          message: "Invalid payload",
          errors: parsed.error.flatten().fieldErrors,
        });
      }

      if (req.file) {
        const result = await uploadToCloudinary(req.file.buffer, "careers");
        payload.logo = result.secure_url;
        payload.logoPublicId = result.public_id;
      }

      payload.authorId = req.user!.id;

      // Determine author type based on user role
      const isAdmin = req.user!.role === "ADMIN" || req.user!.role === "SUPERADMIN";
      payload.authorType = isAdmin ? "ADMIN" : "ALUMNI";

      if (!isAdmin) {
        payload.status = "PENDING_REVIEW";
      }

      const career = await careerService.create(payload);

      // If published directly (admin), broadcast notifications
      if (career && career.status === "PUBLISHED" && career.category) {
        try {
          await pushService.broadcastNewCareer({
            id: career.id,
            title: career.title,
            slug: career.slug,
            categoryId: career.categoryId,
            category: { name: career.category.name },
          });
        } catch (err) {
          console.error("Push/notification broadcast error:", err);
        }
      }

      return res.status(201).json({
        status: 201,
        message: "success",
        data: career,
      });
    } catch (error: any) {
      console.error("Career create error:", error);
      return res.status(500).json({
        status: 500,
        message: error.message || "Failed to create career",
      });
    }
  },

  update: async (req: AuthenticatedRequest, res: Response) => {
    const { id } = req.params;

    try {
      // Check existing status before update
      const existing = await careerService.getById(Number(id));

      const payload: any = {};

      if (req.body.title) payload.title = req.body.title;
      if (req.body.slug !== undefined) payload.slug = req.body.slug;
      if (req.body.institutionName !== undefined)
        payload.institutionName = req.body.institutionName;
      if (req.body.position !== undefined) payload.position = req.body.position;
      if (req.body.province !== undefined)
        payload.province = req.body.province || null;
      if (req.body.city !== undefined)
        payload.city = req.body.city || null;
      if (req.body.jobType !== undefined) payload.jobType = req.body.jobType;
      if (req.body.description !== undefined)
        payload.description = req.body.description || null;
      if (req.body.requirements !== undefined)
        payload.requirements = req.body.requirements || null;
      if (req.body.deadline !== undefined)
        payload.deadline = req.body.deadline || null;
      if (req.body.recruitmentEmail !== undefined)
        payload.recruitmentEmail = req.body.recruitmentEmail || null;
      if (req.body.recruitmentUrl !== undefined)
        payload.recruitmentUrl = req.body.recruitmentUrl || null;
      if (req.body.contactPerson !== undefined)
        payload.contactPerson = req.body.contactPerson || null;
      if (req.body.contactPhone !== undefined)
        payload.contactPhone = req.body.contactPhone || null;
      if (req.body.categoryId !== undefined)
        payload.categoryId = Number(req.body.categoryId);
      if (req.body.status !== undefined) payload.status = req.body.status;

      if (req.file) {
        const result = await uploadToCloudinary(req.file.buffer, "careers");
        payload.logo = result.secure_url;
        payload.logoPublicId = result.public_id;
      } else if (String(req.body.removeLogo) === "true") {
        payload.logo = null;
        payload.logoPublicId = null;
      }

      const parsed = updateCareerSchema.safeParse(payload);
      if (!parsed.success) {
        return res.status(400).json({
          status: 400,
          message: "Invalid payload",
          errors: parsed.error.flatten().fieldErrors,
        });
      }

      const career = await careerService.update(Number(id), payload);

      // If status transitioned to PUBLISHED, broadcast notifications
      if (
        career &&
        career.status === "PUBLISHED" &&
        existing &&
        existing.status !== "PUBLISHED" &&
        career.category
      ) {
        try {
          await pushService.broadcastNewCareer({
            id: career.id,
            title: career.title,
            slug: career.slug,
            categoryId: career.categoryId,
            category: { name: career.category.name },
          });
        } catch (err) {
          console.error("Push/notification broadcast error:", err);
        }
      }

      return res.json({ status: 200, message: "success", data: career });
    } catch (error: any) {
      return res.status(400).json({
        status: 400,
        message: error.message || "Failed to update career",
      });
    }
  },

  remove: async (req: AuthenticatedRequest, res: Response) => {
    const { id } = req.params;

    try {
      await careerService.remove(Number(id));
      return res.json({
        status: 200,
        message: `Successfully removed career ${id}`,
      });
    } catch (error: any) {
      return res.status(400).json({
        status: 400,
        message: error.message || "Failed to delete career",
      });
    }
  },

  approve: async (req: AuthenticatedRequest, res: Response) => {
    const { id } = req.params;

    try {
      const career = await careerService.approve(
        Number(id),
        req.user!.id
      );

      // Broadcast push notification + create in-app notifications
      if (career && career.category) {
        try {
          await pushService.broadcastNewCareer({
            id: career.id,
            title: career.title,
            slug: career.slug,
            categoryId: career.categoryId,
            category: { name: career.category.name },
          });
        } catch (err) {
          console.error("Push/notification broadcast error:", err);
        }
      }

      return res.json({ status: 200, message: "success", data: career });
    } catch (error: any) {
      return res.status(400).json({
        status: 400,
        message: error.message || "Failed to approve career",
      });
    }
  },

  reject: async (req: AuthenticatedRequest, res: Response) => {
    const { id } = req.params;

    try {
      const career = await careerService.reject(Number(id));
      return res.json({ status: 200, message: "success", data: career });
    } catch (error: any) {
      return res.status(400).json({
        status: 400,
        message: error.message || "Failed to reject career",
      });
    }
  },
};
