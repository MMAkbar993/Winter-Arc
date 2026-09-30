import { Skeleton } from "@/components/ui/skeleton";

/** Generic page skeleton: header, KPI row and two content blocks. */
export function PageSkeleton({ stats = 4 }: { stats?: number }) {
  return (
    <div className="grid gap-6" aria-busy aria-label="Loading">
      <div className="space-y-2">
        <Skeleton className="h-4 w-32" />
        <Skeleton className="h-8 w-64" />
      </div>
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        {Array.from({ length: stats }, (_, i) => (
          <Skeleton key={i} className="h-28 rounded-xl" />
        ))}
      </div>
      <div className="grid gap-4 lg:grid-cols-[1.4fr_1fr]">
        <Skeleton className="h-80 rounded-xl" />
        <Skeleton className="h-80 rounded-xl" />
      </div>
    </div>
  );
}
