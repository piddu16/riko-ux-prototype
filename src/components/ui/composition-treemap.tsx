"use client";

/* ═══════════════════════════════════════════════════════════════
   CompositionTreemap — flat (1-level) treemap for composition data
   ═══════════════════════════════════════════════════════════════
   Different from DeadStockTreemap (which is hierarchical
   Category → SKU). This one just takes flat parts with a value
   each and renders them sized proportionally.

   Used when ChartSwitcher toggles a composition-shaped dataset
   (Expense breakdown, parts of total revenue, etc.) into treemap
   view.
   ═══════════════════════════════════════════════════════════════ */

import { useMemo } from "react";
import {
  EChartsBase,
  useRikoPalette,
  rikoChartDefaults,
  fmtINR,
  resolveCssVar,
} from "./echart-base";

export interface TreemapSlice {
  name: string;
  value: number;
  /** Explicit color; if missing we use the default Riko sequence. */
  color?: string;
}

export function CompositionTreemap({
  data,
  height = 320,
  currency = true,
}: {
  data: TreemapSlice[];
  height?: number;
  currency?: boolean;
}) {
  const palette = useRikoPalette();
  const defaults = rikoChartDefaults(palette);

  const option = useMemo(
    () => ({
      ...defaults,
      tooltip: {
        ...(defaults.tooltip as Record<string, unknown>),
        formatter: (params: unknown) => {
          const p = params as { data?: { name?: string; value?: number } };
          const d = p.data;
          if (!d || typeof d.value !== "number") return "";
          const formatted = currency
            ? fmtINR(d.value)
            : d.value.toLocaleString("en-IN");
          const total = data.reduce((s, x) => s + x.value, 0);
          const pct = total > 0 ? ((d.value / total) * 100).toFixed(1) : "0";
          return `
            <div style="font-weight:600;margin-bottom:4px">${d.name}</div>
            <div style="font-family:'Space Grotesk',sans-serif;font-weight:700">
              ${formatted}
              <span style="color:${palette.text4};font-weight:500;margin-left:4px">
                ${pct}%
              </span>
            </div>
          `;
        },
      },
      series: [
        {
          type: "treemap",
          roam: false,
          nodeClick: false,
          breadcrumb: { show: false },
          label: {
            show: true,
            formatter: (p: { name: string; value: number }) => {
              const short = p.name.length > 18 ? p.name.slice(0, 16) + "…" : p.name;
              const formatted = currency
                ? fmtINR(p.value)
                : p.value.toLocaleString("en-IN");
              return `{n|${short}}\n{v|${formatted}}`;
            },
            rich: {
              n: {
                fontSize: 11,
                color: "#fff",
                fontWeight: 500,
                lineHeight: 14,
              },
              v: {
                fontSize: 13,
                color: "#fff",
                fontWeight: 700,
                fontFamily: "'Space Grotesk', sans-serif",
                lineHeight: 18,
              },
            },
          },
          itemStyle: {
            borderColor: palette.bg1,
            borderWidth: 2,
            gapWidth: 2,
          },
          data: data.map((d, i) => ({
            name: d.name,
            value: d.value,
            itemStyle: {
              // Resolve CSS custom props (var(--blue)) to hex before
              // handing to ECharts — it doesn't parse them natively.
              color:
                resolveCssVar(d.color) ??
                [
                  palette.green,
                  palette.blue,
                  palette.purple,
                  palette.orange,
                  palette.yellow,
                  palette.red,
                  palette.greenDark,
                  palette.text3,
                ][i % 8],
            },
          })),
        },
      ],
    }),
    [data, defaults, palette, currency]
  );

  return <EChartsBase option={option} height={height} />;
}
