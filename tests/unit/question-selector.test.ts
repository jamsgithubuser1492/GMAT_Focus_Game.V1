/**
 * Unit Tests: Adaptive Question Selection Algorithm
 *
 * Tests for:
 *   - selectNextQuestion(): main adaptive selection orchestrator
 *   - rankByInformation(): rank questions by Fisher information at learner's theta
 *   - filterEligibleQuestions(): exclude already-answered questions
 *   - getTargetTheta(): convert target GMAT score → per-section theta
 *
 * The question selector is the "brain" of the adaptive engine. It uses
 * Fisher information to pick the most informative item at the learner's
 * current proficiency, weighted by spaced-repetition decay and skill gaps.
 *
 * TDD Red Phase — all tests must FAIL before implementation.
 */

import { describe, it, expect } from "vitest";
import {
  selectNextQuestion,
  rankByInformation,
  filterEligibleQuestions,
  getTargetTheta,
} from "@/lib/tutor-engine/question-selector";
import type { Question, LearnerProfile } from "@/lib/tutor-engine/types";

// ---------------------------------------------------------------------------
// Test Fixtures
// ---------------------------------------------------------------------------

/** Helper: build a minimal Question with overrides */
function makeQuestion(overrides: Partial<Question> & { id: string }): Question {
  return {
    section: "quantitative",
    questionType: "problem_solving",
    skillNodeIds: ["skill-1"],
    difficulty: 0.0,
    discrimination: 1.0,
    guessing: 0.2,
    content: "{}",
    correctAnswer: "A",
    explanation: "",
    estimatedTimeSeconds: 120,
    ...overrides,
  };
}

/** Helper: build a minimal LearnerProfile with overrides */
function makeProfile(overrides: Partial<LearnerProfile> = {}): LearnerProfile {
  return {
    userId: "user-1",
    skillNodeId: "skill-1",
    theta: 0.0,
    attempts: 5,
    correct: 3,
    lastPracticed: new Date("2025-06-15T12:00:00Z"),
    decayFactor: 1.0,
    ...overrides,
  };
}

// Standard question pool for most tests
const QUESTION_POOL: Question[] = [
  makeQuestion({ id: "q-easy", difficulty: -2.0, discrimination: 1.0 }),
  makeQuestion({ id: "q-medium", difficulty: 0.0, discrimination: 1.5 }),
  makeQuestion({ id: "q-hard", difficulty: 1.5, discrimination: 1.2 }),
  makeQuestion({ id: "q-very-hard", difficulty: 2.5, discrimination: 1.0 }),
  makeQuestion({ id: "q-matched", difficulty: 0.5, discrimination: 2.0 }),
];

// ---------------------------------------------------------------------------
// getTargetTheta
// ---------------------------------------------------------------------------
describe("getTargetTheta — Target Score to Per-Section Theta", () => {
  it("should map 705 → theta ≈ 2.0", () => {
    const theta = getTargetTheta(705);
    expect(theta).toBeCloseTo(2.0, 1);
  });

  it("should map 505 → theta ≈ 0.0 (midpoint)", () => {
    const theta = getTargetTheta(505);
    expect(theta).toBeCloseTo(0.0, 1);
  });

  it("should map 205 → theta = -3.0 (minimum)", () => {
    const theta = getTargetTheta(205);
    expect(theta).toBeCloseTo(-3.0, 1);
  });

  it("should map 805 → theta = 3.0 (maximum)", () => {
    const theta = getTargetTheta(805);
    expect(theta).toBeCloseTo(3.0, 1);
  });

  it("should return higher theta for higher scores", () => {
    const low = getTargetTheta(405);
    const mid = getTargetTheta(555);
    const high = getTargetTheta(705);
    expect(mid).toBeGreaterThan(low);
    expect(high).toBeGreaterThan(mid);
  });

  it("should clamp to [-3, 3] for extreme inputs", () => {
    expect(getTargetTheta(100)).toBeGreaterThanOrEqual(-3.0);
    expect(getTargetTheta(1000)).toBeLessThanOrEqual(3.0);
  });
});

// ---------------------------------------------------------------------------
// filterEligibleQuestions
// ---------------------------------------------------------------------------
describe("filterEligibleQuestions — Exclude Already-Answered Items", () => {
  it("should return all questions when no IDs are excluded", () => {
    const result = filterEligibleQuestions(QUESTION_POOL);
    expect(result).toHaveLength(QUESTION_POOL.length);
  });

  it("should exclude questions by ID", () => {
    const answered = new Set(["q-easy", "q-hard"]);
    const result = filterEligibleQuestions(QUESTION_POOL, answered);
    expect(result).toHaveLength(3);
    expect(result.find((q) => q.id === "q-easy")).toBeUndefined();
    expect(result.find((q) => q.id === "q-hard")).toBeUndefined();
  });

  it("should return empty array when all questions are excluded", () => {
    const allIds = new Set(QUESTION_POOL.map((q) => q.id));
    const result = filterEligibleQuestions(QUESTION_POOL, allIds);
    expect(result).toHaveLength(0);
  });

  it("should return empty array when candidates list is empty", () => {
    const result = filterEligibleQuestions([]);
    expect(result).toHaveLength(0);
  });

  it("should not modify the original array", () => {
    const original = [...QUESTION_POOL];
    filterEligibleQuestions(QUESTION_POOL, new Set(["q-easy"]));
    expect(QUESTION_POOL).toEqual(original);
  });
});

// ---------------------------------------------------------------------------
// rankByInformation
// ---------------------------------------------------------------------------
describe("rankByInformation — Rank Questions by Fisher Information", () => {
  it("should rank questions with difficulty near theta highest", () => {
    const theta = 0.5;
    const ranked = rankByInformation(QUESTION_POOL, theta);

    // q-matched (b=0.5) should be ranked first since it matches theta exactly
    // and has high discrimination (a=2.0)
    expect(ranked[0]!.question.id).toBe("q-matched");
  });

  it("should return all questions in the ranked list", () => {
    const ranked = rankByInformation(QUESTION_POOL, 0.0);
    expect(ranked).toHaveLength(QUESTION_POOL.length);
  });

  it("should have non-negative scores for all items", () => {
    const ranked = rankByInformation(QUESTION_POOL, 0.0);
    for (const item of ranked) {
      expect(item.informationScore).toBeGreaterThanOrEqual(0);
    }
  });

  it("should be sorted in descending order of information score", () => {
    const ranked = rankByInformation(QUESTION_POOL, 0.0);
    for (let i = 1; i < ranked.length; i++) {
      expect(ranked[i]!.informationScore).toBeLessThanOrEqual(
        ranked[i - 1]!.informationScore,
      );
    }
  });

  it("should prefer high-discrimination items at matched difficulty", () => {
    // Two questions at the same difficulty but different discrimination
    const pool = [
      makeQuestion({ id: "low-disc", difficulty: 0.0, discrimination: 0.5 }),
      makeQuestion({ id: "high-disc", difficulty: 0.0, discrimination: 2.5 }),
    ];
    const ranked = rankByInformation(pool, 0.0);
    expect(ranked[0]!.question.id).toBe("high-disc");
  });

  it("should return empty array for empty pool", () => {
    const ranked = rankByInformation([], 0.0);
    expect(ranked).toHaveLength(0);
  });
});

// ---------------------------------------------------------------------------
// selectNextQuestion — The Core Adaptive Selection
// ---------------------------------------------------------------------------
describe("selectNextQuestion — Adaptive Question Selection", () => {
  it("should return the most informative question for the learner's theta", () => {
    const profiles = new Map<string, LearnerProfile>();
    profiles.set("skill-1", makeProfile({ theta: 0.5 }));

    const result = selectNextQuestion({
      candidateQuestions: QUESTION_POOL,
      learnerProfiles: profiles,
      currentSectionTheta: 0.5,
    });

    expect(result).not.toBeNull();
    // Should pick q-matched (b=0.5, a=2.0) — closest to theta with high discrimination
    expect(result!.id).toBe("q-matched");
  });

  it("should exclude already-answered questions", () => {
    const profiles = new Map<string, LearnerProfile>();
    profiles.set("skill-1", makeProfile({ theta: 0.5 }));

    const result = selectNextQuestion({
      candidateQuestions: QUESTION_POOL,
      learnerProfiles: profiles,
      currentSectionTheta: 0.5,
      answeredQuestionIds: new Set(["q-matched"]),
    });

    expect(result).not.toBeNull();
    expect(result!.id).not.toBe("q-matched");
  });

  it("should return null when no eligible questions remain", () => {
    const allIds = new Set(QUESTION_POOL.map((q) => q.id));
    const profiles = new Map<string, LearnerProfile>();

    const result = selectNextQuestion({
      candidateQuestions: QUESTION_POOL,
      learnerProfiles: profiles,
      currentSectionTheta: 0.0,
      answeredQuestionIds: allIds,
    });

    expect(result).toBeNull();
  });

  it("should return null for empty candidate pool", () => {
    const result = selectNextQuestion({
      candidateQuestions: [],
      learnerProfiles: new Map(),
      currentSectionTheta: 0.0,
    });

    expect(result).toBeNull();
  });

  it("should adapt to learner's changing theta", () => {
    const profiles = new Map<string, LearnerProfile>();

    // Low-ability learner → should get easier questions
    profiles.set("skill-1", makeProfile({ theta: -2.0 }));
    const easyResult = selectNextQuestion({
      candidateQuestions: QUESTION_POOL,
      learnerProfiles: profiles,
      currentSectionTheta: -2.0,
    });

    // High-ability learner → should get harder questions
    profiles.set("skill-1", makeProfile({ theta: 2.0 }));
    const hardResult = selectNextQuestion({
      candidateQuestions: QUESTION_POOL,
      learnerProfiles: profiles,
      currentSectionTheta: 2.0,
    });

    expect(easyResult).not.toBeNull();
    expect(hardResult).not.toBeNull();
    expect(hardResult!.difficulty).toBeGreaterThan(easyResult!.difficulty);
  });

  it("should boost questions for stale/decayed skills", () => {
    const now = new Date("2025-06-15T12:00:00Z");

    // Two questions on different skills
    const q1 = makeQuestion({
      id: "q-fresh-skill",
      difficulty: 0.0,
      discrimination: 1.5,
      skillNodeIds: ["skill-fresh"],
    });
    const q2 = makeQuestion({
      id: "q-stale-skill",
      difficulty: 0.0,
      discrimination: 1.5,
      skillNodeIds: ["skill-stale"],
    });

    const profiles = new Map<string, LearnerProfile>();
    profiles.set(
      "skill-fresh",
      makeProfile({
        skillNodeId: "skill-fresh",
        theta: 0.0,
        lastPracticed: now,
        decayFactor: 1.0,
      }),
    );
    profiles.set(
      "skill-stale",
      makeProfile({
        skillNodeId: "skill-stale",
        theta: 0.0,
        lastPracticed: new Date("2025-06-08T12:00:00Z"), // 7 days ago
        decayFactor: 0.0,
      }),
    );

    const result = selectNextQuestion({
      candidateQuestions: [q1, q2],
      learnerProfiles: profiles,
      currentSectionTheta: 0.0,
      now,
    });

    expect(result).not.toBeNull();
    // Should prefer the stale skill to reinforce decaying knowledge
    expect(result!.id).toBe("q-stale-skill");
  });

  it("should work without learner profiles (cold start)", () => {
    const result = selectNextQuestion({
      candidateQuestions: QUESTION_POOL,
      learnerProfiles: new Map(),
      currentSectionTheta: 0.0,
    });

    // Should still return a question (using section theta only)
    expect(result).not.toBeNull();
  });

  it("should handle questions with multiple skill nodes", () => {
    const multiSkillQ = makeQuestion({
      id: "q-multi",
      difficulty: 0.0,
      discrimination: 1.5,
      skillNodeIds: ["skill-1", "skill-2", "skill-3"],
    });

    const profiles = new Map<string, LearnerProfile>();
    profiles.set("skill-1", makeProfile({ skillNodeId: "skill-1", decayFactor: 0.5 }));
    profiles.set("skill-2", makeProfile({ skillNodeId: "skill-2", decayFactor: 0.3 }));

    const result = selectNextQuestion({
      candidateQuestions: [multiSkillQ],
      learnerProfiles: profiles,
      currentSectionTheta: 0.0,
    });

    expect(result).not.toBeNull();
    expect(result!.id).toBe("q-multi");
  });
});
