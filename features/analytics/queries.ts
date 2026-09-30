import "server-only";
import {
  habitBreakdown,
  habitExtremes,
  weekdayExtremes,
  weekdayPerformance,
  weeklyCompletion,
  type HabitStat,
  type WeekdayStat,
  type WeeklyCompletion,
} from "@/lib/analytics";
import { getSeries } from "@/features/calendar/queries";
import { getOverview } from "@/features/dashboard/overview";
import { pipelineStats, type PipelineStats } from "@/lib/crm";
import type { UserContext } from "@/lib/data/context";
import type { ISODate } from "@/lib/dates";
import { totalsForRange, type DayMetrics, type PeriodTotals } from "@/lib/series";
import type { StreakResult } from "@/lib/scoring";

export interface AnalyticsData {
  series: DayMetrics[];
  totals: PeriodTotals;
  habits: HabitStat[];
  strongest: HabitStat | null;
  weakest: HabitStat | null;
  weekdays: WeekdayStat[];
  bestDay: WeekdayStat | null;
  worstDay: WeekdayStat | null;
  weekly: WeeklyCompletion[];
  funnel: PipelineStats;
  streak: StreakResult;
}

export async function getAnalyticsData(ctx: UserContext, from: ISODate, to: ISODate): Promise<AnalyticsData> {
  const { supabase, user, settings } = ctx;
  const [series, overview, habitsRes, prospectsRes] = await Promise.all([
    getSeries(ctx, from, to),
    getOverview(ctx),
    supabase
      .from("daily_habits")
      .select("habit_key, completed")
      .eq("user_id", user.id)
      .eq("completed", true)
      .gte("log_date", from)
      .lte("log_date", to),
    supabase
      .from("prospects")
      .select("stage, estimated_value, contacted_on, replied_on")
      .eq("user_id", user.id)
      .or(`contacted_on.gte.${from},created_at.gte.${from}`)
      .limit(2000),
  ]);
  if (habitsRes.error || prospectsRes.error) {
    console.error("[db] analytics", habitsRes.error ?? prospectsRes.error);
    throw new Error("Could not load analytics.");
  }

  const habits = habitBreakdown(habitsRes.data, series.length);
  const weekdays = weekdayPerformance(series);
  return {
    series,
    totals: totalsForRange(series, from, to, settings.successThreshold),
    habits,
    ...habitExtremes(habits),
    weekdays,
    ...(({ best, worst }) => ({ bestDay: best, worstDay: worst }))(weekdayExtremes(weekdays)),
    weekly: weeklyCompletion(series),
    funnel: pipelineStats(prospectsRes.data),
    streak: overview.streak,
  };
}
