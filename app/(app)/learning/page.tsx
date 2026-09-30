import type { Metadata } from "next";
import { BookOpen, CalendarRange, Clock, Flame, GraduationCap, Timer } from "lucide-react";
import { BarList } from "@/components/charts/bar-list";
import { BarSeriesChart } from "@/components/charts/lazy-charts";
import { DeleteButton } from "@/components/shared/delete-button";
import { EmptyState } from "@/components/shared/empty-state";
import { PageHeader } from "@/components/shared/page-header";
import { RecordList, RecordRow } from "@/components/shared/record-list";
import { Section } from "@/components/shared/section";
import { StatCard, StatGrid } from "@/components/shared/stat-card";
import { Badge } from "@/components/ui/badge";
import { deleteLearningSession } from "@/features/learning/actions";
import { getLearningData } from "@/features/learning/queries";
import { EditRecordButton } from "@/features/quick-add/edit-record-button";
import { AddButton } from "@/features/quick-add/quick-action-button";
import { labelFor, LEARNING_CATEGORIES } from "@/lib/constants";
import { requireOnboardedContext } from "@/lib/data/context";
import { formatISODate } from "@/lib/dates";
import { formatMinutes, minutesToHours, percent, pluralize } from "@/lib/format";
import { str } from "@/lib/options";
import { lastNDays } from "@/lib/series";

export const metadata: Metadata = { title: "Learning" };

export default async function LearningPage() {
  const ctx = await requireOnboardedContext();
  const { settings, today } = ctx;
  const data = await getLearningData(ctx);
  const { overview } = data;
  const target = settings.dailyLearningTargetMinutes;
  const chartDays = lastNDays(overview.series, today, 14).map((d) => ({ day: d.day, minutes: d.learningMinutes }));

  return (
    <div className="grid grid-cols-1 gap-6">
      <PageHeader
        title="Learning"
        description={`Two focused hours a day compound. Target: ${formatMinutes(target)} daily.`}
        actions={<AddButton kind="learning" />}
      />

      <StatGrid>
        <StatCard
          label="Today"
          icon={Timer}
          tone="brand"
          value={`${formatMinutes(overview.today.learningMinutes)} / ${formatMinutes(target)}`}
          progress={percent(overview.today.learningMinutes, target)}
        />
        <StatCard label="This week" icon={CalendarRange} value={`${minutesToHours(overview.week.learningMinutes)}h`} />
        <StatCard label="This month" icon={Clock} value={`${minutesToHours(overview.month.learningMinutes)}h`} />
        <StatCard label="Winter Arc total" icon={GraduationCap} value={`${minutesToHours(overview.challenge.learningMinutes)}h`} />
        <StatCard label="Average per day" icon={BookOpen} value={formatMinutes(data.averageMinutesPerDay)} hint="Across challenge days so far" />
        <StatCard
          label="Learning streak"
          icon={Flame}
          value={pluralize(data.currentStreak, "day")}
          hint={`Longest ${pluralize(data.longestStreak, "day")}`}
        />
        <StatCard label="Most studied" icon={GraduationCap} value={data.mostStudied ?? "—"} />
      </StatGrid>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1.5fr_1fr]">
        <Section id="daily" title="Learning time per day" description="Last 14 days">
          <BarSeriesChart
            data={chartDays}
            xKey="day"
            yKey="minutes"
            format="minutes"
            formatX="date"
            highlightKey={today}
            label={`Learning minutes per day for the last 14 days. Today: ${formatMinutes(overview.today.learningMinutes)}.`}
          />
        </Section>
        <Section id="topics" title="Time by topic" description="This challenge">
          <BarList items={data.byCategory.map((c) => ({ label: c.label, value: c.minutes }))} format={formatMinutes} />
        </Section>
      </div>

      <Section id="sessions" title="Sessions" description={`${data.sessions.length} logged`}>
        {data.sessions.length === 0 ? (
          <EmptyState
            icon={BookOpen}
            title="No learning sessions yet"
            description="Log your first focused session — it counts toward today's 2-hour target."
            action={<AddButton kind="learning" label="Log your first session" />}
          />
        ) : (
          <RecordList>
            {data.sessions.map((s) => (
              <RecordRow
                key={s.id}
                title={s.topic}
                meta={
                  <>
                    <span>{formatISODate(s.session_date, "EEE, MMM d")}</span>
                    <Badge variant="secondary">{labelFor(LEARNING_CATEGORIES, s.category)}</Badge>
                    {s.resource ? <span className="truncate">{s.resource}</span> : null}
                    {s.projects?.name ? <span>· {s.projects.name}</span> : null}
                    {!s.completed ? <Badge variant="outline">In progress</Badge> : null}
                  </>
                }
                value={formatMinutes(s.duration_minutes)}
                actions={
                  <>
                    <EditRecordButton
                      kind="learning"
                      id={s.id}
                      title="Edit learning session"
                      initial={{
                        date: s.session_date,
                        topic: s.topic,
                        category: s.category,
                        duration: str(s.duration_minutes),
                        resource: str(s.resource),
                        notes: str(s.notes),
                        projectId: str(s.project_id),
                        completed: s.completed,
                      }}
                    />
                    <DeleteButton action={deleteLearningSession.bind(null, s.id)} itemLabel="session" />
                  </>
                }
              />
            ))}
          </RecordList>
        )}
      </Section>
    </div>
  );
}
