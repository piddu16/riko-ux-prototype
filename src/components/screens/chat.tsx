"use client";

/* ═══════════════════════════════════════════════════════════════
   Chat — intent-routed, chart-rich, with inline GST recon
   ═══════════════════════════════════════════════════════════════
   • Functional input: keyword-routed to an intent renderer
   • Library of graphs used in responses (bar/line/donut/forecast/waterfall)
   • GST 2B reconciliation works inline in chat (no page switch)
   • Categorized empty-state prompts (Cash/Compliance/Growth/Ops)
   • Follow-up chips dispatch new user messages
   • Desktop: right "Insights" panel (recent topics + related prompts)
   ═══════════════════════════════════════════════════════════════ */

import { useEffect, useMemo, useRef, useState, type JSX } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Send,
  Mic,
  ChevronDown,
  ChevronRight,
  Wallet,
  Landmark,
  TrendingUp,
  Package,
  Sparkles,
  RotateCcw,
} from "lucide-react";
import {
  RECEIVABLES,
  PAYABLES,
  R,
  K,
  MONTHS,
  TOP_CUSTOMERS,
  CASH_FORECAST_WEEKS,
  CASH_FORECAST_SCENARIOS,
  DEAD_STOCK,
  DEAD_STOCK_SUMMARY,
  GST_HEALTH,
  RECONCILIATION,
  RETURNS_SUMMARY,
  RETURNS_BY_CHANNEL,
  WATERFALL,
  HEALTH_SCORES,
  fL,
} from "@/lib/data";
import { Pill } from "@/components/ui/pill";
import { ExportBar } from "@/components/ui/export-bar";
import {
  ChatBarChart,
  ChatLineChart,
  ChatDonut,
  ChatStackedBar,
  ChatWaterfall,
  ChatForecastChart,
  ChatKpi,
} from "@/components/ui/chat-charts";
import { ChatGstRecon } from "@/components/ui/chat-gst-recon";
import { Gauge } from "@/components/ui/gauge";

/* ═══════════════════════════════════════════════════════════════
   Intents — what a message can be about
   ═══════════════════════════════════════════════════════════════ */
type Intent =
  | "current-ratio"
  | "receivables"
  | "payables"
  | "mis"
  | "revenue-trend"
  | "cash-flow"
  | "runway"
  | "expense-breakdown"
  | "waterfall"
  | "gst-recon"
  | "gst-health"
  | "top-customers"
  | "health-score"
  | "inventory-dead"
  | "returns"
  | "unknown";

type ChatMessage =
  | { id: string; role: "user"; text: string; intent?: Intent }
  | { id: string; role: "assistant"; intent: Intent; typing?: boolean };

/* ═══════════════════════════════════════════════════════════════
   Intent classifier — matches user text to an intent
   ═══════════════════════════════════════════════════════════════ */
function classifyIntent(text: string): Intent {
  const q = text.toLowerCase().trim();
  if (!q) return "unknown";

  // Order matters — more specific first
  if (/recon|gstr.?2b|2b\b|match.*invoice|itc.*risk/.test(q)) return "gst-recon";
  if (/gst.*health|gst.*score|filing.*streak|compliance.*health/.test(q))
    return "gst-health";
  if (/cash.*flow|forecast|week.*cash|6.?week|projection|weekly.*cash/.test(q))
    return "cash-flow";
  if (/runway|months.*left|how.*long.*survive|cash.*runway/.test(q)) return "runway";
  if (/waterfall|p&l|profit.*loss|loss.*why|losing.*money/.test(q))
    return "waterfall";
  if (/expens.*break|where.*money|spend.*break|cost.*break/.test(q))
    return "expense-breakdown";
  if (/(current|quick|cash).*ratio|liquidity/.test(q)) return "current-ratio";
  if (/owe.*me|receivab|debtor|collect|overdue/.test(q)) return "receivables";
  if (/\bi.*owe|pay.*vendor|payabl|creditor|msme/.test(q)) return "payables";
  if (/top.*customer|best.*customer|biggest.*client|ltv/.test(q))
    return "top-customers";
  if (/dead.*stock|slow.*moving|obsolete.*sku|expiring/.test(q))
    return "inventory-dead";
  if (/return|refund|cancel.*order|credit.*note/.test(q)) return "returns";
  if (/revenue.*trend|sales.*trend|revenue.*month|monthly.*revenue|growth/.test(q))
    return "revenue-trend";
  if (/health.*score|business.*health/.test(q)) return "health-score";
  if (/\bmis\b|report|board.*deck|investor/.test(q)) return "mis";

  return "unknown";
}

/* ═══════════════════════════════════════════════════════════════
   Shared UI helpers
   ═══════════════════════════════════════════════════════════════ */
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

function Chips({
  items,
  onPick,
}: {
  items: string[];
  onPick: (q: string) => void;
}) {
  return (
    <div className="flex flex-wrap gap-1.5 mt-2">
      {items.map((t) => (
        <button
          key={t}
          onClick={() => onPick(t)}
          className="text-[11px] px-2.5 py-1 rounded-full cursor-pointer transition-colors hover:opacity-80"
          style={{
            background: "var(--bg-surface)",
            border: "1px solid var(--border)",
            color: "var(--text-2)",
          }}
        >
          {t}
        </button>
      ))}
    </div>
  );
}

function UserBubble({ text }: { text: string }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2 }}
      className="flex justify-end mb-3"
    >
      <div
        className="max-w-[80%] px-4 py-2.5 rounded-2xl rounded-br-md text-sm"
        style={{
          background: "color-mix(in srgb, var(--green) 15%, transparent)",
          color: "var(--text-1)",
        }}
      >
        {text}
      </div>
    </motion.div>
  );
}

function RikoMsg({ children }: { children: React.ReactNode }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25 }}
      className="flex gap-2 mb-5"
    >
      <div
        className="w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5"
        style={{ background: "linear-gradient(135deg, var(--green), var(--green-dark))" }}
      >
        <span className="text-white text-[10px] font-bold">R</span>
      </div>
      <div className="flex-1 min-w-0">{children}</div>
    </motion.div>
  );
}

function TypingIndicator() {
  return (
    <RikoMsg>
      <div
        className="inline-flex items-center gap-1.5 px-3 py-2.5 rounded-xl"
        style={{ background: "var(--bg-surface)", border: "1px solid var(--border)" }}
      >
        {[0, 1, 2].map((i) => (
          <motion.span
            key={i}
            className="w-1.5 h-1.5 rounded-full"
            style={{ background: "var(--green)" }}
            animate={{ opacity: [0.3, 1, 0.3] }}
            transition={{
              duration: 1.1,
              repeat: Infinity,
              delay: i * 0.18,
              ease: "easeInOut",
            }}
          />
        ))}
      </div>
    </RikoMsg>
  );
}

/* ═══════════════════════════════════════════════════════════════
   Exchange renderers — one per intent
   ═══════════════════════════════════════════════════════════════ */

/* ── Current ratio (preserved, includes charts) ── */
function ExchangeCurrentRatio({ onFollowup }: { onFollowup: (q: string) => void }) {
  const ca = K.ca;
  const cl = K.cl;
  const ratio = K.cr;

  return (
    <RikoMsg>
      <div
        className="rounded-xl p-4 mb-2"
        style={{ background: "var(--bg-surface)", border: "1px solid var(--border)" }}
      >
        <div className="flex items-center gap-3 mb-2 flex-wrap">
          <span
            className="text-2xl font-bold"
            style={{ color: "var(--green)", fontFamily: "'Space Grotesk', sans-serif" }}
          >
            Current Ratio: {ratio.toFixed(2)}
          </span>
          <Pill color="var(--green)">Healthy</Pill>
        </div>
        <p className="text-xs mb-3" style={{ color: "var(--text-3)" }}>
          Current assets cover liabilities {ratio.toFixed(1)}x. Above 2.0 is healthy for D2C.
        </p>
        <div className="grid grid-cols-3 gap-2">
          <ChatKpi label="Assets" value={`${fL(ca)}L`} />
          <ChatKpi label="Liabilities" value={`${fL(cl)}L`} />
          <ChatKpi label="Ratio" value={ratio.toFixed(2)} deltaColor="var(--green)" />
        </div>
      </div>

      {/* Composition donut */}
      <ChatDonut
        title="Current Assets composition"
        data={[
          { label: "Inventory", value: R.stkC, color: "var(--purple)" },
          { label: "Debtors", value: R.debtors, color: "var(--blue)" },
          { label: "Cash", value: R.cash, color: "var(--green)" },
          { label: "Other CA", value: 1410000, color: "var(--text-4)" },
        ]}
        centerValue={`${fL(ca)}L`}
        centerLabel="Total CA"
      />

      <Layer color="var(--blue)" icon="📐" title="Calculation">
        <div className="space-y-1">
          <p>CA = Cash ({fL(R.cash)}L) + Debtors ({fL(R.debtors)}L) + Stock ({fL(R.stkC)}L) + Other (14.1L) = {fL(ca)}L</p>
          <p>CL = Creditors ({fL(R.cred)}L) + Provisions ({fL(R.prov)}L) = {fL(cl)}L</p>
          <p className="pt-1 font-semibold" style={{ color: "var(--blue)" }}>
            CR = {fL(ca)}L / {fL(cl)}L = {ratio.toFixed(2)}
          </p>
        </div>
      </Layer>

      <Layer color="var(--yellow)" icon="💡" title="Riko's take">
        <p>
          Inventory at <strong>{fL(R.stkC)}L</strong> is ~83% of current assets. Your{" "}
          <strong>Quick Ratio ({K.qr.toFixed(2)})</strong> tells a different story — if stock
          doesn&apos;t convert fast, liquidity tightens. Review slow-moving SKUs.
        </p>
      </Layer>

      <div className="mt-2">
        <ExportBar />
      </div>
      <Chips
        items={["Show quick ratio", "Where is my cash stuck?", "Dead stock SKUs"]}
        onPick={onFollowup}
      />
    </RikoMsg>
  );
}

/* ── Receivables ── */
function ExchangeReceivables({ onFollowup }: { onFollowup: (q: string) => void }) {
  const top5 = RECEIVABLES.slice(0, 5);
  const total = RECEIVABLES.reduce((s, r) => s + r.amount, 0);
  const bucket0_30 = 170000;
  const bucket30_90 = 340000;
  const bucket90_365 = 510000;
  const bucket365 = total - bucket0_30 - bucket30_90 - bucket90_365;

  return (
    <RikoMsg>
      <div
        className="rounded-xl p-4 mb-2"
        style={{ background: "var(--bg-surface)", border: "1px solid var(--border)" }}
      >
        <div className="flex items-start justify-between mb-3 gap-3">
          <div>
            <p className="text-sm font-bold" style={{ color: "var(--text-1)" }}>
              Top Receivables
            </p>
            <p className="text-[11px]" style={{ color: "var(--text-4)" }}>
              Total outstanding: ₹{(total / 1e7).toFixed(2)}Cr · DSO {K.dso.toFixed(0)} days
            </p>
          </div>
          <Pill color="var(--red)">5 overdue</Pill>
        </div>
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
                <p
                  className="text-xs font-medium truncate"
                  style={{ color: "var(--text-1)" }}
                >
                  {r.name}
                </p>
                <p className="text-[10px]" style={{ color: "var(--text-4)" }}>
                  {r.days} days overdue · {r.bills} bills
                </p>
              </div>
              <span
                className="text-sm font-bold flex-shrink-0 tabular-nums"
                style={{ color: "var(--text-1)", fontFamily: "'Space Grotesk', sans-serif" }}
              >
                ₹{(r.amount / 1e5).toFixed(1)}L
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

      <ChatStackedBar
        title="Aging buckets"
        subtitle={`₹${(total / 1e7).toFixed(2)}Cr receivable across 4 buckets`}
        segments={[
          { label: "0-30d", value: bucket0_30, color: "var(--green)" },
          { label: "30-90d", value: bucket30_90, color: "var(--blue)" },
          { label: "90-365d", value: bucket90_365, color: "var(--yellow)" },
          { label: "365+d", value: bucket365, color: "var(--red)" },
        ]}
      />

      <Layer color="var(--green)" icon="💡" title="Recommended action">
        <p>
          Batch-send WhatsApp reminders to all 5 overdue parties — recover up to ₹34L. The
          365+ day bucket (₹{(bucket365 / 1e5).toFixed(1)}L) likely needs write-off review.
        </p>
      </Layer>

      <ExportBar />
      <Chips
        items={["Who do I owe?", "Send WhatsApp reminders", "Aging older than 365 days"]}
        onPick={onFollowup}
      />
    </RikoMsg>
  );
}

/* ── Payables ── */
function ExchangePayables({ onFollowup }: { onFollowup: (q: string) => void }) {
  const top5 = PAYABLES.slice(0, 5);
  const total = PAYABLES.reduce((s, p) => s + p.amount, 0);
  const msmeTotal = PAYABLES.filter((p) => p.msme).reduce((s, p) => s + p.amount, 0);

  return (
    <RikoMsg>
      <div
        className="rounded-xl p-4 mb-2"
        style={{ background: "var(--bg-surface)", border: "1px solid var(--border)" }}
      >
        <div className="flex items-center justify-between mb-3 gap-3">
          <div>
            <p className="text-sm font-bold" style={{ color: "var(--text-1)" }}>
              Vendors you owe
            </p>
            <p className="text-[11px]" style={{ color: "var(--text-4)" }}>
              ₹{(total / 1e7).toFixed(2)}Cr payable · ₹{(msmeTotal / 1e5).toFixed(1)}L MSME
            </p>
          </div>
          <Pill color="var(--orange)">MSME rule: 45d</Pill>
        </div>

        <div className="space-y-2">
          {top5.map((p, i) => (
            <div
              key={p.name}
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
                <div className="flex items-center gap-1.5">
                  <p
                    className="text-xs font-medium truncate"
                    style={{ color: "var(--text-1)" }}
                  >
                    {p.name}
                  </p>
                  {p.msme && (
                    <span
                      className="text-[9px] font-bold px-1 py-0.5 rounded"
                      style={{
                        background: "color-mix(in srgb, var(--orange) 15%, transparent)",
                        color: "var(--orange)",
                      }}
                    >
                      MSME
                    </span>
                  )}
                </div>
                <p className="text-[10px]" style={{ color: "var(--text-4)" }}>
                  {p.days}d aged · {p.category}
                </p>
              </div>
              <span
                className="text-sm font-bold flex-shrink-0 tabular-nums"
                style={{ color: "var(--text-1)", fontFamily: "'Space Grotesk', sans-serif" }}
              >
                ₹{(p.amount / 1e5).toFixed(1)}L
              </span>
            </div>
          ))}
        </div>
      </div>

      <Layer color="var(--orange)" icon="⚠️" title="MSME 45-day compliance">
        <p>
          Under the MSME Development Act, payments to registered Micro &amp; Small enterprises
          must clear within 45 days. Delay = disallowance under Section 43B(h) + interest.
        </p>
      </Layer>

      <ExportBar />
      <Chips
        items={["Who owes me?", "Cash flow next 6 weeks", "Generate MIS"]}
        onPick={onFollowup}
      />
    </RikoMsg>
  );
}

/* ── MIS ── */
function ExchangeMIS({ onFollowup }: { onFollowup: (q: string) => void }) {
  const previews = [
    { label: "P&L", icon: "📉" },
    { label: "Balance Sheet", icon: "🏦" },
    { label: "Ratios", icon: "📊" },
    { label: "Receivables", icon: "📋" },
  ];

  return (
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
              className="rounded-lg px-3 py-3 flex flex-col items-center gap-1 cursor-pointer"
              style={{ background: "var(--bg-hover)", border: "1px solid var(--border)" }}
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
      <Chips
        items={["Add branding", "Schedule monthly", "Send to CA"]}
        onPick={onFollowup}
      />
    </RikoMsg>
  );
}

/* ── Revenue trend ── */
function ExchangeRevenueTrend({ onFollowup }: { onFollowup: (q: string) => void }) {
  const maxIdx = R.ms.reduce((m, v, i) => (v > R.ms[m] ? i : m), 0);
  const minIdx = R.ms.reduce((m, v, i) => (v < R.ms[m] ? i : m), 0);

  return (
    <RikoMsg>
      <div
        className="rounded-xl p-4 mb-2"
        style={{ background: "var(--bg-surface)", border: "1px solid var(--border)" }}
      >
        <div className="flex items-center justify-between gap-3 mb-2 flex-wrap">
          <div>
            <p className="text-sm font-bold" style={{ color: "var(--text-1)" }}>
              FY{" "}
              {new Date().getFullYear() - 1}-{String(new Date().getFullYear()).slice(-2)}{" "}
              revenue
            </p>
            <p className="text-[11px]" style={{ color: "var(--text-4)" }}>
              Total: ₹{(R.rev / 1e7).toFixed(2)}Cr · YoY {K.yoy.toFixed(0)}%
            </p>
          </div>
          <Pill color={K.yoy >= 0 ? "var(--green)" : "var(--red)"}>
            {K.yoy >= 0 ? "↑" : "↓"} {Math.abs(K.yoy).toFixed(0)}% YoY
          </Pill>
        </div>
      </div>

      <ChatLineChart
        title="Monthly revenue"
        data={MONTHS.map((m, i) => ({ x: m, y: R.ms[i] }))}
        color="var(--green)"
        highlight={{
          index: maxIdx,
          label: `${MONTHS[maxIdx]} ₹${fL(R.ms[maxIdx])}L`,
        }}
      />

      <Layer color="var(--yellow)" icon="💡" title="Riko's take">
        <p>
          Best month was <strong>{MONTHS[maxIdx]}</strong> (₹{fL(R.ms[maxIdx])}L), worst{" "}
          <strong>{MONTHS[minIdx]}</strong> (₹{fL(R.ms[minIdx])}L). The{" "}
          <strong>{Math.abs(K.yoy).toFixed(0)}% YoY decline</strong> is driven by
          marketplace returns (Amazon 32%) and inventory issues. Focus on D2C channel
          which is growing fastest.
        </p>
      </Layer>

      <ExportBar />
      <Chips
        items={[
          "Top customers this year",
          "Why am I losing money?",
          "Returns by channel",
        ]}
        onPick={onFollowup}
      />
    </RikoMsg>
  );
}

/* ── Cash flow forecast ── */
function ExchangeCashFlow({ onFollowup }: { onFollowup: (q: string) => void }) {
  const base = CASH_FORECAST_SCENARIOS[0];
  return (
    <RikoMsg>
      <div
        className="rounded-xl p-4 mb-2"
        style={{ background: "var(--bg-surface)", border: "1px solid var(--border)" }}
      >
        <div className="flex items-center justify-between gap-3 mb-2 flex-wrap">
          <div>
            <p className="text-sm font-bold" style={{ color: "var(--text-1)" }}>
              Next 6 weeks cash forecast
            </p>
            <p className="text-[11px]" style={{ color: "var(--text-4)" }}>
              Based on confirmed invoices + recurring expenses
            </p>
          </div>
          <Pill color="var(--red)">Cash negative by W4</Pill>
        </div>
      </div>

      <ChatForecastChart title="Inflow vs outflow · running balance" weeks={CASH_FORECAST_WEEKS} />

      <div
        className="rounded-xl p-4 my-2"
        style={{ background: "var(--bg-surface)", border: "1px solid var(--border)" }}
      >
        <p className="text-xs font-bold mb-2" style={{ color: "var(--text-1)" }}>
          What changes the outcome
        </p>
        <div className="space-y-1.5">
          {CASH_FORECAST_SCENARIOS.map((s) => (
            <div
              key={s.label}
              className="flex items-center justify-between text-[11px] gap-2"
            >
              <span style={{ color: "var(--text-3)" }}>{s.label}</span>
              <div className="flex items-center gap-2">
                <span
                  className="tabular-nums font-semibold"
                  style={{ color: s.color, fontFamily: "'Space Grotesk', sans-serif" }}
                >
                  {s.runwayDays}d runway
                </span>
                <span
                  className="text-[9px] px-1.5 py-0.5 rounded tabular-nums"
                  style={{
                    background: `color-mix(in srgb, ${s.color} 10%, transparent)`,
                    color: s.color,
                  }}
                >
                  ₹{(s.endCash30d / 1e5).toFixed(1)}L @ 30d
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      <Layer color="var(--red)" icon="⚠️" title="Critical">
        <p>
          Base case: you run out of cash by <strong>W4 (May 9-15)</strong>. Chasing Nykaa
          (₹12.6L outstanding) alone would extend runway to{" "}
          <strong>{CASH_FORECAST_SCENARIOS[1].runwayDays} days</strong> — {base.runwayDays}
          → {CASH_FORECAST_SCENARIOS[1].runwayDays}.
        </p>
      </Layer>

      <ExportBar />
      <Chips
        items={["Who owes me?", "Cut marketing 30%", "Show runway gauge"]}
        onPick={onFollowup}
      />
    </RikoMsg>
  );
}

/* ── Runway gauge ── */
function ExchangeRunway({ onFollowup }: { onFollowup: (q: string) => void }) {
  const months = R.cash / K.burn;
  const days = Math.round(months * 30);
  return (
    <RikoMsg>
      <div
        className="rounded-xl p-4 mb-2"
        style={{ background: "var(--bg-surface)", border: "1px solid var(--border)" }}
      >
        <div className="flex items-center gap-4">
          <Gauge
            value={Math.min(days, 180)}
            min={0}
            max={180}
            thresholds={{ red: 30, yellow: 90 }}
            size={140}
            label="days"
          />
          <div className="flex-1">
            <p
              className="text-3xl font-bold"
              style={{
                color: days < 30 ? "var(--red)" : "var(--yellow)",
                fontFamily: "'Space Grotesk', sans-serif",
              }}
            >
              {days} days
            </p>
            <p className="text-xs mb-2" style={{ color: "var(--text-3)" }}>
              At current burn rate of ₹{fL(K.burn)}L/month
            </p>
            <div className="grid grid-cols-2 gap-2">
              <ChatKpi label="Cash" value={`₹${fL(R.cash)}L`} />
              <ChatKpi label="Burn/mo" value={`₹${fL(K.burn)}L`} deltaColor="var(--red)" />
            </div>
          </div>
        </div>
      </div>

      <Layer color="var(--red)" icon="🚨" title="This is urgent">
        <p>
          You have {days} days of cash. The actions that extend runway fastest: (1) collect
          Nykaa ₹12.6L, (2) file ITC refund ₹4.6L, (3) cut marketing 30%. Combined = ~60+
          days added.
        </p>
      </Layer>

      <ExportBar />
      <Chips
        items={["Show cash forecast", "Who owes me?", "Cut costs ideas"]}
        onPick={onFollowup}
      />
    </RikoMsg>
  );
}

/* ── Expense breakdown ── */
function ExchangeExpenses({ onFollowup }: { onFollowup: (q: string) => void }) {
  const totalExp =
    R.mkt + R.emp + R.cac + R.ful + R.orc + R.ovh + R.interest + R.cogs;
  return (
    <RikoMsg>
      <div
        className="rounded-xl p-4 mb-2"
        style={{ background: "var(--bg-surface)", border: "1px solid var(--border)" }}
      >
        <p className="text-sm font-bold mb-1" style={{ color: "var(--text-1)" }}>
          Where your money goes
        </p>
        <p className="text-[11px]" style={{ color: "var(--text-4)" }}>
          Total spend this FY: ₹{(totalExp / 1e7).toFixed(2)}Cr
        </p>
      </div>

      <ChatDonut
        title="Expense composition"
        data={[
          { label: "Marketing", value: R.mkt, color: "var(--red)" },
          { label: "Employees", value: R.emp, color: "var(--blue)" },
          { label: "CAC", value: R.cac, color: "var(--orange)" },
          { label: "COGS", value: R.cogs, color: "var(--purple)" },
          { label: "Fulfilment", value: R.ful, color: "var(--yellow)" },
          { label: "Overheads", value: R.ovh + R.orc, color: "var(--text-4)" },
        ]}
        centerValue={`₹${(totalExp / 1e7).toFixed(1)}Cr`}
        centerLabel="Total"
      />

      <ChatBarChart
        title="Top expense categories"
        data={[
          { label: "Marketing", value: R.mkt, color: "var(--red)" },
          { label: "Employees", value: R.emp, color: "var(--blue)" },
          { label: "CAC", value: R.cac, color: "var(--orange)" },
          { label: "COGS", value: R.cogs, color: "var(--purple)" },
          { label: "Fulfilment", value: R.ful, color: "var(--yellow)" },
        ]}
      />

      <Layer color="var(--yellow)" icon="💡" title="Riko's take">
        <p>
          Marketing (₹{(R.mkt / 1e7).toFixed(2)}Cr) + CAC (₹{(R.cac / 1e7).toFixed(2)}Cr)
          = <strong>₹{((R.mkt + R.cac) / 1e7).toFixed(2)}Cr</strong> on customer acquisition —
          larger than your gross profit. If you cut 30% here, you save ~₹
          {(((R.mkt + R.cac) * 0.3) / 1e5).toFixed(1)}L/mo and buy months of runway.
        </p>
      </Layer>

      <ExportBar />
      <Chips
        items={["Show P&L waterfall", "Cash flow forecast", "Dead stock"]}
        onPick={onFollowup}
      />
    </RikoMsg>
  );
}

/* ── P&L waterfall ── */
function ExchangeWaterfall({ onFollowup }: { onFollowup: (q: string) => void }) {
  return (
    <RikoMsg>
      <div
        className="rounded-xl p-4 mb-2"
        style={{ background: "var(--bg-surface)", border: "1px solid var(--border)" }}
      >
        <p className="text-sm font-bold" style={{ color: "var(--text-1)" }}>
          P&amp;L waterfall
        </p>
        <p className="text-[11px]" style={{ color: "var(--text-4)" }}>
          Revenue → EBITDA: how each cost eats into profit
        </p>
      </div>
      <ChatWaterfall data={WATERFALL} />
      <Layer color="var(--red)" icon="💡" title="Why you're losing money">
        <p>
          Gross profit is healthy (82.5%) but operating costs are{" "}
          <strong>₹{(R.indExp / 1e7).toFixed(2)}Cr</strong> against GP of ₹
          {(R.gp / 1e7).toFixed(2)}Cr. Marketing + CAC alone exceed GP. EBITDA burn is ₹
          {fL(K.burn)}L/mo.
        </p>
      </Layer>
      <ExportBar />
      <Chips
        items={["Where can I cut costs?", "Expense breakdown", "Cash forecast"]}
        onPick={onFollowup}
      />
    </RikoMsg>
  );
}

/* ── GST reconciliation (inline widget!) ── */
function ExchangeGstRecon({ onFollowup }: { onFollowup: (q: string) => void }) {
  return (
    <RikoMsg>
      <div
        className="rounded-xl p-4 mb-2"
        style={{ background: "var(--bg-surface)", border: "1px solid var(--border)" }}
      >
        <p className="text-sm font-bold" style={{ color: "var(--text-1)" }}>
          Reconciling Tally purchases with GSTR-2B
        </p>
        <p className="text-[11px]" style={{ color: "var(--text-4)" }}>
          {RECONCILIATION.totalTallyInvoices} Tally invoices · {RECONCILIATION.totalPortalInvoices}{" "}
          on portal · Last run {RECONCILIATION.lastRunAt}
        </p>
      </div>

      <ChatGstRecon period={RECONCILIATION.period} />

      <Chips
        items={[
          "How's my GST health?",
          "Generate GSTR-3B",
          "Excess ITC — how to claim?",
        ]}
        onPick={onFollowup}
      />
    </RikoMsg>
  );
}

/* ── GST health ── */
function ExchangeGstHealth({ onFollowup }: { onFollowup: (q: string) => void }) {
  return (
    <RikoMsg>
      <div
        className="rounded-xl p-4 mb-2"
        style={{ background: "var(--bg-surface)", border: "1px solid var(--border)" }}
      >
        <div className="flex items-center gap-4">
          <Gauge
            value={GST_HEALTH.score}
            min={0}
            max={100}
            thresholds={{ red: 50, yellow: 75 }}
            size={120}
            label="GST Health"
          />
          <div className="flex-1 space-y-1.5">
            <div className="flex items-center justify-between text-[11px]">
              <span style={{ color: "var(--text-3)" }}>Filing streak</span>
              <span
                className="font-bold tabular-nums"
                style={{ color: "var(--green)", fontFamily: "'Space Grotesk', sans-serif" }}
              >
                {GST_HEALTH.filingStreak} months
              </span>
            </div>
            <div className="flex items-center justify-between text-[11px]">
              <span style={{ color: "var(--text-3)" }}>Avg days early</span>
              <span
                className="font-bold tabular-nums"
                style={{ color: "var(--text-1)", fontFamily: "'Space Grotesk', sans-serif" }}
              >
                {GST_HEALTH.avgDaysBeforeDue} days
              </span>
            </div>
            <div className="flex items-center justify-between text-[11px]">
              <span style={{ color: "var(--text-3)" }}>ITC match rate</span>
              <span
                className="font-bold tabular-nums"
                style={{ color: "var(--blue)", fontFamily: "'Space Grotesk', sans-serif" }}
              >
                {GST_HEALTH.itcMatchRate}%
              </span>
            </div>
            <div className="flex items-center justify-between text-[11px]">
              <span style={{ color: "var(--text-3)" }}>Excess ITC unclaimed</span>
              <span
                className="font-bold tabular-nums"
                style={{
                  color: "var(--yellow)",
                  fontFamily: "'Space Grotesk', sans-serif",
                }}
              >
                ₹{(GST_HEALTH.excessItcUnclaimed / 1e5).toFixed(1)}L
              </span>
            </div>
          </div>
        </div>
      </div>

      <Layer color="var(--yellow)" icon="💡" title="One thing to fix">
        <p>
          You have <strong>₹{(GST_HEALTH.excessItcUnclaimed / 1e5).toFixed(1)}L</strong> of
          unused ITC. File an <strong>RFD-01</strong> refund application after your next
          3B — this lands cash in your bank in 60-90 days.
        </p>
      </Layer>

      <ExportBar />
      <Chips
        items={["Reconcile March 2B", "Generate GSTR-3B", "ITC refund process"]}
        onPick={onFollowup}
      />
    </RikoMsg>
  );
}

/* ── Top customers ── */
function ExchangeTopCustomers({ onFollowup }: { onFollowup: (q: string) => void }) {
  const top = TOP_CUSTOMERS.slice(0, 8);
  const total = TOP_CUSTOMERS.reduce((s, c) => s + c.revenue, 0);
  return (
    <RikoMsg>
      <div
        className="rounded-xl p-4 mb-2"
        style={{ background: "var(--bg-surface)", border: "1px solid var(--border)" }}
      >
        <p className="text-sm font-bold" style={{ color: "var(--text-1)" }}>
          Top customers by revenue
        </p>
        <p className="text-[11px]" style={{ color: "var(--text-4)" }}>
          Top 10 = ₹{(total / 1e7).toFixed(2)}Cr of ₹{(R.rev / 1e7).toFixed(2)}Cr total revenue
        </p>
      </div>

      <ChatBarChart
        data={top.map((c) => ({
          label: c.name,
          value: c.revenue,
          color:
            c.channel === "Marketplace"
              ? "var(--blue)"
              : c.channel === "D2C"
              ? "var(--green)"
              : "var(--purple)",
          caption: `${c.orders} orders · LTV ₹${(c.ltv / 1e5).toFixed(1)}L · ${c.channel}`,
        }))}
      />

      <Layer color="var(--green)" icon="💡" title="Riko's take">
        <p>
          <strong>Nykaa + Amazon + Website D2C</strong> = ~70% of revenue. Website D2C has the
          highest LTV (₹{(TOP_CUSTOMERS[3].ltv / 1e5).toFixed(1)}L) and lowest return rate
          (5.7%) — double down here.
        </p>
      </Layer>

      <ExportBar />
      <Chips
        items={["Returns by channel", "Revenue trend", "Biggest receivables"]}
        onPick={onFollowup}
      />
    </RikoMsg>
  );
}

/* ── Health score ── */
function ExchangeHealthScore({ onFollowup }: { onFollowup: (q: string) => void }) {
  const avg =
    HEALTH_SCORES.reduce((s, h) => s + h.score, 0) / HEALTH_SCORES.length;
  return (
    <RikoMsg>
      <div
        className="rounded-xl p-4 mb-2"
        style={{ background: "var(--bg-surface)", border: "1px solid var(--border)" }}
      >
        <div className="flex items-center gap-4 mb-3">
          <Gauge
            value={avg}
            min={0}
            max={100}
            thresholds={{ red: 40, yellow: 70 }}
            size={120}
            label="Overall"
          />
          <div className="flex-1 space-y-2">
            {HEALTH_SCORES.map((h) => (
              <div key={h.label}>
                <div className="flex justify-between text-[11px] mb-0.5">
                  <span style={{ color: "var(--text-2)" }}>{h.label}</span>
                  <span
                    className="tabular-nums font-bold"
                    style={{ color: h.color, fontFamily: "'Space Grotesk', sans-serif" }}
                  >
                    {h.score}
                  </span>
                </div>
                <div
                  className="h-1.5 rounded-full overflow-hidden"
                  style={{ background: "var(--bg-hover)" }}
                >
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${h.score}%` }}
                    transition={{ duration: 0.6 }}
                    className="h-full rounded-full"
                    style={{ background: h.color }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <Layer color="var(--red)" icon="💡" title="Growth is your biggest weakness">
        <p>
          Growth (15/100) is dragging the score. Revenue is down{" "}
          <strong>{Math.abs(K.yoy).toFixed(0)}% YoY</strong>. Focus on the Website D2C
          channel (+95%) to rebuild momentum.
        </p>
      </Layer>

      <ExportBar />
      <Chips
        items={["Revenue trend", "Cash runway", "Top customers"]}
        onPick={onFollowup}
      />
    </RikoMsg>
  );
}

/* ── Dead stock ── */
function ExchangeDeadStock({ onFollowup }: { onFollowup: (q: string) => void }) {
  return (
    <RikoMsg>
      <div
        className="rounded-xl p-4 mb-2"
        style={{ background: "var(--bg-surface)", border: "1px solid var(--border)" }}
      >
        <div className="flex items-center justify-between gap-3 mb-1 flex-wrap">
          <p className="text-sm font-bold" style={{ color: "var(--text-1)" }}>
            Dead stock
          </p>
          <Pill color="var(--red)">
            {DEAD_STOCK_SUMMARY.pctOfInventory.toFixed(1)}% of inventory
          </Pill>
        </div>
        <p className="text-[11px]" style={{ color: "var(--text-4)" }}>
          {DEAD_STOCK_SUMMARY.totalSkus} SKUs · ₹
          {(DEAD_STOCK_SUMMARY.totalValue / 1e5).toFixed(1)}L locked · avg age{" "}
          {DEAD_STOCK_SUMMARY.avgAge} months
        </p>
      </div>

      <ChatDonut
        title="By category"
        data={DEAD_STOCK_SUMMARY.categoryBreakdown.map((c, i) => ({
          label: c.category,
          value: c.value,
          color: ["var(--red)", "var(--orange)", "var(--yellow)"][i],
        }))}
        centerValue={`₹${(DEAD_STOCK_SUMMARY.totalValue / 1e5).toFixed(1)}L`}
        centerLabel="Locked"
      />

      <ChatBarChart
        title="Top 5 dead SKUs"
        data={DEAD_STOCK.slice(0, 5).map((s) => ({
          label: s.name,
          value: s.value,
          color: "var(--red)",
          caption: `${s.qty} units · last sold ${s.lastSold}`,
        }))}
      />

      <Layer color="var(--green)" icon="💡" title="Cash recovery play">
        <p>
          Liquidating even <strong>50%</strong> of dead stock at 40% off would unlock ~₹
          {((DEAD_STOCK_SUMMARY.totalValue * 0.5 * 0.6) / 1e5).toFixed(1)}L of cash and free
          warehouse space.
        </p>
      </Layer>

      <ExportBar />
      <Chips
        items={[
          "Show inventory health",
          "Cash flow impact",
          "Returns by channel",
        ]}
        onPick={onFollowup}
      />
    </RikoMsg>
  );
}

/* ── Returns ── */
function ExchangeReturns({ onFollowup }: { onFollowup: (q: string) => void }) {
  return (
    <RikoMsg>
      <div
        className="rounded-xl p-4 mb-2"
        style={{ background: "var(--bg-surface)", border: "1px solid var(--border)" }}
      >
        <div className="flex items-center justify-between gap-3 mb-1 flex-wrap">
          <p className="text-sm font-bold" style={{ color: "var(--text-1)" }}>
            Returns &amp; refunds
          </p>
          <Pill color="var(--red)">{RETURNS_SUMMARY.returnRate.toFixed(1)}% of gross</Pill>
        </div>
        <p className="text-[11px]" style={{ color: "var(--text-4)" }}>
          ₹{(RETURNS_SUMMARY.totalReturns / 1e7).toFixed(2)}Cr returned ·{" "}
          {RETURNS_SUMMARY.returnCount} orders · trending{" "}
          {RETURNS_SUMMARY.trendDirection} {RETURNS_SUMMARY.trendPct}%
        </p>
      </div>

      <ChatBarChart
        title="Return rate by channel"
        data={RETURNS_BY_CHANNEL.map((c) => ({
          label: c.channel,
          value: c.returns,
          color:
            c.rate > 20
              ? "var(--red)"
              : c.rate > 10
              ? "var(--orange)"
              : "var(--yellow)",
          caption: `${c.rate.toFixed(1)}% rate · top reason: ${c.topReason}`,
        }))}
      />

      <Layer color="var(--red)" icon="💡" title="Amazon is the problem">
        <p>
          Amazon has a <strong>32.5%</strong> return rate — 4x your D2C channel. Damaged-in-transit
          is the top reason. Better packaging + switch to standard FBA could cut returns by
          50%+, recovering ~₹{((7420000 * 0.5) / 1e5).toFixed(1)}L/quarter.
        </p>
      </Layer>

      <ExportBar />
      <Chips
        items={["Top returned SKUs", "Dead stock", "Top customers"]}
        onPick={onFollowup}
      />
    </RikoMsg>
  );
}

/* ── Unknown fallback ── */
function ExchangeUnknown({ onFollowup }: { onFollowup: (q: string) => void }) {
  return (
    <RikoMsg>
      <div
        className="rounded-xl p-4 mb-2"
        style={{ background: "var(--bg-surface)", border: "1px solid var(--border)" }}
      >
        <p className="text-sm font-semibold mb-1" style={{ color: "var(--text-1)" }}>
          I didn&apos;t quite catch that.
        </p>
        <p className="text-xs mb-3" style={{ color: "var(--text-3)" }}>
          Try one of these — I can answer financial, compliance, or operational questions
          about Bandra Soap.
        </p>
        <div className="grid grid-cols-2 gap-2">
          {[
            { icon: "💰", q: "What's my cash runway?" },
            { icon: "🏛️", q: "Reconcile March 2B" },
            { icon: "📈", q: "Revenue trend this year" },
            { icon: "📦", q: "Show dead stock" },
          ].map((s) => (
            <button
              key={s.q}
              onClick={() => onFollowup(s.q)}
              className="flex items-center gap-2 px-3 py-2 rounded-lg text-left cursor-pointer transition-colors hover:opacity-80"
              style={{
                background: "var(--bg-hover)",
                border: "1px solid var(--border)",
              }}
            >
              <span className="text-sm">{s.icon}</span>
              <span className="text-[11px]" style={{ color: "var(--text-2)" }}>
                {s.q}
              </span>
            </button>
          ))}
        </div>
      </div>
    </RikoMsg>
  );
}

/* ═══════════════════════════════════════════════════════════════
   Intent → renderer map
   ═══════════════════════════════════════════════════════════════ */
const EXCHANGE_RENDERERS: Record<
  Intent,
  (props: { onFollowup: (q: string) => void }) => JSX.Element
> = {
  "current-ratio": ExchangeCurrentRatio,
  receivables: ExchangeReceivables,
  payables: ExchangePayables,
  mis: ExchangeMIS,
  "revenue-trend": ExchangeRevenueTrend,
  "cash-flow": ExchangeCashFlow,
  runway: ExchangeRunway,
  "expense-breakdown": ExchangeExpenses,
  waterfall: ExchangeWaterfall,
  "gst-recon": ExchangeGstRecon,
  "gst-health": ExchangeGstHealth,
  "top-customers": ExchangeTopCustomers,
  "health-score": ExchangeHealthScore,
  "inventory-dead": ExchangeDeadStock,
  returns: ExchangeReturns,
  unknown: ExchangeUnknown,
};

/* ═══════════════════════════════════════════════════════════════
   Empty state — categorized prompts
   ═══════════════════════════════════════════════════════════════ */
const PROMPT_CATEGORIES = [
  {
    title: "Cash & runway",
    Icon: Wallet,
    color: "var(--green)",
    prompts: [
      "What's my cash runway?",
      "Show 6-week cash forecast",
      "Who owes me money?",
      "Who do I owe?",
    ],
  },
  {
    title: "Compliance",
    Icon: Landmark,
    color: "var(--blue)",
    prompts: [
      "Reconcile March 2B",
      "How's my GST health?",
      "Generate GSTR-3B",
      "Excess ITC — how to claim?",
    ],
  },
  {
    title: "Growth",
    Icon: TrendingUp,
    color: "var(--purple)",
    prompts: [
      "Revenue trend this year",
      "Top customers by revenue",
      "Why am I losing money?",
      "Business health score",
    ],
  },
  {
    title: "Operations",
    Icon: Package,
    color: "var(--orange)",
    prompts: [
      "Dead stock SKUs",
      "Expense breakdown",
      "Returns by channel",
      "Generate March MIS",
    ],
  },
];

/* ═══════════════════════════════════════════════════════════════
   Input bar
   ═══════════════════════════════════════════════════════════════ */
function InputBar({
  value,
  onChange,
  onSend,
  placeholder = "Ask Riko anything...",
}: {
  value: string;
  onChange: (v: string) => void;
  onSend: () => void;
  placeholder?: string;
}) {
  return (
    <div
      className="sticky bottom-[calc(60px+env(safe-area-inset-bottom,0px))] md:bottom-0 px-4 py-3"
      style={{ background: "var(--bg-primary)", borderTop: "1px solid var(--border)" }}
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
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              onSend();
            }
          }}
          placeholder={placeholder}
          className="flex-1 bg-transparent text-sm outline-none min-w-0"
          style={{ color: "var(--text-1)" }}
        />
        <button
          className="p-1.5 rounded-lg cursor-pointer transition-opacity hover:opacity-70"
          style={{ color: "var(--text-4)" }}
          aria-label="Voice input"
        >
          <Mic size={18} />
        </button>
        <button
          onClick={onSend}
          disabled={!value.trim()}
          className="p-2 rounded-lg cursor-pointer transition-opacity disabled:opacity-40"
          style={{ background: value.trim() ? "var(--green)" : "var(--bg-hover)" }}
          aria-label="Send message"
        >
          <Send
            size={16}
            color={value.trim() ? "white" : "var(--text-4)"}
          />
        </button>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   Insights panel (desktop) — recent topics + related prompts
   ═══════════════════════════════════════════════════════════════ */
function InsightsPanel({
  recentTopics,
  currentIntent,
  onPick,
  onNewChat,
}: {
  recentTopics: { intent: Intent; text: string }[];
  currentIntent: Intent | null;
  onPick: (q: string) => void;
  onNewChat: () => void;
}) {
  const related = useMemo(() => {
    const map: Partial<Record<Intent, string[]>> = {
      "gst-recon": [
        "How's my GST health?",
        "₹5.7L ITC at risk — how to recover?",
        "Generate GSTR-3B",
      ],
      "gst-health": [
        "Reconcile March 2B",
        "File ITC refund (RFD-01)",
        "GSTR-1 vs 3B mismatch",
      ],
      "current-ratio": ["Quick ratio?", "Cash ratio?", "Dead stock analysis"],
      receivables: [
        "Top 5 debtors",
        "Aging over 365 days",
        "Batch WhatsApp reminders",
      ],
      payables: ["MSME 45-day list", "Cash forecast", "Prioritize payments"],
      "revenue-trend": [
        "Best performing channel",
        "Top customers",
        "Why are returns up?",
      ],
      "cash-flow": ["Show runway gauge", "Cut marketing scenario", "Who owes me?"],
      runway: ["Show cash forecast", "Where is cash stuck?", "Cut costs ideas"],
      "expense-breakdown": [
        "P&L waterfall",
        "Dead stock unlock",
        "Marketing ROI",
      ],
      waterfall: ["Marketing vs gross profit", "Cost cut ideas", "Runway impact"],
      "top-customers": [
        "Cohort retention",
        "Returns by channel",
        "Biggest receivables",
      ],
      "health-score": [
        "Revenue trend",
        "GST health",
        "What's my single biggest risk?",
      ],
      "inventory-dead": [
        "Liquidation plan",
        "Returns top SKUs",
        "Working capital tied up",
      ],
      returns: ["Top returned SKUs", "Amazon return root cause", "Packaging fix ROI"],
      mis: ["Send to CA", "Schedule monthly", "Board deck version"],
      unknown: [],
    };
    if (!currentIntent) return [];
    return map[currentIntent] ?? [];
  }, [currentIntent]);

  return (
    <div className="flex flex-col h-full overflow-y-auto">
      <div
        className="sticky top-0 z-10 px-5 pt-4 pb-3 flex items-center justify-between"
        style={{
          background: "var(--bg-secondary)",
          borderBottom: "1px solid var(--border)",
        }}
      >
        <div className="flex items-center gap-1.5">
          <Sparkles size={14} style={{ color: "var(--green)" }} />
          <span
            className="text-[10px] font-bold tracking-widest uppercase"
            style={{ color: "var(--text-3)" }}
          >
            Insights
          </span>
        </div>
        <button
          onClick={onNewChat}
          className="text-[10px] font-semibold flex items-center gap-1 px-2 py-1 rounded-md cursor-pointer transition-opacity hover:opacity-80"
          style={{
            background: "var(--bg-surface)",
            border: "1px solid var(--border)",
            color: "var(--text-3)",
          }}
        >
          <RotateCcw size={10} />
          New chat
        </button>
      </div>

      <div className="px-5 py-4 space-y-5">
        {/* Related follow-ups */}
        {related.length > 0 && (
          <div>
            <p
              className="text-[10px] font-bold uppercase tracking-wider mb-2"
              style={{ color: "var(--text-4)" }}
            >
              Related questions
            </p>
            <div className="space-y-1.5">
              {related.map((r) => (
                <button
                  key={r}
                  onClick={() => onPick(r)}
                  className="flex items-center gap-2 w-full px-3 py-2 rounded-lg text-left cursor-pointer transition-colors"
                  style={{
                    background: "var(--bg-surface)",
                    border: "1px solid var(--border)",
                    color: "var(--text-2)",
                  }}
                >
                  <ChevronRight
                    size={12}
                    style={{ color: "var(--green)", flexShrink: 0 }}
                  />
                  <span className="text-xs">{r}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Recent topics */}
        {recentTopics.length > 0 && (
          <div>
            <p
              className="text-[10px] font-bold uppercase tracking-wider mb-2"
              style={{ color: "var(--text-4)" }}
            >
              Recent topics
            </p>
            <div className="flex flex-col gap-1.5">
              {recentTopics.map((t, i) => (
                <div
                  key={i}
                  className="px-3 py-2 rounded-lg text-[11px]"
                  style={{
                    background: "var(--bg-surface)",
                    border: "1px solid var(--border)",
                    color: "var(--text-3)",
                  }}
                >
                  <span className="truncate block">{t.text}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Categories reference */}
        <div>
          <p
            className="text-[10px] font-bold uppercase tracking-wider mb-2"
            style={{ color: "var(--text-4)" }}
          >
            What Riko can answer
          </p>
          <div className="space-y-1.5">
            {PROMPT_CATEGORIES.map((c) => (
              <div
                key={c.title}
                className="flex items-center gap-2 px-3 py-2 rounded-lg"
                style={{
                  background: "var(--bg-surface)",
                  border: "1px solid var(--border)",
                }}
              >
                <c.Icon size={14} style={{ color: c.color }} />
                <span className="text-[11px] font-medium" style={{ color: "var(--text-2)" }}>
                  {c.title}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   Main chat
   ═══════════════════════════════════════════════════════════════ */
export function ChatScreen() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [pendingTyping, setPendingTyping] = useState(false);
  const scrollerRef = useRef<HTMLDivElement>(null);
  // Monotonic counter for message IDs (avoids Date.now purity complaints)
  const idSeq = useRef(0);
  const nextId = (role: "u" | "a") => {
    idSeq.current += 1;
    return `${role}-${idSeq.current}`;
  };

  /* auto-scroll to bottom on new message */
  useEffect(() => {
    const el = scrollerRef.current;
    if (el) {
      el.scrollTop = el.scrollHeight;
    }
  }, [messages, pendingTyping]);

  const handleSend = (raw?: string) => {
    const text = (raw ?? input).trim();
    if (!text) return;
    const intent = classifyIntent(text);
    const uId = nextId("u");
    const aId = nextId("a");

    setMessages((prev) => [
      ...prev,
      { id: uId, role: "user", text, intent },
    ]);
    setInput("");
    setPendingTyping(true);

    // fake thinking delay → render assistant
    // (fixed delay keeps the component render pure; React's purity rules
    //  disallow Math.random() inside the render-adjacent closure)
    window.setTimeout(() => {
      setPendingTyping(false);
      setMessages((prev) => [...prev, { id: aId, role: "assistant", intent }]);
    }, 480);
  };

  const handleNewChat = () => {
    setMessages([]);
    setInput("");
    setPendingTyping(false);
  };

  // Current intent = last assistant message intent
  const currentIntent: Intent | null = useMemo(() => {
    for (let i = messages.length - 1; i >= 0; i--) {
      const m = messages[i];
      if (m.role === "assistant") return m.intent;
    }
    return null;
  }, [messages]);

  // Recent user topics for insights sidebar
  const recentTopics = useMemo(() => {
    return messages
      .filter((m): m is ChatMessage & { role: "user" } => m.role === "user")
      .slice(-5)
      .reverse()
      .map((m) => ({ intent: m.intent ?? "unknown", text: m.text }));
  }, [messages]);

  /* ── Empty state ── */
  if (messages.length === 0) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.4 }}
        className="flex flex-col flex-1 w-full"
      >
        <div className="flex-1 overflow-y-auto">
          <div className="max-w-2xl mx-auto w-full px-4 py-8 md:py-10">
            {/* Avatar */}
            <div className="flex flex-col items-center text-center mb-8">
              <div
                className="w-16 h-16 rounded-full flex items-center justify-center mb-4"
                style={{
                  background: "linear-gradient(135deg, var(--green), var(--green-dark))",
                }}
              >
                <span className="text-white text-2xl font-bold">R</span>
              </div>
              <h2
                className="text-xl md:text-2xl font-bold mb-1"
                style={{ color: "var(--text-1)" }}
              >
                Kya jaanna hai?
              </h2>
              <p className="text-sm" style={{ color: "var(--text-3)" }}>
                Ask about cash, compliance, growth, or operations — in English, Hindi, or Hinglish.
              </p>
            </div>

            {/* Categorized prompts */}
            <div className="grid gap-3 md:grid-cols-2">
              {PROMPT_CATEGORIES.map((cat) => (
                <div
                  key={cat.title}
                  className="rounded-xl p-4"
                  style={{
                    background: "var(--bg-surface)",
                    border: "1px solid var(--border)",
                  }}
                >
                  <div className="flex items-center gap-2 mb-3">
                    <span
                      className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0"
                      style={{
                        background: `color-mix(in srgb, ${cat.color} 15%, transparent)`,
                      }}
                    >
                      <cat.Icon size={14} style={{ color: cat.color }} />
                    </span>
                    <span
                      className="text-xs font-bold uppercase tracking-wider"
                      style={{ color: cat.color }}
                    >
                      {cat.title}
                    </span>
                  </div>
                  <div className="space-y-1">
                    {cat.prompts.map((p) => (
                      <button
                        key={p}
                        onClick={() => handleSend(p)}
                        className="flex items-center justify-between gap-2 w-full px-3 py-2 rounded-lg text-left cursor-pointer transition-colors hover:opacity-80"
                        style={{
                          background: "var(--bg-hover)",
                          color: "var(--text-2)",
                        }}
                      >
                        <span className="text-[12px] flex-1">{p}</span>
                        <ChevronRight
                          size={12}
                          style={{ color: cat.color, flexShrink: 0 }}
                        />
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            {/* Hint */}
            <p
              className="text-center text-[11px] mt-6"
              style={{ color: "var(--text-4)" }}
            >
              Or type your own question below — Riko understands plain English.
            </p>
          </div>
        </div>

        <InputBar value={input} onChange={setInput} onSend={() => handleSend()} />
      </motion.div>
    );
  }

  /* ── Conversation state ── */
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
      className="flex flex-1 w-full"
    >
      {/* Left — conversation */}
      <div
        className="flex flex-col flex-1 md:w-[60%] md:flex-none md:border-r min-w-0"
        style={{ borderColor: "var(--border)" }}
      >
        <div ref={scrollerRef} className="flex-1 overflow-y-auto px-4 py-4">
          {messages.map((m) => {
            if (m.role === "user") {
              return <UserBubble key={m.id} text={m.text} />;
            }
            const Renderer = EXCHANGE_RENDERERS[m.intent];
            return <Renderer key={m.id} onFollowup={handleSend} />;
          })}
          {pendingTyping && <TypingIndicator />}
        </div>
        <InputBar value={input} onChange={setInput} onSend={() => handleSend()} />
      </div>

      {/* Right — insights (desktop only) */}
      <div
        className="hidden md:flex md:flex-col md:w-[40%] min-w-0"
        style={{ background: "var(--bg-secondary)" }}
      >
        <InsightsPanel
          recentTopics={recentTopics}
          currentIntent={currentIntent}
          onPick={handleSend}
          onNewChat={handleNewChat}
        />
      </div>
    </motion.div>
  );
}
