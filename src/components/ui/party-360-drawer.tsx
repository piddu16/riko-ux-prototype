"use client";

import { useState, useMemo, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  X,
  Phone,
  Mail,
  MessageCircle,
  TrendingUp,
  Clock,
  CalendarDays,
  Activity,
  ReceiptText,
  ShieldCheck,
} from "lucide-react";
import { DAYBOOK, RECEIVABLES } from "@/lib/data";

const WA_GREEN = "#25D366";

interface Party360DrawerProps {
  open: boolean;
  onClose: () => void;
  partyName: string;
}

type Tab = "overview" | "transactions" | "history";

function formatINR(v: number): string {
  const abs = Math.abs(v);
  const sign = v < 0 ? "-" : "";
  if (abs < 1e5) {
    return `${sign}\u20B9${abs.toLocaleString("en-IN", { maximumFractionDigits: 0 })}`;
  }
  if (abs < 1e7) return `${sign}\u20B9${(abs / 1e5).toFixed(1)}L`;
  return `${sign}\u20B9${(abs / 1e7).toFixed(2)}Cr`;
}

export function Party360Drawer({ open, onClose, partyName }: Party360DrawerProps) {
  const [tab, setTab] = useState<Tab>("overview");

  /* Reset tab when drawer closes */
  useEffect(() => {
    if (!open) {
      const id = setTimeout(() => setTab("overview"), 250);
      return () => clearTimeout(id);
    }
  }, [open]);

  /* Derive party data */
  const receivableRow = useMemo(
    () =>
      RECEIVABLES.find((r) =>
        r.name.toLowerCase().includes(partyName.toLowerCase()) ||
        partyName.toLowerCase().includes(r.name.toLowerCase())
      ),
    [partyName]
  );

  const partyTransactions = useMemo(() => {
    if (!partyName) return [];
    const matches = DAYBOOK.filter((e) =>
      e.name.toLowerCase().includes(partyName.toLowerCase())
    );
    if (matches.length >= 3) return matches.slice(0, 10);
    /* Fallback: synthesize mock rows so the drawer always looks filled */
    const mock = [
      { date: "12 Apr 2026", invoice: 9912, type: "Sales", name: partyName, amount: 184500 },
      { date: "04 Apr 2026", invoice: 9878, type: "Receipt", name: partyName, amount: 125000 },
      { date: "28 Mar 2026", invoice: 9844, type: "Sales", name: partyName, amount: 98400 },
      { date: "21 Mar 2026", invoice: 9812, type: "Sales", name: partyName, amount: 145600 },
      { date: "14 Mar 2026", invoice: 9798, type: "Receipt", name: partyName, amount: 85200 },
      { date: "07 Mar 2026", invoice: 9761, type: "Sales", name: partyName, amount: 132400 },
    ];
    return [...matches, ...mock].slice(0, 10);
  }, [partyName]);

  const totalRevenue = useMemo(
    () =>
      partyTransactions
        .filter((t) => t.type === "Sales")
        .reduce((s, t) => s + t.amount, 0),
    [partyTransactions]
  );

  const outstanding = receivableRow?.amount ?? 0;
  const avgDaysToPay = receivableRow ? Math.min(Math.max(Math.round(receivableRow.days / 10), 18), 72) : 42;
  const lastTransaction = partyTransactions[0]?.date ?? "—";
  const onTimePct = receivableRow && receivableRow.days > 365 ? 58 : 78;

  const TYPE_COLOR: Record<string, string> = {
    Sales: "var(--green)",
    Purchase: "var(--orange)",
    Receipt: "var(--blue)",
    Payment: "var(--red)",
    Journal: "var(--purple)",
  };

  return (
    <AnimatePresence>
      {open && (
        <>
          {/* Backdrop */}
          <motion.div
            key="party-backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={onClose}
            className="fixed inset-0 z-[65]"
            style={{ background: "rgba(0,0,0,0.5)", backdropFilter: "blur(2px)" }}
          />

          {/* Drawer */}
          <motion.aside
            key="party-drawer"
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", damping: 30, stiffness: 300 }}
            className="fixed top-0 right-0 bottom-0 z-[70] flex flex-col w-full md:w-[400px]"
            style={{
              background: "var(--bg-surface)",
              borderLeft: "1px solid var(--border)",
              boxShadow: "-8px 0 30px rgba(0,0,0,0.35)",
            }}
            role="dialog"
            aria-modal="true"
            aria-label={`${partyName} 360 view`}
          >
            {/* Header */}
            <div
              className="flex items-start justify-between gap-2 px-5 py-4"
              style={{ borderBottom: "1px solid var(--border)" }}
            >
              <div className="min-w-0">
                <p
                  className="text-[10px] uppercase tracking-wider font-semibold"
                  style={{ color: "var(--text-4)" }}
                >
                  Party 360
                </p>
                <h2
                  className="text-base font-bold leading-tight mt-0.5 truncate"
                  style={{
                    color: "var(--text-1)",
                    fontFamily: "'Space Grotesk', sans-serif",
                  }}
                >
                  {partyName || "\u2014"}
                </h2>
              </div>
              <button
                type="button"
                onClick={onClose}
                aria-label="Close"
                className="flex items-center justify-center rounded-md transition-colors cursor-pointer flex-shrink-0"
                style={{
                  width: 30,
                  height: 30,
                  color: "var(--text-3)",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = "var(--bg-hover)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = "transparent";
                }}
              >
                <X size={16} />
              </button>
            </div>

            {/* Tabs */}
            <div
              className="flex"
              style={{ borderBottom: "1px solid var(--border)" }}
            >
              {(
                [
                  { id: "overview", label: "Overview" },
                  { id: "transactions", label: "Transactions" },
                  { id: "history", label: "History" },
                ] as { id: Tab; label: string }[]
              ).map((t) => {
                const active = tab === t.id;
                return (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => setTab(t.id)}
                    className="flex-1 py-2.5 text-xs font-semibold cursor-pointer transition-colors relative"
                    style={{
                      color: active ? "var(--green)" : "var(--text-3)",
                      background: active
                        ? "color-mix(in srgb, var(--green) 8%, transparent)"
                        : "transparent",
                    }}
                  >
                    {t.label}
                    {active && (
                      <span
                        className="absolute left-0 right-0 bottom-0 h-[2px]"
                        style={{ background: "var(--green)" }}
                      />
                    )}
                  </button>
                );
              })}
            </div>

            {/* Body */}
            <div className="flex-1 overflow-y-auto">
              {tab === "overview" && (
                <div className="p-5 flex flex-col gap-4">
                  {/* Summary grid */}
                  <div className="grid grid-cols-2 gap-2">
                    <SummaryTile
                      icon={<TrendingUp size={13} />}
                      label="Total revenue"
                      value={formatINR(totalRevenue || 1240000)}
                      color="var(--green)"
                    />
                    <SummaryTile
                      icon={<ReceiptText size={13} />}
                      label="Outstanding"
                      value={outstanding ? formatINR(outstanding) : "\u20B90"}
                      color={outstanding > 0 ? "var(--red)" : "var(--green)"}
                    />
                    <SummaryTile
                      icon={<Clock size={13} />}
                      label="Avg days to pay"
                      value={`${avgDaysToPay}d`}
                      color="var(--yellow)"
                    />
                    <SummaryTile
                      icon={<CalendarDays size={13} />}
                      label="Last transaction"
                      value={lastTransaction}
                      color="var(--blue)"
                    />
                  </div>

                  {/* Contact */}
                  <div
                    className="rounded-xl p-4"
                    style={{
                      background: "var(--bg-secondary)",
                      border: "1px solid var(--border)",
                    }}
                  >
                    <p
                      className="text-[10px] uppercase tracking-wider font-semibold mb-2"
                      style={{ color: "var(--text-4)" }}
                    >
                      Contact
                    </p>
                    <div className="flex flex-col gap-2">
                      <div className="flex items-center gap-2 text-xs" style={{ color: "var(--text-2)" }}>
                        <Phone size={12} style={{ color: "var(--text-4)" }} />
                        +91 98765 43210
                      </div>
                      <div className="flex items-center gap-2 text-xs" style={{ color: "var(--text-2)" }}>
                        <Mail size={12} style={{ color: "var(--text-4)" }} />
                        accounts@{partyName.toLowerCase().replace(/[^a-z]/g, "").slice(0, 12) || "party"}.in
                      </div>
                      <button
                        type="button"
                        className="mt-2 inline-flex items-center justify-center gap-1.5 text-xs font-semibold px-3 py-2 rounded-md cursor-pointer transition-opacity hover:opacity-90 self-start"
                        style={{ background: WA_GREEN, color: "#fff" }}
                      >
                        <MessageCircle size={13} />
                        Send WhatsApp
                      </button>
                    </div>
                  </div>

                  {/* Credit rating */}
                  <div
                    className="rounded-xl p-4"
                    style={{
                      background: "var(--bg-secondary)",
                      border: "1px solid var(--border)",
                    }}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-1.5">
                        <ShieldCheck size={13} style={{ color: "var(--green)" }} />
                        <p
                          className="text-[10px] uppercase tracking-wider font-semibold"
                          style={{ color: "var(--text-4)" }}
                        >
                          Credit rating
                        </p>
                      </div>
                      <span
                        className="text-xs font-bold tabular-nums"
                        style={{ color: onTimePct > 70 ? "var(--green)" : "var(--yellow)" }}
                      >
                        {onTimePct}%
                      </span>
                    </div>
                    <p
                      className="text-xs mb-2"
                      style={{ color: "var(--text-2)" }}
                    >
                      Pays on time {onTimePct}% of the time
                    </p>
                    <div
                      className="h-2 rounded-full overflow-hidden"
                      style={{ background: "color-mix(in srgb, var(--text-3) 15%, transparent)" }}
                    >
                      <motion.div
                        initial={{ width: 0 }}
                        whileInView={{ width: `${onTimePct}%` }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.8, ease: "easeOut" }}
                        className="h-full rounded-full"
                        style={{
                          background: onTimePct > 70 ? "var(--green)" : "var(--yellow)",
                        }}
                      />
                    </div>
                  </div>
                </div>
              )}

              {tab === "transactions" && (
                <div className="p-5">
                  <p
                    className="text-[10px] uppercase tracking-wider font-semibold mb-3"
                    style={{ color: "var(--text-4)" }}
                  >
                    Last {partyTransactions.length} transactions
                  </p>
                  <div
                    className="rounded-xl overflow-hidden"
                    style={{ border: "1px solid var(--border)" }}
                  >
                    <table className="w-full text-xs">
                      <thead>
                        <tr
                          style={{
                            background: "var(--bg-secondary)",
                            borderBottom: "1px solid var(--border)",
                          }}
                        >
                          <th
                            className="px-3 py-2 text-left text-[10px] font-semibold uppercase tracking-wider"
                            style={{ color: "var(--text-4)" }}
                          >
                            Date
                          </th>
                          <th
                            className="px-3 py-2 text-left text-[10px] font-semibold uppercase tracking-wider"
                            style={{ color: "var(--text-4)" }}
                          >
                            Type
                          </th>
                          <th
                            className="px-3 py-2 text-right text-[10px] font-semibold uppercase tracking-wider"
                            style={{ color: "var(--text-4)" }}
                          >
                            Amount
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {partyTransactions.map((t, i) => (
                          <tr
                            key={`${t.invoice}-${i}`}
                            style={{
                              borderBottom:
                                i < partyTransactions.length - 1
                                  ? "1px solid var(--border)"
                                  : "none",
                            }}
                          >
                            <td
                              className="px-3 py-2 tabular-nums"
                              style={{ color: "var(--text-3)" }}
                            >
                              {t.date}
                            </td>
                            <td className="px-3 py-2">
                              <span
                                className="inline-flex items-center text-[10px] font-semibold px-1.5 py-0.5 rounded-full"
                                style={{
                                  background: `color-mix(in srgb, ${TYPE_COLOR[t.type] ?? "var(--text-3)"} 15%, transparent)`,
                                  color: TYPE_COLOR[t.type] ?? "var(--text-3)",
                                }}
                              >
                                {t.type}
                              </span>
                            </td>
                            <td
                              className="px-3 py-2 text-right font-bold tabular-nums"
                              style={{
                                color: "var(--text-1)",
                                fontFamily: "'Space Grotesk', sans-serif",
                              }}
                            >
                              {formatINR(t.amount)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {tab === "history" && (
                <div className="p-5 flex flex-col gap-4">
                  <div
                    className="rounded-xl p-4"
                    style={{
                      background: "var(--bg-secondary)",
                      border: "1px solid var(--border)",
                    }}
                  >
                    <p
                      className="text-[10px] uppercase tracking-wider font-semibold mb-2"
                      style={{ color: "var(--text-4)" }}
                    >
                      Relationship
                    </p>
                    <div className="flex flex-col gap-2">
                      <HistoryRow
                        label="Joined as customer"
                        value="Apr 2024"
                        icon={<CalendarDays size={12} />}
                      />
                      <HistoryRow
                        label="Customer for"
                        value="742 days"
                        icon={<Clock size={12} />}
                      />
                      <HistoryRow
                        label="Lifetime value"
                        value={formatINR(totalRevenue * 4 || 8920000)}
                        icon={<TrendingUp size={12} />}
                        highlight
                      />
                      <HistoryRow
                        label="Cohort"
                        value="FY24 Q1"
                        icon={<Activity size={12} />}
                      />
                    </div>
                  </div>

                  <div
                    className="rounded-xl p-4"
                    style={{
                      background: "color-mix(in srgb, var(--green) 6%, var(--bg-secondary))",
                      border: "1px solid color-mix(in srgb, var(--green) 25%, var(--border))",
                    }}
                  >
                    <p
                      className="text-[10px] uppercase tracking-wider font-semibold mb-1"
                      style={{ color: "var(--green)" }}
                    >
                      Milestones
                    </p>
                    <ul className="text-xs flex flex-col gap-1.5 mt-2" style={{ color: "var(--text-2)" }}>
                      <li>First invoice — 04 Apr 2024</li>
                      <li>Crossed {"\u20B9"}5L revenue — 22 Jun 2024</li>
                      <li>Crossed {"\u20B9"}25L revenue — 18 Nov 2024</li>
                      <li>Most recent invoice — {lastTransaction}</li>
                    </ul>
                  </div>
                </div>
              )}
            </div>
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  );
}

/* ------------------------------------------------------------------ */
function SummaryTile({
  icon,
  label,
  value,
  color,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  color: string;
}) {
  return (
    <div
      className="rounded-xl p-3"
      style={{
        background: "var(--bg-secondary)",
        border: "1px solid var(--border)",
      }}
    >
      <div className="flex items-center gap-1.5 mb-1">
        <span style={{ color }}>{icon}</span>
        <p
          className="text-[10px] uppercase tracking-wider font-semibold"
          style={{ color: "var(--text-4)" }}
        >
          {label}
        </p>
      </div>
      <p
        className="text-sm font-bold tabular-nums"
        style={{
          color: "var(--text-1)",
          fontFamily: "'Space Grotesk', sans-serif",
        }}
      >
        {value}
      </p>
    </div>
  );
}

function HistoryRow({
  label,
  value,
  icon,
  highlight,
}: {
  label: string;
  value: string;
  icon: React.ReactNode;
  highlight?: boolean;
}) {
  return (
    <div className="flex items-center justify-between gap-2">
      <span
        className="inline-flex items-center gap-1.5 text-xs"
        style={{ color: "var(--text-3)" }}
      >
        <span style={{ color: "var(--text-4)" }}>{icon}</span>
        {label}
      </span>
      <span
        className="text-xs font-bold tabular-nums"
        style={{
          color: highlight ? "var(--green)" : "var(--text-1)",
          fontFamily: "'Space Grotesk', sans-serif",
        }}
      >
        {value}
      </span>
    </div>
  );
}
