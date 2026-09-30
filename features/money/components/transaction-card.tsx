import type { ReactNode } from "react";
import { ArrowDownLeft, ArrowUpRight, PiggyBank } from "lucide-react";
import { RecordRow } from "@/components/shared/record-list";
import { formatISODate } from "@/lib/dates";
import { formatCurrency } from "@/lib/format";
import { cn } from "@/lib/utils";

const ICON = { income: ArrowDownLeft, expense: ArrowUpRight, savings: PiggyBank } as const;

/** One money movement: icon, what it was, when, signed amount, actions. */
export function TransactionCard({
  type,
  title,
  date,
  detail,
  amount,
  currency,
  negative = false,
  actions,
}: {
  type: keyof typeof ICON;
  title: string;
  date: string;
  detail?: string | null;
  amount: number;
  currency: string;
  negative?: boolean;
  actions?: ReactNode;
}) {
  const Icon = ICON[type];
  return (
    <RecordRow
      leading={
        <span className="flex size-9 items-center justify-center rounded-lg bg-muted">
          <Icon aria-hidden className="size-4 text-muted-foreground" />
        </span>
      }
      title={title}
      meta={
        <>
          <span>{formatISODate(date, "EEE, MMM d")}</span>
          {detail ? <span className="truncate">{detail}</span> : null}
        </>
      }
      value={
        <span className={cn(negative ? "text-muted-foreground" : "text-foreground")}>
          {negative ? "−" : "+"}
          {formatCurrency(amount, currency)}
        </span>
      }
      actions={actions}
    />
  );
}
