/**
 * GMAT Focus Edition Score Concordance Logic
 *
 * Maps continuous theta (θ) values to the GMAT Focus scoring scale:
 * - Section scores: 60–90 (integer)
 * - Total score: 205–805 (must end in 5)
 *
 * TODO: Implement in Step 5 after tests are written and confirmed failing.
 */

import type { GmatSection, SectionScoreResult, TotalScoreResult } from "./types";

/**
 * Convert a theta value to a GMAT Focus section score (60-90).
 *
 * Uses piecewise linear interpolation:
 *   θ = -3.0 → 60
 *   θ =  0.0 → 75
 *   θ =  3.0 → 90
 *
 * @param theta - Proficiency estimate [-3, 3]
 * @returns Section score (integer, 60-90)
 */
export function thetaToSectionScore(_theta: number): number {
  throw new Error("Not implemented: thetaToSectionScore");
}

/**
 * Convert a section score (60-90) back to approximate theta.
 *
 * Inverse of thetaToSectionScore.
 *
 * @param sectionScore - Section score (60-90)
 * @returns Approximate theta value [-3, 3]
 */
export function sectionScoreToTheta(_sectionScore: number): number {
  throw new Error("Not implemented: sectionScoreToTheta");
}

/**
 * Calculate the total GMAT Focus score from three section thetas.
 *
 * Total score range: 205-805, must end in 5.
 * Sections are equally weighted.
 *
 * @param quantTheta - Quantitative Reasoning theta
 * @param verbalTheta - Verbal Reasoning theta
 * @param diTheta - Data Insights theta
 * @returns Full score result with section and total scores
 */
export function calculateTotalScore(
  _quantTheta: number,
  _verbalTheta: number,
  _diTheta: number,
): TotalScoreResult {
  throw new Error("Not implemented: calculateTotalScore");
}

/**
 * Round a raw score to the nearest valid GMAT Focus total score (ending in 5).
 *
 * @param rawScore - Unrounded total score
 * @returns Score rounded to nearest value ending in 5, clamped to [205, 805]
 */
export function roundToGmatScore(_rawScore: number): number {
  throw new Error("Not implemented: roundToGmatScore");
}

/**
 * Get the approximate percentile rank for a given GMAT Focus total score.
 *
 * Based on published GMAT Focus Edition percentile tables.
 *
 * @param totalScore - GMAT Focus total score (205-805)
 * @returns Percentile rank (0-100)
 */
export function scoreToPercentile(_totalScore: number): number {
  throw new Error("Not implemented: scoreToPercentile");
}
