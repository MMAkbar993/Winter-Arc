import type { Metadata } from "next";
import { LogOut } from "lucide-react";
import { PageHeader } from "@/components/shared/page-header";
import { Section } from "@/components/shared/section";
import { Button } from "@/components/ui/button";
import { signOut } from "@/features/auth/actions";
import {
  ChallengeForm,
  ChangePasswordForm,
  PreferencesForm,
  ProfileForm,
  TargetsForm,
} from "@/features/settings/components/settings-forms";
import { requireOnboardedContext } from "@/lib/data/context";
import { formatISODate } from "@/lib/dates";
import { timezoneOptions } from "@/lib/timezones";
import type { CURRENCIES } from "@/lib/constants";

export const metadata: Metadata = { title: "Settings" };

export default async function SettingsPage() {
  const ctx = await requireOnboardedContext();
  const { settings, challenge, displayName, user } = ctx;

  return (
    <div className="grid max-w-3xl grid-cols-1 gap-6">
      <PageHeader title="Settings" description="Profile, challenge, targets and preferences." />

      <Section id="profile" title="Profile">
        <ProfileForm name={displayName} />
      </Section>

      <Section id="challenge" title="Challenge dates" description="Changing dates recalculates day numbers, progress and streaks.">
        <ChallengeForm
          initial={{ challengeName: challenge.name, startDate: challenge.startDate, endDate: challenge.endDate }}
        />
      </Section>

      <Section id="targets" title="Daily targets & financial goals">
        <TargetsForm
          currency={settings.currency}
          initial={{
            dailyLearningTargetMinutes: String(settings.dailyLearningTargetMinutes),
            weeklyWorkoutTarget: String(settings.weeklyWorkoutTarget),
            dailyOutreachTarget: String(settings.dailyOutreachTarget),
            monthlyIncomeGoal: String(settings.monthlyIncomeGoal),
            monthlySavingsGoal: String(settings.monthlySavingsGoal),
          }}
        />
      </Section>

      <Section id="preferences" title="Timezone, currency, theme & streak rule">
        <PreferencesForm
          timezones={timezoneOptions()}
          initial={{
            timezone: settings.timezone,
            currency: settings.currency as (typeof CURRENCIES)[number],
            theme: settings.theme,
            successThreshold: String(settings.successThreshold),
          }}
        />
      </Section>

      <Section id="account" title="Account" description={`Signed in as ${user.email ?? ""} · member since ${formatISODate(user.created_at.slice(0, 10), "MMMM yyyy")}`}>
        <div className="grid grid-cols-1 gap-6">
          <ChangePasswordForm />
          <form action={signOut} className="border-t pt-4">
            <Button type="submit" variant="outline" size="lg">
              <LogOut aria-hidden /> Log out
            </Button>
          </form>
        </div>
      </Section>
    </div>
  );
}
