import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

/** A list row that works equally well on phones (stacked) and desktops. */
export function RecordRow({
  title,
  meta,
  value,
  actions,
  leading,
  className,
}: {
  title: ReactNode;
  meta?: ReactNode;
  value?: ReactNode;
  actions?: ReactNode;
  leading?: ReactNode;
  className?: string;
}) {
  return (
    <li className={cn("flex items-center gap-3 py-3", className)}>
      {leading ? <div className="shrink-0">{leading}</div> : null}
      <div className="min-w-0 flex-1">
        <div className="truncate text-sm font-medium">{title}</div>
        {meta ? <div className="mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-muted-foreground">{meta}</div> : null}
      </div>
      {value ? <div className="shrink-0 text-right text-sm font-medium tabular">{value}</div> : null}
      {actions ? <div className="flex shrink-0 items-center">{actions}</div> : null}
    </li>
  );
}

export function RecordList({ children, className }: { children: ReactNode; className?: string }) {
  return <ul className={cn("divide-y", className)}>{children}</ul>;
}
