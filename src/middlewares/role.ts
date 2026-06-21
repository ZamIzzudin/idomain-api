import type { NextFunction, Request, Response } from "express";
import { prisma } from "../lib/prisma";
import type { AuthenticatedRequest } from "./auth";
import { tokenHasPermission, userHasPermission } from "../lib/permission";

/**
 * Middleware factory: requires the authenticated user to hold `permission`.
 *
 * Checks the JWT-embedded permission list first (fast path) and falls back
 * to a DB lookup when the token does not carry permissions (e.g. legacy
 * tokens issued right after migration). Returns 403 on failure.
 */
export const requirePermission = (permission: string) => {
  return async (
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
  ) => {
    if (!req.user) {
      return res.status(401).json({ status: 401, message: "Unauthorized" });
    }

    // Fast path: permissions carried in the JWT
    let allowed = tokenHasPermission(req.user.permissions, permission);

    // Fallback: DB lookup for tokens without permission claims
    if (!allowed) {
      allowed = await userHasPermission(req.user.id, permission);
    }

    if (!allowed) {
      return res.status(403).json({
        status: 403,
        message: `Forbidden: missing permission "${permission}"`,
      });
    }

    next();
  };
};

/**
 * Guard: forbid a user from operating on themselves.
 * Reads target id from `req.params.id`. Use on delete/adjust endpoints.
 */
export const forbidSelfAction = (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  const targetId = Number(req.params.id);
  if (!isNaN(targetId) && req.user?.id === targetId) {
    return res.status(400).json({
      status: 400,
      message: "You cannot perform this action on your own account",
    });
  }
  next();
};

/**
 * Guard: forbid deleting the last Superadmin account in the system.
 * Resolves the target user's role; if it is a system Superadmin role and
 * only one such user remains, the request is rejected.
 */
export const forbidLastSuperadmin = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  const targetId = Number(req.params.id);
  if (isNaN(targetId)) return next();

  const target = await prisma.user.findUnique({
    where: { id: targetId },
    select: { role: { select: { slug: true, isSystem: true } } },
  });

  if (target?.role?.slug === "superadmin") {
    const superadminCount = await prisma.user.count({
      where: { role: { slug: "superadmin" } },
    });
    if (superadminCount <= 1) {
      return res.status(400).json({
        status: 400,
        message: "Cannot delete the last Superadmin account",
      });
    }
  }

  next();
};

/**
 * Guard: forbid a Superadmin from demoting themselves (removing their own
 * superadmin role). Prevents accidental lock-out when no other superadmin
 * exists. Works on PUT /auth/adjust/:id where body may contain roleId.
 */
export const forbidSelfDemote = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  const targetId = Number(req.params.id);
  if (isNaN(targetId) || !req.user) return next();

  if (req.user.id !== targetId) return next();

  const newRoleId = Number((req.body as any)?.roleId);
  if (!newRoleId) return next();

  const [currentRole, newRole] = await Promise.all([
    prisma.role.findFirst({
      where: { users: { some: { id: targetId } } },
      select: { slug: true },
    }),
    prisma.role.findUnique({
      where: { id: newRoleId },
      select: { slug: true },
    }),
  ]);

  if (currentRole?.slug === "superadmin" && newRole?.slug !== "superadmin") {
    return res.status(400).json({
      status: 400,
      message: "You cannot demote your own Superadmin role",
    });
  }

  next();
};
