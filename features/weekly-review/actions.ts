"use server";

import { ActionError, assertNoDbError, runAction } from "@/lib/actions";
import { endOfWeekISO, minISO, startOfWeekISO } from "@/lib/dates";
import { normalizeSeries, totalsForRange } from "@/lib/series";
import { weeklyReviewSchema } from "@/lib/validation/schemas";
import { weeklyStatsFromTotals } from "@/features/weekly-review/stats";

export async function saveWeeklyReview(raw: unknown) {
  return runAction(
    weeklyReviewSchema,
    raw,
    async (input, { supabase, user, getToday }) => {
      const today = await getToday();
      if (startOfWeekISO(input.weekStart) !== input.weekStart) throw new ActionError("Reviews start on a Monday.");
      if (input.weekStart > today) throw new ActionError("You can't review a week that hasn't started.");

      const end = minISO(endOfWeekISO(input.weekStart), today);
      const [seriesRes, settingsRes] = await Promise.all([
        supabase.rpc("daily_series", { p_start: input.weekStart, p_end: end }),
        supabase.from("user_settings").select("success_threshold").eq("user_id", user.id).maybeSingle(),
      ]);
      assertNoDbError(seriesRes.error, "weekly stats");
      const totals = totalsForRange(
        normalizeSeries(seriesRes.data),
        input.weekStart,
        end,
        settingsRes.data?.success_threshold ?? 5,
      );

      const { weekStart, ...answers } = input;
      const { error } = await supabase
        .from("weekly_reviews")
        .upsert(
          { user_id: user.id, week_start: weekStart, ...answers, stats: { ...weeklyStatsFromTotals(totals) } },
          { onConflict: "user_id,week_start" },
        );
      assertNoDbError(error, "save weekly review");
    },
    { successMessage: "Weekly review saved" },
  );
}
