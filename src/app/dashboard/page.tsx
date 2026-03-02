"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface LevelProgress {
  current: number;
  needed: number;
  progress: number;
}

interface DashboardData {
  user: {
    id: string;
    displayName: string;
    email: string;
    targetScore: number;
    testDate: string | null;
  };
  gamification: {
    xpTotal: number;
    level: number;
    levelProgress: LevelProgress;
    streakDays: number;
    streakLastDate: string | null;
    vaultUnlocked: boolean;
    badges: { id: string; name: string; earnedAt?: string }[];
  } | null;
  scoreHistory: {
    date: string;
    sessionType: string;
    totalScore: number | null;
    quantScore: number | null;
    verbalScore: number | null;
    diScore: number | null;
  }[];
  skills: {
    skillNodeId: string;
    name: string;
    section: string;
    tier: number;
    theta: number;
    attempts: number;
    correct: number;
    accuracy: number;
    lastPracticed: string | null;
    decayFactor: number;
  }[];
  stats: {
    totalSessions: number;
    totalAttempts: number;
    correctAttempts: number;
    overallAccuracy: number;
    latestScore: number | null;
  };
  recentActivity: {
    id: string;
    isCorrect: boolean;
    section: string;
    questionType: string;
    difficulty: number;
    thetaChange: number;
    timeSpent: number;
    createdAt: string;
  }[];
}

// ---------------------------------------------------------------------------
// Helper Components
// ---------------------------------------------------------------------------

function StatCard({ label, value, sub }: { label: string; value: string | number; sub?: string }) {
  return (
    <div className="rounded-xl border border-gray-800 bg-gray-900/60 px-4 py-3">
      <p className="text-xs font-medium uppercase tracking-wider text-gray-500">{label}</p>
      <p className="mt-1 text-2xl font-bold text-gray-100">{value}</p>
      {sub && <p className="mt-0.5 text-xs text-gray-400">{sub}</p>}
    </div>
  );
}

function XPBar({ levelProgress, level }: { levelProgress: LevelProgress; level: number }) {
  const pct = Math.min(levelProgress.progress * 100, 100);
  return (
    <div className="rounded-xl border border-gray-800 bg-gray-900/60 px-4 py-3">
      <div className="flex items-center justify-between">
        <p className="text-xs font-medium uppercase tracking-wider text-gray-500">Level {level}</p>
        <p className="text-xs text-gray-400">
          {levelProgress.current} / {levelProgress.needed} XP
        </p>
      </div>
      <div className="mt-2 h-2.5 w-full overflow-hidden rounded-full bg-gray-800">
        <div
          className="h-full rounded-full bg-gradient-to-r from-indigo-500 to-purple-500 transition-all duration-500"
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}

function SkillBar({ name, theta, accuracy, attempts, section }: {
  name: string;
  theta: number;
  accuracy: number;
  attempts: number;
  section: string;
}) {
  const pct = Math.max(0, Math.min(100, ((theta + 3) / 6) * 100));
  const colorMap: Record<string, string> = {
    quantitative: "from-blue-500 to-blue-400",
    verbal: "from-emerald-500 to-emerald-400",
    data_insights: "from-purple-500 to-purple-400",
  };
  const barColor = colorMap[section] ?? "from-gray-500 to-gray-400";

  return (
    <div className="flex items-center gap-3 py-1.5">
      <div className="w-40 truncate text-xs text-gray-300" title={name}>{name}</div>
      <div className="flex-1">
        <div className="h-2 w-full overflow-hidden rounded-full bg-gray-800">
          <div
            className={`h-full rounded-full bg-gradient-to-r ${barColor} transition-all duration-300`}
            style={{ width: `${pct}%` }}
          />
        </div>
      </div>
      <div className="w-16 text-right text-xs text-gray-400">
        {attempts > 0 ? `${Math.round(accuracy * 100)}%` : "--"}
      </div>
    </div>
  );
}

function ScoreChart({ history }: { history: DashboardData["scoreHistory"] }) {
  if (history.length === 0) {
    return (
      <div className="flex h-48 items-center justify-center rounded-xl border border-gray-800 bg-gray-900/60 text-sm text-gray-500">
        No completed sessions yet. Start playing to see your score trend!
      </div>
    );
  }

  const scores = history.filter((h) => h.totalScore != null).map((h) => h.totalScore!);
  const minScore = Math.min(...scores, 205);
  const maxScore = Math.max(...scores, 805);
  const range = maxScore - minScore || 1;

  return (
    <div className="rounded-xl border border-gray-800 bg-gray-900/60 p-4">
      <h3 className="mb-3 text-sm font-semibold text-gray-300">Score History</h3>
      <div className="flex h-40 items-end gap-1">
        {history.map((entry, i) => {
          const score = entry.totalScore ?? 0;
          const height = ((score - minScore) / range) * 100;
          const typeColor =
            entry.sessionType === "full_exam"
              ? "bg-amber-500"
              : entry.sessionType === "section_practice"
                ? "bg-indigo-500"
                : "bg-gray-500";

          return (
            <div key={i} className="group relative flex flex-1 flex-col items-center">
              <div
                className={`w-full max-w-8 rounded-t ${typeColor} transition-all hover:opacity-80`}
                style={{ height: `${Math.max(height, 4)}%` }}
              />
              <div className="absolute -top-8 hidden rounded bg-gray-800 px-2 py-1 text-xs text-gray-200 shadow-lg group-hover:block">
                {score}
              </div>
            </div>
          );
        })}
      </div>
      <div className="mt-2 flex justify-between text-xs text-gray-500">
        <span>{history[0]?.date ? new Date(history[0].date).toLocaleDateString() : ""}</span>
        <span>
          {history[history.length - 1]?.date
            ? new Date(history[history.length - 1]!.date).toLocaleDateString()
            : ""}
        </span>
      </div>
    </div>
  );
}

function BadgeGrid({ badges }: { badges: DashboardData["gamification"] extends null ? never : NonNullable<DashboardData["gamification"]>["badges"] }) {
  if (badges.length === 0) {
    return (
      <p className="text-sm text-gray-500">No badges earned yet. Keep playing!</p>
    );
  }

  return (
    <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
      {badges.map((badge) => (
        <div
          key={badge.id}
          className="rounded-lg border border-gray-700 bg-gray-800/50 px-3 py-2 text-center"
        >
          <p className="text-sm font-semibold text-gray-200">{badge.name}</p>
          {badge.earnedAt && (
            <p className="mt-0.5 text-xs text-gray-500">
              {new Date(badge.earnedAt).toLocaleDateString()}
            </p>
          )}
        </div>
      ))}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main Dashboard Page
// ---------------------------------------------------------------------------

export default function DashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadDashboard = useCallback(async () => {
    // Get userId from localStorage (set during session creation)
    const userId = localStorage.getItem("gmat_user_id");
    if (!userId) {
      setError("No user found. Start a game session first to create your profile.");
      setLoading(false);
      return;
    }

    try {
      const res = await fetch(`/api/dashboard?userId=${userId}`);
      if (!res.ok) {
        throw new Error(`Failed to load dashboard: ${res.status}`);
      }
      const json = await res.json();
      setData(json);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadDashboard();
  }, [loadDashboard]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-gray-600 border-t-indigo-500" />
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 px-4">
        <p className="text-sm text-red-400">{error ?? "No data available"}</p>
        <Link href="/" className="text-sm text-indigo-400 underline hover:text-indigo-300">
          Back to Game
        </Link>
      </div>
    );
  }

  const { user, gamification, scoreHistory, skills, stats } = data;

  // Group skills by section
  const skillsBySection = {
    quantitative: skills.filter((s) => s.section === "quantitative"),
    verbal: skills.filter((s) => s.section === "verbal"),
    data_insights: skills.filter((s) => s.section === "data_insights"),
  };

  const sectionLabels: Record<string, string> = {
    quantitative: "Quantitative",
    verbal: "Verbal",
    data_insights: "Data Insights",
  };

  return (
    <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6">
      {/* Header */}
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight text-gray-100">
            {user.displayName}&apos;s Dashboard
          </h1>
          <p className="mt-1 text-sm text-gray-400">
            Target: {user.targetScore}
            {user.testDate && <> &middot; Test: {new Date(user.testDate).toLocaleDateString()}</>}
          </p>
        </div>
        <Link
          href="/"
          className="rounded-lg border border-gray-700 bg-gray-800 px-4 py-2 text-sm text-gray-200 transition hover:bg-gray-700"
        >
          Play
        </Link>
      </div>

      {/* Gamification Overview */}
      {gamification && (
        <section className="mb-8">
          <div className="mb-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
            <StatCard label="Total XP" value={gamification.xpTotal.toLocaleString()} />
            <StatCard
              label="Streak"
              value={`${gamification.streakDays} day${gamification.streakDays !== 1 ? "s" : ""}`}
            />
            <StatCard
              label="Latest Score"
              value={stats.latestScore ?? "--"}
              sub={stats.latestScore ? `of ${user.targetScore} target` : undefined}
            />
            <StatCard
              label="Accuracy"
              value={stats.totalAttempts > 0 ? `${Math.round(stats.overallAccuracy * 100)}%` : "--"}
              sub={`${stats.correctAttempts}/${stats.totalAttempts} correct`}
            />
          </div>

          <XPBar levelProgress={gamification.levelProgress} level={gamification.level} />
        </section>
      )}

      {/* Score History Chart */}
      <section className="mb-8">
        <ScoreChart history={scoreHistory} />
      </section>

      {/* Skill Breakdown */}
      <section className="mb-8">
        <h2 className="mb-4 text-lg font-bold text-gray-200">Skill Breakdown</h2>
        {Object.entries(skillsBySection).map(([section, sectionSkills]) => (
          <div key={section} className="mb-4">
            <h3 className="mb-2 text-sm font-semibold text-gray-400">
              {sectionLabels[section]}
            </h3>
            <div className="rounded-xl border border-gray-800 bg-gray-900/60 px-4 py-2">
              {sectionSkills.length === 0 ? (
                <p className="py-2 text-xs text-gray-500">No data yet</p>
              ) : (
                sectionSkills.map((skill) => (
                  <SkillBar
                    key={skill.skillNodeId}
                    name={skill.name}
                    theta={skill.theta}
                    accuracy={skill.accuracy}
                    attempts={skill.attempts}
                    section={section}
                  />
                ))
              )}
            </div>
          </div>
        ))}
      </section>

      {/* Badges */}
      {gamification && (
        <section className="mb-8">
          <h2 className="mb-4 text-lg font-bold text-gray-200">Badges</h2>
          <BadgeGrid badges={gamification.badges} />
        </section>
      )}

      {/* Session Stats */}
      <section>
        <h2 className="mb-4 text-lg font-bold text-gray-200">Session History</h2>
        {scoreHistory.length === 0 ? (
          <p className="text-sm text-gray-500">No completed sessions yet.</p>
        ) : (
          <div className="overflow-hidden rounded-xl border border-gray-800">
            <table className="w-full text-left text-sm">
              <thead className="bg-gray-900/80 text-xs text-gray-400">
                <tr>
                  <th className="px-4 py-2">Date</th>
                  <th className="px-4 py-2">Type</th>
                  <th className="px-4 py-2 text-right">Total</th>
                  <th className="px-4 py-2 text-right">Q</th>
                  <th className="px-4 py-2 text-right">V</th>
                  <th className="px-4 py-2 text-right">DI</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-800">
                {[...scoreHistory].reverse().map((s, i) => (
                  <tr key={i} className="text-gray-300">
                    <td className="px-4 py-2 text-xs">{new Date(s.date).toLocaleDateString()}</td>
                    <td className="px-4 py-2 text-xs capitalize">{s.sessionType.replace("_", " ")}</td>
                    <td className="px-4 py-2 text-right font-semibold">{s.totalScore ?? "--"}</td>
                    <td className="px-4 py-2 text-right">{s.quantScore ?? "--"}</td>
                    <td className="px-4 py-2 text-right">{s.verbalScore ?? "--"}</td>
                    <td className="px-4 py-2 text-right">{s.diScore ?? "--"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
