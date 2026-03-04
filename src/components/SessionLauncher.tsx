"use client";

import { useState } from "react";
import { useExamSessionStore } from "@/stores/exam-session-store";
import type { GmatSection } from "@/lib/tutor-engine/types";

type SessionMode = "drill" | "section_practice" | "full_exam";

const MODE_OPTIONS: {
  mode: SessionMode;
  title: string;
  description: string;
  detail: string;
  icon: string;
}[] = [
  {
    mode: "drill",
    title: "Quick Drill",
    description: "10 focused questions",
    detail: "15 minutes",
    icon: "\u26A1", // lightning
  },
  {
    mode: "section_practice",
    title: "Section Practice",
    description: "Full section simulation",
    detail: "45 minutes",
    icon: "\uD83C\uDFAF", // target (dart board)
  },
  {
    mode: "full_exam",
    title: "Full Exam",
    description: "All 3 sections",
    detail: "2h 15min",
    icon: "\uD83C\uDFC6", // trophy
  },
];

const SECTION_OPTIONS: { value: GmatSection; label: string }[] = [
  { value: "quantitative", label: "Quantitative Reasoning" },
  { value: "verbal", label: "Verbal Reasoning" },
  { value: "data_insights", label: "Data Insights" },
];

interface SessionLauncherProps {
  onBack?: () => void;
}

export default function SessionLauncher({ onBack }: SessionLauncherProps) {
  const [selectedMode, setSelectedMode] = useState<SessionMode>("drill");
  const [selectedSection, setSelectedSection] =
    useState<GmatSection>("quantitative");
  const [isStarting, setIsStarting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const startSession = useExamSessionStore((s) => s.startSession);

  const needsSection = selectedMode !== "full_exam";

  const handleStart = async () => {
    setIsStarting(true);
    setError(null);

    try {
      // Ensure user exists in the database
      let userId = localStorage.getItem("gmat_user_id");
      if (!userId) {
        const userRes = await fetch("/api/user", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            email: `player-${crypto.randomUUID().slice(0, 8)}@gmat-focus.local`,
            displayName: "GMAT Player",
          }),
        });
        if (userRes.ok) {
          const userData = await userRes.json();
          userId = userData.id;
          localStorage.setItem("gmat_user_id", userId!);
        } else {
          // Fallback to local-only mode if DB is unavailable
          userId = "local-player";
        }
      }

      const res = await fetch("/api/exam-session/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId,
          sessionType: selectedMode,
          ...(needsSection ? { section: selectedSection } : {}),
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error ?? "Failed to create session");
      }

      const data = await res.json();

      startSession(
        data.sessionId,
        data.userId,
        data.sessionType,
        data.sectionsConfig,
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setIsStarting(false);
    }
  };

  return (
    <div className="flex min-h-screen flex-col items-center justify-center px-4 py-16">
      <div className="w-full max-w-2xl">
        {/* Back button */}
        {onBack && (
          <button
            onClick={onBack}
            className="mb-6 inline-flex items-center gap-1.5 text-xs font-medium text-gray-400 transition-colors hover:text-gray-200"
          >
            &larr; Back
          </button>
        )}

        {/* Header */}
        <div className="mb-10 text-center">
          <h1 className="text-3xl font-extrabold tracking-tight text-gray-100 sm:text-4xl">
            Configure Session
          </h1>
          <p className="mt-3 text-sm text-gray-400">
            Choose your practice mode and section
          </p>
        </div>

        {/* Mode Selection */}
        <div className="mb-8">
          <p className="mb-3 text-xs font-semibold uppercase tracking-widest text-gray-500">
            Select Mode
          </p>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            {MODE_OPTIONS.map((opt) => {
              const isActive = selectedMode === opt.mode;
              return (
                <button
                  key={opt.mode}
                  onClick={() => setSelectedMode(opt.mode)}
                  className={`group relative rounded-xl border p-5 text-left transition-all duration-200 ${
                    isActive
                      ? "border-indigo-500 bg-indigo-950/40 ring-1 ring-indigo-500/30"
                      : "border-gray-700/60 bg-gray-800/40 hover:border-gray-600 hover:bg-gray-800/70"
                  }`}
                >
                  <span className="mb-3 block text-2xl">{opt.icon}</span>
                  <p
                    className={`text-sm font-bold ${
                      isActive ? "text-indigo-300" : "text-gray-200"
                    }`}
                  >
                    {opt.title}
                  </p>
                  <p className="mt-1 text-xs text-gray-400">
                    {opt.description}
                  </p>
                  <p className="mt-2 text-xs font-medium text-gray-500">
                    {opt.detail}
                  </p>
                  {isActive && (
                    <span className="absolute right-3 top-3 text-indigo-400">
                      &#10003;
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Section Selector (for drill / section practice) */}
        {needsSection && (
          <div className="mb-8">
            <p className="mb-3 text-xs font-semibold uppercase tracking-widest text-gray-500">
              Section
            </p>
            <div className="relative">
              <select
                value={selectedSection}
                onChange={(e) =>
                  setSelectedSection(e.target.value as GmatSection)
                }
                className="w-full appearance-none rounded-xl border border-gray-700/60 bg-gray-800/60 px-4 py-3 text-sm font-medium text-gray-200 outline-none transition-colors focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/30"
              >
                {SECTION_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
              <span className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-gray-500">
                &#9662;
              </span>
            </div>
          </div>
        )}

        {/* Error */}
        {error && (
          <div className="mb-6 rounded-xl border border-red-500/30 bg-red-950/30 px-4 py-3 text-sm text-red-400">
            {error}
          </div>
        )}

        {/* Start Button */}
        <button
          onClick={handleStart}
          disabled={isStarting}
          className="w-full rounded-xl bg-indigo-600 px-6 py-4 text-base font-bold text-white shadow-lg shadow-indigo-500/20 transition-all duration-200 hover:bg-indigo-500 hover:shadow-indigo-500/30 disabled:cursor-not-allowed disabled:opacity-50 disabled:shadow-none"
        >
          {isStarting ? (
            <span className="inline-flex items-center gap-2">
              <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
              Creating session...
            </span>
          ) : (
            "Start Session"
          )}
        </button>

        {/* Dashboard link */}
        <div className="mt-6 text-center">
          <a
            href="/dashboard"
            className="text-xs text-indigo-400 underline hover:text-indigo-300"
          >
            View Dashboard &rarr;
          </a>
          <p className="mt-2 text-xs text-gray-600">
            Questions adapt in real-time to your ability level using IRT 3PL
          </p>
        </div>
      </div>
    </div>
  );
}
