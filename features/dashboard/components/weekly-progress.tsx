import { MAX_DAILY_SCORE } from "@/lib/constants";
import { formatISODate } from "@/lib/dates";
import type { DayMetrics } from "@/lib/series";
import { cn } from "@/lib/utils";

/**
 * Seven-day score bars. One series (daily score), so no legend: the section
 * title names it. Values are printed under each bar and the whole chart has a
 * text alternative, so nothing depends on color.
 */
export function WeeklyProgress({ days, today, threshold }: { days: DayMetrics[]; today: string; threshold: number }) {
  const thresholdPct = (threshold / MAX_DAILY_SCORE) * 100;
  return (
    <figure>
      <div className="relative flex h-36 items-end gap-2" aria-hidden>
        <div
          className="pointer-events-none absolute inset-x-0 border-t border-dashed border-foreground/15"
          style={{ bottom: `${thresholdPct}%` }}
        />
        {days.map((d) => {
          const pct = (d.score / MAX_DAILY_SCORE) * 100;
          const future = d.day > today;
          return (
            <div key={d.day} className="group/bar relative flex h-full flex-1 flex-col justify-end">
              <div
                title={`${formatISODate(d.day, "EEE, MMM d")}: ${d.score}/${MAX_DAILY_SCORE}`}
                className={cn(
                  "w-full rounded-t-[4px] transition-colors",
                  d.score >= threshold ? "bg-brand" : "bg-brand/40",
                  d.score === 0 && "bg-muted",
                  future && "bg-transparent",
                )}
                style={{ height: `${Math.max(pct, d.score === 0 ? 4 : 0)}%` }}
              />
            </div>
          );
        })}
      </div>
      <div className="mt-2 flex gap-2" aria-hidden>
        {days.map((d) => (
          <div key={d.day} className="flex-1 text-center">
            <p className={cn("text-[11px] text-muted-foreground", d.day === today && "font-semibold text-foreground")}>
              {formatISODate(d.day, "EEEEE")}
            </p>
            <p className="text-xs tabular">{d.day > today ? "–" : d.score}</p>
          </div>
        ))}
      </div>
      <figcaption className="sr-only">
        Daily scores for the last seven days:{" "}
        {days.map((d) => `${formatISODate(d.day, "EEEE")} ${d.score} of ${MAX_DAILY_SCORE}`).join(", ")}. Dashed line marks
        the successful-day threshold of {threshold}.
      </figcaption>
    </figure>
  );
}
