"use client";

import { FormProvider } from "react-hook-form";
import { TextField, TextareaField } from "@/components/forms/fields";
import { useAppData } from "@/components/providers/app-data";
import { FormActions } from "@/components/shared/form-dialog";
import { saveDailyNote } from "@/features/habits/actions";
import { useActionForm } from "@/hooks/use-action-form";
import { dailyNoteSchema } from "@/lib/validation/schemas";

export function DailyNoteForm({ initialNote, date, onDone }: { initialNote?: string; date?: string; onDone?: () => void }) {
  const { today } = useAppData();
  const { form, onSubmit, pending } = useActionForm({
    schema: dailyNoteSchema,
    action: saveDailyNote,
    defaultValues: { date: date ?? today, notes: initialNote ?? "" },
    onSuccess: () => onDone?.(),
  });
  return (
    <FormProvider {...form}>
      <form onSubmit={onSubmit} className="grid gap-4" noValidate>
        <TextField name="date" label="Date" type="date" required />
        <TextareaField name="notes" label="Note" rows={5} placeholder="Anything worth remembering about today" />
        <FormActions pending={pending} submitLabel="Save note" onCancel={onDone} />
      </form>
    </FormProvider>
  );
}
