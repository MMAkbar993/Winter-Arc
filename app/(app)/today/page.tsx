import type { Metadata } from "next";
import { PageHeader } from "@/components/shared/page-header";
import { Section } from "@/components/shared/section";
import { getOverview } from "@/features/dashboard/overview";
import { DailyNoteCard } from "@/features/habits/components/daily-note-card";
import { HabitChecklist } from "@/features/habits/components/habit-checklist";
import { TopPriorities } from "@/features/habits/components/top-priorities";
import { getDayLog } from "@/features/habits/queries";
import { QuickActionGrid } from "@/features/quick-add/quick-action-button";
import { TODAY_QUICK_ACTIONS } from "@/features/quick-add/quick-add-config";
import { requireOnboardedContext } from "@/lib/data/context";
import { formatISODate } from "@/lib/dates";
import { formatMinutes, pluralize } from "@/lib/format";
import { motivationForDate } from "@/lib/motivation";

export const metadata: Metadata = { title: "Today" };

export default async function TodayPage() {
  const ctx = await requireOnboardedContext();
  const { supabase, user, today, settings, progress, challenge } = ctx;
  const [day, overview] = await Promise.all([getDayLog(supabase, user.id, today), getOverview(ctx)]);

  const eyebrow =
    progress.status === "active"
      ? `Day ${progress.dayNumber} of ${progress.totalDays}`
      : progress.status === "upcoming"
        ? `${challenge.name} starts in ${pluralize(progress.daysUntilStart, "day")}`
        : `${challenge.name} complete`;

  return (
    <div className="grid grid-cols-1 gap-6">
      <PageHeader eyebrow={eyebrow} title={formatISODate(today, "EEEE, MMMM d")} description={motivationForDate(today)} />

      <Section id="habits" title="Daily Seven" description="Tap to complete. Logging a workout, work session or post ticks it for you.">
        <HabitChecklist date={today} habits={day.habits} timeZone={settings.timezone} variant="hero" />
      </Section>

      <section aria-labelledby="quick-actions-title" className="grid gap-3">
        <h2 id="quick-actions-title" className="text-sm font-semibold">
          Quick actions
        </h2>
        <QuickActionGrid kinds={TODAY_QUICK_ACTIONS} />
        <p className="text-xs text-muted-foreground">
          Today so far: {formatMinutes(overview.today.learningMinutes)} learning ·{" "}
          {overview.today.outreachActions}/{settings.dailyOutreachTarget} outreach ·{" "}
          {pluralize(overview.today.workouts, "workout")} · {formatMinutes(overview.today.workMinutes)} client work
        </p>
      </section>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Section id="top3" title="Today's Top 3" description="One income task, one skill task, one health task.">
          <TopPriorities date={today} priorities={day.priorities} />
        </Section>
        <DailyNoteCard date={today} note={day.note} />
      </div>
    </div>
  );
}
