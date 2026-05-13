"use client";

/* ═══════════════════════════════════════════════════════════════
   LedgerPickerModal — Biz Analyst-style flat-list multi-select.

   The bucketed AutoReminderCatchUpModal is great for first-time
   review (it teaches the operator WHY some parties are locked),
   but for everyday "add these 10 parties to auto-reminder" the
   flat list with search + select-all-applicable + per-row
   eligibility lock is faster.

   Per row:
   - Checkbox (disabled when locked, with lock reason inline)
   - Party name + amount + days overdue
   - Eligibility lock copy in red when applicable
     (mirrors Biz Analyst's "No Email Address found for ledger")

   Footer:
   - "X of N selected · Y locked · M eligible"
   - "Select All Applicable" / "Unselect All"
   - Save button persists each party's enrollment via
     usePartyReminderEnrollment-equivalent direct localStorage writes
     (we use the existing storage key + custom event to stay in sync).
   ═══════════════════════════════════════════════════════════════ */

import { useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { X, Search, Lock, CheckCircle2, AlertTriangle } from "lucide-react";
import {
  computePartyEligibility,
  formatINR,
  getPartyContact,
  RECEIVABLES,
  REMINDER_AUTOMATION_DEFAULTS,
} from "@/lib/data";

// Direct storage write — same keys as usePartyReminderEnrollment so
// the modal's state stays in sync with the per-row toggle pattern.
const PARTY_STORAGE_KEY = "riko:party-reminder-enrollment";
const PARTY_EVENT_NAME = "riko:party-reminder-changed";

function readEnrollmentMap(): Record<string, boolean> {
  if (typeof window === "undefined") return {};
  try {
    const raw = window.localStorage.getItem(PARTY_STORAGE_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw);
    return typeof parsed === "object" && parsed !== null ? parsed : {};
  } catch {
    return {};
  }
}

function writeEnrollmentMap(map: Record<string, boolean>) {
  try {
    window.localStorage.setItem(PARTY_STORAGE_KEY, JSON.stringify(map));
    window.dispatchEvent(new CustomEvent(PARTY_EVENT_NAME));
  } catch {
    // Silent fail
  }
}

export interface LedgerPickerModalProps {
  open: boolean;
  onClose: () => void;
  /** Called after Save with the count of newly enrolled parties.
   *  Optional — caller can show a toast. */
  onSave?: (enrolledCount: number) => void;
}

export function LedgerPickerModal({
  open,
  onClose,
  onSave,
}: LedgerPickerModalProps) {
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<Set<string>>(new Set());

  // Compute eligibility once per party (memoized — RECEIVABLES is static
  // and defaults don't change during modal lifetime).
  const rows = useMemo(() => {
    return RECEIVABLES.map((party) => {
      const eligibility = computePartyEligibility(party, REMINDER_AUTOMATION_DEFAULTS);
      const contact = getPartyContact(party.name);
      return { party, eligibility, contact };
    });
  }, []);

  // Re-seed selected state when the modal opens. Pull current
  // enrollment map and check parties already enabled.
  useEffect(() => {
    if (!open) return;
    const enrollment = readEnrollmentMap();
    const initial = new Set<string>();
    rows.forEach(({ party, eligibility }) => {
      // A party counts as "selected" if explicitly enrolled OR if it's
      // an auto-enroll default and not explicitly opted out.
      const hasExplicit = Object.prototype.hasOwnProperty.call(enrollment, party.name);
      const explicitValue = enrollment[party.name];
      if (eligibility.verdict === "locked") return; // never selected
      if (hasExplicit) {
        if (explicitValue) initial.add(party.name);
      } else if (eligibility.verdict === "enabled") {
        initial.add(party.name);
      }
    });
    setSelected(initial);
    setSearch("");
  }, [open, rows]);

  // Search filter — case-insensitive name match.
  const filteredRows = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return rows;
    return rows.filter(({ party }) => party.name.toLowerCase().includes(q));
  }, [rows, search]);

  // Stats for the footer.
  const stats = useMemo(() => {
    const lockedCount = rows.filter((r) => r.eligibility.verdict === "locked").length;
    const eligibleCount = rows.length - lockedCount;
    return { lockedCount, eligibleCount, total: rows.length };
  }, [rows]);

  const toggle = (partyName: string, locked: boolean) => {
    if (locked) return;
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(partyName)) next.delete(partyName);
      else next.add(partyName);
      return next;
    });
  };

  const selectAllApplicable = () => {
    const next = new Set<string>();
    rows.forEach(({ party, eligibility }) => {
      if (eligibility.verdict !== "locked") next.add(party.name);
    });
    setSelected(next);
  };

  const unselectAll = () => setSelected(new Set());

  const handleSave = () => {
    // Build new enrollment map: every applicable party gets an explicit
    // boolean — true if selected, false if not. Locked parties keep
    // whatever they had (we never set them to true).
    const current = readEnrollmentMap();
    const updated = { ...current };
    rows.forEach(({ party, eligibility }) => {
      if (eligibility.verdict === "locked") return;
      updated[party.name] = selected.has(party.name);
    });
    writeEnrollmentMap(updated);
    onSave?.(selected.size);
    onClose();
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
            style={{ background: "rgba(0,0,0,0.55)", backdropFilter: "blur(2px)" }}
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
              className="w-full max-w-lg rounded-lg overflow-hidden pointer-events-auto flex flex-col"
              style={{
                background: "var(--bg-surface)",
                border: "1px solid var(--border)",
                boxShadow: "0 24px 60px rgba(0,0,0,0.5)",
                maxHeight: "85vh",
              }}
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header */}
              <div
                className="px-5 py-3 flex items-center justify-between gap-3"
                style={{ borderBottom: "1px solid var(--border)" }}
              >
                <div className="flex items-center gap-2 min-w-0">
                  <h3
                    className="text-sm font-bold truncate"
                    style={{ color: "var(--text-1)" }}
                  >
                    Auto-reminder · Pick parties
                  </h3>
                  <span
                    className="text-[10px] uppercase tracking-wider font-bold px-1.5 py-0.5 rounded flex-shrink-0"
                    style={{
                      background: "color-mix(in srgb, var(--green) 14%, transparent)",
                      color: "var(--green)",
                    }}
                  >
                    {selected.size} / {stats.eligibleCount}
                  </span>
                </div>
                <div className="flex items-center gap-1.5 flex-shrink-0">
                  <button
                    type="button"
                    onClick={selectAllApplicable}
                    className="text-[10.5px] font-semibold cursor-pointer hover:underline"
                    style={{ color: "var(--blue)" }}
                  >
                    Select all applicable
                  </button>
                  <span style={{ color: "var(--text-4)" }}>·</span>
                  <button
                    type="button"
                    onClick={unselectAll}
                    className="text-[10.5px] font-semibold cursor-pointer hover:underline"
                    style={{ color: "var(--text-3)" }}
                  >
                    Unselect all
                  </button>
                  <button
                    onClick={onClose}
                    className="p-1 rounded-md cursor-pointer flex-shrink-0"
                    style={{ color: "var(--text-3)" }}
                    aria-label="Close"
                  >
                    <X size={14} />
                  </button>
                </div>
              </div>

              {/* Search */}
              <div
                className="px-4 py-2 flex items-center gap-2"
                style={{ borderBottom: "1px solid var(--border)" }}
              >
                <Search size={12} style={{ color: "var(--text-4)" }} />
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search parties…"
                  className="flex-1 text-[12px] bg-transparent outline-none"
                  style={{ color: "var(--text-1)" }}
                />
                {search && (
                  <button
                    onClick={() => setSearch("")}
                    className="text-[10px] cursor-pointer"
                    style={{ color: "var(--text-4)" }}
                  >
                    Clear
                  </button>
                )}
              </div>

              {/* Body — scrollable list */}
              <div
                className="flex-1 overflow-y-auto"
                style={{ background: "var(--bg-primary)" }}
              >
                {filteredRows.length === 0 ? (
                  <div className="px-5 py-8 text-center">
                    <p className="text-[12px]" style={{ color: "var(--text-4)" }}>
                      No parties match &quot;{search}&quot;.
                    </p>
                  </div>
                ) : (
                  filteredRows.map(({ party, eligibility, contact }) => {
                    const locked = eligibility.verdict === "locked";
                    const isSelected = selected.has(party.name);
                    const noEmail = !contact.email;
                    return (
                      <button
                        key={party.name}
                        type="button"
                        onClick={() => toggle(party.name, locked)}
                        disabled={locked}
                        className="w-full text-left px-4 py-2.5 flex items-center gap-3 cursor-pointer disabled:cursor-not-allowed transition-colors"
                        style={{
                          background: isSelected
                            ? "color-mix(in srgb, var(--green) 6%, transparent)"
                            : "transparent",
                          borderBottom: "1px solid var(--border)",
                          opacity: locked ? 0.5 : 1,
                        }}
                      >
                        {/* Checkbox */}
                        <div
                          className="w-4 h-4 rounded border flex items-center justify-center flex-shrink-0"
                          style={{
                            borderColor: locked
                              ? "var(--text-4)"
                              : isSelected
                              ? "var(--green)"
                              : "var(--border)",
                            background: isSelected && !locked ? "var(--green)" : "transparent",
                          }}
                        >
                          {isSelected && !locked && (
                            <span className="text-[9px] text-white">✓</span>
                          )}
                          {locked && <Lock size={9} style={{ color: "var(--text-4)" }} />}
                        </div>

                        {/* Party info */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between gap-2">
                            <span
                              className="text-[12px] font-semibold truncate"
                              style={{ color: "var(--text-1)" }}
                            >
                              {party.name}
                            </span>
                            <span
                              className="text-[10.5px] tabular-nums flex-shrink-0"
                              style={{ color: "var(--text-3)" }}
                            >
                              {formatINR(party.amount)}
                            </span>
                          </div>
                          <div className="flex items-center gap-1.5 mt-0.5">
                            {locked ? (
                              <span
                                className="text-[10px]"
                                style={{
                                  color: noEmail ? "var(--red)" : "var(--text-4)",
                                }}
                              >
                                {noEmail
                                  ? "No email address found for ledger"
                                  : eligibility.label}
                              </span>
                            ) : eligibility.verdict === "needs-review" ? (
                              <span
                                className="text-[10px] flex items-center gap-1"
                                style={{ color: "var(--yellow)" }}
                              >
                                <AlertTriangle size={9} />
                                {eligibility.label}
                              </span>
                            ) : (
                              <span
                                className="text-[10px] flex items-center gap-1"
                                style={{ color: "var(--text-4)" }}
                              >
                                <CheckCircle2 size={9} style={{ color: "var(--green)" }} />
                                {party.days}d overdue · {party.bills} bill{party.bills === 1 ? "" : "s"}
                              </span>
                            )}
                          </div>
                        </div>
                      </button>
                    );
                  })
                )}
              </div>

              {/* Footer */}
              <div
                className="px-5 py-3 flex items-center justify-between gap-3 flex-wrap"
                style={{ borderTop: "1px solid var(--border)" }}
              >
                <p className="text-[10.5px]" style={{ color: "var(--text-4)" }}>
                  <strong style={{ color: "var(--text-2)" }}>{selected.size}</strong> selected
                  {" · "}
                  <strong style={{ color: "var(--text-2)" }}>{stats.eligibleCount}</strong> eligible
                  {stats.lockedCount > 0 && (
                    <>
                      {" · "}
                      <strong style={{ color: "var(--text-4)" }}>{stats.lockedCount}</strong> locked
                    </>
                  )}
                </p>
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
                    disabled={selected.size === 0}
                    className="text-[12px] font-semibold px-4 py-2 rounded-md cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                    style={{ background: "var(--green)", color: "#fff" }}
                  >
                    Save · enroll {selected.size}
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
