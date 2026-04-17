"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import {
  Users,
  AlertTriangle,
  FileClock,
  IndianRupee,
  TrendingUp,
  TrendingDown,
  Activity,
  MessageCircle,
  Send,
  FileSpreadsheet,
  ArrowRight,
} from "lucide-react";
import { CLIENTS, CA_FIRM } from "@/lib/data";
import { Pill } from "@/components/ui/pill";

/* ------------------------------------------------------------------ */
/*  Status → color map                                                */
/* ------------------------------------------------------------------ */
const statusColor: Record<string, string> = {
  critical: "var(--red)",
  warning: "var(--yellow)",
  healthy: "var(--green)",
};

const statusLabel: Record<string, string> = {
  critical: "Critical",
  warning: "Needs attention",
  healthy: "Healthy",
};

const misColor: Record<string, string> = {
  Pending: "var(--red)",
  "In progress": "var(--yellow)",
  Delivered: "var(--green)",
};

/* ------------------------------------------------------------------ */
/*  Filters                                                           */
/* ------------------------------------------------------------------ */
type FilterKey = "all" | "attention" | "mis" | "healthy";

const FILTERS: { key: FilterKey; label: string }[] = [
  { key: "all", label: "All" },
  { key: "attention", label: "Needs Attention" },
  { key: "mis", label: "MIS Pending" },
  { key: "healthy", label: "Healthy" },
];

/* ------------------------------------------------------------------ */
/*  Small KPI tile inside summary row                                 */
/* ------------------------------------------------------------------ */
interface SummaryTileProps {
  title: string;
  value: string;
  accent: string;
  icon: React.ReactNode;
  tinted?: boolean;
}

function SummaryTile({ title, value, accent, icon, tinted }: SummaryTileProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 14 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.3 }}
      transition={{ duration: 0.4, ease: "easeOut" }}
      className="rounded-xl overflow-hidden"
      style={{
        background: tinted
          ? `color-mix(in srgb, ${accent} 10%, var(--bg-surface))`
          : "var(--bg-surface)",
        border: `1px solid ${
          tinted
            ? `color-mix(in srgb, ${accent} 30%, var(--border))`
            : "var(--border)"
        }`,
      }}
    >
      <div className="h-0.5" style={{ background: accent }} />
      <div className="p-4">
        <div className="flex items-start justify-between">
          <div className="flex-1 min-w-0">
            <p
              className="text-[10px] uppercase tracking-wider font-medium mb-2"
              style={{ color: "var(--text-4)" }}
            >
              {title}
            </p>
            <p
              className="text-2xl font-bold leading-none tabular-nums"
              style={{
                color: "var(--text-1)",
                fontFamily: "'Space Grotesk', sans-serif",
              }}
            >
              {value}
            </p>
          </div>
          <span
            className="flex-shrink-0 ml-2 rounded-lg p-1.5"
            style={{
              color: accent,
              background: `color-mix(in srgb, ${accent} 14%, transparent)`,
            }}
          >
            {icon}
          </span>
        </div>
      </div>
    </motion.div>
  );
}

/* ------------------------------------------------------------------ */
/*  ClientsScreen                                                     */
/* ------------------------------------------------------------------ */
export function ClientsScreen() {
  const [filter, setFilter] = useState<FilterKey>("all");

  /* ── Summary stats ── */
  const totalClients = 18;
  const criticalCount = CLIENTS.filter((c) => c.status === "critical").length;
  const misPendingCount = CLIENTS.filter((c) => c.misStatus === "Pending").length;
  const combinedRevenue = "\u20B942.6Cr";

  /* ── Filter logic ── */
  const filtered = CLIENTS.filter((c) => {
    if (filter === "all") return true;
    if (filter === "attention")
      return c.status === "critical" || c.status === "warning";
    if (filter === "mis") return c.misStatus === "Pending";
    if (filter === "healthy") return c.status === "healthy";
    return true;
  });

  return (
    <div
      className="min-h-screen pb-24"
      style={{ background: "var(--bg-primary)" }}
    >
      <div className="max-w-6xl mx-auto px-4 py-6 flex flex-col gap-5">
        {/* ---------------------------------------------------------- */}
        {/*  1. Header                                                 */}
        {/* ---------------------------------------------------------- */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.35 }}
          className="flex flex-wrap items-end justify-between gap-3"
        >
          <div className="min-w-0">
            <h1
              className="text-2xl md:text-3xl font-bold"
              style={{
                color: "var(--text-1)",
                fontFamily: "'Space Grotesk', sans-serif",
              }}
            >
              Client Portfolio
            </h1>
            <p
              className="text-sm mt-1 truncate"
              style={{ color: "var(--text-3)" }}
            >
              {CA_FIRM.name} {"\u00B7"} {CA_FIRM.registrationNo}
            </p>
          </div>
          <span
            className="inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-full flex-shrink-0"
            style={{
              background: "color-mix(in srgb, var(--green) 15%, transparent)",
              color: "var(--green)",
              border: "1px solid color-mix(in srgb, var(--green) 30%, transparent)",
            }}
          >
            <span
              className="w-1.5 h-1.5 rounded-full"
              style={{ background: "var(--green)" }}
            />
            18 active clients
          </span>
        </motion.div>

        {/* ---------------------------------------------------------- */}
        {/*  2. Summary stats row                                      */}
        {/* ---------------------------------------------------------- */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <SummaryTile
            title="Total Clients"
            value={String(totalClients)}
            accent="var(--blue)"
            icon={<Users size={16} />}
          />
          <SummaryTile
            title="Needs Attention"
            value={String(criticalCount)}
            accent="var(--red)"
            icon={<AlertTriangle size={16} />}
            tinted
          />
          <SummaryTile
            title="MIS Pending"
            value={String(misPendingCount)}
            accent="var(--yellow)"
            icon={<FileClock size={16} />}
          />
          <SummaryTile
            title="Combined Revenue"
            value={combinedRevenue}
            accent="var(--green)"
            icon={<IndianRupee size={16} />}
          />
        </div>

        {/* ---------------------------------------------------------- */}
        {/*  3. Filter tabs                                            */}
        {/* ---------------------------------------------------------- */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.35, delay: 0.05 }}
          className="flex gap-2 overflow-x-auto -mx-4 px-4 pb-1"
        >
          {FILTERS.map((f) => {
            const active = f.key === filter;
            return (
              <button
                key={f.key}
                onClick={() => setFilter(f.key)}
                className="text-xs font-semibold px-3 py-1.5 rounded-full cursor-pointer transition-colors flex-shrink-0 whitespace-nowrap"
                style={{
                  background: active
                    ? "var(--green)"
                    : "color-mix(in srgb, var(--text-3) 10%, transparent)",
                  color: active ? "#052E16" : "var(--text-2)",
                  border: active
                    ? "1px solid var(--green)"
                    : "1px solid var(--border)",
                }}
              >
                {f.label}
              </button>
            );
          })}
        </motion.div>

        {/* ---------------------------------------------------------- */}
        {/*  4. Client cards grid                                      */}
        {/* ---------------------------------------------------------- */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {filtered.map((c, i) => {
            const sColor = statusColor[c.status];
            const netPLPositive = c.netPL.trim().startsWith("+");
            const netPLColor = netPLPositive ? "var(--green)" : "var(--red)";
            const healthColor =
              c.healthScore >= 75
                ? "var(--green)"
                : c.healthScore >= 55
                ? "var(--yellow)"
                : "var(--red)";

            return (
              <motion.div
                key={c.id}
                initial={{ opacity: 0, y: 18 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.15 }}
                transition={{
                  duration: 0.4,
                  delay: i * 0.05,
                  ease: "easeOut",
                }}
                whileHover={{ y: -3 }}
                onClick={() => console.log("open client", c.id)}
                className="relative rounded-xl overflow-hidden cursor-pointer transition-shadow hover:shadow-xl"
                style={{
                  background: "var(--bg-surface)",
                  border: "1px solid var(--border)",
                }}
              >
                {/* Left status stripe */}
                <div
                  className="absolute left-0 top-0 bottom-0 w-1"
                  style={{ background: sColor }}
                />

                <div className="pl-5 pr-4 py-4 flex flex-col gap-3">
                  {/* Top row: status dot + name + status label */}
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-start gap-2 min-w-0">
                      <span
                        className="w-2.5 h-2.5 rounded-full flex-shrink-0 mt-1.5"
                        style={{
                          background: sColor,
                          boxShadow: `0 0 0 3px color-mix(in srgb, ${sColor} 20%, transparent)`,
                        }}
                      />
                      <div className="min-w-0">
                        <p
                          className="text-sm font-bold leading-tight truncate"
                          style={{ color: "var(--text-1)" }}
                        >
                          {c.name}
                        </p>
                        <p
                          className="text-[11px] mt-0.5"
                          style={{ color: "var(--text-4)" }}
                        >
                          {c.industry}
                        </p>
                      </div>
                    </div>
                    <span
                      className="text-[10px] font-semibold px-1.5 py-0.5 rounded flex-shrink-0"
                      style={{
                        color: sColor,
                        background: `color-mix(in srgb, ${sColor} 14%, transparent)`,
                      }}
                    >
                      {statusLabel[c.status]}
                    </span>
                  </div>

                  {/* Middle: 3 mini KPIs */}
                  <div
                    className="grid grid-cols-3 gap-1 rounded-lg p-2"
                    style={{ background: "var(--bg-secondary)" }}
                  >
                    <div className="flex flex-col items-start">
                      <span
                        className="text-[9px] uppercase tracking-wider font-medium"
                        style={{ color: "var(--text-4)" }}
                      >
                        Revenue
                      </span>
                      <span
                        className="text-sm font-bold tabular-nums mt-0.5"
                        style={{
                          color: "var(--text-1)",
                          fontFamily: "'Space Grotesk', sans-serif",
                        }}
                      >
                        {"\u20B9"}
                        {c.revenue}
                      </span>
                    </div>
                    <div
                      className="flex flex-col items-start border-l border-r px-1.5"
                      style={{ borderColor: "var(--border)" }}
                    >
                      <span
                        className="text-[9px] uppercase tracking-wider font-medium"
                        style={{ color: "var(--text-4)" }}
                      >
                        Net P&L
                      </span>
                      <span
                        className="text-sm font-bold tabular-nums mt-0.5 flex items-center gap-0.5"
                        style={{
                          color: netPLColor,
                          fontFamily: "'Space Grotesk', sans-serif",
                        }}
                      >
                        {netPLPositive ? (
                          <TrendingUp size={11} />
                        ) : (
                          <TrendingDown size={11} />
                        )}
                        {c.netPL}
                      </span>
                    </div>
                    <div className="flex flex-col items-start pl-1">
                      <span
                        className="text-[9px] uppercase tracking-wider font-medium"
                        style={{ color: "var(--text-4)" }}
                      >
                        Health
                      </span>
                      <span
                        className="text-sm font-bold tabular-nums mt-0.5 flex items-center gap-0.5"
                        style={{
                          color: healthColor,
                          fontFamily: "'Space Grotesk', sans-serif",
                        }}
                      >
                        <Activity size={11} />
                        {c.healthScore}
                      </span>
                    </div>
                  </div>

                  {/* Issues list */}
                  {c.issues.length > 0 && (
                    <div className="flex flex-col gap-1">
                      {c.issues.slice(0, 2).map((issue, j) => (
                        <div
                          key={j}
                          className="flex items-center gap-1.5 text-[11px] px-2 py-1 rounded-md"
                          style={{
                            background:
                              "color-mix(in srgb, var(--red) 10%, transparent)",
                            color: "var(--red)",
                            border:
                              "1px solid color-mix(in srgb, var(--red) 20%, transparent)",
                          }}
                        >
                          <AlertTriangle
                            size={10}
                            className="flex-shrink-0"
                          />
                          <span className="truncate">{issue}</span>
                        </div>
                      ))}
                      {c.issues.length > 2 && (
                        <span
                          className="text-[10px] px-2"
                          style={{ color: "var(--text-4)" }}
                        >
                          +{c.issues.length - 2} more
                        </span>
                      )}
                    </div>
                  )}

                  {/* Footer */}
                  <div
                    className="flex items-center justify-between gap-2 pt-2 border-t"
                    style={{ borderColor: "var(--border)" }}
                  >
                    <div className="flex items-center gap-2 min-w-0 flex-wrap">
                      <Pill color={misColor[c.misStatus] ?? "var(--text-3)"}>
                        MIS: {c.misStatus}
                      </Pill>
                      <span
                        className="text-[10px]"
                        style={{ color: "var(--text-4)" }}
                      >
                        Sync: {c.lastSync}
                      </span>
                    </div>
                    <span
                      className="inline-flex items-center gap-0.5 text-[11px] font-semibold flex-shrink-0"
                      style={{ color: "var(--green)" }}
                    >
                      Open
                      <ArrowRight size={11} />
                    </span>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>

        {/* Empty state */}
        {filtered.length === 0 && (
          <div
            className="rounded-xl p-8 text-center"
            style={{
              background: "var(--bg-surface)",
              border: "1px dashed var(--border)",
            }}
          >
            <p
              className="text-sm font-medium"
              style={{ color: "var(--text-3)" }}
            >
              No clients match this filter.
            </p>
          </div>
        )}

        {/* ---------------------------------------------------------- */}
        {/*  5. Bulk action bar (desktop only)                         */}
        {/* ---------------------------------------------------------- */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.2 }}
          transition={{ duration: 0.4, ease: "easeOut" }}
          className="hidden md:block rounded-xl p-4"
          style={{
            background:
              "linear-gradient(135deg, color-mix(in srgb, var(--green) 6%, var(--bg-surface)) 0%, var(--bg-surface) 100%)",
            border: "1px solid var(--border)",
          }}
        >
          <div className="flex items-center justify-between gap-3 flex-wrap">
            <div>
              <p
                className="text-[10px] uppercase tracking-wider font-medium"
                style={{ color: "var(--text-4)" }}
              >
                Bulk Actions
              </p>
              <p
                className="text-sm font-semibold mt-0.5"
                style={{ color: "var(--text-1)" }}
              >
                Run operations across your portfolio
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <button
                className="inline-flex items-center gap-1.5 text-xs font-semibold px-3.5 py-2 rounded-lg cursor-pointer transition-opacity hover:opacity-90"
                style={{
                  background: "var(--green)",
                  color: "#052E16",
                }}
                onClick={() => console.log("generate mis bulk")}
              >
                <Send size={13} />
                Generate MIS for all
              </button>
              <button
                className="inline-flex items-center gap-1.5 text-xs font-semibold px-3.5 py-2 rounded-lg cursor-pointer transition-colors"
                style={{
                  background: "transparent",
                  border:
                    "1px solid color-mix(in srgb, #25D366 45%, transparent)",
                  color: "#25D366",
                }}
                onClick={() => console.log("bulk whatsapp")}
              >
                <MessageCircle size={13} />
                Bulk WhatsApp month-end updates
              </button>
              <button
                className="inline-flex items-center gap-1.5 text-xs font-semibold px-3.5 py-2 rounded-lg cursor-pointer transition-colors"
                style={{
                  background: "transparent",
                  border: "1px solid var(--border)",
                  color: "var(--text-2)",
                }}
                onClick={() => console.log("export portfolio")}
              >
                <FileSpreadsheet size={13} />
                Export portfolio summary
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
