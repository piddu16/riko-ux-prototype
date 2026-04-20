"use client";

/* ═══════════════════════════════════════════════════════════════
   CohortHeatmap — row × column matrix as a color-graded heatmap
   ═══════════════════════════════════════════════════════════════
   First use: cohort retention (rows = acquisition cohorts,
   cols = tenure periods, cells = % retained). Also works for
   any matrix: vendor-by-month payment timeliness, channel-by-
   category returns rate, etc.
   ═══════════════════════════════════════════════════════════════ */

import { useMemo } from "react";
import {
  EChartsBase,
  useRikoPalette,
  rikoChartDefaults,
} from "./echart-base";

export interface CohortHeatmapProps {
  rows: string[];
  cols: string[];
  values: number[][]; // values[rowIdx][colIdx]
  height?: number;
  format?: "percent" | "currency" | "number";
  /** Color ramp direction — higher = better (green) or higher = worse (red) */
  colorDirection?: "higher-better" | "higher-worse";
}

function fmtCell(v: number | null, format: "percent" | "currency" | "number"): string {
  if (v === null || v === undefined || Number.isNaN(v)) return "";
  if (format === "percent") return `${v.toFixed(0)}%`;
  if (format === "currency") {
    const abs = Math.abs(v);
    if (abs >= 1e7) return `${(abs / 1e7).toFixed(1)}Cr`;
    if (abs >= 1e5) return `${(abs / 1e5).toFixed(1)}L`;
    if (abs >= 1e3) return `${(abs / 1e3).toFixed(0)}K`;
    return `${abs.toFixed(0)}`;
  }
  return v.toFixed(0);
}

export function CohortHeatmap({
  rows,
  cols,
  values,
  height = 320,
  format = "percent",
  colorDirection = "higher-better",
}: CohortHeatmapProps) {
  const palette = useRikoPalette();
  const defaults = rikoChartDefaults(palette);

  /* Flatten values to ECharts heatmap format: [[colIdx, rowIdx, value], ...].
     Null/missing values omitted (renders as empty cell). Also compute min/max
     for the visual scale. */
  const { data, min, max } = useMemo(() => {
    const pts: [number, number, number][] = [];
    let lo = Infinity;
    let hi = -Infinity;
    for (let r = 0; r < rows.length; r++) {
      for (let c = 0; c < cols.length; c++) {
        const v = values[r]?.[c];
        if (v === undefined || v === null || Number.isNaN(v)) continue;
        pts.push([c, r, v]);
        if (v < lo) lo = v;
        if (v > hi) hi = v;
      }
    }
    return { data: pts, min: lo === Infinity ? 0 : lo, max: hi === -Infinity ? 100 : hi };
  }, [rows, cols, values]);

  const option = useMemo(
    () => {
      const inRange =
        colorDirection === "higher-better"
          ? [palette.bg3, palette.yellow, palette.green]
          : [palette.green, palette.yellow, palette.red];
      return {
      ...defaults,
      grid: {
        left: 80,
        right: 20,
        top: 20,
        bottom: 40,
        containLabel: false,
      },
      xAxis: {
        type: "category",
        data: cols,
        splitArea: { show: false },
        axisTick: { show: false },
        axisLine: { lineStyle: { color: palette.border } },
        axisLabel: { color: palette.text3, fontSize: 11 },
      },
      yAxis: {
        type: "category",
        data: rows,
        splitArea: { show: false },
        axisTick: { show: false },
        axisLine: { lineStyle: { color: palette.border } },
        axisLabel: { color: palette.text3, fontSize: 11 },
        inverse: true, // oldest cohort at top
      },
      visualMap: {
        min,
        max,
        calculable: false,
        show: true,
        orient: "horizontal",
        left: "center",
        bottom: 0,
        itemWidth: 12,
        itemHeight: 140,
        textStyle: { color: palette.text4, fontSize: 10 },
        inRange: { color: inRange },
      },
      tooltip: {
        ...(defaults.tooltip as Record<string, unknown>),
        position: "top",
        formatter: (params: unknown) => {
          const p = params as { data?: [number, number, number] };
          const d = p.data;
          if (!d) return "";
          const [colIdx, rowIdx, v] = d;
          return `
            <div style="font-weight:600;margin-bottom:2px">${rows[rowIdx]}</div>
            <div style="font-size:11px;color:${palette.text3};margin-bottom:4px">
              ${cols[colIdx]}
            </div>
            <div style="font-family:'Space Grotesk',sans-serif;font-weight:700">
              ${fmtCell(v, format)}
            </div>
          `;
        },
      },
      series: [
        {
          type: "heatmap",
          data,
          label: {
            show: true,
            color: "#fff",
            fontSize: 10,
            fontWeight: 600,
            fontFamily: "'Space Grotesk', sans-serif",
            formatter: (p: { data: [number, number, number] }) =>
              fmtCell(p.data[2], format),
          },
          itemStyle: { borderColor: palette.bg1, borderWidth: 1 },
          emphasis: {
            itemStyle: {
              shadowBlur: 10,
              shadowColor: "rgba(0,0,0,0.5)",
            },
          },
        },
      ],
    };
    },
    [cols, data, defaults, format, colorDirection, max, min, palette, rows]
  );

  return <EChartsBase option={option} height={height} />;
}
