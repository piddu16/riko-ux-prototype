"use client";

import { motion } from "framer-motion";
import { KpiCard } from "@/components/ui/kpi-card";
import { Gauge } from "@/components/ui/gauge";
import { HealthScore } from "@/components/ui/health-score";
import { ActionQueue } from "@/components/ui/action-queue";
import { RunwayTimeline } from "@/components/ui/runway-timeline";
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
