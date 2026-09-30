"use client";

import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

export interface RangePreset {
  value: string;
  label: string;
}

/**
 * Preset chips plus a custom from/to range. State lives in the URL
 * (?range=… or ?from=…&to=…) so the server renders the filtered data and
 * views are shareable/bookmarkable.
 */
export function DateRangePicker({
  presets,
  activePreset,
  from,
  to,
}: {
  presets: RangePreset[];
  activePreset: string | null;
  from: string;
  to: string;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const [customOpen, setCustomOpen] = useState(activePreset === null);
  const [customFrom, setCustomFrom] = useState(from);
  const [customTo, setCustomTo] = useState(to);

  return (
    <div className="grid gap-2">
      <div role="group" aria-label="Date range" className="flex flex-wrap gap-1.5">
        {presets.map((p) => (
          <Button
            key={p.value}
            size="sm"
            variant={activePreset === p.value ? "default" : "outline"}
            aria-pressed={activePreset === p.value}
            onClick={() => {
              setCustomOpen(false);
              router.push(`${pathname}?range=${p.value}`, { scroll: false });
            }}
          >
            {p.label}
          </Button>
        ))}
        <Button
          size="sm"
          variant={activePreset === null ? "default" : "outline"}
          aria-pressed={activePreset === null}
          aria-expanded={customOpen}
          onClick={() => setCustomOpen((o) => !o)}
        >
          Custom
        </Button>
      </div>
      <form
        className={cn("flex flex-wrap items-end gap-2", !customOpen && "hidden")}
        onSubmit={(e) => {
          e.preventDefault();
          if (customFrom && customTo && customFrom <= customTo) {
            router.push(`${pathname}?from=${customFrom}&to=${customTo}`, { scroll: false });
          }
        }}
      >
        <label className="grid gap-1 text-xs text-muted-foreground">
          From
          <Input type="date" value={customFrom} max={customTo} onChange={(e) => setCustomFrom(e.target.value)} className="h-9" />
        </label>
        <label className="grid gap-1 text-xs text-muted-foreground">
          To
          <Input type="date" value={customTo} min={customFrom} onChange={(e) => setCustomTo(e.target.value)} className="h-9" />
        </label>
        <Button type="submit" size="sm" className="h-9" disabled={!customFrom || !customTo || customFrom > customTo}>
          Apply
        </Button>
      </form>
    </div>
  );
}
