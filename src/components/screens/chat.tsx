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

/* ═══════════════════════════════════════════
   Main Chat Screen
   ═══════════════════════════════════════════ */
export function ChatScreen() {
  const [started, setStarted] = useState(false);
  const [inputVal, setInputVal] = useState("");

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
        <div className="w-full space-y-2">
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
      </motion.div>
    );
  }

  /* ── Conversation state ── */
  return (
    <motion.div
      initial={{ opacity: 0 }}
      whileInView={{ opacity: 1 }}
      viewport={{ once: true }}
      transition={{ duration: 0.3 }}
      className="flex flex-col flex-1 max-w-2xl mx-auto w-full"
    >
      {/* Scrollable conversation */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-2">
        <ExchangeCurrentRatio />
        <ExchangeReceivables />
        <ExchangeMIS />
      </div>

      {/* Input bar */}
      <div
        className="sticky bottom-0 px-4 py-3"
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
    </motion.div>
  );
}
