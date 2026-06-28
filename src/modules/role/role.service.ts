import { prisma } from "../../lib/prisma";
import { roleRepository, permissionRepository } from "./role.repository";
import type { CreateRoleRequest, UpdateRoleRequest } from "./role.schema";

/**
 * Convert a free-form name into a URL-safe slug
 * (lowercase, ASCII alnum + dashes).
 */
function slugify(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

/**
 * Generate a unique slug derived from `name`. Collisions are resolved by
 * appending an incrementing numeric suffix (-2, -3, ...).
 */
async function generateUniqueSlug(name: string): Promise<string> {
  const base = slugify(name) || "role";
  let candidate = base;
  let suffix = 2;
  while (await roleRepository.findBySlug(candidate)) {
    candidate = `${base}-${suffix++}`;
  }
  return candidate;
}

export const roleService = {
  list: () => roleRepository.list(),

  permissions: () => permissionRepository.list(),

  create: async (payload: CreateRoleRequest) => {
    // Slug is always generated from name; callers may not supply it.
    const slug = await generateUniqueSlug(payload.name);

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
      slug,
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

    const data: { name?: string; slug?: string; description?: string } = {};
    if (payload.name !== undefined) data.name = payload.name;
    if (payload.description !== undefined) data.description = payload.description;

    // Regenerate the slug when a non-system role is renamed.
    if (payload.name !== undefined && !existing.isSystem) {
      data.slug = await generateUniqueSlug(payload.name);
    }

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
