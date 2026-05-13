"use client";

import { useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  MessageCircle,
  Mail,
  MessageSquare as MessageSquareIcon,
  AlertTriangle,
  X,
  Phone,
  ArrowRight,
  BellRing,
  BellOff,
} from "lucide-react";
import { Pill } from "@/components/ui/pill";
import { WhatsAppModal } from "@/components/ui/whatsapp-modal";
import { Party360Drawer } from "@/components/ui/party-360-drawer";
import { AutoReminderCatchUpModal } from "@/components/ui/auto-reminder-catchup-modal";
import { SetAutoReminderModal } from "@/components/ui/set-auto-reminder-modal";
import { FollowUpModal } from "@/components/ui/follow-up-modal";
import {
  RECEIVABLES,
  PAYABLES,
  K,
  fL,
  formatINR,
  formatDate,
  getPartyContact,
  lastRemindedLabel,
  agingColor5,
  REMINDER_LIST_FILTERS,
  REMINDER_AUTOMATION_DEFAULTS,
  computeReminderAttribution,
  computeCatchUpBuckets,
  type ReminderListFilter,
  getPartyReminderHistory,
} from "@/lib/data";
import { useAutoReminderEnabled } from "@/lib/use-auto-reminder";
import { usePartyFollowUpMap, resolveFollowUp } from "@/lib/use-party-followup";

/* Stable "today" for the demo — keeps filters purity-safe (React 19's
   purity rule forbids Date.now() in useMemo/render). Aligned with the
   demo dataset which centers on 20 Apr 2026. */
const DEMO_TODAY_MS = new Date("2026-04-20T23:59:59+05:30").getTime();
const ONE_WEEK_MS = 7 * 24 * 60 * 60 * 1000;

/* ------------------------------------------------------------------ */
/*  Desktop enrichment data (receivables)                             */
/* ------------------------------------------------------------------ */
const agingDetailed = [
  { label: "0-30 days", amount: "0.43L", pct: 5, color: "var(--green)", border: "var(--green)" },
  { label: "30-90 days", amount: "0.87L", pct: 10, color: "var(--blue)", border: "var(--blue)" },
  { label: "90-365 days", amount: "1.30L", pct: 15, color: "var(--yellow)", border: "var(--yellow)" },
  { label: "365+ days", amount: "6.08L", pct: 70, color: "var(--red)", border: "var(--red)" },
];

const collectionInsights = [
  { num: 1, text: "Reconcile Nykaa accounts \u2014 \u20B912.6L across 298 bills may include contra-settled amounts" },
  { num: 2, text: "Escalate Paytm settlement \u2014 \u20B93.55L pending 2,132 days, likely requires relationship manager contact" },
  { num: 3, text: "Batch-send WhatsApp reminders to P2/P3 parties \u2014 \u20B910.8L recoverable" },
];

const riskMatrix = {
  topRight:   { label: "High Amount + Long Overdue", color: "var(--red)", parties: ["Nykaa E-Retail", "One97 (Paytm)"] },
  topLeft:    { label: "High Amount + Recent", color: "var(--yellow)", parties: ["Website Debtors"] },
  bottomRight:{ label: "Low Amount + Long Overdue", color: "var(--orange)", parties: ["LLC Olimpiya"] },
  bottomLeft: { label: "Low Amount + Recent", color: "var(--green)", parties: ["Scale Global"] },
};

/* ------------------------------------------------------------------ */
/*  Helpers                                                           */
/* ------------------------------------------------------------------ */
const fmt = (v: number) =>
  "\u20B9" + v.toLocaleString("en-IN", { maximumFractionDigits: 0 });

const totalOutstanding = RECEIVABLES.reduce((s, r) => s + r.amount, 0);

const priorityColor: Record<string, string> = {
  P1: "var(--red)",
  P2: "var(--yellow)",
  P3: "var(--text-4)",
};

/* Aging distribution (approximate from the data set) */
const aging = [
  { label: "0-30d", pct: 5, color: "var(--green)" },
  { label: "30-90d", pct: 10, color: "var(--blue)" },
  { label: "90-365d", pct: 15, color: "var(--yellow)" },
  { label: "365+", pct: 70, color: "var(--red)" },
];

/* ------------------------------------------------------------------ */
/*  Payables-specific data                                            */
/* ------------------------------------------------------------------ */
const totalPayable = PAYABLES.reduce((s, p) => s + p.amount, 0);
const payableP1Count = PAYABLES.filter((p) => p.priority === "P1").length;
const payableMsmeCount = PAYABLES.filter((p) => p.msme).length;
const payableMsmeTotal = PAYABLES.filter((p) => p.msme).reduce((s, p) => s + p.amount, 0);
const payableAvgDpo = 71; // per spec

function daysColorPayable(d: number): string {
  // For payables: >60 is red (overdue or near-overdue), 30-60 blue, <30 green/text-2
  if (d > 60) return "var(--red)";
  if (d > 30) return "var(--blue)";
  return "var(--green)";
}

/* Payables aging buckets — derived from data
   0-30: items where days <= 30 (≈ 49% by value)
   30-60: items where 30 < days <= 60 (≈ 33% by value)
   60+: items where days > 60 (≈ 18% by value) */
const payableBuckets = (() => {
  const b030 = PAYABLES.filter((p) => p.days <= 30).reduce((s, p) => s + p.amount, 0);
  const b3060 = PAYABLES.filter((p) => p.days > 30 && p.days <= 60).reduce((s, p) => s + p.amount, 0);
  const b60 = PAYABLES.filter((p) => p.days > 60).reduce((s, p) => s + p.amount, 0);
  const t = b030 + b3060 + b60;
  return [
    { label: "0-30d", amount: b030, pct: Math.round((b030 / t) * 100), color: "var(--green)" },
    { label: "30-60d", amount: b3060, pct: Math.round((b3060 / t) * 100), color: "var(--blue)" },
    { label: "60+", amount: b60, pct: Math.round((b60 / t) * 100), color: "var(--red)" },
  ];
})();

/* ------------------------------------------------------------------ */
/*  Row animation stagger                                             */
/* ------------------------------------------------------------------ */
const rowVariants = {
  hidden: { opacity: 0, y: 12 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.3, delay: i * 0.04, ease: "easeOut" as const },
  }),
};

/* ------------------------------------------------------------------ */
/*  Auto-Reminder Hero card                                           */
/*                                                                    */
/*  Replaces the old chip-shaped "Auto reminder Off →" pill that      */
/*  was jammed inline with the filter chips. That pill conflated      */
/*  "filter the table" with "toggle a feature on for the whole AR     */
/*  collection" — same visual weight, totally different jobs.         */
/*                                                                    */
/*  This card pulls Auto Reminders out of the chip row and gives      */
/*  it appropriate prominence: dedicated row, accent border, real     */
/*  CTA button, and at-a-glance numbers that motivate setup           */
/*  (parties ready, ₹ recoverable) or report impact (sent / paid /    */
/*  recovered, when reminders are on).                                */
/* ------------------------------------------------------------------ */
function AutoReminderHero({
  remindersOn,
  onClick,
}: {
  remindersOn: boolean;
  /** Called on click. OFF → opens catch-up modal. ON → opens settings. */
  onClick: () => void;
}) {
  const accent = remindersOn ? "var(--green)" : "var(--orange)";
  const attribution = remindersOn ? computeReminderAttribution() : null;
  // Bucket counts drive the OFF-state stats line. Memoize since the
  // buckets are a pure function of static RECEIVABLES + rules.
  const buckets = useMemo(
    () => computeCatchUpBuckets(REMINDER_AUTOMATION_DEFAULTS),
    [],
  );

  // Cadence preview: derive a clean "1d after due" / "3d before due" / etc.
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

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.3 }}
      transition={{ duration: 0.3 }}
      onClick={onClick}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onClick();
        }
      }}
      className="rounded-md p-4 cursor-pointer"
      style={{
        background: `color-mix(in srgb, ${accent} 5%, var(--bg-surface))`,
        border: "1px solid var(--border)",
        borderLeft: `3px solid ${accent}`,
      }}
    >
      <div className="flex flex-col sm:flex-row sm:items-center gap-3">
        {/* Left: icon + title row + stats line + cadence footer */}
        <div className="flex items-start gap-3 flex-1 min-w-0">
          <span
            className="flex items-center justify-center w-9 h-9 rounded-md flex-shrink-0"
            style={{
              background: `color-mix(in srgb, ${accent} 16%, transparent)`,
              color: accent,
            }}
            aria-hidden
          >
            {remindersOn ? <BellRing size={16} /> : <BellOff size={16} />}
          </span>

          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2 mb-1 flex-wrap">
              <p className="text-[13px] font-bold" style={{ color: "var(--text-1)" }}>
                Auto reminders
              </p>
              <span
                className="text-[9.5px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded"
                style={{
                  background: `color-mix(in srgb, ${accent} 18%, transparent)`,
                  color: accent,
                }}
              >
                {remindersOn ? "On" : "Off"}
              </span>
            </div>

            {/* Stats line: ON shows attribution, OFF shows the bucket
                breakdown — auto / review / locked. This is the headline
                differentiator vs Biz Analyst / Credflow: we surface the
                "we'll handle these, you confirm those, leave those alone"
                math up front, not buried in a configuration screen. */}
            {remindersOn && attribution ? (
              <p className="text-[11px]" style={{ color: "var(--text-2)" }}>
                <strong className="tabular-nums">{attribution.remindersSent}</strong>{" "}
                <span style={{ color: "var(--text-4)" }}>sent</span>
                <span style={{ color: "var(--text-4)" }}> · </span>
                <strong className="tabular-nums">{attribution.paymentsAttributed}</strong>{" "}
                <span style={{ color: "var(--text-4)" }}>paid</span>
                {attribution.remindersSent > 0 && (
                  <span style={{ color: "var(--text-4)" }}>
                    {" "}({Math.round((attribution.paymentsAttributed / attribution.remindersSent) * 100)}%)
                  </span>
                )}
                <span style={{ color: "var(--text-4)" }}> · </span>
                <strong className="tabular-nums" style={{ color: "var(--green)" }}>
                  {formatINR(attribution.amountAttributed)}
                </strong>{" "}
                <span style={{ color: "var(--text-4)" }}>recovered</span>
              </p>
            ) : (
              <p className="text-[11px]" style={{ color: "var(--text-2)" }}>
                <strong className="tabular-nums" style={{ color: "var(--green)" }}>
                  {buckets.totals.autoEnroll}
                </strong>{" "}
                <span style={{ color: "var(--text-4)" }}>ready</span>
                <span style={{ color: "var(--text-4)" }}> · </span>
                <strong className="tabular-nums" style={{ color: "var(--yellow)" }}>
                  {buckets.totals.needsReview}
                </strong>{" "}
                <span style={{ color: "var(--text-4)" }}>need review</span>
                <span style={{ color: "var(--text-4)" }}> · </span>
                <strong className="tabular-nums" style={{ color: "var(--text-3)" }}>
                  {buckets.totals.locked}
                </strong>{" "}
                <span style={{ color: "var(--text-4)" }}>locked</span>
              </p>
            )}

            <p className="text-[10px] mt-1" style={{ color: "var(--text-4)" }}>
              {remindersOn
                ? <>Email + SMS · sends {cadenceLabel}</>
                : (
                  <>
                    {formatINR(buckets.totals.collectibleAmount)} collectible ·
                    sends Email + SMS {cadenceLabel}
                  </>
                )}
            </p>
          </div>
        </div>

        {/* Right: CTA button — full-width on mobile, inline on desktop */}
        <div
          className="flex items-center justify-center gap-1.5 text-[12px] font-semibold px-4 py-2.5 rounded-md w-full sm:w-auto flex-shrink-0"
          style={{ background: accent, color: "#fff" }}
          aria-hidden
        >
          {remindersOn ? "Manage rules" : "Review & turn on"}
          <ArrowRight size={12} />
        </div>
      </div>
    </motion.div>
  );
}

/* ------------------------------------------------------------------ */
/*  MobileMetric — label/value cell used in the mobile card 4-col     */
/*  grid (Oldest Due / Avg Coll / Credit Pd / Last Pmt). Borrowed     */
/*  from Credflow's mobile UX pattern.                                */
/* ------------------------------------------------------------------ */
function MobileMetric({
  label,
  value,
  valueColor,
  muted,
}: {
  label: string;
  value: string;
  valueColor?: string;
  muted?: boolean;
}) {
  return (
    <div className="flex flex-col items-start min-w-0">
      <span
        className="text-[9px] uppercase tracking-wider truncate w-full"
        style={{ color: "var(--text-4)" }}
      >
        {label}
      </span>
      <span
        className="text-[11px] font-semibold tabular-nums truncate w-full"
        style={{
          color: muted ? "var(--text-4)" : valueColor ?? "var(--text-2)",
        }}
      >
        {value}
      </span>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Component                                                         */
/* ------------------------------------------------------------------ */
type Density = "compact" | "regular" | "relaxed";
const DENSITY_PY: Record<Density, string> = { compact: "py-1.5", regular: "py-2.5", relaxed: "py-3.5" };

/** View modes for the receivables/payables table.
 *  - detailed: current table (Outstanding · Days · Bills · LastReminded · Priority · Actions)
 *  - ageing:   pivot view (0-30 · 30-90 · 90-180 · 180+ buckets · Priority · Actions)
 *  Same data, different lens. Borrowed from Credflow's tabbed pattern. */
type ViewMode = "detailed" | "ageing";

/** Aging bucket index 0-3 mapped from oldest-unpaid-days.
 *  Tuned for Indian B2B (terms run 30-90 days). */
const AGING_BUCKETS = ["0-30", "30-90", "90-180", "180+"] as const;
function agingBucketIndex(days: number): 0 | 1 | 2 | 3 {
  if (days <= 30) return 0;
  if (days <= 90) return 1;
  if (days <= 180) return 2;
  return 3;
}
const AGING_BUCKET_COLORS: Record<number, string> = {
  0: "var(--green)",
  1: "var(--yellow)",
  2: "var(--orange)",
  3: "var(--red)",
};

export default function OutstandingsScreen() {
  const [activeTab, setActiveTab] = useState<"receivables" | "payables">("receivables");
  // Density was a Compact/Regular/Relaxed toggle in the toolbar. Removed
  // after the View toggle (Detailed/Ageing) covered the meaningful axis;
  // density was redundant chrome. Regular is locked as the default.
  const density: Density = "regular";
  // View mode — Detailed (default) vs Ageing pivot. Borrowed from
  // Credflow's tab pattern; same data, different columns.
  const [viewMode, setViewMode] = useState<ViewMode>("detailed");
  const [selected, setSelected] = useState<Set<number>>(new Set());
  const [hoveredRow, setHoveredRow] = useState<number | null>(null);
  const [whatsappTarget, setWhatsappTarget] = useState<{ name: string; amount: string; days: number } | null>(null);
  const [partyDrawer, setPartyDrawer] = useState<string | null>(null);

  // Reminder-list state (PRD Priority 2 enhancements)
  const [reminderFilter, setReminderFilter] = useState<ReminderListFilter>("all");

  // Reminder enable state — persists via localStorage so flipping ON
  // on Outstanding propagates to the Settings master toggle (same hook).
  const [remindersOn, setRemindersOn] = useAutoReminderEnabled();

  // Catch-up modal — fires when user clicks the Hero with reminders OFF.
  // The first toggle ON moment is the informed-consent gate: we show
  // every party bucketed by eligibility before any reminder fires.
  const [catchUpOpen, setCatchUpOpen] = useState(false);

  // Per-party Set auto-reminder modal target. When set to a party name,
  // the modal opens for that specific party. Credflow-style simple
  // form: see the verdict, see contacts, flip the toggle, done.
  // Complements the catch-up sweep (used for first-time bulk enroll)
  // by giving operators a fast per-party flow for everything after.
  const [autoReminderTarget, setAutoReminderTarget] = useState<string | null>(null);

  // Per-party Follow-up edit modal target. Same pattern as autoReminderTarget
  // — null = closed, set = open for that party. Overrides land in
  // localStorage via usePartyFollowUpMap and overlay the static RECEIVABLES
  // mock data so user edits survive a refresh.
  const [followUpTarget, setFollowUpTarget] = useState<string | null>(null);
  const [followUpMap, setFollowUp] = usePartyFollowUpMap();

  const goToReminderSettings = () => {
    window.dispatchEvent(new CustomEvent("riko:navigate", { detail: "settings" }));
    // SettingsScreen mounts on the next tick, so defer the sub-tab
    // dispatch so the listener is registered before the event fires.
    window.setTimeout(() => {
      window.dispatchEvent(new CustomEvent("riko:settings-tab", { detail: "reminders" }));
    }, 60);
  };

  /** Hero click handler — branches by state.
   *  OFF → open the catch-up modal so user reviews the buckets first.
   *  ON  → jump to Settings → Reminders to manage rules / templates. */
  const handleHeroClick = () => {
    if (remindersOn) {
      goToReminderSettings();
    } else {
      setCatchUpOpen(true);
    }
  };

  /** Called when the catch-up modal commits. Currently just flips the
   *  master toggle ON — per-party enrollment state would be persisted
   *  in a v2 (the prototype recomputes buckets each visit, which is
   *  deterministic given static data + rules). */
  const handleCatchUpCommit = (enrolledPartyNames: string[]) => {
    setRemindersOn(true);
    // Demo: log enrollment for visibility. Production would persist.
    if (enrolledPartyNames.length > 0) {
      console.info(
        `[auto-reminder] enrolled ${enrolledPartyNames.length} parties:`,
        enrolledPartyNames,
      );
    }
  };
  // Toast shown after clicking WA/Email/SMS in the bulk bar — pure demo.
  const [bulkToast, setBulkToast] = useState<string | null>(null);

  // Filtered receivables based on the active reminder chip
  const filteredReceivables = useMemo(() => {
    return RECEIVABLES.filter((r) => {
      if (reminderFilter === "all") return true;
      const contact = getPartyContact(r.name);
      const history = getPartyReminderHistory(r.name, 1);
      const last = history[0];
      if (reminderFilter === "never-reminded") return !last;
      if (reminderFilter === "overdue-30") return r.days > 30;
      if (reminderFilter === "no-contact") return contact.source === "none";
      if (reminderFilter === "reminded-this-week") {
        if (!last) return false;
        const ageMs = DEMO_TODAY_MS - new Date(last.sentAt).getTime();
        return ageMs < ONE_WEEK_MS;
      }
      return true;
    });
  }, [reminderFilter]);

  /** Count helpers for the filter chip counter pills. */
  const chipCount = (f: ReminderListFilter): number => {
    return RECEIVABLES.filter((r) => {
      if (f === "all") return true;
      const contact = getPartyContact(r.name);
      const history = getPartyReminderHistory(r.name, 1);
      const last = history[0];
      if (f === "never-reminded") return !last;
      if (f === "overdue-30") return r.days > 30;
      if (f === "no-contact") return contact.source === "none";
      if (f === "reminded-this-week") {
        if (!last) return false;
        const ageMs = DEMO_TODAY_MS - new Date(last.sentAt).getTime();
        return ageMs < ONE_WEEK_MS;
      }
      return true;
    }).length;
  };

  // For the bulk bar: counts of contact coverage in the current selection.
  const selectedContactStats = useMemo(() => {
    let withPhone = 0;
    let withEmail = 0;
    let noContact = 0;
    selected.forEach((i) => {
      const r = RECEIVABLES[i];
      const c = getPartyContact(r.name);
      if (c.phone) withPhone++;
      if (c.email) withEmail++;
      if (c.source === "none") noContact++;
    });
    return { withPhone, withEmail, noContact };
  }, [selected]);

  // Toast auto-hide
  const showBulkToast = (msg: string) => {
    setBulkToast(msg);
    window.setTimeout(() => setBulkToast(null), 2400);
  };

  // Payables-side selection state (separate from receivables)
  const [payableSelected, setPayableSelected] = useState<Set<number>>(new Set());
  const [payableHoveredRow, setPayableHoveredRow] = useState<number | null>(null);

  const toggleSelect = (i: number) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(i)) next.delete(i);
      else next.add(i);
      return next;
    });
  };
  const toggleAll = () => {
    if (selected.size === RECEIVABLES.length) setSelected(new Set());
    else setSelected(new Set(RECEIVABLES.map((_, i) => i)));
  };

  const togglePayableSelect = (i: number) => {
    setPayableSelected((prev) => {
      const next = new Set(prev);
      if (next.has(i)) next.delete(i);
      else next.add(i);
      return next;
    });
  };
  const togglePayableAll = () => {
    if (payableSelected.size === PAYABLES.length) setPayableSelected(new Set());
    else setPayableSelected(new Set(PAYABLES.map((_, i) => i)));
  };

  return (
    <div
      className="min-h-screen pb-24"
      style={{ background: "var(--bg-primary)" }}
    >
      <div className="max-w-3xl md:max-w-5xl mx-auto px-4 py-6 flex flex-col gap-5">
        {/* -------------------------------------------------------- */}
        {/*  1. Tab Bar                                              */}
        {/* -------------------------------------------------------- */}
        <div
          className="flex rounded-lg overflow-hidden"
          style={{
            background: "var(--bg-secondary)",
            border: "1px solid var(--border)",
          }}
        >
          {(["receivables", "payables"] as const).map((tab) => {
            const active = activeTab === tab;
            return (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className="flex-1 py-2.5 text-sm font-semibold capitalize transition-colors duration-200 relative"
                style={{
                  color: active ? "var(--green)" : "var(--text-4)",
                  background: active ? "var(--bg-surface)" : "transparent",
                }}
              >
                {tab}
                {active && (
                  <motion.div
                    layoutId="tab-underline"
                    className="absolute bottom-0 left-0 right-0 h-0.5"
                    style={{ background: "var(--green)" }}
                  />
                )}
              </button>
            );
          })}
        </div>

        {activeTab === "receivables" ? (
          <>
            {/* ========================================================== */}
            {/*  RECEIVABLES TAB                                           */}
            {/* ========================================================== */}

            {/* Summary Row */}
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.3 }}
              transition={{ duration: 0.4 }}
              className="rounded-md p-4"
              style={{
                background: "var(--bg-surface)",
                border: "1px solid var(--border)",
              }}
            >
              <div className="flex items-center justify-between mb-3">
                <div>
                  <p
                    className="text-[10px] uppercase tracking-wider font-medium mb-1"
                    style={{ color: "var(--text-4)" }}
                  >
                    Total Outstanding
                  </p>
                  <p
                    className="text-2xl font-bold"
                    style={{
                      color: "var(--text-1)",
                      fontFamily: "'Space Grotesk', sans-serif",
                    }}
                  >
                    {fmt(totalOutstanding)}
                  </p>
                </div>

                <span
                  className="text-xs font-semibold px-2.5 py-1 rounded-md"
                  style={{
                    color: "var(--yellow)",
                    background:
                      "color-mix(in srgb, var(--yellow) 12%, transparent)",
                    border:
                      "1px solid color-mix(in srgb, var(--yellow) 20%, transparent)",
                  }}
                >
                  DSO {K.dso.toFixed(0)}d
                </span>
              </div>

              <div className="flex gap-0.5 h-3 rounded-full overflow-hidden">
                {aging.map((a) => (
                  <div
                    key={a.label}
                    className="h-full transition-all duration-500"
                    style={{
                      width: `${a.pct}%`,
                      background: `color-mix(in srgb, ${a.color} 50%, transparent)`,
                    }}
                  />
                ))}
              </div>

              <div className="flex gap-3 mt-2">
                {aging.map((a) => (
                  <span
                    key={a.label}
                    className="flex items-center gap-1 text-[10px]"
                    style={{ color: "var(--text-4)" }}
                  >
                    <span
                      className="w-1.5 h-1.5 rounded-full flex-shrink-0"
                      style={{ background: a.color }}
                    />
                    {a.label} ({a.pct}%)
                  </span>
                ))}
              </div>
            </motion.div>

            {/* Desktop: Aging Analysis Cards */}
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.3 }}
              transition={{ duration: 0.4, delay: 0.1 }}
              className="hidden md:block rounded-md p-4"
              style={{ background: "var(--bg-surface)", border: "1px solid var(--border)" }}
            >
              <p className="text-xs font-semibold mb-3" style={{ color: "var(--text-2)" }}>
                Aging Analysis
              </p>
              <div className="grid grid-cols-4 gap-3">
                {agingDetailed.map((a) => (
                  <div
                    key={a.label}
                    className="rounded-md p-3"
                    style={{
                      background: "var(--bg-secondary)",
                      border: "1px solid var(--border)",
                    }}
                  >
                    <div className="flex items-center gap-1.5 mb-1">
                      <span
                        aria-hidden
                        className="inline-block flex-shrink-0"
                        style={{ width: 5, height: 5, borderRadius: 999, background: a.color }}
                      />
                      <p className="text-[10px] uppercase tracking-wider font-medium" style={{ color: "var(--text-4)" }}>
                        {a.label}
                      </p>
                    </div>
                    <p
                      className="text-lg font-semibold tabular-nums"
                      style={{
                        color: "var(--text-1)",
                        fontFamily: "'Space Grotesk', sans-serif",
                        letterSpacing: "-0.02em",
                      }}
                    >
                      {"\u20B9"}{a.amount}
                    </p>
                    <p className="text-[10px] font-medium mt-0.5 tabular-nums" style={{ color: "var(--text-3)" }}>
                      {a.pct}% of total
                    </p>
                  </div>
                ))}
              </div>
            </motion.div>

            {/* Auto-reminder hero — own row, accent border, real CTA.
                Replaces the previous chip-shaped pill that conflated
                "filter the table" with "toggle the whole feature on".
                OFF state shows the bucket breakdown (X ready, Y review,
                Z locked) — the headline differentiator vs competitors. */}
            <AutoReminderHero
              remindersOn={remindersOn}
              onClick={handleHeroClick}
            />

            {/* Reminder filter chips — slice the table below. */}
            <div className="flex items-center gap-1.5 flex-wrap">
              {REMINDER_LIST_FILTERS.map((f) => {
                const active = reminderFilter === f.id;
                const count = chipCount(f.id);
                return (
                  <button
                    key={f.id}
                    onClick={() => setReminderFilter(f.id)}
                    className="flex items-center gap-1.5 text-[11px] font-semibold px-2.5 py-1.5 rounded-full cursor-pointer transition-colors"
                    style={{
                      background: active
                        ? "var(--bg-hover)"
                        : "var(--bg-surface)",
                      color: active ? "var(--text-1)" : "var(--text-3)",
                      border: `1px solid ${active ? "var(--text-3)" : "var(--border)"}`,
                    }}
                  >
                    {f.label}
                    <span
                      className="text-[10px] tabular-nums"
                      style={{
                        color: active ? "var(--text-3)" : "var(--text-4)",
                        minWidth: 18,
                        textAlign: "center",
                      }}
                    >
                      {count}
                    </span>
                  </button>
                );
              })}
            </div>

            {/* Density toggle */}
            <div className="hidden sm:flex items-center justify-end gap-4 mb-2 flex-wrap">
              {/* View toggle — Detailed vs Ageing pivot. Same data,
                  different columns. Borrowed from Credflow's tab
                  pattern but kept inline here so it sits next to
                  the existing Density control. */}
              <div className="flex items-center gap-1">
                <span className="text-[10px] mr-1.5" style={{ color: "var(--text-4)" }}>View:</span>
                {([
                  { id: "detailed" as const, label: "Detailed Summary" },
                  { id: "ageing"   as const, label: "Ageing Summary" },
                ]).map((v) => (
                  <button
                    key={v.id}
                    onClick={() => setViewMode(v.id)}
                    className="text-[10px] px-2.5 py-0.5 rounded transition-colors"
                    style={{
                      background: viewMode === v.id ? "var(--bg-hover)" : "transparent",
                      color: viewMode === v.id ? "var(--text-1)" : "var(--text-4)",
                      border: `1px solid ${viewMode === v.id ? "var(--text-3)" : "var(--border)"}`,
                    }}
                  >
                    {v.label}
                  </button>
                ))}
              </div>

            </div>

            {/* Data Table (desktop) / Card List (mobile) */}
            <div
              className="rounded-md overflow-hidden relative"
              style={{
                background: "var(--bg-surface)",
                border: "1px solid var(--border)",
              }}
            >
              <div className="hidden sm:block overflow-x-auto">
                <table className="w-full text-xs">
                  <thead>
                    <tr
                      className="sticky top-0 z-10"
                      style={{
                        background: "var(--bg-secondary)",
                        color: "var(--text-4)",
                        borderBottom: "1px solid var(--border)",
                      }}
                    >
                      <th className="py-2.5 px-3 text-left w-8">
                        <div
                          onClick={toggleAll}
                          className="w-3.5 h-3.5 rounded border cursor-pointer flex items-center justify-center"
                          style={{
                            borderColor: selected.size > 0 ? "var(--green)" : "var(--border)",
                            background: selected.size === RECEIVABLES.length ? "var(--green)" : "transparent",
                          }}
                        >
                          {selected.size === RECEIVABLES.length && <span className="text-[8px] text-white">✓</span>}
                        </div>
                      </th>
                      <th className="py-2.5 px-3 text-left font-medium sticky left-0" style={{ background: "var(--bg-secondary)" }}>Party</th>
                      {viewMode === "detailed" ? (
                        <>
                          <th className="py-2.5 px-3 text-right font-medium">Total Due</th>
                          <th className="py-2.5 px-3 text-right font-medium">Last Payment</th>
                          <th className="py-2.5 px-3 text-right font-medium">Avg Collection</th>
                          <th className="py-2.5 px-3 text-right font-medium">Oldest Due</th>
                          <th className="py-2.5 px-3 text-left font-medium">Next Follow-Up</th>
                          <th className="py-2.5 px-3 text-right font-medium">Promises</th>
                          <th className="py-2.5 px-3 text-left font-medium">Remark</th>
                        </>
                      ) : (
                        <>
                          {AGING_BUCKETS.map((label) => (
                            <th key={label} className="py-2.5 px-3 text-right font-medium">{label}d</th>
                          ))}
                          <th className="py-2.5 px-3 text-right font-medium">Total</th>
                        </>
                      )}
                      <th className="py-2.5 px-3 text-center font-medium">Priority</th>
                      <th className="py-2.5 px-3 text-center font-medium">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredReceivables.map((r, rowIdx) => {
                      // We still need the original index into RECEIVABLES so
                      // selection (which uses original indices) works after
                      // the filter chip narrows the view.
                      const i = RECEIVABLES.indexOf(r);
                      void rowIdx;
                      const isSelected = selected.has(i);
                      const isHovered = hoveredRow === i;
                      // Effective follow-up state = static RECEIVABLES default,
                      // overlaid by any localStorage override the operator saved
                      // via the FollowUpModal. resolveFollowUp() handles the
                      // "empty string = explicitly cleared" semantic.
                      const fu = resolveFollowUp(
                        { nextFollowUpDate: r.nextFollowUpDate, remark: r.remark },
                        followUpMap[r.name],
                      );
                      return (
                      <motion.tr
                        key={r.name}
                        custom={i}
                        variants={rowVariants}
                        initial="hidden"
                        whileInView="visible"
                        viewport={{ once: true, amount: 0.1 }}
                        className="transition-colors duration-150 cursor-pointer"
                        style={{
                          background: isSelected
                            ? "color-mix(in srgb, var(--green) 8%, transparent)"
                            : isHovered
                            ? "color-mix(in srgb, var(--text-1) 4%, transparent)"
                            : "transparent",
                          borderBottom: "1px solid var(--border)",
                        }}
                        onMouseEnter={() => setHoveredRow(i)}
                        onMouseLeave={() => setHoveredRow(null)}
                        onClick={() => toggleSelect(i)}
                      >
                        <td className={`${DENSITY_PY[density]} px-3`}>
                          <div
                            className="w-3.5 h-3.5 rounded border flex items-center justify-center transition-opacity"
                            style={{
                              borderColor: isSelected ? "var(--green)" : "var(--border)",
                              background: isSelected ? "var(--green)" : "transparent",
                              opacity: isHovered || isSelected ? 1 : 0,
                            }}
                          >
                            {isSelected && <span className="text-[8px] text-white">✓</span>}
                          </div>
                        </td>

                        <td
                          className={`${DENSITY_PY[density]} px-3 font-medium truncate max-w-[180px] sticky left-0`}
                          style={{ color: "var(--text-2)", background: "inherit" }}
                        >
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setPartyDrawer(r.name);
                            }}
                            className="truncate text-left transition-colors cursor-pointer hover:underline"
                            style={{
                              color: "var(--text-2)",
                              textUnderlineOffset: 2,
                              textDecorationColor: "color-mix(in srgb, var(--green) 50%, transparent)",
                            }}
                            onMouseEnter={(e) => {
                              (e.currentTarget as HTMLElement).style.color = "var(--green)";
                            }}
                            onMouseLeave={(e) => {
                              (e.currentTarget as HTMLElement).style.color = "var(--text-2)";
                            }}
                          >
                            {r.name}
                          </button>
                        </td>

                        {viewMode === "detailed" ? (
                          <>
                            {/* Total Due */}
                            <td
                              className={`${DENSITY_PY[density]} px-3 text-right font-bold tabular-nums`}
                              style={{
                                color: "var(--text-1)",
                                fontFamily: "'Space Grotesk', sans-serif",
                              }}
                            >
                              {fmt(r.amount)}
                            </td>

                            {/* Last Payment — null when no payment history. */}
                            <td
                              className={`${DENSITY_PY[density]} px-3 text-right text-[11px] tabular-nums`}
                              style={{
                                color: r.lastPaymentDate
                                  ? "var(--text-2)"
                                  : "var(--text-4)",
                              }}
                            >
                              {r.lastPaymentDate ? formatDate(r.lastPaymentDate) : "—"}
                            </td>

                            {/* Avg Collection (days). Null = no payment history. */}
                            <td
                              className={`${DENSITY_PY[density]} px-3 text-right text-[11px] tabular-nums`}
                              style={{
                                color: r.avgPayDays != null
                                  ? "var(--text-2)"
                                  : "var(--text-4)",
                              }}
                            >
                              {r.avgPayDays != null ? `${r.avgPayDays}d` : "—"}
                            </td>

                            {/* Oldest Due (renamed from "Days"). Aging color. */}
                            <td className={`${DENSITY_PY[density]} px-3 text-right`}>
                              {(() => {
                                const ag = agingColor5(r.days);
                                return (
                                  <span
                                    className="inline-flex items-center gap-1.5 text-[11px] font-semibold tabular-nums"
                                    style={{ color: ag.fg }}
                                    title={ag.label}
                                  >
                                    <span
                                      aria-hidden
                                      className="inline-block flex-shrink-0"
                                      style={{ width: 5, height: 5, borderRadius: 999, background: ag.fg }}
                                    />
                                    {r.days.toLocaleString()}d
                                  </span>
                                );
                              })()}
                            </td>

                            {/* Next Follow-Up — manually scheduled. Click to
                                edit the date (or "+ Add" placeholder when
                                unset). FollowUpModal handles both fields
                                together so the operator can capture context
                                in one flow. */}
                            <td
                              className={`${DENSITY_PY[density]} px-3 text-left text-[11px] tabular-nums`}
                            >
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setFollowUpTarget(r.name);
                                }}
                                className="hover:underline cursor-pointer tabular-nums text-left"
                                style={{
                                  color: fu.nextFollowUpDate ? "var(--text-2)" : "var(--text-4)",
                                }}
                                title={fu.nextFollowUpDate ? "Edit follow-up" : "Schedule a follow-up date"}
                              >
                                {fu.nextFollowUpDate ? formatDate(fu.nextFollowUpDate) : "+ Add"}
                              </button>
                            </td>

                            {/* Promises to Pay — amount + date when set. */}
                            <td
                              className={`${DENSITY_PY[density]} px-3 text-right text-[11px] tabular-nums`}
                            >
                              {r.promiseAmount && r.promiseDate ? (
                                <div className="flex flex-col items-end leading-tight">
                                  <span
                                    className="font-semibold"
                                    style={{ color: "var(--blue)" }}
                                  >
                                    {fmt(r.promiseAmount)}
                                  </span>
                                  <span
                                    className="text-[10px]"
                                    style={{ color: "var(--text-4)" }}
                                  >
                                    by {formatDate(r.promiseDate, { includeYear: false })}
                                  </span>
                                </div>
                              ) : (
                                <span style={{ color: "var(--text-4)" }}>—</span>
                              )}
                            </td>

                            {/* Remark — free-text note, truncated. Click to
                                edit (opens the same FollowUpModal — single
                                editor for both fields keeps the surface small). */}
                            <td
                              className={`${DENSITY_PY[density]} px-3 text-left text-[11px]`}
                              style={{ color: "var(--text-3)", maxWidth: 160 }}
                            >
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setFollowUpTarget(r.name);
                                }}
                                className="hover:underline cursor-pointer text-left block w-full"
                                style={{
                                  color: fu.remark ? "var(--text-3)" : "var(--text-4)",
                                }}
                                title={fu.remark ?? "Add a remark"}
                              >
                                {fu.remark ? (
                                  <span className="truncate block">{fu.remark}</span>
                                ) : (
                                  "+ Add"
                                )}
                              </button>
                            </td>
                          </>
                        ) : (
                          <>
                            {/* Ageing pivot: party's full amount lands
                                in the bucket their oldest-unpaid-days
                                falls into. Other buckets show "—". */}
                            {AGING_BUCKETS.map((label, bucketIdx) => {
                              const partyBucket = agingBucketIndex(r.days);
                              const inThisBucket = bucketIdx === partyBucket;
                              return (
                                <td
                                  key={label}
                                  className={`${DENSITY_PY[density]} px-3 text-right tabular-nums`}
                                  style={{
                                    color: inThisBucket
                                      ? AGING_BUCKET_COLORS[bucketIdx]
                                      : "var(--text-4)",
                                    fontWeight: inThisBucket ? 700 : 400,
                                    fontFamily: inThisBucket
                                      ? "'Space Grotesk', sans-serif"
                                      : undefined,
                                  }}
                                >
                                  {inThisBucket ? fmt(r.amount) : "—"}
                                </td>
                              );
                            })}
                            <td
                              className={`${DENSITY_PY[density]} px-3 text-right font-bold tabular-nums`}
                              style={{
                                color: "var(--text-1)",
                                fontFamily: "'Space Grotesk', sans-serif",
                              }}
                            >
                              {fmt(r.amount)}
                            </td>
                          </>
                        )}

                        <td className={`${DENSITY_PY[density]} px-3 text-center`}>
                          <Pill color={priorityColor[r.priority]}>
                            {r.priority}
                          </Pill>
                        </td>

                        <td className={`${DENSITY_PY[density]} px-3 text-center`}>
                          <div className="inline-flex items-center gap-1.5">
                            {/* Auto-reminder config — Credflow-style
                                per-party simple flow. Always available,
                                even if no contact (modal explains why
                                it's locked). */}
                            <button
                              className="inline-flex items-center gap-1 text-[11px] font-medium px-2 py-1 rounded-md transition-all cursor-pointer"
                              style={{
                                color: "var(--text-3)",
                                background: "transparent",
                                border: "1px solid var(--border)",
                                opacity: isHovered || isSelected ? 1 : 0.5,
                              }}
                              onClick={(e) => {
                                e.stopPropagation();
                                setAutoReminderTarget(r.name);
                              }}
                              title="Configure auto-reminders for this party"
                            >
                              <BellRing size={11} />
                              Auto
                            </button>
                            {/* Manual one-off Remind — opens WAMe modal. */}
                            <button
                              className="inline-flex items-center gap-1 text-[11px] font-medium px-2 py-1 rounded-md transition-all cursor-pointer"
                              style={{
                                color: "var(--text-2)",
                                background: "transparent",
                                border: "1px solid var(--border)",
                                opacity: isHovered || isSelected ? 1 : 0.6,
                              }}
                              onMouseEnter={(e) => {
                                e.currentTarget.style.background = "var(--bg-hover)";
                                e.currentTarget.style.color = "var(--text-1)";
                              }}
                              onMouseLeave={(e) => {
                                e.currentTarget.style.background = "transparent";
                                e.currentTarget.style.color = "var(--text-2)";
                              }}
                              onClick={(e) => {
                                e.stopPropagation();
                                setWhatsappTarget({ name: r.name, amount: fmt(r.amount), days: r.days });
                              }}
                            >
                              <MessageSquareIcon size={11} />
                              Remind
                            </button>
                          </div>
                        </td>
                      </motion.tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Floating bulk action bar — matches production UX
                  (WhatsApp/Email/SMS + contact summary + no-contact warning) */}
              <AnimatePresence>
                {selected.size > 0 && (
                  <motion.div
                    initial={{ y: 30, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    exit={{ y: 30, opacity: 0 }}
                    transition={{ duration: 0.2 }}
                    className="hidden sm:flex sticky bottom-0 items-center justify-between px-4 py-3 rounded-b-xl z-20 gap-4"
                    style={{
                      background: "var(--bg-primary)",
                      borderTop: "1px solid var(--green)",
                      boxShadow: "0 -6px 18px rgba(0,0,0,0.28)",
                    }}
                  >
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-xs font-bold" style={{ color: "var(--text-1)" }}>
                        {selected.size} sel.
                      </span>
                      {selectedContactStats.noContact > 0 && (
                        <span
                          className="flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-md"
                          style={{
                            background: "color-mix(in srgb, var(--yellow) 15%, transparent)",
                            color: "var(--yellow)",
                            border: "1px solid color-mix(in srgb, var(--yellow) 30%, transparent)",
                          }}
                          title={`${selectedContactStats.noContact} parties have no contact info — will be skipped`}
                        >
                          <AlertTriangle size={10} />
                          {selectedContactStats.noContact} no contact
                        </span>
                      )}
                      <span
                        className="flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-md"
                        style={{
                          background: "color-mix(in srgb, var(--green) 12%, transparent)",
                          color: "var(--green)",
                        }}
                      >
                        <Phone size={10} />
                        {selectedContactStats.withPhone} with phone
                      </span>
                      <span
                        className="flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-md"
                        style={{
                          background: "color-mix(in srgb, var(--blue) 12%, transparent)",
                          color: "var(--blue)",
                        }}
                      >
                        <Mail size={10} />
                        {selectedContactStats.withEmail} with email
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() =>
                          showBulkToast(
                            `Opening WhatsApp for ${selectedContactStats.withPhone} parties…`
                          )
                        }
                        disabled={selectedContactStats.withPhone === 0}
                        className="flex items-center gap-1.5 text-[11px] font-semibold px-3 py-2 rounded-lg cursor-pointer disabled:opacity-40"
                        style={{
                          background: "var(--green)",
                          color: "#fff",
                        }}
                      >
                        <MessageCircle size={13} /> WhatsApp
                      </button>
                      <button
                        onClick={() =>
                          showBulkToast(
                            `Drafting emails for ${selectedContactStats.withEmail} parties…`
                          )
                        }
                        disabled={selectedContactStats.withEmail === 0}
                        className="flex items-center gap-1.5 text-[11px] font-semibold px-3 py-2 rounded-lg cursor-pointer disabled:opacity-40"
                        style={{
                          background: "var(--blue)",
                          color: "#fff",
                        }}
                      >
                        <Mail size={13} /> Email
                      </button>
                      <button
                        onClick={() =>
                          showBulkToast(
                            `Queuing SMS for ${selectedContactStats.withPhone} parties…`
                          )
                        }
                        disabled={selectedContactStats.withPhone === 0}
                        className="flex items-center gap-1.5 text-[11px] font-semibold px-3 py-2 rounded-lg cursor-pointer disabled:opacity-40"
                        style={{
                          background: "var(--text-2)",
                          color: "var(--bg-primary)",
                        }}
                      >
                        <MessageSquareIcon size={13} /> SMS
                      </button>
                      <button
                        onClick={() => setSelected(new Set())}
                        className="text-[11px] px-2 py-1.5 rounded-md cursor-pointer"
                        style={{ color: "var(--text-4)" }}
                        aria-label="Clear selection"
                      >
                        <X size={14} />
                      </button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Toast feedback */}
              <AnimatePresence>
                {bulkToast && (
                  <motion.div
                    initial={{ y: 20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    exit={{ y: 20, opacity: 0 }}
                    className="fixed bottom-24 left-1/2 -translate-x-1/2 z-50 px-4 py-2 rounded-md text-[12px] font-semibold"
                    style={{
                      background: "var(--text-1)",
                      color: "var(--bg-primary)",
                      boxShadow: "0 8px 24px rgba(0,0,0,0.3)",
                    }}
                  >
                    {bulkToast}
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Mobile card layout */}
              <div className="sm:hidden flex flex-col">
                {filteredReceivables.map((r, rowIdx) => {
                  const ag = agingColor5(r.days);
                  const contact = getPartyContact(r.name);
                  // Same merge as desktop — overlay any localStorage edits
                  // on top of the static RECEIVABLES defaults.
                  const fu = resolveFollowUp(
                    { nextFollowUpDate: r.nextFollowUpDate, remark: r.remark },
                    followUpMap[r.name],
                  );
                  return (
                    <motion.div
                      key={r.name}
                      custom={rowIdx}
                      variants={rowVariants}
                      initial="hidden"
                      whileInView="visible"
                      viewport={{ once: true, amount: 0.1 }}
                      className="p-3"
                      style={{
                        background:
                          rowIdx % 2 === 0
                            ? "var(--bg-surface)"
                            : "var(--bg-secondary)",
                        borderBottom: "1px solid var(--border)",
                      }}
                    >
                      {/* Row 1: Party name + Priority pill (Credflow-mobile pattern) */}
                      <div className="flex items-center justify-between mb-2 gap-2">
                        <button
                          type="button"
                          onClick={() => setPartyDrawer(r.name)}
                          className="text-[13px] font-semibold truncate flex-1 text-left cursor-pointer transition-colors"
                          style={{ color: "var(--text-1)" }}
                        >
                          {r.name}
                        </button>
                        <Pill color={priorityColor[r.priority]}>{r.priority}</Pill>
                      </div>

                      {/* Row 2: Total Due (prominent) + no-contact warning */}
                      <div className="flex items-baseline justify-between mb-2.5">
                        <div className="flex items-baseline gap-1.5">
                          <span
                            className="text-[10px] uppercase tracking-wider"
                            style={{ color: "var(--text-4)" }}
                          >
                            Due
                          </span>
                          <span
                            className="text-base font-bold tabular-nums"
                            style={{
                              color: "var(--text-1)",
                              fontFamily: "'Space Grotesk', sans-serif",
                            }}
                          >
                            {fmt(r.amount)}
                          </span>
                        </div>
                        {contact.source === "none" && (
                          <span
                            className="text-[9px] font-semibold px-1.5 py-0.5 rounded flex-shrink-0"
                            style={{
                              background: "color-mix(in srgb, var(--yellow) 18%, transparent)",
                              color: "var(--yellow)",
                            }}
                            title="No contact on file"
                          >
                            no contact
                          </span>
                        )}
                      </div>

                      {/* Row 3: 4-column metadata grid — Credflow's mobile pattern */}
                      <div
                        className="grid grid-cols-4 gap-1.5 mb-2.5 pb-2.5"
                        style={{ borderBottom: "1px solid var(--border)" }}
                      >
                        <MobileMetric label="Oldest Due" value={`${r.days}d`} valueColor={ag.fg} />
                        <MobileMetric
                          label="Avg Coll."
                          value={r.avgPayDays != null ? `${r.avgPayDays}d` : "—"}
                          muted={r.avgPayDays == null}
                        />
                        <MobileMetric
                          label="Credit Pd."
                          value={r.paymentTermsDays != null ? `${r.paymentTermsDays}d` : "—"}
                          muted={r.paymentTermsDays == null}
                        />
                        <MobileMetric
                          label="Last Pmt"
                          value={r.lastPaymentDate ? formatDate(r.lastPaymentDate, { includeYear: false }) : "—"}
                          muted={!r.lastPaymentDate}
                        />
                      </div>

                      {/* Row 4: Follow-up / promise / remark badges.
                          Always renders so the operator has a tappable
                          entry point even when nothing's set yet.
                          Follow-up + remark are clickable → opens
                          FollowUpModal pre-filled with current values. */}
                      <div className="flex items-center gap-1.5 mb-2.5 flex-wrap">
                        {fu.nextFollowUpDate ? (
                          <button
                            type="button"
                            onClick={() => setFollowUpTarget(r.name)}
                            className="text-[9.5px] font-semibold px-1.5 py-0.5 rounded cursor-pointer"
                            style={{
                              background: "color-mix(in srgb, var(--blue) 12%, transparent)",
                              color: "var(--blue)",
                            }}
                          >
                            Follow-up {formatDate(fu.nextFollowUpDate, { includeYear: false })}
                          </button>
                        ) : null}
                        {r.promiseAmount && r.promiseDate && (
                          <span
                            className="text-[9.5px] font-semibold px-1.5 py-0.5 rounded tabular-nums"
                            style={{
                              background: "color-mix(in srgb, var(--purple) 12%, transparent)",
                              color: "var(--purple)",
                            }}
                          >
                            Promise {fmt(r.promiseAmount)} by {formatDate(r.promiseDate, { includeYear: false })}
                          </span>
                        )}
                        {fu.remark ? (
                          <button
                            type="button"
                            onClick={() => setFollowUpTarget(r.name)}
                            className="text-[9.5px] truncate text-left cursor-pointer"
                            style={{ color: "var(--text-3)", maxWidth: 220 }}
                            title={fu.remark}
                          >
                            {fu.remark}
                          </button>
                        ) : null}
                        {!fu.nextFollowUpDate && !fu.remark && (
                          <button
                            type="button"
                            onClick={() => setFollowUpTarget(r.name)}
                            className="text-[9.5px] font-semibold px-1.5 py-0.5 rounded cursor-pointer"
                            style={{
                              background: "transparent",
                              color: "var(--text-4)",
                              border: "1px dashed var(--border)",
                            }}
                          >
                            + Follow-up
                          </button>
                        )}
                      </div>

                      {/* Row 5: Actions — Auto + Remind */}
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          className="text-[11px] font-semibold px-2.5 py-1.5 rounded-md cursor-pointer flex items-center gap-1.5"
                          style={{
                            color: "var(--text-2)",
                            background: "transparent",
                            border: "1px solid var(--border)",
                          }}
                          onClick={() => setAutoReminderTarget(r.name)}
                        >
                          <BellRing size={11} />
                          Auto
                        </button>
                        <button
                          className="text-[11px] font-semibold px-3 py-1.5 rounded-md cursor-pointer disabled:opacity-40 flex items-center gap-1.5"
                          disabled={!contact.phone}
                          style={{
                            color: "#fff",
                            background: "var(--green)",
                          }}
                          onClick={() =>
                            setWhatsappTarget({ name: r.name, amount: fmt(r.amount), days: r.days })
                          }
                        >
                          📲 Remind
                        </button>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            </div>

            <WhatsAppModal
              open={whatsappTarget !== null}
              onClose={() => setWhatsappTarget(null)}
              partyName={whatsappTarget?.name ?? ""}
              amount={whatsappTarget?.amount ?? ""}
              days={whatsappTarget?.days ?? 0}
            />

            {/* Party 360 drawer */}
            <Party360Drawer
              open={partyDrawer !== null}
              onClose={() => setPartyDrawer(null)}
              partyName={partyDrawer ?? ""}
            />

            {/* Auto-reminder catch-up modal — fires when user clicks the
                Hero with reminders OFF. Shows the 3-bucket eligibility
                breakdown and lets them confirm before any reminder fires. */}
            <AutoReminderCatchUpModal
              open={catchUpOpen}
              onClose={() => setCatchUpOpen(false)}
              onCommit={handleCatchUpCommit}
            />

            {/* Per-party Set auto-reminder modal — Credflow-style
                simple flow. Opens when the user taps the auto-reminder
                button on a specific row. ~3 fields, ~10 seconds, done. */}
            <SetAutoReminderModal
              open={autoReminderTarget !== null}
              onClose={() => setAutoReminderTarget(null)}
              partyName={autoReminderTarget ?? ""}
              onAdvanced={() => {
                setAutoReminderTarget(null);
                goToReminderSettings();
              }}
            />

            {/* Per-party Follow-up modal — date + remark editor. Opens from
                the desktop "+ Add" cells, the existing-value cells, and
                the mobile follow-up chip. Saves through usePartyFollowUpMap
                so edits survive a refresh and stay in sync across rows. */}
            {(() => {
              if (followUpTarget === null) return null;
              const target = RECEIVABLES.find((x) => x.name === followUpTarget);
              const fu = resolveFollowUp(
                {
                  nextFollowUpDate: target?.nextFollowUpDate,
                  remark: target?.remark,
                },
                followUpMap[followUpTarget],
              );
              return (
                <FollowUpModal
                  open={true}
                  onClose={() => setFollowUpTarget(null)}
                  partyName={followUpTarget}
                  initial={{
                    nextFollowUpDate: fu.nextFollowUpDate,
                    remark: fu.remark,
                  }}
                  context={{
                    amount: target?.amount,
                    oldestDays: target?.days,
                  }}
                  onSave={(next) => {
                    setFollowUp(followUpTarget, next);
                    setFollowUpTarget(null);
                  }}
                />
              );
            })()}

            {/* Bulk Contact Import lives in Settings → Reminders → Step 1.
                Outstanding's button now jumps there directly via Auto reminder. */}

            {/* Desktop: Collection Insights */}
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.3 }}
              transition={{ duration: 0.4, delay: 0.1 }}
              className="hidden md:block rounded-md p-4"
              style={{ background: "var(--bg-surface)", border: "1px solid var(--border)" }}
            >
              <p className="text-xs font-semibold mb-1" style={{ color: "var(--text-2)" }}>
                Collection Insights
              </p>
              <p className="text-[10px] mb-3" style={{ color: "var(--text-4)" }}>
                Top 3 actions to reduce DSO
              </p>
              <div className="flex flex-col gap-2">
                {collectionInsights.map((item) => (
                  <div
                    key={item.num}
                    className="flex items-start gap-3 rounded-lg px-3 py-2.5"
                    style={{
                      background: "color-mix(in srgb, var(--green) 5%, var(--bg-secondary))",
                      borderLeft: "3px solid var(--green)",
                    }}
                  >
                    <span
                      className="flex-shrink-0 w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold mt-0.5"
                      style={{
                        background: "color-mix(in srgb, var(--green) 20%, transparent)",
                        color: "var(--green)",
                      }}
                    >
                      {item.num}
                    </span>
                    <p className="text-xs leading-relaxed" style={{ color: "var(--text-2)" }}>
                      {item.text}
                    </p>
                  </div>
                ))}
              </div>
            </motion.div>

            {/* Desktop: Party Risk Matrix */}
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.3 }}
              transition={{ duration: 0.4, delay: 0.15 }}
              className="hidden md:block rounded-md p-4"
              style={{ background: "var(--bg-surface)", border: "1px solid var(--border)" }}
            >
              <p className="text-xs font-semibold mb-3" style={{ color: "var(--text-2)" }}>
                Party Risk Matrix
              </p>
              <div className="grid grid-cols-2 gap-2">
                <div
                  className="rounded-lg p-3"
                  style={{
                    background: "color-mix(in srgb, var(--yellow) 8%, var(--bg-secondary))",
                    border: "1px solid color-mix(in srgb, var(--yellow) 20%, transparent)",
                  }}
                >
                  <p className="text-[10px] font-semibold mb-1.5" style={{ color: "var(--yellow)" }}>
                    {riskMatrix.topLeft.label}
                  </p>
                  {riskMatrix.topLeft.parties.map((p) => (
                    <p key={p} className="text-xs" style={{ color: "var(--text-2)" }}>{p}</p>
                  ))}
                </div>
                <div
                  className="rounded-lg p-3"
                  style={{
                    background: "color-mix(in srgb, var(--red) 8%, var(--bg-secondary))",
                    border: "1px solid color-mix(in srgb, var(--red) 20%, transparent)",
                  }}
                >
                  <p className="text-[10px] font-semibold mb-1.5" style={{ color: "var(--red)" }}>
                    {riskMatrix.topRight.label}
                  </p>
                  {riskMatrix.topRight.parties.map((p) => (
                    <p key={p} className="text-xs" style={{ color: "var(--text-2)" }}>{p}</p>
                  ))}
                </div>
                <div
                  className="rounded-lg p-3"
                  style={{
                    background: "color-mix(in srgb, var(--green) 8%, var(--bg-secondary))",
                    border: "1px solid color-mix(in srgb, var(--green) 20%, transparent)",
                  }}
                >
                  <p className="text-[10px] font-semibold mb-1.5" style={{ color: "var(--green)" }}>
                    {riskMatrix.bottomLeft.label}
                  </p>
                  {riskMatrix.bottomLeft.parties.map((p) => (
                    <p key={p} className="text-xs" style={{ color: "var(--text-2)" }}>{p}</p>
                  ))}
                </div>
                <div
                  className="rounded-lg p-3"
                  style={{
                    background: "color-mix(in srgb, var(--orange) 8%, var(--bg-secondary))",
                    border: "1px solid color-mix(in srgb, var(--orange) 20%, transparent)",
                  }}
                >
                  <p className="text-[10px] font-semibold mb-1.5" style={{ color: "var(--orange)" }}>
                    {riskMatrix.bottomRight.label}
                  </p>
                  {riskMatrix.bottomRight.parties.map((p) => (
                    <p key={p} className="text-xs" style={{ color: "var(--text-2)" }}>{p}</p>
                  ))}
                </div>
              </div>
            </motion.div>

            {/* Warning Note */}
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.3 }}
              transition={{ duration: 0.4 }}
              className="rounded-md px-4 py-3 text-xs leading-relaxed"
              style={{
                background:
                  "color-mix(in srgb, var(--red) 10%, transparent)",
                border:
                  "1px solid color-mix(in srgb, var(--red) 20%, transparent)",
                color: "var(--red)",
              }}
            >
              <span className="font-bold">Contra-Settlement Warning:</span>{" "}
              Multiple entries for Nykaa E-Retail appear across different ledgers.
              Verify if contra-settlement has been applied. Outstanding may be
              overstated by {"\u20B9"}{fL(306667 + 292810)}L if inter-ledger netting
              is missing.
            </motion.div>
          </>
        ) : (
          <>
            {/* ========================================================== */}
            {/*  PAYABLES TAB                                              */}
            {/* ========================================================== */}

            {/* Summary stats — 4 KPIs */}
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.3 }}
              transition={{ duration: 0.4 }}
              className="rounded-md p-4"
              style={{
                background: "var(--bg-surface)",
                border: "1px solid var(--border)",
              }}
            >
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                <div>
                  <p className="text-[10px] uppercase tracking-wider font-medium mb-1" style={{ color: "var(--text-4)" }}>
                    Total Payable
                  </p>
                  <p
                    className="text-2xl font-bold"
                    style={{ color: "var(--text-1)", fontFamily: "'Space Grotesk', sans-serif" }}
                  >
                    {fmt(totalPayable)}
                  </p>
                </div>
                <div>
                  <p className="text-[10px] uppercase tracking-wider font-medium mb-1" style={{ color: "var(--text-4)" }}>
                    P1 (Urgent)
                  </p>
                  <p
                    className="text-2xl font-bold"
                    style={{ color: "var(--red)", fontFamily: "'Space Grotesk', sans-serif" }}
                  >
                    {payableP1Count}
                  </p>
                </div>
                <div>
                  <p className="text-[10px] uppercase tracking-wider font-medium mb-1" style={{ color: "var(--text-4)" }}>
                    MSME Flagged
                  </p>
                  <p
                    className="text-2xl font-bold"
                    style={{ color: "var(--orange)", fontFamily: "'Space Grotesk', sans-serif" }}
                  >
                    {payableMsmeCount}
                  </p>
                </div>
                <div>
                  <p className="text-[10px] uppercase tracking-wider font-medium mb-1" style={{ color: "var(--text-4)" }}>
                    Avg DPO
                  </p>
                  <p
                    className="text-2xl font-bold"
                    style={{ color: "var(--text-1)", fontFamily: "'Space Grotesk', sans-serif" }}
                  >
                    {payableAvgDpo}d
                  </p>
                </div>
              </div>

              {/* Aging bar */}
              <div className="flex gap-0.5 h-3 rounded-full overflow-hidden">
                {payableBuckets.map((b) => (
                  <div
                    key={b.label}
                    className="h-full transition-all duration-500"
                    style={{
                      width: `${b.pct}%`,
                      background: `color-mix(in srgb, ${b.color} 50%, transparent)`,
                    }}
                  />
                ))}
              </div>

              <div className="flex gap-3 mt-2 flex-wrap">
                {payableBuckets.map((b) => (
                  <span
                    key={b.label}
                    className="flex items-center gap-1 text-[10px]"
                    style={{ color: "var(--text-4)" }}
                  >
                    <span
                      className="w-1.5 h-1.5 rounded-full flex-shrink-0"
                      style={{ background: b.color }}
                    />
                    {b.label} ({b.pct}%)
                  </span>
                ))}
              </div>
            </motion.div>

            {/* Desktop: Aging buckets as cards */}
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.3 }}
              transition={{ duration: 0.4, delay: 0.1 }}
              className="hidden md:block rounded-md p-4"
              style={{ background: "var(--bg-surface)", border: "1px solid var(--border)" }}
            >
              <p className="text-xs font-semibold mb-3" style={{ color: "var(--text-2)" }}>
                Aging Buckets
              </p>
              <div className="grid grid-cols-3 gap-3">
                {payableBuckets.map((b) => (
                  <div
                    key={b.label}
                    className="rounded-lg p-3 relative overflow-hidden"
                    style={{
                      background: `color-mix(in srgb, ${b.color} 8%, var(--bg-secondary))`,
                      borderLeft: `3px solid ${b.color}`,
                    }}
                  >
                    <p className="text-[10px] font-medium mb-1" style={{ color: "var(--text-4)" }}>
                      {b.label}
                    </p>
                    <p
                      className="text-lg font-bold tabular-nums"
                      style={{ color: "var(--text-1)", fontFamily: "'Space Grotesk', sans-serif" }}
                    >
                      {"\u20B9"}{fL(b.amount)}L
                    </p>
                    <p className="text-[10px] font-semibold mt-0.5" style={{ color: b.color }}>
                      {b.pct}% of total
                    </p>
                  </div>
                ))}
              </div>
            </motion.div>

            {/* Payables table (desktop) / cards (mobile) */}
            <div
              className="rounded-md overflow-hidden relative"
              style={{
                background: "var(--bg-surface)",
                border: "1px solid var(--border)",
              }}
            >
              <div className="hidden sm:block overflow-x-auto">
                <table className="w-full text-xs">
                  <thead>
                    <tr
                      className="sticky top-0 z-10"
                      style={{
                        background: "var(--bg-secondary)",
                        color: "var(--text-4)",
                        borderBottom: "1px solid var(--border)",
                      }}
                    >
                      <th className="py-2.5 px-3 text-left w-8">
                        <div
                          onClick={togglePayableAll}
                          className="w-3.5 h-3.5 rounded border cursor-pointer flex items-center justify-center"
                          style={{
                            borderColor: payableSelected.size > 0 ? "var(--green)" : "var(--border)",
                            background: payableSelected.size === PAYABLES.length ? "var(--green)" : "transparent",
                          }}
                        >
                          {payableSelected.size === PAYABLES.length && <span className="text-[8px] text-white">✓</span>}
                        </div>
                      </th>
                      <th className="py-2.5 px-3 text-left font-medium sticky left-0" style={{ background: "var(--bg-secondary)" }}>Vendor</th>
                      <th className="py-2.5 px-3 text-left font-medium">GSTIN</th>
                      <th className="py-2.5 px-3 text-left font-medium">Category</th>
                      <th className="py-2.5 px-3 text-right font-medium">Amount</th>
                      <th className="py-2.5 px-3 text-right font-medium">Days</th>
                      <th className="py-2.5 px-3 text-center font-medium">MSME</th>
                      <th className="py-2.5 px-3 text-center font-medium">Priority</th>
                      <th className="py-2.5 px-3 text-center font-medium">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {PAYABLES.map((p, i) => {
                      const isSelected = payableSelected.has(i);
                      const isHovered = payableHoveredRow === i;
                      return (
                        <motion.tr
                          key={p.name}
                          custom={i}
                          variants={rowVariants}
                          initial="hidden"
                          whileInView="visible"
                          viewport={{ once: true, amount: 0.1 }}
                          className="transition-colors duration-150 cursor-pointer"
                          style={{
                            background: isSelected
                              ? "color-mix(in srgb, var(--green) 8%, transparent)"
                              : isHovered
                              ? "color-mix(in srgb, var(--text-1) 4%, transparent)"
                              : "transparent",
                            borderBottom: "1px solid var(--border)",
                          }}
                          onMouseEnter={() => setPayableHoveredRow(i)}
                          onMouseLeave={() => setPayableHoveredRow(null)}
                          onClick={() => togglePayableSelect(i)}
                        >
                          <td className={`${DENSITY_PY[density]} px-3`}>
                            <div
                              className="w-3.5 h-3.5 rounded border flex items-center justify-center transition-opacity"
                              style={{
                                borderColor: isSelected ? "var(--green)" : "var(--border)",
                                background: isSelected ? "var(--green)" : "transparent",
                                opacity: isHovered || isSelected ? 1 : 0,
                              }}
                            >
                              {isSelected && <span className="text-[8px] text-white">✓</span>}
                            </div>
                          </td>

                          <td
                            className={`${DENSITY_PY[density]} px-3 font-medium truncate max-w-[180px] sticky left-0`}
                            style={{ color: "var(--text-2)", background: "inherit" }}
                          >
                            {p.name}
                          </td>

                          <td
                            className={`${DENSITY_PY[density]} px-3 font-mono text-[10px]`}
                            style={{ color: "var(--text-4)" }}
                          >
                            {p.gstin}
                          </td>

                          <td
                            className={`${DENSITY_PY[density]} px-3`}
                            style={{ color: "var(--text-3)" }}
                          >
                            {p.category}
                          </td>

                          <td
                            className={`${DENSITY_PY[density]} px-3 text-right font-bold tabular-nums`}
                            style={{
                              color: "var(--text-1)",
                              fontFamily: "'Space Grotesk', sans-serif",
                            }}
                          >
                            {fmt(p.amount)}
                          </td>

                          <td
                            className={`${DENSITY_PY[density]} px-3 text-right font-semibold tabular-nums`}
                            style={{ color: daysColorPayable(p.days) }}
                          >
                            {p.days}
                          </td>

                          <td className={`${DENSITY_PY[density]} px-3 text-center`}>
                            {p.msme ? (
                              <span
                                className="text-[10px] font-bold px-1.5 py-0.5 rounded"
                                style={{
                                  color: "var(--red)",
                                  background: "color-mix(in srgb, var(--red) 15%, transparent)",
                                  border: "1px solid color-mix(in srgb, var(--red) 25%, transparent)",
                                }}
                                title={p.msmeDueDate ? `Due by ${p.msmeDueDate}` : undefined}
                              >
                                MSME
                              </span>
                            ) : (
                              <span className="text-[10px]" style={{ color: "var(--text-4)" }}>—</span>
                            )}
                          </td>

                          <td className={`${DENSITY_PY[density]} px-3 text-center`}>
                            <Pill color={priorityColor[p.priority]}>
                              {p.priority}
                            </Pill>
                          </td>

                          <td className={`${DENSITY_PY[density]} px-3 text-center`}>
                            <button
                              className="text-[11px] font-semibold px-2.5 py-1 rounded-md transition-all cursor-pointer"
                              style={{
                                color: "var(--green)",
                                background: "color-mix(in srgb, var(--green) 12%, transparent)",
                                opacity: isHovered || isSelected ? 1 : 0.4,
                              }}
                              onClick={(e) => e.stopPropagation()}
                            >
                              💳 Pay Now
                            </button>
                          </td>
                        </motion.tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Floating bulk action bar (payables) */}
              {payableSelected.size > 0 && (
                <motion.div
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  exit={{ y: 20, opacity: 0 }}
                  className="hidden sm:flex sticky bottom-0 items-center justify-between px-4 py-2.5 rounded-b-xl z-20"
                  style={{
                    background: "var(--bg-secondary)",
                    borderTop: "1px solid var(--green)",
                    boxShadow: "0 -4px 12px rgba(0,0,0,0.2)",
                  }}
                >
                  <span className="text-xs font-medium" style={{ color: "var(--text-2)" }}>
                    {payableSelected.size} {payableSelected.size === 1 ? "vendor" : "vendors"} selected
                  </span>
                  <div className="flex gap-2">
                    <button
                      className="text-[11px] font-semibold px-3 py-1.5 rounded-md"
                      style={{ color: "var(--green)", background: "var(--bg-hover)", border: "1px solid color-mix(in srgb, var(--green) 30%, transparent)" }}
                    >
                      💳 Pay {payableSelected.size}
                    </button>
                    <button
                      className="text-[11px] font-semibold px-3 py-1.5 rounded-md"
                      style={{ color: "var(--blue)", background: "color-mix(in srgb, var(--blue) 15%, transparent)", border: "1px solid color-mix(in srgb, var(--blue) 30%, transparent)" }}
                    >
                      📤 Export Selected
                    </button>
                    <button
                      onClick={() => setPayableSelected(new Set())}
                      className="text-[11px] px-2 py-1.5 rounded-md"
                      style={{ color: "var(--text-4)" }}
                    >
                      ✕ Clear
                    </button>
                  </div>
                </motion.div>
              )}

              {/* Mobile card layout (payables) */}
              <div className="sm:hidden flex flex-col">
                {PAYABLES.map((p, i) => (
                  <motion.div
                    key={p.name}
                    custom={i}
                    variants={rowVariants}
                    initial="hidden"
                    whileInView="visible"
                    viewport={{ once: true, amount: 0.1 }}
                    className="p-3"
                    style={{
                      background:
                        i % 2 === 0
                          ? "var(--bg-surface)"
                          : "var(--bg-secondary)",
                      borderBottom: "1px solid var(--border)",
                    }}
                  >
                    <div className="flex items-center justify-between mb-1.5 gap-2">
                      <span
                        className="text-xs font-medium truncate flex-1"
                        style={{ color: "var(--text-2)" }}
                      >
                        {p.name}
                      </span>
                      <div className="flex items-center gap-1.5 flex-shrink-0">
                        {p.msme && (
                          <span
                            className="text-[9px] font-bold px-1.5 py-0.5 rounded"
                            style={{
                              color: "var(--red)",
                              background: "color-mix(in srgb, var(--red) 15%, transparent)",
                            }}
                          >
                            MSME
                          </span>
                        )}
                        <Pill color={priorityColor[p.priority]}>{p.priority}</Pill>
                      </div>
                    </div>

                    <p className="text-[10px] mb-1.5" style={{ color: "var(--text-4)" }}>
                      {p.category} · {p.gstin}
                    </p>

                    <div className="flex items-center justify-between mb-2">
                      <span
                        className="text-sm font-bold"
                        style={{
                          color: "var(--text-1)",
                          fontFamily: "'Space Grotesk', sans-serif",
                        }}
                      >
                        {fmt(p.amount)}
                      </span>
                      <span
                        className="text-xs font-semibold"
                        style={{ color: daysColorPayable(p.days) }}
                      >
                        {p.days} days
                      </span>
                    </div>

                    <div className="flex items-center justify-between">
                      <span
                        className="text-[10px]"
                        style={{ color: "var(--text-4)" }}
                      >
                        {p.bills} bills
                      </span>
                      <button
                        className="text-[11px] font-semibold px-2.5 py-1 rounded-md cursor-pointer"
                        style={{
                          color: "var(--green)",
                          background:
                            "color-mix(in srgb, var(--green) 12%, transparent)",
                        }}
                      >
                        💳 Pay Now
                      </button>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>

            {/* MSME Alert box */}
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.3 }}
              transition={{ duration: 0.4 }}
              className="rounded-md px-4 py-3 text-xs leading-relaxed"
              style={{
                background: "color-mix(in srgb, var(--red) 12%, transparent)",
                border: "1px solid color-mix(in srgb, var(--red) 25%, transparent)",
                color: "var(--red)",
              }}
            >
              <span className="font-bold">⚠️ MSME Payment Rule Alert:</span>{" "}
              {payableMsmeCount} MSME suppliers due under 45-day rule. {"\u20B9"}{fL(payableMsmeTotal)}L must be paid
              by 28 Apr 2026 to avoid interest penalty under Section 15 of MSMED Act.
            </motion.div>
          </>
        )}
      </div>
    </div>
  );
}
