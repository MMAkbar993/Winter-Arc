"use client";

import { FormProvider } from "react-hook-form";
import { FormGrid, SelectField, TextField, TextareaField } from "@/components/forms/fields";
import { useAppData } from "@/components/providers/app-data";
import { FormActions } from "@/components/shared/form-dialog";
import { saveContentItem } from "@/features/content/actions";
import { useActionForm } from "@/hooks/use-action-form";
import { CONTENT_PLATFORMS, CONTENT_STATUSES, CONTENT_TYPES } from "@/lib/constants";
import { toOptions } from "@/lib/options";
import { contentItemSchema, type ContentItemInput } from "@/lib/validation/schemas";

export function ContentForm({ id, initial, onDone }: { id?: string; initial?: Partial<ContentItemInput>; onDone?: () => void }) {
  const { today } = useAppData();
  const { form, onSubmit, pending } = useActionForm({
    schema: contentItemSchema,
    action: (raw) => saveContentItem(raw, id),
    defaultValues: {
      platform: "x",
      date: today,
      contentType: "build_in_public",
      title: "",
      url: "",
      status: "published",
      notes: "",
      ...initial,
    },
    onSuccess: () => onDone?.(),
  });

  return (
    <FormProvider {...form}>
      <form onSubmit={onSubmit} className="grid gap-4" noValidate>
        <TextField name="title" label="Title / hook" placeholder="Day 12 of building in public…" required autoFocus={!id} />
        <FormGrid>
          <SelectField name="platform" label="Platform" options={toOptions(CONTENT_PLATFORMS)} required />
          <SelectField name="contentType" label="Type" options={toOptions(CONTENT_TYPES)} required />
          <SelectField name="status" label="Status" options={toOptions(CONTENT_STATUSES)} required />
          <TextField name="date" label="Date" type="date" required />
        </FormGrid>
        <TextField name="url" label="Content URL" type="url" placeholder="https://…" />
        <TextareaField name="notes" label="Notes" rows={2} />
        <FormActions pending={pending} submitLabel={id ? "Save" : "Add content"} onCancel={onDone} />
      </form>
    </FormProvider>
  );
}
