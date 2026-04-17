"use client";

import { motion } from "framer-motion";
import { useI18n } from "@/lib/i18n-context";
import { THIS_WEEK_ACTIONS } from "@/lib/data";
import { Pill } from "./pill";

/* ------------------------------------------------------------------ */
/*  Priority → colour map                                              */
/* ------------------------------------------------------------------ */
const priorityColorMap: Record<string, string> = {
  urgent: "var(--red)",
  high: "var(--orange)",
  medium: "var(--blue)",
};

const priorityLabelMap: Record<string, string> = {
  urgent: "Urgent",
  high: "High",
  medium: "Medium",
};

export function ActionQueue() {
  const { t } = useI18n();

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
            📋
          </span>
          <div className="min-w-0">
            <h3
              className="text-sm font-semibold leading-tight"
              style={{ color: "var(--text-1)" }}
            >
              {t.thisWeek}
            </h3>
            <p
              className="text-xs mt-0.5"
              style={{ color: "var(--text-3)" }}
            >
              {t.actionQueue}
            </p>
          </div>
        </div>
        <Pill color="var(--blue)">{THIS_WEEK_ACTIONS.length} actions</Pill>
      </div>

      {/* Actions list ----------------------------------------------- */}
      <div className="flex flex-col gap-2">
        {THIS_WEEK_ACTIONS.map((action, i) => {
          const pColor = priorityColorMap[action.priority] ?? "var(--text-3)";
          const isUrgent = action.priority === "urgent";

          return (
            <motion.div
              key={action.id}
              initial={{ opacity: 0, y: 8 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.3 }}
              transition={{ duration: 0.35, delay: i * 0.05, ease: "easeOut" }}
              className="group flex flex-col md:flex-row md:items-center gap-3 rounded-lg p-3 transition-colors cursor-pointer"
              style={{
                background: "var(--bg-secondary)",
                borderLeft: isUrgent ? `3px solid var(--red)` : "3px solid transparent",
              }}
              onMouseEnter={(e) =>
                (e.currentTarget.style.background = "var(--bg-hover)")
              }
              onMouseLeave={(e) =>
                (e.currentTarget.style.background = "var(--bg-secondary)")
              }
            >
              {/* Left: icon circle ------------------------------------ */}
              <div
                className="flex items-center justify-center rounded-full flex-shrink-0 self-start md:self-center"
                style={{
                  width: 40,
                  height: 40,
                  background: `color-mix(in srgb, ${pColor} 18%, transparent)`,
                  border: `1px solid color-mix(in srgb, ${pColor} 30%, transparent)`,
                }}
                aria-hidden
              >
                <span className="text-lg leading-none">{action.icon}</span>
              </div>

              {/* Middle: title + context ----------------------------- */}
              <div className="flex-1 min-w-0">
                <p
                  className="font-semibold text-sm leading-snug"
                  style={{ color: "var(--text-1)" }}
                >
                  {action.title}
                </p>
                <p
                  className="text-xs mt-0.5 leading-snug"
                  style={{ color: "var(--text-3)" }}
                >
                  {action.context}
                </p>
              </div>

              {/* Right: priority + CTA + impact ---------------------- */}
              <div className="flex flex-col items-start md:items-end gap-1.5 flex-shrink-0">
                <div className="flex items-center gap-2">
                  <Pill color={pColor}>{priorityLabelMap[action.priority]}</Pill>
                  <button
                    type="button"
                    className="text-xs font-semibold px-2.5 py-1 rounded-md transition-colors whitespace-nowrap"
                    style={{
                      color: "var(--green)",
                      background: "transparent",
                      border: "1px solid var(--green)",
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background =
                        "color-mix(in srgb, var(--green) 14%, transparent)";
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = "transparent";
                    }}
                    onClick={(e) => e.stopPropagation()}
                  >
                    {action.cta}
                  </button>
                </div>
                <span
                  className="text-[10px] font-semibold tabular-nums"
                  style={{ color: "var(--green)" }}
                >
                  {action.impact}
                </span>
              </div>
            </motion.div>
          );
        })}
      </div>
    </motion.div>
  );
}
