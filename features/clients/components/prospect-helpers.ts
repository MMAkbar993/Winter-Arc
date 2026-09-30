import type { ProspectWithFollowup } from "@/features/clients/queries";
import { str } from "@/lib/options";

/** Maps a prospect row to raw ProspectForm values for editing. */
export function prospectToInitial(p: ProspectWithFollowup): Record<string, unknown> {
  return {
    name: p.name,
    company: str(p.company),
    source: p.source,
    profileUrl: str(p.profile_url),
    contactMethod: str(p.contact_method),
    serviceNeeded: str(p.service_needed),
    estimatedValue: str(p.estimated_value),
    stage: p.stage,
    contactedOn: str(p.contacted_on),
    nextFollowUpOn: str(p.nextFollowUp?.dueOn),
    followUpNotes: str(p.nextFollowUp?.notes),
    notes: str(p.notes),
  };
}
