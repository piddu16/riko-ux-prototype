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

/* ── Stat card accent colours ── */
const STAT_ACCENTS: Record<string, string> = {
  Entries: "var(--text-3)",
  Purchase: "var(--orange)",
  Sales: "var(--green)",
  Receipt: "var(--blue)",
  Payment: "var(--red)",
};

/* ── Voucher bar config ── */
const VOUCHER_TYPES = ["Purchase", "Sales", "Receipt", "Payment", "Journal"] as const;

export function DaybookScreen() {
  const [activeRange, setActiveRange] = useState<string>("This Month");
  const [searchQuery, setSearchQuery] = useState("");
  const [activeParty, setActiveParty] = useState<string>("All");

  /* Top-5 parties by transaction count */
  const topParties = useMemo(() => {
    const counts = new Map<string, number>();
    for (const e of DAYBOOK) {
      counts.set(e.name, (counts.get(e.name) ?? 0) + 1);
    }
    return Array.from(counts.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([name]) => name);
  }, []);

  /* Filter entries by search + active party */
  const filtered = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return DAYBOOK.filter((e) => {
      if (activeParty !== "All" && !e.name.toLowerCase().includes(activeParty.toLowerCase())) {
        return false;
      }
      if (q) {
        return (
          e.name.toLowerCase().includes(q) ||
          e.type.toLowerCase().includes(q) ||
          String(e.invoice).includes(q)
        );
      }
      return true;
    });
  }, [searchQuery, activeParty]);

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

  /* Per-type breakdowns for desktop enrichment */
  const voucherBreakdown = useMemo(() => {
    return VOUCHER_TYPES.map((type) => {
      const entries = filtered.filter((e) => e.type === type);
      return { type, count: entries.length, total: entries.reduce((s, e) => s + e.amount, 0) };
    });
  }, [filtered]);

  const purchaseTotal = voucherBreakdown.find((v) => v.type === "Purchase")?.total ?? 0;
  const salesTotal = voucherBreakdown.find((v) => v.type === "Sales")?.total ?? 0;
  const receiptTotal = voucherBreakdown.find((v) => v.type === "Receipt")?.total ?? 0;
  const paymentTotal = voucherBreakdown.find((v) => v.type === "Payment")?.total ?? 0;
  const maxVoucherTotal = Math.max(...voucherBreakdown.map((v) => v.total), 1);

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.1 }}
      transition={{ duration: 0.4 }}
      className="px-4 py-4 max-w-4xl md:max-w-5xl mx-auto w-full"
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

      {/* Party chip filter */}
      <motion.div
        initial={{ opacity: 0, y: 6 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, amount: 0.3 }}
        transition={{ duration: 0.3 }}
        className="flex flex-wrap items-center gap-1.5 mb-4"
      >
        <span
          className="text-[10px] uppercase tracking-wider font-semibold mr-1"
          style={{ color: "var(--text-4)" }}
        >
          Party:
        </span>
        {["All", ...topParties].map((p) => {
          const active = activeParty === p;
          const label = p.length > 22 ? p.slice(0, 20) + "…" : p;
          return (
            <button
              key={p}
              type="button"
              onClick={() => setActiveParty(p)}
              title={p}
              className="text-[11px] font-semibold px-3 py-1 rounded-full cursor-pointer transition-colors whitespace-nowrap"
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
              {label}
            </button>
          );
        })}
      </motion.div>

      {/* ── Desktop: Summary Dashboard ── */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, amount: 0.3 }}
        transition={{ duration: 0.4, delay: 0.05 }}
        className="hidden md:grid grid-cols-5 gap-3 mb-4"
      >
        {[
          { label: "Total Entries", value: String(totalEntries), accent: STAT_ACCENTS.Entries, isCurrency: false },
          { label: "Purchases", value: fmtAmt(purchaseTotal), accent: STAT_ACCENTS.Purchase, isCurrency: true },
          { label: "Sales", value: fmtAmt(salesTotal), accent: STAT_ACCENTS.Sales, isCurrency: true },
          { label: "Receipts", value: fmtAmt(receiptTotal), accent: STAT_ACCENTS.Receipt, isCurrency: true },
          { label: "Payments", value: fmtAmt(paymentTotal), accent: STAT_ACCENTS.Payment, isCurrency: true },
        ].map((card) => (
          <div
            key={card.label}
            className="rounded-xl overflow-hidden"
            style={{ background: "var(--bg-surface)", border: "1px solid var(--border)" }}
          >
            <div className="h-1" style={{ background: card.accent }} />
            <div className="px-3 py-3">
              <p className="text-[10px] uppercase tracking-wider font-medium mb-1" style={{ color: "var(--text-4)" }}>
                {card.label}
              </p>
              <p
                className="text-lg font-bold tabular-nums"
                style={{ color: "var(--text-1)", fontFamily: card.isCurrency ? "'Space Grotesk', sans-serif" : "inherit" }}
              >
                {card.value}
              </p>
            </div>
          </div>
        ))}
      </motion.div>

      {/* ── Desktop: Voucher Type Breakdown ── */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, amount: 0.3 }}
        transition={{ duration: 0.4, delay: 0.1 }}
        className="hidden md:block rounded-xl p-4 mb-4"
        style={{ background: "var(--bg-surface)", border: "1px solid var(--border)" }}
      >
        <p className="text-xs font-semibold mb-3" style={{ color: "var(--text-2)" }}>
          Voucher Type Breakdown
        </p>
        <div className="flex flex-col gap-2.5">
          {voucherBreakdown.map((v) => {
            const barColor = TYPE_COLORS[v.type] || "var(--text-3)";
            const barWidth = maxVoucherTotal > 0 ? Math.max((v.total / maxVoucherTotal) * 100, 2) : 2;
            return (
              <div key={v.type} className="flex items-center gap-3">
                <span className="text-xs font-medium w-16 flex-shrink-0" style={{ color: "var(--text-3)" }}>
                  {v.type}
                </span>
                <div className="flex-1 h-5 rounded-md overflow-hidden relative" style={{ background: "var(--bg-secondary)" }}>
                  <motion.div
                    initial={{ width: 0 }}
                    whileInView={{ width: `${barWidth}%` }}
                    viewport={{ once: true, amount: 0.5 }}
                    transition={{ duration: 0.6, ease: "easeOut" }}
                    className="h-full rounded-md"
                    style={{ background: `color-mix(in srgb, ${barColor} 40%, transparent)` }}
                  />
                </div>
                <span className="text-[10px] font-medium w-16 text-right tabular-nums" style={{ color: "var(--text-4)" }}>
                  {v.count} {v.count === 1 ? "entry" : "entries"}
                </span>
                <span
                  className="text-xs font-bold w-24 text-right tabular-nums flex-shrink-0"
                  style={{ color: "var(--text-1)", fontFamily: "'Space Grotesk', sans-serif" }}
                >
                  {fmtAmt(v.total)}
                </span>
              </div>
            );
          })}
        </div>
      </motion.div>

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
