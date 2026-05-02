"use client";

import { motion } from "framer-motion";
import { Calendar, AlertTriangle, Clock, CircleDot, ArrowRight, Users } from "lucide-react";
import { COMPLIANCE_ITEMS } from "@/lib/data";

/* ------------------------------------------------------------------ */
/*  Severity color map                                                */
/* ------------------------------------------------------------------ */
const severityColor: Record<string, string> = {
  urgent: "var(--red)",
  soon: "var(--yellow)",
  upcoming: "var(--blue)",
};

const severityIcon: Record<string, React.ReactNode> = {
  urgent: <AlertTriangle size={12} />,
  soon: <Clock size={12} />,
  upcoming: <CircleDot size={12} />,
};

/* ------------------------------------------------------------------ */
/*  ComplianceCalendar                                                */
/* ------------------------------------------------------------------ */
export function ComplianceCalendar() {
  return (
    <div
      className="rounded-md p-4"
      style={{
        background: "var(--bg-surface)",
        border: "1px solid var(--border)",
      }}
    >
      {/* Header */}
      <div className="flex items-center gap-2 mb-4 flex-wrap">
        <Calendar size={16} style={{ color: "var(--text-2)" }} />
        <h3
          className="text-sm font-bold"
          style={{ color: "var(--text-1)" }}
        >
          Compliance Calendar
        </h3>
        <span
          className="text-[10px] font-semibold px-2 py-0.5 rounded-full"
          style={{
            background: "color-mix(in srgb, var(--blue) 15%, transparent)",
            color: "var(--blue)",
          }}
        >
          April 2026
        </span>
      </div>

      {/* Urgency Legend */}
      <div className="flex flex-wrap items-center gap-3 mb-4">
        {[
          { label: "Urgent (\u22647 days)", color: "var(--red)" },
          { label: "Soon (\u226414 days)", color: "var(--yellow)" },
          { label: "Upcoming", color: "var(--blue)" },
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

      {/* Calendar Items */}
      <div className="flex flex-col gap-2">
        {COMPLIANCE_ITEMS.map((item, i) => {
          const color = severityColor[item.severity] ?? "var(--text-4)";
          const [day, month] = item.dateShort.split(" ");

          return (
            <motion.div
              key={`${item.title}-${i}`}
              initial={{ opacity: 0, x: -12 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true, amount: 0.2 }}
              transition={{ duration: 0.35, delay: i * 0.04, ease: "easeOut" }}
              className="group flex items-stretch gap-3 rounded-md overflow-hidden cursor-pointer transition-all hover:translate-x-0.5"
              style={{
                background: "var(--bg-surface)",
                borderLeft: `2px solid ${color}`,
                borderTop: "1px solid var(--border)",
                borderRight: "1px solid var(--border)",
                borderBottom: "1px solid var(--border)",
              }}
            >
              {/* Date badge */}
              <div
                className="flex flex-col items-center justify-center py-2.5 px-3 flex-shrink-0"
                style={{ minWidth: 64 }}
              >
                <span
                  className="text-lg font-semibold leading-none tabular-nums"
                  style={{
                    color: "var(--text-1)",
                    fontFamily: "'Space Grotesk', sans-serif",
                    letterSpacing: "-0.02em",
                  }}
                >
                  {day}
                </span>
                <span
                  className="text-[10px] uppercase font-semibold tracking-wider mt-0.5"
                  style={{ color: "var(--text-4)" }}
                >
                  {month}
                </span>
              </div>

              {/* Middle: title + meta */}
              <div className="flex-1 min-w-0 py-2 pr-2">
                <div className="flex items-center gap-1.5 flex-wrap">
                  <span style={{ color }}>
                    {severityIcon[item.severity]}
                  </span>
                  <p
                    className="text-sm font-semibold leading-tight"
                    style={{ color: "var(--text-1)" }}
                  >
                    {item.title}
                  </p>
                </div>
                <p
                  className="text-[10px] mt-0.5 uppercase tracking-wider font-medium"
                  style={{ color: "var(--text-4)" }}
                >
                  {item.section}
                </p>
                <p
                  className="text-xs mt-1 leading-snug"
                  style={{ color: "var(--text-3)" }}
                >
                  {item.description}
                </p>
              </div>

              {/* Right: clients, amount, CTA */}
              <div className="flex flex-col items-end justify-between py-2 pr-3 pl-1 flex-shrink-0 gap-1">
                <div className="flex items-center gap-1.5 flex-wrap justify-end">
                  <span
                    className="inline-flex items-center gap-1 text-[10px] font-medium tabular-nums"
                    style={{ color: "var(--text-3)" }}
                  >
                    <Users size={10} />
                    {item.clients} {item.clients === 1 ? "client" : "clients"}
                  </span>
                  {item.amount && item.amount !== "\u2014" && (
                    <span
                      className="text-[10px] font-semibold tabular-nums"
                      style={{
                        color,
                        fontFamily: "'Space Grotesk', sans-serif",
                      }}
                    >
                      {item.amount}
                    </span>
                  )}
                </div>

                <button
                  className="inline-flex items-center gap-1 text-[11px] font-semibold cursor-pointer transition-opacity hover:opacity-80 whitespace-nowrap"
                  style={{ color }}
                  onClick={() => console.log("prepare", item.title)}
                >
                  Prepare
                  <ArrowRight size={10} />
                </button>
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Footer note */}
      <p
        className="text-[10px] mt-4 leading-relaxed"
        style={{ color: "var(--text-4)" }}
      >
        Auto-generated from your client portfolio. Tap to drill into affected clients.
      </p>
    </div>
  );
}
