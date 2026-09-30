"use client";

import { useRouter } from "next/navigation";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  useTransition,
  type ReactNode,
} from "react";
import { useTheme } from "next-themes";
import { Loader2, Moon, Search } from "lucide-react";
import {
  Command,
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
  CommandShortcut,
} from "@/components/ui/command";
import { QUICK_ADD, type QuickAddKind } from "@/features/quick-add/quick-add-config";
import { useQuickAdd } from "@/features/quick-add/quick-add-provider";
import { searchEverything } from "@/features/search/actions";
import { SEARCH_KIND_LABELS, searchResultHref } from "@/features/search/search";
import { NAV_ITEMS } from "@/lib/navigation";
import type { SearchResultRow } from "@/types/database";

const ACTIONS: { kind: QuickAddKind; label: string }[] = [
  { kind: "workout", label: "Log Workout" },
  { kind: "learning", label: "Add Learning Session" },
  { kind: "prospect", label: "Add Prospect" },
  { kind: "outreach", label: "Log Outreach" },
  { kind: "work", label: "Log Work" },
  { kind: "income", label: "Add Income" },
  { kind: "expense", label: "Add Expense" },
  { kind: "content", label: "Add Content" },
  { kind: "journal", label: "Write Journal" },
  { kind: "note", label: "Add Note" },
];

const matches = (text: string, query: string) => text.toLowerCase().includes(query.trim().toLowerCase());

const PaletteContext = createContext<{ open: () => void } | null>(null);

export function useCommandPalette() {
  const ctx = useContext(PaletteContext);
  if (!ctx) throw new Error("useCommandPalette must be used inside <CommandPaletteProvider>");
  return ctx;
}

export function CommandPaletteProvider({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false);
  const value = useMemo(() => ({ open: () => setOpen(true) }), []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setOpen((o) => !o);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  return (
    <PaletteContext.Provider value={value}>
      {children}
      <CommandPalette open={open} onOpenChange={setOpen} />
    </PaletteContext.Provider>
  );
}

function CommandPalette({ open, onOpenChange }: { open: boolean; onOpenChange: (open: boolean) => void }) {
  const router = useRouter();
  const quickAdd = useQuickAdd();
  const { resolvedTheme, setTheme } = useTheme();
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResultRow[]>([]);
  const [searching, startSearch] = useTransition();

  useEffect(() => {
    const q = query.trim();
    if (q.length < 2) return;
    const timer = window.setTimeout(() => {
      startSearch(async () => setResults(await searchEverything(q)));
    }, 250);
    return () => window.clearTimeout(timer);
  }, [query]);

  const visibleResults = query.trim().length >= 2 ? results : [];

  const run = useCallback(
    (fn: () => void) => {
      onOpenChange(false);
      setQuery("");
      fn();
    },
    [onOpenChange],
  );

  const actions = ACTIONS.filter((a) => matches(a.label, query));
  const pages = NAV_ITEMS.filter((n) => matches(`Open ${n.label}`, query));

  return (
    <CommandDialog open={open} onOpenChange={onOpenChange} title="Command palette" description="Jump anywhere or log something">
      <Command shouldFilter={false} loop>
        <CommandInput placeholder="Type a command or search…" value={query} onValueChange={setQuery} />
        <CommandList className="max-h-[60dvh]">
          <CommandEmpty>{searching ? "Searching…" : "No matches."}</CommandEmpty>

          {actions.length > 0 ? (
            <CommandGroup heading="Log">
              {actions.map((a) => {
                const Icon = QUICK_ADD[a.kind].icon;
                return (
                  <CommandItem key={a.kind} value={`action-${a.kind}`} onSelect={() => run(() => quickAdd.open(a.kind))}>
                    <Icon aria-hidden />
                    {a.label}
                  </CommandItem>
                );
              })}
            </CommandGroup>
          ) : null}

          {pages.length > 0 ? (
            <>
              <CommandSeparator />
              <CommandGroup heading="Go to">
                {pages.map((n) => (
                  <CommandItem key={n.href} value={`nav-${n.href}`} onSelect={() => run(() => router.push(n.href))}>
                    <n.icon aria-hidden />
                    Open {n.label}
                  </CommandItem>
                ))}
              </CommandGroup>
            </>
          ) : null}

          {matches("Toggle theme dark light", query) ? (
            <CommandGroup heading="Preferences">
              <CommandItem
                value="toggle-theme"
                onSelect={() => run(() => setTheme(resolvedTheme === "dark" ? "light" : "dark"))}
              >
                <Moon aria-hidden />
                Toggle dark / light mode
              </CommandItem>
            </CommandGroup>
          ) : null}

          {query.trim().length >= 2 ? (
            <>
              <CommandSeparator />
              <CommandGroup heading={searching ? "Searching…" : "Search results"}>
                {visibleResults.map((r) => (
                  <CommandItem
                    key={`${r.kind}-${r.id}`}
                    value={`result-${r.kind}-${r.id}`}
                    onSelect={() => run(() => router.push(searchResultHref(r)))}
                  >
                    <span className="min-w-0 flex-1 truncate">
                      {r.title}
                      {r.subtitle ? <span className="ml-2 text-muted-foreground">{r.subtitle}</span> : null}
                    </span>
                    <CommandShortcut>{SEARCH_KIND_LABELS[r.kind]}</CommandShortcut>
                  </CommandItem>
                ))}
                <CommandItem
                  value="search-all"
                  onSelect={() => run(() => router.push(`/search?q=${encodeURIComponent(query.trim())}`))}
                >
                  {searching ? <Loader2 className="animate-spin" aria-hidden /> : <Search aria-hidden />}
                  See all results for “{query.trim()}”
                </CommandItem>
              </CommandGroup>
            </>
          ) : null}
        </CommandList>
      </Command>
    </CommandDialog>
  );
}
