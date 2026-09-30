import { MAX_DAILY_SCORE } from "@/lib/constants";
import { addDaysISO, type ISODate } from "@/lib/dates";
import { toNumber } from "@/lib/finance";
import type { DailySeriesRow } from "@/types/database";

/** A normalised day from daily_series() — every value is a number. */
export interface DayMetrics {
  day: ISODate;
  score: number;
  workouts: number;
  workoutMinutes: number;
  learningMinutes: number;
  prospectsContacted: number;
  outreachLogged: number;
  followupsDone: number;
  outreachActions: number;
  replies: number;
  clientsWon: number;
  wonValue: number;
  workMinutes: number;
  workEarned: number;
  postsPublished: number;
  income: number;
  expenses: number;
  savings: number;
}

export function normalizeSeries(rows: readonly DailySeriesRow[] | null | undefined): DayMetrics[] {
  return (rows ?? []).map((r) => ({
    day: r.day,
    score: toNumber(r.score),
    workouts: toNumber(r.workouts),
    workoutMinutes: toNumber(r.workout_minutes),
    learningMinutes: toNumber(r.learning_minutes),
    prospectsContacted: toNumber(r.prospects_contacted),
    outreachLogged: toNumber(r.outreach_logged),
    followupsDone: toNumber(r.followups_done),
    outreachActions: toNumber(r.outreach_actions),
    replies: toNumber(r.replies),
    clientsWon: toNumber(r.clients_won),
    wonValue: toNumber(r.won_value),
    workMinutes: toNumber(r.work_minutes),
    workEarned: toNumber(r.work_earned),
    postsPublished: toNumber(r.posts_published),
    income: toNumber(r.income),
    expenses: toNumber(r.expenses),
    savings: toNumber(r.savings),
  }));
}

export interface PeriodTotals {
  days: number;
  workouts: number;
  workoutMinutes: number;
  learningMinutes: number;
  outreachActions: number;
  prospectsContacted: number;
  replies: number;
  clientsWon: number;
  wonValue: number;
  workMinutes: number;
  workEarned: number;
  postsPublished: number;
  income: number;
  expenses: number;
  savings: number;
  scoreSum: number;
  /** Mean daily score over every day in the range (untracked days count as 0). */
  averageScore: number;
  /** averageScore as a percentage of 7. */
  completionRate: number;
  successfulDays: number;
  perfectDays: number;
}

const MONEY_KEYS = ["wonValue", "workEarned", "income", "expenses", "savings"] as const;
const COUNT_KEYS = [
  "workouts", "workoutMinutes", "learningMinutes", "outreachActions", "prospectsContacted",
  "replies", "clientsWon", "workMinutes", "postsPublished",
] as const;

/** Totals for days in [from, to] (inclusive). */
export function totalsForRange(
  series: readonly DayMetrics[],
  from: ISODate,
  to: ISODate,
  successThreshold: number,
): PeriodTotals {
  const days = series.filter((d) => d.day >= from && d.day <= to);
  const totals = {} as Record<(typeof COUNT_KEYS)[number] | (typeof MONEY_KEYS)[number], number>;
  for (const k of COUNT_KEYS) totals[k] = days.reduce((acc, d) => acc + d[k], 0);
  for (const k of MONEY_KEYS) totals[k] = days.reduce((acc, d) => acc + Math.round(d[k] * 100), 0) / 100;

  const scoreSum = days.reduce((acc, d) => acc + d.score, 0);
  const averageScore = days.length ? Math.round((scoreSum / days.length) * 10) / 10 : 0;
  return {
    days: days.length,
    ...totals,
    scoreSum,
    averageScore,
    completionRate: days.length ? Math.round((scoreSum / (days.length * MAX_DAILY_SCORE)) * 100) : 0,
    successfulDays: days.filter((d) => d.score >= successThreshold).length,
    perfectDays: days.filter((d) => d.score >= MAX_DAILY_SCORE).length,
  };
}

export function dayFromSeries(series: readonly DayMetrics[], day: ISODate): DayMetrics | undefined {
  return series.find((d) => d.day === day);
}

/** The trailing `count` days ending at `end`, filling gaps with empty days. */
export function lastNDays(series: readonly DayMetrics[], end: ISODate, count: number): DayMetrics[] {
  const byDay = new Map(series.map((d) => [d.day, d]));
  const out: DayMetrics[] = [];
  for (let i = count - 1; i >= 0; i--) {
    const day = addDaysISO(end, -i);
    out.push(byDay.get(day) ?? emptyDay(day));
  }
  return out;
}

export function emptyDay(day: ISODate): DayMetrics {
  return {
    day, score: 0, workouts: 0, workoutMinutes: 0, learningMinutes: 0, prospectsContacted: 0,
    outreachLogged: 0, followupsDone: 0, outreachActions: 0, replies: 0, clientsWon: 0, wonValue: 0,
    workMinutes: 0, workEarned: 0, postsPublished: 0, income: 0, expenses: 0, savings: 0,
  };
}
