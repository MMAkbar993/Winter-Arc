"use client";

import { DeleteButton } from "@/components/shared/delete-button";
import { EmptyState } from "@/components/shared/empty-state";
import { RecordList, RecordRow } from "@/components/shared/record-list";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { deleteProspect } from "@/features/clients/actions";
import { prospectToInitial } from "@/features/clients/components/prospect-helpers";
import { ProspectStageBadge } from "@/features/clients/components/prospect-stage-badge";
import type { ProspectWithFollowup } from "@/features/clients/queries";
import { EditRecordButton } from "@/features/quick-add/edit-record-button";
import { labelFor, PROSPECT_SOURCES } from "@/lib/constants";
import { formatISODate } from "@/lib/dates";
import { formatCurrency } from "@/lib/format";
import { cn } from "@/lib/utils";
import { Users } from "lucide-react";

/** Table on desktop; stacked rows on phones (no horizontal scrolling). */
export function ProspectTable({ prospects, today, currency }: { prospects: ProspectWithFollowup[]; today: string; currency: string }) {
  if (prospects.length === 0) {
    return <EmptyState icon={Users} title="No prospects yet" description="Add the first person you reached out to today." />;
  }

  const actions = (p: ProspectWithFollowup) => (
    <>
      <EditRecordButton kind="prospect" id={p.id} title={`Edit ${p.name}`} initial={prospectToInitial(p)} />
      <DeleteButton action={deleteProspect.bind(null, p.id)} itemLabel={p.name} description="This also deletes the prospect's follow-ups." />
    </>
  );
  const followUp = (p: ProspectWithFollowup) =>
    p.nextFollowUp ? (
      <span className={cn(p.nextFollowUp.dueOn < today && "font-medium text-warning")}>
        {formatISODate(p.nextFollowUp.dueOn, "MMM d")}
        {p.nextFollowUp.dueOn < today ? " · overdue" : ""}
      </span>
    ) : (
      <span className="text-muted-foreground">—</span>
    );

  return (
    <>
      <div className="hidden md:block">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Prospect</TableHead>
              <TableHead>Source</TableHead>
              <TableHead>Stage</TableHead>
              <TableHead>Service</TableHead>
              <TableHead className="text-right">Value</TableHead>
              <TableHead>Contacted</TableHead>
              <TableHead>Follow-up</TableHead>
              <TableHead className="w-20">
                <span className="sr-only">Actions</span>
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {prospects.map((p) => (
              <TableRow key={p.id}>
                <TableCell>
                  <p className="font-medium">{p.name}</p>
                  {p.company ? <p className="text-xs text-muted-foreground">{p.company}</p> : null}
                </TableCell>
                <TableCell>{labelFor(PROSPECT_SOURCES, p.source)}</TableCell>
                <TableCell>
                  <ProspectStageBadge stage={p.stage} />
                </TableCell>
                <TableCell className="max-w-48 truncate">{p.service_needed ?? "—"}</TableCell>
                <TableCell className="text-right tabular">
                  {p.estimated_value ? formatCurrency(Number(p.estimated_value), currency) : "—"}
                </TableCell>
                <TableCell>{p.contacted_on ? formatISODate(p.contacted_on, "MMM d") : "—"}</TableCell>
                <TableCell>{followUp(p)}</TableCell>
                <TableCell>
                  <div className="flex justify-end">{actions(p)}</div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
      <RecordList className="md:hidden">
        {prospects.map((p) => (
          <RecordRow
            key={p.id}
            title={p.name}
            meta={
              <>
                <ProspectStageBadge stage={p.stage} />
                <span>{labelFor(PROSPECT_SOURCES, p.source)}</span>
                {p.nextFollowUp ? <span>Follow-up {followUp(p)}</span> : null}
              </>
            }
            value={p.estimated_value ? formatCurrency(Number(p.estimated_value), currency) : null}
            actions={actions(p)}
          />
        ))}
      </RecordList>
    </>
  );
}
