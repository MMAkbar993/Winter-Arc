"use client";

import "./globals.css";
import { ErrorState } from "@/components/shared/error-state";

export default function GlobalError({ error, retry }: { error: Error & { digest?: string }; retry: () => void }) {
  return (
    <html lang="en" className="dark">
      <body className="flex min-h-dvh items-center justify-center bg-background p-4">
        <ErrorState error={error} retry={retry} />
      </body>
    </html>
  );
}
