/**
 * POST /api/exam-session/status
 *
 * Computes the current status of an exam session: progress through sections,
 * current theta estimates, and score projections.
 *
 * Request body:
 *   - attempts: Array<{ section, isCorrect, item: {a, b, c} }>
 *   - sessionType: "drill" | "section_practice" | "full_exam"
 *
 * Response:
 *   - 200: { sectionProgress[], projectedScore, percentile }
 *   - 400: invalid request body
 */

import { NextRequest, NextResponse } from "next/server";
import { updateTheta } from "@/lib/tutor-engine/irt";
import { calculateTotalScore, scoreToPercentile } from "@/lib/tutor-engine/scoring";
import type { GmatSection, IRTParameters } from "@/lib/tutor-engine/types";
import { GMAT_FOCUS } from "@/lib/tutor-engine/types";

interface AttemptRecord {
  section: GmatSection;
  isCorrect: boolean;
  item: IRTParameters;
}

interface StatusBody {
  attempts: AttemptRecord[];
  sessionType: "drill" | "section_practice" | "full_exam";
}

export async function POST(request: NextRequest) {
  let body: StatusBody;

  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const { attempts, sessionType } = body;

  if (!Array.isArray(attempts)) {
    return NextResponse.json({ error: "Missing required field: attempts (array)" }, { status: 400 });
  }

  // Group attempts by section and compute theta for each
  const sectionThetas: Record<string, number> = {
    quantitative: 0.0,
    verbal: 0.0,
    data_insights: 0.0,
  };

  const sectionAttemptCounts: Record<string, number> = {
    quantitative: 0,
    verbal: 0,
    data_insights: 0,
  };

  for (const section of GMAT_FOCUS.SECTIONS) {
    const sectionAttempts = attempts.filter((a) => a.section === section);
    sectionAttemptCounts[section] = sectionAttempts.length;

    if (sectionAttempts.length > 0) {
      sectionThetas[section] = updateTheta(
        0.0,
        sectionAttempts.map((a) => ({ isCorrect: a.isCorrect, item: a.item })),
      );
    }
  }

  // Compute score projection
  const scoreResult = calculateTotalScore(
    sectionThetas.quantitative!,
    sectionThetas.verbal!,
    sectionThetas.data_insights!,
  );

  const percentile = scoreToPercentile(scoreResult.totalScore);

  // Build section progress
  const sectionProgress = GMAT_FOCUS.SECTIONS.map((section) => {
    const total = GMAT_FOCUS.QUESTIONS_PER_SECTION[section];
    const answered = sectionAttemptCounts[section]!;
    return {
      section,
      answered,
      total,
      theta: sectionThetas[section]!,
      progress: total > 0 ? answered / total : 0,
    };
  });

  return NextResponse.json({
    sessionType,
    sectionProgress,
    projectedScore: scoreResult.totalScore,
    sections: scoreResult.sections,
    percentile,
    totalAttempts: attempts.length,
  });
}
