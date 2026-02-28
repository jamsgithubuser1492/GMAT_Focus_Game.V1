/**
 * Adaptive Question Selection Algorithm
 *
 * The "brain" of the TutorEngine. Selects the next question that maximizes
 * learning by combining:
 *
 *   1. Fisher information — pick items at the learner's frontier of competence
 *   2. Spaced repetition — boost stale/decayed skills to reinforce memory
 *   3. Exclusion — never re-serve already-answered items in a session
 *
 * This module is the orchestrator that turns IRT math into adaptive behavior.
 */

import type { Question, LearnerProfile } from "./types";
import { GMAT_FOCUS } from "./types";
import { itemInformation } from "./irt";
import { sectionScoreToTheta } from "./scoring";

// ---------------------------------------------------------------------------
// Public Types
// ---------------------------------------------------------------------------

export interface ScoredQuestion {
  question: Question;
  informationScore: number;
  decayWeight: number;
  combinedScore: number;
}

export interface QuestionSelectionContext {
  candidateQuestions: Question[];
  learnerProfiles: Map<string, LearnerProfile>;
  currentSectionTheta: number;
  targetScore?: number;
  answeredQuestionIds?: Set<string>;
  now?: Date;
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

/** Weight given to decay boost relative to information score */
const DECAY_BOOST_WEIGHT = 0.5;

// ---------------------------------------------------------------------------
// getTargetTheta
// ---------------------------------------------------------------------------

/**
 * Convert a target total GMAT Focus score to an approximate per-section theta.
 *
 * Inverse of the total score formula:
 *   totalScore = 205 + (sectionSum - 180) × (600/90)
 *   sectionSum = 3 × sectionScore  (assuming equal sections)
 *   sectionScore = (totalScore - 205) × 90 / 600 + 60
 *   theta = sectionScoreToTheta(sectionScore)
 *
 * @param targetScore - Target GMAT Focus total score (205-805)
 * @returns Approximate per-section theta, clamped to [-3, 3]
 */
export function getTargetTheta(targetScore: number): number {
  const clamped = Math.max(GMAT_FOCUS.TOTAL_SCORE_MIN, Math.min(GMAT_FOCUS.TOTAL_SCORE_MAX, targetScore));
  const sectionScore = (clamped - 205) / 20 + 60;
  const clampedSection = Math.max(
    GMAT_FOCUS.SECTION_SCORE_MIN,
    Math.min(GMAT_FOCUS.SECTION_SCORE_MAX, sectionScore),
  );
  return sectionScoreToTheta(clampedSection);
}

// ---------------------------------------------------------------------------
// filterEligibleQuestions
// ---------------------------------------------------------------------------

/**
 * Filter out already-answered questions from the candidate pool.
 *
 * @param candidates - Full question pool
 * @param answeredIds - Set of question IDs already answered in this session
 * @returns Filtered array (does not mutate the original)
 */
export function filterEligibleQuestions(
  candidates: Question[],
  answeredIds?: Set<string>,
): Question[] {
  if (!answeredIds || answeredIds.size === 0) {
    return [...candidates];
  }
  return candidates.filter((q) => !answeredIds.has(q.id));
}

// ---------------------------------------------------------------------------
// rankByInformation
// ---------------------------------------------------------------------------

/**
 * Rank questions by Fisher information at the learner's current theta.
 *
 * Higher information = the item discriminates most at this proficiency level.
 * Sorted descending so the most informative item is first.
 *
 * @param candidates - Questions to rank
 * @param theta - Learner's current proficiency estimate
 * @returns Scored and sorted question list
 */
export function rankByInformation(
  candidates: Question[],
  theta: number,
): ScoredQuestion[] {
  return candidates
    .map((question) => {
      const informationScore = itemInformation(theta, {
        a: question.discrimination,
        b: question.difficulty,
        c: question.guessing,
      });
      return {
        question,
        informationScore,
        decayWeight: 0,
        combinedScore: informationScore,
      };
    })
    .sort((a, b) => b.informationScore - a.informationScore);
}

// ---------------------------------------------------------------------------
// selectNextQuestion
// ---------------------------------------------------------------------------

/**
 * Select the next optimal question for the learner.
 *
 * Combines Fisher information (match difficulty to ability) with spaced
 * repetition decay weighting (boost stale skills). Questions already
 * answered in this session are excluded.
 *
 * @param ctx - Selection context with candidates, profiles, and theta
 * @returns The best next question, or null if none available
 */
export function selectNextQuestion(ctx: QuestionSelectionContext): Question | null {
  const {
    candidateQuestions,
    learnerProfiles,
    currentSectionTheta,
    targetScore,
    answeredQuestionIds,
    now = new Date(),
  } = ctx;

  // 1. Exclude already-answered
  const eligible = filterEligibleQuestions(candidateQuestions, answeredQuestionIds);
  if (eligible.length === 0) {
    return null;
  }

  // Blend current theta with target theta when a target score is set.
  // This biases question selection toward the user's goal difficulty.
  const effectiveTheta = targetScore
    ? 0.7 * currentSectionTheta + 0.3 * getTargetTheta(targetScore)
    : currentSectionTheta;

  // 2. Score each question: information + decay boost
  const scored = eligible.map((question) => {
    const informationScore = itemInformation(effectiveTheta, {
      a: question.discrimination,
      b: question.difficulty,
      c: question.guessing,
    });

    // Compute decay boost: average (1 - decayFactor) across the question's skill nodes.
    // Higher boost when skills are more decayed (stale), motivating revisit.
    let decayWeight = 0;
    const skillIds = question.skillNodeIds;
    if (skillIds.length > 0) {
      let totalDecayNeed = 0;
      let profileCount = 0;

      for (const skillId of skillIds) {
        const profile = learnerProfiles.get(skillId);
        if (profile) {
          // (1 - decayFactor) ranges from 0 (fresh) to 1 (fully decayed)
          totalDecayNeed += 1 - profile.decayFactor;
          profileCount++;
        } else {
          // No profile = never practiced = fully stale
          totalDecayNeed += 1;
          profileCount++;
        }
      }

      decayWeight = profileCount > 0 ? totalDecayNeed / profileCount : 0;
    }

    const combinedScore = informationScore + DECAY_BOOST_WEIGHT * decayWeight * informationScore;

    return { question, informationScore, decayWeight, combinedScore } satisfies ScoredQuestion;
  });

  // 3. Sort by combined score descending
  scored.sort((a, b) => b.combinedScore - a.combinedScore);

  return scored[0]?.question ?? null;
}
