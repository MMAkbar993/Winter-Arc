"use client";

import { FormProvider } from "react-hook-form";
import { FormGrid, NumberField, SelectField, TextField, TextareaField } from "@/components/forms/fields";
import { useAppData } from "@/components/providers/app-data";
import { FormActions } from "@/components/shared/form-dialog";
import { Button } from "@/components/ui/button";
import { logOutreach } from "@/features/clients/actions";
import { useActionForm } from "@/hooks/use-action-form";
import { PROSPECT_SOURCES } from "@/lib/constants";
import { toOptions } from "@/lib/options";
import { outreachLogSchema } from "@/lib/validation/schemas";

/** Bulk outreach (e.g. "8 Fiverr buyer requests") without creating prospects. */
export function OutreachForm({ onDone }: { onDone?: () => void }) {
  const { today, targets } = useAppData();
  const { form, onSubmit, pending } = useActionForm({
    schema: outreachLogSchema,
    action: logOutreach,
    defaultValues: { date: today, source: "fiverr", count: "5", notes: "" },
    onSuccess: () => onDone?.(),
  });

  return (
    <FormProvider {...form}>
      <form onSubmit={onSubmit} className="grid gap-4" noValidate>
        <p className="text-sm text-muted-foreground">
          Log bulk outreach actions — messages, buyer requests, comments. Daily target: {targets.dailyOutreach}. For a
          specific lead you want to track, add a prospect instead.
        </p>
        <FormGrid>
          <SelectField name="source" label="Platform" options={toOptions(PROSPECT_SOURCES)} required />
          <TextField name="date" label="Date" type="date" required />
        </FormGrid>
        <div className="grid gap-2">
          <NumberField name="count" label="Actions" integer required />
          <div className="flex flex-wrap gap-2">
            {[1, 5, 10, 15].map((n) => (
              <Button key={n} type="button" variant="outline" size="sm" onClick={() => form.setValue("count", String(n))}>
                {n}
              </Button>
            ))}
          </div>
        </div>
        <TextareaField name="notes" label="Notes" rows={2} />
        <FormActions pending={pending} submitLabel="Log outreach" onCancel={onDone} />
      </form>
    </FormProvider>
  );
}
