/**
 * IRT (Item Response Theory) — 3-Parameter Logistic Model
 *
 * Core probability and theta estimation functions for the TutorEngine.
 * These functions are the mathematical foundation of adaptive question selection.
 *
 * TODO: Implement in Step 5 after tests are written and confirmed failing.
 */

import type { IRTParameters, IRTResponse } from "./types";

/**
 * Calculate the probability of a correct response using the 3PL IRT model.
 *
 * P(θ) = c + (1 - c) / (1 + e^(-a(θ - b)))
 *
 * @param theta - Learner proficiency level
 * @param params - IRT item parameters { a: discrimination, b: difficulty, c: guessing }
 * @returns Probability of correct response [0, 1]
 */
export function irtProbability(_theta: number, _params: IRTParameters): number {
  throw new Error("Not implemented: irtProbability");
}

/**
 * Update theta (proficiency) estimate using Maximum Likelihood Estimation
 * via Newton-Raphson single-step update.
 *
 * θ_new = θ_old + Σ[a_i * (x_i - P_i(θ))] / Σ[a_i² * P_i(θ) * (1 - P_i(θ))]
 *
 * @param currentTheta - Current proficiency estimate
 * @param responses - Array of responses with correctness and item parameters
 * @returns Updated theta value, clamped to [-3, 3]
 */
export function updateTheta(_currentTheta: number, _responses: IRTResponse[]): number {
  throw new Error("Not implemented: updateTheta");
}

/**
 * Calculate the information value of a question for a given theta.
 * Used by the question selector to find maximally informative items.
 *
 * I(θ) = a² * (P(θ) - c)² / ((1 - c)² * P(θ) * (1 - P(θ)))
 *
 * @param theta - Learner proficiency level
 * @param params - IRT item parameters
 * @returns Fisher information value
 */
export function itemInformation(_theta: number, _params: IRTParameters): number {
  throw new Error("Not implemented: itemInformation");
}
