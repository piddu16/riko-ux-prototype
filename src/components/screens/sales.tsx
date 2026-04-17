"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import {
  R,
  MONTHS,
  fCr,
  fL,
  formatINR,
  TOP_CUSTOMERS,
  AOV_TREND,
  COHORT_RETENTION,
  RETURNS_SUMMARY,
  RETURNS_BY_CHANNEL,
  TOP_RETURNED_SKUS,
} from "@/lib/data";

/* ── Tab options ── */
const TABS = ["Overview", "Customers", "Products", "Insights"] as const;

/* ── Sales channel breakdown ── */
const CHANNELS = [
  { name: "Website D2C", pct: 35, growth: 95, color: "var(--green)" },
  { name: "Nykaa", pct: 28, growth: 12, color: "var(--green)" },
  { name: "Amazon / Paytm", pct: 20, growth: -8, color: "var(--red)" },
  { name: "Offline / B2B", pct: 12, growth: 42, color: "var(--green)" },
];

/* ── Channel pill color mapping ── */
function channelColor(channel: string): string {
  if (channel === "D2C") return "var(--green)";
  if (channel === "Marketplace") return "var(--blue)";
  if (channel === "B2B Offline") return "var(--orange)";
  return "var(--text-3)";
}

/* ── Bar chart with SVG trend overlay ── */
function RevenueChart() {
  const data = R.ms;
  const max = Math.max(...data);
  const barH = 160;
  const barCount = data.length;

  /* SVG overlay points for trend line (orange dots connected) */
  const svgW = barCount * 40;
  const trendPoints = data.map((v, i) => {
    const x = (i / (barCount - 1)) * (svgW - 16) + 8;
    const y = barH - (v / max) * (barH - 16) + 8;
    return { x, y };
  });
  const pathD = trendPoints.map((p, i) => `${i === 0 ? "M" : "L"}${p.x},${p.y}`).join(" ");

  return (
    <div className="relative">
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

/* ── AOV trend mini chart ── */
function AovChart() {
  const data = AOV_TREND;
  const max = Math.max(...data.map((d) => d.aov));
  const barH = 120;
  const currentIdx = data.length - 1; // last month = current (Mar)

  return (
    <div className="flex items-end gap-1.5" style={{ height: barH }}>
      {data.map((d, i) => {
        const h = (d.aov / max) * (barH - 26);
        const isCurrent = i === currentIdx;
        return (
          <div key={d.month} className="flex-1 flex flex-col items-center justify-end gap-1">
            <span
              className="text-[9px] tabular-nums font-semibold"
              style={{ color: isCurrent ? "var(--green)" : "var(--text-4)" }}
            >
              {(d.aov / 1000).toFixed(1)}k
            </span>
            <motion.div
              initial={{ height: 0 }}
              whileInView={{ height: h }}
              viewport={{ once: true, amount: 0.3 }}
              transition={{ duration: 0.5, delay: i * 0.03 }}
              className="w-full rounded-t-md min-w-[12px]"
              style={{
                background: isCurrent ? "var(--green)" : "color-mix(in srgb, var(--text-4) 40%, transparent)",
              }}
            />
            <span className="text-[9px] leading-none" style={{ color: "var(--text-4)" }}>
              {d.month}
            </span>
          </div>
        );
      })}
    </div>
  );
}

/* ── Cohort retention heatmap ── */
function retentionColor(pct: number | undefined): string {
  if (pct === undefined) return "var(--bg-secondary)";
  if (pct < 35) return "color-mix(in srgb, var(--red) 45%, var(--bg-secondary))";
  if (pct < 50) return "color-mix(in srgb, var(--green) 18%, var(--bg-secondary))";
  if (pct < 70) return "color-mix(in srgb, var(--green) 38%, var(--bg-secondary))";
  if (pct < 90) return "color-mix(in srgb, var(--green) 60%, var(--bg-secondary))";
  return "color-mix(in srgb, var(--green) 80%, var(--bg-secondary))";
}

function retentionTextColor(pct: number | undefined): string {
  if (pct === undefined) return "var(--text-4)";
  if (pct < 35) return "var(--text-1)";
  return pct >= 70 ? "var(--text-1)" : "var(--text-2)";
}

function CohortGrid() {
  const maxQuarters = Math.max(...COHORT_RETENTION.map((c) => c.retention.length));
  const quarterLabels = Array.from({ length: maxQuarters }, (_, i) => `Q${i}`);

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-xs border-collapse">
        <thead>
          <tr>
            <th
              className="py-2 px-2 text-left font-medium text-[10px] sticky left-0"
              style={{ color: "var(--text-4)", background: "var(--bg-surface)" }}
            >
              Cohort
            </th>
            <th
              className="py-2 px-2 text-right font-medium text-[10px]"
              style={{ color: "var(--text-4)" }}
            >
              Size
            </th>
            {quarterLabels.map((q) => (
              <th
                key={q}
                className="py-2 px-1 text-center font-medium text-[10px]"
                style={{ color: "var(--text-4)" }}
              >
                {q}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {COHORT_RETENTION.map((c) => (
            <tr key={c.cohort}>
              <td
                className="py-1 px-2 text-[10px] font-medium sticky left-0"
                style={{ color: "var(--text-2)", background: "var(--bg-surface)" }}
              >
                {c.cohort}
              </td>
              <td
                className="py-1 px-2 text-right text-[10px] tabular-nums"
                style={{ color: "var(--text-4)" }}
              >
                {c.acquired}
              </td>
              {quarterLabels.map((q, qi) => {
                const pct = c.retention[qi];
                return (
                  <td key={q} className="py-1 px-0.5">
                    {pct !== undefined ? (
                      <div
                        className="rounded text-[10px] font-semibold tabular-nums text-center py-1.5"
                        style={{
                          background: retentionColor(pct),
                          color: retentionTextColor(pct),
                        }}
                      >
                        {pct}%
                      </div>
                    ) : (
                      <div
                        className="rounded text-center py-1.5"
                        style={{ background: "color-mix(in srgb, var(--border) 40%, transparent)" }}
                      >
                        <span className="text-[10px]" style={{ color: "var(--text-4)" }}>—</span>
                      </div>
                    )}
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function SalesScreen() {
  const [activeTab, setActiveTab] = useState<string>("Overview");
  const totalRevenue = fCr(R.rev);

  // Top-3 customers for summary callout
  const top3Revenue = TOP_CUSTOMERS
    .slice()
    .sort((a, b) => b.revenue - a.revenue)
    .slice(0, 3)
    .reduce((s, c) => s + c.revenue, 0);
  const allRevenue = TOP_CUSTOMERS.reduce((s, c) => s + c.revenue, 0);
  const top3Pct = Math.round((top3Revenue / allRevenue) * 100);

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.1 }}
      transition={{ duration: 0.4 }}
      className="px-4 py-4 max-w-4xl mx-auto w-full"
    >
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

      {activeTab === "Overview" && (
        <>
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
            className="rounded-xl p-4 mb-5"
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

          {/* ============================================================ */}
          {/*  RETURNS & CREDIT NOTES section (item 3)                     */}
          {/* ============================================================ */}
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.1 }}
            transition={{ duration: 0.4, delay: 0.2 }}
            className="rounded-xl p-4 mb-5"
            style={{ background: "var(--bg-surface)", border: "1px solid var(--border)" }}
          >
            {/* Header row */}
            <div className="flex items-start justify-between gap-3 mb-4 flex-wrap">
              <div>
                <p className="text-xs font-semibold mb-1" style={{ color: "var(--text-2)" }}>
                  Returns & Credit Notes
                </p>
                <div className="flex items-baseline gap-2 flex-wrap">
                  <p
                    className="text-xl font-bold"
                    style={{ color: "var(--red)", fontFamily: "'Space Grotesk', sans-serif" }}
                  >
                    {formatINR(RETURNS_SUMMARY.totalReturns)}
                  </p>
                  <span className="text-[11px]" style={{ color: "var(--text-3)" }}>
                    in returns ({RETURNS_SUMMARY.returnRate}% of gross sales)
                  </span>
                </div>
              </div>
              <span
                className="text-[11px] font-semibold px-2 py-1 rounded-md flex-shrink-0"
                style={{
                  color: "var(--red)",
                  background: "color-mix(in srgb, var(--red) 12%, transparent)",
                  border: "1px solid color-mix(in srgb, var(--red) 25%, transparent)",
                }}
              >
                ▲ +{RETURNS_SUMMARY.trendPct}% vs last quarter
              </span>
            </div>

            {/* Channel cards — 3 cols desktop, 2 cols mobile */}
            <div className="grid grid-cols-2 md:grid-cols-3 gap-2.5 mb-4">
              {RETURNS_BY_CHANNEL.map((ch) => (
                <div
                  key={ch.channel}
                  className="rounded-lg p-3"
                  style={{
                    background: "var(--bg-secondary)",
                    borderLeft: "3px solid var(--red)",
                    border: "1px solid var(--border)",
                    borderLeftWidth: "3px",
                    borderLeftColor: "var(--red)",
                  }}
                >
                  <div className="flex items-center justify-between mb-1.5">
                    <p className="text-xs font-semibold" style={{ color: "var(--text-1)" }}>
                      {ch.channel}
                    </p>
                    <span
                      className="text-xs font-bold tabular-nums"
                      style={{
                        color: ch.rate >= 20 ? "var(--red)" : ch.rate >= 10 ? "var(--yellow)" : "var(--text-2)",
                        fontFamily: "'Space Grotesk', sans-serif",
                      }}
                    >
                      {ch.rate}%
                    </span>
                  </div>
                  <div className="flex items-baseline gap-2 mb-1">
                    <span
                      className="text-sm font-bold tabular-nums"
                      style={{ color: "var(--text-1)", fontFamily: "'Space Grotesk', sans-serif" }}
                    >
                      {formatINR(ch.returns)}
                    </span>
                    <span className="text-[10px]" style={{ color: "var(--text-4)" }}>
                      · {ch.count} returns
                    </span>
                  </div>
                  <p className="text-[10px] truncate" style={{ color: "var(--text-4)" }}>
                    {ch.topReason}
                  </p>
                </div>
              ))}
            </div>

            {/* Top 5 returned SKUs table */}
            <p className="text-[11px] font-semibold mb-2" style={{ color: "var(--text-2)" }}>
              Top Returned SKUs
            </p>
            <div
              className="rounded-lg overflow-hidden mb-4"
              style={{ border: "1px solid var(--border)" }}
            >
              <table className="w-full text-xs">
                <thead>
                  <tr style={{ background: "var(--bg-secondary)" }}>
                    <th
                      className="px-3 py-2 text-left font-medium text-[10px]"
                      style={{ color: "var(--text-4)" }}
                    >
                      SKU
                    </th>
                    <th
                      className="px-3 py-2 text-left font-medium text-[10px]"
                      style={{ color: "var(--text-4)" }}
                    >
                      Product
                    </th>
                    <th
                      className="px-3 py-2 text-right font-medium text-[10px]"
                      style={{ color: "var(--text-4)" }}
                    >
                      Returns
                    </th>
                    <th
                      className="px-3 py-2 text-right font-medium text-[10px]"
                      style={{ color: "var(--text-4)" }}
                    >
                      Rate
                    </th>
                    <th
                      className="px-3 py-2 text-right font-medium text-[10px]"
                      style={{ color: "var(--text-4)" }}
                    >
                      Loss
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {TOP_RETURNED_SKUS.map((s, i) => (
                    <tr
                      key={s.sku}
                      style={{
                        borderTop: i === 0 ? "none" : "1px solid var(--border)",
                        background: i % 2 === 0 ? "transparent" : "color-mix(in srgb, var(--bg-secondary) 50%, transparent)",
                      }}
                    >
                      <td className="px-3 py-2 font-mono text-[10px]" style={{ color: "var(--text-4)" }}>
                        {s.sku}
                      </td>
                      <td className="px-3 py-2 truncate max-w-[200px]" style={{ color: "var(--text-2)" }}>
                        {s.name}
                      </td>
                      <td
                        className="px-3 py-2 text-right tabular-nums"
                        style={{ color: "var(--text-1)" }}
                      >
                        {s.returns}
                      </td>
                      <td
                        className="px-3 py-2 text-right tabular-nums font-semibold"
                        style={{
                          color: s.rate >= 20 ? "var(--red)" : s.rate >= 10 ? "var(--yellow)" : "var(--text-2)",
                        }}
                      >
                        {s.rate}%
                      </td>
                      <td
                        className="px-3 py-2 text-right tabular-nums font-bold"
                        style={{
                          color: "var(--red)",
                          fontFamily: "'Space Grotesk', sans-serif",
                        }}
                      >
                        {formatINR(s.loss)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Footer insight box */}
            <div
              className="rounded-lg px-3 py-2.5 text-xs leading-relaxed"
              style={{
                background: "color-mix(in srgb, var(--yellow) 12%, transparent)",
                border: "1px solid color-mix(in srgb, var(--yellow) 25%, transparent)",
                color: "var(--yellow)",
              }}
            >
              <span className="font-semibold">💡 Insight:</span>{" "}
              <span style={{ color: "var(--text-2)" }}>
                Amazon return rate (32.5%) is 6x your Website D2C rate. Review listing quality,
                packaging, or SLAs.
              </span>
            </div>
          </motion.div>
        </>
      )}

      {activeTab === "Customers" && (
        <>
          {/* Top Customers table */}
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.1 }}
            transition={{ duration: 0.35 }}
            className="rounded-xl p-4 mb-5"
            style={{ background: "var(--bg-surface)", border: "1px solid var(--border)" }}
          >
            <p className="text-xs font-semibold mb-3" style={{ color: "var(--text-2)" }}>
              Top Customers
            </p>

            {/* Desktop table */}
            <div
              className="hidden md:block rounded-lg overflow-x-auto"
              style={{ border: "1px solid var(--border)" }}
            >
              <table className="w-full text-xs">
                <thead>
                  <tr style={{ background: "var(--bg-secondary)" }}>
                    <th
                      className="px-3 py-2 text-left font-medium text-[10px]"
                      style={{ color: "var(--text-4)" }}
                    >
                      Customer
                    </th>
                    <th
                      className="px-3 py-2 text-left font-medium text-[10px]"
                      style={{ color: "var(--text-4)" }}
                    >
                      Channel
                    </th>
                    <th
                      className="px-3 py-2 text-right font-medium text-[10px]"
                      style={{ color: "var(--text-4)" }}
                    >
                      Revenue
                    </th>
                    <th
                      className="px-3 py-2 text-right font-medium text-[10px]"
                      style={{ color: "var(--text-4)" }}
                    >
                      Orders
                    </th>
                    <th
                      className="px-3 py-2 text-right font-medium text-[10px]"
                      style={{ color: "var(--text-4)" }}
                    >
                      AOV
                    </th>
                    <th
                      className="px-3 py-2 text-right font-medium text-[10px]"
                      style={{ color: "var(--text-4)" }}
                    >
                      Last Order
                    </th>
                    <th
                      className="px-3 py-2 text-right font-medium text-[10px]"
                      style={{ color: "var(--text-4)" }}
                    >
                      LTV
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {TOP_CUSTOMERS.map((c, i) => {
                    const col = channelColor(c.channel);
                    return (
                      <motion.tr
                        key={c.name}
                        initial={{ opacity: 0, y: 6 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true, amount: 0.1 }}
                        transition={{ duration: 0.25, delay: i * 0.03 }}
                        style={{
                          borderTop: i === 0 ? "none" : "1px solid var(--border)",
                          background: i % 2 === 0 ? "transparent" : "color-mix(in srgb, var(--bg-secondary) 50%, transparent)",
                        }}
                      >
                        <td className="px-3 py-2 font-medium truncate max-w-[200px]" style={{ color: "var(--text-1)" }}>
                          {c.name}
                        </td>
                        <td className="px-3 py-2">
                          <span
                            className="text-[10px] font-semibold px-2 py-0.5 rounded-full inline-block"
                            style={{
                              color: col,
                              background: `color-mix(in srgb, ${col} 20%, transparent)`,
                            }}
                          >
                            {c.channel}
                          </span>
                        </td>
                        <td
                          className="px-3 py-2 text-right tabular-nums font-bold"
                          style={{ color: "var(--text-1)", fontFamily: "'Space Grotesk', sans-serif" }}
                        >
                          {formatINR(c.revenue)}
                        </td>
                        <td className="px-3 py-2 text-right tabular-nums" style={{ color: "var(--text-2)" }}>
                          {c.orders}
                        </td>
                        <td
                          className="px-3 py-2 text-right tabular-nums"
                          style={{ color: "var(--text-2)", fontFamily: "'Space Grotesk', sans-serif" }}
                        >
                          {formatINR(c.aov, { raw: true })}
                        </td>
                        <td className="px-3 py-2 text-right text-[10px]" style={{ color: "var(--text-4)" }}>
                          {c.lastOrder}
                        </td>
                        <td
                          className="px-3 py-2 text-right tabular-nums font-semibold"
                          style={{ color: "var(--green)", fontFamily: "'Space Grotesk', sans-serif" }}
                        >
                          {formatINR(c.ltv)}
                        </td>
                      </motion.tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Mobile cards */}
            <div className="md:hidden flex flex-col gap-2">
              {TOP_CUSTOMERS.map((c, i) => {
                const col = channelColor(c.channel);
                return (
                  <motion.div
                    key={c.name}
                    initial={{ opacity: 0, y: 8 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.3, delay: i * 0.03 }}
                    className="rounded-lg p-3"
                    style={{ background: "var(--bg-secondary)", border: "1px solid var(--border)" }}
                  >
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <p className="text-xs font-medium truncate flex-1" style={{ color: "var(--text-1)" }}>
                        {c.name}
                      </p>
                      <span
                        className="text-[9px] font-semibold px-1.5 py-0.5 rounded-full inline-block flex-shrink-0"
                        style={{
                          color: col,
                          background: `color-mix(in srgb, ${col} 20%, transparent)`,
                        }}
                      >
                        {c.channel}
                      </span>
                    </div>
                    <div className="grid grid-cols-3 gap-2 text-[10px]">
                      <div>
                        <p style={{ color: "var(--text-4)" }}>Revenue</p>
                        <p
                          className="font-bold tabular-nums"
                          style={{ color: "var(--text-1)", fontFamily: "'Space Grotesk', sans-serif" }}
                        >
                          {formatINR(c.revenue)}
                        </p>
                      </div>
                      <div>
                        <p style={{ color: "var(--text-4)" }}>Orders</p>
                        <p className="font-semibold tabular-nums" style={{ color: "var(--text-2)" }}>
                          {c.orders}
                        </p>
                      </div>
                      <div>
                        <p style={{ color: "var(--text-4)" }}>LTV</p>
                        <p
                          className="font-bold tabular-nums"
                          style={{ color: "var(--green)", fontFamily: "'Space Grotesk', sans-serif" }}
                        >
                          {formatINR(c.ltv)}
                        </p>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </motion.div>

          {/* AOV trend mini chart */}
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.1 }}
            transition={{ duration: 0.35, delay: 0.05 }}
            className="rounded-xl p-4 mb-5"
            style={{ background: "var(--bg-surface)", border: "1px solid var(--border)" }}
          >
            <div className="flex items-baseline justify-between gap-2 mb-3">
              <p className="text-xs font-semibold" style={{ color: "var(--text-2)" }}>
                AOV Trend
              </p>
              <span className="text-[10px]" style={{ color: "var(--text-4)" }}>
                12-month · current in green
              </span>
            </div>
            <AovChart />
          </motion.div>

          {/* Cohort retention grid */}
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.1 }}
            transition={{ duration: 0.35, delay: 0.1 }}
            className="rounded-xl p-4 mb-5"
            style={{ background: "var(--bg-surface)", border: "1px solid var(--border)" }}
          >
            <div className="flex items-baseline justify-between gap-2 mb-3">
              <p className="text-xs font-semibold" style={{ color: "var(--text-2)" }}>
                Cohort Retention
              </p>
              <span className="text-[10px]" style={{ color: "var(--text-4)" }}>
                % of cohort still active · red &lt;35%
              </span>
            </div>
            <CohortGrid />
          </motion.div>

          {/* Summary callout */}
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.1 }}
            transition={{ duration: 0.35, delay: 0.15 }}
            className="rounded-xl px-4 py-3 text-xs leading-relaxed"
            style={{
              background: "color-mix(in srgb, var(--yellow) 12%, transparent)",
              border: "1px solid color-mix(in srgb, var(--yellow) 25%, transparent)",
              color: "var(--yellow)",
            }}
          >
            <span className="font-bold">Concentration risk:</span>{" "}
            <span style={{ color: "var(--text-2)" }}>
              Top 3 customers = {"\u20B9"}{fL(top3Revenue)}L = {top3Pct}% of revenue.
              Diversify or negotiate lock-in contracts.
            </span>
          </motion.div>
        </>
      )}

      {(activeTab === "Products" || activeTab === "Insights") && (
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.35 }}
          className="rounded-xl p-8 text-center"
          style={{ background: "var(--bg-surface)", border: "1px solid var(--border)" }}
        >
          <p className="text-sm font-semibold mb-1" style={{ color: "var(--text-2)" }}>
            {activeTab} — Coming soon
          </p>
          <p className="text-xs" style={{ color: "var(--text-4)" }}>
            This view is under construction.
          </p>
        </motion.div>
      )}
    </motion.div>
  );
}
