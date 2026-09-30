import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { HEAT_CLASS } from "@/components/shared/activity-heatmap";
import { Button } from "@/components/ui/button";
import { MAX_DAILY_SCORE } from "@/lib/constants";
import {
  addDaysISO,
  eachDayISO,
  endOfMonthISO,
  endOfWeekISO,
  formatISODate,
  startOfMonthISO,
  startOfWeekISO,
  type ISODate,
} from "@/lib/dates";
import { intensityForScore } from "@/lib/scoring";
import { cn } from "@/lib/utils";

const WEEKDAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

export function MonthCalendar({
  month,
  scores,
  journalDays,
  today,
  selected,
}: {
  month: ISODate;
  scores: ReadonlyMap<ISODate, number>;
  journalDays: ReadonlySet<ISODate>;
  today: ISODate;
  selected: ISODate | null;
}) {
  const monthStart = startOfMonthISO(month);
  const monthEnd = endOfMonthISO(month);
  const days = eachDayISO(startOfWeekISO(monthStart), endOfWeekISO(monthEnd));
  const prev = addDaysISO(monthStart, -1).slice(0, 7);
  const next = addDaysISO(monthEnd, 1).slice(0, 7);

  return (
    <div className="grid gap-3">
      <div className="flex items-center justify-between">
        <h2 className="text-base font-semibold">{formatISODate(monthStart, "MMMM yyyy")}</h2>
        <div className="flex gap-1">
          <Button asChild variant="outline" size="icon" aria-label="Previous month">
            <Link href={`/calendar?month=${prev}`} scroll={false}>
              <ChevronLeft aria-hidden />
            </Link>
          </Button>
          <Button asChild variant="outline" size="sm" className="h-8">
            <Link href="/calendar" scroll={false}>
              Today
            </Link>
          </Button>
          <Button asChild variant="outline" size="icon" aria-label="Next month">
            <Link href={`/calendar?month=${next}`} scroll={false}>
              <ChevronRight aria-hidden />
            </Link>
          </Button>
        </div>
      </div>
      <div className="grid grid-cols-7 gap-1 text-center text-[11px] text-muted-foreground" aria-hidden>
        {WEEKDAYS.map((d) => (
          <span key={d}>{d}</span>
        ))}
      </div>
      <div className="grid grid-cols-7 gap-1">
        {days.map((day) => {
          const inMonth = day >= monthStart && day <= monthEnd;
          const future = day > today;
          const score = scores.get(day) ?? 0;
          const label = `${formatISODate(day, "EEEE, MMMM d")}: ${future ? "upcoming" : `${score} of ${MAX_DAILY_SCORE}`}${journalDays.has(day) ? ", journal entry" : ""}`;
          return (
            <Link
              key={day}
              href={`/calendar?month=${day.slice(0, 7)}&date=${day}`}
              scroll={false}
              aria-label={label}
              aria-current={day === selected ? "date" : undefined}
              className={cn(
                "relative flex aspect-square flex-col items-center justify-center rounded-lg text-sm transition-colors sm:aspect-[4/3]",
                !inMonth && "opacity-35",
                future ? "bg-muted/30 text-muted-foreground" : HEAT_CLASS[intensityForScore(score)],
                intensityForScore(score) >= 3 && !future && "text-brand-foreground",
                day === today && "ring-2 ring-foreground/60",
                day === selected && "ring-2 ring-brand",
              )}
            >
              <span className="font-medium tabular">{Number(day.slice(8))}</span>
              {!future && score > 0 ? <span className="text-[10px] opacity-80 tabular">{score}/7</span> : null}
              {journalDays.has(day) ? (
                <span aria-hidden className="absolute top-1 right-1 size-1.5 rounded-full bg-foreground/70" />
              ) : null}
            </Link>
          );
        })}
      </div>
    </div>
  );
}
