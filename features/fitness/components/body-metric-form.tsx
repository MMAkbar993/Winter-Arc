"use client";

import { FormProvider } from "react-hook-form";
import { FormGrid, NumberField, TextField, TextareaField } from "@/components/forms/fields";
import { useAppData } from "@/components/providers/app-data";
import { FormActions } from "@/components/shared/form-dialog";
import { saveBodyMetric } from "@/features/fitness/actions";
import { useActionForm } from "@/hooks/use-action-form";
import { bodyMetricSchema, type BodyMetricInput } from "@/lib/validation/schemas";

export function BodyMetricForm({ id, initial, onDone }: { id?: string; initial?: Partial<BodyMetricInput>; onDone?: () => void }) {
  const { today } = useAppData();
  const { form, onSubmit, pending } = useActionForm({
    schema: bodyMetricSchema,
    action: (raw) => saveBodyMetric(raw, id),
    defaultValues: { date: today, bodyWeight: "", waist: "", chest: "", arms: "", photoUrl: "", notes: "", ...initial },
    onSuccess: () => onDone?.(),
  });

  return (
    <FormProvider {...form}>
      <form onSubmit={onSubmit} className="grid gap-4" noValidate>
        <FormGrid>
          <TextField name="date" label="Date" type="date" required />
          <NumberField name="bodyWeight" label="Body weight" suffix="kg" />
          <NumberField name="waist" label="Waist" suffix="cm" />
          <NumberField name="chest" label="Chest" suffix="cm" />
          <NumberField name="arms" label="Arms" suffix="cm" />
        </FormGrid>
        <TextField
          name="photoUrl"
          label="Progress photo URL"
          type="url"
          placeholder="https://…"
          description="Private — only visible to you. Paste a link from your own storage."
        />
        <TextareaField name="notes" label="Notes" rows={2} />
        <FormActions pending={pending} onCancel={onDone} />
      </form>
    </FormProvider>
  );
}
