import { cn } from "@/lib/utils";
import { APP_NAME } from "@/lib/constants";

export function LogoMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 64 64" aria-hidden className={cn("size-7", className)}>
      <rect width="64" height="64" rx="14" className="fill-foreground/[0.06]" />
      <path
        d="M14 44 26 18l6 13 6-13 12 26"
        fill="none"
        className="stroke-brand"
        strokeWidth="5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function Logo({ className }: { className?: string }) {
  return (
    <span className={cn("flex items-center gap-2 font-semibold tracking-tight", className)}>
      <LogoMark />
      <span>{APP_NAME}</span>
    </span>
  );
}
