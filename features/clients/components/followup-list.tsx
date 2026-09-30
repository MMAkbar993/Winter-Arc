"use client";

import { useOptimistic, useTransition } from "react";
import { Check, Clock } from "lucide-react";
import { toast } from "sonner";
import { EmptyState } from "@/components/shared/empty-state";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { completeFollowup } from "@/features/clients/actions";
import type { FollowupItem } from "@/features/dashboard/queries";
import { addDaysISO, diffDaysISO, formatISODate } from "@/lib/dates";

const SNOOZE_DAYS = 2;

export function FollowupList({ items, today }: { items: FollowupItem[]; today: string }) {
  const [optimistic, remove] = useOptimistic(items, (state: FollowupItem[], id: string) => state.filter((i) => i.id !== id));
  const [, startTransition] = useTransition();

  const act = (id: string, status: "done" | "skipped", nextDueOn?: string) =>
    startTransition(async () => {
      remove(id);
      const result = await completeFollowup({ id, status, nextDueOn: nextDueOn ?? "" });
      if (!result.ok) toast.error(result.error);
      else toast.success(status === "done" ? "Follow-up done" : `Snoozed ${SNOOZE_DAYS} days`);
    });

  if (optimistic.length === 0) {
    return <EmptyState compact icon={Check} title="No follow-ups due" description="You're on top of every conversation." />;
  }

  return (
    <ul className="grid gap-2">
      {optimistic.map((f) => {
        const overdueBy = diffDaysISO(today, f.dueOn);
        return (
          <li key={f.id} className="flex flex-wrap items-center gap-2 rounded-xl border px-3 py-2.5">
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium">
                {f.prospectName}
                {f.company ? <span className="font-normal text-muted-foreground"> · {f.company}</span> : null}
              </p>
              <div className="mt-0.5 flex items-center gap-2">
                {overdueBy > 0 ? (
                  <Badge variant="warning">Overdue {overdueBy}d</Badge>
                ) : (
                  <Badge variant="brand">Due today</Badge>
                )}
                {f.notes ? <span className="truncate text-xs text-muted-foreground">{f.notes}</span> : null}
                {overdueBy > 0 ? (
                  <span className="sr-only">Was due {formatISODate(f.dueOn, "MMMM d")}</span>
                ) : null}
              </div>
            </div>
            <div className="flex gap-1">
              <Button
                size="sm"
                variant="ghost"
                onClick={() => act(f.id, "skipped", addDaysISO(today, SNOOZE_DAYS))}
                aria-label={`Snooze follow-up with ${f.prospectName} by ${SNOOZE_DAYS} days`}
              >
                <Clock aria-hidden /> {SNOOZE_DAYS}d
              </Button>
              <Button size="sm" variant="secondary" onClick={() => act(f.id, "done")} aria-label={`Mark follow-up with ${f.prospectName} done`}>
                <Check aria-hidden /> Done
              </Button>
            </div>
          </li>
        );
      })}
    </ul>
  );
}
