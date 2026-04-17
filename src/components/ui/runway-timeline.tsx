"use client";

import { motion } from "framer-motion";
import { RUNWAY, fL } from "@/lib/data";
import { useI18n } from "@/lib/i18n-context";

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */
const SUGGESTED_ACTIONS = [
  "Collect ₹12.6L from Nykaa",
  "Reduce marketing 30%",
  "Claim ₹4.6L GST refund",
];

export function RunwayTimeline() {
  const { t } = useI18n();

  const pct = Math.max(0, Math.min(100, (RUNWAY.monthsLeft / 6) * 100));

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.15 }}
      transition={{ duration: 0.45, ease: "easeOut" }}
      className="rounded-xl p-4"
      style={{
        background: "var(--bg-surface)",
        border: "1px solid var(--border)",
      }}
    >
      {/* Header ------------------------------------------------------ */}
      <div className="flex items-start justify-between gap-3 mb-4">
        <div className="flex items-start gap-2.5 min-w-0">
          <span className="text-xl leading-none mt-0.5" aria-hidden>
            ⏳
          </span>
          <div className="min-w-0">
            <h3
              className="text-sm font-semibold leading-tight"
              style={{ color: "var(--text-1)" }}
            >
              {t.runwayLeft}
            </h3>
            <p
              className="text-xs mt-0.5"
              style={{ color: "var(--text-3)" }}
            >
              Cash Runway
            </p>
          </div>
        </div>
        <div className="text-right flex-shrink-0">
          <span
            className="text-2xl font-bold leading-none tabular-nums"
            style={{
              color: "var(--red)",
              fontFamily: "'Space Grotesk', sans-serif",
            }}
          >
            {RUNWAY.daysLeft}
          </span>
          <span
            className="text-xs ml-1 font-medium"
            style={{ color: "var(--text-3)" }}
          >
            {t.daysRemaining}
          </span>
        </div>
      </div>

      {/* Timeline bar ----------------------------------------------- */}
      <div className="relative">
        <div
          className="w-full rounded-full overflow-hidden relative"
          style={{
            height: 28,
            background:
              "linear-gradient(to right, var(--red) 0%, var(--red) 16%, var(--yellow) 40%, var(--green) 100%)",
            border: "1px solid var(--border)",
          }}
        >
          {/* Position marker pin (rendered via motion for animation) */}
          <motion.div
            className="absolute top-0 bottom-0 flex items-center justify-center"
            style={{
              width: 2,
              background: "var(--text-1)",
              boxShadow: "0 0 0 2px var(--bg-surface)",
            }}
            initial={{ left: "0%" }}
            whileInView={{ left: `${pct}%` }}
            viewport={{ once: true, amount: 0.3 }}
            transition={{ duration: 0.9, ease: "easeOut" }}
          >
            <span
              className="absolute -top-1.5 rounded-full"
              style={{
                width: 10,
                height: 10,
                background: "var(--text-1)",
                border: "2px solid var(--bg-surface)",
              }}
            />
            <span
              className="absolute -bottom-1.5 rounded-full"
              style={{
                width: 10,
                height: 10,
                background: "var(--text-1)",
                border: "2px solid var(--bg-surface)",
              }}
            />
          </motion.div>
        </div>

        {/* Timeline labels */}
        <div className="flex items-center justify-between mt-2">
          <span className="text-[10px]" style={{ color: "var(--text-4)" }}>
            Today
          </span>
          <span className="text-[10px]" style={{ color: "var(--text-4)" }}>
            1mo
          </span>
          <span className="text-[10px]" style={{ color: "var(--text-4)" }}>
            3mo
          </span>
          <span className="text-[10px]" style={{ color: "var(--text-4)" }}>
            6mo+
          </span>
        </div>
      </div>

      {/* Warning box ------------------------------------------------ */}
      <div
        className="mt-4 rounded-lg px-3 py-2.5 text-xs leading-relaxed"
        style={{
          background: "var(--red-bg)",
          border: "1px solid color-mix(in srgb, var(--red) 24%, transparent)",
          color: "var(--red)",
        }}
      >
        At current burn rate of ₹{fL(RUNWAY.monthlyBurn)}L/mo, cash hits zero around{" "}
        <span className="font-semibold">{RUNWAY.zeroDate}</span>.
      </div>

      {/* Suggested actions ----------------------------------------- */}
      <div className="mt-3">
        <p
          className="text-[10px] uppercase tracking-wider font-medium mb-2"
          style={{ color: "var(--text-4)" }}
        >
          Extend runway
        </p>
        <div className="flex flex-wrap gap-1.5">
          {SUGGESTED_ACTIONS.map((action, i) => (
            <motion.span
              key={i}
              initial={{ opacity: 0, scale: 0.9 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true, amount: 0.3 }}
              transition={{ duration: 0.3, delay: 0.2 + i * 0.06 }}
              className="text-[11px] font-medium px-2.5 py-1 rounded-full cursor-pointer transition-colors"
              style={{
                background: "color-mix(in srgb, var(--green) 12%, transparent)",
                border: "1px solid color-mix(in srgb, var(--green) 28%, transparent)",
                color: "var(--green)",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background =
                  "color-mix(in srgb, var(--green) 22%, transparent)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background =
                  "color-mix(in srgb, var(--green) 12%, transparent)";
              }}
            >
              {action}
            </motion.span>
          ))}
        </div>
      </div>
    </motion.div>
  );
}
