"use client";

import { useOptimistic, useState, useTransition, type DragEvent } from "react";
import { ArrowRightLeft, CalendarClock, ExternalLink } from "lucide-react";
import { toast } from "sonner";
import { DeleteButton } from "@/components/shared/delete-button";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { deleteProspect, moveProspectStage } from "@/features/clients/actions";
import { prospectToInitial } from "@/features/clients/components/prospect-helpers";
import type { ProspectWithFollowup } from "@/features/clients/queries";
import { EditRecordButton } from "@/features/quick-add/edit-record-button";
import { labelFor, PROSPECT_SOURCES, PROSPECT_STAGES, type ProspectStage } from "@/lib/constants";
import { formatISODate } from "@/lib/dates";
import { formatCurrency } from "@/lib/format";
import { cn } from "@/lib/utils";

type Move = { id: string; stage: ProspectStage };

export function KanbanBoard({
  prospects,
  today,
  currency,
}: {
  prospects: ProspectWithFollowup[];
  today: string;
  currency: string;
}) {
  const [optimistic, applyMove] = useOptimistic(prospects, (state: ProspectWithFollowup[], m: Move) =>
    state.map((p) => (p.id === m.id ? { ...p, stage: m.stage } : p)),
  );
  const [, startTransition] = useTransition();
  const [dragOver, setDragOver] = useState<ProspectStage | null>(null);

  const move = (id: string, stage: ProspectStage) => {
    const current = optimistic.find((p) => p.id === id);
    if (!current || current.stage === stage) return;
    startTransition(async () => {
      applyMove({ id, stage });
      const result = await moveProspectStage({ id, stage });
      if (!result.ok) toast.error(result.error);
      else if (stage === "won") toast.success(`${current.name} won. Build in silence. Show results.`);
    });
  };

  const onDrop = (e: DragEvent, stage: ProspectStage) => {
    e.preventDefault();
    setDragOver(null);
    const id = e.dataTransfer.getData("text/prospect-id");
    if (id) move(id, stage);
  };

  const columns = PROSPECT_STAGES.map((s) => ({ ...s, items: optimistic.filter((p) => p.stage === s.value) }));

  const card = (p: ProspectWithFollowup) => (
    <ProspectCard key={p.id} prospect={p} today={today} currency={currency} onMove={(stage) => move(p.id, stage)} />
  );

  return (
    <>
      {/* Desktop: columns with drag & drop (the board scrolls inside its own container). */}
      <div className="hidden overflow-x-auto pb-2 md:block">
        <div className="flex w-max gap-3">
          {columns.map((col) => (
            <section
              key={col.value}
              aria-label={`${col.label} (${col.items.length})`}
              onDragOver={(e) => {
                e.preventDefault();
                setDragOver(col.value);
              }}
              onDragLeave={() => setDragOver((s) => (s === col.value ? null : s))}
              onDrop={(e) => onDrop(e, col.value)}
              className={cn(
                "flex w-64 shrink-0 flex-col gap-2 rounded-xl border bg-muted/30 p-2 transition-colors",
                dragOver === col.value && "border-brand bg-brand-soft",
              )}
            >
              <header className="flex items-center justify-between px-1 py-1">
                <h3 className="text-xs font-semibold">{col.label}</h3>
                <span className="text-xs text-muted-foreground tabular">{col.items.length}</span>
              </header>
              {col.items.length === 0 ? (
                <p className="rounded-lg border border-dashed px-2 py-4 text-center text-xs text-muted-foreground">Drop here</p>
              ) : (
                col.items.map(card)
              )}
            </section>
          ))}
        </div>
      </div>

      {/* Mobile: stacked stage groups — no horizontal scrolling. */}
      <div className="grid gap-2 md:hidden">
        {columns.map((col) => (
          <details key={col.value} open={col.items.length > 0 && col.value !== "lost"} className="rounded-xl border bg-muted/20">
            <summary className="flex min-h-11 cursor-pointer items-center justify-between px-3 text-sm font-medium">
              {col.label}
              <span className="text-xs text-muted-foreground tabular">{col.items.length}</span>
            </summary>
            <div className="grid gap-2 px-2 pb-2">
              {col.items.length === 0 ? <p className="px-1 pb-1 text-xs text-muted-foreground">No prospects.</p> : col.items.map(card)}
            </div>
          </details>
        ))}
      </div>
    </>
  );
}

function ProspectCard({
  prospect: p,
  today,
  currency,
  onMove,
}: {
  prospect: ProspectWithFollowup;
  today: string;
  currency: string;
  onMove: (stage: ProspectStage) => void;
}) {
  const due = p.nextFollowUp?.dueOn;
  return (
    <article
      draggable
      onDragStart={(e) => {
        e.dataTransfer.setData("text/prospect-id", p.id);
        e.dataTransfer.effectAllowed = "move";
      }}
      className="grid gap-2 rounded-lg border bg-card p-3 shadow-xs md:cursor-grab md:active:cursor-grabbing"
    >
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="truncate text-sm font-medium">{p.name}</p>
          {p.company || p.service_needed ? (
            <p className="truncate text-xs text-muted-foreground">{[p.company, p.service_needed].filter(Boolean).join(" · ")}</p>
          ) : null}
        </div>
        {p.estimated_value ? (
          <span className="shrink-0 text-xs font-medium tabular">{formatCurrency(Number(p.estimated_value), currency)}</span>
        ) : null}
      </div>
      <div className="flex flex-wrap items-center gap-1.5">
        <Badge variant="outline">{labelFor(PROSPECT_SOURCES, p.source)}</Badge>
        {due ? (
          <Badge variant={due < today ? "warning" : due === today ? "brand" : "secondary"}>
            <CalendarClock aria-hidden />
            {due < today ? "Overdue" : due === today ? "Today" : formatISODate(due, "MMM d")}
          </Badge>
        ) : null}
      </div>
      <div className="-mb-1 flex items-center justify-end gap-0.5">
        {p.profile_url ? (
          <Button asChild variant="ghost" size="icon-sm" aria-label={`Open ${p.name}'s profile`}>
            <a href={p.profile_url} target="_blank" rel="noopener noreferrer">
              <ExternalLink aria-hidden />
            </a>
          </Button>
        ) : null}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon-sm" aria-label={`Move ${p.name} to another stage`}>
              <ArrowRightLeft aria-hidden />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuLabel>Move to</DropdownMenuLabel>
            <DropdownMenuRadioGroup value={p.stage} onValueChange={(v) => onMove(v as ProspectStage)}>
              {PROSPECT_STAGES.map((s) => (
                <DropdownMenuRadioItem key={s.value} value={s.value}>
                  {s.label}
                </DropdownMenuRadioItem>
              ))}
            </DropdownMenuRadioGroup>
          </DropdownMenuContent>
        </DropdownMenu>
        <EditRecordButton kind="prospect" id={p.id} title={`Edit ${p.name}`} initial={prospectToInitial(p)} />
        <DeleteButton
          action={deleteProspect.bind(null, p.id)}
          itemLabel={p.name}
          description="This also deletes the prospect's follow-ups."
        />
      </div>
    </article>
  );
}
