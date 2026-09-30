"use server";

import { assertNoDbError, runAction } from "@/lib/actions";
import { onboardingSchema } from "@/lib/validation/schemas";
import { saveActiveChallenge } from "@/features/settings/challenge";

export async function completeOnboarding(raw: unknown) {
  return runAction(onboardingSchema, raw, async (input, { supabase, user }) => {
    const [profile, settings] = await Promise.all([
      supabase
        .from("profiles")
        .upsert(
          { user_id: user.id, full_name: input.name, onboarded_at: new Date().toISOString() },
          { onConflict: "user_id" },
        ),
      supabase.from("user_settings").upsert(
        {
          user_id: user.id,
          timezone: input.timezone,
          daily_learning_target_minutes: input.dailyLearningTargetMinutes,
          weekly_workout_target: input.weeklyWorkoutTarget,
          daily_outreach_target: input.dailyOutreachTarget,
          monthly_income_goal: input.monthlyIncomeGoal,
          monthly_savings_goal: input.monthlySavingsGoal,
        },
        { onConflict: "user_id" },
      ),
    ]);
    assertNoDbError(profile.error, "onboarding profile");
    assertNoDbError(settings.error, "onboarding settings");

    await saveActiveChallenge(supabase, user.id, {
      name: input.challengeName,
      startDate: input.startDate,
      endDate: input.endDate,
    });
    return { redirectTo: "/dashboard" };
  });
}
