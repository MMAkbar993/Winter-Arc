import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { Logo } from "@/components/shared/logo";
import { OnboardingForm } from "@/features/onboarding/components/onboarding-form";
import { DEFAULT_CHALLENGE, DEFAULT_TARGETS, TAGLINE } from "@/lib/constants";
import { getUserContext } from "@/lib/data/context";
import { timezoneOptions } from "@/lib/timezones";

export const metadata: Metadata = { title: "Set up your arc" };

export default async function OnboardingPage() {
  const ctx = await getUserContext();
  if (ctx.onboarded) redirect("/dashboard");

  const { settings } = ctx;
  const name = ctx.profile?.full_name ?? (ctx.user.user_metadata?.full_name as string | undefined) ?? "";

  return (
    <main className="surface-glow flex min-h-dvh flex-col items-center px-4 py-10 sm:justify-center">
      <div className="w-full max-w-lg space-y-8">
        <div className="space-y-2">
          <Logo />
          <p className="text-sm text-muted-foreground">{TAGLINE}</p>
        </div>
        <div className="rounded-2xl border bg-card p-5 sm:p-7">
          <OnboardingForm
            currency={settings.currency}
            timezones={timezoneOptions()}
            defaults={{
              name,
              challengeName: DEFAULT_CHALLENGE.name,
              startDate: DEFAULT_CHALLENGE.startDate,
              endDate: DEFAULT_CHALLENGE.endDate,
              timezone: settings.timezone,
              dailyLearningTargetMinutes: String(DEFAULT_TARGETS.dailyLearningMinutes),
              weeklyWorkoutTarget: String(DEFAULT_TARGETS.weeklyWorkouts),
              dailyOutreachTarget: String(DEFAULT_TARGETS.dailyOutreach),
              monthlyIncomeGoal: "0",
              monthlySavingsGoal: "0",
            }}
          />
        </div>
      </div>
    </main>
  );
}
