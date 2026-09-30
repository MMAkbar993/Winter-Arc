"use client";

import { FormProvider, useFieldArray, useFormContext } from "react-hook-form";
import { Plus, Trash2 } from "lucide-react";
import { FormGrid, NumberField, SelectField, TextField, TextareaField } from "@/components/forms/fields";
import { useAppData } from "@/components/providers/app-data";
import { FormActions } from "@/components/shared/form-dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { saveWorkout } from "@/features/fitness/actions";
import { useActionForm } from "@/hooks/use-action-form";
import { COMMON_EXERCISES, WORKOUT_CATEGORIES } from "@/lib/constants";
import { toOptions } from "@/lib/options";
import { workoutSchema, type WorkoutInput } from "@/lib/validation/schemas";

export function WorkoutForm({
  id,
  initial,
  onDone,
}: {
  id?: string;
  initial?: Partial<WorkoutInput>;
  onDone?: () => void;
}) {
  const { today } = useAppData();
  const { form, onSubmit, pending } = useActionForm({
    schema: workoutSchema,
    action: (raw) => saveWorkout(raw, id),
    defaultValues: {
      date: today,
      category: "upper_body",
      customCategory: "",
      duration: "45",
      notes: "",
      exercises: [],
      ...initial,
    },
    onSuccess: () => onDone?.(),
  });
  const category = form.watch("category");

  return (
    <FormProvider {...form}>
      <form onSubmit={onSubmit} className="grid gap-4" noValidate>
        <FormGrid>
          <TextField name="date" label="Date" type="date" required />
          <NumberField name="duration" label="Duration" suffix="min" integer required />
          <SelectField name="category" label="Workout" options={toOptions(WORKOUT_CATEGORIES)} required />
          {category === "custom" ? <TextField name="customCategory" label="Custom workout name" required /> : null}
        </FormGrid>
        <ExerciseList />
        <TextareaField name="notes" label="Notes" placeholder="How did it feel? PRs?" rows={2} />
        <FormActions pending={pending} submitLabel={id ? "Save workout" : "Log workout"} onCancel={onDone} />
      </form>
    </FormProvider>
  );
}

function ExerciseList() {
  const { control, register, formState } = useFormContext<WorkoutInput>();
  const { fields, append, remove } = useFieldArray({ control, name: "exercises" });
  const errors = formState.errors.exercises;

  return (
    <fieldset className="grid gap-2">
      <legend className="mb-1 flex w-full items-center justify-between text-sm font-medium">
        Exercises <span className="text-xs font-normal text-muted-foreground">optional</span>
      </legend>
      <datalist id="exercise-suggestions">
        {COMMON_EXERCISES.map((e) => (
          <option key={e} value={e} />
        ))}
      </datalist>
      {fields.length > 0 ? (
        <div className="hidden grid-cols-[1fr_4rem_4rem_5rem_2rem] gap-2 px-1 text-[11px] text-muted-foreground uppercase sm:grid">
          <span>Exercise</span>
          <span>Sets</span>
          <span>Reps</span>
          <span>Kg</span>
          <span />
        </div>
      ) : null}
      {fields.map((field, index) => {
        const rowError = errors?.[index];
        const message = rowError?.name?.message ?? rowError?.sets?.message ?? rowError?.reps?.message ?? rowError?.weight?.message;
        return (
          <div key={field.id} className="grid gap-1">
            <div className="grid grid-cols-[1fr_2rem] gap-2 sm:grid-cols-[1fr_4rem_4rem_5rem_2rem]">
              <Input
                aria-label={`Exercise ${index + 1} name`}
                list="exercise-suggestions"
                placeholder="Exercise"
                className="h-10 md:h-9"
                aria-invalid={Boolean(rowError?.name)}
                {...register(`exercises.${index}.name`)}
              />
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="sm:order-last"
                aria-label={`Remove exercise ${index + 1}`}
                onClick={() => remove(index)}
              >
                <Trash2 aria-hidden />
              </Button>
              <div className="col-span-2 grid grid-cols-3 gap-2 sm:col-span-3 sm:contents">
                <Input aria-label="Sets" placeholder="Sets" inputMode="numeric" className="h-10 tabular md:h-9" {...register(`exercises.${index}.sets`)} />
                <Input aria-label="Reps" placeholder="Reps" inputMode="numeric" className="h-10 tabular md:h-9" {...register(`exercises.${index}.reps`)} />
                <Input aria-label="Weight in kg" placeholder="Kg" inputMode="decimal" className="h-10 tabular md:h-9" {...register(`exercises.${index}.weight`)} />
              </div>
            </div>
            {message ? (
              <p role="alert" className="text-xs text-destructive">
                {message}
              </p>
            ) : null}
          </div>
        );
      })}
      <Button
        type="button"
        variant="outline"
        className="h-10 justify-center border-dashed"
        onClick={() => append({ name: "", sets: "", reps: "", weight: "" })}
      >
        <Plus aria-hidden /> Add exercise
      </Button>
    </fieldset>
  );
}
