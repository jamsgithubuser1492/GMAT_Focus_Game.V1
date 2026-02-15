"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useExamSessionStore } from "@/stores/exam-session-store";
import { getQuestionsBySection } from "@/lib/question-bank";
import type { GmatSection, Question } from "@/lib/tutor-engine/types";

/**
 * useGameLoop
 *
 * Orchestrates the full adaptive game flow by connecting the Zustand
 * exam-session store to the question-bank and the tutor-engine API.
 *
 * Responsibilities:
 *  1. Auto-fetch the first question when a session starts
 *  2. Select the next question via the adaptive engine API
 *  3. Auto-advance between sections (or complete the session)
 *  4. Track per-section progress
 *  5. Handle timer expiry
 */
export function useGameLoop() {
  // ---------------------------------------------------------------------------
  // Store slices (read)
  // ---------------------------------------------------------------------------
  const sessionId = useExamSessionStore((s) => s.sessionId);
  const sections = useExamSessionStore((s) => s.sections);
  const currentSectionIndex = useExamSessionStore((s) => s.currentSectionIndex);
  const currentQuestion = useExamSessionStore((s) => s.currentQuestion);
  const isLoading = useExamSessionStore((s) => s.isLoading);
  const isComplete = useExamSessionStore((s) => s.isComplete);
  const attempts = useExamSessionStore((s) => s.attempts);
  const sectionThetas = useExamSessionStore((s) => s.sectionThetas);
  const remainingTimeMs = useExamSessionStore((s) => s.remainingTimeMs);

  // Store slices (actions)
  const setCurrentQuestion = useExamSessionStore((s) => s.setCurrentQuestion);
  const advanceSection = useExamSessionStore((s) => s.advanceSection);
  const completeSession = useExamSessionStore((s) => s.completeSession);

  // ---------------------------------------------------------------------------
  // Local state
  // ---------------------------------------------------------------------------
  const [error, setError] = useState<string | null>(null);

  // Guard against concurrent fetches (React 18 Strict Mode double-invokes effects)
  const isFetchingRef = useRef(false);

  // ---------------------------------------------------------------------------
  // Derived values
  // ---------------------------------------------------------------------------
  const currentSection = sections[currentSectionIndex] ?? null;
  const currentGmatSection: GmatSection | null = currentSection?.section ?? null;

  const sectionQuestionCount = currentGmatSection
    ? attempts.filter((a) => a.section === currentGmatSection).length
    : 0;

  const sectionTotal = currentSection?.questionsCount ?? 0;

  const isSectionComplete = sectionTotal > 0 && sectionQuestionCount >= sectionTotal;

  const isExamComplete =
    isComplete ||
    (isSectionComplete && currentSectionIndex >= sections.length - 1);

  // ---------------------------------------------------------------------------
  // fetchNextQuestion — core adaptive question selection
  // ---------------------------------------------------------------------------
  const fetchNextQuestion = useCallback(async () => {
    if (isFetchingRef.current) return;
    if (!currentSection) return;

    isFetchingRef.current = true;
    setError(null);

    try {
      // 1. Get all candidate questions for the section from the local bank
      const sectionQuestions: Question[] = getQuestionsBySection(
        currentSection.section,
      );

      // 2. Determine which questions have already been answered in this section
      const answeredIds = attempts
        .filter((a) => a.section === currentSection.section)
        .map((a) => a.questionId);

      // 3. Call the adaptive selection API
      const res = await fetch("/api/tutor-engine/select-question", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          candidateQuestions: sectionQuestions,
          learnerProfiles: {},
          currentSectionTheta: sectionThetas[currentSection.section],
          answeredQuestionIds: answeredIds,
        }),
      });

      // 4. Handle response
      if (res.status === 204) {
        // No eligible questions remain -- section is done
        handleSectionComplete();
        return;
      }

      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(
          (body as { error?: string }).error ??
            `Selection API returned ${res.status}`,
        );
      }

      const data: { question: Question } = await res.json();
      setCurrentQuestion(data.question);
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Failed to fetch next question";
      setError(message);
    } finally {
      isFetchingRef.current = false;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentSection, attempts, sectionThetas, setCurrentQuestion]);

  // ---------------------------------------------------------------------------
  // handleSectionComplete — advance or finish
  // ---------------------------------------------------------------------------
  const handleSectionComplete = useCallback(() => {
    if (currentSectionIndex < sections.length - 1) {
      // More sections remain
      advanceSection();
      // advanceSection() sets isLoading = true and currentQuestion = null,
      // which will trigger the auto-fetch effect below.
    } else {
      // Last section finished
      completeSession();
    }
  }, [currentSectionIndex, sections.length, advanceSection, completeSession]);

  // ---------------------------------------------------------------------------
  // Effect: Auto-fetch first question when session starts
  //
  // When sessionId becomes non-null, the store has isLoading = false and
  // currentQuestion = null initially. The SessionLauncher calls startSession()
  // which does NOT set isLoading to true, so we detect "session just started,
  // no question yet" via sessionId + !currentQuestion + !isComplete.
  // ---------------------------------------------------------------------------
  useEffect(() => {
    if (!sessionId) return;
    if (currentQuestion) return;
    if (isComplete) return;
    if (isFetchingRef.current) return;

    // Either the session just started, or isLoading was set by nextQuestion() /
    // advanceSection() — in both cases we need to fetch.
    fetchNextQuestion();
  }, [sessionId, currentQuestion, isComplete, isLoading, fetchNextQuestion]);

  // ---------------------------------------------------------------------------
  // Effect: Auto-advance when section questions are all answered
  // ---------------------------------------------------------------------------
  useEffect(() => {
    if (!sessionId) return;
    if (isComplete) return;
    if (!isSectionComplete) return;
    // Only auto-advance when the player is NOT looking at a question/explanation
    if (currentQuestion) return;

    handleSectionComplete();
  }, [
    sessionId,
    isComplete,
    isSectionComplete,
    currentQuestion,
    handleSectionComplete,
  ]);

  // ---------------------------------------------------------------------------
  // Effect: Handle timer expiry
  // ---------------------------------------------------------------------------
  useEffect(() => {
    if (!sessionId) return;
    if (isComplete) return;
    if (remainingTimeMs > 0) return;
    // Only act when the timer has been running (sections have time > 0)
    if (!currentSection || currentSection.timeMinutes === 0) return;

    handleSectionComplete();
  }, [
    sessionId,
    isComplete,
    remainingTimeMs,
    currentSection,
    handleSectionComplete,
  ]);

  // ---------------------------------------------------------------------------
  // Public API
  // ---------------------------------------------------------------------------
  return {
    fetchNextQuestion,
    sectionQuestionCount,
    sectionTotal,
    isSectionComplete,
    isExamComplete,
    error,
  };
}
