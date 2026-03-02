/**
 * GET /api/questions
 *
 * Fetches questions from the database for a given section.
 * Returns them in the Question shape expected by the adaptive engine,
 * including skill node mappings.
 *
 * Query params:
 *   - section: GmatSection (required)
 *
 * Response:
 *   - 200: { questions: Question[] }
 *   - 400: missing section
 */

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import type { GmatSection } from "@/lib/tutor-engine/types";

const VALID_SECTIONS = new Set(["quantitative", "verbal", "data_insights"]);

export async function GET(request: NextRequest) {
  const section = request.nextUrl.searchParams.get("section");

  if (!section || !VALID_SECTIONS.has(section)) {
    return NextResponse.json(
      { error: "Missing or invalid query param: section (quantitative, verbal, data_insights)" },
      { status: 400 },
    );
  }

  const dbQuestions = await prisma.question.findMany({
    where: { section: section as GmatSection },
    include: {
      skillNodeQuestions: {
        select: { skillNodeId: true },
      },
    },
  });

  // Transform DB shape → engine Question shape
  const questions = dbQuestions.map((q) => ({
    id: q.id,
    section: q.section as GmatSection,
    questionType: q.questionType,
    skillNodeIds: q.skillNodeQuestions.map((snq) => snq.skillNodeId),
    difficulty: q.difficultyB,
    discrimination: q.discriminationA,
    guessing: q.guessingC,
    content: typeof q.content === "string" ? q.content : JSON.stringify(q.content),
    correctAnswer: q.correctAnswer,
    explanation: q.explanation,
    estimatedTimeSeconds: q.estimatedTime,
  }));

  return NextResponse.json({ questions });
}
