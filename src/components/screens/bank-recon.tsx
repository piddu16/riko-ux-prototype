"use client";

import { useMemo, useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Building,
  UploadCloud,
  FileDown,
  Check,
  AlertCircle,
  Search,
  CheckCheck,
  Plus,
  CheckCircle2,
} from "lucide-react";
import {
  BANK_ACCOUNTS,
  BANK_RECON_LINES,
  BANK_RECON_SUMMARY,
  formatINR,
} from "@/lib/data";

/* ------------------------------------------------------------------ */
/*  Animation                                                          */
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
const STATUS_META: Record<
  "matched" | "mismatch" | "missing_tally",
  { label: string; color: string; icon: typeof Check }
> = {
  matched: { label: "Matched", color: "var(--green)", icon: Check },
  mismatch: { label: "Mismatch", color: "var(--yellow)", icon: AlertCircle },
  missing_tally: { label: "Missing in Tally", color: "var(--red)", icon: Plus },
};

function fmtAmt(v: number | null) {
  if (v === null) return "—";
  const negative = v < 0;
  return `${negative ? "-" : ""}\u20B9${Math.abs(v).toLocaleString("en-IN")}`;
}

/* ------------------------------------------------------------------ */
/*  Bank Reconciliation screen                                         */
/* ------------------------------------------------------------------ */
export function BankReconScreen() {
  const [activeAccountId, setActiveAccountId] = useState(BANK_ACCOUNTS[0].id);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [dragging, setDragging] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  useEffect(() => {
    if (!toast) return;
    const t = window.setTimeout(() => setToast(null), 2600);
    return () => window.clearTimeout(t);
  }, [toast]);

  /* Create matching entry → drafts a Receipt/Payment voucher in the
     Entries queue and navigates. For the prototype we show a toast
     and fire the cross-tab nav event; real impl would POST to backend. */
  const handleCreateMatchingEntry = (description: string) => {
    setToast(`Draft created · "${description.slice(0, 40)}" · routed to Accounts`);
    // Navigate after a short pause so the toast lands first.
    window.setTimeout(() => {
      window.dispatchEvent(new CustomEvent("riko:navigate", { detail: "entries" }));
    }, 900);
  };

  const activeAccount = useMemo(
    () => BANK_ACCOUNTS.find((a) => a.id === activeAccountId) ?? BANK_ACCOUNTS[0],
    [activeAccountId],
  );

  const filteredLines = useMemo(() => {
    const q = search.trim().toLowerCase();
    return BANK_RECON_LINES
      .filter((l) => statusFilter === "all" || l.status === statusFilter)
      .filter((l) =>
        !q ||
        l.description.toLowerCase().includes(q) ||
        l.date.toLowerCase().includes(q),
      );
  }, [search, statusFilter]);

  const statusCounts = useMemo(() => {
    return {
      all: BANK_RECON_LINES.length,
      matched: BANK_RECON_LINES.filter((l) => l.status === "matched").length,
      mismatch: BANK_RECON_LINES.filter((l) => l.status === "mismatch").length,
      missing_tally: BANK_RECON_LINES.filter((l) => l.status === "missing_tally").length,
    };
  }, []);

  const diff = BANK_RECON_SUMMARY.difference;
  const diffColor = diff === 0 ? "var(--green)" : "var(--red)";

  /* Summary stat cards */
  const summaryCards = [
    {
      label: "Opening Balance",
      value: formatINR(BANK_RECON_SUMMARY.openingBalanceBank),
      sub: "as per bank",
      accent: "var(--text-3)",
    },
    {
      label: "Closing Balance",
      value: formatINR(BANK_RECON_SUMMARY.closingBalanceBank),
      sub: "as per bank",
      accent: "var(--blue)",
    },
    {
      label: "Difference",
      value: diff === 0 ? formatINR(0) : formatINR(diff),
      sub: diff === 0 ? "All matched" : "Bank vs Tally",
      accent: diffColor,
      urgent: diff !== 0,
    },
    {
      label: "Last Reconciled",
      value: activeAccount.lastReconciled,
      sub: activeAccount.status === "reconciled" ? "Up to date" : "Pending items",
      accent: activeAccount.status === "reconciled" ? "var(--green)" : "var(--yellow)",
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
              background: "color-mix(in srgb, var(--orange) 15%, transparent)",
              border: "1px solid color-mix(in srgb, var(--orange) 30%, transparent)",
            }}
          >
            <Building size={18} style={{ color: "var(--orange)" }} />
          </div>
          <div className="min-w-0">
            <h2 className="text-lg font-bold" style={{ color: "var(--text-1)" }}>
              Bank Reconciliation
            </h2>
            <p className="text-xs mt-0.5" style={{ color: "var(--text-3)" }}>
              Match bank statements with Tally entries
            </p>
          </div>
        </motion.div>

        {/* -------------------------------------------------------- */}
        {/*  Account tabs                                             */}
        {/* -------------------------------------------------------- */}
        <motion.div {...sectionAnim} className="overflow-x-auto -mx-4 px-4">
          <div className="flex gap-2 min-w-max pb-1">
            {BANK_ACCOUNTS.map((acc) => {
              const active = acc.id === activeAccountId;
              const dotColor =
                acc.status === "reconciled" ? "var(--green)" : "var(--yellow)";
              return (
                <button
                  key={acc.id}
                  onClick={() => setActiveAccountId(acc.id)}
                  className="flex items-center gap-2.5 px-3 py-2 rounded-lg cursor-pointer transition-colors text-left"
                  style={{
                    background: active
                      ? "color-mix(in srgb, var(--orange) 12%, var(--bg-surface))"
                      : "var(--bg-surface)",
                    border: `1px solid ${active ? "color-mix(in srgb, var(--orange) 45%, transparent)" : "var(--border)"}`,
                  }}
                  onMouseEnter={(e) => {
                    if (!active) (e.currentTarget as HTMLElement).style.background = "var(--bg-hover)";
                  }}
                  onMouseLeave={(e) => {
                    if (!active) (e.currentTarget as HTMLElement).style.background = "var(--bg-surface)";
                  }}
                >
                  <span
                    className="inline-block rounded-full flex-shrink-0"
                    style={{
                      width: 8,
                      height: 8,
                      background: dotColor,
                      boxShadow: `0 0 0 3px color-mix(in srgb, ${dotColor} 20%, transparent)`,
                    }}
                  />
                  <div className="flex flex-col min-w-0">
                    <span
                      className="text-xs font-semibold leading-tight"
                      style={{ color: active ? "var(--text-1)" : "var(--text-2)" }}
                    >
                      {acc.bank}
                    </span>
                    <span
                      className="text-[10px] tabular-nums leading-tight"
                      style={{
                        color: "var(--text-4)",
                        fontFamily: "'Space Grotesk', sans-serif",
                      }}
                    >
                      {acc.accountNumber} · {acc.type}
                    </span>
                  </div>
                  {acc.status === "pending" && acc.mismatchCount !== undefined && (
                    <span
                      className="text-[10px] font-bold px-1.5 py-0.5 rounded-full tabular-nums flex-shrink-0"
                      style={{
                        background: "var(--yellow)",
                        color: "#000",
                      }}
                    >
                      {acc.mismatchCount}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </motion.div>

        {/* -------------------------------------------------------- */}
        {/*  Summary stat cards                                       */}
        {/* -------------------------------------------------------- */}
        <motion.div
          {...sectionAnim}
          className="grid grid-cols-2 md:grid-cols-4 gap-3"
        >
          {summaryCards.map((card) => (
            <div
              key={card.label}
              className="rounded-md overflow-hidden"
              style={{
                background: card.urgent
                  ? "color-mix(in srgb, var(--red) 8%, var(--bg-surface))"
                  : "var(--bg-surface)",
                border: `1px solid ${card.urgent ? "color-mix(in srgb, var(--red) 30%, transparent)" : "var(--border)"}`,
              }}
            >
              <div className="h-1" style={{ background: card.accent }} />
              <div className="px-3 py-3">
                <p
                  className="text-[10px] uppercase tracking-wider font-medium mb-1"
                  style={{ color: "var(--text-4)" }}
                >
                  {card.label}
                </p>
                <p
                  className="text-sm font-bold tabular-nums leading-tight"
                  style={{
                    color: card.urgent ? "var(--red)" : "var(--text-1)",
                    fontFamily: "'Space Grotesk', sans-serif",
                  }}
                >
                  {card.value}
                </p>
                <p
                  className="text-[10px] mt-1"
                  style={{ color: "var(--text-4)" }}
                >
                  {card.sub}
                </p>
              </div>
            </div>
          ))}
        </motion.div>

        {/* -------------------------------------------------------- */}
        {/*  Reconciliation table                                     */}
        {/* -------------------------------------------------------- */}
        <motion.div
          {...sectionAnim}
          className="rounded-md overflow-hidden"
          style={{
            background: "var(--bg-surface)",
            border: "1px solid var(--border)",
          }}
        >
          {/* Filter bar */}
          <div
            className="px-4 py-3 flex flex-col sm:flex-row gap-2 sm:items-center sm:justify-between"
            style={{ borderBottom: "1px solid var(--border)" }}
          >
            <div className="flex items-center gap-2">
              <CheckCheck size={14} style={{ color: "var(--text-3)" }} />
              <h3 className="text-sm font-semibold" style={{ color: "var(--text-1)" }}>
                Reconciliation Entries
              </h3>
              <span
                className="text-[10px] font-semibold px-1.5 py-0.5 rounded tabular-nums"
                style={{
                  background: "color-mix(in srgb, var(--text-3) 15%, transparent)",
                  color: "var(--text-3)",
                }}
              >
                {filteredLines.length} of {BANK_RECON_LINES.length}
              </span>
            </div>

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
                  placeholder="Search entries..."
                  className="bg-transparent text-xs outline-none flex-1 min-w-0"
                  style={{ color: "var(--text-1)" }}
                />
              </div>

              <div className="flex gap-1.5 flex-wrap">
                {(
                  [
                    { id: "all", label: "All", color: "var(--text-3)" },
                    { id: "matched", label: `Matched (${statusCounts.matched})`, color: "var(--green)" },
                    { id: "mismatch", label: `Mismatch (${statusCounts.mismatch})`, color: "var(--yellow)" },
                    { id: "missing_tally", label: `Missing (${statusCounts.missing_tally})`, color: "var(--red)" },
                  ] as const
                ).map((f) => {
                  const active = statusFilter === f.id;
                  return (
                    <button
                      key={f.id}
                      onClick={() => setStatusFilter(f.id)}
                      className="text-[11px] font-semibold px-2.5 py-1 rounded-lg transition-colors cursor-pointer"
                      style={{
                        background: active
                          ? `color-mix(in srgb, ${f.color} 18%, transparent)`
                          : "var(--bg-secondary)",
                        color: active ? f.color : "var(--text-3)",
                        border: `1px solid ${active ? `color-mix(in srgb, ${f.color} 40%, transparent)` : "var(--border)"}`,
                      }}
                    >
                      {f.label}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Desktop table */}
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr style={{ background: "var(--bg-secondary)" }}>
                  {["Date", "Description", "Bank Amount", "Tally Amount", "Status", "Suggestion / Action"].map((h, i) => (
                    <th
                      key={h}
                      className={`px-4 py-2.5 font-semibold ${i === 2 || i === 3 ? "text-right" : "text-left"}`}
                      style={{ color: "var(--text-4)", borderBottom: "1px solid var(--border)" }}
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filteredLines.map((l) => {
                  const meta = STATUS_META[l.status];
                  const Icon = meta.icon;
                  return (
                    <tr
                      key={l.id}
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
                      <td
                        className="px-4 py-2.5 tabular-nums whitespace-nowrap"
                        style={{ color: "var(--text-3)" }}
                      >
                        {l.date}
                      </td>
                      <td className="px-4 py-2.5" style={{ color: "var(--text-1)" }}>
                        {l.description}
                      </td>
                      <td
                        className="px-4 py-2.5 text-right tabular-nums whitespace-nowrap"
                        style={{
                          color: l.bankAmount < 0 ? "var(--red)" : "var(--text-2)",
                          fontFamily: "'Space Grotesk', sans-serif",
                        }}
                      >
                        {fmtAmt(l.bankAmount)}
                      </td>
                      <td
                        className="px-4 py-2.5 text-right tabular-nums whitespace-nowrap"
                        style={{
                          color:
                            l.tallyAmount === null
                              ? "var(--text-4)"
                              : l.tallyAmount < 0
                                ? "var(--red)"
                                : "var(--text-2)",
                          fontFamily: "'Space Grotesk', sans-serif",
                        }}
                      >
                        {fmtAmt(l.tallyAmount)}
                      </td>
                      <td className="px-4 py-2.5">
                        <span
                          className="inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full whitespace-nowrap"
                          style={{
                            background: `color-mix(in srgb, ${meta.color} 18%, transparent)`,
                            color: meta.color,
                          }}
                        >
                          <Icon size={10} />
                          {meta.label}
                        </span>
                      </td>
                      <td className="px-4 py-2.5">
                        {l.status === "missing_tally" ? (
                          <div className="flex items-center justify-between gap-2">
                            <span
                              className="text-[11px] truncate"
                              style={{ color: "var(--text-3)" }}
                              title={l.suggestion}
                            >
                              {l.suggestion}
                            </span>
                            <button
                              onClick={() => handleCreateMatchingEntry(l.description)}
                              className="text-[10px] font-semibold px-2 py-1 rounded-md cursor-pointer transition-colors whitespace-nowrap flex-shrink-0 flex items-center gap-1"
                              style={{
                                background: "var(--bg-hover)",
                                color: "var(--green)",
                                border: "1px solid var(--text-3)",
                              }}
                              onMouseEnter={(e) => {
                                (e.currentTarget as HTMLElement).style.background = "var(--green)";
                                (e.currentTarget as HTMLElement).style.color = "#fff";
                              }}
                              onMouseLeave={(e) => {
                                (e.currentTarget as HTMLElement).style.background = "var(--bg-hover)";
                                (e.currentTarget as HTMLElement).style.color = "var(--green)";
                              }}
                              title="Drafts a matching Receipt/Payment voucher in the Entries queue"
                            >
                              <Plus size={10} />
                              Create matching entry
                            </button>
                          </div>
                        ) : l.status === "mismatch" ? (
                          <div className="flex items-center justify-between gap-2">
                            <span
                              className="text-[11px] truncate"
                              style={{ color: "var(--yellow)" }}
                              title={l.suggestion}
                            >
                              {l.suggestion}
                            </span>
                            <button
                              className="text-[10px] font-semibold px-2 py-1 rounded-md cursor-pointer transition-colors whitespace-nowrap flex-shrink-0"
                              style={{
                                background: "color-mix(in srgb, var(--yellow) 15%, transparent)",
                                color: "var(--yellow)",
                                border: "1px solid color-mix(in srgb, var(--yellow) 35%, transparent)",
                              }}
                              onMouseEnter={(e) => {
                                (e.currentTarget as HTMLElement).style.background = "var(--yellow)";
                                (e.currentTarget as HTMLElement).style.color = "#000";
                              }}
                              onMouseLeave={(e) => {
                                (e.currentTarget as HTMLElement).style.background = "color-mix(in srgb, var(--yellow) 15%, transparent)";
                                (e.currentTarget as HTMLElement).style.color = "var(--yellow)";
                              }}
                            >
                              Investigate
                            </button>
                          </div>
                        ) : (
                          <span className="text-[11px]" style={{ color: "var(--text-4)" }}>
                            Auto-matched
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })}
                {filteredLines.length === 0 && (
                  <tr>
                    <td
                      colSpan={6}
                      className="px-4 py-8 text-center text-xs"
                      style={{ color: "var(--text-4)" }}
                    >
                      No reconciliation entries match your filters.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Mobile cards */}
          <div className="md:hidden">
            {filteredLines.map((l) => {
              const meta = STATUS_META[l.status];
              const Icon = meta.icon;
              return (
                <div
                  key={l.id}
                  className="px-4 py-3"
                  style={{ borderTop: "1px solid var(--border)" }}
                >
                  <div className="flex items-start justify-between gap-2 mb-1">
                    <div className="min-w-0">
                      <p
                        className="text-xs font-semibold truncate"
                        style={{ color: "var(--text-1)" }}
                      >
                        {l.description}
                      </p>
                      <p
                        className="text-[10px] tabular-nums"
                        style={{ color: "var(--text-4)" }}
                      >
                        {l.date}
                      </p>
                    </div>
                    <span
                      className="inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full flex-shrink-0"
                      style={{
                        background: `color-mix(in srgb, ${meta.color} 18%, transparent)`,
                        color: meta.color,
                      }}
                    >
                      <Icon size={10} />
                      {meta.label}
                    </span>
                  </div>
                  <div className="grid grid-cols-2 gap-2 mt-2">
                    <div>
                      <p className="text-[10px]" style={{ color: "var(--text-4)" }}>
                        Bank
                      </p>
                      <p
                        className="text-xs tabular-nums"
                        style={{
                          color: l.bankAmount < 0 ? "var(--red)" : "var(--text-2)",
                          fontFamily: "'Space Grotesk', sans-serif",
                        }}
                      >
                        {fmtAmt(l.bankAmount)}
                      </p>
                    </div>
                    <div>
                      <p className="text-[10px]" style={{ color: "var(--text-4)" }}>
                        Tally
                      </p>
                      <p
                        className="text-xs tabular-nums"
                        style={{
                          color:
                            l.tallyAmount === null
                              ? "var(--text-4)"
                              : l.tallyAmount < 0
                                ? "var(--red)"
                                : "var(--text-2)",
                          fontFamily: "'Space Grotesk', sans-serif",
                        }}
                      >
                        {fmtAmt(l.tallyAmount)}
                      </p>
                    </div>
                  </div>
                  {(l.status === "missing_tally" || l.status === "mismatch") && (
                    <div className="mt-2 flex flex-col gap-1.5">
                      {l.suggestion && (
                        <p
                          className="text-[11px]"
                          style={{
                            color: l.status === "mismatch" ? "var(--yellow)" : "var(--text-3)",
                          }}
                        >
                          {l.suggestion}
                        </p>
                      )}
                      <button
                        className="text-[11px] font-semibold px-2.5 py-1.5 rounded-md cursor-pointer self-start"
                        style={{
                          background: l.status === "mismatch"
                            ? "color-mix(in srgb, var(--yellow) 15%, transparent)"
                            : "var(--bg-hover)",
                          color: l.status === "mismatch" ? "var(--yellow)" : "var(--green)",
                          border: `1px solid color-mix(in srgb, ${l.status === "mismatch" ? "var(--yellow)" : "var(--green)"} 35%, transparent)`,
                        }}
                      >
                        {l.status === "mismatch" ? "Investigate" : "Record in Tally"}
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
            {filteredLines.length === 0 && (
              <p
                className="px-4 py-8 text-center text-xs"
                style={{ color: "var(--text-4)" }}
              >
                No reconciliation entries match your filters.
              </p>
            )}
          </div>
        </motion.div>

        {/* -------------------------------------------------------- */}
        {/*  Upload bank statement                                    */}
        {/* -------------------------------------------------------- */}
        <motion.div
          {...sectionAnim}
          className="rounded-md"
          style={{
            background: "var(--bg-surface)",
            border: "1px solid var(--border)",
          }}
        >
          <div
            className="px-4 py-3"
            style={{ borderBottom: "1px solid var(--border)" }}
          >
            <h3 className="text-sm font-semibold" style={{ color: "var(--text-1)" }}>
              Upload Bank Statement
            </h3>
            <p className="text-[11px] mt-0.5" style={{ color: "var(--text-4)" }}>
              Import PDF/Excel to auto-match against Tally
            </p>
          </div>
          <div className="p-4">
            <div
              onDragOver={(e) => {
                e.preventDefault();
                setDragging(true);
              }}
              onDragLeave={() => setDragging(false)}
              onDrop={(e) => {
                e.preventDefault();
                setDragging(false);
              }}
              className="flex flex-col items-center justify-center gap-2 py-8 px-4 rounded-md text-center cursor-pointer transition-colors"
              style={{
                background: dragging
                  ? "color-mix(in srgb, var(--orange) 8%, var(--bg-secondary))"
                  : "var(--bg-secondary)",
                border: `2px dashed ${dragging ? "var(--orange)" : "var(--border)"}`,
              }}
            >
              <div
                className="w-10 h-10 rounded-full flex items-center justify-center"
                style={{
                  background: "color-mix(in srgb, var(--orange) 15%, transparent)",
                }}
              >
                <UploadCloud size={20} style={{ color: "var(--orange)" }} />
              </div>
              <p
                className="text-sm font-semibold"
                style={{ color: "var(--text-1)" }}
              >
                Upload bank statement PDF/Excel
              </p>
              <p
                className="text-xs"
                style={{ color: "var(--text-4)" }}
              >
                Drag & drop, or click to browse · Supports HDFC, ICICI, SBI, Kotak formats
              </p>
              <button
                className="mt-1 text-[11px] font-semibold px-3 py-1.5 rounded-md cursor-pointer transition-colors"
                style={{
                  background: "color-mix(in srgb, var(--orange) 15%, transparent)",
                  color: "var(--orange)",
                  border: "1px solid color-mix(in srgb, var(--orange) 35%, transparent)",
                }}
              >
                Choose file
              </button>
            </div>
          </div>
        </motion.div>

        {/* -------------------------------------------------------- */}
        {/*  Bottom action buttons                                    */}
        {/* -------------------------------------------------------- */}
        <motion.div
          {...sectionAnim}
          className="flex flex-col sm:flex-row gap-2"
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
            <CheckCheck size={14} />
            Post adjustments to Tally
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
            Export reconciliation report
          </button>
        </motion.div>
      </div>

      {/* Toast for "Create matching entry" confirmation */}
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="fixed bottom-20 md:bottom-6 left-1/2 -translate-x-1/2 z-50 px-4 py-2.5 rounded-lg flex items-center gap-2"
            style={{
              background: "var(--green)",
              color: "white",
              boxShadow: "0 6px 20px rgba(0,0,0,0.25)",
            }}
          >
            <CheckCircle2 size={14} />
            <span className="text-[13px] font-semibold">{toast}</span>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
