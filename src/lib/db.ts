/**
 * Prisma Database Client — Singleton (Neon Serverless)
 *
 * Uses @prisma/adapter-neon to connect to Neon PostgreSQL over HTTP/WebSocket.
 * In development, the client is attached to `globalThis` to survive
 * Next.js hot-module-reload without opening new database connections.
 */

import { PrismaClient } from "@prisma/client";
import { PrismaNeon } from "@prisma/adapter-neon";
import { neon } from "@neondatabase/serverless";

function createPrismaClient(): PrismaClient {
  const connectionString = process.env.DATABASE_URL;

  // When DATABASE_URL is not set (e.g. in tests), return a proxy that
  // throws only when methods are actually called — not at import time.
  if (!connectionString) {
    return new Proxy({} as PrismaClient, {
      get(_target, prop) {
        if (typeof prop === "string" && !prop.startsWith("_")) {
          return new Proxy({}, {
            get() {
              return () => {
                throw new Error(`DATABASE_URL is not set. Cannot execute Prisma queries.`);
              };
            },
          });
        }
        return undefined;
      },
    });
  }

  const sql = neon(connectionString);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const adapter = new PrismaNeon(sql as any);

  return new PrismaClient({
    adapter,
    log: process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"],
  });
}

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma = globalForPrisma.prisma ?? createPrismaClient();

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
