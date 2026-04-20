"use client";

import { useState, useMemo, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Search, Filter, Upload, AlertTriangle, Lock, ArrowRight, Info } from "lucide-react";
import {
  INVENTORY,
  DEAD_STOCK,
  DEAD_STOCK_SUMMARY,
  GODOWNS,
  TALLY_VALUATION,
  STOCK_SNAPSHOTS,
  daysSinceCount,
  fL,
  formatINR,
} from "@/lib/data";
import { Pill } from "@/components/ui/pill";
import { PhysicalStockModal } from "@/components/ui/physical-stock-modal";

/* ── Dead stock category color map ── */
const DEAD_STOCK_CAT_COLOR: Record<string, string> = {
  Discontinued: "var(--red)",
  "Slow moving": "var(--yellow)",
  "Expiring soon": "var(--orange)",
};

/* ── Status config ── */
const STATUS_CFG: Record<string, { label: string; color: string }> = {
  ok: { label: "In Stock", color: "var(--green)" },
  low: { label: "Low Stock", color: "var(--yellow)" },
  out: { label: "Out of Stock", color: "var(--red)" },
};

/* ── Format currency ── */
function fmtAmt(v: number) {
  return "\u20B9" + v.toLocaleString("en-IN");
}

/** Days-since-count → dot color. <30 green, 30-60 yellow, >60 red. */
function staleColor(days: number): string {
  if (days < 30) return "var(--green)";
  if (days < 60) return "var(--yellow)";
  return "var(--red)";
}

export function InventoryScreen() {
  const [searchQuery, setSearchQuery] = useState("");
  const [activeGodown, setActiveGodown] = useState<"all" | string>("all");
  const [reconOpen, setReconOpen] = useState(false);
  // Banner + tab subheader: "Last reconciled: today" for demo theatrics
  const [justReconciled, setJustReconciled] = useState<{ major: number; bulk: number } | null>(null);
  // Listen for deep-link from Clients → Inventory → open Reconcile modal
  useEffect(() => {
    const handler = (e: Event) => {
      const detail = (e as CustomEvent<string>).detail;
      if (detail === "inventory:reconcile") setReconOpen(true);
    };
    window.addEventListener("riko:navigate", handler as EventListener);
    return () => window.removeEventListener("riko:navigate", handler as EventListener);
  }, []);

  // Active godown scope for filtering everything below
  const scopedInventory = useMemo(() => {
    if (activeGodown === "all") return INVENTORY;
    return INVENTORY.filter((i) => i.godownId === activeGodown);
  }, [activeGodown]);

  const filtered = useMemo(() => {
    if (!searchQuery.trim()) return scopedInventory;
    const q = searchQuery.toLowerCase();
    return scopedInventory.filter(
      (item) =>
        item.name.toLowerCase().includes(q) ||
        item.sku.toLowerCase().includes(q),
    );
  }, [searchQuery, scopedInventory]);

  /* Summary stats (scoped to active godown) */
  const totalValue = scopedInventory.reduce((s, i) => s + i.value, 0);
  const inStockCount = scopedInventory.filter((i) => i.status === "ok").length;
  const attentionCount = scopedInventory.filter((i) => i.status !== "ok").length;

  // Current month (April 2026 in the demo) from STOCK_SNAPSHOTS
  const currentSnapshot = STOCK_SNAPSHOTS[STOCK_SNAPSHOTS.length - 1];
  // For the closing-stock KPI: show last LOCKED month (Mar 2026) since April isn't closed
  const lastLockedSnapshot = [...STOCK_SNAPSHOTS].reverse().find((s) => s.status === "locked") ?? currentSnapshot;

  // Active godown meta (for stale banner + tab subheader)
  const activeGodownObj = activeGodown === "all" ? null : GODOWNS.find((g) => g.id === activeGodown);
  const staleDays = activeGodownObj ? daysSinceCount(activeGodownObj) : 0;
  const isStale = activeGodownObj && staleDays >= 30;

  const handleReconConfirm = (summary: { majorCount: number; bulkCount: number }) => {
    setJustReconciled({ major: summary.majorCount, bulk: summary.bulkCount });
    // Navigate to Entries queue (reuses the riko:navigate pattern used
    // across Day Book, Bank Recon, and Chat cross-tab handoffs)
    window.dispatchEvent(new CustomEvent("riko:navigate", { detail: "entries" }));
  };

  return (
    <>
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.1 }}
      transition={{ duration: 0.4 }}
      className="px-4 py-4 max-w-5xl mx-auto w-full"
    >
      {/* Header row */}
      <div className="flex items-start justify-between gap-3 mb-4 flex-wrap">
        <div>
          <h2 className="text-lg font-bold" style={{ color: "var(--text-1)" }}>
            Inventory
          </h2>
          <p className="text-[11px] mt-0.5" style={{ color: "var(--text-4)" }}>
            As of 31 Mar 2026 · {lastLockedSnapshot.month} closing
          </p>
        </div>
        <button
          onClick={() => setReconOpen(true)}
          className="flex items-center gap-1.5 text-[11px] font-semibold px-3 py-2 rounded-lg cursor-pointer"
          style={{
            background: "var(--green)",
            color: "#fff",
          }}
          title="Upload physical count sheet → draft Stock Journal entries"
        >
          <Upload size={12} />
          Reconcile physical stock
        </button>
      </div>

      {/* Godown pills — reuses the Bank-Recon multi-account tab pattern */}
      <div className="flex items-center gap-1.5 mb-4 flex-wrap">
        <GodownPill
          id="all"
          label="All godowns"
          sub={`${INVENTORY.length} SKUs`}
          active={activeGodown === "all"}
          onClick={() => setActiveGodown("all")}
        />
        {GODOWNS.map((g) => {
          const count = INVENTORY.filter((i) => i.godownId === g.id).length;
          const days = daysSinceCount(g);
          return (
            <GodownPill
              key={g.id}
              id={g.id}
              label={g.name}
              sub={`${count} SKUs · last counted ${days}d ago`}
              active={activeGodown === g.id}
              onClick={() => setActiveGodown(g.id)}
              dotColor={staleColor(days)}
            />
          );
        })}
      </div>

      {/* Just-reconciled success banner (demo theatrics) */}
      <AnimatePresence>
        {justReconciled && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            className="mb-4 rounded-lg p-3 flex items-start gap-3"
            style={{
              background: "color-mix(in srgb, var(--green) 10%, transparent)",
              border: "1px solid color-mix(in srgb, var(--green) 30%, transparent)",
            }}
          >
            <div className="w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0" style={{ background: "var(--green)" }}>
              <span className="text-white text-[10px] font-bold">✓</span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[12px] font-semibold" style={{ color: "var(--text-1)" }}>
                Reconciliation complete · {justReconciled.major + justReconciled.bulk} Stock Journal{justReconciled.major + justReconciled.bulk !== 1 ? "s" : ""} drafted
              </p>
              <p className="text-[10.5px] mt-0.5" style={{ color: "var(--text-3)" }}>
                {justReconciled.major > 0 && (
                  <>
                    <strong>{justReconciled.major}</strong> major variance journal{justReconciled.major !== 1 ? "s" : ""} routed to Accounts Head.{" "}
                  </>
                )}
                {justReconciled.bulk > 0 && (
                  <>
                    <strong>{justReconciled.bulk}</strong> bulk journal routed to Accounts. Review in Entries queue.
                  </>
                )}
              </p>
            </div>
            <button onClick={() => setJustReconciled(null)} className="p-1 cursor-pointer" style={{ color: "var(--text-4)" }} aria-label="Dismiss">
              <span className="text-lg leading-none">×</span>
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Stale-count banner — only if active godown's last count > 30 days */}
      {isStale && activeGodownObj && (
        <div
          className="mb-4 rounded-lg p-3 flex items-start gap-3"
          style={{
            background: "color-mix(in srgb, var(--yellow) 10%, transparent)",
            border: "1px solid color-mix(in srgb, var(--yellow) 30%, transparent)",
          }}
        >
          <AlertTriangle size={14} style={{ color: "var(--yellow)", flexShrink: 0, marginTop: 2 }} />
          <div className="flex-1 min-w-0">
            <p className="text-[12px] font-semibold" style={{ color: "var(--text-1)" }}>
              Last physical count {staleDays} days ago in {activeGodownObj.name}
            </p>
            <p className="text-[10.5px] mt-0.5" style={{ color: "var(--text-3)" }}>
              Closing stock may have drifted from Tally. Reconcile to fix this month&apos;s P&amp;L impact.
            </p>
          </div>
          <button
            onClick={() => setReconOpen(true)}
            className="flex items-center gap-1 text-[11px] font-semibold px-2.5 py-1.5 rounded-md cursor-pointer flex-shrink-0"
            style={{ background: "var(--yellow)", color: "#1F1F1F" }}
          >
            Reconcile <ArrowRight size={11} />
          </button>
        </div>
      )}

      {/* Summary cards — 4 cards now (was 3) */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-5">
        <KpiCard label="Current Value" value={`₹${fL(totalValue)}L`} color="var(--green)" />
        <KpiCard label="In Stock" value={String(inStockCount)} color="var(--blue)" />
        <KpiCard label="Need Attention" value={String(attentionCount)} color="var(--red)" />
        <KpiCard
          label={`Closing Stock (${lastLockedSnapshot.month})`}
          value={`₹${fL(lastLockedSnapshot.closingValue)}L`}
          color="var(--purple)"
          chip={
            <span
              className="inline-flex items-center gap-1 text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded mt-1"
              style={{
                background: "color-mix(in srgb, var(--blue) 14%, transparent)",
                color: "var(--blue)",
              }}
              title={TALLY_VALUATION.description}
            >
              <Info size={9} />
              {TALLY_VALUATION.method} · from Tally
            </span>
          }
        />
      </div>

      {/* Month-end snapshot strip — 4 months, last 3 locked, current open */}
      <div className="mb-5">
        <p className="text-[10px] uppercase tracking-wider font-semibold mb-2" style={{ color: "var(--text-4)" }}>
          Monthly stock snapshots
        </p>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
          {STOCK_SNAPSHOTS.map((s) => (
            <SnapshotCard key={s.monthIso} snapshot={s} />
          ))}
        </div>
      </div>

      {/* Search + filter bar */}
      <div className="flex gap-2 mb-4">
        <div
          className="flex items-center gap-2 rounded-lg px-3 py-2 flex-1"
          style={{ background: "var(--bg-surface)", border: "1px solid var(--border)" }}
        >
          <Search size={14} style={{ color: "var(--text-4)" }} />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search products or SKU..."
            className="bg-transparent text-xs outline-none flex-1"
            style={{ color: "var(--text-1)" }}
          />
        </div>
        <button
          className="flex items-center gap-1.5 text-xs px-3 py-2 rounded-lg cursor-pointer"
          style={{
            background: "var(--bg-surface)",
            border: "1px solid var(--border)",
            color: "var(--text-3)",
          }}
        >
          <Filter size={14} />
          Filter
        </button>
      </div>

      {/* ── Desktop table ── */}
      <div
        className="hidden sm:block rounded-xl overflow-hidden"
        style={{ border: "1px solid var(--border)" }}
      >
        <table className="w-full text-xs">
          <thead>
            <tr style={{ background: "var(--bg-surface)" }}>
              {["Product", "SKU", "Godown", "Qty", "Value", "Reorder", "Variance", "Status"].map((h) => (
                <th
                  key={h}
                  className={`px-3 py-2.5 font-semibold ${["Qty", "Value"].includes(h) ? "text-right" : ["Variance", "Status"].includes(h) ? "text-center" : "text-left"}`}
                  style={{ color: "var(--text-4)", borderBottom: "1px solid var(--border)" }}
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.map((item, idx) => {
              const st = STATUS_CFG[item.status] || STATUS_CFG.ok;
              return (
                <tr
                  key={item.sku}
                  style={{
                    background: idx % 2 === 0 ? "transparent" : "color-mix(in srgb, var(--bg-surface) 40%, transparent)",
                    borderTop: "1px solid var(--border)",
                  }}
                >
                  <td className="px-3 py-2.5" style={{ color: "var(--text-1)" }}>
                    {item.name}
                  </td>
                  <td className="px-3 py-2.5" style={{ color: "var(--text-3)" }}>
                    {item.sku}
                  </td>
                  <td className="px-3 py-2.5 text-[10px]" style={{ color: "var(--text-4)" }}>
                    {GODOWNS.find((g) => g.id === item.godownId)?.name.replace(" WH", "") ?? "—"}
                  </td>
                  <td className="px-3 py-2.5 text-right tabular-nums" style={{ color: "var(--text-1)" }}>
                    {item.qty.toLocaleString("en-IN")}
                  </td>
                  <td className="px-3 py-2.5 text-right tabular-nums" style={{ color: "var(--text-1)" }}>
                    {item.value > 0 ? fmtAmt(item.value) : "\u2014"}
                  </td>
                  <td className="px-3 py-2.5">
                    {item.reorder > 0 ? (
                      <div className="flex items-center gap-2">
                        <div
                          className="flex-1 h-1.5 rounded-full overflow-hidden min-w-[40px]"
                          style={{ background: "var(--bg-hover)" }}
                        >
                          <div
                            className="h-full rounded-full"
                            style={{
                              width: `${item.reorder}%`,
                              background: st.color,
                            }}
                          />
                        </div>
                        <span className="text-[10px] tabular-nums w-7 text-right" style={{ color: "var(--text-4)" }}>
                          {item.reorder}%
                        </span>
                      </div>
                    ) : (
                      <span style={{ color: "var(--text-4)" }}>{"\u2014"}</span>
                    )}
                  </td>
                  <td className="px-3 py-2.5 text-center">
                    <VarianceCell item={item} />
                  </td>
                  <td className="px-3 py-2.5">
                    <div className="flex items-center gap-1.5">
                      <span
                        className="w-1.5 h-1.5 rounded-full flex-shrink-0"
                        style={{ background: st.color }}
                      />
                      <Pill color={st.color}>{st.label}</Pill>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* ── Mobile cards ── */}
      <div className="sm:hidden space-y-2">
        {filtered.map((item, idx) => {
          const st = STATUS_CFG[item.status] || STATUS_CFG.ok;
          return (
            <motion.div
              key={item.sku}
              initial={{ opacity: 0, y: 8 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.3, delay: idx * 0.03 }}
              className="rounded-xl p-3"
              style={{ background: "var(--bg-surface)", border: "1px solid var(--border)" }}
            >
              <div className="flex items-start justify-between mb-2">
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium truncate" style={{ color: "var(--text-1)" }}>
                    {item.name}
                  </p>
                  <p className="text-[10px]" style={{ color: "var(--text-4)" }}>
                    {item.sku}
                  </p>
                </div>
                <div className="flex items-center gap-1.5 flex-shrink-0">
                  <span
                    className="w-1.5 h-1.5 rounded-full"
                    style={{ background: st.color }}
                  />
                  <Pill color={st.color}>{st.label}</Pill>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2 text-[10px]">
                <div>
                  <p style={{ color: "var(--text-4)" }}>Qty</p>
                  <p className="font-semibold" style={{ color: "var(--text-1)" }}>
                    {item.qty.toLocaleString("en-IN")}
                  </p>
                </div>
                <div>
                  <p style={{ color: "var(--text-4)" }}>Value</p>
                  <p className="font-semibold" style={{ color: "var(--text-1)" }}>
                    {item.value > 0 ? fmtAmt(item.value) : "\u2014"}
                  </p>
                </div>
                <div>
                  <p style={{ color: "var(--text-4)" }}>Reorder</p>
                  {item.reorder > 0 ? (
                    <div className="flex items-center gap-1 mt-0.5">
                      <div className="flex-1 h-1.5 rounded-full overflow-hidden" style={{ background: "var(--bg-hover)" }}>
                        <div
                          className="h-full rounded-full"
                          style={{ width: `${item.reorder}%`, background: st.color }}
                        />
                      </div>
                      <span className="text-[9px] tabular-nums" style={{ color: "var(--text-4)" }}>
                        {item.reorder}%
                      </span>
                    </div>
                  ) : (
                    <p className="font-semibold" style={{ color: "var(--text-4)" }}>{"\u2014"}</p>
                  )}
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* ============================================================ */}
      {/*  DEAD STOCK ANALYSIS (item 4)                                */}
      {/* ============================================================ */}
      <div className="mt-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.1 }}
          transition={{ duration: 0.4 }}
          className="rounded-xl p-4 mb-4"
          style={{
            background: "color-mix(in srgb, var(--yellow) 8%, var(--bg-surface))",
            border: "1px solid color-mix(in srgb, var(--yellow) 25%, transparent)",
          }}
        >
          <div className="flex items-start gap-3">
            <span
              className="w-8 h-8 rounded-lg flex items-center justify-center text-base flex-shrink-0"
              style={{
                background: "color-mix(in srgb, var(--yellow) 18%, transparent)",
              }}
            >
              ⚠️
            </span>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold mb-0.5" style={{ color: "var(--text-1)" }}>
                Dead Stock Analysis
              </p>
              <p className="text-xs" style={{ color: "var(--text-2)" }}>
                <span
                  className="font-semibold"
                  style={{ fontFamily: "'Space Grotesk', sans-serif" }}
                >
                  {DEAD_STOCK_SUMMARY.totalSkus} SKUs
                </span>
                {" · "}
                <span
                  className="font-semibold tabular-nums"
                  style={{ color: "var(--yellow)", fontFamily: "'Space Grotesk', sans-serif" }}
                >
                  {formatINR(DEAD_STOCK_SUMMARY.totalValue)}
                </span>
                {" tied up ("}
                <span className="font-semibold">{DEAD_STOCK_SUMMARY.pctOfInventory}%</span>
                {" of inventory value)"}
              </p>
            </div>
          </div>
        </motion.div>

        {/* Category cards — 3 cols desktop, 1 col mobile */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-5">
          {DEAD_STOCK_SUMMARY.categoryBreakdown.map((cat, i) => {
            const col = DEAD_STOCK_CAT_COLOR[cat.category] || "var(--text-3)";
            return (
              <motion.div
                key={cat.category}
                initial={{ opacity: 0, y: 12 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.35, delay: i * 0.06 }}
                className="rounded-xl overflow-hidden"
                style={{ background: "var(--bg-surface)", border: "1px solid var(--border)" }}
              >
                <div className="h-0.5" style={{ background: col }} />
                <div className="p-3">
                  <p
                    className="text-[10px] uppercase tracking-wider font-medium mb-1"
                    style={{ color: "var(--text-4)" }}
                  >
                    {cat.category}
                  </p>
                  <div className="flex items-baseline gap-2">
                    <span
                      className="text-xl font-bold tabular-nums"
                      style={{ color: "var(--text-1)", fontFamily: "'Space Grotesk', sans-serif" }}
                    >
                      {cat.count}
                    </span>
                    <span className="text-[10px]" style={{ color: "var(--text-4)" }}>
                      SKUs
                    </span>
                  </div>
                  <p
                    className="text-sm font-semibold tabular-nums mt-0.5"
                    style={{ color: col, fontFamily: "'Space Grotesk', sans-serif" }}
                  >
                    {formatINR(cat.value)}
                  </p>
                </div>
              </motion.div>
            );
          })}
        </div>

        {/* Dead stock table */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.1 }}
          transition={{ duration: 0.35, delay: 0.1 }}
          className="rounded-xl overflow-hidden mb-4"
          style={{ background: "var(--bg-surface)", border: "1px solid var(--border)" }}
        >
          {/* Desktop table */}
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr style={{ background: "var(--bg-secondary)" }}>
                  <th
                    className="px-3 py-2.5 text-left font-medium text-[10px]"
                    style={{ color: "var(--text-4)" }}
                  >
                    SKU
                  </th>
                  <th
                    className="px-3 py-2.5 text-left font-medium text-[10px]"
                    style={{ color: "var(--text-4)" }}
                  >
                    Product
                  </th>
                  <th
                    className="px-3 py-2.5 text-right font-medium text-[10px]"
                    style={{ color: "var(--text-4)" }}
                  >
                    Qty
                  </th>
                  <th
                    className="px-3 py-2.5 text-right font-medium text-[10px]"
                    style={{ color: "var(--text-4)" }}
                  >
                    Value
                  </th>
                  <th
                    className="px-3 py-2.5 text-left font-medium text-[10px]"
                    style={{ color: "var(--text-4)" }}
                  >
                    Last Sold
                  </th>
                  <th
                    className="px-3 py-2.5 text-center font-medium text-[10px]"
                    style={{ color: "var(--text-4)" }}
                  >
                    Category
                  </th>
                  <th
                    className="px-3 py-2.5 text-left font-medium text-[10px]"
                    style={{ color: "var(--text-4)" }}
                  >
                    Recommendation
                  </th>
                </tr>
              </thead>
              <tbody>
                {DEAD_STOCK.map((item, idx) => {
                  const col = DEAD_STOCK_CAT_COLOR[item.category] || "var(--text-3)";
                  return (
                    <motion.tr
                      key={item.sku}
                      initial={{ opacity: 0, y: 6 }}
                      whileInView={{ opacity: 1, y: 0 }}
                      viewport={{ once: true, amount: 0.1 }}
                      transition={{ duration: 0.25, delay: idx * 0.04 }}
                      style={{
                        borderTop: "1px solid var(--border)",
                        background:
                          idx % 2 === 0
                            ? "transparent"
                            : "color-mix(in srgb, var(--bg-secondary) 50%, transparent)",
                      }}
                    >
                      <td className="px-3 py-2.5 font-mono text-[10px]" style={{ color: "var(--text-4)" }}>
                        {item.sku}
                      </td>
                      <td className="px-3 py-2.5 truncate max-w-[220px]" style={{ color: "var(--text-1)" }}>
                        {item.name}
                      </td>
                      <td
                        className="px-3 py-2.5 text-right tabular-nums"
                        style={{ color: "var(--text-2)", fontFamily: "'Space Grotesk', sans-serif" }}
                      >
                        {item.qty.toLocaleString("en-IN")}
                      </td>
                      <td
                        className="px-3 py-2.5 text-right tabular-nums font-bold"
                        style={{ color: "var(--text-1)", fontFamily: "'Space Grotesk', sans-serif" }}
                      >
                        {formatINR(item.value)}
                      </td>
                      <td className="px-3 py-2.5 text-[10px]" style={{ color: "var(--text-4)" }}>
                        {item.lastSold}
                      </td>
                      <td className="px-3 py-2.5 text-center">
                        <Pill color={col}>{item.category}</Pill>
                      </td>
                      <td className="px-3 py-2.5 text-[11px]" style={{ color: "var(--text-3)" }}>
                        {item.recommendation}
                      </td>
                    </motion.tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Mobile cards */}
          <div className="md:hidden flex flex-col">
            {DEAD_STOCK.map((item, idx) => {
              const col = DEAD_STOCK_CAT_COLOR[item.category] || "var(--text-3)";
              return (
                <motion.div
                  key={item.sku}
                  initial={{ opacity: 0, y: 8 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.3, delay: idx * 0.04 }}
                  className="p-3"
                  style={{
                    borderBottom: idx === DEAD_STOCK.length - 1 ? "none" : "1px solid var(--border)",
                  }}
                >
                  <div className="flex items-start justify-between gap-2 mb-1.5">
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium truncate" style={{ color: "var(--text-1)" }}>
                        {item.name}
                      </p>
                      <p className="text-[10px] font-mono" style={{ color: "var(--text-4)" }}>
                        {item.sku}
                      </p>
                    </div>
                    <Pill color={col}>{item.category}</Pill>
                  </div>

                  <div className="grid grid-cols-3 gap-2 text-[10px] mb-2">
                    <div>
                      <p style={{ color: "var(--text-4)" }}>Qty</p>
                      <p
                        className="font-semibold tabular-nums"
                        style={{ color: "var(--text-2)", fontFamily: "'Space Grotesk', sans-serif" }}
                      >
                        {item.qty.toLocaleString("en-IN")}
                      </p>
                    </div>
                    <div>
                      <p style={{ color: "var(--text-4)" }}>Value</p>
                      <p
                        className="font-bold tabular-nums"
                        style={{ color: "var(--text-1)", fontFamily: "'Space Grotesk', sans-serif" }}
                      >
                        {formatINR(item.value)}
                      </p>
                    </div>
                    <div>
                      <p style={{ color: "var(--text-4)" }}>Last Sold</p>
                      <p className="font-semibold" style={{ color: "var(--text-2)" }}>
                        {item.lastSold}
                      </p>
                    </div>
                  </div>

                  <p className="text-[10px]" style={{ color: "var(--text-3)" }}>
                    <span style={{ color: "var(--text-4)" }}>Recommendation: </span>
                    {item.recommendation}
                  </p>
                </motion.div>
              );
            })}
          </div>
        </motion.div>

        {/* Action row */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.35, delay: 0.15 }}
          className="flex flex-col sm:flex-row gap-2 mb-4"
        >
          <button
            className="flex-1 text-xs font-semibold px-4 py-2.5 rounded-lg cursor-pointer transition-colors"
            style={{
              color: "white",
              background: "var(--green)",
            }}
          >
            💸 Generate liquidation plan
          </button>
          <button
            className="flex-1 text-xs font-semibold px-4 py-2.5 rounded-lg cursor-pointer transition-colors"
            style={{
              color: "var(--green)",
              background: "transparent",
              border: "1px solid var(--green)",
            }}
          >
            📦 Return to suppliers
          </button>
        </motion.div>

        {/* Closing insight */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.2 }}
          transition={{ duration: 0.35, delay: 0.2 }}
          className="rounded-xl px-4 py-3 text-xs leading-relaxed"
          style={{
            background: "color-mix(in srgb, var(--green) 10%, transparent)",
            border: "1px solid color-mix(in srgb, var(--green) 25%, transparent)",
            color: "var(--green)",
          }}
        >
          <span className="font-bold">💡 Opportunity:</span>{" "}
          <span style={{ color: "var(--text-2)" }}>
            Clearing 50% of dead stock = <span className="font-semibold" style={{ color: "var(--green)" }}>+{"\u20B9"}{fL(DEAD_STOCK_SUMMARY.totalValue / 2)}L</span>{" "}
            cash back in 60 days. Run a monsoon sale.
          </span>
        </motion.div>
      </div>
    </motion.div>

    {/* Physical Stock Reconciliation modal */}
    <PhysicalStockModal
      open={reconOpen}
      onClose={() => setReconOpen(false)}
      godownId={activeGodown === "all" ? "bhiwandi" : activeGodown}
      onConfirm={handleReconConfirm}
    />
    </>
  );
}

/* ══════════════════════════════════════════════════════════════════
   KpiCard — 4-card top row; supports optional chip underneath value
   ══════════════════════════════════════════════════════════════════ */
function KpiCard({
  label,
  value,
  color,
  chip,
}: {
  label: string;
  value: string;
  color: string;
  chip?: React.ReactNode;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.35 }}
      className="rounded-xl overflow-hidden"
      style={{ background: "var(--bg-surface)", border: "1px solid var(--border)" }}
    >
      <div className="h-0.5" style={{ background: color }} />
      <div className="p-3">
        <p
          className="text-[10px] uppercase tracking-wider font-medium mb-1"
          style={{ color: "var(--text-4)" }}
        >
          {label}
        </p>
        <p
          className="text-xl font-bold tabular-nums"
          style={{ color: "var(--text-1)", fontFamily: "'Space Grotesk', sans-serif" }}
        >
          {value}
        </p>
        {chip}
      </div>
    </motion.div>
  );
}

/* ══════════════════════════════════════════════════════════════════
   GodownPill — reuses Bank-Recon's multi-account tab pattern
   ══════════════════════════════════════════════════════════════════ */
function GodownPill({
  id,
  label,
  sub,
  active,
  onClick,
  dotColor,
}: {
  id: string;
  label: string;
  sub: string;
  active: boolean;
  onClick: () => void;
  dotColor?: string;
}) {
  void id;
  return (
    <button
      onClick={onClick}
      className="flex items-center gap-2 text-[11px] font-semibold px-3 py-1.5 rounded-full cursor-pointer transition-colors"
      style={{
        background: active ? "color-mix(in srgb, var(--green) 15%, transparent)" : "var(--bg-surface)",
        color: active ? "var(--green)" : "var(--text-3)",
        border: `1px solid ${active ? "color-mix(in srgb, var(--green) 35%, transparent)" : "var(--border)"}`,
      }}
    >
      {dotColor && (
        <span
          className="w-2 h-2 rounded-full flex-shrink-0"
          style={{
            background: dotColor,
            boxShadow: `0 0 0 3px color-mix(in srgb, ${dotColor} 20%, transparent)`,
          }}
          aria-hidden
        />
      )}
      <span>{label}</span>
      <span className="hidden md:inline text-[9px] font-medium" style={{ color: active ? "var(--green)" : "var(--text-4)", opacity: 0.8 }}>
        · {sub}
      </span>
    </button>
  );
}

/* ══════════════════════════════════════════════════════════════════
   SnapshotCard — month-end opening/closing/COGS per snapshot
   ══════════════════════════════════════════════════════════════════ */
function SnapshotCard({ snapshot }: { snapshot: typeof STOCK_SNAPSHOTS[number] }) {
  const isLocked = snapshot.status === "locked";
  const isCurrent = snapshot.status === "open";
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.3 }}
      className="rounded-xl p-3"
      style={{
        background: isCurrent ? "color-mix(in srgb, var(--green) 6%, var(--bg-surface))" : "var(--bg-surface)",
        border: isCurrent
          ? "1px solid color-mix(in srgb, var(--green) 30%, transparent)"
          : "1px solid var(--border)",
      }}
    >
      <div className="flex items-center justify-between mb-1.5">
        <span className="text-[10px] font-bold uppercase tracking-wider" style={{ color: isCurrent ? "var(--green)" : "var(--text-3)" }}>
          {snapshot.month}
        </span>
        {isLocked ? (
          <span className="inline-flex items-center gap-0.5 text-[9px] font-semibold" style={{ color: "var(--text-4)" }} title="Month closed">
            <Lock size={8} />
            Locked
          </span>
        ) : (
          <span className="text-[9px] font-bold uppercase" style={{ color: "var(--green)" }}>
            Open
          </span>
        )}
      </div>
      <div className="grid grid-cols-3 gap-1.5 text-center">
        <div>
          <p className="text-[9px]" style={{ color: "var(--text-4)" }}>
            Opening
          </p>
          <p className="text-[11px] font-semibold tabular-nums" style={{ color: "var(--text-2)", fontFamily: "'Space Grotesk', sans-serif" }}>
            ₹{fL(snapshot.openingValue)}L
          </p>
        </div>
        <div style={{ borderLeft: "1px solid var(--border)", borderRight: "1px solid var(--border)" }}>
          <p className="text-[9px]" style={{ color: "var(--text-4)" }}>
            Closing
          </p>
          <p className="text-[11px] font-bold tabular-nums" style={{ color: "var(--text-1)", fontFamily: "'Space Grotesk', sans-serif" }}>
            ₹{fL(snapshot.closingValue)}L
          </p>
        </div>
        <div>
          <p className="text-[9px]" style={{ color: "var(--text-4)" }}>
            COGS
          </p>
          <p className="text-[11px] font-semibold tabular-nums" style={{ color: "var(--orange)", fontFamily: "'Space Grotesk', sans-serif" }}>
            ₹{fL(snapshot.cogs)}L
          </p>
        </div>
      </div>
      {isCurrent && (
        <p className="text-[9px] mt-1.5 text-center" style={{ color: "var(--text-4)" }}>
          Running · finalize via reconcile
        </p>
      )}
    </motion.div>
  );
}

/* ══════════════════════════════════════════════════════════════════
   VarianceCell — per-row badge: green ✓ matched, yellow ⚠, grey —
   Shows the last physical count outcome from data.ts INVENTORY row.
   ══════════════════════════════════════════════════════════════════ */
function VarianceCell({ item }: { item: typeof INVENTORY[number] }) {
  // Never counted
  if (item.physicalQty === undefined || item.varianceQty === undefined) {
    return (
      <span className="text-[10px]" style={{ color: "var(--text-4)" }} title="Never physically counted">
        —
      </span>
    );
  }
  // Matched (within 2%)
  if (Math.abs(item.variancePct ?? 0) < 0.02) {
    return (
      <span
        className="inline-flex items-center gap-0.5 text-[10px] font-bold px-1.5 py-0.5 rounded"
        style={{
          background: "color-mix(in srgb, var(--green) 14%, transparent)",
          color: "var(--green)",
        }}
        title={`Matched on ${item.physicalCountDate}`}
      >
        ✓
      </span>
    );
  }
  // Variance exists
  const negative = (item.varianceQty ?? 0) < 0;
  return (
    <span
      className="inline-flex items-center gap-0.5 text-[10px] font-bold tabular-nums px-1.5 py-0.5 rounded"
      style={{
        background: `color-mix(in srgb, ${negative ? "var(--red)" : "var(--blue)"} 14%, transparent)`,
        color: negative ? "var(--red)" : "var(--blue)",
      }}
      title={`${(item.variancePct ?? 0) > 0 ? "+" : ""}${((item.variancePct ?? 0) * 100).toFixed(1)}% · counted ${item.physicalCountDate}`}
    >
      {item.varianceQty! > 0 ? "+" : ""}{item.varianceQty}
    </span>
  );
}
