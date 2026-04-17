"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Pill } from "@/components/ui/pill";
import { RECEIVABLES, K, fL } from "@/lib/data";

/* ------------------------------------------------------------------ */
/*  Helpers                                                           */
/* ------------------------------------------------------------------ */
const fmt = (v: number) =>
  "\u20B9" + v.toLocaleString("en-IN", { maximumFractionDigits: 0 });

const totalOutstanding = RECEIVABLES.reduce((s, r) => s + r.amount, 0);

const priorityColor: Record<string, string> = {
  P1: "var(--red)",
  P2: "var(--yellow)",
  P3: "var(--text-4)",
};

function daysColor(d: number): string {
  if (d > 365) return "var(--red)";
  if (d > 90) return "var(--yellow)";
  return "var(--text-2)";
}

/* Aging distribution (approximate from the data set) */
const aging = [
  { label: "0-30d", pct: 5, color: "var(--green)" },
  { label: "30-90d", pct: 10, color: "var(--blue)" },
  { label: "90-365d", pct: 15, color: "var(--yellow)" },
  { label: "365+", pct: 70, color: "var(--red)" },
];

/* ------------------------------------------------------------------ */
/*  Row animation stagger                                             */
/* ------------------------------------------------------------------ */
const rowVariants = {
  hidden: { opacity: 0, y: 12 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.3, delay: i * 0.04, ease: "easeOut" as const },
  }),
};

/* ------------------------------------------------------------------ */
/*  Component                                                         */
/* ------------------------------------------------------------------ */
export default function OutstandingsScreen() {
  const [activeTab, setActiveTab] = useState<"receivables" | "payables">(
    "receivables"
  );

  return (
    <div
      className="min-h-screen pb-24"
      style={{ background: "var(--bg-primary)" }}
    >
      <div className="max-w-3xl mx-auto px-4 py-6 flex flex-col gap-5">
        {/* -------------------------------------------------------- */}
        {/*  1. Tab Bar                                              */}
        {/* -------------------------------------------------------- */}
        <div
          className="flex rounded-lg overflow-hidden"
          style={{
            background: "var(--bg-secondary)",
            border: "1px solid var(--border)",
          }}
        >
          {(["receivables", "payables"] as const).map((tab) => {
            const active = activeTab === tab;
            return (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className="flex-1 py-2.5 text-sm font-semibold capitalize transition-colors duration-200 relative"
                style={{
                  color: active ? "var(--green)" : "var(--text-4)",
                  background: active ? "var(--bg-surface)" : "transparent",
                }}
              >
                {tab}
                {active && (
                  <motion.div
                    layoutId="tab-underline"
                    className="absolute bottom-0 left-0 right-0 h-0.5"
                    style={{ background: "var(--green)" }}
                  />
                )}
              </button>
            );
          })}
        </div>

        {/* -------------------------------------------------------- */}
        {/*  2. Summary Row                                          */}
        {/* -------------------------------------------------------- */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.3 }}
          transition={{ duration: 0.4 }}
          className="rounded-xl p-4"
          style={{
            background: "var(--bg-surface)",
            border: "1px solid var(--border)",
          }}
        >
          {/* Top: total + DSO badge */}
          <div className="flex items-center justify-between mb-3">
            <div>
              <p
                className="text-[10px] uppercase tracking-wider font-medium mb-1"
                style={{ color: "var(--text-4)" }}
              >
                Total Outstanding
              </p>
              <p
                className="text-2xl font-bold"
                style={{
                  color: "var(--text-1)",
                  fontFamily: "'Space Grotesk', sans-serif",
                }}
              >
                {fmt(totalOutstanding)}
              </p>
            </div>

            <span
              className="text-xs font-semibold px-2.5 py-1 rounded-md"
              style={{
                color: "var(--yellow)",
                background:
                  "color-mix(in srgb, var(--yellow) 12%, transparent)",
                border:
                  "1px solid color-mix(in srgb, var(--yellow) 20%, transparent)",
              }}
            >
              DSO {K.dso.toFixed(0)}d
            </span>
          </div>

          {/* Aging bar */}
          <div className="flex gap-0.5 h-3 rounded-full overflow-hidden">
            {aging.map((a) => (
              <div
                key={a.label}
                className="h-full transition-all duration-500"
                style={{
                  width: `${a.pct}%`,
                  background: `color-mix(in srgb, ${a.color} 50%, transparent)`,
                }}
              />
            ))}
          </div>

          {/* Aging legend */}
          <div className="flex gap-3 mt-2">
            {aging.map((a) => (
              <span
                key={a.label}
                className="flex items-center gap-1 text-[10px]"
                style={{ color: "var(--text-4)" }}
              >
                <span
                  className="w-1.5 h-1.5 rounded-full flex-shrink-0"
                  style={{ background: a.color }}
                />
                {a.label} ({a.pct}%)
              </span>
            ))}
          </div>
        </motion.div>

        {/* -------------------------------------------------------- */}
        {/*  3. Data Table (desktop) / Card List (mobile)            */}
        {/* -------------------------------------------------------- */}
        <div
          className="rounded-xl overflow-hidden"
          style={{
            background: "var(--bg-surface)",
            border: "1px solid var(--border)",
          }}
        >
          {/* Desktop table — hidden on small screens */}
          <div className="hidden sm:block overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr
                  style={{
                    background: "var(--bg-secondary)",
                    color: "var(--text-4)",
                  }}
                >
                  <th className="py-2.5 px-3 text-left w-8">
                    <span className="sr-only">Select</span>
                  </th>
                  <th className="py-2.5 px-3 text-left font-medium">Party</th>
                  <th className="py-2.5 px-3 text-right font-medium">
                    Outstanding
                  </th>
                  <th className="py-2.5 px-3 text-right font-medium">Days</th>
                  <th className="py-2.5 px-3 text-right font-medium">Bills</th>
                  <th className="py-2.5 px-3 text-center font-medium">
                    Priority
                  </th>
                  <th className="py-2.5 px-3 text-center font-medium">
                    Action
                  </th>
                </tr>
              </thead>
              <tbody>
                {RECEIVABLES.map((r, i) => (
                  <motion.tr
                    key={r.name}
                    custom={i}
                    variants={rowVariants}
                    initial="hidden"
                    whileInView="visible"
                    viewport={{ once: true, amount: 0.1 }}
                    className="transition-colors duration-150"
                    style={{
                      background:
                        i % 2 === 0
                          ? "var(--bg-surface)"
                          : "var(--bg-secondary)",
                      borderBottom: "1px solid var(--border)",
                    }}
                    onMouseEnter={(e) => {
                      (e.currentTarget as HTMLElement).style.background =
                        "color-mix(in srgb, var(--text-1) 4%, transparent)";
                    }}
                    onMouseLeave={(e) => {
                      (e.currentTarget as HTMLElement).style.background =
                        i % 2 === 0
                          ? "var(--bg-surface)"
                          : "var(--bg-secondary)";
                    }}
                  >
                    {/* Checkbox */}
                    <td className="py-2.5 px-3">
                      <div
                        className="w-3.5 h-3.5 rounded border"
                        style={{ borderColor: "var(--border)" }}
                      />
                    </td>

                    {/* Party name */}
                    <td
                      className="py-2.5 px-3 font-medium truncate max-w-[180px]"
                      style={{ color: "var(--text-2)" }}
                    >
                      {r.name}
                    </td>

                    {/* Outstanding */}
                    <td
                      className="py-2.5 px-3 text-right font-bold"
                      style={{
                        color: "var(--text-1)",
                        fontFamily: "'Space Grotesk', sans-serif",
                      }}
                    >
                      {fmt(r.amount)}
                    </td>

                    {/* Days */}
                    <td
                      className="py-2.5 px-3 text-right font-semibold"
                      style={{ color: daysColor(r.days) }}
                    >
                      {r.days}
                    </td>

                    {/* Bills */}
                    <td
                      className="py-2.5 px-3 text-right"
                      style={{ color: "var(--text-3)" }}
                    >
                      {r.bills}
                    </td>

                    {/* Priority */}
                    <td className="py-2.5 px-3 text-center">
                      <Pill color={priorityColor[r.priority]}>
                        {r.priority}
                      </Pill>
                    </td>

                    {/* Action */}
                    <td className="py-2.5 px-3 text-center">
                      <button
                        className="text-[11px] font-semibold px-2.5 py-1 rounded-md transition-opacity hover:opacity-80"
                        style={{
                          color: "var(--green)",
                          background:
                            "color-mix(in srgb, var(--green) 12%, transparent)",
                        }}
                      >
                        {"\uD83D\uDCF2"} Remind
                      </button>
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile card layout — shown only on small screens */}
          <div className="sm:hidden flex flex-col">
            {RECEIVABLES.map((r, i) => (
              <motion.div
                key={r.name}
                custom={i}
                variants={rowVariants}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true, amount: 0.1 }}
                className="p-3"
                style={{
                  background:
                    i % 2 === 0
                      ? "var(--bg-surface)"
                      : "var(--bg-secondary)",
                  borderBottom: "1px solid var(--border)",
                }}
              >
                {/* Top row: name + priority */}
                <div className="flex items-center justify-between mb-2">
                  <span
                    className="text-xs font-medium truncate flex-1 mr-2"
                    style={{ color: "var(--text-2)" }}
                  >
                    {r.name}
                  </span>
                  <Pill color={priorityColor[r.priority]}>{r.priority}</Pill>
                </div>

                {/* Middle row: amount + days */}
                <div className="flex items-center justify-between mb-2">
                  <span
                    className="text-sm font-bold"
                    style={{
                      color: "var(--text-1)",
                      fontFamily: "'Space Grotesk', sans-serif",
                    }}
                  >
                    {fmt(r.amount)}
                  </span>
                  <span
                    className="text-xs font-semibold"
                    style={{ color: daysColor(r.days) }}
                  >
                    {r.days} days
                  </span>
                </div>

                {/* Bottom row: bills + action */}
                <div className="flex items-center justify-between">
                  <span
                    className="text-[10px]"
                    style={{ color: "var(--text-4)" }}
                  >
                    {r.bills} bills
                  </span>
                  <button
                    className="text-[11px] font-semibold px-2.5 py-1 rounded-md"
                    style={{
                      color: "var(--green)",
                      background:
                        "color-mix(in srgb, var(--green) 12%, transparent)",
                    }}
                  >
                    {"\uD83D\uDCF2"} Remind
                  </button>
                </div>
              </motion.div>
            ))}
          </div>
        </div>

        {/* -------------------------------------------------------- */}
        {/*  4. Warning Note                                         */}
        {/* -------------------------------------------------------- */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.3 }}
          transition={{ duration: 0.4 }}
          className="rounded-xl px-4 py-3 text-xs leading-relaxed"
          style={{
            background:
              "color-mix(in srgb, var(--red) 10%, transparent)",
            border:
              "1px solid color-mix(in srgb, var(--red) 20%, transparent)",
            color: "var(--red)",
          }}
        >
          <span className="font-bold">Contra-Settlement Warning:</span>{" "}
          Multiple entries for Nykaa E-Retail appear across different ledgers.
          Verify if contra-settlement has been applied. Outstanding may be
          overstated by {"\u20B9"}{fL(306667 + 292810)}L if inter-ledger netting
          is missing.
        </motion.div>
      </div>
    </div>
  );
}
