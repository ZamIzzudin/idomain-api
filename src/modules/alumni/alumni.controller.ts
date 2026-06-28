import type { Request, Response } from "express";
import { alumniService, workHistoryService } from "./alumni.service";
import { stripHiddenFields, stripHiddenFieldsList } from "./alumni.service";
import {
  createAlumniSchema,
  updateAlumniSchema,
  alumniQuerySchema,
  alumniRegisterSchema,
  alumniLoginSchema,
  alumniLookupSchema,
  alumniClaimSchema,
  createWorkHistorySchema,
  updateWorkHistorySchema,
} from "./alumni.schema";
import { verifyAccessToken } from "../../lib/jwt";
import { canApproveAlumni, canAccessAlumniByBatch } from "../../lib/permission";
import type { AuthenticatedRequest } from "../../middlewares/auth";
import { uploadToCloudinary } from "../../lib/cloudinary";

/**
 * Resolve the caller's batch scope from the Authorization header.
 *
 * Returns:
 *  - { scope: null }    -> anonymous (public) caller, treated as unrestricted.
 *  - { scope: number[] } -> authenticated scoped approver (only these batches).
 *  - { scope: null }     -> authenticated unrestricted user (any batch).
 */
function resolveScope(authHeader?: string): Promise<{
  scope: number[] | null;
  role: string | undefined;
}> {
  if (!authHeader?.startsWith("Bearer ")) {
    return Promise.resolve({ scope: null, role: undefined });
  }
  return verifyAccessToken(authHeader.split(" ")[1])
    .then((decoded: any) => ({
      scope: decoded?.batchScopes === undefined ? null : decoded.batchScopes,
      role: decoded?.role,
    }))
    .catch(() => ({ scope: null, role: undefined }));
}

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

    // Resolve the caller's batch scope from the token if present (optional auth)
    const { scope, role } = await resolveScope(req.headers.authorization);

    if (!query.approved || query.approved === "all") {
      if (role !== "superadmin" && role !== "admin") {
        query.approved = "true";
      } else {
        delete query.approved;
      }
    }

    const result = await alumniService.list(query, scope);

    const isAdmin = role === "superadmin" || role === "admin";
    if (!isAdmin) {
      result.items = stripHiddenFieldsList(result.items);
    }

    return res.json({
      status: 200,
      message: "success",
      ...result,
    });
  },

  filterOptions: async (req: Request, res: Response) => {
    const province = req.query.province as string | undefined;
    const { scope } = await resolveScope(req.headers.authorization);
    const options = await alumniService.filterOptions(province, scope);
    return res.json({ status: 200, message: "success", data: options });
  },

  stats: async (req: Request, res: Response) => {
    const { scope } = await resolveScope(req.headers.authorization);
    const stats = await alumniService.stats(scope);
    return res.json({ status: 200, message: "success", data: stats });
  },

  getById: async (req: Request, res: Response) => {
    const { id } = req.params;
    const alumni = await alumniService.getById(Number(id));

    if (!alumni) {
      return res.status(404).json({ status: 404, message: "Alumni not found" });
    }

    // Enforce batch scope for authenticated scoped users viewing a record
    const { scope, role } = await resolveScope(req.headers.authorization);
    const isAdmin = role === "superadmin" || role === "admin";
    if (scope && !isAdmin) {
      const batch = (alumni as any).batch;
      if (batch === null || batch === undefined || !scope.includes(batch)) {
        return res.status(403).json({ status: 403, message: "Alumni out of your batch scope" });
      }
    }

    const out = isAdmin ? alumni : stripHiddenFields(alumni);
    return res.json({ status: 200, message: "success", data: out });
  },

  create: async (req: AuthenticatedRequest, res: Response) => {
    try {
      const payload: any = {
        name: req.body.name,
        graduationYear: parseInt(req.body.graduationYear),
        batch: parseInt(req.body.batch) || null,
        degreePrefix: req.body.degreePrefix || null,
        degreeSuffix: req.body.degreeSuffix || null,
        specialization: req.body.specialization || null,
        province: req.body.province || null,
        city: req.body.city || null,
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
    const alumniId = Number(id);

    try {
      // Fetch existing alumni to evaluate batch scope
      const existing = await alumniService.getById(alumniId);
      if (!existing) {
        return res.status(404).json({ status: 404, message: "Alumni not found" });
      }

      // Batch-scope guard: scoped approvers can only edit alumni within their scope.
      // Unrestricted users (scope null) pass through.
      const access = await canAccessAlumniByBatch(req.user!.id, (existing as any).batch);
      if (!access.allowed) {
        return res.status(403).json({
          status: 403,
          message: access.reason || "You cannot edit this alumni",
        });
      }

      const payload: any = {};

      if (req.body.name) payload.name = req.body.name;
      if (req.body.graduationYear) payload.graduationYear = parseInt(req.body.graduationYear);
      if (req.body.batch !== undefined) payload.batch = req.body.batch ? parseInt(req.body.batch) : null;
      if (req.body.degreePrefix !== undefined) payload.degreePrefix = req.body.degreePrefix || null;
      if (req.body.degreeSuffix !== undefined) payload.degreeSuffix = req.body.degreeSuffix || null;
      if (req.body.specialization !== undefined) payload.specialization = req.body.specialization || null;
      if (req.body.province !== undefined) payload.province = req.body.province || null;
      if (req.body.city !== undefined) payload.city = req.body.city || null;
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
    const alumniId = Number(id);

    try {
      // Fetch existing alumni to evaluate batch scope
      const existing = await alumniService.getById(alumniId);
      if (!existing) {
        return res.status(404).json({ status: 404, message: "Alumni not found" });
      }

      // Batch-scope guard: scoped approvers can only delete alumni within their scope.
      // Unrestricted users (scope null) pass through.
      const access = await canAccessAlumniByBatch(req.user!.id, (existing as any).batch);
      if (!access.allowed) {
        return res.status(403).json({
          status: 403,
          message: access.reason || "You cannot delete this alumni",
        });
      }

      await alumniService.remove(alumniId);
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

  lookup: async (req: Request, res: Response) => {
    const parsed = alumniLookupSchema.safeParse(req.query);

    if (!parsed.success) {
      return res.status(400).json({
        status: 400,
        message: "Invalid query parameters",
        errors: parsed.error.flatten().fieldErrors,
      });
    }

    try {
      const results = await alumniService.lookup(parsed.data.name, parsed.data.batch);
      return res.json({ status: 200, message: "success", data: results });
    } catch (error: any) {
      return res.status(400).json({
        status: 400,
        message: error.message || "Lookup failed",
      });
    }
  },

  claim: async (req: Request, res: Response) => {
    const { id } = req.params;

    const parsed = alumniClaimSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({
        status: 400,
        message: "Invalid payload",
        errors: parsed.error.flatten().fieldErrors,
      });
    }

    try {
      const result = await alumniService.claim(Number(id), parsed.data);
      return res.status(200).json({
        status: 200,
        message: "success",
        data: result,
      });
    } catch (error: any) {
      return res.status(400).json({
        status: 400,
        message: error.message || "Failed to claim alumni",
      });
    }
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
      if (req.body.batch !== undefined) payload.batch = req.body.batch ? parseInt(req.body.batch) : null;
      if (req.body.degreePrefix !== undefined) payload.degreePrefix = req.body.degreePrefix || null;
      if (req.body.degreeSuffix !== undefined) payload.degreeSuffix = req.body.degreeSuffix || null;
      if (req.body.specialization !== undefined) payload.specialization = req.body.specialization || null;
      if (req.body.province !== undefined) payload.province = req.body.province || null;
      if (req.body.city !== undefined) payload.city = req.body.city || null;
      if (req.body.email !== undefined) payload.email = req.body.email || null;
      if (req.body.contactNumber !== undefined) payload.contactNumber = req.body.contactNumber || null;
      if (req.body.password) payload.password = req.body.password;
      if (req.body.emailVisible !== undefined) payload.emailVisible = req.body.emailVisible === true || req.body.emailVisible === "true";
      if (req.body.contactNumberVisible !== undefined) payload.contactNumberVisible = req.body.contactNumberVisible === true || req.body.contactNumberVisible === "true";

      if (req.file) {
        const result = await uploadToCloudinary(req.file.buffer, "alumni");
        payload.photo = result.secure_url;
        payload.photoPublicId = result.public_id;
      } else if (req.body.photo) {
        payload.photo = req.body.photo;
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
    const alumniId = Number(id);

    try {
      const alumni = await alumniService.getById(alumniId);
      if (!alumni) {
        return res.status(404).json({ status: 404, message: "Alumni not found" });
      }

      // Batch-scoped authorization check
      const check = await canApproveAlumni(req.user!.id, (alumni as any).batch);
      if (!check.allowed) {
        return res.status(403).json({
          status: 403,
          message: check.reason || "You cannot approve this alumni",
        });
      }

      await alumniService.update(alumniId, { isApproved: true });
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
    const alumniId = Number(id);

    try {
      const alumni = await alumniService.getById(alumniId);
      if (!alumni) {
        return res.status(404).json({ status: 404, message: "Alumni not found" });
      }

      // Batch-scoped authorization check (reject requires the same scope as approve)
      const check = await canApproveAlumni(req.user!.id, (alumni as any).batch);
      if (!check.allowed) {
        return res.status(403).json({
          status: 403,
          message: check.reason || "You cannot reject this alumni",
        });
      }

      await alumniService.update(alumniId, { isApproved: false });
      return res.json({ status: 200, message: "Alumni rejected successfully" });
    } catch (error: any) {
      return res.status(400).json({
        status: 400,
        message: error.message || "Failed to reject alumni",
      });
    }
  },

  importExcel: async (req: AuthenticatedRequest, res: Response) => {
    try {
      if (!req.file) {
        return res.status(400).json({
          status: 400,
          message: "File Excel wajib diupload",
        });
      }

      const result = await alumniService.importFromExcel(req.file.buffer);

      return res.json({
        status: 200,
        message: `Berhasil mengimport ${result.imported} alumni`,
        data: result,
      });
    } catch (error: any) {
      console.error("Alumni import error:", error);
      return res.status(500).json({
        status: 500,
        message: error.message || "Failed to import alumni",
      });
    }
  },

  exportExcel: async (req: AuthenticatedRequest, res: Response) => {
    try {
      // Scoped approvers only export alumni within their batch scope.
      // null = unrestricted (superadmin / admin).
      const scope = req.user?.batchScopes ?? null;
      const buffer = await alumniService.exportToExcel(scope);

      const date = new Date().toISOString().slice(0, 10);
      res.setHeader(
        "Content-Type",
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
      );
      res.setHeader(
        "Content-Disposition",
        `attachment; filename="alumni_export_${date}.xlsx"`
      );

      return res.send(buffer);
    } catch (error: any) {
      console.error("Alumni export error:", error);
      return res.status(500).json({
        status: 500,
        message: error.message || "Failed to export alumni",
      });
    }
  },

  downloadTemplate: async (_req: AuthenticatedRequest, res: Response) => {
    try {
      const XLSX = await import("xlsx");
      const headerRow = [
        { "Nama Lengkap": "", "Tahun Lulus": "", "Angkatan": "", "Gelar (Depan)": "", "Gelar (Belakang)": "" }
      ];
      const worksheet = XLSX.utils.json_to_sheet(headerRow);
      worksheet["!cols"] = [
        { wch: 35 }, // name
        { wch: 15 }, // graduation_year
        { wch: 15 }, // batch
        { wch: 18 }, // degree_prefix
        { wch: 18 }, // degree_suffix
      ];
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, "Template");
      const buffer = XLSX.write(workbook, { type: "buffer", bookType: "xlsx" });

      res.setHeader(
        "Content-Type",
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
      );
      res.setHeader(
        "Content-Disposition",
        'attachment; filename="alumni_import_template.xlsx"'
      );

      return res.send(buffer);
    } catch (error: any) {
      console.error("Template download error:", error);
      return res.status(500).json({
        status: 500,
        message: error.message || "Failed to download template",
      });
    }
  },

  getPreferences: async (req: AuthenticatedRequest, res: Response) => {
    const alumni = await alumniService.getById(req.user!.id);

    if (!alumni) {
      return res.status(404).json({ status: 404, message: "Alumni not found" });
    }

    return res.json({
      status: 200,
      message: "success",
      data: {
        notifEnabled: (alumni as any).notifEnabled,
        notifReceiveAll: (alumni as any).notifReceiveAll,
        preferredCategories: (alumni as any).preferredCategories,
      },
    });
  },

  updatePreferences: async (req: AuthenticatedRequest, res: Response) => {
    const id = req.user!.id;

    try {
      const payload: any = {};

      if (req.body.notifEnabled !== undefined)
        payload.notifEnabled =
          req.body.notifEnabled === true || req.body.notifEnabled === "true";
      if (req.body.notifReceiveAll !== undefined)
        payload.notifReceiveAll =
          req.body.notifReceiveAll === true ||
          req.body.notifReceiveAll === "true";
      if (req.body.preferredCategories !== undefined) {
        payload.preferredCategories = Array.isArray(req.body.preferredCategories)
          ? req.body.preferredCategories
          : JSON.parse(req.body.preferredCategories || "[]");
      }

      const alumni = await alumniService.update(id, payload);

      return res.json({ status: 200, message: "success", data: alumni });
    } catch (error: any) {
      return res.status(400).json({
        status: 400,
        message: error.message || "Failed to update preferences",
      });
    }
  },
};

export const workHistoryController = {
  list: async (req: AuthenticatedRequest, res: Response) => {
    const alumniId = req.user!.id;
    const workHistories = await workHistoryService.listByAlumni(alumniId);
    return res.json({ status: 200, message: "success", data: workHistories });
  },

  listByAlumniId: async (req: Request, res: Response) => {
    const { alumniId } = req.params;
    const workHistories = await workHistoryService.listByAlumni(Number(alumniId));
    return res.json({ status: 200, message: "success", data: workHistories });
  },

  create: async (req: AuthenticatedRequest, res: Response) => {
    const parsed = createWorkHistorySchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({
        status: 400,
        message: "Invalid payload",
        errors: parsed.error.flatten().fieldErrors,
      });
    }

    try {
      const alumniId = req.user!.id;
      const result = await workHistoryService.create(alumniId, parsed.data);
      return res.status(201).json({ status: 201, message: "success", data: result });
    } catch (error: any) {
      return res.status(400).json({
        status: 400,
        message: error.message || "Failed to create work history",
      });
    }
  },

  update: async (req: AuthenticatedRequest, res: Response) => {
    const parsed = updateWorkHistorySchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({
        status: 400,
        message: "Invalid payload",
        errors: parsed.error.flatten().fieldErrors,
      });
    }

    try {
      const alumniId = req.user!.id;
      const { id } = req.params;
      const result = await workHistoryService.update(alumniId, Number(id), parsed.data);
      return res.json({ status: 200, message: "success", data: result });
    } catch (error: any) {
      return res.status(400).json({
        status: 400,
        message: error.message || "Failed to update work history",
      });
    }
  },

  remove: async (req: AuthenticatedRequest, res: Response) => {
    try {
      const alumniId = req.user!.id;
      const { id } = req.params;
      await workHistoryService.remove(alumniId, Number(id));
      return res.json({ status: 200, message: "Work history deleted successfully" });
    } catch (error: any) {
      return res.status(400).json({
        status: 400,
        message: error.message || "Failed to delete work history",
      });
    }
  },
};
