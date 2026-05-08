"use client";

/* ═══════════════════════════════════════════════════════════════
   MoneyMachineFlow — Bridgewater-style animated money flow

   Rivers of glowing particles stream from revenue channels through
   the Total Revenue node and out to expense buckets. Ribbon width
   = amount; particle count per ribbon ∝ amount. Each particle is
   colored by its destination bucket so the eye follows where money
   is leaking — Marketing/CAC pulse the loudest.

   Pure SVG + <animateMotion>. No ECharts, no Canvas. Renders fine
   from 320px (mobile) up to full-width desktop. ~60 particles
   running simultaneously is well within browser budget.

   Layout (3 columns, horizontal):

     [Marketplace ]──┐                          ┌── COGS
     [Website D2C]──┼──▶ [TOTAL REVENUE] ──────┼── Marketing
     [B2B Offline]──┘                          ├── CAC
                                                ├── Employees
                                                ├── Fulfilment
                                                └── Overheads
   ═══════════════════════════════════════════════════════════════ */

import { useId, useMemo, useState } from "react";
import { R } from "@/lib/data";

// SVG canvas (viewBox space — actual pixels scale via preserveAspectRatio)
const W = 760;
const H = 360;
const PAD_TOP = 22;
const PAD_BOT = 22;
const NODE_W = 6;
const COL_GAP = 6;
const X_SOURCE = 0;
const X_TOTAL = 350;
const X_DEDUCT = W - NODE_W;

interface FlowNode {
  id: string;
  name: string;
  value: number;
  color: string;
}

const SOURCE_NODES: FlowNode[] = [
  { id: "mp",  name: "Marketplace", value: R.rev * 0.55, color: "#3B82F6" }, // blue
  { id: "d2c", name: "Website D2C", value: R.rev * 0.34, color: "#A78BFA" }, // soft violet
  { id: "b2b", name: "B2B Offline", value: R.rev * 0.11, color: "#22D3EE" }, // cyan
];

const DEDUCT_NODES: FlowNode[] = [
  { id: "cogs", name: "COGS",       value: R.cogs,        color: "#94A3B8" }, // slate
  { id: "mkt",  name: "Marketing",  value: R.mkt,         color: "#EF4444" }, // red — the leak
  { id: "cac",  name: "CAC",        value: R.cac,         color: "#F97316" }, // orange — the leak
  { id: "emp",  name: "Employees",  value: R.emp,         color: "#A78BFA" }, // soft violet
  { id: "ful",  name: "Fulfilment", value: R.ful,         color: "#EAB308" }, // yellow
  { id: "ovh",  name: "Overheads",  value: R.ovh + R.orc, color: "#64748B" }, // slate
];

interface PositionedNode extends FlowNode {
  y0: number;
  y1: number;
  yc: number;
}

interface Ribbon {
  id: string;
  d: string;
  width: number;
  color: string;
  amount: number;
  fromName: string;
  toName: string;
  isLeak: boolean;
}

export function MoneyMachineFlow({
  height,
  className,
}: {
  /** Rendered height in CSS px. Falls back to viewBox aspect ratio if omitted. */
  height?: number;
  className?: string;
}) {
  const uid = useId().replace(/:/g, "");
  const [hovered, setHovered] = useState<string | null>(null);

  /* ── Compute layout ── */
  const layout = useMemo(() => {
    const sourceTotal = SOURCE_NODES.reduce((s, n) => s + n.value, 0);
    const deductTotal = DEDUCT_NODES.reduce((s, n) => s + n.value, 0);
    const scaleVal = Math.max(sourceTotal, deductTotal);
    const usable = H - PAD_TOP - PAD_BOT;
    const scale = usable / scaleVal;

    // Sources stack top-down on the left
    let cy = PAD_TOP;
    const sources: PositionedNode[] = SOURCE_NODES.map((n) => {
      const h = n.value * scale;
      const y0 = cy;
      const y1 = cy + h;
      cy = y1 + COL_GAP;
      return { ...n, y0, y1, yc: (y0 + y1) / 2 };
    });

    // Deductions stack top-down on the right
    cy = PAD_TOP;
    const deducts: PositionedNode[] = DEDUCT_NODES.map((n) => {
      const h = n.value * scale;
      const y0 = cy;
      const y1 = cy + h;
      cy = y1 + COL_GAP;
      return { ...n, y0, y1, yc: (y0 + y1) / 2 };
    });

    // Total revenue node — height matches sources (it's the sum of them)
    const totalH = sourceTotal * scale;
    const sourcesMidY = (sources[0].y0 + sources[sources.length - 1].y1) / 2;
    const total: PositionedNode = {
      id: "rev",
      name: "Revenue",
      value: R.rev,
      color: "#10B981", // emerald
      y0: sourcesMidY - totalH / 2,
      y1: sourcesMidY + totalH / 2,
      yc: sourcesMidY,
    };

    // The deduct stack is taller than revenue — that excess is the loss
    const deductsBottomY = deducts[deducts.length - 1].y1;
    const lossStartY = total.y1; // where revenue runs out
    const lossEndY = deductsBottomY;

    return { sources, deducts, total, scale, sourceTotal, deductTotal, lossStartY, lossEndY };
  }, []);

  /* ── Build ribbon paths ── */
  const ribbons = useMemo<{ sToT: Ribbon[]; tToD: Ribbon[] }>(() => {
    const { sources, deducts, total, scale, sourceTotal, deductTotal } = layout;

    // Source → Total: each source claims a slice of the Total entry, top-to-bottom
    let cumSrc = 0;
    const sToT: Ribbon[] = sources.map((s) => {
      const sliceY0 = total.y0 + (cumSrc / sourceTotal) * (total.y1 - total.y0);
      cumSrc += s.value;
      const sliceY1 = total.y0 + (cumSrc / sourceTotal) * (total.y1 - total.y0);
      const sliceYc = (sliceY0 + sliceY1) / 2;
      const sx = NODE_W;
      const sy = s.yc;
      const tx = X_TOTAL;
      const ty = sliceYc;
      const cx = (sx + tx) / 2;
      const d = `M ${sx} ${sy} C ${cx} ${sy}, ${cx} ${ty}, ${tx} ${ty}`;
      return {
        id: `${s.id}-rev`,
        d,
        width: Math.max(2, s.value * scale),
        color: s.color,
        amount: s.value,
        fromName: s.name,
        toName: "Revenue",
        isLeak: false,
      };
    });

    // Total → Deduction: each deduction claims a slice of the Total exit
    let cumDed = 0;
    const tToD: Ribbon[] = deducts.map((d) => {
      const sliceY0 = total.y0 + (cumDed / deductTotal) * (total.y1 - total.y0);
      cumDed += d.value;
      const sliceY1 = total.y0 + (cumDed / deductTotal) * (total.y1 - total.y0);
      const sliceYc = (sliceY0 + sliceY1) / 2;
      const sx = X_TOTAL + NODE_W;
      const sy = sliceYc;
      const tx = X_DEDUCT;
      const ty = d.yc;
      const cx = (sx + tx) / 2;
      const isLeak = d.id === "mkt" || d.id === "cac";
      return {
        id: `rev-${d.id}`,
        d: `M ${sx} ${sy} C ${cx} ${sy}, ${cx} ${ty}, ${tx} ${ty}`,
        width: Math.max(2, d.value * scale),
        color: d.color,
        amount: d.value,
        fromName: "Revenue",
        toName: d.name,
        isLeak,
      };
    });

    return { sToT, tToD };
  }, [layout]);

  /* ── Build particle config (~60 particles total) ── */
  const particles = useMemo(() => {
    const all: Array<{
      id: string;
      pathHref: string;
      color: string;
      dur: number;
      delay: number;
      size: number;
      isLeak: boolean;
    }> = [];

    // Source → Total particles — count proportional to revenue share
    ribbons.sToT.forEach((r) => {
      const share = r.amount / R.rev;
      const n = Math.max(3, Math.round(share * 22));
      for (let k = 0; k < n; k++) {
        all.push({
          id: `s-${r.id}-${k}`,
          pathHref: `${uid}-path-${r.id}`,
          color: r.color,
          dur: 2.6 + Math.random() * 1.2,
          delay: -Math.random() * 4,
          size: 1.8 + Math.random() * 0.6,
          isLeak: false,
        });
      }
    });

    // Total → Deduct particles — count proportional to deduction share
    const deductTotal = layout.deductTotal;
    ribbons.tToD.forEach((r) => {
      const share = r.amount / deductTotal;
      const n = Math.max(2, Math.round(share * 28));
      for (let k = 0; k < n; k++) {
        all.push({
          id: `d-${r.id}-${k}`,
          pathHref: `${uid}-path-${r.id}`,
          color: r.color,
          dur: 2.4 + Math.random() * 1.2,
          delay: -Math.random() * 4,
          size: r.isLeak ? 2.2 + Math.random() * 0.6 : 1.8 + Math.random() * 0.5,
          isLeak: r.isLeak,
        });
      }
    });

    return all;
  }, [ribbons, layout.deductTotal, uid]);

  const allRibbons = [...ribbons.sToT, ...ribbons.tToD];

  /* ── INR formatter (compact) ── */
  const fmt = (v: number) =>
    v >= 1e7 ? `₹${(v / 1e7).toFixed(2)}Cr` : `₹${(v / 1e5).toFixed(1)}L`;

  /* ── Hover tooltip data ── */
  const hoveredRibbon = hovered ? allRibbons.find((r) => r.id === hovered) : null;

  return (
    <div className={className} style={{ position: "relative" }}>
      <svg
        viewBox={`0 0 ${W} ${H}`}
        width="100%"
        height={height}
        preserveAspectRatio="xMidYMid meet"
        style={{ display: "block", overflow: "visible" }}
      >
        <defs>
          {/* Per-ribbon horizontal gradients */}
          {allRibbons.map((r) => (
            <linearGradient
              key={`g-${r.id}`}
              id={`${uid}-grad-${r.id}`}
              x1="0%"
              y1="0%"
              x2="100%"
              y2="0%"
            >
              <stop offset="0%" stopColor={r.color} stopOpacity="0.35" />
              <stop offset="50%" stopColor={r.color} stopOpacity="0.55" />
              <stop offset="100%" stopColor={r.color} stopOpacity="0.35" />
            </linearGradient>
          ))}

          {/* Reusable invisible paths for particle <animateMotion> */}
          {allRibbons.map((r) => (
            <path
              key={`p-${r.id}`}
              id={`${uid}-path-${r.id}`}
              d={r.d}
              fill="none"
              stroke="none"
            />
          ))}

          {/* Particle glow */}
          <filter id={`${uid}-glow`} x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="1.2" result="b1" />
            <feMerge>
              <feMergeNode in="b1" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>

          {/* Brighter glow for leak ribbons (Marketing/CAC) */}
          <filter id={`${uid}-glow-leak`} x="-100%" y="-100%" width="300%" height="300%">
            <feGaussianBlur stdDeviation="2" result="b1" />
            <feMerge>
              <feMergeNode in="b1" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        {/* Loss zone — red glow strip below the revenue line */}
        {layout.lossEndY > layout.lossStartY + 1 && (
          <g>
            <rect
              x={X_TOTAL - 4}
              y={layout.lossStartY}
              width={X_DEDUCT - X_TOTAL + 8}
              height={layout.lossEndY - layout.lossStartY}
              fill="url(#__loss-grad__)"
              opacity="0.18"
            />
            <line
              x1={X_TOTAL}
              y1={layout.lossStartY}
              x2={X_DEDUCT}
              y2={layout.lossStartY}
              stroke="#EF4444"
              strokeOpacity="0.35"
              strokeDasharray="3 3"
              strokeWidth="0.5"
            />
            <text
              x={(X_TOTAL + X_DEDUCT) / 2}
              y={(layout.lossStartY + layout.lossEndY) / 2 + 3}
              fontSize="9"
              fontWeight="700"
              fill="#EF4444"
              textAnchor="middle"
              style={{ letterSpacing: "0.08em", textTransform: "uppercase" }}
            >
              Shortfall · {fmt(R.indExp - R.gp)}
            </text>
            <defs>
              <linearGradient id="__loss-grad__" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="#EF4444" stopOpacity="0" />
                <stop offset="100%" stopColor="#EF4444" stopOpacity="0.8" />
              </linearGradient>
            </defs>
          </g>
        )}

        {/* Ribbons */}
        <g>
          {allRibbons.map((r) => {
            const isHov = hovered === r.id;
            const dimmed = hovered !== null && !isHov;
            return (
              <path
                key={r.id}
                d={r.d}
                stroke={`url(#${uid}-grad-${r.id})`}
                strokeWidth={r.width}
                strokeOpacity={dimmed ? 0.18 : isHov ? 0.85 : 0.55}
                strokeLinecap="round"
                fill="none"
                onMouseEnter={() => setHovered(r.id)}
                onMouseLeave={() => setHovered(null)}
                style={{ transition: "stroke-opacity 200ms", cursor: "pointer" }}
              />
            );
          })}
        </g>

        {/* Particles (drawn on top of ribbons, below nodes) */}
        <g pointerEvents="none">
          {particles.map((p) => (
            <circle
              key={p.id}
              r={p.size}
              fill={p.color}
              opacity={hovered && !hovered.includes(p.pathHref.split("path-")[1] ?? "") ? 0.25 : 0.9}
              filter={p.isLeak ? `url(#${uid}-glow-leak)` : `url(#${uid}-glow)`}
              style={{ transition: "opacity 200ms" }}
            >
              <animateMotion
                dur={`${p.dur}s`}
                repeatCount="indefinite"
                begin={`${p.delay}s`}
                rotate="auto"
              >
                <mpath href={`#${p.pathHref}`} />
              </animateMotion>
            </circle>
          ))}
        </g>

        {/* Source nodes + labels */}
        <g pointerEvents="none">
          {layout.sources.map((s) => (
            <g key={s.id}>
              <rect
                x={X_SOURCE}
                y={s.y0}
                width={NODE_W}
                height={Math.max(2, s.y1 - s.y0)}
                fill={s.color}
                rx={1.5}
              />
              <text
                x={NODE_W + 6}
                y={s.yc - 2}
                fontSize="10"
                fontWeight="600"
                fill="var(--text-1)"
                dominantBaseline="middle"
              >
                {s.name}
              </text>
              <text
                x={NODE_W + 6}
                y={s.yc + 10}
                fontSize="9"
                fill="var(--text-4)"
                dominantBaseline="middle"
                fontFamily="'Space Grotesk', sans-serif"
              >
                {fmt(s.value)}
              </text>
            </g>
          ))}
        </g>

        {/* Total Revenue node + label */}
        <g pointerEvents="none">
          <rect
            x={X_TOTAL}
            y={layout.total.y0}
            width={NODE_W}
            height={Math.max(2, layout.total.y1 - layout.total.y0)}
            fill={layout.total.color}
            rx={1.5}
          />
          <text
            x={X_TOTAL + NODE_W / 2}
            y={layout.total.y0 - 8}
            fontSize="10"
            fontWeight="700"
            fill="#10B981"
            textAnchor="middle"
            style={{ letterSpacing: "0.05em", textTransform: "uppercase" }}
          >
            Revenue
          </text>
          <text
            x={X_TOTAL + NODE_W / 2}
            y={layout.total.y1 + 14}
            fontSize="11"
            fontWeight="700"
            fill="var(--text-1)"
            textAnchor="middle"
            fontFamily="'Space Grotesk', sans-serif"
          >
            {fmt(R.rev)}
          </text>
        </g>

        {/* Deduction nodes + labels */}
        <g pointerEvents="none">
          {layout.deducts.map((d) => {
            const isLeak = d.id === "mkt" || d.id === "cac";
            return (
              <g key={d.id}>
                <rect
                  x={X_DEDUCT}
                  y={d.y0}
                  width={NODE_W}
                  height={Math.max(2, d.y1 - d.y0)}
                  fill={d.color}
                  rx={1.5}
                />
                <text
                  x={X_DEDUCT - 6}
                  y={d.yc - 2}
                  fontSize="10"
                  fontWeight={isLeak ? 700 : 600}
                  fill={isLeak ? d.color : "var(--text-1)"}
                  dominantBaseline="middle"
                  textAnchor="end"
                >
                  {d.name}
                </text>
                <text
                  x={X_DEDUCT - 6}
                  y={d.yc + 10}
                  fontSize="9"
                  fill="var(--text-4)"
                  dominantBaseline="middle"
                  textAnchor="end"
                  fontFamily="'Space Grotesk', sans-serif"
                >
                  {fmt(d.value)}
                </text>
              </g>
            );
          })}
        </g>
      </svg>

      {/* Hover tooltip — absolute, above SVG */}
      {hoveredRibbon && (
        <div
          style={{
            position: "absolute",
            top: 8,
            left: "50%",
            transform: "translateX(-50%)",
            background: "var(--bg-surface)",
            border: "1px solid var(--border)",
            borderRadius: 6,
            padding: "6px 10px",
            fontSize: 11,
            color: "var(--text-1)",
            fontWeight: 600,
            pointerEvents: "none",
            boxShadow: "0 4px 12px rgba(0,0,0,0.25)",
            whiteSpace: "nowrap",
            zIndex: 2,
          }}
        >
          <span style={{ color: hoveredRibbon.color }}>●</span>{" "}
          {hoveredRibbon.fromName} → {hoveredRibbon.toName} ·{" "}
          <span style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
            {fmt(hoveredRibbon.amount)}
          </span>
          {hoveredRibbon.isLeak && (
            <span style={{ color: "#EF4444", marginLeft: 6 }}>· biggest leak</span>
          )}
        </div>
      )}
    </div>
  );
}
