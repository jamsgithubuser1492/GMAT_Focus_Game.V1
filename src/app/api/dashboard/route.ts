/**
 * GET /api/dashboard — Dashboard Data
 *
 * Returns all data needed for the user dashboard:
 * - Gamification (XP, level, streak, badges)
 * - Score history (session scores over time)
 * - Skill breakdown (per-skill theta, attempts, accuracy)
 * - Recent activity
 */

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getXPForNextLevel } from "@/lib/gamification";

export async function GET(request: NextRequest) {
  const userId = request.nextUrl.searchParams.get("userId");
  if (!userId) {
    return NextResponse.json({ error: "Missing query param: userId" }, { status: 400 });
  }

  // Fetch all data in parallel
  const [user, gamification, sessions, learnerProfiles, recentAttempts] =
    await Promise.all([
      prisma.user.findUnique({ where: { id: userId } }),

      prisma.gamification.findUnique({ where: { userId } }),

      prisma.examSession.findMany({
        where: { userId, completedAt: { not: null } },
        orderBy: { completedAt: "asc" },
        select: {
          id: true,
          sessionType: true,
          startedAt: true,
          completedAt: true,
          totalScore: true,
          quantScore: true,
          verbalScore: true,
          diScore: true,
        },
      }),

      prisma.learnerProfile.findMany({
        where: { userId },
        include: {
          skillNode: {
            select: { name: true, section: true, tier: true },
          },
        },
        orderBy: { skillNode: { section: "asc" } },
      }),

      prisma.questionAttempt.findMany({
        where: { userId },
        orderBy: { createdAt: "desc" },
        take: 20,
        select: {
          id: true,
          isCorrect: true,
          thetaBefore: true,
          thetaAfter: true,
          timeSpent: true,
          createdAt: true,
          question: {
            select: {
              section: true,
              questionType: true,
              difficultyB: true,
            },
          },
        },
      }),
    ]);

  if (!user) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  // Score history for chart
  const scoreHistory = sessions.map((s) => ({
    date: s.completedAt?.toISOString(),
    sessionType: s.sessionType,
    totalScore: s.totalScore,
    quantScore: s.quantScore,
    verbalScore: s.verbalScore,
    diScore: s.diScore,
  }));

  // Skill breakdown
  const skills = learnerProfiles.map((lp) => ({
    skillNodeId: lp.skillNodeId,
    name: lp.skillNode.name,
    section: lp.skillNode.section,
    tier: lp.skillNode.tier,
    theta: lp.theta,
    attempts: lp.attempts,
    correct: lp.correct,
    accuracy: lp.attempts > 0 ? lp.correct / lp.attempts : 0,
    lastPracticed: lp.lastPracticed?.toISOString() ?? null,
    decayFactor: lp.decayFactor,
  }));

  // Aggregate stats
  const totalAttempts = await prisma.questionAttempt.count({ where: { userId } });
  const correctAttempts = await prisma.questionAttempt.count({
    where: { userId, isCorrect: true },
  });

  const levelProgress = gamification ? getXPForNextLevel(gamification.xpTotal) : null;

  return NextResponse.json({
    user: {
      id: user.id,
      displayName: user.displayName,
      email: user.email,
      targetScore: user.targetScore,
      testDate: user.testDate?.toISOString() ?? null,
    },
    gamification: gamification
      ? {
          xpTotal: gamification.xpTotal,
          level: gamification.level,
          levelProgress,
          streakDays: gamification.streakDays,
          streakLastDate: gamification.streakLastDate?.toISOString() ?? null,
          vaultUnlocked: gamification.vaultUnlocked,
          badges: gamification.badges,
        }
      : null,
    scoreHistory,
    skills,
    stats: {
      totalSessions: sessions.length,
      totalAttempts,
      correctAttempts,
      overallAccuracy: totalAttempts > 0 ? correctAttempts / totalAttempts : 0,
      latestScore: sessions.length > 0 ? sessions[sessions.length - 1]!.totalScore : null,
    },
    recentActivity: recentAttempts.map((a) => ({
      id: a.id,
      isCorrect: a.isCorrect,
      section: a.question.section,
      questionType: a.question.questionType,
      difficulty: a.question.difficultyB,
      thetaChange: a.thetaAfter - a.thetaBefore,
      timeSpent: a.timeSpent,
      createdAt: a.createdAt.toISOString(),
    })),
  });
}
