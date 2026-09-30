"use client";

import { useState } from "react";
import { Pencil } from "lucide-react";
import { FormDialog } from "@/components/shared/form-dialog";
import { Button } from "@/components/ui/button";
import { FORMS } from "@/features/quick-add/forms";
import type { QuickAddKind } from "@/features/quick-add/quick-add-config";

/**
 * Opens the record's form pre-filled for editing. `initial` must contain raw
 * form values (strings/booleans), mapped from the row by the server page.
 */
export function EditRecordButton({
  kind,
  id,
  initial,
  title,
  label = "Edit",
  showLabel = false,
}: {
  kind: QuickAddKind;
  id?: string;
  initial: Record<string, unknown>;
  title: string;
  label?: string;
  showLabel?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const Form = FORMS[kind];
  return (
    <FormDialog
      open={open}
      onOpenChange={setOpen}
      title={title}
      wide={kind === "workout" || kind === "prospect"}
      trigger={
        <Button variant="ghost" size={showLabel ? "sm" : "icon-sm"} aria-label={showLabel ? undefined : label}>
          <Pencil aria-hidden />
          {showLabel ? label : null}
        </Button>
      }
    >
      {open ? <Form id={id} initial={initial} onDone={() => setOpen(false)} /> : null}
    </FormDialog>
  );
}
