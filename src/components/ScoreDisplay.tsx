"use client";

import { useExamSessionStore } from "@/stores/exam-session-store";
import type { GmatSection } from "@/lib/tutor-engine/types";

const SECTION_META: Record<
  GmatSection,
  { label: string; short: string; barColor: string; bgColor: string }
> = {
  quantitative: {
    label: "Quantitative",
    short: "Q",
    barColor: "bg-blue-500",
    bgColor: "bg-blue-500/10",
  },
  verbal: {
    label: "Verbal",
    short: "V",
    barColor: "bg-emerald-500",
    bgColor: "bg-emerald-500/10",
  },
  data_insights: {
    label: "Data Insights",
    short: "DI",
    barColor: "bg-purple-500",
    bgColor: "bg-purple-500/10",
  },
};

function thetaToSectionScore(theta: number): number {
  const raw = 75 + theta * 5;
  return Math.round(Math.max(60, Math.min(90, raw)));
}

function computeTotalScore(sectionThetas: Record<GmatSection, number>): number {
  const sections: GmatSection[] = ["quantitative", "verbal", "data_insights"];
  const sectionScores = sections.map((s) => thetaToSectionScore(sectionThetas[s]));
  const sectionSum = sectionScores.reduce((a, b) => a + b, 0);
  const raw = 205 + ((sectionSum - 180) * 600) / 90;
  const clamped = Math.max(205, Math.min(805, raw));
  return Math.round(clamped / 5) * 5;
}

interface ScoreDisplayProps {
  compact?: boolean;
}

export default function ScoreDisplay({ compact = false }: ScoreDisplayProps) {
  const sectionThetas = useExamSessionStore((s) => s.sectionThetas);
  const attempts = useExamSessionStore((s) => s.attempts);

  const sections: GmatSection[] = ["quantitative", "verbal", "data_insights"];
  const totalScore = computeTotalScore(sectionThetas);
  const totalAttempts = attempts.length;
  const correctAttempts = attempts.filter((a) => a.isCorrect).length;
  const accuracy = totalAttempts > 0 ? Math.round((correctAttempts / totalAttempts) * 100) : 0;

  if (compact) {
    return (
      <div className="flex items-center gap-4">
        {/* Compact total score */}
        <div className="flex items-center gap-2 rounded-full border border-gray-700 bg-gray-800/80 px-4 py-1.5">
          <span className="text-xs font-medium text-gray-400">Score</span>
          <span className="font-mono text-sm font-bold text-gray-100">
            {totalScore}
          </span>
        </div>

        {/* Compact section pills */}
        {sections.map((sec) => {
          const meta = SECTION_META[sec];
          const score = thetaToSectionScore(sectionThetas[sec]);
          return (
            <div
              key={sec}
              className={`flex items-center gap-1.5 rounded-full border border-gray-700/50 px-3 py-1 ${meta.bgColor}`}
            >
              <span className="text-xs font-bold text-gray-300">
                {meta.short}
              </span>
              <span className="font-mono text-xs font-semibold text-gray-200">
                {score}
              </span>
            </div>
          );
        })}

        {/* Accuracy */}
        {totalAttempts > 0 && (
          <div className="flex items-center gap-1.5 rounded-full border border-gray-700/50 bg-gray-800/60 px-3 py-1">
            <span className="text-xs text-gray-400">
              {correctAttempts}/{totalAttempts}
            </span>
            <span className="text-xs font-semibold text-gray-300">
              ({accuracy}%)
            </span>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-gray-800 bg-gray-900/80 p-6 shadow-xl backdrop-blur sm:p-8">
      {/* Total Score */}
      <div className="mb-8 text-center">
        <p className="mb-1 text-xs font-semibold uppercase tracking-widest text-gray-500">
          Estimated Total Score
        </p>
        <p className="text-5xl font-extrabold tracking-tight text-gray-100">
          {totalScore}
        </p>
        <p className="mt-1 text-sm text-gray-500">out of 805</p>
      </div>

      {/* Section Bars */}
      <div className="mb-8 space-y-5">
        {sections.map((sec) => {
          const meta = SECTION_META[sec];
          const theta = sectionThetas[sec];
          const score = thetaToSectionScore(theta);
          // Map score 60-90 to percentage 0-100
          const pct = Math.max(0, Math.min(100, ((score - 60) / 30) * 100));

          return (
            <div key={sec}>
              <div className="mb-1.5 flex items-center justify-between">
                <span className="text-sm font-medium text-gray-300">
                  {meta.label}
                </span>
                <span className="font-mono text-sm font-bold text-gray-200">
                  {score}
                </span>
              </div>
              <div className="h-3 w-full overflow-hidden rounded-full bg-gray-800">
                <div
                  className={`h-full rounded-full transition-all duration-500 ${meta.barColor}`}
                  style={{ width: `${pct}%` }}
                />
              </div>
              <p className="mt-1 text-right text-xs text-gray-500">
                theta: {theta.toFixed(2)}
              </p>
            </div>
          );
        })}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        <div className="rounded-xl border border-gray-700/50 bg-gray-800/40 p-4 text-center">
          <p className="text-2xl font-bold text-gray-100">{totalAttempts}</p>
          <p className="mt-0.5 text-xs text-gray-500">Answered</p>
        </div>
        <div className="rounded-xl border border-gray-700/50 bg-gray-800/40 p-4 text-center">
          <p className="text-2xl font-bold text-emerald-400">{correctAttempts}</p>
          <p className="mt-0.5 text-xs text-gray-500">Correct</p>
        </div>
        <div className="rounded-xl border border-gray-700/50 bg-gray-800/40 p-4 text-center">
          <p className="text-2xl font-bold text-indigo-400">{accuracy}%</p>
          <p className="mt-0.5 text-xs text-gray-500">Accuracy</p>
        </div>
      </div>
    </div>
  );
}
