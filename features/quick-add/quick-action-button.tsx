"use client";

import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { QUICK_ADD, type QuickAddKind } from "@/features/quick-add/quick-add-config";
import { useQuickAdd } from "@/features/quick-add/quick-add-provider";
import { cn } from "@/lib/utils";

/** Large tile used in quick-action grids. */
export function QuickActionButton({ kind, className }: { kind: QuickAddKind; className?: string }) {
  const { open } = useQuickAdd();
  const meta = QUICK_ADD[kind];
  const Icon = meta.icon;
  return (
    <button
      type="button"
      onClick={() => open(kind)}
      className={cn(
        "flex min-h-16 items-center gap-3 rounded-xl border bg-card px-3 py-3 text-left text-sm font-medium transition-colors hover:border-foreground/20 hover:bg-accent/50",
        "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring",
        className,
      )}
    >
      <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-muted">
        <Icon aria-hidden className="size-4 text-brand" />
      </span>
      <span>
        <span aria-hidden className="text-muted-foreground">+ </span>
        {meta.label}
      </span>
    </button>
  );
}

export function QuickActionGrid({ kinds, className }: { kinds: readonly QuickAddKind[]; className?: string }) {
  return (
    <div className={cn("grid grid-cols-2 gap-2 sm:grid-cols-4", className)}>
      {kinds.map((k) => (
        <QuickActionButton key={k} kind={k} />
      ))}
    </div>
  );
}

/** Compact button for page headers, e.g. "+ Log workout". */
export function AddButton({
  kind,
  label,
  variant = "default",
}: {
  kind: QuickAddKind;
  label?: string;
  variant?: "default" | "outline" | "secondary";
}) {
  const { open } = useQuickAdd();
  return (
    <Button onClick={() => open(kind)} variant={variant} size="lg">
      <Plus aria-hidden />
      {label ?? QUICK_ADD[kind].label}
    </Button>
  );
}
