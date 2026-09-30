"use client";

import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from "react";
import { FormDialog } from "@/components/shared/form-dialog";
import { FORMS } from "@/features/quick-add/forms";
import { QUICK_ADD, type QuickAddKind } from "@/features/quick-add/quick-add-config";

interface QuickAddContextValue {
  open: (kind: QuickAddKind) => void;
}

const QuickAddContext = createContext<QuickAddContextValue | null>(null);

export function QuickAddProvider({ children }: { children: ReactNode }) {
  const [kind, setKind] = useState<QuickAddKind | null>(null);
  const [lastKind, setLastKind] = useState<QuickAddKind | null>(null);

  const open = useCallback((k: QuickAddKind) => {
    setKind(k);
    setLastKind(k);
  }, []);
  const close = useCallback(() => setKind(null), []);
  const value = useMemo(() => ({ open }), [open]);

  // Keep the last form mounted while the dialog animates closed.
  const shown = kind ?? lastKind;
  const Form = shown ? FORMS[shown] : null;
  const meta = shown ? QUICK_ADD[shown] : null;

  return (
    <QuickAddContext.Provider value={value}>
      {children}
      <FormDialog
        open={kind !== null}
        onOpenChange={(o) => (o ? null : close())}
        title={meta?.title ?? ""}
        description={meta?.description}
        wide={shown === "workout" || shown === "prospect"}
      >
        {Form ? <Form key={shown} onDone={close} /> : null}
      </FormDialog>
    </QuickAddContext.Provider>
  );
}

export function useQuickAdd(): QuickAddContextValue {
  const ctx = useContext(QuickAddContext);
  if (!ctx) throw new Error("useQuickAdd must be used inside <QuickAddProvider>");
  return ctx;
}
