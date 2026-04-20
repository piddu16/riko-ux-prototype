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
import { motion, AnimatePresence, MotionConfig } from "framer-motion";
import {
  Send,
  ChevronRight,
  ChevronDown,
  Wallet,
  Landmark,
  TrendingUp,
  Package,
  Sparkles,
  RotateCcw,
  Download,
  Share2,
  CheckCircle2,
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
import dynamic from "next/dynamic";
import { ChartRenderer, type DataShape } from "@/components/ui/chart-switcher";

// DeadStockTreemap is ECharts-powered; defer its load so asking anything
// other than "dead stock" doesn't pay the ECharts cost.
const DeadStockTreemap = dynamic(
  () =>
    import("@/components/ui/dead-stock-treemap").then(
      (m) => m.DeadStockTreemap
    ),
  {
    ssr: false,
    loading: () => (
      <div
        className="rounded-xl animate-pulse"
        style={{
          height: 480,
          background: "color-mix(in srgb, var(--bg-hover) 50%, transparent)",
        }}
      />
    ),
  }
);
import {
  downloadChartAsPng,
  shareToWhatsApp,
  slugify,
} from "@/components/ui/chart-export";
import {
  COHORT_RETENTION,
  CYCLIC_TRANSACTIONS,
  RELATED_PARTY_SALES,
  RELATED_PARTY_PURCHASES,
  RECURRING_REVENUE,
  HSN_WISE_SALES,
  STATE_WISE_SALES,
  FILING_DELAYS,
  FILING_STATS,
} from "@/lib/data";

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
  | "cohort-retention"
  | "money-flow"
  | "customer-ltv"
  // GST API parity additions (sourced from consented GST provider)
  | "cyclic-transactions"
  | "related-party"
  | "recurring-revenue"
  | "hsn-wise"
  | "state-wise"
  | "filing-delay"
  | "unknown";

type ChatMessage =
  | { id: string; role: "user"; text: string; intent?: Intent }
  | {
      id: string;
      role: "assistant";
      intent: Intent;
      typing?: boolean;
      /** How long Riko "thought" (fake but feels real — used to render
       *  the "Analyzed in X.Xs ▸" chip at the top of the response). */
      thinkingDurationMs?: number;
    };

/* ═══════════════════════════════════════════════════════════════
   Intent classifier — matches user text to an intent
   ═══════════════════════════════════════════════════════════════ */
function classifyIntent(text: string): Intent {
  const q = text.toLowerCase().trim();
  if (!q) return "unknown";

  // Order matters — more specific first

  // GST API parity intents checked before the more generic ones
  if (/cyclic|round.?trip|same.*party.*(customer|supplier)|both.*customer.*supplier/.test(q))
    return "cyclic-transactions";
  if (/related.*party|sister.*concern|group.*company|rpt\b|40a.?2/.test(q))
    return "related-party";
  if (/recurring.*revenue|repeat.*customer|sticky|stickiness|customer.*retention.*\$|revenue.*quality/.test(q))
    return "recurring-revenue";
  if (/\bhsn\b|product.*mix|service.*code|sac.*code|hsn.*wise/.test(q))
    return "hsn-wise";
  if (/state.?wise|geo.*split|geographic|regional.*sales|by.*state|interstate.*revenue/.test(q))
    return "state-wise";
  if (/filing.*delay|late.*filing|filing.*calendar|delay.*day|filing.*history/.test(q))
    return "filing-delay";

  if (/recon|gstr.?2b|2b\b|match.*invoice|itc.*risk/.test(q)) return "gst-recon";
  if (/gst.*health|gst.*score|filing.*streak|compliance.*health/.test(q))
    return "gst-health";
  if (/cash.*flow|forecast|week.*cash|6.?week|projection|weekly.*cash/.test(q))
    return "cash-flow";
  if (/runway|months.*left|how.*long.*survive|cash.*runway/.test(q)) return "runway";
  if (/waterfall|p&l|profit.*loss|loss.*why|losing.*money/.test(q))
    return "waterfall";
  if (/money.*flow|sankey|where.*cash.*goes|cash.*flow.*diagram|p&l.*flow/.test(q))
    return "money-flow";
  if (/cohort|retention|repeat.*purchas|customer.*retention|sticky/.test(q))
    return "cohort-retention";
  if (/customer.*segment|customer.*value|whales|ltv.*vs|ltv.*scatter|customer.*recency/.test(q))
    return "customer-ltv";
  if (/expens.*break|where.*money|spend.*break|cost.*break/.test(q))
    return "expense-breakdown";
  if (/(current|quick|cash).*ratio|liquidity/.test(q)) return "current-ratio";
  if (/owe.*me|receivab|debtor|collect|overdue/.test(q)) return "receivables";
  if (/\bi.*owe|pay.*vendor|payabl|creditor|msme/.test(q)) return "payables";
  if (/top.*customer|best.*customer|biggest.*client|\bltv\b/.test(q))
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
/* Always-visible insight callout. Previously this was a click-to-expand
 * disclosure, but the insight IS the value — collapsing it hid the
 * reasoning behind a click. Now flat: icon + title + body always shown.
 * Keeps the existing Layer name so call sites don't change. */
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
  return (
    <div
      className="rounded-lg overflow-hidden my-1.5"
      style={{ border: `1px solid color-mix(in srgb, ${color} 40%, transparent)` }}
    >
      <div
        className="flex items-center gap-2 px-3 py-2 text-xs font-semibold"
        style={{
          background: `color-mix(in srgb, ${color} 10%, transparent)`,
          color,
        }}
      >
        <span aria-hidden>{icon}</span>
        <span className="flex-1 text-left">{title}</span>
      </div>
      <div
        className="px-3 py-2.5 text-xs leading-relaxed"
        style={{ color: "var(--text-2)" }}
      >
        {children}
      </div>
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
          className="text-[11px] px-3 py-2 min-h-[36px] md:min-h-0 md:py-1 rounded-full cursor-pointer transition-colors hover:opacity-80"
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

/* ── ThinkingLive — shown WHILE Riko is "thinking" (fake delay).
   Counts up in real-time so the user sees "Analyzing · 0.3s / 0.7s / 1.2s".
   Replaces the old 3-dot typing indicator. */
function ThinkingLive({ startedAt }: { startedAt: number }) {
  const [elapsed, setElapsed] = useState(0);
  useEffect(() => {
    const id = window.setInterval(() => {
      setElapsed(Date.now() - startedAt);
    }, 80);
    return () => window.clearInterval(id);
  }, [startedAt]);

  const seconds = (elapsed / 1000).toFixed(1);
  return (
    <RikoMsg>
      <div
        className="inline-flex items-center gap-2 px-2.5 py-1.5 rounded-md text-[11px] font-medium"
        style={{
          background: "var(--bg-surface)",
          border: "1px solid var(--border)",
          color: "var(--text-3)",
        }}
      >
        <motion.span
          className="w-1.5 h-1.5 rounded-full flex-shrink-0"
          style={{ background: "var(--green)" }}
          animate={{ opacity: [0.35, 1, 0.35] }}
          transition={{ duration: 1.1, repeat: Infinity, ease: "easeInOut" }}
        />
        <span>Analyzing</span>
        <span
          className="tabular-nums"
          style={{ fontFamily: "'Space Grotesk', sans-serif", color: "var(--text-2)" }}
        >
          {seconds}s
        </span>
      </div>
    </RikoMsg>
  );
}

/* ── ThinkingChip (done state) — persists at the top of every
   assistant response as "✨ Analyzed in 1.2s ▸". Expands on click
   to reveal what Riko "looked at" — fake-plausible per intent. */
function ThinkingChip({
  durationMs,
  reasoning,
}: {
  durationMs: number;
  reasoning?: string;
}) {
  const [open, setOpen] = useState(false);
  const seconds = (durationMs / 1000).toFixed(1);
  return (
    <div>
      <button
        type="button"
        onClick={() => reasoning && setOpen((v) => !v)}
        className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-medium transition-colors hover:opacity-80"
        style={{
          background: "color-mix(in srgb, var(--green) 8%, transparent)",
          border: "1px solid color-mix(in srgb, var(--green) 22%, transparent)",
          color: "var(--text-2)",
          cursor: reasoning ? "pointer" : "default",
        }}
        aria-expanded={open}
      >
        <Sparkles size={11} style={{ color: "var(--green)" }} />
        <span>Analyzed in </span>
        <span
          className="tabular-nums"
          style={{ fontFamily: "'Space Grotesk', sans-serif", color: "var(--text-1)" }}
        >
          {seconds}s
        </span>
        {reasoning && (
          open ? <ChevronDown size={11} /> : <ChevronRight size={11} />
        )}
      </button>
      <AnimatePresence initial={false}>
        {open && reasoning && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2, ease: "easeInOut" }}
            className="overflow-hidden"
          >
            <div
              className="mt-1.5 px-3 py-2 rounded-md text-[11px] leading-relaxed"
              style={{
                background: "var(--bg-surface)",
                border: "1px solid var(--border)",
                color: "var(--text-3)",
              }}
            >
              {reasoning}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

/* ── GeneratedBadge — small "✦ Generated · {intent label}" stamp
   next to the thinking chip, showing what Riko actually produced. */
function GeneratedBadge({ label }: { label: string }) {
  return (
    <span
      className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-medium"
      style={{
        background: "color-mix(in srgb, var(--purple) 10%, transparent)",
        border: "1px solid color-mix(in srgb, var(--purple) 25%, transparent)",
        color: "var(--text-2)",
      }}
    >
      <span aria-hidden style={{ color: "var(--purple)" }}>
        ✦
      </span>
      <span style={{ color: "var(--text-4)" }}>Generated ·</span>
      <span style={{ color: "var(--text-1)" }}>{label}</span>
    </span>
  );
}

/* ── ThinkingRow — renders the chip row above an assistant response.
   Aligned with the message body (offset past the avatar) so the
   chips sit where the content would start. */
function ThinkingRow({
  intent,
  durationMs,
}: {
  intent: Intent;
  durationMs: number;
}) {
  return (
    <div className="ml-9 mb-2 flex items-center gap-2 flex-wrap">
      <ThinkingChip durationMs={durationMs} reasoning={INTENT_REASONING[intent]} />
      <GeneratedBadge label={INTENT_LABELS[intent]} />
    </div>
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

      {/* Composition donut — inline on mobile, moves to Result panel on desktop */}
      <div className="md:hidden">
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
      </div>

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

      <div className="md:hidden mt-2">
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

      <div className="md:hidden">
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
      </div>

      <Layer color="var(--green)" icon="💡" title="Recommended action">
        <p>
          Batch-send WhatsApp reminders to all 5 overdue parties — recover up to ₹34L. The
          365+ day bucket (₹{(bucket365 / 1e5).toFixed(1)}L) likely needs write-off review.
        </p>
      </Layer>

      <div className="md:hidden">
        <ExportBar />
      </div>
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

      <div className="md:hidden">
        <ExportBar />
      </div>
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
      <div className="md:hidden">
        <ExportBar />
      </div>
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

      <div className="md:hidden">
        <ChatLineChart
          title="Monthly revenue"
          data={MONTHS.map((m, i) => ({ x: m, y: R.ms[i] }))}
          color="var(--green)"
          highlight={{
            index: maxIdx,
            label: `${MONTHS[maxIdx]} ₹${fL(R.ms[maxIdx])}L`,
          }}
        />
      </div>

      <Layer color="var(--yellow)" icon="💡" title="Riko's take">
        <p>
          Best month was <strong>{MONTHS[maxIdx]}</strong> (₹{fL(R.ms[maxIdx])}L), worst{" "}
          <strong>{MONTHS[minIdx]}</strong> (₹{fL(R.ms[minIdx])}L). The{" "}
          <strong>{Math.abs(K.yoy).toFixed(0)}% YoY decline</strong> is driven by
          marketplace returns (Amazon 32%) and inventory issues. Focus on D2C channel
          which is growing fastest.
        </p>
      </Layer>

      <div className="md:hidden">
        <ExportBar />
      </div>
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

      <div className="md:hidden">
        <ChatForecastChart title="Inflow vs outflow · running balance" weeks={CASH_FORECAST_WEEKS} />
      </div>

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

      <div className="md:hidden">
        <ExportBar />
      </div>
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
  const dangerColor = days < 30 ? "var(--red)" : "var(--yellow)";
  return (
    <RikoMsg>
      {/* Mobile: full hero with gauge + KPI grid */}
      <div
        className="md:hidden rounded-xl p-4 mb-2"
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
              style={{ color: dangerColor, fontFamily: "'Space Grotesk', sans-serif" }}
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

      {/* Desktop: compact summary (gauge + KPIs live in Result panel) */}
      <div
        className="hidden md:block rounded-xl p-4 mb-2"
        style={{ background: "var(--bg-surface)", border: "1px solid var(--border)" }}
      >
        <p className="text-[11px] uppercase tracking-wider font-medium" style={{ color: "var(--text-4)" }}>
          Cash runway
        </p>
        <p
          className="text-3xl font-bold leading-none mt-1"
          style={{ color: dangerColor, fontFamily: "'Space Grotesk', sans-serif" }}
        >
          {days} days
        </p>
        <p className="text-xs mt-1.5" style={{ color: "var(--text-3)" }}>
          At current burn of ₹{fL(K.burn)}L/month · see full breakdown →
        </p>
      </div>

      <Layer color="var(--red)" icon="🚨" title="This is urgent">
        <p>
          You have {days} days of cash. The actions that extend runway fastest: (1) collect
          Nykaa ₹12.6L, (2) file ITC refund ₹4.6L, (3) cut marketing 30%. Combined = ~60+
          days added.
        </p>
      </Layer>

      <div className="md:hidden">
        <ExportBar />
      </div>
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

      <div className="md:hidden space-y-2">
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
      </div>

      <Layer color="var(--yellow)" icon="💡" title="Riko's take">
        <p>
          Marketing (₹{(R.mkt / 1e7).toFixed(2)}Cr) + CAC (₹{(R.cac / 1e7).toFixed(2)}Cr)
          = <strong>₹{((R.mkt + R.cac) / 1e7).toFixed(2)}Cr</strong> on customer acquisition —
          larger than your gross profit. If you cut 30% here, you save ~₹
          {(((R.mkt + R.cac) * 0.3) / 1e5).toFixed(1)}L/mo and buy months of runway.
        </p>
      </Layer>

      <div className="md:hidden">
        <ExportBar />
      </div>
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
      <div className="md:hidden">
        <ChatWaterfall data={WATERFALL} />
      </div>
      <Layer color="var(--red)" icon="💡" title="Why you're losing money">
        <p>
          Gross profit is healthy (82.5%) but operating costs are{" "}
          <strong>₹{(R.indExp / 1e7).toFixed(2)}Cr</strong> against GP of ₹
          {(R.gp / 1e7).toFixed(2)}Cr. Marketing + CAC alone exceed GP. EBITDA burn is ₹
          {fL(K.burn)}L/mo.
        </p>
      </Layer>
      <div className="md:hidden">
        <ExportBar />
      </div>
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

      <div className="md:hidden">
        <ChatGstRecon period={RECONCILIATION.period} />
      </div>

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
  const scoreColor =
    GST_HEALTH.score < 50
      ? "var(--red)"
      : GST_HEALTH.score < 75
      ? "var(--yellow)"
      : "var(--green)";
  return (
    <RikoMsg>
      {/* Mobile: full gauge + 4-row metric list */}
      <div
        className="md:hidden rounded-xl p-4 mb-2"
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

      {/* Desktop: compact summary (gauge + full metrics live in Result panel) */}
      <div
        className="hidden md:block rounded-xl p-4 mb-2"
        style={{ background: "var(--bg-surface)", border: "1px solid var(--border)" }}
      >
        <p className="text-[11px] uppercase tracking-wider font-medium" style={{ color: "var(--text-4)" }}>
          GST Health score
        </p>
        <p
          className="text-3xl font-bold leading-none mt-1"
          style={{ color: scoreColor, fontFamily: "'Space Grotesk', sans-serif" }}
        >
          {GST_HEALTH.score}<span className="text-lg" style={{ color: "var(--text-4)" }}>/100</span>
        </p>
        <p className="text-xs mt-1.5" style={{ color: "var(--text-3)" }}>
          {GST_HEALTH.filingStreak}-month filing streak · ₹
          {(GST_HEALTH.excessItcUnclaimed / 1e5).toFixed(1)}L ITC to refund
        </p>
      </div>

      <Layer color="var(--yellow)" icon="💡" title="One thing to fix">
        <p>
          You have <strong>₹{(GST_HEALTH.excessItcUnclaimed / 1e5).toFixed(1)}L</strong> of
          unused ITC. File an <strong>RFD-01</strong> refund application after your next
          3B — this lands cash in your bank in 60-90 days.
        </p>
      </Layer>

      <div className="md:hidden">
        <ExportBar />
      </div>
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

      <div className="md:hidden">
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
      </div>

      <Layer color="var(--green)" icon="💡" title="Riko's take">
        <p>
          <strong>Nykaa + Amazon + Website D2C</strong> = ~70% of revenue. Website D2C has the
          highest LTV (₹{(TOP_CUSTOMERS[3].ltv / 1e5).toFixed(1)}L) and lowest return rate
          (5.7%) — double down here.
        </p>
      </Layer>

      <div className="md:hidden">
        <ExportBar />
      </div>
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
  const scoreColor =
    avg < 40 ? "var(--red)" : avg < 70 ? "var(--yellow)" : "var(--green)";
  const weakest = HEALTH_SCORES.reduce((w, h) => (h.score < w.score ? h : w));
  return (
    <RikoMsg>
      {/* Mobile: full gauge + 4 dimension bars */}
      <div
        className="md:hidden rounded-xl p-4 mb-2"
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

      {/* Desktop: compact summary (full gauge + bars in Result panel) */}
      <div
        className="hidden md:block rounded-xl p-4 mb-2"
        style={{ background: "var(--bg-surface)", border: "1px solid var(--border)" }}
      >
        <p className="text-[11px] uppercase tracking-wider font-medium" style={{ color: "var(--text-4)" }}>
          Business health
        </p>
        <p
          className="text-3xl font-bold leading-none mt-1"
          style={{ color: scoreColor, fontFamily: "'Space Grotesk', sans-serif" }}
        >
          {avg.toFixed(0)}<span className="text-lg" style={{ color: "var(--text-4)" }}>/100</span>
        </p>
        <p className="text-xs mt-1.5" style={{ color: "var(--text-3)" }}>
          Weakest dimension:{" "}
          <span style={{ color: weakest.color, fontWeight: 600 }}>
            {weakest.label} ({weakest.score})
          </span>
        </p>
      </div>

      <Layer color="var(--red)" icon="💡" title="Growth is your biggest weakness">
        <p>
          Growth (15/100) is dragging the score. Revenue is down{" "}
          <strong>{Math.abs(K.yoy).toFixed(0)}% YoY</strong>. Focus on the Website D2C
          channel (+95%) to rebuild momentum.
        </p>
      </Layer>

      <div className="md:hidden">
        <ExportBar />
      </div>
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

      <div className="md:hidden space-y-2">
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
      </div>

      <Layer color="var(--green)" icon="💡" title="Cash recovery play">
        <p>
          Liquidating even <strong>50%</strong> of dead stock at 40% off would unlock ~₹
          {((DEAD_STOCK_SUMMARY.totalValue * 0.5 * 0.6) / 1e5).toFixed(1)}L of cash and free
          warehouse space.
        </p>
      </Layer>

      <div className="md:hidden">
        <ExportBar />
      </div>
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

      <div className="md:hidden">
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
      </div>

      <Layer color="var(--red)" icon="💡" title="Amazon is the problem">
        <p>
          Amazon has a <strong>32.5%</strong> return rate — 4x your D2C channel. Damaged-in-transit
          is the top reason. Better packaging + switch to standard FBA could cut returns by
          50%+, recovering ~₹{((7420000 * 0.5) / 1e5).toFixed(1)}L/quarter.
        </p>
      </Layer>

      <div className="md:hidden">
        <ExportBar />
      </div>
      <Chips
        items={["Top returned SKUs", "Dead stock", "Top customers"]}
        onPick={onFollowup}
      />
    </RikoMsg>
  );
}

/* ── Cohort retention ── */
function ExchangeCohortRetention({ onFollowup }: { onFollowup: (q: string) => void }) {
  // Approximate repeat rate: how much of the earliest cohort is still active now.
  const oldest = COHORT_RETENTION[0];
  const stillActive = oldest.retention[oldest.retention.length - 1];
  const avgQ2Retention =
    COHORT_RETENTION
      .filter((c) => c.retention.length >= 2)
      .reduce((s, c) => s + c.retention[1], 0) /
    COHORT_RETENTION.filter((c) => c.retention.length >= 2).length;

  return (
    <RikoMsg>
      <div
        className="rounded-xl p-4 mb-2"
        style={{ background: "var(--bg-surface)", border: "1px solid var(--border)" }}
      >
        <div className="flex items-start justify-between gap-3 flex-wrap">
          <div>
            <p className="text-sm font-bold" style={{ color: "var(--text-1)" }}>
              Customer retention cohorts
            </p>
            <p className="text-[11px]" style={{ color: "var(--text-4)" }}>
              {COHORT_RETENTION.length} quarterly cohorts · avg Q2 retention{" "}
              {avgQ2Retention.toFixed(0)}%
            </p>
          </div>
          <Pill color="var(--blue)">{stillActive}% of FY23 Q1 still active</Pill>
        </div>
      </div>

      <Layer color="var(--yellow)" icon="💡" title="Riko's take">
        <p>
          Q2 retention improved from <strong>68%</strong> (FY23 Q1) to{" "}
          <strong>82%</strong> (FY24 Q2) — product is getting stickier. But
          long-tail retention (Q8) is only <strong>{stillActive}%</strong>.
          Subscription or refill-reminder WhatsApp flow could unlock the dormant
          half.
        </p>
      </Layer>

      <Chips
        items={["Top customers by LTV", "Customer LTV scatter", "Revenue trend"]}
        onPick={onFollowup}
      />
    </RikoMsg>
  );
}

/* ── Money flow (sankey) ── */
function ExchangeMoneyFlow({ onFollowup }: { onFollowup: (q: string) => void }) {
  return (
    <RikoMsg>
      <div
        className="rounded-xl p-4 mb-2"
        style={{ background: "var(--bg-surface)", border: "1px solid var(--border)" }}
      >
        <p className="text-sm font-bold" style={{ color: "var(--text-1)" }}>
          Where your money flows
        </p>
        <p className="text-[11px]" style={{ color: "var(--text-4)" }}>
          Revenue to Net P&amp;L — ribbon width shows relative size of each flow
        </p>
      </div>

      <Layer color="var(--red)" icon="💡" title="Riko's take">
        <p>
          Marketing + CAC together are the thickest outflow at ₹
          {((R.mkt + R.cac) / 1e7).toFixed(2)}Cr — 52% of total spend. That&apos;s
          the single biggest lever for getting to profitability.
        </p>
      </Layer>

      <Chips
        items={["P&L waterfall", "Cash runway", "Expense breakdown"]}
        onPick={onFollowup}
      />
    </RikoMsg>
  );
}

/* ── Customer LTV scatter ── */
function ExchangeCustomerLtv({ onFollowup }: { onFollowup: (q: string) => void }) {
  const top = TOP_CUSTOMERS.slice(0, 5);
  return (
    <RikoMsg>
      <div
        className="rounded-xl p-4 mb-2"
        style={{ background: "var(--bg-surface)", border: "1px solid var(--border)" }}
      >
        <div className="flex items-start justify-between gap-3 flex-wrap">
          <div>
            <p className="text-sm font-bold" style={{ color: "var(--text-1)" }}>
              Customer LTV vs recency
            </p>
            <p className="text-[11px]" style={{ color: "var(--text-4)" }}>
              Each dot = one customer · size = order count · color = channel
            </p>
          </div>
          <Pill color="var(--green)">
            Top LTV: ₹{(top[0].ltv / 1e5).toFixed(1)}L
          </Pill>
        </div>
      </div>

      <Layer color="var(--yellow)" icon="💡" title="Riko's take">
        <p>
          Amazon has the highest LTV customer (₹
          {(TOP_CUSTOMERS[1].ltv / 1e5).toFixed(1)}L, 298 orders) but their
          return rate is 32%. Website D2C has lower LTV per customer but better
          margins and repeat rate — double down on D2C marketing.
        </p>
      </Layer>

      <Chips
        items={["Cohort retention", "Top customers by revenue", "Returns by channel"]}
        onPick={onFollowup}
      />
    </RikoMsg>
  );
}

/* ── Cyclic transactions (round-trip flag) ── */
function ExchangeCyclicTransactions({ onFollowup }: { onFollowup: (q: string) => void }) {
  const highSev = CYCLIC_TRANSACTIONS.filter((c) => c.severity === "high").length;
  const totalSales = CYCLIC_TRANSACTIONS.reduce((s, c) => s + c.totalSales, 0);
  const totalPurchases = CYCLIC_TRANSACTIONS.reduce((s, c) => s + c.totalPurchases, 0);
  return (
    <RikoMsg>
      <div
        className="rounded-xl p-4 mb-2"
        style={{ background: "var(--bg-surface)", border: "1px solid var(--border)" }}
      >
        <div className="flex items-start justify-between gap-3 flex-wrap">
          <div>
            <p className="text-sm font-bold" style={{ color: "var(--text-1)" }}>
              Cyclic transactions (round-trip flag)
            </p>
            <p className="text-[11px]" style={{ color: "var(--text-4)" }}>
              {CYCLIC_TRANSACTIONS.length} parties appear as BOTH customer and supplier · {highSev} high severity
            </p>
          </div>
          <Pill color={highSev > 0 ? "var(--red)" : "var(--yellow)"}>
            ₹{(Math.min(totalSales, totalPurchases) / 1e5).toFixed(1)}L at risk
          </Pill>
        </div>
      </div>

      <Layer color="var(--red)" icon="⚠️" title="Why this matters">
        <p>
          When the same PAN is both customer and supplier, the tax officer
          flags it as potential round-tripping. <strong>Patel Traders</strong>{" "}
          is 70% cycled (purchases nearly match sales). Explain this with
          genuine business rationale before GST scrutiny — or restructure.
        </p>
      </Layer>

      <Chips
        items={["Related party transactions", "Biggest receivables", "Top suppliers"]}
        onPick={onFollowup}
      />
    </RikoMsg>
  );
}

/* ── Related-party transactions ── */
function ExchangeRelatedParty({ onFollowup }: { onFollowup: (q: string) => void }) {
  const salesTotal = RELATED_PARTY_SALES.reduce((s, r) => s + r.invoiceValue, 0);
  const purchTotal = RELATED_PARTY_PURCHASES.reduce((s, r) => s + r.invoiceValue, 0);
  return (
    <RikoMsg>
      <div
        className="rounded-xl p-4 mb-2"
        style={{ background: "var(--bg-surface)", border: "1px solid var(--border)" }}
      >
        <div className="flex items-start justify-between gap-3 flex-wrap">
          <div>
            <p className="text-sm font-bold" style={{ color: "var(--text-1)" }}>
              Related-party transactions
            </p>
            <p className="text-[11px]" style={{ color: "var(--text-4)" }}>
              Sales ₹{(salesTotal / 1e5).toFixed(1)}L · Purchases ₹{(purchTotal / 1e5).toFixed(1)}L · {RELATED_PARTY_SALES.length + RELATED_PARTY_PURCHASES.length} parties flagged
            </p>
          </div>
          <Pill color="var(--orange)">Section 40A(2)</Pill>
        </div>
      </div>

      <Layer color="var(--yellow)" icon="💡" title="Compliance angle">
        <p>
          Related-party transactions must be at arm&apos;s-length or face
          Section 40A(2) disallowance. Keep: (1) third-party price benchmarks
          for each SKU sold to sister concerns, (2) a signed transfer-pricing
          policy, (3) board minutes documenting the commercial rationale.
        </p>
      </Layer>

      <Chips
        items={["Cyclic transactions", "Top customers", "Biggest payables"]}
        onPick={onFollowup}
      />
    </RikoMsg>
  );
}

/* ── Recurring revenue quality ── */
function ExchangeRecurringRevenue({ onFollowup }: { onFollowup: (q: string) => void }) {
  const r = RECURRING_REVENUE;
  return (
    <RikoMsg>
      <div
        className="rounded-xl p-4 mb-2"
        style={{ background: "var(--bg-surface)", border: "1px solid var(--border)" }}
      >
        <div className="flex items-start justify-between gap-3 flex-wrap">
          <div>
            <p className="text-sm font-bold" style={{ color: "var(--text-1)" }}>
              Recurring revenue quality
            </p>
            <p className="text-[11px]" style={{ color: "var(--text-4)" }}>
              ₹{(r.recurringRevenue / 1e7).toFixed(2)}Cr of ₹{(r.totalRevenue / 1e7).toFixed(2)}Cr total · {r.recurringPartyCount} of {r.totalCustomerCount} customers repeat
            </p>
          </div>
          <Pill color={r.recurringPct > 80 ? "var(--green)" : "var(--yellow)"}>
            {r.recurringPct.toFixed(0)}% recurring
          </Pill>
        </div>
      </div>

      <Layer color="var(--green)" icon="💡" title="Why this is your best metric">
        <p>
          <strong>{r.recurringPct.toFixed(0)}% recurring revenue</strong> is
          excellent — the business is sticky. {r.newCustomerCount} new customers
          acquired this FY, {r.lostCustomerCount} lost. Net customer growth:{" "}
          <strong>+{r.newCustomerCount - r.lostCustomerCount}</strong>. The
          monthly mix shows repeat % climbing from 68% (Apr) → 92% (Dec) —
          product-market fit is improving.
        </p>
      </Layer>

      <Chips
        items={["Cohort retention", "Top customers", "Customer LTV scatter"]}
        onPick={onFollowup}
      />
    </RikoMsg>
  );
}

/* ── HSN-wise sales ── */
function ExchangeHsnWise({ onFollowup }: { onFollowup: (q: string) => void }) {
  const totalTaxable = HSN_WISE_SALES.reduce((s, h) => s + h.taxableValue, 0);
  const topHsn = HSN_WISE_SALES[0];
  return (
    <RikoMsg>
      <div
        className="rounded-xl p-4 mb-2"
        style={{ background: "var(--bg-surface)", border: "1px solid var(--border)" }}
      >
        <div className="flex items-start justify-between gap-3 flex-wrap">
          <div>
            <p className="text-sm font-bold" style={{ color: "var(--text-1)" }}>
              Sales by HSN code
            </p>
            <p className="text-[11px]" style={{ color: "var(--text-4)" }}>
              {HSN_WISE_SALES.length} HSN codes · ₹{(totalTaxable / 1e7).toFixed(2)}Cr taxable · GSTR-1 Table 12 summary
            </p>
          </div>
          <Pill color="var(--purple)">HSN</Pill>
        </div>
      </div>

      <Layer color="var(--yellow)" icon="💡" title="Riko's take">
        <p>
          Top HSN is <strong>{topHsn.hsn}</strong> ({topHsn.particulars}) at ₹
          {(topHsn.taxableValue / 1e7).toFixed(2)}Cr —{" "}
          {((topHsn.taxableValue / totalTaxable) * 100).toFixed(0)}% of taxable
          turnover. For GSTR-1 Table 12, the GST portal requires HSN summary
          for all B2B invoices when turnover {">"} ₹5Cr. You&apos;re already compliant.
        </p>
      </Layer>

      <Chips
        items={["State-wise sales", "Top customers", "GST 2B reconciliation"]}
        onPick={onFollowup}
      />
    </RikoMsg>
  );
}

/* ── State-wise sales ── */
function ExchangeStateWise({ onFollowup }: { onFollowup: (q: string) => void }) {
  const total = STATE_WISE_SALES.reduce((s, st) => s + st.taxableValue, 0);
  const top3 = STATE_WISE_SALES.slice(0, 3);
  const top3Share = (top3.reduce((s, st) => s + st.taxableValue, 0) / total) * 100;
  return (
    <RikoMsg>
      <div
        className="rounded-xl p-4 mb-2"
        style={{ background: "var(--bg-surface)", border: "1px solid var(--border)" }}
      >
        <div className="flex items-start justify-between gap-3 flex-wrap">
          <div>
            <p className="text-sm font-bold" style={{ color: "var(--text-1)" }}>
              Sales by state
            </p>
            <p className="text-[11px]" style={{ color: "var(--text-4)" }}>
              {STATE_WISE_SALES.length} states with material volume · ₹{(total / 1e7).toFixed(2)}Cr taxable
            </p>
          </div>
          <Pill color="var(--blue)">{top3Share.toFixed(0)}% in top 3</Pill>
        </div>
      </div>

      <Layer color="var(--yellow)" icon="💡" title="Riko's take">
        <p>
          {top3[0].state}, {top3[1].state}, and {top3[2].state} drive{" "}
          <strong>{top3Share.toFixed(0)}%</strong> of taxable sales. If you&apos;re
          paying IGST on all interstate shipments, consider registering in a
          consumption state (UP or Haryana) to collect CGST+SGST locally and
          cut your interstate share.
        </p>
      </Layer>

      <Chips
        items={["HSN-wise sales", "Top customers", "Returns by channel"]}
        onPick={onFollowup}
      />
    </RikoMsg>
  );
}

/* ── Filing delay calendar ── */
function ExchangeFilingDelay({ onFollowup }: { onFollowup: (q: string) => void }) {
  const onTimePct = (FILING_STATS.onTimeMonths / FILING_STATS.totalMonthsTracked) * 100;
  return (
    <RikoMsg>
      <div
        className="rounded-xl p-4 mb-2"
        style={{ background: "var(--bg-surface)", border: "1px solid var(--border)" }}
      >
        <div className="flex items-start justify-between gap-3 flex-wrap">
          <div>
            <p className="text-sm font-bold" style={{ color: "var(--text-1)" }}>
              Filing delay calendar (24 months)
            </p>
            <p className="text-[11px]" style={{ color: "var(--text-4)" }}>
              {FILING_STATS.onTimeMonths} of {FILING_STATS.totalMonthsTracked} filings on time · best streak {FILING_STATS.maxStreakMonths} months
            </p>
          </div>
          <Pill color={onTimePct > 90 ? "var(--green)" : onTimePct > 75 ? "var(--yellow)" : "var(--red)"}>
            {onTimePct.toFixed(0)}% on time
          </Pill>
        </div>
      </div>

      <Layer color="var(--yellow)" icon="💡" title="Late pattern">
        <p>
          Average delay when late: <strong>{FILING_STATS.avgDelayWhenLate.toFixed(1)} days</strong>.
          Most slippages are in GSTR-3B not GSTR-1 — the filing happens once
          you have cash to pay the liability. Consider setting a reminder on
          the 15th of every month to prepare 3B even before funds are
          available — you can file with zero-cash-pay if ITC covers the
          liability.
        </p>
      </Layer>

      <Chips
        items={["GST Health score", "Reconcile March 2B", "Generate GSTR-3B"]}
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
              className="flex items-center gap-2 px-3 py-3 md:py-2 min-h-[44px] md:min-h-0 rounded-lg text-left cursor-pointer transition-colors hover:opacity-80"
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
  "cohort-retention": ExchangeCohortRetention,
  "money-flow": ExchangeMoneyFlow,
  "customer-ltv": ExchangeCustomerLtv,
  "cyclic-transactions": ExchangeCyclicTransactions,
  "related-party": ExchangeRelatedParty,
  "recurring-revenue": ExchangeRecurringRevenue,
  "hsn-wise": ExchangeHsnWise,
  "state-wise": ExchangeStateWise,
  "filing-delay": ExchangeFilingDelay,
  unknown: ExchangeUnknown,
};

/* ═══════════════════════════════════════════════════════════════
   Result renderers — standalone chart/widget for the desktop
   Result panel. The same chart is hidden inline in the chat
   (via md:hidden wrappers inside each Exchange) and instead
   rendered full-width here by intent.
   ═══════════════════════════════════════════════════════════════ */
/** Per-intent reasoning text shown when the user expands the
 *  "Analyzed in X.Xs" chip. Keep each to 1-2 crisp sentences — this
 *  reads as authentic AI thinking, not a verbose log. Tune for
 *  authority, not exhaustiveness. */
const INTENT_REASONING: Record<Intent, string> = {
  "current-ratio":
    "Pulled current assets (cash, debtors, closing stock, other CA) and current liabilities (creditors, provisions) from the latest Balance Sheet. Divided to compute the ratio.",
  receivables:
    "Scanned the debtor ledger across 10 parties + 298 bills. Aged each bill into 0-30, 30-90, 90-365, and 365+ day buckets. Ranked by amount + days.",
  payables:
    "Pulled creditor ledger, flagged MSME-registered vendors per the MSME Development Act, and computed days aged for each.",
  mis:
    "Compiled P&L, Balance Sheet, Key Ratios, Receivables, and GST summary into the standard MIS format your CA expects.",
  "revenue-trend":
    "Pulled monthly revenue from the Sales ledger across April 2024 – March 2025. Computed YoY vs FY23-24 and identified the best/worst months.",
  "cash-flow":
    "Forecasted 6 weeks of cash using confirmed receivables + recurring expenses. Ran 5 scenarios varying Nykaa collection, GST refund, and marketing spend.",
  runway:
    "Divided current cash (₹5.6L) by average monthly burn (₹18.6L) to get runway in months, then converted to days for urgency framing.",
  "expense-breakdown":
    "Aggregated indirect expenses by category from the P&L: Marketing, CAC, Employees, Fulfilment, COGS, and Overheads.",
  waterfall:
    "Walked through the P&L line items — Revenue → Gross Profit → EBITDA — showing each deduction and its magnitude.",
  "gst-recon":
    "Fetched GSTR-2B for March 2026 from the portal. Matched 147 Tally purchase invoices against 143 portal records. Flagged 7 value mismatches and 12 missing entries.",
  "gst-health":
    "Pulled 18 months of filing history. Computed ITC match rate vs GSTR-2A, average filing delay, excess unused ITC, and the filing streak.",
  "top-customers":
    "Pulled customer master and grouped sales by PAN across all channels. Ranked by revenue, computed LTV, orders, and return rate per customer.",
  "health-score":
    "Ran 4 dimension scores — Profitability, Liquidity, Efficiency, Growth — from the latest financials and took the mean for the overall.",
  "inventory-dead":
    "Cross-referenced the SKU master with 90+ day sales data. Computed locked capital per SKU, days since last sale, and grouped by category.",
  returns:
    "Pulled credit notes across channels for FY24-25. Computed return rate per channel and identified the top return reasons.",
  "cohort-retention":
    "Grouped customers by acquisition quarter. Tracked how many from each cohort continued to buy in subsequent quarters.",
  "money-flow":
    "Traced rupees from revenue channels through each deduction to Net P&L. Flow widths proportional to the amount flowing through.",
  "customer-ltv":
    "Computed days-since-last-order per customer. Plotted against lifetime value with order count driving bubble size and channel driving color.",
  "cyclic-transactions":
    "Cross-matched customer PANs against supplier PANs. Flagged parties appearing on both sides and ranked by the cycled amount.",
  "related-party":
    "Flagged parties with common directors, 20%+ common ownership, or explicit group relationships. Pulled sales + purchases per party.",
  "recurring-revenue":
    "Identified PANs with 2+ months of purchases in the FY. Computed recurring revenue share and monthly new-vs-repeat split.",
  "hsn-wise":
    "Grouped GSTR-1 outward supplies by HSN code. Ranked by taxable value. Cross-checked HSN coverage for Table 12 compliance.",
  "state-wise":
    "Grouped GSTR-1 sales by buyer state code. Computed per-state share and flagged the home state (Maharashtra) separately.",
  "filing-delay":
    "Pulled 24 months of GSTR-1 and GSTR-3B filing dates. Computed delay days vs each return's statutory due date.",
  unknown:
    "Couldn't confidently map your query to a known topic. Showing starter questions across cash, compliance, growth, and operations.",
};

const INTENT_LABELS: Record<Intent, string> = {
  "current-ratio": "Current ratio",
  receivables: "Receivables",
  payables: "Payables",
  mis: "MIS report",
  "revenue-trend": "Revenue trend",
  "cohort-retention": "Cohort retention",
  "money-flow": "Money flow",
  "customer-ltv": "Customer LTV",
  "cyclic-transactions": "Cyclic transactions",
  "related-party": "Related-party transactions",
  "recurring-revenue": "Recurring revenue",
  "hsn-wise": "HSN-wise sales",
  "state-wise": "State-wise sales",
  "filing-delay": "Filing delay calendar",
  "cash-flow": "Cash flow forecast",
  runway: "Runway",
  "expense-breakdown": "Expense breakdown",
  waterfall: "P&L waterfall",
  "gst-recon": "GST 2B reconciliation",
  "gst-health": "GST health",
  "top-customers": "Top customers",
  "health-score": "Business health",
  "inventory-dead": "Dead stock",
  returns: "Returns",
  unknown: "Suggestions",
};

/** Context each Result renderer receives. Currently just an onAsk
 *  callback so renderers can dispatch chat queries from interactive
 *  chart elements (e.g. click a treemap tile → ask about it). */
interface ResultCtx {
  onAsk: (q: string) => void;
}

const RESULT_RENDERERS: Record<Intent, (ctx: ResultCtx) => JSX.Element> = {
  // Current ratio: migrated to ChartRenderer — switches between
  // donut / bar / treemap for the 4 components of current assets.
  "current-ratio": () => {
    const shape: DataShape = {
      kind: "composition",
      title: "Current Assets composition",
      subtitle: `Total CA ₹${fL(K.ca)}L · CR ${K.cr.toFixed(2)}`,
      insight:
        "Current Ratio 2.60 reads healthy, but 83% of current assets are inventory. Your Quick Ratio (0.46) tells the truer story — liquidity depends on selling that stock.",
      total: K.ca,
      parts: [
        { label: "Inventory", value: R.stkC, color: "var(--purple)" },
        { label: "Debtors", value: R.debtors, color: "var(--blue)" },
        { label: "Cash", value: R.cash, color: "var(--green)" },
        { label: "Other CA", value: 1410000, color: "var(--text-4)" },
      ],
    };
    return <ChartRenderer shape={shape} defaultType="donut" />;
  },
  receivables: () => {
    const total = RECEIVABLES.reduce((s, r) => s + r.amount, 0);
    const b030 = 170000;
    const b3090 = 340000;
    const b90365 = 510000;
    const b365 = total - b030 - b3090 - b90365;
    return (
      <div className="space-y-3">
        <ChatStackedBar
          title="Aging buckets"
          subtitle={`₹${(total / 1e7).toFixed(2)}Cr receivable across 4 buckets`}
          segments={[
            { label: "0-30d", value: b030, color: "var(--green)" },
            { label: "30-90d", value: b3090, color: "var(--blue)" },
            { label: "90-365d", value: b90365, color: "var(--yellow)" },
            { label: "365+d", value: b365, color: "var(--red)" },
          ]}
        />
        <ChatBarChart
          title="Top 5 overdue parties"
          data={RECEIVABLES.slice(0, 5).map((r) => ({
            label: r.name,
            value: r.amount,
            color: r.days > 365 ? "var(--red)" : "var(--yellow)",
            caption: `${r.days} days overdue · ${r.bills} bills`,
          }))}
        />
      </div>
    );
  },
  // Payables: migrated to ChartRenderer — switch bar / donut / treemap.
  // MSME vendors get orange color (45-day compliance); others red.
  payables: () => {
    const total = PAYABLES.reduce((s, p) => s + p.amount, 0);
    const msmeTotal = PAYABLES.filter((p) => p.msme).reduce((s, p) => s + p.amount, 0);
    const shape: DataShape = {
      kind: "categorical",
      title: "Top vendors you owe",
      subtitle: `₹${(total / 1e7).toFixed(2)}Cr payable · ₹${(msmeTotal / 1e5).toFixed(1)}L to MSMEs`,
      insight: `₹${(total / 1e7).toFixed(2)}Cr payable across vendors. ₹${(msmeTotal / 1e5).toFixed(1)}L is owed to MSME-registered suppliers — those must clear within 45 days per the MSME Development Act, or Section 43B(h) disallows the expense.`,
      entries: PAYABLES.slice(0, 8).map((p) => ({
        label: p.name,
        value: p.amount,
        color: p.msme ? "var(--orange)" : "var(--red)",
        caption: `${p.days}d aged${p.msme ? " · MSME (45d rule)" : ""} · ${p.category}`,
      })),
    };
    return <ChartRenderer shape={shape} defaultType="bar" />;
  },
  mis: () => (
    <div
      className="rounded-xl overflow-hidden"
      style={{ background: "#fff", border: "1px solid var(--border)" }}
    >
      <div className="p-6" style={{ color: "#0F172A" }}>
        <p className="text-[10px] uppercase tracking-widest font-bold mb-1" style={{ color: "#64748B" }}>
          Management Information System
        </p>
        <p className="text-xl font-bold">Monthly MIS Report</p>
        <p className="text-xs mt-0.5" style={{ color: "#64748B" }}>
          Bandra Soap Pvt Ltd · March 2026
        </p>
        <hr className="my-4" style={{ borderColor: "#E2E8F0" }} />
        <p className="text-sm font-bold mb-3" style={{ color: "#0F172A" }}>P&amp;L Summary</p>
        <table className="w-full text-xs mb-4">
          <tbody>
            {[
              { label: "Revenue", value: `₹${(R.rev / 1e7).toFixed(2)} Cr`, bold: true },
              { label: "COGS", value: `₹${(R.cogs / 1e7).toFixed(2)} Cr` },
              { label: `Gross Profit (${K.gm.toFixed(0)}%)`, value: `₹${(R.gp / 1e7).toFixed(2)} Cr`, bold: true, color: "#16A34A" },
              { label: "OpEx", value: `₹${(R.indExp / 1e7).toFixed(2)} Cr` },
              { label: "EBITDA", value: `-₹${(Math.abs(R.ebitda) / 1e7).toFixed(2)} Cr`, bold: true, color: "#DC2626" },
              { label: "Net Loss", value: `-₹${(Math.abs(R.netPL) / 1e7).toFixed(2)} Cr`, bold: true, color: "#DC2626" },
            ].map((r) => (
              <tr key={r.label} style={{ borderTop: "1px solid #F1F5F9" }}>
                <td
                  className="py-1.5"
                  style={{ color: r.color || (r.bold ? "#0F172A" : "#475569"), fontWeight: r.bold ? 600 : 400 }}
                >
                  {r.label}
                </td>
                <td
                  className="py-1.5 text-right tabular-nums"
                  style={{
                    color: r.color || "#0F172A",
                    fontWeight: r.bold ? 700 : 500,
                    fontFamily: "'Space Grotesk', sans-serif",
                  }}
                >
                  {r.value}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  ),
  // Revenue trend: migrated to ChartRenderer — user can switch
  // between line / area / bar representations of the same 12-month data.
  "revenue-trend": () => {
    const maxIdx = R.ms.reduce((m, v, i) => (v > R.ms[m] ? i : m), 0);
    const shape: DataShape = {
      kind: "timeseries",
      title: "Monthly revenue · FY 2024-25",
      subtitle: `Total ₹${(R.rev / 1e7).toFixed(2)}Cr · ${K.yoy.toFixed(0)}% YoY`,
      insight:
        "Revenue peaked in April (₹16.8L) before a steady Q2-Q3 decline. Website D2C is growing 95% YoY while marketplaces returned heavily — D2C is the comeback lever.",
      points: MONTHS.map((m, i) => ({ x: m, y: R.ms[i] })),
      color: "var(--green)",
      highlight: {
        index: maxIdx,
        label: `${MONTHS[maxIdx]} ₹${fL(R.ms[maxIdx])}L`,
      },
    };
    return <ChartRenderer shape={shape} defaultType="line" />;
  },
  "cash-flow": () => (
    <ChatForecastChart
      title="Inflow vs outflow · running balance · next 6 weeks"
      weeks={CASH_FORECAST_WEEKS}
    />
  ),
  runway: () => {
    const months = R.cash / K.burn;
    const days = Math.round(months * 30);
    return (
      <div
        className="rounded-xl p-5"
        style={{ background: "var(--bg-surface)", border: "1px solid var(--border)" }}
      >
        <div className="flex flex-col items-center mb-4">
          <Gauge
            value={Math.min(days, 180)}
            min={0}
            max={180}
            thresholds={{ red: 30, yellow: 90 }}
            size={200}
            label="days of runway"
          />
          <p
            className="text-3xl font-bold mt-2"
            style={{
              color: days < 30 ? "var(--red)" : "var(--yellow)",
              fontFamily: "'Space Grotesk', sans-serif",
            }}
          >
            {days} days
          </p>
          <p className="text-xs" style={{ color: "var(--text-3)" }}>
            at current burn of ₹{fL(K.burn)}L/month
          </p>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <ChatKpi label="Cash on hand" value={`₹${fL(R.cash)}L`} />
          <ChatKpi
            label="Monthly burn"
            value={`₹${fL(K.burn)}L`}
            deltaColor="var(--red)"
          />
        </div>
      </div>
    );
  },
  // Expense breakdown: migrated to ChartRenderer — switch between
  // donut / bar / treemap for the same 6 expense categories.
  "expense-breakdown": () => {
    const totalExp =
      R.mkt + R.emp + R.cac + R.ful + R.orc + R.ovh + R.interest + R.cogs;
    const shape: DataShape = {
      kind: "composition",
      title: "Expense composition",
      subtitle: `Total spend FY 2024-25: ₹${(totalExp / 1e7).toFixed(2)}Cr`,
      insight: `Marketing + CAC together are ₹${((R.mkt + R.cac) / 1e7).toFixed(2)}Cr — larger than your Gross Profit. Cutting 30% here saves ~₹${((R.mkt + R.cac) * 0.3 / 12 / 1e5).toFixed(1)}L/mo and buys months of runway.`,
      total: totalExp,
      parts: [
        { label: "Marketing", value: R.mkt, color: "var(--red)" },
        { label: "Employees", value: R.emp, color: "var(--blue)" },
        { label: "CAC", value: R.cac, color: "var(--orange)" },
        { label: "COGS", value: R.cogs, color: "var(--purple)" },
        { label: "Fulfilment", value: R.ful, color: "var(--yellow)" },
        { label: "Overheads", value: R.ovh + R.orc, color: "var(--text-4)" },
      ],
    };
    return <ChartRenderer shape={shape} defaultType="donut" />;
  },
  waterfall: () => (
    <ChatWaterfall data={WATERFALL} title="P&L waterfall · Revenue to EBITDA" />
  ),
  "gst-recon": () => <ChatGstRecon period={RECONCILIATION.period} />,
  "gst-health": () => (
    <div
      className="rounded-xl p-5"
      style={{ background: "var(--bg-surface)", border: "1px solid var(--border)" }}
    >
      <div className="flex flex-col items-center mb-4">
        <Gauge
          value={GST_HEALTH.score}
          min={0}
          max={100}
          thresholds={{ red: 50, yellow: 75 }}
          size={180}
          label="GST Health"
        />
      </div>
      <div className="space-y-2">
        {[
          { label: "Filing streak", value: `${GST_HEALTH.filingStreak} months`, color: "var(--green)" },
          { label: "Avg days early", value: `${GST_HEALTH.avgDaysBeforeDue} days`, color: "var(--text-1)" },
          { label: "ITC match rate", value: `${GST_HEALTH.itcMatchRate}%`, color: "var(--blue)" },
          { label: "Excess ITC unclaimed", value: `₹${(GST_HEALTH.excessItcUnclaimed / 1e5).toFixed(1)}L`, color: "var(--yellow)" },
        ].map((m) => (
          <div
            key={m.label}
            className="flex items-center justify-between px-3 py-2 rounded-lg"
            style={{ background: "var(--bg-hover)" }}
          >
            <span className="text-xs" style={{ color: "var(--text-3)" }}>
              {m.label}
            </span>
            <span
              className="text-sm font-bold tabular-nums"
              style={{ color: m.color, fontFamily: "'Space Grotesk', sans-serif" }}
            >
              {m.value}
            </span>
          </div>
        ))}
      </div>
    </div>
  ),
  // Top customers: migrated to ChartRenderer — switch between
  // bar / donut / treemap for top 10 customers by revenue.
  "top-customers": () => {
    const total = TOP_CUSTOMERS.reduce((s, c) => s + c.revenue, 0);
    const shape: DataShape = {
      kind: "categorical",
      title: "Top customers by revenue",
      subtitle: `Top 10 = ₹${(total / 1e7).toFixed(2)}Cr of ₹${(R.rev / 1e7).toFixed(2)}Cr`,
      insight:
        "Nykaa, Amazon, and Website D2C drive ~70% of revenue. D2C has the highest LTV (₹98L) and lowest return rate (5.7%) — double down on direct acquisition.",
      entries: TOP_CUSTOMERS.slice(0, 10).map((c) => ({
        label: c.name,
        value: c.revenue,
        color:
          c.channel === "Marketplace"
            ? "var(--blue)"
            : c.channel === "D2C"
            ? "var(--green)"
            : "var(--purple)",
        caption: `${c.orders} orders · LTV ₹${(c.ltv / 1e5).toFixed(1)}L · ${c.channel}`,
      })),
    };
    return <ChartRenderer shape={shape} defaultType="bar" />;
  },
  // Health score: migrated to ChartRenderer — switches between
  // radar (default, shows shape at a glance) and bar (ranked dimensions).
  "health-score": () => {
    const avg =
      HEALTH_SCORES.reduce((s, h) => s + h.score, 0) / HEALTH_SCORES.length;
    const shape: DataShape = {
      kind: "radar",
      title: "Business health dimensions",
      subtitle: `Overall ${avg.toFixed(0)}/100 · weakest dimension drags the rest`,
      insight:
        "Growth (15/100) is dragging the overall score. Revenue is -55% YoY — rebuilding via Website D2C (+95%) is the fastest single lever.",
      axes: HEALTH_SCORES.map((h) => ({ name: h.label, max: 100 })),
      values: HEALTH_SCORES.map((h) => h.score),
      seriesName: "Bandra Soap",
      color: "var(--green)",
    };
    return <ChartRenderer shape={shape} defaultType="radar" />;
  },
  // Cohort retention heatmap. Rows = cohort quarters, cols = tenure periods.
  "cohort-retention": () => {
    const cols = ["Q1", "Q2", "Q3", "Q4", "Q5", "Q6", "Q7", "Q8"];
    const rows = COHORT_RETENTION.map((c) => c.cohort);
    // Pad each row to 8 cols with NaN for missing (future) quarters.
    const values = COHORT_RETENTION.map((c) => {
      const row: number[] = [];
      for (let i = 0; i < 8; i++) {
        row.push(c.retention[i] ?? NaN);
      }
      return row;
    });
    const shape: DataShape = {
      kind: "matrix",
      title: "Customer retention by cohort",
      subtitle: "Rows = acquisition quarter · cols = tenure · color = % still active",
      insight:
        "Q2 retention climbed from 68% (FY23 Q1) to 82% (FY24 Q2) — the product is getting stickier. Long-tail retention (Q8) is still only 21%, so refill-reminder WhatsApp flows could unlock the dormant half.",
      rows,
      cols,
      values,
      format: "percent",
      colorDirection: "higher-better",
    };
    return <ChartRenderer shape={shape} defaultType="heatmap" />;
  },
  // Money flow sankey. Revenue channels → Net P&L with proportional ribbons.
  "money-flow": () => {
    // Build nodes + links. Amount at each edge = what's flowing through.
    // Use approximate channel splits (matching CausalChain) + R numbers.
    const channelRev = {
      Marketplace: R.rev * 0.55,
      "Website D2C": R.rev * 0.34,
      "B2B Offline": R.rev * 0.11,
    };
    const shape: DataShape = {
      kind: "flow",
      title: "Money flow · Revenue to Net P&L",
      subtitle: "Ribbon width shows the size of each flow — thick = big lever",
      insight:
        "Marketing + CAC together are the thickest outflow at ₹3.94Cr — 52% of all spend. That's your single biggest lever to profitability; halve it and you're cash-flow neutral.",
      nodes: [
        { name: "Marketplace", category: "source" },
        { name: "Website D2C", category: "source" },
        { name: "B2B Offline", category: "source" },
        { name: "Total Revenue", category: "total" },
        { name: "COGS", category: "deduction" },
        { name: "Gross Profit", category: "total" },
        { name: "Marketing", category: "deduction" },
        { name: "CAC", category: "deduction" },
        { name: "Employees", category: "deduction" },
        { name: "Fulfilment", category: "deduction" },
        { name: "Overheads", category: "deduction" },
        { name: "EBITDA (loss)", category: "result" },
      ],
      links: [
        { source: "Marketplace", target: "Total Revenue", value: channelRev.Marketplace },
        { source: "Website D2C", target: "Total Revenue", value: channelRev["Website D2C"] },
        { source: "B2B Offline", target: "Total Revenue", value: channelRev["B2B Offline"] },
        { source: "Total Revenue", target: "COGS", value: R.cogs },
        { source: "Total Revenue", target: "Gross Profit", value: R.gp },
        { source: "Gross Profit", target: "Marketing", value: R.mkt },
        { source: "Gross Profit", target: "CAC", value: R.cac },
        { source: "Gross Profit", target: "Employees", value: R.emp },
        { source: "Gross Profit", target: "Fulfilment", value: R.ful },
        { source: "Gross Profit", target: "Overheads", value: R.ovh + R.orc },
        {
          source: "Gross Profit",
          target: "EBITDA (loss)",
          // Flow out to EBITDA must be positive for sankey; use absolute burn
          value: Math.max(0, R.gp - (R.mkt + R.cac + R.emp + R.ful + R.ovh + R.orc)),
        },
      ],
    };
    return <ChartRenderer shape={shape} defaultType="sankey" />;
  },
  // Customer LTV vs recency scatter.
  "customer-ltv": () => {
    // "Today" = April 15 2026 for computing days-since-last-order
    const TODAY = new Date("2026-04-15").getTime();
    const parseDate = (s: string): number => {
      const t = new Date(s).getTime();
      return Number.isNaN(t) ? TODAY : t;
    };
    const shape: DataShape = {
      kind: "scatter",
      title: "Customer LTV vs recency",
      subtitle: "Dot size = order count · color = channel · top-left is the ideal zone",
      insight:
        "Amazon has the highest LTV customer (₹112L over 298 orders) but 32% of those orders come back as returns. Website D2C has lower LTV per customer but cleaner margins — cheaper to grow.",
      points: TOP_CUSTOMERS.map((c) => {
        const daysSince = Math.max(
          0,
          Math.round((TODAY - parseDate(c.lastOrder)) / (1000 * 60 * 60 * 24))
        );
        return {
          x: daysSince,
          y: c.ltv,
          label: c.name,
          size: c.orders,
          category: c.channel,
        };
      }),
      xLabel: "Days since last order",
      yLabel: "Lifetime value",
      xIsCurrency: false,
      yIsCurrency: true,
    };
    return <ChartRenderer shape={shape} defaultType="bubble" />;
  },
  // Dead stock: ECharts treemap on desktop Result panel. Clicks dispatch
  // a liquidation question into Chat via the context's onAsk.
  "inventory-dead": ({ onAsk }) => (
    <DeadStockTreemap height={480} onAsk={onAsk} />
  ),
  // Returns: migrated to ChartRenderer — switch bar / donut / treemap.
  // Color by rate: red >20%, orange >10%, yellow otherwise.
  returns: () => {
    const shape: DataShape = {
      kind: "categorical",
      title: "Returns by channel",
      subtitle: `₹${(RETURNS_SUMMARY.totalReturns / 1e7).toFixed(2)}Cr returned · ${RETURNS_SUMMARY.returnRate.toFixed(1)}% of gross sales`,
      insight:
        "Amazon's return rate is 32.5% — 4× your D2C channel's 5.7%. Damaged-in-transit is the top reason. Better packaging + switching to standard FBA could cut returns 50%+ and recover ~₹37L/quarter.",
      entries: RETURNS_BY_CHANNEL.map((c) => ({
        label: c.channel,
        value: c.returns,
        color:
          c.rate > 20
            ? "var(--red)"
            : c.rate > 10
            ? "var(--orange)"
            : "var(--yellow)",
        caption: `${c.rate.toFixed(1)}% rate · top reason: ${c.topReason}`,
      })),
    };
    return <ChartRenderer shape={shape} defaultType="bar" />;
  },
  // Cyclic transactions: categorical bar sized by min(sales,purchases).
  // The min side is the "cycled amount" — that's what's actually at risk.
  "cyclic-transactions": () => {
    const shape: DataShape = {
      kind: "categorical",
      title: "Cyclic transactions · same party as buyer + seller",
      subtitle:
        "Bar = cycled amount (min of sales, purchases) · color = severity",
      insight:
        "Patel Traders is 70% cycled — their purchases from you nearly match your purchases from them. GST officers flag this as potential round-tripping. Document the business rationale before scrutiny or restructure.",
      entries: CYCLIC_TRANSACTIONS.map((c) => ({
        label: c.partyName,
        value: Math.min(c.totalSales, c.totalPurchases),
        color:
          c.severity === "high"
            ? "var(--red)"
            : c.severity === "medium"
            ? "var(--orange)"
            : "var(--yellow)",
        caption: `Sold ₹${(c.totalSales / 1e5).toFixed(1)}L · Bought ₹${(c.totalPurchases / 1e5).toFixed(1)}L · ${c.flag}`,
      })),
    };
    return <ChartRenderer shape={shape} defaultType="bar" />;
  },
  // Related-party: combined sales + purchases view as composition.
  "related-party": () => {
    const entries = [
      ...RELATED_PARTY_SALES.map((r) => ({
        label: `(Sale) ${r.partyName}`,
        value: r.invoiceValue,
        color: "var(--green)",
        caption: `${r.relationship} · ${r.invoiceCount} invoices`,
      })),
      ...RELATED_PARTY_PURCHASES.map((r) => ({
        label: `(Purchase) ${r.partyName}`,
        value: r.invoiceValue,
        color: "var(--red)",
        caption: `${r.relationship} · ${r.invoiceCount} invoices`,
      })),
    ];
    const shape: DataShape = {
      kind: "categorical",
      title: "Related-party transactions",
      subtitle: "Green = outward (sales) · red = inward (purchases)",
      insight:
        "₹74L in related-party transactions flagged. Keep third-party price benchmarks + a signed transfer-pricing policy + board minutes on file — that's your Section 40A(2) defense if the AO asks.",
      entries,
    };
    return <ChartRenderer shape={shape} defaultType="bar" />;
  },
  // Recurring revenue: monthly new vs repeat as a composition-over-time.
  // Using the timeseries shape with repeat % — cleaner than stacked bars.
  "recurring-revenue": () => {
    const shape: DataShape = {
      kind: "timeseries",
      title: "Repeat customer revenue %",
      subtitle: `Sticky-revenue trend · FY total: ${RECURRING_REVENUE.recurringPct.toFixed(0)}% recurring`,
      insight:
        "85% of revenue is recurring — the business is genuinely sticky. Monthly repeat % climbed from 68% (Apr) to 92% (Dec). Product-market fit is tightening even while total revenue slipped.",
      points: RECURRING_REVENUE.monthly.map((m) => ({
        x: m.month,
        y: m.repeatPct,
      })),
      color: "var(--green)",
      highlight: {
        index: RECURRING_REVENUE.monthly.reduce(
          (best, m, i, arr) =>
            m.repeatPct > arr[best].repeatPct ? i : best,
          0
        ),
        label: "",
      },
    };
    return <ChartRenderer shape={shape} defaultType="area" />;
  },
  // HSN-wise sales: categorical bar of top 8 HSN codes by taxable value.
  "hsn-wise": () => {
    const shape: DataShape = {
      kind: "categorical",
      title: "Sales by HSN code",
      subtitle: `${HSN_WISE_SALES.length} codes · GSTR-1 Table 12`,
      insight:
        "Hair oil (HSN 33059011) is 37% of taxable turnover — ₹3.42Cr. Your GSTR-1 Table 12 summary is compliant. All codes sit at 18% GST, so no rate-misclassification risk.",
      entries: HSN_WISE_SALES.map((h) => ({
        label: `${h.hsn} · ${h.particulars.slice(0, 30)}${h.particulars.length > 30 ? "…" : ""}`,
        value: h.taxableValue,
        color: "var(--purple)",
        caption: `${h.invoiceCount} invoices · ${h.avgRate}% rate`,
      })),
    };
    return <ChartRenderer shape={shape} defaultType="bar" />;
  },
  // State-wise sales: categorical bar of top 14 states.
  "state-wise": () => {
    const shape: DataShape = {
      kind: "categorical",
      title: "Sales by state",
      subtitle: "Taxable value per state · colors reflect home state vs outside",
      insight:
        "Maharashtra, Karnataka, and Delhi drive 62% of taxable sales. If you register in UP or Haryana, you convert IGST on those shipments into local CGST+SGST — better ITC utilisation.",
      entries: STATE_WISE_SALES.map((s) => ({
        label: s.state,
        value: s.taxableValue,
        // Maharashtra (home) in green; other major destinations in blue
        color: s.stateCode === "27" ? "var(--green)" : "var(--blue)",
        caption: `${s.invoiceCount} invoices · tax ₹${(s.tax / 1e5).toFixed(1)}L`,
      })),
    };
    return <ChartRenderer shape={shape} defaultType="bar" />;
  },
  // Filing delay: 2-row matrix (return type × month), heatmap colors.
  // colorDirection=higher-worse because higher delay-days = worse.
  "filing-delay": () => {
    const shape: DataShape = {
      kind: "matrix",
      title: "Filing delay days · 24 months",
      subtitle: "Green = on time · red = late · rows are GSTR-1 and GSTR-3B",
      insight: `${FILING_STATS.onTimeMonths} of ${FILING_STATS.totalMonthsTracked} filings on time (${((FILING_STATS.onTimeMonths / FILING_STATS.totalMonthsTracked) * 100).toFixed(0)}%). Slippages cluster in GSTR-3B, not GSTR-1 — meaning the data is ready but the cash to pay liability isn't. Prep 3B on the 15th anyway; ITC often covers the payable and you can file zero-cash.`,
      rows: [...FILING_DELAYS.returnTypes],
      cols: FILING_DELAYS.months,
      values: FILING_DELAYS.delayDays,
      format: "number",
      colorDirection: "higher-worse",
    };
    return <ChartRenderer shape={shape} defaultType="heatmap" />;
  },
  unknown: () => (
    <div
      className="rounded-xl p-5 text-center"
      style={{ background: "var(--bg-surface)", border: "1px solid var(--border)" }}
    >
      <Sparkles
        size={20}
        className="mx-auto mb-2"
        style={{ color: "var(--green)" }}
      />
      <p className="text-sm font-semibold" style={{ color: "var(--text-1)" }}>
        Ask Riko a question to see the result here
      </p>
      <p className="text-xs mt-1" style={{ color: "var(--text-3)" }}>
        Try the categorized prompts on the left.
      </p>
    </div>
  ),
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
      "Filing delay calendar",
      "Cyclic transactions",
      "Related-party transactions",
    ],
  },
  {
    title: "Growth",
    Icon: TrendingUp,
    color: "var(--purple)",
    prompts: [
      "Revenue trend this year",
      "Recurring revenue %",
      "Top customers by revenue",
      "Customer LTV vs recency",
    ],
  },
  {
    title: "Operations",
    Icon: Package,
    color: "var(--orange)",
    prompts: [
      "State-wise sales",
      "HSN-wise sales",
      "Dead stock SKUs",
      "Money flow diagram",
    ],
  },
];

/* ═══════════════════════════════════════════════════════════════
   Input bar
   ═══════════════════════════════════════════════════════════════
   Mobile keyboard handling: on iOS the virtual keyboard shrinks
   the visual viewport but doesn't fire window resize. We listen
   to window.visualViewport so the sticky input stays visible above
   the keyboard instead of vanishing behind it. */
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
  // Track keyboard inset. On desktop this stays 0.
  const [kbInset, setKbInset] = useState(0);

  useEffect(() => {
    const vv = typeof window !== "undefined" ? window.visualViewport : null;
    if (!vv) return;
    const update = () => {
      // How much of the bottom is covered by the virtual keyboard.
      // vv.height shrinks when the keyboard opens; layout viewport doesn't.
      const inset = Math.max(0, window.innerHeight - vv.height - vv.offsetTop);
      setKbInset(inset);
    };
    update();
    vv.addEventListener("resize", update);
    vv.addEventListener("scroll", update);
    return () => {
      vv.removeEventListener("resize", update);
      vv.removeEventListener("scroll", update);
    };
  }, []);

  // When keyboard is open (inset > 0), sit directly above it.
  // When closed, keep our default sticky position above the 60px bottom nav.
  const bottomStyle =
    kbInset > 0
      ? { bottom: `${kbInset}px` }
      : undefined;

  return (
    <div
      className="sticky bottom-[calc(60px+env(safe-area-inset-bottom,0px))] md:bottom-0 px-4 py-3"
      style={{
        background: "var(--bg-primary)",
        borderTop: "1px solid var(--border)",
        ...bottomStyle,
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
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              onSend();
            }
          }}
          placeholder={placeholder}
          aria-label="Ask Riko a question"
          className="flex-1 bg-transparent text-sm min-w-0 py-2"
          style={{ color: "var(--text-1)" }}
        />
        <button
          onClick={onSend}
          disabled={!value.trim()}
          className="rounded-lg cursor-pointer transition-opacity disabled:opacity-40 flex items-center justify-center"
          style={{
            background: value.trim() ? "var(--green)" : "var(--bg-hover)",
            width: 40,
            height: 40,
          }}
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
   Result panel (desktop) — renders the active assistant message's
   chart/widget full-width, with demo-quality action icons in the
   header (edit/download/share are decorative). When conversation
   is empty, shows an onboarding state with category prompts.
   ═══════════════════════════════════════════════════════════════ */
function ResultPanel({
  currentIntent,
  hasMessages,
  onAsk,
  onNewChat,
}: {
  currentIntent: Intent | null;
  hasMessages: boolean;
  onAsk: (q: string) => void;
  onNewChat: () => void;
}) {
  const intent = currentIntent;
  const Renderer = intent ? RESULT_RENDERERS[intent] : null;
  const label = intent ? INTENT_LABELS[intent] : "Result";

  // Ref to the scrollable content area — passed to exporters so they
  // can find the chart's canvas or svg and rasterize it.
  const contentRef = useRef<HTMLDivElement | null>(null);
  // Tiny inline toast for export feedback (no toast library dep).
  const [toast, setToast] = useState<string | null>(null);
  useEffect(() => {
    if (!toast) return;
    const t = window.setTimeout(() => setToast(null), 2400);
    return () => window.clearTimeout(t);
  }, [toast]);

  const handleDownload = async () => {
    if (!intent) return;
    const filename = `riko-${slugify(label)}-${new Date().toISOString().slice(0, 10)}.png`;
    const ok = await downloadChartAsPng(contentRef.current, filename);
    setToast(ok ? `Downloaded ${filename}` : "Export unavailable for this view");
  };

  const handleShare = () => {
    if (!intent) return;
    shareToWhatsApp(
      `Sharing from Riko · ${label}\n\nBandra Soap Pvt Ltd · FY 2024-25\nOpen Riko to see the live chart.`
    );
    setToast("Opening WhatsApp to share");
  };

  return (
    <div className="flex flex-col h-full overflow-hidden relative">
      {/* Header bar */}
      <div
        className="sticky top-0 z-10 flex items-center justify-between px-5 py-3"
        style={{
          background: "var(--bg-secondary)",
          borderBottom: "1px solid var(--border)",
        }}
      >
        <div className="flex items-center gap-2 min-w-0">
          <span
            className="text-[10px] font-bold tracking-widest uppercase flex-shrink-0"
            style={{ color: "var(--text-4)" }}
          >
            Result
          </span>
          {intent && (
            <>
              <span style={{ color: "var(--text-4)" }}>·</span>
              <span
                className="text-sm font-semibold truncate"
                style={{ color: "var(--text-1)" }}
              >
                {label}
              </span>
            </>
          )}
        </div>
        <div className="flex items-center gap-1 flex-shrink-0">
          {intent && (
            <>
              <button
                onClick={handleDownload}
                className="p-1.5 rounded-md cursor-pointer transition-opacity hover:opacity-70"
                style={{ color: "var(--text-3)" }}
                title="Download as PNG"
                aria-label="Download result as PNG"
              >
                <Download size={14} />
              </button>
              <button
                onClick={handleShare}
                className="p-1.5 rounded-md cursor-pointer transition-opacity hover:opacity-70"
                style={{ color: "var(--text-3)" }}
                title="Share via WhatsApp"
                aria-label="Share result via WhatsApp"
              >
                <Share2 size={14} />
              </button>
              <div
                className="w-px h-4 mx-1"
                style={{ background: "var(--border)" }}
              />
            </>
          )}
          <button
            onClick={onNewChat}
            className="text-[11px] font-semibold flex items-center gap-1 px-2 py-1.5 rounded-md cursor-pointer transition-opacity hover:opacity-80"
            style={{
              background: "var(--bg-surface)",
              border: "1px solid var(--border)",
              color: "var(--text-3)",
            }}
          >
            <RotateCcw size={11} />
            New chat
          </button>
        </div>
      </div>

      {/* Main content — scrollable. No suggested-follow-up chips here;
         follow-ups live in the chat on the left as <Chips>, avoiding
         duplication across panels. */}
      <div ref={contentRef} className="flex-1 overflow-y-auto px-5 py-4">
        {Renderer ? (
          <div>
            <Renderer onAsk={onAsk} />
          </div>
        ) : (
          // Empty state — no active result
          <div className="h-full flex flex-col items-center justify-center text-center gap-4">
            <div
              className="w-14 h-14 rounded-full flex items-center justify-center"
              style={{
                background: "color-mix(in srgb, var(--green) 12%, transparent)",
              }}
            >
              <Sparkles size={22} style={{ color: "var(--green)" }} />
            </div>
            <div>
              <p
                className="text-sm font-semibold"
                style={{ color: "var(--text-1)" }}
              >
                {hasMessages
                  ? "No result for this message"
                  : "Ask Riko something"}
              </p>
              <p
                className="text-xs mt-1 max-w-xs"
                style={{ color: "var(--text-3)" }}
              >
                {hasMessages
                  ? "Your answer will appear here when Riko responds."
                  : "Your chart, table, or recon widget will show up here full-width."}
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Inline toast for export feedback */}
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            transition={{ duration: 0.2 }}
            className="absolute bottom-4 left-1/2 -translate-x-1/2 z-20 px-3 py-2 rounded-lg text-[12px] font-medium flex items-center gap-2"
            style={{
              background: "var(--green)",
              color: "white",
              boxShadow: "0 6px 20px rgba(0,0,0,0.25)",
            }}
          >
            <CheckCircle2 size={14} />
            {toast}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   Main chat
   ═══════════════════════════════════════════════════════════════ */
interface ChatScreenProps {
  /** Optional: a question pre-seeded from another screen (e.g. Dashboard
   *  Causal Chain click). Auto-dispatches on mount if set, then calls
   *  onQuestionConsumed so the parent can clear it. */
  initialQuestion?: string | null;
  onQuestionConsumed?: () => void;
}

export function ChatScreen({
  initialQuestion,
  onQuestionConsumed,
}: ChatScreenProps = {}) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  // Track WHEN thinking started so we can show a live timer AND compute
  // the final duration to persist on the assistant message for the
  // "Analyzed in X.Xs" chip. Null = not thinking.
  const [thinkingStartedAt, setThinkingStartedAt] = useState<number | null>(null);
  const scrollerRef = useRef<HTMLDivElement>(null);
  // Monotonic counter for message IDs (avoids Date.now purity complaints)
  const idSeq = useRef(0);
  const nextId = (role: "u" | "a") => {
    idSeq.current += 1;
    return `${role}-${idSeq.current}`;
  };

  /* Auto-scroll only when user is near the bottom already.
     If they've scrolled up to re-read something, don't hijack their position. */
  useEffect(() => {
    const el = scrollerRef.current;
    if (!el) return;
    const distanceFromBottom = el.scrollHeight - el.scrollTop - el.clientHeight;
    if (distanceFromBottom < 120) {
      el.scrollTop = el.scrollHeight;
    }
  }, [messages, thinkingStartedAt]);

  /** Per-intent delay feel. Complex queries (recon, forecasts, cohort)
   *  take longer so the "Analyzed in X.Xs" feels earned. Simpler ones
   *  resolve fast. Tune these as the feel evolves. */
  const delayFor = (intent: Intent): number => {
    switch (intent) {
      case "gst-recon":
      case "cash-flow":
      case "cohort-retention":
      case "money-flow":
      case "filing-delay":
        return 1600;
      case "revenue-trend":
      case "customer-ltv":
      case "top-customers":
      case "inventory-dead":
      case "waterfall":
      case "state-wise":
      case "hsn-wise":
        return 1200;
      case "runway":
      case "current-ratio":
      case "gst-health":
      case "health-score":
      case "recurring-revenue":
      case "cyclic-transactions":
      case "related-party":
        return 900;
      default:
        return 700;
    }
  };

  const handleSend = (raw?: string) => {
    const text = (raw ?? input).trim();
    if (!text) return;
    const intent = classifyIntent(text);
    const uId = nextId("u");
    const aId = nextId("a");
    const delay = delayFor(intent);

    setMessages((prev) => [
      ...prev,
      { id: uId, role: "user", text, intent },
    ]);
    setInput("");
    // Snapshot start time; ThinkingLive reads this via a ref-stable constant
    const startedAt = performance.now();
    // Using performance.now is a write to an external resource rather than
    // a render-side read; the lint rule allows this.
    setThinkingStartedAt(Date.now());

    window.setTimeout(() => {
      const elapsed = Math.round(performance.now() - startedAt);
      setThinkingStartedAt(null);
      setMessages((prev) => [
        ...prev,
        {
          id: aId,
          role: "assistant",
          intent,
          thinkingDurationMs: elapsed,
        },
      ]);
    }, delay);
  };

  /* Consume initialQuestion from parent (e.g. Dashboard → Causal Chain node
     click). Auto-dispatch on mount only when the question changes from null. */
  const consumedQuestionRef = useRef<string | null>(null);
  useEffect(() => {
    if (
      initialQuestion &&
      initialQuestion !== consumedQuestionRef.current
    ) {
      consumedQuestionRef.current = initialQuestion;
      handleSend(initialQuestion);
      onQuestionConsumed?.();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialQuestion]);

  const handleNewChat = () => {
    setMessages([]);
    setInput("");
    setThinkingStartedAt(null);
  };

  // Current intent = last assistant message intent
  const currentIntent: Intent | null = useMemo(() => {
    for (let i = messages.length - 1; i >= 0; i--) {
      const m = messages[i];
      if (m.role === "assistant") return m.intent;
    }
    return null;
  }, [messages]);


  /* ── Empty state ── */
  if (messages.length === 0) {
    return (
      <MotionConfig reducedMotion="user">
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
                        className="flex items-center justify-between gap-2 w-full px-3 py-3 md:py-2 min-h-[44px] md:min-h-0 rounded-lg text-left cursor-pointer transition-colors hover:opacity-80"
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
      </MotionConfig>
    );
  }

  /* ── Conversation state ── */
  return (
    <MotionConfig reducedMotion="user">
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
      className="flex flex-1 w-full"
    >
      {/* Left — conversation */}
      <div
        className="flex flex-col flex-1 md:w-[45%] md:flex-none md:border-r min-w-0"
        style={{ borderColor: "var(--border)" }}
      >
        <div
          ref={scrollerRef}
          role="log"
          aria-live="polite"
          aria-label="Chat conversation with Riko"
          className="flex-1 overflow-y-auto px-4 py-4"
        >
          {messages.map((m) => {
            if (m.role === "user") {
              return <UserBubble key={m.id} text={m.text} />;
            }
            const Renderer = EXCHANGE_RENDERERS[m.intent];
            return (
              <div key={m.id}>
                <ThinkingRow
                  intent={m.intent}
                  durationMs={m.thinkingDurationMs ?? 1000}
                />
                <Renderer onFollowup={handleSend} />
              </div>
            );
          })}
          {thinkingStartedAt !== null && (
            <ThinkingLive startedAt={thinkingStartedAt} />
          )}
        </div>
        <InputBar value={input} onChange={setInput} onSend={() => handleSend()} />
      </div>

      {/* Right — Result panel (desktop only).
         FireAI pattern: big chart/widget full-width, summary + chips
         stay on the left in conversation. On mobile this panel is
         hidden and charts render inline in the chat. */}
      <div
        className="hidden md:flex md:flex-col md:w-[55%] min-w-0"
        style={{ background: "var(--bg-secondary)" }}
      >
        <ResultPanel
          currentIntent={currentIntent}
          hasMessages={messages.length > 0}
          onAsk={handleSend}
          onNewChat={handleNewChat}
        />
      </div>
    </motion.div>
    </MotionConfig>
  );
}
