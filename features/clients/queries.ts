import "server-only";
import { getOverview, type Overview } from "@/features/dashboard/overview";
import { getDueFollowups, type FollowupItem } from "@/features/dashboard/queries";
import { pipelineStats, type PipelineStats } from "@/lib/crm";
import { labelFor, PROSPECT_SOURCES, type ProspectSource } from "@/lib/constants";
import type { UserContext } from "@/lib/data/context";
import type { OutreachLogRow, ProspectRow } from "@/types/database";

export type ProspectWithFollowup = ProspectRow & {
  nextFollowUp: { id: string; dueOn: string; notes: string | null } | null;
};

export interface ClientsData {
  overview: Overview;
  prospects: ProspectWithFollowup[];
  stats: PipelineStats;
  followups: FollowupItem[];
  outreachLogs: OutreachLogRow[];
  /** Outreach actions this week by platform (logged + prospects contacted). */
  bySource: { label: string; value: number }[];
  contactedToday: number;
}

export async function getClientsData(ctx: UserContext): Promise<ClientsData> {
  const { supabase, user, today } = ctx;
  const overview = await getOverview(ctx);
  const [prospectsRes, followups, logsRes] = await Promise.all([
    supabase
      .from("prospects")
      .select("*, prospect_followups(id, due_on, status, notes)")
      .eq("user_id", user.id)
      .order("updated_at", { ascending: false })
      .limit(500),
    getDueFollowups(ctx, 25),
    supabase
      .from("outreach_logs")
      .select("*")
      .eq("user_id", user.id)
      .gte("log_date", overview.weekStart)
      .lte("log_date", today)
      .order("log_date", { ascending: false })
      .order("created_at", { ascending: false }),
  ]);
  if (prospectsRes.error || logsRes.error) {
    console.error("[db] clients", prospectsRes.error ?? logsRes.error);
    throw new Error("Could not load your pipeline.");
  }

  const prospects: ProspectWithFollowup[] = prospectsRes.data.map(({ prospect_followups, ...p }) => {
    const pending = prospect_followups.filter((f) => f.status === "pending").sort((a, b) => a.due_on.localeCompare(b.due_on))[0];
    return { ...p, nextFollowUp: pending ? { id: pending.id, dueOn: pending.due_on, notes: pending.notes } : null };
  });

  const sourceTotals = new Map<ProspectSource, number>();
  for (const log of logsRes.data) sourceTotals.set(log.source, (sourceTotals.get(log.source) ?? 0) + log.count);
  for (const p of prospects) {
    if (p.contacted_on && p.contacted_on >= overview.weekStart && p.contacted_on <= today) {
      sourceTotals.set(p.source, (sourceTotals.get(p.source) ?? 0) + 1);
    }
  }

  return {
    overview,
    prospects,
    stats: pipelineStats(prospects),
    followups,
    outreachLogs: logsRes.data,
    bySource: [...sourceTotals.entries()]
      .map(([source, value]) => ({ label: labelFor(PROSPECT_SOURCES, source), value }))
      .sort((a, b) => b.value - a.value),
    contactedToday: prospects.filter((p) => p.contacted_on === today).length,
  };
}
