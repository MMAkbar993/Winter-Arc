import "server-only";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import type { User } from "@supabase/supabase-js";
import { getCurrentUser } from "@/lib/auth";
import { DEFAULT_TIMEZONE } from "@/lib/constants";
import { isValidTimeZone, todayInTimeZone, type ISODate } from "@/lib/dates";
import { createClient, type ServerSupabase } from "@/lib/supabase/server";
import type { ActionResult } from "@/types/actions";

export interface ActionContext {
  supabase: ServerSupabase;
  user: User;
  /** Lazily resolves the user's local date in their configured timezone. */
  getToday: () => Promise<ISODate>;
}

/** Thrown inside a handler to return a user-facing error message. */
export class ActionError extends Error {}

interface PostgrestLikeError {
  code?: string;
  message?: string;
}

/** Maps database errors to safe, user-facing messages (never leaks internals). */
function friendlyDbError(error: PostgrestLikeError): string {
  switch (error.code) {
    case "23505":
      return "That entry already exists.";
    case "23503":
      return "A related record no longer exists. Refresh and try again.";
    case "23514":
      return "Some values are out of the allowed range.";
    case "42501":
      return "You don't have permission to do that.";
    default:
      return "Something went wrong while saving. Please try again.";
  }
}

/** Throws a safe ActionError for a Supabase error result; logs details server-side. */
export function assertNoDbError(error: PostgrestLikeError | null, context: string): void {
  if (!error) return;
  console.error(`[db] ${context}`, error);
  throw new ActionError(friendlyDbError(error));
}

/**
 * Wraps every mutation:
 *  1. verifies the session server-side (user identity never comes from the client)
 *  2. validates raw input with the shared Zod schema
 *  3. runs the handler with an RLS-scoped client
 *  4. revalidates the app shell so every screen reflects the change
 */
export async function runAction<S extends z.ZodType, R>(
  schema: S,
  raw: unknown,
  handler: (input: z.output<S>, ctx: ActionContext) => Promise<R>,
  options: { revalidate?: boolean; successMessage?: string } = {},
): Promise<ActionResult<R>> {
  const user = await getCurrentUser();
  if (!user) return { ok: false, error: "Your session has expired. Please sign in again." };

  const parsed = schema.safeParse(raw);
  if (!parsed.success) {
    const flattened = z.flattenError(parsed.error);
    return {
      ok: false,
      error: flattened.formErrors[0] ?? "Please fix the highlighted fields.",
      fieldErrors: flattened.fieldErrors as Record<string, string[]>,
    };
  }

  const supabase = await createClient();
  let todayPromise: Promise<ISODate> | null = null;
  const loadToday = async (): Promise<ISODate> => {
    const { data } = await supabase.from("user_settings").select("timezone").eq("user_id", user.id).maybeSingle();
    return todayInTimeZone(data?.timezone && isValidTimeZone(data.timezone) ? data.timezone : DEFAULT_TIMEZONE);
  };
  const getToday = (): Promise<ISODate> => (todayPromise ??= loadToday());

  try {
    const data = await handler(parsed.data, { supabase, user, getToday });
    if (options.revalidate !== false) revalidatePath("/", "layout");
    return { ok: true, data, message: options.successMessage };
  } catch (error) {
    if (error instanceof ActionError) return { ok: false, error: error.message };
    console.error("[action] unexpected failure", error);
    return { ok: false, error: "Something went wrong. Please try again." };
  }
}
