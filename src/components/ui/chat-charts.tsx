"use client";

/* ═══════════════════════════════════════════════════════════════
   Chat chart primitives
   Library of small, inline SVG charts used inside chat responses.
   All pieces follow the same conventions:
     • pure SVG (no chart lib dep)
     • CSS variables for theming (var(--green), var(--red), ...)
     • responsive: set width 100%, viewBox fixed
     • tabular-num-friendly labels, Space Grotesk for numbers
   ═══════════════════════════════════════════════════════════════ */

import { motion } from "framer-motion";

/* ── Utility: format number → compact L/Cr ── */
function fmt(v: number, withSymbol = true): string {
  const abs = Math.abs(v);
  const sign = v < 0 ? "-" : "";
  const s = withSymbol ? "₹" : "";
  if (abs >= 1e7) return `${sign}${s}${(abs / 1e7).toFixed(2)}Cr`;
  if (abs >= 1e5) return `${sign}${s}${(abs / 1e5).toFixed(1)}L`;
  if (abs >= 1e3) return `${sign}${s}${(abs / 1e3).toFixed(0)}K`;
  return `${sign}${s}${abs}`;
}

/* ═══════════════════════════════════════════════════════════════
   1. BarChart — horizontal bars, ranked (top-N style)
   Used for: top customers, top receivables, dead stock
   ═══════════════════════════════════════════════════════════════ */
export interface BarDatum {
  label: string;
  value: number;
  color?: string;
  caption?: string;
}

export function ChatBarChart({
  data,
  title,
  showValues = true,
  currency = true,
}: {
  data: BarDatum[];
  title?: string;
  showValues?: boolean;
  currency?: boolean;
}) {
  const max = Math.max(...data.map((d) => Math.abs(d.value)), 1);

  return (
    <div
      className="rounded-xl p-4"
      style={{ background: "var(--bg-surface)", border: "1px solid var(--border)" }}
    >
      {title && (
        <p className="text-xs font-bold mb-3" style={{ color: "var(--text-1)" }}>
          {title}
        </p>
      )}
      <div className="space-y-2.5">
        {data.map((d, i) => {
          const pct = (Math.abs(d.value) / max) * 100;
          const color = d.color || "var(--green)";
          return (
            <div key={d.label + i}>
              <div className="flex justify-between items-baseline text-[11px] mb-1">
                <span className="truncate max-w-[65%]" style={{ color: "var(--text-2)" }}>
                  {d.label}
                </span>
                {showValues && (
                  <span
                    className="font-bold tabular-nums"
                    style={{
                      color: "var(--text-1)",
                      fontFamily: "'Space Grotesk', sans-serif",
                    }}
                  >
                    {currency ? fmt(d.value) : d.value.toLocaleString("en-IN")}
                  </span>
                )}
              </div>
              <div
                className="h-2 rounded-full overflow-hidden"
                style={{ background: "var(--bg-hover)" }}
              >
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${pct}%` }}
                  transition={{ duration: 0.6, delay: i * 0.05, ease: "easeOut" }}
                  className="h-full rounded-full"
                  style={{ background: color }}
                />
              </div>
              {d.caption && (
                <p className="text-[10px] mt-0.5" style={{ color: "var(--text-4)" }}>
                  {d.caption}
                </p>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   2. LineChart — trend over time with optional area fill
   Used for: revenue trend, cash forecast, health over time
   ═══════════════════════════════════════════════════════════════ */
export interface LinePoint {
  x: string;
  y: number;
}

export function ChatLineChart({
  data,
  title,
  color = "var(--green)",
  height = 140,
  showArea = true,
  zeroLine = false,
  highlight,
}: {
  data: LinePoint[];
  title?: string;
  color?: string;
  height?: number;
  showArea?: boolean;
  zeroLine?: boolean;
  highlight?: { index: number; label: string };
}) {
  const W = 360;
  const pad = { top: 16, right: 12, bottom: 24, left: 40 };
  const chartW = W - pad.left - pad.right;
  const chartH = height - pad.top - pad.bottom;

  const values = data.map((d) => d.y);
  const min = Math.min(...values, zeroLine ? 0 : Math.min(...values));
  const max = Math.max(...values, 0);
  const range = max - min || 1;

  const xScale = (i: number) => pad.left + (i / Math.max(data.length - 1, 1)) * chartW;
  const yScale = (v: number) => pad.top + chartH - ((v - min) / range) * chartH;

  const linePath = data
    .map((d, i) => `${i === 0 ? "M" : "L"}${xScale(i)},${yScale(d.y)}`)
    .join(" ");
  const areaPath = `${linePath} L${xScale(data.length - 1)},${pad.top + chartH} L${xScale(0)},${pad.top + chartH} Z`;

  const zeroY = yScale(0);

  return (
    <div
      className="rounded-xl p-4"
      style={{ background: "var(--bg-surface)", border: "1px solid var(--border)" }}
    >
      {title && (
        <p className="text-xs font-bold mb-2" style={{ color: "var(--text-1)" }}>
          {title}
        </p>
      )}
      <svg
        viewBox={`0 0 ${W} ${height}`}
        preserveAspectRatio="xMidYMid meet"
        style={{ width: "100%", height: "auto" }}
      >
        {/* Gridlines (4 horizontal) */}
        {[0, 0.25, 0.5, 0.75, 1].map((frac, i) => {
          const y = pad.top + chartH * (1 - frac);
          const val = min + range * frac;
          return (
            <g key={i}>
              <line
                x1={pad.left}
                y1={y}
                x2={W - pad.right}
                y2={y}
                stroke="var(--border)"
                strokeWidth={1}
                strokeDasharray={i === 0 || i === 4 ? "0" : "2 3"}
                opacity={i === 0 || i === 4 ? 0.8 : 0.4}
              />
              <text
                x={pad.left - 6}
                y={y + 3}
                textAnchor="end"
                fontSize="9"
                fill="var(--text-4)"
                fontFamily="'Space Grotesk', sans-serif"
              >
                {fmt(val, false)}
              </text>
            </g>
          );
        })}

        {/* Zero line */}
        {zeroLine && zeroY > pad.top && zeroY < pad.top + chartH && (
          <line
            x1={pad.left}
            y1={zeroY}
            x2={W - pad.right}
            y2={zeroY}
            stroke="var(--red)"
            strokeWidth={1}
            strokeDasharray="4 2"
            opacity={0.5}
          />
        )}

        {/* Area */}
        {showArea && (
          <motion.path
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.12 }}
            transition={{ duration: 0.6 }}
            d={areaPath}
            fill={color}
          />
        )}

        {/* Line */}
        <motion.path
          initial={{ pathLength: 0 }}
          animate={{ pathLength: 1 }}
          transition={{ duration: 0.8, ease: "easeInOut" }}
          d={linePath}
          stroke={color}
          strokeWidth={2}
          fill="none"
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        {/* Dots */}
        {data.map((d, i) => (
          <motion.circle
            key={i}
            initial={{ r: 0 }}
            animate={{ r: i === highlight?.index ? 4 : 2.5 }}
            transition={{ duration: 0.3, delay: 0.5 + i * 0.03 }}
            cx={xScale(i)}
            cy={yScale(d.y)}
            fill={i === highlight?.index ? "var(--yellow)" : color}
            stroke="var(--bg-surface)"
            strokeWidth={1.5}
          />
        ))}

        {/* X-axis labels */}
        {data.map((d, i) => {
          const skip = data.length > 8 && i % 2 !== 0 && i !== data.length - 1;
          if (skip) return null;
          return (
            <text
              key={i}
              x={xScale(i)}
              y={height - 6}
              textAnchor="middle"
              fontSize="9"
              fill="var(--text-4)"
            >
              {d.x}
            </text>
          );
        })}

        {/* Highlight callout */}
        {highlight && (
          <g>
            <rect
              x={xScale(highlight.index) - 30}
              y={yScale(data[highlight.index].y) - 22}
              width={60}
              height={16}
              rx={3}
              fill="var(--yellow)"
              opacity={0.95}
            />
            <text
              x={xScale(highlight.index)}
              y={yScale(data[highlight.index].y) - 11}
              textAnchor="middle"
              fontSize="9"
              fontWeight="700"
              fill="#000"
              fontFamily="'Space Grotesk', sans-serif"
            >
              {highlight.label}
            </text>
          </g>
        )}
      </svg>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   3. DonutChart — composition by category
   Used for: expense breakdown, channel mix, recon status
   ═══════════════════════════════════════════════════════════════ */
export interface DonutSlice {
  label: string;
  value: number;
  color: string;
}

export function ChatDonut({
  data,
  title,
  centerValue,
  centerLabel,
  size = 140,
}: {
  data: DonutSlice[];
  title?: string;
  centerValue?: string;
  centerLabel?: string;
  size?: number;
}) {
  const total = data.reduce((s, d) => s + d.value, 0) || 1;
  const cx = size / 2;
  const cy = size / 2;
  const r = size / 2 - 4;
  const inner = r * 0.62;
  const gap = 0.012; // tiny gap between slices

  // Compute running angles in a single reduce — keeps the render pure
  // (React 19 disallows mutable accumulators during render)
  const startAngle = -Math.PI / 2;
  const arcs = data.reduce<
    ({ label: string; value: number; color: string; path: string; frac: number })[]
  >((acc, d) => {
    const prevEnd = acc.length === 0 ? startAngle : startAngle + (acc.reduce((s, a) => s + a.frac, 0)) * 2 * Math.PI;
    const frac = d.value / total;
    const ang = frac * 2 * Math.PI;
    const a1 = prevEnd + gap;
    const a2 = prevEnd + ang - gap;

    const x1 = cx + r * Math.cos(a1);
    const y1 = cy + r * Math.sin(a1);
    const x2 = cx + r * Math.cos(a2);
    const y2 = cy + r * Math.sin(a2);
    const xi1 = cx + inner * Math.cos(a2);
    const yi1 = cy + inner * Math.sin(a2);
    const xi2 = cx + inner * Math.cos(a1);
    const yi2 = cy + inner * Math.sin(a1);
    const large = ang > Math.PI ? 1 : 0;

    const path = `M ${x1} ${y1} A ${r} ${r} 0 ${large} 1 ${x2} ${y2} L ${xi1} ${yi1} A ${inner} ${inner} 0 ${large} 0 ${xi2} ${yi2} Z`;
    return [...acc, { ...d, path, frac }];
  }, []);

  return (
    <div
      className="rounded-xl p-4"
      style={{ background: "var(--bg-surface)", border: "1px solid var(--border)" }}
    >
      {title && (
        <p className="text-xs font-bold mb-3" style={{ color: "var(--text-1)" }}>
          {title}
        </p>
      )}
      <div className="flex items-center gap-4">
        <div className="relative flex-shrink-0">
          <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
            {arcs.map((a, i) => (
              <motion.path
                key={i}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.4, delay: i * 0.06 }}
                d={a.path}
                fill={a.color}
                style={{ transformOrigin: `${cx}px ${cy}px` }}
              />
            ))}
          </svg>
          {(centerValue || centerLabel) && (
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
              {centerValue && (
                <span
                  className="text-base font-bold tabular-nums"
                  style={{
                    color: "var(--text-1)",
                    fontFamily: "'Space Grotesk', sans-serif",
                  }}
                >
                  {centerValue}
                </span>
              )}
              {centerLabel && (
                <span
                  className="text-[9px] uppercase tracking-wider"
                  style={{ color: "var(--text-4)" }}
                >
                  {centerLabel}
                </span>
              )}
            </div>
          )}
        </div>
        <div className="flex-1 space-y-1.5">
          {arcs.map((a, i) => (
            <div key={i} className="flex items-center gap-2 text-[11px]">
              <span
                className="w-2.5 h-2.5 rounded-sm flex-shrink-0"
                style={{ background: a.color }}
              />
              <span className="flex-1 truncate" style={{ color: "var(--text-2)" }}>
                {a.label}
              </span>
              <span
                className="font-semibold tabular-nums"
                style={{
                  color: "var(--text-1)",
                  fontFamily: "'Space Grotesk', sans-serif",
                }}
              >
                {(a.frac * 100).toFixed(0)}%
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   4. StackedBar — single stacked horizontal bar
   Used for: aging buckets, build phase progress, recon status
   ═══════════════════════════════════════════════════════════════ */
export interface StackSegment {
  label: string;
  value: number;
  color: string;
}

export function ChatStackedBar({
  segments,
  title,
  subtitle,
  showLegend = true,
  currency = true,
}: {
  segments: StackSegment[];
  title?: string;
  subtitle?: string;
  showLegend?: boolean;
  currency?: boolean;
}) {
  const total = segments.reduce((s, d) => s + Math.abs(d.value), 0) || 1;

  return (
    <div
      className="rounded-xl p-4"
      style={{ background: "var(--bg-surface)", border: "1px solid var(--border)" }}
    >
      {title && (
        <p className="text-xs font-bold mb-1" style={{ color: "var(--text-1)" }}>
          {title}
        </p>
      )}
      {subtitle && (
        <p className="text-[10px] mb-2.5" style={{ color: "var(--text-4)" }}>
          {subtitle}
        </p>
      )}
      <div
        className="h-6 rounded-md overflow-hidden flex"
        style={{ background: "var(--bg-hover)" }}
      >
        {segments.map((s, i) => {
          const pct = (Math.abs(s.value) / total) * 100;
          return (
            <motion.div
              key={i}
              initial={{ width: 0 }}
              animate={{ width: `${pct}%` }}
              transition={{ duration: 0.6, delay: i * 0.08 }}
              className="h-full flex items-center justify-center"
              style={{ background: s.color }}
              title={`${s.label}: ${currency ? fmt(s.value) : s.value}`}
            >
              {pct > 10 && (
                <span
                  className="text-[9px] font-bold text-white mix-blend-difference"
                  style={{ fontFamily: "'Space Grotesk', sans-serif" }}
                >
                  {pct.toFixed(0)}%
                </span>
              )}
            </motion.div>
          );
        })}
      </div>
      {showLegend && (
        <div className="grid grid-cols-2 gap-x-3 gap-y-1 mt-2.5">
          {segments.map((s, i) => (
            <div key={i} className="flex items-center gap-1.5 text-[10px]">
              <span
                className="w-2 h-2 rounded-sm flex-shrink-0"
                style={{ background: s.color }}
              />
              <span className="flex-1 truncate" style={{ color: "var(--text-3)" }}>
                {s.label}
              </span>
              <span
                className="font-semibold tabular-nums"
                style={{
                  color: "var(--text-1)",
                  fontFamily: "'Space Grotesk', sans-serif",
                }}
              >
                {currency ? fmt(s.value) : s.value}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   5. WaterfallChart — P&L waterfall
   Used for: revenue → EBITDA breakdown
   ═══════════════════════════════════════════════════════════════ */
export function ChatWaterfall({
  data,
  title,
}: {
  data: { label: string; value: number; color?: string; bold?: boolean }[];
  title?: string;
}) {
  // Accumulate running total for positioning.
  // Use reduce to keep render pure (no mutable accumulator during render).
  const segments = data.reduce<
    { label: string; value: number; color?: string; bold?: boolean; start: number; end: number }[]
  >((acc, d) => {
    const prev = acc.length ? acc[acc.length - 1] : null;
    const runningTotal = prev ? prev.end : 0;
    const isMarker = d.bold;
    const start = isMarker ? 0 : runningTotal;
    const end = isMarker ? d.value : runningTotal + d.value;
    return [...acc, { ...d, start, end }];
  }, []);

  const allVals = segments.flatMap((s) => [s.start, s.end]);
  const max = Math.max(...allVals, 0);
  const min = Math.min(...allVals, 0);
  const range = max - min || 1;

  return (
    <div
      className="rounded-xl p-4"
      style={{ background: "var(--bg-surface)", border: "1px solid var(--border)" }}
    >
      {title && (
        <p className="text-xs font-bold mb-3" style={{ color: "var(--text-1)" }}>
          {title}
        </p>
      )}
      <div className="space-y-1.5">
        {segments.map((s, i) => {
          const startPct = ((s.start - min) / range) * 100;
          const endPct = ((s.end - min) / range) * 100;
          const left = Math.min(startPct, endPct);
          const width = Math.abs(endPct - startPct);
          const color = s.color || (s.value >= 0 ? "var(--green)" : "var(--red)");
          return (
            <div key={i} className="grid grid-cols-[120px_1fr_90px] items-center gap-2">
              <span
                className={`text-[11px] ${s.bold ? "font-bold" : ""}`}
                style={{ color: s.bold ? "var(--text-1)" : "var(--text-3)" }}
              >
                {s.label}
              </span>
              <div
                className="h-5 rounded-sm relative"
                style={{ background: "var(--bg-hover)" }}
              >
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${width}%`, left: `${left}%` }}
                  transition={{ duration: 0.5, delay: i * 0.05 }}
                  className="absolute top-0 bottom-0 rounded-sm"
                  style={{ background: color }}
                />
              </div>
              <span
                className={`text-[11px] tabular-nums text-right ${s.bold ? "font-bold" : ""}`}
                style={{
                  color: s.value < 0 ? "var(--red)" : s.bold ? "var(--text-1)" : "var(--text-3)",
                  fontFamily: "'Space Grotesk', sans-serif",
                }}
              >
                {fmt(s.value)}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   6. ForecastChart — dual line inflow/outflow + running cash
   Used for: cash flow forecast
   ═══════════════════════════════════════════════════════════════ */
export function ChatForecastChart({
  weeks,
  title,
}: {
  weeks: { week: string; inflow: number; outflow: number; endBalance: number; alert?: string }[];
  title?: string;
}) {
  const W = 380;
  const H = 160;
  const pad = { top: 20, right: 12, bottom: 34, left: 44 };
  const chartW = W - pad.left - pad.right;
  const chartH = H - pad.top - pad.bottom;

  const allVals = weeks.flatMap((w) => [w.inflow, w.outflow, w.endBalance, 0]);
  const min = Math.min(...allVals);
  const max = Math.max(...allVals);
  const range = max - min || 1;

  const xScale = (i: number) =>
    pad.left + (i / Math.max(weeks.length - 1, 1)) * chartW;
  const yScale = (v: number) =>
    pad.top + chartH - ((v - min) / range) * chartH;

  const balancePath = weeks
    .map((w, i) => `${i === 0 ? "M" : "L"}${xScale(i)},${yScale(w.endBalance)}`)
    .join(" ");

  const zeroY = yScale(0);

  return (
    <div
      className="rounded-xl p-4"
      style={{ background: "var(--bg-surface)", border: "1px solid var(--border)" }}
    >
      {title && (
        <p className="text-xs font-bold mb-2" style={{ color: "var(--text-1)" }}>
          {title}
        </p>
      )}
      <svg
        viewBox={`0 0 ${W} ${H}`}
        preserveAspectRatio="xMidYMid meet"
        style={{ width: "100%", height: "auto" }}
      >
        {/* Zero line */}
        <line
          x1={pad.left}
          y1={zeroY}
          x2={W - pad.right}
          y2={zeroY}
          stroke="var(--red)"
          strokeDasharray="3 3"
          strokeWidth={1}
          opacity={0.6}
        />
        <text
          x={pad.left - 6}
          y={zeroY + 3}
          textAnchor="end"
          fontSize="9"
          fill="var(--red)"
          fontFamily="'Space Grotesk', sans-serif"
        >
          0
        </text>

        {/* Inflow/outflow bars per week */}
        {weeks.map((w, i) => {
          const barW = Math.min(10, chartW / weeks.length / 2.5);
          const cx = xScale(i);
          return (
            <g key={i}>
              {/* inflow */}
              <motion.rect
                initial={{ height: 0, y: zeroY }}
                animate={{ height: Math.abs(zeroY - yScale(w.inflow)), y: yScale(w.inflow) }}
                transition={{ duration: 0.5, delay: i * 0.04 }}
                x={cx - barW - 1}
                width={barW}
                fill="var(--green)"
                opacity={0.7}
                rx={1}
              />
              {/* outflow */}
              <motion.rect
                initial={{ height: 0, y: zeroY }}
                animate={{ height: Math.abs(zeroY - yScale(-w.outflow)), y: zeroY }}
                transition={{ duration: 0.5, delay: i * 0.04 + 0.1 }}
                x={cx + 1}
                width={barW}
                fill="var(--red)"
                opacity={0.7}
                rx={1}
              />
              {/* week label */}
              <text
                x={cx}
                y={H - 20}
                textAnchor="middle"
                fontSize="8"
                fill="var(--text-4)"
              >
                {w.week.split(" ")[0]}
              </text>
              <text
                x={cx}
                y={H - 9}
                textAnchor="middle"
                fontSize="7.5"
                fill="var(--text-4)"
              >
                {w.week.split(" ").slice(1).join(" ").replace(/[()]/g, "")}
              </text>
            </g>
          );
        })}

        {/* Running balance line */}
        <motion.path
          initial={{ pathLength: 0 }}
          animate={{ pathLength: 1 }}
          transition={{ duration: 1, delay: 0.3, ease: "easeInOut" }}
          d={balancePath}
          stroke="var(--blue)"
          strokeWidth={2.5}
          fill="none"
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        {/* Balance dots */}
        {weeks.map((w, i) => {
          const danger = w.endBalance < 0;
          return (
            <motion.circle
              key={i}
              initial={{ r: 0 }}
              animate={{ r: danger ? 4 : 3 }}
              transition={{ duration: 0.3, delay: 0.6 + i * 0.03 }}
              cx={xScale(i)}
              cy={yScale(w.endBalance)}
              fill={danger ? "var(--red)" : "var(--blue)"}
              stroke="var(--bg-surface)"
              strokeWidth={1.5}
            />
          );
        })}
      </svg>

      {/* Legend */}
      <div className="flex items-center gap-3 mt-1 text-[10px]">
        <span className="flex items-center gap-1" style={{ color: "var(--text-3)" }}>
          <span
            className="w-2.5 h-2.5 rounded-sm"
            style={{ background: "var(--green)", opacity: 0.7 }}
          />
          Inflow
        </span>
        <span className="flex items-center gap-1" style={{ color: "var(--text-3)" }}>
          <span
            className="w-2.5 h-2.5 rounded-sm"
            style={{ background: "var(--red)", opacity: 0.7 }}
          />
          Outflow
        </span>
        <span className="flex items-center gap-1" style={{ color: "var(--text-3)" }}>
          <span
            className="w-3 h-0.5 rounded-full"
            style={{ background: "var(--blue)" }}
          />
          Running cash
        </span>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   7. Sparkline KPI card (reused pattern)
   Compact KPI with delta + mini trend
   ═══════════════════════════════════════════════════════════════ */
export function ChatKpi({
  label,
  value,
  delta,
  deltaColor = "var(--green)",
  trend,
  trendColor = "var(--green)",
}: {
  label: string;
  value: string;
  delta?: string;
  deltaColor?: string;
  trend?: number[];
  trendColor?: string;
}) {
  const min = trend ? Math.min(...trend) : 0;
  const max = trend ? Math.max(...trend) : 1;
  const range = max - min || 1;
  const w = 58;
  const h = 20;

  return (
    <div
      className="rounded-lg p-3"
      style={{ background: "var(--bg-surface)", border: "1px solid var(--border)" }}
    >
      <p className="text-[10px] uppercase tracking-wider" style={{ color: "var(--text-4)" }}>
        {label}
      </p>
      <div className="flex items-end justify-between mt-1 gap-2">
        <p
          className="text-lg font-bold tabular-nums leading-none"
          style={{ color: "var(--text-1)", fontFamily: "'Space Grotesk', sans-serif" }}
        >
          {value}
        </p>
        {trend && (
          <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} className="flex-shrink-0">
            <path
              d={trend
                .map((v, i) => {
                  const x = (i / (trend.length - 1)) * w;
                  const y = h - ((v - min) / range) * h;
                  return `${i === 0 ? "M" : "L"}${x},${y}`;
                })
                .join(" ")}
              stroke={trendColor}
              strokeWidth={1.5}
              fill="none"
              strokeLinecap="round"
            />
          </svg>
        )}
      </div>
      {delta && (
        <p className="text-[10px] font-semibold mt-0.5" style={{ color: deltaColor }}>
          {delta}
        </p>
      )}
    </div>
  );
}
