"use client";

import Link from "next/link";
import { Plus, Search } from "lucide-react";
import { ThemeToggle } from "@/components/layout/theme-toggle";
import { LogoMark } from "@/components/shared/logo";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useCommandPalette } from "@/features/command-palette/command-palette";
import { NotificationBell } from "@/features/notifications/notification-bell";
import { QUICK_ADD, type QuickAddKind } from "@/features/quick-add/quick-add-config";
import { useQuickAdd } from "@/features/quick-add/quick-add-provider";

const HEADER_QUICK_ADD: QuickAddKind[] = [
  "workout", "learning", "outreach", "prospect", "work", "project", "content", "income", "expense", "savings", "journal", "note",
];

export function AppHeader({ challengeLabel }: { challengeLabel: string }) {
  const palette = useCommandPalette();
  const quickAdd = useQuickAdd();

  return (
    <header className="sticky top-0 z-30 border-b bg-background/80 backdrop-blur-md supports-[backdrop-filter]:bg-background/70">
      <div className="mx-auto flex h-14 w-full max-w-7xl items-center gap-2 px-4 sm:px-6 lg:px-8">
        <Link href="/dashboard" className="rounded-md lg:hidden" aria-label="Winter Arc OS — dashboard">
          <LogoMark />
        </Link>
        <p className="hidden truncate text-sm text-muted-foreground sm:block">{challengeLabel}</p>

        <div className="ml-auto flex items-center gap-1">
          <Button
            variant="outline"
            onClick={palette.open}
            className="hidden h-9 w-56 justify-start gap-2 text-muted-foreground md:flex"
            aria-label="Search and commands"
          >
            <Search aria-hidden />
            <span className="flex-1 text-left">Search…</span>
            <kbd className="rounded border bg-muted px-1.5 font-mono text-[10px]">Ctrl K</kbd>
          </Button>
          <Button variant="ghost" size="icon" className="md:hidden" onClick={palette.open} aria-label="Search and commands">
            <Search aria-hidden />
          </Button>

          <DropdownMenu modal={false}>
            <DropdownMenuTrigger asChild>
              <Button size="sm" className="hidden h-9 gap-1.5 sm:flex" aria-label="Quick add">
                <Plus aria-hidden /> Quick add
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuLabel>Log something</DropdownMenuLabel>
              {HEADER_QUICK_ADD.map((kind) => {
                const meta = QUICK_ADD[kind];
                return (
                  <DropdownMenuItem key={kind} onSelect={() => quickAdd.open(kind)}>
                    <meta.icon aria-hidden />
                    {meta.label}
                  </DropdownMenuItem>
                );
              })}
            </DropdownMenuContent>
          </DropdownMenu>

          <NotificationBell />
          <ThemeToggle />
        </div>
      </div>
    </header>
  );
}
