"use client";

import { motion } from "framer-motion";
import { ChevronRight } from "lucide-react";
import { useI18n } from "@/lib/i18n-context";
import { THIS_WEEK_ACTIONS } from "@/lib/data";

/* Severity → colour */
const priorityColorMap: Record<string, string> = {
  urgent: "var(--red)",
  high: "var(--orange)",
  medium: "var(--text-3)",
};

const priorityLabelMap: Record<string, string> = {
  urgent: "URGENT",
  high: "HIGH",
  medium: "MEDIUM",
};

export function ActionQueue() {
  const { t } = useI18n();

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
      {/* Header: hairline-separated, no card-in-card */}
      <div
        className="flex items-baseline justify-between gap-3 px-4 py-3"
        style={{ borderBottom: "1px solid var(--border)" }}
      >
        <div className="flex items-baseline gap-2 min-w-0">
          <h3
            className="text-sm font-semibold leading-tight tracking-tight"
            style={{ color: "var(--text-1)" }}
          >
            {t.thisWeek}
          </h3>
          <p
            className="text-xs"
            style={{ color: "var(--text-4)" }}
          >
            {t.actionQueue}
          </p>
        </div>
        <span
          className="text-[10px] uppercase tracking-wider font-medium tabular-nums flex-shrink-0"
          style={{ color: "var(--text-4)" }}
        >
          {THIS_WEEK_ACTIONS.length} actions
        </span>
      </div>

      {/* Rows: separator-only, no per-row chrome */}
      <div>
        {THIS_WEEK_ACTIONS.map((action, i) => {
          const pColor = priorityColorMap[action.priority] ?? "var(--text-3)";
          const isFirst = i === 0;

          return (
            <motion.div
              key={action.id}
              initial={{ opacity: 0, y: 6 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.3 }}
              transition={{ duration: 0.3, delay: i * 0.04, ease: "easeOut" }}
              className="group flex items-start gap-3 px-4 py-3 cursor-pointer transition-colors"
              style={{
                borderTop: isFirst ? "none" : "1px solid var(--border)",
                background: "transparent",
              }}
              onMouseEnter={(e) =>
                (e.currentTarget.style.background = "var(--bg-hover)")
              }
              onMouseLeave={(e) =>
                (e.currentTarget.style.background = "transparent")
              }
            >
              {/* Severity dot — replaces the colored icon-square */}
              <span
                className="flex-shrink-0 mt-1.5"
                aria-hidden
                style={{
                  width: 6,
                  height: 6,
                  borderRadius: 999,
                  background: pColor,
                }}
              />

              {/* Title + context column */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span
                    className="text-[10px] font-bold uppercase tracking-wider tabular-nums"
                    style={{ color: pColor }}
                  >
                    {priorityLabelMap[action.priority]}
                  </span>
                  <p
                    className="font-semibold text-sm leading-snug"
                    style={{ color: "var(--text-1)" }}
                  >
                    {action.title}
                  </p>
                </div>
                <p
                  className="text-xs mt-0.5 leading-snug"
                  style={{ color: "var(--text-3)" }}
                >
                  {action.context}
                </p>
                <p
                  className="text-[11px] mt-1 tabular-nums font-medium"
                  style={{ color: "var(--green)" }}
                >
                  {action.impact}
                </p>
              </div>

              {/* CTA — text-button with chevron, no outline */}
              <button
                type="button"
                className="flex items-center gap-0.5 text-xs font-medium px-1 py-1 transition-colors flex-shrink-0 self-start"
                style={{
                  color: "var(--text-2)",
                  background: "transparent",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.color = "var(--text-1)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.color = "var(--text-2)";
                }}
                onClick={(e) => e.stopPropagation()}
              >
                {action.cta}
                <ChevronRight size={12} className="opacity-60 group-hover:opacity-100 transition-opacity" />
              </button>
            </motion.div>
          );
        })}
      </div>
    </motion.div>
  );
}
