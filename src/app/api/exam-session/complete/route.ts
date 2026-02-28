/**
 * POST /api/exam-session/complete
 *
 * Marks an exam session as complete, calculates final scores, and awards
 * session-completion XP and badges.
 *
 * Request body:
 *   - sessionId: string
 *   - userId: string
 *   - totalScore: number
 *   - quantScore?: number
 *   - verbalScore?: number
 *   - diScore?: number
 *
 * Response:
 *   - 200: { session, xpAwarded, newBadges, gamification }
 */

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import {
  calculateSessionXP,
  getLevel,
  checkNewBadges,
} from "@/lib/gamification";

interface CompleteSessionBody {
  sessionId: string;
  userId: string;
  totalScore: number;
  quantScore?: number;
  verbalScore?: number;
  diScore?: number;
}

export async function POST(request: NextRequest) {
  let body: CompleteSessionBody;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const { sessionId, userId, totalScore, quantScore, verbalScore, diScore } = body;

  if (!sessionId || !userId || typeof totalScore !== "number") {
    return NextResponse.json(
      { error: "Missing required fields: sessionId, userId, totalScore" },
      { status: 400 },
    );
  }

  // Update session with final scores
  const session = await prisma.examSession.update({
    where: { id: sessionId },
    data: {
      completedAt: new Date(),
      totalScore,
      quantScore: quantScore ?? null,
      verbalScore: verbalScore ?? null,
      diScore: diScore ?? null,
    },
  });

  // Count attempts in this session
  const totalQuestions = await prisma.questionAttempt.count({
    where: { sessionId },
  });
  const correctCount = await prisma.questionAttempt.count({
    where: { sessionId, isCorrect: true },
  });

  // Get total questions answered by user ever
  const totalUserQuestions = await prisma.questionAttempt.count({
    where: { userId },
  });

  // Count completed sessions
  const completedSessions = await prisma.examSession.count({
    where: { userId, completedAt: { not: null } },
  });

  // Get current gamification state
  const gam = await prisma.gamification.findUnique({ where: { userId } });
  if (!gam) {
    return NextResponse.json({ error: "User gamification not found" }, { status: 404 });
  }

  // Calculate session XP
  const sessionXP = calculateSessionXP(
    session.sessionType as "drill" | "section_practice" | "full_exam",
    correctCount,
    totalQuestions,
    gam.streakDays,
  );

  const newXPTotal = gam.xpTotal + sessionXP;
  const newLevel = getLevel(newXPTotal);

  // Check for new badges
  const existingBadgeIds = (gam.badges as { id: string }[]).map((b) => b.id);
  const newBadges = checkNewBadges(existingBadgeIds, {
    sessionsCompleted: completedSessions,
    streakDays: gam.streakDays,
    totalQuestions: totalUserQuestions,
    sessionAccuracy: totalQuestions > 0 ? correctCount / totalQuestions : 0,
    sessionQuestionCount: totalQuestions,
    projectedScore: totalScore,
    level: newLevel,
    sessionType: session.sessionType,
  });

  // Update gamification
  const allBadges = [
    ...(gam.badges as { id: string; name: string }[]),
    ...newBadges.map((b) => ({ id: b.id, name: b.name, earnedAt: new Date().toISOString() })),
  ];

  const updatedGam = await prisma.gamification.update({
    where: { userId },
    data: {
      xpTotal: newXPTotal,
      level: newLevel,
      badges: allBadges,
      vaultUnlocked: totalScore >= 700 ? true : gam.vaultUnlocked,
    },
  });

  return NextResponse.json({
    session,
    xpAwarded: sessionXP,
    newBadges,
    gamification: updatedGam,
  });
}
