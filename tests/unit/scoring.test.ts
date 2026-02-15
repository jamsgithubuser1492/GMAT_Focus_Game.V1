/**
 * Unit Tests: GMAT Focus Edition Score Concordance Logic
 *
 * Tests for:
 *   - thetaToSectionScore(): θ → section score (60-90)
 *   - sectionScoreToTheta(): section score → θ (inverse)
 *   - calculateTotalScore(): three section thetas → total score (205-805)
 *   - roundToGmatScore(): raw score → nearest valid GMAT Focus score (ending in 5)
 *   - scoreToPercentile(): total score → percentile rank
 *
 * TDD Red Phase — all tests must FAIL before implementation.
 */

import { describe, it, expect } from "vitest";
import {
  thetaToSectionScore,
  sectionScoreToTheta,
  calculateTotalScore,
  roundToGmatScore,
  scoreToPercentile,
} from "@/lib/tutor-engine/scoring";
import { GMAT_FOCUS } from "@/lib/tutor-engine/types";

// ---------------------------------------------------------------------------
// thetaToSectionScore
// ---------------------------------------------------------------------------
describe("thetaToSectionScore — θ to Section Score (60-90)", () => {
  it("should map θ = -3.0 to section score 60", () => {
    expect(thetaToSectionScore(-3.0)).toBe(60);
  });

  it("should map θ = 0.0 to section score 75", () => {
    expect(thetaToSectionScore(0.0)).toBe(75);
  });

  it("should map θ = 3.0 to section score 90", () => {
    expect(thetaToSectionScore(3.0)).toBe(90);
  });

  it("should map θ = -1.5 to section score ~68 (midpoint of lower half)", () => {
    // Linear interpolation: -3→60, 0→75, so -1.5 → 67.5 → rounds to 68
    const result = thetaToSectionScore(-1.5);
    expect(result).toBe(68);
  });

  it("should map θ = 1.5 to section score ~83 (midpoint of upper half)", () => {
    // Linear interpolation: 0→75, 3→90, so 1.5 → 82.5 → rounds to 83
    const result = thetaToSectionScore(1.5);
    expect(result).toBe(83);
  });

  it("should clamp θ below -3.0 to section score 60", () => {
    expect(thetaToSectionScore(-5.0)).toBe(60);
    expect(thetaToSectionScore(-100)).toBe(60);
  });

  it("should clamp θ above 3.0 to section score 90", () => {
    expect(thetaToSectionScore(5.0)).toBe(90);
    expect(thetaToSectionScore(100)).toBe(90);
  });

  it("should always return an integer", () => {
    const thetas = [-2.7, -1.3, -0.4, 0.7, 1.9, 2.5];
    for (const theta of thetas) {
      const score = thetaToSectionScore(theta);
      expect(Number.isInteger(score)).toBe(true);
    }
  });

  it("should always return values in [60, 90]", () => {
    for (let theta = -5; theta <= 5; theta += 0.1) {
      const score = thetaToSectionScore(theta);
      expect(score).toBeGreaterThanOrEqual(60);
      expect(score).toBeLessThanOrEqual(90);
    }
  });

  it("should be monotonically non-decreasing", () => {
    let prevScore = 0;
    for (let theta = -3; theta <= 3; theta += 0.1) {
      const score = thetaToSectionScore(theta);
      expect(score).toBeGreaterThanOrEqual(prevScore);
      prevScore = score;
    }
  });
});

// ---------------------------------------------------------------------------
// sectionScoreToTheta (inverse)
// ---------------------------------------------------------------------------
describe("sectionScoreToTheta — Section Score to θ (inverse)", () => {
  it("should map section score 60 to θ = -3.0", () => {
    expect(sectionScoreToTheta(60)).toBeCloseTo(-3.0, 1);
  });

  it("should map section score 75 to θ = 0.0", () => {
    expect(sectionScoreToTheta(75)).toBeCloseTo(0.0, 1);
  });

  it("should map section score 90 to θ = 3.0", () => {
    expect(sectionScoreToTheta(90)).toBeCloseTo(3.0, 1);
  });

  it("should be the approximate inverse of thetaToSectionScore", () => {
    // Due to integer rounding in thetaToSectionScore, the inverse is approximate
    const testThetas = [-2.0, -1.0, 0.0, 1.0, 2.0];
    for (const theta of testThetas) {
      const score = thetaToSectionScore(theta);
      const recoveredTheta = sectionScoreToTheta(score);
      // Should be within 0.5 due to integer rounding
      expect(Math.abs(recoveredTheta - theta)).toBeLessThan(0.5);
    }
  });

  it("should clamp section scores below 60 to θ = -3.0", () => {
    expect(sectionScoreToTheta(50)).toBeCloseTo(-3.0, 1);
  });

  it("should clamp section scores above 90 to θ = 3.0", () => {
    expect(sectionScoreToTheta(95)).toBeCloseTo(3.0, 1);
  });
});

// ---------------------------------------------------------------------------
// roundToGmatScore
// ---------------------------------------------------------------------------
describe("roundToGmatScore — Round to Nearest Valid GMAT Focus Score", () => {
  it("should return 205 for input 205", () => {
    expect(roundToGmatScore(205)).toBe(205);
  });

  it("should return 805 for input 805", () => {
    expect(roundToGmatScore(805)).toBe(805);
  });

  it("should round 500 to 505 (nearest ending in 5)", () => {
    expect(roundToGmatScore(500)).toBe(505);
  });

  it("should round 502 to 505", () => {
    expect(roundToGmatScore(502)).toBe(505);
  });

  it("should round 508 to 505", () => {
    expect(roundToGmatScore(508)).toBe(505);
  });

  it("should round 703 to 705", () => {
    expect(roundToGmatScore(703)).toBe(705);
  });

  it("should round 707 to 705", () => {
    expect(roundToGmatScore(707)).toBe(705);
  });

  it("should clamp values below 205 to 205", () => {
    expect(roundToGmatScore(100)).toBe(205);
    expect(roundToGmatScore(0)).toBe(205);
    expect(roundToGmatScore(-50)).toBe(205);
  });

  it("should clamp values above 805 to 805", () => {
    expect(roundToGmatScore(900)).toBe(805);
    expect(roundToGmatScore(1000)).toBe(805);
  });

  it("should always return a value ending in 5", () => {
    const testValues = [210, 333, 444, 567, 689, 750, 790];
    for (const val of testValues) {
      const result = roundToGmatScore(val);
      expect(result % 10).toBe(5);
    }
  });

  it("should always return a value in [205, 805]", () => {
    for (let raw = 0; raw <= 1000; raw += 10) {
      const result = roundToGmatScore(raw);
      expect(result).toBeGreaterThanOrEqual(205);
      expect(result).toBeLessThanOrEqual(805);
    }
  });
});

// ---------------------------------------------------------------------------
// calculateTotalScore
// ---------------------------------------------------------------------------
describe("calculateTotalScore — Three Section Thetas to Total Score", () => {
  it("should return 205 when all thetas are at minimum (-3.0)", () => {
    const result = calculateTotalScore(-3.0, -3.0, -3.0);
    expect(result.totalScore).toBe(205);
    expect(result.sections).toHaveLength(3);
    for (const s of result.sections) {
      expect(s.sectionScore).toBe(60);
    }
  });

  it("should return 805 when all thetas are at maximum (3.0)", () => {
    const result = calculateTotalScore(3.0, 3.0, 3.0);
    expect(result.totalScore).toBe(805);
    for (const s of result.sections) {
      expect(s.sectionScore).toBe(90);
    }
  });

  it("should return a midrange score (~505) when all thetas are 0.0", () => {
    const result = calculateTotalScore(0.0, 0.0, 0.0);
    // θ=0 → section score 75 each → sum=225
    // Total = 205 + (225-180)*(600/90) = 205 + 45*6.667 = 205 + 300 = 505
    expect(result.totalScore).toBe(505);
    for (const s of result.sections) {
      expect(s.sectionScore).toBe(75);
    }
  });

  it("should handle asymmetric thetas correctly", () => {
    // Quant strong, Verbal average, DI weak
    const result = calculateTotalScore(2.0, 0.0, -1.0);
    // θ=2.0 → section ~85, θ=0.0 → 75, θ=-1.0 → 70
    expect(result.totalScore).toBeGreaterThan(205);
    expect(result.totalScore).toBeLessThan(805);
    expect(result.totalScore % 10).toBe(5); // Must end in 5
  });

  it("should return total score that always ends in 5", () => {
    const testCases = [
      [1.0, 1.0, 1.0],
      [-1.0, 0.5, 2.0],
      [0.5, -0.5, 0.0],
      [-2.0, -2.0, -2.0],
      [2.5, 2.5, 2.5],
    ];

    for (const [q, v, d] of testCases) {
      const result = calculateTotalScore(q!, v!, d!);
      expect(result.totalScore % 10).toBe(5);
    }
  });

  it("should return total score in [205, 805]", () => {
    const extremeThetas = [-3, -2, -1, 0, 1, 2, 3];
    for (const q of extremeThetas) {
      for (const v of extremeThetas) {
        for (const d of extremeThetas) {
          const result = calculateTotalScore(q, v, d);
          expect(result.totalScore).toBeGreaterThanOrEqual(205);
          expect(result.totalScore).toBeLessThanOrEqual(805);
        }
      }
    }
  });

  it("should include correct section labels in result", () => {
    const result = calculateTotalScore(0, 0, 0);
    const sections = result.sections.map((s) => s.section);
    expect(sections).toContain("quantitative");
    expect(sections).toContain("verbal");
    expect(sections).toContain("data_insights");
  });

  it("should produce higher total scores for higher thetas", () => {
    const lowResult = calculateTotalScore(-1.0, -1.0, -1.0);
    const midResult = calculateTotalScore(0.0, 0.0, 0.0);
    const highResult = calculateTotalScore(1.0, 1.0, 1.0);

    expect(highResult.totalScore).toBeGreaterThanOrEqual(midResult.totalScore);
    expect(midResult.totalScore).toBeGreaterThanOrEqual(lowResult.totalScore);
  });

  it("should map to ~705 for the elite 98.6th percentile target", () => {
    // Approximate θ values for a 705 scorer
    // θ ≈ 2.1 per section → score ≈ 85.5 → 86 each → sum=258
    // total = 205 + (258-180)*(600/90) = 205 + 78*6.667 = 205 + 520 = 725 → rounds to 725
    // Let's check if ~2.0 per section gets us in the 700+ range
    const result = calculateTotalScore(2.0, 2.0, 2.0);
    expect(result.totalScore).toBeGreaterThanOrEqual(695);
    expect(result.totalScore).toBeLessThanOrEqual(755);
  });
});

// ---------------------------------------------------------------------------
// scoreToPercentile
// ---------------------------------------------------------------------------
describe("scoreToPercentile — GMAT Focus Total Score to Percentile", () => {
  it("should return ~99% for score 705", () => {
    const percentile = scoreToPercentile(705);
    expect(percentile).toBeGreaterThanOrEqual(98);
    expect(percentile).toBeLessThanOrEqual(100);
  });

  it("should return ~86% for score 655", () => {
    const percentile = scoreToPercentile(655);
    expect(percentile).toBeGreaterThanOrEqual(82);
    expect(percentile).toBeLessThanOrEqual(90);
  });

  it("should return ~48% for score 555", () => {
    const percentile = scoreToPercentile(555);
    expect(percentile).toBeGreaterThanOrEqual(44);
    expect(percentile).toBeLessThanOrEqual(52);
  });

  it("should return low percentile for minimum score", () => {
    const percentile = scoreToPercentile(205);
    expect(percentile).toBeLessThanOrEqual(5);
    expect(percentile).toBeGreaterThanOrEqual(0);
  });

  it("should return 100 for maximum score", () => {
    expect(scoreToPercentile(805)).toBe(100);
  });

  it("should be monotonically non-decreasing", () => {
    let prevPercentile = 0;
    for (let score = 205; score <= 805; score += 10) {
      const percentile = scoreToPercentile(score);
      expect(percentile).toBeGreaterThanOrEqual(prevPercentile);
      prevPercentile = percentile;
    }
  });

  it("should always return values in [0, 100]", () => {
    for (let score = 205; score <= 805; score += 10) {
      const percentile = scoreToPercentile(score);
      expect(percentile).toBeGreaterThanOrEqual(0);
      expect(percentile).toBeLessThanOrEqual(100);
    }
  });
});

// ---------------------------------------------------------------------------
// Domain Constraint Validation
// ---------------------------------------------------------------------------
describe("GMAT Focus Domain Constraints", () => {
  it("should enforce total score range 205-805", () => {
    expect(GMAT_FOCUS.TOTAL_SCORE_MIN).toBe(205);
    expect(GMAT_FOCUS.TOTAL_SCORE_MAX).toBe(805);
  });

  it("should enforce section score range 60-90", () => {
    expect(GMAT_FOCUS.SECTION_SCORE_MIN).toBe(60);
    expect(GMAT_FOCUS.SECTION_SCORE_MAX).toBe(90);
  });

  it("should define correct number of questions per section", () => {
    expect(GMAT_FOCUS.QUESTIONS_PER_SECTION.quantitative).toBe(21);
    expect(GMAT_FOCUS.QUESTIONS_PER_SECTION.verbal).toBe(23);
    expect(GMAT_FOCUS.QUESTIONS_PER_SECTION.data_insights).toBe(20);
  });

  it("should set default guessing parameter to 0.2 (5-choice MCQ)", () => {
    expect(GMAT_FOCUS.DEFAULT_GUESSING).toBe(0.2);
  });

  it("should allow max 3 edits per section", () => {
    expect(GMAT_FOCUS.MAX_EDITS_PER_SECTION).toBe(3);
  });

  it("should have exactly 3 sections", () => {
    expect(GMAT_FOCUS.SECTIONS).toHaveLength(3);
    expect(GMAT_FOCUS.SECTIONS).toContain("quantitative");
    expect(GMAT_FOCUS.SECTIONS).toContain("verbal");
    expect(GMAT_FOCUS.SECTIONS).toContain("data_insights");
  });

  it("should set knowledge decay threshold to 7 days", () => {
    expect(GMAT_FOCUS.KNOWLEDGE_DECAY_DAYS).toBe(7);
  });
});
