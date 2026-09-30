import "server-only";
import { getOverview, type Overview } from "@/features/dashboard/overview";
import { getDayLog, type DayLog } from "@/features/habits/queries";
import type { UserContext } from "@/lib/data/context";
import { addDaysISO } from "@/lib/dates";
import type { HabitKey } from "@/lib/constants";
import type { RecentActivityRow } from "@/types/database";

export interface FollowupItem {
  id: string;
  dueOn: string;
  notes: string | null;
  prospectName: string;
  company: string | null;
}

export interface DashboardData {
  overview: Overview;
  day: DayLog;
  followups: FollowupItem[];
  recent: RecentActivityRow[];
  /** Completed habit rows for the last 7 days — used to spot neglected areas. */
  lastWeekHabits: { habit_key: HabitKey; completed: boolean }[];
}

/** Pending follow-ups due today or overdue, with the prospect's name. */
export async function getDueFollowups(ctx: UserContext, limit = 10): Promise<FollowupItem[]> {
  const { data, error } = await ctx.supabase
    .from("prospect_followups")
    .select("id, due_on, notes, prospects(name, company)")
    .eq("user_id", ctx.user.id)
    .eq("status", "pending")
    .lte("due_on", ctx.today)
    .order("due_on")
    .limit(limit);
  if (error) {
    console.error("[db] followups", error);
    return [];
  }
  return data.map((f) => ({
    id: f.id,
    dueOn: f.due_on,
    notes: f.notes,
    prospectName: f.prospects?.name ?? "Prospect",
    company: f.prospects?.company ?? null,
  }));
}

/** Everything the dashboard needs, fetched in one parallel batch. */
export async function getDashboardData(ctx: UserContext): Promise<DashboardData> {
  const { supabase, user, today } = ctx;
  const [overview, day, followups, recentRes, habitsRes] = await Promise.all([
    getOverview(ctx),
    getDayLog(supabase, user.id, today),
    getDueFollowups(ctx),
    supabase
      .from("recent_activity")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(8),
    supabase
      .from("daily_habits")
      .select("habit_key, completed")
      .eq("user_id", user.id)
      .eq("completed", true)
      .gte("log_date", addDaysISO(today, -6))
      .lte("log_date", today),
  ]);
  if (recentRes.error) console.error("[db] recent_activity", recentRes.error);
  if (habitsRes.error) console.error("[db] habits last week", habitsRes.error);

  return {
    overview,
    day,
    followups,
    recent: recentRes.data ?? [],
    lastWeekHabits: habitsRes.data ?? [],
  };
}
