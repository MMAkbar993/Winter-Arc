/**
 * AI Coach — contract only (not implemented in the MVP).
 *
 * The coach consumes the same aggregates the app already computes, so adding
 * it later means writing one server action + one prompt, not new queries.
 * See features/coach/README.md.
 */
import type { HabitStat, WeekdayStat } from "@/lib/analytics";
import type { PipelineStats } from "@/lib/crm";
import type { PeriodTotals } from "@/lib/series";

export interface CoachInput {
  weekStart: string;
  thisWeek: PeriodTotals;
  lastWeek: PeriodTotals;
  habits: HabitStat[];
  weekdays: WeekdayStat[];
  pipeline: PipelineStats;
  /** Free-text answers from the latest weekly review. */
  review: Record<string, string | null> | null;
  targets: { dailyLearningMinutes: number; weeklyWorkouts: number; dailyOutreach: number };
}

export interface CoachInsight {
  kind: "win" | "warning" | "suggestion";
  /** e.g. "Your learning consistency improved this week, but outreach dropped 35%." */
  message: string;
  metric?: keyof PeriodTotals;
}

/** Implementations (LLM-backed or rule-based) must be pure over CoachInput. */
export type CoachProvider = (input: CoachInput) => Promise<CoachInsight[]>;
