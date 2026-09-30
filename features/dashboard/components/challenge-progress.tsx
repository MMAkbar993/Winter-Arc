import Link from "next/link";
import { ArrowRight, Trophy } from "lucide-react";
import type { ChallengeProgress as Progress } from "@/lib/challenge";
import { formatISODate } from "@/lib/dates";
import { cn } from "@/lib/utils";

export function ChallengeProgress({
  name,
  startDate,
  endDate,
  progress,
  className,
}: {
  name: string;
  startDate: string;
  endDate: string;
  progress: Progress;
  className?: string;
}) {
  const range = `${formatISODate(startDate, "MMMM d")} → ${formatISODate(endDate, "MMMM d, yyyy")}`;

  if (progress.status === "completed") {
    return (
      <Link
        href="/challenge"
        className={cn("surface-glow flex items-center gap-4 rounded-2xl border bg-card p-5 hover:border-foreground/20", className)}
      >
        <Trophy aria-hidden className="size-8 text-brand" />
        <div className="flex-1">
          <p className="font-semibold">{name} Complete</p>
          <p className="text-sm text-muted-foreground">{range} · See your full results</p>
        </div>
        <ArrowRight aria-hidden className="size-4 text-muted-foreground" />
      </Link>
    );
  }

  const headline =
    progress.status === "upcoming"
      ? progress.daysUntilStart === 1
        ? "Starts tomorrow"
        : `Starts in ${progress.daysUntilStart} days`
      : `Day ${progress.dayNumber} of ${progress.totalDays}`;

  return (
    <div className={cn("surface-glow rounded-2xl border bg-card p-5", className)}>
      <div className="flex flex-wrap items-end justify-between gap-2">
        <div>
          <p className="text-xs font-medium text-muted-foreground">{name}</p>
          <p className="text-xl font-semibold tracking-tight tabular">{headline}</p>
        </div>
        <p className="text-sm text-muted-foreground tabular">
          {progress.status === "active"
            ? `${progress.percentComplete}% complete · ${progress.daysRemaining} days left`
            : `${progress.totalDays} days · ${range}`}
        </p>
      </div>
      <div
        className="mt-4 h-2 overflow-hidden rounded-full bg-muted"
        role="progressbar"
        aria-label={`${name} progress`}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={progress.percentComplete}
        aria-valuetext={`${headline}, ${progress.percentComplete}% complete`}
      >
        <div
          className="h-full rounded-full bg-brand transition-[width] duration-700"
          style={{ width: `${Math.max(progress.percentComplete, progress.status === "active" ? 1 : 0)}%` }}
        />
      </div>
      <div className="mt-2 flex items-center justify-between gap-2 text-xs text-muted-foreground">
        <p>Challenge ending {formatISODate(endDate, "MMMM d, yyyy")}</p>
        <Link href="/challenge" className="inline-flex items-center gap-1 font-medium text-foreground hover:underline">
          Challenge results <ArrowRight aria-hidden className="size-3" />
        </Link>
      </div>
    </div>
  );
}
