import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <main className="flex min-h-dvh flex-col items-center justify-center gap-4 px-4 text-center">
      <p className="text-sm font-medium text-brand">404</p>
      <h1 className="text-2xl font-semibold tracking-tight">This page doesn&apos;t exist</h1>
      <p className="max-w-sm text-sm text-muted-foreground">No zero days — head back and keep going.</p>
      <Button asChild size="lg">
        <Link href="/dashboard">Back to dashboard</Link>
      </Button>
    </main>
  );
}
