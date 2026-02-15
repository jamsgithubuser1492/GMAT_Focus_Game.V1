/**
 * Knowledge Decay System
 *
 * Implements the "Loss Avoidance" gamification drive (Octalysis Framework).
 * Skills decay linearly over KNOWLEDGE_DECAY_DAYS (7 days) of inactivity,
 * degrading mastery bars and motivating consistent daily practice.
 *
 * The decay factor modulates effective theta: a fully-decayed skill resets
 * the learner's displayed proficiency to zero, signaling urgency to revisit.
 */

import { GMAT_FOCUS } from "./types";

const MS_PER_DAY = 86_400_000; // 24 * 60 * 60 * 1000

/**
 * Calculate the number of days elapsed since last practice.
 *
 * @param lastPracticed - Date of last practice, or null if never practiced
 * @param now - Reference date (defaults to current time)
 * @returns Days elapsed (fractional), or Infinity if never practiced
 */
export function daysSinceLastPractice(lastPracticed: Date | null, now: Date = new Date()): number {
  if (lastPracticed === null) {
    return Infinity;
  }
  const elapsed = now.getTime() - lastPracticed.getTime();
  return Math.max(0, elapsed / MS_PER_DAY);
}

/**
 * Calculate the decay factor for a skill based on time since last practice.
 *
 * Linear decay from 1.0 (just practiced) to 0.0 (at or beyond threshold).
 *
 * @param lastPracticed - Date of last practice, or null if never practiced
 * @param now - Reference date (defaults to current time)
 * @returns Decay factor in [0, 1]
 */
export function calculateDecayFactor(lastPracticed: Date | null, now: Date = new Date()): number {
  const days = daysSinceLastPractice(lastPracticed, now);

  if (days === Infinity) {
    return 0.0;
  }

  const threshold = GMAT_FOCUS.KNOWLEDGE_DECAY_DAYS;
  const factor = 1.0 - days / threshold;
  return Math.max(0.0, Math.min(1.0, factor));
}

/**
 * Apply decay to a theta value, producing the "effective" displayed theta.
 *
 * @param theta - Raw proficiency estimate [-3, 3]
 * @param decayFactor - Decay factor [0, 1] (clamped defensively)
 * @returns Effective theta, clamped to [-3, 3]
 */
export function applyDecayToTheta(theta: number, decayFactor: number): number {
  const clampedDecay = Math.max(0.0, Math.min(1.0, decayFactor));
  const effective = theta * clampedDecay;
  return Math.max(GMAT_FOCUS.THETA_MIN, Math.min(GMAT_FOCUS.THETA_MAX, effective));
}

/**
 * Determine whether a skill is stale and needs refresh.
 *
 * @param lastPracticed - Date of last practice, or null if never practiced
 * @param thresholdDays - Number of days before skill is considered stale (default: KNOWLEDGE_DECAY_DAYS)
 * @param now - Reference date (defaults to current time)
 * @returns True if the skill needs refresh
 */
export function isSkillStale(
  lastPracticed: Date | null,
  thresholdDays: number = GMAT_FOCUS.KNOWLEDGE_DECAY_DAYS,
  now: Date = new Date(),
): boolean {
  const days = daysSinceLastPractice(lastPracticed, now);
  return days >= thresholdDays;
}
