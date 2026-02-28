/**
 * Unit Tests: Gamification Engine
 *
 * Tests for XP calculation, leveling, streak tracking, and badge checking.
 */

import { describe, it, expect } from "vitest";
import {
  getLevel,
  getXPForNextLevel,
  calculateAnswerXP,
  calculateSessionXP,
  computeStreak,
  checkNewBadges,
  XP,
  BADGE_DEFINITIONS,
} from "@/lib/gamification";

// ---------------------------------------------------------------------------
// getLevel
// ---------------------------------------------------------------------------

describe("getLevel", () => {
  it("should return level 1 for 0 XP", () => {
    expect(getLevel(0)).toBe(1);
  });

  it("should return level 1 for 99 XP (just under threshold)", () => {
    expect(getLevel(99)).toBe(1);
  });

  it("should return level 2 for exactly 100 XP", () => {
    expect(getLevel(100)).toBe(2);
  });

  it("should return level 5 for 1000 XP", () => {
    expect(getLevel(1000)).toBe(5);
  });

  it("should return level 10 for 5200 XP", () => {
    expect(getLevel(5200)).toBe(10);
  });

  it("should return level 15 for 15500+ XP", () => {
    expect(getLevel(15500)).toBe(15);
    expect(getLevel(99999)).toBe(15);
  });

  it("should handle boundary values correctly", () => {
    expect(getLevel(299)).toBe(2);
    expect(getLevel(300)).toBe(3);
  });
});

// ---------------------------------------------------------------------------
// getXPForNextLevel
// ---------------------------------------------------------------------------

describe("getXPForNextLevel", () => {
  it("should return correct progress for level 1 (0 XP)", () => {
    const result = getXPForNextLevel(0);
    expect(result.current).toBe(0);
    expect(result.needed).toBe(100);
    expect(result.progress).toBe(0);
  });

  it("should return 50% progress at 50 XP (level 1)", () => {
    const result = getXPForNextLevel(50);
    expect(result.current).toBe(50);
    expect(result.needed).toBe(100);
    expect(result.progress).toBeCloseTo(0.5);
  });

  it("should return 0% progress at exactly a level boundary", () => {
    const result = getXPForNextLevel(100);
    expect(result.current).toBe(0);
    expect(result.needed).toBe(200); // 300 - 100
    expect(result.progress).toBe(0);
  });

  it("should handle mid-level progress", () => {
    const result = getXPForNextLevel(200);
    expect(result.current).toBe(100); // 200 - 100
    expect(result.needed).toBe(200); // 300 - 100
    expect(result.progress).toBeCloseTo(0.5);
  });
});

// ---------------------------------------------------------------------------
// calculateAnswerXP
// ---------------------------------------------------------------------------

describe("calculateAnswerXP", () => {
  it("should return 0 XP for incorrect answers", () => {
    expect(calculateAnswerXP(false, 2.0)).toBe(0);
    expect(calculateAnswerXP(false, -1.0)).toBe(0);
  });

  it("should return CORRECT_ANSWER XP for easy/medium correct answers", () => {
    expect(calculateAnswerXP(true, 0.5)).toBe(XP.CORRECT_ANSWER);
    expect(calculateAnswerXP(true, -1.0)).toBe(XP.CORRECT_ANSWER);
    expect(calculateAnswerXP(true, 1.0)).toBe(XP.CORRECT_ANSWER);
  });

  it("should return HARD_CORRECT XP for hard correct answers (b > 1.0)", () => {
    expect(calculateAnswerXP(true, 1.1)).toBe(XP.HARD_CORRECT);
    expect(calculateAnswerXP(true, 2.5)).toBe(XP.HARD_CORRECT);
  });
});

// ---------------------------------------------------------------------------
// calculateSessionXP
// ---------------------------------------------------------------------------

describe("calculateSessionXP", () => {
  it("should award SESSION_COMPLETE for drill sessions", () => {
    const xp = calculateSessionXP("drill", 5, 10, 0);
    expect(xp).toBe(XP.SESSION_COMPLETE);
  });

  it("should award FULL_EXAM_COMPLETE for full exams", () => {
    const xp = calculateSessionXP("full_exam", 30, 64, 0);
    expect(xp).toBe(XP.FULL_EXAM_COMPLETE);
  });

  it("should include streak bonus", () => {
    const withStreak = calculateSessionXP("drill", 5, 10, 5);
    const withoutStreak = calculateSessionXP("drill", 5, 10, 0);
    expect(withStreak).toBeGreaterThan(withoutStreak);
  });

  it("should cap streak bonus at 30 days", () => {
    const at30 = calculateSessionXP("drill", 5, 10, 30);
    const at50 = calculateSessionXP("drill", 5, 10, 50);
    expect(at30).toBe(at50);
  });

  it("should apply 20% accuracy bonus when accuracy >= 70%", () => {
    const highAccuracy = calculateSessionXP("drill", 8, 10, 0); // 80%
    const lowAccuracy = calculateSessionXP("drill", 5, 10, 0);  // 50%
    expect(highAccuracy).toBeGreaterThan(lowAccuracy);
  });
});

// ---------------------------------------------------------------------------
// computeStreak
// ---------------------------------------------------------------------------

describe("computeStreak", () => {
  it("should start at 1 when no previous streak", () => {
    const result = computeStreak(0, null);
    expect(result.streakDays).toBe(1);
  });

  it("should not change streak on same day", () => {
    const now = new Date("2025-06-15T14:00:00Z");
    const lastDate = new Date("2025-06-15T08:00:00Z");
    const result = computeStreak(5, lastDate, now);
    expect(result.streakDays).toBe(5);
  });

  it("should increment streak on consecutive day", () => {
    const now = new Date("2025-06-16T10:00:00Z");
    const lastDate = new Date("2025-06-15T20:00:00Z");
    const result = computeStreak(5, lastDate, now);
    expect(result.streakDays).toBe(6);
  });

  it("should reset streak after 2+ days gap", () => {
    const now = new Date("2025-06-18T10:00:00Z");
    const lastDate = new Date("2025-06-15T20:00:00Z");
    const result = computeStreak(10, lastDate, now);
    expect(result.streakDays).toBe(1);
  });
});

// ---------------------------------------------------------------------------
// checkNewBadges
// ---------------------------------------------------------------------------

describe("checkNewBadges", () => {
  it("should award 'first-session' on first completion", () => {
    const badges = checkNewBadges([], {
      sessionsCompleted: 1,
      streakDays: 1,
      totalQuestions: 10,
      level: 1,
    });
    expect(badges.some((b) => b.id === "first-session")).toBe(true);
  });

  it("should award streak badges at correct thresholds", () => {
    const badges3 = checkNewBadges(["first-session"], {
      sessionsCompleted: 3,
      streakDays: 3,
      totalQuestions: 30,
      level: 1,
    });
    expect(badges3.some((b) => b.id === "streak-3")).toBe(true);

    const badges7 = checkNewBadges(["first-session", "streak-3"], {
      sessionsCompleted: 7,
      streakDays: 7,
      totalQuestions: 70,
      level: 2,
    });
    expect(badges7.some((b) => b.id === "streak-7")).toBe(true);
  });

  it("should not re-award existing badges", () => {
    const badges = checkNewBadges(["first-session", "streak-3"], {
      sessionsCompleted: 5,
      streakDays: 5,
      totalQuestions: 50,
      level: 2,
    });
    expect(badges.some((b) => b.id === "first-session")).toBe(false);
    expect(badges.some((b) => b.id === "streak-3")).toBe(false);
  });

  it("should award score badges", () => {
    const badges = checkNewBadges([], {
      sessionsCompleted: 1,
      streakDays: 1,
      totalQuestions: 64,
      projectedScore: 705,
      level: 3,
    });
    expect(badges.some((b) => b.id === "score-600")).toBe(true);
    expect(badges.some((b) => b.id === "score-700")).toBe(true);
  });

  it("should award accuracy badge only with 20+ questions and 80%+ accuracy", () => {
    const notEnough = checkNewBadges([], {
      sessionsCompleted: 1,
      streakDays: 1,
      totalQuestions: 10,
      sessionAccuracy: 0.9,
      sessionQuestionCount: 10,
      level: 1,
    });
    expect(notEnough.some((b) => b.id === "accuracy-80")).toBe(false);

    const enough = checkNewBadges([], {
      sessionsCompleted: 1,
      streakDays: 1,
      totalQuestions: 25,
      sessionAccuracy: 0.85,
      sessionQuestionCount: 25,
      level: 1,
    });
    expect(enough.some((b) => b.id === "accuracy-80")).toBe(true);
  });

  it("should award full-exam badge", () => {
    const badges = checkNewBadges([], {
      sessionsCompleted: 1,
      streakDays: 1,
      totalQuestions: 64,
      level: 1,
      sessionType: "full_exam",
    });
    expect(badges.some((b) => b.id === "full-exam")).toBe(true);
  });

  it("should award level badges", () => {
    const badges = checkNewBadges([], {
      sessionsCompleted: 10,
      streakDays: 1,
      totalQuestions: 200,
      level: 5,
    });
    expect(badges.some((b) => b.id === "level-5")).toBe(true);
  });

  it("should have definitions for all checked badges", () => {
    const allIds = BADGE_DEFINITIONS.map((b) => b.id);
    expect(allIds.length).toBe(12);
    expect(new Set(allIds).size).toBe(12); // no duplicates
  });
});
