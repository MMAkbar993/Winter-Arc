import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { parseWeeklyStats } from "@/features/weekly-review/stats";
import { MAX_DAILY_SCORE } from "@/lib/constants";
import { endOfWeekISO, formatISODate } from "@/lib/dates";
import { formatCurrency, formatMinutes } from "@/lib/format";
import type { WeeklyReviewRow } from "@/types/database";

/** Compact summary of a saved weekly review. */
export function WeeklyReviewCard({ review, currency, active }: { review: WeeklyReviewRow; currency: string; active?: boolean }) {
  const stats = parseWeeklyStats(review.stats);
  return (
    <Link
      href={`/weekly-review?week=${review.week_start}`}
      aria-current={active ? "page" : undefined}
      className="flex items-center gap-3 rounded-xl border bg-card px-4 py-3 hover:border-foreground/20 aria-[current=page]:border-brand"
    >
      <div className="min-w-0 flex-1">
        <p className="text-sm font-medium">
          {formatISODate(review.week_start, "MMM d")} – {formatISODate(endOfWeekISO(review.week_start), "MMM d")}
        </p>
        {stats ? (
          <p className="truncate text-xs text-muted-foreground tabular">
            {stats.averageScore}/{MAX_DAILY_SCORE} avg · {stats.workouts} workouts · {formatMinutes(stats.learningMinutes)} learning ·{" "}
            {formatCurrency(stats.income, currency)}
          </p>
        ) : null}
        {review.went_well ? <p className="mt-1 truncate text-xs">{review.went_well}</p> : null}
      </div>
      <ChevronRight aria-hidden className="size-4 text-muted-foreground" />
    </Link>
  );
}
