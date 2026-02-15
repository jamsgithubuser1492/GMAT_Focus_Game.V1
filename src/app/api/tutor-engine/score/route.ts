/**
 * POST /api/tutor-engine/score
 *
 * Calculates the GMAT Focus total score from three section thetas.
 * Returns section scores (60-90), total score (205-805), and percentile.
 *
 * Request body:
 *   - quantTheta: number
 *   - verbalTheta: number
 *   - diTheta: number
 *
 * Response:
 *   - 200: { sections, totalScore, percentile }
 *   - 400: invalid request body
 */

import { NextRequest, NextResponse } from "next/server";
import { calculateTotalScore, scoreToPercentile } from "@/lib/tutor-engine/scoring";

interface ScoreBody {
  quantTheta: number;
  verbalTheta: number;
  diTheta: number;
}

export async function POST(request: NextRequest) {
  let body: ScoreBody;

  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const { quantTheta, verbalTheta, diTheta } = body;

  if (
    typeof quantTheta !== "number" ||
    typeof verbalTheta !== "number" ||
    typeof diTheta !== "number"
  ) {
    return NextResponse.json(
      { error: "Missing required fields: quantTheta, verbalTheta, diTheta (all numbers)" },
      { status: 400 },
    );
  }

  const result = calculateTotalScore(quantTheta, verbalTheta, diTheta);
  const percentile = scoreToPercentile(result.totalScore);

  return NextResponse.json({
    sections: result.sections,
    totalScore: result.totalScore,
    percentile,
  });
}
