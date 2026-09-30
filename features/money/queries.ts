import "server-only";
import { getOverview, type Overview } from "@/features/dashboard/overview";
import type { ExpenseCategory } from "@/lib/constants";
import type { UserContext } from "@/lib/data/context";
import { addDaysISO, startOfMonthISO } from "@/lib/dates";
import { budgetGuidance, summarizeFinances, toNumber, type BudgetLine, type FinanceSummary } from "@/lib/finance";
import type { ExpenseTransactionRow, IncomeTransactionRow, SavingsEntryRow } from "@/types/database";

export const MONTHS_OF_HISTORY = 6;

export interface MonthlyPoint {
  month: string;
  income: number;
  expenses: number;
  savings: number;
}

export interface MoneyData {
  overview: Overview;
  month: FinanceSummary;
  budget: BudgetLine[];
  monthly: MonthlyPoint[];
  income: (IncomeTransactionRow & { projects: { name: string } | null })[];
  expenses: ExpenseTransactionRow[];
  savings: SavingsEntryRow[];
  challengeRevenue: number;
  challengeSavings: number;
  expensesByCategory: { category: ExpenseCategory; amount: number }[];
}

/** First day of the month `n` months before the month containing `date`. */
function monthsBack(date: string, n: number): string {
  let d = startOfMonthISO(date);
  for (let i = 0; i < n; i++) d = startOfMonthISO(addDaysISO(d, -1));
  return d;
}

export async function getMoneyData(ctx: UserContext): Promise<MoneyData> {
  const { supabase, user, today } = ctx;
  const from = monthsBack(today, MONTHS_OF_HISTORY - 1);
  const [overview, incomeRes, expenseRes, savingsRes] = await Promise.all([
    getOverview(ctx),
    supabase.from("income_transactions").select("*, projects(name)").eq("user_id", user.id).gte("txn_date", from).order("txn_date", { ascending: false }).order("created_at", { ascending: false }),
    supabase.from("expense_transactions").select("*").eq("user_id", user.id).gte("txn_date", from).order("txn_date", { ascending: false }).order("created_at", { ascending: false }),
    supabase.from("savings_entries").select("*").eq("user_id", user.id).gte("entry_date", from).order("entry_date", { ascending: false }).order("created_at", { ascending: false }),
  ]);
  if (incomeRes.error || expenseRes.error || savingsRes.error) {
    console.error("[db] money", incomeRes.error ?? expenseRes.error ?? savingsRes.error);
    throw new Error("Could not load your finances.");
  }
  const income = incomeRes.data;
  const expenses = expenseRes.data;
  const savings = savingsRes.data;

  const monthStart = overview.monthStart;
  const inMonth = <T,>(rows: T[], key: (r: T) => string) => rows.filter((r) => key(r) >= monthStart && key(r) <= today);
  const monthIncome = inMonth(income, (r) => r.txn_date);
  const monthExpenses = inMonth(expenses, (r) => r.txn_date);
  const monthSavings = inMonth(savings, (r) => r.entry_date);
  const month = summarizeFinances({ income: monthIncome, expenses: monthExpenses, savings: monthSavings });

  const monthly: MonthlyPoint[] = [];
  for (let i = MONTHS_OF_HISTORY - 1; i >= 0; i--) {
    const start = monthsBack(today, i);
    const key = start.slice(0, 7);
    const pick = <T,>(rows: T[], date: (r: T) => string) => rows.filter((r) => date(r).startsWith(key));
    const s = summarizeFinances({
      income: pick(income, (r) => r.txn_date),
      expenses: pick(expenses, (r) => r.txn_date),
      savings: pick(savings, (r) => r.entry_date),
    });
    monthly.push({ month: start, income: s.income, expenses: s.expenses, savings: s.savings });
  }

  const byCategory = new Map<ExpenseCategory, number>();
  for (const e of monthExpenses) byCategory.set(e.category, (byCategory.get(e.category) ?? 0) + toNumber(e.amount));

  return {
    overview,
    month,
    budget: budgetGuidance(month.income, monthExpenses, month.savings),
    monthly,
    income,
    expenses,
    savings,
    challengeRevenue: overview.challenge.income,
    challengeSavings: overview.challenge.savings,
    expensesByCategory: [...byCategory.entries()].map(([category, amount]) => ({ category, amount })).sort((a, b) => b.amount - a.amount),
  };
}
