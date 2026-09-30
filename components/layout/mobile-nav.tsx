"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { LogOut, Menu, Plus } from "lucide-react";
import { SidebarNav } from "@/components/layout/sidebar-nav";
import { Logo } from "@/components/shared/logo";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { signOut } from "@/features/auth/actions";
import { QUICK_ADD, type QuickAddKind } from "@/features/quick-add/quick-add-config";
import { useQuickAdd } from "@/features/quick-add/quick-add-provider";
import { isActive, MOBILE_PRIMARY, NAV_ITEMS } from "@/lib/navigation";
import { cn } from "@/lib/utils";

const MOBILE_QUICK_ADD: QuickAddKind[] = [
  "workout", "learning", "outreach", "prospect", "work", "content", "income", "expense", "journal",
];

/** Bottom tab bar for phones: 4 primary screens + a central quick-add button + menu. */
export function MobileNav({ name }: { name: string }) {
  const pathname = usePathname();
  const quickAdd = useQuickAdd();
  const [addOpen, setAddOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const primary = MOBILE_PRIMARY.map((href) => NAV_ITEMS.find((n) => n.href === href)).filter(
    (n): n is (typeof NAV_ITEMS)[number] => Boolean(n),
  );
  const [left, right] = [primary.slice(0, 2), primary.slice(2)];

  const tab = (item: (typeof NAV_ITEMS)[number]) => {
    const active = isActive(pathname, item.href);
    return (
      <Link
        key={item.href}
        href={item.href}
        aria-current={active ? "page" : undefined}
        className={cn(
          "flex min-h-14 flex-1 flex-col items-center justify-center gap-1 text-[11px]",
          active ? "text-foreground" : "text-muted-foreground",
        )}
      >
        <item.icon aria-hidden className={cn("size-5", active && "text-brand")} />
        {item.label}
      </Link>
    );
  };

  return (
    <>
      <nav
        aria-label="Primary"
        className="pb-safe fixed inset-x-0 bottom-0 z-40 border-t bg-background/90 backdrop-blur-md lg:hidden"
      >
        <div className="mx-auto flex max-w-lg items-stretch px-2">
          {left.map(tab)}
          <div className="flex flex-1 items-center justify-center">
            <button
              type="button"
              onClick={() => setAddOpen(true)}
              aria-label="Quick add"
              className="flex size-12 items-center justify-center rounded-2xl bg-brand text-brand-foreground shadow-lg shadow-brand/20 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
            >
              <Plus aria-hidden className="size-6" />
            </button>
          </div>
          {right.map(tab)}
          <button
            type="button"
            onClick={() => setMenuOpen(true)}
            className="flex min-h-14 flex-1 flex-col items-center justify-center gap-1 text-[11px] text-muted-foreground"
          >
            <Menu aria-hidden className="size-5" />
            More
          </button>
        </div>
      </nav>

      <Sheet open={addOpen} onOpenChange={setAddOpen}>
        <SheetContent side="bottom" className="pb-safe rounded-t-2xl">
          <SheetHeader>
            <SheetTitle>Quick add</SheetTitle>
          </SheetHeader>
          <div className="grid grid-cols-3 gap-2 px-4 pb-4">
            {MOBILE_QUICK_ADD.map((kind) => {
              const meta = QUICK_ADD[kind];
              return (
                <button
                  key={kind}
                  type="button"
                  onClick={() => {
                    setAddOpen(false);
                    quickAdd.open(kind);
                  }}
                  className="flex min-h-20 flex-col items-center justify-center gap-2 rounded-xl border bg-card p-2 text-center text-xs font-medium active:bg-accent"
                >
                  <meta.icon aria-hidden className="size-5 text-brand" />
                  {meta.label.replace(/^(Log|Add|Write) /, "")}
                </button>
              );
            })}
          </div>
        </SheetContent>
      </Sheet>

      <Sheet open={menuOpen} onOpenChange={setMenuOpen}>
        <SheetContent side="left" className="w-72 p-0">
          <SheetHeader className="border-b px-4 py-4">
            <SheetTitle asChild>
              <div>
                <Logo />
              </div>
            </SheetTitle>
          </SheetHeader>
          <div className="flex-1 overflow-y-auto px-3 py-3">
            <SidebarNav onNavigate={() => setMenuOpen(false)} />
          </div>
          <div className="border-t p-3">
            <p className="mb-2 truncate px-1 text-sm text-muted-foreground">Signed in as {name}</p>
            <form action={signOut}>
              <Button type="submit" variant="outline" className="h-10 w-full">
                <LogOut aria-hidden /> Log out
              </Button>
            </form>
          </div>
        </SheetContent>
      </Sheet>
    </>
  );
}
