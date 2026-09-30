/**
 * Development-only demo data seeder.
 *
 *   npm run seed -- --yes [--email demo@winterarc.dev] [--password WinterArc!2026]
 *
 * Creates (or reuses) a demo user via the Supabase admin API, then fills ~14
 * days of realistic data. The demo challenge starts 13 days ago so every
 * screen has something to show. Requires SUPABASE_SERVICE_ROLE_KEY in
 * .env.local — never run this against production.
 */
import { createClient } from "@supabase/supabase-js";
import type { Database, TableInsert } from "../types/database";
import { HABIT_KEYS } from "../lib/constants";
import { addDaysISO, todayInTimeZone } from "../lib/dates";

const TIMEZONE = "Asia/Karachi";

function arg(name: string): string | undefined {
  const i = process.argv.indexOf(`--${name}`);
  return i >= 0 ? process.argv[i + 1] : undefined;
}

function fail(message: string): never {
  console.error(`\n✖ ${message}\n`);
  process.exit(1);
}

if (process.env.NODE_ENV === "production") fail("Refusing to seed with NODE_ENV=production.");
if (!process.argv.includes("--yes")) {
  fail("This writes demo data. Re-run with --yes to confirm: npm run seed -- --yes");
}

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !serviceKey) fail("Set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in .env.local.");

const email = arg("email") ?? "demo@winterarc.dev";
const password = arg("password") ?? "WinterArc!2026";

const admin = createClient<Database>(url, serviceKey, { auth: { persistSession: false, autoRefreshToken: false } });

/** Small deterministic PRNG so the demo looks the same on every run. */
let seed = 20261001;
function rand(): number {
  seed = (seed * 1664525 + 1013904223) % 2 ** 32;
  return seed / 2 ** 32;
}
const pick = <T,>(items: readonly T[]): T => items[Math.floor(rand() * items.length)]!;
const between = (min: number, max: number) => Math.round(min + rand() * (max - min));

async function insert<T extends keyof Database["public"]["Tables"]>(table: T, rows: TableInsert<T>[]) {
  if (rows.length === 0) return [] as { id: string }[];
  const { data, error } = await admin
    .from(table as "projects")
    .insert(rows as unknown as TableInsert<"projects">[])
    .select("id");
  if (error) fail(`Insert into ${table} failed: ${error.message}`);
  return data ?? [];
}

async function findOrCreateUser(): Promise<string> {
  const { data: list, error: listError } = await admin.auth.admin.listUsers({ perPage: 1000 });
  if (listError) fail(`Could not list users: ${listError.message}`);
  const existing = list.users.find((u) => u.email === email);
  if (existing) return existing.id;
  const { data, error } = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { full_name: "Mujeeb" },
  });
  if (error || !data.user) fail(`Could not create demo user: ${error?.message}`);
  return data.user.id;
}

const OWNED_TABLES = [
  "daily_habits", "daily_priorities", "daily_logs", "workout_exercises", "workouts", "body_metrics",
  "learning_sessions", "prospect_followups", "outreach_logs", "prospects", "work_sessions", "projects",
  "content_items", "income_transactions", "expense_transactions", "savings_entries", "weekly_reviews",
  "journal_entries", "notifications", "challenges",
] as const;

async function main() {
  const userId = await findOrCreateUser();
  const today = todayInTimeZone(TIMEZONE);
  const start = addDaysISO(today, -13);
  const days = Array.from({ length: 14 }, (_, i) => addDaysISO(start, i));
  console.log(`Seeding ${email} (${userId}) — ${start} → ${today}`);

  // Reset the demo user's data so the seed is repeatable.
  for (const table of OWNED_TABLES) {
    const { error } = await admin.from(table as "projects").delete().eq("user_id", userId);
    if (error) fail(`Could not clear ${table}: ${error.message}`);
  }

  await admin.from("profiles").upsert(
    { user_id: userId, full_name: "Mujeeb", onboarded_at: new Date().toISOString() },
    { onConflict: "user_id" },
  );
  await admin.from("user_settings").upsert(
    {
      user_id: userId,
      timezone: TIMEZONE,
      currency: "PKR",
      daily_learning_target_minutes: 120,
      weekly_workout_target: 5,
      daily_outreach_target: 15,
      monthly_income_goal: 150000,
      monthly_savings_goal: 40000,
      success_threshold: 5,
    },
    { onConflict: "user_id" },
  );
  await insert("challenges", [
    { user_id: userId, name: "Winter Arc (demo)", start_date: start, end_date: addDaysISO(start, 91), is_active: true },
  ]);

  // Daily Seven — mostly strong days with a couple of dips.
  const habitRows: TableInsert<"daily_habits">[] = [];
  days.forEach((day, i) => {
    const target = i === 4 ? 3 : i === 9 ? 4 : between(5, 7);
    const shuffled = [...HABIT_KEYS].sort(() => rand() - 0.5);
    shuffled.forEach((key, idx) => {
      const completed = idx < target && !(day === today && idx >= 3);
      habitRows.push({
        user_id: userId,
        log_date: day,
        habit_key: key,
        completed,
        completed_at: completed ? `${day}T${String(between(6, 22)).padStart(2, "0")}:15:00+05:00` : null,
      });
    });
  });
  await insert("daily_habits", habitRows);

  await insert("daily_priorities", [
    { user_id: userId, log_date: today, kind: "income", title: "Send proposal to Ahmed (e-commerce build)" },
    { user_id: userId, log_date: today, kind: "skill", title: "Finish Next.js caching deep dive", completed: true },
    { user_id: userId, log_date: today, kind: "health", title: "Legs + 8k steps" },
  ]);
  await insert("daily_logs", [{ user_id: userId, log_date: addDaysISO(today, -1), notes: "Solid day. Outreach felt easier after the template rewrite." }]);

  // Projects & paid work
  const projects = await insert("projects", [
    { user_id: userId, name: "Bakery storefront", client_name: "Crumb & Co", status: "active", description: "Next.js + Stripe storefront" },
    { user_id: userId, name: "SaaS landing page", client_name: "Launchly", status: "active" },
    { user_id: userId, name: "Portfolio v3", status: "waiting", description: "Personal site rebuild" },
  ]);
  const projectIds = projects.map((p) => p.id);
  const workRows: TableInsert<"work_sessions">[] = days.filter((_, i) => i % 3 !== 1).map((day) => {
    const minutes = pick([60, 90, 120, 150]);
    return {
      user_id: userId,
      project_id: pick(projectIds.slice(0, 2)),
      session_date: day,
      task: pick(["Checkout flow", "Product grid", "Hero section", "CMS integration", "Bug fixes", "Client call + revisions"]),
      duration_minutes: minutes,
      billable: true,
      amount_earned: pick([0, 0, 5000, 8000]),
    };
  });
  await insert("work_sessions", workRows);

  // Fitness
  const categories = ["chest_triceps", "back_biceps", "legs", "shoulders_abs", "walking", "cardio"] as const;
  const workoutDays = days.filter((_, i) => i % 7 !== 3 && i % 7 !== 6);
  const workouts = await insert(
    "workouts",
    workoutDays.map((day) => ({
      user_id: userId,
      workout_date: day,
      category: pick(categories),
      duration_minutes: pick([40, 45, 60, 75]),
    })),
  );
  await insert(
    "workout_exercises",
    workouts.flatMap((w) =>
      [["Bench Press", 60], ["Pull-ups", 0], ["Squat", 80]].slice(0, between(1, 3)).map(([name, weight], position) => ({
        user_id: userId,
        workout_id: w.id,
        name: String(name),
        sets: 4,
        reps: between(6, 12),
        weight_kg: Number(weight) || null,
        position,
      })),
    ),
  );
  await insert("body_metrics", [0, 4, 8, 13].map((offset, i) => ({
    user_id: userId,
    measured_on: addDaysISO(start, offset),
    body_weight_kg: 78.4 - i * 0.5,
    waist_cm: i === 0 || i === 3 ? 86 - i * 0.6 : null,
  })));

  // Learning
  const topics = [
    ["Server Components & caching", "nextjs"], ["RLS policies", "supabase"], ["Generics deep dive", "typescript"],
    ["useOptimistic patterns", "react"], ["Indexes & query plans", "postgresql"], ["Auth flows", "security"],
    ["Designing a rate limiter", "system_design"], ["Prompting & tool use", "ai"],
  ] as const;
  await insert(
    "learning_sessions",
    days.flatMap((day) =>
      Array.from({ length: between(1, 2) }, () => {
        const [topic, category] = pick(topics);
        return { user_id: userId, session_date: day, topic, category, duration_minutes: pick([45, 60, 60, 90]), resource: pick(["Docs", "Course", "Book", "YouTube"]) };
      }),
    ),
  );

  // CRM
  const stages = ["identified", "contacted", "contacted", "replied", "qualified", "call_scheduled", "proposal_sent", "negotiating", "won", "won", "lost", "contacted"] as const;
  const names = ["Ahmed Raza", "Sara Khan", "Bilal Ahmed", "Hina Tariq", "Omar Farooq", "Ayesha Malik", "Usman Ali", "Zara Sheikh", "Hamza Iqbal", "Fatima Noor", "Daniyal Aziz", "Maryam Javed"];
  const prospects = await insert(
    "prospects",
    stages.map((stage, i) => {
      const contacted = stage === "identified" ? null : addDaysISO(start, between(0, 12));
      const replied = ["replied", "qualified", "call_scheduled", "proposal_sent", "negotiating", "won"].includes(stage) && contacted ? addDaysISO(contacted, 1) : null;
      return {
        user_id: userId,
        name: names[i]!,
        company: pick(["Crumb & Co", "Launchly", "Kora Labs", "Pixel Mart", null]),
        source: pick(["fiverr", "linkedin", "x", "email", "referral"] as const),
        service_needed: pick(["Landing page", "Next.js dashboard", "Shopify fixes", "Supabase backend"]),
        estimated_value: pick([25000, 40000, 60000, 90000]),
        stage,
        contacted_on: contacted,
        replied_on: replied && replied <= today ? replied : null,
        won_on: stage === "won" && replied ? minDate(addDaysISO(replied, 2), today) : null,
      };
    }),
  );
  await insert("prospect_followups", [
    { user_id: userId, prospect_id: prospects[1]!.id, due_on: today, notes: "Share case study" },
    { user_id: userId, prospect_id: prospects[3]!.id, due_on: addDaysISO(today, -2), notes: "Check if they saw the proposal" },
    { user_id: userId, prospect_id: prospects[6]!.id, due_on: addDaysISO(today, 3) },
  ]);
  await insert("outreach_logs", days.map((day) => ({ user_id: userId, log_date: day, source: pick(["fiverr", "linkedin", "x"] as const), count: between(6, 14) })));

  // Content
  await insert(
    "content_items",
    days.filter((_, i) => i % 2 === 0).map((day, i): TableInsert<"content_items"> => ({
      user_id: userId,
      platform: pick(["x", "linkedin", "instagram"] as const),
      content_date: day,
      content_type: pick(["build_in_public", "coding_tip", "client_result", "productivity"] as const),
      title: `Winter Arc day ${i * 2 + 1}: ${pick(["shipping the checkout", "what RLS taught me", "3 outreach lessons", "my deep-work setup"])}`,
      status: "published",
    })).concat([{ user_id: userId, platform: "linkedin", content_date: addDaysISO(today, 2), content_type: "case_study", title: "Case study: bakery storefront in 10 days", status: "draft" }]),
  );

  // Money
  await insert("income_transactions", [
    { user_id: userId, txn_date: addDaysISO(start, 2), amount: 18000, category: "fiverr", source: "Logo + landing gig" },
    { user_id: userId, txn_date: addDaysISO(start, 6), amount: 45000, category: "direct_client", client: "Crumb & Co", project_id: projectIds[0] },
    { user_id: userId, txn_date: addDaysISO(start, 10), amount: 22000, category: "fiverr", source: "Next.js bug fix" },
    { user_id: userId, txn_date: addDaysISO(start, 12), amount: 30000, category: "direct_client", client: "Launchly", project_id: projectIds[1] },
  ]);
  await insert(
    "expense_transactions",
    days.filter((_, i) => i % 2 === 1).map((day) => ({
      user_id: userId,
      txn_date: day,
      amount: pick([1500, 2500, 4000, 8000]),
      category: pick(["essential", "essential", "business", "education", "family", "entertainment"] as const),
    })),
  );
  await insert("savings_entries", [
    { user_id: userId, entry_date: addDaysISO(start, 7), amount: 20000, kind: "deposit" },
    { user_id: userId, entry_date: addDaysISO(start, 12), amount: 12000, kind: "deposit" },
  ]);

  // Reflection
  await insert("weekly_reviews", [
    {
      user_id: userId,
      week_start: mondayOf(addDaysISO(today, -7)),
      built: "Checkout flow for the bakery storefront.",
      learned: "RLS with composite foreign keys; useOptimistic.",
      went_well: "Hit my learning target 6/7 days.",
      time_wasters: "Late-night scrolling on Thursday.",
      improve_next: "Phone out of the bedroom. Outreach before noon.",
      stats: {},
    },
  ]);
  await insert(
    "journal_entries",
    days.slice(-7).map((day) => ({
      user_id: userId,
      entry_date: day,
      mood: between(3, 5),
      energy: between(2, 5),
      biggest_win: pick(["Closed a client", "7/7 day", "PR on squat", "Shipped a feature"]),
      gratitude: pick(["Family dinner", "Good sleep", "A kind client"]),
    })),
  );

  console.log(`\n✔ Demo data ready. Sign in with ${email} / ${password}\n`);
}

function minDate(a: string, b: string) {
  return a < b ? a : b;
}

function mondayOf(date: string): string {
  const d = new Date(`${date}T00:00:00Z`);
  const offset = (d.getUTCDay() + 6) % 7;
  return addDaysISO(date, -offset);
}

main().catch((error: unknown) => fail(error instanceof Error ? error.message : String(error)));
