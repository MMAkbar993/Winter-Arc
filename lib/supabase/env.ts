/**
 * Public Supabase configuration. These two values are safe to ship to the
 * browser: the anon/publishable key only grants what RLS policies allow.
 * The service-role key is intentionally NOT read anywhere in the app — only
 * the development seed script (scripts/seed.ts) uses it.
 *
 * Supabase now calls the public key the "publishable key"; both
 * NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY and the legacy
 * NEXT_PUBLIC_SUPABASE_ANON_KEY are accepted.
 */
function readEnv(): { url: string | undefined; anonKey: string | undefined } {
  return {
    url: process.env.NEXT_PUBLIC_SUPABASE_URL,
    anonKey: process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  };
}

export function getSupabaseEnv(): { url: string; anonKey: string } {
  const { url, anonKey } = readEnv();
  if (!url || !anonKey) {
    throw new Error(
      "Missing Supabase config: set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY (or NEXT_PUBLIC_SUPABASE_ANON_KEY) in .env.local, then restart `npm run dev`.",
    );
  }
  return { url, anonKey };
}

export function hasSupabaseEnv(): boolean {
  const { url, anonKey } = readEnv();
  return Boolean(url && anonKey);
}
