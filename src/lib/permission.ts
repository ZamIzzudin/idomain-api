import { prisma } from "./prisma";

/**
 * Load the permission names granted to a user via its role.
 * Returns an empty array for unknown users / roles.
 */
export async function getUserPermissions(userId: number): Promise<string[]> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      role: {
        select: {
          permissions: {
            select: { permission: { select: { name: true } } },
          },
        },
      },
    },
  });

  if (!user?.role) return [];
  return user.role.permissions.map((rp) => rp.permission.name);
}

/**
 * Convenience: does `userId` have `permission`?
 */
export async function userHasPermission(
  userId: number,
  permission: string
): Promise<boolean> {
  const perms = await getUserPermissions(userId);
  return perms.includes(permission);
}

/**
 * In-memory check used by middleware when JWT already carries the
 * permission list (avoids an extra DB round-trip per request).
 */
export function tokenHasPermission(
  tokenPermissions: string[] | undefined,
  permission: string
): boolean {
  return Array.isArray(tokenPermissions) && tokenPermissions.includes(permission);
}

/**
 * Load the batch scope (list of batches) granted to a user via its role.
 * Returns null when the role has NO scope rows (= unrestricted, can approve
 * any batch including null). Returns an array of batches when scope is set.
 */
export async function getUserBatchScopes(
  userId: number
): Promise<number[] | null> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      role: {
        select: {
          batchScopes: { select: { batch: true } },
        },
      },
    },
  });

  if (!user?.role) return null;
  if (user.role.batchScopes.length === 0) return null; // unrestricted
  return user.role.batchScopes.map((s) => s.batch);
}

/**
 * Check whether a user can approve an alumni with the given batch value.
 *
 * Rules (per product decision):
 *  - User must hold the alumni.approve permission first.
 *  - Unrestricted scope (null) can approve ANY alumni, including null batch.
 *  - Scoped approver can only approve alumni whose batch is in their scope.
 *  - Alumni with null batch can ONLY be approved by unrestricted approvers.
 */
export async function canApproveAlumni(
  userId: number,
  alumniBatch: number | null | undefined
): Promise<{ allowed: boolean; reason?: string }> {
  const hasPerm = await userHasPermission(userId, "alumni.approve");
  if (!hasPerm) {
    return { allowed: false, reason: "Missing permission: alumni.approve" };
  }

  const scope = await getUserBatchScopes(userId);

  // Unrestricted approver
  if (scope === null) {
    return { allowed: true };
  }

  // Alumni without a batch: only unrestricted approvers can approve
  if (alumniBatch === null || alumniBatch === undefined) {
    return {
      allowed: false,
      reason: "This alumni has no batch and can only be approved by an unrestricted approver",
    };
  }

  // Scoped approver: batch must be in scope
  if (!scope.includes(alumniBatch)) {
    return {
      allowed: false,
      reason: `Your approval scope does not include batch ${alumniBatch}`,
    };
  }

  return { allowed: true };
}

/**
 * Generic batch-scope guard for alumni operations (update, delete).
 *
 * Semantics (per product decision):
 *  - Unrestricted scope (null) -> full access to ALL alumni regardless of batch.
 *  - Scoped approver -> can ONLY update/delete alumni whose batch is in scope.
 *    Alumni outside scope (different batch, no batch, or already approved by
 *    others) cannot be modified or removed.
 *
 * Note: this function does NOT check the alumni.approve permission. The caller
 * must enforce the relevant module permission (alumni.update / alumni.delete)
 * via route-level middleware (requirePermission) before invoking this guard.
 */
export async function canAccessAlumniByBatch(
  userId: number,
  alumniBatch: number | null | undefined
): Promise<{ allowed: boolean; reason?: string }> {
  const scope = await getUserBatchScopes(userId);

  // Unrestricted user -> full access
  if (scope === null) {
    return { allowed: true };
  }

  // Alumni without a batch: only unrestricted users can modify
  if (alumniBatch === null || alumniBatch === undefined) {
    return {
      allowed: false,
      reason: "This alumni has no batch and can only be modified by an unrestricted user",
    };
  }

  // Scoped user: batch must be in scope
  if (!scope.includes(alumniBatch)) {
    return {
      allowed: false,
      reason: `Your access scope does not include batch ${alumniBatch}`,
    };
  }

  return { allowed: true };
}
