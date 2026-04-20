"use client";

/* ═══════════════════════════════════════════════════════════════
   EChartsBase — tree-shaken ECharts wrapper for Riko
   ═══════════════════════════════════════════════════════════════
   Imports only the chart types + components we actually use
   (keeps bundle lean ~150KB gz instead of ~450KB full bundle).

   Handles:
   • SSR safety (echarts touches window — we bail on server render)
   • Dark/light theme reactivity (re-reads CSS vars when theme changes)
   • Auto-resize via ResizeObserver
   • CSS-variable → ECharts option bridge
   ═══════════════════════════════════════════════════════════════ */

import { useEffect, useRef, useState } from "react";
import * as echarts from "echarts/core";
import {
  TreemapChart,
  HeatmapChart,
  SankeyChart,
  RadarChart,
  ScatterChart,
  SunburstChart,
} from "echarts/charts";
import {
  TooltipComponent,
  GridComponent,
  LegendComponent,
  TitleComponent,
  VisualMapComponent,
  DataZoomComponent,
} from "echarts/components";
import { CanvasRenderer } from "echarts/renderers";

// Register modules ONCE at module load (idempotent).
echarts.use([
  TreemapChart,
  HeatmapChart,
  SankeyChart,
  RadarChart,
  ScatterChart,
  SunburstChart,
  TooltipComponent,
  GridComponent,
  LegendComponent,
  TitleComponent,
  VisualMapComponent,
  DataZoomComponent,
  CanvasRenderer,
]);

/* ── Read CSS vars from :root / [data-theme="light"] ────────────
   CSS custom properties don't exist in JS-land until we ask the
   DOM. We snapshot them into a plain object so ECharts can use
   resolved hex values in tooltips, axis, etc. Re-snapshots when
   the user toggles theme. */
export interface RikoPalette {
  bg1: string; // primary bg
  bg2: string; // secondary (card)
  bg3: string; // surface (elevated)
  border: string;
  text1: string;
  text2: string;
  text3: string;
  text4: string;
  green: string;
  greenDark: string;
  red: string;
  yellow: string;
  blue: string;
  orange: string;
  purple: string;
}

function readPalette(): RikoPalette {
  if (typeof window === "undefined") {
    // Server fallback — never actually rendered but keeps types happy.
    return {
      bg1: "#0F1117", bg2: "#1A1F2E", bg3: "#242937",
      border: "#334155",
      text1: "#F8FAFC", text2: "#CBD5E1", text3: "#94A3B8", text4: "#64748B",
      green: "#22C55E", greenDark: "#16A34A",
      red: "#EF4444", yellow: "#F59E0B",
      blue: "#3B82F6", orange: "#F97316", purple: "#A855F7",
    };
  }
  const root = getComputedStyle(document.documentElement);
  const get = (name: string) => root.getPropertyValue(name).trim();
  return {
    bg1: get("--bg-primary"),
    bg2: get("--bg-secondary"),
    bg3: get("--bg-surface"),
    border: get("--border"),
    text1: get("--text-1"),
    text2: get("--text-2"),
    text3: get("--text-3"),
    text4: get("--text-4"),
    green: get("--green"),
    greenDark: get("--green-dark"),
    red: get("--red"),
    yellow: get("--yellow"),
    blue: get("--blue"),
    orange: get("--orange"),
    purple: get("--purple"),
  };
}

/* ── Hook: returns current Riko palette, re-reads on theme change ── */
export function useRikoPalette(): RikoPalette {
  const [palette, setPalette] = useState<RikoPalette>(() => readPalette());

  useEffect(() => {
    // Initial read (in case SSR snapshot was wrong)
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setPalette(readPalette());

    // Observe theme changes: our theme toggle flips data-theme on <html>
    const obs = new MutationObserver(() => setPalette(readPalette()));
    obs.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["data-theme", "class"],
    });
    return () => obs.disconnect();
  }, []);

  return palette;
}

/* ── Base renderer ──────────────────────────────────────────────
   Pass an ECharts `option` object and a height. We handle:
   - Mount only on client
   - Auto-resize via ResizeObserver
   - Cleanup on unmount */
export function EChartsBase({
  option,
  height = 320,
  className,
  onEvents,
}: {
  option: echarts.EChartsCoreOption;
  height?: number | string;
  className?: string;
  onEvents?: Record<string, (params: unknown) => void>;
}) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const instanceRef = useRef<echarts.ECharts | null>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    // Client-only flag — needed because echarts.init touches window.
    // One-shot mount, no cascading renders, safe to ignore the rule.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setMounted(true);
  }, []);

  // Init / update chart
  useEffect(() => {
    if (!mounted || !containerRef.current) return;

    if (!instanceRef.current) {
      instanceRef.current = echarts.init(containerRef.current, undefined, {
        renderer: "canvas",
      });
    }
    instanceRef.current.setOption(option, true);

    // Attach event handlers
    if (onEvents) {
      for (const [event, handler] of Object.entries(onEvents)) {
        instanceRef.current.off(event);
        instanceRef.current.on(event, handler);
      }
    }

    // Auto-resize on container size change
    const ro = new ResizeObserver(() => {
      instanceRef.current?.resize();
    });
    ro.observe(containerRef.current);

    return () => {
      ro.disconnect();
    };
  }, [mounted, option, onEvents]);

  // Dispose on unmount
  useEffect(() => {
    return () => {
      instanceRef.current?.dispose();
      instanceRef.current = null;
    };
  }, []);

  // Server / pre-mount: render a placeholder to avoid layout shift
  if (!mounted) {
    return (
      <div
        className={className}
        style={{
          height,
          width: "100%",
          background: "var(--bg-surface)",
          border: "1px solid var(--border)",
          borderRadius: 12,
        }}
      />
    );
  }

  return (
    <div
      ref={containerRef}
      className={className}
      style={{ height, width: "100%" }}
    />
  );
}

/* ── Common option defaults that every Riko ECharts instance uses ── */
export function rikoChartDefaults(palette: RikoPalette): echarts.EChartsCoreOption {
  return {
    backgroundColor: "transparent",
    textStyle: {
      fontFamily: "'Inter', system-ui, sans-serif",
      color: palette.text2,
    },
    tooltip: {
      backgroundColor: palette.bg3,
      borderColor: palette.border,
      borderWidth: 1,
      textStyle: {
        color: palette.text1,
        fontSize: 12,
        fontFamily: "'Inter', system-ui, sans-serif",
      },
      extraCssText:
        "box-shadow: 0 4px 20px rgba(0,0,0,0.25); border-radius: 8px;",
    },
    // Use the Riko color order as the default series palette
    color: rikoColorSequence(palette),
  };
}

/** Default Riko color sequence for ECharts series. Matches the
 *  "positive → neutral → warning → negative" mental order. */
export function rikoColorSequence(p: RikoPalette): string[] {
  return [
    p.green,
    p.blue,
    p.purple,
    p.orange,
    p.yellow,
    p.red,
    p.greenDark,
    p.text3,
  ];
}

/** Shorter Indian currency formatter used in tooltips/labels. */
export function fmtINR(v: number): string {
  const abs = Math.abs(v);
  const sign = v < 0 ? "-" : "";
  if (abs >= 1e7) return `${sign}₹${(abs / 1e7).toFixed(2)}Cr`;
  if (abs >= 1e5) return `${sign}₹${(abs / 1e5).toFixed(1)}L`;
  if (abs >= 1e3) return `${sign}₹${(abs / 1e3).toFixed(0)}K`;
  return `${sign}₹${abs}`;
}

/** Resolve a CSS color string. If it's `var(--name)` or
 *  `var(--name, fallback)` we substitute the computed property value
 *  from the document root. Otherwise return the input unchanged.
 *
 *  ECharts doesn't understand CSS custom properties — passing
 *  "var(--blue)" to itemStyle.color gives you a pale/broken render.
 *  Always run user-supplied colors through this before handing them
 *  to an ECharts option. */
export function resolveCssVar(val: string | undefined): string | undefined {
  if (!val) return val;
  if (!val.includes("var(")) return val;
  if (typeof window === "undefined") return val;
  const root = getComputedStyle(document.documentElement);
  return val.replace(
    /var\(\s*(--[a-zA-Z0-9-]+)(?:\s*,\s*([^)]+))?\s*\)/g,
    (_, name, fallback) => {
      const resolved = root.getPropertyValue(name).trim();
      if (resolved) return resolved;
      return (fallback ?? "").trim();
    }
  );
}
