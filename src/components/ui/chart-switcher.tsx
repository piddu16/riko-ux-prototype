"use client";

/* ═══════════════════════════════════════════════════════════════
   ChartSwitcher + ChartRenderer + DataShape taxonomy
   ═══════════════════════════════════════════════════════════════
   Three concerns in one file (kept local because they're co-changed):

   1. DataShape — the structural type of the data (composition,
      categorical, timeseries, etc.). Determines which chart types
      are valid alternatives.

   2. ChartRenderer — given a data shape and a chart type, routes
      to the right concrete chart component. Manages its own
      "current type" state so users can toggle without parent work.

   3. ChartSwitcher — compact dropdown the user opens to switch
      chart types for the current data. Matches FireAI's "Edit
      chart" pattern from their product tour.

   Adding a new chart type = add to ChartType union + add icon/label +
   extend CHART_TYPES_FOR_SHAPE + add a render case.
   ═══════════════════════════════════════════════════════════════ */

import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ChevronDown,
  BarChart3,
  PieChart,
  LineChart as LineIcon,
  AreaChart,
  LayoutGrid,
  Check,
} from "lucide-react";
import {
  ChatBarChart,
  ChatLineChart,
  ChatDonut,
  type BarDatum,
  type LinePoint,
  type DonutSlice,
} from "./chat-charts";
import { CompositionTreemap } from "./composition-treemap";

/* ═══════════════════════════════════════════════════════════════
   DataShape — the structure of the data, independent of how we
   want to draw it
   ═══════════════════════════════════════════════════════════════ */
export type DataShape =
  | {
      kind: "composition";
      title: string;
      subtitle?: string;
      parts: { label: string; value: number; color?: string }[];
      total?: number;
      currency?: boolean; // default true
    }
  | {
      kind: "categorical";
      title: string;
      subtitle?: string;
      entries: { label: string; value: number; color?: string; caption?: string }[];
      currency?: boolean; // default true
    }
  | {
      kind: "timeseries";
      title: string;
      subtitle?: string;
      points: { x: string; y: number }[];
      color?: string;
      highlight?: { index: number; label: string };
    };

/* ═══════════════════════════════════════════════════════════════
   ChartType — every visual we can render, across all shapes
   ═══════════════════════════════════════════════════════════════ */
export type ChartType =
  | "donut"
  | "pie"
  | "bar"
  | "treemap"
  | "line"
  | "area";

/** Which chart types are valid for each data shape.
 *  Order matters — first entry is the default recommendation. */
export const CHART_TYPES_FOR_SHAPE: Record<DataShape["kind"], ChartType[]> = {
  composition: ["donut", "bar", "treemap"],
  categorical: ["bar", "donut", "treemap"],
  timeseries: ["line", "area", "bar"],
};

export const CHART_LABELS: Record<ChartType, string> = {
  donut: "Donut",
  pie: "Pie",
  bar: "Bar",
  treemap: "Treemap",
  line: "Line",
  area: "Area",
};

export const CHART_ICONS: Record<ChartType, typeof BarChart3> = {
  donut: PieChart,
  pie: PieChart,
  bar: BarChart3,
  treemap: LayoutGrid,
  line: LineIcon,
  area: AreaChart,
};

/* ═══════════════════════════════════════════════════════════════
   ChartSwitcher — dropdown
   ═══════════════════════════════════════════════════════════════ */
export function ChartSwitcher({
  types,
  current,
  onChange,
}: {
  types: ChartType[];
  current: ChartType;
  onChange: (t: ChartType) => void;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement | null>(null);
  const CurrentIcon = CHART_ICONS[current];

  // Close when clicking outside
  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  // If there's only one valid type, hide the switcher
  if (types.length <= 1) return null;

  return (
    <div ref={ref} className="relative inline-block">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="text-[11px] font-semibold flex items-center gap-1.5 px-2.5 py-1.5 rounded-md cursor-pointer transition-colors"
        style={{
          background: "var(--bg-hover)",
          border: "1px solid var(--border)",
          color: "var(--text-2)",
        }}
        aria-haspopup="listbox"
        aria-expanded={open}
      >
        <CurrentIcon size={12} />
        <span>View as {CHART_LABELS[current]}</span>
        <motion.span animate={{ rotate: open ? 180 : 0 }} transition={{ duration: 0.2 }}>
          <ChevronDown size={10} />
        </motion.span>
      </button>
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.12 }}
            className="absolute top-full right-0 mt-1 rounded-lg overflow-hidden z-20 min-w-[160px]"
            style={{
              background: "var(--bg-surface)",
              border: "1px solid var(--border)",
              boxShadow: "0 4px 20px rgba(0,0,0,0.35)",
            }}
            role="listbox"
          >
            {types.map((t) => {
              const Icon = CHART_ICONS[t];
              const active = t === current;
              return (
                <button
                  key={t}
                  type="button"
                  onClick={() => {
                    onChange(t);
                    setOpen(false);
                  }}
                  className="flex items-center gap-2 px-3 py-2 text-[12px] w-full text-left cursor-pointer transition-colors"
                  style={{
                    background: active ? "var(--bg-hover)" : "transparent",
                    color: active ? "var(--green)" : "var(--text-2)",
                  }}
                  role="option"
                  aria-selected={active}
                >
                  <Icon size={14} />
                  <span className="flex-1">{CHART_LABELS[t]}</span>
                  {active && <Check size={12} style={{ color: "var(--green)" }} />}
                </button>
              );
            })}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   ChartRenderer — the router
   ═══════════════════════════════════════════════════════════════
   Usage:
     <ChartRenderer shape={dataShape} />
     <ChartRenderer shape={dataShape} defaultType="treemap" />
   ═══════════════════════════════════════════════════════════════ */
export function ChartRenderer({
  shape,
  defaultType,
}: {
  shape: DataShape;
  defaultType?: ChartType;
}) {
  const availableTypes = CHART_TYPES_FOR_SHAPE[shape.kind];
  const [current, setCurrent] = useState<ChartType>(
    defaultType && availableTypes.includes(defaultType)
      ? defaultType
      : availableTypes[0]
  );

  return (
    <div
      className="rounded-xl p-4"
      style={{
        background: "var(--bg-surface)",
        border: "1px solid var(--border)",
      }}
    >
      {/* Header with title + switcher */}
      <div className="flex items-start justify-between gap-3 mb-3 flex-wrap">
        <div className="min-w-0">
          <p className="text-sm font-bold truncate" style={{ color: "var(--text-1)" }}>
            {shape.title}
          </p>
          {shape.subtitle && (
            <p className="text-[11px]" style={{ color: "var(--text-4)" }}>
              {shape.subtitle}
            </p>
          )}
        </div>
        <ChartSwitcher
          types={availableTypes}
          current={current}
          onChange={setCurrent}
        />
      </div>

      {/* Body — routed chart */}
      <div>{renderByShape(shape, current)}</div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   Routing — data shape + chart type → concrete component
   ═══════════════════════════════════════════════════════════════ */
function renderByShape(shape: DataShape, type: ChartType): React.ReactElement {
  if (shape.kind === "composition") {
    const currency = shape.currency ?? true;
    const donutData: DonutSlice[] = shape.parts.map((p, i) => ({
      label: p.label,
      value: p.value,
      color: p.color ?? defaultColor(i),
    }));
    const barData: BarDatum[] = shape.parts.map((p, i) => ({
      label: p.label,
      value: p.value,
      color: p.color ?? defaultColor(i),
    }));
    switch (type) {
      case "donut":
      case "pie":
        return (
          <ChatDonut
            data={donutData}
            size={220}
            centerValue={
              shape.total !== undefined
                ? currency
                  ? fmtCompact(shape.total)
                  : shape.total.toLocaleString("en-IN")
                : undefined
            }
            centerLabel={shape.total !== undefined ? "Total" : undefined}
          />
        );
      case "bar":
        return <ChatBarChart data={barData} currency={currency} />;
      case "treemap":
        return (
          <CompositionTreemap
            data={shape.parts.map((p, i) => ({
              name: p.label,
              value: p.value,
              color: p.color ?? defaultColor(i),
            }))}
            height={320}
            currency={currency}
          />
        );
      default:
        return <ChatDonut data={donutData} />;
    }
  }

  if (shape.kind === "categorical") {
    const currency = shape.currency ?? true;
    const donutData: DonutSlice[] = shape.entries.map((e, i) => ({
      label: e.label,
      value: e.value,
      color: e.color ?? defaultColor(i),
    }));
    const barData: BarDatum[] = shape.entries.map((e, i) => ({
      label: e.label,
      value: e.value,
      color: e.color ?? defaultColor(i),
      caption: e.caption,
    }));
    switch (type) {
      case "bar":
        return <ChatBarChart data={barData} currency={currency} />;
      case "donut":
      case "pie":
        return (
          <ChatDonut data={donutData} size={220} />
        );
      case "treemap":
        return (
          <CompositionTreemap
            data={shape.entries.map((e, i) => ({
              name: e.label,
              value: e.value,
              color: e.color ?? defaultColor(i),
            }))}
            height={320}
            currency={currency}
          />
        );
      default:
        return <ChatBarChart data={barData} currency={currency} />;
    }
  }

  if (shape.kind === "timeseries") {
    const lineData: LinePoint[] = shape.points;
    switch (type) {
      case "line":
        return (
          <ChatLineChart
            data={lineData}
            color={shape.color ?? "var(--green)"}
            showArea={false}
            highlight={shape.highlight}
            height={220}
          />
        );
      case "area":
        return (
          <ChatLineChart
            data={lineData}
            color={shape.color ?? "var(--green)"}
            showArea={true}
            highlight={shape.highlight}
            height={220}
          />
        );
      case "bar":
        return (
          <ChatBarChart
            data={shape.points.map((pt) => ({
              label: pt.x,
              value: pt.y,
              color: shape.color ?? "var(--green)",
            }))}
            currency={true}
          />
        );
      default:
        return (
          <ChatLineChart
            data={lineData}
            color={shape.color ?? "var(--green)"}
            showArea
            height={220}
          />
        );
    }
  }

  // Unreachable (exhaustive above) but TS wants it.
  return <div />;
}

/* ── Color helpers ───────────────────────────────────────────── */
const DEFAULT_PALETTE = [
  "var(--green)",
  "var(--blue)",
  "var(--purple)",
  "var(--orange)",
  "var(--yellow)",
  "var(--red)",
  "var(--green-dark)",
  "var(--text-4)",
];
function defaultColor(i: number): string {
  return DEFAULT_PALETTE[i % DEFAULT_PALETTE.length];
}

function fmtCompact(v: number): string {
  const abs = Math.abs(v);
  const sign = v < 0 ? "-" : "";
  if (abs >= 1e7) return `${sign}₹${(abs / 1e7).toFixed(2)}Cr`;
  if (abs >= 1e5) return `${sign}₹${(abs / 1e5).toFixed(1)}L`;
  if (abs >= 1e3) return `${sign}₹${(abs / 1e3).toFixed(0)}K`;
  return `${sign}₹${abs}`;
}

/* ═══════════════════════════════════════════════════════════════
   Shape recommendation — hints for auto-picking a chart type
   based on data characteristics (used by RESULT_RENDERERS where
   we want a specific default per intent).
   ═══════════════════════════════════════════════════════════════ */
export function recommendChartType(shape: DataShape): ChartType {
  switch (shape.kind) {
    case "composition":
      return shape.parts.length > 8 ? "treemap" : "donut";
    case "categorical":
      return shape.entries.length > 6 ? "bar" : "bar";
    case "timeseries":
      return "line";
  }
}
