/**
 * GET /api/learner-profiles
 *
 * Returns learner profiles for a user, with decay factors freshly computed
 * server-side based on `lastPracticed`. This is the critical data that feeds
 * the adaptive question selector's spaced-repetition logic.
 *
 * Query params:
 *   - userId: string (required)
 *   - section?: GmatSection (optional — filter to one section's skill nodes)
 *
 * Response:
 *   - 200: { profiles: Record<skillNodeId, LearnerProfile> }
 *   - 400: missing userId
 *   - 404: user not found
 */

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { calculateDecayFactor } from "@/lib/tutor-engine/decay";
import type { GmatSection } from "@/lib/tutor-engine/types";

export async function GET(request: NextRequest) {
  const userId = request.nextUrl.searchParams.get("userId");
  const section = request.nextUrl.searchParams.get("section") as GmatSection | null;

  if (!userId) {
    return NextResponse.json({ error: "Missing query param: userId" }, { status: 400 });
  }

  // Build query filter
  const where: { userId: string; skillNode?: { section: GmatSection } } = { userId };
  if (section) {
    where.skillNode = { section };
  }

  const profiles = await prisma.learnerProfile.findMany({
    where,
    include: {
      skillNode: {
        select: { id: true, section: true, name: true, tier: true },
      },
    },
  });

  if (profiles.length === 0) {
    // Check if user exists at all
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }
  }

  // Compute fresh decay factors server-side
  const now = new Date();
  const profileMap: Record<string, {
    userId: string;
    skillNodeId: string;
    theta: number;
    attempts: number;
    correct: number;
    lastPracticed: string | null;
    decayFactor: number;
  }> = {};

  for (const p of profiles) {
    const freshDecay = calculateDecayFactor(p.lastPracticed, now);

    profileMap[p.skillNodeId] = {
      userId: p.userId,
      skillNodeId: p.skillNodeId,
      theta: p.theta,
      attempts: p.attempts,
      correct: p.correct,
      lastPracticed: p.lastPracticed?.toISOString() ?? null,
      decayFactor: freshDecay,
    };
  }

  return NextResponse.json({ profiles: profileMap });
}
