"use server";

import { runAction } from "@/lib/actions";
import { deleteAction, saveOwned } from "@/lib/crud";
import { learningSessionSchema } from "@/lib/validation/schemas";
import { autoCompleteTargetHabits } from "@/features/habits/auto-complete";

export async function saveLearningSession(raw: unknown, id?: string) {
  return runAction(
    learningSessionSchema,
    raw,
    async (input, ctx) => {
      const sessionId = await saveOwned(
        ctx,
        "learning_sessions",
        {
          session_date: input.date,
          topic: input.topic,
          category: input.category,
          duration_minutes: input.duration,
          resource: input.resource,
          notes: input.notes,
          project_id: input.projectId,
          completed: input.completed,
        },
        id,
      );
      await autoCompleteTargetHabits(ctx, input.date);
      return { id: sessionId };
    },
    { successMessage: id ? "Session updated" : "Learning session logged" },
  );
}

export async function deleteLearningSession(id: string) {
  return deleteAction("learning_sessions", id);
}
