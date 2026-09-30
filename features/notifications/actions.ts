"use server";

import { z } from "zod";
import { getOverview } from "@/features/dashboard/overview";
import { buildNotifications } from "@/features/notifications/generate";
import { getCurrentUser } from "@/lib/auth";
import { assertNoDbError, runAction } from "@/lib/actions";
import { getUserContext } from "@/lib/data/context";
import { hourInTimeZone, startOfWeekISO } from "@/lib/dates";
import type { NotificationRow } from "@/types/database";

export interface NotificationFeed {
  items: Pick<NotificationRow, "id" | "kind" | "title" | "body" | "href" | "read_at" | "created_at">[];
  unread: number;
}

/**
 * Generates any reminders that apply right now (idempotent via dedupe_key),
 * then returns the latest notifications.
 */
export async function loadNotifications(): Promise<NotificationFeed> {
  if (!(await getCurrentUser())) return { items: [], unread: 0 };
  const ctx = await getUserContext();
  const { supabase, user, today, settings, challenge } = ctx;

  try {
    const [overview, followups, review] = await Promise.all([
      getOverview(ctx),
      supabase
        .from("prospect_followups")
        .select("due_on")
        .eq("user_id", user.id)
        .eq("status", "pending")
        .lte("due_on", today),
      supabase.from("weekly_reviews").select("id").eq("user_id", user.id).eq("week_start", startOfWeekISO(today)).maybeSingle(),
    ]);
    const due = followups.data ?? [];
    const candidates = buildNotifications({
      today,
      hour: hourInTimeZone(settings.timezone),
      weekStart: overview.weekStart,
      monthKey: today.slice(0, 7),
      followupsDueToday: due.filter((f) => f.due_on === today).length,
      overdueFollowups: due.filter((f) => f.due_on < today).length,
      learningMinutesToday: overview.today.learningMinutes,
      learningTargetMinutes: settings.dailyLearningTargetMinutes,
      weeklyReviewDone: Boolean(review.data),
      currentStreak: overview.streak.current,
      challengeId: challenge.id ?? "default",
      savingsThisMonth: overview.month.savings,
      monthlySavingsGoal: settings.monthlySavingsGoal,
      currency: settings.currency,
    });
    if (candidates.length > 0) {
      const { error } = await supabase
        .from("notifications")
        .upsert(
          candidates.map((c) => ({ ...c, user_id: user.id })),
          { onConflict: "user_id,dedupe_key", ignoreDuplicates: true },
        );
      if (error) console.error("[notifications] upsert failed", error.code);
    }
  } catch (error) {
    console.error("[notifications] generation failed", error);
  }

  const { data, error } = await supabase
    .from("notifications")
    .select("id, kind, title, body, href, read_at, created_at")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(20);
  if (error) {
    console.error("[notifications] load failed", error.code);
    return { items: [], unread: 0 };
  }
  return { items: data, unread: data.filter((n) => !n.read_at).length };
}

export async function markNotificationsRead(raw: unknown) {
  return runAction(
    z.object({ ids: z.array(z.uuid()).max(50).optional() }),
    raw,
    async (input, { supabase, user }) => {
      let query = supabase
        .from("notifications")
        .update({ read_at: new Date().toISOString() })
        .eq("user_id", user.id)
        .is("read_at", null);
      if (input.ids) query = query.in("id", input.ids);
      const { error } = await query;
      assertNoDbError(error, "mark notifications read");
    },
    { revalidate: false },
  );
}
