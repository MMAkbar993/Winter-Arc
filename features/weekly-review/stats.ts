import type { PeriodTotals } from "@/lib/series";

/** Snapshot stored with each weekly review (weekly_reviews.stats). */
export interface WeeklyStats {
  averageScore: number;
  workouts: number;
  learningMinutes: number;
  outreachActions: number;
  replies: number;
  clientsWon: number;
  workMinutes: number;
  postsPublished: number;
  income: number;
  expenses: number;
  savings: number;
}

export function weeklyStatsFromTotals(t: PeriodTotals): WeeklyStats {
  return {
    averageScore: t.averageScore,
    workouts: t.workouts,
    learningMinutes: t.learningMinutes,
    outreachActions: t.outreachActions,
    replies: t.replies,
    clientsWon: t.clientsWon,
    workMinutes: t.workMinutes,
    postsPublished: t.postsPublished,
    income: t.income,
    expenses: t.expenses,
    savings: t.savings,
  };
}

/** Reads a stored snapshot defensively (older rows may miss fields). */
export function parseWeeklyStats(value: unknown): WeeklyStats | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  const v = value as Record<string, unknown>;
  const n = (k: keyof WeeklyStats) => (typeof v[k] === "number" ? (v[k] as number) : 0);
  return {
    averageScore: n("averageScore"),
    workouts: n("workouts"),
    learningMinutes: n("learningMinutes"),
    outreachActions: n("outreachActions"),
    replies: n("replies"),
    clientsWon: n("clientsWon"),
    workMinutes: n("workMinutes"),
    postsPublished: n("postsPublished"),
    income: n("income"),
    expenses: n("expenses"),
    savings: n("savings"),
  };
}
