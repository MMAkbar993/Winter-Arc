import { HABIT_KEYS, MAX_DAILY_SCORE, type HabitKey } from "@/lib/constants";
import { addDaysISO, diffDaysISO, minISO, type ISODate } from "@/lib/dates";

export interface HabitState {
  habit_key: HabitKey;
  completed: boolean;
}

/** One point per completed habit, only counting each of the seven habits once. */
export function calculateDailyScore(habits: readonly HabitState[]): number {
  const done = new Set<HabitKey>();
  for (const h of habits) {
    if (h.completed && HABIT_KEYS.includes(h.habit_key)) done.add(h.habit_key);
  }
  return Math.min(done.size, MAX_DAILY_SCORE);
}

/** 7/7 → 100, 6/7 → 86, 5/7 → 71, 4/7 → 57 */
export function scorePercent(score: number, max: number = MAX_DAILY_SCORE): number {
  if (max <= 0) return 0;
  const clamped = Math.min(Math.max(score, 0), max);
  return Math.round((clamped / max) * 100);
}

/** Heatmap intensity bucket: 0 empty · 1 (1–2) · 2 (3–4) · 3 (5–6) · 4 (7). */
export type Intensity = 0 | 1 | 2 | 3 | 4;
export function intensityForScore(score: number): Intensity {
  if (score <= 0) return 0;
  if (score <= 2) return 1;
  if (score <= 4) return 2;
  if (score < MAX_DAILY_SCORE) return 3;
  return 4;
}

export type ScoreMap = ReadonlyMap<ISODate, number>;

export interface StreakInput {
  scores: ScoreMap;
  today: ISODate;
  challengeStart: ISODate;
  challengeEnd: ISODate;
  threshold: number;
}

export interface StreakResult {
  current: number;
  longest: number;
  successfulDays: number;
  perfectDays: number;
}

/**
 * Streaks over the challenge window.
 *  - Only days from challengeStart through min(today, challengeEnd) count; the
 *    future is never counted.
 *  - A day is successful when its score >= threshold.
 *  - Today is still "in progress": if it is not yet successful it does not
 *    break the current streak (the streak runs through yesterday).
 */
export function calculateStreaks({ scores, today, challengeStart, challengeEnd, threshold }: StreakInput): StreakResult {
  const lastDay = minISO(today, challengeEnd);
  if (lastDay < challengeStart) return { current: 0, longest: 0, successfulDays: 0, perfectDays: 0 };

  const isSuccess = (d: ISODate) => (scores.get(d) ?? 0) >= threshold;
  const totalDays = diffDaysISO(lastDay, challengeStart) + 1;

  let longest = 0;
  let run = 0;
  let successfulDays = 0;
  let perfectDays = 0;
  for (let i = 0; i < totalDays; i++) {
    const day = addDaysISO(challengeStart, i);
    const score = scores.get(day) ?? 0;
    if (score >= MAX_DAILY_SCORE) perfectDays++;
    if (score >= threshold) {
      successfulDays++;
      run++;
      longest = Math.max(longest, run);
    } else {
      run = 0;
    }
  }

  let cursor = lastDay;
  if (cursor === today && !isSuccess(cursor)) cursor = addDaysISO(cursor, -1);
  let current = 0;
  while (cursor >= challengeStart && isSuccess(cursor)) {
    current++;
    cursor = addDaysISO(cursor, -1);
  }

  return { current, longest, successfulDays, perfectDays };
}

/**
 * Streak of consecutive days that contain at least one activity (workouts,
 * learning, content…). Today may be empty without breaking the streak.
 */
export function calculateActivityStreak(activeDays: ReadonlySet<ISODate>, today: ISODate): { current: number; longest: number } {
  let current = 0;
  let cursor = activeDays.has(today) ? today : addDaysISO(today, -1);
  while (activeDays.has(cursor)) {
    current++;
    cursor = addDaysISO(cursor, -1);
  }

  const sorted = [...activeDays].filter((d) => d <= today).sort();
  let longest = 0;
  let run = 0;
  let prev: ISODate | null = null;
  for (const d of sorted) {
    run = prev !== null && diffDaysISO(d, prev) === 1 ? run + 1 : 1;
    longest = Math.max(longest, run);
    prev = d;
  }
  return { current, longest };
}

export function scoresToMap(rows: readonly { log_date: string; score: number }[]): Map<ISODate, number> {
  return new Map(rows.map((r) => [r.log_date, r.score]));
}
