import "server-only";
import { cache } from "react";
import type { UserContext } from "@/lib/data/context";
import {
  addDaysISO,
  endOfWeekISO,
  maxISO,
  minISO,
  startOfMonthISO,
  startOfWeekISO,
  type ISODate,
} from "@/lib/dates";
import { calculateStreaks, type StreakResult } from "@/lib/scoring";
import { emptyDay, normalizeSeries, totalsForRange, type DayMetrics, type PeriodTotals } from "@/lib/series";

export interface Overview {
  series: DayMetrics[];
  today: DayMetrics;
  week: PeriodTotals;
  month: PeriodTotals;
  challenge: PeriodTotals;
  streak: StreakResult;
  weekStart: ISODate;
  weekEnd: ISODate;
  monthStart: ISODate;
}

/**
 * One `daily_series` RPC covering the challenge, current week and current
 * month, aggregated in TypeScript. Cached per request.
 */
export const getOverview = cache(async (ctx: UserContext): Promise<Overview> => {
  const { supabase, today, challenge, settings } = ctx;
  const weekStart = startOfWeekISO(today);
  const monthStart = startOfMonthISO(today);
  // daily_series caps ranges at 800 days; older history is simply not loaded.
  const rangeStart = maxISO(minISO(minISO(challenge.startDate, monthStart), weekStart), addDaysISO(today, -790));

  const { data, error } = await supabase.rpc("daily_series", { p_start: rangeStart, p_end: today });
  if (error) {
    console.error("[db] daily_series", error);
    throw new Error("Could not load your stats.");
  }
  const series = normalizeSeries(data);
  const scores = new Map(series.map((d) => [d.day, d.score]));
  const challengeEnd = minISO(today, challenge.endDate);

  return {
    series,
    today: series.find((d) => d.day === today) ?? emptyDay(today),
    week: totalsForRange(series, weekStart, today, settings.successThreshold),
    month: totalsForRange(series, monthStart, today, settings.successThreshold),
    challenge: totalsForRange(series, challenge.startDate, challengeEnd, settings.successThreshold),
    streak: calculateStreaks({
      scores,
      today,
      challengeStart: challenge.startDate,
      challengeEnd: challenge.endDate,
      threshold: settings.successThreshold,
    }),
    weekStart,
    weekEnd: endOfWeekISO(today),
    monthStart,
  };
});
