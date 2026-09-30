"use server";

import { runAction } from "@/lib/actions";
import { deleteAction, saveOwned } from "@/lib/crud";
import { projectSchema, workSessionSchema } from "@/lib/validation/schemas";
import { autoCompleteHabit } from "@/features/habits/auto-complete";

export async function saveProject(raw: unknown, id?: string) {
  return runAction(
    projectSchema,
    raw,
    async (input, ctx) => ({
      id: await saveOwned(
        ctx,
        "projects",
        { name: input.name, client_name: input.clientName, status: input.status, description: input.description },
        id,
      ),
    }),
    { successMessage: id ? "Project updated" : "Project created" },
  );
}

export async function deleteProject(id: string) {
  return deleteAction("projects", id);
}

export async function saveWorkSession(raw: unknown, id?: string) {
  return runAction(
    workSessionSchema,
    raw,
    async (input, ctx) => {
      const sessionId = await saveOwned(
        ctx,
        "work_sessions",
        {
          project_id: input.projectId,
          session_date: input.date,
          task: input.task,
          start_time: input.startTime,
          end_time: input.endTime,
          duration_minutes: input.duration,
          billable: input.billable,
          amount_earned: input.amountEarned,
          notes: input.notes,
        },
        id,
      );
      await autoCompleteHabit(ctx, input.date, "client_work");
      return { id: sessionId };
    },
    { successMessage: id ? "Work session updated" : "Work session logged" },
  );
}

export async function deleteWorkSession(id: string) {
  return deleteAction("work_sessions", id);
}
