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
  Lock,
  Send,
  Pause,
  Eye,
  ChevronDown,
  CheckCircle2,
  AlertTriangle,
  UserRound,
} from "lucide-react";
import {
  DAYBOOK,
  RECEIVABLES,
  getPartyContact,
  getReminderSettings,
  getPartyReminderHistory,
  recommendTone,
  type ReminderSettings,
  type ReminderChannel,
  type ReminderTone,
  type ReminderStatus,
} from "@/lib/data";
import { MessageTemplateModal } from "./message-template-modal";

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

                  {/* Contact info row (PRD §Priority 3) */}
                  <ContactInfoRow partyName={partyName} />

                  {/* AI Payment Reminder card (PRD §Priority 3 — states A/B/C) */}
                  <AiReminderCard
                    partyName={partyName}
                    outstanding={outstanding}
                    daysOverdue={receivableRow?.days ?? 0}
                  />

                  {/* Reminder history timeline (last 4 + View all) */}
                  <ReminderHistorySection partyName={partyName} />

                  {/* Credit rating */}
                  <div
                    className="rounded-md p-4"
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
                    className="rounded-md overflow-hidden"
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
                    className="rounded-md p-4"
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
                    className="rounded-md p-4"
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
      className="rounded-md p-3"
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

/* ═══════════════════════════════════════════════════════════════
   Contact Info Row — displays phone + email + source tag
   (Tally / Manual / none) with an Edit affordance. Maps to PRD §Priority 3.
   ═══════════════════════════════════════════════════════════════ */
function ContactInfoRow({ partyName }: { partyName: string }) {
  const [editing, setEditing] = useState(false);
  const contact = getPartyContact(partyName);

  if (contact.source === "none" && !editing) {
    return (
      <div
        className="rounded-md p-4 flex items-start justify-between gap-3"
        style={{
          background: "color-mix(in srgb, var(--yellow) 8%, var(--bg-secondary))",
          border: "1px solid color-mix(in srgb, var(--yellow) 25%, transparent)",
        }}
      >
        <div className="flex items-start gap-2 flex-1 min-w-0">
          <AlertTriangle size={14} style={{ color: "var(--yellow)", flexShrink: 0, marginTop: 2 }} />
          <div className="min-w-0">
            <p className="text-xs font-semibold" style={{ color: "var(--text-1)" }}>
              No contact info on file
            </p>
            <p className="text-[11px] mt-0.5" style={{ color: "var(--text-3)" }}>
              Add a mobile number or email to enable reminders for this party — manually below
              or via bulk import on the Outstanding page.
            </p>
          </div>
        </div>
        <button
          onClick={() => setEditing(true)}
          className="flex items-center gap-1 text-[11px] font-semibold px-2.5 py-1.5 rounded-md cursor-pointer flex-shrink-0"
          style={{
            background: "var(--yellow)",
            color: "#1F1F1F",
          }}
        >
          + Add
        </button>
      </div>
    );
  }

  const sourceMeta = {
    tally:  { label: "Tally",  color: "var(--green)" },
    manual: { label: "Manual", color: "var(--blue)"  },
    none:   { label: "—",      color: "var(--text-4)" },
  }[contact.source];

  return (
    <div
      className="rounded-md p-4"
      style={{
        background: "var(--bg-secondary)",
        border: "1px solid var(--border)",
      }}
    >
      <div className="flex items-center justify-between mb-2">
        <p
          className="text-[10px] uppercase tracking-wider font-semibold"
          style={{ color: "var(--text-4)" }}
        >
          Contact
        </p>
        <div className="flex items-center gap-1.5">
          <span
            className="text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded"
            style={{
              background: `color-mix(in srgb, ${sourceMeta.color} 15%, transparent)`,
              color: sourceMeta.color,
            }}
            title={
              contact.source === "tally"
                ? "Synced from Tally party master"
                : "Entered manually (via bulk import or this drawer)"
            }
          >
            {sourceMeta.label}
          </span>
          <button
            onClick={() => setEditing((v) => !v)}
            className="text-[10px] font-semibold px-2 py-0.5 rounded-md cursor-pointer"
            style={{
              background: editing ? "var(--green)" : "var(--bg-hover)",
              color: editing ? "#fff" : "var(--text-3)",
            }}
          >
            {editing ? "Save" : "Edit"}
          </button>
        </div>
      </div>
      {contact.optedOut && (
        <div
          className="flex items-center gap-1.5 text-[10px] font-semibold mb-2 px-2 py-1 rounded-md"
          style={{
            background: "color-mix(in srgb, var(--red) 12%, transparent)",
            color: "var(--red)",
          }}
        >
          <AlertTriangle size={10} />
          Opted out via STOP reply — reminders auto-disabled
        </div>
      )}
      <div className="flex flex-col gap-2">
        <FieldRow
          icon={<Phone size={12} />}
          value={contact.phone ?? "—"}
          placeholder="+91 …"
          editing={editing}
        />
        <FieldRow
          icon={<Mail size={12} />}
          value={contact.email ?? "—"}
          placeholder="name@company.in"
          editing={editing}
        />
        {contact.contactPerson && !editing && (
          <FieldRow
            icon={<UserRound size={12} />}
            value={contact.contactPerson}
            placeholder=""
            editing={false}
          />
        )}
      </div>
    </div>
  );
}

function FieldRow({
  icon,
  value,
  placeholder,
  editing,
}: {
  icon: React.ReactNode;
  value: string;
  placeholder: string;
  editing: boolean;
}) {
  if (editing) {
    return (
      <div className="flex items-center gap-2 text-xs">
        <span style={{ color: "var(--text-4)" }}>{icon}</span>
        <input
          defaultValue={value === "—" ? "" : value}
          placeholder={placeholder}
          className="flex-1 bg-transparent border-0 px-2 py-1.5 text-xs rounded-md outline-none"
          style={{
            color: "var(--text-1)",
            background: "var(--bg-primary)",
            border: "1px solid var(--border)",
          }}
        />
      </div>
    );
  }
  return (
    <div className="flex items-center gap-2 text-xs" style={{ color: "var(--text-2)" }}>
      <span style={{ color: "var(--text-4)" }}>{icon}</span>
      {value}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   AI Reminder Card — 3 states (PRD §Priority 3)
     A. Locked   — no phone on file, greyed toggle, CTA to add contact
     B. Ready    — toggle OFF, one-liner preview, [Configure]
     C. Active   — full control: frequency / channels / tone / pause /
                   Send Now / Preview
   ═══════════════════════════════════════════════════════════════ */

function AiReminderCard({
  partyName,
  outstanding,
  daysOverdue,
}: {
  partyName: string;
  outstanding: number;
  daysOverdue: number;
}) {
  // Demo-only local state — in production wired to reminder_settings table.
  const seed = getReminderSettings(partyName);
  const contact = getPartyContact(partyName);
  const hasPhone = !!contact.phone;
  const canEnable = hasPhone && !contact.optedOut;

  const [enabled, setEnabled] = useState<boolean>(seed?.enabled ?? false);
  const [expanded, setExpanded] = useState<boolean>(!!(seed?.enabled));
  const [frequency, setFrequency] = useState<ReminderSettings["frequencyDays"]>(seed?.frequencyDays ?? 7);
  const [channels, setChannels] = useState<ReminderChannel[]>(seed?.channels ?? ["whatsapp"]);
  const [tone, setTone] = useState<ReminderSettings["tone"]>(seed?.tone ?? "auto");
  const [pauseOpen, setPauseOpen] = useState(false);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToast(msg);
    window.setTimeout(() => setToast(null), 2200);
  };

  const effectiveTone: ReminderTone = tone === "auto" ? recommendTone(daysOverdue) : tone;

  const toggleChannel = (id: ReminderChannel) => {
    setChannels((prev) =>
      prev.includes(id) ? prev.filter((c) => c !== id) : [...prev, id],
    );
  };

  /* STATE A — Locked: no phone, or opted out */
  if (!canEnable) {
    const reason = contact.optedOut
      ? "Party opted out via STOP reply — reminders permanently disabled"
      : "Add a mobile number above to enable reminders";
    return (
      <div
        className="rounded-md p-4 flex items-center gap-3"
        style={{
          background: "var(--bg-secondary)",
          border: "1px solid var(--border)",
          opacity: 0.82,
        }}
      >
        <div
          className="w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0"
          style={{ background: "var(--bg-hover)" }}
        >
          <Lock size={14} style={{ color: "var(--text-4)" }} />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-xs font-semibold" style={{ color: "var(--text-2)" }}>
            AI payment reminder
          </p>
          <p className="text-[11px]" style={{ color: "var(--text-4)" }}>
            {reason}
          </p>
        </div>
        <ToggleSwitch value={false} onChange={() => { /* locked */ }} disabled />
      </div>
    );
  }

  /* STATE B — Ready: can enable but currently off */
  if (!enabled) {
    return (
      <>
        <div
          className="rounded-md p-4"
          style={{
            background: "var(--bg-secondary)",
            border: "1px solid var(--border)",
          }}
        >
          <div className="flex items-center gap-3">
            <div
              className="w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0"
              style={{ background: "color-mix(in srgb, var(--green) 15%, transparent)" }}
            >
              <MessageCircle size={14} style={{ color: "var(--green)" }} />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold" style={{ color: "var(--text-1)" }}>
                AI payment reminder
              </p>
              <p className="text-[11px]" style={{ color: "var(--text-3)" }}>
                Send reminders via <strong>{channels.map((c) => c).join(" + ")}</strong> every{" "}
                <strong>{frequency} days</strong>
              </p>
            </div>
            <ToggleSwitch
              value={false}
              onChange={() => {
                setEnabled(true);
                setExpanded(true);
                showToast("Reminders enabled — next send scheduled");
              }}
            />
          </div>
          <button
            onClick={() => {
              setEnabled(true);
              setExpanded(true);
            }}
            className="text-[11px] font-semibold mt-3 cursor-pointer"
            style={{ color: "var(--green)" }}
          >
            Configure →
          </button>
        </div>
        {toast && <Toast text={toast} />}
      </>
    );
  }

  /* STATE C — Active: full control */
  return (
    <>
      <div
        className="rounded-md p-4"
        style={{
          background: "color-mix(in srgb, var(--green) 5%, var(--bg-secondary))",
          border: "1px solid color-mix(in srgb, var(--green) 30%, transparent)",
        }}
      >
        {/* Header row */}
        <div className="flex items-center gap-3 mb-3">
          <div
            className="w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0"
            style={{ background: "var(--green)" }}
          >
            <MessageCircle size={14} style={{ color: "#fff" }} />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-semibold" style={{ color: "var(--text-1)" }}>
              AI payment reminder · Active
            </p>
            <p className="text-[11px]" style={{ color: "var(--text-3)" }}>
              Next send {seed?.nextReminderAt ?? "in 7 days"} · {seed?.sendsSoFar ?? 0}/
              {seed?.maxReminders ?? 5} sends used
            </p>
          </div>
          <ToggleSwitch
            value
            onChange={() => {
              setEnabled(false);
              setExpanded(false);
              showToast("Reminders paused for this party");
            }}
          />
        </div>

        {/* Configuration rows */}
        {expanded && (
          <div className="flex flex-col gap-3 pt-3" style={{ borderTop: "1px solid color-mix(in srgb, var(--green) 20%, transparent)" }}>
            {/* Frequency */}
            <ConfigRow label="Frequency">
              <select
                value={frequency}
                onChange={(e) =>
                  setFrequency(parseInt(e.target.value, 10) as ReminderSettings["frequencyDays"])
                }
                className="text-[11px] font-semibold px-2 py-1 rounded-md cursor-pointer"
                style={{
                  background: "var(--bg-surface)",
                  color: "var(--text-1)",
                  border: "1px solid var(--border)",
                }}
              >
                {[3, 5, 7, 14, 30].map((d) => (
                  <option key={d} value={d}>
                    Every {d} days
                  </option>
                ))}
              </select>
            </ConfigRow>

            {/* Channels */}
            <ConfigRow label="Channels">
              <div className="flex gap-1">
                {(["whatsapp", "email", "sms"] as ReminderChannel[]).map((ch) => {
                  const on = channels.includes(ch);
                  const Icon = ch === "whatsapp" ? MessageCircle : ch === "email" ? Mail : MessageCircle;
                  const color = ch === "whatsapp" ? "var(--green)" : ch === "email" ? "var(--blue)" : "var(--text-2)";
                  const isEmailEnabled = ch !== "email" || !!contact.email;
                  return (
                    <button
                      key={ch}
                      onClick={() => isEmailEnabled && toggleChannel(ch)}
                      disabled={!isEmailEnabled}
                      className="flex items-center gap-1 text-[10px] font-semibold px-2 py-1 rounded-md cursor-pointer disabled:opacity-40"
                      style={{
                        background: on
                          ? `color-mix(in srgb, ${color} 18%, transparent)`
                          : "var(--bg-hover)",
                        color: on ? color : "var(--text-4)",
                        border: `1px solid ${on ? `color-mix(in srgb, ${color} 35%, transparent)` : "var(--border)"}`,
                      }}
                      title={!isEmailEnabled ? "No email on file" : undefined}
                    >
                      <Icon size={10} /> {ch}
                    </button>
                  );
                })}
              </div>
            </ConfigRow>

            {/* Tone */}
            <ConfigRow label="Tone">
              <div className="flex gap-1">
                {(["auto", "gentle", "standard", "firm", "final"] as const).map((t) => {
                  const on = tone === t;
                  const colorMap: Record<typeof t, string> = {
                    auto: "var(--purple)",
                    gentle: "var(--green)",
                    standard: "var(--blue)",
                    firm: "var(--orange)",
                    final: "var(--red)",
                  };
                  return (
                    <button
                      key={t}
                      onClick={() => setTone(t)}
                      className="text-[10px] font-semibold px-2 py-1 rounded-md cursor-pointer capitalize"
                      style={{
                        background: on
                          ? `color-mix(in srgb, ${colorMap[t]} 18%, transparent)`
                          : "var(--bg-hover)",
                        color: on ? colorMap[t] : "var(--text-4)",
                        border: `1px solid ${on ? `color-mix(in srgb, ${colorMap[t]} 35%, transparent)` : "var(--border)"}`,
                      }}
                    >
                      {t}
                    </button>
                  );
                })}
              </div>
            </ConfigRow>
            {tone === "auto" && (
              <p className="text-[10px]" style={{ color: "var(--text-4)" }}>
                Auto picks <strong style={{ color: "var(--text-2)" }}>{effectiveTone}</strong> based on{" "}
                {daysOverdue}d overdue
              </p>
            )}

            {/* Pause state */}
            {seed?.pauseUntil && (
              <div
                className="flex items-center gap-2 text-[11px] px-2.5 py-1.5 rounded-md"
                style={{
                  background: "color-mix(in srgb, var(--yellow) 12%, transparent)",
                  color: "var(--yellow)",
                }}
              >
                <Pause size={11} />
                Paused until {seed.pauseUntil}
              </div>
            )}

            {/* Action row */}
            <div className="flex items-center gap-2 pt-2">
              <button
                onClick={() => showToast("Reminder queued to send now")}
                className="flex items-center gap-1.5 text-[11px] font-semibold px-3 py-1.5 rounded-md cursor-pointer"
                style={{ background: "var(--green)", color: "#fff" }}
              >
                <Send size={11} /> Send now
              </button>
              <button
                onClick={() => setPauseOpen((v) => !v)}
                className="flex items-center gap-1.5 text-[11px] font-semibold px-3 py-1.5 rounded-md cursor-pointer"
                style={{ background: "var(--bg-hover)", color: "var(--text-2)" }}
              >
                <Pause size={11} /> Pause until…
              </button>
              <button
                onClick={() => setPreviewOpen(true)}
                className="flex items-center gap-1.5 text-[11px] font-semibold px-3 py-1.5 rounded-md cursor-pointer ml-auto"
                style={{ background: "var(--bg-hover)", color: "var(--text-2)" }}
              >
                <Eye size={11} /> Preview
              </button>
            </div>

            {pauseOpen && (
              <div
                className="rounded-lg p-3 flex items-center gap-2"
                style={{
                  background: "var(--bg-primary)",
                  border: "1px solid var(--border)",
                }}
              >
                <CalendarDays size={12} style={{ color: "var(--text-4)" }} />
                <input
                  type="date"
                  className="flex-1 bg-transparent border-0 text-[11px] outline-none"
                  style={{ color: "var(--text-1)" }}
                />
                <button
                  onClick={() => {
                    setPauseOpen(false);
                    showToast("Pause applied");
                  }}
                  className="text-[10px] font-semibold px-2 py-1 rounded-md cursor-pointer"
                  style={{ background: "var(--green)", color: "#fff" }}
                >
                  Apply
                </button>
              </div>
            )}
          </div>
        )}

        {!expanded && (
          <button
            onClick={() => setExpanded(true)}
            className="flex items-center gap-1 text-[11px] font-semibold cursor-pointer"
            style={{ color: "var(--green)" }}
          >
            Configure <ChevronDown size={11} />
          </button>
        )}
      </div>

      <MessageTemplateModal
        open={previewOpen}
        onClose={() => setPreviewOpen(false)}
        partyName={partyName}
        daysOverdue={daysOverdue}
        netAmount={outstanding}
        defaultChannel={channels[0] ?? "whatsapp"}
      />
      {toast && <Toast text={toast} />}
    </>
  );
}

function ConfigRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-3 flex-wrap">
      <span
        className="text-[10px] uppercase tracking-wider font-semibold"
        style={{ color: "var(--text-4)" }}
      >
        {label}
      </span>
      {children}
    </div>
  );
}

function ToggleSwitch({
  value,
  onChange,
  disabled,
}: {
  value: boolean;
  onChange: () => void;
  disabled?: boolean;
}) {
  return (
    <button
      onClick={disabled ? undefined : onChange}
      disabled={disabled}
      className="relative rounded-full cursor-pointer transition-colors disabled:cursor-not-allowed"
      style={{
        width: 32,
        height: 18,
        background: value ? "var(--green)" : "var(--bg-hover)",
        border: "1px solid var(--border)",
        opacity: disabled ? 0.5 : 1,
      }}
      aria-pressed={value}
      aria-label={value ? "Reminders enabled" : "Reminders disabled"}
    >
      <motion.div
        animate={{ x: value ? 14 : 0 }}
        transition={{ type: "spring", stiffness: 400, damping: 28 }}
        className="absolute top-0 left-0 rounded-full"
        style={{
          width: 16,
          height: 16,
          background: "#fff",
          boxShadow: "0 1px 2px rgba(0,0,0,0.3)",
          margin: 0,
        }}
      />
    </button>
  );
}

function Toast({ text }: { text: string }) {
  return (
    <motion.div
      initial={{ y: 20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      exit={{ y: 20, opacity: 0 }}
      className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[95] px-4 py-2 rounded-md text-[12px] font-semibold"
      style={{
        background: "var(--text-1)",
        color: "var(--bg-primary)",
        boxShadow: "0 8px 24px rgba(0,0,0,0.3)",
      }}
    >
      {text}
    </motion.div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   Reminder History Timeline — last 4 + "View all" modal
   ═══════════════════════════════════════════════════════════════ */

const STATUS_META: Record<ReminderStatus, { label: string; color: string; icon: React.ReactNode }> = {
  sent:       { label: "Sent",       color: "var(--text-3)", icon: <Send size={10} /> },
  delivered:  { label: "Delivered",  color: "var(--blue)",   icon: <CheckCircle2 size={10} /> },
  read:       { label: "Read",       color: "var(--green)",  icon: <Eye size={10} /> },
  replied:    { label: "Replied",    color: "var(--green)",  icon: <MessageCircle size={10} /> },
  failed:     { label: "Failed",     color: "var(--red)",    icon: <AlertTriangle size={10} /> },
  "opted-out":{ label: "Opted out",  color: "var(--red)",    icon: <X size={10} /> },
};

function ReminderHistorySection({ partyName }: { partyName: string }) {
  const [viewAll, setViewAll] = useState(false);
  const history = getPartyReminderHistory(partyName);
  const preview = history.slice(0, 4);

  if (history.length === 0) {
    return (
      <div
        className="rounded-md p-4 text-center"
        style={{
          background: "var(--bg-secondary)",
          border: "1px dashed var(--border)",
        }}
      >
        <p className="text-[11px]" style={{ color: "var(--text-4)" }}>
          No reminders sent yet
        </p>
      </div>
    );
  }

  return (
    <>
      <div
        className="rounded-md p-4"
        style={{
          background: "var(--bg-secondary)",
          border: "1px solid var(--border)",
        }}
      >
        <div className="flex items-center justify-between mb-3">
          <p
            className="text-[10px] uppercase tracking-wider font-semibold"
            style={{ color: "var(--text-4)" }}
          >
            Reminder history
          </p>
          {history.length > 4 && (
            <button
              onClick={() => setViewAll(true)}
              className="text-[10px] font-semibold cursor-pointer"
              style={{ color: "var(--green)" }}
            >
              View all {history.length} →
            </button>
          )}
        </div>

        <div className="flex flex-col gap-2">
          {preview.map((h) => {
            const meta = STATUS_META[h.status];
            const channelIcon =
              h.channel === "whatsapp" ? <MessageCircle size={11} /> : h.channel === "email" ? <Mail size={11} /> : <MessageCircle size={11} />;
            return (
              <div
                key={h.id}
                className="flex items-start gap-2.5 p-2.5 rounded-lg"
                style={{ background: "var(--bg-primary)" }}
              >
                <div
                  className="w-6 h-6 rounded-md flex items-center justify-center flex-shrink-0 mt-0.5"
                  style={{
                    background: "var(--bg-hover)",
                    color: "var(--text-3)",
                  }}
                >
                  {channelIcon}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-[11px] font-semibold capitalize" style={{ color: "var(--text-1)" }}>
                      {h.channel} · {h.tone}
                    </span>
                    <span
                      className="inline-flex items-center gap-1 text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded"
                      style={{
                        background: `color-mix(in srgb, ${meta.color} 15%, transparent)`,
                        color: meta.color,
                      }}
                    >
                      {meta.icon}
                      {meta.label}
                    </span>
                  </div>
                  <p className="text-[10px] mt-0.5 truncate" style={{ color: "var(--text-3)" }}>
                    {h.messagePreview}
                  </p>
                  <p className="text-[10px]" style={{ color: "var(--text-4)" }}>
                    {new Date(h.sentAt).toLocaleDateString("en-IN", {
                      day: "numeric",
                      month: "short",
                      year: "numeric",
                    })} · {h.billsCovered} bills
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* "View all" modal */}
      <AnimatePresence>
        {viewAll && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-[80]"
              style={{ background: "rgba(0,0,0,0.55)", backdropFilter: "blur(2px)" }}
              onClick={() => setViewAll(false)}
            />
            <motion.div
              initial={{ opacity: 0, y: 20, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 16 }}
              className="fixed inset-0 z-[90] flex items-center justify-center p-4 pointer-events-none"
            >
              <div
                className="w-full max-w-lg rounded-lg overflow-hidden flex flex-col pointer-events-auto"
                style={{
                  background: "var(--bg-surface)",
                  border: "1px solid var(--border)",
                  boxShadow: "0 24px 60px rgba(0,0,0,0.5)",
                  maxHeight: "80vh",
                }}
                onClick={(e) => e.stopPropagation()}
              >
                <div
                  className="flex items-center justify-between px-5 py-3"
                  style={{ borderBottom: "1px solid var(--border)" }}
                >
                  <div>
                    <h3 className="text-sm font-bold" style={{ color: "var(--text-1)" }}>
                      Full reminder history
                    </h3>
                    <p className="text-[10px]" style={{ color: "var(--text-4)" }}>
                      {partyName} · {history.length} events
                    </p>
                  </div>
                  <button
                    onClick={() => setViewAll(false)}
                    className="p-1.5 rounded-md cursor-pointer"
                    style={{ color: "var(--text-3)" }}
                  >
                    <X size={16} />
                  </button>
                </div>
                <div className="p-4 overflow-y-auto flex flex-col gap-2">
                  {history.map((h) => {
                    const meta = STATUS_META[h.status];
                    return (
                      <div
                        key={h.id}
                        className="flex items-start gap-2.5 p-2.5 rounded-lg"
                        style={{ background: "var(--bg-primary)" }}
                      >
                        <div
                          className="w-6 h-6 rounded-md flex items-center justify-center flex-shrink-0 mt-0.5"
                          style={{ background: "var(--bg-hover)", color: "var(--text-3)" }}
                        >
                          {h.channel === "whatsapp" ? (
                            <MessageCircle size={11} />
                          ) : h.channel === "email" ? (
                            <Mail size={11} />
                          ) : (
                            <MessageCircle size={11} />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-[11px] font-semibold capitalize" style={{ color: "var(--text-1)" }}>
                              {h.channel} · {h.tone}
                            </span>
                            <span
                              className="inline-flex items-center gap-1 text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded"
                              style={{
                                background: `color-mix(in srgb, ${meta.color} 15%, transparent)`,
                                color: meta.color,
                              }}
                            >
                              {meta.icon} {meta.label}
                            </span>
                            <span className="text-[10px]" style={{ color: "var(--text-4)" }}>
                              {h.daysOverdueAtSend}d overdue at send
                            </span>
                          </div>
                          <p className="text-[11px] mt-1" style={{ color: "var(--text-2)" }}>
                            {h.messagePreview}
                          </p>
                          <p className="text-[10px] mt-0.5" style={{ color: "var(--text-4)" }}>
                            {new Date(h.sentAt).toLocaleString("en-IN", {
                              day: "numeric",
                              month: "short",
                              year: "numeric",
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
