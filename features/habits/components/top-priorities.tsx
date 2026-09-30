"use client";

import { useOptimistic, useState, useTransition } from "react";
import { Check, CircleDollarSign, GraduationCap, HeartPulse, Pencil, X } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { clearPriority, savePriority, togglePriority } from "@/features/habits/actions";
import type { PriorityMap } from "@/features/habits/queries";
import { PRIORITY_KINDS, type PriorityKind } from "@/lib/constants";
import { cn } from "@/lib/utils";

const ICONS = { income: CircleDollarSign, skill: GraduationCap, health: HeartPulse } as const;

type Update = { kind: PriorityKind; entry: PriorityMap[PriorityKind] };

export function TopPriorities({ date, priorities }: { date: string; priorities: PriorityMap }) {
  const [optimistic, apply] = useOptimistic(priorities, (state: PriorityMap, u: Update) => ({ ...state, [u.kind]: u.entry }));
  const [, startTransition] = useTransition();
  const [editing, setEditing] = useState<PriorityKind | null>(null);

  const run = (update: Update, action: () => Promise<{ ok: boolean; error?: string }>) =>
    startTransition(async () => {
      apply(update);
      const result = await action();
      if (!result.ok) toast.error(result.error ?? "Could not save");
    });

  return (
    <ul className="grid gap-2" aria-label="Today's top 3">
      {PRIORITY_KINDS.map((p) => {
        const entry = optimistic[p.value];
        const Icon = ICONS[p.value];
        const isEditing = editing === p.value || !entry;

        if (isEditing) {
          return (
            <li key={p.value}>
              <form
                className="flex items-center gap-2 rounded-xl border border-dashed px-3 py-2"
                onSubmit={(e) => {
                  e.preventDefault();
                  const title = String(new FormData(e.currentTarget).get("title") ?? "").trim();
                  if (!title) return;
                  setEditing(null);
                  run({ kind: p.value, entry: { title, completed: entry?.completed ?? false } }, () =>
                    savePriority({ date, kind: p.value, title }),
                  );
                }}
              >
                <Icon aria-hidden className="size-4 shrink-0 text-muted-foreground" />
                <label htmlFor={`priority-${p.value}`} className="sr-only">
                  {p.label}
                </label>
                <Input
                  id={`priority-${p.value}`}
                  name="title"
                  defaultValue={entry?.title ?? ""}
                  placeholder={`${p.label} — ${p.placeholder}`}
                  maxLength={200}
                  className="h-9 border-0 bg-transparent px-1 shadow-none focus-visible:ring-0 dark:bg-transparent"
                  autoFocus={editing === p.value}
                />
                <Button type="submit" size="sm" variant="secondary">
                  Set
                </Button>
                {entry ? (
                  <Button type="button" size="icon-sm" variant="ghost" aria-label="Cancel editing" onClick={() => setEditing(null)}>
                    <X aria-hidden />
                  </Button>
                ) : null}
              </form>
            </li>
          );
        }

        return (
          <li key={p.value} className="flex min-w-0 items-center gap-1">
            <button
              type="button"
              role="checkbox"
              aria-checked={entry.completed}
              onClick={() =>
                run({ kind: p.value, entry: { ...entry, completed: !entry.completed } }, () =>
                  togglePriority({ date, kind: p.value, completed: !entry.completed }),
                )
              }
              className={cn(
                "flex min-h-12 min-w-0 flex-1 items-center gap-3 rounded-xl border px-3 py-2 text-left transition-colors",
                entry.completed ? "border-brand/30 bg-brand-soft" : "hover:bg-accent/60",
              )}
            >
              <span
                aria-hidden
                className={cn(
                  "flex size-5 shrink-0 items-center justify-center rounded-md border",
                  entry.completed ? "border-brand bg-brand text-brand-foreground" : "border-foreground/25",
                )}
              >
                {entry.completed ? <Check className="size-3.5" strokeWidth={3} /> : null}
              </span>
              <span className="min-w-0 flex-1">
                <span className="block text-[11px] font-medium tracking-wide text-muted-foreground uppercase">{p.label}</span>
                <span className={cn("block truncate text-sm", entry.completed && "text-muted-foreground line-through")}>
                  {entry.title}
                </span>
              </span>
            </button>
            <Button size="icon-sm" variant="ghost" aria-label={`Edit ${p.label}`} onClick={() => setEditing(p.value)}>
              <Pencil aria-hidden />
            </Button>
            <Button
              size="icon-sm"
              variant="ghost"
              aria-label={`Clear ${p.label}`}
              onClick={() => run({ kind: p.value, entry: null }, () => clearPriority({ date, kind: p.value }))}
            >
              <X aria-hidden />
            </Button>
          </li>
        );
      })}
    </ul>
  );
}
