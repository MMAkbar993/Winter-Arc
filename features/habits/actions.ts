"use server";

import { z } from "zod";
import { ActionError, assertNoDbError, runAction } from "@/lib/actions";
import { PRIORITY_KIND_VALUES } from "@/lib/constants";
import { isoDate } from "@/lib/validation/fields";
import {
  dailyNoteSchema,
  habitNoteSchema,
  priorityToggleSchema,
  priorityUpsertSchema,
  toggleHabitSchema,
} from "@/lib/validation/schemas";

async function assertNotFuture(date: string, getToday: () => Promise<string>) {
  if (date > (await getToday())) throw new ActionError("You can't log habits for a future day.");
}

export async function toggleHabit(raw: unknown) {
  return runAction(toggleHabitSchema, raw, async (input, { supabase, user, getToday }) => {
    await assertNotFuture(input.date, getToday);
    const { error } = await supabase.from("daily_habits").upsert(
      {
        user_id: user.id,
        log_date: input.date,
        habit_key: input.habitKey,
        completed: input.completed,
        completed_at: input.completed ? new Date().toISOString() : null,
      },
      { onConflict: "user_id,log_date,habit_key" },
    );
    assertNoDbError(error, "toggle habit");
  });
}

export async function saveHabitNote(raw: unknown) {
  return runAction(
    habitNoteSchema,
    raw,
    async (input, { supabase, user, getToday }) => {
      await assertNotFuture(input.date, getToday);
      const { error } = await supabase
        .from("daily_habits")
        .upsert(
          { user_id: user.id, log_date: input.date, habit_key: input.habitKey, notes: input.notes },
          { onConflict: "user_id,log_date,habit_key" },
        );
      assertNoDbError(error, "save habit note");
    },
    { successMessage: "Note saved" },
  );
}

export async function savePriority(raw: unknown) {
  return runAction(priorityUpsertSchema, raw, async (input, { supabase, user }) => {
    const { error } = await supabase
      .from("daily_priorities")
      .upsert(
        { user_id: user.id, log_date: input.date, kind: input.kind, title: input.title },
        { onConflict: "user_id,log_date,kind" },
      );
    assertNoDbError(error, "save priority");
  });
}

export async function togglePriority(raw: unknown) {
  return runAction(priorityToggleSchema, raw, async (input, { supabase, user }) => {
    const { error } = await supabase
      .from("daily_priorities")
      .update({ completed: input.completed, completed_at: input.completed ? new Date().toISOString() : null })
      .eq("user_id", user.id)
      .eq("log_date", input.date)
      .eq("kind", input.kind);
    assertNoDbError(error, "toggle priority");
  });
}

const clearPrioritySchema = z.object({ date: isoDate(), kind: z.enum(PRIORITY_KIND_VALUES) });

export async function clearPriority(raw: unknown) {
  return runAction(clearPrioritySchema, raw, async (input, { supabase, user }) => {
    const { error } = await supabase
      .from("daily_priorities")
      .delete()
      .eq("user_id", user.id)
      .eq("log_date", input.date)
      .eq("kind", input.kind);
    assertNoDbError(error, "clear priority");
  });
}

export async function saveDailyNote(raw: unknown) {
  return runAction(
    dailyNoteSchema,
    raw,
    async (input, { supabase, user }) => {
      const { error } = await supabase
        .from("daily_logs")
        .upsert({ user_id: user.id, log_date: input.date, notes: input.notes }, { onConflict: "user_id,log_date" });
      assertNoDbError(error, "save daily note");
    },
    { successMessage: "Note saved" },
  );
}
