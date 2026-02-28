/**
 * Gamification Business Logic
 *
 * XP awards, leveling, streak tracking, badge checking.
 */

// ---------------------------------------------------------------------------
// XP Constants
// ---------------------------------------------------------------------------

export const XP = {
  CORRECT_ANSWER: 10,
  HARD_CORRECT: 25,       // difficulty_b > 1.0
  STREAK_BONUS: 5,        // per streak day
  SESSION_COMPLETE: 50,
  FULL_EXAM_COMPLETE: 150,
  DAILY_LOGIN: 5,
  BOOKMARK_REVIEW: 3,
} as const;

// ---------------------------------------------------------------------------
// Level Thresholds
// ---------------------------------------------------------------------------

/** XP required to reach each level. Level N requires LEVEL_THRESHOLDS[N] total XP. */
const LEVEL_THRESHOLDS = [
  0,      // Level 1: 0 XP
  100,    // Level 2: 100 XP
  300,    // Level 3: 300 XP
  600,    // Level 4: 600 XP
  1000,   // Level 5: 1,000 XP
  1500,   // Level 6: 1,500 XP
  2200,   // Level 7: 2,200 XP
  3000,   // Level 8: 3,000 XP
  4000,   // Level 9: 4,000 XP
  5200,   // Level 10: 5,200 XP
  6500,   // Level 11: 6,500 XP
  8000,   // Level 12: 8,000 XP
  10000,  // Level 13: 10,000 XP
  12500,  // Level 14: 12,500 XP
  15500,  // Level 15: 15,500 XP
];

export function getLevel(xpTotal: number): number {
  let level = 1;
  for (let i = LEVEL_THRESHOLDS.length - 1; i >= 0; i--) {
    if (xpTotal >= LEVEL_THRESHOLDS[i]!) {
      level = i + 1;
      break;
    }
  }
  return level;
}

export function getXPForNextLevel(xpTotal: number): { current: number; needed: number; progress: number } {
  const level = getLevel(xpTotal);
  const currentThreshold = LEVEL_THRESHOLDS[level - 1] ?? 0;
  const nextThreshold = LEVEL_THRESHOLDS[level] ?? currentThreshold + 2000;
  const xpInLevel = xpTotal - currentThreshold;
  const xpNeeded = nextThreshold - currentThreshold;

  return {
    current: xpInLevel,
    needed: xpNeeded,
    progress: xpNeeded > 0 ? xpInLevel / xpNeeded : 1,
  };
}

// ---------------------------------------------------------------------------
// XP Calculation
// ---------------------------------------------------------------------------

export function calculateAnswerXP(isCorrect: boolean, difficultyB: number): number {
  if (!isCorrect) return 0;
  return difficultyB > 1.0 ? XP.HARD_CORRECT : XP.CORRECT_ANSWER;
}

export function calculateSessionXP(
  sessionType: "drill" | "section_practice" | "full_exam",
  correctCount: number,
  totalCount: number,
  streakDays: number,
): number {
  let xp = 0;

  // Base XP for answers (already awarded per-answer)
  // Session completion bonus
  xp += sessionType === "full_exam" ? XP.FULL_EXAM_COMPLETE : XP.SESSION_COMPLETE;

  // Streak bonus
  if (streakDays > 0) {
    xp += Math.min(streakDays, 30) * XP.STREAK_BONUS;
  }

  // Accuracy bonus: extra 20% if accuracy >= 70%
  const accuracy = totalCount > 0 ? correctCount / totalCount : 0;
  if (accuracy >= 0.7) {
    xp = Math.round(xp * 1.2);
  }

  return xp;
}

// ---------------------------------------------------------------------------
// Streak Logic
// ---------------------------------------------------------------------------

export function computeStreak(
  currentStreakDays: number,
  lastStreakDate: Date | null,
  now: Date = new Date(),
): { streakDays: number; streakLastDate: Date } {
  if (!lastStreakDate) {
    return { streakDays: 1, streakLastDate: now };
  }

  const today = stripTime(now);
  const lastDate = stripTime(lastStreakDate);
  const diffMs = today.getTime() - lastDate.getTime();
  const diffDays = Math.round(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays === 0) {
    // Same day — no change
    return { streakDays: currentStreakDays, streakLastDate: lastStreakDate };
  } else if (diffDays === 1) {
    // Consecutive day — increment
    return { streakDays: currentStreakDays + 1, streakLastDate: now };
  } else {
    // Streak broken — reset to 1
    return { streakDays: 1, streakLastDate: now };
  }
}

function stripTime(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate());
}

// ---------------------------------------------------------------------------
// Badge Definitions
// ---------------------------------------------------------------------------

export interface Badge {
  id: string;
  name: string;
  description: string;
  icon: string;
}

export const BADGE_DEFINITIONS: Badge[] = [
  { id: "first-session", name: "First Steps", description: "Complete your first session", icon: "footprints" },
  { id: "streak-3", name: "On a Roll", description: "3-day study streak", icon: "fire" },
  { id: "streak-7", name: "Week Warrior", description: "7-day study streak", icon: "calendar" },
  { id: "streak-30", name: "Monthly Master", description: "30-day study streak", icon: "trophy" },
  { id: "questions-100", name: "Century", description: "Answer 100 questions", icon: "target" },
  { id: "questions-500", name: "Scholar", description: "Answer 500 questions", icon: "book" },
  { id: "accuracy-80", name: "Sharp Shooter", description: "80%+ accuracy in a session (20+ questions)", icon: "bullseye" },
  { id: "score-600", name: "Contender", description: "Project a 600+ total score", icon: "star" },
  { id: "score-700", name: "Elite", description: "Project a 700+ total score", icon: "crown" },
  { id: "level-5", name: "Seasoned", description: "Reach Level 5", icon: "shield" },
  { id: "level-10", name: "Veteran", description: "Reach Level 10", icon: "gem" },
  { id: "full-exam", name: "Test Day Ready", description: "Complete a full practice exam", icon: "scroll" },
];

export function checkNewBadges(
  existingBadgeIds: string[],
  stats: {
    sessionsCompleted: number;
    streakDays: number;
    totalQuestions: number;
    sessionAccuracy?: number;
    sessionQuestionCount?: number;
    projectedScore?: number;
    level: number;
    sessionType?: string;
  },
): Badge[] {
  const existing = new Set(existingBadgeIds);
  const newBadges: Badge[] = [];

  const checks: [string, boolean][] = [
    ["first-session", stats.sessionsCompleted >= 1],
    ["streak-3", stats.streakDays >= 3],
    ["streak-7", stats.streakDays >= 7],
    ["streak-30", stats.streakDays >= 30],
    ["questions-100", stats.totalQuestions >= 100],
    ["questions-500", stats.totalQuestions >= 500],
    ["accuracy-80", (stats.sessionAccuracy ?? 0) >= 0.8 && (stats.sessionQuestionCount ?? 0) >= 20],
    ["score-600", (stats.projectedScore ?? 0) >= 600],
    ["score-700", (stats.projectedScore ?? 0) >= 700],
    ["level-5", stats.level >= 5],
    ["level-10", stats.level >= 10],
    ["full-exam", stats.sessionType === "full_exam"],
  ];

  for (const [badgeId, earned] of checks) {
    if (earned && !existing.has(badgeId)) {
      const badge = BADGE_DEFINITIONS.find((b) => b.id === badgeId);
      if (badge) newBadges.push(badge);
    }
  }

  return newBadges;
}
