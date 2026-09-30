"use client";

import { FormProvider } from "react-hook-form";
import { FormGrid, NumberField, SelectField, SwitchField, TextField, TextareaField } from "@/components/forms/fields";
import { useAppData } from "@/components/providers/app-data";
import { FormActions } from "@/components/shared/form-dialog";
import { Button } from "@/components/ui/button";
import { saveLearningSession } from "@/features/learning/actions";
import { useActionForm } from "@/hooks/use-action-form";
import { LEARNING_CATEGORIES } from "@/lib/constants";
import { toOptions } from "@/lib/options";
import { learningSessionSchema, type LearningSessionInput } from "@/lib/validation/schemas";

const QUICK_DURATIONS = [30, 60, 90, 120];

export function LearningForm({ id, initial, onDone }: { id?: string; initial?: Partial<LearningSessionInput>; onDone?: () => void }) {
  const { today, projects } = useAppData();
  const { form, onSubmit, pending } = useActionForm({
    schema: learningSessionSchema,
    action: (raw) => saveLearningSession(raw, id),
    defaultValues: {
      date: today,
      topic: "",
      category: "nextjs",
      duration: "60",
      resource: "",
      notes: "",
      projectId: "",
      completed: true,
      ...initial,
    },
    onSuccess: () => onDone?.(),
  });

  return (
    <FormProvider {...form}>
      <form onSubmit={onSubmit} className="grid gap-4" noValidate>
        <TextField name="topic" label="Topic" placeholder="e.g. Server Actions & caching" required autoFocus={!id} />
        <FormGrid>
          <SelectField name="category" label="Category" options={toOptions(LEARNING_CATEGORIES)} required />
          <TextField name="date" label="Date" type="date" required />
        </FormGrid>
        <div className="grid gap-2">
          <NumberField name="duration" label="Duration" suffix="min" integer required />
          <div className="flex flex-wrap gap-2" aria-label="Quick durations">
            {QUICK_DURATIONS.map((m) => (
              <Button
                key={m}
                type="button"
                variant="outline"
                size="sm"
                onClick={() => form.setValue("duration", String(m), { shouldValidate: true })}
              >
                {m >= 60 ? `${m / 60}h` : `${m}m`}
              </Button>
            ))}
          </div>
        </div>
        <FormGrid>
          <TextField name="resource" label="Resource" placeholder="Course, docs, book…" />
          <SelectField
            name="projectId"
            label="Related project"
            options={projects.map((p) => ({ value: p.id, label: p.name }))}
            allowEmpty
            placeholder="None"
          />
        </FormGrid>
        <TextareaField name="notes" label="Notes" placeholder="Key takeaways" rows={2} />
        <SwitchField name="completed" label="Session completed" description="Turn off if you plan to continue it." />
        <FormActions pending={pending} submitLabel={id ? "Save session" : "Log learning"} onCancel={onDone} />
      </form>
    </FormProvider>
  );
}
