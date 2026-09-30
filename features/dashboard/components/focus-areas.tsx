import { AlertCircle, CheckCircle2 } from "lucide-react";
import { habitBreakdown } from "@/lib/analytics";
import type { HabitKey } from "@/lib/constants";

/** A habit completed on less than this share of recent days is flagged. */
const NEGLECTED_BELOW_RATE = 40;

/**
 * "Which areas am I neglecting?" — over the last `windowDays` tracked days
 * (up to 7, never counting days before the challenge started).
 */
export function FocusAreas({
  completions,
  windowDays,
}: {
  completions: { habit_key: HabitKey; completed: boolean }[];
  windowDays: number;
}) {
  if (windowDays < 2 || completions.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">
        Nothing to flag yet. After a few days of tracking, habits you keep skipping will show up here.
      </p>
    );
  }

  const stats = habitBreakdown(completions, windowDays);
  const neglected = stats.filter((s) => s.rate < NEGLECTED_BELOW_RATE).sort((a, b) => a.completed - b.completed);

  if (neglected.length === 0) {
    return (
      <p className="flex items-center gap-2 text-sm text-muted-foreground">
        <CheckCircle2 aria-hidden className="size-4 text-brand" />
        No neglected habits over the last {windowDays} days.
      </p>
    );
  }
  return (
    <ul className="grid gap-2">
      {neglected.map((s) => (
        <li key={s.key} className="flex items-center gap-3">
          <AlertCircle aria-hidden className="size-4 shrink-0 text-warning" />
          <span className="flex-1 text-sm">{s.label}</span>
          <span className="text-xs text-muted-foreground tabular">
            {s.completed}/{windowDays} days
          </span>
        </li>
      ))}
    </ul>
  );
}
