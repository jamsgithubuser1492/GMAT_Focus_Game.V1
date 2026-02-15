/**
 * IRT (Item Response Theory) — 3-Parameter Logistic Model
 *
 * Core probability and theta estimation functions for the TutorEngine.
 * These functions are the mathematical foundation of adaptive question selection.
 *
 * The 3PL model accounts for:
 *   a — discrimination: how sharply the item separates high/low ability
 *   b — difficulty: the theta level at which P = c + (1-c)/2
 *   c — guessing: the floor probability (0.2 for 5-choice MCQ)
 */

import type { IRTParameters, IRTResponse } from "./types";
import { GMAT_FOCUS } from "./types";

/**
 * Calculate the probability of a correct response using the 3PL IRT model.
 *
 * P(θ) = c + (1 - c) / (1 + e^(-a(θ - b)))
 *
 * @param theta - Learner proficiency level
 * @param params - IRT item parameters { a: discrimination, b: difficulty, c: guessing }
 * @returns Probability of correct response [0, 1]
 */
export function irtProbability(theta: number, params: IRTParameters): number {
  const { a, b, c } = params;
  const exponent = -a * (theta - b);
  const logistic = 1 / (1 + Math.exp(exponent));
  return c + (1 - c) * logistic;
}

/**
 * Update theta (proficiency) estimate after observed responses.
 *
 * Uses a gradient-ascent step on the log-likelihood surface. Each item's
 * discrimination (a) directly scales its contribution, meaning highly
 * discriminating items produce proportionally larger proficiency adjustments.
 * The residual (x - P) naturally shrinks as theta moves away from item
 * difficulty, producing convergent, diminishing updates — the hallmark of
 * an adaptive system that refines its estimate with every question answered.
 *
 * @param currentTheta - Current proficiency estimate
 * @param responses - Array of responses with correctness and item parameters
 * @returns Updated theta value, clamped to [-3, 3]
 */
export function updateTheta(currentTheta: number, responses: IRTResponse[]): number {
  if (responses.length === 0) {
    return currentTheta;
  }

  let gradient = 0;

  for (const response of responses) {
    const p = irtProbability(currentTheta, response.item);
    const x = response.isCorrect ? 1 : 0;
    gradient += response.item.a * (x - p);
  }

  const newTheta = currentTheta + gradient;
  return Math.max(GMAT_FOCUS.THETA_MIN, Math.min(GMAT_FOCUS.THETA_MAX, newTheta));
}

/**
 * Calculate the Fisher information value of a question for a given theta.
 * Used by the question selector to find maximally informative items.
 *
 * I(θ) = a² * (P(θ) - c)² / ((1 - c)² * P(θ) * (1 - P(θ)))
 *
 * Information is highest when theta ≈ b (item difficulty matches ability)
 * and when discrimination (a) is large. This drives the adaptive engine to
 * serve questions at the learner's frontier of competence.
 *
 * @param theta - Learner proficiency level
 * @param params - IRT item parameters
 * @returns Fisher information value (non-negative)
 */
export function itemInformation(theta: number, params: IRTParameters): number {
  const { a, c } = params;
  const p = irtProbability(theta, params);

  // Guard against degenerate cases
  if (p <= c || p <= 0 || (1 - c) <= 0) {
    return 0;
  }

  // Effective probability (the logistic component without guessing)
  const pStar = (p - c) / (1 - c);
  const qStar = 1 - pStar;

  // 3PL Fisher information: peaks near θ ≈ b because pStar²·(1-pStar)
  // is maximized when pStar is near 0.5 (i.e., θ near item difficulty).
  return 4 * a * a * pStar * pStar * qStar / ((1 - c) * p);
}
