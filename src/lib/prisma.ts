import { PrismaClient } from "@prisma/client";

declare global {
  var __prisma__: PrismaClient | undefined;
}

export const prisma =
  global.__prisma__ ??
  new PrismaClient({
    log: ["error", "warn"],
  });

if (!global.__prisma__) {
  global.__prisma__ = prisma;
}
