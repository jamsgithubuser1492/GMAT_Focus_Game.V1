/**
 * POST /api/tutor-engine/select-question
 *
 * Selects the next optimal question for the learner using the adaptive engine.
 * Combines Fisher information maximization with spaced-repetition decay weighting.
 *
 * Request body:
 *   - candidateQuestions: Question[]
 *   - learnerProfiles: Record<string, LearnerProfile>
 *   - currentSectionTheta: number
 *   - answeredQuestionIds?: string[]
 *   - targetScore?: number
 *
 * Response:
 *   - 200: { question: Question }
 *   - 204: no eligible questions
 *   - 400: invalid request body
 */

import { NextRequest, NextResponse } from "next/server";
import { selectNextQuestion } from "@/lib/tutor-engine/question-selector";
import type { Question, LearnerProfile } from "@/lib/tutor-engine/types";

interface SelectQuestionBody {
  candidateQuestions: Question[];
  learnerProfiles: Record<string, LearnerProfile>;
  currentSectionTheta: number;
  answeredQuestionIds?: string[];
  targetScore?: number;
}

export async function POST(request: NextRequest) {
  let body: SelectQuestionBody;

  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const { candidateQuestions, learnerProfiles, currentSectionTheta, answeredQuestionIds, targetScore } = body;

  if (!Array.isArray(candidateQuestions) || typeof currentSectionTheta !== "number") {
    return NextResponse.json(
      { error: "Missing required fields: candidateQuestions (array), currentSectionTheta (number)" },
      { status: 400 },
    );
  }

  // Convert plain object to Map for the selector
  const profileMap = new Map<string, LearnerProfile>(
    Object.entries(learnerProfiles ?? {}),
  );

  const answeredSet = answeredQuestionIds
    ? new Set(answeredQuestionIds)
    : undefined;

  const question = selectNextQuestion({
    candidateQuestions,
    learnerProfiles: profileMap,
    currentSectionTheta,
    targetScore,
    answeredQuestionIds: answeredSet,
  });

  if (!question) {
    return new NextResponse(null, { status: 204 });
  }

  return NextResponse.json({ question });
}
