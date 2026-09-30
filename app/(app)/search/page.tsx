import type { Metadata } from "next";
import Link from "next/link";
import { Search } from "lucide-react";
import { EmptyState } from "@/components/shared/empty-state";
import { PageHeader } from "@/components/shared/page-header";
import { Section } from "@/components/shared/section";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { searchEverything } from "@/features/search/actions";
import { SEARCH_KIND_LABELS, searchResultHref } from "@/features/search/search";
import { requireOnboardedContext } from "@/lib/data/context";
import { formatISODate } from "@/lib/dates";
import type { SearchKind, SearchResultRow } from "@/types/database";

export const metadata: Metadata = { title: "Search" };

export default async function SearchPage({ searchParams }: PageProps<"/search">) {
  await requireOnboardedContext();
  const params = await searchParams;
  const query = typeof params.q === "string" ? params.q.trim().slice(0, 100) : "";
  const results = query.length >= 2 ? await searchEverything(query) : [];

  const groups = new Map<SearchKind, SearchResultRow[]>();
  for (const r of results) groups.set(r.kind, [...(groups.get(r.kind) ?? []), r]);

  return (
    <div className="grid max-w-3xl grid-cols-1 gap-6">
      <PageHeader title="Search" description="Prospects, projects, learning sessions, content and journal entries." />
      <form action="/search" role="search" className="flex gap-2">
        <label htmlFor="search-q" className="sr-only">
          Search
        </label>
        <Input id="search-q" name="q" defaultValue={query} placeholder="Search everything…" className="h-11" autoFocus minLength={2} />
        <Button type="submit" size="lg" className="h-11">
          <Search aria-hidden /> Search
        </Button>
      </form>

      {query.length < 2 ? (
        <p className="text-sm text-muted-foreground">Type at least two characters. Tip: press Ctrl/⌘ K anywhere.</p>
      ) : results.length === 0 ? (
        <EmptyState icon={Search} title={`No results for “${query}”`} description="Try a name, company, topic or a word from your notes." />
      ) : (
        [...groups.entries()].map(([kind, rows]) => (
          <Section key={kind} title={SEARCH_KIND_LABELS[kind]} description={`${rows.length} result${rows.length === 1 ? "" : "s"}`}>
            <ul className="divide-y">
              {rows.map((r) => (
                <li key={r.id}>
                  <Link href={searchResultHref(r)} className="flex items-center gap-3 py-3 hover:text-foreground">
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-medium">{r.title}</span>
                      {r.subtitle ? <span className="block truncate text-xs text-muted-foreground">{r.subtitle}</span> : null}
                    </span>
                    {r.occurred_on ? (
                      <span className="shrink-0 text-xs text-muted-foreground">{formatISODate(r.occurred_on, "MMM d, yyyy")}</span>
                    ) : null}
                  </Link>
                </li>
              ))}
            </ul>
          </Section>
        ))
      )}
    </div>
  );
}
