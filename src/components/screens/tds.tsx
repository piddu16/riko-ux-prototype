"use client";

import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import { AlertTriangle, Search, FileDown, Download, Receipt } from "lucide-react";
import {
  TDS_SECTIONS,
  TDS_UPCOMING,
  TDS_DEDUCTEES,
  formatINR,
} from "@/lib/data";

/* ------------------------------------------------------------------ */
/*  Shared animation variant                                           */
/* ------------------------------------------------------------------ */
const sectionAnim = {
  initial: { opacity: 0, y: 20 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, amount: 0.15 as const },
  transition: { duration: 0.4, ease: "easeOut" as const },
};

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */
function daysUntil(dateStr: string, today = new Date("2026-04-21")): number {
  // dateStr like "7 May 2026"
  const months: Record<string, number> = {
    Jan: 0, Feb: 1, Mar: 2, Apr: 3, May: 4, Jun: 5,
    Jul: 6, Aug: 7, Sep: 8, Oct: 9, Nov: 10, Dec: 11,
  };
  const parts = dateStr.split(" ");
  const d = Number(parts[0]);
  const m = months[parts[1]];
  const y = Number(parts[2]);
  const target = new Date(Date.UTC(y, m, d));
  const diff = target.getTime() - today.getTime();
  return Math.ceil(diff / (1000 * 60 * 60 * 24));
}

/** Mask PAN: first 4 + last 1 visible */
function maskPan(pan: string): string {
  if (pan.length !== 10) return pan;
  return `${pan.slice(0, 4)}XXXX${pan.slice(-1)}`;
}

const SECTION_COLORS: Record<string, string> = {
  "194Q": "var(--blue)",
  "194J": "var(--purple)",
  "194C": "var(--orange)",
  "192": "var(--green)",
  "194I": "var(--yellow)",
  "194H": "var(--red)",
};

/* ------------------------------------------------------------------ */
/*  TDS Screen                                                         */
/* ------------------------------------------------------------------ */
export function TdsScreen() {
  const [search, setSearch] = useState("");
  const [sectionFilter, setSectionFilter] = useState<string>("all");

  const totalLiability = TDS_SECTIONS.reduce((s, r) => s + r.liability, 0);
  const totalTransactions = TDS_SECTIONS.reduce((s, r) => s + r.transactions, 0);

  const sectionOptions = useMemo(
    () => ["all", ...new Set(TDS_DEDUCTEES.map((d) => d.section))],
    [],
  );

  const filteredDeductees = useMemo(() => {
    const q = search.trim().toLowerCase();
    return TDS_DEDUCTEES
      .filter((d) => sectionFilter === "all" || d.section === sectionFilter)
      .filter((d) =>
        !q ||
        d.name.toLowerCase().includes(q) ||
        d.pan.toLowerCase().includes(q) ||
        d.section.toLowerCase().includes(q),
      )
      .slice()
      .sort((a, b) => b.tdsAmount - a.tdsAmount);
  }, [search, sectionFilter]);

  /* Stat card data — 4 upcoming statutory dates, CBDT-accurate.
     Rule 30 (March special deadline), Rule 31A (Q4 return),
     Rule 31 (Form 16/16A). */
  const daysToMarch = daysUntil(TDS_UPCOMING.marchDepositDueDate);
  const daysToApril = daysUntil(TDS_UPCOMING.aprilDepositDueDate);
  const daysToQ4Return = daysUntil(TDS_UPCOMING.quarterlyReturnDueDate);
  const daysToForm16 = daysUntil(TDS_UPCOMING.form16DueDate);
  const statCards = [
    {
      label: "March TDS Deposit",
      date: TDS_UPCOMING.marchDepositDueDate,
      amount: formatINR(TDS_UPCOMING.marchDepositAmount),
      urgent: daysToMarch >= 0 && daysToMarch < 14,
      daysNote: daysToMarch >= 0 ? `in ${daysToMarch}d` : `${-daysToMarch}d overdue`,
      icon: "deposit",
    },
    {
      label: "April TDS Deposit",
      date: TDS_UPCOMING.aprilDepositDueDate,
      amount: formatINR(TDS_UPCOMING.aprilDepositAmount),
      urgent: daysToApril >= 0 && daysToApril < 7,
      daysNote: `in ${daysToApril}d`,
      icon: "deposit",
    },
    {
      label: "Q4 TDS Return (24Q + 26Q)",
      date: TDS_UPCOMING.quarterlyReturnDueDate,
      amount: "Jan-Mar FY25",
      urgent: false,
      daysNote: `in ${daysToQ4Return}d`,
      icon: "filing",
    },
    {
      label: "Form 16 / 16A Issuance",
      date: TDS_UPCOMING.form16DueDate,
      amount: "All deductees",
      urgent: false,
      daysNote: `in ${daysToForm16}d`,
      icon: "form16",
    },
  ];

  return (
    <div
      className="min-h-screen pb-24"
      style={{ background: "var(--bg-primary)" }}
    >
      <div className="max-w-3xl md:max-w-6xl mx-auto px-4 py-6 flex flex-col gap-5">
        {/* Header */}
        <motion.div {...sectionAnim} className="flex items-start gap-3">
          <div
            className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0"
            style={{
              background: "color-mix(in srgb, var(--blue) 15%, transparent)",
              border: "1px solid color-mix(in srgb, var(--blue) 30%, transparent)",
            }}
          >
            <Receipt size={18} style={{ color: "var(--blue)" }} />
          </div>
          <div className="min-w-0">
            <h2 className="text-lg font-bold" style={{ color: "var(--text-1)" }}>
              TDS Workings
            </h2>
            <p className="text-xs mt-0.5" style={{ color: "var(--text-3)" }}>
              Sections, deductees, upcoming due dates
            </p>
          </div>
        </motion.div>

        {/* -------------------------------------------------------- */}
        {/*  Upcoming deadlines — 4 stat cards                        */}
        {/* -------------------------------------------------------- */}
        <motion.div {...sectionAnim}>
          <p
            className="text-[10px] uppercase tracking-wider font-medium mb-2"
            style={{ color: "var(--text-4)" }}
          >
            Upcoming Deadlines
          </p>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {statCards.map((card) => {
              const accent = card.urgent ? "var(--red)" : "var(--blue)";
              return (
                <div
                  key={card.label}
                  className="rounded-md overflow-hidden"
                  style={{
                    background: card.urgent
                      ? "color-mix(in srgb, var(--red) 10%, var(--bg-surface))"
                      : "var(--bg-surface)",
                    border: `1px solid ${card.urgent ? "color-mix(in srgb, var(--red) 35%, transparent)" : "var(--border)"}`,
                  }}
                >
                  <div className="h-1" style={{ background: accent }} />
                  <div className="px-3 py-3">
                    <div className="flex items-start justify-between gap-2 mb-1.5">
                      <p
                        className="text-[10px] uppercase tracking-wider font-medium leading-tight"
                        style={{ color: "var(--text-4)" }}
                      >
                        {card.label}
                      </p>
                      {card.urgent && (
                        <AlertTriangle size={12} style={{ color: "var(--red)" }} />
                      )}
                    </div>
                    <p
                      className="text-sm font-bold tabular-nums"
                      style={{
                        color: card.urgent ? "var(--red)" : "var(--text-1)",
                        fontFamily: "'Space Grotesk', sans-serif",
                      }}
                    >
                      {card.date}
                    </p>
                    <div className="flex items-center gap-2 mt-1">
                      <span
                        className="text-xs font-semibold tabular-nums"
                        style={{
                          color: card.urgent ? "var(--red)" : "var(--text-2)",
                          fontFamily: "'Space Grotesk', sans-serif",
                        }}
                      >
                        {card.amount}
                      </span>
                      <span
                        className="text-[10px] px-1.5 py-0.5 rounded tabular-nums"
                        style={{
                          color: card.urgent ? "var(--red)" : "var(--text-4)",
                          background: card.urgent
                            ? "color-mix(in srgb, var(--red) 12%, transparent)"
                            : "color-mix(in srgb, var(--text-4) 12%, transparent)",
                        }}
                      >
                        {card.daysNote}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </motion.div>

        {/* -------------------------------------------------------- */}
        {/*  TDS by Section                                           */}
        {/* -------------------------------------------------------- */}
        <motion.div
          {...sectionAnim}
          className="rounded-md overflow-hidden"
          style={{
            background: "var(--bg-surface)",
            border: "1px solid var(--border)",
          }}
        >
          <div
            className="px-4 py-3 flex items-center justify-between"
            style={{ borderBottom: "1px solid var(--border)" }}
          >
            <div>
              <h3 className="text-sm font-semibold" style={{ color: "var(--text-1)" }}>
                TDS by Section
              </h3>
              <p className="text-[11px] mt-0.5" style={{ color: "var(--text-4)" }}>
                March 2026 · {totalTransactions} transactions · {TDS_SECTIONS.length} sections
              </p>
            </div>
            <span
              className="text-[10px] font-semibold px-2 py-0.5 rounded-full"
              style={{
                background: "color-mix(in srgb, var(--blue) 15%, transparent)",
                color: "var(--blue)",
              }}
            >
              March 2026
            </span>
          </div>

          {/* Desktop: table */}
          <div className="hidden sm:block overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr style={{ background: "var(--bg-secondary)" }}>
                  {["Section", "Description", "Transactions", "Rate %", "Liability"].map((h, i) => (
                    <th
                      key={h}
                      className={`px-4 py-2.5 font-semibold ${i >= 2 ? "text-right" : "text-left"}`}
                      style={{ color: "var(--text-4)", borderBottom: "1px solid var(--border)" }}
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {TDS_SECTIONS.map((s) => {
                  const color = SECTION_COLORS[s.section] || "var(--text-3)";
                  return (
                    <tr
                      key={s.section}
                      className="transition-colors"
                      style={{ borderBottom: "1px solid var(--border)" }}
                      onMouseEnter={(e) => {
                        (e.currentTarget as HTMLElement).style.background =
                          "color-mix(in srgb, var(--text-1) 4%, transparent)";
                      }}
                      onMouseLeave={(e) => {
                        (e.currentTarget as HTMLElement).style.background = "transparent";
                      }}
                    >
                      <td className="px-4 py-2.5">
                        <span
                          className="inline-block font-bold text-xs px-2 py-0.5 rounded"
                          style={{
                            color,
                            background: `color-mix(in srgb, ${color} 14%, transparent)`,
                            fontFamily: "'Space Grotesk', sans-serif",
                          }}
                        >
                          {s.section}
                        </span>
                      </td>
                      <td className="px-4 py-2.5" style={{ color: "var(--text-2)" }}>
                        {s.desc}
                      </td>
                      <td
                        className="px-4 py-2.5 text-right tabular-nums"
                        style={{ color: "var(--text-3)" }}
                      >
                        {s.transactions}
                      </td>
                      <td
                        className="px-4 py-2.5 text-right tabular-nums"
                        style={{ color: "var(--text-3)" }}
                      >
                        {s.rate > 0 ? `${s.rate}%` : "Slab"}
                      </td>
                      <td
                        className="px-4 py-2.5 text-right font-semibold tabular-nums"
                        style={{
                          color: "var(--text-1)",
                          fontFamily: "'Space Grotesk', sans-serif",
                        }}
                      >
                        {formatINR(s.liability)}
                      </td>
                    </tr>
                  );
                })}
                {/* Total row */}
                <tr style={{ background: "var(--bg-secondary)" }}>
                  <td
                    colSpan={2}
                    className="px-4 py-2.5 font-bold"
                    style={{ color: "var(--text-1)" }}
                  >
                    Total
                  </td>
                  <td
                    className="px-4 py-2.5 text-right font-semibold tabular-nums"
                    style={{ color: "var(--text-2)" }}
                  >
                    {totalTransactions}
                  </td>
                  <td />
                  <td
                    className="px-4 py-2.5 text-right font-bold tabular-nums"
                    style={{
                      color: "var(--blue)",
                      fontFamily: "'Space Grotesk', sans-serif",
                    }}
                  >
                    {formatINR(totalLiability)}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Mobile: cards */}
          <div className="sm:hidden divide-y" style={{ borderColor: "var(--border)" }}>
            {TDS_SECTIONS.map((s) => {
              const color = SECTION_COLORS[s.section] || "var(--text-3)";
              return (
                <div
                  key={s.section}
                  className="px-4 py-3 flex items-center gap-3"
                  style={{ borderTop: "1px solid var(--border)" }}
                >
                  <span
                    className="inline-flex items-center justify-center font-bold text-[11px] w-12 h-12 rounded flex-shrink-0"
                    style={{
                      color,
                      background: `color-mix(in srgb, ${color} 14%, transparent)`,
                      fontFamily: "'Space Grotesk', sans-serif",
                    }}
                  >
                    {s.section}
                  </span>
                  <div className="flex-1 min-w-0">
                    <p
                      className="text-xs font-medium truncate"
                      style={{ color: "var(--text-1)" }}
                    >
                      {s.desc}
                    </p>
                    <p className="text-[10px] tabular-nums" style={{ color: "var(--text-4)" }}>
                      {s.transactions} txns · {s.rate > 0 ? `${s.rate}%` : "slab"}
                    </p>
                  </div>
                  <span
                    className="text-sm font-bold tabular-nums"
                    style={{
                      color: "var(--text-1)",
                      fontFamily: "'Space Grotesk', sans-serif",
                    }}
                  >
                    {formatINR(s.liability)}
                  </span>
                </div>
              );
            })}
            <div
              className="px-4 py-3 flex items-center justify-between"
              style={{ background: "var(--bg-secondary)" }}
            >
              <span className="text-xs font-bold" style={{ color: "var(--text-1)" }}>
                Total Liability
              </span>
              <span
                className="text-sm font-bold tabular-nums"
                style={{
                  color: "var(--blue)",
                  fontFamily: "'Space Grotesk', sans-serif",
                }}
              >
                {formatINR(totalLiability)}
              </span>
            </div>
          </div>
        </motion.div>

        {/* -------------------------------------------------------- */}
        {/*  Top Deductees                                            */}
        {/* -------------------------------------------------------- */}
        <motion.div
          {...sectionAnim}
          className="rounded-md overflow-hidden"
          style={{
            background: "var(--bg-surface)",
            border: "1px solid var(--border)",
          }}
        >
          <div
            className="px-4 py-3"
            style={{ borderBottom: "1px solid var(--border)" }}
          >
            <div className="flex items-center justify-between gap-2 mb-3">
              <div>
                <h3 className="text-sm font-semibold" style={{ color: "var(--text-1)" }}>
                  Top Deductees
                </h3>
                <p className="text-[11px] mt-0.5" style={{ color: "var(--text-4)" }}>
                  Sorted by highest TDS
                </p>
              </div>
            </div>

            {/* Search + section filter chips */}
            <div className="flex flex-col sm:flex-row gap-2">
              <div
                className="flex items-center gap-2 rounded-lg px-3 py-1.5 flex-1 min-w-[180px]"
                style={{
                  background: "var(--bg-secondary)",
                  border: "1px solid var(--border)",
                }}
              >
                <Search size={14} style={{ color: "var(--text-4)" }} />
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search deductees, PAN..."
                  className="bg-transparent text-xs outline-none flex-1 min-w-0"
                  style={{ color: "var(--text-1)" }}
                />
              </div>
              <div className="flex flex-wrap gap-1.5">
                {sectionOptions.map((opt) => {
                  const active = sectionFilter === opt;
                  const color = opt === "all" ? "var(--blue)" : SECTION_COLORS[opt] || "var(--text-3)";
                  return (
                    <button
                      key={opt}
                      onClick={() => setSectionFilter(opt)}
                      className="text-[11px] font-semibold px-2.5 py-1 rounded-lg transition-colors cursor-pointer"
                      style={{
                        background: active
                          ? `color-mix(in srgb, ${color} 18%, transparent)`
                          : "var(--bg-secondary)",
                        color: active ? color : "var(--text-3)",
                        border: `1px solid ${active ? `color-mix(in srgb, ${color} 40%, transparent)` : "var(--border)"}`,
                      }}
                    >
                      {opt === "all" ? "All" : opt}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Desktop table */}
          <div className="hidden sm:block overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr style={{ background: "var(--bg-secondary)" }}>
                  {["Name", "PAN", "Section", "Amount Paid", "Rate", "TDS"].map((h, i) => (
                    <th
                      key={h}
                      className={`px-4 py-2.5 font-semibold ${i >= 3 ? "text-right" : "text-left"}`}
                      style={{ color: "var(--text-4)", borderBottom: "1px solid var(--border)" }}
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filteredDeductees.map((d) => {
                  const color = SECTION_COLORS[d.section] || "var(--text-3)";
                  return (
                    <tr
                      key={d.pan}
                      className="transition-colors"
                      style={{ borderBottom: "1px solid var(--border)" }}
                      onMouseEnter={(e) => {
                        (e.currentTarget as HTMLElement).style.background =
                          "color-mix(in srgb, var(--text-1) 4%, transparent)";
                      }}
                      onMouseLeave={(e) => {
                        (e.currentTarget as HTMLElement).style.background = "transparent";
                      }}
                    >
                      <td className="px-4 py-2.5" style={{ color: "var(--text-1)" }}>
                        {d.name}
                      </td>
                      <td
                        className="px-4 py-2.5 tabular-nums"
                        style={{ color: "var(--text-3)", fontFamily: "'Space Grotesk', sans-serif" }}
                      >
                        {maskPan(d.pan)}
                      </td>
                      <td className="px-4 py-2.5">
                        <span
                          className="inline-block font-bold text-[10px] px-1.5 py-0.5 rounded"
                          style={{
                            color,
                            background: `color-mix(in srgb, ${color} 14%, transparent)`,
                          }}
                        >
                          {d.section}
                        </span>
                      </td>
                      <td
                        className="px-4 py-2.5 text-right tabular-nums"
                        style={{
                          color: "var(--text-2)",
                          fontFamily: "'Space Grotesk', sans-serif",
                        }}
                      >
                        {formatINR(d.amount)}
                      </td>
                      <td
                        className="px-4 py-2.5 text-right tabular-nums"
                        style={{ color: "var(--text-3)" }}
                      >
                        {d.tdsRate}%
                      </td>
                      <td
                        className="px-4 py-2.5 text-right font-semibold tabular-nums"
                        style={{
                          color: "var(--text-1)",
                          fontFamily: "'Space Grotesk', sans-serif",
                        }}
                      >
                        {formatINR(d.tdsAmount)}
                      </td>
                    </tr>
                  );
                })}
                {filteredDeductees.length === 0 && (
                  <tr>
                    <td
                      colSpan={6}
                      className="px-4 py-8 text-center text-xs"
                      style={{ color: "var(--text-4)" }}
                    >
                      No deductees match your filters.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Mobile cards */}
          <div className="sm:hidden">
            {filteredDeductees.map((d) => {
              const color = SECTION_COLORS[d.section] || "var(--text-3)";
              return (
                <div
                  key={d.pan}
                  className="px-4 py-3"
                  style={{ borderTop: "1px solid var(--border)" }}
                >
                  <div className="flex items-start justify-between gap-2 mb-1.5">
                    <p
                      className="text-xs font-semibold leading-tight flex-1"
                      style={{ color: "var(--text-1)" }}
                    >
                      {d.name}
                    </p>
                    <span
                      className="inline-block font-bold text-[10px] px-1.5 py-0.5 rounded flex-shrink-0"
                      style={{
                        color,
                        background: `color-mix(in srgb, ${color} 14%, transparent)`,
                      }}
                    >
                      {d.section}
                    </span>
                  </div>
                  <p
                    className="text-[10px] mb-1.5 tabular-nums"
                    style={{ color: "var(--text-4)", fontFamily: "'Space Grotesk', sans-serif" }}
                  >
                    PAN {maskPan(d.pan)} · {d.tdsRate}%
                  </p>
                  <div className="flex items-end justify-between">
                    <div>
                      <p className="text-[10px]" style={{ color: "var(--text-4)" }}>
                        Amount Paid
                      </p>
                      <p
                        className="text-xs tabular-nums"
                        style={{
                          color: "var(--text-2)",
                          fontFamily: "'Space Grotesk', sans-serif",
                        }}
                      >
                        {formatINR(d.amount)}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-[10px]" style={{ color: "var(--text-4)" }}>
                        TDS
                      </p>
                      <p
                        className="text-sm font-bold tabular-nums"
                        style={{
                          color: "var(--text-1)",
                          fontFamily: "'Space Grotesk', sans-serif",
                        }}
                      >
                        {formatINR(d.tdsAmount)}
                      </p>
                    </div>
                  </div>
                </div>
              );
            })}
            {filteredDeductees.length === 0 && (
              <p
                className="px-4 py-8 text-center text-xs"
                style={{ color: "var(--text-4)" }}
              >
                No deductees match your filters.
              </p>
            )}
          </div>
        </motion.div>

        {/* -------------------------------------------------------- */}
        {/*  Action buttons                                           */}
        {/* -------------------------------------------------------- */}
        <motion.div
          {...sectionAnim}
          className="flex flex-col sm:flex-row flex-wrap gap-2"
        >
          <button
            className="flex items-center justify-center gap-2 text-xs font-semibold px-4 py-2.5 rounded-lg cursor-pointer transition-colors"
            style={{
              background: "var(--green)",
              color: "#fff",
              border: "1px solid var(--green)",
            }}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLElement).style.background = "var(--green-dark)";
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLElement).style.background = "var(--green)";
            }}
          >
            <Receipt size={14} />
            Generate Challan (ITNS 281)
          </button>
          <button
            className="flex items-center justify-center gap-2 text-xs font-semibold px-4 py-2.5 rounded-lg cursor-pointer transition-colors"
            style={{
              background: "transparent",
              color: "var(--text-2)",
              border: "1px solid var(--border)",
            }}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLElement).style.background = "var(--bg-secondary)";
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLElement).style.background = "transparent";
            }}
          >
            <Download size={14} />
            Download TDS Certificate Data
          </button>
          <button
            className="flex items-center justify-center gap-2 text-xs font-semibold px-4 py-2.5 rounded-lg cursor-pointer transition-colors"
            style={{
              background: "transparent",
              color: "var(--text-2)",
              border: "1px solid var(--border)",
            }}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLElement).style.background = "var(--bg-secondary)";
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLElement).style.background = "transparent";
            }}
          >
            <FileDown size={14} />
            Export for Traces
          </button>
        </motion.div>
      </div>
    </div>
  );
}
