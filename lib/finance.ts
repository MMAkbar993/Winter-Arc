import {
  BUDGET_GUIDANCE,
  BUSINESS_INVESTMENT_CATEGORIES,
  type ExpenseCategory,
  type SavingsKind,
} from "@/lib/constants";

/** PostgREST may serialise numeric columns as strings; normalise defensively. */
export function toNumber(value: number | string | null | undefined): number {
  if (value === null || value === undefined) return 0;
  const n = typeof value === "number" ? value : Number.parseFloat(value);
  return Number.isFinite(n) ? n : 0;
}

/** Sum with cent-precision to avoid floating point drift. */
export function sumAmounts(rows: readonly { amount: number | string | null }[]): number {
  const cents = rows.reduce((acc, r) => acc + Math.round(toNumber(r.amount) * 100), 0);
  return cents / 100;
}

export function netSavings(entries: readonly { amount: number | string; kind: SavingsKind }[]): number {
  const cents = entries.reduce((acc, e) => {
    const c = Math.round(toNumber(e.amount) * 100);
    return e.kind === "withdrawal" ? acc - c : acc + c;
  }, 0);
  return cents / 100;
}

export interface FinanceSummary {
  income: number;
  expenses: number;
  savings: number;
  /** savings / income, as a whole percent. 0 when there is no income. */
  savingsRate: number;
  businessInvestment: number;
  /** income − expenses − savings (what is left unallocated). */
  unallocated: number;
}

export function summarizeFinances(input: {
  income: readonly { amount: number | string }[];
  expenses: readonly { amount: number | string; category: ExpenseCategory }[];
  savings: readonly { amount: number | string; kind: SavingsKind }[];
}): FinanceSummary {
  const income = sumAmounts(input.income);
  const expenses = sumAmounts(input.expenses);
  const savings = netSavings(input.savings);
  const businessInvestment = sumAmounts(
    input.expenses.filter((e) => BUSINESS_INVESTMENT_CATEGORIES.includes(e.category)),
  );
  return {
    income,
    expenses,
    savings,
    savingsRate: income > 0 ? Math.round((savings / income) * 100) : 0,
    businessInvestment,
    unallocated: Math.round((income - expenses - savings) * 100) / 100,
  };
}

export interface BudgetLine {
  key: string;
  label: string;
  percent: number;
  target: number;
  actual: number;
}

/** Reference-only budget split. `actual` is what was spent/saved per bucket. */
export function budgetGuidance(
  income: number,
  expenses: readonly { amount: number | string; category: ExpenseCategory }[],
  savings: number,
): BudgetLine[] {
  return BUDGET_GUIDANCE.map((line) => {
    const actual =
      line.key === "savings"
        ? savings
        : sumAmounts(expenses.filter((e) => (line.categories as readonly ExpenseCategory[]).includes(e.category)));
    return {
      key: line.key,
      label: line.label,
      percent: line.percent,
      target: Math.round(income * line.percent) / 100,
      actual,
    };
  });
}
