import jwt from "jsonwebtoken";
import { config } from "../config";

const accessTokenExpiresIn = "1d" as const;
const refreshTokenExpiresIn = "1d" as const;

export function createAccessToken(id: number, role: string): string {
  return jwt.sign(
    { id, role },
    config.accessTokenSecret,
    { expiresIn: accessTokenExpiresIn }
  );
}

export function createRefreshToken(id: number, role: string): string {
  return jwt.sign(
    { id, role },
    config.refreshTokenSecret,
    { expiresIn: refreshTokenExpiresIn }
  );
}

export function verifyAccessToken(
  token: string
): Promise<jwt.JwtPayload | null> {
  return new Promise((resolve, reject) => {
    jwt.verify(token, config.accessTokenSecret, (err, decoded) => {
      if (err) return reject(err);
      resolve(decoded as jwt.JwtPayload);
    });
  });
}

export function verifyRefreshToken(
  token: string
): Promise<jwt.JwtPayload | null> {
  return new Promise((resolve, reject) => {
    jwt.verify(token, config.refreshTokenSecret, (err, decoded) => {
      if (err) return reject(err);
      resolve(decoded as jwt.JwtPayload);
    });
  });
}
