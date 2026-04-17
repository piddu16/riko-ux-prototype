"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import {
  FileText,
  FileSpreadsheet,
  Download,
  Clock,
  MessageCircle,
} from "lucide-react";
import { R, K, fL, fCr, RECEIVABLES } from "@/lib/data";
import { ComplianceCalendar } from "@/components/ui/compliance-calendar";

/* ── Report template data ── */
const REPORT_TEMPLATES = [
  {
    id: "mis",
    emoji: "\uD83D\uDCCB",
    name: "Monthly MIS Report",
    desc: "Complete financial snapshot for your CA",
    audience: "CA \u2192 Client",
    formats: ["PDF", "Excel", "WhatsApp"],
  },
  {
    id: "pnl",
    emoji: "\uD83D\uDCCA",
    name: "P&L Deep Dive",
    desc: "Revenue to EBITDA with D2C unit economics",
    audience: "Founder/CFO",
    formats: ["PDF", "Excel"],
  },
  {
    id: "receivables",
    emoji: "\uD83D\uDCE5",
    name: "Receivables Report",
    desc: "Who owes you, how long, and priority ranking",
    audience: "Sales/Ops",
    formats: ["Excel", "PDF", "WhatsApp"],
  },
  {
    id: "investor",
    emoji: "\uD83D\uDE80",
    name: "Investor Update",
    desc: "Fundable metrics for investor communication",
    audience: "Founder \u2192 Investors",
    formats: ["PDF", "PPTX"],
  },
  {
    id: "gst",
    emoji: "\uD83C\uDFDB\uFE0F",
    name: "GST Summary",
    desc: "ITC reconciliation and filing readiness",
    audience: "CA/Compliance",
    formats: ["PDF", "Excel"],
  },
  {
    id: "board",
    emoji: "\uD83C\uDFAF",
    name: "Board Deck",
    desc: "Quarterly board presentation with financials",
    audience: "Founder \u2192 Board",
    formats: ["PDF", "PPTX"],
  },
];

/* ── Scheduled reports data ── */
const SCHEDULED_REPORTS = [
  {
    company: "Bandra Soap",
    report: "Full MIS",
    schedule: "1st/month",
    delivery: "Email to founder",
  },
  {
    company: "Bandra Soap",
    report: "GST Summary",
    schedule: "18th/month",
    delivery: "WhatsApp to CA",
  },
  {
    company: "Bandra Soap",
    report: "Receivables",
    schedule: "Every Monday",
    delivery: "WhatsApp to Sales",
  },
];

/* ── Format pill colors ── */
const FORMAT_COLORS: Record<string, string> = {
  PDF: "var(--red)",
  Excel: "var(--green)",
  WhatsApp: "#25D366",
  PPTX: "var(--orange)",
};

/* ── MIS Preview ── */
function MISPreview() {
  const plRows = [
    { label: "Revenue", value: "\u20B99,25,23,800", bold: true },
    { label: "COGS", value: "\u20B91,61,49,566", bold: false },
    { label: "Gross Profit", value: "\u20B97,63,74,234 (82.5%)", bold: true, color: "var(--green)" },
    { label: "OpEx", value: "\u20B99,98,22,195", bold: false },
    { label: "EBITDA", value: "-\u20B91,74,47,191", bold: true, color: "var(--red)" },
    { label: "Net Loss", value: "-\u20B92,23,73,444", bold: true, color: "var(--red)" },
  ];

  const ratioCards = [
    { label: "CR", value: "2.60" },
    { label: "QR", value: "0.46" },
    { label: "GM", value: "82.5%" },
    { label: "DSO", value: "3d" },
    { label: "CCC", value: "32d" },
  ];

  return (
    <div className="space-y-6">
      {/* Cover */}
      <div className="text-center py-6 border-b" style={{ borderColor: "#e5e7eb" }}>
        <p className="text-xs uppercase tracking-widest text-gray-400 mb-2">
          Monthly MIS Report
        </p>
        <p className="text-lg font-bold text-gray-900">Bandra Soap Pvt Ltd</p>
        <p className="text-sm text-gray-500">March 2025</p>
      </div>

      {/* P&L Summary */}
      <div>
        <p className="text-xs font-bold uppercase tracking-wider text-gray-500 mb-3">
          P&L Summary
        </p>
        <table className="w-full text-sm">
          <tbody>
            {plRows.map((row) => (
              <tr
                key={row.label}
                className="border-b"
                style={{ borderColor: "#f3f4f6" }}
              >
                <td
                  className="py-2 text-gray-700"
                  style={{ fontWeight: row.bold ? 600 : 400 }}
                >
                  {row.label}
                </td>
                <td
                  className="py-2 text-right font-mono"
                  style={{
                    fontWeight: row.bold ? 700 : 400,
                    color: row.color || "#374151",
                  }}
                >
                  {row.value}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Key Ratios */}
      <div>
        <p className="text-xs font-bold uppercase tracking-wider text-gray-500 mb-3">
          Key Ratios
        </p>
        <div className="grid grid-cols-5 gap-2">
          {ratioCards.map((r) => (
            <div
              key={r.label}
              className="rounded-lg px-2 py-2 text-center bg-gray-50 border border-gray-100"
            >
              <p className="text-[10px] text-gray-400 uppercase">{r.label}</p>
              <p className="text-sm font-bold text-gray-900 mt-0.5">{r.value}</p>
            </div>
          ))}
        </div>
      </div>

      {/* GST */}
      <div>
        <p className="text-xs font-bold uppercase tracking-wider text-gray-500 mb-3">
          GST Overview
        </p>
        <div className="grid grid-cols-3 gap-3">
          {[
            { label: "ITC Available", value: `\u20B9${fCr(R.gstDr)}Cr` },
            { label: "GST Liability", value: `\u20B9${fCr(R.gstCr)}Cr` },
            { label: "Excess ITC", value: `\u20B9${fL(K.itcEx)}L` },
          ].map((g) => (
            <div key={g.label} className="rounded-lg px-3 py-2 bg-gray-50 border border-gray-100">
              <p className="text-[10px] text-gray-400">{g.label}</p>
              <p className="text-sm font-bold text-gray-900 mt-0.5">{g.value}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ── P&L Waterfall Preview ── */
function PnLPreview() {
  const steps = [
    { label: "Revenue", value: R.rev, color: "#22c55e" },
    { label: "(-) COGS", value: -R.cogs, color: "#94a3b8" },
    { label: "= Gross Profit", value: R.gp, color: "#22c55e" },
    { label: "(-) Fulfilment", value: -R.ful, color: "#94a3b8" },
    { label: "(-) CAC", value: -R.cac, color: "#f97316" },
    { label: "(-) Marketing", value: -R.mkt, color: "#ef4444" },
    { label: "(-) Employees", value: -R.emp, color: "#94a3b8" },
    { label: "(-) Overheads", value: -R.ovh, color: "#94a3b8" },
    { label: "= EBITDA", value: R.ebitda, color: "#ef4444" },
  ];

  const maxVal = Math.max(...steps.map((s) => Math.abs(s.value)));

  return (
    <div>
      <p className="text-xs font-bold uppercase tracking-wider text-gray-500 mb-4">
        P&L Waterfall
      </p>
      <div className="space-y-2">
        {steps.map((step) => {
          const pct = (Math.abs(step.value) / maxVal) * 100;
          return (
            <div key={step.label} className="flex items-center gap-3">
              <span className="text-[11px] w-28 flex-shrink-0 text-gray-600 text-right">
                {step.label}
              </span>
              <div className="flex-1 h-5 bg-gray-50 rounded overflow-hidden">
                <div
                  className="h-full rounded transition-all"
                  style={{ width: `${pct}%`, background: step.color }}
                />
              </div>
              <span className="text-[11px] font-mono text-gray-700 w-16 text-right flex-shrink-0">
                {step.value < 0 ? "-" : ""}{fL(Math.abs(step.value))}L
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* ── Receivables Preview ── */
function ReceivablesPreview() {
  const top5 = RECEIVABLES.slice(0, 5);

  return (
    <div>
      <p className="text-xs font-bold uppercase tracking-wider text-gray-500 mb-3">
        Top 5 Outstanding Receivables
      </p>
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-gray-200 text-gray-400 text-[11px]">
            <th className="text-left py-2 font-medium">#</th>
            <th className="text-left py-2 font-medium">Party</th>
            <th className="text-right py-2 font-medium">Amount</th>
            <th className="text-right py-2 font-medium">Days</th>
            <th className="text-center py-2 font-medium">Priority</th>
          </tr>
        </thead>
        <tbody>
          {top5.map((r, i) => (
            <tr
              key={r.name}
              className="border-b"
              style={{ borderColor: "#f3f4f6" }}
            >
              <td className="py-2 text-gray-400 text-xs">{i + 1}</td>
              <td className="py-2 text-gray-700 text-xs">{r.name}</td>
              <td className="py-2 text-right font-mono text-gray-900 text-xs font-medium">
                {"\u20B9"}{(r.amount / 1e5).toFixed(1)}L
              </td>
              <td className="py-2 text-right text-gray-500 text-xs">{r.days}d</td>
              <td className="py-2 text-center">
                <span
                  className="text-[10px] font-semibold px-1.5 py-0.5 rounded"
                  style={{
                    background:
                      r.priority === "P1"
                        ? "#fee2e2"
                        : r.priority === "P2"
                        ? "#fef3c7"
                        : "#f3f4f6",
                    color:
                      r.priority === "P1"
                        ? "#dc2626"
                        : r.priority === "P2"
                        ? "#d97706"
                        : "#6b7280",
                  }}
                >
                  {r.priority}
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

/* ── Placeholder Preview ── */
function PlaceholderPreview() {
  return (
    <div className="flex flex-col items-center justify-center py-12">
      <span className="text-4xl mb-3 opacity-50">&#128196;</span>
      <p className="text-sm font-medium text-gray-400">Preview coming soon</p>
      <p className="text-xs text-gray-300 mt-1">
        This report is being built. Check back shortly.
      </p>
    </div>
  );
}

/* ═══════════════════════════════════════════
   Reports Screen
   ═══════════════════════════════════════════ */
export function ReportsScreen() {
  const [selectedReport, setSelectedReport] = useState<string | null>(null);

  const renderPreview = () => {
    switch (selectedReport) {
      case "mis":
        return <MISPreview />;
      case "pnl":
        return <PnLPreview />;
      case "receivables":
        return <ReceivablesPreview />;
      default:
        return <PlaceholderPreview />;
    }
  };

  const selectedTemplate = REPORT_TEMPLATES.find((r) => r.id === selectedReport);

  return (
    <div className="max-w-5xl mx-auto">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.35 }}
        className="mb-6"
      >
        <h2 className="text-xl font-bold" style={{ color: "var(--text-1)" }}>
          Reports & Exports
        </h2>
        <p className="text-sm mt-1" style={{ color: "var(--text-3)" }}>
          Generate, preview, and share financial reports
        </p>
      </motion.div>

      {/* Compliance Calendar — top-priority for Indian CAs */}
      <div className="mb-6">
        <ComplianceCalendar />
      </div>

      {/* Report Templates Grid */}
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.4, delay: 0.05 }}
        className="grid grid-cols-2 md:grid-cols-3 gap-3 mb-6"
      >
        {REPORT_TEMPLATES.map((report) => {
          const isActive = selectedReport === report.id;
          return (
            <div
              key={report.id}
              className="rounded-xl p-4 transition-all"
              style={{
                background: "var(--bg-surface)",
                border: isActive
                  ? "2px solid var(--green)"
                  : "1px solid var(--border)",
              }}
            >
              <span className="text-2xl">{report.emoji}</span>
              <p
                className="text-sm font-bold mt-2"
                style={{ color: "var(--text-1)" }}
              >
                {report.name}
              </p>
              <p
                className="text-xs mt-0.5 line-clamp-1"
                style={{ color: "var(--text-3)" }}
              >
                {report.desc}
              </p>
              <p className="text-[10px] mt-1.5" style={{ color: "var(--text-4)" }}>
                For: {report.audience}
              </p>

              {/* Format pills */}
              <div className="flex flex-wrap gap-1 mt-2">
                {report.formats.map((fmt) => (
                  <span
                    key={fmt}
                    className="text-[10px] font-medium px-1.5 py-0.5 rounded"
                    style={{
                      background: `color-mix(in srgb, ${FORMAT_COLORS[fmt] || "var(--text-4)"} 12%, transparent)`,
                      color: FORMAT_COLORS[fmt] || "var(--text-4)",
                    }}
                  >
                    {fmt}
                  </span>
                ))}
              </div>

              {/* Preview button */}
              <button
                onClick={() =>
                  setSelectedReport(isActive ? null : report.id)
                }
                className="mt-3 text-xs font-semibold px-3 py-1.5 rounded-lg cursor-pointer transition-colors w-full"
                style={{
                  border: "1px solid color-mix(in srgb, var(--green) 50%, transparent)",
                  color: "var(--green)",
                  background: isActive
                    ? "color-mix(in srgb, var(--green) 10%, transparent)"
                    : "transparent",
                }}
              >
                {isActive ? "Hide Preview" : "Preview"}
              </button>
            </div>
          );
        })}
      </motion.div>

      {/* Selected Report Preview */}
      {selectedReport && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.3 }}
          className="mb-6"
        >
          {/* Preview label */}
          <div className="flex items-center gap-2 mb-3">
            <span className="text-xs font-bold uppercase tracking-wider" style={{ color: "var(--text-4)" }}>
              Preview
            </span>
            {selectedTemplate && (
              <span className="text-xs font-medium" style={{ color: "var(--text-2)" }}>
                &mdash; {selectedTemplate.name}
              </span>
            )}
          </div>

          {/* PDF-like preview card — forced light background */}
          <div
            className="rounded-xl p-6 shadow-lg"
            style={{
              background: "#ffffff",
              border: "1px solid #e5e7eb",
              color: "#111827",
            }}
          >
            {renderPreview()}
          </div>

          {/* Export actions */}
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.25, delay: 0.1 }}
            className="flex flex-wrap items-center gap-2 mt-4"
          >
            <button
              className="flex items-center gap-1.5 text-xs font-semibold px-4 py-2 rounded-lg cursor-pointer transition-opacity hover:opacity-90"
              style={{
                background: "var(--green)",
                color: "#fff",
              }}
            >
              <Download size={14} />
              Download PDF
            </button>
            <button
              className="flex items-center gap-1.5 text-xs font-semibold px-4 py-2 rounded-lg cursor-pointer transition-opacity hover:opacity-90"
              style={{
                background: "transparent",
                border: "1px solid var(--border)",
                color: "var(--text-2)",
              }}
            >
              <FileSpreadsheet size={14} />
              Download Excel
            </button>
            <button
              className="flex items-center gap-1.5 text-xs font-semibold px-4 py-2 rounded-lg cursor-pointer transition-opacity hover:opacity-90"
              style={{
                background: "transparent",
                border: "1px solid color-mix(in srgb, #25D366 40%, transparent)",
                color: "#25D366",
              }}
            >
              <MessageCircle size={14} />
              Share via WhatsApp
            </button>
            <button
              className="flex items-center gap-1.5 text-xs font-semibold px-4 py-2 rounded-lg cursor-pointer transition-opacity hover:opacity-90"
              style={{
                background: "transparent",
                border: "1px solid var(--border)",
                color: "var(--text-2)",
              }}
            >
              <Clock size={14} />
              Schedule Monthly
            </button>
          </motion.div>
        </motion.div>
      )}

      {/* Scheduled Reports (desktop only) */}
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.4, delay: 0.1 }}
        className="hidden md:block"
      >
        <div className="flex items-center gap-2 mb-3">
          <Clock size={14} style={{ color: "var(--text-4)" }} />
          <p className="text-xs font-bold uppercase tracking-wider" style={{ color: "var(--text-4)" }}>
            Scheduled Reports
          </p>
        </div>
        <div
          className="rounded-xl overflow-hidden"
          style={{
            background: "var(--bg-surface)",
            border: "1px solid var(--border)",
          }}
        >
          <table className="w-full text-xs">
            <thead>
              <tr
                style={{
                  background: "var(--bg-hover)",
                  color: "var(--text-4)",
                }}
              >
                <th className="text-left px-4 py-2.5 font-medium">Company</th>
                <th className="text-left px-4 py-2.5 font-medium">Report</th>
                <th className="text-left px-4 py-2.5 font-medium">Schedule</th>
                <th className="text-left px-4 py-2.5 font-medium">Delivery</th>
              </tr>
            </thead>
            <tbody>
              {SCHEDULED_REPORTS.map((row, i) => (
                <tr
                  key={i}
                  style={{ borderTop: "1px solid var(--border)" }}
                >
                  <td className="px-4 py-2.5" style={{ color: "var(--text-1)" }}>
                    {row.company}
                  </td>
                  <td className="px-4 py-2.5" style={{ color: "var(--text-2)" }}>
                    {row.report}
                  </td>
                  <td className="px-4 py-2.5">
                    <span
                      className="text-[10px] font-medium px-2 py-0.5 rounded-full"
                      style={{
                        background: "color-mix(in srgb, var(--blue) 12%, transparent)",
                        color: "var(--blue)",
                      }}
                    >
                      {row.schedule}
                    </span>
                  </td>
                  <td className="px-4 py-2.5" style={{ color: "var(--text-3)" }}>
                    {row.delivery}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </motion.div>
    </div>
  );
}
