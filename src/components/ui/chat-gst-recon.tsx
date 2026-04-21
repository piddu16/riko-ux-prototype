"use client";

/* ═══════════════════════════════════════════════════════════════
   Inline GST Reconciliation widget for chat
   User can say "reconcile March 2B" and get an interactive recon
   workflow right inside the assistant response — no page switch.
   ═══════════════════════════════════════════════════════════════ */

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  CheckCircle2,
  AlertTriangle,
  FileQuestion,
  FileX,
  MessageSquare,
  Send,
  ChevronRight,
  Filter,
} from "lucide-react";
import { RECONCILIATION, GST_DATA_FRESHNESS, type ReconStatus } from "@/lib/data";
import { ChatStackedBar } from "./chat-charts";

type FilterKey = "all" | ReconStatus;

const STATUS_META: Record<
  ReconStatus,
  { label: string; color: string; icon: typeof CheckCircle2; short: string }
> = {
  matched: { label: "Matched", color: "var(--green)", icon: CheckCircle2, short: "Match" },
  manual_matched: { label: "Manual matched", color: "#10B981", icon: CheckCircle2, short: "Manual" },
  partial_match: { label: "Partial match", color: "var(--orange)", icon: AlertTriangle, short: "Partial" },
  mismatch: { label: "Value mismatch", color: "var(--yellow)", icon: AlertTriangle, short: "Mismatch" },
  missing_portal: {
    label: "Missing from 2B",
    color: "var(--orange)",
    icon: FileQuestion,
    short: "Not in 2B",
  },
  missing_tally: {
    label: "Missing from Tally",
    color: "var(--red)",
    icon: FileX,
    short: "Not in Tally",
  },
};

function fmtINR(v: number | null): string {
  if (v === null) return "—";
  const abs = Math.abs(v);
  if (abs >= 1e7) return `₹${(abs / 1e7).toFixed(2)}Cr`;
  if (abs >= 1e5) return `₹${(abs / 1e5).toFixed(1)}L`;
  return `₹${abs.toLocaleString("en-IN")}`;
}

export function ChatGstRecon({
  period = "March 2026",
  onOpenFullRecon,
}: {
  period?: string;
  onOpenFullRecon?: () => void;
}) {
  const [filter, setFilter] = useState<FilterKey>("all");
  const [actioned, setActioned] = useState<Record<string, "accepted" | "reminded" | "flagged">>({});
  const [reminderToast, setReminderToast] = useState<string | null>(null);

  const lines = RECONCILIATION.lines;
  const filtered = filter === "all" ? lines : lines.filter((l) => l.status === filter);

  const matchPct = Math.round((RECONCILIATION.matched / RECONCILIATION.totalTallyInvoices) * 100);

  const handleAction = (id: string, action: "accepted" | "reminded" | "flagged", supplier?: string) => {
    setActioned((prev) => ({ ...prev, [id]: action }));
    if (action === "reminded" && supplier) {
      setReminderToast(`WhatsApp reminder queued for ${supplier}`);
      setTimeout(() => setReminderToast(null), 2800);
    }
  };

  const handleBatchRemind = () => {
    const missing = lines.filter((l) => l.status === "missing_portal");
    setActioned((prev) => {
      const next = { ...prev };
      missing.forEach((l) => {
        next[l.id] = "reminded";
      });
      return next;
    });
    setReminderToast(`WhatsApp reminders queued for ${missing.length} suppliers`);
    setTimeout(() => setReminderToast(null), 3000);
  };

  return (
    <div className="space-y-3 my-1">
      {/* Header card — summary with health */}
      <div
        className="rounded-xl p-4"
        style={{ background: "var(--bg-surface)", border: "1px solid var(--border)" }}
      >
        <div className="flex items-start justify-between gap-3 mb-3">
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap mb-1">
              <span
                className="text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded"
                style={{
                  background: "color-mix(in srgb, var(--purple) 15%, transparent)",
                  color: "var(--purple)",
                }}
              >
                GSTR-2B RECON
              </span>
              <span className="text-xs font-semibold" style={{ color: "var(--text-1)" }}>
                {period}
              </span>
            </div>
            <p className="text-[10px]" style={{ color: "var(--text-4)" }}>
              2B cut-off: {GST_DATA_FRESHNESS.gstr2b.asOf} · Tally synced{" "}
              {GST_DATA_FRESHNESS.tallySync.asOf}
            </p>
          </div>
          <div className="flex-shrink-0 text-right">
            <p
              className="text-2xl font-bold leading-none"
              style={{
                color: matchPct > 85 ? "var(--green)" : matchPct > 70 ? "var(--yellow)" : "var(--red)",
                fontFamily: "'Space Grotesk', sans-serif",
              }}
            >
              {matchPct}%
            </p>
            <p className="text-[9px] uppercase tracking-wider" style={{ color: "var(--text-4)" }}>
              Match rate
            </p>
          </div>
        </div>

        {/* Stacked status bar */}
        <ChatStackedBar
          segments={[
            {
              label: "Matched",
              value: RECONCILIATION.matched,
              color: "var(--green)",
            },
            {
              label: "Mismatches",
              value: RECONCILIATION.mismatches,
              color: "var(--yellow)",
            },
            {
              label: "Not in 2B",
              value: RECONCILIATION.missingFromPortal,
              color: "var(--orange)",
            },
            {
              label: "Not in Tally",
              value: RECONCILIATION.missingFromTally,
              color: "var(--red)",
            },
          ]}
          subtitle={`${RECONCILIATION.totalTallyInvoices} invoices in Tally · ${RECONCILIATION.totalPortalInvoices} in GSTR-2B`}
          currency={false}
        />

        {/* Risk callout */}
        <div
          className="mt-3 rounded-lg px-3 py-2.5 flex items-center gap-2"
          style={{
            background: "color-mix(in srgb, var(--red) 10%, transparent)",
            border: "1px solid color-mix(in srgb, var(--red) 25%, transparent)",
          }}
        >
          <AlertTriangle size={14} style={{ color: "var(--red)" }} />
          <p className="text-[11px] flex-1" style={{ color: "var(--text-1)" }}>
            <span className="font-bold">{fmtINR(RECONCILIATION.itcAtRiskValue)} ITC at risk</span>
            <span style={{ color: "var(--text-3)" }}>
              {" "}
              — 8 suppliers haven&apos;t filed GSTR-1 yet
            </span>
          </p>
          <button
            onClick={handleBatchRemind}
            className="text-[11px] font-semibold px-2.5 py-1.5 min-h-[32px] rounded-md flex-shrink-0 cursor-pointer flex items-center gap-1"
            style={{
              background: "var(--red)",
              color: "white",
            }}
          >
            <MessageSquare size={11} />
            Remind all 8
          </button>
        </div>
      </div>

      {/* Filter chips */}
      <div className="flex items-center gap-1.5 flex-wrap">
        <Filter size={12} style={{ color: "var(--text-4)" }} />
        {[
          { key: "all", label: "All", count: lines.length },
          { key: "mismatch", label: "Mismatches", count: RECONCILIATION.mismatches },
          { key: "missing_portal", label: "Not in 2B", count: RECONCILIATION.missingFromPortal },
          { key: "missing_tally", label: "Not in Tally", count: RECONCILIATION.missingFromTally },
          { key: "matched", label: "Matched", count: RECONCILIATION.matched },
        ].map((f) => {
          const active = filter === f.key;
          return (
            <button
              key={f.key}
              onClick={() => setFilter(f.key as FilterKey)}
              className="text-[11px] font-semibold px-3 py-1.5 min-h-[32px] rounded-full cursor-pointer transition-colors"
              style={{
                background: active
                  ? "color-mix(in srgb, var(--green) 15%, transparent)"
                  : "var(--bg-surface)",
                color: active ? "var(--green)" : "var(--text-3)",
                border: `1px solid ${active ? "color-mix(in srgb, var(--green) 35%, transparent)" : "var(--border)"}`,
              }}
            >
              {f.label} · {f.count}
            </button>
          );
        })}
      </div>

      {/* Line items */}
      <div
        className="rounded-xl overflow-hidden"
        style={{ background: "var(--bg-surface)", border: "1px solid var(--border)" }}
      >
        <AnimatePresence initial={false}>
          {filtered.map((line, i) => {
            const meta = STATUS_META[line.status];
            const Icon = meta.icon;
            const taken = actioned[line.id];

            return (
              <motion.div
                key={line.id}
                layout
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.2, delay: i * 0.03 }}
                className="px-3 py-2.5 flex items-start gap-2.5"
                style={{
                  borderTop: i === 0 ? "none" : "1px solid var(--border)",
                  background: taken
                    ? "color-mix(in srgb, var(--green) 6%, transparent)"
                    : "transparent",
                }}
              >
                {/* Icon */}
                <div className="flex-shrink-0 mt-0.5">
                  <Icon size={14} style={{ color: meta.color }} />
                </div>

                {/* Middle: supplier + detail */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span
                      className="text-xs font-semibold truncate"
                      style={{ color: "var(--text-1)" }}
                    >
                      {line.supplier}
                    </span>
                    <span
                      className="text-[9px] font-medium px-1.5 py-0.5 rounded"
                      style={{
                        background: `color-mix(in srgb, ${meta.color} 12%, transparent)`,
                        color: meta.color,
                      }}
                    >
                      {meta.short}
                    </span>
                  </div>
                  <p className="text-[11px] mt-0.5" style={{ color: "var(--text-4)" }}>
                    {line.invoiceNo} · {line.date}
                  </p>
                  {line.issue && (
                    <p
                      className="text-[11px] mt-1"
                      style={{ color: "var(--text-3)" }}
                    >
                      {line.issue}
                    </p>
                  )}

                  {/* Amount comparison */}
                  <div className="flex items-center gap-3 mt-1.5 text-[11px]">
                    <span style={{ color: "var(--text-4)" }}>
                      Tally:{" "}
                      <span
                        className="font-semibold tabular-nums"
                        style={{
                          color: line.tallyAmt ? "var(--text-2)" : "var(--text-4)",
                          fontFamily: "'Space Grotesk', sans-serif",
                        }}
                      >
                        {fmtINR(line.tallyAmt)}
                      </span>
                    </span>
                    <span style={{ color: "var(--text-4)" }}>
                      2B:{" "}
                      <span
                        className="font-semibold tabular-nums"
                        style={{
                          color: line.portalAmt ? "var(--text-2)" : "var(--text-4)",
                          fontFamily: "'Space Grotesk', sans-serif",
                        }}
                      >
                        {fmtINR(line.portalAmt)}
                      </span>
                    </span>
                  </div>
                </div>

                {/* Action buttons */}
                <div className="flex-shrink-0 flex flex-col items-end gap-1">
                  {taken ? (
                    <span
                      className="text-[11px] font-semibold px-2.5 py-1.5 rounded-md flex items-center gap-1"
                      style={{
                        background: "color-mix(in srgb, var(--green) 15%, transparent)",
                        color: "var(--green)",
                      }}
                    >
                      <CheckCircle2 size={11} />
                      {taken === "reminded"
                        ? "Reminded"
                        : taken === "accepted"
                        ? "Accepted"
                        : "Flagged"}
                    </span>
                  ) : line.status === "matched" ? (
                    <button
                      onClick={() => handleAction(line.id, "accepted")}
                      className="text-[11px] font-semibold px-3 py-1.5 min-h-[36px] rounded-md cursor-pointer"
                      style={{
                        background: "color-mix(in srgb, var(--green) 12%, transparent)",
                        color: "var(--green)",
                        border: "1px solid color-mix(in srgb, var(--green) 25%, transparent)",
                      }}
                    >
                      Accept
                    </button>
                  ) : line.status === "missing_portal" ? (
                    <button
                      onClick={() => handleAction(line.id, "reminded", line.supplier)}
                      className="text-[11px] font-semibold px-3 py-1.5 min-h-[36px] rounded-md cursor-pointer flex items-center gap-1"
                      style={{
                        background: "color-mix(in srgb, var(--orange) 12%, transparent)",
                        color: "var(--orange)",
                        border: "1px solid color-mix(in srgb, var(--orange) 30%, transparent)",
                      }}
                    >
                      <Send size={11} />
                      Remind
                    </button>
                  ) : line.status === "mismatch" ? (
                    <button
                      onClick={() => handleAction(line.id, "flagged")}
                      className="text-[11px] font-semibold px-3 py-1.5 min-h-[36px] rounded-md cursor-pointer"
                      style={{
                        background: "color-mix(in srgb, var(--yellow) 12%, transparent)",
                        color: "var(--yellow)",
                        border: "1px solid color-mix(in srgb, var(--yellow) 30%, transparent)",
                      }}
                    >
                      Investigate
                    </button>
                  ) : (
                    <button
                      onClick={() => handleAction(line.id, "flagged")}
                      className="text-[11px] font-semibold px-3 py-1.5 min-h-[36px] rounded-md cursor-pointer"
                      style={{
                        background: "color-mix(in srgb, var(--red) 12%, transparent)",
                        color: "var(--red)",
                        border: "1px solid color-mix(in srgb, var(--red) 30%, transparent)",
                      }}
                    >
                      Record in Tally
                    </button>
                  )}
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>

      {/* Next step */}
      {onOpenFullRecon && (
        <button
          onClick={onOpenFullRecon}
          className="w-full rounded-lg px-3 py-2.5 text-xs font-semibold flex items-center justify-center gap-1.5 cursor-pointer transition-colors"
          style={{
            background: "var(--bg-surface)",
            border: "1px solid var(--border)",
            color: "var(--text-2)",
          }}
        >
          Open full reconciliation view
          <ChevronRight size={12} />
        </button>
      )}

      {/* Reminder toast */}
      <AnimatePresence>
        {reminderToast && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            className="fixed bottom-20 md:bottom-5 left-1/2 -translate-x-1/2 z-50 px-4 py-2.5 rounded-lg shadow-lg flex items-center gap-2"
            style={{
              background: "var(--green)",
              color: "white",
            }}
          >
            <CheckCircle2 size={14} />
            <span className="text-xs font-semibold">{reminderToast}</span>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
