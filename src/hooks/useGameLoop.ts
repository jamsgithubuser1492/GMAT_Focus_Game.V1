"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useExamSessionStore } from "@/stores/exam-session-store";
import { getQuestionsBySection } from "@/lib/question-bank";
import type { GmatSection, Question, LearnerProfile } from "@/lib/tutor-engine/types";

/**
 * useGameLoop
 *
 * Orchestrates the full adaptive game flow by connecting the Zustand
 * exam-session store to the question-bank and the tutor-engine API.
 *
 * Responsibilities:
 *  1. Load learner profiles (with decay) and questions from DB on session start
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
  const userId = useExamSessionStore((s) => s.userId);
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

  // Learner profiles loaded from DB (with fresh decay factors)
  const learnerProfilesRef = useRef<Record<string, LearnerProfile>>({});

  // Cached questions from DB per section (avoids re-fetching each question cycle)
  const dbQuestionsRef = useRef<Record<string, Question[]>>({});

  // User's target score for adaptive strategy
  const targetScoreRef = useRef<number | undefined>(undefined);

  // Guard against concurrent fetches (React 18 Strict Mode double-invokes effects)
  const isFetchingRef = useRef(false);

  // Track whether initial data has been loaded for the current session
  const sessionDataLoadedRef = useRef<string | null>(null);

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
  // loadSessionData — fetch learner profiles, questions, and user target score
  // ---------------------------------------------------------------------------
  const loadSessionData = useCallback(async (section: GmatSection) => {
    if (!userId || userId === "local-player") return;

    try {
      // Fetch learner profiles and questions in parallel
      const [profilesRes, questionsRes] = await Promise.all([
        fetch(`/api/learner-profiles?userId=${userId}&section=${section}`),
        fetch(`/api/questions?section=${section}`),
      ]);

      if (profilesRes.ok) {
        const { profiles } = await profilesRes.json();
        learnerProfilesRef.current = profiles ?? {};
      }

      if (questionsRes.ok) {
        const { questions } = await questionsRes.json();
        if (Array.isArray(questions) && questions.length > 0) {
          dbQuestionsRef.current[section] = questions;
        }
      }

      // Fetch user target score (once per session)
      if (targetScoreRef.current === undefined) {
        try {
          const userRes = await fetch(`/api/user?userId=${userId}`);
          if (userRes.ok) {
            const user = await userRes.json();
            targetScoreRef.current = user.targetScore ?? 705;
          }
        } catch {
          targetScoreRef.current = 705;
        }
      }
    } catch {
      // Non-critical: fall back to static arrays and empty profiles
    }
  }, [userId]);

  // ---------------------------------------------------------------------------
  // getCandidateQuestions — DB-first, static fallback
  // ---------------------------------------------------------------------------
  const getCandidateQuestions = useCallback((section: GmatSection): Question[] => {
    const dbQuestions = dbQuestionsRef.current[section];
    if (dbQuestions && dbQuestions.length > 0) {
      return dbQuestions;
    }
    // Fallback to static arrays (works offline / without DB)
    return getQuestionsBySection(section);
  }, []);

  // ---------------------------------------------------------------------------
  // fetchNextQuestion — core adaptive question selection
  // ---------------------------------------------------------------------------
  const fetchNextQuestion = useCallback(async () => {
    if (isFetchingRef.current) return;
    if (!currentSection) return;

    isFetchingRef.current = true;
    setError(null);

    try {
      // Load session data from DB if not yet loaded for this section
      const sectionKey = `${sessionId}-${currentSection.section}`;
      if (sessionDataLoadedRef.current !== sectionKey) {
        await loadSessionData(currentSection.section);
        sessionDataLoadedRef.current = sectionKey;
      }

      // 1. Get candidate questions (DB-first, static fallback)
      const sectionQuestions = getCandidateQuestions(currentSection.section);

      // 2. Determine which questions have already been answered in this section
      const answeredIds = attempts
        .filter((a) => a.section === currentSection.section)
        .map((a) => a.questionId);

      // 3. Call the adaptive selection API with learner profiles + target score
      const res = await fetch("/api/tutor-engine/select-question", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          candidateQuestions: sectionQuestions,
          learnerProfiles: learnerProfilesRef.current,
          currentSectionTheta: sectionThetas[currentSection.section],
          answeredQuestionIds: answeredIds,
          targetScore: targetScoreRef.current,
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
  }, [currentSection, attempts, sectionThetas, setCurrentQuestion, loadSessionData, getCandidateQuestions, sessionId]);

  // ---------------------------------------------------------------------------
  // handleSectionComplete — advance or finish
  // ---------------------------------------------------------------------------
  const handleSectionComplete = useCallback(() => {
    if (currentSectionIndex < sections.length - 1) {
      // More sections remain — reset loaded data so next section loads fresh
      sessionDataLoadedRef.current = null;
      advanceSection();
    } else {
      // Last section finished
      completeSession();
    }
  }, [currentSectionIndex, sections.length, advanceSection, completeSession]);

  // ---------------------------------------------------------------------------
  // Effect: Auto-fetch first question when session starts
  // ---------------------------------------------------------------------------
  useEffect(() => {
    if (!sessionId) return;
    if (currentQuestion) return;
    if (isComplete) return;
    if (isFetchingRef.current) return;

    fetchNextQuestion();
  }, [sessionId, currentQuestion, isComplete, isLoading, fetchNextQuestion]);

  // ---------------------------------------------------------------------------
  // Effect: Auto-advance when section questions are all answered
  // ---------------------------------------------------------------------------
  useEffect(() => {
    if (!sessionId) return;
    if (isComplete) return;
    if (!isSectionComplete) return;
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
  // Effect: Reset refs when session resets
  // ---------------------------------------------------------------------------
  useEffect(() => {
    if (!sessionId) {
      learnerProfilesRef.current = {};
      dbQuestionsRef.current = {};
      targetScoreRef.current = undefined;
      sessionDataLoadedRef.current = null;
    }
  }, [sessionId]);

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
