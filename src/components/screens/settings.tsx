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
import { PENDING_INVITE_EXPIRY_DAYS } from "@/lib/data";
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
  | "approvals";

const SETTINGS_TABS: { id: SettingsTab; label: string; icon: React.ElementType }[] = [
  { id: "team", label: "Team", icon: Users },
  { id: "approvals", label: "Approvals", icon: ShieldCheck },
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
                  color: active ? "var(--green)" : "var(--text-3)",
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
      className="rounded-xl overflow-hidden"
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
                background: "color-mix(in srgb, var(--green) 15%, transparent)",
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
        className="rounded-xl overflow-hidden"
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
                        background: "color-mix(in srgb, var(--green) 15%, transparent)",
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
    { id: "msg91", name: "MSG91 WhatsApp", desc: "Transactional WhatsApp messages", connected: true, color: "#25D366", logo: "W" },
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
              className="rounded-xl p-4 flex flex-col gap-3"
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
        className="rounded-xl overflow-hidden"
        style={{
          background:
            "linear-gradient(135deg, color-mix(in srgb, var(--green) 8%, var(--bg-surface)) 0%, var(--bg-surface) 100%)",
          border: "1px solid color-mix(in srgb, var(--green) 35%, transparent)",
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
                background: "color-mix(in srgb, var(--green) 15%, transparent)",
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
        className="rounded-xl overflow-hidden"
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
        className="rounded-xl p-5"
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
                className="rounded-xl p-3 flex flex-col gap-2 transition-shadow hover:shadow-lg"
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
        className="rounded-xl overflow-hidden"
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
              border: "1px solid color-mix(in srgb, var(--green) 35%, transparent)",
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
              className="w-full max-w-md rounded-xl overflow-hidden"
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
            className="w-full max-w-2xl rounded-xl overflow-hidden flex flex-col"
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
                    background: "color-mix(in srgb, var(--green) 15%, transparent)",
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
                    className="w-full rounded-xl flex flex-col items-center justify-center py-10 px-4 cursor-pointer transition-colors"
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
                        background: "color-mix(in srgb, var(--green) 15%, transparent)",
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
                                    background: "color-mix(in srgb, var(--green) 15%, transparent)",
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
      className="rounded-xl overflow-hidden"
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
