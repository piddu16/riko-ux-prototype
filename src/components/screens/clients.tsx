"use client";

import { useState, useMemo } from "react";
import { motion } from "framer-motion";
import {
  Users,
  AlertTriangle,
  FileClock,
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
  X,
  Filter as FilterIcon,
  Calendar as CalendarIcon,
} from "lucide-react";
import {
  CLIENTS,
  CA_FIRM,
  computeIndustryMix,
  computeComplianceCalendar,
  type Client,
} from "@/lib/data";
import { useCompany, clientToCompany } from "@/lib/company-context";

/* ══════════════════════════════════════════════════════════════════
   ClientsScreen — CA Portfolio

   Production parity (rikoai.in) + grounded P1 additions:
    • Compliance calendar strip (next 21 days, client pins per filing)
    • Industry filter + industry-mix donut (derived from industryGroup)
    • View toggle: Cards / Table / Calendar
    • Cards enrichment: revenue YoY pill + 12-month sparkline,
      "Next action" verb (reframed from existing issues field)
    • Bulk-select checkbox + dynamic "Generate MIS for N"
    • 4-dim sort: Status / Health / Revenue / Name

   What's intentionally NOT here (invented, cut per CEO review):
    • CA team roster + workload sidebar
    • Firm snapshot hero (hours logged, billed, MIS coverage)
    • Compliance grade A+/B/C (production only has health score)
    • Churn risk banner, per-card team avatar, tags
    • Location per client, monthly hours/billed, onboarding flags
   ══════════════════════════════════════════════════════════════════ */

type FilterKey = "all" | "attention" | "mis" | "healthy";
type SortKey = "status" | "health" | "revenue" | "name";
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

/** Next-action verb → chip color. Derived from client status
 *  (critical → urgent red, warning → high yellow, healthy → medium blue). */
function nextActionColor(status: Client["status"]): string {
  if (status === "critical") return "var(--red)";
  if (status === "warning") return "var(--yellow)";
  return "var(--blue)";
}

const STATUS_WEIGHT: Record<string, number> = {
  critical: 0,
  warning: 1,
  healthy: 2,
};

export function ClientsScreen() {
  const [filter, setFilter] = useState<FilterKey>("all");
  const [sortBy, setSortBy] = useState<SortKey>("status");
  const [view, setView] = useState<ViewMode>("cards");
  const [search, setSearch] = useState("");
  const [industryFilter, setIndustryFilter] = useState<string>("all");
  const [selected, setSelected] = useState<Set<number>>(new Set());
  const { setCurrent } = useCompany();

  const calendar = useMemo(() => computeComplianceCalendar(), []);
  const industryMix = useMemo(() => computeIndustryMix(), []);

  const misPendingCount = CLIENTS.filter((c) => c.misStatus === "Pending").length;
  const combinedRevenue = CLIENTS.reduce((s, c) => s + c.revenueValue, 0);
  const healthyCount = CLIENTS.filter((c) => c.status === "healthy").length;
  const attentionCount = CLIENTS.filter((c) => c.status === "critical" || c.status === "warning").length;

  const industries = useMemo(() => {
    const s = new Set(CLIENTS.map((c) => c.industryGroup));
    return ["all", ...[...s].sort()];
  }, []);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    const base = CLIENTS.filter((c) => {
      if (q) {
        const hay = `${c.name} ${c.industry}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      if (industryFilter !== "all" && c.industryGroup !== industryFilter) return false;
      if (filter === "attention") return c.status === "critical" || c.status === "warning";
      if (filter === "mis") return c.misStatus === "Pending";
      if (filter === "healthy") return c.status === "healthy";
      return true;
    });

    const sorted = [...base];
    switch (sortBy) {
      case "health":  sorted.sort((a, b) => b.healthScore - a.healthScore); break;
      case "revenue": sorted.sort((a, b) => b.revenueValue - a.revenueValue); break;
      case "name":    sorted.sort((a, b) => a.name.localeCompare(b.name)); break;
      case "status":
      default:        sorted.sort((a, b) => (STATUS_WEIGHT[a.status] ?? 3) - (STATUS_WEIGHT[b.status] ?? 3)); break;
    }
    return sorted;
  }, [filter, sortBy, search, industryFilter]);

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
      <div className="max-w-6xl mx-auto px-4 py-6 flex flex-col gap-5">
        {/* Header */}
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
              {CA_FIRM.name} · {CA_FIRM.registrationNo}
            </p>
          </div>
          <span
            className="inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-full flex-shrink-0"
            style={{
              background: "var(--bg-hover)",
              color: "var(--green)",
              border: "1px solid color-mix(in srgb, var(--green) 30%, transparent)",
            }}
          >
            <span className="w-1.5 h-1.5 rounded-full" style={{ background: "var(--green)" }} />
            {CLIENTS.length} active clients
          </span>
        </motion.div>

        {/* 4 production KPI cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <SummaryTile label="Total Clients"    value={String(CLIENTS.length)} accent="var(--blue)"  icon={<Users size={16} />} />
          <SummaryTile label="Needs Attention"  value={String(attentionCount)} accent="var(--red)"   icon={<AlertTriangle size={16} />} tinted />
          <SummaryTile label="MIS Pending"      value={String(misPendingCount)} accent="var(--yellow)" icon={<FileClock size={16} />} />
          <SummaryTile label="Combined Revenue" value={`₹${(combinedRevenue / 1e7).toFixed(1)}Cr`} accent="var(--green)" icon={<IndianRupee size={16} />} />
        </div>

        {/* Compliance calendar strip (P1) */}
        <ComplianceStrip calendar={calendar} onPick={(name) => setSearch(name)} />

        {/* Filter + controls row */}
        <div className="flex flex-col gap-3">
          {/* Search + View toggle + Sort */}
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
                placeholder="Search clients or industry..."
                className="flex-1 bg-transparent outline-none text-[12px] min-w-0"
                style={{ color: "var(--text-1)" }}
              />
              {search && (
                <button onClick={() => setSearch("")} className="cursor-pointer" style={{ color: "var(--text-4)" }}>
                  <X size={12} />
                </button>
              )}
            </div>

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
                      background: active ? "var(--bg-hover)" : "transparent",
                      color: active ? "var(--text-1)" : "var(--text-3)",
                    }}
                  >
                    <Icon size={12} />
                    <span className="hidden sm:inline">{v}</span>
                  </button>
                );
              })}
            </div>

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
                <option value="revenue">Revenue</option>
                <option value="name">Name (A-Z)</option>
              </select>
            </div>
          </div>

          {/* Filter chip row (production 4 chips + industry dropdown) */}
          <div className="flex items-center gap-2 flex-wrap">
            <FilterChip label="All"              count={CLIENTS.length}  active={filter === "all"}       onClick={() => setFilter("all")} />
            <FilterChip label="Needs attention"  count={attentionCount}  active={filter === "attention"} onClick={() => setFilter("attention")} color="var(--red)" />
            <FilterChip label="MIS pending"      count={misPendingCount} active={filter === "mis"}       onClick={() => setFilter("mis")} color="var(--yellow)" />
            <FilterChip label="Healthy"          count={healthyCount}    active={filter === "healthy"}   onClick={() => setFilter("healthy")} color="var(--green)" />
            {/* Industry filter — uses industryGroup field derived client-side */}
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

        {/* View content */}
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
            className="rounded-md p-8 text-center"
            style={{ background: "var(--bg-surface)", border: "1px dashed var(--border)" }}
          >
            <p className="text-sm font-medium" style={{ color: "var(--text-3)" }}>
              No clients match this filter.
            </p>
          </div>
        )}

        {/* Industry mix donut (P1) */}
        <IndustryMixCard mix={industryMix} />

        {/* Bulk action bar (production 3 CTAs, dynamic count when selection active) */}
        <BulkActionBar selectedCount={selected.size} onClear={clearSelection} />
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════════
   SummaryTile — production 4-card pattern
   ══════════════════════════════════════════════════════════════════ */
function SummaryTile({
  label,
  value,
  accent,
  icon,
  tinted,
}: {
  label: string;
  value: string;
  accent: string;
  icon: React.ReactNode;
  tinted?: boolean;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 14 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.35 }}
      className="rounded-md overflow-hidden"
      style={{
        background: "var(--bg-surface)",
        border: "1px solid var(--border)",
      }}
    >
      <div className="p-4 flex items-start justify-between">
        <div>
          <div className="flex items-center gap-1.5 mb-2">
            <span
              aria-hidden
              className="inline-block flex-shrink-0"
              style={{ width: 5, height: 5, borderRadius: 999, background: accent }}
            />
            <p className="text-[10px] uppercase tracking-wider font-medium" style={{ color: "var(--text-4)" }}>
              {label}
            </p>
          </div>
          <p
            className="text-2xl font-semibold leading-none tabular-nums"
            style={{
              color: "var(--text-1)",
              fontFamily: "'Space Grotesk', sans-serif",
              letterSpacing: "-0.02em",
            }}
          >
            {value}
          </p>
        </div>
        <span
          className="flex-shrink-0"
          style={{ color: "var(--text-4)" }}
        >
          {icon}
        </span>
      </div>
    </motion.div>
  );
}

/* ══════════════════════════════════════════════════════════════════
   Compliance calendar strip
   ══════════════════════════════════════════════════════════════════ */
function ComplianceStrip({
  calendar,
  onPick,
}: {
  calendar: ReturnType<typeof computeComplianceCalendar>;
  onPick: (name: string) => void;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.35 }}
      className="rounded-md p-4"
      style={{ background: "var(--bg-surface)", border: "1px solid var(--border)" }}
    >
      <div className="flex items-center justify-between mb-3">
        <div>
          <p className="text-sm font-bold" style={{ color: "var(--text-1)" }}>
            Compliance calendar
          </p>
          <p className="text-[11px] mt-0.5" style={{ color: "var(--text-4)" }}>
            GST · TDS · MIS · Bank recon — tap a date to filter clients affected
          </p>
        </div>
      </div>
      <div className="flex gap-2 overflow-x-auto pb-2" style={{ scrollbarWidth: "thin" }}>
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
              onClick={() => onPick(day.items[0].clients[0] ?? "")}
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
                  <p key={i} className="text-[10px] font-semibold truncate" style={{ color: "var(--text-1)" }}>
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
   Industry mix donut
   ══════════════════════════════════════════════════════════════════ */
function IndustryMixCard({ mix }: { mix: ReturnType<typeof computeIndustryMix> }) {
  const size = 100;
  const radius = 38;
  const strokeWidth = 10;
  const circumference = 2 * Math.PI * radius;
  const total = mix.reduce((s, m) => s + m.value, 0);
  const topGroup = mix[0];

  // Precompute slice offsets purely (React 19 purity-safe).
  const slices = mix.reduce<Array<{ group: string; color: string; dash: number; offset: number }>>(
    (acc, m) => {
      const cumulative = acc.reduce((s, a) => s + a.dash, 0) / circumference;
      return [
        ...acc,
        { group: m.group, color: m.color, dash: m.pct * circumference, offset: -cumulative * circumference },
      ];
    },
    [],
  );

  return (
    <div
      className="rounded-md p-4"
      style={{ background: "var(--bg-surface)", border: "1px solid var(--border)" }}
    >
      <p className="text-[10px] uppercase tracking-wider font-bold mb-3" style={{ color: "var(--text-4)" }}>
        Revenue mix by industry
      </p>
      <div className="flex items-center gap-5 flex-wrap">
        <div className="relative flex-shrink-0" style={{ width: size, height: size }}>
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
            <p className="text-sm font-bold tabular-nums" style={{ color: "var(--text-1)", fontFamily: "'Space Grotesk', sans-serif" }}>
              ₹{(total / 1e7).toFixed(1)}Cr
            </p>
            <p className="text-[9px]" style={{ color: "var(--text-4)" }}>total</p>
          </div>
        </div>
        <div className="flex-1 min-w-[200px] grid grid-cols-2 gap-x-4 gap-y-1">
          {mix.slice(0, 8).map((m) => (
            <div key={m.group} className="flex items-center justify-between text-[11px]">
              <span className="inline-flex items-center gap-1.5 min-w-0">
                <span className="w-2 h-2 rounded-sm flex-shrink-0" style={{ background: m.color }} />
                <span className="truncate" style={{ color: "var(--text-2)" }}>{m.group}</span>
              </span>
              <span className="tabular-nums font-semibold ml-2" style={{ color: "var(--text-3)" }}>
                {Math.round(m.pct * 100)}%
              </span>
            </div>
          ))}
        </div>
      </div>
      {topGroup && (
        <p className="text-[10px] mt-3 pt-3" style={{ color: "var(--text-4)", borderTop: "1px solid var(--border)" }}>
          Top: <strong style={{ color: topGroup.color }}>{topGroup.group}</strong> — {Math.round(topGroup.pct * 100)}% concentration
        </p>
      )}
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════════
   Filter chip
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
   Cards view
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
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
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
  const actionColor = nextActionColor(c.status);

  return (
    <motion.div
      initial={{ opacity: 0, y: 14 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.1 }}
      transition={{ duration: 0.35, delay: Math.min(index * 0.03, 0.3) }}
      whileHover={{ y: -2 }}
      className="relative rounded-md overflow-hidden cursor-pointer transition-shadow hover:shadow-xl"
      style={{
        background: "var(--bg-surface)",
        border: `1px solid ${isSelected ? "color-mix(in srgb, var(--green) 40%, transparent)" : "var(--border)"}`,
        outline: isSelected ? "2px solid var(--green)" : "none",
      }}
    >
      <div className="absolute left-0 top-0 bottom-0 w-1" style={{ background: sColor }} />

      <div className="pl-4 pr-3 py-3 flex flex-col gap-2.5">
        {/* Row 1: checkbox + name + status */}
        <div className="flex items-start gap-2">
          <input
            type="checkbox"
            checked={isSelected}
            onChange={(e) => { e.stopPropagation(); onToggleSelect(); }}
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
                    style={{ background: sColor, boxShadow: `0 0 0 3px color-mix(in srgb, ${sColor} 20%, transparent)` }}
                  />
                  <p className="text-sm font-bold leading-tight truncate" style={{ color: "var(--text-1)" }}>
                    {c.name}
                  </p>
                </div>
                <p className="text-[10px] mt-0.5" style={{ color: "var(--text-4)" }}>
                  {c.industry}
                </p>
              </div>
              <span
                className="text-[9px] font-bold px-1.5 py-0.5 rounded flex-shrink-0"
                style={{ color: sColor, background: `color-mix(in srgb, ${sColor} 14%, transparent)` }}
              >
                {statusLabel[c.status]}
              </span>
            </div>
          </div>
        </div>

        {/* Row 2: KPIs — Revenue (with YoY + sparkline) / P&L / Health */}
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
            {c.revenueTrend.some((v) => v > 0) && (
              <Sparkline data={c.revenueTrend} color={c.revenueYoY >= 0 ? "var(--green)" : "var(--red)"} />
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
        </div>

        {/* Row 3: Next action (derived from issues + status) */}
        <div
          className="rounded-lg p-2 flex items-start gap-2"
          style={{
            background: `color-mix(in srgb, ${actionColor} 10%, transparent)`,
            border: `1px solid color-mix(in srgb, ${actionColor} 25%, transparent)`,
          }}
          onClick={onOpen}
        >
          <span
            className="text-[9px] uppercase tracking-wider font-bold px-1.5 py-0.5 rounded flex-shrink-0 mt-0.5"
            style={{ background: actionColor, color: "#fff" }}
          >
            {c.nextAction.verb}
          </span>
          <div className="flex-1 min-w-0">
            <p className="text-[11px] font-semibold truncate" style={{ color: "var(--text-1)" }}>
              {c.nextAction.detail}
            </p>
            {c.nextAction.deadline && (
              <p className="text-[10px]" style={{ color: actionColor }}>
                Due {new Date(c.nextAction.deadline).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}
              </p>
            )}
          </div>
        </div>

        {/* Footer: MIS status + sync + Open */}
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
            </span>
          </div>
          <button
            onClick={(e) => { e.stopPropagation(); onOpen(); }}
            className="inline-flex items-center gap-0.5 text-[11px] font-semibold cursor-pointer"
            style={{ color: "var(--green)" }}
          >
            Open
            <ArrowRight size={11} />
          </button>
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
      className="rounded-md overflow-hidden"
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
              <th className="px-3 py-2.5 text-left font-semibold uppercase tracking-wider" style={{ color: "var(--text-4)" }}>Next action</th>
              <th className="px-3 py-2.5 text-center font-semibold uppercase tracking-wider" style={{ color: "var(--text-4)" }}>MIS</th>
              <th className="px-3 py-2.5 text-right font-semibold uppercase tracking-wider" style={{ color: "var(--text-4)" }}>Sync</th>
            </tr>
          </thead>
          <tbody>
            {clients.map((c, i) => {
              const netPLPositive = c.netPL.trim().startsWith("+");
              const healthColor =
                c.healthScore >= 75 ? "var(--green)" : c.healthScore >= 55 ? "var(--yellow)" : "var(--red)";
              const isSelected = selected.has(c.id);
              const actionColor = nextActionColor(c.status);
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
                      <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: statusColor[c.status] }} />
                      <div className="min-w-0">
                        <p className="font-semibold truncate" style={{ color: "var(--text-1)" }}>{c.name}</p>
                        <p className="text-[10px]" style={{ color: "var(--text-4)" }}>{c.industry}</p>
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
                  <td className="px-3 py-2.5">
                    <div className="flex items-center gap-1.5">
                      <span
                        className="text-[9px] uppercase tracking-wider font-bold px-1 py-0.5 rounded flex-shrink-0"
                        style={{ background: actionColor, color: "#fff" }}
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
   Calendar view — month grid of compliance events
   ══════════════════════════════════════════════════════════════════ */
function ClientCalendarView({
  calendar,
}: {
  calendar: ReturnType<typeof computeComplianceCalendar>;
}) {
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
      className="rounded-md p-4"
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
                <p key={i} className="text-[9px] truncate font-semibold" style={{ color: "var(--text-2)" }}>
                  {e.filing}
                </p>
              ))}
              {d.events.length > 2 && (
                <p className="text-[8px]" style={{ color: "var(--text-4)" }}>+{d.events.length - 2}</p>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════════
   Bulk action bar — production 3 CTAs, dynamic count on selection
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
      className="sticky bottom-4 rounded-md p-3 md:p-4"
      style={{
        background: hasSelection
          ? "color-mix(in srgb, var(--green) 8%, var(--bg-surface))"
          : "var(--bg-surface)",
        border: `1px solid ${hasSelection ? "var(--text-3)" : "var(--border)"}`,
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
            {hasSelection ? `WhatsApp ${selectedCount}` : "Bulk WhatsApp month-end updates"}
          </button>
          <button
            className="inline-flex items-center gap-1.5 text-[12px] font-semibold px-3 py-2 rounded-lg cursor-pointer"
            style={{ background: "transparent", border: "1px solid var(--border)", color: "var(--text-2)" }}
          >
            <FileSpreadsheet size={13} />
            {hasSelection ? "Export" : "Export portfolio summary"}
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
