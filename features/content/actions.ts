"use server";

import { runAction } from "@/lib/actions";
import { deleteAction, saveOwned } from "@/lib/crud";
import { contentItemSchema } from "@/lib/validation/schemas";
import { autoCompleteHabit } from "@/features/habits/auto-complete";

export async function saveContentItem(raw: unknown, id?: string) {
  return runAction(
    contentItemSchema,
    raw,
    async (input, ctx) => {
      const itemId = await saveOwned(
        ctx,
        "content_items",
        {
          platform: input.platform,
          content_date: input.date,
          content_type: input.contentType,
          title: input.title,
          url: input.url,
          status: input.status,
          notes: input.notes,
        },
        id,
      );
      if (input.status === "published") await autoCompleteHabit(ctx, input.date, "content");
      return { id: itemId };
    },
    { successMessage: id ? "Content updated" : "Content saved" },
  );
}

export async function deleteContentItem(id: string) {
  return deleteAction("content_items", id);
}
