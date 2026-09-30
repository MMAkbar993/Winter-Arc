import type { BudgetLine } from "@/lib/finance";
import { formatCurrency, percent } from "@/lib/format";

/**
 * Optional 40/25/15/10/10 reference split of this month's income. It is never
 * enforced — the bars only show how actual spending compares to the guide.
 */
export function BudgetGuidance({ lines, income, currency }: { lines: BudgetLine[]; income: number; currency: string }) {
  if (income <= 0) {
    return (
      <p className="text-sm text-muted-foreground">
        Add income this month to see the reference split: 40% necessities · 25% savings · 15% skills/business · 10%
        family/personal · 10% fun.
      </p>
    );
  }
  return (
    <ul className="grid gap-3">
      {lines.map((line) => {
        const usedPct = percent(line.actual, line.target);
        const over = line.key !== "savings" && line.actual > line.target;
        return (
          <li key={line.key} className="grid gap-1">
            <div className="flex items-baseline justify-between gap-2 text-sm">
              <span>
                {line.label} <span className="text-xs text-muted-foreground tabular">{line.percent}%</span>
              </span>
              <span className="text-xs text-muted-foreground tabular">
                <span className="text-sm font-medium text-foreground">{formatCurrency(line.actual, currency)}</span> /{" "}
                {formatCurrency(line.target, currency)}
                {over ? <span className="ml-1.5 font-medium text-warning">over</span> : null}
              </span>
            </div>
            <div
              className="h-1.5 overflow-hidden rounded-full bg-muted"
              role="progressbar"
              aria-label={`${line.label}: ${usedPct}% of reference`}
              aria-valuemin={0}
              aria-valuemax={100}
              aria-valuenow={Math.min(usedPct, 100)}
            >
              <div
                className={over ? "h-full rounded-full bg-warning" : "h-full rounded-full bg-chart-1"}
                style={{ width: `${Math.min(usedPct, 100)}%` }}
              />
            </div>
          </li>
        );
      })}
      <li className="text-xs text-muted-foreground">Reference only — not enforced.</li>
    </ul>
  );
}
