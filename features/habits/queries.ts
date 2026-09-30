import "server-only";
import { HABIT_KEYS, PRIORITY_KIND_VALUES, type HabitKey, type PriorityKind } from "@/lib/constants";
import type { ISODate } from "@/lib/dates";
import type { ServerSupabase } from "@/lib/supabase/server";

export interface HabitEntry {
  completed: boolean;
  notes: string | null;
  completedAt: string | null;
}
export type HabitMap = Record<HabitKey, HabitEntry>;

export interface PriorityEntry {
  title: string;
  completed: boolean;
}
export type PriorityMap = Record<PriorityKind, PriorityEntry | null>;

export interface DayLog {
  date: ISODate;
  habits: HabitMap;
  priorities: PriorityMap;
  note: string | null;
}

export function emptyHabitMap(): HabitMap {
  return Object.fromEntries(
    HABIT_KEYS.map((k) => [k, { completed: false, notes: null, completedAt: null }]),
  ) as HabitMap;
}

/** Habits, Top 3 and daily note for one day — three small indexed queries in parallel. */
export async function getDayLog(supabase: ServerSupabase, userId: string, date: ISODate): Promise<DayLog> {
  const [habitsRes, prioritiesRes, logRes] = await Promise.all([
    supabase
      .from("daily_habits")
      .select("habit_key, completed, notes, completed_at")
      .eq("user_id", userId)
      .eq("log_date", date),
    supabase.from("daily_priorities").select("kind, title, completed").eq("user_id", userId).eq("log_date", date),
    supabase.from("daily_logs").select("notes").eq("user_id", userId).eq("log_date", date).maybeSingle(),
  ]);
  if (habitsRes.error || prioritiesRes.error || logRes.error) {
    console.error("[db] getDayLog", habitsRes.error ?? prioritiesRes.error ?? logRes.error);
    throw new Error("Could not load today's log.");
  }

  const habits = emptyHabitMap();
  for (const h of habitsRes.data) {
    habits[h.habit_key] = { completed: h.completed, notes: h.notes, completedAt: h.completed_at };
  }
  const priorities = Object.fromEntries(PRIORITY_KIND_VALUES.map((k) => [k, null])) as PriorityMap;
  for (const p of prioritiesRes.data) priorities[p.kind] = { title: p.title, completed: p.completed };

  return { date, habits, priorities, note: logRes.data?.notes ?? null };
}
