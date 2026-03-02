"use client";

import { useEffect, useState } from "react";
import { useExamSessionStore } from "@/stores/exam-session-store";
import { useGameLoop } from "@/hooks/useGameLoop";
import type { GmatSection } from "@/lib/tutor-engine/types";
import Timer from "@/components/Timer";
import QuestionCard from "@/components/QuestionCard";
import ScoreDisplay from "@/components/ScoreDisplay";
import SessionLauncher from "@/components/SessionLauncher";
import ErrorBoundary from "@/components/ErrorBoundary";

const SECTION_LABELS: Record<GmatSection, string> = {
  quantitative: "Quantitative Reasoning",
  verbal: "Verbal Reasoning",
  data_insights: "Data Insights",
};

function FinalScoreScreen() {
  const reset = useExamSessionStore((s) => s.reset);
  const sessionId = useExamSessionStore((s) => s.sessionId);
  const userId = useExamSessionStore((s) => s.userId);
  const sectionThetas = useExamSessionStore((s) => s.sectionThetas);
  const sessionType = useExamSessionStore((s) => s.sessionType);

  const [xpAwarded, setXpAwarded] = useState<number | null>(null);
  const [newBadges, setNewBadges] = useState<{ name: string }[]>([]);

  // Persist session completion
  useEffect(() => {
    if (!sessionId || !userId) return;

    const thetaToScore = (theta: number) =>
      Math.round(Math.max(60, Math.min(90, 75 + theta * 5)));

    const quantScore = thetaToScore(sectionThetas.quantitative);
    const verbalScore = thetaToScore(sectionThetas.verbal);
    const diScore = thetaToScore(sectionThetas.data_insights);
    const sectionSum = quantScore + verbalScore + diScore;
    const totalScore = Math.round(Math.max(205, Math.min(805, 205 + ((sectionSum - 180) * 600) / 90)) / 5) * 5;

    fetch("/api/exam-session/complete", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        sessionId,
        userId,
        totalScore,
        quantScore,
        verbalScore,
        diScore,
      }),
    })
      .then((res) => res.ok ? res.json() : null)
      .then((data) => {
        if (data) {
          setXpAwarded(data.xpAwarded ?? 0);
          setNewBadges(data.newBadges ?? []);
        }
      })
      .catch(() => { /* non-critical */ });
  }, [sessionId, userId, sectionThetas, sessionType]);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center px-4 py-16">
      <div className="w-full max-w-lg">
        {/* Header */}
        <div className="mb-8 text-center">
          <span className="mb-3 block text-4xl">&#127942;</span>
          <h2 className="text-2xl font-extrabold tracking-tight text-gray-100">
            Session Complete
          </h2>
          <p className="mt-2 text-sm text-gray-400">
            Here is your performance summary
          </p>
        </div>

        {/* XP Awarded */}
        {xpAwarded !== null && xpAwarded > 0 && (
          <div className="mb-4 rounded-xl border border-indigo-500/30 bg-indigo-950/30 px-4 py-3 text-center">
            <p className="text-lg font-bold text-indigo-300">+{xpAwarded} XP</p>
            {newBadges.length > 0 && (
              <p className="mt-1 text-sm text-amber-400">
                New badge{newBadges.length > 1 ? "s" : ""}: {newBadges.map((b) => b.name).join(", ")}
              </p>
            )}
          </div>
        )}

        {/* Full score display */}
        <ScoreDisplay compact={false} />

        {/* Actions */}
        <div className="mt-8 flex gap-3">
          <button
            onClick={reset}
            className="flex-1 rounded-xl border border-gray-700 bg-gray-800 px-6 py-3 text-sm font-semibold text-gray-200 transition-colors hover:bg-gray-700"
          >
            New Session
          </button>
          <a
            href="/dashboard"
            className="flex-1 rounded-xl bg-indigo-600 px-6 py-3 text-center text-sm font-semibold text-white transition-colors hover:bg-indigo-500"
          >
            View Dashboard
          </a>
        </div>
      </div>
    </div>
  );
}

function ActiveGameLayout() {
  const sections = useExamSessionStore((s) => s.sections);
  const currentSectionIndex = useExamSessionStore((s) => s.currentSectionIndex);
  const attempts = useExamSessionStore((s) => s.attempts);
  const editsUsed = useExamSessionStore((s) => s.editsUsed);

  const { error, sectionQuestionCount, sectionTotal } = useGameLoop();

  const currentSection = sections[currentSectionIndex];
  if (!currentSection) return null;

  const sectionLabel = SECTION_LABELS[currentSection.section];
  const editsRemaining = currentSection.editsAllowed - editsUsed;

  return (
    <div className="flex min-h-screen flex-col">
      {/* Top Bar */}
      <header className="sticky top-0 z-50 border-b border-gray-800 bg-gray-950/90 backdrop-blur">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-3 sm:px-6">
          {/* Left: Timer */}
          <Timer />

          {/* Center: Section info */}
          <div className="flex flex-col items-center">
            <span className="text-sm font-bold text-gray-200">
              {sectionLabel}
            </span>
            <span className="text-xs text-gray-500">
              {sectionQuestionCount} / {sectionTotal} answered
              {sections.length > 1 && (
                <span className="ml-2">
                  &middot; Section {currentSectionIndex + 1} of{" "}
                  {sections.length}
                </span>
              )}
            </span>
          </div>

          {/* Right: Edits remaining */}
          <div className="flex items-center gap-1.5 rounded-full border border-gray-700 bg-gray-800/80 px-3 py-1.5">
            <span className="text-xs text-gray-400">Edits</span>
            <div className="flex gap-0.5">
              {Array.from({ length: currentSection.editsAllowed }).map(
                (_, i) => (
                  <span
                    key={i}
                    className={`inline-block h-2 w-2 rounded-full ${
                      i < editsRemaining ? "bg-amber-400" : "bg-gray-700"
                    }`}
                  />
                ),
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Game Loop Error */}
      {error && (
        <div className="mx-auto mt-4 max-w-3xl px-4 sm:px-6">
          <div className="rounded-xl border border-red-500/30 bg-red-950/30 px-4 py-3 text-sm text-red-400">
            {error}
          </div>
        </div>
      )}

      {/* Main Content */}
      <main className="flex-1 px-4 py-6 sm:px-6">
        <div className="mx-auto max-w-3xl">
          <QuestionCard />
        </div>
      </main>

      {/* Bottom Bar: Compact Score */}
      <footer className="border-t border-gray-800 bg-gray-950/90 backdrop-blur">
        <div className="mx-auto max-w-5xl overflow-x-auto px-4 py-3 sm:px-6">
          <ScoreDisplay compact />
        </div>
      </footer>
    </div>
  );
}

export default function GameScreen() {
  const sessionId = useExamSessionStore((s) => s.sessionId);
  const isComplete = useExamSessionStore((s) => s.isComplete);

  return (
    <ErrorBoundary>
      {/* No session: show launcher */}
      {!sessionId && <SessionLauncher />}

      {/* Session complete: show final score */}
      {sessionId && isComplete && <FinalScoreScreen />}

      {/* Active session: show game layout */}
      {sessionId && !isComplete && <ActiveGameLayout />}
    </ErrorBoundary>
  );
}
