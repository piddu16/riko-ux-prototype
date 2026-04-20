"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown } from "lucide-react";
import { KpiCard } from "@/components/ui/kpi-card";
import { Gauge } from "@/components/ui/gauge";
import { HealthScore } from "@/components/ui/health-score";
import { ActionQueue } from "@/components/ui/action-queue";
import { RunwayTimeline } from "@/components/ui/runway-timeline";
import { CausalChain } from "@/components/ui/causal-chain";
import {
  R,
  K,
  MONTHS,
  ALERTS,
  HEALTH_SCORES,
  WATERFALL,
  CASH_FORECAST_WEEKS,
  CASH_FORECAST_SCENARIOS,
  fL,
  fCr,
  compactINR,
} from "@/lib/data";
import { AlertTriangle } from "lucide-react";

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
interface DashboardScreenProps {
  /** Optional: dispatch a question into Chat. Wired from page.tsx. */
  onAskRiko?: (question: string) => void;
}

export default function DashboardScreen({ onAskRiko }: DashboardScreenProps = {}) {
  /* Show/hide the CFO-level detail sections (waterfall, expense comp, channel
     mix, CCC, BS snapshot). Collapsed by default to keep the founder view
     scannable on first load. */
  const [showDepth, setShowDepth] = useState(false);

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
      <div className="max-w-3xl md:max-w-6xl mx-auto px-4 py-6 flex flex-col gap-5">
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
            {/* Desktop-only health badge */}
            <span
              className="hidden md:inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-md flex-shrink-0"
              style={{
                background: "color-mix(in srgb, var(--yellow) 12%, transparent)",
                border: "1px solid color-mix(in srgb, var(--yellow) 20%, transparent)",
                color: "var(--yellow)",
              }}
            >
              Financial Health: 48/100
            </span>
          </div>
        </motion.div>

        {/* -------------------------------------------------------- */}
        {/*  This Week Action Queue (founder priority actions)        */}
        {/* -------------------------------------------------------- */}
        <ActionQueue />

        {/* -------------------------------------------------------- */}
        {/*  Runway Timeline (visceral cash projection)               */}
        {/* -------------------------------------------------------- */}
        <RunwayTimeline />

        {/* -------------------------------------------------------- */}
        {/*  6-Week Cash Flow Forecast                                */}
        {/* -------------------------------------------------------- */}
        <CashFlowForecastSection />

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
          {/* Desktop-only 7th KPI */}
          <div className="hidden lg:block">
            <KpiCard
              title="OpEx Ratio"
              value={`${K.opexR.toFixed(1)}%`}
              accentColor="var(--red)"
            />
          </div>
        </div>

        {/* -------------------------------------------------------- */}
        {/*  "Show more detail" toggle                                */}
        {/* -------------------------------------------------------- */}
        <button
          onClick={() => setShowDepth((v) => !v)}
          className="flex items-center justify-center gap-1.5 text-xs font-semibold px-4 py-2.5 rounded-lg cursor-pointer transition-colors mx-auto"
          style={{
            background: showDepth ? "var(--bg-surface)" : "color-mix(in srgb, var(--green) 10%, transparent)",
            color: showDepth ? "var(--text-3)" : "var(--green)",
            border: `1px solid ${showDepth ? "var(--border)" : "color-mix(in srgb, var(--green) 30%, transparent)"}`,
          }}
        >
          {showDepth ? "Hide advanced analytics" : "Show advanced analytics"}
          <motion.span animate={{ rotate: showDepth ? 180 : 0 }} transition={{ duration: 0.2 }}>
            <ChevronDown size={14} />
          </motion.span>
        </button>

        <AnimatePresence initial={false}>
          {showDepth && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.3, ease: "easeInOut" }}
              className="overflow-hidden flex flex-col gap-5"
            >

        {/* -------------------------------------------------------- */}
        {/*  3a. Causal Chain — DAG of P&L flow                       */}
        {/*  (signature differentiator: visual root-cause that ties   */}
        {/*  back into Chat via node clicks)                          */}
        {/* -------------------------------------------------------- */}
        <motion.div {...sectionAnim}>
          <CausalChain onAsk={onAskRiko} />
        </motion.div>

        {/* -------------------------------------------------------- */}
        {/*  3b. Expense Composition (desktop only)                  */}
        {/* -------------------------------------------------------- */}
        <motion.div
          {...sectionAnim}
          className="hidden md:block rounded-xl p-4"
          style={{
            background: "var(--bg-surface)",
            border: "1px solid var(--border)",
          }}
        >
          <p
            className="text-[10px] uppercase tracking-wider font-medium mb-4"
            style={{ color: "var(--text-4)" }}
          >
            Expense Composition
          </p>

          {/* Stacked bar */}
          {(() => {
            const expenseItems = [
              { label: "Marketing", value: R.mkt, color: "var(--red)" },
              { label: "CAC", value: R.cac, color: "var(--orange)" },
              { label: "Employees", value: R.emp, color: "var(--blue)" },
              { label: "Overheads", value: R.ovh, color: "var(--text-3)" },
              { label: "Fulfilment", value: R.ful, color: "var(--text-4)" },
              { label: "Finance", value: R.interest, color: "var(--text-4)" },
              { label: "ORC", value: R.orc, color: "var(--text-4)" },
            ];
            const totalExp = expenseItems.reduce((s, e) => s + e.value, 0);

            return (
              <>
                <div className="flex items-center gap-0.5 mb-4 h-5 rounded-full overflow-hidden">
                  {expenseItems.map((e, i) => {
                    const pct = (e.value / totalExp) * 100;
                    return (
                      <motion.div
                        key={i}
                        className="h-full"
                        style={{ background: e.color }}
                        initial={{ flex: 0 }}
                        whileInView={{ flex: pct }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.6, delay: i * 0.05 }}
                      />
                    );
                  })}
                </div>

                <div className="flex flex-col gap-1.5">
                  {expenseItems.map((e, i) => {
                    const pct = (e.value / totalExp) * 100;
                    const barW = (e.value / expenseItems[0].value) * 100;
                    return (
                      <div
                        key={i}
                        className="flex items-center gap-3 py-1.5 px-1 rounded-lg cursor-pointer transition-colors"
                        style={{ background: "transparent" }}
                        onMouseEnter={(ev) =>
                          (ev.currentTarget.style.background =
                            "var(--bg-secondary)")
                        }
                        onMouseLeave={(ev) =>
                          (ev.currentTarget.style.background = "transparent")
                        }
                      >
                        <span
                          className="w-2 h-2 rounded-full flex-shrink-0"
                          style={{ background: e.color }}
                        />
                        <span
                          className="text-xs w-20 flex-shrink-0"
                          style={{ color: "var(--text-3)" }}
                        >
                          {e.label}
                        </span>
                        <div
                          className="flex-1 h-2 rounded-full overflow-hidden"
                          style={{ background: "var(--bg-secondary)" }}
                        >
                          <motion.div
                            className="h-full rounded-full"
                            style={{ background: e.color }}
                            initial={{ width: 0 }}
                            whileInView={{
                              width: `${Math.min(barW, 100)}%`,
                            }}
                            viewport={{ once: true }}
                            transition={{ duration: 0.5, delay: i * 0.04 }}
                          />
                        </div>
                        <span
                          className="text-xs font-semibold flex-shrink-0 w-14 text-right tabular-nums"
                          style={{
                            color: "var(--text-1)",
                            fontFamily: "'Space Grotesk', sans-serif",
                          }}
                        >
                          {"\u20B9"}
                          {fL(e.value)}L
                        </span>
                        <span
                          className="text-[10px] flex-shrink-0 w-10 text-right tabular-nums"
                          style={{ color: "var(--text-4)" }}
                        >
                          {pct.toFixed(1)}%
                        </span>
                      </div>
                    );
                  })}
                </div>
              </>
            );
          })()}
        </motion.div>

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
        {/*  4b. Channel Revenue Mix (desktop only)                  */}
        {/* -------------------------------------------------------- */}
        <motion.div
          {...sectionAnim}
          className="hidden md:block rounded-xl p-4"
          style={{
            background: "var(--bg-surface)",
            border: "1px solid var(--border)",
          }}
        >
          <p
            className="text-[10px] uppercase tracking-wider font-medium mb-4"
            style={{ color: "var(--text-4)" }}
          >
            Channel Revenue Mix
          </p>

          <div className="flex flex-col gap-2.5">
            {[
              { name: "Website D2C", pct: 35, color: "var(--green)", yoy: "+95%", yoyColor: "var(--green)" },
              { name: "Nykaa", pct: 28, color: "var(--blue)", yoy: "+12%", yoyColor: "var(--green)" },
              { name: "Amazon/Paytm", pct: 20, color: "var(--orange)", yoy: "-8%", yoyColor: "var(--red)" },
              { name: "Offline/B2B", pct: 12, color: "var(--purple, var(--blue))", yoy: "+42%", yoyColor: "var(--green)" },
            ].map((ch, i) => (
              <div key={i} className="flex items-center gap-3">
                <span
                  className="text-xs w-28 flex-shrink-0"
                  style={{ color: "var(--text-3)" }}
                >
                  {ch.name}
                </span>
                <div
                  className="flex-1 h-3 rounded-full overflow-hidden"
                  style={{ background: "var(--bg-secondary)" }}
                >
                  <motion.div
                    className="h-full rounded-full"
                    style={{ background: ch.color }}
                    initial={{ width: 0 }}
                    whileInView={{ width: `${ch.pct}%` }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.5, delay: i * 0.08 }}
                  />
                </div>
                <span
                  className="text-xs font-semibold flex-shrink-0 w-10 text-right tabular-nums"
                  style={{
                    color: "var(--text-1)",
                    fontFamily: "'Space Grotesk', sans-serif",
                  }}
                >
                  {ch.pct}%
                </span>
                <span
                  className="text-[10px] font-semibold flex-shrink-0 w-12 text-right px-1.5 py-0.5 rounded tabular-nums"
                  style={{
                    color: ch.yoyColor,
                    background: `color-mix(in srgb, ${ch.yoyColor} 12%, transparent)`,
                  }}
                >
                  {ch.yoy}
                </span>
              </div>
            ))}
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
        {/*  5b. Balance Sheet Snapshot (desktop only)               */}
        {/* -------------------------------------------------------- */}
        <motion.div
          {...sectionAnim}
          className="hidden md:block rounded-xl p-4"
          style={{
            background: "var(--bg-surface)",
            border: "1px solid var(--border)",
          }}
        >
          <p
            className="text-[10px] uppercase tracking-wider font-medium mb-4"
            style={{ color: "var(--text-4)" }}
          >
            Balance Sheet Snapshot
          </p>

          <div className="grid grid-cols-2 gap-6">
            {/* Assets */}
            <div>
              <p
                className="text-[10px] uppercase tracking-wider font-medium mb-2"
                style={{ color: "var(--text-4)" }}
              >
                Assets
              </p>
              <div className="flex flex-col gap-1.5">
                {[
                  { label: "Current Assets", amount: K.ca },
                  { label: "Cash & Bank", amount: R.cash },
                  { label: "Debtors", amount: R.debtors },
                  { label: "Closing Stock", amount: R.stkC },
                ].map((row, i) => (
                  <div
                    key={i}
                    className={`flex items-center justify-between py-1 ${i === 0 ? "border-b" : ""}`}
                    style={{ borderColor: "var(--border)" }}
                  >
                    <span
                      className={`text-xs ${i === 0 ? "font-semibold" : ""}`}
                      style={{ color: i === 0 ? "var(--text-1)" : "var(--text-3)" }}
                    >
                      {row.label}
                    </span>
                    <span
                      className={`text-xs tabular-nums ${i === 0 ? "font-semibold" : ""}`}
                      style={{
                        color: "var(--text-1)",
                        fontFamily: "'Space Grotesk', sans-serif",
                      }}
                    >
                      {"\u20B9"}{fL(row.amount)}L
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Liabilities + Equity */}
            <div>
              <p
                className="text-[10px] uppercase tracking-wider font-medium mb-2"
                style={{ color: "var(--text-4)" }}
              >
                Liabilities & Equity
              </p>
              <div className="flex flex-col gap-1.5">
                {[
                  { label: "Current Liabilities", amount: K.cl },
                  { label: "Unsecured Loans", amount: R.unsec },
                  { label: "Equity", amount: R.sCap + R.res },
                ].map((row, i) => (
                  <div
                    key={i}
                    className={`flex items-center justify-between py-1 ${i === 0 ? "border-b" : ""}`}
                    style={{ borderColor: "var(--border)" }}
                  >
                    <span
                      className={`text-xs ${i === 0 ? "font-semibold" : ""}`}
                      style={{ color: i === 0 ? "var(--text-1)" : "var(--text-3)" }}
                    >
                      {row.label}
                    </span>
                    <span
                      className={`text-xs tabular-nums ${i === 0 ? "font-semibold" : ""}`}
                      style={{
                        color: "var(--text-1)",
                        fontFamily: "'Space Grotesk', sans-serif",
                      }}
                    >
                      {"\u20B9"}{fL(row.amount)}L
                    </span>
                  </div>
                ))}
              </div>
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

            </motion.div>
          )}
        </AnimatePresence>

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

          {/* Desktop-only MoM change badges */}
          <div className="hidden md:flex items-center gap-1 mt-2">
            {R.ms.map((v, i) => {
              if (i === 0) return <div key={i} className="flex-1" />;
              const prev = R.ms[i - 1];
              const change = ((v - prev) / prev) * 100;
              const isPos = change >= 0;
              return (
                <div key={i} className="flex-1 flex justify-center">
                  <span
                    className="text-[8px] font-semibold px-1 py-0.5 rounded tabular-nums"
                    style={{
                      color: isPos ? "var(--green)" : "var(--red)",
                      background: isPos
                        ? "color-mix(in srgb, var(--green) 12%, transparent)"
                        : "color-mix(in srgb, var(--red) 12%, transparent)",
                    }}
                  >
                    {isPos ? "+" : ""}
                    {change.toFixed(0)}%
                  </span>
                </div>
              );
            })}
          </div>
        </motion.div>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  6-Week Cash Flow Forecast section                                  */
/* ------------------------------------------------------------------ */
function CashFlowForecastSection() {
  const weeks = CASH_FORECAST_WEEKS;

  /* Compute chart extents */
  const maxInflow = Math.max(...weeks.map((w) => w.inflow));
  const maxOutflow = Math.max(...weeks.map((w) => w.outflow));
  const maxFlow = Math.max(maxInflow, maxOutflow);

  const maxBalance = Math.max(...weeks.map((w) => w.endBalance), 0);
  const minBalance = Math.min(...weeks.map((w) => w.endBalance), 0);
  const balanceRange = Math.max(Math.abs(maxBalance), Math.abs(minBalance), 1);

  /* Chart geometry */
  const BAR_AREA_H = 80; // pixels above and below zero line
  const LINE_AREA_H = 70; // height of end-balance chart strip
  const firstNegIdx = weeks.findIndex((w) => w.endBalance < 0);

  /* Balance chart — build a polyline.
     y = 0 at mid of LINE_AREA_H. positive above, negative below. */
  const linePoints = weeks.map((w, i) => {
    const x = (i + 0.5) * 100 / weeks.length;
    const normalized = w.endBalance / balanceRange; // -1..1
    const y = (LINE_AREA_H / 2) - (normalized * (LINE_AREA_H / 2 - 4));
    return { x, y };
  });

  const polyline = linePoints.map((p) => `${p.x},${p.y}`).join(" ");

  /* Area under zero for red shading: connect all negative points */
  const negAreaPoints: string[] = [];
  if (firstNegIdx !== -1) {
    const zeroY = LINE_AREA_H / 2;
    // Start at zero line at first negative column
    const startX = (firstNegIdx + 0.5) * 100 / weeks.length;
    negAreaPoints.push(`${startX},${zeroY}`);
    for (let i = firstNegIdx; i < weeks.length; i++) {
      negAreaPoints.push(`${linePoints[i].x},${linePoints[i].y}`);
    }
    // Close back to zero line
    negAreaPoints.push(`${linePoints[weeks.length - 1].x},${zeroY}`);
  }

  return (
    <motion.div
      {...sectionAnim}
      className="rounded-xl p-4"
      style={{
        background: "var(--bg-surface)",
        border: "1px solid var(--border)",
      }}
    >
      {/* Header */}
      <div className="mb-4">
        <h3
          className="text-sm font-semibold leading-tight"
          style={{ color: "var(--text-1)" }}
        >
          6-Week Cash Flow Forecast
        </h3>
        <p
          className="text-xs mt-0.5"
          style={{ color: "var(--text-3)" }}
        >
          Weekly inflows vs outflows + scenario planning
        </p>
      </div>

      {/* ---------- Chart ---------- */}
      <div className="mb-3">
        {/* Bars (inflow above, outflow below the zero line) */}
        <div
          className="relative flex items-stretch"
          style={{ height: BAR_AREA_H * 2 + 2 }}
        >
          {/* Zero line */}
          <div
            className="absolute left-0 right-0"
            style={{
              top: BAR_AREA_H,
              height: 1,
              background: "var(--border)",
            }}
          />

          {weeks.map((w, i) => {
            const inflowH = (w.inflow / maxFlow) * BAR_AREA_H;
            const outflowH = (w.outflow / maxFlow) * BAR_AREA_H;
            const isNeg = w.endBalance < 0;
            return (
              <div
                key={i}
                className="flex-1 flex flex-col items-center justify-start relative"
                style={{
                  minWidth: 0,
                  borderLeft: i > 0 ? "1px dashed color-mix(in srgb, var(--border) 60%, transparent)" : undefined,
                }}
              >
                {/* Inflow bar (above zero) */}
                <div className="flex-1 flex items-end w-full justify-center pb-0">
                  <motion.div
                    className="rounded-t"
                    style={{
                      background: "var(--green)",
                      width: "55%",
                    }}
                    initial={{ height: 0 }}
                    whileInView={{ height: inflowH }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.5, delay: i * 0.05 }}
                  />
                </div>

                {/* Outflow bar (below zero) */}
                <div className="flex-1 flex items-start w-full justify-center pt-0">
                  <motion.div
                    className="rounded-b"
                    style={{
                      background: isNeg ? "var(--red)" : "color-mix(in srgb, var(--red) 75%, transparent)",
                      width: "55%",
                    }}
                    initial={{ height: 0 }}
                    whileInView={{ height: outflowH }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.5, delay: i * 0.05 }}
                  />
                </div>
              </div>
            );
          })}
        </div>

        {/* End balance line chart overlay strip */}
        <div
          className="relative mt-1"
          style={{ height: LINE_AREA_H }}
        >
          <svg
            width="100%"
            height={LINE_AREA_H}
            viewBox={`0 0 100 ${LINE_AREA_H}`}
            preserveAspectRatio="none"
            className="absolute inset-0"
          >
            {/* Zero line */}
            <line
              x1="0"
              x2="100"
              y1={LINE_AREA_H / 2}
              y2={LINE_AREA_H / 2}
              stroke="var(--border)"
              strokeWidth="0.3"
              strokeDasharray="1,1"
            />

            {/* Negative area shade */}
            {negAreaPoints.length > 0 && (
              <motion.polygon
                points={negAreaPoints.join(" ")}
                fill="var(--red)"
                fillOpacity="0.18"
                initial={{ opacity: 0 }}
                whileInView={{ opacity: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: 0.4 }}
              />
            )}

            {/* Polyline connecting end balances */}
            <motion.polyline
              points={polyline}
              fill="none"
              stroke="var(--blue)"
              strokeWidth="0.8"
              vectorEffect="non-scaling-stroke"
              initial={{ pathLength: 0 }}
              whileInView={{ pathLength: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8, ease: "easeOut" }}
            />

            {/* Dots at each point */}
            {linePoints.map((p, i) => (
              <motion.circle
                key={i}
                cx={p.x}
                cy={p.y}
                r="1.2"
                fill={weeks[i].endBalance < 0 ? "var(--red)" : "var(--blue)"}
                vectorEffect="non-scaling-stroke"
                initial={{ opacity: 0 }}
                whileInView={{ opacity: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 0.25, delay: 0.4 + i * 0.06 }}
              />
            ))}
          </svg>
        </div>

        {/* Week labels + end balance values */}
        <div className="flex mt-2">
          {weeks.map((w, i) => {
            const isNeg = w.endBalance < 0;
            return (
              <div
                key={i}
                className="flex-1 flex flex-col items-center"
                style={{ minWidth: 0 }}
              >
                <span
                  className="text-[9px] md:text-[10px] leading-none text-center truncate w-full px-0.5"
                  style={{ color: "var(--text-4)" }}
                  title={w.week}
                >
                  {w.week.split(" ")[0]}
                </span>
                <span
                  className="text-[10px] md:text-[11px] font-semibold mt-1 tabular-nums"
                  style={{
                    color: isNeg ? "var(--red)" : "var(--text-2)",
                    fontFamily: "'Space Grotesk', sans-serif",
                  }}
                >
                  {isNeg ? "-" : ""}&#8377;{compactINR(Math.abs(w.endBalance))}
                </span>
              </div>
            );
          })}
        </div>

        {/* Legend */}
        <div className="flex items-center gap-3 mt-3 text-[10px]" style={{ color: "var(--text-4)" }}>
          <span className="flex items-center gap-1.5">
            <span className="inline-block w-2.5 h-2.5 rounded-sm" style={{ background: "var(--green)" }} />
            Inflow
          </span>
          <span className="flex items-center gap-1.5">
            <span className="inline-block w-2.5 h-2.5 rounded-sm" style={{ background: "var(--red)" }} />
            Outflow
          </span>
          <span className="flex items-center gap-1.5">
            <span className="inline-block w-4 h-[2px]" style={{ background: "var(--blue)" }} />
            End balance
          </span>
        </div>
      </div>

      {/* Zero-cash warning */}
      {firstNegIdx !== -1 && (
        <div
          className="rounded-lg px-3 py-2.5 flex items-center gap-2 mb-4"
          style={{
            background: "color-mix(in srgb, var(--red) 10%, transparent)",
            border: "1px solid color-mix(in srgb, var(--red) 24%, transparent)",
          }}
        >
          <AlertTriangle size={14} style={{ color: "var(--red)" }} />
          <p
            className="text-xs leading-relaxed"
            style={{ color: "var(--red)" }}
          >
            <span className="font-semibold">
              Zero cash reached in {weeks[firstNegIdx].week.split(" ")[0]}
              {weeks[firstNegIdx].week.includes("(") && ` (${weeks[firstNegIdx].week.match(/\((.+?)\)/)?.[1]})`}
            </span>
            <span className="mx-1.5" style={{ color: "color-mix(in srgb, var(--red) 70%, transparent)" }}>·</span>
            Alert: Cash negative
          </p>
        </div>
      )}

      {/* ---------- Scenario cards ---------- */}
      <p
        className="text-[10px] uppercase tracking-wider font-medium mb-2"
        style={{ color: "var(--text-4)" }}
      >
        Scenario Planning (30 days)
      </p>
      <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
        {CASH_FORECAST_SCENARIOS.map((s, i) => {
          const isBase = s.label === "Base case";
          const isNeg = s.endCash30d < 0;
          return (
            <motion.div
              key={s.label}
              initial={{ opacity: 0, y: 8 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.3, delay: i * 0.05 }}
              className="relative rounded-lg p-3"
              style={{
                background: `color-mix(in srgb, ${s.color} 8%, var(--bg-secondary))`,
                border: `1px solid color-mix(in srgb, ${s.color} ${isBase ? "55" : "25"}%, transparent)`,
              }}
            >
              {isBase && (
                <span
                  className="absolute -top-1.5 right-2 text-[8px] font-bold px-1.5 py-0.5 rounded-full tracking-wider"
                  style={{
                    background: s.color,
                    color: "#fff",
                  }}
                >
                  CURRENT
                </span>
              )}
              <p
                className="text-[10px] leading-tight mb-1.5"
                style={{ color: "var(--text-3)" }}
              >
                {s.label}
              </p>
              <p
                className="text-sm font-bold tabular-nums leading-none"
                style={{
                  color: s.color,
                  fontFamily: "'Space Grotesk', sans-serif",
                }}
              >
                {isNeg ? "-" : ""}&#8377;{compactINR(Math.abs(s.endCash30d))}
              </p>
              <p
                className="text-[10px] mt-1.5 tabular-nums"
                style={{ color: "var(--text-4)" }}
              >
                {s.runwayDays > 0 ? `${s.runwayDays}d runway` : "Out of cash"}
              </p>
            </motion.div>
          );
        })}
      </div>
    </motion.div>
  );
}
