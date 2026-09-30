"use client";

import dynamic from "next/dynamic";
import type { ComponentType } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import type { QuickAddKind } from "@/features/quick-add/quick-add-config";

function FormSkeleton() {
  return (
    <div className="grid gap-4" aria-busy>
      <Skeleton className="h-10" />
      <div className="grid grid-cols-2 gap-4">
        <Skeleton className="h-10" />
        <Skeleton className="h-10" />
      </div>
      <Skeleton className="h-20" />
      <Skeleton className="ml-auto h-10 w-28" />
    </div>
  );
}

/**
 * Props shared by every record form. `initial` holds raw form values (strings)
 * for editing; each form narrows it to its own input type.
 */
export interface RecordFormProps {
  id?: string;
  initial?: Record<string, unknown>;
  onDone?: () => void;
}
type FormComponent = ComponentType<RecordFormProps>;


/** Each form is code-split and only downloaded the first time it opens. */
export const FORMS: Record<QuickAddKind, FormComponent> = {
  workout: dynamic(() => import("@/features/fitness/components/workout-form").then((m) => m.WorkoutForm as FormComponent), { loading: FormSkeleton }),
  body: dynamic(() => import("@/features/fitness/components/body-metric-form").then((m) => m.BodyMetricForm as FormComponent), { loading: FormSkeleton }),
  learning: dynamic(() => import("@/features/learning/components/learning-form").then((m) => m.LearningForm as FormComponent), { loading: FormSkeleton }),
  outreach: dynamic(() => import("@/features/clients/components/outreach-form").then((m) => m.OutreachForm as FormComponent), { loading: FormSkeleton }),
  prospect: dynamic(() => import("@/features/clients/components/prospect-form").then((m) => m.ProspectForm as FormComponent), { loading: FormSkeleton }),
  work: dynamic(() => import("@/features/projects/components/project-forms").then((m) => m.WorkSessionForm as FormComponent), { loading: FormSkeleton }),
  project: dynamic(() => import("@/features/projects/components/project-forms").then((m) => m.ProjectForm as FormComponent), { loading: FormSkeleton }),
  content: dynamic(() => import("@/features/content/components/content-form").then((m) => m.ContentForm as FormComponent), { loading: FormSkeleton }),
  income: dynamic(() => import("@/features/money/components/money-forms").then((m) => m.IncomeForm as FormComponent), { loading: FormSkeleton }),
  expense: dynamic(() => import("@/features/money/components/money-forms").then((m) => m.ExpenseForm as FormComponent), { loading: FormSkeleton }),
  savings: dynamic(() => import("@/features/money/components/money-forms").then((m) => m.SavingsForm as FormComponent), { loading: FormSkeleton }),
  journal: dynamic(() => import("@/features/journal/components/journal-form").then((m) => m.JournalForm as FormComponent), { loading: FormSkeleton }),
  note: dynamic(() => import("@/features/habits/components/daily-note-form").then((m) => m.DailyNoteForm as FormComponent), { loading: FormSkeleton }),
};
