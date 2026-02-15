"use client";

import { useEffect } from "react";
import { useExamSessionStore } from "@/stores/exam-session-store";

export default function Timer() {
  const remainingTimeMs = useExamSessionStore((s) => s.remainingTimeMs);
  const isTimerRunning = useExamSessionStore((s) => s.isTimerRunning);
  const tickTimer = useExamSessionStore((s) => s.tickTimer);

  useEffect(() => {
    if (!isTimerRunning) return;

    const interval = setInterval(() => {
      tickTimer(1000);
    }, 1000);

    return () => clearInterval(interval);
  }, [isTimerRunning, tickTimer]);

  const totalSeconds = Math.max(0, Math.ceil(remainingTimeMs / 1000));
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  const formatted = `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;

  const isWarning = remainingTimeMs < 5 * 60 * 1000;
  const isCritical = remainingTimeMs < 1 * 60 * 1000;

  let colorClasses = "text-gray-100 border-gray-700 bg-gray-800/80";
  if (isCritical) {
    colorClasses = "text-red-400 border-red-500/50 bg-red-950/60 animate-pulse";
  } else if (isWarning) {
    colorClasses = "text-amber-400 border-amber-500/50 bg-amber-950/40";
  }

  return (
    <div
      className={`inline-flex items-center gap-2 rounded-full border px-4 py-1.5 font-mono text-sm font-semibold tracking-wider transition-colors duration-300 ${colorClasses}`}
    >
      <span className="text-base leading-none" aria-hidden="true">
        &#9201;
      </span>
      <span>{formatted}</span>
    </div>
  );
}
