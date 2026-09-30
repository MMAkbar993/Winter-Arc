import type { Metadata } from "next";
import Link from "next/link";
import { ChevronLeft, ChevronRight, ClipboardCheck } from "lucide-react";
import { PageHeader } from "@/components/shared/page-header";
import { Section } from "@/components/shared/section";
import { Button } from "@/components/ui/button";
import { getSeries } from "@/features/calendar/queries";
import { WeeklyReviewCard } from "@/features/weekly-review/components/weekly-review-card";
import { WeeklyReviewForm } from "@/features/weekly-review/components/weekly-review-form";
import { MAX_DAILY_SCORE, WEEKLY_REVIEW_WEEKDAY } from "@/lib/constants";
import { requireOnboardedContext } from "@/lib/data/context";
import { addDaysISO, endOfWeekISO, formatISODate, isISODate, minISO, startOfWeekISO, weekdayOf } from "@/lib/dates";
import { formatCurrency, formatMinutes, minutesToHours } from "@/lib/format";
import { str } from "@/lib/options";
import { totalsForRange } from "@/lib/series";

export const metadata: Metadata = { title: "Weekly Review" };

export default async function WeeklyReviewPage({ searchParams }: PageProps<"/weekly-review">) {
  const ctx = await requireOnboardedContext();
  const { supabase, user, today, settings } = ctx;
  const { currency } = settings;
  const params = await searchParams;
  const currentWeek = startOfWeekISO(today);
  const requested = typeof params.week === "string" && isISODate(params.week) ? startOfWeekISO(params.week) : currentWeek;
  const weekStart = requested > currentWeek ? currentWeek : requested;
  const weekEnd = endOfWeekISO(weekStart);
  const statsEnd = minISO(weekEnd, today);

  const [series, reviewRes, historyRes] = await Promise.all([
    getSeries(ctx, weekStart, statsEnd),
    supabase.from("weekly_reviews").select("*").eq("user_id", user.id).eq("week_start", weekStart).maybeSingle(),
    supabase.from("weekly_reviews").select("*").eq("user_id", user.id).order("week_start", { ascending: false }).limit(20),
  ]);
  const t = totalsForRange(series, weekStart, statsEnd, settings.successThreshold);
  const review = reviewRes.data;
  const isSunday = weekdayOf(today) === WEEKLY_REVIEW_WEEKDAY;

  const stats = [
    { label: "Average daily score", value: `${t.averageScore}/${MAX_DAILY_SCORE}` },
    { label: "Workouts", value: String(t.workouts) },
    { label: "Learning", value: `${minutesToHours(t.learningMinutes)}h` },
    { label: "Outreach actions", value: String(t.outreachActions) },
    { label: "Replies", value: String(t.replies) },
    { label: "Clients won", value: String(t.clientsWon) },
    { label: "Project work", value: `${minutesToHours(t.workMinutes)}h` },
    { label: "Posts published", value: String(t.postsPublished) },
    { label: "Income", value: formatCurrency(t.income, currency) },
    { label: "Expenses", value: formatCurrency(t.expenses, currency) },
    { label: "Savings", value: formatCurrency(t.savings, currency) },
  ];

  return (
    <div className="grid grid-cols-1 gap-6">
      <PageHeader
        title="Weekly Review"
        description="Every Sunday: look back honestly, then set up next week."
        actions={
          <div className="flex items-center gap-1">
            <Button asChild variant="outline" size="icon" aria-label="Previous week">
              <Link href={`/weekly-review?week=${addDaysISO(weekStart, -7)}`}>
                <ChevronLeft aria-hidden />
              </Link>
            </Button>
            <span className="min-w-36 text-center text-sm font-medium tabular">
              {formatISODate(weekStart, "MMM d")} – {formatISODate(weekEnd, "MMM d")}
            </span>
            <Button asChild variant="outline" size="icon" aria-label="Next week" aria-disabled={weekStart === currentWeek}>
              <Link
                href={`/weekly-review?week=${addDaysISO(weekStart, 7)}`}
                className={weekStart === currentWeek ? "pointer-events-none opacity-40" : undefined}
                tabIndex={weekStart === currentWeek ? -1 : undefined}
              >
                <ChevronRight aria-hidden />
              </Link>
            </Button>
          </div>
        }
      />

      {weekStart === currentWeek && !review ? (
        <div className="surface-glow flex items-center gap-3 rounded-xl border p-4">
          <ClipboardCheck aria-hidden className="size-5 text-brand" />
          <p className="text-sm">
            {isSunday ? "It's Sunday — your weekly review is due." : "Your review for this week opens fully on Sunday, but you can start any time."}
          </p>
        </div>
      ) : null}

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_1.4fr]">
        <div className="grid min-w-0 content-start grid-cols-1 gap-6">
          <Section id="week-stats" title="This week in numbers" description="Calculated automatically">
            <dl className="grid grid-cols-2 gap-x-4 gap-y-3">
              {stats.map((s) => (
                <div key={s.label}>
                  <dt className="text-xs text-muted-foreground">{s.label}</dt>
                  <dd className="text-sm font-semibold tabular">{s.value}</dd>
                </div>
              ))}
            </dl>
          </Section>
          <Section id="history" title="Past reviews">
            {historyRes.data && historyRes.data.length > 0 ? (
              <ul className="grid gap-2">
                {historyRes.data.map((r) => (
                  <li key={r.id}>
                    <WeeklyReviewCard review={r} currency={currency} active={r.week_start === weekStart} />
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-muted-foreground">Your saved reviews will appear here.</p>
            )}
          </Section>
        </div>

        <Section id="review" title={review ? "Your review" : "Write your review"} description={review ? "Saved — edit any time." : undefined}>
          <WeeklyReviewForm
            key={weekStart}
            initial={{
              weekStart,
              built: str(review?.built),
              learned: str(review?.learned),
              prospects_contacted: str(review?.prospects_contacted),
              money_earned: str(review?.money_earned),
              money_saved: str(review?.money_saved),
              time_wasters: str(review?.time_wasters),
              went_well: str(review?.went_well),
              improve_next: str(review?.improve_next),
              reflection: str(review?.reflection),
            }}
            hints={{
              learned: `${formatMinutes(t.learningMinutes)} of learning logged this week`,
              prospects_contacted: `${t.outreachActions} outreach actions · ${t.replies} replies · ${t.clientsWon} won`,
              money_earned: `${formatCurrency(t.income, currency)} logged as income`,
              money_saved: `${formatCurrency(t.savings, currency)} net savings`,
            }}
          />
        </Section>
      </div>
    </div>
  );
}
