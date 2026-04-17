"use client";

import { motion } from "framer-motion";
import { KpiCard } from "@/components/ui/kpi-card";
import { Gauge } from "@/components/ui/gauge";
import { HealthScore } from "@/components/ui/health-score";
import {
  R,
  K,
  MONTHS,
  ALERTS,
  HEALTH_SCORES,
  WATERFALL,
  fL,
  fCr,
} from "@/lib/data";

/* ------------------------------------------------------------------ */
/*  Shared animation variant                                          */
/* ------------------------------------------------------------------ */
const sectionAnim = {
  initial: { opacity: 0, y: 20 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, amount: 0.15 as const },
  transition: { duration: 0.45, ease: "easeOut" as const },
};

/* ------------------------------------------------------------------ */
/*  Helpers                                                           */
/* ------------------------------------------------------------------ */
const alertColorMap: Record<string, string> = {
  danger: "var(--red)",
  warning: "var(--yellow)",
  info: "var(--blue)",
};

function barHeight(value: number, max: number, maxPx: number) {
  return Math.max(4, (value / max) * maxPx);
}

/* ------------------------------------------------------------------ */
/*  Dashboard screen                                                  */
/* ------------------------------------------------------------------ */
export default function DashboardScreen() {
  /* Revenue trend helpers */
  const maxRev = Math.max(...R.ms);
  const minRev = Math.min(...R.ms);
  const maxIdx = R.ms.indexOf(maxRev);
  const minIdx = R.ms.indexOf(minRev);
  const BAR_MAX_H = 140;

  /* Waterfall helpers */
  const wfMax = Math.max(...WATERFALL.map((w) => Math.abs(w.value)));

  /* CCC segments */
  const cccTotal = K.dio + K.dso + K.dpo;

  return (
    <div
      className="min-h-screen pb-24"
      style={{ background: "var(--bg-primary)" }}
    >
      <div className="max-w-3xl mx-auto px-4 py-6 flex flex-col gap-5">
        {/* -------------------------------------------------------- */}
        {/*  1. Alert Strip                                          */}
        {/* -------------------------------------------------------- */}
        <motion.div {...sectionAnim} className="overflow-x-auto -mx-4 px-4">
          <div className="flex gap-2 whitespace-nowrap pb-1">
            {ALERTS.map((a, i) => {
              const c = alertColorMap[a.type] ?? "var(--text-3)";
              return (
                <span
                  key={i}
                  className="inline-flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-md flex-shrink-0"
                  style={{
                    background: `color-mix(in srgb, ${c} 12%, transparent)`,
                    border: `1px solid color-mix(in srgb, ${c} 20%, transparent)`,
                    color: c,
                  }}
                >
                  <span>{a.icon}</span>
                  {a.message}
                </span>
              );
            })}
          </div>
        </motion.div>

        {/* -------------------------------------------------------- */}
        {/*  2. Health Score Card                                     */}
        {/* -------------------------------------------------------- */}
        <motion.div
          {...sectionAnim}
          className="rounded-xl p-4"
          style={{
            background: "var(--bg-surface)",
            border: "1px solid var(--border)",
          }}
        >
          <p
            className="text-[10px] uppercase tracking-wider font-medium mb-3"
            style={{ color: "var(--text-4)" }}
          >
            Financial Health
          </p>
          <HealthScore score={48} breakdown={HEALTH_SCORES} />
        </motion.div>

        {/* -------------------------------------------------------- */}
        {/*  3. KPI Grid                                             */}
        {/* -------------------------------------------------------- */}
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
          <KpiCard
            title="Revenue"
            value={`${fCr(R.rev)}Cr`}
            trend={K.yoy}
            sparkData={R.ms}
            accentColor="var(--red)"
          />
          <KpiCard
            title="Gross Margin"
            value={K.gm.toFixed(1)}
            unit="%"
            accentColor="var(--green)"
          />
          <KpiCard
            title="EBITDA"
            value={`-${fL(Math.abs(R.ebitda))}L`}
            accentColor="var(--red)"
          />
          <KpiCard
            title="Net Loss"
            value={`${fL(Math.abs(R.netPL))}L`}
            accentColor="var(--red)"
          />
          <KpiCard
            title="Cash"
            value={`${fL(R.cash)}L`}
            accentColor="var(--yellow)"
          />
          <KpiCard
            title="Burn Rate"
            value={`${fL(K.burn)}L/mo`}
            sub={`${(R.cash / K.burn).toFixed(1)}mo runway`}
            accentColor="var(--red)"
          />
        </div>

        {/* -------------------------------------------------------- */}
        {/*  4. Unit Economics Waterfall                              */}
        {/* -------------------------------------------------------- */}
        <motion.div
          {...sectionAnim}
          className="rounded-xl p-4"
          style={{
            background: "var(--bg-surface)",
            border: "1px solid var(--border)",
          }}
        >
          <p
            className="text-[10px] uppercase tracking-wider font-medium mb-4"
            style={{ color: "var(--text-4)" }}
          >
            Unit Economics
          </p>

          <div className="flex flex-col gap-1">
            {WATERFALL.map((w, i) => {
              const pct = Math.abs(w.value) / R.rev * 100;
              const barW = Math.max(2, (Math.abs(w.value) / wfMax) * 100);
              const isNeg = w.value < 0;

              return (
                <div
                  key={i}
                  className={`flex items-center gap-2 py-1.5 px-1 ${
                    w.bold
                      ? "border-b"
                      : ""
                  }`}
                  style={{
                    borderColor: w.bold ? "var(--border)" : undefined,
                  }}
                >
                  <span
                    className={`text-xs flex-shrink-0 w-28 truncate ${
                      w.bold ? "font-bold" : ""
                    }`}
                    style={{ color: w.bold ? "var(--text-1)" : "var(--text-3)" }}
                  >
                    {w.label}
                  </span>

                  <div
                    className="flex-1 h-3 rounded-full overflow-hidden"
                    style={{ background: "var(--bg-secondary)" }}
                  >
                    <motion.div
                      className="h-full rounded-full"
                      style={{ background: w.color }}
                      initial={{ width: 0 }}
                      whileInView={{ width: `${barW}%` }}
                      viewport={{ once: true }}
                      transition={{ duration: 0.6, delay: i * 0.04 }}
                    />
                  </div>

                  <span
                    className="text-xs font-semibold flex-shrink-0 w-16 text-right"
                    style={{
                      color: w.color,
                      fontFamily: "'Space Grotesk', sans-serif",
                    }}
                  >
                    {isNeg ? "-" : ""}
                    {fL(Math.abs(w.value))}L
                  </span>

                  <span
                    className="text-[10px] flex-shrink-0 w-12 text-right"
                    style={{ color: "var(--text-4)" }}
                  >
                    {pct.toFixed(1)}%
                  </span>
                </div>
              );
            })}
          </div>

          {/* Insight box */}
          <div
            className="mt-4 rounded-lg px-3 py-2.5 text-xs leading-relaxed"
            style={{
              background: "color-mix(in srgb, var(--green) 10%, transparent)",
              border: "1px solid color-mix(in srgb, var(--green) 20%, transparent)",
              color: "var(--green)",
            }}
          >
            GM 82.5% excellent. Marketing+CAC = {"\u20B9"}
            {fL(R.mkt + R.cac)}L (42.6%). Cut to 35% for EBITDA breakeven.
          </div>
        </motion.div>

        {/* -------------------------------------------------------- */}
        {/*  5. Liquidity Gauges                                     */}
        {/* -------------------------------------------------------- */}
        <motion.div
          {...sectionAnim}
          className="rounded-xl p-4"
          style={{
            background: "var(--bg-surface)",
            border: "1px solid var(--border)",
          }}
        >
          <p
            className="text-[10px] uppercase tracking-wider font-medium mb-4"
            style={{ color: "var(--text-4)" }}
          >
            Liquidity Ratios
          </p>

          <div className="grid grid-cols-4 gap-2">
            <Gauge
              label="Current"
              value={K.cr}
              max={4}
              thresholds={{ red: 1, yellow: 1.5 }}
              size={100}
            />
            <Gauge
              label="Quick"
              value={K.qr}
              max={2}
              thresholds={{ red: 0.8, yellow: 1 }}
              size={100}
            />
            <Gauge
              label="D/E"
              value={K.de}
              max={2}
              thresholds={{ red: 1.5, yellow: 1 }}
              size={100}
            />

            {/* Working Capital — plain big number */}
            <div className="flex flex-col items-center justify-center">
              <span
                className="text-xl font-bold leading-none"
                style={{
                  color: "var(--text-1)",
                  fontFamily: "'Space Grotesk', sans-serif",
                }}
              >
                {fL(K.ca - K.cl)}L
              </span>
              <span
                className="text-xs font-medium mt-1"
                style={{ color: "var(--text-3)" }}
              >
                Working Cap
              </span>
            </div>
          </div>
        </motion.div>

        {/* -------------------------------------------------------- */}
        {/*  6. Cash Conversion Cycle                                */}
        {/* -------------------------------------------------------- */}
        <motion.div
          {...sectionAnim}
          className="rounded-xl p-4"
          style={{
            background: "var(--bg-surface)",
            border: "1px solid var(--border)",
          }}
        >
          <p
            className="text-[10px] uppercase tracking-wider font-medium mb-4"
            style={{ color: "var(--text-4)" }}
          >
            Cash Conversion Cycle
          </p>

          {/* Stacked bar */}
          <div className="flex items-center gap-1 mb-3">
            {[
              { label: "DIO", value: K.dio, color: "var(--yellow)" },
              { label: "DSO", value: K.dso, color: "var(--blue)" },
              { label: "DPO", value: K.dpo, color: "var(--green)" },
            ].map((seg) => {
              const pct = (seg.value / cccTotal) * 100;
              return (
                <motion.div
                  key={seg.label}
                  className="h-7 rounded flex items-center justify-center overflow-hidden"
                  style={{
                    background: `color-mix(in srgb, ${seg.color} 30%, transparent)`,
                    border: `1px solid color-mix(in srgb, ${seg.color} 40%, transparent)`,
                    minWidth: 0,
                  }}
                  initial={{ flex: 0 }}
                  whileInView={{ flex: pct }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.6 }}
                >
                  <span
                    className="text-[10px] font-semibold truncate px-1"
                    style={{ color: seg.color }}
                  >
                    {seg.label} {seg.value.toFixed(0)}d
                  </span>
                </motion.div>
              );
            })}
          </div>

          {/* Legend */}
          <div className="flex items-center gap-4 mb-2">
            {[
              { label: "DIO (Inventory)", color: "var(--yellow)" },
              { label: "DSO (Receivable)", color: "var(--blue)" },
              { label: "DPO (Payable)", color: "var(--green)" },
            ].map((l) => (
              <span
                key={l.label}
                className="flex items-center gap-1.5 text-[10px]"
                style={{ color: "var(--text-4)" }}
              >
                <span
                  className="w-2 h-2 rounded-full flex-shrink-0"
                  style={{ background: l.color }}
                />
                {l.label}
              </span>
            ))}
          </div>

          {/* CCC total */}
          <p
            className="text-sm font-semibold"
            style={{
              color: "var(--text-1)",
              fontFamily: "'Space Grotesk', sans-serif",
            }}
          >
            CCC: {K.ccc.toFixed(0)} days
          </p>
        </motion.div>

        {/* -------------------------------------------------------- */}
        {/*  7. Revenue Trend                                        */}
        {/* -------------------------------------------------------- */}
        <motion.div
          {...sectionAnim}
          className="rounded-xl p-4"
          style={{
            background: "var(--bg-surface)",
            border: "1px solid var(--border)",
          }}
        >
          <p
            className="text-[10px] uppercase tracking-wider font-medium mb-4"
            style={{ color: "var(--text-4)" }}
          >
            Monthly Revenue Trend
          </p>

          {/* Bar chart */}
          <div
            className="flex items-end gap-1"
            style={{ height: BAR_MAX_H + 28 }}
          >
            {R.ms.map((v, i) => {
              const h = barHeight(v, maxRev, BAR_MAX_H);
              const color =
                i === maxIdx
                  ? "var(--green)"
                  : i === minIdx
                  ? "var(--red)"
                  : "var(--blue)";

              return (
                <div
                  key={i}
                  className="flex-1 flex flex-col items-center justify-end"
                >
                  <motion.div
                    className="w-full rounded-t"
                    style={{ background: color }}
                    initial={{ height: 0 }}
                    whileInView={{ height: h }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.5, delay: i * 0.04 }}
                  />
                  <span
                    className="text-[9px] mt-1.5 leading-none"
                    style={{ color: "var(--text-4)" }}
                  >
                    {MONTHS[i]}
                  </span>
                </div>
              );
            })}
          </div>

          {/* Summary */}
          <p
            className="text-xs mt-3"
            style={{ color: "var(--text-3)" }}
          >
            Best: {MONTHS[maxIdx]} {"\u20B9"}{fL(maxRev)}L{" "}
            {"\u00B7"} Worst: {MONTHS[minIdx]} {"\u20B9"}{fL(minRev)}L{" "}
            {"\u00B7"} YoY: {K.yoy.toFixed(0)}%
          </p>
        </motion.div>
      </div>
    </div>
  );
}
