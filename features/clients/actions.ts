"use server";

import { ActionError, assertNoDbError, runAction, type ActionContext } from "@/lib/actions";
import { deleteAction, parseOptionalId, saveOwned } from "@/lib/crud";
import { stageDates } from "@/lib/crm";
import {
  completeFollowupSchema,
  followupSchema,
  outreachLogSchema,
  prospectSchema,
  prospectStageSchema,
} from "@/lib/validation/schemas";
import { autoCompleteTargetHabits } from "@/features/habits/auto-complete";

async function upsertPendingFollowup(
  ctx: ActionContext,
  prospectId: string,
  dueOn: string,
  notes: string | null,
): Promise<void> {
  const pending = await ctx.supabase
    .from("prospect_followups")
    .select("id")
    .eq("user_id", ctx.user.id)
    .eq("prospect_id", prospectId)
    .eq("status", "pending")
    .order("due_on")
    .limit(1)
    .maybeSingle();
  assertNoDbError(pending.error, "load follow-up");

  const result = pending.data
    ? await ctx.supabase
        .from("prospect_followups")
        .update({ due_on: dueOn, notes })
        .eq("id", pending.data.id)
        .eq("user_id", ctx.user.id)
    : await ctx.supabase
        .from("prospect_followups")
        .insert({ user_id: ctx.user.id, prospect_id: prospectId, due_on: dueOn, notes });
  assertNoDbError(result.error, "save follow-up");
}

export async function saveProspect(raw: unknown, id?: string) {
  return runAction(
    prospectSchema,
    raw,
    async (input, ctx) => {
      const recordId = parseOptionalId(id);
      const today = await ctx.getToday();

      let existing = { contacted_on: null as string | null, replied_on: null as string | null, won_on: null as string | null };
      if (recordId) {
        const { data, error } = await ctx.supabase
          .from("prospects")
          .select("contacted_on, replied_on, won_on")
          .eq("id", recordId)
          .eq("user_id", ctx.user.id)
          .maybeSingle();
        assertNoDbError(error, "load prospect");
        if (!data) throw new ActionError("That prospect could not be found.");
        existing = data;
      }
      // An explicit "date contacted" from the form wins over the stage default.
      const dates = stageDates(input.stage, { ...existing, contacted_on: input.contactedOn ?? existing.contacted_on }, today);

      const prospectId = await saveOwned(
        ctx,
        "prospects",
        {
          name: input.name,
          company: input.company,
          source: input.source,
          profile_url: input.profileUrl,
          contact_method: input.contactMethod,
          service_needed: input.serviceNeeded,
          estimated_value: input.estimatedValue,
          stage: input.stage,
          notes: input.notes,
          ...dates,
        },
        recordId,
      );

      if (input.nextFollowUpOn) {
        await upsertPendingFollowup(ctx, prospectId, input.nextFollowUpOn, input.followUpNotes);
      }
      if (dates.contacted_on) await autoCompleteTargetHabits(ctx, dates.contacted_on);
      return { id: prospectId };
    },
    { successMessage: id ? "Prospect updated" : "Prospect added" },
  );
}

export async function moveProspectStage(raw: unknown) {
  return runAction(prospectStageSchema, raw, async (input, ctx) => {
    const { data, error } = await ctx.supabase
      .from("prospects")
      .select("contacted_on, replied_on, won_on")
      .eq("id", input.id)
      .eq("user_id", ctx.user.id)
      .maybeSingle();
    assertNoDbError(error, "load prospect");
    if (!data) throw new ActionError("That prospect could not be found.");

    const today = await ctx.getToday();
    const dates = stageDates(input.stage, data, today);
    const update = await ctx.supabase
      .from("prospects")
      .update({ stage: input.stage, ...dates })
      .eq("id", input.id)
      .eq("user_id", ctx.user.id);
    assertNoDbError(update.error, "move prospect");
    if (dates.contacted_on === today) await autoCompleteTargetHabits(ctx, today);
  });
}

export async function deleteProspect(id: string) {
  return deleteAction("prospects", id);
}

export async function addFollowup(raw: unknown) {
  return runAction(
    followupSchema,
    raw,
    async (input, ctx) => {
      const { error } = await ctx.supabase.from("prospect_followups").insert({
        user_id: ctx.user.id,
        prospect_id: input.prospectId,
        due_on: input.dueOn,
        notes: input.notes,
      });
      assertNoDbError(error, "add follow-up");
    },
    { successMessage: "Follow-up scheduled" },
  );
}

export async function completeFollowup(raw: unknown) {
  return runAction(completeFollowupSchema, raw, async (input, ctx) => {
    const today = await ctx.getToday();
    const { data, error } = await ctx.supabase
      .from("prospect_followups")
      .update({ status: input.status, completed_on: today })
      .eq("id", input.id)
      .eq("user_id", ctx.user.id)
      .select("prospect_id, notes")
      .maybeSingle();
    assertNoDbError(error, "complete follow-up");
    if (!data) throw new ActionError("That follow-up could not be found.");

    if (input.nextDueOn) {
      const next = await ctx.supabase.from("prospect_followups").insert({
        user_id: ctx.user.id,
        prospect_id: data.prospect_id,
        due_on: input.nextDueOn,
      });
      assertNoDbError(next.error, "schedule next follow-up");
    }
    if (input.status === "done") await autoCompleteTargetHabits(ctx, today);
  });
}

export async function logOutreach(raw: unknown) {
  return runAction(
    outreachLogSchema,
    raw,
    async (input, ctx) => {
      const { error } = await ctx.supabase.from("outreach_logs").insert({
        user_id: ctx.user.id,
        log_date: input.date,
        source: input.source,
        count: input.count,
        notes: input.notes,
      });
      assertNoDbError(error, "log outreach");
      await autoCompleteTargetHabits(ctx, input.date);
    },
    { successMessage: "Outreach logged" },
  );
}

export async function deleteOutreachLog(id: string) {
  return deleteAction("outreach_logs", id);
}
