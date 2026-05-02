"use client";

/* ═══════════════════════════════════════════════════════════════
   DeadStockTreemap — ECharts-powered treemap for dead inventory
   ═══════════════════════════════════════════════════════════════
   Why a treemap: dead stock is hierarchical (Category → SKU) and
   each item has a scalar (locked capital). A treemap lets the
   founder see at a glance:
     • which category holds the most locked cash (big block)
     • which specific SKUs are the worst offenders (big tile)
     • how old they are (color from yellow to deep red)

   Contrast with the donut+bar we show on mobile: those work for
   summary but treemap is denser and better for drill-down. Perfect
   for the desktop Result panel where we have real estate.

   Clicking a tile dispatches a liquidation question into Chat via
   the onAsk prop.
   ═══════════════════════════════════════════════════════════════ */

import { useMemo } from "react";
import { DEAD_STOCK, DEAD_STOCK_SUMMARY } from "@/lib/data";
import {
  EChartsBase,
  useRikoPalette,
  rikoChartDefaults,
  fmtINR,
} from "./echart-base";

interface DeadStockTreemapProps {
  height?: number;
  onAsk?: (question: string) => void;
}

/** Age-based color map. Newer slow-moving → yellow, older → red. */
function ageColor(lastSold: string, palette: ReturnType<typeof useRikoPalette>): string {
  // Very rough — parses "8 months ago", "2 years ago", "5 months ago"
  const yearsMatch = lastSold.match(/(\d+)\s*year/);
  const monthsMatch = lastSold.match(/(\d+)\s*month/);
  const years = yearsMatch ? parseInt(yearsMatch[1], 10) : 0;
  const months = monthsMatch ? parseInt(monthsMatch[1], 10) : 0;
  const totalMonths = years * 12 + months;
  if (totalMonths >= 18) return palette.red;
  if (totalMonths >= 9) return palette.orange;
  return palette.yellow;
}

export function DeadStockTreemap({ height = 420, onAsk }: DeadStockTreemapProps) {
  const palette = useRikoPalette();

  /* Build hierarchical data: Category → SKU leaf. Each leaf has value=locked capital. */
  const data = useMemo(() => {
    const byCategory: Record<
      string,
      { name: string; value: number; children: { name: string; value: number; sku: string; itemStyle: { color: string }; lastSold: string }[] }
    > = {};

    for (const item of DEAD_STOCK) {
      if (!byCategory[item.category]) {
        byCategory[item.category] = {
          name: item.category,
          value: 0,
          children: [],
        };
      }
      byCategory[item.category].value += item.value;
      byCategory[item.category].children.push({
        name: item.name,
        value: item.value,
        sku: item.sku,
        lastSold: item.lastSold,
        itemStyle: { color: ageColor(item.lastSold, palette) },
      });
    }
    return Object.values(byCategory);
  }, [palette]);

  const defaults = rikoChartDefaults(palette);

  const option = useMemo(
    () => ({
      ...defaults,
      tooltip: {
        ...(defaults.tooltip as Record<string, unknown>),
        formatter: (params: unknown) => {
          const p = params as {
            data?: { name?: string; value?: number; sku?: string; lastSold?: string };
          };
          const d = p.data;
          if (!d || typeof d.value !== "number") return "";
          if (d.sku) {
            return `
              <div style="font-weight:600;margin-bottom:4px">${d.name}</div>
              <div style="font-size:11px;color:${palette.text3}">SKU: ${d.sku}</div>
              <div style="font-size:11px;color:${palette.text3}">Last sold: ${d.lastSold ?? "—"}</div>
              <div style="margin-top:6px;font-family:'Space Grotesk',sans-serif;font-weight:700">
                ${fmtINR(d.value)} locked
              </div>
            `;
          }
          return `
            <div style="font-weight:600">${d.name}</div>
            <div style="margin-top:4px;font-family:'Space Grotesk',sans-serif;font-weight:700">
              ${fmtINR(d.value)} total locked
            </div>
          `;
        },
      },
      series: [
        {
          type: "treemap",
          roam: false, // no pan/zoom; keep simple
          nodeClick: "zoomToNode", // zoom in on click
          breadcrumb: {
            show: true,
            top: "bottom",
            itemStyle: {
              color: palette.bg3,
              borderColor: palette.border,
              textStyle: { color: palette.text3, fontSize: 11 },
            },
          },
          // Leaf-tile label (SKU tiles). Uses ECharts rich-text formatter
          // with two styles: `n` for short name, `v` for value below.
          label: {
            show: true,
            position: "inside",
            formatter: (p: { name: string; value: number }) => {
              const short = p.name.length > 22 ? p.name.slice(0, 20) + "…" : p.name;
              return `{n|${short}}\n{v|${fmtINR(p.value)}}`;
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
          // Parent category strip. Plain formatter — rich syntax would
          // render raw here because the upperLabel doesn't inherit the
          // leaf label's `rich` config. Keep it simple.
          upperLabel: {
            show: true,
            height: 22,
            color: palette.text1,
            fontWeight: 700,
            fontSize: 12,
            formatter: (p: { name: string; value: number }) =>
              `${p.name}  ·  ${fmtINR(p.value)}`,
          },
          itemStyle: {
            borderColor: palette.bg1,
            borderWidth: 2,
            gapWidth: 2,
          },
          levels: [
            // Level 0 — virtual root. Hide its upperLabel so the empty
            // "root" strip doesn't render above the categories.
            {
              upperLabel: { show: false },
              itemStyle: {
                borderColor: palette.bg1,
                borderWidth: 3,
                gapWidth: 3,
              },
            },
            // Level 1 — categories. Inherits the series upperLabel
            // formatter (plain text: "Category · ₹X.XL").
            {
              itemStyle: {
                borderColor: palette.bg1,
                borderWidth: 3,
                gapWidth: 3,
              },
            },
            // Level 2 — SKU leaves. Inherits the series label rich
            // formatter (name in `n` style + value in `v` style).
            {
              itemStyle: {
                borderColor: palette.bg2,
                borderWidth: 1,
                gapWidth: 1,
              },
            },
          ],
          data,
        },
      ],
    }),
    [data, defaults, palette]
  );

  const handleClick = (params: unknown) => {
    if (!onAsk) return;
    const p = params as { data?: { name?: string; sku?: string } };
    if (p.data?.sku) {
      onAsk(`What's the liquidation plan for ${p.data.name}?`);
    } else if (p.data?.name) {
      onAsk(`How do I clear dead stock in ${p.data.name}?`);
    }
  };

  return (
    <div
      className="rounded-md p-4"
      style={{ background: "var(--bg-surface)", border: "1px solid var(--border)" }}
    >
      <div className="flex items-start justify-between gap-3 mb-3 flex-wrap">
        <div>
          <p className="text-sm font-bold" style={{ color: "var(--text-1)" }}>
            Dead stock treemap
          </p>
          <p className="text-[11px]" style={{ color: "var(--text-4)" }}>
            Tile size = locked capital · color = age · click to drill in
          </p>
        </div>
        <div className="flex items-center gap-3 text-[10px]" style={{ color: "var(--text-3)" }}>
          <span className="flex items-center gap-1">
            <span
              className="w-2.5 h-2.5 rounded-sm"
              style={{ background: palette.yellow }}
            />
            &lt;9mo
          </span>
          <span className="flex items-center gap-1">
            <span
              className="w-2.5 h-2.5 rounded-sm"
              style={{ background: palette.orange }}
            />
            9-18mo
          </span>
          <span className="flex items-center gap-1">
            <span
              className="w-2.5 h-2.5 rounded-sm"
              style={{ background: palette.red }}
            />
            18mo+
          </span>
        </div>
      </div>

      <EChartsBase
        option={option}
        height={height}
        onEvents={{ click: handleClick }}
      />

      {/* Summary footer */}
      <div
        className="flex items-center justify-between mt-3 pt-3 text-[11px]"
        style={{ borderTop: "1px solid var(--border)" }}
      >
        <span style={{ color: "var(--text-3)" }}>
          {DEAD_STOCK_SUMMARY.totalSkus} SKUs in dead stock
        </span>
        <span
          className="font-bold tabular-nums"
          style={{ color: "var(--red)", fontFamily: "'Space Grotesk', sans-serif" }}
        >
          ₹{(DEAD_STOCK_SUMMARY.totalValue / 1e5).toFixed(1)}L locked · {DEAD_STOCK_SUMMARY.pctOfInventory.toFixed(1)}% of inventory
        </span>
      </div>
    </div>
  );
}
