/**
 * GMAT Focus Edition Score Concordance Logic
 *
 * Maps continuous theta (θ) values to the GMAT Focus scoring scale:
 * - Section scores: 60–90 (integer)
 * - Total score: 205–805 (must end in 5)
 *
 * The scoring model uses linear interpolation across the θ range [-3, 3]
 * and enforces the Focus Edition's distinctive "ends in 5" constraint
 * for total scores.
 */

import type { GmatSection, SectionScoreResult, TotalScoreResult } from "./types";
import { GMAT_FOCUS } from "./types";

// ---------------------------------------------------------------------------
// Percentile lookup table (score → percentile)
// Based on published GMAT Focus Edition percentile distributions.
// ---------------------------------------------------------------------------
const PERCENTILE_TABLE: [number, number][] = [
  [205, 0],
  [255, 1],
  [305, 3],
  [355, 8],
  [405, 18],
  [455, 30],
  [505, 40],
  [555, 48],
  [575, 55],
  [605, 65],
  [625, 75],
  [645, 82],
  [655, 86],
  [675, 93],
  [695, 98],
  [705, 99],
  [745, 99.5],
  [805, 100],
];

/**
 * Convert a theta value to a GMAT Focus section score (60-90).
 *
 * Linear interpolation: θ ∈ [-3, 3] → score ∈ [60, 90]
 *   slope = 30/6 = 5 points per θ unit
 *   score = 75 + θ × 5
 *
 * @param theta - Proficiency estimate [-3, 3]
 * @returns Section score (integer, 60-90)
 */
export function thetaToSectionScore(theta: number): number {
  const clamped = Math.max(GMAT_FOCUS.THETA_MIN, Math.min(GMAT_FOCUS.THETA_MAX, theta));
  const raw = 75 + clamped * 5;
  return Math.round(
    Math.max(GMAT_FOCUS.SECTION_SCORE_MIN, Math.min(GMAT_FOCUS.SECTION_SCORE_MAX, raw)),
  );
}

/**
 * Convert a section score (60-90) back to approximate theta.
 *
 * Inverse of the linear mapping: θ = (score - 75) / 5
 *
 * @param sectionScore - Section score (60-90)
 * @returns Approximate theta value [-3, 3]
 */
export function sectionScoreToTheta(sectionScore: number): number {
  const clamped = Math.max(
    GMAT_FOCUS.SECTION_SCORE_MIN,
    Math.min(GMAT_FOCUS.SECTION_SCORE_MAX, sectionScore),
  );
  return (clamped - 75) / 5;
}

/**
 * Calculate the total GMAT Focus score from three section thetas.
 *
 * Formula: total = 205 + (sectionSum - 180) × (600 / 90)
 * Where sectionSum is the sum of three section scores [180..270].
 * Result is rounded to the nearest valid score ending in 5.
 *
 * @param quantTheta - Quantitative Reasoning theta
 * @param verbalTheta - Verbal Reasoning theta
 * @param diTheta - Data Insights theta
 * @returns Full score result with section and total scores
 */
export function calculateTotalScore(
  quantTheta: number,
  verbalTheta: number,
  diTheta: number,
): TotalScoreResult {
  const sectionEntries: { section: GmatSection; theta: number }[] = [
    { section: "quantitative", theta: quantTheta },
    { section: "verbal", theta: verbalTheta },
    { section: "data_insights", theta: diTheta },
  ];

  const sections: SectionScoreResult[] = sectionEntries.map(({ section, theta }) => ({
    section,
    theta,
    sectionScore: thetaToSectionScore(theta),
  }));

  const sectionSum = sections.reduce((sum, s) => sum + s.sectionScore, 0);

  // Map section sum [180..270] linearly to total score [205..805]
  const rawTotal = 205 + ((sectionSum - 180) * 600) / 90;
  const totalScore = roundToGmatScore(rawTotal);

  return { sections, totalScore };
}

/**
 * Round a raw score to the nearest valid GMAT Focus total score (ending in 5).
 *
 * Valid scores: 205, 215, 225, ..., 795, 805
 *
 * @param rawScore - Unrounded total score
 * @returns Score rounded to nearest value ending in 5, clamped to [205, 805]
 */
export function roundToGmatScore(rawScore: number): number {
  // Round to nearest value ending in 5: shift by 5, round to 10, shift back
  const rounded = Math.round((rawScore - 5) / 10) * 10 + 5;
  return Math.max(GMAT_FOCUS.TOTAL_SCORE_MIN, Math.min(GMAT_FOCUS.TOTAL_SCORE_MAX, rounded));
}

/**
 * Get the approximate percentile rank for a given GMAT Focus total score.
 *
 * Uses piecewise linear interpolation between published anchor points
 * from the GMAT Focus Edition percentile distribution.
 *
 * @param totalScore - GMAT Focus total score (205-805)
 * @returns Percentile rank (0-100)
 */
export function scoreToPercentile(totalScore: number): number {
  // Below the table minimum
  if (totalScore <= PERCENTILE_TABLE[0]![0]) {
    return PERCENTILE_TABLE[0]![1];
  }

  // Above the table maximum
  if (totalScore >= PERCENTILE_TABLE[PERCENTILE_TABLE.length - 1]![0]) {
    return PERCENTILE_TABLE[PERCENTILE_TABLE.length - 1]![1];
  }

  // Find surrounding anchor points and interpolate
  for (let i = 1; i < PERCENTILE_TABLE.length; i++) {
    const [scoreHigh, pctHigh] = PERCENTILE_TABLE[i]!;
    const [scoreLow, pctLow] = PERCENTILE_TABLE[i - 1]!;

    if (totalScore <= scoreHigh) {
      const ratio = (totalScore - scoreLow) / (scoreHigh - scoreLow);
      return pctLow + ratio * (pctHigh - pctLow);
    }
  }

  return 100;
}
