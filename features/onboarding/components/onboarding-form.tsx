"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { FormProvider, type Path } from "react-hook-form";
import { ArrowLeft, ArrowRight, Loader2 } from "lucide-react";
import { FormGrid, NativeSelectField, NumberField, TextField } from "@/components/forms/fields";
import { Button } from "@/components/ui/button";
import { completeOnboarding } from "@/features/onboarding/actions";
import { useActionForm } from "@/hooks/use-action-form";
import { cn } from "@/lib/utils";
import { onboardingSchema, type OnboardingInput } from "@/lib/validation/schemas";

const STEPS: { title: string; description: string; fields: Path<OnboardingInput>[] }[] = [
  { title: "About you", description: "How should Winter Arc OS greet you?", fields: ["name", "timezone"] },
  {
    title: "Your challenge",
    description: "Defaults to Winter Arc 2026 — October 1 to December 31.",
    fields: ["challengeName", "startDate", "endDate"],
  },
  {
    title: "Daily targets",
    description: "You can change all of these later in Settings.",
    fields: ["dailyLearningTargetMinutes", "weeklyWorkoutTarget", "dailyOutreachTarget", "monthlyIncomeGoal", "monthlySavingsGoal"],
  },
];

export function OnboardingForm({
  defaults,
  timezones,
  currency,
}: {
  defaults: OnboardingInput;
  timezones: { value: string; label: string }[];
  currency: string;
}) {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const { form, onSubmit, pending } = useActionForm({
    schema: onboardingSchema,
    action: completeOnboarding,
    defaultValues: defaults,
    successMessage: "Your Winter Arc is set. Let's go.",
    onSuccess: (data) => {
      router.replace(data.redirectTo);
      router.refresh();
    },
  });

  const current = STEPS[step] ?? STEPS[0]!;
  const isLast = step === STEPS.length - 1;

  const next = async () => {
    const valid = await form.trigger(current.fields, { shouldFocus: true });
    if (valid) setStep((s) => Math.min(s + 1, STEPS.length - 1));
  };

  const deviceTimezone = typeof Intl !== "undefined" ? Intl.DateTimeFormat().resolvedOptions().timeZone : null;

  return (
    <FormProvider {...form}>
      <form
        onSubmit={(e) => {
          if (!isLast) {
            e.preventDefault();
            void next();
            return;
          }
          void onSubmit(e);
        }}
        className="grid gap-6"
        noValidate
      >
        <ol className="flex gap-2" aria-label="Onboarding progress">
          {STEPS.map((s, i) => (
            <li key={s.title} className="flex-1">
              <div className={cn("h-1 rounded-full", i <= step ? "bg-brand" : "bg-muted")} />
              <span className="sr-only">
                Step {i + 1}: {s.title} {i < step ? "(done)" : i === step ? "(current)" : ""}
              </span>
            </li>
          ))}
        </ol>

        <div className="space-y-1">
          <p className="text-xs text-muted-foreground">
            Step {step + 1} of {STEPS.length}
          </p>
          <h2 className="text-xl font-semibold tracking-tight">{current.title}</h2>
          <p className="text-sm text-muted-foreground">{current.description}</p>
        </div>

        <div className={cn("grid gap-4", step !== 0 && "hidden")}>
          <TextField name="name" label="Your name" autoComplete="given-name" required autoFocus />
          <NativeSelectField
            name="timezone"
            label="Timezone"
            options={timezones}
            description="Your day starts and ends at midnight in this timezone."
            required
          />
          {deviceTimezone && deviceTimezone !== form.watch("timezone") ? (
            <Button
              type="button"
              variant="link"
              className="h-auto justify-start p-0 text-xs"
              onClick={() => form.setValue("timezone", deviceTimezone, { shouldValidate: true })}
            >
              Use this device&apos;s timezone ({deviceTimezone})
            </Button>
          ) : null}
        </div>

        <div className={cn("grid gap-4", step !== 1 && "hidden")}>
          <TextField name="challengeName" label="Challenge name" required />
          <FormGrid>
            <TextField name="startDate" label="Start date" type="date" required />
            <TextField name="endDate" label="End date" type="date" required />
          </FormGrid>
        </div>

        <div className={cn("grid gap-4", step !== 2 && "hidden")}>
          <FormGrid>
            <NumberField name="dailyLearningTargetMinutes" label="Daily learning" suffix="min" integer required />
            <NumberField name="weeklyWorkoutTarget" label="Workouts per week" suffix="/ week" integer required />
            <NumberField name="dailyOutreachTarget" label="Outreach per day" suffix="actions" integer required />
            <div className="hidden sm:block" />
            <NumberField name="monthlyIncomeGoal" label="Monthly income goal" suffix={currency} required />
            <NumberField name="monthlySavingsGoal" label="Monthly savings goal" suffix={currency} required />
          </FormGrid>
        </div>

        <div className="flex items-center justify-between gap-3">
          <Button
            type="button"
            variant="ghost"
            size="lg"
            onClick={() => setStep((s) => Math.max(s - 1, 0))}
            disabled={step === 0 || pending}
          >
            <ArrowLeft aria-hidden /> Back
          </Button>
          <Button type="submit" size="lg" className="h-11 min-w-36" disabled={pending}>
            {pending ? <Loader2 className="animate-spin" aria-hidden /> : null}
            {isLast ? "Start Winter Arc" : "Continue"}
            {!isLast ? <ArrowRight aria-hidden /> : null}
          </Button>
        </div>
      </form>
    </FormProvider>
  );
}
