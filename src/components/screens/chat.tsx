"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Send, Mic, ChevronDown, ChevronRight } from "lucide-react";
import { CHAT_PROMPTS, RECEIVABLES, R, K, fL } from "@/lib/data";
import { Pill } from "@/components/ui/pill";
import { ExportBar } from "@/components/ui/export-bar";

/* ── Quick action pills ── */
const QUICK_ACTIONS = [
  { emoji: "\uD83D\uDCB0", label: "Cash balance" },
  { emoji: "\uD83D\uDCCA", label: "Health score" },
  { emoji: "\uD83D\uDCE5", label: "Who owes me?" },
  { emoji: "\uD83D\uDCC8", label: "Revenue trend" },
];

/* ── Collapsible layer ── */
function Layer({
  color,
  icon,
  title,
  children,
}: {
  color: string;
  icon: string;
  title: string;
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(false);
  return (
    <div
      className="rounded-lg overflow-hidden my-1.5"
      style={{ border: `1px solid color-mix(in srgb, ${color} 40%, transparent)` }}
    >
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-2 w-full px-3 py-2 text-xs font-semibold cursor-pointer"
        style={{
          background: `color-mix(in srgb, ${color} 10%, transparent)`,
          color,
        }}
      >
        <span>{icon}</span>
        <span className="flex-1 text-left">{title}</span>
        {open ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
      </button>
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25, ease: "easeInOut" }}
            className="overflow-hidden"
          >
            <div className="px-3 py-2 text-xs" style={{ color: "var(--text-2)" }}>
              {children}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

/* ── Follow-up chips ── */
function Chips({ items }: { items: string[] }) {
  return (
    <div className="flex flex-wrap gap-1.5 mt-2">
      {items.map((t) => (
        <span
          key={t}
          className="text-[11px] px-2.5 py-1 rounded-full cursor-pointer transition-colors"
          style={{
            background: "var(--bg-surface)",
            border: "1px solid var(--border)",
            color: "var(--text-2)",
          }}
        >
          {t}
        </span>
      ))}
    </div>
  );
}

/* ── User bubble ── */
function UserBubble({ text }: { text: string }) {
  return (
    <div className="flex justify-end mb-3">
      <div
        className="max-w-[80%] px-4 py-2.5 rounded-2xl rounded-br-md text-sm"
        style={{
          background: "color-mix(in srgb, var(--green) 15%, transparent)",
          color: "var(--text-1)",
        }}
      >
        {text}
      </div>
    </div>
  );
}

/* ── Riko response wrapper ── */
function RikoMsg({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex gap-2 mb-5">
      <div
        className="w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5"
        style={{ background: "linear-gradient(135deg, var(--green), var(--green-dark))" }}
      >
        <span className="text-white text-[10px] font-bold">R</span>
      </div>
      <div className="flex-1 min-w-0">{children}</div>
    </div>
  );
}

/* ── Exchange 1: Current ratio ── */
function ExchangeCurrentRatio() {
  const ca = K.ca;
  const cl = K.cl;
  const ratio = K.cr;

  return (
    <>
      <UserBubble text="Calculate my current ratio" />
      <RikoMsg>
        {/* Layer 1 — always visible */}
        <div
          className="rounded-xl p-4 mb-2"
          style={{ background: "var(--bg-surface)", border: "1px solid var(--border)" }}
        >
          <div className="flex items-center gap-3 mb-2">
            <span
              className="text-2xl font-bold"
              style={{ color: "var(--green)", fontFamily: "'Space Grotesk', sans-serif" }}
            >
              Current Ratio: {ratio.toFixed(2)}
            </span>
            <Pill color="var(--green)">Healthy</Pill>
          </div>
          <p className="text-xs mb-3" style={{ color: "var(--text-3)" }}>
            Your current assets cover liabilities {ratio.toFixed(1)}x. Above 2.0 is considered
            healthy for D2C businesses.
          </p>

          {/* Mini KPI bar */}
          <div className="grid grid-cols-3 gap-3">
            {[
              { label: "Current Assets", val: `${fL(ca)}L` },
              { label: "Current Liabilities", val: `${fL(cl)}L` },
              { label: "Ratio", val: ratio.toFixed(2) },
            ].map((k) => (
              <div
                key={k.label}
                className="rounded-lg px-3 py-2 text-center"
                style={{ background: "var(--bg-hover)" }}
              >
                <p className="text-[10px] uppercase tracking-wider" style={{ color: "var(--text-4)" }}>
                  {k.label}
                </p>
                <p className="text-sm font-bold mt-0.5" style={{ color: "var(--text-1)" }}>
                  {k.val}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* Layer 2 — calculation */}
        <Layer color="var(--blue)" icon="\uD83D\uDCD0" title="Calculation">
          <div className="space-y-1">
            <p className="font-semibold" style={{ color: "var(--text-1)" }}>
              Current Assets (CA)
            </p>
            <div className="pl-3 space-y-0.5">
              <p>Cash & Bank: {fL(R.cash)}L</p>
              <p>Debtors: {fL(R.debtors)}L</p>
              <p>Closing Stock: {fL(R.stkC)}L</p>
              <p>Other current assets: 14.1L</p>
            </div>
            <p className="font-semibold mt-2" style={{ color: "var(--text-1)" }}>
              Current Liabilities (CL)
            </p>
            <div className="pl-3 space-y-0.5">
              <p>Creditors: {fL(R.cred)}L</p>
              <p>Provisions: {fL(R.prov)}L</p>
            </div>
            <p className="mt-2 font-semibold" style={{ color: "var(--blue)" }}>
              CR = CA / CL = {fL(ca)}L / {fL(cl)}L = {ratio.toFixed(2)}
            </p>
          </div>
        </Layer>

        {/* Layer 3 — sources */}
        <Layer color="var(--purple)" icon="\uD83D\uDD0D" title="Sources">
          <table className="w-full text-[11px]">
            <thead>
              <tr style={{ color: "var(--text-4)" }}>
                <th className="text-left py-1">Field</th>
                <th className="text-right py-1">Value</th>
                <th className="text-left py-1 pl-3">Source</th>
              </tr>
            </thead>
            <tbody>
              {[
                { f: "Cash & Bank", v: `${fL(R.cash)}L`, s: "Balance Sheet > Cash & Bank" },
                { f: "Debtors", v: `${fL(R.debtors)}L`, s: "Balance Sheet > Sundry Debtors" },
                { f: "Closing Stock", v: `${fL(R.stkC)}L`, s: "Balance Sheet > Inventory" },
                { f: "Creditors", v: `${fL(R.cred)}L`, s: "Balance Sheet > Sundry Creditors" },
              ].map((r) => (
                <tr key={r.f} style={{ borderTop: "1px solid var(--border)" }}>
                  <td className="py-1">{r.f}</td>
                  <td className="py-1 text-right font-medium">{r.v}</td>
                  <td className="py-1 pl-3" style={{ color: "var(--text-4)" }}>{r.s}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </Layer>

        {/* Layer 4 — Riko's take */}
        <Layer color="var(--yellow)" icon="\uD83D\uDCA1" title="Riko's take">
          <p>
            Inventory (Closing Stock) at <strong>{fL(R.stkC)}L</strong> makes up ~83% of your current
            assets. If stock doesn&apos;t convert to cash quickly, your{" "}
            <strong>Quick Ratio ({K.qr.toFixed(2)})</strong> tells a different story. Consider
            reviewing slow-moving SKUs and optimising your inventory cycle.
          </p>
        </Layer>

        <div className="mt-2">
          <ExportBar />
        </div>
        <Chips items={["Quick Ratio?", "Creditor list", "vs Last Quarter"]} />
      </RikoMsg>
    </>
  );
}

/* ── Exchange 2: Who owes me ── */
function ExchangeReceivables() {
  const top5 = RECEIVABLES.slice(0, 5);
  return (
    <>
      <UserBubble text="Who owes me money?" />
      <RikoMsg>
        <div
          className="rounded-xl p-4 mb-2"
          style={{ background: "var(--bg-surface)", border: "1px solid var(--border)" }}
        >
          <p className="text-sm font-bold mb-3" style={{ color: "var(--text-1)" }}>
            Top 5 Receivables
          </p>
          <div className="space-y-2">
            {top5.map((r, i) => (
              <div
                key={r.name}
                className="flex items-center gap-3 rounded-lg px-3 py-2"
                style={{ background: "var(--bg-hover)" }}
              >
                <span
                  className="text-xs font-bold w-5 text-center"
                  style={{ color: "var(--text-4)" }}
                >
                  {i + 1}
                </span>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium truncate" style={{ color: "var(--text-1)" }}>
                    {r.name}
                  </p>
                  <p className="text-[10px]" style={{ color: "var(--text-4)" }}>
                    {r.days} days overdue &middot; {r.bills} bills
                  </p>
                </div>
                <span className="text-sm font-bold flex-shrink-0" style={{ color: "var(--text-1)" }}>
                  {"\u20B9"}{(r.amount / 1e5).toFixed(1)}L
                </span>
                <button
                  className="text-[10px] font-semibold px-2 py-1 rounded-md flex-shrink-0 cursor-pointer"
                  style={{
                    background: "color-mix(in srgb, var(--green) 15%, transparent)",
                    color: "var(--green)",
                    border: "1px solid color-mix(in srgb, var(--green) 30%, transparent)",
                  }}
                >
                  Remind
                </button>
              </div>
            ))}
          </div>
        </div>
        <ExportBar />
      </RikoMsg>
    </>
  );
}

/* ── Exchange 3: Generate MIS ── */
function ExchangeMIS() {
  const previews = [
    { label: "P&L", icon: "\uD83D\uDCC9" },
    { label: "Balance Sheet", icon: "\uD83C\uDFE6" },
    { label: "Ratios", icon: "\uD83D\uDCCA" },
    { label: "Receivables", icon: "\uD83D\uDCCB" },
  ];

  return (
    <>
      <UserBubble text="Generate MIS for March" />
      <RikoMsg>
        <div
          className="rounded-xl p-4 mb-2"
          style={{ background: "var(--bg-surface)", border: "1px solid var(--border)" }}
        >
          <div className="flex items-center gap-2 mb-3">
            <span className="text-sm font-bold" style={{ color: "var(--text-1)" }}>
              MIS Report Ready
            </span>
            <Pill color="var(--blue)">10 sections</Pill>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {previews.map((p) => (
              <div
                key={p.label}
                className="rounded-lg px-3 py-3 flex flex-col items-center gap-1 cursor-pointer transition-colors"
                style={{
                  background: "var(--bg-hover)",
                  border: "1px solid var(--border)",
                }}
              >
                <span className="text-lg">{p.icon}</span>
                <span className="text-[10px] font-medium" style={{ color: "var(--text-3)" }}>
                  {p.label}
                </span>
              </div>
            ))}
          </div>
        </div>
        <ExportBar />
        <Chips items={["Add branding", "Schedule monthly", "Send to CA"]} />
      </RikoMsg>
    </>
  );
}

/* ── Context Panel (desktop right side) — topic-aware ── */
type ContextTopic = "ratio" | "receivables" | "mis";

function ContextPanel({ topic, onTopicChange }: { topic: ContextTopic; onTopicChange: (t: ContextTopic) => void }) {
  const ca = K.ca;
  const cl = K.cl;
  const ratio = K.cr;
  const quick = K.qr;
  const cashR = (R.cash / cl);

  const caItems = [
    { label: "Inventory", value: fL(R.stkC), pct: 83, color: "var(--purple)" },
    { label: "Debtors", value: "8.7", pct: 9, color: "var(--blue)" },
    { label: "Cash", value: fL(R.cash), pct: 6, color: "var(--green)" },
    { label: "Other", value: "2.0", pct: 2, color: "var(--text-4)" },
  ];

  const sources = [
    { field: "Cash & Bank", value: `${fL(R.cash)}L`, source: "ledger (Cash)" },
    { field: "Debtors", value: `${fL(R.debtors)}L`, source: "ledger (Debtors)" },
    { field: "Closing Stock", value: `${fL(R.stkC)}L`, source: "stock_items" },
    { field: "Other CA", value: "14.1L", source: "ledger (Loans)" },
    { field: "Creditors", value: `${fL(R.cred)}L`, source: "ledger (Creditors)" },
    { field: "Provisions", value: `${fL(R.prov)}L`, source: "ledger (Provisions)" },
  ];

  const topicLabels: Record<ContextTopic, string> = {
    ratio: "Current Ratio",
    receivables: "Receivables",
    mis: "MIS Report",
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      whileInView={{ opacity: 1, x: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.4 }}
      className="flex flex-col h-full overflow-y-auto"
    >
      {/* Header with topic tabs */}
      <div
        className="sticky top-0 z-10"
        style={{
          background: "var(--bg-secondary)",
          borderBottom: "1px solid var(--border)",
        }}
      >
        <div className="flex items-center justify-between px-5 pt-3">
          <span
            className="text-[10px] font-bold tracking-widest uppercase"
            style={{ color: "var(--text-4)" }}
          >
            Context — {topicLabels[topic]}
          </span>
          <div className="flex items-center gap-1.5">
            {["PDF", "Excel", "Email"].map((f) => (
              <button
                key={f}
                className="text-[10px] font-medium px-2 py-1 rounded-md cursor-pointer transition-opacity hover:opacity-80"
                style={{
                  background: "var(--bg-surface)",
                  border: "1px solid var(--border)",
                  color: "var(--text-3)",
                }}
              >
                {f}
              </button>
            ))}
          </div>
        </div>
        <div className="flex gap-1 px-5 pt-2 pb-0">
          {(["ratio", "receivables", "mis"] as ContextTopic[]).map((t) => {
            const active = topic === t;
            return (
              <button
                key={t}
                onClick={() => onTopicChange(t)}
                className="text-xs font-semibold px-3 py-2 transition-colors cursor-pointer"
                style={{
                  color: active ? "var(--green)" : "var(--text-4)",
                  borderBottom: active ? "2px solid var(--green)" : "2px solid transparent",
                  marginBottom: "-1px",
                }}
              >
                {topicLabels[t]}
              </button>
            );
          })}
        </div>
      </div>

      <div className="px-5 py-4 space-y-5 max-w-2xl">
        {/* === RATIO TOPIC === */}
        {topic === "ratio" && (
          <>
        {/* Hero KPIs */}
        <div className="grid grid-cols-3 gap-3">
          {[
            { label: "Current Ratio", value: ratio.toFixed(2), status: "Healthy", statusColor: "var(--green)", bench: "> 2.0 healthy" },
            { label: "Quick Ratio", value: quick.toFixed(2), status: "Low", statusColor: "var(--red)", bench: "> 1.0 ideal" },
            { label: "Cash Ratio", value: cashR.toFixed(2), status: "Watch", statusColor: "var(--yellow)", bench: "> 0.5 safe" },
          ].map((kpi) => (
            <div
              key={kpi.label}
              className="rounded-xl p-3"
              style={{ background: "var(--bg-surface)", border: "1px solid var(--border)" }}
            >
              <p className="text-[10px] uppercase tracking-wider mb-1" style={{ color: "var(--text-4)" }}>
                {kpi.label}
              </p>
              <p
                className="text-2xl font-bold"
                style={{ color: kpi.statusColor, fontFamily: "'Space Grotesk', sans-serif" }}
              >
                {kpi.value}
              </p>
              <span
                className="inline-block text-[10px] font-semibold px-2 py-0.5 rounded-full mt-1"
                style={{
                  background: `color-mix(in srgb, ${kpi.statusColor} 15%, transparent)`,
                  color: kpi.statusColor,
                }}
              >
                {kpi.status}
              </span>
              <p className="text-[10px] mt-1" style={{ color: "var(--text-4)" }}>
                {kpi.bench}
              </p>
            </div>
          ))}
        </div>

        {/* Calculation Breakdown */}
        <div
          className="rounded-xl p-4"
          style={{ background: "var(--bg-surface)", border: "1px solid var(--border)" }}
        >
          <p className="text-xs font-bold mb-3" style={{ color: "var(--text-1)" }}>
            Calculation Breakdown
          </p>
          <div className="space-y-1.5 text-xs" style={{ color: "var(--text-2)" }}>
            <p className="font-semibold" style={{ color: "var(--text-1)" }}>
              Current Assets (CA) = {fL(ca)}L
            </p>
            <div className="pl-3 space-y-0.5 text-[11px]">
              <p>Cash & Bank: {fL(R.cash)}L <span style={{ color: "var(--text-4)" }}>&larr; Balance Sheet</span></p>
              <p>Debtors: {fL(R.debtors)}L <span style={{ color: "var(--text-4)" }}>&larr; Sundry Debtors</span></p>
              <p>Closing Stock: {fL(R.stkC)}L <span style={{ color: "var(--text-4)" }}>&larr; Inventory</span></p>
              <p>Other CA: 14.1L <span style={{ color: "var(--text-4)" }}>&larr; Loans & Advances</span></p>
            </div>
            <p className="font-semibold pt-1" style={{ color: "var(--text-1)" }}>
              Current Liabilities (CL) = {fL(cl)}L
            </p>
            <div className="pl-3 space-y-0.5 text-[11px]">
              <p>Creditors: {fL(R.cred)}L <span style={{ color: "var(--text-4)" }}>&larr; Sundry Creditors</span></p>
              <p>Provisions: {fL(R.prov)}L <span style={{ color: "var(--text-4)" }}>&larr; Provisions</span></p>
            </div>
            <div
              className="mt-2 px-3 py-2 rounded-lg text-xs font-bold"
              style={{
                background: "color-mix(in srgb, var(--blue) 10%, transparent)",
                color: "var(--blue)",
              }}
            >
              CR = CA / CL = {fL(ca)}L / {fL(cl)}L = {ratio.toFixed(2)}
            </div>
          </div>
        </div>

        {/* CA Composition */}
        <div
          className="rounded-xl p-4"
          style={{ background: "var(--bg-surface)", border: "1px solid var(--border)" }}
        >
          <p className="text-xs font-bold mb-3" style={{ color: "var(--text-1)" }}>
            CA Composition
          </p>
          <div className="space-y-2.5">
            {caItems.map((item) => (
              <div key={item.label}>
                <div className="flex justify-between text-[11px] mb-1">
                  <span style={{ color: "var(--text-2)" }}>{item.label}</span>
                  <span style={{ color: "var(--text-3)" }}>
                    {item.value}L ({item.pct}%)
                  </span>
                </div>
                <div
                  className="h-2 rounded-full overflow-hidden"
                  style={{ background: "var(--bg-hover)" }}
                >
                  <div
                    className="h-full rounded-full transition-all"
                    style={{
                      width: `${item.pct}%`,
                      background: item.color,
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Data Sources */}
        <div
          className="rounded-xl p-4"
          style={{ background: "var(--bg-surface)", border: "1px solid var(--border)" }}
        >
          <p className="text-xs font-bold mb-3" style={{ color: "var(--text-1)" }}>
            Data Sources
          </p>
          <table className="w-full text-[11px]">
            <thead>
              <tr style={{ color: "var(--text-4)" }}>
                <th className="text-left py-1 font-medium">Field</th>
                <th className="text-right py-1 font-medium">Value</th>
                <th className="text-left py-1 pl-3 font-medium">Source</th>
              </tr>
            </thead>
            <tbody>
              {sources.map((row) => (
                <tr key={row.field} style={{ borderTop: "1px solid var(--border)" }}>
                  <td className="py-1.5" style={{ color: "var(--text-2)" }}>{row.field}</td>
                  <td className="py-1.5 text-right font-medium" style={{ color: "var(--text-1)" }}>
                    {row.value}
                  </td>
                  <td className="py-1.5 pl-3">
                    <span
                      className="text-[10px] font-medium px-1.5 py-0.5 rounded"
                      style={{
                        background: "color-mix(in srgb, var(--purple) 15%, transparent)",
                        color: "var(--purple)",
                      }}
                    >
                      {row.source}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Export Buttons */}
        <div className="flex items-center gap-2 flex-wrap">
          {[
            { label: "PDF", color: "var(--red)" },
            { label: "Excel", color: "var(--green)" },
            { label: "Email", color: "var(--blue)" },
          ].map(({ label, color }) => (
            <button
              key={label}
              className="flex items-center gap-1.5 text-xs font-medium px-3 py-2 rounded-lg transition-opacity hover:opacity-80 cursor-pointer"
              style={{
                background: `color-mix(in srgb, ${color} 10%, transparent)`,
                border: `1px solid color-mix(in srgb, ${color} 30%, transparent)`,
                color,
              }}
            >
              {label}
            </button>
          ))}
        </div>
          </>
        )}

        {/* === RECEIVABLES TOPIC === */}
        {topic === "receivables" && (
          <>
            {/* Summary stats */}
            <div className="grid grid-cols-3 gap-3">
              {[
                { label: "Total Outstanding", value: "₹34.1L", color: "var(--red)" },
                { label: "Overdue Parties", value: "5", color: "var(--yellow)" },
                { label: "Avg DSO", value: `${K.dso.toFixed(0)}d`, color: "var(--blue)" },
              ].map((k) => (
                <div key={k.label} className="rounded-xl p-3"
                  style={{ background: "var(--bg-surface)", border: "1px solid var(--border)" }}>
                  <p className="text-[10px] uppercase tracking-wider mb-1" style={{ color: "var(--text-4)" }}>
                    {k.label}
                  </p>
                  <p className="text-2xl font-bold" style={{ color: k.color, fontFamily: "'Space Grotesk', sans-serif" }}>
                    {k.value}
                  </p>
                </div>
              ))}
            </div>

            {/* Aging buckets */}
            <div className="rounded-xl p-4" style={{ background: "var(--bg-surface)", border: "1px solid var(--border)" }}>
              <p className="text-xs font-bold mb-3" style={{ color: "var(--text-1)" }}>Aging Buckets</p>
              {[
                { label: "0-30 days", value: "₹1.7L", pct: 5, color: "var(--green)" },
                { label: "30-90 days", value: "₹3.4L", pct: 10, color: "var(--blue)" },
                { label: "90-365 days", value: "₹5.1L", pct: 15, color: "var(--yellow)" },
                { label: "365+ days", value: "₹23.9L", pct: 70, color: "var(--red)" },
              ].map((b) => (
                <div key={b.label} className="mb-2.5 last:mb-0">
                  <div className="flex justify-between text-[11px] mb-1">
                    <span style={{ color: "var(--text-2)" }}>{b.label}</span>
                    <span style={{ color: b.color, fontWeight: 600 }}>{b.value} ({b.pct}%)</span>
                  </div>
                  <div className="h-2 rounded-full overflow-hidden" style={{ background: "var(--bg-hover)" }}>
                    <div className="h-full rounded-full" style={{ width: `${b.pct}%`, background: b.color }} />
                  </div>
                </div>
              ))}
            </div>

            {/* Top parties detail */}
            <div className="rounded-xl p-4" style={{ background: "var(--bg-surface)", border: "1px solid var(--border)" }}>
              <p className="text-xs font-bold mb-3" style={{ color: "var(--text-1)" }}>Priority Action Plan</p>
              <div className="space-y-2">
                {RECEIVABLES.slice(0, 5).map((r, i) => (
                  <div key={r.name} className="flex items-center gap-2 text-xs">
                    <span className="w-5 text-center font-bold" style={{ color: "var(--text-4)" }}>{i + 1}</span>
                    <span className="flex-1 truncate" style={{ color: "var(--text-2)" }}>{r.name}</span>
                    <span className="font-bold tabular-nums" style={{ color: "var(--text-1)", fontFamily: "'Space Grotesk', sans-serif" }}>
                      ₹{(r.amount / 1e5).toFixed(1)}L
                    </span>
                    <span className="text-[10px] tabular-nums" style={{ color: r.days > 365 ? "var(--red)" : "var(--yellow)" }}>
                      {r.days.toLocaleString()}d
                    </span>
                  </div>
                ))}
              </div>
              <div className="mt-3 p-2 rounded-lg text-[11px]"
                style={{ background: "color-mix(in srgb, var(--green) 10%, transparent)", color: "var(--green)" }}>
                💡 Batch-send WhatsApp reminders to all 5 — recover up to ₹34L
              </div>
            </div>
          </>
        )}

        {/* === MIS TOPIC === */}
        {topic === "mis" && (
          <>
            {/* MIS Preview */}
            <div className="rounded-xl overflow-hidden"
              style={{ background: "#fff", border: "1px solid var(--border)" }}>
              <div className="p-5" style={{ color: "#0F172A" }}>
                <p className="text-[10px] uppercase tracking-widest font-bold mb-1" style={{ color: "#64748B" }}>
                  Management Information System
                </p>
                <p className="text-lg font-bold">Monthly MIS Report</p>
                <p className="text-xs mt-0.5" style={{ color: "#64748B" }}>
                  Bandra Soap Pvt Ltd · March 2026
                </p>
                <hr className="my-3" style={{ borderColor: "#E2E8F0" }} />

                <p className="text-xs font-bold mb-2" style={{ color: "#0F172A" }}>P&L Summary</p>
                <table className="w-full text-[11px] mb-3">
                  <tbody>
                    {[
                      { label: "Revenue", value: "₹9.25 Cr", bold: true },
                      { label: "COGS", value: "₹1.61 Cr" },
                      { label: "Gross Profit (82.5%)", value: "₹7.63 Cr", bold: true, color: "#16A34A" },
                      { label: "OpEx", value: "₹9.98 Cr" },
                      { label: "EBITDA (-18.9%)", value: "-₹1.74 Cr", bold: true, color: "#DC2626" },
                      { label: "Net Loss", value: "-₹2.24 Cr", bold: true, color: "#DC2626" },
                    ].map((r) => (
                      <tr key={r.label} style={{ borderTop: "1px solid #F1F5F9" }}>
                        <td className="py-1" style={{ color: r.color || (r.bold ? "#0F172A" : "#475569"), fontWeight: r.bold ? 600 : 400 }}>
                          {r.label}
                        </td>
                        <td className="py-1 text-right tabular-nums"
                          style={{ color: r.color || "#0F172A", fontWeight: r.bold ? 700 : 500, fontFamily: "'Space Grotesk', sans-serif" }}>
                          {r.value}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>

                <p className="text-xs font-bold mb-2" style={{ color: "#0F172A" }}>Key Ratios</p>
                <div className="grid grid-cols-5 gap-1.5 mb-3">
                  {[
                    { label: "CR", value: "2.60", color: "#16A34A" },
                    { label: "QR", value: "0.46", color: "#DC2626" },
                    { label: "GM", value: "82%", color: "#16A34A" },
                    { label: "DSO", value: "3d", color: "#16A34A" },
                    { label: "CCC", value: "32d", color: "#F59E0B" },
                  ].map((k) => (
                    <div key={k.label} className="text-center p-2 rounded-md" style={{ background: "#F8FAFC" }}>
                      <p className="text-[9px]" style={{ color: "#64748B" }}>{k.label}</p>
                      <p className="text-sm font-bold" style={{ color: k.color, fontFamily: "'Space Grotesk', sans-serif" }}>
                        {k.value}
                      </p>
                    </div>
                  ))}
                </div>

                <p className="text-xs font-bold mb-2" style={{ color: "#0F172A" }}>GST Summary</p>
                <div className="grid grid-cols-3 gap-2 text-[11px]">
                  <div className="p-2 rounded-md" style={{ background: "#F0FDF4" }}>
                    <p style={{ color: "#64748B" }}>ITC Available</p>
                    <p className="font-bold" style={{ color: "#16A34A", fontFamily: "'Space Grotesk', sans-serif" }}>₹1.08 Cr</p>
                  </div>
                  <div className="p-2 rounded-md" style={{ background: "#FEF2F2" }}>
                    <p style={{ color: "#64748B" }}>GST Liability</p>
                    <p className="font-bold" style={{ color: "#DC2626", fontFamily: "'Space Grotesk', sans-serif" }}>₹1.03 Cr</p>
                  </div>
                  <div className="p-2 rounded-md" style={{ background: "#FFFBEB" }}>
                    <p style={{ color: "#64748B" }}>Excess ITC</p>
                    <p className="font-bold" style={{ color: "#F59E0B", fontFamily: "'Space Grotesk', sans-serif" }}>₹4.61 L</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Report sections */}
            <div className="rounded-xl p-4" style={{ background: "var(--bg-surface)", border: "1px solid var(--border)" }}>
              <p className="text-xs font-bold mb-3" style={{ color: "var(--text-1)" }}>10 Sections Included</p>
              <div className="grid grid-cols-2 gap-2">
                {[
                  "P&L Statement", "Balance Sheet", "Key Ratios", "Cash Flow",
                  "Receivables Ageing", "Payables Summary", "GST Summary",
                  "Monthly Trends", "AI Recommendations", "Raw Data Appendix",
                ].map((s) => (
                  <div key={s} className="flex items-center gap-2 text-[11px]" style={{ color: "var(--text-2)" }}>
                    <span style={{ color: "var(--green)" }}>✓</span>
                    {s}
                  </div>
                ))}
              </div>
            </div>

            {/* Branding action */}
            <div className="rounded-xl p-4"
              style={{ background: "color-mix(in srgb, var(--green) 8%, transparent)", border: "1px solid color-mix(in srgb, var(--green) 25%, transparent)" }}>
              <p className="text-xs font-bold mb-1" style={{ color: "var(--green)" }}>💡 Add CA firm branding</p>
              <p className="text-[11px]" style={{ color: "var(--text-2)" }}>
                Upload your firm logo and let Riko auto-brand every report for your clients.
              </p>
            </div>
          </>
        )}
      </div>
    </motion.div>
  );
}

/* ── Input Bar (reusable) ──
   Mobile: sits right above the 60px bottom nav (plus iPhone notch safe-area).
   Desktop: sticks to bottom-0 (no bottom nav on desktop). */
function InputBar({ inputVal, setInputVal }: { inputVal: string; setInputVal: (v: string) => void }) {
  return (
    <div
      className="sticky bottom-[calc(60px+env(safe-area-inset-bottom,0px))] md:bottom-0 px-4 py-3"
      style={{
        background: "var(--bg-primary)",
        borderTop: "1px solid var(--border)",
      }}
    >
      <div
        className="flex items-center gap-2 rounded-xl px-3 py-2"
        style={{
          background: "var(--bg-surface)",
          border: "1px solid var(--border)",
        }}
      >
        <input
          type="text"
          value={inputVal}
          onChange={(e) => setInputVal(e.target.value)}
          placeholder="Ask Riko anything..."
          className="flex-1 bg-transparent text-sm outline-none"
          style={{ color: "var(--text-1)" }}
        />
        <button
          className="p-1.5 rounded-lg cursor-pointer transition-opacity hover:opacity-70"
          style={{ color: "var(--text-4)" }}
        >
          <Mic size={18} />
        </button>
        <button
          className="p-2 rounded-lg cursor-pointer"
          style={{ background: "var(--green)" }}
        >
          <Send size={16} className="text-white" />
        </button>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════
   Main Chat Screen
   ═══════════════════════════════════════════ */
export function ChatScreen() {
  const [started, setStarted] = useState(false);
  const [inputVal, setInputVal] = useState("");
  const [contextTopic, setContextTopic] = useState<ContextTopic>("ratio");

  /* ── Empty state ── */
  if (!started) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={{ once: true }}
        transition={{ duration: 0.4 }}
        className="flex flex-col items-center justify-center flex-1 px-4 py-10 max-w-xl mx-auto w-full"
      >
        {/* Avatar */}
        <div
          className="w-16 h-16 rounded-full flex items-center justify-center mb-5"
          style={{ background: "linear-gradient(135deg, var(--green), var(--green-dark))" }}
        >
          <span className="text-white text-2xl font-bold">R</span>
        </div>

        <h2 className="text-xl font-bold mb-1" style={{ color: "var(--text-1)" }}>
          Kya jaanna hai?
        </h2>
        <p className="text-sm mb-6" style={{ color: "var(--text-3)" }}>
          Ask in English, Hindi, or Hinglish
        </p>

        {/* Quick action pills */}
        <div className="flex flex-wrap justify-center gap-2 mb-8">
          {QUICK_ACTIONS.map((a) => (
            <button
              key={a.label}
              onClick={() => setStarted(true)}
              className="flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-full cursor-pointer transition-colors"
              style={{
                background: "var(--bg-surface)",
                border: "1px solid var(--border)",
                color: "var(--text-2)",
              }}
            >
              <span>{a.emoji}</span>
              {a.label}
            </button>
          ))}
        </div>

        {/* Starter prompts */}
        <div className="w-full space-y-2 mb-4">
          {CHAT_PROMPTS.map((p) => (
            <button
              key={p.query}
              onClick={() => setStarted(true)}
              className="flex items-center gap-3 w-full px-4 py-3 rounded-lg transition-colors cursor-pointer"
              style={{
                background: "var(--bg-surface)",
                border: "1px solid var(--border)",
              }}
            >
              <span className="text-base">{p.icon}</span>
              <span className="flex-1 text-left text-sm" style={{ color: "var(--text-2)" }}>
                {p.query}
              </span>
              <span style={{ color: "var(--green)" }}>{"\u2192"}</span>
            </button>
          ))}
        </div>

        {/* Input bar in empty state */}
        <div className="w-full">
          <InputBar inputVal={inputVal} setInputVal={setInputVal} />
        </div>
      </motion.div>
    );
  }

  /* ── Conversation state — dual panel on desktop ── */
  return (
    <motion.div
      initial={{ opacity: 0 }}
      whileInView={{ opacity: 1 }}
      viewport={{ once: true }}
      transition={{ duration: 0.3 }}
      className="flex flex-1 w-full"
    >
      {/* Left panel — chat conversation */}
      <div className="flex flex-col flex-1 md:w-[48%] md:flex-none md:border-r min-w-0" style={{ borderColor: "var(--border)" }}>
        {/* Scrollable conversation */}
        <div className="flex-1 overflow-y-auto px-4 py-4 space-y-2">
          <div onClick={() => setContextTopic("ratio")}>
            <ExchangeCurrentRatio />
          </div>
          <div onClick={() => setContextTopic("receivables")}>
            <ExchangeReceivables />
          </div>
          <div onClick={() => setContextTopic("mis")}>
            <ExchangeMIS />
          </div>
        </div>

        {/* Input bar */}
        <InputBar inputVal={inputVal} setInputVal={setInputVal} />
      </div>

      {/* Right panel — reactive context (desktop only) */}
      <div
        className="hidden md:flex md:flex-col md:w-[52%] min-w-0"
        style={{ background: "var(--bg-secondary)" }}
      >
        <ContextPanel topic={contextTopic} onTopicChange={setContextTopic} />
      </div>
    </motion.div>
  );
}
