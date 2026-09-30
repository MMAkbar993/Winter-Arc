"use client";

import { FormProvider } from "react-hook-form";
import { FormGrid, NumberField, SelectField, TextField, TextareaField } from "@/components/forms/fields";
import { useAppData } from "@/components/providers/app-data";
import { FormActions } from "@/components/shared/form-dialog";
import { saveExpense, saveIncome, saveSavings } from "@/features/money/actions";
import { useActionForm } from "@/hooks/use-action-form";
import { EXPENSE_CATEGORIES, INCOME_CATEGORIES, SAVINGS_KINDS } from "@/lib/constants";
import { toOptions } from "@/lib/options";
import {
  expenseSchema,
  incomeSchema,
  savingsSchema,
  type ExpenseInput,
  type IncomeInput,
  type SavingsInput,
} from "@/lib/validation/schemas";

interface FormProps<T> {
  id?: string;
  initial?: Partial<T>;
  onDone?: () => void;
}

export function IncomeForm({ id, initial, onDone }: FormProps<IncomeInput>) {
  const { today, currency, projects } = useAppData();
  const { form, onSubmit, pending } = useActionForm({
    schema: incomeSchema,
    action: (raw) => saveIncome(raw, id),
    defaultValues: { date: today, amount: "", source: "", client: "", projectId: "", category: "fiverr", notes: "", ...initial },
    onSuccess: () => onDone?.(),
  });
  return (
    <FormProvider {...form}>
      <form onSubmit={onSubmit} className="grid gap-4" noValidate>
        <FormGrid>
          <NumberField name="amount" label="Amount" suffix={currency} required />
          <TextField name="date" label="Date" type="date" required />
          <SelectField name="category" label="Category" options={toOptions(INCOME_CATEGORIES)} required />
          <TextField name="source" label="Source" placeholder="e.g. Logo gig" />
          <TextField name="client" label="Client" />
          <SelectField
            name="projectId"
            label="Project"
            options={projects.map((p) => ({ value: p.id, label: p.name }))}
            allowEmpty
            placeholder="None"
          />
        </FormGrid>
        <TextareaField name="notes" label="Notes" rows={2} />
        <FormActions pending={pending} submitLabel={id ? "Save" : "Add income"} onCancel={onDone} />
      </form>
    </FormProvider>
  );
}

export function ExpenseForm({ id, initial, onDone }: FormProps<ExpenseInput>) {
  const { today, currency } = useAppData();
  const { form, onSubmit, pending } = useActionForm({
    schema: expenseSchema,
    action: (raw) => saveExpense(raw, id),
    defaultValues: { date: today, amount: "", category: "essential", notes: "", ...initial },
    onSuccess: () => onDone?.(),
  });
  return (
    <FormProvider {...form}>
      <form onSubmit={onSubmit} className="grid gap-4" noValidate>
        <FormGrid>
          <NumberField name="amount" label="Amount" suffix={currency} required />
          <TextField name="date" label="Date" type="date" required />
        </FormGrid>
        <SelectField name="category" label="Category" options={toOptions(EXPENSE_CATEGORIES)} required />
        <TextareaField name="notes" label="Notes" rows={2} placeholder="What was it for?" />
        <FormActions pending={pending} submitLabel={id ? "Save" : "Add expense"} onCancel={onDone} />
      </form>
    </FormProvider>
  );
}

export function SavingsForm({ id, initial, onDone }: FormProps<SavingsInput>) {
  const { today, currency } = useAppData();
  const { form, onSubmit, pending } = useActionForm({
    schema: savingsSchema,
    action: (raw) => saveSavings(raw, id),
    defaultValues: { date: today, amount: "", kind: "deposit", notes: "", ...initial },
    onSuccess: () => onDone?.(),
  });
  return (
    <FormProvider {...form}>
      <form onSubmit={onSubmit} className="grid gap-4" noValidate>
        <FormGrid>
          <NumberField name="amount" label="Amount" suffix={currency} required />
          <TextField name="date" label="Date" type="date" required />
        </FormGrid>
        <SelectField name="kind" label="Type" options={toOptions(SAVINGS_KINDS)} required />
        <TextareaField name="notes" label="Notes" rows={2} />
        <FormActions pending={pending} submitLabel={id ? "Save" : "Record savings"} onCancel={onDone} />
      </form>
    </FormProvider>
  );
}
