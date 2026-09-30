import Link from "next/link";
import { MAX_DAILY_SCORE } from "@/lib/constants";
import { eachDayISO, formatISODate, startOfWeekISO, type ISODate, endOfWeekISO } from "@/lib/dates";
import { intensityForScore, type Intensity } from "@/lib/scoring";
import { cn } from "@/lib/utils";

export const HEAT_CLASS: Record<Intensity, string> = {
  0: "bg-heat-0",
  1: "bg-heat-1",
  2: "bg-heat-2",
  3: "bg-heat-3",
  4: "bg-heat-4",
};

const LEGEND: { level: Intensity; label: string }[] = [
  { level: 0, label: "0" },
  { level: 1, label: "1–2" },
  { level: 2, label: "3–4" },
  { level: 3, label: "5–6" },
  { level: 4, label: "7" },
];

export function HeatmapLegend({ className }: { className?: string }) {
  return (
    <div className={cn("flex flex-wrap items-center gap-2 text-[11px] text-muted-foreground", className)}>
      <span>Habits done:</span>
      {LEGEND.map((l) => (
        <span key={l.level} className="flex items-center gap-1">
          <span aria-hidden className={cn("size-3 rounded-[3px] ring-1 ring-foreground/5", HEAT_CLASS[l.level])} />
          {l.label}
        </span>
      ))}
    </div>
  );
}

/**
 * GitHub-style contribution grid: one column per week (Mon→Sun), one cell per
 * day, colored by score. Each cell is a link with a full text label.
 */
export function ActivityHeatmap({
  start,
  end,
  scores,
  today,
  selected,
  hrefFor,
}: {
  start: ISODate;
  end: ISODate;
  scores: ReadonlyMap<ISODate, number>;
  today: ISODate;
  selected?: ISODate | null;
  hrefFor: (day: ISODate) => string;
}) {
  const days = eachDayISO(startOfWeekISO(start), endOfWeekISO(end));
  const weeks: ISODate[][] = [];
  for (let i = 0; i < days.length; i += 7) weeks.push(days.slice(i, i + 7));

  return (
    <div className="overflow-x-auto pb-1">
      <div className="flex w-max gap-[3px]" role="grid" aria-label="Challenge activity heatmap">
        {weeks.map((week) => (
          <div key={week[0]} role="row" className="grid grid-rows-7 gap-[3px]">
            {week.map((day) => {
              const inRange = day >= start && day <= end;
              if (!inRange) return <span key={day} role="gridcell" aria-hidden className="size-3.5 sm:size-4" />;
              const future = day > today;
              const score = scores.get(day) ?? 0;
              const label = `${formatISODate(day, "EEEE, MMMM d")}: ${future ? "upcoming" : `${score} of ${MAX_DAILY_SCORE} habits`}`;
              return (
                <span key={day} role="gridcell">
                  <Link
                    href={hrefFor(day)}
                    aria-label={label}
                    title={label}
                    aria-current={day === selected ? "date" : undefined}
                    className={cn(
                      "block size-3.5 rounded-[3px] ring-1 ring-foreground/5 transition-transform hover:scale-125 sm:size-4",
                      future ? "bg-transparent ring-foreground/10" : HEAT_CLASS[intensityForScore(score)],
                      day === today && "ring-2 ring-foreground/50",
                      day === selected && "ring-2 ring-brand",
                    )}
                  />
                </span>
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
}
