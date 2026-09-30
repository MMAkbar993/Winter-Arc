import type { Metadata } from "next";
import { CalendarCheck2, Flame, Gauge, Medal, Target, TrendingDown, TrendingUp, Trophy } from "lucide-react";
import { BarList } from "@/components/charts/bar-list";
import { BarSeriesChart, LineSeriesChart } from "@/components/charts/lazy-charts";
import { DateRangePicker } from "@/components/shared/date-range-picker";
import { PageHeader } from "@/components/shared/page-header";
import { Section } from "@/components/shared/section";
import { StatCard, StatGrid } from "@/components/shared/stat-card";
import { getAnalyticsData } from "@/features/analytics/queries";
import { RANGE_PRESETS, resolveRange } from "@/features/analytics/range";
import { cumulative, sumByWeek } from "@/lib/analytics";
import { MAX_DAILY_SCORE } from "@/lib/constants";
import { requireOnboardedContext } from "@/lib/data/context";
import { formatISODate } from "@/lib/dates";
import { formatCurrency, formatMinutes, minutesToHours, pluralize } from "@/lib/format";

export const metadata: Metadata = { title: "Analytics" };

export default async function AnalyticsPage({ searchParams }: PageProps<"/analytics">) {
  const ctx = await requireOnboardedContext();
  const { today, challenge, settings } = ctx;
  const { currency } = settings;
  const range = resolveRange(await searchParams, { today, challengeStart: challenge.startDate, challengeEnd: challenge.endDate });
  const data = await getAnalyticsData(ctx, range.from, range.to);
  const { series, totals, funnel } = data;
  const rangeLabel = `${formatISODate(range.from, "MMM d")} – ${formatISODate(range.to, "MMM d, yyyy")}`;

  const daily = series.map((d) => ({
    day: d.day,
    score: d.score,
    learning: d.learningMinutes,
    outreach: d.outreachActions,
  }));
  const revenue = cumulative(series, (d) => d.income);
  const savings = cumulative(series, (d) => d.savings);
  const cumulativeMoney = series.map((d, i) => ({ day: d.day, revenue: revenue[i] ?? 0, savings: savings[i] ?? 0 }));
  const workoutsWeekly = sumByWeek(series, (d) => d.workouts);
  const postsWeekly = sumByWeek(series, (d) => d.postsPublished);

  const funnelSteps = [
    { label: "Contacted", value: funnel.contacted },
    { label: "Replied", value: funnel.replies },
    { label: "Qualified", value: funnel.qualified },
    { label: "Call scheduled", value: funnel.calls },
    { label: "Proposal sent", value: funnel.proposals },
    { label: "Won", value: funnel.won },
  ];

  return (
    <div className="grid grid-cols-1 gap-6">
      <PageHeader
        title="Analytics"
        description={rangeLabel}
        actions={
          <DateRangePicker
            presets={RANGE_PRESETS.map((p) => ({ value: p.value, label: p.label }))}
            activePreset={range.preset}
            from={range.from}
            to={range.to}
          />
        }
        className="sm:items-start"
      />

      <StatGrid>
        <StatCard label="Average daily score" icon={Gauge} tone="brand" value={`${totals.averageScore} / ${MAX_DAILY_SCORE}`} progress={totals.completionRate} hint={`${totals.completionRate}% completion`} />
        <StatCard label="Current streak" icon={Flame} value={pluralize(data.streak.current, "day")} hint={`Longest ${pluralize(data.streak.longest, "day")}`} />
        <StatCard label="Successful days" icon={CalendarCheck2} value={`${totals.successfulDays} / ${totals.days}`} hint={`${settings.successThreshold}+ habits · ${totals.perfectDays} perfect`} />
        <StatCard label="Strongest habit" icon={Trophy} value={data.strongest?.label ?? "—"} hint={data.strongest ? `${data.strongest.rate}% of days` : "No habits tracked yet"} />
        <StatCard label="Weakest habit" icon={Target} value={data.weakest?.label ?? "—"} hint={data.weakest ? `${data.weakest.rate}% of days` : undefined} tone="warning" />
        <StatCard label="Best weekday" icon={TrendingUp} value={data.bestDay?.label ?? "—"} hint={data.bestDay ? `${data.bestDay.averageScore}/7 average` : undefined} />
        <StatCard label="Lowest weekday" icon={TrendingDown} value={data.worstDay?.label ?? "—"} hint={data.worstDay ? `${data.worstDay.averageScore}/7 average` : undefined} />
        <StatCard label="Clients won" icon={Medal} value={totals.clientsWon} hint={formatCurrency(totals.wonValue, currency)} />
      </StatGrid>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Section id="score-trend" title="Daily score trend" description="Habits completed per day (0–7)">
          <LineSeriesChart data={daily} xKey="day" yKey="score" format="score" formatX="date" yDomain={[0, MAX_DAILY_SCORE]} area
            label={`Daily score from ${rangeLabel}; average ${totals.averageScore} of 7.`} />
        </Section>
        <Section id="weekly-completion" title="Weekly completion rate" description="Share of the 7 habits completed, per week">
          <BarSeriesChart data={data.weekly.map((w) => ({ week: w.weekStart, rate: w.completionRate }))} xKey="week" yKey="rate" format="percent" formatX="weekStart" yDomain={[0, 100]}
            label={`Weekly completion rate across ${data.weekly.length} weeks.`} />
        </Section>
        <Section id="habit-breakdown" title="Habit completion breakdown" description="Share of days each habit was completed">
          <BarList items={data.habits.map((h) => ({ label: h.label, value: h.rate, hint: `${h.completed}d` }))} format={(v) => `${v}%`} emptyLabel="No habits tracked in this range." />
        </Section>
        <Section id="weekday" title="Performance by weekday" description="Average daily score">
          <BarList items={data.weekdays.map((w) => ({ label: w.label, value: w.averageScore }))} format={(v) => `${v}/7`} emptyLabel="Not enough days yet." />
        </Section>
        <Section id="learning" title="Learning hours" description={`${minutesToHours(totals.learningMinutes)}h in range`}>
          <BarSeriesChart data={daily} xKey="day" yKey="learning" format="minutes" formatX="date"
            label={`Learning minutes per day; ${formatMinutes(totals.learningMinutes)} total.`} />
        </Section>
        <Section id="workouts" title="Workout frequency" description={`${totals.workouts} workouts · per week`}>
          <BarSeriesChart data={workoutsWeekly.map((w) => ({ week: w.weekStart, workouts: w.value }))} xKey="week" yKey="workouts" formatX="weekStart"
            label={`Workouts per week; ${totals.workouts} total.`} />
        </Section>
        <Section id="outreach" title="Outreach activity" description={`${totals.outreachActions} actions · ${totals.replies} replies`}>
          <BarSeriesChart data={daily} xKey="day" yKey="outreach" formatX="date"
            label={`Outreach actions per day; ${totals.outreachActions} total.`} />
        </Section>
        <Section id="funnel" title="CRM funnel" description="Prospects reaching each stage">
          <BarList items={funnelSteps} emptyLabel="No prospects in this range." />
          <p className="mt-3 text-xs text-muted-foreground">Reply rate {funnel.replyRate}% · pipeline {formatCurrency(funnel.pipelineValue, currency)}</p>
        </Section>
        <Section id="revenue" title="Revenue trend" description={`Cumulative · ${formatCurrency(totals.income, currency)} in range`}>
          <LineSeriesChart data={cumulativeMoney} xKey="day" yKey="revenue" format={{ currency }} formatX="date" area
            label={`Cumulative revenue reaching ${formatCurrency(totals.income, currency)}.`} />
        </Section>
        <Section id="savings" title="Savings trend" description={`Cumulative · ${formatCurrency(totals.savings, currency)} in range`}>
          <LineSeriesChart data={cumulativeMoney} xKey="day" yKey="savings" format={{ currency }} formatX="date" color="var(--chart-3)" area
            label={`Cumulative net savings reaching ${formatCurrency(totals.savings, currency)}.`} />
        </Section>
        <Section id="content" title="Content publishing frequency" description={`${totals.postsPublished} posts · per week`} className="lg:col-span-2">
          <BarSeriesChart data={postsWeekly.map((w) => ({ week: w.weekStart, posts: w.value }))} xKey="week" yKey="posts" formatX="weekStart" height={180}
            label={`Posts published per week; ${totals.postsPublished} total.`} />
        </Section>
      </div>
    </div>
  );
}
