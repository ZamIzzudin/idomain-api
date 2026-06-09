import { type UserRole } from "@prisma/client";
import { prisma } from "../../lib/prisma";
import type { UserQueryRequest } from "./auth.schema";

export const authRepository = {
  findByUsername: (username: string) =>
    prisma.user.findUnique({ where: { username } }),

  findById: (id: number) =>
    prisma.user.findUnique({ where: { id } }),

  findPaginated: async (query: UserQueryRequest) => {
    const { page, limit, search, role, sortBy, sortOrder } = query;

    const where: any = {};

    if (search) {
      where.OR = [
        { username: { contains: search, mode: "insensitive" } },
        { displayName: { contains: search, mode: "insensitive" } },
      ];
    }

    if (role) {
      where.role = role;
    }

    const orderBy: any = { [sortBy]: sortOrder };

    const [items, total] = await Promise.all([
      prisma.user.findMany({
        where,
        orderBy,
        skip: (page - 1) * limit,
        take: limit,
        select: {
          id: true,
          username: true,
          displayName: true,
          role: true,
          createdAt: true,
        },
      }),
      prisma.user.count({ where }),
    ]);

    return {
      items,
      total,
      page,
      perPage: limit,
      totalPages: Math.ceil(total / limit),
    };
  },

  create: (data: {
    username: string;
    password: string;
    displayName?: string;
    role?: UserRole;
  }) =>
    prisma.user.create({ data }),

  update: (
    id: number,
    data: {
      username?: string;
      displayName?: string;
      password?: string;
      role?: UserRole;
    }
  ) =>
    prisma.user.update({ where: { id }, data }),

  remove: (id: number) =>
    prisma.user.delete({ where: { id } }),
};
