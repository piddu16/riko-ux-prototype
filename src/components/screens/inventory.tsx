"use client";

import { useState, useMemo } from "react";
import { motion } from "framer-motion";
import { Search, Filter } from "lucide-react";
import { INVENTORY, fL } from "@/lib/data";
import { Pill } from "@/components/ui/pill";

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
    </motion.div>
  );
}
