"use client";

/* ═══════════════════════════════════════════════════════════════
   EntryDetail — full view of a single entry with state machine
   visible, approve/reject actions (role-gated), edit draft, post
   to Tally (role-gated).
   ═══════════════════════════════════════════════════════════════ */

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowLeft,
  CheckCircle2,
  XCircle,
  Edit2,
  Upload,
  FileText,
  AlertTriangle,
  History,
  Sparkles,
  Building2,
} from "lucide-react";
import {
  ENTRY_STATE_META,
  ENTRY_TYPE_LABELS,
  ENTRY_SOURCE_LABELS,
  type Entry,
} from "@/lib/data";
import { useRbac } from "@/lib/rbac-context";
import { canApproveAmount, canEntryAction, ROLES } from "@/lib/rbac";

function fmt(v: number): string {
  const abs = Math.abs(v);
  const sign = v < 0 ? "-" : "";
  if (abs >= 1e7) return `${sign}₹${(abs / 1e7).toFixed(2)}Cr`;
  if (abs >= 1e5) return `${sign}₹${(abs / 1e5).toFixed(1)}L`;
  if (abs >= 1e3) return `${sign}₹${(abs / 1e3).toFixed(0)}K`;
  return `${sign}₹${abs.toLocaleString("en-IN")}`;
}

function fullAmount(v: number): string {
  const sign = v < 0 ? "-" : "";
  return `${sign}₹${Math.abs(v).toLocaleString("en-IN", { maximumFractionDigits: 2 })}`;
}

export function EntryDetail({
  entry,
  onBack,
}: {
  entry: Entry;
  onBack: () => void;
}) {
  const { role, roleConfig } = useRbac();
  const [toast, setToast] = useState<string | null>(null);
  const [rejectModalOpen, setRejectModalOpen] = useState(false);
  const [rejectReason, setRejectReason] = useState("");

  const stateMeta = ENTRY_STATE_META[entry.state];
  const typeLabel = ENTRY_TYPE_LABELS[entry.type];

  const canApproveThis =
    entry.state === "pending" &&
    canApproveAmount(role, entry.amount) &&
    canEntryAction(role, entry.type, "approve") &&
    entry.createdByRole !== role;

  const canPostThis =
    (entry.state === "approved" || entry.state === "pending") &&
    canEntryAction(role, entry.type, "post");

  const canEditThis =
    entry.state === "draft" &&
    (entry.createdByRole === role || role === "admin");

  const showToast = (msg: string) => {
    setToast(msg);
    window.setTimeout(() => setToast(null), 2800);
  };

  const handleApprove = () => {
    showToast(`Approved — ready to post to Tally`);
  };

  const handlePost = () => {
    showToast(`Posted to Tally · VCH/2026-27/${Math.floor(Math.random() * 900 + 100)}`);
  };

  const handleReject = () => {
    if (!rejectReason.trim()) return;
    setRejectModalOpen(false);
    showToast(`Rejected and sent back to creator`);
    setRejectReason("");
  };

  const debitTotal = entry.ledgerImpact
    .filter((l) => l.debit !== undefined)
    .reduce((s, l) => s + (l.debit ?? 0), 0);
  const creditTotal = entry.ledgerImpact
    .filter((l) => l.credit !== undefined)
    .reduce((s, l) => s + (l.credit ?? 0), 0);

  return (
    <div className="max-w-4xl mx-auto space-y-4 relative">
      {/* Back + header row */}
      <div className="flex items-center gap-3">
        <button
          onClick={onBack}
          className="flex items-center gap-1.5 text-[12px] font-medium px-2.5 py-1.5 rounded-md cursor-pointer transition-opacity hover:opacity-80"
          style={{
            background: "var(--bg-surface)",
            border: "1px solid var(--border)",
            color: "var(--text-3)",
          }}
        >
          <ArrowLeft size={12} />
          Back to Entries
        </button>
      </div>

      {/* Summary card */}
      <div
        className="rounded-lg p-5"
        style={{
          background: "var(--bg-surface)",
          border: "1px solid var(--border)",
          borderLeft: `4px solid ${stateMeta.color}`,
        }}
      >
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2 mb-1 flex-wrap">
              <span
                className="text-[10px] font-bold uppercase tracking-widest"
                style={{ color: "var(--text-4)" }}
              >
                {typeLabel}
              </span>
              <span
                className="text-[10px] font-semibold px-2 py-0.5 rounded-md"
                style={{ background: stateMeta.bgColor, color: stateMeta.color }}
              >
                {stateMeta.label}
              </span>
              {entry.voucherNumber && (
                <span
                  className="text-[10px] font-mono font-semibold px-2 py-0.5 rounded-md"
                  style={{
                    background: "color-mix(in srgb, var(--green) 12%, transparent)",
                    color: "var(--green)",
                  }}
                >
                  {entry.voucherNumber}
                </span>
              )}
            </div>
            <h1
              className="text-xl md:text-2xl font-bold mb-1"
              style={{ color: "var(--text-1)" }}
            >
              {entry.partyName}
            </h1>
            {entry.partyGstin && (
              <p className="text-[11px] font-mono" style={{ color: "var(--text-4)" }}>
                {entry.partyGstin}
              </p>
            )}
            <p className="text-[13px] mt-2" style={{ color: "var(--text-2)" }}>
              {entry.particulars}
            </p>
          </div>
          <div className="text-right">
            <p
              className="text-2xl md:text-3xl font-bold tabular-nums"
              style={{
                color: entry.type === "sales" || entry.type === "receipt" ? "var(--green)" : "var(--text-1)",
                fontFamily: "'Space Grotesk', sans-serif",
              }}
            >
              {fmt(entry.amount)}
            </p>
            <p className="text-[10px]" style={{ color: "var(--text-4)" }}>
              {fullAmount(entry.amount)}
            </p>
          </div>
        </div>

        {/* Meta row */}
        <div
          className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-4 pt-4"
          style={{ borderTop: "1px solid var(--border)" }}
        >
          <Meta label="Voucher date" value={new Date(entry.date).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })} />
          <Meta label="Created by" value={`${entry.createdBy} · ${ROLES[entry.createdByRole as keyof typeof ROLES]?.name ?? entry.createdByRole}`} />
          <Meta label="Source" value={ENTRY_SOURCE_LABELS[entry.source]} />
          <Meta label="Required approver" value={approverLabel(entry.requiredApprover)} />
        </div>

        {/* Role-gated action bar */}
        {(canApproveThis || canEditThis || canPostThis) && (
          <div
            className="flex items-center gap-2 mt-4 pt-4 flex-wrap"
            style={{ borderTop: "1px solid var(--border)" }}
          >
            {canEditThis && (
              <button
                className="flex items-center gap-1.5 text-xs font-semibold px-3 py-2 rounded-lg cursor-pointer transition-opacity hover:opacity-90"
                style={{
                  background: "var(--bg-hover)",
                  border: "1px solid var(--border)",
                  color: "var(--text-2)",
                }}
              >
                <Edit2 size={12} />
                Edit draft
              </button>
            )}
            {canApproveThis && (
              <>
                <button
                  onClick={handleApprove}
                  className="flex items-center gap-1.5 text-xs font-semibold px-3 py-2 rounded-lg cursor-pointer transition-opacity hover:opacity-90"
                  style={{ background: "var(--green)", color: "white" }}
                >
                  <CheckCircle2 size={12} />
                  Approve
                </button>
                <button
                  onClick={() => setRejectModalOpen(true)}
                  className="flex items-center gap-1.5 text-xs font-semibold px-3 py-2 rounded-lg cursor-pointer transition-opacity hover:opacity-90"
                  style={{
                    background: "color-mix(in srgb, var(--red) 12%, transparent)",
                    border: "1px solid color-mix(in srgb, var(--red) 30%, transparent)",
                    color: "var(--red)",
                  }}
                >
                  <XCircle size={12} />
                  Reject with reason
                </button>
              </>
            )}
            {canPostThis && entry.state === "approved" && (
              <button
                onClick={handlePost}
                className="flex items-center gap-1.5 text-xs font-semibold px-3 py-2 rounded-lg cursor-pointer transition-opacity hover:opacity-90"
                style={{ background: "var(--green)", color: "white" }}
              >
                <Upload size={12} />
                Post to Tally
              </button>
            )}
            <div className="flex-1" />
            <span
              className="text-[10px] px-2 py-1 rounded-md"
              style={{
                background: "color-mix(in srgb, " + roleConfig.color + " 10%, transparent)",
                color: roleConfig.color,
                border: "1px solid color-mix(in srgb, " + roleConfig.color + " 25%, transparent)",
              }}
            >
              Acting as {roleConfig.name}
            </span>
          </div>
        )}

        {/* Rejected banner */}
        {entry.state === "rejected" && entry.rejectionReason && (
          <div
            className="mt-4 pt-4"
            style={{ borderTop: "1px solid var(--border)" }}
          >
            <div
              className="flex items-start gap-2 px-3 py-2.5 rounded-lg"
              style={{
                background: "color-mix(in srgb, var(--red) 10%, transparent)",
                border: "1px solid color-mix(in srgb, var(--red) 25%, transparent)",
              }}
            >
              <AlertTriangle size={14} style={{ color: "var(--red)", flexShrink: 0, marginTop: 2 }} />
              <div className="flex-1">
                <p className="text-[11px] font-bold mb-1" style={{ color: "var(--red)" }}>
                  Rejected by {entry.rejectedBy}
                </p>
                <p className="text-[12px]" style={{ color: "var(--text-2)" }}>
                  {entry.rejectionReason}
                </p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Ledger impact */}
      <div
        className="rounded-lg p-5"
        style={{ background: "var(--bg-surface)", border: "1px solid var(--border)" }}
      >
        <div className="flex items-center gap-2 mb-3">
          <Building2 size={14} style={{ color: "var(--blue)" }} />
          <h2 className="text-sm font-bold" style={{ color: "var(--text-1)" }}>
            Ledger impact
          </h2>
          <span className="text-[10px]" style={{ color: "var(--text-4)" }}>
            · {entry.ledgerImpact.length} accounts will be touched
          </span>
        </div>
        <table className="w-full text-[12px]">
          <thead>
            <tr style={{ color: "var(--text-4)" }}>
              <th className="text-left pb-2 font-medium">Ledger account</th>
              <th className="text-right pb-2 font-medium">Debit</th>
              <th className="text-right pb-2 font-medium">Credit</th>
            </tr>
          </thead>
          <tbody>
            {entry.ledgerImpact.map((l, i) => (
              <tr
                key={i}
                style={{ borderTop: "1px solid var(--border)" }}
              >
                <td className="py-2" style={{ color: "var(--text-1)" }}>
                  {l.ledger}
                </td>
                <td
                  className="py-2 text-right tabular-nums"
                  style={{
                    color: l.debit ? "var(--text-1)" : "var(--text-4)",
                    fontFamily: "'Space Grotesk', sans-serif",
                  }}
                >
                  {l.debit ? `₹${l.debit.toLocaleString("en-IN", { maximumFractionDigits: 2 })}` : "—"}
                </td>
                <td
                  className="py-2 text-right tabular-nums"
                  style={{
                    color: l.credit ? "var(--text-1)" : "var(--text-4)",
                    fontFamily: "'Space Grotesk', sans-serif",
                  }}
                >
                  {l.credit ? `₹${l.credit.toLocaleString("en-IN", { maximumFractionDigits: 2 })}` : "—"}
                </td>
              </tr>
            ))}
            <tr
              style={{
                borderTop: "2px solid var(--border)",
                fontWeight: 700,
              }}
            >
              <td className="pt-2 font-bold" style={{ color: "var(--text-1)" }}>
                Totals
              </td>
              <td
                className="pt-2 text-right tabular-nums font-bold"
                style={{
                  color: "var(--text-1)",
                  fontFamily: "'Space Grotesk', sans-serif",
                }}
              >
                ₹{debitTotal.toLocaleString("en-IN", { maximumFractionDigits: 2 })}
              </td>
              <td
                className="pt-2 text-right tabular-nums font-bold"
                style={{
                  color: "var(--text-1)",
                  fontFamily: "'Space Grotesk', sans-serif",
                }}
              >
                ₹{creditTotal.toLocaleString("en-IN", { maximumFractionDigits: 2 })}
              </td>
            </tr>
          </tbody>
        </table>
        <p
          className="text-[10px] mt-3 flex items-center gap-1.5"
          style={{ color: "var(--text-4)" }}
        >
          <Sparkles size={10} style={{ color: "var(--green)" }} />
          On post, Tally cascades: ledger balances, inventory (if item-based),
          GST register, and TDS register — all updated from this one voucher.
        </p>
      </div>

      {/* Line items (for sales/purchase) */}
      {entry.items && entry.items.length > 0 && (
        <div
          className="rounded-lg p-5"
          style={{ background: "var(--bg-surface)", border: "1px solid var(--border)" }}
        >
          <h2 className="text-sm font-bold mb-3" style={{ color: "var(--text-1)" }}>
            Line items ({entry.items.length})
          </h2>
          <table className="w-full text-[12px]">
            <thead>
              <tr style={{ color: "var(--text-4)" }}>
                <th className="text-left pb-2 font-medium">Item</th>
                <th className="text-left pb-2 font-medium">HSN</th>
                <th className="text-right pb-2 font-medium">Qty</th>
                <th className="text-right pb-2 font-medium">Rate</th>
                <th className="text-right pb-2 font-medium">Amount</th>
              </tr>
            </thead>
            <tbody>
              {entry.items.map((item, i) => (
                <tr
                  key={i}
                  style={{ borderTop: "1px solid var(--border)" }}
                >
                  <td className="py-2" style={{ color: "var(--text-1)" }}>
                    {item.name}
                  </td>
                  <td
                    className="py-2 font-mono text-[11px]"
                    style={{ color: "var(--text-4)" }}
                  >
                    {item.hsn ?? "—"}
                  </td>
                  <td
                    className="py-2 text-right tabular-nums"
                    style={{ color: "var(--text-2)" }}
                  >
                    {item.qty.toLocaleString("en-IN")}
                    {item.unit ? ` ${item.unit}` : ""}
                  </td>
                  <td
                    className="py-2 text-right tabular-nums"
                    style={{
                      color: "var(--text-2)",
                      fontFamily: "'Space Grotesk', sans-serif",
                    }}
                  >
                    ₹{item.rate.toLocaleString("en-IN")}
                  </td>
                  <td
                    className="py-2 text-right tabular-nums font-semibold"
                    style={{
                      color: "var(--text-1)",
                      fontFamily: "'Space Grotesk', sans-serif",
                    }}
                  >
                    ₹{item.amount.toLocaleString("en-IN")}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* History / audit trail */}
      <div
        className="rounded-lg p-5"
        style={{ background: "var(--bg-surface)", border: "1px solid var(--border)" }}
      >
        <div className="flex items-center gap-2 mb-3">
          <History size={14} style={{ color: "var(--purple)" }} />
          <h2 className="text-sm font-bold" style={{ color: "var(--text-1)" }}>
            Audit trail
          </h2>
        </div>
        <div className="space-y-0">
          {entry.history.map((h, i) => (
            <div
              key={i}
              className="flex items-start gap-3 py-2.5"
              style={{
                borderBottom:
                  i < entry.history.length - 1 ? "1px solid var(--border)" : "none",
              }}
            >
              <div
                className="w-1.5 h-1.5 rounded-full mt-1.5 flex-shrink-0"
                style={{
                  background: i === entry.history.length - 1 ? "var(--green)" : "var(--text-4)",
                }}
              />
              <div className="flex-1 min-w-0">
                <p className="text-[12px]" style={{ color: "var(--text-1)" }}>
                  <span className="font-semibold">{h.action}</span>
                  {h.note && (
                    <span
                      className="ml-1.5 text-[11px] italic"
                      style={{ color: "var(--text-3)" }}
                    >
                      — {h.note}
                    </span>
                  )}
                </p>
                <p className="text-[10px] mt-0.5" style={{ color: "var(--text-4)" }}>
                  {h.actor} · {h.actorRole === "system" ? "System" : h.actorRole}{" "}
                  · {new Date(h.at).toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" })}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Reject modal */}
      <AnimatePresence>
        {rejectModalOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setRejectModalOpen(false)}
              className="fixed inset-0 z-50"
              style={{ background: "rgba(0,0,0,0.5)" }}
            />
            <motion.div
              initial={{ opacity: 0, y: 20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 20, scale: 0.95 }}
              transition={{ duration: 0.2 }}
              className="fixed inset-x-4 top-1/2 -translate-y-1/2 max-w-md mx-auto z-50 rounded-lg p-5"
              style={{
                background: "var(--bg-secondary)",
                border: "1px solid var(--border)",
                boxShadow: "0 20px 60px rgba(0,0,0,0.35)",
              }}
            >
              <h3 className="text-base font-bold mb-1" style={{ color: "var(--text-1)" }}>
                Reject this entry
              </h3>
              <p className="text-[12px] mb-3" style={{ color: "var(--text-3)" }}>
                {entry.createdBy} will see your reason and can edit + resubmit.
              </p>
              <textarea
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                placeholder="e.g. GSTIN doesn't match vendor master — please verify"
                rows={3}
                className="w-full px-3 py-2 rounded-lg text-[13px] resize-none"
                style={{
                  background: "var(--bg-surface)",
                  border: "1px solid var(--border)",
                  color: "var(--text-1)",
                }}
                autoFocus
              />
              <div className="flex items-center gap-2 mt-3 justify-end">
                <button
                  onClick={() => setRejectModalOpen(false)}
                  className="text-xs font-semibold px-3 py-2 rounded-lg cursor-pointer"
                  style={{
                    background: "var(--bg-surface)",
                    border: "1px solid var(--border)",
                    color: "var(--text-2)",
                  }}
                >
                  Cancel
                </button>
                <button
                  onClick={handleReject}
                  disabled={!rejectReason.trim()}
                  className="text-xs font-semibold px-3 py-2 rounded-lg cursor-pointer disabled:opacity-40"
                  style={{ background: "var(--red)", color: "white" }}
                >
                  Reject
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Toast */}
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

function Meta({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p
        className="text-[10px] uppercase tracking-wider mb-0.5 font-medium"
        style={{ color: "var(--text-4)" }}
      >
        {label}
      </p>
      <p className="text-[12px]" style={{ color: "var(--text-2)" }}>
        {value}
      </p>
    </div>
  );
}

function approverLabel(req: string): string {
  switch (req) {
    case "any": return "Any approver";
    case "accounts": return "Accounts team";
    case "accounts-head": return "Accounts Head";
    case "admin": return "Admin / Owner";
    default: return req;
  }
}
