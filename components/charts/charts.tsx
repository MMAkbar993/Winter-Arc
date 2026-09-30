"use client";

import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  type TooltipContentProps,
} from "recharts";
import { formatISODate, isISODate } from "@/lib/dates";
import { formatCurrencyCompact, formatMinutes, formatNumber } from "@/lib/format";

/**
 * Chart primitives. Specs follow the dataviz method: one y-axis only, 2px
 * lines, bars ≤24px with a 4px rounded data end, solid hairline grid, hover
 * tooltip on every chart, text in text tokens (never the series color).
 * Colors come from the validated --chart-* tokens in fixed order.
 */

export type ChartDatum = Record<string, string | number | null>;

/** Serializable formatter descriptors (server pages can't pass functions to client components). */
export type ValueFormat = "number" | "minutes" | "hours" | "score" | "percent" | { currency: string };
export type AxisFormat = "date" | "weekStart" | "month" | "none";

function valueFormatter(format: ValueFormat | undefined): ((v: number) => string) | undefined {
  if (!format || format === "number") return (v) => formatNumber(v, 1);
  if (format === "minutes") return (v) => formatMinutes(v);
  if (format === "hours") return (v) => `${formatNumber(v, 1)}h`;
  if (format === "score") return (v) => `${formatNumber(v, 1)}/7`;
  if (format === "percent") return (v) => `${formatNumber(v)}%`;
  return (v) => formatCurrencyCompact(v, format.currency);
}

function axisFormatter(format: AxisFormat | undefined): ((v: string) => string) | undefined {
  if (!format || format === "none") return undefined;
  if (format === "month") return (v) => (isISODate(v) ? formatISODate(v, "MMM yyyy") : v);
  if (format === "weekStart") return (v) => (isISODate(v) ? `Wk ${formatISODate(v, "MMM d")}` : v);
  return (v) => (isISODate(v) ? formatISODate(v, "MMM d") : v);
}

export const SERIES_COLORS = ["var(--chart-1)", "var(--chart-2)", "var(--chart-3)", "var(--chart-4)", "var(--chart-5)"];

const AXIS = { stroke: "var(--muted-foreground)", fontSize: 11, tickLine: false, axisLine: false } as const;
const GRID = { stroke: "var(--chart-grid)", strokeDasharray: undefined, vertical: false } as const;
const HEIGHT = 224;

interface SeriesProps {
  data: ChartDatum[];
  xKey: string;
  yKey: string;
  /** How y values are formatted in ticks and tooltips. */
  format?: ValueFormat;
  /** How x labels are formatted (ISO date → "Oct 5"). */
  formatX?: AxisFormat;
  /** Accessible summary of what the chart shows. */
  label: string;
  color?: string;
  height?: number;
  /** Optional horizontal reference value (e.g. a daily target). */
  target?: number;
  yDomain?: [number, number];
}

function ChartTooltip({
  active,
  payload,
  label,
  format,
  formatX,
}: TooltipContentProps<number, string> & { format?: (v: number) => string; formatX?: (v: string) => string }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-lg border bg-popover px-3 py-2 text-xs shadow-md">
      <p className="mb-1 text-muted-foreground">{formatX ? formatX(String(label)) : String(label)}</p>
      {payload.map((p) => (
        <p key={String(p.dataKey)} className="flex items-center gap-2 font-medium text-popover-foreground tabular">
          <span aria-hidden className="size-2 rounded-full" style={{ background: p.color }} />
          {p.name && payload.length > 1 ? <span className="font-normal text-muted-foreground">{p.name}</span> : null}
          {format ? format(Number(p.value)) : String(p.value)}
        </p>
      ))}
    </div>
  );
}

function Frame({ label, height, children }: { label: string; height: number; children: React.ReactElement }) {
  return (
    <figure role="img" aria-label={label} className="w-full" style={{ height }}>
      <ResponsiveContainer width="100%" height="100%">
        {children}
      </ResponsiveContainer>
    </figure>
  );
}

export function BarSeriesChart({
  data,
  xKey,
  yKey,
  format,
  formatX,
  label,
  color = SERIES_COLORS[0],
  height = HEIGHT,
  highlightKey,
  yDomain,
}: SeriesProps & { highlightKey?: string }) {
  const fmt = valueFormatter(format);
  const fmtX = axisFormatter(formatX);
  return (
    <Frame label={label} height={height}>
      <BarChart data={data} margin={{ top: 8, right: 4, left: -12, bottom: 0 }} barCategoryGap="20%">
        <CartesianGrid {...GRID} />
        <XAxis dataKey={xKey} {...AXIS} tickFormatter={fmtX} minTickGap={12} />
        <YAxis {...AXIS} tickFormatter={fmt} width={56} allowDecimals={false} domain={yDomain} />
        <Tooltip
          cursor={{ fill: "var(--muted)", opacity: 0.5 }}
          content={(props) => <ChartTooltip {...(props as TooltipContentProps<number, string>)} format={fmt} formatX={fmtX} />}
        />
        <Bar dataKey={yKey} fill={color} radius={[4, 4, 0, 0]} maxBarSize={24} isAnimationActive={false}>
          {highlightKey
            ? data.map((d) => (
                <Cell key={String(d[xKey])} fillOpacity={String(d[xKey]) === highlightKey ? 1 : 0.55} />
              ))
            : null}
        </Bar>
      </BarChart>
    </Frame>
  );
}

export function LineSeriesChart({
  data,
  xKey,
  yKey,
  format,
  formatX,
  label,
  color = SERIES_COLORS[0],
  height = HEIGHT,
  area = false,
  yDomain,
}: SeriesProps & { area?: boolean }) {
  const fmt = valueFormatter(format);
  const fmtX = axisFormatter(formatX);
  const common = {
    dataKey: yKey,
    stroke: color,
    strokeWidth: 2,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
    dot: false,
    activeDot: { r: 5, stroke: "var(--card)", strokeWidth: 2, fill: color },
    isAnimationActive: false,
    connectNulls: true,
  };
  const axes = (
    <>
      <CartesianGrid {...GRID} />
      <XAxis dataKey={xKey} {...AXIS} tickFormatter={fmtX} minTickGap={16} />
      <YAxis {...AXIS} tickFormatter={fmt} width={56} domain={yDomain ?? ["auto", "auto"]} />
      <Tooltip
        cursor={{ stroke: "var(--muted-foreground)", strokeWidth: 1 }}
        content={(props) => <ChartTooltip {...(props as TooltipContentProps<number, string>)} format={fmt} formatX={fmtX} />}
      />
    </>
  );
  return (
    <Frame label={label} height={height}>
      {area ? (
        <AreaChart data={data} margin={{ top: 8, right: 8, left: -12, bottom: 0 }}>
          {axes}
          <Area {...common} type="monotone" fill={color} fillOpacity={0.1} />
        </AreaChart>
      ) : (
        <LineChart data={data} margin={{ top: 8, right: 8, left: -12, bottom: 0 }}>
          {axes}
          <Line {...common} type="monotone" />
        </LineChart>
      )}
    </Frame>
  );
}

/** Multi-series columns (≤3 series) with a legend always shown. */
export function GroupedBarChart({
  data,
  xKey,
  series,
  format,
  formatX,
  label,
  height = HEIGHT,
}: {
  data: ChartDatum[];
  xKey: string;
  series: { key: string; name: string }[];
  format?: ValueFormat;
  formatX?: AxisFormat;
  label: string;
  height?: number;
}) {
  const fmt = valueFormatter(format);
  const fmtX = axisFormatter(formatX);
  return (
    <div className="grid gap-2">
      <ChartLegend items={series.map((s, i) => ({ name: s.name, color: SERIES_COLORS[i] ?? SERIES_COLORS[0]! }))} />
      <Frame label={label} height={height}>
        <BarChart data={data} margin={{ top: 8, right: 4, left: -12, bottom: 0 }} barGap={2} barCategoryGap="24%">
          <CartesianGrid {...GRID} />
          <XAxis dataKey={xKey} {...AXIS} tickFormatter={fmtX} minTickGap={12} />
          <YAxis {...AXIS} tickFormatter={fmt} width={56} />
          <Tooltip
            cursor={{ fill: "var(--muted)", opacity: 0.5 }}
            content={(props) => <ChartTooltip {...(props as TooltipContentProps<number, string>)} format={fmt} formatX={fmtX} />}
          />
          {series.map((s, i) => (
            <Bar key={s.key} dataKey={s.key} name={s.name} fill={SERIES_COLORS[i]} radius={[4, 4, 0, 0]} maxBarSize={20} isAnimationActive={false} />
          ))}
        </BarChart>
      </Frame>
    </div>
  );
}

export function ChartLegend({ items }: { items: { name: string; color: string }[] }) {
  return (
    <ul className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground" aria-label="Legend">
      {items.map((i) => (
        <li key={i.name} className="flex items-center gap-1.5">
          <span aria-hidden className="size-2.5 rounded-sm" style={{ background: i.color }} />
          {i.name}
        </li>
      ))}
    </ul>
  );
}
