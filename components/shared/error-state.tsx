"use client";

import { useEffect } from "react";
import { AlertTriangle, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";

/** Friendly error UI. Never shows raw error messages (they may contain internals). */
export function ErrorState({
  error,
  retry,
  title = "Something went wrong",
}: {
  error: Error & { digest?: string };
  retry: () => void;
  title?: string;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div role="alert" className="mx-auto flex max-w-md flex-col items-center gap-4 rounded-2xl border bg-card px-6 py-12 text-center">
      <div className="flex size-11 items-center justify-center rounded-full bg-warning-soft">
        <AlertTriangle aria-hidden className="size-5 text-warning" />
      </div>
      <div className="space-y-1">
        <h2 className="font-semibold">{title}</h2>
        <p className="text-sm text-muted-foreground">
          We couldn&apos;t load this page. Your data is safe — try again in a moment.
        </p>
        {error.digest ? <p className="text-xs text-muted-foreground">Reference: {error.digest}</p> : null}
      </div>
      <Button onClick={retry} size="lg">
        <RotateCcw aria-hidden /> Try again
      </Button>
    </div>
  );
}
