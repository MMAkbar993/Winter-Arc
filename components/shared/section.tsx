import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

/** A titled card section used throughout the app. */
export function Section({
  title,
  description,
  action,
  children,
  className,
  contentClassName,
  id,
}: {
  title: ReactNode;
  description?: ReactNode;
  action?: ReactNode;
  children: ReactNode;
  className?: string;
  contentClassName?: string;
  id?: string;
}) {
  const headingId = id ? `${id}-title` : undefined;
  return (
    <section id={id} aria-labelledby={headingId} className={cn("scroll-mt-20 rounded-xl border bg-card", className)}>
      <div className="flex items-start justify-between gap-3 px-4 pt-4 sm:px-5">
        <div className="min-w-0 space-y-0.5">
          <h2 id={headingId} className="text-sm font-semibold">
            {title}
          </h2>
          {description ? <p className="text-xs text-muted-foreground">{description}</p> : null}
        </div>
        {action ? <div className="shrink-0">{action}</div> : null}
      </div>
      <div className={cn("p-4 sm:p-5", contentClassName)}>{children}</div>
    </section>
  );
}
