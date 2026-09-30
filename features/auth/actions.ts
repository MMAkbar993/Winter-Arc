"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { safeRedirectPath } from "@/lib/url";
import {
  forgotPasswordSchema,
  loginSchema,
  registerSchema,
  resetPasswordSchema,
} from "@/lib/validation/schemas";
import type { ActionResult } from "@/types/actions";

type Redirect = { redirectTo: string };

function invalid(error: z.ZodError): ActionResult<never> {
  const flat = z.flattenError(error);
  return {
    ok: false,
    error: flat.formErrors[0] ?? "Please fix the highlighted fields.",
    fieldErrors: flat.fieldErrors as Record<string, string[]>,
  };
}

async function siteOrigin(): Promise<string> {
  const configured = process.env.NEXT_PUBLIC_SITE_URL;
  if (configured) return configured.replace(/\/$/, "");
  const h = await headers();
  const host = h.get("x-forwarded-host") ?? h.get("host") ?? "localhost:3000";
  const proto = h.get("x-forwarded-proto") ?? (host.startsWith("localhost") ? "http" : "https");
  return `${proto}://${host}`;
}

export async function signIn(raw: unknown, next?: string): Promise<ActionResult<Redirect>> {
  const parsed = loginSchema.safeParse(raw);
  if (!parsed.success) return invalid(parsed.error);

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword(parsed.data);
  if (error) {
    if (error.code === "email_not_confirmed") {
      return { ok: false, error: "Please confirm your email first — check your inbox for the link." };
    }
    return { ok: false, error: "Incorrect email or password." };
  }
  return { ok: true, data: { redirectTo: safeRedirectPath(next) } };
}

export async function signUp(raw: unknown): Promise<ActionResult<Redirect | { needsConfirmation: true }>> {
  const parsed = registerSchema.safeParse(raw);
  if (!parsed.success) return invalid(parsed.error);

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signUp({
    email: parsed.data.email,
    password: parsed.data.password,
    options: {
      data: { full_name: parsed.data.name },
      emailRedirectTo: `${await siteOrigin()}/auth/confirm?next=/onboarding`,
    },
  });

  if (error) {
    if (error.code === "weak_password") return { ok: false, error: "Choose a stronger password." };
    if (error.code === "over_email_send_rate_limit") {
      return { ok: false, error: "Too many attempts. Please wait a minute and try again." };
    }
    console.error("[auth] signUp failed", error.code);
    return { ok: false, error: "We couldn't create your account. Please try again." };
  }

  // With email confirmation disabled Supabase returns a session immediately.
  if (data.session) return { ok: true, data: { redirectTo: "/onboarding" } };
  return { ok: true, data: { needsConfirmation: true } };
}

export async function requestPasswordReset(raw: unknown): Promise<ActionResult<null>> {
  const parsed = forgotPasswordSchema.safeParse(raw);
  if (!parsed.success) return invalid(parsed.error);

  const supabase = await createClient();
  const { error } = await supabase.auth.resetPasswordForEmail(parsed.data.email, {
    redirectTo: `${await siteOrigin()}/auth/confirm?next=/reset-password`,
  });
  if (error) console.error("[auth] resetPasswordForEmail failed", error.code);
  // Same response whether or not the account exists (no account enumeration).
  return { ok: true, data: null, message: "If an account exists for that email, a reset link is on its way." };
}

export async function updatePassword(raw: unknown): Promise<ActionResult<Redirect>> {
  const parsed = resetPasswordSchema.safeParse(raw);
  if (!parsed.success) return invalid(parsed.error);

  const supabase = await createClient();
  const { data: userData } = await supabase.auth.getUser();
  if (!userData.user) {
    return { ok: false, error: "Your reset link has expired. Request a new one." };
  }
  const { error } = await supabase.auth.updateUser({ password: parsed.data.password });
  if (error) {
    if (error.code === "same_password") return { ok: false, error: "Choose a password you haven't used before." };
    console.error("[auth] updateUser failed", error.code);
    return { ok: false, error: "We couldn't update your password. Please try again." };
  }
  return { ok: true, data: { redirectTo: "/dashboard" }, message: "Password updated." };
}

export async function signOut(): Promise<void> {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/login");
}
