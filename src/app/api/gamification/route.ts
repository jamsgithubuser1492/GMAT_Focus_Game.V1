/**
 * /api/gamification — Gamification Data
 *
 * GET: Returns user's gamification state (XP, level, streak, badges, vault).
 */

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getXPForNextLevel, BADGE_DEFINITIONS } from "@/lib/gamification";

export async function GET(request: NextRequest) {
  const userId = request.nextUrl.searchParams.get("userId");
  if (!userId) {
    return NextResponse.json({ error: "Missing query param: userId" }, { status: 400 });
  }

  const gam = await prisma.gamification.findUnique({ where: { userId } });
  if (!gam) {
    return NextResponse.json({ error: "Gamification data not found" }, { status: 404 });
  }

  const levelProgress = getXPForNextLevel(gam.xpTotal);

  // Enrich badge data with full definitions
  const earnedBadgeIds = (gam.badges as { id: string; earnedAt?: string }[]);
  const badges = earnedBadgeIds.map((earned) => {
    const def = BADGE_DEFINITIONS.find((b) => b.id === earned.id);
    return {
      ...def,
      earnedAt: earned.earnedAt,
    };
  });

  return NextResponse.json({
    xpTotal: gam.xpTotal,
    level: gam.level,
    levelProgress,
    streakDays: gam.streakDays,
    streakLastDate: gam.streakLastDate,
    vaultUnlocked: gam.vaultUnlocked,
    badges,
    bookmarkXp: gam.bookmarkXp,
  });
}
