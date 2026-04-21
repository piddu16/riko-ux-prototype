"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import {
  RefreshCw,
  Download,
  FileText,
  FileJson,
  Send,
  AlertTriangle,
  ArrowRight,
  MessageCircle,
  Lock,
  Info,
  Flame,
  Clock,
  ShieldCheck,
  Percent,
  Check,
  X as XIcon,
} from "lucide-react";
import {
  GSTINS,
  GST_DATA_FRESHNESS,
  RECONCILIATION,
  PRE_FILING_TRIAGE,
  FILING_STATE,
  FILING_HISTORY,
  GST_HEALTH,
  BUILD_PHASES,
  FILING_TRACKER,
  FILING_STATUS_META,
} from "@/lib/data";
import { GstinSelector } from "@/components/ui/gst/gstin-selector";
import { OtpModal } from "@/components/ui/gst/otp-modal";

/* ------------------------------------------------------------------ */
/*  Amount helpers                                                    */
/* ------------------------------------------------------------------ */
const fL = (v: number) => `\u20B9${(Math.abs(v) / 1e5).toFixed(2)}L`;
const fRs = (v: number) =>
  `\u20B9${Math.round(Math.abs(v)).toLocaleString("en-IN")}`;

/* ------------------------------------------------------------------ */
/*  Phase status colors                                               */
/* ------------------------------------------------------------------ */
const phaseColor: Record<string, string> = {
  ready: "var(--green)",
  blocked: "var(--red)",
  future: "var(--text-4)",
};

const phaseLabel: Record<string, string> = {
  ready: "Ready",
  blocked: "Blocked",
  future: "Future",
};

/* ------------------------------------------------------------------ */
/*  Reconciliation status colors                                      */
/* ------------------------------------------------------------------ */
const reconStatusColor: Record<string, string> = {
  matched: "var(--green)",
  mismatch: "var(--yellow)",
  missing_portal: "var(--red)",
  missing_tally: "var(--blue)",
};

const reconStatusLabel: Record<string, string> = {
  matched: "Matched",
  mismatch: "Mismatch",
  missing_portal: "Missing on portal",
  missing_tally: "Missing in Tally",
};

/* ------------------------------------------------------------------ */
/*  Circular ring for health score                                    */
/* ------------------------------------------------------------------ */
/** Compliance rating chip — shows the letter grade INFINI's
 *  GST Advanced API returns for this GSTIN. No composite score
 *  calculation in Riko; we surface the upstream value verbatim. */
function ComplianceRatingBadge({
  rating,
  size = 96,
}: {
  rating: "A+" | "A" | "B" | "C" | "D" | "E";
  size?: number;
}) {
  const color =
    rating === "A+" || rating === "A" ? "var(--green)"
    : rating === "B"                   ? "var(--blue)"
    : rating === "C"                   ? "var(--yellow)"
    :                                    "var(--red)";

  return (
    <div
      className="flex-shrink-0 flex flex-col items-center justify-center rounded-full"
      style={{
        width: size,
        height: size,
        background: `color-mix(in srgb, ${color} 14%, transparent)`,
        border: `3px solid ${color}`,
      }}
    >
      <span
        className="text-4xl font-bold leading-none"
        style={{
          color,
          fontFamily: "'Space Grotesk', sans-serif",
        }}
      >
        {rating}
      </span>
      <span className="text-[8px] uppercase tracking-wider mt-1" style={{ color: "var(--text-4)" }}>
        rating
      </span>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Return Filing Tracker — Suvit-inspired 12-month compliance grid   */
/*  Each cell = one month × one return type, status icon reflects     */
/*  INFINI filing history (GSP GST Return Filing API).                */
/* ------------------------------------------------------------------ */
function FilingTrackerCard() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.2 }}
      transition={{ duration: 0.4, delay: 0.08 }}
      className="rounded-xl p-4 mb-5"
      style={{ background: "var(--bg-surface)", border: "1px solid var(--border)" }}
    >
      <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
        <div>
          <p className="text-sm font-bold" style={{ color: "var(--text-1)" }}>
            Return Filing Tracker
          </p>
          <p className="text-[11px] mt-0.5" style={{ color: "var(--text-4)" }}>
            Last 12 months · on-time, late, pending at a glance
          </p>
        </div>
        {/* Legend */}
        <div className="flex items-center gap-3 text-[10px]" style={{ color: "var(--text-3)" }}>
          {(["on-time", "late", "not-filed"] as const).map((s) => {
            const meta = FILING_STATUS_META[s];
            return (
              <span key={s} className="inline-flex items-center gap-1">
                <span
                  className="inline-flex items-center justify-center w-4 h-4 rounded text-[10px] font-bold"
                  style={{
                    background: `color-mix(in srgb, ${meta.color} 14%, transparent)`,
                    color: meta.color,
                  }}
                >
                  {meta.icon}
                </span>
                {meta.label}
              </span>
            );
          })}
        </div>
      </div>

      {/* Grid: 2 rows (GSTR-1, GSTR-3B) × 12 columns (months). On mobile it scrolls horizontally. */}
      <div className="overflow-x-auto">
        <table className="w-full text-[11px] tabular-nums" style={{ minWidth: 640 }}>
          <thead>
            <tr>
              <th
                className="px-2 py-1.5 text-left font-semibold uppercase tracking-wider sticky left-0 z-10"
                style={{ color: "var(--text-4)", background: "var(--bg-surface)" }}
              >
                Return
              </th>
              {FILING_TRACKER.map((m) => (
                <th
                  key={m.monthIso}
                  className="px-1 py-1.5 text-center font-medium"
                  style={{ color: "var(--text-4)", minWidth: 44 }}
                >
                  {m.month}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {(["gstr1", "gstr3b"] as const).map((ret) => (
              <tr key={ret} style={{ borderTop: "1px solid var(--border)" }}>
                <td
                  className="px-2 py-1.5 font-semibold sticky left-0"
                  style={{ color: "var(--text-1)", background: "var(--bg-surface)" }}
                >
                  {ret === "gstr1" ? "GSTR-1" : "GSTR-3B"}
                </td>
                {FILING_TRACKER.map((m) => {
                  const status = m[ret];
                  const meta = FILING_STATUS_META[status];
                  return (
                    <td key={m.monthIso} className="px-1 py-1.5 text-center" title={`${ret === "gstr1" ? "GSTR-1" : "GSTR-3B"} · ${m.month} · ${meta.label}`}>
                      <span
                        className="inline-flex items-center justify-center w-6 h-6 rounded text-[12px] font-bold"
                        style={{
                          background: `color-mix(in srgb, ${meta.color} 14%, transparent)`,
                          color: meta.color,
                        }}
                      >
                        {meta.icon}
                      </span>
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </motion.div>
  );
}

/* ------------------------------------------------------------------ */
/*  Triage item row                                                   */
/* ------------------------------------------------------------------ */
interface TriageItem {
  severity: string;
  icon: string;
  title: string;
  detail: string;
  fix: string;
}

function TriageCard({
  title,
  items,
}: {
  title: string;
  items: TriageItem[];
}) {
  const blockers = items.filter((i) => i.severity === "blocker").length;
  const warnings = items.filter((i) => i.severity === "warning").length;
  const borderColor = blockers > 0 ? "var(--red)" : "var(--yellow)";

  return (
    <div
      className="rounded-xl overflow-hidden"
      style={{
        background: "var(--bg-surface)",
        border: `1px solid color-mix(in srgb, ${borderColor} 35%, var(--border))`,
      }}
    >
      <div
        className="flex items-center justify-between px-4 py-3"
        style={{
          background: `color-mix(in srgb, ${borderColor} 8%, transparent)`,
          borderBottom: `1px solid color-mix(in srgb, ${borderColor} 20%, var(--border))`,
        }}
      >
        <div className="flex items-center gap-2">
          <AlertTriangle size={14} style={{ color: borderColor }} />
          <p
            className="text-sm font-bold"
            style={{ color: "var(--text-1)" }}
          >
            {title}
          </p>
        </div>
        <div className="flex items-center gap-1.5 flex-wrap">
          {blockers > 0 && (
            <span
              className="text-[10px] font-semibold px-1.5 py-0.5 rounded"
              style={{
                background: "color-mix(in srgb, var(--red) 15%, transparent)",
                color: "var(--red)",
              }}
            >
              {blockers} blocker{blockers === 1 ? "" : "s"}
            </span>
          )}
          {warnings > 0 && (
            <span
              className="text-[10px] font-semibold px-1.5 py-0.5 rounded"
              style={{
                background: "color-mix(in srgb, var(--yellow) 15%, transparent)",
                color: "var(--yellow)",
              }}
            >
              {warnings} warning{warnings === 1 ? "" : "s"}
            </span>
          )}
        </div>
      </div>

      <div className="flex flex-col">
        {items.map((item, i) => {
          const isBlocker = item.severity === "blocker";
          const color = isBlocker ? "var(--red)" : "var(--yellow)";
          return (
            <div
              key={i}
              className="flex items-start gap-3 px-4 py-3"
              style={{
                borderTop: i === 0 ? "none" : "1px solid var(--border)",
                borderLeft: `3px solid ${color}`,
                background: `color-mix(in srgb, ${color} 4%, transparent)`,
              }}
            >
              <span className="text-lg leading-none mt-0.5 flex-shrink-0">
                {item.icon}
              </span>
              <div className="flex-1 min-w-0">
                <p
                  className="text-sm font-semibold leading-snug"
                  style={{ color: "var(--text-1)" }}
                >
                  {item.title}
                </p>
                <p
                  className="text-xs mt-1 leading-relaxed"
                  style={{ color: "var(--text-3)" }}
                >
                  {item.detail}
                </p>
                <p
                  className="text-[11px] mt-1.5 font-medium inline-flex items-center gap-1"
                  style={{ color: "var(--green)" }}
                >
                  <ArrowRight size={10} />
                  {item.fix}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Stepper component                                                 */
/* ------------------------------------------------------------------ */
function Stepper({
  steps,
  currentStep,
}: {
  steps: string[];
  currentStep: number;
}) {
  return (
    <div className="flex items-center w-full overflow-x-auto -mx-1 px-1 pb-1">
      {steps.map((step, i) => {
        const isComplete = i < currentStep;
        const isCurrent = i === currentStep;
        const color = isComplete
          ? "var(--green)"
          : isCurrent
          ? "var(--green)"
          : "var(--text-4)";

        return (
          <div
            key={step}
            className="flex items-center flex-shrink-0"
            style={{ flex: i === steps.length - 1 ? "0 0 auto" : "1 1 auto" }}
          >
            <div className="flex flex-col items-center gap-1.5 flex-shrink-0">
              <div
                className="flex items-center justify-center rounded-full"
                style={{
                  width: 28,
                  height: 28,
                  background: isComplete
                    ? "var(--green)"
                    : isCurrent
                    ? "color-mix(in srgb, var(--green) 18%, transparent)"
                    : "var(--bg-secondary)",
                  border: `1.5px solid ${
                    isComplete || isCurrent ? "var(--green)" : "var(--border)"
                  }`,
                  color: isComplete
                    ? "#052E16"
                    : isCurrent
                    ? "var(--green)"
                    : "var(--text-4)",
                }}
              >
                {isComplete ? (
                  <Check size={14} strokeWidth={3} />
                ) : (
                  <span className="text-[11px] font-bold tabular-nums">
                    {i + 1}
                  </span>
                )}
              </div>
              <span
                className="text-[10px] font-medium text-center whitespace-nowrap"
                style={{ color }}
              >
                {step}
              </span>
            </div>
            {i < steps.length - 1 && (
              <div
                className="flex-1 h-[1.5px] mx-2 mt-[-14px] min-w-[20px]"
                style={{
                  background: isComplete ? "var(--green)" : "var(--border)",
                }}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Build Phase Card                                                  */
/* ------------------------------------------------------------------ */
interface PhaseCardProps {
  phase: string;
  label: string;
  status: "ready" | "blocked" | "future";
  weeks: string;
  items: string[];
  blocker?: string;
}

function PhaseCard({ phase, label, status, weeks, items, blocker }: PhaseCardProps) {
  const color = phaseColor[status];
  return (
    <div
      className="rounded-xl p-3 flex-shrink-0"
      style={{
        width: 220,
        background: "var(--bg-surface)",
        border: `1px solid color-mix(in srgb, ${color} 20%, var(--border))`,
      }}
    >
      <div className="flex items-center justify-between mb-2">
        <span
          className="text-[10px] font-bold uppercase tracking-wider"
          style={{ color: "var(--text-4)" }}
        >
          {phase}
        </span>
        <span
          className="text-[10px] font-semibold px-1.5 py-0.5 rounded"
          style={{
            background: `color-mix(in srgb, ${color} 15%, transparent)`,
            color,
          }}
        >
          {phaseLabel[status]}
        </span>
      </div>
      <p
        className="text-sm font-bold mb-1"
        style={{ color: "var(--text-1)" }}
      >
        {label}
      </p>
      <p className="text-[10px] mb-2" style={{ color: "var(--text-4)" }}>
        Weeks {weeks}
      </p>
      <ul className="flex flex-col gap-0.5">
        {items.map((it) => (
          <li
            key={it}
            className="text-[11px] leading-snug flex items-start gap-1.5"
            style={{ color: "var(--text-3)" }}
          >
            <span
              className="flex-shrink-0 mt-1.5 w-1 h-1 rounded-full"
              style={{ background: "var(--text-4)" }}
            />
            {it}
          </li>
        ))}
      </ul>
      {blocker && (
        <p
          className="text-[10px] mt-2 pt-2 leading-relaxed"
          style={{
            color: "var(--red)",
            borderTop: "1px solid color-mix(in srgb, var(--red) 18%, transparent)",
          }}
        >
          {blocker}
        </p>
      )}
    </div>
  );
}

/* ==================================================================
   GstScreen
   ================================================================== */
type TabKey = "recon" | "gstr1" | "gstr3b" | "audit";

export function GstScreen() {
  const [selectedGstin, setSelectedGstin] = useState(GSTINS[0].id);
  const [activeTab, setActiveTab] = useState<TabKey>("recon");
  const [reconFilter, setReconFilter] = useState<string>("all");
  const [historyFilter, setHistoryFilter] = useState<string>("all");
  const [otpOpen, setOtpOpen] = useState(false);
  const [otpPurpose, setOtpPurpose] = useState<string>("GST consent");

  /* --- Filter recon lines --- */
  const filteredLines = RECONCILIATION.lines.filter((l) => {
    if (reconFilter === "all") return true;
    return l.status === reconFilter;
  });

  /* --- Filter history --- */
  const filteredHistory = FILING_HISTORY.filter((h) => {
    if (historyFilter === "all") return true;
    return h.type === historyFilter;
  });

  /* --- Tab config --- */
  const TABS: Array<{ key: TabKey; label: string }> = [
    { key: "recon", label: "Reconciliation" },
    { key: "gstr1", label: "GSTR-1 Filing" },
    { key: "gstr3b", label: "GSTR-3B Filing" },
    { key: "audit", label: "Audit Log" },
  ];

  return (
    <div className="max-w-6xl mx-auto pb-10">
      {/* ================================================== */}
      {/*  1. Header                                         */}
      {/* ================================================== */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.35 }}
        className="flex flex-wrap items-center justify-between gap-3 mb-5"
      >
        <div className="min-w-0">
          <h1
            className="text-xl font-bold leading-tight"
            style={{
              color: "var(--text-1)",
              fontFamily: "'Space Grotesk', sans-serif",
            }}
          >
            GST Agent
          </h1>
          <p className="text-xs mt-1" style={{ color: "var(--text-3)" }}>
            INFINI integration &middot; 3 workflows
          </p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <GstinSelector
            selected={selectedGstin}
            onChange={setSelectedGstin}
          />
          <button
            type="button"
            onClick={() => console.log("sync with tally")}
            className="inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-full transition-colors cursor-pointer"
            style={{
              background: "transparent",
              border: "1px solid var(--border)",
              color: "var(--text-2)",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = "var(--bg-hover)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = "transparent";
            }}
          >
            <RefreshCw size={11} />
            Sync with Tally
          </button>
        </div>
      </motion.div>

      {/* ================================================== */}
      {/*  2. Build Phase Status Strip (desktop only)        */}
      {/* ================================================== */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.35, delay: 0.03 }}
        className="hidden md:block mb-5"
      >
        <div className="flex items-center gap-2 mb-2">
          <Info size={12} style={{ color: "var(--text-4)" }} />
          <p
            className="text-[10px] uppercase tracking-wider font-bold"
            style={{ color: "var(--text-4)" }}
          >
            Build Roadmap &middot; What ships now vs later
          </p>
        </div>
        <div className="flex gap-3 overflow-x-auto pb-2 -mx-1 px-1">
          {BUILD_PHASES.map((p) => (
            <PhaseCard
              key={p.phase}
              phase={p.phase}
              label={p.label}
              status={p.status}
              weeks={p.weeks}
              items={p.items}
              blocker={p.blocker}
            />
          ))}
        </div>
      </motion.div>

      {/* ================================================== */}
      {/*  3. Data Freshness Banner                          */}
      {/* ================================================== */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.35, delay: 0.05 }}
        className="rounded-xl px-4 py-2.5 mb-5 flex flex-wrap items-center justify-between gap-3"
        style={{
          background: "color-mix(in srgb, var(--blue) 8%, var(--bg-surface))",
          border: "1px solid color-mix(in srgb, var(--blue) 25%, var(--border))",
        }}
      >
        <div className="flex flex-wrap items-center gap-x-5 gap-y-1 text-xs min-w-0">
          <span
            className="inline-flex items-center gap-1.5"
            style={{ color: "var(--text-2)" }}
          >
            <span
              className="text-[10px] font-bold uppercase tracking-wider"
              style={{ color: "var(--blue)" }}
            >
              GSTR-2B
            </span>
            <span style={{ color: "var(--text-3)" }}>
              as of {GST_DATA_FRESHNESS.gstr2b.asOf} &middot; Next refresh{" "}
              {GST_DATA_FRESHNESS.gstr2b.nextRefresh}
            </span>
          </span>
          <span
            className="inline-flex items-center gap-1.5"
            style={{ color: "var(--text-3)" }}
          >
            <span
              className="w-1.5 h-1.5 rounded-full"
              style={{ background: "var(--green)" }}
            />
            Tally sync: {GST_DATA_FRESHNESS.tallySync.asOf}{" "}
            <Check size={10} style={{ color: "var(--green)" }} />
          </span>
        </div>
        <button
          type="button"
          onClick={() => console.log("refresh gst data")}
          className="inline-flex items-center gap-1 text-[11px] font-semibold cursor-pointer transition-opacity hover:opacity-80 flex-shrink-0"
          style={{ color: "var(--blue)" }}
        >
          <RefreshCw size={11} />
          Refresh
        </button>
      </motion.div>

      {/* ================================================== */}
      {/*  4. GST Health Score card                          */}
      {/* ================================================== */}
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, amount: 0.2 }}
        transition={{ duration: 0.4, delay: 0.05 }}
        className="rounded-xl p-4 mb-5"
        style={{
          background: "var(--bg-surface)",
          border: "1px solid var(--border)",
        }}
      >
        <div className="flex items-center gap-5 flex-wrap">
          <div className="flex items-center gap-4 flex-shrink-0">
            <ComplianceRatingBadge rating={GST_HEALTH.complianceRating} />
            <div>
              <p
                className="text-[10px] uppercase tracking-wider font-bold"
                style={{ color: "var(--text-4)" }}
              >
                Compliance rating
              </p>
              <p
                className="text-sm font-bold"
                style={{ color: "var(--text-1)" }}
              >
                Strong compliance
              </p>
              <p
                className="text-[11px] mt-0.5"
                style={{ color: "var(--text-3)" }}
              >
                From INFINI GST Advanced API · per GSTIN
              </p>
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-2 flex-1 min-w-0">
            {[
              {
                label: "Filing streak",
                value: `${GST_HEALTH.filingStreak} mo`,
                icon: <Flame size={12} />,
                color: "var(--orange)",
              },
              {
                label: "Avg days before due",
                value: `${GST_HEALTH.avgDaysBeforeDue}d`,
                icon: <Clock size={12} />,
                color: "var(--blue)",
              },
              {
                label: "Missed deadlines (12m)",
                value: String(GST_HEALTH.missedDeadlines12m),
                icon: <ShieldCheck size={12} />,
                color: "var(--green)",
              },
              {
                label: "ITC match rate",
                value: `${GST_HEALTH.itcMatchRate}%`,
                icon: <Percent size={12} />,
                color: "var(--purple)",
              },
            ].map((s) => (
              <div
                key={s.label}
                className="rounded-lg p-2.5"
                style={{
                  background: "var(--bg-secondary)",
                  border: "1px solid var(--border)",
                }}
              >
                <div className="flex items-center gap-1.5 mb-1">
                  <span style={{ color: s.color }}>{s.icon}</span>
                  <p
                    className="text-[10px] uppercase tracking-wider font-medium"
                    style={{ color: "var(--text-4)" }}
                  >
                    {s.label}
                  </p>
                </div>
                <p
                  className="text-base font-bold tabular-nums leading-none"
                  style={{
                    color: "var(--text-1)",
                    fontFamily: "'Space Grotesk', sans-serif",
                  }}
                >
                  {s.value}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* Callout */}
        <div
          className="flex items-start gap-2 mt-4 px-3 py-2.5 rounded-lg"
          style={{
            background: "color-mix(in srgb, var(--green) 10%, transparent)",
            border: "1px solid color-mix(in srgb, var(--green) 30%, transparent)",
          }}
        >
          <span className="text-base leading-none mt-0.5">💰</span>
          <div className="flex-1 min-w-0">
            <p
              className="text-xs font-semibold"
              style={{ color: "var(--text-1)" }}
            >
              {fL(GST_HEALTH.excessItcUnclaimed)} excess ITC available for refund
            </p>
            <p
              className="text-[11px] mt-0.5"
              style={{ color: "var(--text-3)" }}
            >
              File RFD-01 to claim — don&rsquo;t leave cash with the government.
            </p>
          </div>
          <button
            type="button"
            onClick={() => console.log("file rfd-01")}
            className="inline-flex items-center gap-1 text-[11px] font-semibold px-2.5 py-1 rounded-md cursor-pointer flex-shrink-0"
            style={{
              background: "var(--green)",
              color: "#052E16",
            }}
          >
            File RFD-01
            <ArrowRight size={10} />
          </button>
        </div>
      </motion.div>

      {/* ================================================== */}
      {/*  4.5 Return Filing Tracker (12 months × GSTR-1/3B) */}
      {/*      Pattern borrowed from Suvit's GST Dashboard   */}
      {/*      — gives CAs a one-glance read on "am I compliant */}
      {/*      this FY?". Every cell status is derivable from   */}
      {/*      INFINI's GSP GST Return Filing history.          */}
      {/* ================================================== */}
      <FilingTrackerCard />

      {/* ================================================== */}
      {/*  5. Active Workflow Tabs                           */}
      {/*      (Previously duplicated by Workflow Cards;     */}
      {/*       tabs alone are sufficient — users already    */}
      {/*       see phase-status on the Build Phase strip    */}
      {/*       at the top of the screen.)                   */}
      {/* ================================================== */}
      <div
        className="flex items-center gap-0 overflow-x-auto -mx-1 px-1 mb-4"
        style={{ borderBottom: "1px solid var(--border)" }}
      >
        {TABS.map((t) => {
          const active = t.key === activeTab;
          return (
            <button
              key={t.key}
              type="button"
              onClick={() => setActiveTab(t.key)}
              className="text-xs font-semibold px-4 py-2.5 transition-colors cursor-pointer whitespace-nowrap relative"
              style={{
                color: active ? "var(--green)" : "var(--text-3)",
                background: "transparent",
              }}
              onMouseEnter={(e) => {
                if (!active) e.currentTarget.style.color = "var(--text-1)";
              }}
              onMouseLeave={(e) => {
                if (!active) e.currentTarget.style.color = "var(--text-3)";
              }}
            >
              {t.label}
              {active && (
                <motion.div
                  layoutId="active-tab-underline"
                  className="absolute left-0 right-0 -bottom-px h-0.5 rounded-full"
                  style={{ background: "var(--green)" }}
                />
              )}
            </button>
          );
        })}
      </div>

      {/* ================================================== */}
      {/*  TAB 1: RECONCILIATION                             */}
      {/* ================================================== */}
      {activeTab === "recon" && (
        <motion.div
          key="tab-recon"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="flex flex-col gap-4"
        >
          {/* Summary row */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {[
              {
                label: "Matched",
                count: RECONCILIATION.matched,
                amount: fL(RECONCILIATION.matchedValue),
                color: "var(--green)",
                icon: <Check size={14} />,
              },
              {
                label: "Mismatch",
                count: RECONCILIATION.mismatches,
                amount: fL(RECONCILIATION.mismatchValue),
                color: "var(--yellow)",
                icon: <AlertTriangle size={14} />,
              },
              {
                label: "Missing from portal",
                count: RECONCILIATION.missingFromPortal,
                amount: `${fL(RECONCILIATION.itcAtRiskValue)} ITC at risk`,
                color: "var(--red)",
                icon: <XIcon size={14} />,
              },
              {
                label: "Missing from Tally",
                count: RECONCILIATION.missingFromTally,
                amount: "In 2B only",
                color: "var(--blue)",
                icon: <Info size={14} />,
              },
            ].map((s) => (
              <div
                key={s.label}
                className="rounded-xl p-3 overflow-hidden"
                style={{
                  background: "var(--bg-surface)",
                  border: `1px solid color-mix(in srgb, ${s.color} 25%, var(--border))`,
                }}
              >
                <div className="flex items-center justify-between mb-1.5">
                  <p
                    className="text-[10px] uppercase tracking-wider font-medium"
                    style={{ color: "var(--text-4)" }}
                  >
                    {s.label}
                  </p>
                  <span style={{ color: s.color }}>{s.icon}</span>
                </div>
                <p
                  className="text-2xl font-bold leading-none tabular-nums"
                  style={{
                    color: "var(--text-1)",
                    fontFamily: "'Space Grotesk', sans-serif",
                  }}
                >
                  {s.count}
                </p>
                <p
                  className="text-[11px] mt-1.5 tabular-nums"
                  style={{ color: s.color }}
                >
                  {s.amount}
                </p>
              </div>
            ))}
          </div>

          {/* Last run + CTA */}
          <div className="flex flex-wrap items-center justify-between gap-3">
            <p className="text-xs" style={{ color: "var(--text-3)" }}>
              Last run:{" "}
              <span
                className="font-semibold"
                style={{ color: "var(--text-1)" }}
              >
                {RECONCILIATION.lastRunAt}
              </span>{" "}
              &middot; {RECONCILIATION.totalTallyInvoices} Tally vs{" "}
              {RECONCILIATION.totalPortalInvoices} portal invoices
            </p>
            <button
              type="button"
              onClick={() => console.log("run reconciliation")}
              className="inline-flex items-center gap-1.5 text-xs font-semibold px-3.5 py-2 rounded-lg cursor-pointer transition-opacity hover:opacity-90"
              style={{
                background: "var(--green)",
                color: "#052E16",
              }}
            >
              <RefreshCw size={12} />
              Run new reconciliation
            </button>
          </div>

          {/* Filter chips */}
          <div className="flex flex-wrap gap-1.5">
            {[
              { key: "all", label: `All ${RECONCILIATION.totalTallyInvoices}` },
              { key: "matched", label: `Matched ${RECONCILIATION.matched}` },
              { key: "mismatch", label: `Mismatch ${RECONCILIATION.mismatches}` },
              {
                key: "missing_portal",
                label: `Missing from portal ${RECONCILIATION.missingFromPortal}`,
              },
              {
                key: "missing_tally",
                label: `Missing from Tally ${RECONCILIATION.missingFromTally}`,
              },
            ].map((f) => {
              const active = f.key === reconFilter;
              return (
                <button
                  key={f.key}
                  type="button"
                  onClick={() => setReconFilter(f.key)}
                  className="text-[11px] font-semibold px-2.5 py-1 rounded-full cursor-pointer transition-colors"
                  style={{
                    background: active
                      ? "var(--green)"
                      : "color-mix(in srgb, var(--text-3) 10%, transparent)",
                    color: active ? "#052E16" : "var(--text-2)",
                    border: active
                      ? "1px solid var(--green)"
                      : "1px solid var(--border)",
                  }}
                >
                  {f.label}
                </button>
              );
            })}
          </div>

          {/* Table */}
          <div
            className="rounded-xl overflow-hidden"
            style={{
              background: "var(--bg-surface)",
              border: "1px solid var(--border)",
            }}
          >
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr
                    style={{
                      background: "var(--bg-secondary)",
                      color: "var(--text-4)",
                    }}
                  >
                    <th className="text-left px-3 py-2 font-medium">
                      Supplier
                    </th>
                    <th className="text-left px-3 py-2 font-medium">GSTIN</th>
                    <th className="text-left px-3 py-2 font-medium">
                      Invoice #
                    </th>
                    <th className="text-left px-3 py-2 font-medium">Date</th>
                    <th className="text-right px-3 py-2 font-medium">
                      Tally Amt
                    </th>
                    <th className="text-right px-3 py-2 font-medium">
                      Portal Amt
                    </th>
                    <th className="text-left px-3 py-2 font-medium">Status</th>
                    <th className="text-right px-3 py-2 font-medium">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredLines.map((line) => {
                    const color = reconStatusColor[line.status];
                    return (
                      <tr
                        key={line.id}
                        style={{ borderTop: "1px solid var(--border)" }}
                        className="transition-colors hover:bg-[color-mix(in_srgb,var(--text-3)_5%,transparent)]"
                      >
                        <td
                          className="px-3 py-2.5 font-medium truncate max-w-[180px]"
                          style={{ color: "var(--text-1)" }}
                        >
                          {line.supplier}
                        </td>
                        <td
                          className="px-3 py-2.5 tabular-nums"
                          style={{
                            color: "var(--text-3)",
                            fontFamily: "'Space Grotesk', sans-serif",
                          }}
                        >
                          {line.gstin.slice(0, 6)}…{line.gstin.slice(-4)}
                        </td>
                        <td
                          className="px-3 py-2.5 tabular-nums"
                          style={{ color: "var(--text-2)" }}
                        >
                          {line.invoiceNo}
                        </td>
                        <td
                          className="px-3 py-2.5 whitespace-nowrap"
                          style={{ color: "var(--text-3)" }}
                        >
                          {line.date}
                        </td>
                        <td
                          className="px-3 py-2.5 text-right tabular-nums"
                          style={{
                            color:
                              line.tallyAmt === null
                                ? "var(--text-4)"
                                : "var(--text-1)",
                            fontFamily: "'Space Grotesk', sans-serif",
                          }}
                        >
                          {line.tallyAmt === null ? "—" : fRs(line.tallyAmt)}
                        </td>
                        <td
                          className="px-3 py-2.5 text-right tabular-nums"
                          style={{
                            color:
                              line.portalAmt === null
                                ? "var(--text-4)"
                                : "var(--text-1)",
                            fontFamily: "'Space Grotesk', sans-serif",
                          }}
                        >
                          {line.portalAmt === null
                            ? "—"
                            : fRs(line.portalAmt)}
                        </td>
                        <td className="px-3 py-2.5">
                          <span
                            className="text-[10px] font-semibold px-1.5 py-0.5 rounded whitespace-nowrap"
                            style={{
                              background: `color-mix(in srgb, ${color} 14%, transparent)`,
                              color,
                            }}
                          >
                            {reconStatusLabel[line.status]}
                          </span>
                        </td>
                        <td className="px-3 py-2.5 text-right">
                          {line.status === "missing_portal" && (
                            <button
                              type="button"
                              onClick={() =>
                                console.log("remind", line.supplier)
                              }
                              className="inline-flex items-center gap-1 text-[11px] font-semibold cursor-pointer transition-opacity hover:opacity-80"
                              style={{ color: "#25D366" }}
                            >
                              <MessageCircle size={10} />
                              Remind
                            </button>
                          )}
                          {line.status === "mismatch" && (
                            <button
                              type="button"
                              onClick={() =>
                                console.log("reconcile", line.invoiceNo)
                              }
                              className="inline-flex items-center gap-1 text-[11px] font-semibold cursor-pointer transition-opacity hover:opacity-80"
                              style={{ color: "var(--yellow)" }}
                            >
                              Reconcile
                              <ArrowRight size={10} />
                            </button>
                          )}
                          {line.status === "matched" && (
                            <span
                              className="text-[11px]"
                              style={{ color: "var(--text-4)" }}
                            >
                              —
                            </span>
                          )}
                          {line.status === "missing_tally" && (
                            <button
                              type="button"
                              onClick={() =>
                                console.log("add to tally", line.invoiceNo)
                              }
                              className="inline-flex items-center gap-1 text-[11px] font-semibold cursor-pointer transition-opacity hover:opacity-80"
                              style={{ color: "var(--blue)" }}
                            >
                              Add to Tally
                              <ArrowRight size={10} />
                            </button>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            {filteredLines.length === 0 && (
              <div
                className="px-4 py-6 text-center"
                style={{ color: "var(--text-4)" }}
              >
                <p className="text-xs">No lines match this filter.</p>
              </div>
            )}
          </div>

          {/* Bulk action */}
          <div>
            <button
              type="button"
              onClick={() =>
                console.log(
                  "bulk whatsapp to " +
                    RECONCILIATION.missingFromPortal +
                    " missing suppliers"
                )
              }
              className="inline-flex items-center gap-1.5 text-xs font-semibold px-3.5 py-2 rounded-lg cursor-pointer transition-opacity hover:opacity-90"
              style={{
                background: "#25D366",
                color: "#fff",
              }}
            >
              <MessageCircle size={12} />
              Send reminders to all {RECONCILIATION.missingFromPortal} missing suppliers
            </button>
          </div>
        </motion.div>
      )}

      {/* ================================================== */}
      {/*  TAB 2: GSTR-1 FILING                              */}
      {/* ================================================== */}
      {activeTab === "gstr1" && (
        <motion.div
          key="tab-gstr1"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="flex flex-col gap-4"
        >
          {/* Header card */}
          <div
            className="rounded-xl p-4 flex flex-wrap items-center justify-between gap-3"
            style={{
              background: "var(--bg-surface)",
              border: "1px solid var(--border)",
            }}
          >
            <div>
              <p
                className="text-[10px] uppercase tracking-wider font-bold"
                style={{ color: "var(--text-4)" }}
              >
                Outward supplies return
              </p>
              <p
                className="text-lg font-bold mt-0.5"
                style={{
                  color: "var(--text-1)",
                  fontFamily: "'Space Grotesk', sans-serif",
                }}
              >
                GSTR-1 for {FILING_STATE.gstr1.period}
              </p>
            </div>
            <span
              className="inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-full"
              style={{
                background: "color-mix(in srgb, var(--red) 15%, transparent)",
                color: "var(--red)",
                border: "1px solid color-mix(in srgb, var(--red) 30%, transparent)",
              }}
            >
              <AlertTriangle size={12} />
              Due {FILING_STATE.gstr1.dueDate} &middot; Overdue by{" "}
              {Math.abs(FILING_STATE.gstr1.daysLeft)} days
            </span>
          </div>

          {/* Progress stepper */}
          <div
            className="rounded-xl p-4"
            style={{
              background: "var(--bg-surface)",
              border: "1px solid var(--border)",
            }}
          >
            <Stepper
              steps={[
                "Generate",
                "Validate",
                "Save Draft",
                "Submit",
                "File (EVC)",
                "Verify",
              ]}
              currentStep={FILING_STATE.gstr1.currentStep}
            />
          </div>

          {/* Pre-filing triage */}
          <TriageCard
            title={`Pre-filing Triage — ${PRE_FILING_TRIAGE.gstr1.blockers} blocker${
              PRE_FILING_TRIAGE.gstr1.blockers === 1 ? "" : "s"
            }, ${PRE_FILING_TRIAGE.gstr1.warnings} warning${
              PRE_FILING_TRIAGE.gstr1.warnings === 1 ? "" : "s"
            }`}
            items={PRE_FILING_TRIAGE.gstr1.items}
          />

          {/* Summary card */}
          <div
            className="rounded-xl p-4"
            style={{
              background: "var(--bg-surface)",
              border: "1px solid var(--border)",
            }}
          >
            <p
              className="text-xs font-bold uppercase tracking-wider mb-3"
              style={{ color: "var(--text-4)" }}
            >
              Return Summary
            </p>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {[
                {
                  label: "B2B",
                  value: `${FILING_STATE.gstr1.summary.b2b.count} / ${fL(
                    FILING_STATE.gstr1.summary.b2b.value
                  )}`,
                },
                {
                  label: "B2CS",
                  value: fL(FILING_STATE.gstr1.summary.b2cs.value),
                },
                {
                  label: "B2CL",
                  value: `${FILING_STATE.gstr1.summary.b2cl.count} / ${fL(
                    FILING_STATE.gstr1.summary.b2cl.value
                  )}`,
                },
                {
                  label: "CDNR",
                  value: String(FILING_STATE.gstr1.summary.cdnr.count),
                },
                {
                  label: "HSN codes",
                  value: String(FILING_STATE.gstr1.summary.hsnSummary),
                },
                {
                  label: "CGST",
                  value: fL(FILING_STATE.gstr1.summary.cgst),
                },
                {
                  label: "SGST",
                  value: fL(FILING_STATE.gstr1.summary.sgst),
                },
                {
                  label: "IGST",
                  value: fL(FILING_STATE.gstr1.summary.igst),
                },
              ].map((s) => (
                <div
                  key={s.label}
                  className="rounded-lg p-2.5"
                  style={{ background: "var(--bg-secondary)" }}
                >
                  <p
                    className="text-[10px] uppercase tracking-wider font-medium"
                    style={{ color: "var(--text-4)" }}
                  >
                    {s.label}
                  </p>
                  <p
                    className="text-sm font-bold mt-0.5 tabular-nums"
                    style={{
                      color: "var(--text-1)",
                      fontFamily: "'Space Grotesk', sans-serif",
                    }}
                  >
                    {s.value}
                  </p>
                </div>
              ))}
            </div>
            <div
              className="mt-3 pt-3 flex items-center justify-between"
              style={{ borderTop: "1px solid var(--border)" }}
            >
              <p className="text-[11px]" style={{ color: "var(--text-4)" }}>
                Total tax
              </p>
              <p
                className="text-base font-bold tabular-nums"
                style={{
                  color: "var(--text-1)",
                  fontFamily: "'Space Grotesk', sans-serif",
                }}
              >
                {fL(FILING_STATE.gstr1.summary.totalTax)}
              </p>
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => console.log("fix in tally")}
              className="inline-flex items-center gap-1.5 text-xs font-semibold px-3.5 py-2 rounded-lg cursor-pointer transition-colors"
              style={{
                background: "transparent",
                border: "1px solid var(--border)",
                color: "var(--text-2)",
              }}
            >
              Fix blockers in Tally
            </button>
            <button
              type="button"
              disabled={PRE_FILING_TRIAGE.gstr1.blockers > 0}
              onClick={() => console.log("save draft")}
              className="inline-flex items-center gap-1.5 text-xs font-semibold px-3.5 py-2 rounded-lg transition-opacity"
              style={{
                background:
                  PRE_FILING_TRIAGE.gstr1.blockers > 0
                    ? "color-mix(in srgb, var(--green) 30%, transparent)"
                    : "var(--green)",
                color:
                  PRE_FILING_TRIAGE.gstr1.blockers > 0
                    ? "var(--text-4)"
                    : "#052E16",
                cursor:
                  PRE_FILING_TRIAGE.gstr1.blockers > 0
                    ? "not-allowed"
                    : "pointer",
                opacity: PRE_FILING_TRIAGE.gstr1.blockers > 0 ? 0.6 : 1,
              }}
            >
              <Download size={12} />
              Save Draft
            </button>
            <button
              type="button"
              onClick={() => console.log("preview json")}
              className="inline-flex items-center gap-1.5 text-xs font-semibold px-3.5 py-2 rounded-lg cursor-pointer transition-colors"
              style={{
                background: "transparent",
                border: "1px solid var(--border)",
                color: "var(--text-2)",
              }}
            >
              <FileJson size={12} />
              Preview JSON
            </button>
          </div>

          {/* Footer note */}
          <div
            className="flex items-start gap-2 px-3 py-2.5 rounded-lg"
            style={{
              background: "color-mix(in srgb, var(--yellow) 8%, transparent)",
              border: "1px solid color-mix(in srgb, var(--yellow) 25%, transparent)",
            }}
          >
            <Info
              size={12}
              style={{ color: "var(--yellow)" }}
              className="flex-shrink-0 mt-0.5"
            />
            <p
              className="text-[11px] leading-relaxed"
              style={{ color: "var(--text-3)" }}
            >
              Filing requires INFINI save/submit/file API — currently pending. UX preview only.
            </p>
          </div>
        </motion.div>
      )}

      {/* ================================================== */}
      {/*  TAB 3: GSTR-3B FILING                             */}
      {/* ================================================== */}
      {activeTab === "gstr3b" && (
        <motion.div
          key="tab-gstr3b"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="flex flex-col gap-4"
        >
          {/* Header card */}
          <div
            className="rounded-xl p-4 flex flex-wrap items-center justify-between gap-3"
            style={{
              background: "var(--bg-surface)",
              border: "1px solid var(--border)",
            }}
          >
            <div>
              <p
                className="text-[10px] uppercase tracking-wider font-bold"
                style={{ color: "var(--text-4)" }}
              >
                Summary return + tax payment
              </p>
              <p
                className="text-lg font-bold mt-0.5"
                style={{
                  color: "var(--text-1)",
                  fontFamily: "'Space Grotesk', sans-serif",
                }}
              >
                GSTR-3B for {FILING_STATE.gstr3b.period}
              </p>
            </div>
            <span
              className="inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-full"
              style={{
                background: "color-mix(in srgb, var(--yellow) 15%, transparent)",
                color: "var(--yellow)",
                border: "1px solid color-mix(in srgb, var(--yellow) 30%, transparent)",
              }}
            >
              <Clock size={12} />
              Due {FILING_STATE.gstr3b.dueDate} &middot;{" "}
              {FILING_STATE.gstr3b.daysLeft} days left
            </span>
          </div>

          {/* Progress stepper */}
          <div
            className="rounded-xl p-4"
            style={{
              background: "var(--bg-surface)",
              border: "1px solid var(--border)",
            }}
          >
            <Stepper
              steps={[
                "Generate",
                "ITC Check",
                "Challan",
                "Save",
                "Submit",
                "File",
                "Verify",
              ]}
              currentStep={FILING_STATE.gstr3b.currentStep}
            />
          </div>

          {/* Pre-filing triage */}
          <TriageCard
            title={`Pre-filing Triage — ${PRE_FILING_TRIAGE.gstr3b.blockers} blocker${
              PRE_FILING_TRIAGE.gstr3b.blockers === 1 ? "" : "s"
            }, ${PRE_FILING_TRIAGE.gstr3b.warnings} warning${
              PRE_FILING_TRIAGE.gstr3b.warnings === 1 ? "" : "s"
            }`}
            items={PRE_FILING_TRIAGE.gstr3b.items}
          />

          {/* Tax calculation card */}
          <div
            className="rounded-xl overflow-hidden"
            style={{
              background: "#fff",
              border: "1px solid #e5e7eb",
            }}
          >
            <div
              className="px-4 py-2.5"
              style={{
                background: "#F8FAFC",
                borderBottom: "1px solid #e5e7eb",
              }}
            >
              <p
                className="text-xs font-bold uppercase tracking-wider"
                style={{ color: "#64748B" }}
              >
                Tax Calculation
              </p>
            </div>
            <div className="px-4 py-3">
              <table className="w-full text-sm">
                <tbody>
                  {[
                    {
                      label: "Outward taxable supplies",
                      value: fL(FILING_STATE.gstr3b.summary.outwardTaxable),
                    },
                    {
                      label: "Output tax (CGST + SGST + IGST)",
                      value: fL(FILING_STATE.gstr3b.summary.outputTax),
                    },
                    {
                      label: "ITC available",
                      value: fL(FILING_STATE.gstr3b.summary.itcAvailable),
                    },
                    {
                      label: "ITC utilized",
                      value: fL(FILING_STATE.gstr3b.summary.itcUtilized),
                    },
                    {
                      label: "Net cash payable",
                      value: fRs(FILING_STATE.gstr3b.summary.netCashPayable),
                      bold: true,
                      color: "#ef4444",
                    },
                  ].map((row, i, arr) => (
                    <tr
                      key={row.label}
                      style={{
                        borderBottom:
                          i === arr.length - 1
                            ? "none"
                            : "1px solid #f3f4f6",
                      }}
                    >
                      <td
                        className="py-2 text-sm"
                        style={{
                          color: "#374151",
                          fontWeight: row.bold ? 600 : 400,
                        }}
                      >
                        {row.label}
                      </td>
                      <td
                        className="py-2 text-right tabular-nums"
                        style={{
                          color: row.color || "#111827",
                          fontWeight: row.bold ? 700 : 500,
                          fontFamily: "'Space Grotesk', sans-serif",
                        }}
                      >
                        {row.value}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {/* Excess ITC callout */}
              <div
                className="mt-3 rounded-lg px-3 py-2 flex items-start gap-2"
                style={{ background: "#F0FDF4", border: "1px solid #86EFAC" }}
              >
                <span className="text-base">💰</span>
                <div className="flex-1 min-w-0">
                  <p
                    className="text-xs font-semibold"
                    style={{ color: "#166534" }}
                  >
                    {fL(FILING_STATE.gstr3b.summary.itcExcess)} excess ITC available for refund
                  </p>
                  <p className="text-[11px] mt-0.5" style={{ color: "#15803D" }}>
                    File RFD-01 separately after 3B submission.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Challan + OTP row */}
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => console.log("generate challan")}
              className="inline-flex items-center gap-1.5 text-xs font-semibold px-3.5 py-2 rounded-lg cursor-pointer transition-opacity hover:opacity-90"
              style={{
                background: "var(--green)",
                color: "#052E16",
              }}
            >
              <FileText size={12} />
              Generate GSTN Challan — {fRs(
                FILING_STATE.gstr3b.summary.netCashPayable
              )}
            </button>
            <button
              type="button"
              onClick={() => {
                setOtpPurpose("File GSTR-3B");
                setOtpOpen(true);
              }}
              className="inline-flex items-center gap-1.5 text-xs font-semibold px-3.5 py-2 rounded-lg cursor-pointer transition-colors"
              style={{
                background: "transparent",
                border: "1px solid color-mix(in srgb, var(--green) 50%, transparent)",
                color: "var(--green)",
              }}
            >
              <Lock size={12} />
              Enter EVC OTP
            </button>
            <button
              type="button"
              onClick={() => console.log("preview json")}
              className="inline-flex items-center gap-1.5 text-xs font-semibold px-3.5 py-2 rounded-lg cursor-pointer transition-colors"
              style={{
                background: "transparent",
                border: "1px solid var(--border)",
                color: "var(--text-2)",
              }}
            >
              <FileJson size={12} />
              Preview JSON
            </button>
          </div>

          {/* Footer */}
          <div
            className="flex items-start gap-2 px-3 py-2.5 rounded-lg"
            style={{
              background: "color-mix(in srgb, var(--yellow) 8%, transparent)",
              border: "1px solid color-mix(in srgb, var(--yellow) 25%, transparent)",
            }}
          >
            <Info
              size={12}
              style={{ color: "var(--yellow)" }}
              className="flex-shrink-0 mt-0.5"
            />
            <p
              className="text-[11px] leading-relaxed"
              style={{ color: "var(--text-3)" }}
            >
              INFINI API pending — preview only.
            </p>
          </div>
        </motion.div>
      )}

      {/* ================================================== */}
      {/*  TAB 4: AUDIT LOG                                  */}
      {/* ================================================== */}
      {activeTab === "audit" && (
        <motion.div
          key="tab-audit"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="flex flex-col gap-4"
        >
          {/* Header */}
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <h2
                className="text-base font-bold"
                style={{ color: "var(--text-1)" }}
              >
                Filing Audit Trail
              </h2>
              <p
                className="text-xs mt-1"
                style={{ color: "var(--text-3)" }}
              >
                Immutable log for tax authority handoff
              </p>
            </div>
            <button
              type="button"
              onClick={() => console.log("export audit pdf")}
              className="inline-flex items-center gap-1.5 text-xs font-semibold px-3.5 py-2 rounded-lg cursor-pointer transition-opacity hover:opacity-90"
              style={{
                background: "var(--green)",
                color: "#052E16",
              }}
            >
              <Download size={12} />
              Export Full Audit Trail (PDF)
            </button>
          </div>

          {/* Filter chips */}
          <div className="flex flex-wrap gap-1.5">
            {[
              { key: "all", label: `All ${FILING_HISTORY.length}` },
              { key: "GSTR-1", label: "GSTR-1" },
              { key: "GSTR-3B", label: "GSTR-3B" },
            ].map((f) => {
              const active = f.key === historyFilter;
              return (
                <button
                  key={f.key}
                  type="button"
                  onClick={() => setHistoryFilter(f.key)}
                  className="text-[11px] font-semibold px-2.5 py-1 rounded-full cursor-pointer transition-colors"
                  style={{
                    background: active
                      ? "var(--green)"
                      : "color-mix(in srgb, var(--text-3) 10%, transparent)",
                    color: active ? "#052E16" : "var(--text-2)",
                    border: active
                      ? "1px solid var(--green)"
                      : "1px solid var(--border)",
                  }}
                >
                  {f.label}
                </button>
              );
            })}
          </div>

          {/* Table */}
          <div
            className="rounded-xl overflow-hidden"
            style={{
              background: "var(--bg-surface)",
              border: "1px solid var(--border)",
            }}
          >
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr
                    style={{
                      background: "var(--bg-secondary)",
                      color: "var(--text-4)",
                    }}
                  >
                    <th className="text-left px-3 py-2 font-medium">Date</th>
                    <th className="text-left px-3 py-2 font-medium">Period</th>
                    <th className="text-left px-3 py-2 font-medium">Type</th>
                    <th className="text-left px-3 py-2 font-medium">
                      ACK Number
                    </th>
                    <th className="text-left px-3 py-2 font-medium">
                      Signatory
                    </th>
                    <th className="text-left px-3 py-2 font-medium">Status</th>
                    <th className="text-right px-3 py-2 font-medium">
                      Cash/Invoices
                    </th>
                    <th className="text-right px-3 py-2 font-medium">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {filteredHistory.map((h) => (
                    <tr
                      key={h.id}
                      style={{ borderTop: "1px solid var(--border)" }}
                      className="transition-colors hover:bg-[color-mix(in_srgb,var(--text-3)_5%,transparent)]"
                    >
                      <td
                        className="px-3 py-2.5 whitespace-nowrap"
                        style={{ color: "var(--text-2)" }}
                      >
                        {h.filedAt}
                      </td>
                      <td
                        className="px-3 py-2.5 whitespace-nowrap font-medium"
                        style={{ color: "var(--text-1)" }}
                      >
                        {h.period}
                      </td>
                      <td className="px-3 py-2.5">
                        <span
                          className="text-[10px] font-bold px-1.5 py-0.5 rounded"
                          style={{
                            background:
                              h.type === "GSTR-1"
                                ? "color-mix(in srgb, var(--blue) 15%, transparent)"
                                : "color-mix(in srgb, var(--purple) 15%, transparent)",
                            color:
                              h.type === "GSTR-1"
                                ? "var(--blue)"
                                : "var(--purple)",
                          }}
                        >
                          {h.type}
                        </span>
                      </td>
                      <td
                        className="px-3 py-2.5 tabular-nums"
                        style={{
                          color: "var(--text-2)",
                          fontFamily: "'Space Grotesk', sans-serif",
                        }}
                      >
                        {h.ackNo}
                      </td>
                      <td
                        className="px-3 py-2.5 whitespace-nowrap"
                        style={{ color: "var(--text-3)" }}
                      >
                        {h.signatory}
                      </td>
                      <td className="px-3 py-2.5">
                        <span
                          className="inline-flex items-center gap-1 text-[10px] font-semibold px-1.5 py-0.5 rounded"
                          style={{
                            background:
                              "color-mix(in srgb, var(--green) 15%, transparent)",
                            color: "var(--green)",
                          }}
                        >
                          <Check size={9} />
                          Filed
                        </span>
                      </td>
                      <td
                        className="px-3 py-2.5 text-right tabular-nums whitespace-nowrap"
                        style={{
                          color: "var(--text-1)",
                          fontFamily: "'Space Grotesk', sans-serif",
                        }}
                      >
                        {h.type === "GSTR-3B" && "cashPaid" in h
                          ? h.cashPaid === 0
                            ? "ITC only"
                            : fRs(h.cashPaid as number)
                          : "invoices" in h
                          ? `${h.invoices} invoices`
                          : "—"}
                      </td>
                      <td className="px-3 py-2.5 text-right">
                        <div className="inline-flex items-center gap-2 flex-wrap justify-end">
                          <button
                            type="button"
                            onClick={() => console.log("download pdf", h.id)}
                            className="inline-flex items-center gap-1 text-[10px] font-semibold cursor-pointer transition-opacity hover:opacity-80"
                            style={{ color: "var(--green)" }}
                            title="Download PDF"
                          >
                            <Download size={10} />
                            PDF
                          </button>
                          <button
                            type="button"
                            onClick={() => console.log("view json", h.id)}
                            className="inline-flex items-center gap-1 text-[10px] font-semibold cursor-pointer transition-opacity hover:opacity-80"
                            style={{ color: "var(--blue)" }}
                            title="View JSON"
                          >
                            <FileJson size={10} />
                            JSON
                          </button>
                          <button
                            type="button"
                            onClick={() => console.log("send to ca", h.id)}
                            className="inline-flex items-center gap-1 text-[10px] font-semibold cursor-pointer transition-opacity hover:opacity-80"
                            style={{ color: "var(--text-3)" }}
                            title="Send to CA"
                          >
                            <Send size={10} />
                            CA
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {filteredHistory.length === 0 && (
              <div
                className="px-4 py-6 text-center"
                style={{ color: "var(--text-4)" }}
              >
                <p className="text-xs">No filings match this filter.</p>
              </div>
            )}
          </div>
        </motion.div>
      )}

      {/* ================================================== */}
      {/*  OTP Modal (global for all tabs)                   */}
      {/* ================================================== */}
      <OtpModal
        open={otpOpen}
        onClose={() => setOtpOpen(false)}
        purpose={otpPurpose}
        mobile="XXX-XXX-2121"
        onSubmit={(otp) =>
          console.log(`[${otpPurpose}] OTP received (not logged for security)`, otp.length, "digits")
        }
      />
    </div>
  );
}
