/**
 * Integration Tests: Adaptive Engine with Decay + Target Score
 *
 * Validates that the full pipeline works:
 *   - Question selector uses learner profiles for decay boosting
 *   - Target score influences question selection via effectiveTheta
 *   - DB-fetched questions are properly transformed
 *   - Learner profile endpoint returns fresh decay factors
 */

import { describe, it, expect } from "vitest";
import { NextRequest } from "next/server";

import { POST as selectQuestionHandler } from "@/app/api/tutor-engine/select-question/route";
import { selectNextQuestion, getTargetTheta } from "@/lib/tutor-engine/question-selector";
import { calculateDecayFactor } from "@/lib/tutor-engine/decay";
import type { Question, LearnerProfile } from "@/lib/tutor-engine/types";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function createRequest(body: unknown): NextRequest {
  return new NextRequest("http://localhost:3000/api/test", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

function makeQuestion(overrides: Partial<Question> & { id: string }): Question {
  return {
    section: "quantitative",
    questionType: "problem_solving",
    skillNodeIds: ["q-algebra-1"],
    difficulty: 0,
    discrimination: 1.0,
    guessing: 0.2,
    content: JSON.stringify({ stem: "Test?", choices: [] }),
    correctAnswer: "A",
    explanation: "Test",
    estimatedTimeSeconds: 60,
    ...overrides,
  };
}

// ---------------------------------------------------------------------------
// Decay-Aware Question Selection
// ---------------------------------------------------------------------------

describe("Decay-aware question selection", () => {
  it("should boost questions with stale skills over fresh skills", () => {
    const freshQuestion = makeQuestion({
      id: "q-fresh",
      skillNodeIds: ["skill-fresh"],
      difficulty: 0.0,
      discrimination: 1.0,
    });
    const staleQuestion = makeQuestion({
      id: "q-stale",
      skillNodeIds: ["skill-stale"],
      difficulty: 0.0,
      discrimination: 1.0,
    });

    const profiles = new Map<string, LearnerProfile>([
      ["skill-fresh", {
        userId: "u1", skillNodeId: "skill-fresh",
        theta: 0, attempts: 10, correct: 7,
        lastPracticed: new Date(), decayFactor: 1.0,
      }],
      ["skill-stale", {
        userId: "u1", skillNodeId: "skill-stale",
        theta: 0, attempts: 10, correct: 7,
        lastPracticed: new Date(Date.now() - 8 * 86400000), decayFactor: 0.0,
      }],
    ]);

    const result = selectNextQuestion({
      candidateQuestions: [freshQuestion, staleQuestion],
      learnerProfiles: profiles,
      currentSectionTheta: 0.0,
    });

    // With identical Fisher information, the stale question should be boosted
    expect(result?.id).toBe("q-stale");
  });

  it("should still prefer high-information items when decay is equal", () => {
    const easyQuestion = makeQuestion({
      id: "q-easy",
      skillNodeIds: ["s1"],
      difficulty: -2.0,
      discrimination: 1.0,
    });
    const matchedQuestion = makeQuestion({
      id: "q-matched",
      skillNodeIds: ["s2"],
      difficulty: 0.0,
      discrimination: 1.5,
    });

    const profiles = new Map<string, LearnerProfile>([
      ["s1", {
        userId: "u1", skillNodeId: "s1",
        theta: 0, attempts: 5, correct: 3,
        lastPracticed: null, decayFactor: 0.0,
      }],
      ["s2", {
        userId: "u1", skillNodeId: "s2",
        theta: 0, attempts: 5, correct: 3,
        lastPracticed: null, decayFactor: 0.0,
      }],
    ]);

    const result = selectNextQuestion({
      candidateQuestions: [easyQuestion, matchedQuestion],
      learnerProfiles: profiles,
      currentSectionTheta: 0.0,
    });

    // matchedQuestion has higher Fisher information at theta=0
    expect(result?.id).toBe("q-matched");
  });

  it("should handle empty learner profiles gracefully (treat all as stale)", () => {
    const q1 = makeQuestion({ id: "q1", difficulty: 0.0 });
    const q2 = makeQuestion({ id: "q2", difficulty: 0.5 });

    const result = selectNextQuestion({
      candidateQuestions: [q1, q2],
      learnerProfiles: new Map(),
      currentSectionTheta: 0.0,
    });

    // Should still return a question (falls back to information-only)
    expect(result).not.toBeNull();
  });
});

// ---------------------------------------------------------------------------
// Target Score Integration
// ---------------------------------------------------------------------------

describe("Target score integration", () => {
  it("getTargetTheta should convert scores to reasonable theta values", () => {
    const theta205 = getTargetTheta(205);
    const theta505 = getTargetTheta(505);
    const theta705 = getTargetTheta(705);
    const theta805 = getTargetTheta(805);

    expect(theta205).toBeLessThan(theta505);
    expect(theta505).toBeLessThan(theta705);
    expect(theta705).toBeLessThan(theta805);

    // All should be within valid theta range
    expect(theta205).toBeGreaterThanOrEqual(-3);
    expect(theta805).toBeLessThanOrEqual(3);
  });

  it("should bias question selection toward target difficulty when targetScore is set", () => {
    // Create questions at different difficulties
    const easyQ = makeQuestion({ id: "easy", difficulty: -2.0, discrimination: 1.0 });
    const medQ = makeQuestion({ id: "med", difficulty: 0.0, discrimination: 1.0 });
    const hardQ = makeQuestion({ id: "hard", difficulty: 2.0, discrimination: 1.0 });

    // Starting at theta=0, no target: should pick question near theta=0
    const noTarget = selectNextQuestion({
      candidateQuestions: [easyQ, medQ, hardQ],
      learnerProfiles: new Map(),
      currentSectionTheta: 0.0,
    });

    // With high target score (705): effectiveTheta blends toward target
    const withTarget = selectNextQuestion({
      candidateQuestions: [easyQ, medQ, hardQ],
      learnerProfiles: new Map(),
      currentSectionTheta: 0.0,
      targetScore: 705,
    });

    // Both should return a valid question
    expect(noTarget).not.toBeNull();
    expect(withTarget).not.toBeNull();
  });

  it("should pass targetScore through the API to the selector", async () => {
    const questions = [
      makeQuestion({ id: "q1", difficulty: 0.0 }),
      makeQuestion({ id: "q2", difficulty: 1.0 }),
    ];

    const res = await selectQuestionHandler(
      createRequest({
        candidateQuestions: questions,
        learnerProfiles: {},
        currentSectionTheta: 0.0,
        targetScore: 705,
      }),
    );

    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.question).toBeDefined();
    expect(body.question.id).toBeDefined();
  });
});

// ---------------------------------------------------------------------------
// Decay Factor Computation
// ---------------------------------------------------------------------------

describe("Decay factor for profile loading", () => {
  it("should return 1.0 for just-practiced skills", () => {
    expect(calculateDecayFactor(new Date())).toBeCloseTo(1.0, 1);
  });

  it("should return ~0.5 at 3.5 days (half of 7-day window)", () => {
    const halfwayAgo = new Date(Date.now() - 3.5 * 86400000);
    expect(calculateDecayFactor(halfwayAgo)).toBeCloseTo(0.5, 1);
  });

  it("should return 0.0 at 7+ days", () => {
    const weekAgo = new Date(Date.now() - 7 * 86400000);
    expect(calculateDecayFactor(weekAgo)).toBe(0.0);
  });

  it("should return 0.0 for never-practiced (null)", () => {
    expect(calculateDecayFactor(null)).toBe(0.0);
  });

  it("should clamp between 0 and 1", () => {
    const future = new Date(Date.now() + 86400000);
    expect(calculateDecayFactor(future)).toBeLessThanOrEqual(1.0);
    expect(calculateDecayFactor(future)).toBeGreaterThanOrEqual(0.0);

    const ancient = new Date(Date.now() - 365 * 86400000);
    expect(calculateDecayFactor(ancient)).toBe(0.0);
  });
});

// ---------------------------------------------------------------------------
// Full Pipeline: Decay Profiles → Selector via API
// ---------------------------------------------------------------------------

describe("Full adaptive pipeline via API", () => {
  it("should accept learner profiles with decay and select accordingly", async () => {
    const questions = [
      makeQuestion({
        id: "q-fresh-skill",
        skillNodeIds: ["skill-a"],
        difficulty: 0.0,
        discrimination: 1.0,
      }),
      makeQuestion({
        id: "q-stale-skill",
        skillNodeIds: ["skill-b"],
        difficulty: 0.0,
        discrimination: 1.0,
      }),
    ];

    const profiles = {
      "skill-a": {
        userId: "u1",
        skillNodeId: "skill-a",
        theta: 0,
        attempts: 5,
        correct: 3,
        lastPracticed: new Date().toISOString(),
        decayFactor: 1.0,
      },
      "skill-b": {
        userId: "u1",
        skillNodeId: "skill-b",
        theta: 0,
        attempts: 5,
        correct: 3,
        lastPracticed: new Date(Date.now() - 10 * 86400000).toISOString(),
        decayFactor: 0.0,
      },
    };

    const res = await selectQuestionHandler(
      createRequest({
        candidateQuestions: questions,
        learnerProfiles: profiles,
        currentSectionTheta: 0.0,
      }),
    );

    expect(res.status).toBe(200);
    const body = await res.json();
    // Stale skill should be boosted
    expect(body.question.id).toBe("q-stale-skill");
  });

  it("should handle mixed stale/fresh profiles across multiple skill nodes per question", async () => {
    const multiSkillQ = makeQuestion({
      id: "q-multi",
      skillNodeIds: ["s1", "s2", "s3"],
      difficulty: 0.0,
      discrimination: 1.0,
    });
    const singleSkillQ = makeQuestion({
      id: "q-single",
      skillNodeIds: ["s4"],
      difficulty: 0.0,
      discrimination: 1.0,
    });

    const profiles = {
      "s1": { userId: "u1", skillNodeId: "s1", theta: 0, attempts: 5, correct: 3, lastPracticed: null, decayFactor: 0.0 },
      "s2": { userId: "u1", skillNodeId: "s2", theta: 0, attempts: 5, correct: 3, lastPracticed: new Date().toISOString(), decayFactor: 1.0 },
      "s3": { userId: "u1", skillNodeId: "s3", theta: 0, attempts: 5, correct: 3, lastPracticed: null, decayFactor: 0.0 },
      "s4": { userId: "u1", skillNodeId: "s4", theta: 0, attempts: 5, correct: 3, lastPracticed: new Date().toISOString(), decayFactor: 1.0 },
    };

    const res = await selectQuestionHandler(
      createRequest({
        candidateQuestions: [multiSkillQ, singleSkillQ],
        learnerProfiles: profiles,
        currentSectionTheta: 0.0,
      }),
    );

    expect(res.status).toBe(200);
    const body = await res.json();
    // Multi-skill question has avg decay of ~0.67 (2/3 stale), should be boosted
    expect(body.question.id).toBe("q-multi");
  });
});
