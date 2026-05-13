"use client";

import { useState, useRef, useEffect } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  Users,
  UserPlus,
  CheckCircle2,
  Clock,
  Mail,
  MessageCircle,
  Link as LinkIcon,
  Send,
  Edit3,
  Trash2,
  FileSpreadsheet,
  Eye,
  ShieldCheck,
  X,
  ChevronDown,
  Circle,
  CreditCard,
  Puzzle,
  Key,
  Bell,
  UserCircle,
  Upload,
  Download,
  EyeOff,
  Copy,
  RefreshCw,
  Camera,
  Shield,
  Check,
  AlertCircle,
  Plus,
  Activity,
  Info,
  ChevronRight,
  Search,
  Pause,
  Phone,
  ArrowRight,
} from "lucide-react";
import {
  TEAM_MEMBERS,
  ROLES,
  ROLE_LIST,
  ACTIVITY_LOG,
  type Role,
  type TeamMember,
  type MemberStatus,
} from "@/lib/rbac";
import {
  PENDING_INVITE_EXPIRY_DAYS,
  REMINDER_AUTOMATION_DEFAULTS,
  REMINDER_ANALYTICS_30D,
  REMINDER_TEMPLATES,
  RECEIVABLES,
  K,
  renderTemplate,
  cleanCompanyName,
  computeReminderLiveState,
  computeReminderSetupGate,
  computeReminderAttribution,
  computeAvgTimeToPayDays,
  bestReplyChannel,
  computeReminderSchedule,
  computeContactsCoverage,
  buildReminderMonitor,
  filterMonitorRows,
  getTemplateApproval,
  TEMPLATE_REVIEWERS,
  REMINDER_MONITOR_FILTERS,
  REMINDER_TONE_PRESETS,
  REMINDER_TRIGGER_PRESETS,
  REMINDER_COLUMN_PRESETS,
  ordinalDay,
  nextBatchDateLabel,
  CONTACT_ROLE_LABELS,
  CONTACT_ROLE_COLORS,
  COMPANY,
  formatINR,
  type ReminderAutomationRules,
  type ReminderTone,
  type ReminderChannel,
  type ReminderTriggerType,
  type ReminderRecipient,
  type ReminderRecipientStrategy,
  type ReminderMonitorRow,
  type ReminderMonitorFilter,
  type ContactRole,
  type TemplateApprovalStatus,
  type TemplateApprovalMeta,
  type ScheduledReminder,
} from "@/lib/data";
import { BulkImportModal } from "@/components/ui/bulk-import-modal";
import { ContactManagerDrawer } from "@/components/ui/contact-manager-drawer";
import { LedgerPickerModal } from "@/components/ui/ledger-picker-modal";
import { useRbac } from "@/lib/rbac-context";

/* ------------------------------------------------------------------ */
/*  Tab definitions                                                   */
/* ------------------------------------------------------------------ */
type SettingsTab =
  | "team"
  | "profile"
  | "billing"
  | "integrations"
  | "api"
  | "notifications"
  | "approvals"
  | "reminders";

const SETTINGS_TABS: { id: SettingsTab; label: string; icon: React.ElementType }[] = [
  { id: "team", label: "Team", icon: Users },
  { id: "approvals", label: "Approvals", icon: ShieldCheck },
  { id: "reminders", label: "Reminders", icon: MessageCircle },
  { id: "profile", label: "Profile", icon: UserCircle },
  { id: "billing", label: "Billing", icon: CreditCard },
  { id: "integrations", label: "Integrations", icon: Puzzle },
  { id: "api", label: "API Keys", icon: Key },
  { id: "notifications", label: "Notifications", icon: Bell },
];

/* ------------------------------------------------------------------ */
/*  Status pill color map                                             */
/* ------------------------------------------------------------------ */
const statusStyle: Record<MemberStatus, { color: string; label: string }> = {
  active: { color: "var(--green)", label: "Active" },
  pending: { color: "var(--yellow)", label: "Pending" },
  suspended: { color: "var(--red)", label: "Suspended" },
};

/* ================================================================== */
/*  SettingsScreen (exported)                                         */
/* ================================================================== */
export function SettingsScreen() {
  const [activeTab, setActiveTab] = useState<SettingsTab>("team");

  // Listen for cross-screen deep-links to a specific Settings sub-tab.
  // Outstanding's "Auto reminder" button dispatches this so we land on
  // Reminders directly instead of Team. Pattern mirrors the global
  // `riko:navigate` event used between screens.
  useEffect(() => {
    const handler = (e: Event) => {
      const detail = (e as CustomEvent<string>).detail;
      if (typeof detail === "string") {
        const valid: SettingsTab[] = [
          "team", "profile", "billing", "integrations",
          "api", "notifications", "approvals", "reminders",
        ];
        if (valid.includes(detail as SettingsTab)) {
          setActiveTab(detail as SettingsTab);
        }
      }
    };
    window.addEventListener("riko:settings-tab", handler as EventListener);
    return () => window.removeEventListener("riko:settings-tab", handler as EventListener);
  }, []);

  return (
    <div className="min-h-screen pb-24" style={{ background: "var(--bg-primary)" }}>
      <div className="max-w-6xl mx-auto px-4 py-6 flex flex-col gap-5">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.35 }}
        >
          <h1
            className="text-2xl md:text-3xl font-bold"
            style={{
              color: "var(--text-1)",
              fontFamily: "'Space Grotesk', sans-serif",
            }}
          >
            Settings
          </h1>
          <p className="text-sm mt-1" style={{ color: "var(--text-3)" }}>
            Manage your workspace
          </p>
        </motion.div>

        {/* Tab bar */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.3, delay: 0.05 }}
          className="flex gap-1 overflow-x-auto -mx-4 px-4 pb-1"
          style={{ borderBottom: "1px solid var(--border)" }}
        >
          {SETTINGS_TABS.map(({ id, label, icon: Icon }) => {
            const active = activeTab === id;
            return (
              <button
                key={id}
                onClick={() => setActiveTab(id)}
                className="inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-2 rounded-t-lg cursor-pointer transition-colors flex-shrink-0 whitespace-nowrap relative"
                style={{
                  color: active ? "var(--text-1)" : "var(--text-3)",
                  background: active
                    ? "color-mix(in srgb, var(--green) 10%, transparent)"
                    : "transparent",
                }}
                onMouseEnter={(e) => {
                  if (!active)
                    (e.currentTarget as HTMLElement).style.background =
                      "var(--bg-hover)";
                }}
                onMouseLeave={(e) => {
                  if (!active)
                    (e.currentTarget as HTMLElement).style.background =
                      "transparent";
                }}
              >
                <Icon size={13} />
                {label}
                {active && (
                  <span
                    className="absolute left-0 right-0 bottom-0 h-[2px]"
                    style={{ background: "var(--green)" }}
                  />
                )}
              </button>
            );
          })}
        </motion.div>

        {/* Tab content */}
        {activeTab === "team" && <TeamTab />}
        {activeTab === "approvals" && <ApprovalsTab />}
        {activeTab === "reminders" && <RemindersTab />}
        {activeTab === "profile" && <ProfileTab />}
        {activeTab === "billing" && <BillingTab />}
        {activeTab === "integrations" && <IntegrationsTab />}
        {activeTab === "api" && <ApiKeysTab />}
        {activeTab === "notifications" && <NotificationsTab />}
      </div>
    </div>
  );
}

/* ================================================================== */
/*  SectionCard — shared wrapper                                     */
/* ================================================================== */
function SectionCard({
  title,
  subtitle,
  children,
  actions,
}: {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  actions?: React.ReactNode;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.1 }}
      transition={{ duration: 0.4 }}
      className="rounded-md overflow-hidden"
      style={{
        background: "var(--bg-surface)",
        border: "1px solid var(--border)",
      }}
    >
      <div
        className="flex items-center justify-between px-5 py-4 gap-3"
        style={{ borderBottom: "1px solid var(--border)" }}
      >
        <div className="min-w-0">
          <p className="text-sm font-bold" style={{ color: "var(--text-1)" }}>
            {title}
          </p>
          {subtitle && (
            <p className="text-[11px] mt-0.5" style={{ color: "var(--text-4)" }}>
              {subtitle}
            </p>
          )}
        </div>
        {actions}
      </div>
      <div className="p-5">{children}</div>
    </motion.div>
  );
}

/* ================================================================== */
/*  ProfileTab                                                        */
/* ================================================================== */
function ProfileTab() {
  const [twoFA, setTwoFA] = useState(true);
  const [saved, setSaved] = useState(false);
  const [form, setForm] = useState({
    fullName: "Yogesh Patel",
    email: "yogesh@bandrasoap.in",
    phone: "+91 98765 43210",
    role: "Admin / Owner",
    language: "English",
    timezone: "Asia/Kolkata (IST)",
  });

  const update = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setForm((p) => ({ ...p, [k]: e.target.value }));

  const handleSave = () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 2200);
  };

  return (
    <div className="flex flex-col gap-5">
      <SectionCard title="Profile" subtitle="Personal information and preferences">
        <div className="flex flex-col md:flex-row gap-6">
          {/* Avatar */}
          <div className="flex flex-col items-center gap-2 md:w-40 flex-shrink-0">
            <div
              className="rounded-full flex items-center justify-center text-2xl font-bold"
              style={{
                width: 96,
                height: 96,
                background:
                  "linear-gradient(135deg, color-mix(in srgb, var(--purple) 40%, transparent), color-mix(in srgb, var(--purple) 70%, transparent))",
                color: "#fff",
              }}
            >
              {form.fullName.charAt(0)}
            </div>
            <button
              type="button"
              className="inline-flex items-center gap-1 text-[11px] font-semibold px-2.5 py-1.5 rounded-md cursor-pointer transition-colors"
              style={{
                background: "var(--bg-secondary)",
                border: "1px solid var(--border)",
                color: "var(--text-2)",
              }}
            >
              <Camera size={12} />
              Upload photo
            </button>
            <p className="text-[10px] text-center" style={{ color: "var(--text-4)" }}>
              JPG or PNG, max 2MB
            </p>
          </div>

          {/* Form */}
          <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-3">
            <Field label="Full name">
              <TextInput value={form.fullName} onChange={update("fullName")} />
            </Field>
            <Field label="Email">
              <TextInput value={form.email} onChange={update("email")} type="email" />
            </Field>
            <Field label="Phone">
              <TextInput value={form.phone} onChange={update("phone")} />
            </Field>
            <Field label="Role">
              <TextInput value={form.role} readOnly />
            </Field>
            <Field label="Language preference">
              <SelectInput value={form.language} onChange={update("language")}>
                <option>English</option>
                <option>हिंदी</option>
                <option>ગુજરાતી</option>
                <option>मराठी</option>
              </SelectInput>
            </Field>
            <Field label="Timezone">
              <SelectInput value={form.timezone} onChange={update("timezone")}>
                <option>Asia/Kolkata (IST)</option>
                <option>UTC</option>
                <option>America/New_York (EST)</option>
                <option>Europe/London (GMT)</option>
              </SelectInput>
            </Field>
          </div>
        </div>
      </SectionCard>

      <SectionCard title="Security" subtitle="Account and authentication">
        <div className="flex items-center justify-between py-2">
          <div className="flex items-center gap-3">
            <span
              className="flex items-center justify-center rounded-lg flex-shrink-0"
              style={{
                width: 32,
                height: 32,
                background: "var(--bg-hover)",
                color: "var(--green)",
              }}
            >
              <Shield size={16} />
            </span>
            <div>
              <p className="text-xs font-semibold" style={{ color: "var(--text-1)" }}>
                Two-factor authentication
              </p>
              <p className="text-[11px] mt-0.5" style={{ color: "var(--text-4)" }}>
                SMS or authenticator app codes on sign-in
              </p>
            </div>
          </div>
          <Toggle checked={twoFA} onChange={setTwoFA} />
        </div>

        <div
          className="flex items-center justify-between py-2 mt-2"
          style={{ borderTop: "1px solid var(--border)" }}
        >
          <div className="flex items-center gap-3 pt-3">
            <span
              className="flex items-center justify-center rounded-lg flex-shrink-0"
              style={{
                width: 32,
                height: 32,
                background: "color-mix(in srgb, var(--blue) 15%, transparent)",
                color: "var(--blue)",
              }}
            >
              <Key size={16} />
            </span>
            <div>
              <p className="text-xs font-semibold" style={{ color: "var(--text-1)" }}>
                Password
              </p>
              <p className="text-[11px] mt-0.5" style={{ color: "var(--text-4)" }}>
                Last updated 4 months ago
              </p>
            </div>
          </div>
          <button
            type="button"
            className="text-xs font-semibold px-3 py-1.5 rounded-md cursor-pointer transition-colors mt-3"
            style={{
              background: "var(--bg-secondary)",
              border: "1px solid var(--border)",
              color: "var(--text-2)",
            }}
          >
            Change password
          </button>
        </div>
      </SectionCard>

      {/* Save bar */}
      <div className="flex items-center justify-end gap-2">
        <AnimatePresence>
          {saved && (
            <motion.span
              initial={{ opacity: 0, x: 6 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -6 }}
              className="inline-flex items-center gap-1 text-xs font-semibold"
              style={{ color: "var(--green)" }}
            >
              <Check size={13} /> Saved
            </motion.span>
          )}
        </AnimatePresence>
        <button
          type="button"
          onClick={handleSave}
          className="inline-flex items-center gap-1.5 text-xs font-semibold px-4 py-2 rounded-lg cursor-pointer transition-opacity hover:opacity-90"
          style={{
            background: "var(--green)",
            color: "#052E16",
          }}
        >
          <Check size={13} />
          Save changes
        </button>
      </div>
    </div>
  );
}

/* ================================================================== */
/*  BillingTab                                                        */
/* ================================================================== */
function BillingTab() {
  const invoices = [
    { id: "inv-2603", period: "March 2026", amount: "₹1,666.67", date: "1 Mar 2026", status: "Paid" },
    { id: "inv-2602", period: "February 2026", amount: "₹1,666.67", date: "1 Feb 2026", status: "Paid" },
    { id: "inv-2601", period: "January 2026", amount: "₹1,666.67", date: "1 Jan 2026", status: "Paid" },
  ];

  return (
    <div className="flex flex-col gap-5">
      {/* Current plan */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.4 }}
        className="rounded-md overflow-hidden"
        style={{
          background:
            "linear-gradient(135deg, color-mix(in srgb, var(--purple) 10%, var(--bg-surface)) 0%, var(--bg-surface) 100%)",
          border: "1px solid color-mix(in srgb, var(--purple) 30%, var(--border))",
        }}
      >
        <div className="h-0.5" style={{ background: "var(--purple)" }} />
        <div className="p-5 flex flex-wrap items-center justify-between gap-3">
          <div className="min-w-0">
            <span
              className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded"
              style={{
                background: "color-mix(in srgb, var(--purple) 18%, transparent)",
                color: "var(--purple)",
              }}
            >
              Current plan
            </span>
            <p
              className="text-xl font-bold mt-2"
              style={{
                color: "var(--text-1)",
                fontFamily: "'Space Grotesk', sans-serif",
              }}
            >
              Teams plan · ₹20,000/year
            </p>
            <p className="text-xs mt-1" style={{ color: "var(--text-3)" }}>
              Renews 1 Feb 2026 · up to 10 seats · unlimited clients
            </p>
          </div>
          <button
            type="button"
            className="inline-flex items-center gap-1.5 text-xs font-semibold px-4 py-2 rounded-lg cursor-pointer transition-opacity hover:opacity-90"
            style={{
              background: "var(--purple)",
              color: "#fff",
            }}
          >
            Upgrade to Enterprise
          </button>
        </div>
      </motion.div>

      {/* Usage */}
      <SectionCard title="Usage this month" subtitle="April 2026">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <UsageBar label="Seats" used={7} total={10} unit="seats" color="var(--purple)" />
          <UsageBar label="API calls" used={2340} total={10000} unit="calls" color="var(--blue)" />
        </div>
      </SectionCard>

      {/* Payment method */}
      <SectionCard title="Payment method" subtitle="Card on file for renewals">
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <div className="flex items-center gap-3 min-w-0">
            <span
              className="flex items-center justify-center rounded-lg flex-shrink-0"
              style={{
                width: 40,
                height: 28,
                background: "linear-gradient(135deg, #1e3a8a, #2563eb)",
                color: "#fff",
              }}
            >
              <CreditCard size={14} />
            </span>
            <div className="min-w-0">
              <p className="text-xs font-semibold" style={{ color: "var(--text-1)" }}>
                HDFC Credit Card ending 4532
              </p>
              <p className="text-[11px] mt-0.5" style={{ color: "var(--text-4)" }}>
                Expires 09/27 · Y. Patel
              </p>
            </div>
          </div>
          <button
            type="button"
            className="text-xs font-semibold px-3 py-1.5 rounded-md cursor-pointer transition-colors"
            style={{
              background: "var(--bg-secondary)",
              border: "1px solid var(--border)",
              color: "var(--text-2)",
            }}
          >
            Update
          </button>
        </div>
      </SectionCard>

      {/* Invoices */}
      <SectionCard title="Invoices" subtitle="Download recent billing statements">
        <div className="overflow-x-auto -mx-5">
          <table className="w-full text-xs">
            <thead>
              <tr style={{ borderBottom: "1px solid var(--border)" }}>
                <TH>Invoice #</TH>
                <TH>Period</TH>
                <TH>Date</TH>
                <TH>Amount</TH>
                <TH>Status</TH>
                <TH className="text-right">Actions</TH>
              </tr>
            </thead>
            <tbody>
              {invoices.map((inv, i) => (
                <tr
                  key={inv.id}
                  style={{
                    borderBottom:
                      i < invoices.length - 1 ? "1px solid var(--border)" : "none",
                  }}
                >
                  <td className="px-4 py-3 font-semibold tabular-nums" style={{ color: "var(--text-1)" }}>
                    {inv.id.toUpperCase()}
                  </td>
                  <td className="px-4 py-3" style={{ color: "var(--text-2)" }}>{inv.period}</td>
                  <td className="px-4 py-3 tabular-nums" style={{ color: "var(--text-3)" }}>{inv.date}</td>
                  <td className="px-4 py-3 tabular-nums" style={{ color: "var(--text-1)" }}>{inv.amount}</td>
                  <td className="px-4 py-3">
                    <span
                      className="inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full"
                      style={{
                        background: "var(--bg-hover)",
                        border: "1px solid color-mix(in srgb, var(--green) 30%, transparent)",
                        color: "var(--green)",
                      }}
                    >
                      <Check size={10} />
                      {inv.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <button
                      type="button"
                      className="inline-flex items-center gap-1 text-[11px] font-semibold px-2.5 py-1 rounded-md cursor-pointer transition-colors"
                      style={{
                        background: "color-mix(in srgb, var(--green) 12%, transparent)",
                        color: "var(--green)",
                      }}
                    >
                      <Download size={11} />
                      Download
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </SectionCard>
    </div>
  );
}

function UsageBar({
  label,
  used,
  total,
  unit,
  color,
}: {
  label: string;
  used: number;
  total: number;
  unit: string;
  color: string;
}) {
  const pct = Math.min((used / total) * 100, 100);
  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold" style={{ color: "var(--text-1)" }}>
          {label}
        </span>
        <span className="text-[11px] tabular-nums" style={{ color: "var(--text-3)" }}>
          <span style={{ color: "var(--text-1)", fontWeight: 600 }}>{used.toLocaleString("en-IN")}</span>
          {" / "}
          {total.toLocaleString("en-IN")} {unit}
        </span>
      </div>
      <div
        className="h-2 rounded-full overflow-hidden"
        style={{ background: `color-mix(in srgb, ${color} 15%, transparent)` }}
      >
        <motion.div
          initial={{ width: 0 }}
          whileInView={{ width: `${pct}%` }}
          viewport={{ once: true }}
          transition={{ duration: 0.9, ease: "easeOut" }}
          className="h-full rounded-full"
          style={{ background: color }}
        />
      </div>
      <p className="text-[10px]" style={{ color: "var(--text-4)" }}>
        {pct.toFixed(0)}% used
      </p>
    </div>
  );
}

/* ================================================================== */
/*  IntegrationsTab                                                   */
/* ================================================================== */
function IntegrationsTab() {
  const integrations = [
    { id: "tally", name: "Tally Prime", desc: "Auto-sync vouchers every 2 hours", connected: true, color: "var(--blue)", logo: "T" },
    { id: "infini", name: "INFINI GST", desc: "GSTR-1, 3B, 2B filing APIs", connected: true, color: "var(--green)", logo: "G" },
    { id: "wame", name: "WAMe (WhatsApp)", desc: "Meta WABA — purpose-built for WhatsApp throughput", connected: true, color: "#25D366", logo: "W" },
    { id: "msg91", name: "MSG91 (Email + SMS)", desc: "Resend email + TRAI DLT SMS", connected: true, color: "var(--blue)", logo: "M" },
    { id: "razorpay", name: "Razorpay", desc: "Payment gateway settlements", connected: false, color: "var(--purple)", logo: "R" },
    { id: "zoho", name: "Zoho Books", desc: "Alternative to Tally sync", connected: false, color: "var(--red)", logo: "Z" },
    { id: "hdfc", name: "HDFC Bank API", desc: "Auto-pull bank statements", connected: false, color: "var(--orange)", logo: "H" },
  ];

  return (
    <div className="flex flex-col gap-5">
      <SectionCard
        title="Integrations"
        subtitle={`${integrations.filter((i) => i.connected).length} of ${integrations.length} connected`}
      >
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {integrations.map((intg, i) => (
            <motion.div
              key={intg.id}
              initial={{ opacity: 0, y: 10 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.2 }}
              transition={{ duration: 0.35, delay: i * 0.04 }}
              className="rounded-md p-4 flex flex-col gap-3"
              style={{
                background: intg.connected
                  ? `color-mix(in srgb, ${intg.color} 8%, var(--bg-secondary))`
                  : "var(--bg-secondary)",
                border: `1px solid ${
                  intg.connected
                    ? `color-mix(in srgb, ${intg.color} 30%, var(--border))`
                    : "var(--border)"
                }`,
              }}
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-2.5 min-w-0">
                  <span
                    className="flex items-center justify-center rounded-lg flex-shrink-0 font-bold text-sm"
                    style={{
                      width: 36,
                      height: 36,
                      background: `color-mix(in srgb, ${intg.color} 20%, transparent)`,
                      border: `1px solid color-mix(in srgb, ${intg.color} 35%, transparent)`,
                      color: intg.color,
                    }}
                  >
                    {intg.logo}
                  </span>
                  <div className="min-w-0">
                    <p className="text-sm font-bold" style={{ color: "var(--text-1)" }}>
                      {intg.name}
                    </p>
                    {intg.connected ? (
                      <span
                        className="inline-flex items-center gap-1 text-[10px] font-semibold mt-0.5"
                        style={{ color: "var(--green)" }}
                      >
                        <Check size={10} strokeWidth={3} />
                        Connected
                      </span>
                    ) : (
                      <span
                        className="inline-flex items-center gap-1 text-[10px] font-semibold mt-0.5"
                        style={{ color: "var(--text-4)" }}
                      >
                        Not connected
                      </span>
                    )}
                  </div>
                </div>
              </div>
              <p className="text-[11px] leading-snug" style={{ color: "var(--text-3)" }}>
                {intg.desc}
              </p>
              <button
                type="button"
                className="text-xs font-semibold px-3 py-1.5 rounded-md cursor-pointer transition-colors mt-auto"
                style={{
                  background: intg.connected
                    ? "transparent"
                    : `color-mix(in srgb, ${intg.color} 15%, transparent)`,
                  border: `1px solid color-mix(in srgb, ${intg.color} 35%, transparent)`,
                  color: intg.color,
                }}
              >
                {intg.connected ? "Configure" : "Connect"}
              </button>
            </motion.div>
          ))}
        </div>
      </SectionCard>
    </div>
  );
}

/* ================================================================== */
/*  ApiKeysTab                                                        */
/* ================================================================== */
function ApiKeysTab() {
  const initialKeys = [
    {
      id: "k1",
      name: "Production key",
      secret: "riko_live_sk_8f2a91b3d7e5c4908671fa22abc9cc10",
      created: "15 Feb 2025",
      lastUsed: "2h ago",
    },
    {
      id: "k2",
      name: "Dev key",
      secret: "riko_test_sk_3b2c91ad9e7f1204568c33de10abfe91",
      created: "1 Mar 2025",
      lastUsed: "3d ago",
    },
  ];

  const [keys, setKeys] = useState(initialKeys);
  const [visible, setVisible] = useState<Record<string, boolean>>({});
  const [copied, setCopied] = useState<string | null>(null);

  const toggleVisible = (id: string) => setVisible((p) => ({ ...p, [id]: !p[id] }));

  const copy = (id: string, value: string) => {
    if (typeof navigator !== "undefined" && navigator.clipboard) {
      navigator.clipboard.writeText(value).catch(() => undefined);
    }
    setCopied(id);
    setTimeout(() => setCopied(null), 1400);
  };

  const mask = (v: string) => v.slice(0, 12) + "•".repeat(Math.max(v.length - 16, 6)) + v.slice(-4);

  return (
    <div className="flex flex-col gap-5">
      <SectionCard
        title="API Keys"
        subtitle="Programmatic access to your workspace"
        actions={
          <button
            type="button"
            className="inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-2 rounded-lg cursor-pointer transition-opacity hover:opacity-90"
            style={{
              background: "var(--green)",
              color: "#052E16",
            }}
          >
            <Plus size={13} />
            Generate new API key
          </button>
        }
      >
        <div className="overflow-x-auto -mx-5">
          <table className="w-full text-xs">
            <thead>
              <tr style={{ borderBottom: "1px solid var(--border)" }}>
                <TH>Name</TH>
                <TH>Key</TH>
                <TH>Created</TH>
                <TH>Last used</TH>
                <TH className="text-right">Actions</TH>
              </tr>
            </thead>
            <tbody>
              {keys.map((k, i) => (
                <tr
                  key={k.id}
                  style={{
                    borderBottom:
                      i < keys.length - 1 ? "1px solid var(--border)" : "none",
                  }}
                >
                  <td className="px-4 py-3">
                    <p className="text-xs font-semibold" style={{ color: "var(--text-1)" }}>
                      {k.name}
                    </p>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <code
                        className="text-[11px] px-2 py-1 rounded tabular-nums"
                        style={{
                          background: "var(--bg-secondary)",
                          color: "var(--text-2)",
                          fontFamily: "'SF Mono', Consolas, monospace",
                        }}
                      >
                        {visible[k.id] ? k.secret : mask(k.secret)}
                      </code>
                      <IconBtn
                        title={visible[k.id] ? "Hide" : "Show"}
                        onClick={() => toggleVisible(k.id)}
                      >
                        {visible[k.id] ? <EyeOff size={13} /> : <Eye size={13} />}
                      </IconBtn>
                      <IconBtn title="Copy" onClick={() => copy(k.id, k.secret)}>
                        {copied === k.id ? (
                          <Check size={13} style={{ color: "var(--green)" }} />
                        ) : (
                          <Copy size={13} />
                        )}
                      </IconBtn>
                    </div>
                  </td>
                  <td className="px-4 py-3 tabular-nums" style={{ color: "var(--text-3)" }}>
                    {k.created}
                  </td>
                  <td className="px-4 py-3 tabular-nums" style={{ color: "var(--text-3)" }}>
                    {k.lastUsed}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <button
                      type="button"
                      onClick={() => setKeys((p) => p.filter((x) => x.id !== k.id))}
                      className="inline-flex items-center gap-1 text-[11px] font-semibold px-2.5 py-1 rounded-md cursor-pointer transition-colors"
                      style={{
                        background: "color-mix(in srgb, var(--red) 12%, transparent)",
                        color: "var(--red)",
                      }}
                    >
                      <RefreshCw size={11} />
                      Revoke
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div
          className="flex items-start gap-2 mt-4 px-3 py-2.5 rounded-lg"
          style={{
            background: "color-mix(in srgb, var(--yellow) 10%, transparent)",
            border: "1px solid color-mix(in srgb, var(--yellow) 25%, transparent)",
          }}
        >
          <AlertCircle size={13} style={{ color: "var(--yellow)", marginTop: 2 }} />
          <p className="text-[11px] leading-relaxed" style={{ color: "var(--text-2)" }}>
            Treat API keys like passwords. Never commit them to Git or share them in chat.
          </p>
        </div>
      </SectionCard>
    </div>
  );
}

/* ================================================================== */
/*  NotificationsTab                                                  */
/* ================================================================== */
function NotificationsTab() {
  type Group = {
    id: string;
    label: string;
    icon: React.ReactNode;
    color: string;
    items: { id: string; label: string; desc: string; checked: boolean }[];
  };

  const initial: Group[] = [
    {
      id: "whatsapp",
      label: "WhatsApp",
      icon: <MessageCircle size={14} />,
      color: "#25D366",
      items: [
        { id: "wa-received", label: "Payment received", desc: "When a customer pays an invoice", checked: true },
        { id: "wa-overdue", label: "Overdue reminders", desc: "Auto-send to parties >30 days overdue", checked: true },
        { id: "wa-summary", label: "Weekly summary", desc: "Cash, AR, AP snapshot every Monday 9am", checked: true },
        { id: "wa-gst", label: "GST filing alerts", desc: "3 days before each GSTR deadline", checked: true },
      ],
    },
    {
      id: "email",
      label: "Email",
      icon: <Mail size={14} />,
      color: "var(--blue)",
      items: [
        { id: "em-mis", label: "MIS reports", desc: "Monthly MIS PDF, 1st of each month", checked: true },
        { id: "em-invite", label: "Invite expiring", desc: "Pending invites about to expire", checked: false },
        { id: "em-activity", label: "Team activity", desc: "Daily digest of team logins and actions", checked: false },
      ],
    },
    {
      id: "push",
      label: "Push (mobile)",
      icon: <Bell size={14} />,
      color: "var(--orange)",
      items: [
        { id: "pu-urgent", label: "Urgent alerts", desc: "Cash < 10 days, GST missed, compliance", checked: true },
      ],
    },
    {
      id: "inapp",
      label: "In-app",
      icon: <Circle size={14} />,
      color: "var(--purple)",
      items: [
        { id: "in-all", label: "Everything", desc: "All notifications show in the bell menu", checked: true },
      ],
    },
  ];

  const [groups, setGroups] = useState(initial);

  const toggle = (groupId: string, itemId: string) =>
    setGroups((prev) =>
      prev.map((g) =>
        g.id === groupId
          ? {
              ...g,
              items: g.items.map((it) =>
                it.id === itemId ? { ...it, checked: !it.checked } : it
              ),
            }
          : g
      )
    );

  return (
    <div className="flex flex-col gap-5">
      {groups.map((g) => (
        <SectionCard
          key={g.id}
          title={g.label}
          subtitle={`${g.items.filter((i) => i.checked).length} of ${g.items.length} enabled`}
          actions={
            <span
              className="inline-flex items-center justify-center rounded-lg flex-shrink-0"
              style={{
                width: 32,
                height: 32,
                background: `color-mix(in srgb, ${g.color} 15%, transparent)`,
                color: g.color,
              }}
            >
              {g.icon}
            </span>
          }
        >
          <div className="flex flex-col divide-y" style={{ borderColor: "var(--border)" }}>
            {g.items.map((it, i) => (
              <div
                key={it.id}
                className="flex items-center justify-between py-3 gap-3"
                style={{
                  borderBottom:
                    i < g.items.length - 1 ? "1px solid var(--border)" : "none",
                }}
              >
                <div className="min-w-0">
                  <p className="text-xs font-semibold" style={{ color: "var(--text-1)" }}>
                    {it.label}
                  </p>
                  <p className="text-[11px] mt-0.5" style={{ color: "var(--text-4)" }}>
                    {it.desc}
                  </p>
                </div>
                <Toggle checked={it.checked} onChange={() => toggle(g.id, it.id)} color={g.color} />
              </div>
            ))}
          </div>
        </SectionCard>
      ))}
    </div>
  );
}

/* ================================================================== */
/*  Small reusable form primitives                                    */
/* ================================================================== */
function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="flex flex-col gap-1">
      <span
        className="text-[10px] uppercase tracking-wider font-medium"
        style={{ color: "var(--text-4)" }}
      >
        {label}
      </span>
      {children}
    </label>
  );
}

function TextInput({
  value,
  onChange,
  type = "text",
  readOnly,
}: {
  value: string;
  onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
  type?: string;
  readOnly?: boolean;
}) {
  return (
    <input
      type={type}
      value={value}
      onChange={onChange}
      readOnly={readOnly}
      className="text-xs px-3 py-2 rounded-lg outline-none transition-colors"
      style={{
        background: readOnly ? "var(--bg-hover)" : "var(--bg-secondary)",
        border: "1px solid var(--border)",
        color: "var(--text-1)",
        cursor: readOnly ? "not-allowed" : "text",
      }}
      onFocus={(e) => {
        if (!readOnly) e.currentTarget.style.borderColor = "var(--green)";
      }}
      onBlur={(e) => {
        e.currentTarget.style.borderColor = "var(--border)";
      }}
    />
  );
}

function SelectInput({
  value,
  onChange,
  children,
}: {
  value: string;
  onChange: (e: React.ChangeEvent<HTMLSelectElement>) => void;
  children: React.ReactNode;
}) {
  return (
    <select
      value={value}
      onChange={onChange}
      className="text-xs px-3 py-2 rounded-lg outline-none transition-colors cursor-pointer"
      style={{
        background: "var(--bg-secondary)",
        border: "1px solid var(--border)",
        color: "var(--text-1)",
      }}
    >
      {children}
    </select>
  );
}

function Toggle({
  checked,
  onChange,
  color = "var(--green)",
}: {
  checked: boolean;
  onChange: (next: boolean) => void;
  color?: string;
}) {
  return (
    <button
      type="button"
      onClick={() => onChange(!checked)}
      role="switch"
      aria-checked={checked}
      className="relative flex-shrink-0 cursor-pointer transition-colors rounded-full"
      style={{
        width: 36,
        height: 20,
        background: checked ? color : "var(--border)",
      }}
    >
      <motion.span
        layout
        transition={{ type: "spring", stiffness: 500, damping: 30 }}
        className="absolute rounded-full"
        style={{
          width: 14,
          height: 14,
          top: 3,
          left: checked ? 19 : 3,
          background: "#fff",
          boxShadow: "0 1px 2px rgba(0,0,0,0.3)",
        }}
      />
    </button>
  );
}

/* ================================================================== */
/*  TeamTab                                                           */
/* ================================================================== */
function TeamTab() {
  const { setRole } = useRbac();
  const [members, setMembers] = useState<TeamMember[]>(TEAM_MEMBERS);
  const [toast, setToast] = useState<string | null>(null);
  const [confirmRemove, setConfirmRemove] = useState<TeamMember | null>(null);
  const [bulkOpen, setBulkOpen] = useState(false);

  /* Invite form */
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState<Role>("sales");
  const [roleDropdownOpen, setRoleDropdownOpen] = useState(false);
  const roleDropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!roleDropdownOpen) return;
    const handler = (e: MouseEvent) => {
      if (!roleDropdownRef.current) return;
      if (!roleDropdownRef.current.contains(e.target as Node))
        setRoleDropdownOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [roleDropdownOpen]);

  /* Auto-dismiss toast */
  useEffect(() => {
    if (!toast) return;
    const id = setTimeout(() => setToast(null), 3000);
    return () => clearTimeout(id);
  }, [toast]);

  const handleSendInvite = () => {
    const target = inviteEmail.trim() || "new.member@bandrasoap.in";
    setToast(`Invitation sent to ${target} as ${ROLES[inviteRole].name}`);
    setInviteEmail("");
  };

  const handleChangeRole = (memberId: string, newRole: Role) => {
    setMembers((prev) =>
      prev.map((m) => (m.id === memberId ? { ...m, role: newRole } : m))
    );
  };

  const handleConfirmRemove = () => {
    if (!confirmRemove) return;
    setMembers((prev) => prev.filter((m) => m.id !== confirmRemove.id));
    setConfirmRemove(null);
  };

  /* Stats */
  const total = members.length;
  const active = members.filter((m) => m.status === "active").length;
  const pending = members.filter((m) => m.status === "pending").length;
  const seatsUsed = total;
  const seatsTotal = 10;
  const seatsPct = (seatsUsed / seatsTotal) * 100;

  return (
    <div className="flex flex-col gap-5">
      {/* ============ Summary stats row ============ */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <StatCard
          title="Total Members"
          value={String(total)}
          icon={<Users size={16} />}
          accent="var(--blue)"
        />
        <StatCard
          title="Active"
          value={String(active)}
          icon={<CheckCircle2 size={16} />}
          accent="var(--green)"
        />
        <StatCard
          title="Pending Invites"
          value={String(pending)}
          icon={<Clock size={16} />}
          accent="var(--yellow)"
        />
        <StatCard
          title="Seats Used"
          value={`${seatsUsed} of ${seatsTotal}`}
          icon={<ShieldCheck size={16} />}
          accent="var(--purple)"
          extra={
            <div
              className="h-1 rounded-full mt-2 overflow-hidden"
              style={{
                background: "color-mix(in srgb, var(--purple) 15%, transparent)",
              }}
            >
              <motion.div
                initial={{ width: 0 }}
                whileInView={{ width: `${seatsPct}%` }}
                viewport={{ once: true }}
                transition={{ duration: 0.8, ease: "easeOut" }}
                className="h-full rounded-full"
                style={{ background: "var(--purple)" }}
              />
            </div>
          }
        />
      </div>

      {/* ============ Invite card ============ */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, amount: 0.2 }}
        transition={{ duration: 0.4 }}
        className="rounded-md overflow-hidden"
        style={{
          background:
            "linear-gradient(135deg, color-mix(in srgb, var(--green) 8%, var(--bg-surface)) 0%, var(--bg-surface) 100%)",
          border: "1px solid var(--text-3)",
        }}
      >
        <div className="h-0.5" style={{ background: "var(--green)" }} />
        <div className="p-5 flex flex-col gap-3">
          <div className="flex items-center gap-2">
            <span
              className="flex items-center justify-center rounded-lg flex-shrink-0"
              style={{
                width: 28,
                height: 28,
                background: "var(--bg-hover)",
                color: "var(--green)",
              }}
            >
              <UserPlus size={15} />
            </span>
            <div>
              <p
                className="text-sm font-bold leading-tight"
                style={{ color: "var(--text-1)" }}
              >
                Invite team member
              </p>
              <p
                className="text-[11px] mt-0.5"
                style={{ color: "var(--text-4)" }}
              >
                Send an invite via WhatsApp, Email, or shareable link.
              </p>
            </div>
          </div>

          {/* Form row */}
          <div className="flex flex-col md:flex-row gap-2">
            <input
              type="text"
              value={inviteEmail}
              onChange={(e) => setInviteEmail(e.target.value)}
              placeholder="email@company.com  or  +91 98765 00000"
              className="flex-1 text-xs px-3 py-2 rounded-lg outline-none transition-colors"
              style={{
                background: "var(--bg-secondary)",
                border: "1px solid var(--border)",
                color: "var(--text-1)",
              }}
              onFocus={(e) => {
                e.currentTarget.style.borderColor = "var(--green)";
              }}
              onBlur={(e) => {
                e.currentTarget.style.borderColor = "var(--border)";
              }}
            />

            {/* Role dropdown */}
            <div ref={roleDropdownRef} className="relative">
              <button
                type="button"
                onClick={() => setRoleDropdownOpen((v) => !v)}
                className="w-full md:w-44 inline-flex items-center justify-between gap-2 text-xs font-semibold px-3 py-2 rounded-lg cursor-pointer transition-colors"
                style={{
                  background: "var(--bg-secondary)",
                  border: "1px solid var(--border)",
                  color: "var(--text-1)",
                }}
              >
                <span className="inline-flex items-center gap-1.5">
                  <span aria-hidden>{ROLES[inviteRole].icon}</span>
                  {ROLES[inviteRole].name}
                </span>
                <ChevronDown
                  size={12}
                  style={{
                    transform: roleDropdownOpen ? "rotate(180deg)" : "rotate(0)",
                    transition: "transform 150ms ease",
                  }}
                />
              </button>
              <AnimatePresence>
                {roleDropdownOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: -4 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -4 }}
                    transition={{ duration: 0.15 }}
                    className="absolute right-0 mt-1 w-60 rounded-lg overflow-hidden z-50"
                    style={{
                      background: "var(--bg-surface)",
                      border: "1px solid var(--border)",
                      boxShadow: "0 14px 32px rgba(0,0,0,0.4)",
                    }}
                  >
                    {ROLE_LIST.map((r) => {
                      const cfg = ROLES[r];
                      return (
                        <button
                          key={r}
                          type="button"
                          onClick={() => {
                            setInviteRole(r);
                            setRoleDropdownOpen(false);
                          }}
                          className="w-full flex items-center gap-2 px-3 py-2 text-left transition-colors cursor-pointer"
                          onMouseEnter={(e) => {
                            (e.currentTarget as HTMLElement).style.background =
                              "var(--bg-hover)";
                          }}
                          onMouseLeave={(e) => {
                            (e.currentTarget as HTMLElement).style.background =
                              "transparent";
                          }}
                        >
                          <span aria-hidden className="text-[13px]">
                            {cfg.icon}
                          </span>
                          <span
                            className="text-xs font-semibold"
                            style={{ color: "var(--text-1)" }}
                          >
                            {cfg.name}
                          </span>
                        </button>
                      );
                    })}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            <button
              type="button"
              onClick={handleSendInvite}
              className="inline-flex items-center justify-center gap-1.5 text-xs font-semibold px-4 py-2 rounded-lg cursor-pointer transition-opacity hover:opacity-90"
              style={{
                background: "var(--green)",
                color: "#052E16",
              }}
            >
              <Send size={13} />
              Send Invite
            </button>
          </div>

          {/* Channel chips */}
          <div className="flex flex-wrap items-center gap-2">
            <span
              className="text-[10px] uppercase tracking-wider font-semibold"
              style={{ color: "var(--text-4)" }}
            >
              Send via:
            </span>
            <Chip color="#25D366" icon={<MessageCircle size={11} />} active>
              WhatsApp
            </Chip>
            <Chip color="var(--blue)" icon={<Mail size={11} />} active>
              Email
            </Chip>
            <Chip color="var(--text-3)" icon={<LinkIcon size={11} />}>
              Copy Link
            </Chip>
          </div>

          {/* Bulk invite */}
          <button
            type="button"
            onClick={() => setBulkOpen(true)}
            className="self-start inline-flex items-center gap-1.5 text-[11px] font-semibold transition-opacity hover:opacity-80 cursor-pointer"
            style={{ color: "var(--green)" }}
          >
            <FileSpreadsheet size={12} />
            Bulk invite from CSV
          </button>
        </div>
      </motion.div>

      {/* ============ Team Members table ============ */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, amount: 0.1 }}
        transition={{ duration: 0.4 }}
        className="rounded-md overflow-hidden"
        style={{
          background: "var(--bg-surface)",
          border: "1px solid var(--border)",
        }}
      >
        <div
          className="flex items-center justify-between px-5 py-4"
          style={{ borderBottom: "1px solid var(--border)" }}
        >
          <div>
            <p
              className="text-sm font-bold"
              style={{ color: "var(--text-1)" }}
            >
              Team members
            </p>
            <p className="text-[11px] mt-0.5" style={{ color: "var(--text-4)" }}>
              {members.length} people with access to this workspace
            </p>
          </div>
        </div>

        {/* Desktop table */}
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr
                style={{
                  background: "var(--bg-secondary)",
                  borderBottom: "1px solid var(--border)",
                }}
              >
                <TH>Member</TH>
                <TH>Phone</TH>
                <TH>Role</TH>
                <TH>Status</TH>
                <TH>Last Active</TH>
                <TH className="text-right">Actions</TH>
              </tr>
            </thead>
            <tbody>
              {members.map((m) => (
                <MemberRow
                  key={m.id}
                  member={m}
                  onChangeRole={(r) => handleChangeRole(m.id, r)}
                  onRemove={() => setConfirmRemove(m)}
                />
              ))}
            </tbody>
          </table>
        </div>

        {/* Mobile cards */}
        <div className="md:hidden flex flex-col divide-y" style={{ borderColor: "var(--border)" }}>
          {members.map((m) => (
            <MemberCard
              key={m.id}
              member={m}
              onChangeRole={(r) => handleChangeRole(m.id, r)}
              onRemove={() => setConfirmRemove(m)}
            />
          ))}
        </div>
      </motion.div>

      {/* ============ Role preview card ============ */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, amount: 0.1 }}
        transition={{ duration: 0.4 }}
        className="rounded-md p-5"
        style={{
          background: "var(--bg-surface)",
          border: "1px solid var(--border)",
        }}
      >
        <div className="flex items-center gap-2 mb-4">
          <span
            className="flex items-center justify-center rounded-lg"
            style={{
              width: 28,
              height: 28,
              background: "color-mix(in srgb, var(--purple) 15%, transparent)",
              color: "var(--purple)",
            }}
          >
            <Eye size={15} />
          </span>
          <div>
            <p
              className="text-sm font-bold"
              style={{ color: "var(--text-1)" }}
            >
              What each role can see
            </p>
            <p
              className="text-[11px] mt-0.5"
              style={{ color: "var(--text-4)" }}
            >
              Preview the product as any role to verify permissions.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
          {ROLE_LIST.map((r) => {
            const cfg = ROLES[r];
            return (
              <motion.div
                key={r}
                initial={{ opacity: 0, y: 10 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.2 }}
                transition={{ duration: 0.35 }}
                whileHover={{ y: -2 }}
                className="rounded-md p-3 flex flex-col gap-2 transition-shadow hover:shadow-lg"
                style={{
                  background:
                    "color-mix(in srgb, var(--bg-secondary) 80%, transparent)",
                  border: `1px solid color-mix(in srgb, ${cfg.color} 25%, var(--border))`,
                }}
              >
                <div className="flex items-center gap-2">
                  <span
                    className="flex items-center justify-center rounded-lg flex-shrink-0 text-[14px]"
                    style={{
                      width: 28,
                      height: 28,
                      background: `color-mix(in srgb, ${cfg.color} 15%, transparent)`,
                      border: `1px solid color-mix(in srgb, ${cfg.color} 30%, transparent)`,
                    }}
                    aria-hidden
                  >
                    {cfg.icon}
                  </span>
                  <p
                    className="text-xs font-bold leading-tight"
                    style={{ color: "var(--text-1)" }}
                  >
                    {cfg.name}
                  </p>
                </div>

                <p
                  className="text-[11px] leading-snug"
                  style={{ color: "var(--text-3)" }}
                >
                  {cfg.description}
                </p>

                <div
                  className="text-[10px] font-semibold tabular-nums"
                  style={{ color: cfg.color }}
                >
                  {cfg.permissions.length} permissions
                </div>

                <button
                  type="button"
                  onClick={() => setRole(r)}
                  className="mt-1 inline-flex items-center justify-center gap-1 text-[11px] font-semibold px-2.5 py-1.5 rounded-lg cursor-pointer transition-opacity hover:opacity-90"
                  style={{
                    background: `color-mix(in srgb, ${cfg.color} 18%, transparent)`,
                    border: `1px solid color-mix(in srgb, ${cfg.color} 35%, transparent)`,
                    color: cfg.color,
                  }}
                >
                  <Eye size={11} />
                  Preview as {cfg.name.split(" ")[0]}
                </button>
              </motion.div>
            );
          })}
        </div>
      </motion.div>

      {/* ============ Activity Log ============ */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, amount: 0.1 }}
        transition={{ duration: 0.4 }}
        className="rounded-md overflow-hidden"
        style={{
          background: "var(--bg-surface)",
          border: "1px solid var(--border)",
        }}
      >
        <div
          className="flex items-center gap-2 px-5 py-4"
          style={{ borderBottom: "1px solid var(--border)" }}
        >
          <span
            className="flex items-center justify-center rounded-lg"
            style={{
              width: 28,
              height: 28,
              background: "color-mix(in srgb, var(--blue) 15%, transparent)",
              color: "var(--blue)",
            }}
          >
            <Circle size={15} />
          </span>
          <div>
            <p
              className="text-sm font-bold"
              style={{ color: "var(--text-1)" }}
            >
              Recent team activity
            </p>
            <p
              className="text-[11px] mt-0.5"
              style={{ color: "var(--text-4)" }}
            >
              The last {ACTIVITY_LOG.length} actions across your team.
            </p>
          </div>
        </div>

        <div className="flex flex-col">
          {ACTIVITY_LOG.map((a, i) => {
            const cfg = ROLES[a.role];
            return (
              <motion.div
                key={a.id}
                initial={{ opacity: 0, x: -8 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true, amount: 0.2 }}
                transition={{ duration: 0.3, delay: i * 0.04 }}
                className="flex items-center gap-3 px-5 py-3"
                style={{
                  borderBottom:
                    i < ACTIVITY_LOG.length - 1
                      ? "1px solid var(--border)"
                      : "none",
                }}
              >
                {/* Avatar */}
                <span
                  className="flex items-center justify-center rounded-full flex-shrink-0 text-[11px] font-bold"
                  style={{
                    width: 28,
                    height: 28,
                    background: `linear-gradient(135deg, color-mix(in srgb, ${cfg.color} 30%, transparent), color-mix(in srgb, ${cfg.color} 60%, transparent))`,
                    color: "#fff",
                  }}
                >
                  {a.actor.charAt(0)}
                </span>

                <div className="flex-1 min-w-0">
                  <p
                    className="text-xs leading-tight"
                    style={{ color: "var(--text-1)" }}
                  >
                    <span className="font-semibold">{a.actor}</span>{" "}
                    <span style={{ color: "var(--text-3)" }}>{a.action}</span>{" "}
                    <span
                      className="font-semibold"
                      style={{ color: "var(--text-2)" }}
                    >
                      {a.target}
                    </span>
                  </p>
                  <p
                    className="text-[10px] mt-0.5 tabular-nums"
                    style={{ color: "var(--text-4)" }}
                  >
                    {a.at}
                  </p>
                </div>

                {/* Role badge */}
                <span
                  className="inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full flex-shrink-0"
                  style={{
                    background: `color-mix(in srgb, ${cfg.color} 15%, transparent)`,
                    border: `1px solid color-mix(in srgb, ${cfg.color} 30%, transparent)`,
                    color: cfg.color,
                  }}
                >
                  <span aria-hidden>{cfg.icon}</span>
                  {cfg.name.split(" ")[0]}
                </span>
              </motion.div>
            );
          })}
        </div>
      </motion.div>

      {/* ============ Toast ============ */}
      <AnimatePresence>
        {toast && (
          <motion.div
            key="toast"
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.95 }}
            transition={{ duration: 0.25, ease: "easeOut" }}
            className="fixed left-1/2 -translate-x-1/2 z-[70] rounded-lg px-4 py-3 inline-flex items-center gap-2.5 shadow-2xl"
            style={{
              bottom: 88,
              background: "var(--bg-surface)",
              border: "1px solid var(--text-3)",
              boxShadow: "0 20px 40px rgba(0,0,0,0.45)",
            }}
            role="status"
          >
            <span
              className="flex items-center justify-center rounded-full"
              style={{
                width: 24,
                height: 24,
                background: "var(--green)",
                color: "#052E16",
              }}
            >
              <CheckCircle2 size={15} />
            </span>
            <p
              className="text-xs font-semibold"
              style={{ color: "var(--text-1)" }}
            >
              {toast}
            </p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ============ Confirm remove modal ============ */}
      <AnimatePresence>
        {confirmRemove && (
          <motion.div
            key="confirm-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.18 }}
            className="fixed inset-0 z-[65] flex items-center justify-center p-4"
            style={{
              background: "rgba(0,0,0,0.55)",
              backdropFilter: "blur(2px)",
            }}
            onClick={() => setConfirmRemove(null)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.92, y: 8 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 4 }}
              transition={{ duration: 0.22, ease: "easeOut" }}
              className="w-full max-w-md rounded-md overflow-hidden"
              style={{
                background: "var(--bg-surface)",
                border: "1px solid var(--border)",
                boxShadow: "0 20px 50px rgba(0,0,0,0.45)",
              }}
              onClick={(e) => e.stopPropagation()}
              role="dialog"
              aria-modal="true"
            >
              <div
                className="flex items-center justify-between px-4 py-3"
                style={{ borderBottom: "1px solid var(--border)" }}
              >
                <div className="flex items-center gap-2">
                  <span
                    className="flex items-center justify-center rounded-full"
                    style={{
                      width: 28,
                      height: 28,
                      background:
                        "color-mix(in srgb, var(--red) 15%, transparent)",
                      color: "var(--red)",
                    }}
                  >
                    <Trash2 size={14} />
                  </span>
                  <h3
                    className="text-sm font-bold"
                    style={{ color: "var(--text-1)" }}
                  >
                    Revoke access?
                  </h3>
                </div>
                <button
                  type="button"
                  onClick={() => setConfirmRemove(null)}
                  aria-label="Close"
                  className="flex items-center justify-center rounded-md transition-colors cursor-pointer"
                  style={{
                    width: 28,
                    height: 28,
                    color: "var(--text-3)",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = "var(--bg-hover)";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = "transparent";
                  }}
                >
                  <X size={14} />
                </button>
              </div>

              <div className="px-4 py-4">
                <p
                  className="text-sm leading-relaxed"
                  style={{ color: "var(--text-2)" }}
                >
                  Revoke access for{" "}
                  <span
                    className="font-semibold"
                    style={{ color: "var(--text-1)" }}
                  >
                    {confirmRemove.name}
                  </span>
                  ? They will lose access immediately.
                </p>

                <div className="flex items-center justify-end gap-2 mt-5">
                  <button
                    type="button"
                    onClick={() => setConfirmRemove(null)}
                    className="text-xs font-semibold px-3 py-2 rounded-md cursor-pointer transition-colors"
                    style={{
                      color: "var(--text-3)",
                      background: "transparent",
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = "var(--bg-hover)";
                      e.currentTarget.style.color = "var(--text-1)";
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = "transparent";
                      e.currentTarget.style.color = "var(--text-3)";
                    }}
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={handleConfirmRemove}
                    className="inline-flex items-center gap-1.5 text-xs font-semibold px-3.5 py-2 rounded-md cursor-pointer transition-opacity hover:opacity-90"
                    style={{
                      background: "var(--red)",
                      color: "#fff",
                    }}
                  >
                    <Trash2 size={12} />
                    Revoke access
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ============ Bulk invite modal ============ */}
      <BulkInviteModal
        open={bulkOpen}
        onClose={() => setBulkOpen(false)}
        onSent={(count) => {
          setToast(`Sent ${count} invitations`);
          setBulkOpen(false);
        }}
      />
    </div>
  );
}

/* ================================================================== */
/*  BulkInviteModal                                                   */
/* ================================================================== */
interface BulkInviteModalProps {
  open: boolean;
  onClose: () => void;
  onSent: (count: number) => void;
}

function BulkInviteModal({ open, onClose, onSent }: BulkInviteModalProps) {
  const [dropped, setDropped] = useState(false);

  const mockRows = [
    { name: "Arjun Kapoor", email: "arjun@bandrasoap.in", phone: "+91 98100 10101", role: "sales", valid: true },
    { name: "Meera Nair", email: "meera@bandrasoap.in", phone: "+91 98100 20202", role: "accounts", valid: true },
    { name: "Rohan Iyer", email: "rohan@bandrasoap.in", phone: "+91 98100 30303", role: "manager", valid: true },
    { name: "Divya Menon", email: "divya@bandrasoap.in", phone: "+91 98100 40404", role: "sales", valid: true },
    { name: "Kabir Verma", email: "kabir@bandrasoap.in", phone: "+91 98100 50505", role: "viewer", valid: true },
  ];

  /* Reset on close */
  useEffect(() => {
    if (!open) {
      const id = setTimeout(() => setDropped(false), 250);
      return () => clearTimeout(id);
    }
  }, [open]);

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          key="bulk-overlay"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="fixed inset-0 z-[65] flex items-center justify-center p-4"
          style={{ background: "rgba(0,0,0,0.55)", backdropFilter: "blur(2px)" }}
          onClick={onClose}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.92, y: 8 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 4 }}
            transition={{ duration: 0.22, ease: "easeOut" }}
            className="w-full max-w-2xl rounded-md overflow-hidden flex flex-col"
            style={{
              background: "var(--bg-surface)",
              border: "1px solid var(--border)",
              boxShadow: "0 20px 50px rgba(0,0,0,0.45)",
              maxHeight: "90vh",
            }}
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
          >
            {/* Header */}
            <div
              className="flex items-center justify-between px-5 py-3"
              style={{ borderBottom: "1px solid var(--border)" }}
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <span
                  className="flex items-center justify-center rounded-lg flex-shrink-0"
                  style={{
                    width: 32,
                    height: 32,
                    background: "var(--bg-hover)",
                    color: "var(--green)",
                  }}
                >
                  <FileSpreadsheet size={16} />
                </span>
                <div className="min-w-0">
                  <h3 className="text-sm font-bold" style={{ color: "var(--text-1)" }}>
                    Bulk invite team members
                  </h3>
                  <p className="text-[11px] mt-0.5" style={{ color: "var(--text-4)" }}>
                    Upload a CSV with team details to invite everyone at once
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={onClose}
                aria-label="Close"
                className="flex items-center justify-center rounded-md transition-colors cursor-pointer flex-shrink-0"
                style={{
                  width: 30,
                  height: 30,
                  color: "var(--text-3)",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = "var(--bg-hover)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = "transparent";
                }}
              >
                <X size={16} />
              </button>
            </div>

            {/* Body */}
            <div className="px-5 py-4 overflow-y-auto flex-1">
              {!dropped ? (
                <>
                  {/* Drop zone */}
                  <button
                    type="button"
                    onClick={() => setDropped(true)}
                    className="w-full rounded-md flex flex-col items-center justify-center py-10 px-4 cursor-pointer transition-colors"
                    style={{
                      background: "var(--bg-secondary)",
                      border: "2px dashed color-mix(in srgb, var(--green) 35%, var(--border))",
                    }}
                    onMouseEnter={(e) => {
                      (e.currentTarget as HTMLElement).style.background =
                        "color-mix(in srgb, var(--green) 5%, var(--bg-secondary))";
                    }}
                    onMouseLeave={(e) => {
                      (e.currentTarget as HTMLElement).style.background = "var(--bg-secondary)";
                    }}
                  >
                    <span
                      className="flex items-center justify-center rounded-full mb-3"
                      style={{
                        width: 48,
                        height: 48,
                        background: "var(--bg-hover)",
                        color: "var(--green)",
                      }}
                    >
                      <Upload size={20} />
                    </span>
                    <p className="text-sm font-semibold" style={{ color: "var(--text-1)" }}>
                      Drop CSV here
                    </p>
                    <p className="text-[11px] mt-1" style={{ color: "var(--text-4)" }}>
                      (columns: name, email, phone, role)
                    </p>
                    <p
                      className="text-xs mt-3 font-semibold"
                      style={{ color: "var(--green)" }}
                    >
                      or browse
                    </p>
                  </button>

                  <div className="flex items-center justify-center mt-4">
                    <button
                      type="button"
                      onClick={(e) => e.preventDefault()}
                      className="inline-flex items-center gap-1 text-[11px] font-semibold transition-opacity hover:opacity-80 cursor-pointer"
                      style={{ color: "var(--blue)" }}
                    >
                      <Download size={12} />
                      Download sample template
                    </button>
                  </div>
                </>
              ) : (
                <div className="flex flex-col gap-3">
                  <div
                    className="flex items-center justify-between rounded-lg px-3 py-2"
                    style={{
                      background: "color-mix(in srgb, var(--green) 10%, transparent)",
                      border: "1px solid color-mix(in srgb, var(--green) 25%, transparent)",
                    }}
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <span
                        className="flex items-center justify-center rounded"
                        style={{
                          width: 24,
                          height: 24,
                          background: "var(--green)",
                          color: "#052E16",
                        }}
                      >
                        <Check size={14} strokeWidth={3} />
                      </span>
                      <div className="min-w-0">
                        <p className="text-xs font-semibold" style={{ color: "var(--text-1)" }}>
                          team-invites-apr.csv
                        </p>
                        <p className="text-[10px]" style={{ color: "var(--text-4)" }}>
                          5 rows parsed · 5 valid · 0 errors
                        </p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => setDropped(false)}
                      className="text-[11px] font-semibold cursor-pointer transition-opacity hover:opacity-80"
                      style={{ color: "var(--text-3)" }}
                    >
                      Replace
                    </button>
                  </div>

                  {/* Preview table */}
                  <div
                    className="rounded-lg overflow-hidden"
                    style={{ border: "1px solid var(--border)" }}
                  >
                    <div className="overflow-x-auto">
                      <table className="w-full text-xs">
                        <thead>
                          <tr
                            style={{
                              background: "var(--bg-secondary)",
                              borderBottom: "1px solid var(--border)",
                            }}
                          >
                            <TH>Name</TH>
                            <TH>Email</TH>
                            <TH>Phone</TH>
                            <TH>Role</TH>
                            <TH>Status</TH>
                          </tr>
                        </thead>
                        <tbody>
                          {mockRows.map((row, i) => (
                            <tr
                              key={row.email}
                              style={{
                                borderBottom:
                                  i < mockRows.length - 1
                                    ? "1px solid var(--border)"
                                    : "none",
                              }}
                            >
                              <td className="px-3 py-2 font-semibold" style={{ color: "var(--text-1)" }}>
                                {row.name}
                              </td>
                              <td className="px-3 py-2" style={{ color: "var(--text-3)" }}>
                                {row.email}
                              </td>
                              <td className="px-3 py-2 tabular-nums" style={{ color: "var(--text-3)" }}>
                                {row.phone}
                              </td>
                              <td className="px-3 py-2 capitalize" style={{ color: "var(--text-2)" }}>
                                {row.role}
                              </td>
                              <td className="px-3 py-2">
                                <span
                                  className="inline-flex items-center gap-1 text-[10px] font-semibold px-1.5 py-0.5 rounded"
                                  style={{
                                    background: "var(--bg-hover)",
                                    color: "var(--green)",
                                  }}
                                >
                                  <Check size={10} strokeWidth={3} />
                                  Valid
                                </span>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Footer */}
            <div
              className="flex items-center justify-between gap-3 px-5 py-3 flex-wrap"
              style={{ borderTop: "1px solid var(--border)" }}
            >
              <p className="text-xs" style={{ color: "var(--text-3)" }}>
                {dropped
                  ? `${mockRows.length} valid invites found. Send all?`
                  : "CSV columns: name, email, phone, role"}
              </p>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="text-xs font-semibold px-3 py-2 rounded-md cursor-pointer transition-colors"
                  style={{
                    color: "var(--text-3)",
                    background: "transparent",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = "var(--bg-hover)";
                    e.currentTarget.style.color = "var(--text-1)";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = "transparent";
                    e.currentTarget.style.color = "var(--text-3)";
                  }}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  disabled={!dropped}
                  onClick={() => onSent(mockRows.length)}
                  className="inline-flex items-center gap-1.5 text-xs font-semibold px-3.5 py-2 rounded-md cursor-pointer transition-opacity"
                  style={{
                    background: "var(--green)",
                    color: "#052E16",
                    opacity: dropped ? 1 : 0.5,
                    cursor: dropped ? "pointer" : "not-allowed",
                  }}
                >
                  <Send size={13} />
                  Send {dropped ? mockRows.length : ""} invites
                </button>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

/* ------------------------------------------------------------------ */
/*  Sub-components                                                    */
/* ------------------------------------------------------------------ */
interface StatCardProps {
  title: string;
  value: string;
  icon: React.ReactNode;
  accent: string;
  extra?: React.ReactNode;
}

function StatCard({ title, value, icon, accent, extra }: StatCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.3 }}
      transition={{ duration: 0.35, ease: "easeOut" }}
      className="rounded-md overflow-hidden"
      style={{
        background: "var(--bg-surface)",
        border: "1px solid var(--border)",
      }}
    >
      <div className="h-0.5" style={{ background: accent }} />
      <div className="p-4">
        <div className="flex items-start justify-between">
          <div className="flex-1 min-w-0">
            <p
              className="text-[10px] uppercase tracking-wider font-medium mb-2"
              style={{ color: "var(--text-4)" }}
            >
              {title}
            </p>
            <p
              className="text-2xl font-bold leading-none tabular-nums"
              style={{
                color: "var(--text-1)",
                fontFamily: "'Space Grotesk', sans-serif",
              }}
            >
              {value}
            </p>
          </div>
          <span
            className="flex-shrink-0 ml-2 rounded-lg p-1.5"
            style={{
              color: accent,
              background: `color-mix(in srgb, ${accent} 14%, transparent)`,
            }}
          >
            {icon}
          </span>
        </div>
        {extra}
      </div>
    </motion.div>
  );
}

interface ChipProps {
  children: React.ReactNode;
  icon?: React.ReactNode;
  color: string;
  active?: boolean;
}

function Chip({ children, icon, color, active }: ChipProps) {
  return (
    <span
      className="inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-1 rounded-full"
      style={{
        background: active
          ? `color-mix(in srgb, ${color} 15%, transparent)`
          : "var(--bg-secondary)",
        border: `1px solid ${
          active ? `color-mix(in srgb, ${color} 30%, transparent)` : "var(--border)"
        }`,
        color: active ? color : "var(--text-3)",
      }}
    >
      {icon}
      {children}
      {active && <CheckCircle2 size={10} />}
    </span>
  );
}

function TH({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <th
      className={`text-[10px] font-semibold uppercase tracking-wider px-4 py-2.5 text-left ${className}`}
      style={{ color: "var(--text-4)" }}
    >
      {children}
    </th>
  );
}

interface MemberRowProps {
  member: TeamMember;
  onChangeRole: (role: Role) => void;
  onRemove: () => void;
}

function MemberRow({ member, onChangeRole, onRemove }: MemberRowProps) {
  const [hover, setHover] = useState(false);
  const roleCfg = ROLES[member.role];
  const statusCfg = statusStyle[member.status];

  return (
    <tr
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      style={{
        background: hover ? "var(--bg-hover)" : "transparent",
        borderBottom: "1px solid var(--border)",
        transition: "background 150ms ease",
      }}
    >
      <td className="px-4 py-3">
        <div className="flex items-center gap-2.5">
          <span
            className="flex items-center justify-center rounded-full flex-shrink-0 text-xs font-bold"
            style={{
              width: 32,
              height: 32,
              background: `linear-gradient(135deg, color-mix(in srgb, ${roleCfg.color} 30%, transparent), color-mix(in srgb, ${roleCfg.color} 65%, transparent))`,
              color: "#fff",
            }}
          >
            {member.avatar}
          </span>
          <div className="min-w-0">
            <p
              className="text-xs font-semibold leading-tight truncate"
              style={{ color: "var(--text-1)" }}
            >
              {member.name}
            </p>
            <p
              className="text-[11px] mt-0.5 truncate"
              style={{ color: "var(--text-4)" }}
            >
              {member.email}
            </p>
          </div>
        </div>
      </td>
      <td
        className="px-4 py-3 text-[11px] tabular-nums"
        style={{ color: "var(--text-3)" }}
      >
        {member.phone}
      </td>
      <td className="px-4 py-3">
        <RolePillSelector role={member.role} onChange={onChangeRole} />
      </td>
      <td className="px-4 py-3">
        <div className="flex items-center gap-1.5 flex-wrap">
          <span
            className="inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full"
            style={{
              background: `color-mix(in srgb, ${statusCfg.color} 15%, transparent)`,
              border: `1px solid color-mix(in srgb, ${statusCfg.color} 30%, transparent)`,
              color: statusCfg.color,
            }}
          >
            <span
              className="w-1.5 h-1.5 rounded-full"
              style={{ background: statusCfg.color }}
            />
            {statusCfg.label}
          </span>
          {member.status === "pending" && (
            <span
              className="inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full"
              style={{
                background: "color-mix(in srgb, var(--yellow) 12%, transparent)",
                border: "1px solid color-mix(in srgb, var(--yellow) 25%, transparent)",
                color: "var(--yellow)",
              }}
            >
              <Clock size={9} />
              Expires in {PENDING_INVITE_EXPIRY_DAYS} days
            </span>
          )}
        </div>
      </td>
      <td
        className="px-4 py-3 text-[11px] tabular-nums"
        style={{ color: "var(--text-3)" }}
      >
        {member.lastActive}
      </td>
      <td className="px-4 py-3">
        <div className="flex items-center justify-end gap-1">
          <IconBtn title="Edit member">
            <Edit3 size={13} />
          </IconBtn>
          <IconBtn title="Remove member" onClick={onRemove} danger>
            <Trash2 size={13} />
          </IconBtn>
        </div>
      </td>
    </tr>
  );
}

function MemberCard({ member, onChangeRole, onRemove }: MemberRowProps) {
  const roleCfg = ROLES[member.role];
  const statusCfg = statusStyle[member.status];
  return (
    <div className="px-5 py-3 flex flex-col gap-2">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 min-w-0">
          <span
            className="flex items-center justify-center rounded-full flex-shrink-0 text-xs font-bold"
            style={{
              width: 32,
              height: 32,
              background: `linear-gradient(135deg, color-mix(in srgb, ${roleCfg.color} 30%, transparent), color-mix(in srgb, ${roleCfg.color} 65%, transparent))`,
              color: "#fff",
            }}
          >
            {member.avatar}
          </span>
          <div className="min-w-0">
            <p
              className="text-xs font-semibold leading-tight truncate"
              style={{ color: "var(--text-1)" }}
            >
              {member.name}
            </p>
            <p
              className="text-[11px] mt-0.5 truncate"
              style={{ color: "var(--text-4)" }}
            >
              {member.email}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-1 flex-shrink-0 flex-wrap justify-end">
          <span
            className="inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full"
            style={{
              background: `color-mix(in srgb, ${statusCfg.color} 15%, transparent)`,
              border: `1px solid color-mix(in srgb, ${statusCfg.color} 30%, transparent)`,
              color: statusCfg.color,
            }}
          >
            {statusCfg.label}
          </span>
          {member.status === "pending" && (
            <span
              className="inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full"
              style={{
                background: "color-mix(in srgb, var(--yellow) 12%, transparent)",
                border: "1px solid color-mix(in srgb, var(--yellow) 25%, transparent)",
                color: "var(--yellow)",
              }}
            >
              <Clock size={9} />
              Expires in {PENDING_INVITE_EXPIRY_DAYS}d
            </span>
          )}
        </div>
      </div>

      <div className="flex items-center justify-between gap-2">
        <RolePillSelector role={member.role} onChange={onChangeRole} />
        <div className="flex items-center gap-1">
          <IconBtn title="Edit">
            <Edit3 size={13} />
          </IconBtn>
          <IconBtn title="Remove" onClick={onRemove} danger>
            <Trash2 size={13} />
          </IconBtn>
        </div>
      </div>
    </div>
  );
}

interface IconBtnProps {
  children: React.ReactNode;
  title: string;
  onClick?: () => void;
  danger?: boolean;
}

function IconBtn({ children, title, onClick, danger }: IconBtnProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      title={title}
      aria-label={title}
      className="flex items-center justify-center rounded-md transition-colors cursor-pointer"
      style={{
        width: 26,
        height: 26,
        color: danger ? "var(--red)" : "var(--text-3)",
        background: "transparent",
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.background = danger
          ? "color-mix(in srgb, var(--red) 15%, transparent)"
          : "var(--bg-hover)";
        e.currentTarget.style.color = danger ? "var(--red)" : "var(--text-1)";
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.background = "transparent";
        e.currentTarget.style.color = danger ? "var(--red)" : "var(--text-3)";
      }}
    >
      {children}
    </button>
  );
}

interface RolePillSelectorProps {
  role: Role;
  onChange: (r: Role) => void;
}

function RolePillSelector({ role, onChange }: RolePillSelectorProps) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const cfg = ROLES[role];

  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (!ref.current) return;
      if (!ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  return (
    <div ref={ref} className="relative inline-block">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full cursor-pointer transition-opacity hover:opacity-85"
        style={{
          background: `color-mix(in srgb, ${cfg.color} 15%, transparent)`,
          border: `1px solid color-mix(in srgb, ${cfg.color} 30%, transparent)`,
          color: cfg.color,
        }}
      >
        <span aria-hidden>{cfg.icon}</span>
        {cfg.name}
        <ChevronDown size={10} />
      </button>
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.15 }}
            className="absolute left-0 mt-1 w-52 rounded-lg overflow-hidden z-40"
            style={{
              background: "var(--bg-surface)",
              border: "1px solid var(--border)",
              boxShadow: "0 14px 32px rgba(0,0,0,0.4)",
            }}
          >
            {ROLE_LIST.map((r) => {
              const c = ROLES[r];
              const active = r === role;
              return (
                <button
                  key={r}
                  type="button"
                  onClick={() => {
                    onChange(r);
                    setOpen(false);
                  }}
                  className="w-full flex items-center gap-2 px-3 py-2 text-left transition-colors cursor-pointer"
                  onMouseEnter={(e) => {
                    (e.currentTarget as HTMLElement).style.background =
                      "var(--bg-hover)";
                  }}
                  onMouseLeave={(e) => {
                    (e.currentTarget as HTMLElement).style.background =
                      "transparent";
                  }}
                >
                  <span aria-hidden className="text-[13px]">
                    {c.icon}
                  </span>
                  <span
                    className="text-[11px] font-semibold flex-1"
                    style={{ color: "var(--text-1)" }}
                  >
                    {c.name}
                  </span>
                  {active && (
                    <span style={{ color: c.color }}>
                      <CheckCircle2 size={12} />
                    </span>
                  )}
                </button>
              );
            })}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

/* ================================================================== */
/*  ApprovalsTab — maker-checker thresholds + routing rules           */
/* ================================================================== */
function ApprovalsTab() {
  // Default thresholds — seeded from rbac.ts APPROVAL_THRESHOLDS but
  // editable here for the per-company config. Demo only; no persistence.
  const [thresholds, setThresholds] = useState([
    { maxValue: 10_000, label: "< ₹10,000", approver: "Any approver", color: "var(--green)" },
    { maxValue: 100_000, label: "₹10K – ₹1L", approver: "Accounts team", color: "var(--blue)" },
    { maxValue: 1_000_000, label: "₹1L – ₹10L", approver: "Accounts Head", color: "var(--yellow)" },
    { maxValue: Infinity, label: "> ₹10L", approver: "Admin / Owner", color: "var(--red)" },
  ]);
  const [makerChecker, setMakerChecker] = useState(true);
  const [dualApproval, setDualApproval] = useState(false);
  const [adminOverride, setAdminOverride] = useState(true);
  const [saved, setSaved] = useState(false);

  const updateThreshold = (i: number, field: "maxValue" | "approver", value: string | number) => {
    setThresholds((prev) => prev.map((t, idx) => (idx === i ? { ...t, [field]: value } : t)));
  };

  const formatINR = (v: number) => {
    if (v === Infinity) return "No limit";
    if (v >= 1e7) return `₹${(v / 1e7).toFixed(1)}Cr`;
    if (v >= 1e5) return `₹${(v / 1e5).toFixed(1)}L`;
    return `₹${v.toLocaleString("en-IN")}`;
  };

  return (
    <div className="flex flex-col gap-5">
      <SectionCard
        title="Approval thresholds"
        subtitle="Who can approve an entry depends on its value. Higher amounts route to more senior reviewers."
      >
        <div className="flex flex-col gap-3 mt-4">
          {thresholds.map((t, i) => (
            <div
              key={i}
              className="flex flex-col md:flex-row md:items-center gap-3 px-4 py-3 rounded-lg"
              style={{
                background: "var(--bg-hover)",
                border: "1px solid var(--border)",
                borderLeft: `3px solid ${t.color}`,
              }}
            >
              <div className="flex-shrink-0 min-w-[100px]">
                <p
                  className="text-[10px] uppercase tracking-wider font-medium"
                  style={{ color: "var(--text-4)" }}
                >
                  Tier {i + 1}
                </p>
                <p
                  className="text-sm font-bold"
                  style={{
                    color: t.color,
                    fontFamily: "'Space Grotesk', sans-serif",
                  }}
                >
                  {t.label}
                </p>
              </div>
              <div className="flex items-center gap-2 flex-1 flex-wrap">
                <div className="flex items-center gap-2">
                  <label
                    className="text-[11px] font-medium"
                    style={{ color: "var(--text-3)" }}
                  >
                    Up to
                  </label>
                  <input
                    type="number"
                    disabled={t.maxValue === Infinity}
                    value={t.maxValue === Infinity ? "" : t.maxValue}
                    onChange={(e) => updateThreshold(i, "maxValue", Number(e.target.value))}
                    placeholder={t.maxValue === Infinity ? "No limit" : ""}
                    className="w-28 px-2 py-1 rounded text-[12px] tabular-nums"
                    style={{
                      background: t.maxValue === Infinity ? "var(--bg-surface)" : "var(--bg-primary)",
                      border: "1px solid var(--border)",
                      color: "var(--text-1)",
                      fontFamily: "'Space Grotesk', sans-serif",
                    }}
                  />
                </div>
                <span style={{ color: "var(--text-4)" }}>→</span>
                <div className="flex items-center gap-2 flex-1">
                  <label
                    className="text-[11px] font-medium"
                    style={{ color: "var(--text-3)" }}
                  >
                    Routes to
                  </label>
                  <select
                    value={t.approver}
                    onChange={(e) => updateThreshold(i, "approver", e.target.value)}
                    className="flex-1 px-2 py-1 rounded text-[12px]"
                    style={{
                      background: "var(--bg-primary)",
                      border: "1px solid var(--border)",
                      color: "var(--text-1)",
                    }}
                  >
                    <option>Any approver</option>
                    <option>Accounts team</option>
                    <option>Accounts Head</option>
                    <option>Admin / Owner</option>
                  </select>
                </div>
              </div>
              <p
                className="text-[11px]"
                style={{ color: "var(--text-4)" }}
              >
                {formatINR(t.maxValue)}
              </p>
            </div>
          ))}
        </div>
      </SectionCard>

      <SectionCard title="Routing rules" subtitle="Additional guardrails on the approval flow">
        <div className="flex flex-col gap-3 mt-3">
          <ToggleRow
            title="Maker-checker separation"
            desc="The person who drafts an entry cannot be the sole approver. Another authorised user must sign off — even if the drafter has approval rights."
            checked={makerChecker}
            onChange={setMakerChecker}
          />
          <ToggleRow
            title="Dual approval above ₹10L"
            desc="High-value entries require two independent approvers (e.g. Accounts Head + Admin) to reduce single-point-of-failure risk."
            checked={dualApproval}
            onChange={setDualApproval}
          />
          <ToggleRow
            title="Admin override with audit"
            desc="Admin can bypass the approval chain for year-end close or emergency adjustments. Every override is logged with reason + flagged in the audit trail."
            checked={adminOverride}
            onChange={setAdminOverride}
          />
        </div>
      </SectionCard>

      <SectionCard title="Voucher type permissions" subtitle="Which roles can draft, approve, and post each voucher type">
        <div className="overflow-x-auto mt-3">
          <table className="w-full text-[11px] min-w-[640px]">
            <thead>
              <tr style={{ color: "var(--text-4)" }}>
                <th className="text-left py-2 px-2 font-medium">Voucher type</th>
                <th className="text-center py-2 px-2 font-medium">Admin</th>
                <th className="text-center py-2 px-2 font-medium">Accts Head</th>
                <th className="text-center py-2 px-2 font-medium">Accounts</th>
                <th className="text-center py-2 px-2 font-medium">Jr. Accts</th>
                <th className="text-center py-2 px-2 font-medium">Manager</th>
                <th className="text-center py-2 px-2 font-medium">Sales</th>
                <th className="text-center py-2 px-2 font-medium">Field Sales</th>
              </tr>
            </thead>
            <tbody>
              {[
                { type: "Sales", row: ["DAP", "DAP", "DAP", "D", "DAP", "DA", "D"] },
                { type: "Purchase", row: ["DAP", "DAP", "DAP", "D", "DA", "—", "—"] },
                { type: "Receipt", row: ["DAP", "DAP", "DAP", "D", "DAP", "DA", "D"] },
                { type: "Payment", row: ["DAP", "DAP", "DAP", "D", "DA*", "—", "—"] },
                { type: "Contra", row: ["DAP", "DAP", "DAP", "D", "—", "—", "—"] },
                { type: "Journal", row: ["DAP", "DAP", "DAP", "—", "—", "—", "—"] },
                { type: "Credit/Debit note", row: ["DAP", "DAP", "DAP", "D", "DA", "D", "—"] },
                { type: "Bank recon", row: ["DAP", "DAP", "DAP", "—", "DA", "—", "—"] },
              ].map((r, i) => (
                <tr
                  key={i}
                  style={{ borderTop: "1px solid var(--border)" }}
                >
                  <td className="py-2 px-2 font-medium" style={{ color: "var(--text-1)" }}>
                    {r.type}
                  </td>
                  {r.row.map((cell, ci) => (
                    <td
                      key={ci}
                      className="py-2 px-2 text-center tabular-nums"
                      style={{
                        color:
                          cell === "—"
                            ? "var(--text-4)"
                            : cell.includes("P")
                            ? "var(--green)"
                            : cell.includes("A")
                            ? "var(--yellow)"
                            : "var(--blue)",
                        fontFamily: "'Space Grotesk', sans-serif",
                        fontWeight: 600,
                      }}
                    >
                      {cell}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
          <p
            className="text-[10px] mt-3 flex items-center gap-4 flex-wrap"
            style={{ color: "var(--text-4)" }}
          >
            <span>
              <span style={{ color: "var(--blue)", fontWeight: 600 }}>D</span> = Draft
            </span>
            <span>
              <span style={{ color: "var(--yellow)", fontWeight: 600 }}>A</span> = Approve
            </span>
            <span>
              <span style={{ color: "var(--green)", fontWeight: 600 }}>P</span> = Post to Tally
            </span>
            <span>* Payment &gt;₹1L routes to Accounts regardless</span>
          </p>
        </div>
      </SectionCard>

      <div className="flex items-center gap-2 justify-end">
        <AnimatePresence>
          {saved && (
            <motion.span
              initial={{ opacity: 0, x: 8 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 8 }}
              className="text-[12px] font-medium"
              style={{ color: "var(--green)" }}
            >
              ✓ Saved
            </motion.span>
          )}
        </AnimatePresence>
        <button
          onClick={() => {
            setSaved(true);
            window.setTimeout(() => setSaved(false), 2000);
          }}
          className="text-xs font-semibold px-3 py-2 rounded-lg cursor-pointer transition-opacity hover:opacity-90"
          style={{ background: "var(--green)", color: "white" }}
        >
          Save approval rules
        </button>
      </div>
    </div>
  );
}

function ToggleRow({
  title,
  desc,
  checked,
  onChange,
}: {
  title: string;
  desc: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <div
      className="flex items-start gap-3 px-4 py-3 rounded-lg"
      style={{ background: "var(--bg-hover)", border: "1px solid var(--border)" }}
    >
      <div className="flex-1 min-w-0">
        <p className="text-[13px] font-semibold" style={{ color: "var(--text-1)" }}>
          {title}
        </p>
        <p className="text-[11px] mt-0.5" style={{ color: "var(--text-3)" }}>
          {desc}
        </p>
      </div>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        onClick={() => onChange(!checked)}
        className="flex-shrink-0 relative inline-flex h-5 w-9 rounded-full transition-colors cursor-pointer mt-0.5"
        style={{
          background: checked ? "var(--green)" : "var(--bg-surface)",
          border: "1px solid var(--border)",
        }}
      >
        <motion.span
          animate={{ x: checked ? 16 : 2 }}
          transition={{ duration: 0.15 }}
          className="absolute top-0.5 w-3.5 h-3.5 rounded-full"
          style={{ background: checked ? "#fff" : "var(--text-4)" }}
        />
      </button>
    </div>
  );
}

/* ================================================================== */
/*  RemindersTab — Payment Reminders MVP (May 7 2026 meeting)         */
/*                                                                    */
/*  Three vertical stages, top-to-bottom:                             */
/*    1. Setup Gate  — contact import + master toggle (mandatory)     */
/*    2. Defaults    — trigger / terms / template / channel / send-to */
/*    3. Monitor     — schedule table with status + filters           */
/*                                                                    */
/*  Why this shape: the team called the previous 8-section panel      */
/*  confusing. The MVP is "import contacts → enable with sensible     */
/*  defaults → monitor" so the user never gets lost in config.        */
/* ================================================================== */

function RemindersTab() {
  // Demo seed: pretend the user has already onboarded — contacts imported
  // (mostly) + master toggle on. This makes the Monitor + Live State strip
  // show realistic activity instead of empty zeros. Production new-tenant
  // default stays `enabled: false` per the May 7 meeting; the override only
  // applies to the prototype's initial render.
  const [rules, setRules] = useState<ReminderAutomationRules>({
    ...REMINDER_AUTOMATION_DEFAULTS,
    enabled: true,
  });
  const [saved, setSaved] = useState(false);
  const [bulkImportOpen, setBulkImportOpen] = useState(false);
  const [contactManagerOpen, setContactManagerOpen] = useState(false);
  const [ledgerPickerOpen, setLedgerPickerOpen] = useState(false);
  const [pickerToast, setPickerToast] = useState<string | null>(null);

  const update = <K extends keyof ReminderAutomationRules>(
    key: K,
    value: ReminderAutomationRules[K],
  ) => {
    setRules((prev) => ({ ...prev, [key]: value }));
  };

  const handleSave = () => {
    setSaved(true);
    window.setTimeout(() => setSaved(false), 2200);
  };

  const gate = computeReminderSetupGate(rules);

  return (
    <div className="flex flex-col gap-5">
      {/* Page intro — sets expectations */}
      <div>
        <h2 className="text-base font-bold" style={{ color: "var(--text-1)" }}>
          Payment reminders
        </h2>
        <p className="text-[12px] mt-1" style={{ color: "var(--text-4)" }}>
          Three steps: import contacts, pick defaults, monitor.
          Reminders go to the <strong style={{ color: "var(--text-2)" }}>invoice owner</strong> — not your accounting team.
        </p>
      </div>

      {/* Live State strip — only when reminders are ON (gated per user pref) */}
      {rules.enabled && <LiveStateHero rules={rules} />}

      {/* ─── 1. Setup Gate ─────────────────────────────────────── */}
      <SetupGateSection
        gate={gate}
        rules={rules}
        update={update}
        onImportClick={() => setBulkImportOpen(true)}
        onManageContacts={() => setContactManagerOpen(true)}
        onPickParties={() => setLedgerPickerOpen(true)}
      />

      {/* ─── 2. Defaults ─────────────────────────────────────── */}
      <DefaultsSection
        rules={rules}
        update={update}
        onManageContacts={() => setContactManagerOpen(true)}
      />

      {/* ─── 3. Monitor ─────────────────────────────────────── */}
      <MonitorSection rules={rules} />

      {/* ─── Advanced settings (collapsed by default) ─────────── */}
      <AdvancedSection rules={rules} update={update} />

      {/* Sticky save bar */}
      <div
        className="sticky bottom-0 flex items-center justify-between gap-3 py-3 px-4 rounded-md mt-2"
        style={{
          background: "color-mix(in srgb, var(--bg-surface) 92%, transparent)",
          backdropFilter: "blur(8px)",
          border: "1px solid var(--border)",
        }}
      >
        <p className="text-[11px]" style={{ color: "var(--text-4)" }}>
          {rules.enabled
            ? <>Active. Next cron <span style={{ color: "var(--text-2)" }}>{rules.cronTimeIst}</span> IST {nextBatchDateLabel(rules)}.</>
            : <>Reminders are paused. Toggle on above to start.</>}
        </p>
        <div className="flex items-center gap-3">
          <AnimatePresence>
            {saved && (
              <motion.span
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0 }}
                className="text-[12px] font-semibold"
                style={{ color: "var(--green)" }}
              >
                ✓ Saved
              </motion.span>
            )}
          </AnimatePresence>
          <button
            onClick={handleSave}
            className="text-[12px] font-semibold px-4 py-2 rounded-lg cursor-pointer"
            style={{ background: "var(--green)", color: "#fff" }}
          >
            Save defaults
          </button>
        </div>
      </div>

      {/* Modals */}
      <BulkImportModal open={bulkImportOpen} onClose={() => setBulkImportOpen(false)} />
      <ContactManagerDrawer open={contactManagerOpen} onClose={() => setContactManagerOpen(false)} />
      <LedgerPickerModal
        open={ledgerPickerOpen}
        onClose={() => setLedgerPickerOpen(false)}
        onSave={(count) => {
          setPickerToast(`Enrolled ${count} part${count === 1 ? "y" : "ies"} in auto-reminder.`);
          window.setTimeout(() => setPickerToast(null), 2500);
        }}
      />
      <AnimatePresence>
        {pickerToast && (
          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 20, opacity: 0 }}
            className="fixed bottom-24 left-1/2 -translate-x-1/2 z-[100] px-4 py-2 rounded-md text-[12px] font-semibold"
            style={{
              background: "var(--green)",
              color: "#fff",
              boxShadow: "0 8px 24px rgba(0,0,0,0.3)",
            }}
          >
            ✓ {pickerToast}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

/* ────────────────────────────────────────────────────────────────── */
/*  Stage 1 — Setup Gate                                              */
/*                                                                    */
/*  Three checklist rows, each green-✓ or amber-action.               */
/*  Step 1 must be ✓ before steps 2 & 3 do anything useful.           */
/* ────────────────────────────────────────────────────────────────── */
function SetupGateSection({
  gate,
  rules,
  update,
  onImportClick,
  onManageContacts,
  onPickParties,
}: {
  gate: ReturnType<typeof computeReminderSetupGate>;
  rules: ReminderAutomationRules;
  update: <K extends keyof ReminderAutomationRules>(
    key: K,
    value: ReminderAutomationRules[K],
  ) => void;
  onImportClick: () => void;
  onManageContacts: () => void;
  onPickParties: () => void;
}) {
  const [showInfo, setShowInfo] = useState(false);

  return (
    <div
      className="rounded-md overflow-hidden"
      style={{ background: "var(--bg-surface)", border: "1px solid var(--border)" }}
    >
      {/* Card header */}
      <div
        className="flex items-center justify-between px-4 py-3"
        style={{ borderBottom: "1px solid var(--border)" }}
      >
        <div className="flex items-center gap-2">
          <span
            className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded"
            style={{
              background: "color-mix(in srgb, var(--green) 14%, transparent)",
              color: "var(--green)",
            }}
          >
            Step 1
          </span>
          <h3 className="text-[13px] font-bold" style={{ color: "var(--text-1)" }}>
            Setup
          </h3>
        </div>
        <span
          className="text-[10.5px]"
          style={{
            color: gate.canFire && gate.contactsFullyImported
              ? "var(--green)"
              : gate.canFire
                ? "var(--blue)"
                : "var(--yellow)",
          }}
        >
          {gate.canFire && gate.contactsFullyImported
            ? "✓ Ready"
            : gate.canFire
              ? "Running with gaps"
              : "Action needed"}
        </span>
      </div>

      <div className="p-4 flex flex-col gap-3">
        {/* Checklist row 1 — Contact import (green ✓ only when 100% covered;
             partial coverage shows yellow "warning needed" but still unlocks
             the master toggle below). */}
        <GateRow
          done={gate.contactsFullyImported}
          icon={<Phone size={14} />}
          title="Import party contacts"
          subtitle={
            gate.contactsFullyImported
              ? `All ${gate.totalParties} parties have a phone number.`
              : `${gate.contactsMissingCount} of ${gate.totalParties} parties missing a phone or email — they’ll be skipped at send time.`
          }
          actionLabel={gate.contactsFullyImported ? "Re-import" : "Import contacts"}
          actionVariant={gate.contactsFullyImported ? "ghost" : "primary"}
          onAction={onImportClick}
          secondaryActionLabel="Manage contacts"
          onSecondaryAction={onManageContacts}
        />

        {/* Checklist row 2 — Master toggle (unlocked once at least one
             party can receive a reminder; partial coverage is OK). */}
        <GateRow
          done={rules.enabled}
          disabled={!gate.contactsImported}
          icon={<Send size={14} />}
          title={
            <span className="flex items-center gap-1.5">
              Enable automated reminders
              <button
                type="button"
                onClick={() => setShowInfo((v) => !v)}
                aria-label="What gets sent?"
                className="cursor-pointer"
                style={{ color: "var(--text-4)" }}
              >
                <Info size={12} />
              </button>
            </span>
          }
          subtitle={
            rules.enabled
              ? `Riko will send the daily batch at ${rules.cronTimeIst} IST. ${gate.contactsImportedCount} parties scoped.`
              : "Off by default. Switch on after you’ve imported contacts and reviewed defaults."
          }
          rightControl={
            <button
              role="switch"
              aria-checked={rules.enabled}
              disabled={!gate.contactsImported}
              onClick={() => update("enabled", !rules.enabled)}
              className="relative cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
              style={{
                width: 36,
                height: 20,
                borderRadius: 999,
                background: rules.enabled ? "var(--green)" : "var(--bg-hover)",
                border: "1px solid var(--border)",
                transition: "background 150ms",
              }}
            >
              <span
                style={{
                  position: "absolute",
                  top: 2,
                  left: rules.enabled ? 18 : 2,
                  width: 14,
                  height: 14,
                  borderRadius: 999,
                  background: "#fff",
                  transition: "left 150ms",
                }}
              />
            </button>
          }
        />

        {/* Checklist row 3 — Pick which parties get enrolled. Biz Analyst-
             style flat-list ledger picker with search + select-all-applicable.
             Disabled until contacts are imported (otherwise the picker would
             show parties without contacts as locked, which is right but
             discouraging on a first-time empty state). */}
        <GateRow
          done={false}
          disabled={!gate.contactsImported}
          icon={<Users size={14} />}
          title="Pick parties to enroll"
          subtitle={
            gate.contactsImported
              ? "Multi-select from your full party list with search. Locked parties (no contact, blacklisted, etc.) are shown but can't be enrolled."
              : "Available once contacts are imported."
          }
          actionLabel="Pick parties"
          actionVariant="ghost"
          onAction={onPickParties}
        />

        {/* Info popover */}
        <AnimatePresence>
          {showInfo && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.18 }}
              className="rounded-md p-3 text-[11.5px] leading-relaxed"
              style={{
                background: "color-mix(in srgb, var(--blue) 8%, transparent)",
                border: "1px solid color-mix(in srgb, var(--blue) 22%, transparent)",
                color: "var(--text-2)",
              }}
            >
              <p className="font-semibold mb-1" style={{ color: "var(--blue)" }}>
                What gets sent when reminders are on?
              </p>
              <ul className="list-disc list-inside space-y-0.5">
                <li>One {rules.cronTimeIst}-IST batch per day, weekdays only.</li>
                <li>Up to <strong>{rules.dailyBatchLimit} parties</strong> per batch (rate-limited to protect deliverability).</li>
                <li>Tone ladder: <strong>gentle</strong> ≤7d → <strong>standard</strong> 8–30d → <strong>firm</strong> 31–180d.</li>
                <li>Auto-stop on payment received, “STOP” reply, or promise-to-pay detected.</li>
                <li>Hard cap: <strong>{rules.maxRemindersPerParty} sends/party</strong> before flagged for manual outreach.</li>
              </ul>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

function GateRow({
  done,
  disabled,
  icon,
  title,
  subtitle,
  actionLabel,
  actionVariant = "primary",
  onAction,
  secondaryActionLabel,
  onSecondaryAction,
  rightControl,
}: {
  done: boolean;
  disabled?: boolean;
  icon: React.ReactNode;
  title: React.ReactNode;
  subtitle: string;
  actionLabel?: string;
  actionVariant?: "primary" | "ghost";
  onAction?: () => void;
  secondaryActionLabel?: string;
  onSecondaryAction?: () => void;
  rightControl?: React.ReactNode;
}) {
  return (
    <div
      className="flex flex-col sm:flex-row sm:items-start gap-3 rounded-md p-3"
      style={{
        background: done
          ? "color-mix(in srgb, var(--green) 5%, transparent)"
          : disabled
            ? "color-mix(in srgb, var(--bg-hover) 40%, transparent)"
            : "color-mix(in srgb, var(--yellow) 6%, transparent)",
        border: `1px solid ${done ? "color-mix(in srgb, var(--green) 22%, transparent)" : disabled ? "var(--border)" : "color-mix(in srgb, var(--yellow) 22%, transparent)"}`,
        opacity: disabled ? 0.5 : 1,
      }}
    >
      {/* Title block — icon + title + subtitle. On mobile this is row 1; on desktop it's the left side. */}
      <div className="flex items-start gap-3 flex-1 min-w-0 w-full">
        <div
          className="flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center"
          style={{
            background: done ? "var(--green)" : "transparent",
            color: done ? "#fff" : "var(--text-3)",
            border: done ? "none" : "1px solid var(--border)",
          }}
        >
          {done ? <Check size={12} /> : icon}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-[12.5px] font-semibold" style={{ color: "var(--text-1)" }}>
            {title}
          </p>
          <p className="text-[11px] mt-0.5" style={{ color: "var(--text-3)" }}>
            {subtitle}
          </p>
        </div>
        {/* On desktop, a switch-style rightControl goes inline next to title */}
        {rightControl && <div className="hidden sm:block flex-shrink-0">{rightControl}</div>}
      </div>

      {/* Action block — on mobile this is row 2 (full width); on desktop it sits to the right. */}
      {rightControl ? (
        // For switch-style rightControl, mobile row 2 right-aligns it.
        <div className="sm:hidden self-end flex-shrink-0">{rightControl}</div>
      ) : actionLabel && onAction ? (
        <div className="flex items-center gap-2 flex-shrink-0 w-full sm:w-auto">
          {secondaryActionLabel && onSecondaryAction && (
            <button
              onClick={onSecondaryAction}
              disabled={disabled}
              className="text-[11px] font-semibold px-3 py-1.5 rounded-md cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed flex-1 sm:flex-none"
              style={{
                background: "transparent",
                color: "var(--text-2)",
                border: "1px solid var(--border)",
              }}
            >
              {secondaryActionLabel}
            </button>
          )}
          <button
            onClick={onAction}
            disabled={disabled}
            className="text-[11px] font-semibold px-3 py-1.5 rounded-md cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-1 flex-1 sm:flex-none"
            style={{
              background: actionVariant === "primary" ? "var(--green)" : "transparent",
              color: actionVariant === "primary" ? "#fff" : "var(--text-2)",
              border: actionVariant === "primary" ? "none" : "1px solid var(--border)",
            }}
          >
            {actionLabel}
            {actionVariant === "primary" && <ArrowRight size={11} />}
          </button>
        </div>
      ) : null}
    </div>
  );
}

/* ────────────────────────────────────────────────────────────────── */
/*  Stage 2 — Defaults                                                */
/*                                                                    */
/*  Single card with 4 settings rows:                                 */
/*    A. Trigger (radio) + N input                                    */
/*    B. Payment terms ladder (visual: voucher → ledger → 45d)        */
/*    C. Template tone (3 chips + Request custom)                     */
/*    D. Channel (WA/Email checkboxes) + recipient (Owner/Accounting) */
/* ────────────────────────────────────────────────────────────────── */
function DefaultsSection({
  rules,
  update,
  onManageContacts,
}: {
  rules: ReminderAutomationRules;
  update: <K extends keyof ReminderAutomationRules>(
    key: K,
    value: ReminderAutomationRules[K],
  ) => void;
  onManageContacts: () => void;
}) {
  return (
    <div
      className="rounded-md overflow-hidden"
      style={{ background: "var(--bg-surface)", border: "1px solid var(--border)" }}
    >
      <div
        className="flex items-center justify-between px-4 py-3"
        style={{ borderBottom: "1px solid var(--border)" }}
      >
        <div className="flex items-center gap-2">
          <span
            className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded"
            style={{
              background: "color-mix(in srgb, var(--blue) 14%, transparent)",
              color: "var(--blue)",
            }}
          >
            Step 2
          </span>
          <h3 className="text-[13px] font-bold" style={{ color: "var(--text-1)" }}>
            Defaults
          </h3>
        </div>
        <span className="text-[10.5px]" style={{ color: "var(--text-4)" }}>
          Applied to all new parties
        </span>
      </div>

      <div className="p-4 flex flex-col gap-5">
        {/* A. Trigger — periodic reminder cadence (mutually exclusive) */}
        <DefaultRow
          label="When to chase overdue invoices"
          help="One cadence. Per-event sends are independent — see below."
        >
          <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-2">
            {REMINDER_TRIGGER_PRESETS.map((t) => {
              const active = rules.triggerType === t.id;
              return (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => update("triggerType", t.id)}
                  className="rounded-md p-3 text-left cursor-pointer transition-colors"
                  style={{
                    background: active ? "color-mix(in srgb, var(--green) 8%, transparent)" : "var(--bg-primary)",
                    border: `1px solid ${active ? "var(--green)" : "var(--border)"}`,
                  }}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span
                      className="text-[12px] font-bold"
                      style={{ color: active ? "var(--green)" : "var(--text-1)" }}
                    >
                      {t.label}
                    </span>
                    {t.recommended && (
                      <span
                        className="text-[9px] uppercase tracking-wider font-bold px-1.5 py-0.5 rounded"
                        style={{
                          background: "color-mix(in srgb, var(--green) 14%, transparent)",
                          color: "var(--green)",
                        }}
                      >
                        Default
                      </span>
                    )}
                  </div>
                  <p className="text-[10.5px] leading-snug" style={{ color: "var(--text-3)" }}>
                    {t.blurb}
                  </p>
                </button>
              );
            })}
          </div>

          {/* N-input only when relevant */}
          {(rules.triggerType === "n-days-after-due" ||
            rules.triggerType === "n-days-before-due") && (
            <div className="flex items-center gap-2 mt-2">
              <span className="text-[11.5px]" style={{ color: "var(--text-3)" }}>
                Send
              </span>
              <input
                type="number"
                min={1}
                max={60}
                value={rules.triggerOffsetDays}
                onChange={(e) =>
                  update("triggerOffsetDays", Math.max(1, Math.min(60, parseInt(e.target.value, 10) || 1)))
                }
                className="w-16 text-[12px] font-semibold px-2 py-1 rounded-md tabular-nums text-right"
                style={{
                  background: "var(--bg-primary)",
                  color: "var(--text-1)",
                  border: "1px solid var(--border)",
                  fontFamily: "'Space Grotesk', sans-serif",
                }}
              />
              <span className="text-[11.5px]" style={{ color: "var(--text-3)" }}>
                day{rules.triggerOffsetDays === 1 ? "" : "s"}{" "}
                {rules.triggerType === "n-days-after-due" ? "after" : "before"} due date
              </span>
            </div>
          )}

          {/* Day-of-month picker — only when Monthly. Inspired by Biz
              Analyst's 7-col grid. Days 29-31 silently fall back to
              month-end (Feb 30 → Feb 28/29, etc.). */}
          {rules.triggerType === "monthly" && (
            <div className="flex flex-col gap-2 mt-2">
              <div className="flex items-center justify-between">
                <span className="text-[11.5px]" style={{ color: "var(--text-3)" }}>
                  Send on day
                </span>
                <span className="text-[10.5px]" style={{ color: "var(--text-4)" }}>
                  {rules.triggerDayOfMonth > 28
                    ? `Days 29-31 fall back to month-end if the month is shorter`
                    : `${ordinalDay(rules.triggerDayOfMonth)} of every month · ${rules.cronTimeIst} IST`}
                </span>
              </div>
              <div className="grid grid-cols-7 gap-1">
                {Array.from({ length: 31 }, (_, i) => i + 1).map((d) => {
                  const active = rules.triggerDayOfMonth === d;
                  return (
                    <button
                      key={d}
                      type="button"
                      onClick={() => update("triggerDayOfMonth", d)}
                      className="text-[11px] py-1.5 rounded-md cursor-pointer tabular-nums transition-colors"
                      style={{
                        background: active
                          ? "var(--blue)"
                          : "var(--bg-primary)",
                        color: active ? "#fff" : "var(--text-2)",
                        border: `1px solid ${active ? "var(--blue)" : "var(--border)"}`,
                        fontWeight: active ? 700 : 400,
                      }}
                    >
                      {d}
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </DefaultRow>

        {/* A2. Per-event communications — orthogonal to the cadence trigger.
              Lifecycle-event sends (invoice created / payment received) fire
              independently from the periodic reminder ladder. Both can be on
              with any cadence. Modeled after Credflow's "instant invoice
              delivery" pattern called out in the May 7 meeting. */}
        <DefaultRow
          label="Per-event communications"
          help="Fires on voucher events — separate from the cadence above."
        >
          <div className="flex flex-col gap-2">
            <PerEventToggle
              checked={rules.sendOnInvoiceCreate}
              onToggle={() => update("sendOnInvoiceCreate", !rules.sendOnInvoiceCreate)}
              icon="📤"
              title="Send invoice + payment link on creation"
              subtitle="Fires the moment the sales voucher posts to Tally."
              recommended
            />
            <PerEventToggle
              checked={rules.sendOnPaymentReceived}
              onToggle={() => update("sendOnPaymentReceived", !rules.sendOnPaymentReceived)}
              icon="🙏"
              title="Send thank-you on payment receipt"
              subtitle="Acknowledges payment within 30 minutes of receipt voucher."
            />
          </div>
        </DefaultRow>

        {/* B. Follow-up cadence — May 8 mtg ask: make repeat schedule visible */}
        <DefaultRow
          label="Follow-up cadence"
          help="How often to repeat. See the schedule preview below."
        >
          <FollowUpCadenceControls rules={rules} update={update} />
        </DefaultRow>

        {/* B2. Message content — Biz Analyst "Choose columns to share" +
              "Greeting" + "Add Bank Account" + Credflow "Show Ledger"
              patterns. Operator controls greeting, body columns, ledger
              snapshot, due-bills filter, and bank footer in one row. */}
        <DefaultRow
          label="What goes in the message"
          help="Greeting · columns · ledger · bank account · due-bills filter."
        >
          <div className="flex flex-col gap-3">
            {/* Greeting — supports {partyName} placeholder */}
            <div>
              <p
                className="text-[10.5px] uppercase tracking-wider font-semibold mb-1.5"
                style={{ color: "var(--text-4)" }}
              >
                Greeting
              </p>
              <input
                type="text"
                value={rules.customGreeting}
                onChange={(e) => update("customGreeting", e.target.value)}
                placeholder="Dear {partyName} team,"
                maxLength={120}
                className="w-full text-[12px] px-3 py-2 rounded-md"
                style={{
                  background: "var(--bg-primary)",
                  border: "1px solid var(--border)",
                  color: "var(--text-1)",
                }}
              />
              <p
                className="text-[10px] mt-1"
                style={{ color: "var(--text-4)" }}
              >
                Use <code style={{ color: "var(--blue)" }}>{"{partyName}"}</code> to insert the party name.
                Preview: <span style={{ color: "var(--text-3)" }}>{rules.customGreeting.replace("{partyName}", "Nykaa")}</span>
              </p>
            </div>

            {/* Columns multi-select */}
            <div>
              <p
                className="text-[10.5px] uppercase tracking-wider font-semibold mb-1.5"
                style={{ color: "var(--text-4)" }}
              >
                Columns to include
              </p>
              <div className="flex items-center gap-1.5 flex-wrap">
                {REMINDER_COLUMN_PRESETS.map((c) => {
                  const active = rules.includeColumnsInReminder.includes(c.id);
                  return (
                    <button
                      key={c.id}
                      type="button"
                      onClick={() => {
                        const next = active
                          ? rules.includeColumnsInReminder.filter((x) => x !== c.id)
                          : [...rules.includeColumnsInReminder, c.id];
                        update("includeColumnsInReminder", next);
                      }}
                      className="text-[11px] font-medium px-2.5 py-1 rounded-md cursor-pointer flex items-center gap-1.5"
                      style={{
                        background: active
                          ? "color-mix(in srgb, var(--green) 12%, transparent)"
                          : "var(--bg-primary)",
                        color: active ? "var(--green)" : "var(--text-3)",
                        border: `1px solid ${active ? "color-mix(in srgb, var(--green) 35%, transparent)" : "var(--border)"}`,
                      }}
                      title={c.blurb}
                    >
                      {active ? "✓" : "+"} {c.label}
                    </button>
                  );
                })}
              </div>
              <p
                className="text-[10px] mt-1.5"
                style={{ color: "var(--text-4)" }}
              >
                {rules.includeColumnsInReminder.length === 0
                  ? "⚠ At least one column recommended — message body will be empty otherwise."
                  : `${rules.includeColumnsInReminder.length} of ${REMINDER_COLUMN_PRESETS.length} columns`}
              </p>
            </div>

            {/* Show ledger toggle (Credflow) */}
            <ToggleRow
              title="Attach ledger summary"
              desc="Append a brief ledger snapshot (running balance + last 5 vouchers) to the reminder. Helps the party reconcile but inflates message length."
              checked={rules.showLedgerInReminders}
              onChange={(v) => update("showLedgerInReminders", v)}
            />

            {/* Send only due bills (Biz Analyst) */}
            <ToggleRow
              title="Send only due bills"
              desc="Limit the bill list to invoices that are past their due date. Pre-due invoices are excluded — useful when you want a strict 'you're late' tone."
              checked={rules.sendOnlyDueBills}
              onChange={(v) => update("sendOnlyDueBills", v)}
            />

            {/* Email identity — Reply-to + Signature live here too, in
                addition to the deeper Channels accordion. Biz Analyst's
                Auto Reminder Settings puts all of this on one page, so
                operators don't hunt for it. Both surfaces edit the same
                React state — Channels stays the canonical channel-config
                view, this is the contextual quick-edit. */}
            <details
              className="rounded-lg overflow-hidden"
              style={{ background: "var(--bg-hover)", border: "1px solid var(--border)" }}
            >
              <summary
                className="text-[13px] font-semibold px-4 py-3 cursor-pointer flex items-center justify-between gap-2"
                style={{ color: "var(--text-1)", listStyle: "none" }}
              >
                <span className="flex items-center gap-2">
                  <Mail size={13} style={{ color: "var(--text-3)" }} />
                  Email identity
                </span>
                <span className="text-[10.5px] truncate" style={{ color: "var(--text-4)" }}>
                  Reply-to · Signature · From-address
                </span>
              </summary>
              <div
                className="flex flex-col gap-3 px-4 py-3"
                style={{ borderTop: "1px solid var(--border)", background: "var(--bg-surface)" }}
              >
                <div>
                  <p className="text-[10.5px] uppercase tracking-wider font-semibold mb-1.5" style={{ color: "var(--text-4)" }}>
                    From-address
                  </p>
                  <input
                    type="email"
                    value={rules.emailFromAddress}
                    onChange={(e) => update("emailFromAddress", e.target.value)}
                    className="w-full text-[12px] px-3 py-2 rounded-md"
                    style={{ background: "var(--bg-primary)", border: "1px solid var(--border)", color: "var(--text-1)" }}
                  />
                </div>
                <div>
                  <p className="text-[10.5px] uppercase tracking-wider font-semibold mb-1.5" style={{ color: "var(--text-4)" }}>
                    Reply-to email
                  </p>
                  <input
                    type="email"
                    value={rules.emailReplyTo}
                    onChange={(e) => update("emailReplyTo", e.target.value)}
                    className="w-full text-[12px] px-3 py-2 rounded-md"
                    style={{ background: "var(--bg-primary)", border: "1px solid var(--border)", color: "var(--text-1)" }}
                  />
                  <p className="text-[10px] mt-1" style={{ color: "var(--text-4)" }}>
                    Replies route here. Usually <code style={{ color: "var(--blue)" }}>accounts@</code> while sends come from the owner's address.
                  </p>
                </div>
                <div>
                  <p className="text-[10.5px] uppercase tracking-wider font-semibold mb-1.5" style={{ color: "var(--text-4)" }}>
                    Signature
                  </p>
                  <textarea
                    value={rules.emailSignature}
                    onChange={(e) => update("emailSignature", e.target.value)}
                    rows={3}
                    className="w-full text-[12px] px-3 py-2 rounded-md resize-none"
                    style={{ background: "var(--bg-primary)", border: "1px solid var(--border)", color: "var(--text-1)" }}
                  />
                </div>
              </div>
            </details>

            {/* Add Bank Account (Biz Analyst) — when ON, appends bank
                details from Tally's company master to the footer so the
                recipient can settle directly. Preview shows what gets
                attached so the operator can confirm before saving. */}
            <div
              className="rounded-lg overflow-hidden"
              style={{ background: "var(--bg-hover)", border: "1px solid var(--border)" }}
            >
              <div className="flex items-start gap-3 px-4 py-3 flex-wrap">
                <div className="flex-1 min-w-[220px]">
                  <p className="text-[13px] font-semibold" style={{ color: "var(--text-1)" }}>
                    Add bank account to footer
                  </p>
                  <p className="text-[11px] mt-0.5" style={{ color: "var(--text-3)" }}>
                    Appends your company bank details so the recipient can settle directly.
                    Pulled from your Tally company master.
                  </p>
                </div>
                <button
                  onClick={() => update("addBankAccount", !rules.addBankAccount)}
                  className="relative inline-flex h-5 w-9 rounded-full transition-colors cursor-pointer flex-shrink-0"
                  style={{
                    background: rules.addBankAccount ? "var(--green)" : "var(--bg-surface)",
                    border: "1px solid var(--border)",
                  }}
                  aria-label="Toggle add bank account"
                >
                  <motion.span
                    animate={{ x: rules.addBankAccount ? 16 : 2 }}
                    transition={{ duration: 0.15 }}
                    className="absolute top-0.5 w-3.5 h-3.5 rounded-full"
                    style={{ background: rules.addBankAccount ? "#fff" : "var(--text-4)" }}
                  />
                </button>
              </div>
              <AnimatePresence initial={false}>
                {rules.addBankAccount && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.18 }}
                    style={{ overflow: "hidden" }}
                  >
                    <div
                      className="px-4 py-3 text-[10.5px] leading-relaxed tabular-nums"
                      style={{
                        borderTop: "1px solid var(--border)",
                        background: "var(--bg-surface)",
                        color: "var(--text-3)",
                      }}
                    >
                      <p
                        className="text-[9.5px] uppercase tracking-wider font-semibold mb-1.5"
                        style={{ color: "var(--text-4)" }}
                      >
                        Footer preview
                      </p>
                      <div style={{ color: "var(--text-2)" }}>
                        <p style={{ fontWeight: 600 }}>
                          {COMPANY.bankDetails.accountHolder}
                        </p>
                        <p>{COMPANY.bankDetails.bankName} · {COMPANY.bankDetails.branch}</p>
                        <p>A/c: {COMPANY.bankDetails.accountNumber} · IFSC: {COMPANY.bankDetails.ifsc}</p>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </DefaultRow>

        {/* C. Tone + payment terms — collapsed by default. Configure-once
              settings whose defaults (voucher → ledger → 45d, Auto tone)
              are correct out-of-the-box. Hidden behind one expander to
              cut Defaults from 6 rows to 4 in the default view. */}
        <CollapsibleAdvanced label="Tone & payment terms" hint="Defaults are sensible — only open if you want to override">
          {/* Payment terms ladder */}
          <DefaultRow
            label="Payment terms source"
            help="Voucher → ledger → 45d default."
          >
            <div className="flex items-stretch gap-1.5 flex-wrap">
              <TermsLadderStep n={1} title="Voucher" subtitle="Per-invoice override" accent="var(--green)" />
              <TermsLadderArrow />
              <TermsLadderStep n={2} title="Ledger" subtitle="Party master default" accent="var(--blue)" />
              <TermsLadderArrow />
              <TermsLadderStep
                n={3}
                title={`${rules.paymentTermsFallbackDays}-day fallback`}
                subtitle="If neither set"
                accent="var(--text-4)"
                editable={
                  <input
                    type="number"
                    min={7}
                    max={120}
                    value={rules.paymentTermsFallbackDays}
                    onChange={(e) =>
                      update(
                        "paymentTermsFallbackDays",
                        Math.max(7, Math.min(120, parseInt(e.target.value, 10) || 45)),
                      )
                    }
                    className="w-12 text-[10.5px] font-semibold px-1.5 py-0.5 rounded tabular-nums text-right"
                    style={{ background: "var(--bg-primary)", color: "var(--text-1)", border: "1px solid var(--border)" }}
                  />
                }
              />
            </div>
          </DefaultRow>

          {/* Tone picker */}
          <DefaultRow label="Default tone" help="Auto picks by overdue days. Override to lock one tone.">
            <div className="flex flex-wrap gap-2">
              <ToneChip
                active={rules.defaultTone === "auto"}
                label="Auto (recommended)"
                sub="Ladder by overdue days"
                onClick={() => update("defaultTone", "auto")}
              />
              {REMINDER_TONE_PRESETS.map((p) => (
                <ToneChip
                  key={p.id}
                  active={rules.defaultTone === p.id}
                  label={p.label}
                  sub={`${p.daysBucket} · ${p.blurb}`}
                  onClick={() => update("defaultTone", p.id)}
                />
              ))}
            </div>
            <button
              type="button"
              className="text-[10.5px] font-semibold mt-2 cursor-pointer"
              style={{ color: "var(--blue)" }}
            >
              Request a custom template →
            </button>
          </DefaultRow>
        </CollapsibleAdvanced>

        {/* D. Channels — automation routes through MSG91 (Email + SMS only).
              WhatsApp is intentionally excluded from automation: MSG91's
              WhatsApp BSP carries ban risk at our send volumes, and WAMe
              (our manual provider) doesn't expose a programmatic send API.
              For WhatsApp reminders, use Outstanding's per-party "Remind"
              button — that opens a wa.me deep-link with the message
              pre-filled so the owner can paste-and-send. */}
        <DefaultRow
          label="Channels"
          help="Automation goes Email + SMS. WhatsApp is sent manually from Outstanding."
        >
          <div className="flex flex-wrap gap-2">
            <ChannelToggle
              channel="email"
              label="Email"
              replyRate={REMINDER_ANALYTICS_30D.replyRateByChannel.email}
              rules={rules}
              update={update}
            />
            <ChannelToggle
              channel="sms"
              label="SMS"
              replyRate={REMINDER_ANALYTICS_30D.replyRateByChannel.sms}
              rules={rules}
              update={update}
            />
            {/* WhatsApp chip — clickable, jumps to Outstanding so users
                 can actually GO to the manual surface in one click instead
                 of reading prose about where it lives. */}
            <button
              type="button"
              onClick={() => window.dispatchEvent(new CustomEvent("riko:navigate", { detail: "outstanding" }))}
              className="rounded-md px-3 py-2 flex items-center gap-2 cursor-pointer transition-colors"
              style={{
                background: "var(--bg-primary)",
                border: "1px dashed var(--border)",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderStyle = "solid";
                e.currentTarget.style.borderColor = "var(--orange)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderStyle = "dashed";
                e.currentTarget.style.borderColor = "var(--border)";
              }}
              title="Go to Outstanding — send WhatsApp reminders manually from each party row"
            >
              <MessageCircle size={13} style={{ color: "var(--text-3)" }} />
              <span className="text-[11.5px] font-semibold" style={{ color: "var(--text-2)" }}>
                WhatsApp
              </span>
              <span
                className="text-[9px] uppercase tracking-wider font-bold px-1.5 py-0.5 rounded flex items-center gap-1"
                style={{
                  background: "color-mix(in srgb, var(--orange) 14%, transparent)",
                  color: "var(--orange)",
                }}
              >
                Manual only
                <ArrowRight size={10} />
              </span>
            </button>
          </div>
          <p className="text-[10px] mt-1.5" style={{ color: "var(--text-4)" }}>
            <span aria-hidden>↳</span> WhatsApp via WAMe (wa.me deep-link) — sent from{" "}
            <span style={{ color: "var(--text-3)", fontWeight: 600 }}>Outstanding → Remind</span>{" "}
            on each party row.
          </p>
        </DefaultRow>

        {/* E. Who gets the reminder — multi-contact-aware strategy */}
        <DefaultRow
          label="Who gets the reminder"
          help="Defaults to the Tally contact. Add more for broader reach."
        >
          <RecipientStrategyPicker
            rules={rules}
            update={update}
            onManageContacts={onManageContacts}
          />
        </DefaultRow>
      </div>
    </div>
  );
}

function DefaultRow({
  label,
  help,
  children,
}: {
  label: string;
  help?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-2">
      <div>
        <p className="text-[11.5px] uppercase tracking-wider font-semibold" style={{ color: "var(--text-3)" }}>
          {label}
        </p>
        {help && (
          <p className="text-[10.5px] mt-0.5" style={{ color: "var(--text-4)" }}>
            {help}
          </p>
        )}
      </div>
      {children}
    </div>
  );
}

/* ────────────────────────────────────────────────────────────────────
   CollapsibleAdvanced — inline expander for "configure-once" settings.
   Used inside Defaults to hide tone + payment terms by default. The
   defaults are sensible (Auto tone, voucher → ledger → 45d), so most
   users don't need to see these controls during day-to-day adjustments.
   ──────────────────────────────────────────────────────────────────── */
function CollapsibleAdvanced({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(false);
  return (
    <div
      className="rounded-md"
      style={{ background: "var(--bg-primary)", border: "1px solid var(--border)" }}
    >
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        className="w-full flex items-center justify-between px-3 py-2.5 cursor-pointer text-left"
      >
        <div className="flex items-center gap-2 min-w-0">
          <ChevronDown
            size={12}
            style={{
              color: "var(--text-4)",
              transform: open ? "rotate(0deg)" : "rotate(-90deg)",
              transition: "transform 200ms",
              flexShrink: 0,
            }}
          />
          <span className="text-[11.5px] font-semibold" style={{ color: "var(--text-2)" }}>
            {label}
          </span>
          {hint && (
            <span className="text-[10.5px] hidden sm:inline" style={{ color: "var(--text-4)" }}>
              · {hint}
            </span>
          )}
        </div>
        <span className="text-[10.5px] flex-shrink-0" style={{ color: "var(--text-4)" }}>
          {open ? "Hide" : "Show"}
        </span>
      </button>
      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
            style={{ overflow: "hidden" }}
          >
            <div className="px-3 pb-3 flex flex-col gap-4" style={{ borderTop: "1px solid var(--border)" }}>
              <div className="pt-3" />
              {children}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

/* ────────────────────────────────────────────────────────────────────
   PerEventToggle — one-line toggle for lifecycle-event communications.
   Same visual language as the Setup gate's master toggle (right-side
   pill switch + checkmark when on) so users recognize the pattern.
   ──────────────────────────────────────────────────────────────────── */
function PerEventToggle({
  checked,
  onToggle,
  icon,
  title,
  subtitle,
  recommended,
}: {
  checked: boolean;
  onToggle: () => void;
  icon: string;
  title: string;
  subtitle: string;
  recommended?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onToggle}
      className="rounded-md p-3 flex items-start gap-3 cursor-pointer transition-colors text-left"
      style={{
        background: checked
          ? "color-mix(in srgb, var(--green) 5%, transparent)"
          : "var(--bg-primary)",
        border: `1px solid ${checked ? "color-mix(in srgb, var(--green) 32%, transparent)" : "var(--border)"}`,
      }}
    >
      {/* Leading icon block */}
      <span
        className="flex-shrink-0 w-7 h-7 rounded-md flex items-center justify-center text-sm"
        style={{
          background: checked
            ? "color-mix(in srgb, var(--green) 14%, transparent)"
            : "var(--bg-hover)",
        }}
        aria-hidden
      >
        {icon}
      </span>

      {/* Title + subtitle */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <p className="text-[12.5px] font-semibold" style={{ color: "var(--text-1)" }}>
            {title}
          </p>
          {recommended && (
            <span
              className="text-[9px] uppercase tracking-wider font-bold px-1.5 py-0.5 rounded flex-shrink-0"
              style={{
                background: "color-mix(in srgb, var(--green) 14%, transparent)",
                color: "var(--green)",
              }}
            >
              Recommended
            </span>
          )}
        </div>
        <p className="text-[10.5px] mt-0.5 leading-snug" style={{ color: "var(--text-3)" }}>
          {subtitle}
        </p>
      </div>

      {/* Toggle pill — same chrome as the master enable toggle */}
      <span
        role="switch"
        aria-checked={checked}
        className="relative flex-shrink-0 mt-0.5"
        style={{
          width: 36,
          height: 20,
          borderRadius: 999,
          background: checked ? "var(--green)" : "var(--bg-hover)",
          border: "1px solid var(--border)",
          transition: "background 150ms",
        }}
      >
        <span
          style={{
            position: "absolute",
            top: 2,
            left: checked ? 18 : 2,
            width: 14,
            height: 14,
            borderRadius: 999,
            background: "#fff",
            transition: "left 150ms",
          }}
        />
      </span>
    </button>
  );
}

/* ────────────────────────────────────────────────────────────────────
   FollowUpCadenceControls — repeat-cadence picker + max + escalation
   + visual schedule timeline preview.

   Three knobs:
     1. Frequency presets (3 / 7 / 14 days) + custom number input
     2. Max reminders before manual handoff (uses maxRemindersPerParty)
     3. Escalation window in days (uses escalateAfterDays)

   Below the controls: a horizontal timeline showing exactly when the
   next 5 reminders fire, what tone each one carries (gentle / standard
   / firm) and where the escalation milestone lands. Updates live as
   the user changes the inputs.
   ──────────────────────────────────────────────────────────────────── */
function FollowUpCadenceControls({
  rules,
  update,
}: {
  rules: ReminderAutomationRules;
  update: <K extends keyof ReminderAutomationRules>(
    key: K,
    value: ReminderAutomationRules[K],
  ) => void;
}) {
  const FREQ_PRESETS = [
    { days: 3,  label: "Every 3 days",  subtitle: "Aggressive — top 10 collections", color: "var(--red)" },
    { days: 7,  label: "Every 7 days",  subtitle: "Standard — best balance",         color: "var(--green)", recommended: true },
    { days: 14, label: "Every 14 days", subtitle: "Gentle — relationship-first",     color: "var(--blue)" },
    { days: 30, label: "Every 30 days", subtitle: "Monthly — long-cycle / retainers", color: "var(--purple)" },
  ];

  const schedule = computeReminderSchedule(rules);

  return (
    <div className="flex flex-col gap-3">
      {/* Knobs row 1 — frequency presets + custom */}
      <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-2">
        {FREQ_PRESETS.map((p) => {
          const active = rules.defaultFrequencyDays === p.days;
          return (
            <button
              key={p.days}
              type="button"
              onClick={() => update("defaultFrequencyDays", p.days)}
              className="rounded-md p-2.5 text-left cursor-pointer transition-colors"
              style={{
                background: active
                  ? `color-mix(in srgb, ${p.color} 8%, transparent)`
                  : "var(--bg-primary)",
                border: `1px solid ${active ? p.color : "var(--border)"}`,
              }}
            >
              <div className="flex items-center justify-between mb-0.5">
                <span
                  className="text-[12px] font-bold"
                  style={{ color: active ? p.color : "var(--text-1)" }}
                >
                  {p.label}
                </span>
                {p.recommended && (
                  <span
                    className="text-[9px] uppercase tracking-wider font-bold px-1.5 py-0.5 rounded"
                    style={{
                      background: "color-mix(in srgb, var(--green) 14%, transparent)",
                      color: "var(--green)",
                    }}
                  >
                    Default
                  </span>
                )}
              </div>
              <p className="text-[10.5px] leading-snug" style={{ color: "var(--text-3)" }}>
                {p.subtitle}
              </p>
            </button>
          );
        })}
      </div>

      {/* Knobs row 2 — custom frequency + max + escalation */}
      <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-[11.5px]" style={{ color: "var(--text-3)" }}>
        <span className="flex items-center gap-1.5">
          Or custom:
          <input
            type="number"
            min={1}
            max={60}
            value={rules.defaultFrequencyDays}
            onChange={(e) =>
              update("defaultFrequencyDays", Math.max(1, Math.min(60, parseInt(e.target.value, 10) || 1)))
            }
            className="w-14 text-[12px] font-semibold px-2 py-1 rounded-md tabular-nums text-right"
            style={{
              background: "var(--bg-primary)",
              color: "var(--text-1)",
              border: "1px solid var(--border)",
              fontFamily: "'Space Grotesk', sans-serif",
            }}
          />
          day{rules.defaultFrequencyDays === 1 ? "" : "s"}
        </span>
        <span style={{ color: "var(--text-4)" }}>·</span>
        <span className="flex items-center gap-1.5">
          Up to
          <input
            type="number"
            min={1}
            max={10}
            value={rules.maxRemindersPerParty}
            onChange={(e) =>
              update("maxRemindersPerParty", Math.max(1, Math.min(10, parseInt(e.target.value, 10) || 5)))
            }
            className="w-12 text-[12px] font-semibold px-2 py-1 rounded-md tabular-nums text-right"
            style={{
              background: "var(--bg-primary)",
              color: "var(--text-1)",
              border: "1px solid var(--border)",
              fontFamily: "'Space Grotesk', sans-serif",
            }}
          />
          reminder{rules.maxRemindersPerParty === 1 ? "" : "s"}
        </span>
        <span style={{ color: "var(--text-4)" }}>·</span>
        <span className="flex items-center gap-1.5">
          Then escalate after
          <input
            type="number"
            min={1}
            max={60}
            value={rules.escalateAfterDays}
            onChange={(e) =>
              update("escalateAfterDays", Math.max(1, Math.min(60, parseInt(e.target.value, 10) || 14)))
            }
            className="w-14 text-[12px] font-semibold px-2 py-1 rounded-md tabular-nums text-right"
            style={{
              background: "var(--bg-primary)",
              color: "var(--text-1)",
              border: "1px solid var(--border)",
              fontFamily: "'Space Grotesk', sans-serif",
            }}
          />
          days no reply
        </span>
      </div>

      {/* Timeline preview — horizontal strip with milestone dots */}
      <SchedulePreview schedule={schedule} rules={rules} />
    </div>
  );
}

/** Horizontal timeline showing the next 5 reminders + escalation
 *  milestone. Each dot is a reminder, colored by tone. The line
 *  underneath labels the day-offset and tone bucket per dot. */
function SchedulePreview({
  schedule,
  rules,
}: {
  schedule: ScheduledReminder[];
  rules: ReminderAutomationRules;
}) {
  const TONE_COLOR: Record<ReminderTone, string> = {
    gentle:   "var(--green)",
    standard: "var(--blue)",
    firm:     "var(--orange)",
    final:    "var(--red)",
  };

  // For positioning, the timeline spans from min(0, first) to last+pad
  const minDay = Math.min(0, schedule[0]?.dayOffset ?? 0);
  const maxDay = (schedule[schedule.length - 1]?.dayOffset ?? 30) + 2;
  const range = Math.max(1, maxDay - minDay);
  const pct = (d: number) => ((d - minDay) / range) * 100;

  // Trigger anchor — "Day 0" or due date marker
  const anchorPct = pct(0);

  return (
    <div
      className="rounded-md p-3 mt-1"
      style={{ background: "var(--bg-primary)", border: "1px solid var(--border)" }}
    >
      <div className="flex items-center justify-between mb-2">
        <span className="text-[10px] uppercase tracking-wider font-semibold" style={{ color: "var(--text-4)" }}>
          Schedule preview · for one party
        </span>
        <span className="text-[10px]" style={{ color: "var(--text-4)" }}>
          {rules.maxRemindersPerParty} reminders, then manual handoff
        </span>
      </div>

      {/* Desktop: horizontal timeline with dots positioned by day-offset */}
      <div className="hidden sm:block relative" style={{ paddingTop: 8, paddingBottom: 12 }}>
        {/* Base line */}
        <div
          style={{
            position: "absolute",
            left: 0,
            right: 0,
            top: 16,
            height: 2,
            background: "var(--border)",
            borderRadius: 1,
          }}
        />

        {/* Trigger anchor — "Due date" marker */}
        <div
          style={{
            position: "absolute",
            left: `${anchorPct}%`,
            top: 0,
            transform: "translateX(-50%)",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
          }}
        >
          <span
            className="text-[8.5px] font-bold uppercase tracking-wider mb-0.5"
            style={{ color: "var(--text-4)" }}
          >
            Due
          </span>
          <span
            style={{
              width: 1,
              height: 36,
              background: "var(--text-4)",
              opacity: 0.4,
            }}
          />
        </div>

        {/* Reminder dots */}
        {schedule.map((s) => {
          const isEscalate = s.action === "escalate";
          const color = isEscalate ? "var(--red)" : TONE_COLOR[s.tone];
          return (
            <div
              key={s.sequence}
              style={{
                position: "absolute",
                left: `${pct(s.dayOffset)}%`,
                top: 0,
                transform: "translateX(-50%)",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
              }}
            >
              {/* Day label above */}
              <span
                className="text-[10px] font-semibold tabular-nums"
                style={{
                  color: isEscalate ? "var(--red)" : "var(--text-2)",
                  fontFamily: "'Space Grotesk', sans-serif",
                  marginBottom: 2,
                }}
              >
                {s.dayOffset > 0 ? `+${s.dayOffset}d` : s.dayOffset === 0 ? "Day 0" : `${s.dayOffset}d`}
              </span>
              {/* Dot — color encodes tone, title surfaces it on hover */}
              <span
                title={isEscalate ? "Escalate to manual review" : `${s.toneLabel} reminder`}
                style={{
                  width: isEscalate ? 14 : 12,
                  height: isEscalate ? 14 : 12,
                  borderRadius: 999,
                  background: color,
                  border: `2px solid var(--bg-primary)`,
                  boxShadow: `0 0 0 1.5px ${color}`,
                  zIndex: 2,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: "#fff",
                  fontSize: 8,
                  fontWeight: 700,
                  cursor: "help",
                }}
              >
                {isEscalate ? "!" : s.sequence}
              </span>
            </div>
          );
        })}
      </div>

      {/* Mobile: vertical list — one row per milestone with dot + day + tone.
           Cramming 6 dots into 320px breaks labels, so on mobile we ditch
           the timeline metaphor and use a plain reading order (top → bottom). */}
      <div className="sm:hidden flex flex-col gap-1.5">
        {schedule.map((s) => {
          const isEscalate = s.action === "escalate";
          const color = isEscalate ? "var(--red)" : TONE_COLOR[s.tone];
          return (
            <div
              key={s.sequence}
              className="flex items-center gap-2.5 rounded-md px-2.5 py-1.5"
              style={{
                background: isEscalate
                  ? "color-mix(in srgb, var(--red) 6%, transparent)"
                  : "var(--bg-surface)",
                border: `1px solid ${isEscalate ? "color-mix(in srgb, var(--red) 28%, transparent)" : "var(--border)"}`,
              }}
            >
              {/* Sequence dot */}
              <span
                className="flex-shrink-0 inline-flex items-center justify-center text-[9px] font-bold"
                style={{
                  width: 18,
                  height: 18,
                  borderRadius: 999,
                  background: color,
                  color: "#fff",
                }}
              >
                {isEscalate ? "!" : s.sequence}
              </span>
              {/* Day offset */}
              <span
                className="text-[11.5px] font-semibold tabular-nums w-12 flex-shrink-0"
                style={{
                  color: isEscalate ? "var(--red)" : "var(--text-1)",
                  fontFamily: "'Space Grotesk', sans-serif",
                }}
              >
                {s.dayOffset > 0 ? `+${s.dayOffset}d` : s.dayOffset === 0 ? "Day 0" : `${s.dayOffset}d`}
              </span>
              {/* Tone pill */}
              <span
                className="text-[9.5px] uppercase tracking-wider font-bold px-1.5 py-0.5 rounded flex-shrink-0"
                style={{
                  background: `color-mix(in srgb, ${color} 14%, transparent)`,
                  color,
                }}
              >
                {s.toneLabel}
              </span>
              {/* Description */}
              <span className="text-[10.5px] flex-1 min-w-0 truncate" style={{ color: "var(--text-3)" }}>
                {isEscalate ? "Manual handoff to Accounts" : s.sequence === 1 ? "First reminder fires" : `Reminder #${s.sequence}`}
              </span>
            </div>
          );
        })}
      </div>

      {/* Plain-English summary line */}
      <p className="text-[10.5px] mt-2" style={{ color: "var(--text-3)" }}>
        First reminder fires{" "}
        <strong style={{ color: "var(--text-1)" }}>
          {rules.triggerType === "n-days-after-due" && `${rules.triggerOffsetDays}d after due`}
          {rules.triggerType === "n-days-before-due" && `${rules.triggerOffsetDays}d before due`}
          {rules.triggerType === "weekly" && "in the next Monday batch"}
          {rules.triggerType === "monthly" && `on the ${ordinalDay(rules.triggerDayOfMonth)} of each month`}
          {rules.triggerType === "on-create" && "when the invoice posts"}
        </strong>
        , then every <strong style={{ color: "var(--text-1)" }}>{rules.defaultFrequencyDays}{" "}
        day{rules.defaultFrequencyDays === 1 ? "" : "s"}</strong> until the party pays or we hit{" "}
        <strong style={{ color: "var(--text-1)" }}>{rules.maxRemindersPerParty} reminders</strong>.
        After that, no reply for{" "}
        <strong style={{ color: "var(--text-1)" }}>{rules.escalateAfterDays}d</strong> → flagged
        for manual review by the Accounts team.
      </p>
    </div>
  );
}

function TermsLadderStep({
  n,
  title,
  subtitle,
  accent,
  editable,
}: {
  n: number;
  title: string;
  subtitle: string;
  accent: string;
  editable?: React.ReactNode;
}) {
  return (
    <div
      className="rounded-md p-2.5 flex items-center gap-2 flex-1 min-w-[140px]"
      style={{
        background: "var(--bg-primary)",
        border: `1px solid ${accent === "var(--text-4)" ? "var(--border)" : "color-mix(in srgb, " + accent + " 30%, transparent)"}`,
      }}
    >
      <div
        className="flex-shrink-0 w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold tabular-nums"
        style={{
          background: `color-mix(in srgb, ${accent} 18%, transparent)`,
          color: accent,
        }}
      >
        {n}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5">
          <p className="text-[11.5px] font-bold" style={{ color: "var(--text-1)" }}>
            {title}
          </p>
          {editable}
        </div>
        <p className="text-[9.5px]" style={{ color: "var(--text-4)" }}>
          {subtitle}
        </p>
      </div>
    </div>
  );
}

function TermsLadderArrow() {
  return (
    <div className="flex items-center justify-center px-0.5" style={{ color: "var(--text-4)" }}>
      <ChevronRight size={14} />
    </div>
  );
}

function ToneChip({
  active,
  label,
  sub,
  onClick,
}: {
  active: boolean;
  label: string;
  sub: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="rounded-md p-2.5 text-left cursor-pointer transition-colors flex-1 min-w-[160px] max-w-[240px]"
      style={{
        background: active ? "color-mix(in srgb, var(--green) 8%, transparent)" : "var(--bg-primary)",
        border: `1px solid ${active ? "var(--green)" : "var(--border)"}`,
      }}
    >
      <p className="text-[11.5px] font-bold" style={{ color: active ? "var(--green)" : "var(--text-1)" }}>
        {label}
      </p>
      <p className="text-[10px] mt-0.5 leading-snug" style={{ color: "var(--text-4)" }}>
        {sub}
      </p>
    </button>
  );
}

function ChannelToggle({
  channel,
  label,
  replyRate,
  rules,
  update,
}: {
  channel: ReminderChannel;
  label: string;
  replyRate: number;
  rules: ReminderAutomationRules;
  update: <K extends keyof ReminderAutomationRules>(
    key: K,
    value: ReminderAutomationRules[K],
  ) => void;
}) {
  // Channel selection is global for the prototype — toggles WABA/email
  // approval state. For real wiring this'd be per-party.
  const active =
    channel === "whatsapp" ? rules.wabaApproved : channel === "email" ? !!rules.emailFromAddress : true;
  // The toggle is read-only display in the prototype since channel
  // wiring lives in per-party settings + INFINI templates.
  void active;
  return (
    <div
      className="rounded-md px-3 py-2 flex items-center gap-2 cursor-pointer"
      style={{
        background: "var(--bg-primary)",
        border: "1px solid var(--border)",
      }}
      onClick={() => {
        // No-op for now — channel selection moved to per-party in real PRD.
        void update;
      }}
    >
      {channel === "whatsapp" && <MessageCircle size={13} style={{ color: "var(--green)" }} />}
      {channel === "email" && <Mail size={13} style={{ color: "var(--blue)" }} />}
      {channel === "sms" && <Bell size={13} style={{ color: "var(--orange)" }} />}
      <span className="text-[11.5px] font-semibold" style={{ color: "var(--text-1)" }}>
        {label}
      </span>
      <span className="text-[10px] tabular-nums" style={{ color: "var(--text-4)" }}>
        {(replyRate * 100).toFixed(0)}% reply
      </span>
    </div>
  );
}

/* ════════════════════════════════════════════════════════════════════
   RecipientStrategyPicker — multi-contact-aware recipient picker

   Three modes per the May 8 conversation:
     1. Primary only (default — keeps it simple, the Tally contact gets
        the reminder)
     2. All marked — every contact at the party with receivesReminders
     3. By role(s) — only contacts whose role(s) match user's selection

   Coverage stat below the picker shows how many contacts are captured
   so users see the impact of their pick. "Manage contacts" jumps to
   the full CRUD drawer.
   ══════════════════════════════════════════════════════════════════ */
function RecipientStrategyPicker({
  rules,
  update,
  onManageContacts,
}: {
  rules: ReminderAutomationRules;
  update: <K extends keyof ReminderAutomationRules>(
    key: K,
    value: ReminderAutomationRules[K],
  ) => void;
  onManageContacts: () => void;
}) {
  const strategy = rules.defaultRecipientStrategy;
  const coverage = computeContactsCoverage();

  const setStrategy = (next: ReminderRecipientStrategy) =>
    update("defaultRecipientStrategy", next);

  const isPrimary = strategy.kind === "primary-only";
  const isAll = strategy.kind === "all-marked";
  const isByRole = strategy.kind === "by-role";
  const selectedRoles: ContactRole[] = isByRole ? strategy.roles : [];

  const toggleRole = (role: ContactRole) => {
    if (!isByRole) return;
    const next = selectedRoles.includes(role)
      ? selectedRoles.filter((r) => r !== role)
      : [...selectedRoles, role];
    setStrategy({ kind: "by-role", roles: next });
  };

  return (
    <div className="flex flex-col gap-2.5">
      {/* Three strategy options as stacked rows */}
      <div className="flex flex-col gap-1.5">
        <StrategyOption
          active={isPrimary}
          recommended
          label="Primary contact only"
          blurb="Send to whichever contact is marked Primary on each party. For most parties this is the contact that came from Tally."
          onClick={() => setStrategy({ kind: "primary-only" })}
        />
        <StrategyOption
          active={isAll}
          label="All contacts marked “Receive reminders”"
          blurb="Sends to multiple people per party. Best when you've captured both the owner and the accounting contact."
          onClick={() => setStrategy({ kind: "all-marked" })}
        />
        <StrategyOption
          active={isByRole}
          label="Specific role(s) only"
          blurb="Useful when you want the founder copied on Final-tier reminders, or want to skip operations contacts."
          onClick={() => setStrategy({ kind: "by-role", roles: selectedRoles.length ? selectedRoles : ["owner", "accounting"] })}
        />
      </div>

      {/* Role chip selector — only visible when by-role active */}
      {isByRole && (
        <div className="ml-1 flex flex-wrap items-center gap-1.5">
          <span className="text-[10px] uppercase tracking-wider font-semibold mr-1" style={{ color: "var(--text-4)" }}>
            Roles to include:
          </span>
          {(["owner", "accounting", "finance", "purchase", "operations", "sales", "other"] as ContactRole[]).map((r) => {
            const active = selectedRoles.includes(r);
            const c = CONTACT_ROLE_COLORS[r];
            return (
              <button
                key={r}
                type="button"
                onClick={() => toggleRole(r)}
                className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded cursor-pointer flex items-center gap-1"
                style={{
                  background: active
                    ? `color-mix(in srgb, ${c} 18%, transparent)`
                    : "var(--bg-primary)",
                  color: active ? c : "var(--text-4)",
                  border: `1px solid ${active ? c : "var(--border)"}`,
                }}
              >
                {active && <Check size={9} />}
                {CONTACT_ROLE_LABELS[r]}
              </button>
            );
          })}
        </div>
      )}

      {/* Coverage stat strip + Manage CTA */}
      <div
        className="flex items-center justify-between gap-3 rounded-md px-3 py-2 flex-wrap"
        style={{
          background: "var(--bg-primary)",
          border: "1px solid var(--border)",
        }}
      >
        <div className="flex items-center gap-3 text-[11px] flex-wrap">
          <span style={{ color: "var(--text-4)" }}>Coverage:</span>
          <span style={{ color: "var(--text-2)" }}>
            <strong style={{ color: "var(--text-1)" }}>{coverage.totalContacts}</strong> contacts across{" "}
            <strong style={{ color: "var(--text-1)" }}>{coverage.partiesWithContact}</strong> of{" "}
            {coverage.totalParties} parties
          </span>
          <span style={{ color: "var(--text-4)" }}>·</span>
          <span style={{ color: "var(--text-2)" }}>
            <strong style={{ color: "var(--text-1)" }}>{coverage.secondaryContacts}</strong> secondary
            contacts in {coverage.partiesWithSecondary} parties
          </span>
          {coverage.partiesMissingContact > 0 && (
            <>
              <span style={{ color: "var(--text-4)" }}>·</span>
              <span style={{ color: "var(--orange)" }}>
                {coverage.partiesMissingContact} parties without any contact
              </span>
            </>
          )}
        </div>
        <button
          type="button"
          onClick={onManageContacts}
          className="text-[11px] font-semibold px-3 py-1 rounded-md cursor-pointer flex items-center gap-1 flex-shrink-0"
          style={{
            background: "transparent",
            color: "var(--text-2)",
            border: "1px solid var(--border)",
          }}
        >
          Manage contacts <ArrowRight size={11} />
        </button>
      </div>

      {/* honest framing — kept short; "Manage contacts" link above is the hook */}
    </div>
  );
}

function StrategyOption({
  active,
  recommended,
  label,
  blurb,
  onClick,
}: {
  active: boolean;
  recommended?: boolean;
  label: string;
  blurb: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="rounded-md p-2.5 text-left cursor-pointer transition-colors flex items-start gap-2.5"
      style={{
        background: active
          ? "color-mix(in srgb, var(--green) 6%, transparent)"
          : "var(--bg-primary)",
        border: `1px solid ${active ? "var(--green)" : "var(--border)"}`,
      }}
    >
      <span
        className="flex-shrink-0 mt-0.5 w-3.5 h-3.5 rounded-full flex items-center justify-center"
        style={{
          background: active ? "var(--green)" : "transparent",
          border: `2px solid ${active ? "var(--green)" : "var(--text-4)"}`,
        }}
      >
        {active && <span style={{ width: 5, height: 5, borderRadius: 999, background: "#fff" }} />}
      </span>
      <span className="flex-1 min-w-0">
        <span className="flex items-center gap-2 mb-0.5 flex-wrap">
          <span
            className="text-[11.5px] font-bold"
            style={{ color: active ? "var(--green)" : "var(--text-1)" }}
          >
            {label}
          </span>
          {recommended && (
            <span
              className="text-[9px] uppercase tracking-wider font-bold px-1.5 py-0.5 rounded"
              style={{
                background: "color-mix(in srgb, var(--green) 14%, transparent)",
                color: "var(--green)",
              }}
            >
              Default · Recommended
            </span>
          )}
        </span>
        <span className="text-[10.5px] leading-snug block" style={{ color: "var(--text-4)" }}>
          {blurb}
        </span>
      </span>
    </button>
  );
}

/* ────────────────────────────────────────────────────────────────── */
/*  Stage 3 — Monitor                                                 */
/*                                                                    */
/*  Lightweight schedule view. Filter chips, then a list of           */
/*  ReminderMonitorRow with party · next-send · status · channels.    */
/* ────────────────────────────────────────────────────────────────── */
function MonitorSection({ rules }: { rules: ReminderAutomationRules }) {
  const [filter, setFilter] = useState<ReminderMonitorFilter>("all");
  const [search, setSearch] = useState("");

  const allRows = buildReminderMonitor(rules);
  const filtered = filterMonitorRows(allRows, filter, rules).filter((r) =>
    !search.trim() || r.partyName.toLowerCase().includes(search.toLowerCase()),
  );

  // Counts per filter for chip badges
  const counts: Record<ReminderMonitorFilter, number> = {
    "all": allRows.length,
    "scheduled-today": filterMonitorRows(allRows, "scheduled-today", rules).length,
    "scheduled-tomorrow": filterMonitorRows(allRows, "scheduled-tomorrow", rules).length,
    "needs-contact": filterMonitorRows(allRows, "needs-contact", rules).length,
    "paused": filterMonitorRows(allRows, "paused", rules).length,
    "needs-manual": filterMonitorRows(allRows, "needs-manual", rules).length,
  };

  return (
    <div
      className="rounded-md overflow-hidden"
      style={{ background: "var(--bg-surface)", border: "1px solid var(--border)" }}
    >
      <div
        className="flex items-center justify-between px-4 py-3"
        style={{ borderBottom: "1px solid var(--border)" }}
      >
        <div className="flex items-center gap-2">
          <span
            className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded"
            style={{
              background: "color-mix(in srgb, var(--purple) 14%, transparent)",
              color: "var(--purple)",
            }}
          >
            Step 3
          </span>
          <h3 className="text-[13px] font-bold" style={{ color: "var(--text-1)" }}>
            Monitor
          </h3>
        </div>
        <span className="text-[10.5px]" style={{ color: "var(--text-4)" }}>
          {filtered.length} of {allRows.length} · Trigger:{" "}
          <span style={{ color: "var(--text-2)" }}>
            {rules.triggerType === "n-days-after-due" && `${rules.triggerOffsetDays}d after due`}
            {rules.triggerType === "n-days-before-due" && `${rules.triggerOffsetDays}d before due`}
            {rules.triggerType === "weekly" && "Weekly batch"}
            {rules.triggerType === "monthly" && `Monthly · ${ordinalDay(rules.triggerDayOfMonth)}`}
            {rules.triggerType === "on-create" && "On invoice create"}
          </span>
          {" · "}cron {rules.cronTimeIst} IST
        </span>
      </div>

      <div className="p-4 flex flex-col gap-3">
        {/* Filter chips + search */}
        <div className="flex flex-wrap items-center gap-2 justify-between">
          <div className="flex flex-wrap gap-1.5">
            {REMINDER_MONITOR_FILTERS.map((f) => {
              const active = filter === f.id;
              const c = counts[f.id];
              return (
                <button
                  key={f.id}
                  type="button"
                  onClick={() => setFilter(f.id)}
                  className="text-[11px] font-semibold px-2.5 py-1 rounded-md cursor-pointer transition-colors flex items-center gap-1.5"
                  style={{
                    background: active ? "var(--bg-surface)" : "transparent",
                    color: active ? "var(--text-1)" : "var(--text-3)",
                    border: `1px solid ${active ? "var(--text-3)" : "var(--border)"}`,
                  }}
                >
                  {f.label}
                  <span
                    className="text-[9.5px] tabular-nums px-1.5 py-0.5 rounded"
                    style={{
                      background: active ? "var(--bg-hover)" : "var(--bg-secondary)",
                      color: "var(--text-4)",
                    }}
                  >
                    {c}
                  </span>
                </button>
              );
            })}
          </div>
          <div
            className="flex items-center gap-2 rounded-md px-2.5 py-1.5 min-w-[200px]"
            style={{ background: "var(--bg-primary)", border: "1px solid var(--border)" }}
          >
            <Search size={12} style={{ color: "var(--text-4)" }} />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search party"
              className="bg-transparent text-[11.5px] outline-none flex-1 min-w-0"
              style={{ color: "var(--text-1)" }}
            />
          </div>
        </div>

        {/* Table — desktop */}
        <div
          className="hidden md:block rounded-md overflow-hidden"
          style={{ border: "1px solid var(--border)" }}
        >
          <table className="w-full text-[11.5px]">
            <thead style={{ background: "var(--bg-primary)" }}>
              <tr>
                {[
                  { label: "Party",       align: "left"  },
                  { label: "Outstanding", align: "right" },
                  { label: "Status",      align: "left"  },
                  { label: "Next",        align: "left"  },
                  { label: "Channels",    align: "left"  },
                  { label: "Open",        align: "right" },
                  { label: "Last sent",   align: "left"  },
                ].map((h) => (
                  <th
                    key={h.label}
                    className={`px-3 py-2 font-semibold uppercase tracking-wider text-[10px] ${h.align === "right" ? "text-right" : "text-left"}`}
                    style={{
                      color: "var(--text-4)",
                      borderBottom: "1px solid var(--border)",
                    }}
                  >
                    {h.label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={7} className="text-center py-6" style={{ color: "var(--text-4)" }}>
                    No parties match this filter.
                  </td>
                </tr>
              )}
              {filtered.map((r, i) => (
                <MonitorRow key={r.partyName} row={r} striped={i % 2 === 1} />
              ))}
            </tbody>
          </table>
        </div>

        {/* Mobile cards */}
        <div className="md:hidden flex flex-col gap-2">
          {filtered.map((r) => (
            <MonitorCard key={r.partyName} row={r} />
          ))}
        </div>
      </div>
    </div>
  );
}

function MonitorRow({ row, striped }: { row: ReminderMonitorRow; striped: boolean }) {
  return (
    <tr
      style={{
        background: row.attributedPayment
          ? "color-mix(in srgb, var(--green) 5%, transparent)"
          : striped
            ? "color-mix(in srgb, var(--bg-primary) 40%, transparent)"
            : "transparent",
        borderTop: "1px solid var(--border)",
        borderLeft: row.attributedPayment ? "2px solid var(--green)" : "2px solid transparent",
      }}
    >
      <td className="px-3 py-2.5">
        <p className="font-semibold truncate max-w-[200px]" style={{ color: "var(--text-1)" }}>
          {row.partyName}
        </p>
        <p className="text-[10px] truncate max-w-[200px]" style={{ color: "var(--text-4)" }}>
          {row.contact.contactPerson ?? row.contact.phone ?? row.contact.email ?? "No contact"} · {row.daysOverdue}d overdue
        </p>
      </td>
      <td className="px-3 py-2.5 text-right tabular-nums" style={{ color: "var(--text-1)", fontFamily: "'Space Grotesk', sans-serif" }}>
        {formatINR(row.amount)}
      </td>
      <td className="px-3 py-2.5">
        <MonitorStatusPill status={row.status} />
      </td>
      <td className="px-3 py-2.5 text-[10.5px]" style={{ color: row.status === "queued" ? "var(--text-1)" : "var(--text-4)" }}>
        {row.nextLabel}
      </td>
      <td className="px-3 py-2.5">
        <div className="flex items-center gap-1">
          {row.channels.map((c) => (
            <ChannelDot key={c} channel={c} />
          ))}
        </div>
      </td>
      <td className="px-3 py-2.5 text-right tabular-nums" style={{ color: "var(--text-2)", fontFamily: "'Space Grotesk', sans-serif" }}>
        {row.openRate === null ? "—" : `${Math.round(row.openRate * 100)}%`}
      </td>
      <td className="px-3 py-2.5 text-[10.5px]" style={{ color: "var(--text-3)" }}>
        {row.lastSentLabel}
        {row.attributedPayment && (
          <span
            className="ml-1.5 text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded"
            style={{
              background: "color-mix(in srgb, var(--green) 14%, transparent)",
              color: "var(--green)",
            }}
            title="Reminder credited a payment within 7d"
          >
            ₹ paid
          </span>
        )}
      </td>
    </tr>
  );
}

function MonitorCard({ row }: { row: ReminderMonitorRow }) {
  return (
    <div
      className="rounded-md p-3 flex flex-col gap-1.5"
      style={{
        background: row.attributedPayment
          ? "color-mix(in srgb, var(--green) 5%, var(--bg-primary))"
          : "var(--bg-primary)",
        border: "1px solid var(--border)",
        borderLeft: row.attributedPayment ? "2px solid var(--green)" : "1px solid var(--border)",
      }}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <p className="text-[12px] font-bold truncate" style={{ color: "var(--text-1)" }}>
            {row.partyName}
          </p>
          <p className="text-[10px]" style={{ color: "var(--text-4)" }}>
            {row.daysOverdue}d overdue · {formatINR(row.amount)}
          </p>
        </div>
        <MonitorStatusPill status={row.status} />
      </div>
      <div className="flex items-center justify-between text-[10px]" style={{ color: "var(--text-3)" }}>
        <span className="truncate flex-1 min-w-0 mr-2">{row.nextLabel}</span>
        <div className="flex items-center gap-1 flex-shrink-0">
          {row.channels.map((c) => <ChannelDot key={c} channel={c} />)}
          <span className="ml-1">
            {row.openRate === null ? "—" : `${Math.round(row.openRate * 100)}%`}
          </span>
        </div>
      </div>
      <div className="flex items-center justify-between text-[10px] pt-1" style={{ color: "var(--text-4)", borderTop: "1px solid var(--border)" }}>
        <span>Last: {row.lastSentLabel}</span>
        {row.attributedPayment && (
          <span
            className="text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded"
            style={{
              background: "color-mix(in srgb, var(--green) 14%, transparent)",
              color: "var(--green)",
            }}
          >
            ₹ paid
          </span>
        )}
      </div>
    </div>
  );
}

/** Status pill — short semantic word, no timestamp.
 *  The Next column carries the timestamp/action separately. */
function MonitorStatusPill({ status }: { status: ReminderMonitorRow["status"] }) {
  const cfg: Record<ReminderMonitorRow["status"], { color: string; bg: string; label: string; icon: React.ReactNode }> = {
    "queued":        { color: "var(--green)",  bg: "color-mix(in srgb, var(--green) 12%, transparent)",  label: "Queued",        icon: <Clock size={9} /> },
    "paused":        { color: "var(--yellow)", bg: "color-mix(in srgb, var(--yellow) 14%, transparent)", label: "Paused",        icon: <Pause size={9} /> },
    "disabled":      { color: "var(--text-4)", bg: "var(--bg-hover)",                                    label: "Disabled",      icon: null },
    "needs-contact": { color: "var(--orange)", bg: "color-mix(in srgb, var(--orange) 14%, transparent)", label: "Needs contact", icon: <Phone size={9} /> },
    "needs-manual":  { color: "var(--red)",    bg: "color-mix(in srgb, var(--red) 12%, transparent)",    label: "Manual",        icon: <AlertCircle size={9} /> },
  };
  const c = cfg[status];
  return (
    <span
      className="inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded"
      style={{ background: c.bg, color: c.color }}
    >
      {c.icon}
      {c.label}
    </span>
  );
}

function ChannelDot({ channel }: { channel: ReminderChannel }) {
  const cfg: Record<ReminderChannel, { color: string; letter: string; title: string }> = {
    whatsapp: { color: "var(--green)", letter: "W", title: "WhatsApp" },
    email:    { color: "var(--blue)",  letter: "E", title: "Email" },
    sms:      { color: "var(--orange)", letter: "S", title: "SMS" },
  };
  const c = cfg[channel];
  return (
    <span
      title={c.title}
      className="inline-flex items-center justify-center text-[8.5px] font-bold rounded"
      style={{
        width: 14,
        height: 14,
        background: `color-mix(in srgb, ${c.color} 15%, transparent)`,
        color: c.color,
        fontFamily: "'Space Grotesk', sans-serif",
      }}
    >
      {c.letter}
    </span>
  );
}

/* ────────────────────────────────────────────────────────────────── */
/*  Advanced settings — collapsed by default                          */
/*                                                                    */
/*  Wraps the 7 deployed-version sections in one progressive-         */
/*  disclosure expander so the 3-stage MVP stays clean for new        */
/*  users while power users (CA, accounts head) can drill in to       */
/*  tune cron timing, exclusions, escalation, auto-stop, channel      */
/*  health, templates, and analytics. Each child component already    */
/*  has its own card chrome; this expander adds only the parent       */
/*  toggle + animated reveal.                                         */
/* ────────────────────────────────────────────────────────────────── */
function AdvancedSection({
  rules,
  update,
}: {
  rules: ReminderAutomationRules;
  update: <K extends keyof ReminderAutomationRules>(
    key: K,
    value: ReminderAutomationRules[K],
  ) => void;
}) {
  const [open, setOpen] = useState(false);
  return (
    <div
      className="rounded-md overflow-hidden"
      style={{ background: "var(--bg-surface)", border: "1px solid var(--border)" }}
    >
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        className="w-full flex items-center justify-between px-4 py-3 cursor-pointer text-left"
        style={{
          borderBottom: open ? "1px solid var(--border)" : "none",
          background: open ? "color-mix(in srgb, var(--bg-hover) 50%, transparent)" : "transparent",
          transition: "background 150ms",
        }}
      >
        <div className="flex items-center gap-2 min-w-0">
          <ChevronDown
            size={14}
            style={{
              color: "var(--text-3)",
              transform: open ? "rotate(0deg)" : "rotate(-90deg)",
              transition: "transform 200ms",
              flexShrink: 0,
            }}
          />
          <span
            className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded flex-shrink-0"
            style={{
              background: "color-mix(in srgb, var(--text-3) 14%, transparent)",
              color: "var(--text-3)",
            }}
          >
            Advanced
          </span>
          <span className="text-[13px] font-bold flex-shrink-0" style={{ color: "var(--text-1)" }}>
            Settings
          </span>
          <span
            className="text-[10.5px] truncate hidden sm:inline"
            style={{ color: "var(--text-4)" }}
          >
            · Templates · Schedule · Exclusions · Escalation · Auto-stop · Channels · Analytics
          </span>
        </div>
        <span className="text-[10.5px] flex-shrink-0" style={{ color: "var(--text-4)" }}>
          {open ? "Hide" : "Show"}
        </span>
      </button>

      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.22, ease: "easeOut" }}
            style={{ overflow: "hidden" }}
          >
            <div className="p-4 flex flex-col gap-5">
              <TemplatesSection wabaByTone={rules.wabaApprovalByTone} />
              <ScheduleSection rules={rules} update={update} />
              <ExclusionsSection rules={rules} update={update} />
              <EscalationSection rules={rules} update={update} />
              <StopRulesSection rules={rules} update={update} />
              <ChannelsSection rules={rules} update={update} />
              <AnalyticsSection />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

/* ────────────────────────────────────────────────────────────────── */
/*  1. Live state hero                                                */
/* ────────────────────────────────────────────────────────────────── */
function LiveStateHero({ rules }: { rules: ReminderAutomationRules }) {
  const state = computeReminderLiveState();
  const attribution = computeReminderAttribution();
  const avgPayDays = computeAvgTimeToPayDays();
  const bestChannel = bestReplyChannel();
  // Sparkline data still available via computeDailySendsSparkline()
  // for the Advanced > Analytics deep-dive — not used in this row.

  // Best-tone label
  let bestTone: ReminderTone | null = null;
  let bestTonePct = 0;
  for (const [tone, v] of Object.entries(REMINDER_ANALYTICS_30D.paymentCorrelation) as Array<[ReminderTone, { reminded: number; paidWithin7d: number; pct: number }]>) {
    if (v.pct > bestTonePct) { bestTonePct = v.pct; bestTone = tone; }
  }

  const channelLabel = bestChannel.channel === "whatsapp" ? "WhatsApp" : bestChannel.channel === "email" ? "Email" : "SMS";

  return (
    <div className="flex flex-col gap-3">
      {/* Value tiles. ONE hero (Recovered) carries the green accent + icon;
           the others render neutral so the eye lands on what matters first.
           Sentence-case labels — uppercase shouting was every-tile-shouts /
           nothing-is-heard. Subtitles trimmed to a single fact each. */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <LiveTile
          label="Recovered this month"
          bigValue={attribution ? formatINR(attribution.amountAttributed) : "—"}
          subValue={
            attribution
              ? `${attribution.paymentsAttributed} of ${attribution.remindersSent} paid (${Math.round((attribution.paymentsAttributed / Math.max(attribution.remindersSent, 1)) * 100)}%)`
              : "No reminders sent yet this month."
          }
          color="var(--green)"
          icon={<MessageCircle size={14} />}
          hero
        />
        <LiveTile
          label="Reply rate"
          bigValue={`${Math.round(state.replyRate * 100)}%`}
          subValue={`${channelLabel} leads at ${Math.round(bestChannel.pct * 100)}%`}
          color="var(--blue)"
          icon={<Activity size={14} />}
        />
        <LiveTile
          label="Avg time to pay"
          bigValue={avgPayDays !== null ? `${avgPayDays.toFixed(1)}d` : "—"}
          subValue={
            avgPayDays !== null
              ? `vs ${Math.round(K.dso)}d typical DSO`
              : "Need 3+ attributed payments."
          }
          color="var(--purple)"
          icon={<Clock size={14} />}
        />
        <LiveTile
          label="Top tone"
          bigValue={bestTone ? bestTone.charAt(0).toUpperCase() + bestTone.slice(1) : "—"}
          subValue={
            bestTone
              ? `${Math.round(bestTonePct * 100)}% paid within 7d`
              : "Need more send history."
          }
          color="var(--orange)"
          icon={<CheckCircle2 size={14} />}
        />
      </div>

      {/* Operational status — single muted line. Was 3 stat cells; the
           value tiles above carry the ROI story, so ops are demoted to
           one inline strip the eye can skim or skip. Saves ~80px desktop,
           ~150px mobile, removes 3 tile-shaped objects from the first
           viewport. Detailed charts live in Advanced > Analytics. */}
      <p
        className="text-[10.5px] flex flex-wrap items-center gap-x-3 gap-y-1 px-1"
        style={{ color: "var(--text-4)" }}
      >
        <span>
          Next batch <strong style={{ color: "var(--text-2)" }}>{nextBatchDateLabel(rules)} {rules.cronTimeIst} IST</strong>
          {state.queued > 0 && <> · {state.queued} queued</>}
        </span>
        <span style={{ color: "var(--text-4)" }}>·</span>
        <span>
          <strong style={{ color: "var(--text-2)" }}>{state.active} of {RECEIVABLES.length}</strong> active
          {state.paused > 0 && <>, {state.paused} paused</>}
          {state.optedOut > 0 && <>, {state.optedOut} opted out</>}
        </span>
        <span style={{ color: "var(--text-4)" }}>·</span>
        <span title="Email + SMS credits via MSG91 — automation channel pool">
          <strong style={{ color: "var(--text-2)" }}>{rules.msg91Credits.toLocaleString("en-IN")}</strong> credits
          {" "}(~{Math.round(rules.msg91Credits / Math.max(REMINDER_ANALYTICS_30D.creditsBurnRate, 1))}d runway)
        </span>
      </p>
    </div>
  );
}

function LiveTile({
  label,
  bigValue,
  subValue,
  color,
  icon,
  suffix,
  hero,
}: {
  label: string;
  bigValue: string;
  subValue: string;
  color: string;
  icon: React.ReactNode;
  suffix?: string;
  /** Hero tile gets the colored accent border + icon. Others render
   *  with neutral border so only ONE thing in the row is shouting. */
  hero?: boolean;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.3 }}
      className="rounded-md p-4 flex flex-col gap-2"
      style={{
        background: "var(--bg-surface)",
        border: "1px solid var(--border)",
        borderLeft: hero ? `3px solid ${color}` : "1px solid var(--border)",
      }}
    >
      <div className="flex items-center justify-between">
        <span className="text-[11px] font-medium" style={{ color: "var(--text-3)" }}>
          {label}
        </span>
        {hero && <span style={{ color }}>{icon}</span>}
      </div>
      <div className="flex items-baseline gap-1">
        <p
          className="text-xl font-bold tabular-nums"
          style={{
            color: hero ? color : "var(--text-1)",
            fontFamily: "'Space Grotesk', sans-serif",
          }}
        >
          {bigValue}
        </p>
        {suffix && (
          <span className="text-[11px] font-medium" style={{ color: "var(--text-4)" }}>
            {suffix}
          </span>
        )}
      </div>
      <p className="text-[11px] leading-snug" style={{ color: "var(--text-4)" }}>
        {subValue}
      </p>
    </motion.div>
  );
}

/* ────────────────────────────────────────────────────────────────── */
/*  2. Templates section — 4 tone cards × 3 channel approval chips    */
/* ────────────────────────────────────────────────────────────────── */

const TONE_META: Record<ReminderTone, { label: string; bucket: string; color: string }> = {
  gentle:   { label: "Gentle",   bucket: "≤ 7 days",      color: "var(--green)"  },
  standard: { label: "Standard", bucket: "8 – 30 days",   color: "var(--blue)"   },
  firm:     { label: "Firm",     bucket: "31 – 180 days", color: "var(--orange)" },
  final:    { label: "Final",    bucket: "180+ days",     color: "var(--red)"    },
};

/* ────────────────────────────────────────────────────────────────────
   Template approval — providers gate template content, not us.

   Why this UX is read-first:
   - WhatsApp: every template needs Meta WABA approval (24-48h via WAMe).
                We use WAMe (not MSG91) for WhatsApp specifically — high-
                volume reminder sends through MSG91's WhatsApp BSP carry
                ban risk that WAMe is hardened against.
   - SMS:     headers + body need TRAI DLT approval (3-5 business days),
                routed through MSG91.
   - Email:   instant once Resend domain is verified (also via MSG91),
                free-form OK.

   So we don't let users freely edit text. They request a revision
   which routes to the provider's review queue. Riko shows status,
   not an inline editor.
   ──────────────────────────────────────────────────────────────────── */
function TemplatesSection({
  wabaByTone: _wabaByTone,
}: {
  wabaByTone: ReminderAutomationRules["wabaApprovalByTone"];
}) {
  void _wabaByTone; // legacy prop — superseded by getTemplateApproval()
  const [revisionTarget, setRevisionTarget] = useState<{ tone: ReminderTone; channel: ReminderChannel } | null>(null);

  return (
    <SectionCard
      title="Template library"
      subtitle="4-tier tone ladder × 3 channels. Provider approval required — Riko submits revisions, doesn't inline-edit."
    >
      {/* Compact provider-info strip */}
      <div
        className="rounded-md p-2.5 mb-3 flex flex-wrap items-center gap-3 text-[10.5px]"
        style={{
          background: "color-mix(in srgb, var(--blue) 6%, transparent)",
          border: "1px solid color-mix(in srgb, var(--blue) 22%, transparent)",
          color: "var(--text-3)",
        }}
      >
        <span style={{ color: "var(--blue)", fontWeight: 700 }}>How approval works:</span>
        {(["email", "sms"] as ReminderChannel[]).map((ch) => {
          const r = TEMPLATE_REVIEWERS[ch];
          const label = ch === "email" ? "Email" : "SMS";
          return (
            <span key={ch} className="inline-flex items-center gap-1">
              <strong style={{ color: "var(--text-2)" }}>{label}:</strong>
              {r.reviewer} via {r.provider} · ETA {r.sla}
            </span>
          );
        })}
        <span style={{ color: "var(--text-4)" }}>
          · WhatsApp templates aren&apos;t shown here — manual sends are free-form.
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {(Object.keys(TONE_META) as ReminderTone[]).map((tone) => (
          <TemplateCard
            key={tone}
            tone={tone}
            onRequestRevision={(channel) => setRevisionTarget({ tone, channel })}
          />
        ))}
      </div>

      {revisionTarget && (
        <TemplateRevisionModal
          tone={revisionTarget.tone}
          channel={revisionTarget.channel}
          onClose={() => setRevisionTarget(null)}
        />
      )}
    </SectionCard>
  );
}

/** Per-tone card showing all 3 channels' approval state side-by-side. */
function TemplateCard({
  tone,
  onRequestRevision,
}: {
  tone: ReminderTone;
  onRequestRevision: (channel: ReminderChannel) => void;
}) {
  const meta = TONE_META[tone];
  // Sample render for preview (WA template first)
  const waTemplate = REMINDER_TEMPLATES.find((t) => t.tone === tone && t.channel === "whatsapp");
  const previewText = waTemplate
    ? renderTemplate(waTemplate.body, {
        party_name: "Nykaa",
        invoice_no: "NYK-2301",
        net_amount: "₹12.6L",
        due_date: "15 Mar 2024",
        days_overdue: "2,195",
        company_name: cleanCompanyName("Bandra Soap Pvt Ltd(2020-2024)"),
      })
    : "—";

  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.25 }}
      className="rounded-md p-4 flex flex-col gap-3"
      style={{
        background: "var(--bg-secondary)",
        border: `1px solid ${meta.color}40`,
        borderLeft: `3px solid ${meta.color}`,
      }}
    >
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-bold" style={{ color: meta.color }}>
            {meta.label}
          </p>
          <p className="text-[10px]" style={{ color: "var(--text-4)" }}>
            {meta.bucket}
          </p>
        </div>
      </div>

      <p
        className="text-[11px] leading-relaxed line-clamp-3 rounded-md p-2.5"
        style={{ background: "var(--bg-primary)", color: "var(--text-2)" }}
      >
        {previewText}
      </p>

      {/* Channel approval strip — Email + SMS only. WhatsApp is excluded
           because automation never sends through WhatsApp; manual sends
           from Outstanding are free-form and don't need template approval. */}
      <div className="flex flex-col gap-1.5">
        {(["email", "sms"] as ReminderChannel[]).map((ch) => (
          <ChannelApprovalRow
            key={ch}
            tone={tone}
            channel={ch}
            onRequestRevision={() => onRequestRevision(ch)}
          />
        ))}
      </div>
    </motion.div>
  );
}

function ChannelApprovalRow({
  tone,
  channel,
  onRequestRevision,
}: {
  tone: ReminderTone;
  channel: ReminderChannel;
  onRequestRevision: () => void;
}) {
  const approval = getTemplateApproval(tone, channel);
  const cfg = STATUS_CFG[approval.status];
  const channelLabel = channel === "whatsapp" ? "WhatsApp" : channel === "email" ? "Email" : "SMS";

  // Action varies by status (see comment block above)
  let actionLabel: string;
  let actionDisabled = false;
  switch (approval.status) {
    case "approved": actionLabel = "Request revision"; break;
    case "pending":  actionLabel = "Under review"; actionDisabled = true; break;
    case "rejected": actionLabel = "View reason · Resubmit"; break;
    case "draft":    actionLabel = "Submit for review"; break;
  }

  // Context line varies by status — extracted so we can render it
  // separately on mobile (where space won't fit it inline).
  const contextLine =
    approval.status === "rejected"
      ? approval.rejectionReason ?? `Rejected by ${approval.reviewer}`
      : approval.status === "pending"
        ? `${approval.reviewer} · ETA ${approval.slaLabel}`
        : approval.status === "draft"
          ? "Local edit — submit to push to provider"
          : `Approved · ${approval.revisions} revision${approval.revisions === 1 ? "" : "s"}`;

  return (
    <div
      className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 rounded p-2"
      style={{ background: "var(--bg-primary)", border: "1px solid var(--border)" }}
    >
      {/* Row A — channel pill + status pill + (desktop only) context inline */}
      <div className="flex items-center gap-2 min-w-0 flex-1">
        <span
          className="text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded flex-shrink-0"
          style={{
            background: "var(--bg-hover)",
            color: "var(--text-3)",
            minWidth: 48,
            textAlign: "center",
          }}
        >
          {channelLabel}
        </span>
        <span
          className="inline-flex items-center gap-1 text-[10px] font-semibold px-1.5 py-0.5 rounded flex-shrink-0"
          style={{ background: cfg.bg, color: cfg.fg }}
          title={cfg.tooltip(approval)}
        >
          {cfg.symbol} {cfg.label}
        </span>
        {/* Context inline on desktop only */}
        <span className="hidden sm:inline text-[10px] truncate" style={{ color: "var(--text-4)" }}>
          {contextLine}
        </span>
      </div>

      {/* Row B (mobile only) — context line on its own row, full width.
           Long rejection reasons need room to breathe; on desktop they
           truncate inline next to the status pill. */}
      <p
        className="sm:hidden text-[10px] leading-snug"
        style={{ color: "var(--text-4)" }}
      >
        {contextLine}
      </p>

      {/* Action button — full-width on mobile, inline on desktop */}
      <button
        type="button"
        onClick={onRequestRevision}
        disabled={actionDisabled}
        className="text-[10px] font-semibold px-2 py-1.5 rounded-md cursor-pointer flex-shrink-0 disabled:cursor-not-allowed disabled:opacity-50 w-full sm:w-auto"
        style={{
          background: actionDisabled ? "transparent" : "var(--bg-hover)",
          color: actionDisabled ? "var(--text-4)" : "var(--text-2)",
          border: actionDisabled ? "1px solid var(--border)" : "none",
        }}
      >
        {actionLabel}
      </button>
    </div>
  );
}

const STATUS_CFG: Record<TemplateApprovalStatus, {
  label: string;
  bg: string;
  fg: string;
  symbol: string;
  tooltip: (m: TemplateApprovalMeta) => string;
}> = {
  approved: {
    label: "Approved",
    bg: "color-mix(in srgb, var(--green) 14%, transparent)",
    fg: "var(--green)",
    symbol: "✓",
    tooltip: (m) => `Approved by ${m.reviewer}${m.approvedAt ? ` on ${new Date(m.approvedAt).toLocaleDateString("en-IN")}` : ""}`,
  },
  pending: {
    label: "Under review",
    bg: "color-mix(in srgb, var(--yellow) 14%, transparent)",
    fg: "var(--yellow)",
    symbol: "…",
    tooltip: (m) => `Submitted to ${m.reviewer}. ETA ${m.slaLabel}.`,
  },
  rejected: {
    label: "Rejected",
    bg: "color-mix(in srgb, var(--red) 14%, transparent)",
    fg: "var(--red)",
    symbol: "✗",
    tooltip: (m) => m.rejectionReason ?? `Rejected by ${m.reviewer}.`,
  },
  draft: {
    label: "Draft",
    bg: "color-mix(in srgb, var(--text-3) 14%, transparent)",
    fg: "var(--text-3)",
    symbol: "•",
    tooltip: () => "Local revision — not yet submitted to provider.",
  },
};

/* ────────────────────────────────────────────────────────────────── */
/*  TemplateRevisionModal — submit-for-review flow                     */
/* ────────────────────────────────────────────────────────────────── */
function TemplateRevisionModal({
  tone,
  channel,
  onClose,
}: {
  tone: ReminderTone;
  channel: ReminderChannel;
  onClose: () => void;
}) {
  const meta = TONE_META[tone];
  const approval = getTemplateApproval(tone, channel);
  const reviewer = TEMPLATE_REVIEWERS[channel];
  const original = REMINDER_TEMPLATES.find((t) => t.tone === tone && t.channel === channel)?.body ?? "";
  const channelLabel = channel === "whatsapp" ? "WhatsApp" : channel === "email" ? "Email" : "SMS";

  const [body, setBody] = useState<string>(approval.pendingRevisionBody ?? original);
  const [reason, setReason] = useState<string>("");
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = () => {
    setSubmitted(true);
    window.setTimeout(() => onClose(), 1400);
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.15 }}
        className="fixed inset-0 z-[70]"
        style={{ background: "rgba(0,0,0,0.55)", backdropFilter: "blur(2px)" }}
        onClick={onClose}
      />

      <motion.div
        initial={{ opacity: 0, y: 24, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 16, scale: 0.98 }}
        transition={{ duration: 0.18, ease: "easeOut" }}
        className="fixed inset-0 z-[80] flex items-center justify-center p-4 pointer-events-none"
      >
        <div
          className="w-full max-w-2xl rounded-lg overflow-hidden pointer-events-auto flex flex-col"
          style={{
            background: "var(--bg-surface)",
            border: "1px solid var(--border)",
            boxShadow: "0 24px 60px rgba(0,0,0,0.5)",
            maxHeight: "92vh",
          }}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div
            className="flex items-center justify-between px-5 py-3"
            style={{ borderBottom: "1px solid var(--border)" }}
          >
            <div>
              <h3 className="text-sm font-bold" style={{ color: "var(--text-1)" }}>
                Request revision · <span style={{ color: meta.color }}>{meta.label}</span> · {channelLabel}
              </h3>
              <p className="text-[10.5px]" style={{ color: "var(--text-4)" }}>
                {reviewer.reviewer} · ETA {reviewer.sla}
              </p>
            </div>
            <button
              onClick={onClose}
              className="p-1.5 rounded-md cursor-pointer"
              style={{ color: "var(--text-3)" }}
              aria-label="Close"
            >
              <X size={16} />
            </button>
          </div>

          <div className="p-5 overflow-y-auto flex flex-col gap-4">
            {submitted ? (
              <div className="flex flex-col items-center text-center py-8 gap-3">
                <div
                  className="w-12 h-12 rounded-full flex items-center justify-center"
                  style={{ background: "color-mix(in srgb, var(--green) 18%, transparent)" }}
                >
                  <CheckCircle2 size={24} style={{ color: "var(--green)" }} />
                </div>
                <p className="text-base font-bold" style={{ color: "var(--text-1)" }}>
                  Revision submitted
                </p>
                <p className="text-[12px]" style={{ color: "var(--text-3)" }}>
                  {reviewer.reviewer} will review your changes. ETA {reviewer.sla}.<br />
                  This template stays at its previous approved version until the new one is greenlit.
                </p>
              </div>
            ) : (
              <>
                {/* Provider context callout */}
                <div
                  className="rounded-md p-3 text-[11px]"
                  style={{
                    background: "color-mix(in srgb, var(--blue) 6%, transparent)",
                    border: "1px solid color-mix(in srgb, var(--blue) 22%, transparent)",
                    color: "var(--text-2)",
                  }}
                >
                  <p className="font-semibold mb-1" style={{ color: "var(--blue)" }}>
                    Why this needs review
                  </p>
                  <p>
                    {channel === "whatsapp" && (
                      <>
                        WhatsApp Business templates must be approved by Meta. Riko sends WhatsApp
                        through <strong>WAMe</strong> (not MSG91 — its WhatsApp BSP carries ban
                        risk at our send volumes). Riko submits the revision and waits — automated
                        sends keep using the last approved version until Meta greenlights the change.
                      </>
                    )}
                    {channel === "email" && (
                      <>
                        Email is the most flexible channel — once your sending domain is verified
                        with Resend (routed through MSG91), content edits go live almost instantly.
                        Still tracked through Riko&apos;s template registry for audit.
                      </>
                    )}
                    {channel === "sms" && (
                      <>
                        SMS templates are gated by India&apos;s TRAI DLT registry and routed through
                        MSG91. Both the header (BNDSOP) and the body content need DLT approval.
                        Promotional language gets rejected — keep it transactional.
                      </>
                    )}
                  </p>
                </div>

                {/* Original (read-only) */}
                <label className="flex flex-col gap-1.5">
                  <span className="text-[10px] uppercase tracking-wider font-semibold" style={{ color: "var(--text-4)" }}>
                    Currently approved version
                  </span>
                  <textarea
                    value={original}
                    readOnly
                    rows={4}
                    className="text-[11.5px] rounded-md px-3 py-2 resize-none cursor-not-allowed"
                    style={{
                      background: "var(--bg-primary)",
                      color: "var(--text-3)",
                      border: "1px solid var(--border)",
                      fontFamily: "monospace",
                    }}
                  />
                </label>

                {/* New revision (editable) */}
                <label className="flex flex-col gap-1.5">
                  <span className="text-[10px] uppercase tracking-wider font-semibold" style={{ color: "var(--text-4)" }}>
                    Your proposed revision
                  </span>
                  <textarea
                    value={body}
                    onChange={(e) => setBody(e.target.value)}
                    rows={6}
                    className="text-[11.5px] rounded-md px-3 py-2 resize-none outline-none"
                    style={{
                      background: "var(--bg-primary)",
                      color: "var(--text-1)",
                      border: "1px solid color-mix(in srgb, var(--green) 30%, transparent)",
                      fontFamily: "monospace",
                    }}
                  />
                  <span className="text-[10px]" style={{ color: "var(--text-4)" }}>
                    Variables: {"{party_name}, {invoice_no}, {net_amount}, {due_date}, {days_overdue}, {company_name}"}
                  </span>
                </label>

                {/* Reason for change */}
                <label className="flex flex-col gap-1.5">
                  <span className="text-[10px] uppercase tracking-wider font-semibold" style={{ color: "var(--text-4)" }}>
                    Reason for revision (sent to reviewer)
                  </span>
                  <input
                    type="text"
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                    placeholder="e.g. Adding payment link, softening tone, fixing typo"
                    className="text-[11.5px] rounded-md px-3 py-2 outline-none"
                    style={{
                      background: "var(--bg-primary)",
                      color: "var(--text-1)",
                      border: "1px solid var(--border)",
                    }}
                  />
                </label>

                {/* Footer actions */}
                <div className="flex items-center justify-between pt-2">
                  <p className="text-[10.5px]" style={{ color: "var(--text-4)" }}>
                    Submitting locks this template until {reviewer.reviewer} responds.
                  </p>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={onClose}
                      className="text-[12px] font-semibold px-3 py-1.5 rounded-md cursor-pointer"
                      style={{ background: "transparent", color: "var(--text-3)", border: "1px solid var(--border)" }}
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleSubmit}
                      disabled={!body.trim() || body === original}
                      className="text-[12px] font-semibold px-4 py-1.5 rounded-md cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1.5"
                      style={{ background: "var(--green)", color: "#fff" }}
                    >
                      <Send size={11} />
                      Submit for review
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}

/* ────────────────────────────────────────────────────────────────── */
/*  3. Schedule section                                               */
/* ────────────────────────────────────────────────────────────────── */
function ScheduleSection({
  rules,
  update,
}: {
  rules: ReminderAutomationRules;
  update: <K extends keyof ReminderAutomationRules>(key: K, value: ReminderAutomationRules[K]) => void;
}) {
  return (
    <SectionCard
      title="Schedule & send rules"
      subtitle="How often, when, and for which outstanding ranges reminders fire."
    >
      <div className="flex flex-col gap-4">
        <RemNumericRow
          label="Daily batch limit"
          desc="Max reminders sent across all parties per day."
          value={rules.dailyBatchLimit}
          onChange={(v) => update("dailyBatchLimit", v)}
          suffix="reminders/day"
          min={1}
          max={500}
        />
        <RemNumericRow
          label="Max reminders per party"
          desc="Hard cap before we stop auto-sending and flag for manual contact."
          value={rules.maxRemindersPerParty}
          onChange={(v) => update("maxRemindersPerParty", v)}
          suffix="sends"
          min={1}
          max={20}
        />
        <RemNumericRow
          label="Max overdue threshold"
          desc="Parties overdue more than this are excluded — they need relationship-manager contact, not another reminder."
          value={rules.maxOverdueThresholdDays}
          onChange={(v) => update("maxOverdueThresholdDays", v)}
          suffix="days"
          min={30}
          max={730}
        />
        <RemNumericRow
          label="Minimum outstanding"
          desc="Don't auto-remind below this amount — avoids nagging customers for trivial balances."
          value={rules.minOutstandingAmount}
          onChange={(v) => update("minOutstandingAmount", v)}
          suffix="₹"
          min={0}
          max={100000}
        />
        <div
          className="flex items-center gap-3 px-4 py-3 rounded-lg"
          style={{ background: "var(--bg-hover)", border: "1px solid var(--border)" }}
        >
          <Clock size={14} style={{ color: "var(--text-3)" }} />
          <div className="flex-1">
            <p className="text-[13px] font-semibold" style={{ color: "var(--text-1)" }}>
              Daily send time
            </p>
            <p className="text-[11px]" style={{ color: "var(--text-3)" }}>
              Cron fires at this IST time. Business hours (10 AM) works best for reply rates.
            </p>
          </div>
          <input
            type="time"
            value={rules.cronTimeIst}
            onChange={(e) => update("cronTimeIst", e.target.value)}
            className="text-[12px] font-semibold px-2 py-1 rounded-md"
            style={{
              background: "var(--bg-surface)",
              color: "var(--text-1)",
              border: "1px solid var(--border)",
            }}
          />
        </div>
        <div
          className="flex items-center gap-3 px-4 py-3 rounded-lg flex-wrap"
          style={{ background: "var(--bg-hover)", border: "1px solid var(--border)" }}
        >
          <Clock size={14} style={{ color: "var(--text-3)" }} />
          <div className="flex-1 min-w-[180px]">
            <p className="text-[13px] font-semibold" style={{ color: "var(--text-1)" }}>
              Quiet hours
            </p>
            <p className="text-[11px]" style={{ color: "var(--text-3)" }}>
              Reminders only fire within this window — skips nights + early mornings.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <input
              type="time"
              value={rules.quietHoursStart}
              onChange={(e) => update("quietHoursStart", e.target.value)}
              className="text-[12px] font-semibold px-2 py-1 rounded-md"
              style={{ background: "var(--bg-surface)", color: "var(--text-1)", border: "1px solid var(--border)" }}
            />
            <span className="text-[11px]" style={{ color: "var(--text-4)" }}>
              to
            </span>
            <input
              type="time"
              value={rules.quietHoursEnd}
              onChange={(e) => update("quietHoursEnd", e.target.value)}
              className="text-[12px] font-semibold px-2 py-1 rounded-md"
              style={{ background: "var(--bg-surface)", color: "var(--text-1)", border: "1px solid var(--border)" }}
            />
          </div>
        </div>
        <ToggleRow
          title="Skip weekends"
          desc="Cron won't fire on Saturday or Sunday. Reply rates drop ~60% on weekends anyway."
          checked={rules.skipWeekends}
          onChange={(v) => update("skipWeekends", v)}
        />
        <ToggleRow
          title="Skip Indian public holidays"
          desc="Pulls from a built-in holiday list (Diwali, Holi, Eid, Republic Day, etc.). Updated annually."
          checked={rules.skipHolidays}
          onChange={(v) => update("skipHolidays", v)}
        />
        <ToggleRow
          title="Deduct on-account credits"
          desc="Subtract on_account from outstanding before ranking urgency. A party owing ₹5.7L with ₹5.1L on-account ranks lower than one owing ₹1L fresh."
          checked={rules.onAccountDeduction}
          onChange={(v) => update("onAccountDeduction", v)}
        />
      </div>
    </SectionCard>
  );
}

/* ────────────────────────────────────────────────────────────────── */
/*  4. Exclusions section — blacklist + key-account whitelist         */
/* ────────────────────────────────────────────────────────────────── */
function ExclusionsSection({
  rules,
  update,
}: {
  rules: ReminderAutomationRules;
  update: <K extends keyof ReminderAutomationRules>(key: K, value: ReminderAutomationRules[K]) => void;
}) {
  const [addingBlacklist, setAddingBlacklist] = useState(false);
  const [addingKey, setAddingKey] = useState(false);
  const availableParties = RECEIVABLES
    .map((r) => r.name)
    .filter((n) => !rules.blacklistedParties.includes(n) && !rules.keyAccountParties.includes(n));

  return (
    <SectionCard
      title="Smart exclusions"
      subtitle="Parties that never receive automated sends, or require special handling."
    >
      <div className="flex flex-col gap-5">
        {/* Blacklist */}
        <ExclusionList
          heading="Blacklist"
          subheading="Never auto-send — owner can still send manually from the party drawer"
          parties={rules.blacklistedParties}
          color="var(--red)"
          icon={<X size={12} />}
          adding={addingBlacklist}
          setAdding={setAddingBlacklist}
          onRemove={(name) =>
            update(
              "blacklistedParties",
              rules.blacklistedParties.filter((p) => p !== name),
            )
          }
          onAdd={(name) => {
            update("blacklistedParties", [...rules.blacklistedParties, name]);
            setAddingBlacklist(false);
          }}
          options={availableParties}
        />

        {/* Key accounts */}
        <ExclusionList
          heading="Key accounts"
          subheading="Automated reminder becomes a to-do for the owner — no WhatsApp / Email sent directly"
          parties={rules.keyAccountParties}
          color="var(--purple)"
          icon={<Shield size={12} />}
          adding={addingKey}
          setAdding={setAddingKey}
          onRemove={(name) =>
            update(
              "keyAccountParties",
              rules.keyAccountParties.filter((p) => p !== name),
            )
          }
          onAdd={(name) => {
            update("keyAccountParties", [...rules.keyAccountParties, name]);
            setAddingKey(false);
          }}
          options={availableParties}
        />
      </div>
    </SectionCard>
  );
}

function ExclusionList({
  heading,
  subheading,
  parties,
  color,
  icon,
  adding,
  setAdding,
  onRemove,
  onAdd,
  options,
}: {
  heading: string;
  subheading: string;
  parties: string[];
  color: string;
  icon: React.ReactNode;
  adding: boolean;
  setAdding: (v: boolean) => void;
  onRemove: (name: string) => void;
  onAdd: (name: string) => void;
  options: string[];
}) {
  return (
    <div
      className="rounded-md p-4"
      style={{ background: "var(--bg-hover)", border: "1px solid var(--border)" }}
    >
      <div className="flex items-center justify-between mb-1">
        <p className="text-[13px] font-semibold" style={{ color: "var(--text-1)" }}>
          {heading}
        </p>
        <span
          className="text-[10px] font-bold px-1.5 py-0.5 rounded-md tabular-nums"
          style={{
            background: `color-mix(in srgb, ${color} 15%, transparent)`,
            color,
          }}
        >
          {parties.length}
        </span>
      </div>
      <p className="text-[11px] mb-3" style={{ color: "var(--text-3)" }}>
        {subheading}
      </p>
      {parties.length > 0 ? (
        <div className="flex flex-wrap gap-1.5 mb-3">
          {parties.map((p) => (
            <span
              key={p}
              className="inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-1 rounded-md"
              style={{
                background: `color-mix(in srgb, ${color} 10%, transparent)`,
                color,
                border: `1px solid color-mix(in srgb, ${color} 25%, transparent)`,
              }}
            >
              {icon}
              {p}
              <button
                onClick={() => onRemove(p)}
                className="ml-0.5 cursor-pointer hover:opacity-70"
                aria-label={`Remove ${p}`}
              >
                <X size={10} />
              </button>
            </span>
          ))}
        </div>
      ) : (
        <p className="text-[11px] mb-3 italic" style={{ color: "var(--text-4)" }}>
          No parties in this list yet.
        </p>
      )}
      {adding ? (
        <div className="flex items-center gap-2">
          <select
            defaultValue=""
            onChange={(e) => {
              if (e.target.value) onAdd(e.target.value);
            }}
            className="flex-1 text-[12px] px-2 py-1.5 rounded-md cursor-pointer"
            style={{
              background: "var(--bg-surface)",
              color: "var(--text-1)",
              border: "1px solid var(--border)",
            }}
          >
            <option value="" disabled>
              Pick a party…
            </option>
            {options.map((o) => (
              <option key={o} value={o}>
                {o}
              </option>
            ))}
          </select>
          <button
            onClick={() => setAdding(false)}
            className="text-[11px] px-2 py-1.5 rounded-md cursor-pointer"
            style={{ color: "var(--text-4)" }}
          >
            Cancel
          </button>
        </div>
      ) : (
        <button
          onClick={() => setAdding(true)}
          className="flex items-center gap-1 text-[11px] font-semibold cursor-pointer"
          style={{ color }}
        >
          <Plus size={11} />
          Add party
        </button>
      )}
    </div>
  );
}

/* ────────────────────────────────────────────────────────────────── */
/*  5. Escalation section                                             */
/* ────────────────────────────────────────────────────────────────── */
function EscalationSection({
  rules,
  update,
}: {
  rules: ReminderAutomationRules;
  update: <K extends keyof ReminderAutomationRules>(key: K, value: ReminderAutomationRules[K]) => void;
}) {
  return (
    <SectionCard
      title="Escalation rules"
      subtitle="What happens when reminders aren't working — route to a human before the relationship sours."
    >
      <div className="flex flex-col gap-4">
        <div
          className="flex items-start gap-3 px-4 py-3 rounded-lg flex-wrap"
          style={{ background: "var(--bg-hover)", border: "1px solid var(--border)" }}
        >
          <div className="flex-1 min-w-[200px]">
            <p className="text-[13px] font-semibold" style={{ color: "var(--text-1)" }}>
              Auto-escalate after no reply
            </p>
            <p className="text-[11px] mt-0.5" style={{ color: "var(--text-3)" }}>
              Creates a to-do for the assigned role. Useful when reminders alone aren&apos;t working.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <input
              type="number"
              min={1}
              max={60}
              value={rules.escalateAfterDays}
              onChange={(e) => {
                const n = parseInt(e.target.value, 10);
                if (!Number.isNaN(n)) update("escalateAfterDays", Math.min(Math.max(n, 1), 60));
              }}
              className="w-16 text-[12px] font-semibold px-2 py-1 rounded-md tabular-nums text-right"
              style={{
                background: "var(--bg-surface)",
                color: "var(--text-1)",
                border: "1px solid var(--border)",
                fontFamily: "'Space Grotesk', sans-serif",
              }}
            />
            <span className="text-[11px]" style={{ color: "var(--text-4)" }}>
              days → assign to
            </span>
            <select
              value={rules.escalateTo}
              onChange={(e) => update("escalateTo", e.target.value as ReminderAutomationRules["escalateTo"])}
              className="text-[12px] font-semibold px-2 py-1 rounded-md cursor-pointer"
              style={{
                background: "var(--bg-surface)",
                color: "var(--text-1)",
                border: "1px solid var(--border)",
              }}
            >
              <option value="accounts">Accounts</option>
              <option value="accounts-head">Accounts Head</option>
              <option value="sales">Sales</option>
              <option value="admin">Admin / Owner</option>
            </select>
          </div>
        </div>
        <ToggleRow
          title="Alert owner on Final tier"
          desc="When a party crosses into Final tone (180d+), ping the admin / owner on WhatsApp so they can intervene directly."
          checked={rules.finalTierAlert}
          onChange={(v) => update("finalTierAlert", v)}
        />
        <RemNumericRow
          label="SLA after Final tier"
          desc="Days we keep trying after Final tone before flagging the party for formal recovery / legal action."
          value={rules.slaAfterFinalDays}
          onChange={(v) => update("slaAfterFinalDays", v)}
          suffix="days"
          min={7}
          max={180}
        />
      </div>
    </SectionCard>
  );
}

/* ────────────────────────────────────────────────────────────────── */
/*  6. Auto-stop rules — extended                                     */
/* ────────────────────────────────────────────────────────────────── */
function StopRulesSection({
  rules,
  update,
}: {
  rules: ReminderAutomationRules;
  update: <K extends keyof ReminderAutomationRules>(key: K, value: ReminderAutomationRules[K]) => void;
}) {
  return (
    <SectionCard
      title="Auto-stop rules"
      subtitle="When reminders should stop automatically — prevents awkward follow-ups after intent-to-pay signals."
    >
      <div className="flex flex-col gap-3">
        {/* Stop on payment received — Credflow's "No reminders if paid
            recently" pattern adds a configurable window so an early
            payment doesn't suppress later overdue bills indefinitely. */}
        <div
          className="flex items-start gap-3 px-4 py-3 rounded-lg flex-wrap"
          style={{ background: "var(--bg-hover)", border: "1px solid var(--border)" }}
        >
          <div className="flex-1 min-w-[220px]">
            <p className="text-[13px] font-semibold" style={{ color: "var(--text-1)" }}>
              Stop on payment received
            </p>
            <p className="text-[11px] mt-0.5" style={{ color: "var(--text-3)" }}>
              When Tally syncs a receipt voucher for the party, skip reminders for{" "}
              <strong style={{ color: "var(--text-2)" }}>
                {rules.stopOnPaymentReceivedWindowDays}d
              </strong>{" "}
              after the receipt date.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => update("stopOnPaymentReceived", !rules.stopOnPaymentReceived)}
              className="relative inline-flex h-5 w-9 rounded-full transition-colors cursor-pointer"
              style={{
                background: rules.stopOnPaymentReceived ? "var(--green)" : "var(--bg-surface)",
                border: "1px solid var(--border)",
              }}
              aria-label="Toggle stop-on-payment-received"
            >
              <motion.span
                animate={{ x: rules.stopOnPaymentReceived ? 16 : 2 }}
                transition={{ duration: 0.15 }}
                className="absolute top-0.5 w-3.5 h-3.5 rounded-full"
                style={{ background: rules.stopOnPaymentReceived ? "#fff" : "var(--text-4)" }}
              />
            </button>
            <input
              type="number"
              min={1}
              max={90}
              value={rules.stopOnPaymentReceivedWindowDays}
              disabled={!rules.stopOnPaymentReceived}
              onChange={(e) =>
                update(
                  "stopOnPaymentReceivedWindowDays",
                  Math.max(1, Math.min(90, parseInt(e.target.value, 10) || 7)),
                )
              }
              className="w-14 text-[12px] font-semibold px-2 py-1 rounded-md tabular-nums text-right disabled:opacity-50"
              style={{
                background: "var(--bg-surface)",
                color: "var(--text-1)",
                border: "1px solid var(--border)",
              }}
            />
            <span className="text-[11px]" style={{ color: "var(--text-3)" }}>
              day{rules.stopOnPaymentReceivedWindowDays === 1 ? "" : "s"}
            </span>
          </div>
        </div>
        <ToggleRow
          title="Stop on PDC received"
          desc="If a Post-Dated Cheque is logged against the party in Tally, suppress reminders until the cheque clears or bounces. Common SMB B2B practice."
          checked={rules.stopOnPDCReceived}
          onChange={(v) => update("stopOnPDCReceived", v)}
        />
        <ToggleRow
          title="Stop on STOP reply"
          desc="If a party replies STOP to a WhatsApp reminder, mark them opted-out in party_contacts and skip future automated sends across all channels."
          checked={rules.stopOnOptOut}
          onChange={(v) => update("stopOnOptOut", v)}
        />
        <ToggleRow
          title='Pause on "promise to pay"'
          desc='If the reply matches "paying soon", "will clear", "promise" (and similar), pause reminders for 7 days. Resumes if no payment arrives.'
          checked={rules.stopOnPromiseToPay}
          onChange={(v) => update("stopOnPromiseToPay", v)}
        />
        <div
          className="flex items-start gap-3 px-4 py-3 rounded-lg flex-wrap"
          style={{ background: "var(--bg-hover)", border: "1px solid var(--border)" }}
        >
          <div className="flex-1 min-w-[220px]">
            <p className="text-[13px] font-semibold" style={{ color: "var(--text-1)" }}>
              Stop on partial payment
            </p>
            <p className="text-[11px] mt-0.5" style={{ color: "var(--text-3)" }}>
              Don&apos;t nag once they&apos;ve paid most of it. Threshold is the % of outstanding cleared.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => update("stopOnPartialPayment", !rules.stopOnPartialPayment)}
              className="relative inline-flex h-5 w-9 rounded-full transition-colors cursor-pointer"
              style={{
                background: rules.stopOnPartialPayment ? "var(--green)" : "var(--bg-surface)",
                border: "1px solid var(--border)",
              }}
            >
              <motion.span
                animate={{ x: rules.stopOnPartialPayment ? 16 : 2 }}
                transition={{ duration: 0.15 }}
                className="absolute top-0.5 w-3.5 h-3.5 rounded-full"
                style={{ background: rules.stopOnPartialPayment ? "#fff" : "var(--text-4)" }}
              />
            </button>
            <select
              value={rules.partialPaymentThreshold}
              onChange={(e) => update("partialPaymentThreshold", parseFloat(e.target.value))}
              disabled={!rules.stopOnPartialPayment}
              className="text-[12px] font-semibold px-2 py-1 rounded-md cursor-pointer disabled:opacity-50"
              style={{
                background: "var(--bg-surface)",
                color: "var(--text-1)",
                border: "1px solid var(--border)",
              }}
            >
              <option value={0.5}>≥ 50% paid</option>
              <option value={0.7}>≥ 70% paid</option>
              <option value={0.8}>≥ 80% paid</option>
              <option value={0.9}>≥ 90% paid</option>
            </select>
          </div>
        </div>
      </div>
    </SectionCard>
  );
}

/* ────────────────────────────────────────────────────────────────── */
/*  7. Channel health section — WA / Email / SMS accordions           */
/* ────────────────────────────────────────────────────────────────── */
function ChannelsSection({
  rules,
  update,
}: {
  rules: ReminderAutomationRules;
  update: <K extends keyof ReminderAutomationRules>(key: K, value: ReminderAutomationRules[K]) => void;
}) {
  return (
    <SectionCard
      title="Channel health"
      subtitle="Per-channel configuration + cost + credit balance. Expand each for details."
    >
      <div className="flex flex-col gap-3">
        <ChannelAccordion
          label="WhatsApp (WAMe) — manual only"
          color="var(--orange)"
          icon={<MessageCircle size={14} />}
          summary={
            <div className="flex items-center gap-3 flex-wrap text-[11px]" style={{ color: "var(--text-3)" }}>
              <StatusDot color="var(--orange)" label="Manual channel" />
              <span>Sent from Outstanding · Remind</span>
              <span>{rules.wameSenderNumber}</span>
            </div>
          }
        >
          {/* WAMe is wa.me deep-link based — no programmatic API. The owner
               clicks "Remind" on a party row in Outstanding, the WhatsApp
               modal builds a wa.me/<phone>?text=... URL, opens WhatsApp
               Web/Desktop with the message pre-filled, owner hits Send.
               Not part of automation by design. */}
          <p
            className="text-[10.5px] leading-relaxed mb-3 rounded-md p-2.5"
            style={{
              background: "color-mix(in srgb, var(--orange) 6%, transparent)",
              border: "1px solid color-mix(in srgb, var(--orange) 22%, transparent)",
              color: "var(--text-3)",
            }}
          >
            <strong style={{ color: "var(--orange)" }}>Why WhatsApp isn&apos;t automated:</strong>{" "}
            MSG91 offers a WhatsApp BSP, but high-volume reminder sends through it carry
            a real ban risk. WAMe (wa.me deep-links) is paste-and-send only — no
            programmatic API — so it lives on the manual side. Send WhatsApp reminders
            from <strong style={{ color: "var(--text-2)" }}>Outstanding → Remind</strong>{" "}
            on each party row. Email + SMS still route through MSG91 below.
          </p>
          <div className="grid grid-cols-2 gap-3">
            <HealthTile label="Sender number" value={rules.wameSenderNumber} sub="Registered WAMe sender" />
            <HealthTile label="Cost per send" value="Free" sub="wa.me deep-link · no per-message cost" />
            <HealthTile label="Channel type" value="Manual" sub="Owner clicks Send in WhatsApp Web/Desktop" />
            <HealthTile label="Sends this month" value="—" sub="Tracked via Outstanding remind history" />
          </div>
          <div className="flex items-center gap-2 mt-3">
            <button
              className="text-[11px] font-semibold px-3 py-1.5 rounded-md cursor-pointer"
              style={{ background: "var(--bg-hover)", color: "var(--text-2)" }}
              onClick={() => {
                window.dispatchEvent(new CustomEvent("riko:navigate", { detail: "outstanding" }));
              }}
            >
              Go to Outstanding →
            </button>
          </div>
        </ChannelAccordion>

        <ChannelAccordion
          label="Email (Resend)"
          color="var(--blue)"
          icon={<Mail size={14} />}
          summary={
            <div className="flex items-center gap-3 flex-wrap text-[11px]" style={{ color: "var(--text-3)" }}>
              <StatusDot color="var(--green)" label="Verified" />
              <span className="truncate">From: {rules.emailFromAddress}</span>
            </div>
          }
        >
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <FieldInput
              label="From address"
              value={rules.emailFromAddress}
              onChange={(v) => update("emailFromAddress", v)}
            />
            <FieldInput
              label="Reply-to"
              value={rules.emailReplyTo}
              onChange={(v) => update("emailReplyTo", v)}
            />
          </div>
          <div className="mt-3">
            <p className="text-[10px] uppercase tracking-wider font-semibold mb-1.5" style={{ color: "var(--text-4)" }}>
              Signature
            </p>
            <textarea
              value={rules.emailSignature}
              onChange={(e) => update("emailSignature", e.target.value)}
              rows={4}
              className="w-full text-[12px] p-2.5 rounded-md"
              style={{
                background: "var(--bg-surface)",
                color: "var(--text-2)",
                border: "1px solid var(--border)",
                resize: "vertical",
              }}
            />
          </div>
        </ChannelAccordion>

        <ChannelAccordion
          label="SMS (MSG91 · DLT compliant)"
          color="var(--text-2)"
          icon={<MessageCircle size={14} />}
          summary={
            <div className="flex items-center gap-3 flex-wrap text-[11px]" style={{ color: "var(--text-3)" }}>
              <StatusDot color="var(--green)" label="DLT registered" />
              <span>₹{rules.smsCostPerMessage.toFixed(2)} / msg</span>
              <span>Header: {rules.smsDltHeader}</span>
            </div>
          }
        >
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <FieldInput
              label="DLT header"
              value={rules.smsDltHeader}
              onChange={(v) => update("smsDltHeader", v)}
              hint="6-char TRAI-registered header"
            />
            <FieldInput
              label="Sender ID"
              value={rules.smsSenderId}
              onChange={(v) => update("smsSenderId", v)}
              hint="Same as DLT header for most senders"
            />
          </div>
          <p className="text-[11px] mt-3" style={{ color: "var(--text-4)" }}>
            SMS is the fallback channel — lower reply rate (~9%) but 100% delivery. Used when
            WhatsApp templates aren&apos;t approved yet or the party has opted out of WA.
          </p>
        </ChannelAccordion>
      </div>
    </SectionCard>
  );
}

function ChannelAccordion({
  label,
  color,
  icon,
  summary,
  children,
  defaultOpen,
}: {
  label: string;
  color: string;
  icon: React.ReactNode;
  summary: React.ReactNode;
  children: React.ReactNode;
  defaultOpen?: boolean;
}) {
  const [open, setOpen] = useState(!!defaultOpen);
  return (
    <div
      className="rounded-md overflow-hidden"
      style={{ background: "var(--bg-hover)", border: "1px solid var(--border)" }}
    >
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center gap-3 px-4 py-3 cursor-pointer transition-colors"
      >
        <div
          className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
          style={{
            background: `color-mix(in srgb, ${color} 15%, transparent)`,
            color,
          }}
        >
          {icon}
        </div>
        <div className="flex-1 min-w-0 text-left">
          <p className="text-[13px] font-semibold truncate" style={{ color: "var(--text-1)" }}>
            {label}
          </p>
          {summary}
        </div>
        <ChevronDown
          size={16}
          style={{
            color: "var(--text-3)",
            transform: open ? "rotate(180deg)" : "rotate(0deg)",
            transition: "transform 0.2s",
          }}
        />
      </button>
      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="px-4 pb-4 flex flex-col gap-2" style={{ borderTop: "1px solid var(--border)", paddingTop: 12 }}>
              {children}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function StatusDot({ color, label }: { color: string; label: string }) {
  return (
    <span className="inline-flex items-center gap-1">
      <span
        className="w-1.5 h-1.5 rounded-full"
        style={{ background: color }}
      />
      <span style={{ color }}>{label}</span>
    </span>
  );
}

function HealthTile({
  label,
  value,
  sub,
  color = "var(--text-1)",
}: {
  label: string;
  value: string;
  sub: string;
  color?: string;
}) {
  return (
    <div
      className="rounded-lg p-3"
      style={{ background: "var(--bg-primary)", border: "1px solid var(--border)" }}
    >
      <p className="text-[10px] uppercase tracking-wider font-semibold mb-1" style={{ color: "var(--text-4)" }}>
        {label}
      </p>
      <p
        className="text-base font-bold tabular-nums"
        style={{ color, fontFamily: "'Space Grotesk', sans-serif" }}
      >
        {value}
      </p>
      <p className="text-[10px] mt-0.5" style={{ color: "var(--text-4)" }}>
        {sub}
      </p>
    </div>
  );
}

function FieldInput({
  label,
  value,
  onChange,
  hint,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  hint?: string;
}) {
  return (
    <div>
      <p className="text-[10px] uppercase tracking-wider font-semibold mb-1.5" style={{ color: "var(--text-4)" }}>
        {label}
      </p>
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full text-[12px] px-2.5 py-1.5 rounded-md"
        style={{
          background: "var(--bg-surface)",
          color: "var(--text-1)",
          border: "1px solid var(--border)",
          fontFamily: "'Space Grotesk', sans-serif",
        }}
      />
      {hint && (
        <p className="text-[10px] mt-1" style={{ color: "var(--text-4)" }}>
          {hint}
        </p>
      )}
    </div>
  );
}

/* ────────────────────────────────────────────────────────────────── */
/*  8. Analytics section — 30d sends + reply rates + correlation      */
/* ────────────────────────────────────────────────────────────────── */
function AnalyticsSection() {
  const a = REMINDER_ANALYTICS_30D;
  const maxDaily = Math.max(
    ...a.dailySends.map((d) => d.gentle + d.standard + d.firm + d.final),
    1,
  );

  return (
    <SectionCard
      title="Last 30 days"
      subtitle="How reminders actually performed — tune your rules above based on what's working."
    >
      <div className="flex flex-col gap-5">
        {/* Summary row */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <SummaryStat
            label="Total sent"
            value={String(a.totalSent)}
            sub={`${a.totalReplies} replies · ${Math.round((a.totalReplies / Math.max(a.totalSent, 1)) * 100)}%`}
            color="var(--blue)"
          />
          <SummaryStat
            label="Collected"
            value={`₹${(a.totalCollected / 1e5).toFixed(1)}L`}
            sub={`Correlated within 7d of reminder`}
            color="var(--green)"
          />
          <SummaryStat
            label="Monthly cost"
            value={`₹${a.totalCost}`}
            sub={`~₹${(a.totalCost / Math.max(a.totalSent, 1)).toFixed(2)} per send avg`}
            color="var(--orange)"
          />
          <SummaryStat
            label="Credits burn"
            value={`${a.creditsBurnRate}/day`}
            sub="Monitor to avoid mid-month top-ups"
            color="var(--purple)"
          />
        </div>

        {/* 30-day stacked bar chart */}
        <div>
          <p className="text-[11px] font-semibold mb-2" style={{ color: "var(--text-3)" }}>
            Daily sends by tier
          </p>
          <div
            className="rounded-md p-3 flex items-end gap-1"
            style={{ background: "var(--bg-hover)", border: "1px solid var(--border)", minHeight: 140 }}
          >
            {a.dailySends.map((d) => {
              const total = d.gentle + d.standard + d.firm + d.final;
              const h = total === 0 ? 0 : (total / maxDaily) * 100;
              return (
                <div
                  key={d.date}
                  className="flex-1 flex flex-col items-center justify-end gap-1"
                  title={`${d.dayLabel} · ${total} sends (${d.gentle}G + ${d.standard}S + ${d.firm}F + ${d.final}Fi)`}
                >
                  <div className="w-full flex flex-col-reverse" style={{ height: 110 }}>
                    {total > 0 && (
                      <>
                        <div
                          style={{
                            height: `${(d.gentle / total) * h}%`,
                            background: "var(--green)",
                            opacity: 0.85,
                          }}
                        />
                        <div
                          style={{
                            height: `${(d.standard / total) * h}%`,
                            background: "var(--blue)",
                            opacity: 0.85,
                          }}
                        />
                        <div
                          style={{
                            height: `${(d.firm / total) * h}%`,
                            background: "var(--orange)",
                            opacity: 0.85,
                          }}
                        />
                        <div
                          style={{
                            height: `${(d.final / total) * h}%`,
                            background: "var(--red)",
                            opacity: 0.85,
                          }}
                        />
                      </>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
          <div className="flex items-center justify-between text-[10px] mt-2" style={{ color: "var(--text-4)" }}>
            <span>{a.dailySends[0]?.dayLabel}</span>
            <div className="flex items-center gap-3">
              {(["gentle", "standard", "firm", "final"] as ReminderTone[]).map((t) => (
                <span key={t} className="flex items-center gap-1 capitalize">
                  <span
                    className="inline-block w-2 h-2 rounded-sm"
                    style={{ background: TONE_META[t].color }}
                  />
                  {t}
                </span>
              ))}
            </div>
            <span>{a.dailySends[a.dailySends.length - 1]?.dayLabel}</span>
          </div>
        </div>

        {/* Reply rate by channel */}
        <div>
          <p className="text-[11px] font-semibold mb-2" style={{ color: "var(--text-3)" }}>
            Reply rate by channel
          </p>
          <div className="flex flex-col gap-2">
            {(["whatsapp", "email", "sms"] as ReminderChannel[]).map((ch) => {
              const rate = a.replyRateByChannel[ch];
              const color = ch === "whatsapp" ? "var(--green)" : ch === "email" ? "var(--blue)" : "var(--text-3)";
              const label = ch === "whatsapp" ? "WhatsApp" : ch === "email" ? "Email" : "SMS";
              return (
                <div key={ch} className="flex items-center gap-3">
                  <span className="text-[11px] font-semibold w-20 flex-shrink-0" style={{ color: "var(--text-2)" }}>
                    {label}
                  </span>
                  <div
                    className="flex-1 h-5 rounded-md overflow-hidden"
                    style={{ background: "var(--bg-hover)" }}
                  >
                    <motion.div
                      initial={{ width: 0 }}
                      whileInView={{ width: `${rate * 100}%` }}
                      viewport={{ once: true }}
                      transition={{ duration: 0.6, delay: 0.1 }}
                      className="h-full rounded-md"
                      style={{ background: color }}
                    />
                  </div>
                  <span
                    className="text-[11px] font-bold tabular-nums w-10 text-right"
                    style={{ color, fontFamily: "'Space Grotesk', sans-serif" }}
                  >
                    {Math.round(rate * 100)}%
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Payment correlation by tone */}
        <div>
          <p className="text-[11px] font-semibold mb-2" style={{ color: "var(--text-3)" }}>
            Paid within 7 days of reminder, by tone
          </p>
          <div className="grid grid-cols-4 gap-2">
            {(Object.keys(TONE_META) as ReminderTone[]).map((t) => {
              const c = a.paymentCorrelation[t];
              return (
                <div
                  key={t}
                  className="rounded-lg p-3 flex flex-col gap-1"
                  style={{
                    background: "var(--bg-primary)",
                    border: "1px solid var(--border)",
                    borderLeft: `3px solid ${TONE_META[t].color}`,
                  }}
                >
                  <span className="text-[10px] font-semibold capitalize" style={{ color: "var(--text-4)" }}>
                    {t}
                  </span>
                  <p
                    className="text-lg font-bold tabular-nums"
                    style={{ color: TONE_META[t].color, fontFamily: "'Space Grotesk', sans-serif" }}
                  >
                    {Math.round(c.pct * 100)}%
                  </p>
                  <p className="text-[10px]" style={{ color: "var(--text-4)" }}>
                    {c.paidWithin7d} of {c.reminded} paid
                  </p>
                </div>
              );
            })}
          </div>
          <p className="text-[10px] mt-2 italic" style={{ color: "var(--text-4)" }}>
            Gentle tone converts best — but only because it hits recent dues. Final tier is
            selection bias: these parties were already unlikely to pay.
          </p>
        </div>
      </div>
    </SectionCard>
  );
}

function SummaryStat({
  label,
  value,
  sub,
  color,
}: {
  label: string;
  value: string;
  sub: string;
  color: string;
}) {
  return (
    <div
      className="rounded-lg p-3"
      style={{ background: "var(--bg-hover)", border: "1px solid var(--border)" }}
    >
      <p className="text-[10px] uppercase tracking-wider font-semibold mb-1" style={{ color: "var(--text-4)" }}>
        {label}
      </p>
      <p
        className="text-lg font-bold tabular-nums"
        style={{ color, fontFamily: "'Space Grotesk', sans-serif" }}
      >
        {value}
      </p>
      <p className="text-[10px] mt-0.5" style={{ color: "var(--text-3)" }}>
        {sub}
      </p>
    </div>
  );
}

/* ────────────────────────────────────────────────────────────────── */
/*  Shared: numeric input row (kept local to avoid name clash)        */
/* ────────────────────────────────────────────────────────────────── */
function RemNumericRow({
  label,
  desc,
  value,
  onChange,
  suffix,
  min,
  max,
}: {
  label: string;
  desc: string;
  value: number;
  onChange: (v: number) => void;
  suffix: string;
  min: number;
  max: number;
}) {
  return (
    <div
      className="flex items-start gap-3 px-4 py-3 rounded-lg"
      style={{ background: "var(--bg-hover)", border: "1px solid var(--border)" }}
    >
      <div className="flex-1 min-w-0">
        <p className="text-[13px] font-semibold" style={{ color: "var(--text-1)" }}>
          {label}
        </p>
        <p className="text-[11px] mt-0.5" style={{ color: "var(--text-3)" }}>
          {desc}
        </p>
      </div>
      <div className="flex items-center gap-2 flex-shrink-0">
        <input
          type="number"
          min={min}
          max={max}
          value={value}
          onChange={(e) => {
            const n = parseInt(e.target.value, 10);
            if (!Number.isNaN(n)) onChange(Math.min(Math.max(n, min), max));
          }}
          className="w-20 text-[12px] font-semibold px-2 py-1 rounded-md tabular-nums text-right"
          style={{
            background: "var(--bg-surface)",
            color: "var(--text-1)",
            border: "1px solid var(--border)",
            fontFamily: "'Space Grotesk', sans-serif",
          }}
        />
        <span className="text-[11px]" style={{ color: "var(--text-4)" }}>
          {suffix}
        </span>
      </div>
    </div>
  );
}
