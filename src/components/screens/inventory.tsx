"use client";

import { useState, useMemo } from "react";
import { motion } from "framer-motion";
import { Search, Filter } from "lucide-react";
import { INVENTORY, DEAD_STOCK, DEAD_STOCK_SUMMARY, fL, formatINR } from "@/lib/data";
import { Pill } from "@/components/ui/pill";

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

export function InventoryScreen() {
  const [searchQuery, setSearchQuery] = useState("");

  const filtered = useMemo(() => {
    if (!searchQuery.trim()) return INVENTORY;
    const q = searchQuery.toLowerCase();
    return INVENTORY.filter(
      (item) =>
        item.name.toLowerCase().includes(q) ||
        item.sku.toLowerCase().includes(q),
    );
  }, [searchQuery]);

  /* Summary stats */
  const totalValue = INVENTORY.reduce((s, i) => s + i.value, 0);
  const inStockCount = INVENTORY.filter((i) => i.status === "ok").length;
  const attentionCount = INVENTORY.filter((i) => i.status !== "ok").length;

  const summaryCards = [
    { label: "Current Value", value: `\u20B9${fL(totalValue)}L`, color: "var(--green)" },
    { label: "In Stock", value: String(inStockCount), color: "var(--blue)" },
    { label: "Need Attention", value: String(attentionCount), color: "var(--red)" },
  ];

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
        Inventory
      </h2>

      {/* Summary cards */}
      <div className="grid grid-cols-3 gap-3 mb-5">
        {summaryCards.map((c, i) => (
          <motion.div
            key={c.label}
            initial={{ opacity: 0, y: 12 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.35, delay: i * 0.06 }}
            className="rounded-xl overflow-hidden"
            style={{ background: "var(--bg-surface)", border: "1px solid var(--border)" }}
          >
            <div className="h-0.5" style={{ background: c.color }} />
            <div className="p-3">
              <p
                className="text-[10px] uppercase tracking-wider font-medium mb-1"
                style={{ color: "var(--text-4)" }}
              >
                {c.label}
              </p>
              <p
                className="text-xl font-bold"
                style={{ color: "var(--text-1)", fontFamily: "'Space Grotesk', sans-serif" }}
              >
                {c.value}
              </p>
            </div>
          </motion.div>
        ))}
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
              {["Product", "SKU", "Qty", "Value", "Reorder Level", "Status"].map((h) => (
                <th
                  key={h}
                  className={`px-4 py-2.5 font-semibold ${["Qty", "Value"].includes(h) ? "text-right" : "text-left"}`}
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
                  <td className="px-4 py-2.5" style={{ color: "var(--text-1)" }}>
                    {item.name}
                  </td>
                  <td className="px-4 py-2.5" style={{ color: "var(--text-3)" }}>
                    {item.sku}
                  </td>
                  <td className="px-4 py-2.5 text-right tabular-nums" style={{ color: "var(--text-1)" }}>
                    {item.qty.toLocaleString("en-IN")}
                  </td>
                  <td className="px-4 py-2.5 text-right tabular-nums" style={{ color: "var(--text-1)" }}>
                    {item.value > 0 ? fmtAmt(item.value) : "\u2014"}
                  </td>
                  <td className="px-4 py-2.5">
                    {item.reorder > 0 ? (
                      <div className="flex items-center gap-2">
                        <div
                          className="flex-1 h-1.5 rounded-full overflow-hidden"
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
                  <td className="px-4 py-2.5">
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
  );
}
