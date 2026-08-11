import { PrismaClient } from "../../node_modules/.prisma/ogn-client";

const globalForPrisma = globalThis as unknown as { ognPrisma: PrismaClient | undefined };

export const prisma =
  globalForPrisma.ognPrisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"],
  });

if (process.env.NODE_ENV !== "production") globalForPrisma.ognPrisma = prisma;
