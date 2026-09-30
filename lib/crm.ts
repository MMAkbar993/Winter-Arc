import {
  CONTACTED_STAGES,
  OPEN_PIPELINE_STAGES,
  REPLIED_STAGES,
  type ProspectStage,
} from "@/lib/constants";
import type { ISODate } from "@/lib/dates";
import { toNumber } from "@/lib/finance";

export interface StageDates {
  contacted_on: ISODate | null;
  replied_on: ISODate | null;
  won_on: ISODate | null;
}

/**
 * Milestone dates implied by a stage. Dates already recorded are kept; missing
 * ones are stamped with `today`. Moving back to "identified" clears contact;
 * leaving "won" clears the win date so revenue isn't double counted.
 */
export function stageDates(stage: ProspectStage, existing: StageDates, today: ISODate): StageDates {
  const contacted = CONTACTED_STAGES.includes(stage) || (stage === "lost" && existing.contacted_on !== null);
  const replied = REPLIED_STAGES.includes(stage) || (stage === "lost" && existing.replied_on !== null);
  return {
    contacted_on: contacted ? (existing.contacted_on ?? today) : null,
    replied_on: replied ? (existing.replied_on ?? today) : null,
    won_on: stage === "won" ? (existing.won_on ?? today) : null,
  };
}

export interface PipelineStats {
  total: number;
  contacted: number;
  replies: number;
  replyRate: number;
  qualified: number;
  calls: number;
  proposals: number;
  won: number;
  lost: number;
  pipelineValue: number;
  wonValue: number;
  byStage: Record<ProspectStage, number>;
}

export function pipelineStats(
  prospects: readonly { stage: ProspectStage; estimated_value: number | string | null; contacted_on: string | null; replied_on: string | null }[],
): PipelineStats {
  const byStage = {
    identified: 0, contacted: 0, replied: 0, qualified: 0, call_scheduled: 0,
    proposal_sent: 0, negotiating: 0, won: 0, lost: 0,
  } satisfies Record<ProspectStage, number>;
  let pipelineValue = 0;
  let wonValue = 0;
  let contacted = 0;
  let replies = 0;
  for (const p of prospects) {
    byStage[p.stage] += 1;
    const value = toNumber(p.estimated_value);
    if (OPEN_PIPELINE_STAGES.includes(p.stage)) pipelineValue += value;
    if (p.stage === "won") wonValue += value;
    if (p.contacted_on) contacted += 1;
    if (p.replied_on) replies += 1;
  }
  const atLeast = (stages: ProspectStage[]) => stages.reduce((acc, s) => acc + byStage[s], 0);
  return {
    total: prospects.length,
    contacted,
    replies,
    replyRate: contacted > 0 ? Math.round((replies / contacted) * 100) : 0,
    qualified: atLeast(["qualified", "call_scheduled", "proposal_sent", "negotiating", "won"]),
    calls: atLeast(["call_scheduled", "proposal_sent", "negotiating", "won"]),
    proposals: atLeast(["proposal_sent", "negotiating", "won"]),
    won: byStage.won,
    lost: byStage.lost,
    pipelineValue,
    wonValue,
    byStage,
  };
}
