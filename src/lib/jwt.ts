import jwt from "jsonwebtoken";
import { config } from "../config";

const accessTokenExpiresIn = "1d" as const;
const refreshTokenExpiresIn = "1d" as const;

export interface AccessTokenPayload {
  id: number;
  role: string;
  permissions: string[];
  // null = unrestricted (can approve all batches)
  // number[] = scoped to specific batches
  // undefined = legacy token without scope claim (treat as unrestricted for safety)
  batchScopes?: number[] | null;
}

export function createAccessToken(payload: AccessTokenPayload): string {
  return jwt.sign(payload, config.accessTokenSecret, {
    expiresIn: accessTokenExpiresIn,
  });
}

export function createRefreshToken(payload: AccessTokenPayload): string {
  return jwt.sign(payload, config.refreshTokenSecret, {
    expiresIn: refreshTokenExpiresIn,
  });
}

export function verifyAccessToken(
  token: string
): Promise<AccessTokenPayload | null> {
  return new Promise((resolve, reject) => {
    jwt.verify(token, config.accessTokenSecret, (err, decoded) => {
      if (err) return reject(err);
      resolve(decoded as AccessTokenPayload);
    });
  });
}

export function verifyRefreshToken(
  token: string
): Promise<AccessTokenPayload | null> {
  return new Promise((resolve, reject) => {
    jwt.verify(token, config.refreshTokenSecret, (err, decoded) => {
      if (err) return reject(err);
      resolve(decoded as AccessTokenPayload);
    });
  });
}
