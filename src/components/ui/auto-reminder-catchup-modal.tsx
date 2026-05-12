"use client";

/* ═══════════════════════════════════════════════════════════════
   AutoReminderCatchUpModal — first-time toggle ON moment.

   When the founder flips Auto Reminders from OFF to ON, the system
   evaluates every party against the eligibility rules (defined in
   data.ts via computePartyEligibility) and presents three buckets:

   1. AUTO-ENROLL — clean active relationships, default checked.
   2. NEEDS REVIEW — flagged for one reason (stale, on-account
      partially significant, old but known payer). Default unchecked;
      user opts in per party.
   3. LOCKED — can't auto-remind from here. Either no contact, on-
      account exceeds outstanding (contra needs reconciliation in
      Tally first), aggregated ledger, or dead relationship. Shown
      for visibility — surfaces the reconciliation work.

   The user reviews, checks any review-bucket parties they want
   included, and commits. Per-party flags persist via the
   useAutoReminderEnabled hook's localStorage layer.

   Built around Tally's reality: net outstanding = Tally closing
   balance, on-account = unmatched receipts (a reconciliation
   smell, not a credit). Locks surface the reconciliation work
   rather than just hiding it.
   ═══════════════════════════════════════════════════════════════ */

import { useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  X,
  CheckCircle2,
  AlertTriangle,
  Lock,
  ChevronRight,
  ChevronDown,
  ExternalLink,
} from "lucide-react";
import {
  computeCatchUpBuckets,
  formatINR,
  REMINDER_AUTOMATION_DEFAULTS,
  type PartyEligibility,
} from "@/lib/data";

interface CatchUpModalProps {
  open: boolean;
  onClose: () => void;
  /** Called with the set of party names the user committed to auto-remind.
   *  Caller persists the per-party flags via the useAutoReminderEnabled
   *  hook (or its successor that tracks per-party state). */
  onCommit: (enrolledPartyNames: string[]) => void;
}

export function AutoReminderCatchUpModal({
  open,
  onClose,
  onCommit,
}: CatchUpModalProps) {
  const buckets = useMemo(
    () => computeCatchUpBuckets(REMINDER_AUTOMATION_DEFAULTS),
    [],
  );

  // Selection state per bucket. Auto-enroll starts all checked; review
  // starts all unchecked. Locked has no selection (read-only).
  const [autoSelected, setAutoSelected] = useState<Set<string>>(
    () => new Set(buckets.autoEnroll.map((p) => p.partyName)),
  );
  const [reviewSelected, setReviewSelected] = useState<Set<string>>(
    () => new Set(),
  );

  // Section expanded state — auto and review open by default, locked
  // collapsed (it's contextual / read-only).
  const [autoOpen, setAutoOpen] = useState(true);
  const [reviewOpen, setReviewOpen] = useState(true);
  const [lockedOpen, setLockedOpen] = useState(false);

  const totalEnrolled = autoSelected.size + reviewSelected.size;
  const totalCollectible = useMemo(() => {
    const inEnrolledSet = (e: PartyEligibility) =>
      autoSelected.has(e.partyName) || reviewSelected.has(e.partyName);
    return [...buckets.autoEnroll, ...buckets.needsReview]
      .filter(inEnrolledSet)
      .reduce((s, e) => s + e.netOutstanding, 0);
  }, [autoSelected, reviewSelected, buckets]);

  const toggleAuto = (name: string) => {
    setAutoSelected((prev) => {
      const next = new Set(prev);
      if (next.has(name)) next.delete(name);
      else next.add(name);
      return next;
    });
  };
  const toggleReview = (name: string) => {
    setReviewSelected((prev) => {
      const next = new Set(prev);
      if (next.has(name)) next.delete(name);
      else next.add(name);
      return next;
    });
  };

  const handleCommit = () => {
    onCommit([...autoSelected, ...reviewSelected]);
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
              className="w-full max-w-2xl rounded-lg overflow-hidden pointer-events-auto flex flex-col"
              style={{
                background: "var(--bg-surface)",
                border: "1px solid var(--border)",
                boxShadow: "0 24px 60px rgba(0,0,0,0.5)",
                maxHeight: "90vh",
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
                    className="text-base font-bold"
                    style={{ color: "var(--text-1)" }}
                  >
                    Turn on auto-reminders
                  </h3>
                  <p
                    className="text-[11px] mt-0.5"
                    style={{ color: "var(--text-3)" }}
                  >
                    Riko bucketed your{" "}
                    {buckets.autoEnroll.length +
                      buckets.needsReview.length +
                      buckets.locked.length}{" "}
                    parties from Tally. Confirm who we should chase. You can
                    change any party later.
                  </p>
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

              {/* Body — three bucket sections */}
              <div className="px-5 py-4 flex-1 overflow-y-auto">
                {/* AUTO-ENROLL */}
                <BucketSection
                  variant="auto"
                  open={autoOpen}
                  onToggleOpen={() => setAutoOpen((v) => !v)}
                  title="Ready to auto-remind"
                  subtitle="Active relationships, has contact, recent activity."
                  count={buckets.autoEnroll.length}
                  amount={buckets.autoEnroll.reduce(
                    (s, e) => s + e.netOutstanding,
                    0,
                  )}
                  parties={buckets.autoEnroll}
                  selected={autoSelected}
                  onToggle={toggleAuto}
                />

                {/* NEEDS REVIEW */}
                {buckets.needsReview.length > 0 && (
                  <BucketSection
                    variant="review"
                    open={reviewOpen}
                    onToggleOpen={() => setReviewOpen((v) => !v)}
                    title="Needs your call"
                    subtitle="Flagged for one reason. Check the ones you want included."
                    count={buckets.needsReview.length}
                    amount={buckets.needsReview.reduce(
                      (s, e) => s + e.netOutstanding,
                      0,
                    )}
                    parties={buckets.needsReview}
                    selected={reviewSelected}
                    onToggle={toggleReview}
                  />
                )}

                {/* LOCKED */}
                {buckets.locked.length > 0 && (
                  <BucketSection
                    variant="locked"
                    open={lockedOpen}
                    onToggleOpen={() => setLockedOpen((v) => !v)}
                    title="Stays manual"
                    subtitle={`No auto-reminders. ${formatINR(buckets.totals.unallocatedOnAccount)} of unallocated receipts in Tally across these — reconcile to unblock.`}
                    count={buckets.locked.length}
                    amount={buckets.locked.reduce(
                      (s, e) => s + e.netOutstanding,
                      0,
                    )}
                    parties={buckets.locked}
                    selected={new Set()}
                    onToggle={() => {}}
                  />
                )}
              </div>

              {/* Footer — sticky commit bar */}
              <div
                className="px-5 py-3 flex items-center justify-between gap-3"
                style={{ borderTop: "1px solid var(--border)" }}
              >
                <div className="min-w-0">
                  <p
                    className="text-[11px] font-semibold"
                    style={{ color: "var(--text-2)" }}
                  >
                    {totalEnrolled} {totalEnrolled === 1 ? "party" : "parties"}
                    {" will be auto-reminded"}
                  </p>
                  <p
                    className="text-[10px] tabular-nums"
                    style={{ color: "var(--text-4)" }}
                  >
                    {formatINR(totalCollectible)} collectible · sends Email + SMS via MSG91
                  </p>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <button
                    onClick={onClose}
                    className="text-[12px] font-semibold px-3 py-2 rounded-md cursor-pointer"
                    style={{
                      color: "var(--text-3)",
                      background: "var(--bg-hover)",
                    }}
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleCommit}
                    disabled={totalEnrolled === 0}
                    className="flex items-center gap-1.5 text-[12px] font-semibold px-4 py-2 rounded-md cursor-pointer disabled:opacity-50"
                    style={{ background: "var(--green)", color: "#fff" }}
                  >
                    Start reminding {totalEnrolled || ""}
                    <ChevronRight size={13} />
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

/* ── Per-bucket collapsible section ─────────────────────────────── */
function BucketSection({
  variant,
  open,
  onToggleOpen,
  title,
  subtitle,
  count,
  amount,
  parties,
  selected,
  onToggle,
}: {
  variant: "auto" | "review" | "locked";
  open: boolean;
  onToggleOpen: () => void;
  title: string;
  subtitle: string;
  count: number;
  amount: number;
  parties: PartyEligibility[];
  selected: Set<string>;
  onToggle: (name: string) => void;
}) {
  const accent =
    variant === "auto"   ? "var(--green)"  :
    variant === "review" ? "var(--yellow)" :
                           "var(--text-4)";

  const Icon =
    variant === "auto"   ? CheckCircle2  :
    variant === "review" ? AlertTriangle :
                           Lock;

  return (
    <div className="mb-3 last:mb-0">
      <button
        onClick={onToggleOpen}
        className="w-full flex items-center gap-2.5 py-2.5 px-3 rounded-md cursor-pointer transition-colors"
        style={{
          background: `color-mix(in srgb, ${accent} 5%, var(--bg-surface))`,
          border: `1px solid color-mix(in srgb, ${accent} 25%, var(--border))`,
        }}
      >
        <Icon size={14} style={{ color: accent, flexShrink: 0 }} />
        <div className="flex-1 min-w-0 text-left">
          <p className="text-[12px] font-bold" style={{ color: "var(--text-1)" }}>
            {title}{" "}
            <span
              className="text-[11px] tabular-nums ml-1"
              style={{ color: accent }}
            >
              · {count} {count === 1 ? "party" : "parties"} · {formatINR(amount)}
            </span>
          </p>
          <p
            className="text-[10px] mt-0.5"
            style={{ color: "var(--text-4)" }}
          >
            {subtitle}
          </p>
        </div>
        <ChevronDown
          size={14}
          style={{
            color: "var(--text-4)",
            transform: open ? "rotate(0deg)" : "rotate(-90deg)",
            transition: "transform 150ms",
            flexShrink: 0,
          }}
        />
      </button>

      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.18 }}
            className="overflow-hidden"
          >
            <div className="pt-2 flex flex-col gap-1.5">
              {parties.map((p) => (
                <PartyRow
                  key={p.partyName}
                  party={p}
                  variant={variant}
                  isSelected={selected.has(p.partyName)}
                  onToggle={() => onToggle(p.partyName)}
                />
              ))}
              {parties.length === 0 && (
                <p
                  className="text-[10px] italic py-2 px-3"
                  style={{ color: "var(--text-4)" }}
                >
                  No parties in this bucket.
                </p>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

/* ── One party row ─────────────────────────────────────────────── */
function PartyRow({
  party,
  variant,
  isSelected,
  onToggle,
}: {
  party: PartyEligibility;
  variant: "auto" | "review" | "locked";
  isSelected: boolean;
  onToggle: () => void;
}) {
  const accent =
    variant === "auto"   ? "var(--green)"  :
    variant === "review" ? "var(--yellow)" :
                           "var(--text-4)";

  const interactive = variant !== "locked";

  return (
    <div
      onClick={interactive ? onToggle : undefined}
      role={interactive ? "checkbox" : undefined}
      aria-checked={isSelected}
      tabIndex={interactive ? 0 : -1}
      onKeyDown={
        interactive
          ? (e) => {
              if (e.key === " " || e.key === "Enter") {
                e.preventDefault();
                onToggle();
              }
            }
          : undefined
      }
      className={`flex items-center gap-2.5 px-3 py-2 rounded-md ${
        interactive ? "cursor-pointer" : "cursor-default"
      } transition-colors`}
      style={{
        background: isSelected
          ? `color-mix(in srgb, ${accent} 8%, transparent)`
          : "var(--bg-primary)",
        border: `1px solid ${
          isSelected
            ? `color-mix(in srgb, ${accent} 35%, transparent)`
            : "var(--border)"
        }`,
      }}
    >
      {/* Checkbox (or lock icon for locked) */}
      {interactive ? (
        <div
          className="w-4 h-4 rounded flex items-center justify-center flex-shrink-0"
          style={{
            background: isSelected ? accent : "transparent",
            border: `1.5px solid ${
              isSelected ? accent : "var(--border)"
            }`,
          }}
        >
          {isSelected && (
            <svg width="9" height="9" viewBox="0 0 9 9" fill="none">
              <path
                d="M1.5 4.5L3.5 6.5L7.5 2.5"
                stroke="#fff"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          )}
        </div>
      ) : (
        <Lock size={12} style={{ color: "var(--text-4)", flexShrink: 0 }} />
      )}

      {/* Party + reason */}
      <div className="flex-1 min-w-0">
        <p
          className="text-[11.5px] font-semibold truncate"
          style={{ color: "var(--text-1)" }}
        >
          {party.partyName}
        </p>
        <p
          className="text-[10px] mt-0.5"
          style={{ color: "var(--text-4)" }}
        >
          {party.label}
        </p>
      </div>

      {/* Amount + days */}
      <div className="text-right flex-shrink-0">
        <p
          className="text-[11px] font-bold tabular-nums"
          style={{
            color: "var(--text-1)",
            fontFamily: "'Space Grotesk', sans-serif",
          }}
        >
          {formatINR(party.netOutstanding)}
        </p>
        <p
          className="text-[9.5px] mt-0.5 tabular-nums"
          style={{
            color:
              party.oldestUnpaidDays > 120
                ? "var(--red)"
                : party.oldestUnpaidDays > 45
                ? "var(--orange)"
                : "var(--text-4)",
          }}
        >
          {party.oldestUnpaidDays}d overdue
        </p>
      </div>

      {/* Reconciliation deep-link for on-account-exceeds locks.
         No write-back to Tally in v1 — this is read-only "open in Tally"
         for the user to do the Bill-Wise Receipt allocation manually. */}
      {variant === "locked" && party.reason === "on-account-exceeds" && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            // In production: deep-link to Tally Bill-Wise Receipt screen
            // for this party. For now, just log the intent.
            console.info(
              `[reconcile] open Tally Bill-Wise Receipt for ${party.partyName}`,
            );
          }}
          className="flex items-center gap-1 text-[10px] font-medium px-2 py-1 rounded cursor-pointer flex-shrink-0"
          style={{
            background: "color-mix(in srgb, var(--blue) 10%, transparent)",
            color: "var(--blue)",
            border:
              "1px solid color-mix(in srgb, var(--blue) 25%, transparent)",
          }}
          title="Open this party's Bill-Wise Receipt screen in Tally to allocate the unmatched receipts."
        >
          Reconcile <ExternalLink size={9} />
        </button>
      )}
    </div>
  );
}

