"use client";

import { useState, useMemo } from "react";
import { motion } from "framer-motion";
import {
  AlertTriangle,
  IndianRupee,
  TrendingUp,
  TrendingDown,
  Activity,
  MessageCircle,
  Send,
  FileSpreadsheet,
  ArrowRight,
  ArrowUpDown,
  Search,
  LayoutGrid,
  List,
  CalendarDays,
  Phone,
  Download,
  X,
  Clock,
  Filter as FilterIcon,
  Calendar as CalendarIcon,
} from "lucide-react";
import {
  CLIENTS,
  CA_FIRM,
  CA_FIRM_METRICS_THIS_MONTH,
  COMPLIANCE_GRADE_COLOR,
  CHURN_RISK_META,
  computeWorkload,
  computeIndustryMix,
  computeComplianceCalendar,
  getTeamMember,
  type Client,
} from "@/lib/data";
import { useCompany, clientToCompany } from "@/lib/company-context";

/* ══════════════════════════════════════════════════════════════════
   ClientsScreen — CA Portfolio Control Center

   Full redesign per CA-workflow review. Desktop layout:

   ┌──────────────────────────────────────────────────┐
   │ Header (firm name + this-month snapshot tiles)   │
   ├──────────────────────────────────────────────────┤
   │ Compliance calendar strip (next 21 days)         │
   ├─────────────────────────────┬────────────────────┤
   │ View toggle · search · etc  │ Workload sidebar   │
   │ Cards / Table / Calendar    │ Industry mix       │
   │                             │                    │
   └─────────────────────────────┴────────────────────┘
   Bulk action bar · sticky
   ══════════════════════════════════════════════════════════════════ */

type FilterKey = "all" | "attention" | "mis" | "healthy" | "mine" | "churn";
type SortKey = "status" | "health" | "revenue" | "activity" | "compliance" | "name";
type ViewMode = "cards" | "table" | "calendar";

const statusColor: Record<string, string> = {
  critical: "var(--red)",
  warning: "var(--yellow)",
  healthy: "var(--green)",
};

const statusLabel: Record<string, string> = {
  critical: "Critical",
  warning: "Needs attention",
  healthy: "Healthy",
};

const misColor: Record<string, string> = {
  Pending: "var(--red)",
  "In progress": "var(--yellow)",
  Delivered: "var(--green)",
};

const priorityColor: Record<string, string> = {
  urgent: "var(--red)",
  high: "var(--yellow)",
  medium: "var(--blue)",
};

const STATUS_WEIGHT: Record<string, number> = {
  critical: 0,
  warning: 1,
  healthy: 2,
};

const COMPLIANCE_GRADE_WEIGHT: Record<string, number> = {
  "A+": 0, A: 1, B: 2, C: 3, D: 4,
};

export function ClientsScreen() {
  const [filter, setFilter] = useState<FilterKey>("all");
  const [sortBy, setSortBy] = useState<SortKey>("status");
  const [view, setView] = useState<ViewMode>("cards");
  const [search, setSearch] = useState("");
  const [assigneeFilter, setAssigneeFilter] = useState<string>("all");
  const [industryFilter, setIndustryFilter] = useState<string>("all");
  const [selected, setSelected] = useState<Set<number>>(new Set());
  const { setCurrent } = useCompany();

  const metrics = CA_FIRM_METRICS_THIS_MONTH;
  const calendar = useMemo(() => computeComplianceCalendar(), []);
  const workload = useMemo(() => computeWorkload(), []);
  const industryMix = useMemo(() => computeIndustryMix(), []);

  /* ── Summary counts (used by filter chips) ── */
  const misPendingCount = CLIENTS.filter((c) => c.misStatus === "Pending").length;
  const churnRiskCount = CLIENTS.filter((c) => c.churnRisk === "medium" || c.churnRisk === "high").length;

  const industries = useMemo(() => {
    const s = new Set(CLIENTS.map((c) => c.industryGroup));
    return ["all", ...[...s].sort()];
  }, []);

  /* ── Filter + sort pipeline ── */
  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    const base = CLIENTS.filter((c) => {
      if (q) {
        const hay = `${c.name} ${c.industry} ${c.location} ${c.tags.join(" ")}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      if (industryFilter !== "all" && c.industryGroup !== industryFilter) return false;
      if (assigneeFilter !== "all" && c.assignedTo !== assigneeFilter) return false;
      if (filter === "attention") return c.status === "critical" || c.status === "warning";
      if (filter === "mis") return c.misStatus === "Pending";
      if (filter === "healthy") return c.status === "healthy";
      if (filter === "mine") return c.assignedTo === "u-rajesh"; // demo: admin acts as partner
      if (filter === "churn") return c.churnRisk === "medium" || c.churnRisk === "high";
      return true;
    });

    const sorted = [...base];
    switch (sortBy) {
      case "health":      sorted.sort((a, b) => b.healthScore - a.healthScore); break;
      case "revenue":     sorted.sort((a, b) => b.revenueValue - a.revenueValue); break;
      case "compliance":  sorted.sort((a, b) => (COMPLIANCE_GRADE_WEIGHT[a.complianceGrade] ?? 5) - (COMPLIANCE_GRADE_WEIGHT[b.complianceGrade] ?? 5)); break;
      case "name":        sorted.sort((a, b) => a.name.localeCompare(b.name)); break;
      case "activity":    sorted.sort((a, b) => parseSyncMinutes(a.lastSync) - parseSyncMinutes(b.lastSync)); break;
      case "status":
      default:            sorted.sort((a, b) => (STATUS_WEIGHT[a.status] ?? 3) - (STATUS_WEIGHT[b.status] ?? 3)); break;
    }
    return sorted;
  }, [filter, sortBy, search, assigneeFilter, industryFilter]);

  const toggleSelect = (id: number) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };
  const clearSelection = () => setSelected(new Set());

  return (
    <div className="min-h-screen pb-24" style={{ background: "var(--bg-primary)" }}>
      <div className="max-w-7xl mx-auto px-4 py-6 flex flex-col gap-5">
        {/* ──────────────────────────────────────────────── */}
        {/*  1. Header + firm snapshot                        */}
        {/* ──────────────────────────────────────────────── */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.35 }}
          className="flex flex-wrap items-end justify-between gap-3"
        >
          <div className="min-w-0">
            <h1
              className="text-2xl md:text-3xl font-bold"
              style={{ color: "var(--text-1)", fontFamily: "'Space Grotesk', sans-serif" }}
            >
              Client Portfolio
            </h1>
            <p className="text-sm mt-1 truncate" style={{ color: "var(--text-3)" }}>
              {CA_FIRM.name} · {CA_FIRM.registrationNo} · {CA_FIRM.panelSize}
            </p>
          </div>
          <span
            className="inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-full flex-shrink-0"
            style={{
              background: "color-mix(in srgb, var(--green) 15%, transparent)",
              color: "var(--green)",
              border: "1px solid color-mix(in srgb, var(--green) 30%, transparent)",
            }}
          >
            <span className="w-1.5 h-1.5 rounded-full" style={{ background: "var(--green)" }} />
            {CLIENTS.length} active clients
          </span>
        </motion.div>

        {/* This-month firm snapshot (4 tiles) */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <FirmSnapshotTile
            label="Hours logged"
            value={metrics.hoursLogged.toFixed(0)}
            sub={`vs ${metrics.hoursLoggedLastMonth}h last month`}
            delta={metrics.hoursLogged - metrics.hoursLoggedLastMonth}
            deltaUnit="h"
            color="var(--blue)"
            icon={<Clock size={14} />}
          />
          <FirmSnapshotTile
            label="Billed · this month"
            value={`₹${(metrics.billed / 1000).toFixed(0)}K`}
            sub={`₹${(metrics.collected / 1000).toFixed(0)}K collected`}
            delta={((metrics.billed - metrics.billedLastMonth) / metrics.billedLastMonth) * 100}
            deltaUnit="%"
            color="var(--green)"
            icon={<IndianRupee size={14} />}
          />
          <FirmSnapshotTile
            label="MIS coverage"
            value={`${metrics.misDelivered}/${metrics.misTotal}`}
            sub={`${Math.round((metrics.misDelivered / metrics.misTotal) * 100)}% delivered`}
            delta={0}
            deltaUnit=""
            progress={metrics.misDelivered / metrics.misTotal}
            color="var(--purple)"
            icon={<FileSpreadsheet size={14} />}
          />
          <FirmSnapshotTile
            label="Filing streak"
            value={`${metrics.filingStreakDays}d`}
            sub="Zero missed deadlines"
            delta={0}
            deltaUnit=""
            color="var(--orange)"
            icon={<CalendarDays size={14} />}
          />
        </div>

        {/* ──────────────────────────────────────────────── */}
        {/*  2. Compliance calendar strip                     */}
        {/* ──────────────────────────────────────────────── */}
        <ComplianceStrip calendar={calendar} onPick={(clientNames) => {
          setSearch(clientNames[0] ?? "");
          // Scroll to cards list (no-op on desktop since it's in view)
        }} />

        {/* ──────────────────────────────────────────────── */}
        {/*  3. Main body: [sidebar + content]                */}
        {/* ──────────────────────────────────────────────── */}
        <div className="flex gap-5">
          {/* Sidebar (desktop only) */}
          <aside className="hidden lg:flex flex-col gap-4 flex-shrink-0" style={{ width: 240 }}>
            <WorkloadCard
              workload={workload}
              activeAssignee={assigneeFilter}
              onPick={setAssigneeFilter}
            />
            <IndustryMixCard mix={industryMix} />
          </aside>

          {/* Main column */}
          <div className="flex-1 min-w-0 flex flex-col gap-4">
            {/* Filter + controls row */}
            <div className="flex flex-col gap-3">
              {/* Search + view toggle */}
              <div className="flex flex-wrap items-center gap-2">
                <div
                  className="flex items-center gap-2 px-3 py-2 rounded-lg flex-1 min-w-[200px]"
                  style={{ background: "var(--bg-surface)", border: "1px solid var(--border)" }}
                >
                  <Search size={13} style={{ color: "var(--text-4)" }} />
                  <input
                    type="text"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Search clients, industry, tags..."
                    className="flex-1 bg-transparent outline-none text-[12px] min-w-0"
                    style={{ color: "var(--text-1)" }}
                  />
                  {search && (
                    <button
                      onClick={() => setSearch("")}
                      className="cursor-pointer"
                      style={{ color: "var(--text-4)" }}
                    >
                      <X size={12} />
                    </button>
                  )}
                </div>

                {/* View toggle */}
                <div
                  className="flex rounded-lg p-0.5 flex-shrink-0"
                  style={{ background: "var(--bg-surface)", border: "1px solid var(--border)" }}
                >
                  {(["cards", "table", "calendar"] as ViewMode[]).map((v) => {
                    const active = view === v;
                    const Icon = v === "cards" ? LayoutGrid : v === "table" ? List : CalendarIcon;
                    return (
                      <button
                        key={v}
                        onClick={() => setView(v)}
                        className="flex items-center gap-1 text-[11px] font-semibold px-2.5 py-1.5 rounded-md cursor-pointer transition-colors capitalize"
                        style={{
                          background: active
                            ? "color-mix(in srgb, var(--green) 15%, transparent)"
                            : "transparent",
                          color: active ? "var(--green)" : "var(--text-3)",
                        }}
                      >
                        <Icon size={12} />
                        <span className="hidden sm:inline">{v}</span>
                      </button>
                    );
                  })}
                </div>

                {/* Sort dropdown */}
                <div
                  className="inline-flex items-center gap-1.5 text-[11px] px-2 py-1.5 rounded-lg flex-shrink-0"
                  style={{ background: "var(--bg-surface)", border: "1px solid var(--border)" }}
                >
                  <ArrowUpDown size={11} style={{ color: "var(--text-4)" }} />
                  <span style={{ color: "var(--text-4)" }}>Sort</span>
                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value as SortKey)}
                    className="bg-transparent outline-none text-[11px] font-semibold cursor-pointer"
                    style={{ color: "var(--text-1)" }}
                  >
                    <option value="status">Status</option>
                    <option value="health">Health</option>
                    <option value="compliance">Compliance</option>
                    <option value="revenue">Revenue</option>
                    <option value="activity">Last sync</option>
                    <option value="name">Name (A-Z)</option>
                  </select>
                </div>
              </div>

              {/* Filter chip row */}
              <div className="flex items-center gap-2 flex-wrap">
                <FilterChip label="All" count={CLIENTS.length} active={filter === "all"} onClick={() => setFilter("all")} />
                <FilterChip label="Needs attention" count={CLIENTS.filter((c) => c.status === "critical" || c.status === "warning").length} active={filter === "attention"} onClick={() => setFilter("attention")} color="var(--red)" />
                <FilterChip label="MIS pending" count={misPendingCount} active={filter === "mis"} onClick={() => setFilter("mis")} color="var(--yellow)" />
                <FilterChip label="Healthy" count={CLIENTS.filter((c) => c.status === "healthy").length} active={filter === "healthy"} onClick={() => setFilter("healthy")} color="var(--green)" />
                <FilterChip label="My clients" count={CLIENTS.filter((c) => c.assignedTo === "u-rajesh").length} active={filter === "mine"} onClick={() => setFilter("mine")} color="var(--purple)" />
                {churnRiskCount > 0 && (
                  <FilterChip label="Churn risk" count={churnRiskCount} active={filter === "churn"} onClick={() => setFilter("churn")} color="var(--orange)" />
                )}
                {/* Industry filter dropdown */}
                <div
                  className="inline-flex items-center gap-1 text-[11px] px-2.5 py-1.5 rounded-full flex-shrink-0"
                  style={{
                    background: industryFilter === "all" ? "var(--bg-surface)" : "color-mix(in srgb, var(--blue) 12%, transparent)",
                    border: `1px solid ${industryFilter === "all" ? "var(--border)" : "color-mix(in srgb, var(--blue) 30%, transparent)"}`,
                  }}
                >
                  <FilterIcon size={10} style={{ color: industryFilter === "all" ? "var(--text-4)" : "var(--blue)" }} />
                  <select
                    value={industryFilter}
                    onChange={(e) => setIndustryFilter(e.target.value)}
                    className="bg-transparent outline-none text-[11px] font-semibold cursor-pointer"
                    style={{ color: industryFilter === "all" ? "var(--text-3)" : "var(--blue)" }}
                  >
                    {industries.map((i) => (
                      <option key={i} value={i}>{i === "all" ? "All industries" : i}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {/* Content: cards / table / calendar */}
            {view === "cards" && (
              <ClientCardsGrid
                clients={filtered}
                selected={selected}
                onToggleSelect={toggleSelect}
                onOpen={(c) => setCurrent(clientToCompany(c))}
              />
            )}
            {view === "table" && (
              <ClientTable
                clients={filtered}
                selected={selected}
                onToggleSelect={toggleSelect}
                onOpen={(c) => setCurrent(clientToCompany(c))}
              />
            )}
            {view === "calendar" && <ClientCalendarView calendar={calendar} />}

            {filtered.length === 0 && (
              <div
                className="rounded-xl p-8 text-center"
                style={{ background: "var(--bg-surface)", border: "1px dashed var(--border)" }}
              >
                <p className="text-sm font-medium" style={{ color: "var(--text-3)" }}>
                  No clients match this filter.
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Bulk action bar */}
        <BulkActionBar
          selectedCount={selected.size}
          onClear={clearSelection}
        />
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════════
   Firm snapshot tile
   ══════════════════════════════════════════════════════════════════ */
function FirmSnapshotTile({
  label,
  value,
  sub,
  delta,
  deltaUnit,
  progress,
  color,
  icon,
}: {
  label: string;
  value: string;
  sub: string;
  delta: number;
  deltaUnit: string;
  progress?: number;
  color: string;
  icon: React.ReactNode;
}) {
  const showDelta = delta !== 0;
  const positive = delta > 0;
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.3 }}
      className="rounded-xl p-4"
      style={{
        background: "var(--bg-surface)",
        border: "1px solid var(--border)",
        borderLeft: `3px solid ${color}`,
      }}
    >
      <div className="flex items-center justify-between mb-2">
        <span className="text-[10px] uppercase tracking-wider font-semibold" style={{ color: "var(--text-4)" }}>
          {label}
        </span>
        <span style={{ color }}>{icon}</span>
      </div>
      <div className="flex items-baseline gap-2">
        <p className="text-2xl font-bold tabular-nums" style={{ color: "var(--text-1)", fontFamily: "'Space Grotesk', sans-serif" }}>
          {value}
        </p>
        {showDelta && (
          <span
            className="text-[11px] font-semibold flex items-center gap-0.5"
            style={{ color: positive ? "var(--green)" : "var(--red)" }}
          >
            {positive ? <TrendingUp size={10} /> : <TrendingDown size={10} />}
            {Math.abs(Math.round(delta))}{deltaUnit}
          </span>
        )}
      </div>
      <p className="text-[11px] mt-1" style={{ color: "var(--text-3)" }}>
        {sub}
      </p>
      {progress !== undefined && (
        <div className="mt-2 h-1 rounded-full overflow-hidden" style={{ background: "var(--bg-hover)" }}>
          <motion.div
            initial={{ width: 0 }}
            whileInView={{ width: `${progress * 100}%` }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="h-full"
            style={{ background: color }}
          />
        </div>
      )}
    </motion.div>
  );
}

/* ══════════════════════════════════════════════════════════════════
   Compliance calendar strip — next 21 days
   ══════════════════════════════════════════════════════════════════ */
function ComplianceStrip({
  calendar,
  onPick,
}: {
  calendar: ReturnType<typeof computeComplianceCalendar>;
  onPick: (clients: string[]) => void;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.35 }}
      className="rounded-xl p-4"
      style={{ background: "var(--bg-surface)", border: "1px solid var(--border)" }}
    >
      <div className="flex items-center justify-between mb-3">
        <div>
          <p className="text-sm font-bold" style={{ color: "var(--text-1)" }}>
            Compliance calendar
          </p>
          <p className="text-[11px] mt-0.5" style={{ color: "var(--text-4)" }}>
            Next 21 days · tap a date to filter clients affected
          </p>
        </div>
        <button
          className="text-[11px] font-semibold cursor-pointer"
          style={{ color: "var(--green)" }}
        >
          Full calendar →
        </button>
      </div>
      <div
        className="flex gap-2 overflow-x-auto pb-2"
        style={{ scrollbarWidth: "thin" }}
      >
        {calendar.map((day) => {
          const maxSeverity: "urgent" | "soon" | "upcoming" = day.items.some((i) => i.severity === "urgent")
            ? "urgent"
            : day.items.some((i) => i.severity === "soon")
            ? "soon"
            : "upcoming";
          const sevColor = maxSeverity === "urgent" ? "var(--red)" : maxSeverity === "soon" ? "var(--yellow)" : "var(--blue)";
          const totalClients = new Set(day.items.flatMap((i) => i.clients)).size;
          return (
            <button
              key={day.date}
              onClick={() => onPick(day.items.flatMap((i) => i.clients))}
              className="flex-shrink-0 rounded-lg p-2.5 text-left cursor-pointer transition-colors"
              style={{
                background: "var(--bg-secondary)",
                border: `1px solid ${sevColor}40`,
                borderTop: `3px solid ${sevColor}`,
                minWidth: 130,
              }}
            >
              <p className="text-[10px] uppercase tracking-wider font-bold" style={{ color: sevColor }}>
                {day.dayLabel}
              </p>
              <p className="text-[9px]" style={{ color: "var(--text-4)" }}>
                {day.monthLabel}
              </p>
              <div className="flex flex-col gap-0.5 mt-2">
                {day.items.slice(0, 2).map((item, i) => (
                  <p
                    key={i}
                    className="text-[10px] font-semibold truncate"
                    style={{ color: "var(--text-1)" }}
                  >
                    {item.filing}
                  </p>
                ))}
                {day.items.length > 2 && (
                  <p className="text-[9px]" style={{ color: "var(--text-4)" }}>
                    +{day.items.length - 2} more
                  </p>
                )}
              </div>
              <p className="text-[9px] mt-1.5" style={{ color: "var(--text-3)" }}>
                {totalClients} {totalClients === 1 ? "client" : "clients"}
              </p>
            </button>
          );
        })}
      </div>
    </motion.div>
  );
}

/* ══════════════════════════════════════════════════════════════════
   Workload sidebar card
   ══════════════════════════════════════════════════════════════════ */
function WorkloadCard({
  workload,
  activeAssignee,
  onPick,
}: {
  workload: ReturnType<typeof computeWorkload>;
  activeAssignee: string;
  onPick: (id: string) => void;
}) {
  return (
    <div
      className="rounded-xl p-4"
      style={{ background: "var(--bg-surface)", border: "1px solid var(--border)" }}
    >
      <div className="flex items-center justify-between mb-3">
        <p className="text-[11px] uppercase tracking-wider font-bold" style={{ color: "var(--text-4)" }}>
          Team workload
        </p>
        {activeAssignee !== "all" && (
          <button
            onClick={() => onPick("all")}
            className="text-[10px] font-semibold cursor-pointer"
            style={{ color: "var(--green)" }}
          >
            Clear
          </button>
        )}
      </div>
      <div className="flex flex-col gap-2">
        <button
          onClick={() => onPick("all")}
          className="text-left text-[11px] font-semibold cursor-pointer rounded-md px-2 py-1.5 transition-colors"
          style={{
            background: activeAssignee === "all" ? "color-mix(in srgb, var(--green) 10%, transparent)" : "transparent",
            color: activeAssignee === "all" ? "var(--green)" : "var(--text-3)",
          }}
        >
          All team members
        </button>
        {workload.map((w) => {
          const isActive = activeAssignee === w.member.id;
          return (
            <button
              key={w.member.id}
              onClick={() => onPick(w.member.id)}
              className="flex items-center gap-2 p-2 rounded-md cursor-pointer transition-colors text-left"
              style={{
                background: isActive
                  ? "color-mix(in srgb, var(--green) 10%, transparent)"
                  : "var(--bg-hover)",
                border: `1px solid ${isActive ? "color-mix(in srgb, var(--green) 30%, transparent)" : "transparent"}`,
              }}
            >
              <div
                className="w-7 h-7 rounded-full flex items-center justify-center text-[11px] font-bold flex-shrink-0"
                style={{
                  background: `color-mix(in srgb, ${w.member.color} 18%, transparent)`,
                  color: w.member.color,
                  border: `1px solid ${w.member.color}40`,
                }}
              >
                {w.member.avatar}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[11px] font-semibold truncate" style={{ color: "var(--text-1)" }}>
                  {w.member.name}
                </p>
                <p className="text-[10px]" style={{ color: "var(--text-4)" }}>
                  {w.clientCount} clients · {w.hours.toFixed(0)}h
                  {w.pending > 0 && (
                    <span style={{ color: "var(--yellow)" }}> · {w.pending} pending</span>
                  )}
                </p>
              </div>
              {/* Utilization mini bar */}
              <div
                className="w-10 h-1.5 rounded-full overflow-hidden flex-shrink-0"
                style={{ background: "var(--bg-primary)" }}
                title={`${Math.round(w.utilization * 100)}% utilization`}
              >
                <div
                  className="h-full rounded-full"
                  style={{
                    width: `${Math.min(w.utilization * 100, 100)}%`,
                    background: w.utilization > 0.9 ? "var(--red)" : w.utilization > 0.7 ? "var(--yellow)" : "var(--green)",
                  }}
                />
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════════
   Industry mix donut card
   ══════════════════════════════════════════════════════════════════ */
function IndustryMixCard({ mix }: { mix: ReturnType<typeof computeIndustryMix> }) {
  const size = 120;
  const radius = 44;
  const strokeWidth = 12;
  const circumference = 2 * Math.PI * radius;
  const total = mix.reduce((s, m) => s + m.value, 0);
  const topGroup = mix[0];

  /* Precompute each slice's dashArray + dashOffset purely (React 19
     purity rule: no mutable accumulator during render). We use
     reduce to thread the running cumulative through without
     reassigning an outer variable. */
  const slices = mix.reduce<Array<{ group: string; color: string; dash: number; offset: number }>>(
    (acc, m) => {
      const prev = acc[acc.length - 1];
      const startPct = prev ? prev.dash / circumference + -prev.offset / circumference : 0;
      void startPct;
      const cumulative = acc.reduce((s, a) => s + a.dash, 0) / circumference;
      return [
        ...acc,
        {
          group: m.group,
          color: m.color,
          dash: m.pct * circumference,
          offset: -cumulative * circumference,
        },
      ];
    },
    [],
  );

  return (
    <div
      className="rounded-xl p-4"
      style={{ background: "var(--bg-surface)", border: "1px solid var(--border)" }}
    >
      <p className="text-[11px] uppercase tracking-wider font-bold mb-3" style={{ color: "var(--text-4)" }}>
        Revenue mix
      </p>
      <div className="flex items-center justify-center mb-3">
        <div className="relative" style={{ width: size, height: size }}>
          <svg width={size} height={size} style={{ transform: "rotate(-90deg)" }}>
            {slices.map((s) => (
              <circle
                key={s.group}
                cx={size / 2}
                cy={size / 2}
                r={radius}
                fill="none"
                stroke={s.color}
                strokeWidth={strokeWidth}
                strokeDasharray={`${s.dash} ${circumference - s.dash}`}
                strokeDashoffset={s.offset}
              />
            ))}
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <p className="text-base font-bold tabular-nums" style={{ color: "var(--text-1)", fontFamily: "'Space Grotesk', sans-serif" }}>
              ₹{(total / 1e7).toFixed(1)}Cr
            </p>
            <p className="text-[9px]" style={{ color: "var(--text-4)" }}>
              total
            </p>
          </div>
        </div>
      </div>
      <div className="flex flex-col gap-1.5">
        {mix.slice(0, 5).map((m) => (
          <div key={m.group} className="flex items-center justify-between text-[11px]">
            <span className="inline-flex items-center gap-1.5 min-w-0">
              <span className="w-2 h-2 rounded-sm flex-shrink-0" style={{ background: m.color }} />
              <span className="truncate" style={{ color: "var(--text-2)" }}>
                {m.group}
              </span>
            </span>
            <span className="tabular-nums font-semibold" style={{ color: "var(--text-3)" }}>
              {Math.round(m.pct * 100)}%
            </span>
          </div>
        ))}
      </div>
      {mix.length > 3 && topGroup && (
        <p className="text-[10px] mt-3 pt-3" style={{ color: "var(--text-4)", borderTop: "1px solid var(--border)" }}>
          Top: <strong style={{ color: topGroup.color }}>{topGroup.group}</strong> — {Math.round(topGroup.pct * 100)}% concentration
        </p>
      )}
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════════
   Filter chip helper
   ══════════════════════════════════════════════════════════════════ */
function FilterChip({
  label,
  count,
  active,
  onClick,
  color = "var(--green)",
}: {
  label: string;
  count: number;
  active: boolean;
  onClick: () => void;
  color?: string;
}) {
  return (
    <button
      onClick={onClick}
      className="flex items-center gap-1.5 text-[11px] font-semibold px-2.5 py-1.5 rounded-full cursor-pointer transition-colors"
      style={{
        background: active ? `color-mix(in srgb, ${color} 15%, transparent)` : "var(--bg-surface)",
        color: active ? color : "var(--text-3)",
        border: `1px solid ${active ? `color-mix(in srgb, ${color} 35%, transparent)` : "var(--border)"}`,
      }}
    >
      {label}
      <span
        className="text-[10px] tabular-nums px-1 rounded-md"
        style={{
          background: active ? color : "var(--bg-hover)",
          color: active ? "#fff" : "var(--text-4)",
          minWidth: 18,
          textAlign: "center",
        }}
      >
        {count}
      </span>
    </button>
  );
}

/* ══════════════════════════════════════════════════════════════════
   Client cards grid (main view)
   ══════════════════════════════════════════════════════════════════ */
function ClientCardsGrid({
  clients,
  selected,
  onToggleSelect,
  onOpen,
}: {
  clients: Client[];
  selected: Set<number>;
  onToggleSelect: (id: number) => void;
  onOpen: (c: Client) => void;
}) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
      {clients.map((c, i) => (
        <ClientCard
          key={c.id}
          client={c}
          index={i}
          isSelected={selected.has(c.id)}
          onToggleSelect={() => onToggleSelect(c.id)}
          onOpen={() => onOpen(c)}
        />
      ))}
    </div>
  );
}

function ClientCard({
  client: c,
  index,
  isSelected,
  onToggleSelect,
  onOpen,
}: {
  client: Client;
  index: number;
  isSelected: boolean;
  onToggleSelect: () => void;
  onOpen: () => void;
}) {
  const sColor = statusColor[c.status];
  const netPLPositive = c.netPL.trim().startsWith("+");
  const netPLColor = netPLPositive ? "var(--green)" : "var(--red)";
  const healthColor =
    c.healthScore >= 75 ? "var(--green)" : c.healthScore >= 55 ? "var(--yellow)" : "var(--red)";
  const team = getTeamMember(c.assignedTo);
  const priorityC = priorityColor[c.nextAction.priority];
  const complianceC = COMPLIANCE_GRADE_COLOR[c.complianceGrade];
  const isChurnRisk = c.churnRisk === "medium" || c.churnRisk === "high";

  return (
    <motion.div
      initial={{ opacity: 0, y: 14 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.1 }}
      transition={{ duration: 0.35, delay: Math.min(index * 0.03, 0.3) }}
      whileHover={{ y: -2 }}
      className="relative rounded-xl overflow-hidden cursor-pointer transition-shadow hover:shadow-xl"
      style={{
        background: "var(--bg-surface)",
        border: `1px solid ${isSelected ? "color-mix(in srgb, var(--green) 40%, transparent)" : "var(--border)"}`,
        outline: isSelected ? "2px solid var(--green)" : "none",
      }}
    >
      {/* Status stripe */}
      <div className="absolute left-0 top-0 bottom-0 w-1" style={{ background: sColor }} />

      <div className="pl-4 pr-3 py-3 flex flex-col gap-2.5">
        {/* Row 1: checkbox + status dot + name + status label */}
        <div className="flex items-start gap-2">
          <input
            type="checkbox"
            checked={isSelected}
            onChange={(e) => {
              e.stopPropagation();
              onToggleSelect();
            }}
            onClick={(e) => e.stopPropagation()}
            className="mt-1 cursor-pointer flex-shrink-0"
            style={{ accentColor: "var(--green)" }}
            aria-label={`Select ${c.name}`}
          />
          <div className="flex-1 min-w-0" onClick={onOpen}>
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <div className="flex items-center gap-1.5">
                  <span
                    className="w-2 h-2 rounded-full flex-shrink-0"
                    style={{
                      background: sColor,
                      boxShadow: `0 0 0 3px color-mix(in srgb, ${sColor} 20%, transparent)`,
                    }}
                  />
                  <p className="text-sm font-bold leading-tight truncate" style={{ color: "var(--text-1)" }}>
                    {c.name}
                  </p>
                </div>
                <p className="text-[10px] mt-0.5" style={{ color: "var(--text-4)" }}>
                  {c.industryGroup} · {c.location}
                </p>
              </div>
              <div className="flex items-center gap-1 flex-shrink-0">
                {team && (
                  <span
                    title={`Assigned to ${team.name}`}
                    className="w-5 h-5 rounded-full flex items-center justify-center text-[9px] font-bold"
                    style={{
                      background: `color-mix(in srgb, ${team.color} 18%, transparent)`,
                      color: team.color,
                    }}
                  >
                    {team.avatar}
                  </span>
                )}
                <span
                  className="text-[9px] font-bold px-1.5 py-0.5 rounded"
                  style={{
                    color: sColor,
                    background: `color-mix(in srgb, ${sColor} 14%, transparent)`,
                  }}
                >
                  {statusLabel[c.status]}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Row 2: mini KPIs — revenue (with YoY + sparkline), Net P&L, Health, Compliance */}
        <div
          className="rounded-lg p-2 flex items-stretch gap-0"
          style={{ background: "var(--bg-secondary)" }}
          onClick={onOpen}
        >
          <KpiCell label="Revenue" color="var(--text-1)">
            <div className="flex items-center gap-1">
              <span className="text-[13px] font-bold tabular-nums" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
                ₹{c.revenue}
              </span>
              {c.revenueYoY !== 0 && (
                <span
                  className="text-[9px] font-bold tabular-nums"
                  style={{ color: c.revenueYoY > 0 ? "var(--green)" : "var(--red)" }}
                >
                  {c.revenueYoY > 0 ? "+" : ""}{Math.round(c.revenueYoY * 100)}%
                </span>
              )}
            </div>
            {c.revenueTrend.length > 0 && (
              <Sparkline
                data={c.revenueTrend}
                color={c.revenueYoY >= 0 ? "var(--green)" : "var(--red)"}
              />
            )}
          </KpiCell>
          <Divider />
          <KpiCell label="P&L" color={netPLColor}>
            <div className="flex items-center gap-0.5">
              {netPLPositive ? <TrendingUp size={11} /> : <TrendingDown size={11} />}
              <span className="text-[13px] font-bold tabular-nums" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
                {c.netPL}
              </span>
            </div>
          </KpiCell>
          <Divider />
          <KpiCell label="Health" color={healthColor}>
            <div className="flex items-center gap-0.5">
              <Activity size={11} />
              <span className="text-[13px] font-bold tabular-nums" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
                {c.healthScore}
              </span>
            </div>
          </KpiCell>
          <Divider />
          <KpiCell label="Compliance" color={complianceC}>
            <span className="text-[13px] font-bold" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
              {c.complianceGrade}
            </span>
          </KpiCell>
        </div>

        {/* Row 3: Next action */}
        <div
          className="rounded-lg p-2 flex items-start gap-2"
          style={{
            background: `color-mix(in srgb, ${priorityC} 10%, transparent)`,
            border: `1px solid color-mix(in srgb, ${priorityC} 25%, transparent)`,
          }}
          onClick={onOpen}
        >
          <span
            className="text-[9px] uppercase tracking-wider font-bold px-1.5 py-0.5 rounded flex-shrink-0 mt-0.5"
            style={{
              background: priorityC,
              color: "#fff",
            }}
          >
            {c.nextAction.verb}
          </span>
          <div className="flex-1 min-w-0">
            <p className="text-[11px] font-semibold truncate" style={{ color: "var(--text-1)" }}>
              {c.nextAction.detail}
            </p>
            {c.nextAction.deadline && (
              <p className="text-[10px]" style={{ color: priorityC }}>
                Due {new Date(c.nextAction.deadline).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}
              </p>
            )}
          </div>
        </div>

        {/* Row 4 (optional): churn risk badge */}
        {isChurnRisk && (
          <div
            className="flex items-center gap-1.5 text-[10px] font-semibold px-2 py-1 rounded-md"
            style={{
              background: `color-mix(in srgb, ${CHURN_RISK_META[c.churnRisk].color} 12%, transparent)`,
              color: CHURN_RISK_META[c.churnRisk].color,
            }}
          >
            <AlertTriangle size={10} />
            {CHURN_RISK_META[c.churnRisk].label} — last sync {c.lastSync}, owner {c.ownerLastLogin}
          </div>
        )}

        {/* Footer: MIS status + sync + quick actions */}
        <div
          className="flex items-center justify-between gap-2 pt-2"
          style={{ borderTop: "1px solid var(--border)" }}
        >
          <div className="flex items-center gap-1.5 min-w-0 flex-wrap">
            <span
              className="text-[9px] font-semibold px-1.5 py-0.5 rounded"
              style={{
                color: misColor[c.misStatus] ?? "var(--text-3)",
                background: `color-mix(in srgb, ${misColor[c.misStatus] ?? "var(--text-3)"} 12%, transparent)`,
              }}
            >
              MIS: {c.misStatus}
            </span>
            <span className="text-[10px]" style={{ color: "var(--text-4)" }}>
              Sync {c.lastSync}
              {c.lastSyncVouchers > 0 && ` · ${c.lastSyncVouchers} new`}
            </span>
          </div>
          <div className="flex items-center gap-0.5 flex-shrink-0">
            <QuickAction icon={<Send size={11} />}        tooltip="Generate MIS" onClick={(e) => { e.stopPropagation(); }} />
            <QuickAction icon={<MessageCircle size={11} />} tooltip="WhatsApp"    onClick={(e) => { e.stopPropagation(); }} />
            <QuickAction icon={<Phone size={11} />}         tooltip="Call"        onClick={(e) => { e.stopPropagation(); }} />
            <button
              onClick={(e) => { e.stopPropagation(); onOpen(); }}
              className="ml-1 inline-flex items-center gap-0.5 text-[10px] font-semibold cursor-pointer"
              style={{ color: "var(--green)" }}
            >
              Open
              <ArrowRight size={10} />
            </button>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

function KpiCell({ label, color, children }: { label: string; color: string; children: React.ReactNode }) {
  return (
    <div className="flex-1 flex flex-col items-start px-1.5 min-w-0">
      <span className="text-[8px] uppercase tracking-wider font-medium" style={{ color: "var(--text-4)" }}>
        {label}
      </span>
      <span className="mt-0.5" style={{ color }}>
        {children}
      </span>
    </div>
  );
}

function Divider() {
  return <div className="w-px" style={{ background: "var(--border)" }} />;
}

function QuickAction({
  icon,
  tooltip,
  onClick,
}: {
  icon: React.ReactNode;
  tooltip: string;
  onClick: (e: React.MouseEvent) => void;
}) {
  return (
    <button
      onClick={onClick}
      title={tooltip}
      aria-label={tooltip}
      className="w-6 h-6 rounded-md flex items-center justify-center cursor-pointer transition-colors"
      style={{
        color: "var(--text-3)",
        background: "var(--bg-hover)",
      }}
    >
      {icon}
    </button>
  );
}

function Sparkline({ data, color }: { data: number[]; color: string }) {
  const w = 70;
  const h = 16;
  const max = Math.max(...data, 1);
  const min = Math.min(...data);
  const range = Math.max(max - min, 1);
  const points = data
    .map((v, i) => {
      const x = (i / (data.length - 1)) * w;
      const y = h - ((v - min) / range) * h;
      return `${x},${y}`;
    })
    .join(" ");
  return (
    <svg width={w} height={h} style={{ display: "block", marginTop: 2 }}>
      <polyline points={points} fill="none" stroke={color} strokeWidth={1.2} strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

/* ══════════════════════════════════════════════════════════════════
   Table view
   ══════════════════════════════════════════════════════════════════ */
function ClientTable({
  clients,
  selected,
  onToggleSelect,
  onOpen,
}: {
  clients: Client[];
  selected: Set<number>;
  onToggleSelect: (id: number) => void;
  onOpen: (c: Client) => void;
}) {
  return (
    <div
      className="rounded-xl overflow-hidden"
      style={{ background: "var(--bg-surface)", border: "1px solid var(--border)" }}
    >
      <div className="overflow-x-auto">
        <table className="w-full text-[11px]">
          <thead>
            <tr style={{ background: "var(--bg-secondary)" }}>
              <th className="px-3 py-2.5 w-8"></th>
              <th className="px-3 py-2.5 text-left font-semibold uppercase tracking-wider" style={{ color: "var(--text-4)" }}>Client</th>
              <th className="px-3 py-2.5 text-right font-semibold uppercase tracking-wider" style={{ color: "var(--text-4)" }}>Revenue</th>
              <th className="px-3 py-2.5 text-right font-semibold uppercase tracking-wider" style={{ color: "var(--text-4)" }}>P&amp;L</th>
              <th className="px-3 py-2.5 text-center font-semibold uppercase tracking-wider" style={{ color: "var(--text-4)" }}>Health</th>
              <th className="px-3 py-2.5 text-center font-semibold uppercase tracking-wider" style={{ color: "var(--text-4)" }}>Compl.</th>
              <th className="px-3 py-2.5 text-left font-semibold uppercase tracking-wider" style={{ color: "var(--text-4)" }}>Next action</th>
              <th className="px-3 py-2.5 text-center font-semibold uppercase tracking-wider" style={{ color: "var(--text-4)" }}>MIS</th>
              <th className="px-3 py-2.5 text-left font-semibold uppercase tracking-wider" style={{ color: "var(--text-4)" }}>Assignee</th>
              <th className="px-3 py-2.5 text-right font-semibold uppercase tracking-wider" style={{ color: "var(--text-4)" }}>Sync</th>
            </tr>
          </thead>
          <tbody>
            {clients.map((c, i) => {
              const team = getTeamMember(c.assignedTo);
              const netPLPositive = c.netPL.trim().startsWith("+");
              const healthColor =
                c.healthScore >= 75 ? "var(--green)" : c.healthScore >= 55 ? "var(--yellow)" : "var(--red)";
              const isSelected = selected.has(c.id);
              return (
                <tr
                  key={c.id}
                  onClick={() => onOpen(c)}
                  className="cursor-pointer transition-colors"
                  style={{
                    background: isSelected
                      ? "color-mix(in srgb, var(--green) 8%, transparent)"
                      : i % 2 === 0
                      ? "transparent"
                      : "color-mix(in srgb, var(--bg-hover) 40%, transparent)",
                    borderTop: "1px solid var(--border)",
                  }}
                >
                  <td className="px-3 py-2.5" onClick={(e) => e.stopPropagation()}>
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={() => onToggleSelect(c.id)}
                      className="cursor-pointer"
                      style={{ accentColor: "var(--green)" }}
                    />
                  </td>
                  <td className="px-3 py-2.5">
                    <div className="flex items-center gap-2">
                      <span
                        className="w-2 h-2 rounded-full flex-shrink-0"
                        style={{ background: statusColor[c.status] }}
                      />
                      <div className="min-w-0">
                        <p className="font-semibold truncate" style={{ color: "var(--text-1)" }}>{c.name}</p>
                        <p className="text-[10px]" style={{ color: "var(--text-4)" }}>{c.industryGroup} · {c.location}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-3 py-2.5 text-right tabular-nums">
                    <span style={{ color: "var(--text-1)", fontFamily: "'Space Grotesk', sans-serif" }}>₹{c.revenue}</span>
                    {c.revenueYoY !== 0 && (
                      <span
                        className="ml-1.5 text-[10px] font-bold"
                        style={{ color: c.revenueYoY > 0 ? "var(--green)" : "var(--red)" }}
                      >
                        {c.revenueYoY > 0 ? "+" : ""}{Math.round(c.revenueYoY * 100)}%
                      </span>
                    )}
                  </td>
                  <td
                    className="px-3 py-2.5 text-right tabular-nums font-semibold"
                    style={{
                      color: netPLPositive ? "var(--green)" : "var(--red)",
                      fontFamily: "'Space Grotesk', sans-serif",
                    }}
                  >
                    {c.netPL}
                  </td>
                  <td className="px-3 py-2.5 text-center tabular-nums font-semibold" style={{ color: healthColor }}>
                    {c.healthScore}
                  </td>
                  <td className="px-3 py-2.5 text-center">
                    <span
                      className="text-[10px] font-bold px-1.5 py-0.5 rounded"
                      style={{
                        color: COMPLIANCE_GRADE_COLOR[c.complianceGrade],
                        background: `color-mix(in srgb, ${COMPLIANCE_GRADE_COLOR[c.complianceGrade]} 14%, transparent)`,
                      }}
                    >
                      {c.complianceGrade}
                    </span>
                  </td>
                  <td className="px-3 py-2.5">
                    <div className="flex items-center gap-1.5">
                      <span
                        className="text-[9px] uppercase tracking-wider font-bold px-1 py-0.5 rounded flex-shrink-0"
                        style={{ background: priorityColor[c.nextAction.priority], color: "#fff" }}
                      >
                        {c.nextAction.verb}
                      </span>
                      <span className="truncate" style={{ color: "var(--text-2)" }}>{c.nextAction.detail}</span>
                    </div>
                  </td>
                  <td className="px-3 py-2.5 text-center">
                    <span
                      className="text-[10px] font-semibold px-1.5 py-0.5 rounded"
                      style={{
                        color: misColor[c.misStatus] ?? "var(--text-3)",
                        background: `color-mix(in srgb, ${misColor[c.misStatus] ?? "var(--text-3)"} 12%, transparent)`,
                      }}
                    >
                      {c.misStatus}
                    </span>
                  </td>
                  <td className="px-3 py-2.5">
                    {team && (
                      <span
                        className="inline-flex items-center gap-1"
                        title={team.name}
                      >
                        <span
                          className="w-4 h-4 rounded-full flex items-center justify-center text-[9px] font-bold flex-shrink-0"
                          style={{
                            background: `color-mix(in srgb, ${team.color} 18%, transparent)`,
                            color: team.color,
                          }}
                        >
                          {team.avatar}
                        </span>
                        <span className="hidden lg:inline" style={{ color: "var(--text-3)" }}>
                          {team.name.replace(/^CA\s+/, "").split(" ")[0]}
                        </span>
                      </span>
                    )}
                  </td>
                  <td className="px-3 py-2.5 text-right" style={{ color: "var(--text-4)" }}>
                    {c.lastSync}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════════
   Calendar view — month grid with compliance events
   ══════════════════════════════════════════════════════════════════ */
function ClientCalendarView({
  calendar,
}: {
  calendar: ReturnType<typeof computeComplianceCalendar>;
}) {
  // Group events by day for April 2026 (demo month)
  const monthStart = new Date("2026-04-01");
  const monthEnd = new Date("2026-04-30");
  const days: Array<{ date: string; label: string; events: typeof calendar[0]["items"] }> = [];
  for (let d = new Date(monthStart); d <= monthEnd; d.setDate(d.getDate() + 1)) {
    const iso = d.toISOString().slice(0, 10);
    const cal = calendar.find((c) => c.date === iso);
    days.push({
      date: iso,
      label: d.toLocaleDateString("en-IN", { weekday: "short", day: "numeric" }),
      events: cal?.items ?? [],
    });
  }

  return (
    <div
      className="rounded-xl p-4"
      style={{ background: "var(--bg-surface)", border: "1px solid var(--border)" }}
    >
      <p className="text-sm font-bold mb-3" style={{ color: "var(--text-1)" }}>
        April 2026 · Compliance calendar
      </p>
      <div className="grid grid-cols-7 gap-1">
        {days.map((d) => {
          const hasEvents = d.events.length > 0;
          const urgent = d.events.some((e) => e.severity === "urgent");
          const soon = d.events.some((e) => e.severity === "soon");
          const c = urgent ? "var(--red)" : soon ? "var(--yellow)" : "var(--blue)";
          return (
            <div
              key={d.date}
              className="rounded-lg p-2 flex flex-col gap-1 min-h-[72px]"
              style={{
                background: hasEvents ? `color-mix(in srgb, ${c} 8%, var(--bg-primary))` : "var(--bg-primary)",
                border: `1px solid ${hasEvents ? `color-mix(in srgb, ${c} 30%, transparent)` : "var(--border)"}`,
              }}
            >
              <p className="text-[9px] font-bold" style={{ color: hasEvents ? c : "var(--text-4)" }}>
                {d.label}
              </p>
              {d.events.slice(0, 2).map((e, i) => (
                <p
                  key={i}
                  className="text-[9px] truncate font-semibold"
                  style={{ color: "var(--text-2)" }}
                >
                  {e.filing}
                </p>
              ))}
              {d.events.length > 2 && (
                <p className="text-[8px]" style={{ color: "var(--text-4)" }}>
                  +{d.events.length - 2}
                </p>
              )}
            </div>
          );
        })}
      </div>
      <p className="text-[10px] mt-3" style={{ color: "var(--text-4)" }}>
        Calendar view shows compliance deadlines across the month. Switch to Cards / Table views
        to see client-level detail.
      </p>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════════
   Bulk action bar — shows portfolio-wide actions OR selection-scoped
   ══════════════════════════════════════════════════════════════════ */
function BulkActionBar({
  selectedCount,
  onClear,
}: {
  selectedCount: number;
  onClear: () => void;
}) {
  const hasSelection = selectedCount > 0;
  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.2 }}
      transition={{ duration: 0.4 }}
      className="sticky bottom-4 rounded-xl p-3 md:p-4"
      style={{
        background: hasSelection
          ? "color-mix(in srgb, var(--green) 8%, var(--bg-surface))"
          : "var(--bg-surface)",
        border: `1px solid ${hasSelection ? "color-mix(in srgb, var(--green) 35%, transparent)" : "var(--border)"}`,
        boxShadow: "0 8px 24px rgba(0,0,0,0.25)",
        backdropFilter: "blur(8px)",
      }}
    >
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="min-w-0">
          <p className="text-[10px] uppercase tracking-wider font-medium" style={{ color: "var(--text-4)" }}>
            {hasSelection ? `${selectedCount} selected` : "Bulk actions"}
          </p>
          <p className="text-sm font-semibold mt-0.5" style={{ color: "var(--text-1)" }}>
            {hasSelection ? "Operations on selected clients" : "Run operations across your portfolio"}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button
            className="inline-flex items-center gap-1.5 text-[12px] font-semibold px-3 py-2 rounded-lg cursor-pointer"
            style={{ background: "var(--green)", color: "#fff" }}
          >
            <Send size={13} />
            {hasSelection ? `Generate MIS for ${selectedCount}` : "Generate MIS for all"}
          </button>
          <button
            className="inline-flex items-center gap-1.5 text-[12px] font-semibold px-3 py-2 rounded-lg cursor-pointer"
            style={{
              background: "transparent",
              border: "1px solid color-mix(in srgb, #25D366 45%, transparent)",
              color: "#25D366",
            }}
          >
            <MessageCircle size={13} />
            {hasSelection ? `WhatsApp ${selectedCount}` : "Bulk WhatsApp updates"}
          </button>
          <button
            className="inline-flex items-center gap-1.5 text-[12px] font-semibold px-3 py-2 rounded-lg cursor-pointer"
            style={{ background: "transparent", border: "1px solid var(--border)", color: "var(--text-2)" }}
          >
            <Download size={13} />
            Export
          </button>
          {hasSelection && (
            <button
              onClick={onClear}
              className="text-[11px] px-2 py-2 rounded-md cursor-pointer"
              style={{ color: "var(--text-4)" }}
              aria-label="Clear selection"
            >
              <X size={14} />
            </button>
          )}
        </div>
      </div>
    </motion.div>
  );
}

/* ══════════════════════════════════════════════════════════════════
   Utility
   ══════════════════════════════════════════════════════════════════ */
function parseSyncMinutes(v: string): number {
  if (v === "Never") return 99999;
  const m = v.trim().match(/([0-9]+)\s*(m|min|minute|h|hour|hr|d|day|w|week)/i);
  if (!m) return 9999;
  const num = parseFloat(m[1]);
  const unit = m[2].toLowerCase();
  if (unit.startsWith("m")) return num;
  if (unit.startsWith("h")) return num * 60;
  if (unit.startsWith("d")) return num * 60 * 24;
  if (unit.startsWith("w")) return num * 60 * 24 * 7;
  return num;
}
