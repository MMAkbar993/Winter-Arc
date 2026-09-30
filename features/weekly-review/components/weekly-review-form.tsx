"use client";

import { FormProvider } from "react-hook-form";
import { TextareaField } from "@/components/forms/fields";
import { FormActions } from "@/components/shared/form-dialog";
import { saveWeeklyReview } from "@/features/weekly-review/actions";
import { useActionForm } from "@/hooks/use-action-form";
import { WEEKLY_REVIEW_QUESTIONS, type WeeklyReviewQuestionKey } from "@/lib/constants";
import { weeklyReviewSchema, type WeeklyReviewInput } from "@/lib/validation/schemas";

export function WeeklyReviewForm({
  initial,
  hints,
}: {
  initial: WeeklyReviewInput;
  /** Placeholders derived from the week's stats, e.g. "42 outreach actions". */
  hints: Partial<Record<WeeklyReviewQuestionKey, string>>;
}) {
  const { form, onSubmit, pending } = useActionForm({
    schema: weeklyReviewSchema,
    action: saveWeeklyReview,
    defaultValues: initial,
  });

  return (
    <FormProvider {...form}>
      <form onSubmit={onSubmit} className="grid gap-5" noValidate>
        {WEEKLY_REVIEW_QUESTIONS.map((q, i) => (
          <TextareaField
            key={q.key}
            name={q.key}
            label={`${i + 1}. ${q.label}`}
            placeholder={hints[q.key]}
            rows={2}
          />
        ))}
        <TextareaField name="reflection" label="Reflection" rows={5} placeholder="Anything else on your mind about this week?" />
        <FormActions pending={pending} submitLabel="Save review" />
      </form>
    </FormProvider>
  );
}
