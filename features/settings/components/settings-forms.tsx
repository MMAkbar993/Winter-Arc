"use client";

import { useTheme } from "next-themes";
import { FormProvider } from "react-hook-form";
import { FormGrid, NativeSelectField, NumberField, SelectField, TextField } from "@/components/forms/fields";
import { FormActions } from "@/components/shared/form-dialog";
import { updatePassword } from "@/features/auth/actions";
import { updateChallenge, updatePreferences, updateProfile, updateTargets } from "@/features/settings/actions";
import { useActionForm } from "@/hooks/use-action-form";
import { CURRENCIES, THEMES } from "@/lib/constants";
import { toOptions } from "@/lib/options";
import {
  challengeSettingsSchema,
  preferencesSettingsSchema,
  profileSettingsSchema,
  resetPasswordSchema,
  targetsSettingsSchema,
} from "@/lib/validation/schemas";
import type { z } from "zod";

export function ProfileForm({ name }: { name: string }) {
  const { form, onSubmit, pending } = useActionForm({
    schema: profileSettingsSchema,
    action: updateProfile,
    defaultValues: { name },
  });
  return (
    <FormProvider {...form}>
      <form onSubmit={onSubmit} className="grid gap-4" noValidate>
        <TextField name="name" label="Name" autoComplete="name" required />
        <FormActions pending={pending} />
      </form>
    </FormProvider>
  );
}

export function ChallengeForm({ initial }: { initial: z.input<typeof challengeSettingsSchema> }) {
  const { form, onSubmit, pending } = useActionForm({
    schema: challengeSettingsSchema,
    action: updateChallenge,
    defaultValues: initial,
  });
  return (
    <FormProvider {...form}>
      <form onSubmit={onSubmit} className="grid gap-4" noValidate>
        <TextField name="challengeName" label="Challenge name" required />
        <FormGrid>
          <TextField name="startDate" label="Start date" type="date" required />
          <TextField name="endDate" label="End date" type="date" required />
        </FormGrid>
        <FormActions pending={pending} />
      </form>
    </FormProvider>
  );
}

export function PreferencesForm({
  initial,
  timezones,
}: {
  initial: z.input<typeof preferencesSettingsSchema>;
  timezones: { value: string; label: string }[];
}) {
  const { setTheme } = useTheme();
  const { form, onSubmit, pending } = useActionForm({
    schema: preferencesSettingsSchema,
    action: updatePreferences,
    defaultValues: initial,
    onSuccess: () => setTheme(form.getValues("theme")),
  });
  return (
    <FormProvider {...form}>
      <form onSubmit={onSubmit} className="grid gap-4" noValidate>
        <NativeSelectField
          name="timezone"
          label="Timezone"
          options={timezones}
          description="Your day — and your streak — rolls over at midnight here."
          required
        />
        <FormGrid>
          <SelectField name="currency" label="Currency" options={CURRENCIES.map((c) => ({ value: c, label: c }))} required />
          <SelectField name="theme" label="Theme" options={toOptions(THEMES)} required />
        </FormGrid>
        <NumberField
          name="successThreshold"
          label="Successful-day threshold"
          suffix="/ 7"
          integer
          description="A day counts toward your streak when at least this many habits are done."
          required
        />
        <FormActions pending={pending} />
      </form>
    </FormProvider>
  );
}

export function TargetsForm({ initial, currency }: { initial: z.input<typeof targetsSettingsSchema>; currency: string }) {
  const { form, onSubmit, pending } = useActionForm({
    schema: targetsSettingsSchema,
    action: updateTargets,
    defaultValues: initial,
  });
  return (
    <FormProvider {...form}>
      <form onSubmit={onSubmit} className="grid gap-4" noValidate>
        <FormGrid>
          <NumberField name="dailyLearningTargetMinutes" label="Learning target" suffix="min / day" integer required />
          <NumberField name="weeklyWorkoutTarget" label="Workout target" suffix="/ week" integer required />
          <NumberField name="dailyOutreachTarget" label="Outreach target" suffix="/ day" integer required />
          <div className="hidden sm:block" />
          <NumberField name="monthlyIncomeGoal" label="Monthly income goal" suffix={currency} required />
          <NumberField name="monthlySavingsGoal" label="Monthly savings goal" suffix={currency} required />
        </FormGrid>
        <FormActions pending={pending} />
      </form>
    </FormProvider>
  );
}

export function ChangePasswordForm() {
  const { form, onSubmit, pending } = useActionForm({
    schema: resetPasswordSchema,
    action: updatePassword,
    defaultValues: { password: "", confirmPassword: "" },
    resetOnSuccess: true,
  });
  return (
    <FormProvider {...form}>
      <form onSubmit={onSubmit} className="grid gap-4" noValidate>
        <FormGrid>
          <TextField name="password" label="New password" type="password" autoComplete="new-password" required />
          <TextField name="confirmPassword" label="Confirm password" type="password" autoComplete="new-password" required />
        </FormGrid>
        <FormActions pending={pending} submitLabel="Change password" />
      </form>
    </FormProvider>
  );
}
