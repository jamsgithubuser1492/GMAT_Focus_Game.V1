/**
 * Unit Tests: IRT (Item Response Theory) — 3-Parameter Logistic Model
 *
 * Tests for:
 *   - irtProbability(): 3PL probability calculation
 *   - updateTheta(): Newton-Raphson MLE theta update
 *   - itemInformation(): Fisher information for question selection
 *
 * TDD Red Phase — all tests must FAIL before implementation.
 */

import { describe, it, expect } from "vitest";
import { irtProbability, updateTheta, itemInformation } from "@/lib/tutor-engine/irt";
import type { IRTParameters, IRTResponse } from "@/lib/tutor-engine/types";

// ---------------------------------------------------------------------------
// Helper: floating point comparison tolerance
// ---------------------------------------------------------------------------
const EPSILON = 0.001;

describe("irtProbability — 3PL Model: P(θ) = c + (1-c) / (1 + e^(-a(θ-b)))", () => {
  it("should return ~0.5 + c/2 when θ equals b (standard discrimination)", () => {
    // When θ = b, the exponent is 0 → e^0 = 1 → P = c + (1-c)/2
    const params: IRTParameters = { a: 1.0, b: 0.0, c: 0.2 };
    const result = irtProbability(0.0, params);
    // P = 0.2 + 0.8/2 = 0.6
    expect(result).toBeCloseTo(0.6, 3);
  });

  it("should return probability close to 1.0 when θ >> b", () => {
    // Very high proficiency relative to difficulty
    const params: IRTParameters = { a: 1.5, b: -1.0, c: 0.2 };
    const result = irtProbability(3.0, params);
    // θ - b = 4.0, a*(θ-b) = 6.0, e^(-6) ≈ 0.0025 → P ≈ 0.2 + 0.8/(1.0025) ≈ 0.998
    expect(result).toBeGreaterThan(0.99);
    expect(result).toBeLessThanOrEqual(1.0);
  });

  it("should return probability close to c (guessing) when θ << b", () => {
    // Very low proficiency relative to difficulty
    const params: IRTParameters = { a: 1.5, b: 2.0, c: 0.2 };
    const result = irtProbability(-3.0, params);
    // θ - b = -5.0, a*(θ-b) = -7.5, e^(7.5) ≈ 1808 → P ≈ 0.2 + 0.8/1809 ≈ 0.2004
    expect(result).toBeGreaterThanOrEqual(0.2);
    expect(result).toBeLessThan(0.25);
  });

  it("should asymptotically approach 1.0 as c approaches 0 and θ >> b", () => {
    // No guessing parameter
    const params: IRTParameters = { a: 2.0, b: 0.0, c: 0.0 };
    const result = irtProbability(3.0, params);
    // Standard 2PL: P = 1 / (1 + e^(-6)) ≈ 0.9975
    expect(result).toBeGreaterThan(0.99);
  });

  it("should return exactly c when c=0 and θ << b (no guessing floor)", () => {
    const params: IRTParameters = { a: 1.0, b: 3.0, c: 0.0 };
    const result = irtProbability(-3.0, params);
    // P = 0 + 1/(1 + e^(6)) ≈ 0.0025
    expect(result).toBeLessThan(0.01);
  });

  it("should handle high discrimination (steep curve)", () => {
    // a = 3.0 means very steep transition at θ = b
    const params: IRTParameters = { a: 3.0, b: 0.0, c: 0.2 };

    // Just above b
    const pAbove = irtProbability(0.5, params);
    expect(pAbove).toBeGreaterThan(0.8);

    // Just below b
    const pBelow = irtProbability(-0.5, params);
    expect(pBelow).toBeLessThan(0.4);
  });

  it("should handle low discrimination (flat curve)", () => {
    // a = 0.3 means very gradual transition
    const params: IRTParameters = { a: 0.3, b: 0.0, c: 0.2 };

    const pAbove = irtProbability(1.0, params);
    const pBelow = irtProbability(-1.0, params);

    // With low discrimination, values should be relatively close to midpoint
    expect(pAbove - pBelow).toBeLessThan(0.3);
  });

  it("should always return values in [0, 1] for extreme inputs", () => {
    const extremeParams: IRTParameters = { a: 5.0, b: 0.0, c: 0.2 };

    const pHigh = irtProbability(100, extremeParams);
    const pLow = irtProbability(-100, extremeParams);

    expect(pHigh).toBeGreaterThanOrEqual(0);
    expect(pHigh).toBeLessThanOrEqual(1.0);
    expect(pLow).toBeGreaterThanOrEqual(0);
    expect(pLow).toBeLessThanOrEqual(1.0);
  });

  it("should match manual calculation for specific known values", () => {
    // θ=1.0, a=1.2, b=0.5, c=0.2
    // a(θ-b) = 1.2 * 0.5 = 0.6
    // e^(-0.6) = 0.5488
    // P = 0.2 + 0.8 / (1 + 0.5488) = 0.2 + 0.8 / 1.5488 = 0.2 + 0.5165 = 0.7165
    const params: IRTParameters = { a: 1.2, b: 0.5, c: 0.2 };
    const result = irtProbability(1.0, params);
    expect(result).toBeCloseTo(0.7165, 2);
  });

  it("should enforce guessing floor: P(θ) >= c for all θ", () => {
    const params: IRTParameters = { a: 1.0, b: 3.0, c: 0.25 };
    const result = irtProbability(-3.0, params);
    expect(result).toBeGreaterThanOrEqual(0.25);
  });
});

describe("updateTheta — Newton-Raphson MLE Single-Step Update", () => {
  it("should increase theta after a correct response on a matched-difficulty item", () => {
    const currentTheta = 0.0;
    const responses: IRTResponse[] = [
      { isCorrect: true, item: { a: 1.0, b: 0.0, c: 0.2 } },
    ];
    const newTheta = updateTheta(currentTheta, responses);
    expect(newTheta).toBeGreaterThan(currentTheta);
  });

  it("should decrease theta after an incorrect response on a matched-difficulty item", () => {
    const currentTheta = 0.0;
    const responses: IRTResponse[] = [
      { isCorrect: false, item: { a: 1.0, b: 0.0, c: 0.2 } },
    ];
    const newTheta = updateTheta(currentTheta, responses);
    expect(newTheta).toBeLessThan(currentTheta);
  });

  it("should increase theta more with correct response on harder items", () => {
    const currentTheta = 0.0;

    // Correct on hard item (b = 2.0)
    const hardResponse: IRTResponse[] = [
      { isCorrect: true, item: { a: 1.0, b: 2.0, c: 0.2 } },
    ];
    const thetaAfterHard = updateTheta(currentTheta, hardResponse);

    // Correct on easy item (b = -2.0)
    const easyResponse: IRTResponse[] = [
      { isCorrect: true, item: { a: 1.0, b: -2.0, c: 0.2 } },
    ];
    const thetaAfterEasy = updateTheta(currentTheta, easyResponse);

    // Theta gain should be larger for hard correct
    expect(thetaAfterHard - currentTheta).toBeGreaterThan(thetaAfterEasy - currentTheta);
  });

  it("should handle multiple responses in a single update", () => {
    const currentTheta = 0.0;
    const responses: IRTResponse[] = [
      { isCorrect: true, item: { a: 1.0, b: 0.0, c: 0.2 } },
      { isCorrect: true, item: { a: 1.0, b: 0.5, c: 0.2 } },
      { isCorrect: false, item: { a: 1.0, b: 1.0, c: 0.2 } },
    ];
    const newTheta = updateTheta(currentTheta, responses);
    // 2 correct, 1 incorrect — net positive
    expect(newTheta).toBeGreaterThan(currentTheta);
  });

  it("should clamp theta to [-3, 3] range", () => {
    // Extreme case: very high theta + correct on easy question
    const highTheta = 2.8;
    const responses: IRTResponse[] = [
      { isCorrect: true, item: { a: 2.0, b: -2.0, c: 0.2 } },
      { isCorrect: true, item: { a: 2.0, b: -2.0, c: 0.2 } },
      { isCorrect: true, item: { a: 2.0, b: -2.0, c: 0.2 } },
      { isCorrect: true, item: { a: 2.0, b: -2.0, c: 0.2 } },
      { isCorrect: true, item: { a: 2.0, b: -2.0, c: 0.2 } },
    ];
    const newTheta = updateTheta(highTheta, responses);
    expect(newTheta).toBeLessThanOrEqual(3.0);

    // Extreme case: very low theta + incorrect on hard question
    const lowTheta = -2.8;
    const incorrectResponses: IRTResponse[] = [
      { isCorrect: false, item: { a: 2.0, b: 2.0, c: 0.2 } },
      { isCorrect: false, item: { a: 2.0, b: 2.0, c: 0.2 } },
      { isCorrect: false, item: { a: 2.0, b: 2.0, c: 0.2 } },
      { isCorrect: false, item: { a: 2.0, b: 2.0, c: 0.2 } },
      { isCorrect: false, item: { a: 2.0, b: 2.0, c: 0.2 } },
    ];
    const lowNewTheta = updateTheta(lowTheta, incorrectResponses);
    expect(lowNewTheta).toBeGreaterThanOrEqual(-3.0);
  });

  it("should return current theta when given empty responses array", () => {
    const currentTheta = 1.5;
    const newTheta = updateTheta(currentTheta, []);
    expect(newTheta).toBe(currentTheta);
  });

  it("should produce larger adjustments with higher discrimination items", () => {
    const currentTheta = 0.0;

    // High discrimination correct
    const highDiscResponse: IRTResponse[] = [
      { isCorrect: true, item: { a: 2.5, b: 0.5, c: 0.2 } },
    ];
    const thetaHighDisc = updateTheta(currentTheta, highDiscResponse);

    // Low discrimination correct (same difficulty)
    const lowDiscResponse: IRTResponse[] = [
      { isCorrect: true, item: { a: 0.5, b: 0.5, c: 0.2 } },
    ];
    const thetaLowDisc = updateTheta(currentTheta, lowDiscResponse);

    // Higher discrimination should produce larger absolute change
    expect(Math.abs(thetaHighDisc - currentTheta)).toBeGreaterThan(
      Math.abs(thetaLowDisc - currentTheta),
    );
  });

  it("should converge — repeated correct answers should produce diminishing theta gains", () => {
    let theta = 0.0;
    const item: IRTParameters = { a: 1.0, b: 0.0, c: 0.2 };
    const gains: number[] = [];

    for (let i = 0; i < 5; i++) {
      const newTheta = updateTheta(theta, [{ isCorrect: true, item }]);
      gains.push(newTheta - theta);
      theta = newTheta;
    }

    // Each successive gain should be smaller as theta moves away from b
    for (let i = 1; i < gains.length; i++) {
      expect(gains[i]).toBeLessThan(gains[i - 1]!);
    }
  });
});

describe("itemInformation — Fisher Information", () => {
  it("should be maximized when θ is near b", () => {
    const params: IRTParameters = { a: 1.5, b: 0.0, c: 0.2 };

    const infoAtB = itemInformation(0.0, params);
    const infoFarAbove = itemInformation(2.0, params);
    const infoFarBelow = itemInformation(-2.0, params);

    expect(infoAtB).toBeGreaterThan(infoFarAbove);
    expect(infoAtB).toBeGreaterThan(infoFarBelow);
  });

  it("should increase with higher discrimination (a)", () => {
    const paramsHighA: IRTParameters = { a: 2.5, b: 0.0, c: 0.2 };
    const paramsLowA: IRTParameters = { a: 0.5, b: 0.0, c: 0.2 };

    const infoHigh = itemInformation(0.0, paramsHighA);
    const infoLow = itemInformation(0.0, paramsLowA);

    expect(infoHigh).toBeGreaterThan(infoLow);
  });

  it("should always be non-negative", () => {
    const params: IRTParameters = { a: 1.0, b: 0.0, c: 0.2 };
    const thetas = [-3, -2, -1, 0, 1, 2, 3];

    for (const theta of thetas) {
      expect(itemInformation(theta, params)).toBeGreaterThanOrEqual(0);
    }
  });

  it("should be zero or near-zero when c=0 and θ << b (probability near 0)", () => {
    // With c=0, when P approaches 0, information approaches 0
    const params: IRTParameters = { a: 1.0, b: 3.0, c: 0.0 };
    const info = itemInformation(-3.0, params);
    expect(info).toBeLessThan(0.01);
  });

  it("should match manual calculation for known values", () => {
    // θ=0, a=1.0, b=0, c=0.2
    // P(0) = 0.2 + 0.8/2 = 0.6
    // I(0) = a² * (P-c)² / ((1-c)² * P * (1-P))
    //      = 1.0 * (0.4)² / (0.64 * 0.6 * 0.4)
    //      = 0.16 / 0.1536
    //      ≈ 1.0417
    const params: IRTParameters = { a: 1.0, b: 0.0, c: 0.2 };
    const info = itemInformation(0.0, params);
    expect(info).toBeCloseTo(1.0417, 2);
  });
});
