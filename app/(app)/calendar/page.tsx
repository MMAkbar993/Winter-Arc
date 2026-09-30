import type { Metadata } from "next";
import { ActivityHeatmap, HeatmapLegend } from "@/components/shared/activity-heatmap";
import { PageHeader } from "@/components/shared/page-header";
import { Section } from "@/components/shared/section";
import { DayDetails } from "@/features/calendar/components/day-details";
import { MonthCalendar } from "@/features/calendar/components/month-calendar";
import { getDayDetail, getSeries } from "@/features/calendar/queries";
import { requireOnboardedContext } from "@/lib/data/context";
import {
  addDaysISO,
  endOfMonthISO,
  isISODate,
  maxISO,
  minISO,
  monthKeyToISO,
  startOfMonthISO,
} from "@/lib/dates";
import { emptyDay } from "@/lib/series";

export const metadata: Metadata = { title: "Calendar" };

export default async function CalendarPage({ searchParams }: PageProps<"/calendar">) {
  const ctx = await requireOnboardedContext();
  const { today, challenge, settings, supabase, user } = ctx;
  const params = await searchParams;

  const dateParam = typeof params.date === "string" && isISODate(params.date) ? params.date : null;
  const month =
    monthKeyToISO(typeof params.month === "string" ? params.month : null) ?? startOfMonthISO(dateParam ?? today);
  const selected = dateParam && dateParam <= today ? dateParam : null;

  const monthStart = startOfMonthISO(month);
  const monthEnd = endOfMonthISO(month);
  let rangeStart = minISO(challenge.startDate, monthStart);
  const rangeEnd = maxISO(challenge.endDate, monthEnd);
  rangeStart = maxISO(rangeStart, addDaysISO(rangeEnd, -790));

  const [series, detail, journalRes] = await Promise.all([
    getSeries(ctx, rangeStart, rangeEnd),
    selected ? getDayDetail(ctx, selected) : Promise.resolve(null),
    supabase.from("journal_entries").select("entry_date").eq("user_id", user.id).gte("entry_date", monthStart).lte("entry_date", monthEnd),
  ]);
  const scores = new Map(series.filter((d) => d.day <= today).map((d) => [d.day, d.score]));
  const journalDays = new Set((journalRes.data ?? []).map((j) => j.entry_date));

  return (
    <div className="grid grid-cols-1 gap-6">
      <PageHeader title="Calendar" description="Every day of the arc, colored by how many of the seven habits you completed." />

      <Section id="heatmap" title={challenge.name} description="Tap any day to see what happened.">
        <ActivityHeatmap
          start={challenge.startDate}
          end={challenge.endDate}
          scores={scores}
          today={today}
          selected={selected}
          hrefFor={(day) => `/calendar?month=${day.slice(0, 7)}&date=${day}`}
        />
        <HeatmapLegend className="mt-3" />
      </Section>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1.2fr_1fr]">
        <Section id="month" title="Month" contentClassName="pt-2">
          <MonthCalendar month={month} scores={scores} journalDays={journalDays} today={today} selected={selected} />
          <p className="mt-3 text-xs text-muted-foreground">A dot marks days with a journal entry.</p>
        </Section>
        <Section id="details" title="Day details">
          {selected && detail ? (
            <DayDetails
              date={selected}
              detail={detail}
              metrics={series.find((d) => d.day === selected) ?? emptyDay(selected)}
              currency={settings.currency}
            />
          ) : (
            <p className="text-sm text-muted-foreground">
              Select a past day on the calendar to see its score, habits, workout, learning, outreach, revenue and notes.
            </p>
          )}
        </Section>
      </div>
    </div>
  );
}
