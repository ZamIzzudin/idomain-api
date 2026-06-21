import { prisma } from "../../lib/prisma";
import type { UserQueryRequest } from "./auth.schema";

export const authRepository = {
  findByUsername: (username: string) =>
    prisma.user.findUnique({
      where: { username },
      include: {
        role: {
          select: {
            id: true,
            name: true,
            slug: true,
            permissions: {
              select: { permission: { select: { name: true } } },
            },
            batchScopes: { select: { batch: true } },
          },
        },
      },
    }),

  findById: (id: number) =>
    prisma.user.findUnique({
      where: { id },
      include: {
        role: {
          select: {
            id: true,
            name: true,
            slug: true,
            permissions: {
              select: { permission: { select: { name: true } } },
            },
            batchScopes: { select: { batch: true } },
          },
        },
      },
    }),

  findPaginated: async (query: UserQueryRequest) => {
    const { page, limit, search, roleId, sortBy, sortOrder } = query;

    const where: any = {};

    if (search) {
      where.OR = [
        { username: { contains: search, mode: "insensitive" } },
        { displayName: { contains: search, mode: "insensitive" } },
      ];
    }

    if (roleId) {
      where.roleId = roleId;
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
          status: true,
          createdAt: true,
          role: {
            select: {
              id: true,
              name: true,
              slug: true,
            },
          },
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
    roleId?: number;
  }) => prisma.user.create({ data }),

  update: (
    id: number,
    data: {
      username?: string;
      displayName?: string;
      password?: string;
      roleId?: number;
      status?: number;
    }
  ) => prisma.user.update({ where: { id }, data }),

  remove: (id: number) => prisma.user.delete({ where: { id } }),
};
