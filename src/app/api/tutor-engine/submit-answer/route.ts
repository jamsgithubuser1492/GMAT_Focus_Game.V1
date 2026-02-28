/**
 * POST /api/tutor-engine/submit-answer
 *
 * Processes a learner's answer: evaluates correctness, updates theta via
 * IRT gradient ascent, persists the attempt, awards XP, and returns results.
 *
 * Request body:
 *   - currentTheta: number
 *   - selectedAnswer: string
 *   - correctAnswer: string
 *   - item: { a: number, b: number, c: number }
 *   - userId?: string       (for persistence)
 *   - questionId?: string   (for persistence)
 *   - sessionId?: string    (for persistence)
 *   - timeSpent?: number    (seconds)
 *   - skillNodeIds?: string[]
 *
 * Response:
 *   - 200: { isCorrect, thetaBefore, thetaAfter, probability, xpAwarded }
 *   - 400: invalid request body
 */

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { irtProbability, updateTheta } from "@/lib/tutor-engine/irt";
import { calculateAnswerXP, getLevel } from "@/lib/gamification";
import type { IRTParameters } from "@/lib/tutor-engine/types";

interface SubmitAnswerBody {
  currentTheta: number;
  selectedAnswer: string;
  correctAnswer: string;
  item: IRTParameters;
  userId?: string;
  questionId?: string;
  sessionId?: string;
  timeSpent?: number;
  skillNodeIds?: string[];
}

export async function POST(request: NextRequest) {
  let body: SubmitAnswerBody;

  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const { currentTheta, selectedAnswer, correctAnswer, item, userId, questionId, sessionId, timeSpent, skillNodeIds } = body;

  if (
    typeof currentTheta !== "number" ||
    typeof selectedAnswer !== "string" ||
    typeof correctAnswer !== "string" ||
    !item ||
    typeof item.a !== "number" ||
    typeof item.b !== "number" ||
    typeof item.c !== "number"
  ) {
    return NextResponse.json(
      { error: "Missing required fields: currentTheta, selectedAnswer, correctAnswer, item {a, b, c}" },
      { status: 400 },
    );
  }

  const isCorrect = selectedAnswer === correctAnswer;
  const probability = irtProbability(currentTheta, item);
  const thetaAfter = updateTheta(currentTheta, [{ isCorrect, item }]);
  let xpAwarded = 0;

  // Persist attempt and award XP if user context is provided
  if (userId && questionId && sessionId) {
    try {
      // Save question attempt
      await prisma.questionAttempt.create({
        data: {
          userId,
          questionId,
          sessionId,
          selectedAnswer,
          isCorrect,
          timeSpent: timeSpent ?? 0,
          thetaBefore: currentTheta,
          thetaAfter,
        },
      });

      // Update learner profiles for relevant skill nodes
      if (skillNodeIds?.length) {
        for (const skillNodeId of skillNodeIds) {
          await prisma.learnerProfile.upsert({
            where: {
              userId_skillNodeId: { userId, skillNodeId },
            },
            update: {
              theta: thetaAfter,
              attempts: { increment: 1 },
              correct: isCorrect ? { increment: 1 } : undefined,
              lastPracticed: new Date(),
              decayFactor: 1.0,
            },
            create: {
              userId,
              skillNodeId,
              theta: thetaAfter,
              attempts: 1,
              correct: isCorrect ? 1 : 0,
              lastPracticed: new Date(),
              decayFactor: 1.0,
            },
          });
        }
      }

      // Award XP
      xpAwarded = calculateAnswerXP(isCorrect, item.b);
      if (xpAwarded > 0) {
        const gam = await prisma.gamification.findUnique({ where: { userId } });
        if (gam) {
          const newXP = gam.xpTotal + xpAwarded;
          await prisma.gamification.update({
            where: { userId },
            data: {
              xpTotal: newXP,
              level: getLevel(newXP),
            },
          });
        }
      }
    } catch {
      // Non-critical: don't fail the answer if persistence fails
    }
  }

  return NextResponse.json({
    isCorrect,
    thetaBefore: currentTheta,
    thetaAfter,
    probability,
    xpAwarded,
  });
}
