import { prisma } from "../../lib/prisma";

export const roleRepository = {
  list: () =>
    prisma.role.findMany({
      orderBy: { id: "asc" },
      include: {
        _count: { select: { users: true } },
        permissions: {
          select: { permission: { select: { id: true, name: true } } },
        },
        batchScopes: { select: { batch: true } },
      },
    }),

  findById: (id: number) =>
    prisma.role.findUnique({
      where: { id },
      include: {
        _count: { select: { users: true } },
        permissions: {
          select: { permission: { select: { id: true, name: true } } },
        },
        batchScopes: { select: { batch: true } },
      },
    }),

  findBySlug: (slug: string) =>
    prisma.role.findUnique({ where: { slug } }),

  create: (data: {
    name: string;
    slug: string;
    description?: string;
  }) => prisma.role.create({ data }),

  update: (
    id: number,
    data: { name?: string; slug?: string; description?: string }
  ) => prisma.role.update({ where: { id }, data }),

  remove: (id: number) => prisma.role.delete({ where: { id } }),

  setPermissions: async (roleId: number, permissionIds: number[]) => {
    await prisma.rolePermission.deleteMany({ where: { roleId } });
    if (permissionIds.length === 0) return;
    await prisma.rolePermission.createMany({
      data: permissionIds.map((permissionId) => ({ roleId, permissionId })),
      skipDuplicates: true,
    });
  },

  setBatchScopes: async (roleId: number, batches: number[]) => {
    await prisma.roleBatchScope.deleteMany({ where: { roleId } });
    if (batches.length === 0) return;
    await prisma.roleBatchScope.createMany({
      data: batches.map((batch) => ({ roleId, batch })),
      skipDuplicates: true,
    });
  },

  countUsers: (roleId: number) =>
    prisma.user.count({ where: { roleId } }),
};

export const permissionRepository = {
  list: () =>
    prisma.permission.findMany({
      orderBy: [{ module: "asc" }, { name: "asc" }],
    }),
};
