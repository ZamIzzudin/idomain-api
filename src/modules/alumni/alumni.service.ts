import bcrypt from "bcrypt";
import { alumniRepository } from "./alumni.repository";
import { deleteFromCloudinary } from "../../lib/cloudinary";
import { createAccessToken } from "../../lib/jwt";
import type {
  CreateAlumniRequest,
  UpdateAlumniRequest,
  AlumniQueryRequest,
  AlumniRegisterRequest,
  AlumniLoginRequest,
} from "./alumni.schema";

export const alumniService = {
  list: (query: AlumniQueryRequest) => alumniRepository.findPaginated(query),

  getById: (id: number) => alumniRepository.findById(id),

  create: async (data: CreateAlumniRequest) => {
    const createData: any = { ...data };
    // Hash password if provided
    if (data.password) {
      createData.password = await bcrypt.hash(data.password, 10);
    }
    return alumniRepository.create(createData);
  },

  update: async (id: number, data: UpdateAlumniRequest) => {
    const existing = await alumniRepository.findById(id);
    if (!existing) throw new Error("Alumni not found");

    const updateData: any = { ...data };

    // Hash password if provided
    if (data.password) {
      updateData.password = await bcrypt.hash(data.password, 10);
    } else {
      // Don't overwrite with undefined/null if not provided
      delete updateData.password;
    }

    // If photo is being changed, cleanup old photo from CDN
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
    // Check if email already exists
    if (data.email) {
      const existing = await alumniRepository.findByEmail(data.email);
      if (existing) throw new Error("Email already registered");
    }

    const passwordHash = await bcrypt.hash(data.password, 10);

    const alumni = await alumniRepository.create({
      ...data,
      password: passwordHash,
      isApproved: false, // Needs admin approval
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
    if (!alumni.isApproved) return { error: "not_approved" } as any;

    const isValid = await bcrypt.compare(data.password, alumni.password);
    if (!isValid) return null;

    const access_token = createAccessToken(alumni.id, "ALUMNI");

    return {
      id: alumni.id,
      name: alumni.name,
      email: alumni.email,
      access_token,
    };
  },

  filterOptions: () =>
    Promise.all([
      alumniRepository.findDistinctYears(),
      alumniRepository.findDistinctSpecializations(),
    ]).then(([years, specializations]) => ({ years, specializations })),
};
