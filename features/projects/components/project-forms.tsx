"use client";

import { FormProvider } from "react-hook-form";
import {
  FormGrid,
  NumberField,
  SelectField,
  SwitchField,
  TextField,
  TextareaField,
} from "@/components/forms/fields";
import { useAppData } from "@/components/providers/app-data";
import { EmptyState } from "@/components/shared/empty-state";
import { FormActions } from "@/components/shared/form-dialog";
import { saveProject, saveWorkSession } from "@/features/projects/actions";
import { useActionForm } from "@/hooks/use-action-form";
import { PROJECT_STATUSES } from "@/lib/constants";
import { toOptions } from "@/lib/options";
import {
  projectSchema,
  workSessionSchema,
  type ProjectInput,
  type WorkSessionInput,
} from "@/lib/validation/schemas";
import { Briefcase } from "lucide-react";

export function ProjectForm({ id, initial, onDone }: { id?: string; initial?: Partial<ProjectInput>; onDone?: () => void }) {
  const { form, onSubmit, pending } = useActionForm({
    schema: projectSchema,
    action: (raw) => saveProject(raw, id),
    defaultValues: { name: "", clientName: "", status: "active", description: "", ...initial },
    onSuccess: () => onDone?.(),
  });
  return (
    <FormProvider {...form}>
      <form onSubmit={onSubmit} className="grid gap-4" noValidate>
        <FormGrid>
          <TextField name="name" label="Project name" required autoFocus={!id} />
          <TextField name="clientName" label="Client" />
        </FormGrid>
        <SelectField name="status" label="Status" options={toOptions(PROJECT_STATUSES)} required />
        <TextareaField name="description" label="Description" rows={3} />
        <FormActions pending={pending} submitLabel={id ? "Save project" : "Create project"} onCancel={onDone} />
      </form>
    </FormProvider>
  );
}

export function WorkSessionForm({
  id,
  initial,
  onDone,
}: {
  id?: string;
  initial?: Partial<WorkSessionInput>;
  onDone?: () => void;
}) {
  const { today, projects, currency } = useAppData();
  const { form, onSubmit, pending } = useActionForm({
    schema: workSessionSchema,
    action: (raw) => saveWorkSession(raw, id),
    defaultValues: {
      projectId: projects[0]?.id ?? "",
      date: today,
      task: "",
      startTime: "",
      endTime: "",
      duration: "",
      billable: true,
      amountEarned: "",
      notes: "",
      ...initial,
    },
    onSuccess: () => onDone?.(),
  });

  if (projects.length === 0 && !id) {
    return (
      <EmptyState
        icon={Briefcase}
        title="No active projects"
        description="Create a project first on the Projects page, then log work sessions against it."
        compact
      />
    );
  }

  return (
    <FormProvider {...form}>
      <form onSubmit={onSubmit} className="grid gap-4" noValidate>
        <FormGrid>
          <SelectField
            name="projectId"
            label="Project"
            options={projects.map((p) => ({ value: p.id, label: p.name }))}
            required
          />
          <TextField name="date" label="Date" type="date" required />
        </FormGrid>
        <TextField name="task" label="Task" placeholder="What did you work on?" required />
        <div className="grid grid-cols-3 gap-3">
          <TextField name="startTime" label="Start" type="time" />
          <TextField name="endTime" label="End" type="time" />
          <NumberField name="duration" label="Minutes" integer />
        </div>
        <p className="-mt-2 text-xs text-muted-foreground">Enter start and end, or just the minutes.</p>
        <FormGrid>
          <NumberField name="amountEarned" label="Amount earned" suffix={currency} />
          <SwitchField name="billable" label="Billable" className="self-end" />
        </FormGrid>
        <TextareaField name="notes" label="Notes" rows={2} />
        <FormActions pending={pending} submitLabel={id ? "Save session" : "Log work"} onCancel={onDone} />
      </form>
    </FormProvider>
  );
}
