import type { Metadata } from "next";
import Link from "next/link";
import {
  BookOpen,
  CircleDollarSign,
  Dumbbell,
  Flame,
  PiggyBank,
  Send,
  Target,
  Trophy,
} from "lucide-react";
import { PageHeader } from "@/components/shared/page-header";
import { Section } from "@/components/shared/section";
import { StatCard, StatGrid } from "@/components/shared/stat-card";
import { Button } from "@/components/ui/button";
import { FollowupList } from "@/features/clients/components/followup-list";
import { AiCoachPlaceholder } from "@/features/dashboard/components/ai-coach-placeholder";
import { ChallengeProgress } from "@/features/dashboard/components/challenge-progress";
import { FocusAreas } from "@/features/dashboard/components/focus-areas";
import { RecentActivity } from "@/features/dashboard/components/recent-activity";
import { WeeklyProgress } from "@/features/dashboard/components/weekly-progress";
import { getDashboardData } from "@/features/dashboard/queries";
import { HabitChecklist } from "@/features/habits/components/habit-checklist";
import { TopPriorities } from "@/features/habits/components/top-priorities";
import { APP_NAME, MAX_DAILY_SCORE } from "@/lib/constants";
import { requireOnboardedContext } from "@/lib/data/context";
import { formatISODate, greetingForHour, hourInTimeZone } from "@/lib/dates";
import { formatCurrency, formatMinutes, percent, pluralize } from "@/lib/format";
import { scorePercent } from "@/lib/scoring";
import { lastNDays } from "@/lib/series";

export const metadata: Metadata = { title: "Dashboard" };

export default async function DashboardPage() {
  const ctx = await requireOnboardedContext();
  const { settings, challenge, progress, today, displayName } = ctx;
  const { overview, day, followups, recent, lastWeekHabits } = await getDashboardData(ctx);
  const { currency } = settings;

  const score = Object.values(day.habits).filter((h) => h.completed).length;
  const firstName = displayName.split(" ")[0];
  const greeting = greetingForHour(hourInTimeZone(settings.timezone));
  const dayLine =
    progress.status === "upcoming"
      ? `${challenge.name} starts ${progress.daysUntilStart === 1 ? "tomorrow" : `in ${progress.daysUntilStart} days`}`
      : progress.status === "completed"
        ? `${challenge.name} — complete`
        : `${challenge.name} — Day ${progress.dayNumber} of ${progress.totalDays}`;

  return (
    <div className="grid grid-cols-1 gap-6">
      <PageHeader
        eyebrow={APP_NAME}
        title={`${greeting}, ${firstName}.`}
        description={`${dayLine} · ${formatISODate(challenge.startDate, "MMMM d")} → ${formatISODate(challenge.endDate, "MMMM d")}`}
        actions={
          <Button asChild size="lg" variant="outline">
            <Link href="/today">Open Today</Link>
          </Button>
        }
      />

      <ChallengeProgress name={challenge.name} startDate={challenge.startDate} endDate={challenge.endDate} progress={progress} />

      <StatGrid>
        <StatCard
          label="Today's Score"
          icon={Target}
          tone="brand"
          value={`${score} / ${MAX_DAILY_SCORE}`}
          progress={scorePercent(score)}
          hint={`${scorePercent(score)}% complete`}
          href="/today"
        />
        <StatCard
          label="Current Streak"
          icon={Flame}
          value={pluralize(overview.streak.current, "day")}
          hint={`Longest ${pluralize(overview.streak.longest, "day")} · ${settings.successThreshold}+/7 counts`}
          href="/analytics"
        />
        <StatCard
          label="Workouts This Week"
          icon={Dumbbell}
          value={`${overview.week.workouts} / ${settings.weeklyWorkoutTarget}`}
          progress={percent(overview.week.workouts, settings.weeklyWorkoutTarget)}
          hint={`${formatMinutes(overview.week.workoutMinutes)} trained`}
          href="/fitness"
        />
        <StatCard
          label="Learning Today"
          icon={BookOpen}
          value={`${formatMinutes(overview.today.learningMinutes)} / ${formatMinutes(settings.dailyLearningTargetMinutes)}`}
          progress={percent(overview.today.learningMinutes, settings.dailyLearningTargetMinutes)}
          hint={`${formatMinutes(overview.week.learningMinutes)} this week`}
          href="/learning"
        />
        <StatCard
          label="Outreach Today"
          icon={Send}
          value={`${overview.today.outreachActions} / ${settings.dailyOutreachTarget}`}
          progress={percent(overview.today.outreachActions, settings.dailyOutreachTarget)}
          hint={`${overview.week.outreachActions} this week · ${overview.week.replies} replies`}
          href="/clients"
        />
        <StatCard
          label="Revenue This Month"
          icon={CircleDollarSign}
          value={formatCurrency(overview.month.income, currency)}
          progress={settings.monthlyIncomeGoal > 0 ? percent(overview.month.income, settings.monthlyIncomeGoal) : undefined}
          hint={
            settings.monthlyIncomeGoal > 0
              ? `Goal ${formatCurrency(settings.monthlyIncomeGoal, currency)}`
              : "Set a goal in Settings"
          }
          href="/money"
        />
        <StatCard
          label="Savings This Month"
          icon={PiggyBank}
          value={formatCurrency(overview.month.savings, currency)}
          progress={settings.monthlySavingsGoal > 0 ? percent(overview.month.savings, settings.monthlySavingsGoal) : undefined}
          hint={
            settings.monthlySavingsGoal > 0
              ? `Goal ${formatCurrency(settings.monthlySavingsGoal, currency)}`
              : "Set a goal in Settings"
          }
          href="/money"
        />
        <StatCard
          label="Clients Won"
          icon={Trophy}
          value={overview.challenge.clientsWon}
          hint={`${formatCurrency(overview.challenge.wonValue, currency)} won this arc`}
          href="/clients"
        />
      </StatGrid>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1.35fr_1fr]">
        <div className="grid min-w-0 content-start grid-cols-1 gap-6">
          <Section id="mission" title="Today's Mission" description={formatISODate(today, "EEEE, MMMM d")}>
            <HabitChecklist date={today} habits={day.habits} timeZone={settings.timezone} />
          </Section>
          <Section id="top3" title="Today's Top 3" description="One income task, one skill task, one health task.">
            <TopPriorities date={today} priorities={day.priorities} />
          </Section>
        </div>

        <div className="grid min-w-0 content-start grid-cols-1 gap-6">
          <Section
            id="followups"
            title="Follow-ups Due"
            action={
              <Button asChild variant="ghost" size="sm">
                <Link href="/clients">CRM</Link>
              </Button>
            }
          >
            <FollowupList items={followups} today={today} />
          </Section>
          <Section id="weekly" title="Weekly Progress" description="Daily score, last 7 days">
            <WeeklyProgress days={lastNDays(overview.series, today, 7)} today={today} threshold={settings.successThreshold} />
          </Section>
          <Section id="focus" title="Needs Attention" description="Habits completed on under 40% of recent days">
            <FocusAreas
              completions={lastWeekHabits}
              windowDays={progress.status === "upcoming" ? 0 : Math.min(progress.daysElapsed, 7)}
            />
          </Section>
          <Section id="recent" title="Recent Activity">
            <RecentActivity rows={recent} currency={currency} />
          </Section>
        </div>
      </div>

      <AiCoachPlaceholder />
    </div>
  );
}
