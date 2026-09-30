"use client";

import { useOptimistic, useState, useTransition } from "react";
import { Check, MessageSquareText } from "lucide-react";
import { toast } from "sonner";
import { ProgressRing } from "@/components/shared/progress-ring";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Textarea } from "@/components/ui/textarea";
import { saveHabitNote, toggleHabit } from "@/features/habits/actions";
import type { HabitMap } from "@/features/habits/queries";
import { HABITS, MAX_DAILY_SCORE, type HabitKey } from "@/lib/constants";
import { calculateDailyScore, scorePercent } from "@/lib/scoring";
import { cn } from "@/lib/utils";

type Toggle = { key: HabitKey; completed: boolean };

function formatTime(iso: string, timeZone: string): string {
  return new Intl.DateTimeFormat("en-US", { hour: "numeric", minute: "2-digit", timeZone }).format(new Date(iso));
}

/**
 * The Daily Seven. Toggles are optimistic: the UI updates instantly, the
 * server action persists it, and a failure rolls back with a toast.
 */
export function HabitChecklist({
  date,
  habits,
  timeZone,
  variant = "card",
  readOnly = false,
}: {
  date: string;
  habits: HabitMap;
  timeZone: string;
  variant?: "card" | "hero";
  readOnly?: boolean;
}) {
  const [optimistic, applyToggle] = useOptimistic(habits, (state: HabitMap, t: Toggle) => ({
    ...state,
    [t.key]: { ...state[t.key], completed: t.completed, completedAt: t.completed ? new Date().toISOString() : null },
  }));
  const [, startTransition] = useTransition();

  const score = calculateDailyScore(HABITS.map((h) => ({ habit_key: h.value, completed: optimistic[h.value].completed })));
  const pct = scorePercent(score);

  const toggle = (key: HabitKey) => {
    if (readOnly) return;
    const completed = !optimistic[key].completed;
    startTransition(async () => {
      applyToggle({ key, completed });
      const result = await toggleHabit({ date, habitKey: key, completed });
      if (!result.ok) toast.error(result.error);
      else if (completed && score + 1 === MAX_DAILY_SCORE) toast.success("7/7. Perfect day.");
    });
  };

  const list = (
    <ul className="grid gap-2" aria-label="Daily habits">
      {HABITS.map((habit, index) => {
        const entry = optimistic[habit.value];
        return (
          <li key={habit.value} className="group/habit relative">
            <button
              type="button"
              role="checkbox"
              aria-checked={entry.completed}
              disabled={readOnly}
              onClick={() => toggle(habit.value)}
              className={cn(
                "flex min-h-14 w-full items-center gap-3 rounded-xl border px-3 py-2.5 pr-12 text-left transition-colors",
                "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring disabled:cursor-default",
                entry.completed ? "border-brand/30 bg-brand-soft" : "bg-background/40 hover:bg-accent/60",
              )}
            >
              <span
                aria-hidden
                className={cn(
                  "flex size-6 shrink-0 items-center justify-center rounded-md border transition-colors",
                  entry.completed ? "border-brand bg-brand text-brand-foreground" : "border-foreground/25",
                )}
              >
                {entry.completed ? <Check className="size-4" strokeWidth={3} /> : null}
              </span>
              <span className="min-w-0 flex-1">
                <span className={cn("block text-sm font-medium", entry.completed && "text-foreground")}>
                  <span className="mr-1.5 text-muted-foreground tabular">{index + 1}.</span>
                  {habit.mission}
                </span>
                <span className="block truncate text-xs text-muted-foreground">
                  {entry.completed && entry.completedAt
                    ? `Done at ${formatTime(entry.completedAt, timeZone)}`
                    : entry.notes || habit.description}
                </span>
              </span>
            </button>
            {!readOnly ? (
              <HabitNoteButton date={date} habitKey={habit.value} label={habit.label} notes={entry.notes} />
            ) : null}
          </li>
        );
      })}
    </ul>
  );

  if (variant === "hero") {
    return (
      <div className="grid gap-6 md:grid-cols-[auto_1fr] md:items-start">
        <div className="flex items-center gap-5 md:flex-col md:items-center">
          <ProgressRing value={pct} size={148} strokeWidth={12} label={`Today's score: ${score} of ${MAX_DAILY_SCORE}`}>
            <span className="text-3xl font-semibold tracking-tight tabular">
              {score}
              <span className="text-lg text-muted-foreground">/{MAX_DAILY_SCORE}</span>
            </span>
            <span className="text-xs text-muted-foreground tabular">{pct}% complete</span>
          </ProgressRing>
          <p className="text-sm text-muted-foreground md:text-center" aria-live="polite">
            {score === MAX_DAILY_SCORE
              ? "Perfect day. Protect it."
              : `${MAX_DAILY_SCORE - score} to go.`}
          </p>
        </div>
        {list}
      </div>
    );
  }

  return (
    <div className="grid gap-3">
      <div className="flex items-center justify-between gap-3" aria-live="polite">
        <p className="text-sm">
          <span className="text-lg font-semibold tabular">{score}</span>
          <span className="text-muted-foreground tabular"> / {MAX_DAILY_SCORE}</span>
          <span className="ml-2 text-xs text-muted-foreground tabular">{pct}%</span>
        </p>
        <div className="h-1.5 w-32 overflow-hidden rounded-full bg-muted" aria-hidden>
          <div className="h-full rounded-full bg-brand transition-[width] duration-500" style={{ width: `${pct}%` }} />
        </div>
      </div>
      {list}
    </div>
  );
}

function HabitNoteButton({
  date,
  habitKey,
  label,
  notes,
}: {
  date: string;
  habitKey: HabitKey;
  label: string;
  notes: string | null;
}) {
  const [open, setOpen] = useState(false);
  const [value, setValue] = useState(notes ?? "");
  const [pending, startTransition] = useTransition();

  const save = () =>
    startTransition(async () => {
      const result = await saveHabitNote({ date, habitKey, notes: value });
      if (result.ok) {
        toast.success("Note saved");
        setOpen(false);
      } else {
        toast.error(result.error);
      }
    });

  return (
    <Popover
      open={open}
      onOpenChange={(o) => {
        setOpen(o);
        if (o) setValue(notes ?? "");
      }}
    >
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className={cn(
            "absolute top-1/2 right-2 -translate-y-1/2 text-muted-foreground",
            notes && "text-brand",
          )}
          aria-label={notes ? `Edit note for ${label}` : `Add note for ${label}`}
        >
          <MessageSquareText aria-hidden />
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-80">
        <label htmlFor={`note-${habitKey}`} className="text-sm font-medium">
          Note · {label}
        </label>
        <Textarea
          id={`note-${habitKey}`}
          value={value}
          onChange={(e) => setValue(e.target.value)}
          rows={3}
          maxLength={1000}
          placeholder="What did you do? Anything to remember?"
        />
        <div className="flex justify-end">
          <Button size="sm" onClick={save} disabled={pending}>
            {pending ? "Saving…" : "Save note"}
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  );
}
