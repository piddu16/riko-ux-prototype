"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  FileText,
  FileSpreadsheet,
  Download,
  Clock,
  MessageCircle,
  Check,
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

/* ── Investor Update Preview ── */
function InvestorPreview() {
  const metrics = [
    { label: "Revenue (Mar)", value: "\u20B93.6L", color: "#22c55e", sub: "MoM −2%" },
    { label: "Burn Rate", value: "\u20B918.6L/mo", color: "#ef4444", sub: "down from 21L" },
    { label: "Runway", value: "9 days", color: "#ef4444", sub: "base case" },
    { label: "Gross Margin", value: "82.5%", color: "#22c55e", sub: "+2pp MoM" },
  ];

  const highlights = [
    "Shipped new SKU line (3 products) — niacinamide, vitamin C, retinol",
    "Closed \u20B912.6L receivables from Nykaa (pending 2,195 days)",
    "GM expanded 2pp MoM — COGS optimization on glass jars",
    "Website D2C revenue up 18% WoW",
  ];

  const challenges = [
    "Amazon returns up 8% — investigating packaging vulnerability",
    "Cash runway at 9 days — raise or cut burn immediately",
    "Paytm Mall pending \u20B93.55L for 2,132 days; likely requires escalation",
  ];

  return (
    <div className="space-y-6">
      {/* Cover */}
      <div className="text-center py-6 border-b" style={{ borderColor: "#e5e7eb" }}>
        <p className="text-[10px] uppercase tracking-widest text-gray-400 mb-2">
          Monthly Investor Update
        </p>
        <p className="text-lg font-bold text-gray-900">Bandra Soap Pvt Ltd</p>
        <p className="text-sm text-gray-500">March 2026</p>
      </div>

      {/* Metric grid */}
      <div>
        <p className="text-xs font-bold uppercase tracking-wider text-gray-500 mb-3">
          Key Metrics
        </p>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {metrics.map((m) => (
            <div
              key={m.label}
              className="rounded-lg px-3 py-3 bg-gray-50 border border-gray-100"
            >
              <p className="text-[10px] text-gray-400 uppercase tracking-wider">
                {m.label}
              </p>
              <p
                className="text-base font-bold mt-1"
                style={{ color: m.color, fontFamily: "'Space Grotesk', sans-serif" }}
              >
                {m.value}
              </p>
              <p className="text-[10px] text-gray-500 mt-0.5">{m.sub}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Highlights */}
      <div>
        <p className="text-xs font-bold uppercase tracking-wider text-gray-500 mb-3">
          Highlights
        </p>
        <ul className="space-y-2">
          {highlights.map((h) => (
            <li key={h} className="flex items-start gap-2 text-sm text-gray-700">
              <span
                className="flex-shrink-0 w-1.5 h-1.5 rounded-full mt-2"
                style={{ background: "#22c55e" }}
              />
              <span>{h}</span>
            </li>
          ))}
        </ul>
      </div>

      {/* Challenges */}
      <div>
        <p className="text-xs font-bold uppercase tracking-wider text-gray-500 mb-3">
          Challenges
        </p>
        <ul className="space-y-2">
          {challenges.map((c) => (
            <li key={c} className="flex items-start gap-2 text-sm text-gray-700">
              <span
                className="flex-shrink-0 w-1.5 h-1.5 rounded-full mt-2"
                style={{ background: "#ef4444" }}
              />
              <span>{c}</span>
            </li>
          ))}
        </ul>
      </div>

      {/* Ask */}
      <div
        className="rounded-lg p-4"
        style={{
          background: "#ecfdf5",
          border: "1px solid #a7f3d0",
        }}
      >
        <p className="text-[10px] font-bold uppercase tracking-wider mb-2" style={{ color: "#065f46" }}>
          The Ask
        </p>
        <p className="text-sm font-semibold" style={{ color: "#064e3b" }}>
          Closing bridge round of {"\u20B9"}3Cr by 15 May 2026
        </p>
        <p className="text-xs mt-1" style={{ color: "#065f46" }}>
          12-month runway · 20% dilution · lead investor: TBD
        </p>
      </div>
    </div>
  );
}

/* ── Board Deck Preview ── */
function BoardDeckPreview() {
  const slides = [
    {
      num: 1,
      title: "Executive Summary",
      content: (
        <div className="space-y-2 text-sm text-gray-700">
          <p><span className="font-semibold text-red-600">Revenue down 55% YoY</span> — {"\u20B9"}9.25Cr (vs {"\u20B9"}20.1Cr FY24)</p>
          <p><span className="font-semibold text-red-600">EBITDA {"\u20B9"}−1.74Cr</span> — burn {"\u20B9"}18.6L/mo, marketing-heavy</p>
          <p><span className="font-semibold text-red-600">Cash runway critical</span> — 9 days at current burn</p>
          <p className="text-gray-600 italic pt-1">Recommendation: immediate burn cut + bridge financing</p>
        </div>
      ),
    },
    {
      num: 2,
      title: "Financial Performance",
      content: (
        <table className="w-full text-sm">
          <tbody>
            {[
              { label: "Revenue", fy24: "\u20B920.13Cr", fy25: "\u20B99.25Cr", delta: "−54%" },
              { label: "Gross Profit", fy24: "\u20B916.50Cr", fy25: "\u20B97.64Cr", delta: "−54%" },
              { label: "Marketing spend", fy24: "\u20B918.20Cr", fy25: "\u20B923.23Cr", delta: "+28%" },
              { label: "EBITDA", fy24: "\u20B9−1.20Cr", fy25: "\u20B9−1.74Cr", delta: "−45%" },
              { label: "Cash", fy24: "\u20B912.4L", fy25: "\u20B95.6L", delta: "−55%" },
            ].map((row, i) => (
              <tr key={row.label} style={{ borderTop: i === 0 ? undefined : "1px solid #f3f4f6" }}>
                <td className="py-2 text-gray-700 font-medium">{row.label}</td>
                <td className="py-2 text-right font-mono text-gray-600">{row.fy24}</td>
                <td className="py-2 text-right font-mono text-gray-900 font-semibold">{row.fy25}</td>
                <td
                  className="py-2 text-right font-mono font-semibold"
                  style={{ color: row.delta.startsWith("+") ? "#22c55e" : "#ef4444" }}
                >
                  {row.delta}
                </td>
              </tr>
            ))}
            <tr style={{ borderTop: "1px solid #e5e7eb" }}>
              <td></td>
              <td className="pt-1 text-right text-[10px] uppercase text-gray-400">FY24</td>
              <td className="pt-1 text-right text-[10px] uppercase text-gray-400">FY25</td>
              <td className="pt-1 text-right text-[10px] uppercase text-gray-400">YoY</td>
            </tr>
          </tbody>
        </table>
      ),
    },
    {
      num: 3,
      title: "Cash & Runway",
      content: (
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            {[
              { label: "Today", v: "\u20B95.6L", color: "#22c55e" },
              { label: "+30d", v: "\u20B9−2.6L", color: "#ef4444" },
              { label: "+60d", v: "\u20B9−14L", color: "#ef4444" },
              { label: "+90d", v: "\u20B9−31L", color: "#ef4444" },
            ].map((b) => (
              <div key={b.label} className="flex-1 rounded-lg px-2 py-2 text-center bg-gray-50 border border-gray-100">
                <p className="text-[10px] text-gray-400 uppercase">{b.label}</p>
                <p className="text-sm font-bold mt-1" style={{ color: b.color }}>{b.v}</p>
              </div>
            ))}
          </div>
          <p className="text-xs text-gray-500">
            Base case burn {"\u20B9"}18.6L/mo. Needs {"\u20B9"}3Cr bridge or 40% cost cut within 30 days.
          </p>
        </div>
      ),
    },
    {
      num: 4,
      title: "Operational Highlights",
      content: (
        <div className="space-y-3">
          <div>
            <p className="text-[11px] font-semibold text-gray-500 uppercase tracking-wider mb-2">Channel mix</p>
            <div className="space-y-1.5">
              {[
                { ch: "Nykaa (Marketplace)", pct: 35 },
                { ch: "Website D2C", pct: 35 },
                { ch: "Amazon", pct: 20 },
                { ch: "Flipkart", pct: 7 },
                { ch: "Others", pct: 3 },
              ].map((c) => (
                <div key={c.ch} className="flex items-center gap-2">
                  <span className="text-[11px] text-gray-600 w-36">{c.ch}</span>
                  <div className="flex-1 h-3 rounded bg-gray-100 overflow-hidden">
                    <div className="h-full rounded" style={{ width: `${c.pct}%`, background: "#22c55e" }} />
                  </div>
                  <span className="text-[11px] font-mono text-gray-700 w-10 text-right">{c.pct}%</span>
                </div>
              ))}
            </div>
          </div>
          <div>
            <p className="text-[11px] font-semibold text-gray-500 uppercase tracking-wider mb-2 mt-2">Top customers</p>
            <p className="text-xs text-gray-700">Nykaa ({"\u20B9"}3.24L), Website D2C ({"\u20B9"}3.22L), Amazon Seller ({"\u20B9"}2.85L)</p>
          </div>
        </div>
      ),
    },
    {
      num: 5,
      title: "Strategy & Ask",
      content: (
        <div className="space-y-3">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-wider text-gray-500 mb-2">
              Strategic priorities
            </p>
            <ul className="space-y-1 text-sm text-gray-700">
              <li>1. Cut marketing spend 40% — shift to organic + retention</li>
              <li>2. Close Nykaa AR collection ({"\u20B9"}12.6L stuck)</li>
              <li>3. File RFD-01 for {"\u20B9"}4.6L excess ITC refund</li>
              <li>4. Raise {"\u20B9"}3Cr bridge for 12-month runway</li>
            </ul>
          </div>
          <div
            className="rounded-lg p-3"
            style={{ background: "#ecfdf5", border: "1px solid #a7f3d0" }}
          >
            <p className="text-[10px] font-bold uppercase tracking-wider" style={{ color: "#065f46" }}>
              Board ask
            </p>
            <p className="text-sm font-semibold mt-1" style={{ color: "#064e3b" }}>
              Approve {"\u20B9"}3Cr bridge facility by 15 May 2026
            </p>
          </div>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      {/* Cover slide */}
      <div
        className="text-center rounded-lg py-8"
        style={{ background: "linear-gradient(135deg, #111827, #374151)", color: "#fff" }}
      >
        <p className="text-[10px] uppercase tracking-widest opacity-70 mb-3">
          Board Review
        </p>
        <p className="text-xl font-bold">Q4 FY25 Board Review</p>
        <p className="text-sm mt-1 opacity-80">Bandra Soap Pvt Ltd</p>
        <p className="text-xs mt-3 opacity-60">Presented by Yogesh Patel · 17 Apr 2026</p>
      </div>

      {/* Slides */}
      {slides.map((s) => (
        <div
          key={s.num}
          className="rounded-lg border border-gray-200 p-5"
          style={{ background: "#fff" }}
        >
          <div className="flex items-center justify-between mb-3 pb-2 border-b border-gray-100">
            <p className="text-sm font-bold text-gray-900">
              <span className="text-gray-400 mr-2">Slide {s.num}</span>
              {s.title}
            </p>
            <span className="text-[10px] uppercase tracking-wider text-gray-400">
              Q4 FY25
            </span>
          </div>
          {s.content}
        </div>
      ))}
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
type ToastState = { visible: boolean; stage: "sending" | "sent"; format: string };

export function ReportsScreen() {
  const [selectedReport, setSelectedReport] = useState<string | null>(null);
  const [toast, setToast] = useState<ToastState>({ visible: false, stage: "sending", format: "" });

  const triggerExport = (format: string) => {
    setToast({ visible: true, stage: "sending", format });
    setTimeout(() => setToast({ visible: true, stage: "sent", format }), 1400);
    setTimeout(() => setToast({ visible: false, stage: "sent", format }), 3600);
  };

  const renderPreview = () => {
    switch (selectedReport) {
      case "mis":
        return <MISPreview />;
      case "pnl":
        return <PnLPreview />;
      case "receivables":
        return <ReceivablesPreview />;
      case "investor":
        return <InvestorPreview />;
      case "board":
        return <BoardDeckPreview />;
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
              onClick={() => triggerExport("PDF")}
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
              onClick={() => triggerExport("Excel")}
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
              onClick={() => triggerExport("WhatsApp")}
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
              onClick={() => triggerExport("Schedule")}
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

      {/* Export toast */}
      <AnimatePresence>
        {toast.visible && (
          <motion.div
            initial={{ opacity: 0, y: 40, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className="fixed bottom-20 md:bottom-6 right-4 md:right-6 z-50 rounded-xl shadow-2xl"
            style={{
              background: "var(--bg-secondary)",
              border: "1px solid var(--border)",
              minWidth: 280,
              maxWidth: 360,
            }}
          >
            <div className="flex items-start gap-3 p-4">
              {/* Icon */}
              <div
                className="flex-shrink-0 w-9 h-9 rounded-full flex items-center justify-center"
                style={{
                  background:
                    toast.format === "WhatsApp"
                      ? toast.stage === "sent"
                        ? "#25D366"
                        : "color-mix(in srgb, #25D366 20%, transparent)"
                      : toast.stage === "sent"
                        ? "var(--green)"
                        : "color-mix(in srgb, var(--green) 20%, transparent)",
                  color:
                    toast.stage === "sent" ? "#fff" : toast.format === "WhatsApp" ? "#25D366" : "var(--green)",
                }}
              >
                {toast.stage === "sent" ? (
                  <Check size={16} strokeWidth={3} />
                ) : toast.format === "WhatsApp" ? (
                  <MessageCircle size={16} />
                ) : (
                  <Download size={16} />
                )}
              </div>

              {/* Text */}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold" style={{ color: "var(--text-1)" }}>
                  {toast.stage === "sending"
                    ? toast.format === "WhatsApp"
                      ? "Sending to Yogesh via WhatsApp…"
                      : toast.format === "Schedule"
                        ? "Scheduling monthly delivery…"
                        : toast.format === "Excel"
                          ? "Generating Excel workbook…"
                          : "Generating PDF…"
                    : toast.format === "WhatsApp"
                      ? "Sent via WhatsApp ✓"
                      : toast.format === "Schedule"
                        ? "Schedule set — every 1st of month ✓"
                        : `${toast.format} ready ✓`}
                </p>
                <p className="text-xs mt-0.5" style={{ color: "var(--text-3)" }}>
                  {selectedTemplate?.name ?? "MIS Report"}
                  {toast.stage === "sent" && toast.format === "WhatsApp" && " · +91 98765 43210"}
                  {toast.stage === "sent" && toast.format === "PDF" && " · Downloads/riko-mis-mar-2026.pdf"}
                  {toast.stage === "sent" && toast.format === "Excel" && " · Downloads/riko-mis-mar-2026.xlsx"}
                </p>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
