"use client";

/* ═══════════════════════════════════════════════════════════════
   Causal Chain — P&L as a DAG
   ═══════════════════════════════════════════════════════════════
   Shows the founder where the money goes, not just what's left.
   Revenue sources → Total Revenue → Gross Profit → EBITDA → Net P&L,
   with deduction nodes (COGS, OpEx, Interest+Tax) branching in.

   Each node is a clickable card. Clicking dispatches the matching
   question into Chat via the onAsk callback (wired from dashboard).

   Desktop: horizontal DAG with SVG connector lines.
   Mobile: vertical stages, one deduction box per stage.
   ═══════════════════════════════════════════════════════════════ */

import { motion } from "framer-motion";
import { MessageCircle } from "lucide-react";
import { R } from "@/lib/data";

/* ── Channel revenue approximations ────────────────────────────
   Bandra Soap's revenue splits roughly:
   Marketplace (Amazon + Nykaa + Flipkart + Meesho): ~55% net
   Website D2C: ~34% net
   B2B Offline (LLC Olimpiya + Scale Global): ~11% net
   These approximations sum to R.rev. */
const CHANNEL_REV = {
  marketplace: R.rev * 0.55,
  d2c: R.rev * 0.34,
  b2b: R.rev * 0.11,
};

/* Format values as ₹X.XCr or ₹X.XL */
function fmt(v: number): string {
  const abs = Math.abs(v);
  const sign = v < 0 ? "-" : "";
  if (abs >= 1e7) return `${sign}₹${(abs / 1e7).toFixed(2)}Cr`;
  if (abs >= 1e5) return `${sign}₹${(abs / 1e5).toFixed(1)}L`;
  return `${sign}₹${abs.toLocaleString("en-IN")}`;
}

type NodeKind = "source" | "total" | "deduction" | "result" | "loss";

interface NodeDef {
  id: string;
  label: string;
  value: number;
  sub?: string; // tiny caption under value
  kind: NodeKind;
  col: number;
  row: number; // 0-based within column, used on desktop
  ask?: string; // chat prompt if clicked
}

const NODES: NodeDef[] = [
  // Col 0: revenue sources (3 stacked)
  { id: "mkt", label: "Marketplace", value: CHANNEL_REV.marketplace, sub: "Amazon · Nykaa · Flipkart", kind: "source", col: 0, row: 0, ask: "Returns by channel" },
  { id: "d2c", label: "Website D2C", value: CHANNEL_REV.d2c, sub: "rikoskin.com", kind: "source", col: 0, row: 1, ask: "Top customers by revenue" },
  { id: "b2b", label: "B2B Offline", value: CHANNEL_REV.b2b, sub: "LLC Olimpiya + others", kind: "source", col: 0, row: 2 },
  // Col 1: total revenue + cogs
  { id: "rev", label: "Total Revenue", value: R.rev, sub: "-55% YoY", kind: "total", col: 1, row: 0, ask: "Revenue trend this year" },
  { id: "cogs", label: "COGS", value: -R.cogs, sub: "17.5% of rev", kind: "deduction", col: 1, row: 1 },
  // Col 2: gross profit + opex
  { id: "gp", label: "Gross Profit", value: R.gp, sub: "82.5% margin", kind: "total", col: 2, row: 0 },
  { id: "opex", label: "OpEx", value: -R.indExp, sub: "Mkt + CAC + Emp + more", kind: "deduction", col: 2, row: 1, ask: "Expense breakdown" },
  // Col 3: EBITDA + interest/tax
  { id: "ebitda", label: "EBITDA", value: R.ebitda, sub: `${((R.ebitda / R.rev) * 100).toFixed(0)}% margin`, kind: "loss", col: 3, row: 0, ask: "Why am I losing money?" },
  { id: "fintax", label: "Interest + Tax", value: -(R.interest + R.tax), sub: "Finance costs", kind: "deduction", col: 3, row: 1 },
  // Col 4: Net P&L
  { id: "net", label: "Net P&L", value: R.netPL, sub: "Burn ₹18.6L/mo", kind: "loss", col: 4, row: 0, ask: "What's my cash runway?" },
];

/* SVG coord system: 1000 wide × 520 tall (preserveAspectRatio=none) */
const VB_W = 1000;
const VB_H = 520;
const NODE_W = 180;
const NODE_H = 72;

/* Column x-centers (px in SVG coords) */
const COL_X = [105, 305, 505, 705, 895];

/* Row y-centers per column. Col 0 has 3 rows, others have 1-2 */
function nodeCenter(n: NodeDef): { x: number; y: number } {
  const x = COL_X[n.col];
  let y: number;
  if (n.col === 0) {
    // 3 rows: top (row=0), middle, bottom
    y = 140 + n.row * 130; // 140, 270, 400
  } else if (n.col === 4) {
    // Single row centered
    y = 260;
  } else {
    // 2 rows: top profit/total, bottom deduction
    y = n.row === 0 ? 180 : 380;
  }
  return { x, y };
}

/* Edge connections (source id → target id) */
const EDGES: { from: string; to: string }[] = [
  { from: "mkt", to: "rev" },
  { from: "d2c", to: "rev" },
  { from: "b2b", to: "rev" },
  { from: "rev", to: "gp" },
  { from: "cogs", to: "gp" },
  { from: "gp", to: "ebitda" },
  { from: "opex", to: "ebitda" },
  { from: "ebitda", to: "net" },
  { from: "fintax", to: "net" },
];

/* Get node style by kind */
function nodeStyle(kind: NodeKind): {
  bg: string;
  border: string;
  valueColor: string;
} {
  switch (kind) {
    case "source":
      return {
        bg: "color-mix(in srgb, var(--blue) 10%, var(--bg-surface))",
        border: "color-mix(in srgb, var(--blue) 30%, transparent)",
        valueColor: "var(--blue)",
      };
    case "total":
      return {
        bg: "color-mix(in srgb, var(--green) 12%, var(--bg-surface))",
        border: "color-mix(in srgb, var(--green) 35%, transparent)",
        valueColor: "var(--green)",
      };
    case "deduction":
      return {
        bg: "color-mix(in srgb, var(--red) 10%, var(--bg-surface))",
        border: "color-mix(in srgb, var(--red) 28%, transparent)",
        valueColor: "var(--red)",
      };
    case "loss":
      return {
        bg: "color-mix(in srgb, var(--yellow) 10%, var(--bg-surface))",
        border: "color-mix(in srgb, var(--yellow) 35%, transparent)",
        valueColor: "var(--yellow)",
      };
    case "result":
      return {
        bg: "var(--bg-surface)",
        border: "var(--border)",
        valueColor: "var(--text-1)",
      };
  }
}

/* ══════════════════════════════════════════════════════════════
   Desktop version — horizontal DAG with SVG edges
   ══════════════════════════════════════════════════════════════ */
function CausalChainDesktop({ onAsk }: { onAsk?: (q: string) => void }) {
  return (
    <div className="relative w-full" style={{ aspectRatio: `${VB_W} / ${VB_H}` }}>
      {/* SVG overlay for connector edges */}
      <svg
        viewBox={`0 0 ${VB_W} ${VB_H}`}
        preserveAspectRatio="none"
        className="absolute inset-0 w-full h-full pointer-events-none"
        aria-hidden
      >
        {/* Gradient for edges — green when positive flow, muted when deduction */}
        <defs>
          <linearGradient id="flow-positive" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="var(--green)" stopOpacity="0.45" />
            <stop offset="100%" stopColor="var(--green)" stopOpacity="0.85" />
          </linearGradient>
          <linearGradient id="flow-deduction" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="var(--red)" stopOpacity="0.25" />
            <stop offset="100%" stopColor="var(--red)" stopOpacity="0.6" />
          </linearGradient>
          <marker
            id="arrowhead-positive"
            viewBox="0 0 10 10"
            refX="8"
            refY="5"
            markerWidth="6"
            markerHeight="6"
            orient="auto"
          >
            <path d="M 0 0 L 10 5 L 0 10 z" fill="var(--green)" opacity="0.85" />
          </marker>
          <marker
            id="arrowhead-deduction"
            viewBox="0 0 10 10"
            refX="8"
            refY="5"
            markerWidth="6"
            markerHeight="6"
            orient="auto"
          >
            <path d="M 0 0 L 10 5 L 0 10 z" fill="var(--red)" opacity="0.6" />
          </marker>
        </defs>

        {EDGES.map((e, i) => {
          const from = NODES.find((n) => n.id === e.from)!;
          const to = NODES.find((n) => n.id === e.to)!;
          const p1 = nodeCenter(from);
          const p2 = nodeCenter(to);
          // Start from right edge of source, end at left edge of target
          const x1 = p1.x + NODE_W / 2;
          const y1 = p1.y;
          const x2 = p2.x - NODE_W / 2 - 6; // small gap for arrowhead
          const y2 = p2.y;
          // Cubic bezier: control points halfway along x, same y as endpoints
          const cx1 = x1 + (x2 - x1) * 0.5;
          const cx2 = x1 + (x2 - x1) * 0.5;
          const isDeduction = from.kind === "deduction";
          const stroke = isDeduction ? "url(#flow-deduction)" : "url(#flow-positive)";
          const marker = isDeduction ? "url(#arrowhead-deduction)" : "url(#arrowhead-positive)";

          return (
            <motion.path
              key={`${e.from}-${e.to}`}
              initial={{ pathLength: 0, opacity: 0 }}
              whileInView={{ pathLength: 1, opacity: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8, delay: 0.1 + i * 0.06, ease: "easeInOut" }}
              d={`M ${x1} ${y1} C ${cx1} ${y1}, ${cx2} ${y2}, ${x2} ${y2}`}
              stroke={stroke}
              strokeWidth={2.5}
              fill="none"
              markerEnd={marker}
              strokeLinecap="round"
            />
          );
        })}
      </svg>

      {/* Absolutely-positioned node cards aligned to SVG coords */}
      {NODES.map((n, i) => {
        const { x, y } = nodeCenter(n);
        const s = nodeStyle(n.kind);
        const clickable = !!n.ask && !!onAsk;
        // Convert SVG coords to percentages for absolute positioning
        const leftPct = ((x - NODE_W / 2) / VB_W) * 100;
        const topPct = ((y - NODE_H / 2) / VB_H) * 100;
        const widthPct = (NODE_W / VB_W) * 100;
        const heightPct = (NODE_H / VB_H) * 100;

        return (
          <motion.button
            key={n.id}
            type="button"
            onClick={() => clickable && onAsk!(n.ask!)}
            disabled={!clickable}
            initial={{ opacity: 0, scale: 0.92 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.3, delay: 0.1 + i * 0.05 }}
            whileHover={clickable ? { scale: 1.03 } : undefined}
            className="absolute rounded-md px-3 py-2 text-left transition-shadow"
            style={{
              left: `${leftPct}%`,
              top: `${topPct}%`,
              width: `${widthPct}%`,
              height: `${heightPct}%`,
              background: s.bg,
              border: `1px solid ${s.border}`,
              cursor: clickable ? "pointer" : "default",
            }}
            title={clickable ? `Ask Riko: ${n.ask}` : n.label}
          >
            <div className="flex items-start justify-between gap-1">
              <p
                className="text-[11px] font-medium truncate flex-1"
                style={{ color: "var(--text-3)" }}
              >
                {n.label}
              </p>
              {clickable && (
                <MessageCircle
                  size={10}
                  style={{ color: "var(--text-4)", flexShrink: 0 }}
                />
              )}
            </div>
            <p
              className="text-base font-bold tabular-nums leading-tight"
              style={{
                color: s.valueColor,
                fontFamily: "'Space Grotesk', sans-serif",
              }}
            >
              {fmt(n.value)}
            </p>
            {n.sub && (
              <p
                className="text-[10px] truncate"
                style={{ color: "var(--text-4)" }}
              >
                {n.sub}
              </p>
            )}
          </motion.button>
        );
      })}
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════
   Mobile version — vertical stages with downward arrows
   ══════════════════════════════════════════════════════════════ */
function MobileStage({
  total,
  deduction,
  result,
  onAsk,
  showArrow = true,
}: {
  total?: NodeDef;
  deduction?: NodeDef;
  result: NodeDef;
  onAsk?: (q: string) => void;
  showArrow?: boolean;
}) {
  const renderNode = (n: NodeDef) => {
    const s = nodeStyle(n.kind);
    const clickable = !!n.ask && !!onAsk;
    return (
      <button
        type="button"
        onClick={() => clickable && onAsk!(n.ask!)}
        disabled={!clickable}
        className="flex-1 rounded-lg px-3 py-2 text-left min-w-0"
        style={{
          background: s.bg,
          border: `1px solid ${s.border}`,
          cursor: clickable ? "pointer" : "default",
        }}
      >
        <p
          className="text-[10px] font-medium truncate"
          style={{ color: "var(--text-3)" }}
        >
          {n.label}
        </p>
        <p
          className="text-sm font-bold tabular-nums"
          style={{
            color: s.valueColor,
            fontFamily: "'Space Grotesk', sans-serif",
          }}
        >
          {fmt(n.value)}
        </p>
        {n.sub && (
          <p
            className="text-[10px] truncate mt-0.5"
            style={{ color: "var(--text-4)" }}
          >
            {n.sub}
          </p>
        )}
      </button>
    );
  };

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-stretch gap-2">
        {total && renderNode(total)}
        {deduction && (
          <>
            <div className="flex items-center px-1">
              <span
                className="text-sm font-bold"
                style={{ color: "var(--red)" }}
              >
                −
              </span>
            </div>
            {renderNode(deduction)}
          </>
        )}
      </div>
      {showArrow && (
        <div
          className="flex items-center justify-center text-xs"
          style={{ color: "var(--text-4)" }}
        >
          ↓
        </div>
      )}
      <div className="flex">{renderNode(result)}</div>
    </div>
  );
}

function CausalChainMobile({ onAsk }: { onAsk?: (q: string) => void }) {
  const byId = (id: string) => NODES.find((n) => n.id === id)!;

  return (
    <div className="flex flex-col gap-3">
      {/* Stage 0: three revenue sources → Total Revenue */}
      <div className="grid grid-cols-3 gap-1.5">
        {(["mkt", "d2c", "b2b"] as const).map((id) => {
          const n = byId(id);
          const s = nodeStyle(n.kind);
          const clickable = !!n.ask && !!onAsk;
          return (
            <button
              key={id}
              type="button"
              onClick={() => clickable && onAsk!(n.ask!)}
              disabled={!clickable}
              className="rounded-lg px-2 py-1.5 text-left"
              style={{
                background: s.bg,
                border: `1px solid ${s.border}`,
                cursor: clickable ? "pointer" : "default",
              }}
            >
              <p
                className="text-[9px] font-medium truncate"
                style={{ color: "var(--text-3)" }}
              >
                {n.label}
              </p>
              <p
                className="text-[12px] font-bold tabular-nums"
                style={{
                  color: s.valueColor,
                  fontFamily: "'Space Grotesk', sans-serif",
                }}
              >
                {fmt(n.value)}
              </p>
            </button>
          );
        })}
      </div>
      <div
        className="flex items-center justify-center text-xs -my-1"
        style={{ color: "var(--text-4)" }}
      >
        ↓
      </div>
      <MobileStage
        total={byId("rev")}
        deduction={byId("cogs")}
        result={byId("gp")}
        onAsk={onAsk}
      />
      <MobileStage
        total={byId("gp")}
        deduction={byId("opex")}
        result={byId("ebitda")}
        onAsk={onAsk}
      />
      <MobileStage
        total={byId("ebitda")}
        deduction={byId("fintax")}
        result={byId("net")}
        onAsk={onAsk}
        showArrow={true}
      />
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════
   Main export — renders desktop OR mobile based on breakpoint
   ══════════════════════════════════════════════════════════════ */
export function CausalChain({ onAsk }: { onAsk?: (q: string) => void }) {
  return (
    <div
      className="rounded-md p-4 md:p-5"
      style={{
        background: "var(--bg-surface)",
        border: "1px solid var(--border)",
      }}
    >
      <div className="flex items-start justify-between gap-3 mb-4 flex-wrap">
        <div>
          <p className="text-sm font-bold" style={{ color: "var(--text-1)" }}>
            Causal Chain: where the money goes
          </p>
          <p className="text-xs" style={{ color: "var(--text-4)" }}>
            Revenue to Net P&amp;L. Tap any node to ask Riko about it.
          </p>
        </div>
        <span
          className="text-[10px] font-semibold px-2 py-0.5 rounded-full"
          style={{
            background: "color-mix(in srgb, var(--purple) 12%, transparent)",
            color: "var(--purple)",
            border: "1px solid color-mix(in srgb, var(--purple) 30%, transparent)",
          }}
        >
          FY {new Date().getFullYear() - 1}-{String(new Date().getFullYear()).slice(-2)}
        </span>
      </div>

      {/* Desktop DAG */}
      <div className="hidden md:block">
        <CausalChainDesktop onAsk={onAsk} />
      </div>

      {/* Mobile vertical stages */}
      <div className="md:hidden">
        <CausalChainMobile onAsk={onAsk} />
      </div>
    </div>
  );
}
