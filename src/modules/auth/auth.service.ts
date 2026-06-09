import bcrypt from "bcrypt";
import { type UserRole } from "@prisma/client";
import { authRepository } from "./auth.repository";
import type { LoginRequest, RegisterRequest, AdjustRequest, UserQueryRequest } from "./auth.schema";

export const authService = {
  login: async (payload: LoginRequest) => {
    const user = await authRepository.findByUsername(payload.username);

    if (!user) return null;
    if (user.status !== 1) return null;

    const isValid = await bcrypt.compare(payload.password, user.password);
    if (!isValid) return null;

    return {
      id: user.id,
      username: user.username,
      displayName: user.displayName,
      role: user.role,
    };
  },

  me: async (id: number) => {
    const user = await authRepository.findById(id);
    if (!user) return null;

    return {
      id: user.id,
      username: user.username,
      displayName: user.displayName,
      role: user.role,
    };
  },

  register: async (payload: RegisterRequest) => {
    const existing = await authRepository.findByUsername(payload.username);
    if (existing) {
      throw new Error("Username already exists");
    }

    const passwordHash = await bcrypt.hash(payload.password, 10);

    const user = await authRepository.create({
      username: payload.username,
      password: passwordHash,
      displayName: payload.displayName,
    });

    return {
      id: user.id,
      username: user.username,
      displayName: user.displayName,
      role: user.role,
    };
  },

  list: (query: UserQueryRequest) => authRepository.findPaginated(query),

  adjust: async (id: number, payload: AdjustRequest) => {
    const data: any = {};
    if (payload.username) data.username = payload.username;
    if (payload.displayName) data.displayName = payload.displayName;
    if (payload.role) data.role = payload.role as UserRole;
    if (payload.password) {
      data.password = await bcrypt.hash(payload.password, 10);
    }

    await authRepository.update(id, data);
    return true;
  },

  takedown: async (id: number) => {
    await authRepository.remove(id);
    return true;
  },
};
