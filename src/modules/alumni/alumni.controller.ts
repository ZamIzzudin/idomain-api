import type { Request, Response } from "express";
import { alumniService } from "./alumni.service";
import {
  createAlumniSchema,
  updateAlumniSchema,
  alumniQuerySchema,
  alumniRegisterSchema,
  alumniLoginSchema,
} from "./alumni.schema";
import type { AuthenticatedRequest } from "../../middlewares/auth";
import { uploadToCloudinary } from "../../lib/cloudinary";

export const alumniController = {
  list: async (req: Request, res: Response) => {
    const parsed = alumniQuerySchema.safeParse(req.query);

    if (!parsed.success) {
      return res.status(400).json({
        status: 400,
        message: "Invalid query parameters",
        errors: parsed.error.flatten().fieldErrors,
      });
    }

    const query = parsed.data;
    // Default: only show approved alumni unless requester is admin/superadmin
    if (!query.approved) {
      const role = (req as AuthenticatedRequest).user?.role;
      if (role !== "SUPERADMIN" && role !== "ADMIN") {
        query.approved = "true";
      }
    }

    const result = await alumniService.list(query);

    return res.json({
      status: 200,
      message: "success",
      ...result,
    });
  },

  filterOptions: async (_req: Request, res: Response) => {
    const options = await alumniService.filterOptions();
    return res.json({ status: 200, message: "success", data: options });
  },

  getById: async (req: Request, res: Response) => {
    const { id } = req.params;
    const alumni = await alumniService.getById(Number(id));

    if (!alumni) {
      return res.status(404).json({ status: 404, message: "Alumni not found" });
    }

    return res.json({ status: 200, message: "success", data: alumni });
  },

  create: async (req: AuthenticatedRequest, res: Response) => {
    try {
      const payload: any = {
        name: req.body.name,
        graduationYear: parseInt(req.body.graduationYear),
        degree: req.body.degree || null,
        specialization: req.body.specialization || null,
        institution: req.body.institution || null,
        email: req.body.email || null,
        contactNumber: req.body.contactNumber || null,
        password: req.body.password || null,
      };

      const parsed = createAlumniSchema.safeParse(payload);
      if (!parsed.success) {
        return res.status(400).json({
          status: 400,
          message: "Invalid payload",
          errors: parsed.error.flatten().fieldErrors,
        });
      }

      if (req.file) {
        const result = await uploadToCloudinary(req.file.buffer, "alumni");
        payload.photo = result.secure_url;
        payload.photoPublicId = result.public_id;
      }

      const alumni = await alumniService.create(payload);

      return res.status(201).json({
        status: 201,
        message: "success",
        data: alumni,
      });
    } catch (error: any) {
      console.error("Alumni create error:", error);
      return res.status(500).json({
        status: 500,
        message: error.message || "Failed to create alumni",
      });
    }
  },

  update: async (req: AuthenticatedRequest, res: Response) => {
    const { id } = req.params;

    try {
      const payload: any = {};

      if (req.body.name) payload.name = req.body.name;
      if (req.body.graduationYear) payload.graduationYear = parseInt(req.body.graduationYear);
      if (req.body.degree !== undefined) payload.degree = req.body.degree || null;
      if (req.body.specialization !== undefined) payload.specialization = req.body.specialization || null;
      if (req.body.institution !== undefined) payload.institution = req.body.institution || null;
      if (req.body.email !== undefined) payload.email = req.body.email || null;
      if (req.body.contactNumber !== undefined) payload.contactNumber = req.body.contactNumber || null;
      if (req.body.password) payload.password = req.body.password;
      if (req.body.isApproved !== undefined) payload.isApproved = req.body.isApproved === "true" || req.body.isApproved === true;

      if (req.file) {
        const result = await uploadToCloudinary(req.file.buffer, "alumni");
        payload.photo = result.secure_url;
        payload.photoPublicId = result.public_id;
      } else if (req.body.removePhoto === "true") {
        payload.photo = null;
        payload.photoPublicId = null;
      }

      const alumni = await alumniService.update(Number(id), payload);
      return res.json({ status: 200, message: "success", data: alumni });
    } catch (error: any) {
      return res.status(400).json({
        status: 400,
        message: error.message || "Failed to update alumni",
      });
    }
  },

  remove: async (req: AuthenticatedRequest, res: Response) => {
    const { id } = req.params;

    try {
      await alumniService.remove(Number(id));
      return res.json({
        status: 200,
        message: `Successfully removed alumni ${id}`,
      });
    } catch (error: any) {
      return res.status(400).json({
        status: 400,
        message: error.message || "Failed to delete alumni",
      });
    }
  },

  register: async (req: Request, res: Response) => {
    const parsed = alumniRegisterSchema.safeParse(req.body);

    if (!parsed.success) {
      return res.status(400).json({
        status: 400,
        message: "Invalid payload",
        errors: parsed.error.flatten().fieldErrors,
      });
    }

    try {
      const data = { ...parsed.data };
      if (data.photo) {
        delete (data as any).photo;
      }
      const result = await alumniService.register(data);
      return res.status(201).json({
        status: 201,
        message: "success",
        data: result,
      });
    } catch (error: any) {
      return res.status(400).json({
        status: 400,
        message: error.message || "Failed to register",
      });
    }
  },

  login: async (req: Request, res: Response) => {
    const parsed = alumniLoginSchema.safeParse(req.body);

    if (!parsed.success) {
      return res.status(400).json({
        status: 400,
        message: "Email dan password wajib diisi",
        errors: parsed.error.flatten().fieldErrors,
      });
    }

    const result = await alumniService.login(parsed.data);

    if (!result) {
      return res.status(401).json({
        status: 401,
        message: "Email atau password tidak valid",
      });
    }

    return res.json({
      status: 200,
      message: "success",
      data: result,
    });
  },

  getMe: async (req: AuthenticatedRequest, res: Response) => {
    const alumni = await alumniService.getById(req.user!.id);

    if (!alumni) {
      return res.status(404).json({ status: 404, message: "Alumni not found" });
    }

    return res.json({ status: 200, message: "success", data: alumni });
  },

  updateMe: async (req: AuthenticatedRequest, res: Response) => {
    const id = req.user!.id;

    try {
      const payload: any = {};

      if (req.body.name) payload.name = req.body.name;
      if (req.body.graduationYear) payload.graduationYear = parseInt(req.body.graduationYear);
      if (req.body.degree !== undefined) payload.degree = req.body.degree || null;
      if (req.body.specialization !== undefined) payload.specialization = req.body.specialization || null;
      if (req.body.institution !== undefined) payload.institution = req.body.institution || null;
      if (req.body.email !== undefined) payload.email = req.body.email || null;
      if (req.body.contactNumber !== undefined) payload.contactNumber = req.body.contactNumber || null;
      if (req.body.password) payload.password = req.body.password;

      if (req.file) {
        const result = await uploadToCloudinary(req.file.buffer, "alumni");
        payload.photo = result.secure_url;
        payload.photoPublicId = result.public_id;
      } else if (req.body.removePhoto === "true") {
        payload.photo = null;
        payload.photoPublicId = null;
      }

      const alumni = await alumniService.update(id, payload);
      return res.json({ status: 200, message: "success", data: alumni });
    } catch (error: any) {
      return res.status(400).json({
        status: 400,
        message: error.message || "Failed to update profile",
      });
    }
  },

  approve: async (req: AuthenticatedRequest, res: Response) => {
    const { id } = req.params;

    try {
      await alumniService.update(Number(id), { isApproved: true });
      return res.json({ status: 200, message: "Alumni approved successfully" });
    } catch (error: any) {
      return res.status(400).json({
        status: 400,
        message: error.message || "Failed to approve alumni",
      });
    }
  },

  reject: async (req: AuthenticatedRequest, res: Response) => {
    const { id } = req.params;

    try {
      await alumniService.update(Number(id), { isApproved: false });
      return res.json({ status: 200, message: "Alumni rejected successfully" });
    } catch (error: any) {
      return res.status(400).json({
        status: 400,
        message: error.message || "Failed to reject alumni",
      });
    }
  },
};
