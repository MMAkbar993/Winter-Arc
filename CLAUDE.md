@AGENTS.md

# Winter Arc OS — project notes

- Next.js 16: `proxy.ts` (not middleware), error boundaries receive `retry`, route prop types come from `next typegen` (`npm run typecheck`).
- Domain logic lives in `lib/` as pure functions with tests in `tests/unit`; SQL is tested in `tests/db` with PGlite (`npm test`).
- Every mutation goes through `runAction` in `lib/actions.ts`; never accept `user_id` from the client.
- Schema changes: add a new file in `supabase/migrations/`, then update `types/database.ts` and add a PGlite test.
- Stats come from the `daily_series(start, end)` RPC aggregated with `lib/series.ts` — extend it rather than adding per-metric queries.
- Charts: use `components/charts/lazy-charts` with serializable `format`/`formatX` descriptors (server pages can't pass functions).
