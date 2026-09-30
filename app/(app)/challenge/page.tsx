import type { Metadata } from "next";
import { Trophy } from "lucide-react";
import { ActivityHeatmap, HeatmapLegend } from "@/components/shared/activity-heatmap";
import { PageHeader } from "@/components/shared/page-header";
import { Section } from "@/components/shared/section";
import { ChallengeProgress } from "@/features/dashboard/components/challenge-progress";
import { getOverview } from "@/features/dashboard/overview";
import { MAX_DAILY_SCORE, TAGLINE } from "@/lib/constants";
import { requireOnboardedContext } from "@/lib/data/context";
import { formatCurrency, minutesToHours, pluralize } from "@/lib/format";

export const metadata: Metadata = { title: "Challenge Progress" };

export default async function ChallengePage() {
  const ctx = await requireOnboardedContext();
  const { challenge, progress, settings, today } = ctx;
  const overview = await getOverview(ctx);
  const t = overview.challenge;
  const { currency } = settings;
  const complete = progress.status === "completed";

  const results = [
    { label: "Days elapsed", value: `${progress.daysElapsed} / ${progress.totalDays}` },
    { label: "Days remaining", value: String(progress.daysRemaining) },
    { label: "Average score", value: `${t.averageScore} / ${MAX_DAILY_SCORE}` },
    { label: "Successful days", value: String(overview.streak.successfulDays) },
    { label: "Perfect 7/7 days", value: String(overview.streak.perfectDays) },
    { label: "Longest streak", value: pluralize(overview.streak.longest, "day") },
    { label: "Workouts", value: String(t.workouts) },
    { label: "Learning", value: `${minutesToHours(t.learningMinutes)}h` },
    { label: "Prospects contacted", value: String(t.prospectsContacted) },
    { label: "Outreach actions", value: String(t.outreachActions) },
    { label: "Clients won", value: String(t.clientsWon) },
    { label: "Total revenue", value: formatCurrency(t.income, currency) },
    { label: "Total savings", value: formatCurrency(t.savings, currency) },
    { label: "Content published", value: String(t.postsPublished) },
  ];

  return (
    <div className="grid grid-cols-1 gap-6">
      {complete ? (
        <section className="surface-glow flex flex-col items-center gap-3 rounded-3xl border px-6 py-12 text-center">
          <Trophy aria-hidden className="size-10 text-brand" />
          <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">{challenge.name} Complete</h1>
          <p className="max-w-md text-muted-foreground">
            {progress.totalDays} days. {overview.streak.successfulDays} successful. {TAGLINE}
          </p>
        </section>
      ) : (
        <PageHeader title="Challenge Progress" description={`${challenge.name} — every number from day one.`} />
      )}

      <ChallengeProgress name={challenge.name} startDate={challenge.startDate} endDate={challenge.endDate} progress={progress} />

      <Section id="results" title={complete ? "Full results" : "Results so far"}>
        <dl className="grid grid-cols-2 gap-x-6 gap-y-4 sm:grid-cols-3 lg:grid-cols-4">
          {results.map((r) => (
            <div key={r.label}>
              <dt className="text-xs text-muted-foreground">{r.label}</dt>
              <dd className="text-lg font-semibold tabular">{r.value}</dd>
            </div>
          ))}
        </dl>
      </Section>

      <Section id="heatmap" title="Every day">
        <ActivityHeatmap
          start={challenge.startDate}
          end={challenge.endDate}
          scores={new Map(overview.series.map((d) => [d.day, d.score]))}
          today={today}
          hrefFor={(day) => `/calendar?month=${day.slice(0, 7)}&date=${day}`}
        />
        <HeatmapLegend className="mt-3" />
      </Section>
    </div>
  );
}
