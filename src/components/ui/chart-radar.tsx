"use client";

/* ═══════════════════════════════════════════════════════════════
   HealthRadar — multi-axis radar (a.k.a. spider) chart
   ═══════════════════════════════════════════════════════════════
   First use: business health dimensions — Profitability / Liquidity
   / Efficiency / Growth, each 0-100. Radar shows the SHAPE of the
   business: a balanced business fills out symmetrically; a lopsided
   one has visible dents you can point at.

   Also works for vendor scorecards, cohort comparisons (overlay two
   polygons), etc.
   ═══════════════════════════════════════════════════════════════ */

import { useMemo } from "react";
import {
  EChartsBase,
  useRikoPalette,
  rikoChartDefaults,
  resolveCssVar,
} from "./echart-base";

export interface RadarAxis {
  name: string;
  max: number;
}

export function HealthRadar({
  axes,
  values,
  height = 320,
  seriesName = "Score",
  areaColor,
}: {
  axes: RadarAxis[];
  values: number[];
  height?: number;
  seriesName?: string;
  /** Fallback to green. */
  areaColor?: string;
}) {
  const palette = useRikoPalette();
  const defaults = rikoChartDefaults(palette);
  // Resolve the color eagerly — ECharts can't parse var(--xxx).
  const color = resolveCssVar(areaColor) ?? palette.green;

  const option = useMemo(
    () => ({
      ...defaults,
      tooltip: {
        ...(defaults.tooltip as Record<string, unknown>),
        trigger: "item",
        formatter: (params: unknown) => {
          const p = params as { value?: number[]; name?: string };
          if (!p.value) return "";
          const rows = axes
            .map((a, i) => {
              const v = p.value?.[i] ?? 0;
              const pct = ((v / a.max) * 100).toFixed(0);
              return `
                <div style="display:flex;justify-content:space-between;gap:12px;font-size:11px">
                  <span style="color:${palette.text3}">${a.name}</span>
                  <span style="font-family:'Space Grotesk',sans-serif;font-weight:700">
                    ${v}<span style="color:${palette.text4};font-weight:500">/${a.max}</span>
                    <span style="color:${palette.text4};margin-left:4px">(${pct}%)</span>
                  </span>
                </div>
              `;
            })
            .join("");
          return `
            <div style="font-weight:600;margin-bottom:6px">${p.name ?? seriesName}</div>
            ${rows}
          `;
        },
      },
      radar: {
        indicator: axes.map((a) => ({ name: a.name, max: a.max })),
        shape: "polygon",
        axisName: {
          color: palette.text2,
          fontSize: 11,
          fontWeight: 500,
          fontFamily: "'Inter', system-ui, sans-serif",
        },
        splitLine: { lineStyle: { color: palette.border, opacity: 0.4 } },
        splitArea: {
          show: true,
          areaStyle: {
            color: [
              "transparent",
              `color-mix(in srgb, ${palette.bg3} 40%, transparent)`,
            ],
          },
        },
        axisLine: { lineStyle: { color: palette.border, opacity: 0.6 } },
      },
      series: [
        {
          type: "radar",
          name: seriesName,
          data: [
            {
              value: values,
              name: seriesName,
              areaStyle: { color, opacity: 0.25 },
              lineStyle: { color, width: 2 },
              itemStyle: { color, borderColor: palette.bg1, borderWidth: 2 },
              symbol: "circle",
              symbolSize: 7,
            },
          ],
        },
      ],
    }),
    [axes, values, color, defaults, palette, seriesName]
  );

  return <EChartsBase option={option} height={height} />;
}
