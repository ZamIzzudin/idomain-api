import { prisma } from "../../lib/prisma";
import { roleRepository, permissionRepository } from "./role.repository";
import type { CreateRoleRequest, UpdateRoleRequest } from "./role.schema";

export const roleService = {
  list: () => roleRepository.list(),

  permissions: () => permissionRepository.list(),

  create: async (payload: CreateRoleRequest) => {
    const existing = await roleRepository.findBySlug(payload.slug);
    if (existing) {
      throw new Error("Role slug already exists");
    }

    // Validate all permission ids exist
    if (payload.permissionIds.length > 0) {
      const valid = await prisma.permission.count({
        where: { id: { in: payload.permissionIds } },
      });
      if (valid !== payload.permissionIds.length) {
        throw new Error("One or more permission ids are invalid");
      }
    }

    const role = await roleRepository.create({
      name: payload.name,
      slug: payload.slug,
      description: payload.description,
    });

    await roleRepository.setPermissions(role.id, payload.permissionIds);

    // Batch scopes only relevant when alumni.approve is granted
    if (payload.batchScopes && payload.batchScopes.length > 0) {
      await roleRepository.setBatchScopes(role.id, payload.batchScopes);
    }

    return roleRepository.findById(role.id);
  },

  update: async (id: number, payload: UpdateRoleRequest) => {
    const existing = await roleRepository.findById(id);
    if (!existing) throw new Error("Role not found");

    // System roles cannot have their slug changed
    if (existing.isSystem && payload.slug && payload.slug !== existing.slug) {
      throw new Error("Cannot change slug of a system role");
    }

    // Slug uniqueness (if changing)
    if (payload.slug && payload.slug !== existing.slug) {
      const clash = await roleRepository.findBySlug(payload.slug);
      if (clash) throw new Error("Role slug already exists");
    }

    const data: { name?: string; slug?: string; description?: string } = {};
    if (payload.name !== undefined) data.name = payload.name;
    if (payload.slug !== undefined && !existing.isSystem) data.slug = payload.slug;
    if (payload.description !== undefined) data.description = payload.description;

    if (Object.keys(data).length > 0) {
      await roleRepository.update(id, data);
    }

    if (payload.permissionIds !== undefined) {
      // Validate permission ids
      if (payload.permissionIds.length > 0) {
        const valid = await prisma.permission.count({
          where: { id: { in: payload.permissionIds } },
        });
        if (valid !== payload.permissionIds.length) {
          throw new Error("One or more permission ids are invalid");
        }
      }
      await roleRepository.setPermissions(id, payload.permissionIds);
    }

    // Batch scopes (always sync when provided; empty array resets to unrestricted)
    if (payload.batchScopes !== undefined) {
      await roleRepository.setBatchScopes(id, payload.batchScopes);
    }

    return roleRepository.findById(id);
  },

  remove: async (id: number) => {
    const role = await roleRepository.findById(id);
    if (!role) throw new Error("Role not found");
    if (role.isSystem) {
      throw new Error("System roles cannot be deleted");
    }
    const userCount = await roleRepository.countUsers(id);
    if (userCount > 0) {
      throw new Error(
        `Cannot delete role: ${userCount} user(s) are still assigned. Reassign them first.`
      );
    }
    await roleRepository.remove(id);
    return true;
  },
};
