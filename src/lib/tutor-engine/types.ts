/**
 * Core TypeScript types for the GMAT Focus TutorEngine.
 */

// ---------------------------------------------------------------------------
// GMAT Focus Edition Section Enum
// ---------------------------------------------------------------------------
export type GmatSection = "quantitative" | "verbal" | "data_insights";

// ---------------------------------------------------------------------------
// Question Types (strict per-section enforcement)
// ---------------------------------------------------------------------------
export type QuantQuestionType = "problem_solving";

export type VerbalQuestionType = "reading_comprehension" | "critical_reasoning";

export type DataInsightsQuestionType =
  | "data_sufficiency"
  | "multi_source_reasoning"
  | "table_analysis"
  | "graphics_interpretation"
  | "two_part_analysis";

export type QuestionType = QuantQuestionType | VerbalQuestionType | DataInsightsQuestionType;

// ---------------------------------------------------------------------------
// Skill Node (Expert Model)
// ---------------------------------------------------------------------------
export interface SkillNode {
  id: string;
  section: GmatSection;
  name: string;
  description: string;
  tier: 1 | 2 | 3 | 4; // 1=foundational, 4=elite (700+)
  parentIds: string[]; // dependency graph edges
}

// ---------------------------------------------------------------------------
// Question (Item Bank)
// ---------------------------------------------------------------------------
export interface Question {
  id: string;
  section: GmatSection;
  questionType: QuestionType;
  skillNodeIds: string[];
  difficulty: number; // IRT b parameter, range [-3, 3]
  discrimination: number; // IRT a parameter, > 0
  guessing: number; // IRT c parameter, default 0.2
  content: string; // JSONB stringified
  correctAnswer: string;
  explanation: string;
  estimatedTimeSeconds: number;
}

// ---------------------------------------------------------------------------
// Learner Profile (Learner Model — per skill node per user)
// ---------------------------------------------------------------------------
export interface LearnerProfile {
  userId: string;
  skillNodeId: string;
  theta: number; // proficiency estimate, range [-3, 3]
  attempts: number;
  correct: number;
  lastPracticed: Date | null;
  decayFactor: number; // 1.0 = full mastery, decays toward 0
}

// ---------------------------------------------------------------------------
// Question Attempt
// ---------------------------------------------------------------------------
export interface QuestionAttempt {
  id: string;
  userId: string;
  questionId: string;
  sessionId: string;
  selectedAnswer: string;
  isCorrect: boolean;
  timeSpent: number; // seconds
  wasBookmarked: boolean;
  wasEdited: boolean;
  thetaBefore: number;
  thetaAfter: number;
  createdAt: Date;
}

// ---------------------------------------------------------------------------
// IRT Parameters (convenience grouping)
// ---------------------------------------------------------------------------
export interface IRTParameters {
  a: number; // discrimination
  b: number; // difficulty
  c: number; // guessing
}

// ---------------------------------------------------------------------------
// Response for theta update
// ---------------------------------------------------------------------------
export interface IRTResponse {
  isCorrect: boolean;
  item: IRTParameters;
}

// ---------------------------------------------------------------------------
// Score Result
// ---------------------------------------------------------------------------
export interface SectionScoreResult {
  section: GmatSection;
  theta: number;
  sectionScore: number; // 60-90 integer
}

export interface TotalScoreResult {
  sections: SectionScoreResult[];
  totalScore: number; // 205-805, ends in 5
}

// ---------------------------------------------------------------------------
// GMAT Focus Scoring Constants
// ---------------------------------------------------------------------------
export const GMAT_FOCUS = {
  TOTAL_SCORE_MIN: 205,
  TOTAL_SCORE_MAX: 805,
  SECTION_SCORE_MIN: 60,
  SECTION_SCORE_MAX: 90,
  THETA_MIN: -3.0,
  THETA_MAX: 3.0,
  DEFAULT_GUESSING: 0.2, // 5-choice MCQ
  SECTIONS: ["quantitative", "verbal", "data_insights"] as const,
  QUESTIONS_PER_SECTION: {
    quantitative: 21,
    verbal: 23,
    data_insights: 20,
  },
  TIME_PER_SECTION_MINUTES: 45,
  MAX_EDITS_PER_SECTION: 3,
  KNOWLEDGE_DECAY_DAYS: 7,
} as const;
