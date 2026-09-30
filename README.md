# Winter Arc OS

**Build in silence. Show results.**

A 90-day self-improvement dashboard for tracking fitness, learning, client acquisition, paid work, content, money, sleep and screen-time discipline — built around one daily question: *what do I need to do today?*

Default challenge: **Winter Arc 2026 · October 1 → December 31, 2026 (92 days)**.

---

## Features

| Area | What you get |
| --- | --- |
| **Dashboard** | Greeting, Day X of 92, challenge progress bar, KPIs (today's score, streak, workouts, learning, outreach, revenue, savings, clients won), Today's Mission checklist, Top 3, follow-ups due, 7-day progress, neglected habits, recent activity |
| **Daily Seven** | Workout · Learning · Outreach · Client Work · Content · Screen Time · Sleep. One tap to toggle (optimistic UI), per-habit notes, completion timestamps, score out of 7 with % |
| **Auto-complete** | Logging a workout, work session or published post ticks that habit; learning and outreach tick once the day's total reaches your target |
| **Today** | Date, day number, progress ring, checklist, 8 quick actions, Top 3 (income / skill / health), daily note |
| **Calendar** | GitHub-style heatmap of the whole challenge + month grid; click any day for its score, habits, workout, learning, outreach, revenue, notes and journal |
| **Fitness** | Workouts with categories and exercises (sets/reps/kg), body metrics, weekly target, streak, weight chart, training split |
| **Learning** | Sessions by category, today vs 2h target, week/month/challenge hours, average/day, streaks, most-studied topic |
| **Clients (CRM)** | Prospects, kanban (drag & drop + keyboard "Move to"), table view, stages, follow-ups (due/overdue, done, snooze), bulk outreach log, reply rate, pipeline & won value |
| **Projects** | Projects with status, work sessions (start/end or minutes, billable, earned), hours and revenue |
| **Content** | Posts by platform/type/status, publishing streak, pipeline of ideas/drafts |
| **Money** | Income, expenses, savings (deposits/withdrawals), savings rate, business investment, 6-month chart, optional 40/25/15/10/10 budget guide |
| **Weekly Review** | The 8 questions + reflection, auto-calculated weekly stats (snapshotted with each review), history |
| **Journal** | Mood/energy 1–5, win, challenge, gratitude, notes — shown in calendar context |
| **Analytics** | Date-range filters; score trend, weekly completion, habit breakdown, learning, workouts, outreach, CRM funnel, revenue & savings trends, content frequency; strongest/weakest habit, best/worst weekday, streaks |
| **Challenge** | Full results summary and a "Winter Arc Complete" screen at the end |
| **Everywhere** | Ctrl/⌘ K command palette, global search, notification center, dark (default) / light theme, mobile bottom nav with quick-add sheet |
| **AI Coach** | Placeholder + typed contract only (`features/coach/`) — no AI API is called |

## Tech stack

Next.js 16 (App Router, Server Components, Server Actions, Turbopack) · React 19 · TypeScript (strict) · Tailwind CSS 4 · shadcn/ui (Radix) · Supabase (Postgres, Auth, RLS) via `@supabase/ssr` · Zod 4 · React Hook Form · Recharts 3 · date-fns 4 · lucide-react · Vitest + PGlite.

---

## Local setup

**Prerequisites:** Node.js ≥ 20.9 (developed on Node 24) and a Supabase project (free tier is fine).

```bash
npm install
cp .env.example .env.local   # then fill in the values (see below)
npm run dev                  # http://localhost:3000
```

### Environment variables

| Variable | Where | Notes |
| --- | --- | --- |
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase → Project Settings → API | Required |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | same page (publishable key; the legacy `NEXT_PUBLIC_SUPABASE_ANON_KEY` name also works) | Required. Safe in the browser — RLS restricts it to the signed-in user's rows |
| `NEXT_PUBLIC_SITE_URL` | your app URL | Used in auth email links. `http://localhost:3000` locally |
| `SUPABASE_SERVICE_ROLE_KEY` | same page (service role) | **Only** for `npm run seed`. The app never reads it. Don't add it to Vercel |

Never commit `.env.local` (it's git-ignored).

## Supabase setup

1. **Create a project** at [supabase.com](https://supabase.com).
2. **Apply the migrations** in `supabase/migrations/` (in filename order) — either:
   - **CLI:** `npx supabase link --project-ref <ref>` then `npx supabase db push`, or
   - **Dashboard:** SQL Editor → paste and run `20261001000000_initial_schema.sql`, then `20261001000100_analytics.sql`.
3. **Auth → URL Configuration:** set *Site URL* to your app URL and add `http://localhost:3000/**` (and your production URL + `/**`) to *Redirect URLs*.
4. **Auth → Providers → Email:** enabled. With "Confirm email" on, new users get a link that lands on `/auth/confirm`; with it off they go straight to onboarding.
5. *(Optional)* Seed demo data — see below.

### Database

22 tables, all with `user_id uuid not null references auth.users on delete cascade` and RLS:

`profiles` · `user_settings` · `challenges` · `daily_logs` · `daily_habits` · `daily_priorities` · `workouts` · `workout_exercises` · `body_metrics` · `learning_sessions` · `prospects` · `prospect_followups` · `outreach_logs` · `projects` · `work_sessions` · `content_items` · `income_transactions` · `expense_transactions` · `savings_entries` · `weekly_reviews` · `journal_entries` · `notifications`

Plus: `daily_scores` and `recent_activity` views (`security_invoker`), `daily_series(start, end)` — one row per day with every metric, the backbone of all stats — and `search_everything(query)`. A trigger creates `profiles` + `user_settings` for each new auth user.

**Security model**
- Every table: RLS enabled, four owner-only policies (`(select auth.uid()) = user_id`); no `USING (true)`; anon has no grants.
- Child rows reference parents through composite foreign keys `(parent_id, user_id)`, so a row can never be attached to another user's parent, even by a buggy query.
- Server code gets the user from the verified session (`supabase.auth.getUser()`); `user_id` is never taken from the client. All input is re-validated server-side with the same Zod schemas as the forms.
- Database errors are logged server-side and mapped to generic messages; production never shows raw errors.

### Seed data (development only)

```bash
npm run seed -- --yes            # demo@winterarc.dev / WinterArc!2026
npm run seed -- --yes --email you@example.com --password '...'
```

Creates (or reuses) a demo user and ~14 days of realistic data (challenge starts 13 days ago). It **resets that user's data** each run, refuses to run with `NODE_ENV=production`, and needs `SUPABASE_SERVICE_ROLE_KEY`. Nothing is ever seeded automatically.

## Development commands

| Command | What it does |
| --- | --- |
| `npm run dev` | Dev server |
| `npm run build` / `npm start` | Production build / serve |
| `npm run lint` | ESLint |
| `npm run typecheck` | Generates route types, then `tsc --noEmit` |
| `npm test` | Vitest: unit tests + database tests |
| `npm run seed -- --yes` | Demo data (see above) |

**Tests (98):** score/percentages, streaks (threshold, in-progress today, no future days), challenge day/percent, timezone boundaries, finance totals, CRM stage logic, analytics, notifications, date ranges, form validation, and **database tests that run the real migrations in PGlite (Postgres 18 in WASM)** to verify RLS isolation between users, anon lockout, composite-FK protection, constraints, `daily_series`, and LIKE-escaped search.

## Deployment (Vercel)

1. Push the repo to GitHub and import it in Vercel (framework: Next.js; defaults are correct).
2. Add env vars: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `NEXT_PUBLIC_SITE_URL=https://your-domain`.
3. Deploy. Then add `https://your-domain/**` to Supabase Auth redirect URLs and set the Site URL.
4. Apply any new migrations with `npx supabase db push` before deploying code that depends on them.

Security headers (HSTS, `X-Frame-Options: DENY`, `nosniff`, referrer and permissions policy) are set in `next.config.ts`.

## Folder structure

```
app/                     Routes only — thin pages that compose features
  (auth)/                login, register, forgot/reset password
  (app)/                 authenticated shell + all dashboard pages
  auth/confirm/          email link handler (PKCE code + token_hash)
  onboarding/
components/
  ui/                    shadcn/ui primitives (owned code)
  shared/                StatCard, ProgressRing, ActivityHeatmap, EmptyState, PageHeader, Section, DateRangePicker…
  charts/                Recharts wrappers (lazy-loaded) + BarList
  forms/                 react-hook-form field components
  layout/                sidebar, header, mobile nav, user menu
  providers/             theme + app data context
features/<domain>/       actions.ts (server actions) · queries.ts (server reads) · components/
lib/                     pure domain logic (scoring, streaks, challenge, dates, finance, crm, analytics, series),
                         validation schemas, Supabase clients, action wrapper, constants
hooks/                   useActionForm
types/                   database + action types
supabase/migrations/     SQL migrations
scripts/seed.ts          dev seed
tests/                   unit/ and db/ (PGlite)
proxy.ts                 session refresh + optimistic route protection (Next 16's middleware)
```

### Architecture notes

- **Timezones:** days are the user's local calendar dates (`yyyy-MM-dd`) computed server-side from their configured timezone (default `Asia/Karachi`), never UTC slices.
- **Stats:** one `daily_series` RPC returns every per-day metric; dashboard/calendar/analytics/weekly review/challenge all aggregate it with pure, tested functions — no N+1, no dozens of client queries.
- **Mutations:** every server action goes through `runAction` (auth → Zod → RLS-scoped client → revalidate). Forms send raw values; the server re-parses them.
- **Performance:** Server Components by default; forms and charts are code-split with `next/dynamic` and only load when opened.
- **Streak rule:** a day counts when score ≥ your threshold (default 5/7, configurable). Today doesn't break the streak until it's over; future days never count.

## Screenshots

_Add screenshots of the dashboard, Today (mobile), calendar and analytics here._

## Roadmap

- AI Coach (weekly insights; see `features/coach/README.md`)
- Email/DM follow-up integrations (`prospect_followups.channel` / `external_ref` are ready)
- Push notifications / PWA install
- Progress-photo uploads to a private Supabase Storage bucket (currently a private URL field)
- Account deletion flow (needs a server-side admin endpoint)
- Content-Security-Policy with nonces
- Playwright E2E suite in CI against a Supabase branch database
