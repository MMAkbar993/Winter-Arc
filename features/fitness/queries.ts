import "server-only";
import { getOverview, type Overview } from "@/features/dashboard/overview";
import { labelFor, WORKOUT_CATEGORIES, type WorkoutCategory } from "@/lib/constants";
import type { UserContext } from "@/lib/data/context";
import { calculateActivityStreak } from "@/lib/scoring";
import type { BodyMetricRow, WorkoutExerciseRow, WorkoutRow } from "@/types/database";

export type WorkoutWithExercises = WorkoutRow & { workout_exercises: WorkoutExerciseRow[] };

export interface FitnessData {
  overview: Overview;
  workouts: WorkoutWithExercises[];
  metrics: BodyMetricRow[];
  totalSessions: number;
  streak: { current: number; longest: number };
  mostTrained: string | null;
  byCategory: { label: string; value: number }[];
}

export async function getFitnessData(ctx: UserContext): Promise<FitnessData> {
  const { supabase, user, today, challenge } = ctx;
  const [overview, workoutsRes, metricsRes, countRes] = await Promise.all([
    getOverview(ctx),
    supabase
      .from("workouts")
      .select("*, workout_exercises(*)")
      .eq("user_id", user.id)
      .lte("workout_date", today)
      .order("workout_date", { ascending: false })
      .order("created_at", { ascending: false })
      .limit(60),
    supabase.from("body_metrics").select("*").eq("user_id", user.id).order("measured_on", { ascending: true }).limit(365),
    supabase.from("workouts").select("id", { count: "exact", head: true }).eq("user_id", user.id),
  ]);
  if (workoutsRes.error || metricsRes.error) {
    console.error("[db] fitness", workoutsRes.error ?? metricsRes.error);
    throw new Error("Could not load fitness data.");
  }

  const workouts = workoutsRes.data.map((w) => ({
    ...w,
    workout_exercises: [...w.workout_exercises].sort((a, b) => a.position - b.position),
  }));

  const counts = new Map<WorkoutCategory, number>();
  for (const w of workouts) {
    if (w.workout_date >= challenge.startDate && w.workout_date <= challenge.endDate) {
      counts.set(w.category, (counts.get(w.category) ?? 0) + 1);
    }
  }
  const byCategory = [...counts.entries()]
    .map(([category, value]) => ({ label: labelFor(WORKOUT_CATEGORIES, category), value }))
    .sort((a, b) => b.value - a.value);

  const activeDays = new Set(overview.series.filter((d) => d.workouts > 0).map((d) => d.day));

  return {
    overview,
    workouts,
    metrics: metricsRes.data,
    totalSessions: countRes.count ?? workouts.length,
    streak: calculateActivityStreak(activeDays, today),
    mostTrained: byCategory[0]?.label ?? null,
    byCategory,
  };
}
