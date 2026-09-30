import "server-only";
import { cache } from "react";
import { redirect } from "next/navigation";
import type { User } from "@supabase/supabase-js";
import { requireUser } from "@/lib/auth";
import { getChallengeProgress, type ChallengeProgress } from "@/lib/challenge";
import { DEFAULT_CHALLENGE, DEFAULT_CURRENCY, DEFAULT_TARGETS, DEFAULT_TIMEZONE } from "@/lib/constants";
import { isValidTimeZone, todayInTimeZone, type ISODate } from "@/lib/dates";
import { createClient, type ServerSupabase } from "@/lib/supabase/server";
import type { ChallengeRow, ProfileRow, UserSettingsRow } from "@/types/database";

export interface Settings {
  timezone: string;
  currency: string;
  dailyLearningTargetMinutes: number;
  weeklyWorkoutTarget: number;
  dailyOutreachTarget: number;
  monthlyIncomeGoal: number;
  monthlySavingsGoal: number;
  successThreshold: number;
  theme: UserSettingsRow["theme"];
}

export interface ChallengeInfo {
  id: string | null;
  name: string;
  startDate: ISODate;
  endDate: ISODate;
}

export interface UserContext {
  supabase: ServerSupabase;
  user: User;
  profile: ProfileRow | null;
  displayName: string;
  settings: Settings;
  challenge: ChallengeInfo;
  progress: ChallengeProgress;
  /** The user's local calendar date in their configured timezone. */
  today: ISODate;
  onboarded: boolean;
}

function toSettings(row: UserSettingsRow | null): Settings {
  const timezone = row?.timezone && isValidTimeZone(row.timezone) ? row.timezone : DEFAULT_TIMEZONE;
  return {
    timezone,
    currency: row?.currency ?? DEFAULT_CURRENCY,
    dailyLearningTargetMinutes: row?.daily_learning_target_minutes ?? DEFAULT_TARGETS.dailyLearningMinutes,
    weeklyWorkoutTarget: row?.weekly_workout_target ?? DEFAULT_TARGETS.weeklyWorkouts,
    dailyOutreachTarget: row?.daily_outreach_target ?? DEFAULT_TARGETS.dailyOutreach,
    monthlyIncomeGoal: Number(row?.monthly_income_goal ?? DEFAULT_TARGETS.monthlyIncomeGoal),
    monthlySavingsGoal: Number(row?.monthly_savings_goal ?? DEFAULT_TARGETS.monthlySavingsGoal),
    successThreshold: row?.success_threshold ?? DEFAULT_TARGETS.successThreshold,
    theme: row?.theme ?? "dark",
  };
}

function toChallenge(row: ChallengeRow | null): ChallengeInfo {
  if (!row) {
    return {
      id: null,
      name: DEFAULT_CHALLENGE.name,
      startDate: DEFAULT_CHALLENGE.startDate,
      endDate: DEFAULT_CHALLENGE.endDate,
    };
  }
  return { id: row.id, name: row.name, startDate: row.start_date, endDate: row.end_date };
}

/**
 * Everything most screens need about the signed-in user, loaded once per
 * request in a single parallel round-trip. RLS scopes every query to the user.
 */
export const getUserContext = cache(async (): Promise<UserContext> => {
  const user = await requireUser();
  const supabase = await createClient();

  const [profileRes, settingsRes, challengeRes] = await Promise.all([
    supabase.from("profiles").select("*").eq("user_id", user.id).maybeSingle(),
    supabase.from("user_settings").select("*").eq("user_id", user.id).maybeSingle(),
    supabase.from("challenges").select("*").eq("user_id", user.id).eq("is_active", true).maybeSingle(),
  ]);

  if (profileRes.error || settingsRes.error || challengeRes.error) {
    console.error("getUserContext failed", profileRes.error ?? settingsRes.error ?? challengeRes.error);
    throw new Error("Could not load your account. Please try again.");
  }

  const profile = profileRes.data;
  const settings = toSettings(settingsRes.data);
  const challenge = toChallenge(challengeRes.data);
  const today = todayInTimeZone(settings.timezone);
  const displayName =
    profile?.full_name?.trim() || (user.user_metadata?.full_name as string | undefined) || user.email?.split("@")[0] || "there";

  return {
    supabase,
    user,
    profile,
    displayName,
    settings,
    challenge,
    progress: getChallengeProgress(challenge.startDate, challenge.endDate, today),
    today,
    onboarded: Boolean(profile?.onboarded_at && challengeRes.data),
  };
});

/** For app pages: signed in AND onboarded. */
export async function requireOnboardedContext(): Promise<UserContext> {
  const ctx = await getUserContext();
  if (!ctx.onboarded) redirect("/onboarding");
  return ctx;
}
