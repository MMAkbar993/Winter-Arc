"use server";

import { assertNoDbError, runAction } from "@/lib/actions";
import {
  challengeSettingsSchema,
  preferencesSettingsSchema,
  profileSettingsSchema,
  targetsSettingsSchema,
} from "@/lib/validation/schemas";
import { saveActiveChallenge } from "@/features/settings/challenge";

export async function updateProfile(raw: unknown) {
  return runAction(
    profileSettingsSchema,
    raw,
    async (input, { supabase, user }) => {
      const { error } = await supabase.from("profiles").update({ full_name: input.name }).eq("user_id", user.id);
      assertNoDbError(error, "update profile");
    },
    { successMessage: "Profile updated" },
  );
}

export async function updateChallenge(raw: unknown) {
  return runAction(
    challengeSettingsSchema,
    raw,
    async (input, { supabase, user }) =>
      saveActiveChallenge(supabase, user.id, { name: input.challengeName, startDate: input.startDate, endDate: input.endDate }),
    { successMessage: "Challenge updated" },
  );
}

export async function updatePreferences(raw: unknown) {
  return runAction(
    preferencesSettingsSchema,
    raw,
    async (input, { supabase, user }) => {
      const { error } = await supabase
        .from("user_settings")
        .update({
          timezone: input.timezone,
          currency: input.currency,
          theme: input.theme,
          success_threshold: input.successThreshold,
        })
        .eq("user_id", user.id);
      assertNoDbError(error, "update preferences");
    },
    { successMessage: "Preferences saved" },
  );
}

export async function updateTargets(raw: unknown) {
  return runAction(
    targetsSettingsSchema,
    raw,
    async (input, { supabase, user }) => {
      const { error } = await supabase
        .from("user_settings")
        .update({
          daily_learning_target_minutes: input.dailyLearningTargetMinutes,
          weekly_workout_target: input.weeklyWorkoutTarget,
          daily_outreach_target: input.dailyOutreachTarget,
          monthly_income_goal: input.monthlyIncomeGoal,
          monthly_savings_goal: input.monthlySavingsGoal,
        })
        .eq("user_id", user.id);
      assertNoDbError(error, "update targets");
    },
    { successMessage: "Targets saved" },
  );
}
