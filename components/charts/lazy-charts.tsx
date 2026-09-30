"use client";

import dynamic from "next/dynamic";
import { Skeleton } from "@/components/ui/skeleton";

/**
 * Charts are client-only and code-split: Recharts is downloaded after the page
 * has rendered, so it never blocks the first paint of a server-rendered page.
 */
function ChartSkeleton() {
  return <Skeleton className="h-56 w-full rounded-lg" aria-label="Loading chart" />;
}

export const BarSeriesChart = dynamic(() => import("@/components/charts/charts").then((m) => m.BarSeriesChart), {
  ssr: false,
  loading: ChartSkeleton,
});
export const LineSeriesChart = dynamic(() => import("@/components/charts/charts").then((m) => m.LineSeriesChart), {
  ssr: false,
  loading: ChartSkeleton,
});
export const GroupedBarChart = dynamic(() => import("@/components/charts/charts").then((m) => m.GroupedBarChart), {
  ssr: false,
  loading: ChartSkeleton,
});
