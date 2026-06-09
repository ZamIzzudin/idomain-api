import type { Request, Response } from "express";
import { authService } from "./auth.service";
import { createAccessToken } from "../../lib/jwt";
import { loginSchema, registerSchema, adjustSchema, userQuerySchema } from "./auth.schema";
import type { AuthenticatedRequest } from "../../middlewares/auth";

export const authController = {
  login: async (req: Request, res: Response) => {
    const parsed = loginSchema.safeParse(req.body);

    if (!parsed.success) {
      return res.status(400).json({
        status: 400,
        message: "Username dan password wajib diisi",
      });
    }

    const user = await authService.login(parsed.data);

    if (!user) {
      return res.status(401).json({
        status: 401,
        message: "Username atau password tidak valid",
      });
    }

    const access_token = createAccessToken(user.id, user.role);

    return res.json({
      status: 200,
      message: "success",
      id: user.id,
      username: user.username,
      display_name: user.displayName,
      role: user.role,
      access_token,
    });
  },

  me: async (req: AuthenticatedRequest, res: Response) => {
    if (!req.user) {
      return res.status(401).json({ status: 401, message: "Unauthorized" });
    }

    const user = await authService.me(req.user.id);

    if (!user) {
      return res.status(400).json({ status: 400, message: "User not found" });
    }

    return res.json({
      status: 200,
      message: "success",
      id: user.id,
      username: user.username,
      display_name: user.displayName,
      role: user.role,
      access_token: req.user.token,
    });
  },

  register: async (req: AuthenticatedRequest, res: Response) => {
    const parsed = registerSchema.safeParse(req.body);

    if (!parsed.success) {
      return res.status(400).json({
        status: 400,
        message: "Invalid payload",
      });
    }

    try {
      const user = await authService.register(parsed.data);
      const access_token = createAccessToken(user.id, user.role);

      return res.status(201).json({
        status: 201,
        message: "success",
        data: {
          id: user.id,
          username: user.username,
          display_name: user.displayName,
          role: user.role,
          access_token,
        },
      });
    } catch (error: any) {
      return res.status(400).json({
        status: 400,
        message: error.message,
      });
    }
  },

  userList: async (req: Request, res: Response) => {
    const parsed = userQuerySchema.safeParse(req.query);

    if (!parsed.success) {
      return res.status(400).json({
        status: 400,
        message: "Invalid query parameters",
        errors: parsed.error.flatten().fieldErrors,
      });
    }

    const result = await authService.list(parsed.data);

    return res.json({
      status: 200,
      message: "success",
      ...result,
    });
  },

  adjust: async (req: AuthenticatedRequest, res: Response) => {
    const { id } = req.params;
    const parsed = adjustSchema.safeParse(req.body);

    if (!parsed.success) {
      return res.status(400).json({
        status: 400,
        message: "Invalid payload",
      });
    }

    try {
      await authService.adjust(Number(id), parsed.data);
      return res.json({
        status: 200,
        message: `Successfully updated user ${id}`,
      });
    } catch (error: any) {
      return res.status(400).json({
        status: 400,
        message: error.message,
      });
    }
  },

  takedown: async (req: AuthenticatedRequest, res: Response) => {
    const { id } = req.params;

    try {
      await authService.takedown(Number(id));
      return res.json({
        status: 200,
        message: `Successfully removed user ${id}`,
      });
    } catch (error: any) {
      return res.status(400).json({
        status: 400,
        message: error.message,
      });
    }
  },
};
