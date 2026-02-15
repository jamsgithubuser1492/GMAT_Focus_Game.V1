import { create } from "zustand";

import type { GmatSection, Question, IRTParameters } from "@/lib/tutor-engine/types";
import { GMAT_FOCUS } from "@/lib/tutor-engine/types";

// ---------------------------------------------------------------------------
// Supporting types
// ---------------------------------------------------------------------------

export interface SectionConfig {
  section: GmatSection;
  questionsCount: number;
  timeMinutes: number;
  editsAllowed: number;
  startingTheta: number;
}

export interface AttemptRecord {
  questionId: string;
  section: GmatSection;
  selectedAnswer: string;
  isCorrect: boolean;
  timeSpent: number;
  item: IRTParameters;
}

// ---------------------------------------------------------------------------
// State shape
// ---------------------------------------------------------------------------

interface ExamSessionState {
  // Session metadata
  sessionId: string | null;
  userId: string | null;
  sessionType: "drill" | "section_practice" | "full_exam" | null;
  startedAt: string | null;

  // Current section state
  currentSectionIndex: number;
  sections: SectionConfig[];

  // Question state
  currentQuestion: Question | null;
  selectedAnswer: string | null;
  questionStartTime: number | null;

  // Progress tracking
  attempts: AttemptRecord[];
  sectionThetas: Record<GmatSection, number>;

  // Timer
  remainingTimeMs: number;
  isTimerRunning: boolean;

  // UI state
  isLoading: boolean;
  isComplete: boolean;
  showExplanation: boolean;
  editsUsed: number;
}

// ---------------------------------------------------------------------------
// Actions
// ---------------------------------------------------------------------------

interface ExamSessionActions {
  startSession: (
    sessionId: string,
    userId: string,
    sessionType: "drill" | "section_practice" | "full_exam",
    sections: SectionConfig[],
  ) => void;
  setCurrentQuestion: (question: Question) => void;
  selectAnswer: (answer: string) => void;
  submitAnswer: (correctAnswer: string, item: IRTParameters) => void;
  nextQuestion: () => void;
  advanceSection: () => void;
  tickTimer: (elapsed: number) => void;
  toggleExplanation: () => void;
  useEdit: () => void;
  completeSession: () => void;
  reset: () => void;
}

// ---------------------------------------------------------------------------
// Initial state factory
// ---------------------------------------------------------------------------

const initialState: ExamSessionState = {
  sessionId: null,
  userId: null,
  sessionType: null,
  startedAt: null,

  currentSectionIndex: 0,
  sections: [],

  currentQuestion: null,
  selectedAnswer: null,
  questionStartTime: null,

  attempts: [],
  sectionThetas: {
    quantitative: 0,
    verbal: 0,
    data_insights: 0,
  },

  remainingTimeMs: 0,
  isTimerRunning: false,

  isLoading: false,
  isComplete: false,
  showExplanation: false,
  editsUsed: 0,
};

// ---------------------------------------------------------------------------
// Store
// ---------------------------------------------------------------------------

export const useExamSessionStore = create<ExamSessionState & ExamSessionActions>()(
  (set, get) => ({
    ...initialState,

    // -----------------------------------------------------------------------
    // startSession — initialise all metadata and section timer
    // -----------------------------------------------------------------------
    startSession: (sessionId, userId, sessionType, sections) => {
      const remainingTimeMs =
        sections.length > 0 ? sections[0].timeMinutes * 60 * 1000 : 0;

      set({
        sessionId,
        userId,
        sessionType,
        startedAt: new Date().toISOString(),
        sections,
        currentSectionIndex: 0,
        remainingTimeMs,
        isTimerRunning: false,
        isComplete: false,
        isLoading: false,
        showExplanation: false,
        editsUsed: 0,
        attempts: [],
        currentQuestion: null,
        selectedAnswer: null,
        questionStartTime: null,
        sectionThetas: {
          quantitative: sections.find((s) => s.section === "quantitative")?.startingTheta ?? 0,
          verbal: sections.find((s) => s.section === "verbal")?.startingTheta ?? 0,
          data_insights: sections.find((s) => s.section === "data_insights")?.startingTheta ?? 0,
        },
      });
    },

    // -----------------------------------------------------------------------
    // setCurrentQuestion — load a question and record when the clock starts
    // -----------------------------------------------------------------------
    setCurrentQuestion: (question) => {
      set({
        currentQuestion: question,
        selectedAnswer: null,
        questionStartTime: Date.now(),
        isLoading: false,
        showExplanation: false,
        isTimerRunning: true,
      });
    },

    // -----------------------------------------------------------------------
    // selectAnswer — store the learner's choice (before submission)
    // -----------------------------------------------------------------------
    selectAnswer: (answer) => {
      set({ selectedAnswer: answer });
    },

    // -----------------------------------------------------------------------
    // submitAnswer — grade, record attempt, and update theta via IRT gradient
    // -----------------------------------------------------------------------
    submitAnswer: (correctAnswer, item) => {
      const state = get();
      const { selectedAnswer, currentQuestion, questionStartTime, sectionThetas, attempts } = state;

      if (!selectedAnswer || !currentQuestion) return;

      const isCorrect = selectedAnswer === correctAnswer;
      const timeSpent = questionStartTime ? Date.now() - questionStartTime : 0;

      // IRT 3PL gradient update:
      //   p = c + (1 - c) / (1 + exp(-a * (theta - b)))
      //   theta += a * (isCorrect ? 1 - p : -p)
      const section = currentQuestion.section;
      const theta = sectionThetas[section];
      const { a, b, c } = item;
      const p = c + (1 - c) / (1 + Math.exp(-a * (theta - b)));
      const newTheta = theta + a * (isCorrect ? 1 - p : -p);
      const clampedTheta = Math.max(
        GMAT_FOCUS.THETA_MIN,
        Math.min(GMAT_FOCUS.THETA_MAX, newTheta),
      );

      const attempt: AttemptRecord = {
        questionId: currentQuestion.id,
        section,
        selectedAnswer,
        isCorrect,
        timeSpent,
        item,
      };

      set({
        attempts: [...attempts, attempt],
        sectionThetas: {
          ...sectionThetas,
          [section]: clampedTheta,
        },
        isTimerRunning: false,
        showExplanation: true,
      });
    },

    // -----------------------------------------------------------------------
    // nextQuestion — clear transient question state so the next one can load
    // -----------------------------------------------------------------------
    nextQuestion: () => {
      set({
        currentQuestion: null,
        selectedAnswer: null,
        questionStartTime: null,
        showExplanation: false,
        isLoading: true,
      });
    },

    // -----------------------------------------------------------------------
    // advanceSection — move to next section (full exam flow)
    // -----------------------------------------------------------------------
    advanceSection: () => {
      const { currentSectionIndex, sections } = get();
      const nextIndex = currentSectionIndex + 1;

      if (nextIndex >= sections.length) return;

      set({
        currentSectionIndex: nextIndex,
        remainingTimeMs: sections[nextIndex].timeMinutes * 60 * 1000,
        isTimerRunning: false,
        currentQuestion: null,
        selectedAnswer: null,
        questionStartTime: null,
        showExplanation: false,
        editsUsed: 0,
        isLoading: true,
      });
    },

    // -----------------------------------------------------------------------
    // tickTimer — decrement the remaining time (clamped at 0)
    // -----------------------------------------------------------------------
    tickTimer: (elapsed) => {
      set((state) => ({
        remainingTimeMs: Math.max(0, state.remainingTimeMs - elapsed),
      }));
    },

    // -----------------------------------------------------------------------
    // toggleExplanation — show / hide the explanation panel
    // -----------------------------------------------------------------------
    toggleExplanation: () => {
      set((state) => ({ showExplanation: !state.showExplanation }));
    },

    // -----------------------------------------------------------------------
    // useEdit — consume one of the allowed edits for the current section
    // -----------------------------------------------------------------------
    useEdit: () => {
      const { editsUsed, sections, currentSectionIndex } = get();
      const config = sections[currentSectionIndex];

      if (!config) return;
      if (editsUsed >= config.editsAllowed) return;

      set({ editsUsed: editsUsed + 1 });
    },

    // -----------------------------------------------------------------------
    // completeSession — mark the exam as finished
    // -----------------------------------------------------------------------
    completeSession: () => {
      set({
        isComplete: true,
        isTimerRunning: false,
      });
    },

    // -----------------------------------------------------------------------
    // reset — return everything to its initial blank state
    // -----------------------------------------------------------------------
    reset: () => {
      set({ ...initialState });
    },
  }),
);
