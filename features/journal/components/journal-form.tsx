"use client";

import { FormProvider } from "react-hook-form";
import { ScaleField, TextField, TextareaField } from "@/components/forms/fields";
import { useAppData } from "@/components/providers/app-data";
import { FormActions } from "@/components/shared/form-dialog";
import { saveJournalEntry } from "@/features/journal/actions";
import { useActionForm } from "@/hooks/use-action-form";
import { ENERGY_LABELS, MOOD_LABELS } from "@/lib/constants";
import { journalSchema, type JournalInput } from "@/lib/validation/schemas";

export function JournalForm({ initial, onDone }: { initial?: Partial<JournalInput>; onDone?: () => void }) {
  const { today } = useAppData();
  const { form, onSubmit, pending } = useActionForm({
    schema: journalSchema,
    action: saveJournalEntry,
    defaultValues: {
      date: today,
      mood: "",
      energy: "",
      notes: "",
      gratitude: "",
      biggestWin: "",
      biggestChallenge: "",
      ...initial,
    },
    onSuccess: () => onDone?.(),
  });

  return (
    <FormProvider {...form}>
      <form onSubmit={onSubmit} className="grid gap-4" noValidate>
        <TextField name="date" label="Date" type="date" required />
        <ScaleField name="mood" label="Mood" labels={MOOD_LABELS} />
        <ScaleField name="energy" label="Energy" labels={ENERGY_LABELS} />
        <TextField name="biggestWin" label="Biggest win" />
        <TextField name="biggestChallenge" label="Biggest challenge" />
        <TextField name="gratitude" label="Grateful for" />
        <TextareaField name="notes" label="Notes" rows={4} placeholder="How did today go?" />
        <FormActions pending={pending} submitLabel="Save entry" onCancel={onDone} />
      </form>
    </FormProvider>
  );
}
