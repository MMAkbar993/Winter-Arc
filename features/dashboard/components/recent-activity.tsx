import { BookOpen, Briefcase, CircleDollarSign, Dumbbell, Megaphone, Receipt, UserPlus, Activity } from "lucide-react";
import { EmptyState } from "@/components/shared/empty-state";
import { labelFor, WORKOUT_CATEGORIES, EXPENSE_CATEGORIES, INCOME_CATEGORIES } from "@/lib/constants";
import { formatISODate } from "@/lib/dates";
import { formatCurrency, formatMinutes } from "@/lib/format";
import type { ActivityKind, RecentActivityRow } from "@/types/database";

const META: Record<ActivityKind, { icon: typeof Dumbbell; verb: string }> = {
  workout: { icon: Dumbbell, verb: "Workout" },
  learning: { icon: BookOpen, verb: "Learned" },
  prospect: { icon: UserPlus, verb: "Prospect" },
  work: { icon: Briefcase, verb: "Worked on" },
  content: { icon: Megaphone, verb: "Posted" },
  income: { icon: CircleDollarSign, verb: "Earned" },
  expense: { icon: Receipt, verb: "Spent" },
};

function describe(row: RecentActivityRow, currency: string): { title: string; detail: string | null } {
  const value = row.value === null ? null : Number(row.value);
  switch (row.kind) {
    case "workout":
      return {
        title: labelFor(WORKOUT_CATEGORIES, row.title as never) || row.title,
        detail: value ? formatMinutes(value) : null,
      };
    case "learning":
    case "work":
      return { title: row.title, detail: value ? formatMinutes(value) : null };
    case "income":
      return {
        title: labelFor(INCOME_CATEGORIES, row.title as never) || row.title,
        detail: value !== null ? formatCurrency(value, currency) : null,
      };
    case "expense":
      return {
        title: labelFor(EXPENSE_CATEGORIES, row.title as never) || row.title,
        detail: value !== null ? formatCurrency(value, currency) : null,
      };
    case "prospect":
      return { title: row.title, detail: value ? formatCurrency(value, currency) : null };
    case "content":
      return { title: row.title, detail: null };
  }
}

export function RecentActivity({ rows, currency }: { rows: RecentActivityRow[]; currency: string }) {
  if (rows.length === 0) {
    return (
      <EmptyState
        compact
        icon={Activity}
        title="Nothing logged yet"
        description="Your workouts, learning, prospects and money will show up here."
      />
    );
  }
  return (
    <ul className="grid gap-1">
      {rows.map((row) => {
        const meta = META[row.kind];
        const { title, detail } = describe(row, currency);
        return (
          <li key={`${row.kind}-${row.id}`} className="flex items-center gap-3 rounded-lg px-1 py-2">
            <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-muted">
              <meta.icon aria-hidden className="size-4 text-muted-foreground" />
            </span>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm">
                <span className="text-muted-foreground">{meta.verb} · </span>
                {title}
              </p>
              <p className="text-xs text-muted-foreground">{formatISODate(row.occurred_on, "EEE, MMM d")}</p>
            </div>
            {detail ? <span className="shrink-0 text-sm tabular">{detail}</span> : null}
          </li>
        );
      })}
    </ul>
  );
}
