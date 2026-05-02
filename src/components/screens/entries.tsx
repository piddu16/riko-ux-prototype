"use client";

/* ═══════════════════════════════════════════════════════════════
   Entries — Tally write-back list view (Phase 1 UX)
   ═══════════════════════════════════════════════════════════════
   Displays all draft / pending / approved / posted / rejected
   entries with state tabs, type filter, source filter, role-aware
   actions. Clicking an entry opens EntryDetail.

   Approval queue = Pending tab, additionally filtered by what the
   current role can approve (via canApproveAmount + canEntryAction).
   ═══════════════════════════════════════════════════════════════ */

import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import {
  FileText,
  Filter,
  Upload,
  Plus,
  CheckCircle2,
  Clock,
  XCircle,
  AlertCircle,
  ChevronRight,
  Search,
  UserCircle2,
} from "lucide-react";
import { ROLES } from "@/lib/rbac";
import {
  ENTRIES,
  ENTRY_STATE_META,
  ENTRY_TYPE_LABELS,
  ENTRY_SOURCE_LABELS,
  type Entry,
  type EntryState,
  type EntryType,
  type EntrySource,
} from "@/lib/data";
import { useRbac } from "@/lib/rbac-context";
import { canApproveAmount, canEntryAction } from "@/lib/rbac";
import { EntryDetail } from "@/components/ui/entry-detail";
import { OcrUpload } from "@/components/ui/ocr-upload";

/* ── Format money compactly ─────────────────────────────────── */
function fmt(v: number): string {
  const abs = Math.abs(v);
  const sign = v < 0 ? "-" : "";
  if (abs >= 1e7) return `${sign}₹${(abs / 1e7).toFixed(2)}Cr`;
  if (abs >= 1e5) return `${sign}₹${(abs / 1e5).toFixed(1)}L`;
  if (abs >= 1e3) return `${sign}₹${(abs / 1e3).toFixed(0)}K`;
  return `${sign}₹${abs.toLocaleString("en-IN")}`;
}

const TABS: { key: EntryState | "all"; label: string; icon: typeof FileText }[] = [
  { key: "all", label: "All", icon: FileText },
  { key: "pending", label: "Pending", icon: Clock },
  { key: "draft", label: "Drafts", icon: FileText },
  { key: "posted", label: "Posted", icon: CheckCircle2 },
  { key: "rejected", label: "Rejected", icon: XCircle },
];

export function EntriesScreen() {
  const { role } = useRbac();
  const [activeTab, setActiveTab] = useState<EntryState | "all">("pending");
  const [typeFilter, setTypeFilter] = useState<EntryType | "all">("all");
  const [sourceFilter, setSourceFilter] = useState<EntrySource | "all">("all");
  const [search, setSearch] = useState("");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [showUpload, setShowUpload] = useState(false);

  /* ── Filter entries by tab + type + source + search ────────── */
  const filteredEntries = useMemo(() => {
    return ENTRIES.filter((e) => {
      if (activeTab !== "all" && e.state !== activeTab) return false;
      if (typeFilter !== "all" && e.type !== typeFilter) return false;
      if (sourceFilter !== "all" && e.source !== sourceFilter) return false;
      if (search) {
        const q = search.toLowerCase();
        const hay = `${e.partyName} ${e.particulars} ${e.voucherNumber ?? ""}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });
  }, [activeTab, typeFilter, sourceFilter, search]);

  /* ── My approval queue: pending entries I can approve ─────── */
  const myApprovalQueue = useMemo(
    () =>
      ENTRIES.filter(
        (e) =>
          e.state === "pending" &&
          canApproveAmount(role, e.amount) &&
          canEntryAction(role, e.type, "approve") &&
          // Maker ≠ Checker: can't approve your own drafts
          e.createdByRole !== role,
      ),
    [role],
  );

  /* ── Tab counts for badge display ──────────────────────────── */
  const tabCounts = useMemo(
    () => ({
      all: ENTRIES.length,
      pending: ENTRIES.filter((e) => e.state === "pending").length,
      draft: ENTRIES.filter((e) => e.state === "draft").length,
      approved: ENTRIES.filter((e) => e.state === "approved").length,
      posted: ENTRIES.filter((e) => e.state === "posted").length,
      rejected: ENTRIES.filter((e) => e.state === "rejected").length,
    }),
    [],
  );

  const selected = selectedId ? ENTRIES.find((e) => e.id === selectedId) ?? null : null;

  if (showUpload) {
    return <OcrUpload onClose={() => setShowUpload(false)} />;
  }

  if (selected) {
    return (
      <EntryDetail
        entry={selected}
        onBack={() => setSelectedId(null)}
      />
    );
  }

  return (
    <div className="max-w-5xl mx-auto space-y-5">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-3">
        <div>
          <h1 className="text-xl md:text-2xl font-bold" style={{ color: "var(--text-1)" }}>
            Entries
          </h1>
          <p className="text-[13px] mt-0.5" style={{ color: "var(--text-3)" }}>
            Everything flowing from Riko to Tally. Draft → approve → post.
          </p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={() => setShowUpload(true)}
            className="flex items-center gap-1.5 text-xs font-semibold px-3 py-2 rounded-lg cursor-pointer transition-opacity hover:opacity-90"
            style={{
              background: "var(--bg-surface)",
              border: "1px solid var(--border)",
              color: "var(--text-2)",
            }}
          >
            <Upload size={14} />
            Upload bill (OCR)
          </button>
          <button
            className="flex items-center gap-1.5 text-xs font-semibold px-3 py-2 rounded-lg cursor-pointer transition-opacity hover:opacity-90"
            style={{ background: "var(--green)", color: "white" }}
          >
            <Plus size={14} />
            New entry
          </button>
        </div>
      </div>

      {/* Approval queue callout for approvers */}
      {myApprovalQueue.length > 0 && activeTab !== "pending" && (
        <motion.button
          initial={{ opacity: 0, y: -4 }}
          animate={{ opacity: 1, y: 0 }}
          onClick={() => setActiveTab("pending")}
          className="w-full flex items-center gap-3 px-4 py-3 rounded-md text-left cursor-pointer transition-opacity hover:opacity-90"
          style={{
            background: "color-mix(in srgb, var(--yellow) 10%, transparent)",
            border: "1px solid color-mix(in srgb, var(--yellow) 30%, transparent)",
          }}
        >
          <AlertCircle size={18} style={{ color: "var(--yellow)", flexShrink: 0 }} />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold" style={{ color: "var(--text-1)" }}>
              {myApprovalQueue.length} {myApprovalQueue.length === 1 ? "entry" : "entries"} awaiting your approval
            </p>
            <p className="text-[11px]" style={{ color: "var(--text-3)" }}>
              Review and approve or reject — entries below ₹{(myApprovalQueue.reduce((s, e) => s + e.amount, 0) / 1e5).toFixed(1)}L total
            </p>
          </div>
          <ChevronRight size={16} style={{ color: "var(--yellow)" }} />
        </motion.button>
      )}

      {/* State tabs */}
      <div
        className="flex items-center gap-1 overflow-x-auto -mx-4 px-4 pb-1"
        style={{ borderBottom: "1px solid var(--border)" }}
      >
        {TABS.map((t) => {
          const active = activeTab === t.key;
          const count = tabCounts[t.key];
          const Icon = t.icon;
          return (
            <button
              key={t.key}
              onClick={() => setActiveTab(t.key)}
              className="flex items-center gap-1.5 text-xs font-semibold px-3 py-2.5 whitespace-nowrap cursor-pointer transition-colors"
              style={{
                color: active ? "var(--text-1)" : "var(--text-3)",
                borderBottom: active ? "2px solid var(--green)" : "2px solid transparent",
                marginBottom: "-1px",
              }}
            >
              <Icon size={13} />
              <span>{t.label}</span>
              {count > 0 && (
                <span
                  className="text-[10px] font-bold px-1.5 py-0.5 rounded-full tabular-nums"
                  style={{
                    background: active
                      ? "var(--bg-hover)"
                      : "var(--bg-hover)",
                    color: active ? "var(--green)" : "var(--text-4)",
                  }}
                >
                  {count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Filter row */}
      <div className="flex items-center gap-2 flex-wrap">
        <div
          className="flex items-center gap-2 flex-1 min-w-[200px] px-3 py-2 rounded-lg"
          style={{ background: "var(--bg-surface)", border: "1px solid var(--border)" }}
        >
          <Search size={13} style={{ color: "var(--text-4)" }} />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by party, particulars, voucher number..."
            className="flex-1 bg-transparent text-[12px] outline-none"
            style={{ color: "var(--text-1)" }}
          />
        </div>
        <select
          value={typeFilter}
          onChange={(e) => setTypeFilter(e.target.value as EntryType | "all")}
          className="text-[12px] font-medium px-3 py-2 rounded-lg cursor-pointer"
          style={{
            background: "var(--bg-surface)",
            border: "1px solid var(--border)",
            color: "var(--text-2)",
          }}
        >
          <option value="all">All types</option>
          {Object.entries(ENTRY_TYPE_LABELS).map(([k, v]) => (
            <option key={k} value={k}>{v}</option>
          ))}
        </select>
        <select
          value={sourceFilter}
          onChange={(e) => setSourceFilter(e.target.value as EntrySource | "all")}
          className="text-[12px] font-medium px-3 py-2 rounded-lg cursor-pointer"
          style={{
            background: "var(--bg-surface)",
            border: "1px solid var(--border)",
            color: "var(--text-2)",
          }}
        >
          <option value="all">All sources</option>
          {Object.entries(ENTRY_SOURCE_LABELS).map(([k, v]) => (
            <option key={k} value={k}>{v}</option>
          ))}
        </select>
        <span
          className="flex items-center gap-1.5 text-[11px] font-medium px-2.5 py-1.5 rounded-md"
          style={{ color: "var(--text-4)" }}
        >
          <Filter size={12} />
          {filteredEntries.length} {filteredEntries.length === 1 ? "entry" : "entries"}
        </span>
      </div>

      {/* Entries list */}
      <div className="space-y-2">
        {filteredEntries.length === 0 ? (
          <div
            className="rounded-md p-8 text-center"
            style={{ background: "var(--bg-surface)", border: "1px solid var(--border)" }}
          >
            <FileText size={24} className="mx-auto mb-2" style={{ color: "var(--text-4)" }} />
            <p className="text-sm font-medium" style={{ color: "var(--text-2)" }}>
              No entries match your filters
            </p>
            <p className="text-[11px] mt-1" style={{ color: "var(--text-4)" }}>
              Try clearing filters or changing the tab.
            </p>
          </div>
        ) : (
          filteredEntries.map((entry) => (
            <EntryRow
              key={entry.id}
              entry={entry}
              onClick={() => setSelectedId(entry.id)}
              canApprove={
                entry.state === "pending" &&
                canApproveAmount(role, entry.amount) &&
                canEntryAction(role, entry.type, "approve") &&
                entry.createdByRole !== role
              }
            />
          ))
        )}
      </div>
    </div>
  );
}

/* ── Single entry row — click to drill into EntryDetail ────── */
/** Resolves the current actor + verb for an entry — i.e. the person whose
 *  action moved it to its current state. The drafter for draft/pending,
 *  the poster for posted, the rejector for rejected, the approver for
 *  approved. Falls back to the creator. */
function actorForEntry(entry: Entry): { verb: string; actor: string; roleName: string } {
  const roleName = (role: string) => ROLES[role as keyof typeof ROLES]?.name ?? role;
  if (entry.state === "posted" && entry.postedBy) {
    const evt = entry.history.find((h) => h.action.toLowerCase().includes("post"));
    return { verb: "Posted by", actor: entry.postedBy, roleName: roleName(evt?.actorRole ?? "accounts") };
  }
  if (entry.state === "rejected" && entry.rejectedBy) {
    const evt = entry.history.find((h) => h.action.toLowerCase().includes("reject"));
    return { verb: "Rejected by", actor: entry.rejectedBy, roleName: roleName(evt?.actorRole ?? "accounts") };
  }
  if (entry.state === "approved") {
    const evt = entry.history.find((h) => h.action.toLowerCase().includes("approv"));
    if (evt) return { verb: "Approved by", actor: evt.actor, roleName: roleName(evt.actorRole) };
  }
  return { verb: "Drafted by", actor: entry.createdBy, roleName: roleName(entry.createdByRole) };
}

function EntryRow({
  entry,
  onClick,
  canApprove,
}: {
  entry: Entry;
  onClick: () => void;
  canApprove: boolean;
}) {
  const stateMeta = ENTRY_STATE_META[entry.state];
  const typeLabel = ENTRY_TYPE_LABELS[entry.type];
  const sourceLabel = ENTRY_SOURCE_LABELS[entry.source];
  const actor = actorForEntry(entry);

  // Display date in compact form
  const displayDate = new Date(entry.date).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });

  return (
    <motion.button
      initial={{ opacity: 0, y: 4 }}
      animate={{ opacity: 1, y: 0 }}
      onClick={onClick}
      className="w-full flex items-center gap-3 px-4 py-3 rounded-md text-left cursor-pointer transition-colors hover:opacity-90"
      style={{
        background: "var(--bg-surface)",
        border: `1px solid ${canApprove ? "color-mix(in srgb, var(--yellow) 30%, transparent)" : "var(--border)"}`,
        borderLeft: `3px solid ${stateMeta.color}`,
      }}
    >
      {/* Left: type + party */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap mb-0.5">
          <span
            className="text-[10px] font-bold uppercase tracking-wider"
            style={{ color: "var(--text-4)" }}
          >
            {typeLabel}
          </span>
          <span style={{ color: "var(--text-4)" }}>·</span>
          <span className="text-[10px]" style={{ color: "var(--text-4)" }}>
            {sourceLabel}
          </span>
          <span style={{ color: "var(--text-4)" }}>·</span>
          <span className="text-[10px]" style={{ color: "var(--text-4)" }}>
            {displayDate}
          </span>
          {entry.voucherNumber && (
            <>
              <span style={{ color: "var(--text-4)" }}>·</span>
              <span
                className="text-[10px] font-mono font-semibold"
                style={{ color: "var(--green)" }}
              >
                {entry.voucherNumber}
              </span>
            </>
          )}
        </div>
        <p
          className="text-sm font-semibold truncate"
          style={{ color: "var(--text-1)" }}
        >
          {entry.partyName}
        </p>
        <p
          className="text-[11px] truncate"
          style={{ color: "var(--text-3)" }}
        >
          {entry.particulars}
        </p>
        <p
          className="text-[10px] truncate mt-0.5 flex items-center gap-1"
          style={{ color: "var(--text-4)" }}
        >
          <UserCircle2 size={10} className="flex-shrink-0 opacity-70" />
          {actor.verb} {actor.actor}
          <span style={{ opacity: 0.6 }}>·</span>
          <span>{actor.roleName}</span>
        </p>
      </div>

      {/* Middle: amount */}
      <div className="flex-shrink-0 text-right min-w-[80px]">
        <p
          className="text-sm font-bold tabular-nums"
          style={{
            color: entry.type === "sales" || entry.type === "receipt" ? "var(--green)" : "var(--text-1)",
            fontFamily: "'Space Grotesk', sans-serif",
          }}
        >
          {fmt(entry.amount)}
        </p>
      </div>

      {/* Right: state chip + chevron */}
      <div className="flex-shrink-0 flex items-center gap-2">
        <span
          className="text-[10px] font-semibold px-2 py-1 rounded-md whitespace-nowrap"
          style={{ background: stateMeta.bgColor, color: stateMeta.color }}
        >
          {stateMeta.label}
        </span>
        {canApprove && (
          <span
            className="text-[10px] font-bold px-2 py-1 rounded-md whitespace-nowrap"
            style={{
              background: "var(--yellow)",
              color: "white",
            }}
          >
            REVIEW
          </span>
        )}
        <ChevronRight size={14} style={{ color: "var(--text-4)" }} />
      </div>
    </motion.button>
  );
}
