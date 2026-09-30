import { HABITS, MAX_DAILY_SCORE, type HabitKey } from "@/lib/constants";
import { startOfWeekISO, WEEKDAY_LABELS, weekdayOf, type ISODate } from "@/lib/dates";
import type { DayMetrics } from "@/lib/series";

export interface HabitStat {
  key: HabitKey;
  label: string;
  completed: number;
  /** Share of days in range where the habit was completed. */
  rate: number;
}

/** Completion counts per habit across `dayCount` days. */
export function habitBreakdown(
  completions: readonly { habit_key: HabitKey; completed: boolean }[],
  dayCount: number,
): HabitStat[] {
  const counts = new Map<HabitKey, number>();
  for (const c of completions) {
    if (c.completed) counts.set(c.habit_key, (counts.get(c.habit_key) ?? 0) + 1);
  }
  return HABITS.map((h) => {
    const completed = counts.get(h.value) ?? 0;
    return {
      key: h.value,
      label: h.label,
      completed,
      rate: dayCount > 0 ? Math.round((completed / dayCount) * 100) : 0,
    };
  });
}

/** Strongest and weakest habits; null when nothing has been tracked yet. */
export function habitExtremes(stats: readonly HabitStat[]): { strongest: HabitStat | null; weakest: HabitStat | null } {
  if (stats.every((s) => s.completed === 0)) return { strongest: null, weakest: null };
  const sorted = [...stats].sort((a, b) => b.completed - a.completed);
  return { strongest: sorted[0] ?? null, weakest: sorted[sorted.length - 1] ?? null };
}

export interface WeekdayStat {
  weekday: number;
  label: string;
  averageScore: number;
  days: number;
}

/** Average score per weekday, Monday first. */
export function weekdayPerformance(series: readonly DayMetrics[]): WeekdayStat[] {
  const buckets = Array.from({ length: 7 }, () => ({ sum: 0, days: 0 }));
  for (const d of series) {
    const bucket = buckets[weekdayOf(d.day)];
    if (bucket) {
      bucket.sum += d.score;
      bucket.days += 1;
    }
  }
  const order = [1, 2, 3, 4, 5, 6, 0];
  return order.map((weekday) => {
    const b = buckets[weekday] ?? { sum: 0, days: 0 };
    return {
      weekday,
      label: WEEKDAY_LABELS[weekday] ?? "",
      averageScore: b.days ? Math.round((b.sum / b.days) * 10) / 10 : 0,
      days: b.days,
    };
  });
}

export function weekdayExtremes(stats: readonly WeekdayStat[]): { best: WeekdayStat | null; worst: WeekdayStat | null } {
  const tracked = stats.filter((s) => s.days > 0);
  if (tracked.length === 0 || tracked.every((s) => s.averageScore === 0)) return { best: null, worst: null };
  const sorted = [...tracked].sort((a, b) => b.averageScore - a.averageScore);
  return { best: sorted[0] ?? null, worst: sorted[sorted.length - 1] ?? null };
}

export interface WeeklyCompletion {
  weekStart: ISODate;
  completionRate: number;
  averageScore: number;
}

/** Completion rate (score / 7) per Monday-based week. */
export function weeklyCompletion(series: readonly DayMetrics[]): WeeklyCompletion[] {
  const weeks = new Map<ISODate, { sum: number; days: number }>();
  for (const d of series) {
    const key = startOfWeekISO(d.day);
    const w = weeks.get(key) ?? { sum: 0, days: 0 };
    w.sum += d.score;
    w.days += 1;
    weeks.set(key, w);
  }
  return [...weeks.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([weekStart, w]) => ({
      weekStart,
      completionRate: Math.round((w.sum / (w.days * MAX_DAILY_SCORE)) * 100),
      averageScore: Math.round((w.sum / w.days) * 10) / 10,
    }));
}

/** Percentage change, or null when there is no baseline. */
export function percentChange(current: number, previous: number): number | null {
  if (previous === 0) return null;
  return Math.round(((current - previous) / previous) * 100);
}

/** Running cumulative sum of a numeric field. */
export function cumulative<T extends object>(rows: readonly T[], pick: (row: T) => number): number[] {
  let acc = 0;
  return rows.map((r) => {
    acc = Math.round((acc + pick(r)) * 100) / 100;
    return acc;
  });
}

/** Sums a metric into Monday-based weekly buckets, in chronological order. */
export function sumByWeek(series: readonly DayMetrics[], pick: (d: DayMetrics) => number): { weekStart: ISODate; value: number }[] {
  const weeks = new Map<ISODate, number>();
  for (const d of series) {
    const key = startOfWeekISO(d.day);
    weeks.set(key, Math.round(((weeks.get(key) ?? 0) + pick(d)) * 100) / 100);
  }
  return [...weeks.entries()].sort(([a], [b]) => a.localeCompare(b)).map(([weekStart, value]) => ({ weekStart, value }));
}
