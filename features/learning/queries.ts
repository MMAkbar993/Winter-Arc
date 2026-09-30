import "server-only";
import { getOverview, type Overview } from "@/features/dashboard/overview";
import { labelFor, LEARNING_CATEGORIES, type LearningCategory } from "@/lib/constants";
import type { UserContext } from "@/lib/data/context";
import { minISO, startOfMonthISO } from "@/lib/dates";
import { calculateActivityStreak } from "@/lib/scoring";
import type { LearningSessionRow } from "@/types/database";

export interface LearningData {
  overview: Overview;
  sessions: (LearningSessionRow & { projects: { name: string } | null })[];
  byCategory: { category: LearningCategory; label: string; minutes: number }[];
  mostStudied: string | null;
  longestStreak: number;
  currentStreak: number;
  averageMinutesPerDay: number;
}

export async function getLearningData(ctx: UserContext): Promise<LearningData> {
  const { supabase, user, today, challenge, progress } = ctx;
  const from = minISO(challenge.startDate, startOfMonthISO(today));

  const [overview, sessionsRes] = await Promise.all([
    getOverview(ctx),
    supabase
      .from("learning_sessions")
      .select("*, projects(name)")
      .eq("user_id", user.id)
      .gte("session_date", from)
      .lte("session_date", today)
      .order("session_date", { ascending: false })
      .order("created_at", { ascending: false })
      .limit(500),
  ]);
  if (sessionsRes.error) {
    console.error("[db] learning", sessionsRes.error);
    throw new Error("Could not load learning sessions.");
  }
  const sessions = sessionsRes.data;

  const inChallenge = sessions.filter((s) => s.session_date >= challenge.startDate && s.session_date <= challenge.endDate);
  const totals = new Map<LearningCategory, number>();
  for (const s of inChallenge) totals.set(s.category, (totals.get(s.category) ?? 0) + s.duration_minutes);
  const byCategory = [...totals.entries()]
    .map(([category, minutes]) => ({ category, label: labelFor(LEARNING_CATEGORIES, category), minutes }))
    .sort((a, b) => b.minutes - a.minutes);

  const activeDays = new Set(overview.series.filter((d) => d.learningMinutes > 0).map((d) => d.day));
  const streak = calculateActivityStreak(activeDays, today);
  const daysElapsed = Math.max(progress.daysElapsed, 1);

  return {
    overview,
    sessions,
    byCategory,
    mostStudied: byCategory[0]?.label ?? null,
    longestStreak: streak.longest,
    currentStreak: streak.current,
    averageMinutesPerDay: progress.status === "upcoming" ? 0 : Math.round(overview.challenge.learningMinutes / daysElapsed),
  };
}
