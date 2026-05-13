"use client";

/* ═══════════════════════════════════════════════════════════════
   FollowUpModal — inline editor for a party's next follow-up date
   + free-text remark. Forks the visual chrome of SetAutoReminderModal
   so the per-row edit affordances feel like one product.

   Why a modal vs. inline edit:
   - The Outstanding table is dense. An inline date input + textarea
     would blow the row height for the 80% of rows where nothing is
     set. A modal keeps the table compact and matches Credflow's
     "Tasks and History" pattern (which is the closest competing
     UX founders already know).
   - Mobile cards can't reasonably host an inline textarea — same
     modal works there too.

   What persists vs. what doesn't:
   - The modal is dumb: receives `initial`, calls `onSave` with the
     edited values, never touches storage. The caller (Outstanding
     screen) writes through usePartyFollowUpMap to localStorage.
   - "Clear" returns empty strings (not undefined) so the override
     hook can distinguish "user cleared" from "no override set."
   ═══════════════════════════════════════════════════════════════ */

import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { X, Calendar, MessageSquare, Trash2 } from "lucide-react";
import { formatINR } from "@/lib/data";

export interface FollowUpModalProps {
  open: boolean;
  onClose: () => void;
  /** Party name — shown in the header. */
  partyName: string;
  /** Pre-filled values. Empty strings render as empty inputs. */
  initial: {
    nextFollowUpDate?: string;
    remark?: string;
  };
  /** Context shown below the title so the operator knows which
   *  party they're editing. Optional. */
  context?: {
    amount?: number;
    oldestDays?: number;
  };
  /** Called on Save with the edited values. Empty strings mean
   *  "user cleared this field." */
  onSave: (next: { nextFollowUpDate: string; remark: string }) => void;
}

/** Build a yyyy-mm-dd offset from today. Local-time, no UTC drift. */
function dateOffsetDays(days: number): string {
  const d = new Date();
  d.setDate(d.getDate() + days);
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

/** Next Monday (or today if today is Monday). */
function nextMonday(): string {
  const d = new Date();
  const day = d.getDay(); // 0 Sun .. 6 Sat
  const delta = day === 1 ? 0 : (8 - day) % 7;
  return dateOffsetDays(delta || 7);
}

export function FollowUpModal({
  open,
  onClose,
  partyName,
  initial,
  context,
  onSave,
}: FollowUpModalProps) {
  const [date, setDate] = useState(initial.nextFollowUpDate ?? "");
  const [remark, setRemark] = useState(initial.remark ?? "");

  // Reset state whenever the modal opens for a new party — pre-fill
  // with the latest values, not whatever was in state from the last
  // edit.
  useEffect(() => {
    if (open) {
      setDate(initial.nextFollowUpDate ?? "");
      setRemark(initial.remark ?? "");
    }
  }, [open, partyName, initial.nextFollowUpDate, initial.remark]);

  const handleSave = () => {
    onSave({ nextFollowUpDate: date.trim(), remark: remark.trim() });
  };

  const handleClear = () => {
    setDate("");
    setRemark("");
    onSave({ nextFollowUpDate: "", remark: "" });
  };

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="fixed inset-0 z-[80]"
            style={{
              background: "rgba(0,0,0,0.55)",
              backdropFilter: "blur(2px)",
            }}
            onClick={onClose}
          />

          <motion.div
            initial={{ opacity: 0, y: 16, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 12, scale: 0.98 }}
            transition={{ duration: 0.18, ease: "easeOut" }}
            className="fixed inset-0 z-[90] flex items-center justify-center p-4 pointer-events-none"
          >
            <div
              className="w-full max-w-md rounded-lg overflow-hidden pointer-events-auto flex flex-col"
              style={{
                background: "var(--bg-surface)",
                border: "1px solid var(--border)",
                boxShadow: "0 24px 60px rgba(0,0,0,0.5)",
              }}
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header */}
              <div
                className="px-5 py-3 flex items-start justify-between gap-3"
                style={{ borderBottom: "1px solid var(--border)" }}
              >
                <div className="min-w-0">
                  <h3
                    className="text-sm font-bold truncate"
                    style={{ color: "var(--text-1)" }}
                  >
                    Follow-up · {partyName}
                  </h3>
                  {context && (context.amount != null || context.oldestDays != null) && (
                    <p
                      className="text-[10px] mt-0.5 tabular-nums"
                      style={{ color: "var(--text-4)" }}
                    >
                      {context.amount != null && <>Net due {formatINR(context.amount)}</>}
                      {context.amount != null && context.oldestDays != null && <> · </>}
                      {context.oldestDays != null && <>oldest {context.oldestDays}d overdue</>}
                    </p>
                  )}
                </div>
                <button
                  onClick={onClose}
                  className="p-1.5 rounded-md cursor-pointer flex-shrink-0"
                  style={{ color: "var(--text-3)" }}
                  aria-label="Close"
                >
                  <X size={16} />
                </button>
              </div>

              {/* Body */}
              <div className="px-5 py-4 flex flex-col gap-4">
                {/* Next follow-up date */}
                <div>
                  <label
                    className="flex items-center gap-1.5 text-[10px] uppercase tracking-wider font-semibold mb-1.5"
                    style={{ color: "var(--text-4)" }}
                  >
                    <Calendar size={11} />
                    Next follow-up date
                  </label>
                  <input
                    type="date"
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    className="w-full text-[12px] px-3 py-2 rounded-md tabular-nums"
                    style={{
                      background: "var(--bg-primary)",
                      border: "1px solid var(--border)",
                      color: "var(--text-1)",
                      colorScheme: "dark",
                    }}
                  />
                  {/* Quick-pick chips — Credflow doesn't have these,
                      cheap UX win for the operator that just wants
                      "remind me in a week". */}
                  <div className="flex items-center gap-1.5 mt-2 flex-wrap">
                    {[
                      { label: "+3d", iso: dateOffsetDays(3) },
                      { label: "+7d", iso: dateOffsetDays(7) },
                      { label: "+14d", iso: dateOffsetDays(14) },
                      { label: "Next Mon", iso: nextMonday() },
                    ].map((chip) => (
                      <button
                        key={chip.label}
                        type="button"
                        onClick={() => setDate(chip.iso)}
                        className="text-[10.5px] font-medium px-2 py-1 rounded-md cursor-pointer"
                        style={{
                          background:
                            date === chip.iso
                              ? "color-mix(in srgb, var(--blue) 14%, transparent)"
                              : "var(--bg-primary)",
                          color: date === chip.iso ? "var(--blue)" : "var(--text-3)",
                          border:
                            date === chip.iso
                              ? "1px solid color-mix(in srgb, var(--blue) 35%, transparent)"
                              : "1px solid var(--border)",
                        }}
                      >
                        {chip.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Remark */}
                <div>
                  <label
                    className="flex items-center gap-1.5 text-[10px] uppercase tracking-wider font-semibold mb-1.5"
                    style={{ color: "var(--text-4)" }}
                  >
                    <MessageSquare size={11} />
                    Remark
                  </label>
                  <textarea
                    value={remark}
                    onChange={(e) => setRemark(e.target.value)}
                    placeholder="e.g. Promise via WA on 12 May — paying ₹50k by Wed."
                    rows={3}
                    maxLength={200}
                    className="w-full text-[12px] px-3 py-2 rounded-md resize-none"
                    style={{
                      background: "var(--bg-primary)",
                      border: "1px solid var(--border)",
                      color: "var(--text-1)",
                    }}
                  />
                  <p
                    className="text-[9.5px] mt-1 text-right tabular-nums"
                    style={{ color: "var(--text-4)" }}
                  >
                    {remark.length}/200
                  </p>
                </div>
              </div>

              {/* Footer */}
              <div
                className="px-5 py-3 flex items-center justify-between gap-2"
                style={{ borderTop: "1px solid var(--border)" }}
              >
                <button
                  onClick={handleClear}
                  disabled={!date && !remark}
                  className="text-[11px] font-medium flex items-center gap-1 px-2 py-1.5 rounded-md cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
                  style={{ color: "var(--text-4)" }}
                  title="Clear both fields"
                >
                  <Trash2 size={11} />
                  Clear
                </button>
                <div className="flex items-center gap-2">
                  <button
                    onClick={onClose}
                    className="text-[12px] font-semibold px-3 py-2 rounded-md cursor-pointer"
                    style={{
                      background: "transparent",
                      color: "var(--text-3)",
                      border: "1px solid var(--border)",
                    }}
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSave}
                    className="text-[12px] font-semibold px-4 py-2 rounded-md cursor-pointer"
                    style={{
                      background: "var(--green)",
                      color: "#fff",
                    }}
                  >
                    Save
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
