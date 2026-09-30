import type { Metadata } from "next";
import Link from "next/link";
import { CalendarDays, NotebookPen } from "lucide-react";
import { LineSeriesChart } from "@/components/charts/lazy-charts";
import { DeleteButton } from "@/components/shared/delete-button";
import { EmptyState } from "@/components/shared/empty-state";
import { PageHeader } from "@/components/shared/page-header";
import { Section } from "@/components/shared/section";
import { Button } from "@/components/ui/button";
import { deleteJournalEntry } from "@/features/journal/actions";
import { EditRecordButton } from "@/features/quick-add/edit-record-button";
import { AddButton } from "@/features/quick-add/quick-action-button";
import { ENERGY_LABELS, MOOD_LABELS } from "@/lib/constants";
import { requireOnboardedContext } from "@/lib/data/context";
import { formatISODate } from "@/lib/dates";
import { str } from "@/lib/options";
import type { JournalEntryRow } from "@/types/database";

export const metadata: Metadata = { title: "Journal" };

function toInitial(e: JournalEntryRow) {
  return {
    date: e.entry_date,
    mood: str(e.mood),
    energy: str(e.energy),
    notes: str(e.notes),
    gratitude: str(e.gratitude),
    biggestWin: str(e.biggest_win),
    biggestChallenge: str(e.biggest_challenge),
  };
}

export default async function JournalPage() {
  const ctx = await requireOnboardedContext();
  const { supabase, user, today } = ctx;
  const { data, error } = await supabase
    .from("journal_entries")
    .select("*")
    .eq("user_id", user.id)
    .order("entry_date", { ascending: false })
    .limit(120);
  if (error) throw new Error("Could not load your journal.");
  const entries = data;
  const todayEntry = entries.find((e) => e.entry_date === today);
  const trend = [...entries].reverse().filter((e) => e.mood !== null).slice(-30);

  return (
    <div className="grid grid-cols-1 gap-6">
      <PageHeader
        title="Journal"
        description="Mood, energy and a few honest lines. One entry per day."
        actions={
          todayEntry ? (
            <EditRecordButton kind="journal" title="Today's entry" initial={toInitial(todayEntry)} label="Edit today's entry" showLabel />
          ) : (
            <AddButton kind="journal" label="Write today's entry" />
          )
        }
      />

      {trend.length >= 3 ? (
        <Section id="mood" title="Mood" description="1–5, last 30 entries">
          <LineSeriesChart
            data={trend.map((e) => ({ day: e.entry_date, mood: e.mood }))}
            xKey="day"
            yKey="mood"
            formatX="date"
            yDomain={[1, 5]}
            height={180}
            label={`Mood over the last ${trend.length} journal entries`}
          />
        </Section>
      ) : null}

      {entries.length === 0 ? (
        <EmptyState
          icon={NotebookPen}
          title="No entries yet"
          description="Two minutes at night: your biggest win, your biggest challenge, and one thing you're grateful for."
          action={<AddButton kind="journal" label="Write your first entry" />}
        />
      ) : (
        <ul className="grid gap-3">
          {entries.map((e) => (
            <li key={e.id}>
              <article className="rounded-xl border bg-card p-4">
                <header className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <h2 className="text-sm font-semibold">{formatISODate(e.entry_date, "EEEE, MMMM d")}</h2>
                    <p className="text-xs text-muted-foreground">
                      {e.mood ? `Mood ${e.mood}/5 · ${MOOD_LABELS[e.mood]}` : "Mood —"} ·{" "}
                      {e.energy ? `Energy ${e.energy}/5 · ${ENERGY_LABELS[e.energy]}` : "Energy —"}
                    </p>
                  </div>
                  <div className="flex items-center">
                    <Button asChild variant="ghost" size="icon-sm" aria-label="View this day in the calendar">
                      <Link href={`/calendar?month=${e.entry_date.slice(0, 7)}&date=${e.entry_date}`}>
                        <CalendarDays aria-hidden />
                      </Link>
                    </Button>
                    <EditRecordButton kind="journal" title="Edit entry" initial={toInitial(e)} />
                    <DeleteButton action={deleteJournalEntry.bind(null, e.id)} itemLabel="journal entry" />
                  </div>
                </header>
                <dl className="mt-3 grid gap-2 text-sm sm:grid-cols-3">
                  {e.biggest_win ? (
                    <div>
                      <dt className="text-xs text-muted-foreground">Biggest win</dt>
                      <dd>{e.biggest_win}</dd>
                    </div>
                  ) : null}
                  {e.biggest_challenge ? (
                    <div>
                      <dt className="text-xs text-muted-foreground">Biggest challenge</dt>
                      <dd>{e.biggest_challenge}</dd>
                    </div>
                  ) : null}
                  {e.gratitude ? (
                    <div>
                      <dt className="text-xs text-muted-foreground">Grateful for</dt>
                      <dd>{e.gratitude}</dd>
                    </div>
                  ) : null}
                </dl>
                {e.notes ? <p className="mt-3 text-sm whitespace-pre-wrap text-muted-foreground">{e.notes}</p> : null}
              </article>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
