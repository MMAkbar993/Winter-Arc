import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { createTestDb, type TestDb } from "./harness";

const USER = "44444444-4444-4444-8444-444444444444";
const OTHER = "55555555-5555-4555-8555-555555555555";

let t: TestDb;

beforeAll(async () => {
  t = await createTestDb();
  await t.createUser(USER, "user@example.com", "User");
  await t.createUser(OTHER, "other@example.com", "Other");

  await t.as(USER, `insert into daily_habits (log_date, habit_key, completed) values
    ('2026-10-01', 'workout', true), ('2026-10-01', 'learning', true), ('2026-10-01', 'sleep', true),
    ('2026-10-02', 'workout', true), ('2026-10-02', 'content', false)`);
  await t.as(USER, `insert into workouts (workout_date, category, duration_minutes) values ('2026-10-01', 'legs', 60)`);
  await t.as(USER, `insert into learning_sessions (session_date, topic, category, duration_minutes) values
    ('2026-10-01', 'RLS deep dive', 'supabase', 90), ('2026-10-01', 'Hooks', 'react', 30)`);
  await t.as(USER, `insert into prospects (name, source, stage, contacted_on, replied_on, won_on, estimated_value) values
    ('Ali', 'linkedin', 'won', '2026-10-01', '2026-10-02', '2026-10-02', 50000),
    ('Sara_Designs', 'fiverr', 'contacted', '2026-10-01', null, null, 20000)`);
  await t.as(USER, `insert into outreach_logs (log_date, source, count) values ('2026-10-01', 'fiverr', 10)`);
  await t.as(USER, `insert into income_transactions (txn_date, amount, category, source) values ('2026-10-02', 25000, 'fiverr', 'Logo gig')`);
  await t.as(USER, `insert into expense_transactions (txn_date, amount, category) values ('2026-10-02', 3000, 'business')`);
  await t.as(USER, `insert into savings_entries (entry_date, amount, kind) values
    ('2026-10-02', 10000, 'deposit'), ('2026-10-02', 2500, 'withdrawal')`);
  await t.as(USER, `insert into content_items (platform, content_date, content_type, title, status) values
    ('x', '2026-10-01', 'build_in_public', 'Day 1 of Winter Arc', 'published'),
    ('x', '2026-10-01', 'coding_tip', 'Draft idea', 'draft')`);
  await t.as(USER, `insert into journal_entries (entry_date, biggest_win, notes) values ('2026-10-01', 'Closed Ali', 'Great 100% day')`);
  // Noise from another user that must never leak into USER's results.
  await t.as(OTHER, `insert into income_transactions (txn_date, amount, category) values ('2026-10-02', 999999, 'salary')`);
  await t.as(OTHER, `insert into prospects (name, source, contacted_on) values ('Ali Secret', 'email', '2026-10-01')`);
}, 60_000);

afterAll(async () => {
  await t?.db.close();
});

describe("daily_series", () => {
  it("returns one row per day with aggregated metrics", async () => {
    const { rows } = await t.as<Record<string, unknown>>(USER, "select * from daily_series('2026-10-01', '2026-10-03')");
    expect(rows).toHaveLength(3);
    const [d1, d2, d3] = rows;
    expect(d1).toMatchObject({
      score: 3,
      workouts: 1,
      workout_minutes: 60,
      learning_minutes: 120,
      prospects_contacted: 2,
      outreach_logged: 10,
      outreach_actions: 12,
      posts_published: 1,
    });
    expect(d2).toMatchObject({ score: 1, replies: 1, clients_won: 1, won_value: "50000.00" });
    expect(d2?.income).toBe("25000.00");
    expect(d2?.expenses).toBe("3000.00");
    expect(d2?.savings).toBe("7500.00");
    expect(d3).toMatchObject({ score: 0, workouts: 0, income: "0" });
  });

  it("never includes another user's data", async () => {
    const { rows } = await t.as<{ income: string }>(OTHER, "select income from daily_series('2026-10-02', '2026-10-02')");
    expect(rows[0]?.income).toBe("999999.00");
    const mine = await t.as<{ income: string }>(USER, "select income from daily_series('2026-10-02', '2026-10-02')");
    expect(mine.rows[0]?.income).toBe("25000.00");
  });

  it("rejects oversized ranges and returns nothing for inverted ranges", async () => {
    await expect(t.as(USER, "select * from daily_series('2020-01-01', '2026-01-01')")).rejects.toThrow(/too large/);
    expect((await t.as(USER, "select * from daily_series('2026-10-03', '2026-10-01')")).rows).toHaveLength(0);
  });

  it("is not callable anonymously", async () => {
    await expect(t.as(null, "select * from daily_series('2026-10-01', '2026-10-02')")).rejects.toThrow(/permission denied/);
  });
});

describe("recent_activity", () => {
  it("unifies modules for the current user only", async () => {
    const { rows } = await t.as<{ kind: string }>(USER, "select kind from recent_activity");
    const kinds = new Set(rows.map((r) => r.kind));
    expect(kinds).toEqual(new Set(["workout", "learning", "prospect", "content", "income", "expense"]));
    expect(rows.some((r) => (r as Record<string, unknown>).title === "Ali Secret")).toBe(false);
  });
});

describe("search_everything", () => {
  it("finds matches across modules", async () => {
    const { rows } = await t.as<{ kind: string; title: string }>(USER, "select * from search_everything('ali')");
    expect(rows.map((r) => r.kind).sort()).toEqual(["journal", "prospect"]);
    expect(rows.find((r) => r.kind === "prospect")?.title).toBe("Ali");
  });

  it("treats LIKE wildcards literally", async () => {
    const underscore = await t.as<{ title: string }>(USER, "select * from search_everything('a_d')");
    expect(underscore.rows.map((r) => r.title)).toEqual(["Sara_Designs"]);
    const percent = await t.as(USER, "select * from search_everything('100%')");
    expect(percent.rows).toHaveLength(1);
    const noWildcard = await t.as(USER, "select * from search_everything('%%')");
    expect(noWildcard.rows).toHaveLength(0);
  });

  it("ignores queries shorter than two characters", async () => {
    expect((await t.as(USER, "select * from search_everything('a')")).rows).toHaveLength(0);
  });
});
