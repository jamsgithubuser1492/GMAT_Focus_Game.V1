"use client";

import { useExamSessionStore } from "@/stores/exam-session-store";
import type { GmatSection } from "@/lib/tutor-engine/types";
import Timer from "@/components/Timer";
import QuestionCard from "@/components/QuestionCard";
import ScoreDisplay from "@/components/ScoreDisplay";
import SessionLauncher from "@/components/SessionLauncher";

const SECTION_LABELS: Record<GmatSection, string> = {
  quantitative: "Quantitative Reasoning",
  verbal: "Verbal Reasoning",
  data_insights: "Data Insights",
};

function FinalScoreScreen() {
  const reset = useExamSessionStore((s) => s.reset);

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

  const currentSection = sections[currentSectionIndex];
  if (!currentSection) return null;

  const sectionLabel = SECTION_LABELS[currentSection.section];
  const sectionAttempts = attempts.filter(
    (a) => a.section === currentSection.section,
  );
  const answeredCount = sectionAttempts.length;
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
              {answeredCount} / {currentSection.questionsCount} answered
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

  // No session: show launcher
  if (!sessionId) {
    return <SessionLauncher />;
  }

  // Session complete: show final score
  if (isComplete) {
    return <FinalScoreScreen />;
  }

  // Active session: show game layout
  return <ActiveGameLayout />;
}
