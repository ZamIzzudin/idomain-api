import bcrypt from "bcrypt";
import { prisma } from "../../lib/prisma";
import { authRepository } from "./auth.repository";
import type {
  LoginRequest,
  RegisterRequest,
  AdjustRequest,
  UserQueryRequest,
} from "./auth.schema";

type UserWithRole = {
  id: number;
  username: string;
  displayName: string | null;
  role: {
    id: number;
    name: string;
    slug: string;
    permissions: { permission: { name: string } }[];
    batchScopes: { batch: number }[];
  };
};

const DEFAULT_ROLE_ID = 2; // Admin

function toPublicUser(user: UserWithRole) {
  // Empty batchScopes array = unrestricted (null). Non-empty = scoped.
  const batchScopes =
    user.role.batchScopes.length === 0
      ? null
      : user.role.batchScopes.map((s) => s.batch);

  return {
    id: user.id,
    username: user.username,
    displayName: user.displayName,
    role: user.role.slug,
    roleName: user.role.name,
    roleId: user.role.id,
    permissions: user.role.permissions.map((rp) => rp.permission.name),
    batchScopes,
  };
}

export const authService = {
  login: async (payload: LoginRequest) => {
    const user = await authRepository.findByUsername(payload.username);

    if (!user) return null;
    if (user.status !== 1) return null;

    const isValid = await bcrypt.compare(payload.password, user.password);
    if (!isValid) return null;

    return toPublicUser(user);
  },

  me: async (id: number) => {
    const user = await authRepository.findById(id);
    if (!user) return null;
    return toPublicUser(user);
  },

  register: async (payload: RegisterRequest) => {
    const existing = await authRepository.findByUsername(payload.username);
    if (existing) {
      throw new Error("Username already exists");
    }

    const passwordHash = await bcrypt.hash(payload.password, 10);

    // Validate roleId exists if provided
    const roleId = payload.roleId ?? DEFAULT_ROLE_ID;
    const roleExists = await prisma.role.findUnique({ where: { id: roleId } });
    if (!roleExists) {
      throw new Error("Selected role does not exist");
    }

    const user = await authRepository.create({
      username: payload.username,
      password: passwordHash,
      displayName: payload.displayName,
      roleId,
    });

    const fresh = await authRepository.findById(user.id);
    if (!fresh) throw new Error("Failed to load created user");
    return toPublicUser(fresh);
  },

  list: (query: UserQueryRequest) => authRepository.findPaginated(query),

  adjust: async (id: number, payload: AdjustRequest) => {
    const data: any = {};
    if (payload.username !== undefined) data.username = payload.username;
    if (payload.displayName !== undefined)
      data.displayName = payload.displayName;
    if (payload.password) {
      data.password = await bcrypt.hash(payload.password, 10);
    }
    if (payload.roleId !== undefined) {
      const role = await prisma.role.findUnique({
        where: { id: payload.roleId },
      });
      if (!role) throw new Error("Selected role does not exist");
      data.roleId = payload.roleId;
    }
    if (payload.status !== undefined) data.status = payload.status;

    await authRepository.update(id, data);
    return true;
  },

  takedown: async (id: number) => {
    await authRepository.remove(id);
    return true;
  },
};
