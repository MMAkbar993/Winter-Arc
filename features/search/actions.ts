"use server";

import { getCurrentUser } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { searchSchema } from "@/lib/validation/schemas";
import type { SearchResultRow } from "@/types/database";

/** Global search across prospects, projects, learning, content and journal. */
export async function searchEverything(query: unknown): Promise<SearchResultRow[]> {
  const parsed = searchSchema.safeParse({ query });
  if (!parsed.success) return [];
  if (!(await getCurrentUser())) return [];

  const supabase = await createClient();
  const { data, error } = await supabase.rpc("search_everything", { p_query: parsed.data.query, p_limit: 6 });
  if (error) {
    console.error("[search] failed", error.code);
    return [];
  }
  return data;
}
