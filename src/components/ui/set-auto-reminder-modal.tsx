"use client";

/* ═══════════════════════════════════════════════════════════════
   SetAutoReminderModal — per-party simple flow.

   Inspired by Credflow's mobile "Set auto-reminder" pattern: tap a
   party, see a small form, toggle on, done. ~3 fields, ~10 seconds.

   The difference from Credflow: we respect the eligibility lock.
   If the party's verdict is "locked" (on-account exceeds, no
   contact, dead relationship, aggregated ledger, blacklisted), we
   disable the toggle and show the lock reason instead of letting
   the user enable something that would embarrass them.

   The catch-up sweep modal (AutoReminderCatchUpModal) is for the
   first-time master-toggle moment. This modal is for everything
   after — quickly enabling a single party, or flipping one off.
   ═══════════════════════════════════════════════════════════════ */

import { useMemo } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  X,
  Settings,
  Lock,
  CheckCircle2,
  AlertTriangle,
  ArrowUpRight,
  Mail,
  Phone,
} from "lucide-react";
import {
  computePartyEligibility,
  formatINR,
  getPartyContact,
  RECEIVABLES,
  REMINDER_AUTOMATION_DEFAULTS,
} from "@/lib/data";
import { usePartyReminderEnrollment } from "@/lib/use-auto-reminder";

interface SetAutoReminderModalProps {
  open: boolean;
  onClose: () => void;
  /** Party name to configure. Looked up against RECEIVABLES for the
   *  eligibility check. */
  partyName: string;
  /** Called when the user clicks "Advanced settings" — caller routes
   *  to Settings → Reminders for full config. */
  onAdvanced: () => void;
}

export function SetAutoReminderModal({
  open,
  onClose,
  partyName,
  onAdvanced,
}: SetAutoReminderModalProps) {
  // Look up the party + contact. Memoize because party name only
  // changes when the modal is opened from a different row.
  const { party, contact, eligibility } = useMemo(() => {
    const party = RECEIVABLES.find((r) => r.name === partyName);
    const contact = getPartyContact(partyName);
    const eligibility = party
      ? computePartyEligibility(party, REMINDER_AUTOMATION_DEFAULTS)
      : null;
    return { party, contact, eligibility };
  }, [partyName]);

  const verdict = eligibility?.verdict ?? "locked";
  const [enrolled, hasOverride, setEnrolled] = usePartyReminderEnrollment(
    partyName,
    verdict,
  );

  if (!party || !eligibility) return null;

  // Cadence preview: matches the global default for now. Per-party
  // override would live in Advanced (handled by the caller).
  const cadenceLabel = (() => {
    const t = REMINDER_AUTOMATION_DEFAULTS;
    if (t.triggerType === "n-days-after-due") return `${t.triggerOffsetDays}d after due`;
    if (t.triggerType === "n-days-before-due") return `${t.triggerOffsetDays}d before due`;
    if (t.triggerType === "weekly") return "weekly batch";
    return "on invoice create";
  })();

  const accent =
    verdict === "enabled"      ? "var(--green)"  :
    verdict === "needs-review" ? "var(--yellow)" :
                                 "var(--text-4)";

  const Icon =
    verdict === "enabled"      ? CheckCircle2  :
    verdict === "needs-review" ? AlertTriangle :
                                 Lock;

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
                    {partyName}
                  </h3>
                  <p
                    className="text-[10px] mt-0.5 tabular-nums"
                    style={{ color: "var(--text-4)" }}
                  >
                    Net due {formatINR(party.amount)} · oldest {party.days}d overdue
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

              {/* Body */}
              <div className="px-5 py-4 flex flex-col gap-4">
                {/* Eligibility verdict badge */}
                <div
                  className="flex items-center gap-2 px-3 py-2 rounded-md"
                  style={{
                    background: `color-mix(in srgb, ${accent} 8%, var(--bg-primary))`,
                    border: `1px solid color-mix(in srgb, ${accent} 25%, var(--border))`,
                  }}
                >
                  <Icon size={14} style={{ color: accent, flexShrink: 0 }} />
                  <div className="min-w-0 flex-1">
                    <p
                      className="text-[11px] font-bold"
                      style={{ color: "var(--text-1)" }}
                    >
                      {verdict === "enabled"
                        ? "Ready to auto-remind"
                        : verdict === "needs-review"
                        ? "Needs your call"
                        : "Locked — manual only"}
                    </p>
                    <p
                      className="text-[10px] mt-0.5"
                      style={{ color: "var(--text-3)" }}
                    >
                      {eligibility.label}
                    </p>
                  </div>
                </div>

                {/* Contact summary (read-only, links to contact manager
                    for editing). Mirrors Credflow's "Contact Details *"
                    section but compressed since we already have a
                    multi-contact manager elsewhere. */}
                <div>
                  <p
                    className="text-[10px] uppercase tracking-wider font-semibold mb-1.5"
                    style={{ color: "var(--text-4)" }}
                  >
                    Contact
                  </p>
                  <div
                    className="rounded-md p-2.5 flex flex-col gap-1"
                    style={{
                      background: "var(--bg-primary)",
                      border: "1px solid var(--border)",
                    }}
                  >
                    {contact.email ? (
                      <div className="flex items-center gap-2">
                        <Mail size={11} style={{ color: "var(--text-4)" }} />
                        <p
                          className="text-[11px] truncate"
                          style={{ color: "var(--text-2)" }}
                        >
                          {contact.email}
                        </p>
                      </div>
                    ) : null}
                    {contact.phone ? (
                      <div className="flex items-center gap-2">
                        <Phone size={11} style={{ color: "var(--text-4)" }} />
                        <p
                          className="text-[11px] tabular-nums"
                          style={{ color: "var(--text-2)" }}
                        >
                          {contact.phone}
                        </p>
                        <span
                          className="text-[9px] font-semibold uppercase tracking-wider px-1 py-px rounded"
                          style={{
                            color: "var(--green)",
                            background:
                              "color-mix(in srgb, var(--green) 12%, transparent)",
                          }}
                        >
                          WhatsApp
                        </span>
                      </div>
                    ) : null}
                    {!contact.email && !contact.phone && (
                      <p
                        className="text-[11px] italic"
                        style={{ color: "var(--text-4)" }}
                      >
                        No phone or email on file.
                      </p>
                    )}
                  </div>
                </div>

                {/* The toggle — disabled when locked. */}
                <div
                  className="flex items-center justify-between gap-3 px-3 py-3 rounded-md"
                  style={{
                    background: "var(--bg-primary)",
                    border: "1px solid var(--border)",
                  }}
                >
                  <div className="min-w-0 flex-1">
                    <p
                      className="text-[12px] font-semibold"
                      style={{
                        color: verdict === "locked" ? "var(--text-4)" : "var(--text-1)",
                      }}
                    >
                      Auto-reminder
                    </p>
                    <p
                      className="text-[10px] mt-0.5"
                      style={{ color: "var(--text-4)" }}
                    >
                      {verdict === "locked"
                        ? "Can't enable — see lock reason above"
                        : enrolled
                        ? `On · Email + SMS · ${cadenceLabel}`
                        : `Off · would send Email + SMS · ${cadenceLabel}`}
                    </p>
                  </div>

                  {/* Switch */}
                  <button
                    type="button"
                    role="switch"
                    aria-checked={enrolled}
                    aria-label={enrolled ? "Turn off auto-reminders" : "Turn on auto-reminders"}
                    disabled={verdict === "locked"}
                    onClick={() => setEnrolled(!enrolled)}
                    className="relative inline-flex h-6 w-11 items-center rounded-full transition-colors flex-shrink-0 disabled:opacity-50 disabled:cursor-not-allowed"
                    style={{
                      background: enrolled ? "var(--green)" : "var(--bg-hover)",
                      border: `1px solid ${
                        enrolled
                          ? "color-mix(in srgb, var(--green) 60%, transparent)"
                          : "var(--border)"
                      }`,
                      cursor: verdict === "locked" ? "not-allowed" : "pointer",
                    }}
                  >
                    <motion.span
                      className="inline-block h-4 w-4 rounded-full shadow-md"
                      style={{ background: "#fff" }}
                      animate={{ x: enrolled ? 22 : 2 }}
                      transition={{ type: "spring", stiffness: 500, damping: 30 }}
                    />
                  </button>
                </div>

                {/* Override badge when user explicitly overrode the
                    eligibility default. Lets them see "I changed this
                    from the default." */}
                {hasOverride && verdict !== "locked" && (
                  <p
                    className="text-[10px] italic"
                    style={{ color: "var(--text-4)" }}
                  >
                    You&apos;ve overridden the default for this party.
                  </p>
                )}

                {/* Advanced link */}
                <button
                  onClick={onAdvanced}
                  className="flex items-center justify-center gap-1.5 text-[11px] font-medium cursor-pointer"
                  style={{ color: "var(--blue)" }}
                >
                  <Settings size={11} />
                  Advanced settings
                  <ArrowUpRight size={10} />
                </button>
              </div>

              {/* Footer */}
              <div
                className="px-5 py-3 flex items-center justify-end gap-2"
                style={{ borderTop: "1px solid var(--border)" }}
              >
                <button
                  onClick={onClose}
                  className="text-[12px] font-semibold px-4 py-2 rounded-md cursor-pointer"
                  style={{
                    background: "var(--green)",
                    color: "#fff",
                  }}
                >
                  Done
                </button>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
