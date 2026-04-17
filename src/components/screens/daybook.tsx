"use client";

import { useState, useMemo } from "react";
import { motion } from "framer-motion";
import { Search } from "lucide-react";
import { DAYBOOK } from "@/lib/data";
import { Pill } from "@/components/ui/pill";

/* ── Voucher type colours ── */
const TYPE_COLORS: Record<string, string> = {
  Sales: "var(--green)",
  Purchase: "var(--orange)",
  Receipt: "var(--blue)",
  Payment: "var(--red)",
  Journal: "var(--purple)",
};

/* ── Date range options ── */
const DATE_RANGES = ["This Month", "Last Month", "This Quarter", "Current FY", "Last FY"] as const;

/* ── Format currency ── */
function fmtAmt(v: number) {
  return "\u20B9" + v.toLocaleString("en-IN");
}

export function DaybookScreen() {
  const [activeRange, setActiveRange] = useState<string>("This Month");
  const [searchQuery, setSearchQuery] = useState("");

  /* Filter entries by search */
  const filtered = useMemo(() => {
    if (!searchQuery.trim()) return DAYBOOK;
    const q = searchQuery.toLowerCase();
    return DAYBOOK.filter(
      (e) =>
        e.name.toLowerCase().includes(q) ||
        e.type.toLowerCase().includes(q) ||
        String(e.invoice).includes(q),
    );
  }, [searchQuery]);

  /* Group by date */
  const grouped = useMemo(() => {
    const map = new Map<string, typeof DAYBOOK>();
    for (const entry of filtered) {
      const arr = map.get(entry.date) || [];
      arr.push(entry);
      map.set(entry.date, arr);
    }
    return Array.from(map.entries());
  }, [filtered]);

  /* Summary */
  const totalEntries = filtered.length;
  const totalDebit = filtered
    .filter((e) => ["Purchase", "Payment"].includes(e.type))
    .reduce((s, e) => s + e.amount, 0);
  const totalCredit = filtered
    .filter((e) => ["Sales", "Receipt"].includes(e.type))
    .reduce((s, e) => s + e.amount, 0);

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.1 }}
      transition={{ duration: 0.4 }}
      className="px-4 py-4 max-w-4xl mx-auto w-full"
    >
      {/* Header */}
      <h2 className="text-lg font-bold mb-4" style={{ color: "var(--text-1)" }}>
        Day Book
      </h2>

      {/* Filter bar */}
      <div className="flex flex-col sm:flex-row gap-3 mb-4">
        <div className="flex flex-wrap gap-1.5">
          {DATE_RANGES.map((r) => (
            <button
              key={r}
              onClick={() => setActiveRange(r)}
              className="text-xs font-medium px-3 py-1.5 rounded-lg transition-colors cursor-pointer"
              style={{
                background:
                  activeRange === r
                    ? "color-mix(in srgb, var(--green) 15%, transparent)"
                    : "var(--bg-surface)",
                color: activeRange === r ? "var(--green)" : "var(--text-3)",
                border: `1px solid ${activeRange === r ? "color-mix(in srgb, var(--green) 40%, transparent)" : "var(--border)"}`,
              }}
            >
              {r}
            </button>
          ))}
        </div>
        <div
          className="flex items-center gap-2 rounded-lg px-3 py-1.5 flex-1 min-w-[180px]"
          style={{ background: "var(--bg-surface)", border: "1px solid var(--border)" }}
        >
          <Search size={14} style={{ color: "var(--text-4)" }} />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search entries..."
            className="bg-transparent text-xs outline-none flex-1"
            style={{ color: "var(--text-1)" }}
          />
        </div>
      </div>

      {/* Summary row */}
      <div
        className="flex flex-wrap gap-4 rounded-xl px-4 py-3 mb-4 text-xs font-medium"
        style={{ background: "var(--bg-surface)", border: "1px solid var(--border)" }}
      >
        <span style={{ color: "var(--text-3)" }}>
          Total: <strong style={{ color: "var(--text-1)" }}>{totalEntries} entries</strong>
        </span>
        <span style={{ color: "var(--text-3)" }}>
          Debit:{" "}
          <strong style={{ color: "var(--red)" }}>{fmtAmt(totalDebit)}</strong>
        </span>
        <span style={{ color: "var(--text-3)" }}>
          Credit:{" "}
          <strong style={{ color: "var(--green)" }}>{fmtAmt(totalCredit)}</strong>
        </span>
      </div>

      {/* ── Desktop table ── */}
      <div
        className="hidden sm:block rounded-xl overflow-hidden"
        style={{ border: "1px solid var(--border)" }}
      >
        <table className="w-full text-xs">
          <thead>
            <tr style={{ background: "var(--bg-surface)" }}>
              {["Date", "Invoice #", "Type", "Name", "Amount"].map((h) => (
                <th
                  key={h}
                  className={`px-4 py-2.5 font-semibold ${h === "Amount" ? "text-right" : "text-left"}`}
                  style={{ color: "var(--text-4)", borderBottom: "1px solid var(--border)" }}
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {grouped.map(([date, entries]) => (
              entries.map((entry, idx) => (
                <tr
                  key={`${entry.invoice}-${idx}`}
                  className="transition-colors duration-100 group"
                  style={{
                    borderBottom: "1px solid var(--border)",
                  }}
                  onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = "color-mix(in srgb, var(--text-1) 4%, transparent)"; }}
                  onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = "transparent"; }}
                >
                  <td className="px-4 py-2" style={{ color: idx === 0 ? "var(--text-2)" : "transparent" }}>
                    {date}
                  </td>
                  <td className="px-4 py-2 tabular-nums" style={{ color: "var(--text-3)" }}>
                    #{entry.invoice}
                  </td>
                  <td className="px-4 py-2">
                    <Pill color={TYPE_COLORS[entry.type] || "var(--text-3)"}>
                      {entry.type}
                    </Pill>
                  </td>
                  <td className="px-4 py-2" style={{ color: "var(--text-1)" }}>
                    {entry.name}
                  </td>
                  <td
                    className="px-4 py-2 text-right font-semibold tabular-nums"
                    style={{ color: "var(--text-1)", fontFamily: "'Space Grotesk', sans-serif" }}
                  >
                    {fmtAmt(entry.amount)}
                  </td>
                </tr>
              ))
            ))}
          </tbody>
        </table>
      </div>

      {/* ── Mobile cards ── */}
      <div className="sm:hidden space-y-2">
        {grouped.map(([date, entries]) => (
          <div key={date}>
            <p
              className="text-[10px] uppercase tracking-wider font-semibold px-1 py-1.5"
              style={{ color: "var(--text-4)" }}
            >
              {date}
            </p>
            {entries.map((entry, idx) => (
              <div
                key={`${entry.invoice}-m-${idx}`}
                className="flex items-center gap-3 rounded-lg px-3 py-2.5 mb-1"
                style={{
                  background: "var(--bg-surface)",
                  border: "1px solid var(--border)",
                }}
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <Pill color={TYPE_COLORS[entry.type] || "var(--text-3)"}>
                      {entry.type}
                    </Pill>
                    <span className="text-[10px]" style={{ color: "var(--text-4)" }}>
                      #{entry.invoice}
                    </span>
                  </div>
                  <p className="text-xs truncate" style={{ color: "var(--text-1)" }}>
                    {entry.name}
                  </p>
                </div>
                <span
                  className="text-sm font-bold tabular-nums flex-shrink-0"
                  style={{ color: "var(--text-1)" }}
                >
                  {fmtAmt(entry.amount)}
                </span>
              </div>
            ))}
          </div>
        ))}
      </div>
    </motion.div>
  );
}
