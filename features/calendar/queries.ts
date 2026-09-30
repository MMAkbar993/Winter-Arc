import "server-only";
import { getDayLog, type DayLog } from "@/features/habits/queries";
import type { UserContext } from "@/lib/data/context";
import type { ISODate } from "@/lib/dates";
import { normalizeSeries, type DayMetrics } from "@/lib/series";
import type {
  IncomeTransactionRow,
  JournalEntryRow,
  LearningSessionRow,
  ProspectRow,
  WorkoutRow,
} from "@/types/database";

export async function getSeries(ctx: UserContext, start: ISODate, end: ISODate): Promise<DayMetrics[]> {
  const { data, error } = await ctx.supabase.rpc("daily_series", { p_start: start, p_end: end });
  if (error) {
    console.error("[db] daily_series", error);
    throw new Error("Could not load your calendar.");
  }
  return normalizeSeries(data);
}

export interface DayDetail {
  log: DayLog;
  workouts: Pick<WorkoutRow, "id" | "category" | "custom_category" | "duration_minutes">[];
  learning: Pick<LearningSessionRow, "id" | "topic" | "duration_minutes" | "category">[];
  prospects: Pick<ProspectRow, "id" | "name" | "company" | "stage">[];
  income: Pick<IncomeTransactionRow, "id" | "amount" | "source" | "category">[];
  journal: JournalEntryRow | null;
}

/** Everything logged on one day, fetched in parallel. */
export async function getDayDetail(ctx: UserContext, date: ISODate): Promise<DayDetail> {
  const { supabase, user } = ctx;
  const [log, workouts, learning, prospects, income, journal] = await Promise.all([
    getDayLog(supabase, user.id, date),
    supabase.from("workouts").select("id, category, custom_category, duration_minutes").eq("user_id", user.id).eq("workout_date", date),
    supabase.from("learning_sessions").select("id, topic, duration_minutes, category").eq("user_id", user.id).eq("session_date", date),
    supabase.from("prospects").select("id, name, company, stage").eq("user_id", user.id).eq("contacted_on", date),
    supabase.from("income_transactions").select("id, amount, source, category").eq("user_id", user.id).eq("txn_date", date),
    supabase.from("journal_entries").select("*").eq("user_id", user.id).eq("entry_date", date).maybeSingle(),
  ]);
  return {
    log,
    workouts: workouts.data ?? [],
    learning: learning.data ?? [],
    prospects: prospects.data ?? [],
    income: income.data ?? [],
    journal: journal.data ?? null,
  };
}
