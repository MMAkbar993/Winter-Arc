import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import type { Database } from "@/types/database";
import { getSupabaseEnv, hasSupabaseEnv } from "@/lib/supabase/env";

/** Routes reachable without a session. Everything else requires sign-in. */
const PUBLIC_PATHS = ["/", "/login", "/register", "/forgot-password"];
const PUBLIC_PREFIXES = ["/auth/"];
/** Signed-in users are bounced from these to the dashboard. */
const AUTH_ONLY_PATHS = ["/login", "/register", "/forgot-password"];

function isPublic(pathname: string): boolean {
  return PUBLIC_PATHS.includes(pathname) || PUBLIC_PREFIXES.some((p) => pathname.startsWith(p));
}

/**
 * Refreshes the Supabase session cookie on every request and performs an
 * optimistic redirect for unauthenticated users. This is NOT the security
 * boundary: every page, server action and query re-verifies the user, and
 * Postgres RLS enforces ownership.
 */
export async function proxy(request: NextRequest) {
  let response = NextResponse.next({ request });
  if (!hasSupabaseEnv()) return response;
  const { url, anonKey } = getSupabaseEnv();

  const supabase = createServerClient<Database>(url, anonKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet, headers) {
        for (const { name, value } of cookiesToSet) request.cookies.set(name, value);
        response = NextResponse.next({ request });
        for (const { name, value, options } of cookiesToSet) response.cookies.set(name, value, options);
        for (const [key, value] of Object.entries(headers ?? {})) response.headers.set(key, value);
      },
    },
  });

  // Must run immediately after client creation: validates and refreshes the session.
  const { data } = await supabase.auth.getClaims();
  const signedIn = Boolean(data?.claims?.sub);
  const { pathname, search } = request.nextUrl;

  const redirectTo = (destination: string) => {
    const target = request.nextUrl.clone();
    const [path, query] = destination.split("?");
    target.pathname = path ?? "/";
    target.search = query ? `?${query}` : "";
    const redirect = NextResponse.redirect(target);
    for (const cookie of response.cookies.getAll()) redirect.cookies.set(cookie);
    return redirect;
  };

  if (!signedIn && !isPublic(pathname)) {
    return redirectTo(`/login?next=${encodeURIComponent(pathname + search)}`);
  }
  if (signedIn && (AUTH_ONLY_PATHS.includes(pathname) || pathname === "/")) {
    return redirectTo("/dashboard");
  }
  return response;
}

export const config = {
  matcher: [
    // Skip static assets and image optimisation files.
    "/((?!_next/static|_next/image|favicon.ico|icon.svg|manifest.webmanifest|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)",
  ],
};
