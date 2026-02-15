/**
 * POST /api/tutor-engine/submit-answer
 *
 * Processes a learner's answer: evaluates correctness, updates theta via
 * IRT gradient ascent, and returns the new proficiency estimate.
 *
 * Request body:
 *   - currentTheta: number
 *   - selectedAnswer: string
 *   - correctAnswer: string
 *   - item: { a: number, b: number, c: number }
 *
 * Response:
 *   - 200: { isCorrect, thetaBefore, thetaAfter, probability }
 *   - 400: invalid request body
 */

import { NextRequest, NextResponse } from "next/server";
import { irtProbability, updateTheta } from "@/lib/tutor-engine/irt";
import type { IRTParameters } from "@/lib/tutor-engine/types";

interface SubmitAnswerBody {
  currentTheta: number;
  selectedAnswer: string;
  correctAnswer: string;
  item: IRTParameters;
}

export async function POST(request: NextRequest) {
  let body: SubmitAnswerBody;

  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const { currentTheta, selectedAnswer, correctAnswer, item } = body;

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

  return NextResponse.json({
    isCorrect,
    thetaBefore: currentTheta,
    thetaAfter,
    probability,
  });
}
