"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import {
  R,
  K,
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
  TOP_SKUS_BY_REVENUE,
  STATE_WISE_SALES,
  HSN_WISE_SALES,
  R_FY24_MS,
  CUSTOMER_CONCENTRATION,
} from "@/lib/data";

/* ── Tab options ── */
const TABS = ["Overview", "Customers", "Products", "Insights"] as const;

/* ── Sales by ledger — Tally segments channels via separate sales ledgers
 *    (Sales – Website D2C, Sales – Nykaa, etc). Pct + growth are derived
 *    from SUM(voucher.amount) grouped by sales ledger, this FY vs last FY. ── */
const CHANNELS = [
  { name: "Sales – Website D2C",   pct: 35, growth: 95, color: "var(--green)" },
  { name: "Sales – Nykaa",         pct: 28, growth: 12, color: "var(--green)" },
  { name: "Sales – Amazon/Paytm",  pct: 20, growth: -8, color: "var(--red)" },
  { name: "Sales – Offline / B2B", pct: 12, growth: 42, color: "var(--green)" },
];

/* ── Channel pill color mapping ── */
function channelColor(channel: string): string {
  if (channel === "D2C") return "var(--green)";
  if (channel === "Marketplace") return "var(--blue)";
  if (channel === "B2B Offline") return "var(--orange)";
  return "var(--text-3)";
}

/* ── Monthly revenue bars (FY25) with FY24 line overlay ──
 *    Both series are SUM(sales vouchers) GROUP BY month, different years. ── */
function RevenueChart() {
  const data = R.ms;
  const priorYear = R_FY24_MS;
  const max = Math.max(...data, ...priorYear);
  const barH = 160;
  const barCount = data.length;

  /* SVG overlay points for prior-year line */
  const svgW = barCount * 40;
  const pyPoints = priorYear.map((v, i) => {
    const x = (i / (barCount - 1)) * (svgW - 16) + 8;
    const y = barH - (v / max) * (barH - 16) + 8;
    return { x, y };
  });
  const pathD = pyPoints.map((p, i) => `${i === 0 ? "M" : "L"}${p.x},${p.y}`).join(" ");

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
        <path d={pathD} stroke="var(--text-4)" strokeWidth={1.5} strokeDasharray="3 3" fill="none" strokeLinejoin="round" />
        {pyPoints.map((p, i) => (
          <circle key={i} cx={p.x} cy={p.y} r={2.5} fill="var(--text-4)" />
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
          {/* Summary KPI — Total Sales. YoY comparison shown on the chart
              overlay below (FY25 bars vs FY24 dashed line) to keep the number
              and the comparison visually grounded in the same aggregation. */}
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
              Total Sales (FY 2025-26)
            </p>
            <p
              className="text-3xl font-bold"
              style={{ color: "var(--text-1)", fontFamily: "'Space Grotesk', sans-serif" }}
            >
              <span className="text-lg font-medium mr-0.5">{"\u20B9"}</span>
              {totalRevenue}
              <span className="text-lg font-medium ml-0.5">Cr</span>
            </p>
            <p className="text-[10px] mt-1" style={{ color: "var(--text-4)" }}>
              SUM(sales vouchers) · FY24 comparison in chart below
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
            <div className="flex items-baseline justify-between gap-2 mb-3 flex-wrap">
              <p className="text-xs font-semibold" style={{ color: "var(--text-2)" }}>
                Monthly Revenue
              </p>
              <span className="text-[10px]" style={{ color: "var(--text-4)" }}>
                SUM(sales vouchers) by month · FY25 vs FY24
              </span>
            </div>
            <RevenueChart />
            <div className="flex items-center gap-4 mt-3">
              <span className="flex items-center gap-1.5 text-[10px]" style={{ color: "var(--text-4)" }}>
                <span className="w-2.5 h-2.5 rounded-sm" style={{ background: "var(--green)" }} />
                FY25
              </span>
              <span className="flex items-center gap-1.5 text-[10px]" style={{ color: "var(--text-4)" }}>
                <span className="w-4 h-[2px] rounded-sm" style={{ background: "var(--text-4)" }} />
                FY24
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
            <div className="flex items-baseline justify-between gap-2 mb-4 flex-wrap">
              <p className="text-xs font-semibold" style={{ color: "var(--text-2)" }}>
                Sales by ledger
              </p>
              <span className="text-[10px]" style={{ color: "var(--text-4)" }}>
                Channel = sales ledger in Tally · growth vs FY24
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

          {/* State-wise sales — GSTIN state code (first 2 digits) GROUP BY state.
              Same query as GSTR-1 Table 5/7 for B2B IGST by place of supply. */}
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.1 }}
            transition={{ duration: 0.35, delay: 0.17 }}
            className="rounded-xl p-4 mb-5"
            style={{ background: "var(--bg-surface)", border: "1px solid var(--border)" }}
          >
            <div className="flex items-baseline justify-between gap-2 mb-4 flex-wrap">
              <p className="text-xs font-semibold" style={{ color: "var(--text-2)" }}>
                Sales by state
              </p>
              <span className="text-[10px]" style={{ color: "var(--text-4)" }}>
                Top 6 · from party GSTIN state code · FY25
              </span>
            </div>
            {(() => {
              const top6 = STATE_WISE_SALES.slice(0, 6);
              const topMax = Math.max(...top6.map((s) => s.taxableValue));
              const totalTaxable = STATE_WISE_SALES.reduce((s, r) => s + r.taxableValue, 0);
              return (
                <div className="space-y-2.5">
                  {top6.map((s) => {
                    const pct = (s.taxableValue / totalTaxable) * 100;
                    const barW = (s.taxableValue / topMax) * 100;
                    return (
                      <div key={s.stateCode}>
                        <div className="flex items-center justify-between mb-1 gap-2">
                          <div className="flex items-center gap-1.5 min-w-0">
                            <span
                              className="text-[9px] font-mono px-1 py-0.5 rounded flex-shrink-0"
                              style={{ background: "var(--bg-hover)", color: "var(--text-4)" }}
                            >
                              {s.stateCode}
                            </span>
                            <span className="text-xs font-medium truncate" style={{ color: "var(--text-1)" }}>
                              {s.state}
                            </span>
                          </div>
                          <div className="flex items-center gap-2 flex-shrink-0">
                            <span
                              className="text-[10px] tabular-nums"
                              style={{ color: "var(--text-4)" }}
                            >
                              {s.invoiceCount} inv
                            </span>
                            <span
                              className="text-xs font-bold tabular-nums"
                              style={{ color: "var(--text-1)", fontFamily: "'Space Grotesk', sans-serif" }}
                            >
                              {formatINR(s.taxableValue)}
                            </span>
                            <span className="text-[10px] tabular-nums w-10 text-right" style={{ color: "var(--text-3)" }}>
                              {pct.toFixed(1)}%
                            </span>
                          </div>
                        </div>
                        <div className="w-full h-1.5 rounded-full overflow-hidden" style={{ background: "var(--bg-hover)" }}>
                          <motion.div
                            initial={{ width: 0 }}
                            whileInView={{ width: `${barW}%` }}
                            viewport={{ once: true }}
                            transition={{ duration: 0.5, ease: "easeOut" }}
                            className="h-full rounded-full"
                            style={{ background: "var(--blue)" }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              );
            })()}
          </motion.div>

          {/* ============================================================ */}
          {/*  RETURNS & CREDIT NOTES section                              */}
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
                  <div className="flex items-baseline gap-2">
                    <span
                      className="text-sm font-bold tabular-nums"
                      style={{ color: "var(--text-1)", fontFamily: "'Space Grotesk', sans-serif" }}
                    >
                      {formatINR(ch.returns)}
                    </span>
                    <span className="text-[10px]" style={{ color: "var(--text-4)" }}>
                      · {ch.count} credit notes
                    </span>
                  </div>
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

            {/* Footer — factual comparison only, no prescription */}
            <div
              className="rounded-lg px-3 py-2.5 text-xs leading-relaxed"
              style={{
                background: "color-mix(in srgb, var(--yellow) 12%, transparent)",
                border: "1px solid color-mix(in srgb, var(--yellow) 25%, transparent)",
                color: "var(--yellow)",
              }}
            >
              <span className="font-semibold">Amazon return rate is 5.7× your Website D2C rate</span>{" "}
              <span style={{ color: "var(--text-3)" }}>
                (32.5% vs 5.7%).
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

      {activeTab === "Products" && <ProductsTab />}
      {activeTab === "Insights" && <InsightsTab />}
    </motion.div>
  );
}

/* ──────────────────────────────────────────────────────────────
   PRODUCTS TAB
   Every query below is a GROUP BY stock_item aggregation that a
   dev can write directly against Tally's sales voucher + stock
   master tables. No invented fields.
   ────────────────────────────────────────────────────────────── */
function ProductsTab() {
  const byRevenue = TOP_SKUS_BY_REVENUE.slice().sort((a, b) => b.revenue - a.revenue);
  const byQty = TOP_SKUS_BY_REVENUE.slice().sort((a, b) => b.qty - a.qty).slice(0, 5);
  const lowMargin = TOP_SKUS_BY_REVENUE.filter((s) => s.marginPct < 25);
  const maxQty = Math.max(...byQty.map((s) => s.qty));

  return (
    <>
      {/* Summary strip — 3 cards derived from TOP_SKUS_BY_REVENUE */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.35 }}
        className="grid grid-cols-3 gap-2.5 mb-5"
      >
        {(() => {
          const totalQty = TOP_SKUS_BY_REVENUE.reduce((s, r) => s + r.qty, 0);
          const totalRev = TOP_SKUS_BY_REVENUE.reduce((s, r) => s + r.revenue, 0);
          const weightedMargin =
            TOP_SKUS_BY_REVENUE.reduce((s, r) => s + r.marginPct * r.revenue, 0) / totalRev;
          return (
            <>
              <div className="rounded-xl p-3" style={{ background: "var(--bg-surface)", border: "1px solid var(--border)" }}>
                <p className="text-[10px] uppercase tracking-wider font-medium mb-1" style={{ color: "var(--text-4)" }}>
                  Active SKUs
                </p>
                <p className="text-xl font-bold tabular-nums" style={{ color: "var(--text-1)", fontFamily: "'Space Grotesk', sans-serif" }}>
                  {TOP_SKUS_BY_REVENUE.length}
                </p>
                <p className="text-[10px]" style={{ color: "var(--text-4)" }}>
                  with sales FY25
                </p>
              </div>
              <div className="rounded-xl p-3" style={{ background: "var(--bg-surface)", border: "1px solid var(--border)" }}>
                <p className="text-[10px] uppercase tracking-wider font-medium mb-1" style={{ color: "var(--text-4)" }}>
                  Units sold
                </p>
                <p className="text-xl font-bold tabular-nums" style={{ color: "var(--text-1)", fontFamily: "'Space Grotesk', sans-serif" }}>
                  {totalQty.toLocaleString("en-IN")}
                </p>
                <p className="text-[10px]" style={{ color: "var(--text-4)" }}>
                  SUM(sales qty)
                </p>
              </div>
              <div className="rounded-xl p-3" style={{ background: "var(--bg-surface)", border: "1px solid var(--border)" }}>
                <p className="text-[10px] uppercase tracking-wider font-medium mb-1" style={{ color: "var(--text-4)" }}>
                  Avg margin
                </p>
                <p
                  className="text-xl font-bold tabular-nums"
                  style={{
                    color: weightedMargin >= 35 ? "var(--green)" : weightedMargin >= 20 ? "var(--yellow)" : "var(--red)",
                    fontFamily: "'Space Grotesk', sans-serif",
                  }}
                >
                  {weightedMargin.toFixed(1)}%
                </p>
                <p className="text-[10px]" style={{ color: "var(--text-4)" }}>
                  revenue-weighted
                </p>
              </div>
            </>
          );
        })()}
      </motion.div>

      {/* Top SKUs by revenue + margin */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, amount: 0.1 }}
        transition={{ duration: 0.35, delay: 0.05 }}
        className="rounded-xl p-4 mb-5"
        style={{ background: "var(--bg-surface)", border: "1px solid var(--border)" }}
      >
        <div className="flex items-baseline justify-between gap-2 mb-3 flex-wrap">
          <p className="text-xs font-semibold" style={{ color: "var(--text-2)" }}>
            Top SKUs by revenue
          </p>
          <span className="text-[10px]" style={{ color: "var(--text-4)" }}>
            GROUP BY stock item on sales line items · margin from stock master rates
          </span>
        </div>

        <div className="rounded-lg overflow-x-auto" style={{ border: "1px solid var(--border)" }}>
          <table className="w-full text-xs">
            <thead>
              <tr style={{ background: "var(--bg-secondary)" }}>
                <th className="px-3 py-2 text-left font-medium text-[10px]" style={{ color: "var(--text-4)" }}>SKU</th>
                <th className="px-3 py-2 text-left font-medium text-[10px]" style={{ color: "var(--text-4)" }}>Product</th>
                <th className="px-3 py-2 text-left font-medium text-[10px]" style={{ color: "var(--text-4)" }}>HSN</th>
                <th className="px-3 py-2 text-right font-medium text-[10px]" style={{ color: "var(--text-4)" }}>Qty</th>
                <th className="px-3 py-2 text-right font-medium text-[10px]" style={{ color: "var(--text-4)" }}>Revenue</th>
                <th className="px-3 py-2 text-right font-medium text-[10px]" style={{ color: "var(--text-4)" }}>Sales rate</th>
                <th className="px-3 py-2 text-right font-medium text-[10px]" style={{ color: "var(--text-4)" }}>Cost rate</th>
                <th className="px-3 py-2 text-right font-medium text-[10px]" style={{ color: "var(--text-4)" }}>Margin</th>
              </tr>
            </thead>
            <tbody>
              {byRevenue.map((s, i) => {
                const marginColor = s.marginPct >= 40 ? "var(--green)" : s.marginPct >= 25 ? "var(--text-1)" : s.marginPct >= 15 ? "var(--yellow)" : "var(--red)";
                return (
                  <motion.tr
                    key={s.sku}
                    initial={{ opacity: 0, y: 6 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true, amount: 0.1 }}
                    transition={{ duration: 0.25, delay: i * 0.02 }}
                    style={{
                      borderTop: i === 0 ? "none" : "1px solid var(--border)",
                      background: i % 2 === 0 ? "transparent" : "color-mix(in srgb, var(--bg-secondary) 50%, transparent)",
                    }}
                  >
                    <td className="px-3 py-2 font-mono text-[10px]" style={{ color: "var(--text-4)" }}>{s.sku}</td>
                    <td className="px-3 py-2 truncate max-w-[220px]" style={{ color: "var(--text-1)" }}>{s.name}</td>
                    <td className="px-3 py-2 font-mono text-[10px]" style={{ color: "var(--text-3)" }}>{s.hsn}</td>
                    <td className="px-3 py-2 text-right tabular-nums" style={{ color: "var(--text-2)" }}>{s.qty.toLocaleString("en-IN")}</td>
                    <td className="px-3 py-2 text-right tabular-nums font-bold" style={{ color: "var(--text-1)", fontFamily: "'Space Grotesk', sans-serif" }}>{formatINR(s.revenue)}</td>
                    <td className="px-3 py-2 text-right tabular-nums" style={{ color: "var(--text-3)", fontFamily: "'Space Grotesk', sans-serif" }}>{formatINR(s.avgSalesRate, { raw: true })}</td>
                    <td className="px-3 py-2 text-right tabular-nums" style={{ color: "var(--text-4)", fontFamily: "'Space Grotesk', sans-serif" }}>{formatINR(s.avgCostRate, { raw: true })}</td>
                    <td className="px-3 py-2 text-right tabular-nums font-semibold" style={{ color: marginColor }}>{s.marginPct.toFixed(1)}%</td>
                  </motion.tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {lowMargin.length > 0 && (
          <div
            className="mt-3 rounded-lg px-3 py-2 text-[11px]"
            style={{
              background: "color-mix(in srgb, var(--yellow) 10%, transparent)",
              border: "1px solid color-mix(in srgb, var(--yellow) 25%, transparent)",
              color: "var(--text-2)",
            }}
          >
            <span className="font-semibold" style={{ color: "var(--yellow)" }}>
              {lowMargin.length} SKU{lowMargin.length > 1 ? "s" : ""} below 25% margin:
            </span>{" "}
            {lowMargin.map((s) => s.sku).join(", ")}
          </div>
        )}
      </motion.div>

      {/* Top SKUs by qty (volume movers) */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, amount: 0.1 }}
        transition={{ duration: 0.35, delay: 0.1 }}
        className="rounded-xl p-4 mb-5"
        style={{ background: "var(--bg-surface)", border: "1px solid var(--border)" }}
      >
        <div className="flex items-baseline justify-between gap-2 mb-3 flex-wrap">
          <p className="text-xs font-semibold" style={{ color: "var(--text-2)" }}>
            Top movers by quantity
          </p>
          <span className="text-[10px]" style={{ color: "var(--text-4)" }}>
            Units sold this FY
          </span>
        </div>
        <div className="space-y-2.5">
          {byQty.map((s) => {
            const barW = (s.qty / maxQty) * 100;
            return (
              <div key={s.sku}>
                <div className="flex items-center justify-between mb-1 gap-2">
                  <span className="text-xs font-medium truncate" style={{ color: "var(--text-1)" }}>{s.name}</span>
                  <span
                    className="text-xs font-bold tabular-nums flex-shrink-0"
                    style={{ color: "var(--text-1)", fontFamily: "'Space Grotesk', sans-serif" }}
                  >
                    {s.qty.toLocaleString("en-IN")}
                  </span>
                </div>
                <div className="w-full h-1.5 rounded-full overflow-hidden" style={{ background: "var(--bg-hover)" }}>
                  <motion.div
                    initial={{ width: 0 }}
                    whileInView={{ width: `${barW}%` }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.5, ease: "easeOut" }}
                    className="h-full rounded-full"
                    style={{ background: "var(--purple)" }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </motion.div>

      {/* HSN-wise sales — same query as GSTR-1 Table 12 */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, amount: 0.1 }}
        transition={{ duration: 0.35, delay: 0.15 }}
        className="rounded-xl p-4 mb-5"
        style={{ background: "var(--bg-surface)", border: "1px solid var(--border)" }}
      >
        <div className="flex items-baseline justify-between gap-2 mb-3 flex-wrap">
          <p className="text-xs font-semibold" style={{ color: "var(--text-2)" }}>
            HSN-wise sales
          </p>
          <span className="text-[10px]" style={{ color: "var(--text-4)" }}>
            Same aggregation as GSTR-1 Table 12
          </span>
        </div>

        <div className="rounded-lg overflow-x-auto" style={{ border: "1px solid var(--border)" }}>
          <table className="w-full text-xs">
            <thead>
              <tr style={{ background: "var(--bg-secondary)" }}>
                <th className="px-3 py-2 text-left font-medium text-[10px]" style={{ color: "var(--text-4)" }}>HSN</th>
                <th className="px-3 py-2 text-left font-medium text-[10px]" style={{ color: "var(--text-4)" }}>Description</th>
                <th className="px-3 py-2 text-right font-medium text-[10px]" style={{ color: "var(--text-4)" }}>Invoices</th>
                <th className="px-3 py-2 text-right font-medium text-[10px]" style={{ color: "var(--text-4)" }}>Taxable value</th>
                <th className="px-3 py-2 text-right font-medium text-[10px]" style={{ color: "var(--text-4)" }}>Tax</th>
                <th className="px-3 py-2 text-right font-medium text-[10px]" style={{ color: "var(--text-4)" }}>Total</th>
              </tr>
            </thead>
            <tbody>
              {HSN_WISE_SALES.map((h, i) => (
                <tr
                  key={h.hsn}
                  style={{
                    borderTop: i === 0 ? "none" : "1px solid var(--border)",
                    background: i % 2 === 0 ? "transparent" : "color-mix(in srgb, var(--bg-secondary) 50%, transparent)",
                  }}
                >
                  <td className="px-3 py-2 font-mono text-[10px]" style={{ color: "var(--text-3)" }}>{h.hsn}</td>
                  <td className="px-3 py-2 truncate max-w-[240px]" style={{ color: "var(--text-2)" }}>{h.particulars}</td>
                  <td className="px-3 py-2 text-right tabular-nums" style={{ color: "var(--text-3)" }}>{h.invoiceCount.toLocaleString("en-IN")}</td>
                  <td className="px-3 py-2 text-right tabular-nums" style={{ color: "var(--text-2)", fontFamily: "'Space Grotesk', sans-serif" }}>{formatINR(h.taxableValue)}</td>
                  <td className="px-3 py-2 text-right tabular-nums" style={{ color: "var(--text-3)", fontFamily: "'Space Grotesk', sans-serif" }}>{formatINR(h.tax)}</td>
                  <td className="px-3 py-2 text-right tabular-nums font-bold" style={{ color: "var(--text-1)", fontFamily: "'Space Grotesk', sans-serif" }}>{formatINR(h.invoiceValue)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </motion.div>
    </>
  );
}

/* ──────────────────────────────────────────────────────────────
   INSIGHTS TAB
   All numbers factually derived from existing Tally aggregations.
   No prescriptive prose — the numbers are the insight.
   ────────────────────────────────────────────────────────────── */
function InsightsTab() {
  /* YoY growth per month = (FY25 - FY24) / FY24 */
  const yoyByMonth = R.ms.map((v, i) => {
    const prior = R_FY24_MS[i];
    const pct = ((v - prior) / prior) * 100;
    return { month: MONTHS[i], fy25: v, fy24: prior, pct };
  });
  const yoyMax = Math.max(...yoyByMonth.map((m) => Math.abs(m.pct)));
  const bestMonth = yoyByMonth.slice().sort((a, b) => b.pct - a.pct)[0];
  const worstMonth = yoyByMonth.slice().sort((a, b) => a.pct - b.pct)[0];

  /* State concentration — top 3 / total taxable */
  const stateTotal = STATE_WISE_SALES.reduce((s, r) => s + r.taxableValue, 0);
  const top3States = STATE_WISE_SALES.slice(0, 3);
  const top3StatePct = (top3States.reduce((s, r) => s + r.taxableValue, 0) / stateTotal) * 100;

  /* Repeat vs new (TOP_CUSTOMERS has repeat boolean derived from orders>1) */
  const repeatCount = TOP_CUSTOMERS.filter((c) => c.repeat).length;
  const newCount = TOP_CUSTOMERS.length - repeatCount;
  const repeatRev = TOP_CUSTOMERS.filter((c) => c.repeat).reduce((s, c) => s + c.revenue, 0);
  const totalCustRev = TOP_CUSTOMERS.reduce((s, c) => s + c.revenue, 0);
  const repeatRevPct = (repeatRev / totalCustRev) * 100;

  /* Peak return month — using returnRate as proxy indicator */
  const returnChannelSorted = RETURNS_BY_CHANNEL.slice().sort((a, b) => b.rate - a.rate);

  return (
    <>
      {/* YoY growth by month */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, amount: 0.1 }}
        transition={{ duration: 0.35 }}
        className="rounded-xl p-4 mb-5"
        style={{ background: "var(--bg-surface)", border: "1px solid var(--border)" }}
      >
        <div className="flex items-baseline justify-between gap-2 mb-3 flex-wrap">
          <p className="text-xs font-semibold" style={{ color: "var(--text-2)" }}>
            YoY growth by month
          </p>
          <span className="text-[10px]" style={{ color: "var(--text-4)" }}>
            (FY25 − FY24) / FY24 per month
          </span>
        </div>
        {/* Divergent bars: positive grow up from center, negative grow down.
            No inner motion.divs — nested whileInView with initial height: 0
            can stall the intersection observer. Parent card already animates. */}
        <div className="relative" style={{ height: 130 }}>
          {/* Zero baseline */}
          <div
            className="absolute inset-x-0 top-1/2 h-[1px] -translate-y-px"
            style={{ background: "var(--border)" }}
          />
          <div className="absolute inset-0 flex items-stretch gap-1">
            {yoyByMonth.map((m) => {
              const barH = (Math.abs(m.pct) / yoyMax) * 60; // max 60px each side of baseline
              const positive = m.pct >= 0;
              return (
                <div key={m.month} className="flex-1 flex flex-col">
                  <div className="h-1/2 flex flex-col justify-end items-center">
                    {positive && (
                      <div
                        className="w-full rounded-t-md min-w-[8px]"
                        style={{ height: barH, background: "var(--green)" }}
                      />
                    )}
                  </div>
                  <div className="h-1/2 flex flex-col justify-start items-center">
                    {!positive && (
                      <div
                        className="w-full rounded-b-md min-w-[8px]"
                        style={{ height: barH, background: "var(--red)" }}
                      />
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
        {/* Month labels + pct values */}
        <div className="flex gap-1 mt-2">
          {yoyByMonth.map((m) => {
            const positive = m.pct >= 0;
            return (
              <div key={m.month} className="flex-1 flex flex-col items-center gap-0.5">
                <span
                  className="text-[9px] tabular-nums font-semibold"
                  style={{ color: positive ? "var(--green)" : "var(--red)" }}
                >
                  {positive ? "+" : ""}{m.pct.toFixed(0)}%
                </span>
                <span className="text-[9px] leading-none" style={{ color: "var(--text-4)" }}>
                  {m.month}
                </span>
              </div>
            );
          })}
        </div>
        <div className="grid grid-cols-2 gap-3 mt-3 pt-3" style={{ borderTop: "1px solid var(--border)" }}>
          <div>
            <p className="text-[10px] uppercase tracking-wider" style={{ color: "var(--text-4)" }}>Best month</p>
            <p className="text-xs font-semibold tabular-nums" style={{ color: "var(--green)" }}>
              {bestMonth.month} · {bestMonth.pct >= 0 ? "+" : ""}{bestMonth.pct.toFixed(1)}%
            </p>
          </div>
          <div>
            <p className="text-[10px] uppercase tracking-wider" style={{ color: "var(--text-4)" }}>Worst month</p>
            <p className="text-xs font-semibold tabular-nums" style={{ color: "var(--red)" }}>
              {worstMonth.month} · {worstMonth.pct >= 0 ? "+" : ""}{worstMonth.pct.toFixed(1)}%
            </p>
          </div>
        </div>
      </motion.div>

      {/* Customer concentration ladder */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, amount: 0.1 }}
        transition={{ duration: 0.35, delay: 0.05 }}
        className="rounded-xl p-4 mb-5"
        style={{ background: "var(--bg-surface)", border: "1px solid var(--border)" }}
      >
        <div className="flex items-baseline justify-between gap-2 mb-3 flex-wrap">
          <p className="text-xs font-semibold" style={{ color: "var(--text-2)" }}>
            Customer concentration
          </p>
          <span className="text-[10px]" style={{ color: "var(--text-4)" }}>
            top N customers / total revenue
          </span>
        </div>
        <div className="space-y-2.5">
          {CUSTOMER_CONCENTRATION.map((b) => (
            <div key={b.bucket}>
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs font-medium" style={{ color: "var(--text-1)" }}>{b.bucket}</span>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] tabular-nums" style={{ color: "var(--text-4)" }}>
                    {formatINR(b.revenue)}
                  </span>
                  <span
                    className="text-xs font-bold tabular-nums w-14 text-right"
                    style={{
                      color: b.pct >= 80 ? "var(--red)" : b.pct >= 60 ? "var(--yellow)" : "var(--text-1)",
                      fontFamily: "'Space Grotesk', sans-serif",
                    }}
                  >
                    {b.pct.toFixed(1)}%
                  </span>
                </div>
              </div>
              <div className="w-full h-2 rounded-full overflow-hidden" style={{ background: "var(--bg-hover)" }}>
                <motion.div
                  initial={{ width: 0 }}
                  whileInView={{ width: `${b.pct}%` }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.6, ease: "easeOut" }}
                  className="h-full rounded-full"
                  style={{
                    background:
                      b.pct >= 80 ? "var(--red)" : b.pct >= 60 ? "var(--yellow)" : "var(--green)",
                  }}
                />
              </div>
            </div>
          ))}
        </div>
      </motion.div>

      {/* State concentration + Repeat/new split — 2 col */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-5">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.1 }}
          transition={{ duration: 0.35, delay: 0.1 }}
          className="rounded-xl p-4"
          style={{ background: "var(--bg-surface)", border: "1px solid var(--border)" }}
        >
          <p className="text-xs font-semibold mb-2" style={{ color: "var(--text-2)" }}>
            State concentration
          </p>
          <p
            className="text-2xl font-bold tabular-nums"
            style={{
              color: top3StatePct >= 60 ? "var(--yellow)" : "var(--text-1)",
              fontFamily: "'Space Grotesk', sans-serif",
            }}
          >
            {top3StatePct.toFixed(1)}%
          </p>
          <p className="text-[10px] mb-3" style={{ color: "var(--text-4)" }}>
            top 3 states / total taxable
          </p>
          <div className="space-y-1">
            {top3States.map((s) => (
              <div key={s.stateCode} className="flex items-center justify-between text-[11px]">
                <span style={{ color: "var(--text-2)" }}>{s.state}</span>
                <span className="tabular-nums font-semibold" style={{ color: "var(--text-1)", fontFamily: "'Space Grotesk', sans-serif" }}>
                  {formatINR(s.taxableValue)}
                </span>
              </div>
            ))}
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 12 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.1 }}
          transition={{ duration: 0.35, delay: 0.15 }}
          className="rounded-xl p-4"
          style={{ background: "var(--bg-surface)", border: "1px solid var(--border)" }}
        >
          <p className="text-xs font-semibold mb-2" style={{ color: "var(--text-2)" }}>
            Repeat vs new (top 10)
          </p>
          <p
            className="text-2xl font-bold tabular-nums"
            style={{
              color: repeatRevPct >= 70 ? "var(--green)" : "var(--text-1)",
              fontFamily: "'Space Grotesk', sans-serif",
            }}
          >
            {repeatRevPct.toFixed(1)}%
          </p>
          <p className="text-[10px] mb-3" style={{ color: "var(--text-4)" }}>
            revenue from repeat customers
          </p>
          <div className="flex items-center gap-3 text-[11px]">
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-sm" style={{ background: "var(--green)" }} />
              <span style={{ color: "var(--text-3)" }}>
                {repeatCount} repeat
              </span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-sm" style={{ background: "var(--text-4)" }} />
              <span style={{ color: "var(--text-3)" }}>
                {newCount} new
              </span>
            </div>
          </div>
          <p className="text-[10px] mt-2" style={{ color: "var(--text-4)" }}>
            orders &gt; 1 on party ledger = repeat
          </p>
        </motion.div>
      </div>

      {/* Payment velocity (DSO) + Peak return channel — 2 col */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-5">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.1 }}
          transition={{ duration: 0.35, delay: 0.2 }}
          className="rounded-xl p-4"
          style={{ background: "var(--bg-surface)", border: "1px solid var(--border)" }}
        >
          <p className="text-xs font-semibold mb-2" style={{ color: "var(--text-2)" }}>
            Payment velocity (DSO)
          </p>
          <p
            className="text-2xl font-bold tabular-nums"
            style={{
              color: K.dso > 60 ? "var(--red)" : K.dso > 45 ? "var(--yellow)" : "var(--green)",
              fontFamily: "'Space Grotesk', sans-serif",
            }}
          >
            {K.dso.toFixed(0)}
            <span className="text-sm font-medium ml-1">days</span>
          </p>
          <p className="text-[10px] mb-3" style={{ color: "var(--text-4)" }}>
            (debtors / revenue) × 365
          </p>
          <div className="flex items-center justify-between text-[11px]">
            <span style={{ color: "var(--text-4)" }}>Debtors outstanding</span>
            <span className="tabular-nums font-semibold" style={{ color: "var(--text-1)", fontFamily: "'Space Grotesk', sans-serif" }}>
              {formatINR(R.debtors)}
            </span>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 12 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.1 }}
          transition={{ duration: 0.35, delay: 0.25 }}
          className="rounded-xl p-4"
          style={{ background: "var(--bg-surface)", border: "1px solid var(--border)" }}
        >
          <p className="text-xs font-semibold mb-2" style={{ color: "var(--text-2)" }}>
            Highest return rate
          </p>
          <p
            className="text-2xl font-bold tabular-nums"
            style={{ color: "var(--red)", fontFamily: "'Space Grotesk', sans-serif" }}
          >
            {returnChannelSorted[0].rate.toFixed(1)}%
          </p>
          <p className="text-[10px] mb-3" style={{ color: "var(--text-4)" }}>
            {returnChannelSorted[0].channel} ledger
          </p>
          <div className="flex items-center justify-between text-[11px]">
            <span style={{ color: "var(--text-4)" }}>Lowest</span>
            <span className="tabular-nums font-semibold" style={{ color: "var(--green)", fontFamily: "'Space Grotesk', sans-serif" }}>
              {returnChannelSorted[returnChannelSorted.length - 1].channel} · {returnChannelSorted[returnChannelSorted.length - 1].rate.toFixed(1)}%
            </span>
          </div>
        </motion.div>
      </div>

      {/* Footer note for developers */}
      <div
        className="rounded-lg px-3 py-2.5 text-[11px] leading-relaxed"
        style={{
          background: "var(--bg-surface)",
          border: "1px solid var(--border)",
          color: "var(--text-4)",
        }}
      >
        All metrics above are pure aggregations over Tally&apos;s existing tables —
        sales vouchers, credit notes, party ledger, stock items. No derived fields
        invented outside that surface.
      </div>
    </>
  );
}
