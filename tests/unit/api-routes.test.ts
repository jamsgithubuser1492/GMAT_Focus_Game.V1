/**
 * Unit Tests: Next.js API Route Handlers
 *
 * Tests for all five API routes, calling the exported POST handler functions
 * directly with mock NextRequest objects. Covers valid requests, invalid JSON,
 * missing required fields, and edge cases.
 *
 * Routes under test:
 *   1. POST /api/tutor-engine/select-question
 *   2. POST /api/tutor-engine/submit-answer
 *   3. POST /api/tutor-engine/score
 *   4. POST /api/exam-session/create
 *   5. POST /api/exam-session/status
 */

import { describe, it, expect } from "vitest";
import { NextRequest } from "next/server";

import { POST as selectQuestionHandler } from "@/app/api/tutor-engine/select-question/route";
import { POST as submitAnswerHandler } from "@/app/api/tutor-engine/submit-answer/route";
import { POST as scoreHandler } from "@/app/api/tutor-engine/score/route";
import { POST as createSessionHandler } from "@/app/api/exam-session/create/route";
import { POST as sessionStatusHandler } from "@/app/api/exam-session/status/route";
import type { Question } from "@/lib/tutor-engine/types";

// ---------------------------------------------------------------------------
// Helper: create a mock NextRequest with a JSON body
// ---------------------------------------------------------------------------

function createRequest(body: unknown): NextRequest {
  return new NextRequest("http://localhost/api/test", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

function createInvalidJsonRequest(): NextRequest {
  return new NextRequest("http://localhost/api/test", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: "{ this is not valid json !!!",
  });
}

// ---------------------------------------------------------------------------
// Helper: build a minimal valid Question object
// ---------------------------------------------------------------------------

function makeQuestion(overrides: Partial<Question> = {}): Question {
  return {
    id: overrides.id ?? "q-001",
    section: overrides.section ?? "quantitative",
    questionType: overrides.questionType ?? "problem_solving",
    skillNodeIds: overrides.skillNodeIds ?? ["skill-algebra-1"],
    difficulty: overrides.difficulty ?? 0.0,
    discrimination: overrides.discrimination ?? 1.0,
    guessing: overrides.guessing ?? 0.2,
    content: overrides.content ?? "What is 2+2?",
    correctAnswer: overrides.correctAnswer ?? "A",
    explanation: overrides.explanation ?? "Basic addition.",
    estimatedTimeSeconds: overrides.estimatedTimeSeconds ?? 60,
  };
}

// ===========================================================================
// 1. POST /api/tutor-engine/select-question
// ===========================================================================

describe("POST /api/tutor-engine/select-question", () => {
  it("should return 200 with a selected question for a valid request", async () => {
    const body = {
      candidateQuestions: [
        makeQuestion({ id: "q-001", difficulty: 0.0, discrimination: 1.5 }),
        makeQuestion({ id: "q-002", difficulty: 1.0, discrimination: 1.0 }),
      ],
      learnerProfiles: {},
      currentSectionTheta: 0.0,
    };

    const res = await selectQuestionHandler(createRequest(body));
    expect(res.status).toBe(200);

    const json = await res.json();
    expect(json).toHaveProperty("question");
    expect(json.question).toHaveProperty("id");
    expect(["q-001", "q-002"]).toContain(json.question.id);
  });

  it("should return 204 when all candidate questions have been answered", async () => {
    const body = {
      candidateQuestions: [
        makeQuestion({ id: "q-001" }),
        makeQuestion({ id: "q-002" }),
      ],
      learnerProfiles: {},
      currentSectionTheta: 0.0,
      answeredQuestionIds: ["q-001", "q-002"],
    };

    const res = await selectQuestionHandler(createRequest(body));
    expect(res.status).toBe(204);
  });

  it("should return 204 when candidateQuestions is an empty array", async () => {
    const body = {
      candidateQuestions: [],
      learnerProfiles: {},
      currentSectionTheta: 0.0,
    };

    const res = await selectQuestionHandler(createRequest(body));
    expect(res.status).toBe(204);
  });

  it("should return 400 for invalid JSON body", async () => {
    const res = await selectQuestionHandler(createInvalidJsonRequest());
    expect(res.status).toBe(400);

    const json = await res.json();
    expect(json.error).toMatch(/invalid json/i);
  });

  it("should return 400 when candidateQuestions is not an array", async () => {
    const body = {
      candidateQuestions: "not-an-array",
      learnerProfiles: {},
      currentSectionTheta: 0.0,
    };

    const res = await selectQuestionHandler(createRequest(body));
    expect(res.status).toBe(400);

    const json = await res.json();
    expect(json.error).toMatch(/candidateQuestions/);
  });

  it("should return 400 when currentSectionTheta is missing", async () => {
    const body = {
      candidateQuestions: [makeQuestion()],
      learnerProfiles: {},
    };

    const res = await selectQuestionHandler(createRequest(body));
    expect(res.status).toBe(400);

    const json = await res.json();
    expect(json.error).toMatch(/currentSectionTheta/);
  });

  it("should correctly convert learnerProfiles object to Map and use decay weighting", async () => {
    const body = {
      candidateQuestions: [
        makeQuestion({ id: "q-fresh", skillNodeIds: ["skill-fresh"], difficulty: 0.0, discrimination: 1.0 }),
        makeQuestion({ id: "q-stale", skillNodeIds: ["skill-stale"], difficulty: 0.0, discrimination: 1.0 }),
      ],
      learnerProfiles: {
        "skill-fresh": {
          userId: "user-1",
          skillNodeId: "skill-fresh",
          theta: 0.0,
          attempts: 5,
          correct: 3,
          lastPracticed: new Date().toISOString(),
          decayFactor: 1.0, // fully fresh
        },
        "skill-stale": {
          userId: "user-1",
          skillNodeId: "skill-stale",
          theta: 0.0,
          attempts: 5,
          correct: 3,
          lastPracticed: null,
          decayFactor: 0.1, // heavily decayed
        },
      },
      currentSectionTheta: 0.0,
    };

    const res = await selectQuestionHandler(createRequest(body));
    expect(res.status).toBe(200);

    const json = await res.json();
    // The stale question should be selected due to decay boost
    expect(json.question.id).toBe("q-stale");
  });

  it("should exclude answered questions and return from the remaining pool", async () => {
    const body = {
      candidateQuestions: [
        makeQuestion({ id: "q-001", difficulty: 0.0, discrimination: 2.0 }),
        makeQuestion({ id: "q-002", difficulty: 0.5, discrimination: 1.0 }),
      ],
      learnerProfiles: {},
      currentSectionTheta: 0.0,
      answeredQuestionIds: ["q-001"],
    };

    const res = await selectQuestionHandler(createRequest(body));
    expect(res.status).toBe(200);

    const json = await res.json();
    expect(json.question.id).toBe("q-002");
  });
});

// ===========================================================================
// 2. POST /api/tutor-engine/submit-answer
// ===========================================================================

describe("POST /api/tutor-engine/submit-answer", () => {
  it("should return 200 with correct response when the answer is correct", async () => {
    const body = {
      currentTheta: 0.0,
      selectedAnswer: "A",
      correctAnswer: "A",
      item: { a: 1.0, b: 0.0, c: 0.2 },
    };

    const res = await submitAnswerHandler(createRequest(body));
    expect(res.status).toBe(200);

    const json = await res.json();
    expect(json.isCorrect).toBe(true);
    expect(json.thetaBefore).toBe(0.0);
    expect(json.thetaAfter).toBeGreaterThan(0.0);
    expect(json.probability).toBeGreaterThan(0);
    expect(json.probability).toBeLessThanOrEqual(1);
  });

  it("should return 200 with incorrect response and lower theta", async () => {
    const body = {
      currentTheta: 0.0,
      selectedAnswer: "B",
      correctAnswer: "A",
      item: { a: 1.0, b: 0.0, c: 0.2 },
    };

    const res = await submitAnswerHandler(createRequest(body));
    expect(res.status).toBe(200);

    const json = await res.json();
    expect(json.isCorrect).toBe(false);
    expect(json.thetaBefore).toBe(0.0);
    expect(json.thetaAfter).toBeLessThan(0.0);
  });

  it("should return 400 for invalid JSON body", async () => {
    const res = await submitAnswerHandler(createInvalidJsonRequest());
    expect(res.status).toBe(400);

    const json = await res.json();
    expect(json.error).toMatch(/invalid json/i);
  });

  it("should return 400 when currentTheta is not a number", async () => {
    const body = {
      currentTheta: "not-a-number",
      selectedAnswer: "A",
      correctAnswer: "A",
      item: { a: 1.0, b: 0.0, c: 0.2 },
    };

    const res = await submitAnswerHandler(createRequest(body));
    expect(res.status).toBe(400);

    const json = await res.json();
    expect(json.error).toMatch(/Missing required fields/);
  });

  it("should return 400 when item parameters are missing", async () => {
    const body = {
      currentTheta: 0.0,
      selectedAnswer: "A",
      correctAnswer: "A",
      item: { a: 1.0 }, // missing b and c
    };

    const res = await submitAnswerHandler(createRequest(body));
    expect(res.status).toBe(400);

    const json = await res.json();
    expect(json.error).toMatch(/item/);
  });

  it("should return 400 when item is null", async () => {
    const body = {
      currentTheta: 0.0,
      selectedAnswer: "A",
      correctAnswer: "A",
      item: null,
    };

    const res = await submitAnswerHandler(createRequest(body));
    expect(res.status).toBe(400);
  });

  it("should return 400 when selectedAnswer is missing", async () => {
    const body = {
      currentTheta: 0.0,
      correctAnswer: "A",
      item: { a: 1.0, b: 0.0, c: 0.2 },
    };

    const res = await submitAnswerHandler(createRequest(body));
    expect(res.status).toBe(400);
  });

  it("should compute probability consistent with the 3PL model", async () => {
    // theta = 0, b = 0, a = 1, c = 0.2 => P = 0.2 + 0.8/2 = 0.6
    const body = {
      currentTheta: 0.0,
      selectedAnswer: "A",
      correctAnswer: "A",
      item: { a: 1.0, b: 0.0, c: 0.2 },
    };

    const res = await submitAnswerHandler(createRequest(body));
    const json = await res.json();

    expect(json.probability).toBeCloseTo(0.6, 2);
  });
});

// ===========================================================================
// 3. POST /api/tutor-engine/score
// ===========================================================================

describe("POST /api/tutor-engine/score", () => {
  it("should return 200 with sections, totalScore, and percentile for valid thetas", async () => {
    const body = {
      quantTheta: 0.0,
      verbalTheta: 0.0,
      diTheta: 0.0,
    };

    const res = await scoreHandler(createRequest(body));
    expect(res.status).toBe(200);

    const json = await res.json();
    expect(json).toHaveProperty("sections");
    expect(json).toHaveProperty("totalScore");
    expect(json).toHaveProperty("percentile");
    expect(json.sections).toHaveLength(3);

    // theta=0 => sectionScore = 75 for each; sectionSum = 225
    // totalScore = 205 + (225-180)*600/90 = 205 + 300 = 505
    expect(json.totalScore).toBe(505);
  });

  it("should return section scores within the 60-90 range", async () => {
    const body = {
      quantTheta: 2.5,
      verbalTheta: -2.5,
      diTheta: 0.0,
    };

    const res = await scoreHandler(createRequest(body));
    const json = await res.json();

    for (const section of json.sections) {
      expect(section.sectionScore).toBeGreaterThanOrEqual(60);
      expect(section.sectionScore).toBeLessThanOrEqual(90);
    }
  });

  it("should return total score ending in 5", async () => {
    const body = {
      quantTheta: 1.3,
      verbalTheta: -0.7,
      diTheta: 0.5,
    };

    const res = await scoreHandler(createRequest(body));
    const json = await res.json();

    expect(json.totalScore % 10).toBe(5);
  });

  it("should clamp total score to [205, 805]", async () => {
    // All max thetas => highest possible score
    const maxBody = { quantTheta: 3.0, verbalTheta: 3.0, diTheta: 3.0 };
    const maxRes = await scoreHandler(createRequest(maxBody));
    const maxJson = await maxRes.json();
    expect(maxJson.totalScore).toBeLessThanOrEqual(805);

    // All min thetas => lowest possible score
    const minBody = { quantTheta: -3.0, verbalTheta: -3.0, diTheta: -3.0 };
    const minRes = await scoreHandler(createRequest(minBody));
    const minJson = await minRes.json();
    expect(minJson.totalScore).toBeGreaterThanOrEqual(205);
  });

  it("should return 400 for invalid JSON body", async () => {
    const res = await scoreHandler(createInvalidJsonRequest());
    expect(res.status).toBe(400);

    const json = await res.json();
    expect(json.error).toMatch(/invalid json/i);
  });

  it("should return 400 when a theta field is missing", async () => {
    const body = {
      quantTheta: 0.0,
      verbalTheta: 0.0,
      // diTheta missing
    };

    const res = await scoreHandler(createRequest(body));
    expect(res.status).toBe(400);

    const json = await res.json();
    expect(json.error).toMatch(/diTheta/);
  });

  it("should return 400 when a theta field is a string instead of number", async () => {
    const body = {
      quantTheta: "high",
      verbalTheta: 0.0,
      diTheta: 0.0,
    };

    const res = await scoreHandler(createRequest(body));
    expect(res.status).toBe(400);
  });

  it("should return a percentile value between 0 and 100", async () => {
    const body = { quantTheta: 0.0, verbalTheta: 0.0, diTheta: 0.0 };

    const res = await scoreHandler(createRequest(body));
    const json = await res.json();

    expect(json.percentile).toBeGreaterThanOrEqual(0);
    expect(json.percentile).toBeLessThanOrEqual(100);
  });
});

// ===========================================================================
// 4. POST /api/exam-session/create
// ===========================================================================

describe("POST /api/exam-session/create", () => {
  it("should return 201 with full_exam session config containing 3 sections", async () => {
    const body = {
      userId: "user-123",
      sessionType: "full_exam",
    };

    const res = await createSessionHandler(createRequest(body));
    expect(res.status).toBe(201);

    const json = await res.json();
    expect(json).toHaveProperty("sessionId");
    expect(json.userId).toBe("user-123");
    expect(json.sessionType).toBe("full_exam");
    expect(json).toHaveProperty("startedAt");
    expect(json.sectionsConfig).toHaveLength(3);

    const sectionNames = json.sectionsConfig.map((s: { section: string }) => s.section);
    expect(sectionNames).toContain("quantitative");
    expect(sectionNames).toContain("verbal");
    expect(sectionNames).toContain("data_insights");
  });

  it("should return 201 with drill config: 10 questions and 15 minutes", async () => {
    const body = {
      userId: "user-456",
      sessionType: "drill",
      section: "quantitative",
    };

    const res = await createSessionHandler(createRequest(body));
    expect(res.status).toBe(201);

    const json = await res.json();
    expect(json.sessionType).toBe("drill");
    expect(json.sectionsConfig).toHaveLength(1);
    expect(json.sectionsConfig[0].section).toBe("quantitative");
    expect(json.sectionsConfig[0].questionsCount).toBe(10);
    expect(json.sectionsConfig[0].timeMinutes).toBe(15);
  });

  it("should return 201 with section_practice config using standard question count", async () => {
    const body = {
      userId: "user-789",
      sessionType: "section_practice",
      section: "verbal",
    };

    const res = await createSessionHandler(createRequest(body));
    expect(res.status).toBe(201);

    const json = await res.json();
    expect(json.sessionType).toBe("section_practice");
    expect(json.sectionsConfig).toHaveLength(1);
    expect(json.sectionsConfig[0].section).toBe("verbal");
    // verbal has 23 questions per section
    expect(json.sectionsConfig[0].questionsCount).toBe(23);
    expect(json.sectionsConfig[0].timeMinutes).toBe(45);
  });

  it("should return 201 and respect custom sectionOrder for full_exam", async () => {
    const body = {
      userId: "user-order",
      sessionType: "full_exam",
      sectionOrder: "verbal,data_insights,quantitative",
    };

    const res = await createSessionHandler(createRequest(body));
    expect(res.status).toBe(201);

    const json = await res.json();
    expect(json.sectionsConfig[0].section).toBe("verbal");
    expect(json.sectionsConfig[1].section).toBe("data_insights");
    expect(json.sectionsConfig[2].section).toBe("quantitative");
  });

  it("should return 400 for invalid JSON body", async () => {
    const res = await createSessionHandler(createInvalidJsonRequest());
    expect(res.status).toBe(400);

    const json = await res.json();
    expect(json.error).toMatch(/invalid json/i);
  });

  it("should return 400 when userId is missing", async () => {
    const body = {
      sessionType: "full_exam",
    };

    const res = await createSessionHandler(createRequest(body));
    expect(res.status).toBe(400);

    const json = await res.json();
    expect(json.error).toMatch(/userId/);
  });

  it("should return 400 when userId is empty string", async () => {
    const body = {
      userId: "",
      sessionType: "full_exam",
    };

    const res = await createSessionHandler(createRequest(body));
    expect(res.status).toBe(400);

    const json = await res.json();
    expect(json.error).toMatch(/userId/);
  });

  it("should return 400 when sessionType is invalid", async () => {
    const body = {
      userId: "user-123",
      sessionType: "invalid_type",
    };

    const res = await createSessionHandler(createRequest(body));
    expect(res.status).toBe(400);

    const json = await res.json();
    expect(json.error).toMatch(/sessionType/i);
  });

  it("should return 400 when section is missing for drill sessions", async () => {
    const body = {
      userId: "user-123",
      sessionType: "drill",
    };

    const res = await createSessionHandler(createRequest(body));
    expect(res.status).toBe(400);

    const json = await res.json();
    expect(json.error).toMatch(/section.*required/i);
  });

  it("should return 400 when section is missing for section_practice sessions", async () => {
    const body = {
      userId: "user-123",
      sessionType: "section_practice",
    };

    const res = await createSessionHandler(createRequest(body));
    expect(res.status).toBe(400);

    const json = await res.json();
    expect(json.error).toMatch(/section.*required/i);
  });

  it("should set startingTheta to 0.0 for all section configs", async () => {
    const body = {
      userId: "user-theta",
      sessionType: "full_exam",
    };

    const res = await createSessionHandler(createRequest(body));
    const json = await res.json();

    for (const config of json.sectionsConfig) {
      expect(config.startingTheta).toBe(0.0);
    }
  });

  it("should include editsAllowed = 3 matching GMAT Focus MAX_EDITS_PER_SECTION", async () => {
    const body = {
      userId: "user-edits",
      sessionType: "full_exam",
    };

    const res = await createSessionHandler(createRequest(body));
    const json = await res.json();

    for (const config of json.sectionsConfig) {
      expect(config.editsAllowed).toBe(3);
    }
  });

  it("should generate a valid UUID for sessionId", async () => {
    const body = {
      userId: "user-uuid-check",
      sessionType: "full_exam",
    };

    const res = await createSessionHandler(createRequest(body));
    const json = await res.json();

    // UUID v4 pattern: 8-4-4-4-12 hex characters
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    expect(json.sessionId).toMatch(uuidRegex);
  });
});

// ===========================================================================
// 5. POST /api/exam-session/status
// ===========================================================================

describe("POST /api/exam-session/status", () => {
  it("should return 200 with session status for valid attempts", async () => {
    const body = {
      attempts: [
        {
          section: "quantitative",
          isCorrect: true,
          item: { a: 1.0, b: 0.0, c: 0.2 },
        },
        {
          section: "quantitative",
          isCorrect: false,
          item: { a: 1.0, b: 0.5, c: 0.2 },
        },
        {
          section: "verbal",
          isCorrect: true,
          item: { a: 1.2, b: -0.5, c: 0.2 },
        },
      ],
      sessionType: "full_exam",
    };

    const res = await sessionStatusHandler(createRequest(body));
    expect(res.status).toBe(200);

    const json = await res.json();
    expect(json).toHaveProperty("sessionType", "full_exam");
    expect(json).toHaveProperty("sectionProgress");
    expect(json).toHaveProperty("projectedScore");
    expect(json).toHaveProperty("sections");
    expect(json).toHaveProperty("percentile");
    expect(json).toHaveProperty("totalAttempts", 3);
    expect(json.sectionProgress).toHaveLength(3);
  });

  it("should compute correct attempt counts per section", async () => {
    const body = {
      attempts: [
        { section: "quantitative", isCorrect: true, item: { a: 1.0, b: 0.0, c: 0.2 } },
        { section: "quantitative", isCorrect: true, item: { a: 1.0, b: 0.5, c: 0.2 } },
        { section: "verbal", isCorrect: false, item: { a: 1.0, b: 0.0, c: 0.2 } },
        { section: "data_insights", isCorrect: true, item: { a: 1.0, b: 0.0, c: 0.2 } },
        { section: "data_insights", isCorrect: true, item: { a: 1.0, b: 0.0, c: 0.2 } },
        { section: "data_insights", isCorrect: false, item: { a: 1.0, b: 0.0, c: 0.2 } },
      ],
      sessionType: "full_exam",
    };

    const res = await sessionStatusHandler(createRequest(body));
    const json = await res.json();

    const quantProgress = json.sectionProgress.find((s: { section: string }) => s.section === "quantitative");
    const verbalProgress = json.sectionProgress.find((s: { section: string }) => s.section === "verbal");
    const diProgress = json.sectionProgress.find((s: { section: string }) => s.section === "data_insights");

    expect(quantProgress.answered).toBe(2);
    expect(quantProgress.total).toBe(21);
    expect(verbalProgress.answered).toBe(1);
    expect(verbalProgress.total).toBe(23);
    expect(diProgress.answered).toBe(3);
    expect(diProgress.total).toBe(20);
    expect(json.totalAttempts).toBe(6);
  });

  it("should return baseline scores when attempts is an empty array", async () => {
    const body = {
      attempts: [],
      sessionType: "drill",
    };

    const res = await sessionStatusHandler(createRequest(body));
    expect(res.status).toBe(200);

    const json = await res.json();
    expect(json.totalAttempts).toBe(0);

    // With no attempts, all thetas remain 0.0 => sectionScore = 75 each
    // totalScore = 205 + (225 - 180) * 600 / 90 = 505
    expect(json.projectedScore).toBe(505);

    for (const sp of json.sectionProgress) {
      expect(sp.theta).toBe(0.0);
      expect(sp.answered).toBe(0);
    }
  });

  it("should return 400 for invalid JSON body", async () => {
    const res = await sessionStatusHandler(createInvalidJsonRequest());
    expect(res.status).toBe(400);

    const json = await res.json();
    expect(json.error).toMatch(/invalid json/i);
  });

  it("should return 400 when attempts is not an array", async () => {
    const body = {
      attempts: "not-an-array",
      sessionType: "full_exam",
    };

    const res = await sessionStatusHandler(createRequest(body));
    expect(res.status).toBe(400);

    const json = await res.json();
    expect(json.error).toMatch(/attempts/i);
  });

  it("should reflect the sessionType provided in the request", async () => {
    const body = {
      attempts: [],
      sessionType: "section_practice",
    };

    const res = await sessionStatusHandler(createRequest(body));
    const json = await res.json();

    expect(json.sessionType).toBe("section_practice");
  });

  it("should update theta upward when all answers for a section are correct", async () => {
    const body = {
      attempts: [
        { section: "quantitative", isCorrect: true, item: { a: 1.5, b: 0.0, c: 0.2 } },
        { section: "quantitative", isCorrect: true, item: { a: 1.5, b: 0.5, c: 0.2 } },
        { section: "quantitative", isCorrect: true, item: { a: 1.5, b: 1.0, c: 0.2 } },
      ],
      sessionType: "full_exam",
    };

    const res = await sessionStatusHandler(createRequest(body));
    const json = await res.json();

    const quantProgress = json.sectionProgress.find((s: { section: string }) => s.section === "quantitative");
    expect(quantProgress.theta).toBeGreaterThan(0.0);
  });

  it("should compute progress as answered/total for each section", async () => {
    const body = {
      attempts: [
        { section: "verbal", isCorrect: true, item: { a: 1.0, b: 0.0, c: 0.2 } },
        { section: "verbal", isCorrect: true, item: { a: 1.0, b: 0.0, c: 0.2 } },
      ],
      sessionType: "full_exam",
    };

    const res = await sessionStatusHandler(createRequest(body));
    const json = await res.json();

    const verbalProgress = json.sectionProgress.find((s: { section: string }) => s.section === "verbal");
    // 2 answered out of 23 total => progress = 2/23
    expect(verbalProgress.progress).toBeCloseTo(2 / 23, 5);
  });

  it("should return projected score ending in 5 (GMAT Focus format)", async () => {
    const body = {
      attempts: [
        { section: "quantitative", isCorrect: true, item: { a: 1.0, b: 0.0, c: 0.2 } },
        { section: "verbal", isCorrect: false, item: { a: 1.0, b: 0.0, c: 0.2 } },
        { section: "data_insights", isCorrect: true, item: { a: 1.0, b: 0.0, c: 0.2 } },
      ],
      sessionType: "full_exam",
    };

    const res = await sessionStatusHandler(createRequest(body));
    const json = await res.json();

    expect(json.projectedScore % 10).toBe(5);
  });

  it("should return percentile between 0 and 100", async () => {
    const body = {
      attempts: [
        { section: "quantitative", isCorrect: true, item: { a: 1.0, b: 0.0, c: 0.2 } },
      ],
      sessionType: "drill",
    };

    const res = await sessionStatusHandler(createRequest(body));
    const json = await res.json();

    expect(json.percentile).toBeGreaterThanOrEqual(0);
    expect(json.percentile).toBeLessThanOrEqual(100);
  });
});
