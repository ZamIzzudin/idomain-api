import bcrypt from "bcrypt";
import * as XLSX from "xlsx";
import { alumniRepository, workHistoryRepository } from "./alumni.repository";
import { deleteFromCloudinary } from "../../lib/cloudinary";
import { createAccessToken } from "../../lib/jwt";
import type {
  CreateAlumniRequest,
  UpdateAlumniRequest,
  AlumniQueryRequest,
  AlumniRegisterRequest,
  AlumniLoginRequest,
  AlumniClaimRequest,
  CreateWorkHistoryRequest,
  UpdateWorkHistoryRequest,
} from "./alumni.schema";

export function stripHiddenFields(alumni: any) {
  if (!alumni) return alumni;
  const result = { ...alumni };
  if (!result.emailVisible) delete result.email;
  if (!result.contactNumberVisible) delete result.contactNumber;
  delete result.emailVisible;
  delete result.contactNumberVisible;
  return result;
}

export function stripHiddenFieldsList(items: any[]) {
  return items.map(stripHiddenFields);
}

export const alumniService = {
  list: (query: AlumniQueryRequest, batches?: number[] | null) =>
    alumniRepository.findPaginated(query, batches),

  getById: (id: number) => alumniRepository.findById(id),

  create: async (data: CreateAlumniRequest) => {
    const createData: any = { ...data };
    if (data.password) {
      createData.password = await bcrypt.hash(data.password, 10);
    }
    return alumniRepository.create(createData);
  },

  update: async (id: number, data: UpdateAlumniRequest) => {
    const existing = await alumniRepository.findById(id);
    if (!existing) throw new Error("Alumni not found");

    const updateData: any = { ...data };

    if (data.password) {
      updateData.password = await bcrypt.hash(data.password, 10);
    } else {
      delete updateData.password;
    }

    if (data.photo !== undefined && existing.photoPublicId) {
      if (data.photo !== existing.photo) {
        await deleteFromCloudinary(existing.photoPublicId);
      }
    }

    return alumniRepository.update(id, updateData);
  },

  remove: async (id: number) => {
    const existing = await alumniRepository.findById(id);
    if (!existing) throw new Error("Alumni not found");

    if (existing.photoPublicId) {
      await deleteFromCloudinary(existing.photoPublicId);
    }

    return alumniRepository.remove(id);
  },

  register: async (data: AlumniRegisterRequest) => {
    if (data.email) {
      const existing = await alumniRepository.findByEmail(data.email);
      if (existing) throw new Error("Email already registered");
    }

    const passwordHash = await bcrypt.hash(data.password, 10);

    const alumni = await alumniRepository.create({
      ...data,
      password: passwordHash,
      isApproved: false,
    });

    return {
      id: alumni.id,
      name: alumni.name,
      email: alumni.email,
      message: "Registration successful. Please wait for admin approval.",
    };
  },

  login: async (data: AlumniLoginRequest) => {
    const alumni = await alumniRepository.findByEmail(data.email);
    if (!alumni) return null;
    if (!alumni.password) return null;
    if (alumni.status !== 1) return null;

    const isValid = await bcrypt.compare(data.password, alumni.password);
    if (!isValid) return null;

    const access_token = createAccessToken({
      id: alumni.id,
      role: "alumni",
      permissions: [],
    });

    return {
      id: alumni.id,
      name: alumni.name,
      email: alumni.email,
      photo: alumni.photo,
      isApproved: alumni.isApproved,
      access_token,
    };
  },

  lookup: async (name: string, batch: number) => {
    return alumniRepository.findClaimableByNameAndYear(name, batch);
  },

  claim: async (id: number, data: { email: string; password: string; [key: string]: any }) => {
    const existing = await alumniRepository.findById(id);
    if (!existing) throw new Error("Alumni not found");
    if (existing.password) throw new Error("Alumni already has an account");

    const emailExists = await alumniRepository.findByEmail(data.email);
    if (emailExists && emailExists.id !== id) {
      throw new Error("Email already registered");
    }

    const passwordHash = await bcrypt.hash(data.password, 10);

    const updateData: any = {
      email: data.email,
      password: passwordHash,
      contactNumber: data.contactNumber || existing.contactNumber,
      degreePrefix: data.degreePrefix || existing.degreePrefix,
      degreeSuffix: data.degreeSuffix || existing.degreeSuffix,
      specialization: data.specialization || existing.specialization,
      province: data.province || existing.province,
      city: data.city || existing.city,
      batch: data.batch || existing.batch,
    };

    if (data.photo) updateData.photo = data.photo;

    const alumni = await alumniRepository.update(id, updateData);

    const message = existing.isApproved
      ? "Claim successful. Your alumni profile is now active."
      : "Claim successful. Please wait for admin approval.";

    return {
      id: alumni.id,
      name: alumni.name,
      email: alumni.email,
      isApproved: alumni.isApproved,
      message,
    };
  },

  filterOptions: (province?: string, batches?: number[] | null) =>
    Promise.all([
      alumniRepository.findDistinctYears(batches),
      alumniRepository.findDistinctSpecializations(batches),
      alumniRepository.findDistinctProvinces(batches),
      alumniRepository.findDistinctCities(province, batches),
    ]).then(([years, specializations, provinces, cities]) => ({ years, specializations, provinces, cities })),

  stats: (batches?: number[] | null) => alumniRepository.getStats(batches),

  importFromExcel: async (buffer: Buffer) => {
    const workbook = XLSX.read(buffer, { type: "buffer" });
    const sheetName = workbook.SheetNames[0];
    const sheet = workbook.Sheets[sheetName];
    const rows = XLSX.utils.sheet_to_json<Record<string, any>>(sheet);

    const validRows: Array<{
      name: string;
      graduationYear: number;
      batch?: number | null;
      degreePrefix?: string | null;
      degreeSuffix?: string | null;
    }> = [];

    const errors: Array<{ row: number; message: string }> = [];

    rows.forEach((row, index) => {
      const rowNum = index + 2; // Excel row (1 = header)

      const name = row["name"]?.toString().trim();
      const graduationYearRaw = row["graduation_year"];

      if (!name) {
        errors.push({ row: rowNum, message: "name wajib diisi" });
        return;
      }

      let graduationYear: number | undefined;
      if (graduationYearRaw !== undefined && graduationYearRaw !== null && graduationYearRaw !== "") {
        graduationYear = typeof graduationYearRaw === "number"
          ? graduationYearRaw
          : parseInt(String(graduationYearRaw), 10);
      }

      if (!graduationYear || isNaN(graduationYear) || graduationYear < 1900 || graduationYear > 2100) {
        errors.push({ row: rowNum, message: "graduation_year wajib diisi dan harus berupa angka 1900-2100" });
        return;
      }

      const entry: any = { name, graduationYear };

      if (row["degree_prefix"]?.toString().trim()) {
        entry.degreePrefix = row["degree_prefix"].toString().trim();
      }
      if (row["degree_suffix"]?.toString().trim()) {
        entry.degreeSuffix = row["degree_suffix"].toString().trim();
      }

      let batch: number | undefined;
      if (row["batch"] !== undefined && row["batch"] !== null && row["batch"] !== "") {
        batch = typeof row["batch"] === "number" ? row["batch"] : parseInt(String(row["batch"]), 10);
        if (isNaN(batch)) batch = undefined;
      }
      if (batch) entry.batch = batch;

      validRows.push(entry);
    });

    if (validRows.length === 0) {
      return {
        imported: 0,
        errors: errors.length > 0 ? errors : [{ row: 0, message: "Tidak ada data valid ditemukan" }],
      };
    }

    const result = await alumniRepository.bulkCreate(validRows);

    return {
      imported: result.count,
      errors: errors.length > 0 ? errors : undefined,
    };
  },

  exportToExcel: async (batches?: number[] | null) => {
    const data = await alumniRepository.exportAll(batches);

    const rows = data.map((item) => ({
      name: item.name,
      graduation_year: item.graduationYear,
      batch: item.batch || "",
      degree_prefix: item.degreePrefix || "",
      degree_suffix: item.degreeSuffix || "",
      specialization: item.specialization || "",
      email: item.email || "",
      contact_number: item.contactNumber || "",
    }));

    const worksheet = XLSX.utils.json_to_sheet(rows);

    // Set column widths
    worksheet["!cols"] = [
      { wch: 30 }, // name
      { wch: 16 }, // graduation_year
      { wch: 10 }, // batch
      { wch: 15 }, // degree_prefix
      { wch: 15 }, // degree_suffix
      { wch: 25 }, // specialization
      { wch: 30 }, // email
      { wch: 20 }, // contact_number
    ];

    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Alumni");

    return XLSX.write(workbook, { type: "buffer", bookType: "xlsx" });
  },
};

export const workHistoryService = {
  listByAlumni: async (alumniId: number) => {
    return workHistoryRepository.findByAlumniId(alumniId);
  },

  create: async (alumniId: number, data: CreateWorkHistoryRequest) => {
    const alumni = await alumniRepository.findById(alumniId);
    if (!alumni) throw new Error("Alumni not found");

    return workHistoryRepository.create({
      alumniId,
      ...data,
    });
  },

  update: async (alumniId: number, workHistoryId: number, data: UpdateWorkHistoryRequest) => {
    const workHistory = await workHistoryRepository.findById(workHistoryId);
    if (!workHistory) throw new Error("Work history not found");
    if (workHistory.alumniId !== alumniId) throw new Error("Unauthorized");

    return workHistoryRepository.update(workHistoryId, data);
  },

  remove: async (alumniId: number, workHistoryId: number) => {
    const workHistory = await workHistoryRepository.findById(workHistoryId);
    if (!workHistory) throw new Error("Work history not found");
    if (workHistory.alumniId !== alumniId) throw new Error("Unauthorized");

    return workHistoryRepository.remove(workHistoryId);
  },
};
