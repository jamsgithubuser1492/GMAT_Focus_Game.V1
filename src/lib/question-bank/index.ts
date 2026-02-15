/**
 * Question Bank — Static GMAT Focus Question Pool
 *
 * Exports functions to retrieve questions by section for use by the
 * adaptive game loop. Questions are stored as static TypeScript arrays
 * (no database required) and can later be migrated to Prisma seed data.
 */

import type { GmatSection, Question } from "@/lib/tutor-engine/types";
import { quantitativeQuestions } from "./quantitative";
import { verbalQuestions } from "./verbal";
import { dataInsightsQuestions } from "./data-insights";

// ---------------------------------------------------------------------------
// Section → Question mapping
// ---------------------------------------------------------------------------

const questionsBySection: Record<GmatSection, Question[]> = {
  quantitative: quantitativeQuestions,
  verbal: verbalQuestions,
  data_insights: dataInsightsQuestions,
};

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Get all questions for a given GMAT Focus section.
 *
 * Returns a shallow copy so callers can filter without mutating the bank.
 */
export function getQuestionsBySection(section: GmatSection): Question[] {
  return [...(questionsBySection[section] ?? [])];
}

/**
 * Get every question across all sections.
 */
export function getAllQuestions(): Question[] {
  return [
    ...quantitativeQuestions,
    ...verbalQuestions,
    ...dataInsightsQuestions,
  ];
}

/**
 * Get the count of questions available per section.
 */
export function getQuestionCounts(): Record<GmatSection, number> {
  return {
    quantitative: quantitativeQuestions.length,
    verbal: verbalQuestions.length,
    data_insights: dataInsightsQuestions.length,
  };
}
