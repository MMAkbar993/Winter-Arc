"use server";

import { assertNoDbError, runAction } from "@/lib/actions";
import { deleteAction } from "@/lib/crud";
import { journalSchema } from "@/lib/validation/schemas";

/** One journal entry per day — saving again updates that day's entry. */
export async function saveJournalEntry(raw: unknown) {
  return runAction(
    journalSchema,
    raw,
    async (input, { supabase, user }) => {
      const { error } = await supabase.from("journal_entries").upsert(
        {
          user_id: user.id,
          entry_date: input.date,
          mood: input.mood,
          energy: input.energy,
          notes: input.notes,
          gratitude: input.gratitude,
          biggest_win: input.biggestWin,
          biggest_challenge: input.biggestChallenge,
        },
        { onConflict: "user_id,entry_date" },
      );
      assertNoDbError(error, "save journal");
    },
    { successMessage: "Journal saved" },
  );
}

export async function deleteJournalEntry(id: string) {
  return deleteAction("journal_entries", id);
}
