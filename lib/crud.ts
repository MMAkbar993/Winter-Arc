import "server-only";
import { z } from "zod";
import { ActionError, assertNoDbError, runAction, type ActionContext } from "@/lib/actions";
import type { TableInsert, TableName } from "@/types/database";

const idSchema = z.uuid();

/** Validates an optional record id coming from the client. */
export function parseOptionalId(id: unknown): string | null {
  if (id === undefined || id === null || id === "") return null;
  const parsed = idSchema.safeParse(id);
  if (!parsed.success) throw new ActionError("That record could not be found.");
  return parsed.data;
}

/**
 * Inserts a new row for the current user, or updates an existing one.
 * Updates are always scoped by user_id as well as id (defence in depth on
 * top of RLS). Returns the row id.
 */
export async function saveOwned<T extends TableName>(
  { supabase, user }: ActionContext,
  table: T,
  values: Omit<TableInsert<T>, "user_id" | "id">,
  id?: unknown,
): Promise<string> {
  const recordId = parseOptionalId(id);
  // The generic table name defeats postgrest-js inference; values are already
  // typed by TableInsert<T> above.
  const query = supabase.from(table as "projects");
  const row = { ...values, user_id: user.id } as unknown as TableInsert<"projects">;

  if (recordId) {
    const { data, error } = await query.update(row).eq("id", recordId).eq("user_id", user.id).select("id").maybeSingle();
    assertNoDbError(error, `update ${table}`);
    if (!data) throw new ActionError("That record could not be found.");
    return data.id;
  }
  const { data, error } = await query.insert(row).select("id").single();
  assertNoDbError(error, `insert ${table}`);
  if (!data) throw new ActionError("Could not save. Please try again.");
  return data.id;
}

export async function deleteOwned({ supabase, user }: ActionContext, table: TableName, id: string): Promise<void> {
  const { error, count } = await supabase
    .from(table as "projects")
    .delete({ count: "exact" })
    .eq("id", id)
    .eq("user_id", user.id);
  assertNoDbError(error, `delete ${table}`);
  if (!count) throw new ActionError("That record could not be found.");
}

const deleteSchema = z.object({ id: z.uuid({ error: "That record could not be found." }) });

/** Standard delete server-action body. */
export function deleteAction(table: TableName, id: unknown) {
  return runAction(deleteSchema, { id }, async (input, ctx) => {
    await deleteOwned(ctx, table, input.id);
  });
}
