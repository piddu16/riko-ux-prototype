"use client";

/* ═══════════════════════════════════════════════════════════════
   CustomerScatter — 2D plot with optional size + color dimension
   ═══════════════════════════════════════════════════════════════
   First use: customer LTV vs recency. Each dot = one customer.
     x = days since last order (lower = more active)
     y = lifetime value (higher = more valuable)
     size = order count (optional third dim)
     color = channel category

   Four quadrants tell the story:
     • top-left:  active + high LTV  → double down
     • top-right: dormant + high LTV → re-engage campaign
     • bot-left:  active + low LTV   → upsell candidates
     • bot-right: lost causes        → ignore
   ═══════════════════════════════════════════════════════════════ */

import { useMemo } from "react";
import {
  EChartsBase,
  useRikoPalette,
  rikoChartDefaults,
  fmtINR,
} from "./echart-base";

export interface ScatterPoint {
  x: number;
  y: number;
  label: string;
  /** Optional visual size driver (e.g. order count). If missing, uniform dots. */
  size?: number;
  /** Optional categorical color key — points with same category get same color. */
  category?: string;
  color?: string;
}

export function CustomerScatter({
  points,
  xLabel = "X",
  yLabel = "Y",
  height = 360,
  yIsCurrency = true,
  xIsCurrency = false,
  asBubble = true,
}: {
  points: ScatterPoint[];
  xLabel?: string;
  yLabel?: string;
  height?: number;
  yIsCurrency?: boolean;
  xIsCurrency?: boolean;
  /** Scale dots by their `size` field. Otherwise use uniform sizing. */
  asBubble?: boolean;
}) {
  const palette = useRikoPalette();
  const defaults = rikoChartDefaults(palette);

  /* Group by category so ECharts can render one series per category
     (gives us automatic legend + color). */
  const series = useMemo(() => {
    const byCategory: Record<string, ScatterPoint[]> = {};
    for (const p of points) {
      const k = p.category ?? "All";
      if (!byCategory[k]) byCategory[k] = [];
      byCategory[k].push(p);
    }
    const maxSize = Math.max(...points.map((p) => p.size ?? 1), 1);

    const palette9 = [
      palette.green, palette.blue, palette.purple, palette.orange,
      palette.yellow, palette.red, palette.greenDark, palette.text3,
    ];

    return Object.entries(byCategory).map(([cat, pts], i) => ({
      name: cat,
      type: "scatter" as const,
      data: pts.map((p) => ({
        value: [p.x, p.y, p.size ?? 1, p.label],
        itemStyle: p.color ? { color: p.color } : undefined,
      })),
      symbolSize: (val: (number | string)[]) => {
        if (!asBubble) return 10;
        const sizeVal = typeof val[2] === "number" ? val[2] : 1;
        // Map size onto 8-28px range
        return 8 + (sizeVal / maxSize) * 20;
      },
      itemStyle: {
        color: palette9[i % palette9.length],
        opacity: 0.75,
        borderColor: palette.bg1,
        borderWidth: 1,
      },
      emphasis: {
        itemStyle: {
          opacity: 1,
          borderWidth: 2,
          shadowBlur: 8,
          shadowColor: "rgba(0,0,0,0.3)",
        },
      },
    }));
  }, [points, palette, asBubble]);

  const option = useMemo(
    () => ({
      ...defaults,
      grid: { left: 56, right: 20, top: 20, bottom: 44 },
      legend: {
        show: series.length > 1,
        top: 0,
        textStyle: { color: palette.text3, fontSize: 11 },
        itemWidth: 10,
        itemHeight: 10,
      },
      xAxis: {
        type: "value",
        name: xLabel,
        nameLocation: "middle",
        nameGap: 28,
        nameTextStyle: { color: palette.text4, fontSize: 11 },
        axisLine: { lineStyle: { color: palette.border } },
        axisLabel: {
          color: palette.text3,
          fontSize: 10,
          formatter: (v: number) =>
            xIsCurrency ? `₹${(v / 1e5).toFixed(0)}L` : String(v),
        },
        splitLine: { lineStyle: { color: palette.border, opacity: 0.4 } },
      },
      yAxis: {
        type: "value",
        name: yLabel,
        nameLocation: "middle",
        nameGap: 40,
        nameTextStyle: { color: palette.text4, fontSize: 11 },
        axisLine: { lineStyle: { color: palette.border } },
        axisLabel: {
          color: palette.text3,
          fontSize: 10,
          formatter: (v: number) =>
            yIsCurrency ? `₹${(v / 1e5).toFixed(0)}L` : String(v),
        },
        splitLine: { lineStyle: { color: palette.border, opacity: 0.4 } },
      },
      tooltip: {
        ...(defaults.tooltip as Record<string, unknown>),
        trigger: "item",
        formatter: (params: unknown) => {
          const p = params as {
            seriesName?: string;
            data?: { value?: (number | string)[] };
          };
          const v = p.data?.value;
          if (!Array.isArray(v)) return "";
          const [x, y, size, label] = v;
          return `
            <div style="font-weight:600;margin-bottom:4px">${label}</div>
            <div style="font-size:11px;color:${palette.text3}">
              ${p.seriesName ?? ""}
            </div>
            <div style="display:grid;grid-template-columns:auto auto;gap:2px 10px;margin-top:4px;font-size:11px">
              <span style="color:${palette.text4}">${xLabel}</span>
              <span style="font-family:'Space Grotesk',sans-serif;font-weight:600">
                ${xIsCurrency ? fmtINR(x as number) : x}
              </span>
              <span style="color:${palette.text4}">${yLabel}</span>
              <span style="font-family:'Space Grotesk',sans-serif;font-weight:600">
                ${yIsCurrency ? fmtINR(y as number) : y}
              </span>
              ${asBubble ? `
                <span style="color:${palette.text4}">Size</span>
                <span style="font-family:'Space Grotesk',sans-serif;font-weight:600">
                  ${size}
                </span>
              ` : ""}
            </div>
          `;
        },
      },
      series,
    }),
    [defaults, palette, series, xLabel, yLabel, yIsCurrency, xIsCurrency, asBubble]
  );

  return <EChartsBase option={option} height={height} />;
}
