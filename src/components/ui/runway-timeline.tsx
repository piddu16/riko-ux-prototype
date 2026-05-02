"use client";

import { motion } from "framer-motion";
import { ChevronRight } from "lucide-react";
import { RUNWAY, fL } from "@/lib/data";
import { useI18n } from "@/lib/i18n-context";

const SUGGESTED_ACTIONS = [
  "Collect ₹12.6L from Nykaa",
  "Reduce marketing 30%",
  "Claim ₹4.6L GST refund",
];

export function RunwayTimeline() {
  const { t } = useI18n();

  // 6-month horizon → percentage along the track for current position
  const pct = Math.max(2, Math.min(98, (RUNWAY.monthsLeft / 6) * 100));
  // Severity color for the days-left number
  const severity =
    RUNWAY.daysLeft < 30 ? "var(--red)" :
    RUNWAY.daysLeft < 90 ? "var(--yellow)" : "var(--green)";

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.15 }}
      transition={{ duration: 0.45, ease: "easeOut" }}
      className="rounded-md overflow-hidden"
      style={{
        background: "var(--bg-surface)",
        border: "1px solid var(--border)",
      }}
    >
      {/* Header: hairline below */}
      <div
        className="flex items-baseline justify-between gap-3 px-4 py-3"
        style={{ borderBottom: "1px solid var(--border)" }}
      >
        <div className="flex items-baseline gap-2 min-w-0">
          <h3
            className="text-sm font-semibold leading-tight tracking-tight"
            style={{ color: "var(--text-1)" }}
          >
            {t.runwayLeft}
          </h3>
          <p className="text-xs" style={{ color: "var(--text-4)" }}>
            Cash Runway
          </p>
        </div>
        <div className="text-right flex-shrink-0">
          <span
            className="text-2xl font-semibold leading-none tabular-nums"
            style={{
              color: severity,
              fontFamily: "'Space Grotesk', sans-serif",
              letterSpacing: "-0.02em",
            }}
          >
            {RUNWAY.daysLeft}
          </span>
          <span
            className="text-[11px] ml-1.5 font-medium"
            style={{ color: "var(--text-4)" }}
          >
            {t.daysRemaining}
          </span>
        </div>
      </div>

      {/* Body */}
      <div className="px-4 py-4">
        {/* Track: hairline + segmented fill at current position. No rainbow. */}
        <div className="relative" style={{ paddingTop: 8, paddingBottom: 14 }}>
          {/* Base track (1px hairline) */}
          <div
            className="relative w-full"
            style={{
              height: 2,
              background: "var(--border)",
              borderRadius: 999,
            }}
          >
            {/* Severity-coloured fill from start to marker */}
            <motion.div
              className="absolute top-0 bottom-0 left-0"
              style={{
                background: severity,
                borderRadius: 999,
              }}
              initial={{ width: "0%" }}
              whileInView={{ width: `${pct}%` }}
              viewport={{ once: true, amount: 0.3 }}
              transition={{ duration: 0.7, ease: "easeOut" }}
            />
            {/* Marker dot */}
            <motion.span
              className="absolute"
              style={{
                top: "50%",
                width: 10,
                height: 10,
                borderRadius: 999,
                background: severity,
                border: "2px solid var(--bg-surface)",
                transform: "translate(-50%, -50%)",
              }}
              initial={{ left: "0%" }}
              whileInView={{ left: `${pct}%` }}
              viewport={{ once: true, amount: 0.3 }}
              transition={{ duration: 0.7, ease: "easeOut" }}
            />
          </div>

          {/* Tick labels */}
          <div className="flex items-center justify-between mt-2.5">
            {["Today", "1mo", "3mo", "6mo+"].map((label) => (
              <span
                key={label}
                className="text-[10px] tabular-nums"
                style={{ color: "var(--text-4)" }}
              >
                {label}
              </span>
            ))}
          </div>
        </div>

        {/* Single muted line — was a tinted card */}
        <p className="text-xs leading-relaxed" style={{ color: "var(--text-3)" }}>
          At current burn{" "}
          <span className="tabular-nums font-medium" style={{ color: "var(--text-2)" }}>
            ₹{fL(RUNWAY.monthlyBurn)}L/mo
          </span>
          , cash hits zero around{" "}
          <span className="tabular-nums font-medium" style={{ color: severity }}>
            {RUNWAY.zeroDate}
          </span>
          .
        </p>

        {/* Suggested actions — text-buttons with chevron, no green pills */}
        <div className="mt-4 pt-3" style={{ borderTop: "1px solid var(--border)" }}>
          <p
            className="text-[10px] uppercase tracking-wider font-medium mb-2"
            style={{ color: "var(--text-4)" }}
          >
            Extend runway
          </p>
          <div className="flex flex-col">
            {SUGGESTED_ACTIONS.map((action, i) => (
              <motion.button
                key={i}
                type="button"
                initial={{ opacity: 0, y: 4 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.3 }}
                transition={{ duration: 0.25, delay: 0.15 + i * 0.05 }}
                className="group flex items-center justify-between gap-2 -mx-2 px-2 py-1.5 rounded-md text-xs cursor-pointer transition-colors text-left"
                style={{ color: "var(--text-2)", background: "transparent" }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = "var(--bg-hover)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = "transparent";
                }}
              >
                <span>{action}</span>
                <ChevronRight
                  size={12}
                  className="opacity-50 group-hover:opacity-100 transition-opacity"
                  style={{ color: "var(--text-3)" }}
                />
              </motion.button>
            ))}
          </div>
        </div>
      </div>
    </motion.div>
  );
}
