import Link from "next/link";
import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

/** KPI tile: label, big value, optional progress towards a target and a hint. */
export function StatCard({
  label,
  value,
  hint,
  icon: Icon,
  progress,
  href,
  tone = "default",
  className,
}: {
  label: string;
  value: ReactNode;
  hint?: ReactNode;
  icon?: LucideIcon;
  /** 0–100; renders a thin bar under the value. */
  progress?: number;
  href?: string;
  tone?: "default" | "brand" | "warning";
  className?: string;
}) {
  const body = (
    <div
      className={cn(
        "group/stat flex h-full flex-col justify-between gap-3 rounded-xl border bg-card p-4 transition-colors",
        href && "hover:border-foreground/20 hover:bg-accent/40",
        className,
      )}
    >
      <div className="flex items-center justify-between gap-2">
        <p className="text-xs font-medium text-muted-foreground">{label}</p>
        {Icon ? (
          <Icon
            aria-hidden
            className={cn(
              "size-4 text-muted-foreground",
              tone === "brand" && "text-brand",
              tone === "warning" && "text-warning",
            )}
          />
        ) : null}
      </div>
      <div className="space-y-2">
        <p className="text-2xl font-semibold tracking-tight tabular">{value}</p>
        {progress !== undefined ? (
          <div
            className="h-1.5 overflow-hidden rounded-full bg-muted"
            role="progressbar"
            aria-label={`${label} progress`}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={Math.round(Math.min(progress, 100))}
          >
            <div
              className="h-full rounded-full bg-brand transition-[width] duration-500"
              style={{ width: `${Math.min(Math.max(progress, 0), 100)}%` }}
            />
          </div>
        ) : null}
        {hint ? <p className="text-xs text-muted-foreground">{hint}</p> : null}
      </div>
    </div>
  );

  return href ? (
    <Link href={href} className="block rounded-xl focus-visible:outline-2 focus-visible:outline-ring">
      {body}
    </Link>
  ) : (
    body
  );
}

export function StatGrid({ children, className }: { children: ReactNode; className?: string }) {
  return <div className={cn("grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-4", className)}>{children}</div>;
}
