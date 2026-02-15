/**
 * Unit Tests: Knowledge Decay System
 *
 * Tests for:
 *   - calculateDecayFactor(): time-based decay of mastery [0, 1]
 *   - applyDecayToTheta(): effective theta after decay
 *   - daysSinceLastPractice(): days elapsed utility
 *   - isSkillStale(): whether a skill needs refresh
 *
 * The decay system implements the "Loss Avoidance" gamification drive
 * (Octalysis Framework) — 7-day inactivity degrades mastery bars,
 * motivating consistent daily practice.
 *
 * TDD Red Phase — all tests must FAIL before implementation.
 */

import { describe, it, expect } from "vitest";
import {
  calculateDecayFactor,
  applyDecayToTheta,
  daysSinceLastPractice,
  isSkillStale,
} from "@/lib/tutor-engine/decay";
import { GMAT_FOCUS } from "@/lib/tutor-engine/types";
import type { LearnerProfile } from "@/lib/tutor-engine/types";

// ---------------------------------------------------------------------------
// Helper: create a Date N days ago
// ---------------------------------------------------------------------------
function daysAgo(n: number, now: Date = new Date()): Date {
  return new Date(now.getTime() - n * 86_400_000);
}

// ---------------------------------------------------------------------------
// daysSinceLastPractice
// ---------------------------------------------------------------------------
describe("daysSinceLastPractice — Elapsed Days Utility", () => {
  it("should return 0 when last practiced today", () => {
    const now = new Date("2025-06-15T12:00:00Z");
    const lastPracticed = new Date("2025-06-15T08:00:00Z");
    expect(daysSinceLastPractice(lastPracticed, now)).toBeCloseTo(0.167, 1);
  });

  it("should return 1 for exactly 24 hours ago", () => {
    const now = new Date("2025-06-15T12:00:00Z");
    const lastPracticed = new Date("2025-06-14T12:00:00Z");
    expect(daysSinceLastPractice(lastPracticed, now)).toBeCloseTo(1.0, 3);
  });

  it("should return 7 for exactly one week ago", () => {
    const now = new Date("2025-06-15T12:00:00Z");
    const lastPracticed = new Date("2025-06-08T12:00:00Z");
    expect(daysSinceLastPractice(lastPracticed, now)).toBeCloseTo(7.0, 3);
  });

  it("should return Infinity when lastPracticed is null", () => {
    expect(daysSinceLastPractice(null)).toBe(Infinity);
  });

  it("should return fractional days for partial days", () => {
    const now = new Date("2025-06-15T18:00:00Z");
    const lastPracticed = new Date("2025-06-15T06:00:00Z"); // 12 hours ago
    expect(daysSinceLastPractice(lastPracticed, now)).toBeCloseTo(0.5, 2);
  });

  it("should always return non-negative values", () => {
    const now = new Date("2025-06-15T12:00:00Z");
    // Even if lastPracticed is in the "future" (clock skew), clamp to 0
    const future = new Date("2025-06-16T12:00:00Z");
    expect(daysSinceLastPractice(future, now)).toBeGreaterThanOrEqual(0);
  });
});

// ---------------------------------------------------------------------------
// calculateDecayFactor
// ---------------------------------------------------------------------------
describe("calculateDecayFactor — Time-Based Mastery Decay", () => {
  it("should return 1.0 when just practiced (0 days)", () => {
    const now = new Date("2025-06-15T12:00:00Z");
    const lastPracticed = new Date("2025-06-15T12:00:00Z");
    expect(calculateDecayFactor(lastPracticed, now)).toBe(1.0);
  });

  it("should return ~0.5 at half the decay threshold (3.5 days)", () => {
    const now = new Date("2025-06-15T12:00:00Z");
    const halfDecay = daysAgo(3.5, now);
    const factor = calculateDecayFactor(halfDecay, now);
    expect(factor).toBeCloseTo(0.5, 1);
  });

  it("should return 0.0 at exactly the decay threshold (7 days)", () => {
    const now = new Date("2025-06-15T12:00:00Z");
    const atThreshold = daysAgo(7, now);
    const factor = calculateDecayFactor(atThreshold, now);
    expect(factor).toBeCloseTo(0.0, 2);
  });

  it("should return 0.0 beyond the decay threshold (14 days)", () => {
    const now = new Date("2025-06-15T12:00:00Z");
    const pastThreshold = daysAgo(14, now);
    expect(calculateDecayFactor(pastThreshold, now)).toBe(0.0);
  });

  it("should return 0.0 when lastPracticed is null (never practiced)", () => {
    expect(calculateDecayFactor(null)).toBe(0.0);
  });

  it("should always return values in [0, 1]", () => {
    const now = new Date("2025-06-15T12:00:00Z");
    const testDays = [0, 0.5, 1, 2, 3, 4, 5, 6, 7, 10, 30, 365];
    for (const d of testDays) {
      const factor = calculateDecayFactor(daysAgo(d, now), now);
      expect(factor).toBeGreaterThanOrEqual(0);
      expect(factor).toBeLessThanOrEqual(1.0);
    }
  });

  it("should be monotonically non-increasing as days increase", () => {
    const now = new Date("2025-06-15T12:00:00Z");
    let prevFactor = 1.0;
    for (let d = 0; d <= 10; d += 0.5) {
      const factor = calculateDecayFactor(daysAgo(d, now), now);
      expect(factor).toBeLessThanOrEqual(prevFactor + 0.001); // tolerance for floating point
      prevFactor = factor;
    }
  });

  it("should use KNOWLEDGE_DECAY_DAYS constant as the threshold", () => {
    const now = new Date("2025-06-15T12:00:00Z");
    // At exactly KNOWLEDGE_DECAY_DAYS, factor should be 0
    const atThreshold = daysAgo(GMAT_FOCUS.KNOWLEDGE_DECAY_DAYS, now);
    expect(calculateDecayFactor(atThreshold, now)).toBeCloseTo(0.0, 2);
  });
});

// ---------------------------------------------------------------------------
// applyDecayToTheta
// ---------------------------------------------------------------------------
describe("applyDecayToTheta — Effective Theta After Decay", () => {
  it("should return full theta when decayFactor is 1.0", () => {
    expect(applyDecayToTheta(2.0, 1.0)).toBe(2.0);
  });

  it("should return 0.0 when decayFactor is 0.0", () => {
    expect(applyDecayToTheta(2.0, 0.0)).toBe(0.0);
  });

  it("should return half theta when decayFactor is 0.5", () => {
    expect(applyDecayToTheta(2.0, 0.5)).toBe(1.0);
  });

  it("should handle negative theta values", () => {
    expect(applyDecayToTheta(-2.0, 0.5)).toBe(-1.0);
  });

  it("should return 0.0 when theta is 0.0 regardless of decay", () => {
    expect(applyDecayToTheta(0.0, 0.5)).toBe(0.0);
    expect(applyDecayToTheta(0.0, 1.0)).toBe(0.0);
    expect(applyDecayToTheta(0.0, 0.0)).toBe(0.0);
  });

  it("should clamp result to [-3, 3]", () => {
    // Even with extreme inputs, theta stays bounded
    expect(applyDecayToTheta(3.0, 1.0)).toBeLessThanOrEqual(3.0);
    expect(applyDecayToTheta(-3.0, 1.0)).toBeGreaterThanOrEqual(-3.0);
  });

  it("should clamp decayFactor to [0, 1] if out of range", () => {
    // Defensive: if decay factor is somehow > 1 or < 0
    expect(applyDecayToTheta(2.0, 1.5)).toBe(2.0); // clamped to 1.0
    expect(applyDecayToTheta(2.0, -0.5)).toBe(0.0); // clamped to 0.0
  });
});

// ---------------------------------------------------------------------------
// isSkillStale
// ---------------------------------------------------------------------------
describe("isSkillStale — Staleness Detection", () => {
  it("should return false when just practiced", () => {
    const now = new Date("2025-06-15T12:00:00Z");
    expect(isSkillStale(now, GMAT_FOCUS.KNOWLEDGE_DECAY_DAYS, now)).toBe(false);
  });

  it("should return false at 6 days (within threshold)", () => {
    const now = new Date("2025-06-15T12:00:00Z");
    const sixDaysAgo = daysAgo(6, now);
    expect(isSkillStale(sixDaysAgo, GMAT_FOCUS.KNOWLEDGE_DECAY_DAYS, now)).toBe(false);
  });

  it("should return true at 7 days (at threshold)", () => {
    const now = new Date("2025-06-15T12:00:00Z");
    const sevenDaysAgo = daysAgo(7, now);
    expect(isSkillStale(sevenDaysAgo, GMAT_FOCUS.KNOWLEDGE_DECAY_DAYS, now)).toBe(true);
  });

  it("should return true beyond 7 days", () => {
    const now = new Date("2025-06-15T12:00:00Z");
    const tenDaysAgo = daysAgo(10, now);
    expect(isSkillStale(tenDaysAgo, GMAT_FOCUS.KNOWLEDGE_DECAY_DAYS, now)).toBe(true);
  });

  it("should return true when lastPracticed is null", () => {
    expect(isSkillStale(null)).toBe(true);
  });

  it("should support custom threshold days", () => {
    const now = new Date("2025-06-15T12:00:00Z");
    const threeDaysAgo = daysAgo(3, now);
    // Custom 2-day threshold: 3 days ago is stale
    expect(isSkillStale(threeDaysAgo, 2, now)).toBe(true);
    // Custom 5-day threshold: 3 days ago is not stale
    expect(isSkillStale(threeDaysAgo, 5, now)).toBe(false);
  });
});
