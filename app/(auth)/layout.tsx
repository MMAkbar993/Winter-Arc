import type { ReactNode } from "react";
import Link from "next/link";
import { Logo } from "@/components/shared/logo";
import { MOTIVATIONAL_LINES, TAGLINE } from "@/lib/constants";

export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <div className="grid min-h-dvh lg:grid-cols-[1.1fr_1fr]">
      <aside className="surface-glow relative hidden flex-col justify-between border-r bg-sidebar p-10 lg:flex">
        <Link href="/" className="w-fit rounded-md">
          <Logo />
        </Link>
        <div className="space-y-6">
          <p className="max-w-md text-4xl font-semibold tracking-tight text-balance">{TAGLINE}</p>
          <ul className="space-y-2 text-sm text-muted-foreground">
            {MOTIVATIONAL_LINES.slice(1, 4).map((line) => (
              <li key={line} className="flex items-center gap-2">
                <span aria-hidden className="size-1.5 rounded-full bg-brand" />
                {line}
              </li>
            ))}
          </ul>
        </div>
        <p className="text-xs text-muted-foreground">92 days · Seven habits · One scoreboard</p>
      </aside>
      <main className="flex flex-col items-center justify-center px-4 py-10 sm:px-8">
        <Link href="/" className="mb-10 rounded-md lg:hidden">
          <Logo />
        </Link>
        <div className="w-full max-w-sm">{children}</div>
      </main>
    </div>
  );
}
