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

import { useMemo, useState, useEffect } from "react";
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
  ChevronDown,
  MessageCircle,
  MessageSquare,
  User,
  Info,
} from "lucide-react";
import {
  computePartyEligibility,
  formatINR,
  getPartyContact,
  RECEIVABLES,
  REMINDER_AUTOMATION_DEFAULTS,
  type ReminderChannel,
} from "@/lib/data";
import { usePartyReminderEnrollment } from "@/lib/use-auto-reminder";
import {
  usePartyReminderOverridesMap,
  type PartyReminderOverride,
} from "@/lib/use-party-reminder-overrides";
import { TEAM_MEMBERS } from "@/lib/rbac";

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

  // Per-party advanced overrides (Credflow-style Advance Settings).
  // Local state mirrors the persisted override so the operator can
  // edit, see live updates in the body, and save when done.
  const [overrideMap, setOverride] = usePartyReminderOverridesMap();
  const persisted: PartyReminderOverride = overrideMap[partyName] ?? {};
  const [advancedOpen, setAdvancedOpen] = useState(false);
  const [draftPaymentTerms, setDraftPaymentTerms] = useState<string>("");
  const [draftFrequency, setDraftFrequency] = useState<string>("");
  const [draftChannels, setDraftChannels] = useState<ReminderChannel[]>([]);
  const [draftAccountManager, setDraftAccountManager] = useState<string>("");
  const [showPaymentTermsHelp, setShowPaymentTermsHelp] = useState(false);

  // Re-seed drafts whenever the modal opens for a different party so
  // we don't show stale state from the previous edit.
  useEffect(() => {
    if (!open) return;
    setDraftPaymentTerms(
      persisted.paymentTermsDays != null
        ? String(persisted.paymentTermsDays)
        : party?.paymentTermsDays != null
        ? String(party.paymentTermsDays)
        : "",
    );
    setDraftFrequency(
      persisted.frequencyDays != null ? String(persisted.frequencyDays) : "",
    );
    setDraftChannels(persisted.channels ?? []);
    setDraftAccountManager(persisted.accountManagerId ?? "");
    // Auto-open Advanced if the party already has an override saved
    setAdvancedOpen(
      !!(persisted.paymentTermsDays ||
        persisted.frequencyDays ||
        (persisted.channels && persisted.channels.length > 0) ||
        persisted.accountManagerId),
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, partyName]);

  if (!party || !eligibility) return null;

  const toggleChannel = (ch: ReminderChannel) => {
    setDraftChannels((prev) =>
      prev.includes(ch) ? prev.filter((c) => c !== ch) : [...prev, ch],
    );
  };

  const handleSaveAdvanced = () => {
    const next: PartyReminderOverride = {};
    const ptd = parseInt(draftPaymentTerms, 10);
    if (!isNaN(ptd) && ptd > 0) next.paymentTermsDays = ptd;
    const fd = parseInt(draftFrequency, 10);
    if (!isNaN(fd) && fd > 0) next.frequencyDays = fd;
    if (draftChannels.length > 0) next.channels = draftChannels;
    if (draftAccountManager) next.accountManagerId = draftAccountManager;
    setOverride(partyName, next);
  };

  const hasAdvancedOverrides =
    persisted.paymentTermsDays != null ||
    persisted.frequencyDays != null ||
    (persisted.channels && persisted.channels.length > 0) ||
    !!persisted.accountManagerId;

  // Cadence preview: matches the global default for now. Per-party
  // override would live in Advanced (handled by the caller).
  const cadenceLabel = (() => {
    const t = REMINDER_AUTOMATION_DEFAULTS;
    if (t.triggerType === "n-days-after-due") return `${t.triggerOffsetDays}d after due`;
    if (t.triggerType === "n-days-before-due") return `${t.triggerOffsetDays}d before due`;
    if (t.triggerType === "weekly") return "weekly batch";
    if (t.triggerType === "monthly") {
      const d = t.triggerDayOfMonth;
      const s = ["th", "st", "nd", "rd"];
      const v = d % 100;
      const ord = d + (s[(v - 20) % 10] ?? s[v] ?? s[0]);
      return `monthly · ${ord}`;
    }
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

                {/* Per-party Advance Settings — Credflow-style expander.
                    Opens inline (not navigating away) so the operator can
                    set party-specific overrides for payment terms,
                    cadence, channels, and account manager without
                    leaving the row. Auto-opens when the party already
                    has at least one override persisted. */}
                <div
                  className="rounded-md overflow-hidden"
                  style={{
                    background: "var(--bg-primary)",
                    border: "1px solid var(--border)",
                  }}
                >
                  <div className="flex items-center justify-between px-3 py-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setAdvancedOpen((o) => !o)}
                      aria-expanded={advancedOpen}
                      className="flex items-center gap-2 min-w-0 cursor-pointer text-left flex-1"
                    >
                      <ChevronDown
                        size={12}
                        style={{
                          color: "var(--text-3)",
                          transform: advancedOpen ? "rotate(0deg)" : "rotate(-90deg)",
                          transition: "transform 200ms",
                          flexShrink: 0,
                        }}
                      />
                      <Settings size={11} style={{ color: "var(--text-3)" }} />
                      <span className="text-[11.5px] font-semibold" style={{ color: "var(--text-1)" }}>
                        Advance settings
                      </span>
                      {hasAdvancedOverrides && (
                        <span
                          className="text-[9px] uppercase tracking-wider font-bold px-1.5 py-0.5 rounded flex-shrink-0"
                          style={{
                            background: "color-mix(in srgb, var(--blue) 14%, transparent)",
                            color: "var(--blue)",
                          }}
                        >
                          Custom
                        </span>
                      )}
                    </button>
                    <button
                      type="button"
                      onClick={onAdvanced}
                      className="flex items-center gap-1 text-[10px] cursor-pointer hover:underline"
                      style={{ color: "var(--text-4)" }}
                      title="Open global Settings → Reminders"
                    >
                      Global
                      <ArrowUpRight size={9} />
                    </button>
                  </div>

                  <AnimatePresence initial={false}>
                    {advancedOpen && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.18 }}
                        style={{ overflow: "hidden" }}
                      >
                        <div
                          className="px-3 py-3 flex flex-col gap-3"
                          style={{ borderTop: "1px solid var(--border)" }}
                        >
                          {/* Payment terms override — with Tally-priority
                              help tooltip (Credflow pattern). Makes the
                              fallback ladder explicit so the operator
                              knows Tally always wins. */}
                          <div className="flex flex-col gap-1.5">
                            <div className="flex items-center justify-between gap-2">
                              <label
                                className="flex items-center gap-1 text-[10.5px] font-medium"
                                style={{ color: "var(--text-3)" }}
                                htmlFor="adv-payment-terms"
                              >
                                Payment terms (days)
                                <button
                                  type="button"
                                  onClick={() => setShowPaymentTermsHelp((v) => !v)}
                                  aria-label="What is the priority order?"
                                  className="cursor-pointer"
                                  style={{ color: "var(--text-4)" }}
                                >
                                  <Info size={11} />
                                </button>
                              </label>
                              <input
                                id="adv-payment-terms"
                                type="number"
                                min={1}
                                max={365}
                                placeholder={String(party.paymentTermsDays ?? 45)}
                                value={draftPaymentTerms}
                                onChange={(e) => setDraftPaymentTerms(e.target.value)}
                                className="w-20 text-[11.5px] font-semibold px-2 py-1 rounded-md tabular-nums text-right"
                                style={{
                                  background: "var(--bg-surface)",
                                  color: "var(--text-1)",
                                  border: "1px solid var(--border)",
                                }}
                              />
                            </div>
                            <AnimatePresence initial={false}>
                              {showPaymentTermsHelp && (
                                <motion.div
                                  initial={{ height: 0, opacity: 0 }}
                                  animate={{ height: "auto", opacity: 1 }}
                                  exit={{ height: 0, opacity: 0 }}
                                  transition={{ duration: 0.18 }}
                                  style={{ overflow: "hidden" }}
                                >
                                  <div
                                    className="rounded-md p-2.5 text-[10.5px] leading-relaxed"
                                    style={{
                                      background: "color-mix(in srgb, var(--blue) 8%, transparent)",
                                      border: "1px solid color-mix(in srgb, var(--blue) 22%, transparent)",
                                      color: "var(--text-2)",
                                    }}
                                  >
                                    <p className="font-semibold mb-1" style={{ color: "var(--blue)" }}>
                                      Tally is the source of truth.
                                    </p>
                                    <p className="mb-1.5">Priority when resolving payment terms:</p>
                                    <ol className="list-decimal list-inside space-y-0.5">
                                      <li>Voucher-level terms on the invoice in Tally</li>
                                      <li>Ledger-level terms on the party master in Tally</li>
                                      <li>This per-party override (set here)</li>
                                      <li>Global fallback (
                                        <strong>{REMINDER_AUTOMATION_DEFAULTS.paymentTermsFallbackDays}d</strong>)
                                      </li>
                                    </ol>
                                    <p
                                      className="mt-1.5 italic"
                                      style={{ color: "var(--text-3)" }}
                                    >
                                      To change a due date already set in Tally, change it in Tally — Riko respects the voucher.
                                    </p>
                                  </div>
                                </motion.div>
                              )}
                            </AnimatePresence>
                          </div>

                          {/* Frequency override */}
                          <div className="flex items-center justify-between gap-2">
                            <label
                              className="text-[10.5px] font-medium"
                              style={{ color: "var(--text-3)" }}
                              htmlFor="adv-frequency"
                            >
                              Reminder frequency (days)
                            </label>
                            <input
                              id="adv-frequency"
                              type="number"
                              min={1}
                              max={60}
                              placeholder={String(REMINDER_AUTOMATION_DEFAULTS.defaultFrequencyDays)}
                              value={draftFrequency}
                              onChange={(e) => setDraftFrequency(e.target.value)}
                              className="w-20 text-[11.5px] font-semibold px-2 py-1 rounded-md tabular-nums text-right"
                              style={{
                                background: "var(--bg-surface)",
                                color: "var(--text-1)",
                                border: "1px solid var(--border)",
                              }}
                            />
                          </div>

                          {/* Channel preferences */}
                          <div>
                            <p
                              className="text-[10.5px] font-medium mb-1.5"
                              style={{ color: "var(--text-3)" }}
                            >
                              Primary channels for this party
                            </p>
                            <div className="flex items-center gap-1.5 flex-wrap">
                              {([
                                { id: "whatsapp" as const, label: "WhatsApp", Icon: MessageCircle },
                                { id: "email" as const, label: "Email", Icon: Mail },
                                { id: "sms" as const, label: "SMS", Icon: MessageSquare },
                              ]).map(({ id, label, Icon: ChIcon }) => {
                                const active = draftChannels.includes(id);
                                return (
                                  <button
                                    key={id}
                                    type="button"
                                    onClick={() => toggleChannel(id)}
                                    className="text-[10.5px] font-medium px-2 py-1 rounded-md cursor-pointer flex items-center gap-1.5"
                                    style={{
                                      background: active
                                        ? "color-mix(in srgb, var(--green) 12%, transparent)"
                                        : "var(--bg-surface)",
                                      color: active ? "var(--green)" : "var(--text-3)",
                                      border: `1px solid ${active ? "color-mix(in srgb, var(--green) 35%, transparent)" : "var(--border)"}`,
                                    }}
                                  >
                                    <ChIcon size={10} />
                                    {label}
                                  </button>
                                );
                              })}
                            </div>
                            {draftChannels.length === 0 && (
                              <p
                                className="text-[9.5px] italic mt-1"
                                style={{ color: "var(--text-4)" }}
                              >
                                Empty = use global default channels
                              </p>
                            )}
                          </div>

                          {/* Account Manager */}
                          <div className="flex items-center justify-between gap-2">
                            <label
                              className="flex items-center gap-1.5 text-[10.5px] font-medium"
                              style={{ color: "var(--text-3)" }}
                              htmlFor="adv-account-manager"
                            >
                              <User size={11} />
                              Account manager
                            </label>
                            <select
                              id="adv-account-manager"
                              value={draftAccountManager}
                              onChange={(e) => setDraftAccountManager(e.target.value)}
                              className="text-[11.5px] px-2 py-1 rounded-md cursor-pointer max-w-[160px] truncate"
                              style={{
                                background: "var(--bg-surface)",
                                color: "var(--text-1)",
                                border: "1px solid var(--border)",
                              }}
                            >
                              <option value="">Unassigned</option>
                              {TEAM_MEMBERS.filter((m) => m.status === "active").map((m) => (
                                <option key={m.id} value={m.id}>
                                  {m.name} · {m.role}
                                </option>
                              ))}
                            </select>
                          </div>

                          <button
                            type="button"
                            onClick={handleSaveAdvanced}
                            className="text-[11px] font-semibold px-3 py-1.5 rounded-md cursor-pointer self-end"
                            style={{
                              background: "var(--blue)",
                              color: "#fff",
                            }}
                          >
                            Save overrides
                          </button>

                          <p
                            className="text-[9.5px] italic"
                            style={{ color: "var(--text-4)" }}
                          >
                            Empty fields fall back to global defaults at send time.
                          </p>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
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
