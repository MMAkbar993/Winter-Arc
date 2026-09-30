/**
 * Row Level Security tests.
 *
 * Runs the real migrations inside PGlite (Postgres compiled to WASM) with a
 * minimal stand-in for Supabase's `auth` schema and roles, then verifies that
 * users are fully isolated from each other and anonymous clients get nothing.
 */
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { createTestDb, type TestDb } from "./harness";

const USER_A = "11111111-1111-4111-8111-111111111111";
const USER_B = "22222222-2222-4222-8222-222222222222";

let db: TestDb["db"];
let as: TestDb["as"];

beforeAll(async () => {
  const t = await createTestDb();
  db = t.db;
  as = t.as;
  await t.createUser(USER_A, "a@example.com", "Alice");
  await t.createUser(USER_B, "b@example.com");
}, 60_000);

afterAll(async () => {
  await db?.close();
});

describe("schema", () => {
  it("enables RLS on every public table", async () => {
    const res = await db.query<{ relname: string; relrowsecurity: boolean }>(
      `select c.relname, c.relrowsecurity from pg_class c
       join pg_namespace n on n.oid = c.relnamespace
       where n.nspname = 'public' and c.relkind = 'r'`,
    );
    expect(res.rows.length).toBeGreaterThanOrEqual(22);
    for (const row of res.rows) expect(row.relrowsecurity, row.relname).toBe(true);
  });

  it("never uses permissive `true` policies and scopes every policy to auth.uid()", async () => {
    const res = await db.query<{ tablename: string; qual: string | null; with_check: string | null; roles: string }>(
      `select tablename, qual, with_check, roles::text from pg_policies where schemaname = 'public'`,
    );
    for (const p of res.rows) {
      const expr = `${p.qual ?? ""} ${p.with_check ?? ""}`;
      expect(expr, p.tablename).toMatch(/auth\.uid\(\)/);
      expect(p.qual ?? "", p.tablename).not.toMatch(/^\s*true\s*$/);
      expect(p.roles, p.tablename).toContain("authenticated");
      expect(p.roles, p.tablename).not.toContain("anon");
    }
  });

  it("has four owner policies per table", async () => {
    const res = await db.query<{ tablename: string; n: number }>(
      `select tablename, count(*)::int as n from pg_policies where schemaname = 'public' group by tablename`,
    );
    for (const row of res.rows) expect(row.n, row.tablename).toBe(4);
  });

  it("bootstraps profile and settings for new users", async () => {
    const profile = await as(USER_A, "select full_name from profiles");
    expect(profile.rows).toEqual([{ full_name: "Alice" }]);
    const settings = await as(USER_A, "select timezone, currency, success_threshold from user_settings");
    expect(settings.rows).toEqual([{ timezone: "Asia/Karachi", currency: "PKR", success_threshold: 5 }]);
  });
});

describe("row isolation", () => {
  beforeAll(async () => {
    await as(USER_A, `insert into daily_habits (log_date, habit_key, completed) values
      ('2026-10-01', 'workout', true), ('2026-10-01', 'learning', true), ('2026-10-01', 'sleep', false)`);
    await as(USER_A, `insert into income_transactions (txn_date, amount, category) values ('2026-10-01', 5000, 'fiverr')`);
    await as(USER_A, `insert into workouts (id, workout_date, category) values
      ('33333333-3333-4333-8333-333333333333', '2026-10-01', 'legs')`);
  });

  it("lets the owner read their rows and user_id defaults to auth.uid()", async () => {
    const res = await as(USER_A, "select user_id from daily_habits");
    expect(res.rows).toHaveLength(3);
    for (const r of res.rows) expect(r.user_id).toBe(USER_A);
  });

  it("hides other users' rows", async () => {
    expect((await as(USER_B, "select * from daily_habits")).rows).toHaveLength(0);
    expect((await as(USER_B, "select * from income_transactions")).rows).toHaveLength(0);
    expect((await as(USER_B, "select * from profiles")).rows).toHaveLength(1); // only their own
  });

  it("applies RLS through the daily_scores view (security_invoker)", async () => {
    expect((await as(USER_A, "select score from daily_scores")).rows).toEqual([{ score: 2 }]);
    expect((await as(USER_B, "select score from daily_scores")).rows).toHaveLength(0);
  });

  it("blocks updating or deleting other users' rows", async () => {
    const upd = await as(USER_B, "update income_transactions set amount = 1 returning id");
    expect(upd.rows).toHaveLength(0);
    const del = await as(USER_B, "delete from daily_habits returning id");
    expect(del.rows).toHaveLength(0);
    expect((await as(USER_A, "select amount from income_transactions")).rows[0]?.amount).toBe("5000.00");
  });

  it("rejects inserting rows on behalf of another user", async () => {
    await expect(
      as(USER_B, `insert into expense_transactions (user_id, txn_date, amount, category)
                  values ($1, '2026-10-01', 10, 'other')`, [USER_A]),
    ).rejects.toThrow(/row-level security/);
  });

  it("rejects moving a row to another user via update", async () => {
    await expect(as(USER_A, "update daily_habits set user_id = $1", [USER_B])).rejects.toThrow(/row-level security/);
  });

  it("prevents attaching children to another user's parent (composite FK)", async () => {
    await expect(
      as(USER_B, `insert into workout_exercises (workout_id, name)
                  values ('33333333-3333-4333-8333-333333333333', 'Squat')`),
    ).rejects.toThrow(/foreign key/);
  });

  it("gives anonymous clients no access", async () => {
    await expect(as(null, "select * from daily_habits")).rejects.toThrow(/permission denied/);
    await expect(
      as(null, `insert into journal_entries (user_id, entry_date) values ($1, '2026-10-01')`, [USER_A]),
    ).rejects.toThrow(/permission denied/);
  });
});

describe("constraints", () => {
  it("rejects negative money and impossible challenge ranges", async () => {
    await expect(
      as(USER_A, `insert into expense_transactions (txn_date, amount, category) values ('2026-10-01', -5, 'other')`),
    ).rejects.toThrow(/check constraint/);
    await expect(
      as(USER_A, `insert into challenges (name, start_date, end_date) values ('Bad', '2026-12-31', '2026-10-01')`),
    ).rejects.toThrow(/check constraint/);
  });

  it("allows only one active challenge per user", async () => {
    await as(USER_A, `insert into challenges (name, start_date, end_date) values ('Winter Arc 2026', '2026-10-01', '2026-12-31')`);
    await expect(
      as(USER_A, `insert into challenges (name, start_date, end_date) values ('Second', '2027-01-01', '2027-03-31')`),
    ).rejects.toThrow(/duplicate key/);
  });

  it("rejects unknown habit keys and negative durations", async () => {
    await expect(
      as(USER_A, `insert into daily_habits (log_date, habit_key) values ('2026-10-02', 'gaming')`),
    ).rejects.toThrow(/check constraint/);
    await expect(
      as(USER_A, `insert into learning_sessions (session_date, topic, category, duration_minutes)
                  values ('2026-10-02', 'RLS', 'supabase', -10)`),
    ).rejects.toThrow(/check constraint/);
  });

  it("cascades user deletion to owned rows", async () => {
    await db.query("delete from auth.users where id = $1", [USER_A]);
    const res = await db.query<{ n: number }>("select count(*)::int as n from public.daily_habits where user_id = $1", [USER_A]);
    expect(res.rows[0]?.n).toBe(0);
  });
});
