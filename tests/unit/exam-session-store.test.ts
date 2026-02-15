/**
 * Unit Tests: Zustand Exam Session Store
 *
 * Tests for all actions and state transitions in useExamSessionStore:
 *   - startSession, setCurrentQuestion, selectAnswer, submitAnswer,
 *     nextQuestion, advanceSection, tickTimer, toggleExplanation,
 *     useEdit, completeSession, reset
 *
 * Uses direct store access (getState/setState) — no React rendering needed.
 */

import { describe, it, expect, beforeEach, vi } from "vitest";
import { useExamSessionStore } from "@/stores/exam-session-store";
import type { SectionConfig, AttemptRecord } from "@/stores/exam-session-store";
import type { Question, IRTParameters, GmatSection } from "@/lib/tutor-engine/types";
import { GMAT_FOCUS } from "@/lib/tutor-engine/types";

// ---------------------------------------------------------------------------
// Helpers: factory functions
// ---------------------------------------------------------------------------

function makeSectionConfig(overrides: Partial<SectionConfig> = {}): SectionConfig {
  return {
    section: "quantitative",
    questionsCount: 21,
    timeMinutes: 45,
    editsAllowed: 3,
    startingTheta: 0,
    ...overrides,
  };
}

function makeQuestion(overrides: Partial<Question> = {}): Question {
  return {
    id: "q-001",
    section: "quantitative",
    questionType: "problem_solving",
    skillNodeIds: ["skill-1"],
    difficulty: 0.5,
    discrimination: 1.2,
    guessing: 0.2,
    content: '{"stem":"What is 2+2?","choices":["3","4","5","6","7"]}',
    correctAnswer: "B",
    explanation: "2+2 = 4, which is choice B.",
    estimatedTimeSeconds: 120,
    ...overrides,
  };
}

function makeIRTParams(overrides: Partial<IRTParameters> = {}): IRTParameters {
  return { a: 1.2, b: 0.5, c: 0.2, ...overrides };
}

/** Shorthand to get state */
const state = () => useExamSessionStore.getState();
/** Shorthand to call an action */
const act = () => useExamSessionStore.getState();

/** Standard two-section setup used by many tests */
function setupTwoSectionSession() {
  const sections: SectionConfig[] = [
    makeSectionConfig({ section: "quantitative", timeMinutes: 45, startingTheta: 0.5 }),
    makeSectionConfig({ section: "verbal", timeMinutes: 36, startingTheta: -0.2, editsAllowed: 2 }),
  ];
  act().startSession("session-abc", "user-42", "full_exam", sections);
  return sections;
}

// ---------------------------------------------------------------------------
// Reset store before each test to prevent cross-contamination
// ---------------------------------------------------------------------------

beforeEach(() => {
  useExamSessionStore.getState().reset();
});

// ===========================================================================
// startSession
// ===========================================================================

describe("startSession", () => {
  it("should set session metadata (sessionId, userId, sessionType)", () => {
    const sections = [makeSectionConfig()];
    act().startSession("sess-1", "user-1", "drill", sections);

    expect(state().sessionId).toBe("sess-1");
    expect(state().userId).toBe("user-1");
    expect(state().sessionType).toBe("drill");
  });

  it("should set startedAt to a valid ISO timestamp", () => {
    const before = new Date().toISOString();
    act().startSession("sess-1", "user-1", "full_exam", [makeSectionConfig()]);
    const after = new Date().toISOString();

    expect(state().startedAt).not.toBeNull();
    expect(state().startedAt! >= before).toBe(true);
    expect(state().startedAt! <= after).toBe(true);
  });

  it("should initialize remainingTimeMs from first section's timeMinutes", () => {
    const sections = [makeSectionConfig({ timeMinutes: 45 })];
    act().startSession("sess-1", "user-1", "full_exam", sections);

    expect(state().remainingTimeMs).toBe(45 * 60 * 1000);
  });

  it("should initialize remainingTimeMs to 0 when sections array is empty", () => {
    act().startSession("sess-1", "user-1", "drill", []);

    expect(state().remainingTimeMs).toBe(0);
  });

  it("should store sections and set currentSectionIndex to 0", () => {
    const sections = [
      makeSectionConfig({ section: "quantitative" }),
      makeSectionConfig({ section: "verbal" }),
    ];
    act().startSession("sess-1", "user-1", "full_exam", sections);

    expect(state().sections).toHaveLength(2);
    expect(state().currentSectionIndex).toBe(0);
  });

  it("should initialize sectionThetas from each section config's startingTheta", () => {
    const sections = [
      makeSectionConfig({ section: "quantitative", startingTheta: 0.5 }),
      makeSectionConfig({ section: "verbal", startingTheta: -0.3 }),
      makeSectionConfig({ section: "data_insights", startingTheta: 1.0 }),
    ];
    act().startSession("sess-1", "user-1", "full_exam", sections);

    expect(state().sectionThetas.quantitative).toBe(0.5);
    expect(state().sectionThetas.verbal).toBe(-0.3);
    expect(state().sectionThetas.data_insights).toBe(1.0);
  });

  it("should default sectionThetas to 0 for sections not in the config", () => {
    const sections = [makeSectionConfig({ section: "quantitative", startingTheta: 1.5 })];
    act().startSession("sess-1", "user-1", "drill", sections);

    expect(state().sectionThetas.quantitative).toBe(1.5);
    expect(state().sectionThetas.verbal).toBe(0);
    expect(state().sectionThetas.data_insights).toBe(0);
  });

  it("should reset transient state (attempts, currentQuestion, etc.)", () => {
    // Pollute the store first
    useExamSessionStore.setState({
      attempts: [{ questionId: "old", section: "verbal", selectedAnswer: "A", isCorrect: true, timeSpent: 100, item: makeIRTParams() }],
      currentQuestion: makeQuestion(),
      selectedAnswer: "C",
      isComplete: true,
      showExplanation: true,
      editsUsed: 2,
    });

    act().startSession("sess-new", "user-1", "section_practice", [makeSectionConfig()]);

    expect(state().attempts).toHaveLength(0);
    expect(state().currentQuestion).toBeNull();
    expect(state().selectedAnswer).toBeNull();
    expect(state().isComplete).toBe(false);
    expect(state().showExplanation).toBe(false);
    expect(state().editsUsed).toBe(0);
    expect(state().isTimerRunning).toBe(false);
    expect(state().isLoading).toBe(false);
    expect(state().questionStartTime).toBeNull();
  });
});

// ===========================================================================
// setCurrentQuestion
// ===========================================================================

describe("setCurrentQuestion", () => {
  it("should set the currentQuestion", () => {
    const q = makeQuestion({ id: "q-100" });
    act().setCurrentQuestion(q);

    expect(state().currentQuestion).toEqual(q);
  });

  it("should record questionStartTime as a recent timestamp", () => {
    const before = Date.now();
    act().setCurrentQuestion(makeQuestion());
    const after = Date.now();

    expect(state().questionStartTime).toBeGreaterThanOrEqual(before);
    expect(state().questionStartTime).toBeLessThanOrEqual(after);
  });

  it("should start the timer (isTimerRunning = true)", () => {
    act().setCurrentQuestion(makeQuestion());

    expect(state().isTimerRunning).toBe(true);
  });

  it("should clear selectedAnswer, showExplanation, and isLoading", () => {
    useExamSessionStore.setState({
      selectedAnswer: "D",
      showExplanation: true,
      isLoading: true,
    });

    act().setCurrentQuestion(makeQuestion());

    expect(state().selectedAnswer).toBeNull();
    expect(state().showExplanation).toBe(false);
    expect(state().isLoading).toBe(false);
  });
});

// ===========================================================================
// selectAnswer
// ===========================================================================

describe("selectAnswer", () => {
  it("should store the selected answer string", () => {
    act().selectAnswer("C");

    expect(state().selectedAnswer).toBe("C");
  });

  it("should overwrite a previously selected answer", () => {
    act().selectAnswer("A");
    act().selectAnswer("D");

    expect(state().selectedAnswer).toBe("D");
  });
});

// ===========================================================================
// submitAnswer
// ===========================================================================

describe("submitAnswer", () => {
  it("should no-op if selectedAnswer is null", () => {
    setupTwoSectionSession();
    act().setCurrentQuestion(makeQuestion());
    // Do NOT call selectAnswer

    const attemptsBefore = state().attempts.length;
    act().submitAnswer("B", makeIRTParams());

    expect(state().attempts.length).toBe(attemptsBefore);
  });

  it("should no-op if currentQuestion is null", () => {
    setupTwoSectionSession();
    act().selectAnswer("B");
    // Do NOT call setCurrentQuestion

    const attemptsBefore = state().attempts.length;
    act().submitAnswer("B", makeIRTParams());

    expect(state().attempts.length).toBe(attemptsBefore);
  });

  it("should mark isCorrect=true when selectedAnswer matches correctAnswer", () => {
    setupTwoSectionSession();
    act().setCurrentQuestion(makeQuestion({ id: "q-50", section: "quantitative" }));
    act().selectAnswer("B");
    act().submitAnswer("B", makeIRTParams());

    const last = state().attempts[state().attempts.length - 1]!;
    expect(last.isCorrect).toBe(true);
  });

  it("should mark isCorrect=false when selectedAnswer differs from correctAnswer", () => {
    setupTwoSectionSession();
    act().setCurrentQuestion(makeQuestion({ id: "q-51", section: "quantitative" }));
    act().selectAnswer("A");
    act().submitAnswer("B", makeIRTParams());

    const last = state().attempts[state().attempts.length - 1]!;
    expect(last.isCorrect).toBe(false);
  });

  it("should push an AttemptRecord with the correct fields", () => {
    setupTwoSectionSession();
    const q = makeQuestion({ id: "q-99", section: "quantitative" });
    const item = makeIRTParams({ a: 1.5, b: 0.8, c: 0.25 });
    act().setCurrentQuestion(q);
    act().selectAnswer("C");
    act().submitAnswer("B", item);

    expect(state().attempts).toHaveLength(1);
    const attempt = state().attempts[0]!;
    expect(attempt.questionId).toBe("q-99");
    expect(attempt.section).toBe("quantitative");
    expect(attempt.selectedAnswer).toBe("C");
    expect(attempt.isCorrect).toBe(false);
    expect(attempt.timeSpent).toBeGreaterThanOrEqual(0);
    expect(attempt.item).toEqual(item);
  });

  it("should compute timeSpent from questionStartTime to now", () => {
    setupTwoSectionSession();
    const fakeStart = Date.now() - 5000; // 5 seconds ago
    act().setCurrentQuestion(makeQuestion());
    useExamSessionStore.setState({ questionStartTime: fakeStart });
    act().selectAnswer("B");
    act().submitAnswer("B", makeIRTParams());

    const attempt = state().attempts[0]!;
    // timeSpent should be approximately 5000ms (with some tolerance for execution time)
    expect(attempt.timeSpent).toBeGreaterThanOrEqual(4900);
    expect(attempt.timeSpent).toBeLessThanOrEqual(6000);
  });

  it("should stop the timer and show explanation after submission", () => {
    setupTwoSectionSession();
    act().setCurrentQuestion(makeQuestion());
    act().selectAnswer("B");
    act().submitAnswer("B", makeIRTParams());

    expect(state().isTimerRunning).toBe(false);
    expect(state().showExplanation).toBe(true);
  });

  // -------------------------------------------------------------------------
  // IRT 3PL theta update
  // -------------------------------------------------------------------------

  it("should increase theta for the question's section on a correct answer", () => {
    setupTwoSectionSession();
    const thetaBefore = state().sectionThetas.quantitative;
    act().setCurrentQuestion(makeQuestion({ section: "quantitative" }));
    act().selectAnswer("B");
    act().submitAnswer("B", makeIRTParams({ a: 1.0, b: 0.5, c: 0.2 }));

    expect(state().sectionThetas.quantitative).toBeGreaterThan(thetaBefore);
  });

  it("should decrease theta for the question's section on an incorrect answer", () => {
    setupTwoSectionSession();
    const thetaBefore = state().sectionThetas.quantitative;
    act().setCurrentQuestion(makeQuestion({ section: "quantitative" }));
    act().selectAnswer("A");
    act().submitAnswer("B", makeIRTParams({ a: 1.0, b: 0.5, c: 0.2 }));

    expect(state().sectionThetas.quantitative).toBeLessThan(thetaBefore);
  });

  it("should compute theta using exact IRT 3PL gradient formula", () => {
    // Set theta to a known value so we can compute expected result manually
    const sections = [
      makeSectionConfig({ section: "quantitative", startingTheta: 0.0 }),
    ];
    act().startSession("s", "u", "drill", sections);
    act().setCurrentQuestion(makeQuestion({ section: "quantitative" }));
    act().selectAnswer("B");

    const item: IRTParameters = { a: 1.0, b: 0.0, c: 0.2 };
    // theta=0, a=1, b=0, c=0.2
    // p = 0.2 + 0.8 / (1 + exp(0)) = 0.2 + 0.8/2 = 0.6
    // correct: theta += 1.0 * (1 - 0.6) = 0.4
    // newTheta = 0.0 + 0.4 = 0.4
    act().submitAnswer("B", item);

    expect(state().sectionThetas.quantitative).toBeCloseTo(0.4, 3);
  });

  it("should compute theta correctly for an incorrect answer using IRT 3PL", () => {
    const sections = [
      makeSectionConfig({ section: "quantitative", startingTheta: 0.0 }),
    ];
    act().startSession("s", "u", "drill", sections);
    act().setCurrentQuestion(makeQuestion({ section: "quantitative" }));
    act().selectAnswer("A");

    const item: IRTParameters = { a: 1.0, b: 0.0, c: 0.2 };
    // theta=0, a=1, b=0, c=0.2
    // p = 0.6
    // incorrect: theta += 1.0 * (-0.6) = -0.6
    // newTheta = 0.0 - 0.6 = -0.6
    act().submitAnswer("B", item);

    expect(state().sectionThetas.quantitative).toBeCloseTo(-0.6, 3);
  });

  it("should clamp theta to THETA_MAX (3.0) on upward overflow", () => {
    const sections = [
      makeSectionConfig({ section: "quantitative", startingTheta: 2.9 }),
    ];
    act().startSession("s", "u", "drill", sections);
    act().setCurrentQuestion(makeQuestion({ section: "quantitative" }));
    act().selectAnswer("B");

    // Use b > theta so that a correct answer produces a large positive delta
    // theta=2.9, b=5.0, a=3.0, c=0.0 => p is small => (1-p) is large => delta = a*(1-p) >> 0.1
    const item: IRTParameters = { a: 3.0, b: 5.0, c: 0.0 };
    act().submitAnswer("B", item);

    expect(state().sectionThetas.quantitative).toBeLessThanOrEqual(GMAT_FOCUS.THETA_MAX);
    expect(state().sectionThetas.quantitative).toBe(GMAT_FOCUS.THETA_MAX);
  });

  it("should clamp theta to THETA_MIN (-3.0) on downward overflow", () => {
    const sections = [
      makeSectionConfig({ section: "quantitative", startingTheta: -2.9 }),
    ];
    act().startSession("s", "u", "drill", sections);
    act().setCurrentQuestion(makeQuestion({ section: "quantitative" }));
    act().selectAnswer("A");

    // Use b << theta so that an incorrect answer produces a large negative delta
    // theta=-2.9, b=-6.0, a=3.0, c=0.0 => p is close to 1 => delta = a*(-p) ≈ -3.0
    const item: IRTParameters = { a: 3.0, b: -6.0, c: 0.0 };
    act().submitAnswer("B", item);

    expect(state().sectionThetas.quantitative).toBeGreaterThanOrEqual(GMAT_FOCUS.THETA_MIN);
    expect(state().sectionThetas.quantitative).toBe(GMAT_FOCUS.THETA_MIN);
  });

  it("should only update the theta of the question's section, leaving others unchanged", () => {
    const sections = [
      makeSectionConfig({ section: "quantitative", startingTheta: 0.5 }),
      makeSectionConfig({ section: "verbal", startingTheta: -0.2 }),
      makeSectionConfig({ section: "data_insights", startingTheta: 1.0 }),
    ];
    act().startSession("s", "u", "full_exam", sections);
    act().setCurrentQuestion(makeQuestion({ section: "quantitative" }));
    act().selectAnswer("B");
    act().submitAnswer("B", makeIRTParams());

    expect(state().sectionThetas.verbal).toBe(-0.2);
    expect(state().sectionThetas.data_insights).toBe(1.0);
  });

  it("should accumulate multiple attempts", () => {
    setupTwoSectionSession();

    // First answer
    act().setCurrentQuestion(makeQuestion({ id: "q-1", section: "quantitative" }));
    act().selectAnswer("B");
    act().submitAnswer("B", makeIRTParams());

    // Second answer
    act().setCurrentQuestion(makeQuestion({ id: "q-2", section: "quantitative" }));
    act().selectAnswer("A");
    act().submitAnswer("C", makeIRTParams());

    expect(state().attempts).toHaveLength(2);
    expect(state().attempts[0]!.questionId).toBe("q-1");
    expect(state().attempts[1]!.questionId).toBe("q-2");
  });
});

// ===========================================================================
// nextQuestion
// ===========================================================================

describe("nextQuestion", () => {
  it("should clear currentQuestion, selectedAnswer, questionStartTime, showExplanation", () => {
    act().setCurrentQuestion(makeQuestion());
    act().selectAnswer("B");
    useExamSessionStore.setState({ showExplanation: true });

    act().nextQuestion();

    expect(state().currentQuestion).toBeNull();
    expect(state().selectedAnswer).toBeNull();
    expect(state().questionStartTime).toBeNull();
    expect(state().showExplanation).toBe(false);
  });

  it("should set isLoading to true", () => {
    act().nextQuestion();

    expect(state().isLoading).toBe(true);
  });
});

// ===========================================================================
// advanceSection
// ===========================================================================

describe("advanceSection", () => {
  it("should increment currentSectionIndex by 1", () => {
    setupTwoSectionSession();

    act().advanceSection();

    expect(state().currentSectionIndex).toBe(1);
  });

  it("should reset remainingTimeMs to the next section's timeMinutes * 60 * 1000", () => {
    setupTwoSectionSession();

    act().advanceSection();

    expect(state().remainingTimeMs).toBe(36 * 60 * 1000);
  });

  it("should reset editsUsed to 0", () => {
    setupTwoSectionSession();
    useExamSessionStore.setState({ editsUsed: 3 });

    act().advanceSection();

    expect(state().editsUsed).toBe(0);
  });

  it("should clear transient question state", () => {
    setupTwoSectionSession();
    act().setCurrentQuestion(makeQuestion());
    act().selectAnswer("A");

    act().advanceSection();

    expect(state().currentQuestion).toBeNull();
    expect(state().selectedAnswer).toBeNull();
    expect(state().questionStartTime).toBeNull();
    expect(state().showExplanation).toBe(false);
    expect(state().isTimerRunning).toBe(false);
    expect(state().isLoading).toBe(true);
  });

  it("should no-op when already at the last section", () => {
    setupTwoSectionSession();

    // Advance to section index 1 (last)
    act().advanceSection();
    expect(state().currentSectionIndex).toBe(1);

    // Try to advance again — should be a no-op
    const timeBefore = state().remainingTimeMs;
    act().advanceSection();

    expect(state().currentSectionIndex).toBe(1);
    expect(state().remainingTimeMs).toBe(timeBefore);
  });

  it("should no-op when sections array is empty", () => {
    act().startSession("s", "u", "drill", []);

    act().advanceSection();

    expect(state().currentSectionIndex).toBe(0);
  });
});

// ===========================================================================
// tickTimer
// ===========================================================================

describe("tickTimer", () => {
  it("should decrement remainingTimeMs by the given elapsed milliseconds", () => {
    useExamSessionStore.setState({ remainingTimeMs: 100_000 });

    act().tickTimer(1000);

    expect(state().remainingTimeMs).toBe(99_000);
  });

  it("should clamp remainingTimeMs at 0 (never go negative)", () => {
    useExamSessionStore.setState({ remainingTimeMs: 500 });

    act().tickTimer(1000);

    expect(state().remainingTimeMs).toBe(0);
  });

  it("should handle elapsed = 0 without changing remainingTimeMs", () => {
    useExamSessionStore.setState({ remainingTimeMs: 50_000 });

    act().tickTimer(0);

    expect(state().remainingTimeMs).toBe(50_000);
  });

  it("should work across multiple ticks", () => {
    useExamSessionStore.setState({ remainingTimeMs: 10_000 });

    act().tickTimer(3000);
    act().tickTimer(3000);
    act().tickTimer(3000);

    expect(state().remainingTimeMs).toBe(1000);
  });
});

// ===========================================================================
// toggleExplanation
// ===========================================================================

describe("toggleExplanation", () => {
  it("should flip showExplanation from false to true", () => {
    useExamSessionStore.setState({ showExplanation: false });

    act().toggleExplanation();

    expect(state().showExplanation).toBe(true);
  });

  it("should flip showExplanation from true to false", () => {
    useExamSessionStore.setState({ showExplanation: true });

    act().toggleExplanation();

    expect(state().showExplanation).toBe(false);
  });

  it("should toggle back and forth correctly", () => {
    useExamSessionStore.setState({ showExplanation: false });

    act().toggleExplanation();
    expect(state().showExplanation).toBe(true);

    act().toggleExplanation();
    expect(state().showExplanation).toBe(false);
  });
});

// ===========================================================================
// useEdit
// ===========================================================================

describe("useEdit", () => {
  it("should increment editsUsed by 1 when under the limit", () => {
    setupTwoSectionSession(); // section 0 has editsAllowed=3

    act().useEdit();

    expect(state().editsUsed).toBe(1);
  });

  it("should allow edits up to but not beyond editsAllowed", () => {
    setupTwoSectionSession(); // editsAllowed=3

    act().useEdit();
    act().useEdit();
    act().useEdit();
    expect(state().editsUsed).toBe(3);

    // This should be a no-op
    act().useEdit();
    expect(state().editsUsed).toBe(3);
  });

  it("should no-op when sections array is empty (no config)", () => {
    act().startSession("s", "u", "drill", []);

    act().useEdit();

    expect(state().editsUsed).toBe(0);
  });

  it("should respect the editsAllowed of the current section after advancing", () => {
    setupTwoSectionSession(); // section 0: editsAllowed=3, section 1: editsAllowed=2

    act().advanceSection(); // now on section 1 with editsAllowed=2

    act().useEdit();
    act().useEdit();
    expect(state().editsUsed).toBe(2);

    act().useEdit(); // should be no-op since limit is 2
    expect(state().editsUsed).toBe(2);
  });
});

// ===========================================================================
// completeSession
// ===========================================================================

describe("completeSession", () => {
  it("should set isComplete to true", () => {
    act().completeSession();

    expect(state().isComplete).toBe(true);
  });

  it("should stop the timer", () => {
    useExamSessionStore.setState({ isTimerRunning: true });

    act().completeSession();

    expect(state().isTimerRunning).toBe(false);
  });
});

// ===========================================================================
// reset
// ===========================================================================

describe("reset", () => {
  it("should return all state to initial values", () => {
    // First, put the store in a complex state
    setupTwoSectionSession();
    act().setCurrentQuestion(makeQuestion({ section: "quantitative" }));
    act().selectAnswer("B");
    act().submitAnswer("B", makeIRTParams());
    act().tickTimer(1000);

    // Now reset
    act().reset();

    expect(state().sessionId).toBeNull();
    expect(state().userId).toBeNull();
    expect(state().sessionType).toBeNull();
    expect(state().startedAt).toBeNull();
    expect(state().currentSectionIndex).toBe(0);
    expect(state().sections).toEqual([]);
    expect(state().currentQuestion).toBeNull();
    expect(state().selectedAnswer).toBeNull();
    expect(state().questionStartTime).toBeNull();
    expect(state().attempts).toEqual([]);
    expect(state().sectionThetas).toEqual({
      quantitative: 0,
      verbal: 0,
      data_insights: 0,
    });
    expect(state().remainingTimeMs).toBe(0);
    expect(state().isTimerRunning).toBe(false);
    expect(state().isLoading).toBe(false);
    expect(state().isComplete).toBe(false);
    expect(state().showExplanation).toBe(false);
    expect(state().editsUsed).toBe(0);
  });

  it("should allow starting a fresh session after reset", () => {
    setupTwoSectionSession();
    act().reset();

    const sections = [makeSectionConfig({ section: "data_insights", timeMinutes: 30, startingTheta: 0.8 })];
    act().startSession("sess-2", "user-2", "section_practice", sections);

    expect(state().sessionId).toBe("sess-2");
    expect(state().sectionThetas.data_insights).toBe(0.8);
    expect(state().remainingTimeMs).toBe(30 * 60 * 1000);
  });
});

// ===========================================================================
// Integration / end-to-end flow tests
// ===========================================================================

describe("full exam flow integration", () => {
  it("should support a complete question cycle: set -> select -> submit -> next", () => {
    setupTwoSectionSession();

    // 1. Load question
    const q = makeQuestion({ id: "flow-q1", section: "quantitative", correctAnswer: "C" });
    act().setCurrentQuestion(q);
    expect(state().isTimerRunning).toBe(true);
    expect(state().isLoading).toBe(false);

    // 2. Select answer
    act().selectAnswer("C");
    expect(state().selectedAnswer).toBe("C");

    // 3. Submit
    act().submitAnswer("C", makeIRTParams());
    expect(state().isTimerRunning).toBe(false);
    expect(state().showExplanation).toBe(true);
    expect(state().attempts).toHaveLength(1);
    expect(state().attempts[0]!.isCorrect).toBe(true);

    // 4. Next question
    act().nextQuestion();
    expect(state().currentQuestion).toBeNull();
    expect(state().isLoading).toBe(true);
    expect(state().showExplanation).toBe(false);
  });

  it("should support advancing through sections and completing", () => {
    setupTwoSectionSession();

    // Verify initial section
    expect(state().currentSectionIndex).toBe(0);
    expect(state().remainingTimeMs).toBe(45 * 60 * 1000);

    // Advance to next section
    act().advanceSection();
    expect(state().currentSectionIndex).toBe(1);
    expect(state().remainingTimeMs).toBe(36 * 60 * 1000);
    expect(state().editsUsed).toBe(0);

    // Complete the session
    act().completeSession();
    expect(state().isComplete).toBe(true);
    expect(state().isTimerRunning).toBe(false);
  });

  it("should track theta evolution across multiple questions in the same section", () => {
    const sections = [
      makeSectionConfig({ section: "quantitative", startingTheta: 0.0 }),
    ];
    act().startSession("s", "u", "drill", sections);

    const item: IRTParameters = { a: 1.0, b: 0.0, c: 0.2 };

    // Answer 3 correct in a row
    for (let i = 0; i < 3; i++) {
      act().setCurrentQuestion(makeQuestion({ id: `q-${i}`, section: "quantitative" }));
      act().selectAnswer("B");
      act().submitAnswer("B", item);
    }

    // Theta should have increased from 0.0
    expect(state().sectionThetas.quantitative).toBeGreaterThan(0.0);
    // Should have 3 attempts
    expect(state().attempts).toHaveLength(3);
    // All should be correct
    expect(state().attempts.every((a) => a.isCorrect)).toBe(true);
  });
});
