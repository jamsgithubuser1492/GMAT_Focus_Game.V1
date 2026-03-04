"use client";

import { useEffect, useState } from "react";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface UserStats {
  totalScore: number | null;
  level: number;
  xp: number;
  streakDays: number;
  sessionsPlayed: number;
}

// ---------------------------------------------------------------------------
// LandingPage
//
// The opening screen users see when first visiting the app. Shows:
//  1. Hero section with branding and primary CTA
//  2. Three feature highlight cards
//  3. Returning-user stats bar (if they have prior sessions)
// ---------------------------------------------------------------------------

interface LandingPageProps {
  onStart: () => void;
}

export default function LandingPage({ onStart }: LandingPageProps) {
  const [stats, setStats] = useState<UserStats | null>(null);
  const [isReturningUser, setIsReturningUser] = useState(false);

  // Check if this is a returning user and load their stats
  useEffect(() => {
    const userId = localStorage.getItem("gmat_user_id");
    if (!userId || userId === "local-player") return;

    setIsReturningUser(true);

    fetch(`/api/dashboard?userId=${userId}`)
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data) {
          setStats({
            totalScore: data.scoreHistory?.[0]?.totalScore ?? null,
            level: data.gamification?.level ?? 1,
            xp: data.gamification?.totalXP ?? 0,
            streakDays: data.gamification?.streakDays ?? 0,
            sessionsPlayed: data.stats?.totalSessions ?? 0,
          });
        }
      })
      .catch(() => {
        /* non-critical */
      });
  }, []);

  return (
    <div className="flex min-h-screen flex-col">
      {/* ----------------------------------------------------------------- */}
      {/* Nav Bar */}
      {/* ----------------------------------------------------------------- */}
      <nav className="border-b border-gray-800/60 bg-gray-950/80 backdrop-blur">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-4 sm:px-6">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-indigo-600 text-lg font-black text-white">
              G
            </div>
            <span className="text-sm font-bold tracking-tight text-gray-100">
              GMAT Focus
            </span>
          </div>
          {isReturningUser && (
            <a
              href="/dashboard"
              className="rounded-lg border border-gray-700 bg-gray-800/60 px-3 py-1.5 text-xs font-medium text-gray-300 transition-colors hover:bg-gray-700"
            >
              Dashboard
            </a>
          )}
        </div>
      </nav>

      {/* ----------------------------------------------------------------- */}
      {/* Hero */}
      {/* ----------------------------------------------------------------- */}
      <section className="flex flex-1 flex-col items-center justify-center px-4 py-16 sm:py-24">
        <div className="mx-auto max-w-2xl text-center">
          {/* Badge */}
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-indigo-500/30 bg-indigo-950/40 px-4 py-1.5">
            <span className="h-1.5 w-1.5 rounded-full bg-indigo-400 animate-pulse" />
            <span className="text-xs font-medium text-indigo-300">
              Adaptive IRT 3PL Engine
            </span>
          </div>

          {/* Heading */}
          <h1 className="text-4xl font-extrabold tracking-tight text-gray-100 sm:text-5xl lg:text-6xl">
            Master the{" "}
            <span className="bg-gradient-to-r from-indigo-400 via-purple-400 to-indigo-400 bg-clip-text text-transparent">
              GMAT Focus
            </span>
          </h1>

          <p className="mx-auto mt-5 max-w-lg text-base leading-relaxed text-gray-400 sm:text-lg">
            An adaptive learning platform that adjusts to your ability in
            real-time. Every question is selected to maximize your score growth.
          </p>

          {/* Target badge */}
          <div className="mt-6 inline-flex items-center gap-3 rounded-xl border border-gray-700/50 bg-gray-800/50 px-5 py-3">
            <div className="text-center">
              <p className="text-2xl font-extrabold text-indigo-400">705+</p>
              <p className="text-[10px] font-medium uppercase tracking-widest text-gray-500">
                Target Score
              </p>
            </div>
            <div className="h-8 w-px bg-gray-700" />
            <div className="text-center">
              <p className="text-2xl font-extrabold text-purple-400">98.6%</p>
              <p className="text-[10px] font-medium uppercase tracking-widest text-gray-500">
                Percentile
              </p>
            </div>
          </div>

          {/* CTA Buttons */}
          <div className="mt-10 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
            <button
              onClick={onStart}
              className="w-full rounded-xl bg-indigo-600 px-8 py-4 text-base font-bold text-white shadow-lg shadow-indigo-500/25 transition-all duration-200 hover:bg-indigo-500 hover:shadow-indigo-500/40 hover:scale-[1.02] active:scale-[0.98] sm:w-auto"
            >
              {isReturningUser ? "Continue Practicing" : "Start Practicing"}
            </button>
            {isReturningUser && (
              <a
                href="/dashboard"
                className="w-full rounded-xl border border-gray-700 bg-gray-800/60 px-8 py-4 text-center text-base font-semibold text-gray-300 transition-colors hover:bg-gray-700 sm:w-auto"
              >
                View Progress
              </a>
            )}
          </div>
        </div>

        {/* ----------------------------------------------------------------- */}
        {/* Returning User Stats Bar */}
        {/* ----------------------------------------------------------------- */}
        {stats && (
          <div className="mx-auto mt-12 w-full max-w-lg">
            <div className="rounded-xl border border-gray-700/50 bg-gray-800/30 px-6 py-4">
              <p className="mb-3 text-center text-[10px] font-semibold uppercase tracking-widest text-gray-500">
                Welcome Back
              </p>
              <div className="grid grid-cols-4 gap-4 text-center">
                <div>
                  <p className="text-lg font-bold text-gray-100">
                    {stats.totalScore ?? "---"}
                  </p>
                  <p className="text-[10px] text-gray-500">Last Score</p>
                </div>
                <div>
                  <p className="text-lg font-bold text-indigo-400">
                    Lv.{stats.level}
                  </p>
                  <p className="text-[10px] text-gray-500">Level</p>
                </div>
                <div>
                  <p className="text-lg font-bold text-amber-400">
                    {stats.streakDays}d
                  </p>
                  <p className="text-[10px] text-gray-500">Streak</p>
                </div>
                <div>
                  <p className="text-lg font-bold text-emerald-400">
                    {stats.sessionsPlayed}
                  </p>
                  <p className="text-[10px] text-gray-500">Sessions</p>
                </div>
              </div>
            </div>
          </div>
        )}
      </section>

      {/* ----------------------------------------------------------------- */}
      {/* Feature Cards */}
      {/* ----------------------------------------------------------------- */}
      <section className="border-t border-gray-800/60 bg-gray-900/30 px-4 py-16 sm:py-20">
        <div className="mx-auto max-w-5xl">
          <h2 className="mb-10 text-center text-sm font-semibold uppercase tracking-widest text-gray-500">
            How It Works
          </h2>
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-3">
            {FEATURES.map((f) => (
              <div
                key={f.title}
                className="rounded-xl border border-gray-700/40 bg-gray-800/30 p-6 transition-colors hover:border-gray-600/60 hover:bg-gray-800/50"
              >
                <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-lg bg-gray-700/50 text-xl">
                  {f.icon}
                </div>
                <h3 className="mb-2 text-sm font-bold text-gray-200">
                  {f.title}
                </h3>
                <p className="text-xs leading-relaxed text-gray-400">
                  {f.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ----------------------------------------------------------------- */}
      {/* Footer */}
      {/* ----------------------------------------------------------------- */}
      <footer className="border-t border-gray-800/40 px-4 py-6">
        <p className="text-center text-[10px] text-gray-600">
          GMAT Focus Command Center &middot; Adaptive Learning Platform
        </p>
      </footer>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Feature card data
// ---------------------------------------------------------------------------

const FEATURES = [
  {
    icon: "\uD83E\uDDE0",
    title: "Adaptive Question Selection",
    description:
      "IRT 3PL models pick the question that maximizes information at your current ability level. Fisher information scoring ensures every question counts.",
  },
  {
    icon: "\uD83D\uDD04",
    title: "Spaced Repetition",
    description:
      "Skills you haven't practiced recently get a decay-weighted boost, so the engine automatically resurfaces knowledge before it fades.",
  },
  {
    icon: "\uD83D\uDCC8",
    title: "Real-Time Score Tracking",
    description:
      "Watch your estimated GMAT score update after every answer. Section scores, theta values, and accuracy are all tracked live.",
  },
];
