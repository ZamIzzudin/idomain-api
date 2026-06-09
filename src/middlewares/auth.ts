import type { NextFunction, Request, Response } from "express";
import { verifyAccessToken } from "../lib/jwt";

export interface AuthenticatedRequest extends Request {
  user?: {
    id: number;
    role: string;
    token: string;
  };
}

export const isAuthenticated = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  const authHeader = req.headers.authorization;

  if (!authHeader) {
    return res.status(401).json({
      status: 401,
      message: "No token detected",
    });
  }

  try {
    const token = authHeader.split(" ")[1];
    const decoded = await verifyAccessToken(token);

    if (!decoded) {
      return res.status(401).json({
        status: 401,
        message: "Invalid token",
      });
    }

    req.user = {
      id: decoded.id as number,
      role: decoded.role as string,
      token,
    };

    next();
  } catch (error) {
    return res.status(401).json({
      status: 401,
      message: "Expired or invalid token",
    });
  }
};
