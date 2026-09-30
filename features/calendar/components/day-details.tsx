import { Check, Minus } from "lucide-react";
import type { DayDetail } from "@/features/calendar/queries";
import {
  ENERGY_LABELS,
  HABITS,
  labelFor,
  LEARNING_CATEGORIES,
  MAX_DAILY_SCORE,
  MOOD_LABELS,
  PROSPECT_STAGES,
  WORKOUT_CATEGORIES,
} from "@/lib/constants";
import { formatISODate } from "@/lib/dates";
import { formatCurrency, formatMinutes } from "@/lib/format";
import type { DayMetrics } from "@/lib/series";
import { scorePercent } from "@/lib/scoring";

function Block({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="grid gap-1.5">
      <h3 className="text-xs font-medium tracking-wide text-muted-foreground uppercase">{title}</h3>
      {children}
    </div>
  );
}

const Empty = ({ children }: { children: React.ReactNode }) => <p className="text-sm text-muted-foreground">{children}</p>;

export function DayDetails({ date, detail, metrics, currency }: { date: string; detail: DayDetail; metrics: DayMetrics; currency: string }) {
  const score = Object.values(detail.log.habits).filter((h) => h.completed).length;
  const { journal } = detail;

  return (
    <div className="grid gap-5">
      <div className="flex items-end justify-between gap-3">
        <div>
          <p className="text-xs text-muted-foreground">{formatISODate(date, "EEEE")}</p>
          <p className="text-lg font-semibold">{formatISODate(date, "MMMM d, yyyy")}</p>
        </div>
        <p className="text-right">
          <span className="text-2xl font-semibold tabular">
            {score}/{MAX_DAILY_SCORE}
          </span>
          <span className="block text-xs text-muted-foreground">{scorePercent(score)}%</span>
        </p>
      </div>

      <Block title="Habits">
        <ul className="grid grid-cols-1 gap-1 sm:grid-cols-2">
          {HABITS.map((h) => {
            const entry = detail.log.habits[h.value];
            return (
              <li key={h.value} className="flex items-center gap-2 text-sm">
                {entry.completed ? (
                  <Check aria-hidden className="size-4 text-brand" />
                ) : (
                  <Minus aria-hidden className="size-4 text-muted-foreground" />
                )}
                <span className={entry.completed ? "" : "text-muted-foreground"}>{h.label}</span>
                <span className="sr-only">{entry.completed ? "completed" : "not completed"}</span>
              </li>
            );
          })}
        </ul>
      </Block>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[
          { label: "Learning", value: formatMinutes(metrics.learningMinutes) },
          { label: "Outreach", value: String(metrics.outreachActions) },
          { label: "Client work", value: formatMinutes(metrics.workMinutes) },
          { label: "Revenue", value: formatCurrency(metrics.income, currency) },
        ].map((m) => (
          <div key={m.label} className="rounded-lg bg-muted/50 px-3 py-2">
            <p className="text-[11px] text-muted-foreground">{m.label}</p>
            <p className="text-sm font-medium tabular">{m.value}</p>
          </div>
        ))}
      </div>

      <Block title="Workout">
        {detail.workouts.length ? (
          <ul className="text-sm">
            {detail.workouts.map((w) => (
              <li key={w.id}>
                {w.custom_category ?? labelFor(WORKOUT_CATEGORIES, w.category)} · {formatMinutes(w.duration_minutes)}
              </li>
            ))}
          </ul>
        ) : (
          <Empty>No workout logged.</Empty>
        )}
      </Block>

      <Block title="Learning">
        {detail.learning.length ? (
          <ul className="text-sm">
            {detail.learning.map((l) => (
              <li key={l.id}>
                {l.topic} <span className="text-muted-foreground">· {labelFor(LEARNING_CATEGORIES, l.category)} · {formatMinutes(l.duration_minutes)}</span>
              </li>
            ))}
          </ul>
        ) : (
          <Empty>No learning sessions.</Empty>
        )}
      </Block>

      <Block title="Prospects contacted">
        {detail.prospects.length ? (
          <ul className="text-sm">
            {detail.prospects.map((p) => (
              <li key={p.id}>
                {p.name}
                {p.company ? ` · ${p.company}` : ""} <span className="text-muted-foreground">({labelFor(PROSPECT_STAGES, p.stage)})</span>
              </li>
            ))}
          </ul>
        ) : (
          <Empty>{metrics.outreachActions > 0 ? `${metrics.outreachActions} outreach actions logged.` : "No outreach."}</Empty>
        )}
      </Block>

      {detail.income.length ? (
        <Block title="Income">
          <ul className="text-sm">
            {detail.income.map((i) => (
              <li key={i.id}>
                {formatCurrency(Number(i.amount), currency)} <span className="text-muted-foreground">· {i.source ?? i.category}</span>
              </li>
            ))}
          </ul>
        </Block>
      ) : null}

      <Block title="Notes">
        {detail.log.note ? <p className="text-sm whitespace-pre-wrap">{detail.log.note}</p> : <Empty>No daily note.</Empty>}
      </Block>

      <Block title="Journal">
        {journal ? (
          <div className="grid gap-1 text-sm">
            <p className="text-muted-foreground">
              {journal.mood ? `Mood ${journal.mood}/5 (${MOOD_LABELS[journal.mood]})` : null}
              {journal.mood && journal.energy ? " · " : null}
              {journal.energy ? `Energy ${journal.energy}/5 (${ENERGY_LABELS[journal.energy]})` : null}
            </p>
            {journal.biggest_win ? <p>Win: {journal.biggest_win}</p> : null}
            {journal.biggest_challenge ? <p>Challenge: {journal.biggest_challenge}</p> : null}
            {journal.gratitude ? <p>Grateful for: {journal.gratitude}</p> : null}
            {journal.notes ? <p className="whitespace-pre-wrap text-muted-foreground">{journal.notes}</p> : null}
          </div>
        ) : (
          <Empty>No journal entry.</Empty>
        )}
      </Block>
    </div>
  );
}
