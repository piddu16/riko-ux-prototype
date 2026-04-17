"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { R, MONTHS, fCr } from "@/lib/data";

/* ── Tab options ── */
const TABS = ["Overview", "Customers", "Products", "Insights"] as const;

/* ── Sales channel breakdown ── */
const CHANNELS = [
  { name: "Website D2C", pct: 35, growth: 95, color: "var(--green)" },
  { name: "Nykaa", pct: 28, growth: 12, color: "var(--green)" },
  { name: "Amazon / Paytm", pct: 20, growth: -8, color: "var(--red)" },
  { name: "Offline / B2B", pct: 12, growth: 42, color: "var(--green)" },
];

/* ── Bar chart with SVG trend overlay ── */
function RevenueChart() {
  const data = R.ms;
  const max = Math.max(...data);
  const barH = 160;
  const barCount = data.length;
  const barGap = 4;

  /* SVG overlay points for trend line (orange dots connected) */
  const svgW = barCount * 40; /* approximate chart width */
  const trendPoints = data.map((v, i) => {
    const x = (i / (barCount - 1)) * (svgW - 16) + 8;
    const y = barH - (v / max) * (barH - 16) + 8;
    return { x, y };
  });
  const pathD = trendPoints.map((p, i) => `${i === 0 ? "M" : "L"}${p.x},${p.y}`).join(" ");

  return (
    <div className="relative">
      {/* Bars */}
      <div className="flex items-end gap-1" style={{ height: barH }}>
        {data.map((v, i) => {
          const h = (v / max) * (barH - 24);
          return (
            <div key={i} className="flex-1 flex flex-col items-center justify-end gap-1">
              <motion.div
                initial={{ height: 0 }}
                whileInView={{ height: h }}
                viewport={{ once: true, amount: 0.3 }}
                transition={{ duration: 0.5, delay: i * 0.04 }}
                className="w-full rounded-t-md min-w-[14px]"
                style={{ background: "var(--green)" }}
              />
              <span
                className="text-[9px] leading-none"
                style={{ color: "var(--text-4)" }}
              >
                {MONTHS[i]}
              </span>
            </div>
          );
        })}
      </div>

      {/* SVG trend line overlay */}
      <svg
        className="absolute inset-0 w-full pointer-events-none"
        style={{ height: barH }}
        viewBox={`0 0 ${svgW} ${barH + 16}`}
        preserveAspectRatio="none"
        fill="none"
      >
        <path d={pathD} stroke="var(--orange)" strokeWidth={2} fill="none" strokeLinejoin="round" />
        {trendPoints.map((p, i) => (
          <circle key={i} cx={p.x} cy={p.y} r={3} fill="var(--orange)" />
        ))}
      </svg>
    </div>
  );
}

export function SalesScreen() {
  const [activeTab, setActiveTab] = useState<string>("Overview");
  const totalRevenue = fCr(R.rev);

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.1 }}
      transition={{ duration: 0.4 }}
      className="px-4 py-4 max-w-4xl mx-auto w-full"
    >
      {/* Header */}
      <h2 className="text-lg font-bold mb-4" style={{ color: "var(--text-1)" }}>
        Sales
      </h2>

      {/* Tab bar */}
      <div
        className="flex gap-1 rounded-xl p-1 mb-5"
        style={{ background: "var(--bg-surface)", border: "1px solid var(--border)" }}
      >
        {TABS.map((t) => (
          <button
            key={t}
            onClick={() => setActiveTab(t)}
            className="flex-1 text-xs font-medium py-2 rounded-lg transition-colors cursor-pointer"
            style={{
              background: activeTab === t ? "var(--bg-hover)" : "transparent",
              color: activeTab === t ? "var(--green)" : "var(--text-3)",
            }}
          >
            {t}
          </button>
        ))}
      </div>

      {/* Summary KPI */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.35 }}
        className="rounded-xl p-4 mb-5"
        style={{ background: "var(--bg-surface)", border: "1px solid var(--border)" }}
      >
        <p
          className="text-[10px] uppercase tracking-wider font-medium mb-1"
          style={{ color: "var(--text-4)" }}
        >
          Total Sales (FY 2024-25)
        </p>
        <p
          className="text-3xl font-bold"
          style={{ color: "var(--text-1)", fontFamily: "'Space Grotesk', sans-serif" }}
        >
          <span className="text-lg font-medium mr-0.5">{"\u20B9"}</span>
          {totalRevenue}
          <span className="text-lg font-medium ml-0.5">Cr</span>
        </p>
      </motion.div>

      {/* Revenue chart */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.35, delay: 0.1 }}
        className="rounded-xl p-4 mb-5"
        style={{ background: "var(--bg-surface)", border: "1px solid var(--border)" }}
      >
        <p className="text-xs font-semibold mb-3" style={{ color: "var(--text-2)" }}>
          Monthly Revenue
        </p>
        <RevenueChart />
        <div className="flex items-center gap-4 mt-3">
          <span className="flex items-center gap-1.5 text-[10px]" style={{ color: "var(--text-4)" }}>
            <span className="w-2.5 h-2.5 rounded-sm" style={{ background: "var(--green)" }} />
            Revenue
          </span>
          <span className="flex items-center gap-1.5 text-[10px]" style={{ color: "var(--text-4)" }}>
            <span className="w-2.5 h-2.5 rounded-full" style={{ background: "var(--orange)" }} />
            Trend
          </span>
        </div>
      </motion.div>

      {/* Sales Breakdown */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.35, delay: 0.15 }}
        className="rounded-xl p-4"
        style={{ background: "var(--bg-surface)", border: "1px solid var(--border)" }}
      >
        <div className="flex items-baseline gap-2 mb-4">
          <p className="text-xs font-semibold" style={{ color: "var(--text-2)" }}>
            Sales Breakdown
          </p>
          <span className="text-[10px]" style={{ color: "var(--text-4)" }}>
            Ledger
          </span>
        </div>

        <div className="space-y-3">
          {CHANNELS.map((ch) => {
            const positive = ch.growth >= 0;
            return (
              <div key={ch.name}>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-medium" style={{ color: "var(--text-1)" }}>
                    {ch.name}
                  </span>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold tabular-nums" style={{ color: "var(--text-1)" }}>
                      {ch.pct}%
                    </span>
                    <span
                      className="text-[10px] font-semibold px-1.5 py-0.5 rounded"
                      style={{
                        color: positive ? "var(--green)" : "var(--red)",
                        background: positive ? "var(--green-bg)" : "var(--red-bg)",
                      }}
                    >
                      {positive ? "\u25B2" : "\u25BC"} {Math.abs(ch.growth)}%
                    </span>
                  </div>
                </div>
                {/* Progress bar */}
                <div className="w-full h-2 rounded-full overflow-hidden" style={{ background: "var(--bg-hover)" }}>
                  <motion.div
                    initial={{ width: 0 }}
                    whileInView={{ width: `${ch.pct}%` }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.6, ease: "easeOut" }}
                    className="h-full rounded-full"
                    style={{ background: ch.color }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </motion.div>
    </motion.div>
  );
}
