import { Badge } from "@/components/ui/badge";
import { labelFor, PROSPECT_STAGES, type ProspectStage } from "@/lib/constants";

/** Stage badge. Won uses the accent; lost is muted; everything else is neutral. */
export function ProspectStageBadge({ stage }: { stage: ProspectStage }) {
  const variant = stage === "won" ? "brand" : stage === "lost" ? "outline" : "secondary";
  return <Badge variant={variant}>{labelFor(PROSPECT_STAGES, stage)}</Badge>;
}
