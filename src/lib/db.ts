/**
 * Prisma Database Client — Singleton
 *
 * Provides a single PrismaClient instance shared across the application.
 * In development, the client is attached to `globalThis` to survive
 * Next.js hot-module-reload without opening new database connections.
 */

import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["query", "error", "warn"] : ["error"],
  });

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
