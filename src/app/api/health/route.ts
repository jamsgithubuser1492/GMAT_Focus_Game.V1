/**
 * GET /api/health
 *
 * Pre-flight check for database connectivity. The client calls this before
 * starting a session so it knows whether to use DB-backed mode or
 * local-only mode (static question bank, no persistence).
 *
 * Response:
 *   - 200: { db: true }    — Database is reachable
 *   - 200: { db: false }   — DATABASE_URL missing or DB unreachable
 */

import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET() {
  try {
    // Quick connectivity check — count is the lightest Prisma query
    await prisma.user.count();
    return NextResponse.json({ db: true });
  } catch {
    return NextResponse.json({ db: false });
  }
}
