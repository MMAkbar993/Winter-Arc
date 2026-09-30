import "server-only";
import { assertNoDbError } from "@/lib/actions";
import type { ServerSupabase } from "@/lib/supabase/server";

/** Updates the user's active challenge, creating it if none exists. */
export async function saveActiveChallenge(
  supabase: ServerSupabase,
  userId: string,
  challenge: { name: string; startDate: string; endDate: string },
): Promise<void> {
  const values = { name: challenge.name, start_date: challenge.startDate, end_date: challenge.endDate };
  const existing = await supabase
    .from("challenges")
    .select("id")
    .eq("user_id", userId)
    .eq("is_active", true)
    .maybeSingle();
  assertNoDbError(existing.error, "load active challenge");

  const result = existing.data
    ? await supabase.from("challenges").update(values).eq("id", existing.data.id).eq("user_id", userId)
    : await supabase.from("challenges").insert({ ...values, user_id: userId, is_active: true });
  assertNoDbError(result.error, "save challenge");
}
