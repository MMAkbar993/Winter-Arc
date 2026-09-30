import type { SearchKind, SearchResultRow } from "@/types/database";

export const SEARCH_KIND_LABELS: Record<SearchKind, string> = {
  prospect: "Prospects",
  project: "Projects",
  learning: "Learning",
  content: "Content",
  journal: "Journal",
};

/** Where each result type lives in the app. */
export function searchResultHref(row: Pick<SearchResultRow, "kind" | "occurred_on">): string {
  switch (row.kind) {
    case "prospect":
      return "/clients?view=table";
    case "project":
      return "/projects";
    case "learning":
      return "/learning";
    case "content":
      return "/content";
    case "journal":
      return row.occurred_on ? `/calendar?date=${row.occurred_on}` : "/journal";
  }
}
