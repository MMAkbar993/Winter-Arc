"use client";

import { FormProvider } from "react-hook-form";
import { FormGrid, NumberField, SelectField, TextField, TextareaField } from "@/components/forms/fields";
import { useAppData } from "@/components/providers/app-data";
import { FormActions } from "@/components/shared/form-dialog";
import { saveProspect } from "@/features/clients/actions";
import { useActionForm } from "@/hooks/use-action-form";
import { PROSPECT_SOURCES, PROSPECT_STAGES } from "@/lib/constants";
import { toOptions } from "@/lib/options";
import { prospectSchema, type ProspectInput } from "@/lib/validation/schemas";

export function ProspectForm({ id, initial, onDone }: { id?: string; initial?: Partial<ProspectInput>; onDone?: () => void }) {
  const { today, currency } = useAppData();
  const { form, onSubmit, pending } = useActionForm({
    schema: prospectSchema,
    action: (raw) => saveProspect(raw, id),
    defaultValues: {
      name: "",
      company: "",
      source: "linkedin",
      profileUrl: "",
      contactMethod: "",
      serviceNeeded: "",
      estimatedValue: "",
      stage: "contacted",
      contactedOn: today,
      nextFollowUpOn: "",
      followUpNotes: "",
      notes: "",
      ...initial,
    },
    onSuccess: () => onDone?.(),
  });

  return (
    <FormProvider {...form}>
      <form onSubmit={onSubmit} className="grid gap-4" noValidate>
        <FormGrid>
          <TextField name="name" label="Prospect name" required autoFocus={!id} />
          <TextField name="company" label="Company" />
          <SelectField name="source" label="Source" options={toOptions(PROSPECT_SOURCES)} required />
          <SelectField name="stage" label="Stage" options={toOptions(PROSPECT_STAGES)} required />
          <TextField name="serviceNeeded" label="Service needed" placeholder="e.g. Next.js landing page" />
          <NumberField name="estimatedValue" label="Estimated value" suffix={currency} />
          <TextField name="profileUrl" label="Profile / website URL" type="url" placeholder="https://…" />
          <TextField name="contactMethod" label="Contact method" placeholder="DM, email, call…" />
          <TextField name="contactedOn" label="Date contacted" type="date" />
          <TextField name="nextFollowUpOn" label="Next follow-up" type="date" />
        </FormGrid>
        <TextareaField name="followUpNotes" label="Follow-up notes" rows={2} placeholder="What to say next time" />
        <TextareaField name="notes" label="Notes" rows={2} />
        <FormActions pending={pending} submitLabel={id ? "Save prospect" : "Add prospect"} onCancel={onDone} />
      </form>
    </FormProvider>
  );
}
