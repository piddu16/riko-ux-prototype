"use client";

/* ═══════════════════════════════════════════════════════════════
   MessageTemplatePreviewModal — the PRD's 4-tier tone ladder
   surfaced as a picker + live preview.

   Shows Gentle / Standard / Firm / Final templates for the selected
   channel (WhatsApp / Email / SMS) with all variables replaced
   (party, invoice #, amount, due date, company name sans FY suffix).
   Used by the AI Reminder Card's [Preview message] button.
   ═══════════════════════════════════════════════════════════════ */

import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  X,
  MessageCircle,
  Mail,
  MessageSquare as MessageSquareIcon,
  Copy,
  Check,
} from "lucide-react";
import {
  REMINDER_TEMPLATES,
  renderTemplate,
  cleanCompanyName,
  recommendTone,
  type ReminderChannel,
  type ReminderTone,
} from "@/lib/data";

interface MessageTemplateModalProps {
  open: boolean;
  onClose: () => void;
  /** Party this preview is for — fills {party_name} and friends. */
  partyName: string;
  /** Overdue days — decides which tone we highlight first. */
  daysOverdue: number;
  /** Net-of-on-account amount in rupees (before formatting). */
  netAmount: number;
  /** Optional: pre-select a channel. */
  defaultChannel?: ReminderChannel;
}

const CHANNELS: { id: ReminderChannel; label: string; Icon: typeof MessageCircle; color: string }[] = [
  { id: "whatsapp", label: "WhatsApp", Icon: MessageCircle, color: "var(--green)" },
  { id: "email",    label: "Email",    Icon: Mail,          color: "var(--blue)" },
  { id: "sms",      label: "SMS",      Icon: MessageSquareIcon, color: "var(--text-2)" },
];

const TONES: { id: ReminderTone; label: string; bucket: string; color: string }[] = [
  { id: "gentle",   label: "Gentle",   bucket: "≤ 7 days",     color: "var(--green)" },
  { id: "standard", label: "Standard", bucket: "8 – 30 days",  color: "var(--blue)" },
  { id: "firm",     label: "Firm",     bucket: "31 – 180 days", color: "var(--orange)" },
  { id: "final",    label: "Final",    bucket: "180+ days",    color: "var(--red)" },
];

function formatINR(v: number): string {
  if (v < 1e5) return `₹${v.toLocaleString("en-IN")}`;
  if (v < 1e7) return `₹${(v / 1e5).toFixed(1)}L`;
  return `₹${(v / 1e7).toFixed(2)}Cr`;
}

export function MessageTemplateModal({
  open,
  onClose,
  partyName,
  daysOverdue,
  netAmount,
  defaultChannel = "whatsapp",
}: MessageTemplateModalProps) {
  const recommended = recommendTone(daysOverdue);
  const [channel, setChannel] = useState<ReminderChannel>(defaultChannel);
  const [tone, setTone] = useState<ReminderTone>(recommended);
  const [copied, setCopied] = useState(false);

  const template = REMINDER_TEMPLATES.find(
    (t) => t.tone === tone && t.channel === channel,
  );

  // Due date demo: today minus daysOverdue. Stable per open.
  const dueDate = (() => {
    const d = new Date("2026-04-20");
    d.setDate(d.getDate() - daysOverdue);
    return d.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
  })();

  const vars = {
    party_name: partyName,
    invoice_no: `INV-${Math.abs(partyName.length * 7919 + netAmount) % 9000 + 1000}`,
    net_amount: formatINR(netAmount),
    due_date: dueDate,
    days_overdue: daysOverdue.toLocaleString("en-IN"),
    company_name: cleanCompanyName("Bandra Soap Pvt Ltd(2020-2024)"),
    bill_count: 1,
    total_net_amount: formatINR(netAmount),
    oldest_invoice_no: `INV-${Math.abs(partyName.length * 9473) % 9000 + 1000}`,
    oldest_date: dueDate,
  };

  const rendered = template ? renderTemplate(template.body, vars) : "";

  const handleCopy = () => {
    if (typeof navigator === "undefined" || !navigator.clipboard) return;
    navigator.clipboard.writeText(rendered).then(() => {
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1600);
    });
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
              className="w-full max-w-2xl rounded-lg overflow-hidden pointer-events-auto flex flex-col"
              style={{
                background: "var(--bg-surface)",
                border: "1px solid var(--border)",
                boxShadow: "0 24px 60px rgba(0,0,0,0.5)",
                maxHeight: "88vh",
              }}
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header */}
              <div
                className="flex items-center justify-between px-5 py-3"
                style={{ borderBottom: "1px solid var(--border)" }}
              >
                <div>
                  <h3 className="text-sm font-bold" style={{ color: "var(--text-1)" }}>
                    Preview reminder message
                  </h3>
                  <p className="text-[10px]" style={{ color: "var(--text-4)" }}>
                    {partyName} · {daysOverdue}d overdue · Riko recommends{" "}
                    <span style={{ color: TONES.find((t) => t.id === recommended)?.color }}>
                      {TONES.find((t) => t.id === recommended)?.label}
                    </span>
                  </p>
                </div>
                <button
                  onClick={onClose}
                  className="p-1.5 rounded-md cursor-pointer"
                  style={{ color: "var(--text-3)" }}
                  aria-label="Close"
                >
                  <X size={16} />
                </button>
              </div>

              {/* Channel picker */}
              <div className="flex gap-1 px-5 pt-4">
                {CHANNELS.map(({ id, label, Icon, color }) => {
                  const active = channel === id;
                  return (
                    <button
                      key={id}
                      onClick={() => setChannel(id)}
                      className="flex items-center gap-1.5 text-[11px] font-semibold px-3 py-1.5 rounded-lg cursor-pointer transition-colors"
                      style={{
                        background: active
                          ? `color-mix(in srgb, ${color} 15%, transparent)`
                          : "var(--bg-primary)",
                        color: active ? color : "var(--text-3)",
                        border: `1px solid ${active ? `color-mix(in srgb, ${color} 35%, transparent)` : "var(--border)"}`,
                      }}
                    >
                      <Icon size={12} /> {label}
                    </button>
                  );
                })}
              </div>

              {/* Tone ladder */}
              <div className="grid grid-cols-4 gap-2 px-5 pt-3">
                {TONES.map((t) => {
                  const active = tone === t.id;
                  const isRecommended = t.id === recommended;
                  return (
                    <button
                      key={t.id}
                      onClick={() => setTone(t.id)}
                      className="rounded-lg p-2.5 text-left cursor-pointer transition-colors relative"
                      style={{
                        background: active
                          ? `color-mix(in srgb, ${t.color} 12%, transparent)`
                          : "var(--bg-primary)",
                        border: `1px solid ${active ? `color-mix(in srgb, ${t.color} 40%, transparent)` : "var(--border)"}`,
                      }}
                    >
                      {isRecommended && (
                        <span
                          className="absolute -top-1.5 right-1.5 text-[8px] font-bold px-1 py-0.5 rounded"
                          style={{ background: t.color, color: "#fff" }}
                        >
                          AUTO
                        </span>
                      )}
                      <p
                        className="text-[11px] font-bold mb-0.5"
                        style={{ color: active ? t.color : "var(--text-1)" }}
                      >
                        {t.label}
                      </p>
                      <p className="text-[9px]" style={{ color: "var(--text-4)" }}>
                        {t.bucket}
                      </p>
                    </button>
                  );
                })}
              </div>

              {/* Rendered preview */}
              <div className="px-5 py-4 flex-1 overflow-y-auto">
                <p
                  className="text-[10px] uppercase tracking-wider font-semibold mb-2"
                  style={{ color: "var(--text-4)" }}
                >
                  Preview
                </p>
                <div
                  className="rounded-md p-4 text-[12px] whitespace-pre-wrap"
                  style={{
                    background: "var(--bg-primary)",
                    border: "1px solid var(--border)",
                    color: "var(--text-1)",
                    lineHeight: 1.55,
                    fontFamily: channel === "sms" ? "monospace" : "inherit",
                  }}
                >
                  {rendered || "—"}
                </div>
                <p className="text-[10px] mt-2" style={{ color: "var(--text-4)" }}>
                  Variables filled from this party&apos;s ledger. FY suffix stripped from company
                  name. Actual send routes through your WABA-approved template on MSG91.
                </p>
              </div>

              {/* Footer actions */}
              <div
                className="flex items-center justify-between gap-2 px-5 py-3"
                style={{ borderTop: "1px solid var(--border)" }}
              >
                <button
                  onClick={handleCopy}
                  className="flex items-center gap-1.5 text-[11px] font-semibold px-3 py-2 rounded-lg cursor-pointer"
                  style={{ color: "var(--text-2)", background: "var(--bg-hover)" }}
                >
                  {copied ? <Check size={13} /> : <Copy size={13} />}
                  {copied ? "Copied" : "Copy text"}
                </button>
                <div className="flex items-center gap-2">
                  <button
                    onClick={onClose}
                    className="text-[11px] font-semibold px-3 py-2 rounded-lg cursor-pointer"
                    style={{ color: "var(--text-3)", background: "var(--bg-hover)" }}
                  >
                    Close
                  </button>
                  <button
                    onClick={onClose}
                    className="text-[11px] font-semibold px-3 py-2 rounded-lg cursor-pointer"
                    style={{ background: "var(--green)", color: "#fff" }}
                  >
                    Use this template
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
