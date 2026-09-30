import "server-only";
import type { ActionContext } from "@/lib/actions";
import type { HabitKey } from "@/lib/constants";
import { toNumber } from "@/lib/finance";

/**
 * Logging real work ticks the matching Daily Seven habit, so the checklist
 * fills itself in. It only ever marks habits complete — it never un-ticks a
 * habit the user checked manually. Failures are logged, not surfaced: the
 * primary record was already saved.
 */
async function markHabitDone(ctx: ActionContext, date: string, key: HabitKey): Promise<void> {
  if (date > (await ctx.getToday())) return;
  const { error } = await ctx.supabase.from("daily_habits").upsert(
    {
      user_id: ctx.user.id,
      log_date: date,
      habit_key: key,
      completed: true,
      completed_at: new Date().toISOString(),
    },
    { onConflict: "user_id,log_date,habit_key", ignoreDuplicates: false },
  );
  if (error) console.error("[habits] auto-complete failed", key, error.code);
}

/** Workout / client work / published content: one entry completes the habit. */
export async function autoCompleteHabit(ctx: ActionContext, date: string, key: "workout" | "client_work" | "content") {
  const existing = await ctx.supabase
    .from("daily_habits")
    .select("completed")
    .eq("user_id", ctx.user.id)
    .eq("log_date", date)
    .eq("habit_key", key)
    .maybeSingle();
  if (existing.data?.completed) return;
  await markHabitDone(ctx, date, key);
}

/** Learning and outreach complete once the day's total reaches the user's target. */
export async function autoCompleteTargetHabits(ctx: ActionContext, date: string): Promise<void> {
  const [series, settings, habits] = await Promise.all([
    ctx.supabase.rpc("daily_series", { p_start: date, p_end: date }),
    ctx.supabase
      .from("user_settings")
      .select("daily_learning_target_minutes, daily_outreach_target")
      .eq("user_id", ctx.user.id)
      .maybeSingle(),
    ctx.supabase
      .from("daily_habits")
      .select("habit_key, completed")
      .eq("user_id", ctx.user.id)
      .eq("log_date", date)
      .in("habit_key", ["learning", "outreach"]),
  ]);
  const day = series.data?.[0];
  if (!day || !settings.data) return;
  const done = new Set((habits.data ?? []).filter((h) => h.completed).map((h) => h.habit_key));

  const learningTarget = settings.data.daily_learning_target_minutes;
  const outreachTarget = settings.data.daily_outreach_target;
  if (!done.has("learning") && learningTarget > 0 && toNumber(day.learning_minutes) >= learningTarget) {
    await markHabitDone(ctx, date, "learning");
  }
  if (!done.has("outreach") && outreachTarget > 0 && toNumber(day.outreach_actions) >= outreachTarget) {
    await markHabitDone(ctx, date, "outreach");
  }
}
