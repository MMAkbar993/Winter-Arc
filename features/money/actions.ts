"use server";

import { runAction } from "@/lib/actions";
import { deleteAction, saveOwned } from "@/lib/crud";
import { expenseSchema, incomeSchema, savingsSchema } from "@/lib/validation/schemas";

export async function saveIncome(raw: unknown, id?: string) {
  return runAction(
    incomeSchema,
    raw,
    async (input, ctx) => ({
      id: await saveOwned(
        ctx,
        "income_transactions",
        {
          txn_date: input.date,
          amount: input.amount,
          source: input.source,
          client: input.client,
          project_id: input.projectId,
          category: input.category,
          notes: input.notes,
        },
        id,
      ),
    }),
    { successMessage: id ? "Income updated" : "Income added" },
  );
}

export async function deleteIncome(id: string) {
  return deleteAction("income_transactions", id);
}

export async function saveExpense(raw: unknown, id?: string) {
  return runAction(
    expenseSchema,
    raw,
    async (input, ctx) => ({
      id: await saveOwned(
        ctx,
        "expense_transactions",
        { txn_date: input.date, amount: input.amount, category: input.category, notes: input.notes },
        id,
      ),
    }),
    { successMessage: id ? "Expense updated" : "Expense added" },
  );
}

export async function deleteExpense(id: string) {
  return deleteAction("expense_transactions", id);
}

export async function saveSavings(raw: unknown, id?: string) {
  return runAction(
    savingsSchema,
    raw,
    async (input, ctx) => ({
      id: await saveOwned(
        ctx,
        "savings_entries",
        { entry_date: input.date, amount: input.amount, kind: input.kind, notes: input.notes },
        id,
      ),
    }),
    { successMessage: id ? "Savings updated" : "Savings recorded" },
  );
}

export async function deleteSavings(id: string) {
  return deleteAction("savings_entries", id);
}
