import { readFileSync, readdirSync } from "node:fs";
import path from "node:path";
import { PGlite } from "@electric-sql/pglite";

/**
 * Minimal stand-in for what Supabase provides: the anon/authenticated roles,
 * an `auth.users` table, `auth.uid()` reading the JWT subject, and default
 * table privileges (Supabase grants table access; RLS does the restricting).
 */
const SUPABASE_STUB = `
  create role anon nologin;
  create role authenticated nologin;
  create role service_role nologin bypassrls;
  create schema auth;
  grant usage on schema auth to anon, authenticated;
  create table auth.users (
    id uuid primary key,
    email text,
    raw_user_meta_data jsonb not null default '{}'::jsonb
  );
  create function auth.uid() returns uuid language sql stable as $$
    select nullif(current_setting('request.jwt.claim.sub', true), '')::uuid
  $$;
  grant execute on function auth.uid() to anon, authenticated;
  grant usage on schema public to anon, authenticated, service_role;
  alter default privileges in schema public grant all on tables to anon, authenticated, service_role;
  alter default privileges in schema public grant execute on functions to anon, authenticated, service_role;
`;

export interface TestDb {
  db: PGlite;
  /** Runs SQL as an authenticated user (or anon when userId is null). */
  as: <T = Record<string, unknown>>(userId: string | null, sql: string, params?: unknown[]) => Promise<{ rows: T[] }>;
  createUser: (id: string, email: string, fullName?: string) => Promise<void>;
}

export async function createTestDb(): Promise<TestDb> {
  const db = new PGlite();
  await db.exec(SUPABASE_STUB);
  const dir = path.join(process.cwd(), "supabase", "migrations");
  for (const file of readdirSync(dir).filter((f) => f.endsWith(".sql")).sort()) {
    await db.exec(readFileSync(path.join(dir, file), "utf8"));
  }

  const as: TestDb["as"] = async (userId, sql, params = []) => {
    await db.exec("reset role");
    await db.query("select set_config('request.jwt.claim.sub', $1, false)", [userId ?? ""]);
    await db.exec(userId ? "set role authenticated" : "set role anon");
    try {
      return await db.query(sql, params);
    } finally {
      await db.exec("reset role");
    }
  };

  const createUser: TestDb["createUser"] = async (id, email, fullName) => {
    await db.query("insert into auth.users (id, email, raw_user_meta_data) values ($1, $2, $3)", [
      id,
      email,
      JSON.stringify(fullName ? { full_name: fullName } : {}),
    ]);
  };

  return { db, as, createUser };
}
