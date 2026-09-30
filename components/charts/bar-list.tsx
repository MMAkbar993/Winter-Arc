import { cn } from "@/lib/utils";

/**
 * Horizontal bar list for category breakdowns (topics, platforms, stages).
 * A ranked list with visible labels and values — no legend or color-matching
 * needed, and it reads well on phones. Bars share one magnitude hue.
 */
export function BarList({
  items,
  format = (v) => String(v),
  className,
  emptyLabel = "No data yet.",
}: {
  items: { label: string; value: number; hint?: string }[];
  format?: (value: number) => string;
  className?: string;
  emptyLabel?: string;
}) {
  const max = Math.max(...items.map((i) => i.value), 0);
  if (items.length === 0 || max === 0) return <p className="text-sm text-muted-foreground">{emptyLabel}</p>;
  return (
    <ul className={cn("grid gap-2.5", className)}>
      {items.map((item) => (
        <li key={item.label} className="grid gap-1">
          <div className="flex items-baseline justify-between gap-2 text-sm">
            <span className="truncate">{item.label}</span>
            <span className="shrink-0 font-medium tabular">
              {format(item.value)}
              {item.hint ? <span className="ml-1.5 text-xs font-normal text-muted-foreground">{item.hint}</span> : null}
            </span>
          </div>
          <div className="h-1.5 overflow-hidden rounded-full bg-muted" aria-hidden>
            <div className="h-full rounded-full bg-chart-1" style={{ width: `${(item.value / max) * 100}%` }} />
          </div>
        </li>
      ))}
    </ul>
  );
}
