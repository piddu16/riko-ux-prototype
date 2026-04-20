"use client";

/* ═══════════════════════════════════════════════════════════════
   MoneyFlowSankey — flow diagram where link width = amount
   ═══════════════════════════════════════════════════════════════
   Complements the CausalChain DAG on the dashboard. Sankey shows
   the SAME flow (revenue → gross → EBITDA → net P&L) but with
   proportional ribbon widths, making relative magnitudes obvious
   at a glance. "Marketing is half the total spend" jumps out here
   in a way it doesn't in a causal graph.

   Input: { nodes: [{ name, category? }], links: [{ source, target, value }] }
   category is used for coloring. Optional.
   ═══════════════════════════════════════════════════════════════ */

import { useMemo } from "react";
import {
  EChartsBase,
  useRikoPalette,
  rikoChartDefaults,
  fmtINR,
} from "./echart-base";

export type SankeyNodeCategory =
  | "source"
  | "total"
  | "deduction"
  | "result";

export interface SankeyNode {
  name: string;
  category?: SankeyNodeCategory;
}

export interface SankeyLink {
  source: string;
  target: string;
  value: number;
}

export function MoneyFlowSankey({
  nodes,
  links,
  height = 420,
}: {
  nodes: SankeyNode[];
  links: SankeyLink[];
  height?: number;
}) {
  const palette = useRikoPalette();
  const defaults = rikoChartDefaults(palette);

  const option = useMemo(
    () => {
      const colorFor = (cat?: SankeyNodeCategory): string => {
        switch (cat) {
          case "source": return palette.blue;
          case "total": return palette.green;
          case "deduction": return palette.red;
          case "result": return palette.yellow;
          default: return palette.text3;
        }
      };
      return {
      ...defaults,
      tooltip: {
        ...(defaults.tooltip as Record<string, unknown>),
        trigger: "item",
        formatter: (params: unknown) => {
          const p = params as {
            dataType?: "node" | "edge";
            data?: { name?: string; source?: string; target?: string; value?: number };
          };
          if (p.dataType === "edge" && p.data) {
            return `
              <div style="font-weight:600">${p.data.source} → ${p.data.target}</div>
              <div style="margin-top:4px;font-family:'Space Grotesk',sans-serif;font-weight:700">
                ${fmtINR(p.data.value ?? 0)}
              </div>
            `;
          }
          if (p.dataType === "node" && p.data) {
            return `<div style="font-weight:600">${p.data.name}</div>`;
          }
          return "";
        },
      },
      series: [
        {
          type: "sankey",
          left: 20,
          right: 100,
          top: 16,
          bottom: 16,
          nodeWidth: 14,
          nodeGap: 10,
          layoutIterations: 32,
          emphasis: { focus: "adjacency" },
          data: nodes.map((n) => ({
            name: n.name,
            itemStyle: { color: colorFor(n.category), borderColor: palette.bg1 },
          })),
          links: links.map((l) => ({
            source: l.source,
            target: l.target,
            value: Math.abs(l.value), // sankey only handles positive
            lineStyle: {
              color: "gradient",
              opacity: 0.55,
              curveness: 0.5,
            },
          })),
          label: {
            color: palette.text2,
            fontSize: 11,
            fontFamily: "'Inter', system-ui, sans-serif",
          },
          lineStyle: {
            color: "gradient",
            curveness: 0.5,
          },
        },
      ],
    };
    },
    [nodes, links, defaults, palette]
  );

  return <EChartsBase option={option} height={height} />;
}
