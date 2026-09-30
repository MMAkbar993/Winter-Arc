# AI Coach (planned)

Not part of the MVP. The dashboard shows an "AI Coach — Coming Soon" placeholder.

## Design

1. **Input** — `CoachInput` (see `types.ts`) is assembled server-side from data the app
   already computes: `daily_series()` totals for this week vs last week (`totalsForRange`),
   `habitBreakdown`, `weekdayPerformance`, `pipelineStats`, and the latest `weekly_reviews` row.
   No new queries or tables are needed to start.
2. **Provider** — a `CoachProvider` turns that input into `CoachInsight[]`. Start rule-based
   (e.g. `percentChange(thisWeek.outreachActions, lastWeek.outreachActions) <= -25` → warning),
   then swap in an LLM provider behind the same type.
3. **Delivery** — run weekly from a server action on the Weekly Review page (or a scheduled job),
   store results in a new `coach_insights` table with the same owner-only RLS pattern, and
   surface them on the dashboard and in the notification center (`kind: 'system'`).

## Guardrails

- Only aggregates and the user's own review text are sent — never other users' data; build the
  input with the user's RLS-scoped Supabase client.
- The API key stays server-side (e.g. `ANTHROPIC_API_KEY`), never `NEXT_PUBLIC_*`.
- Insights are suggestions; nothing is changed automatically.
