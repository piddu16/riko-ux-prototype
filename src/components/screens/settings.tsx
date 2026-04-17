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
  | "notifications";

const SETTINGS_TABS: { id: SettingsTab; label: string; icon: React.ElementType }[] = [
  { id: "team", label: "Team", icon: Users },
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
        {activeTab !== "team" && (
          <ComingSoonTab
            tab={SETTINGS_TABS.find((t) => t.id === activeTab)!}
          />
        )}
      </div>
    </div>
  );
}

/* ================================================================== */
/*  ComingSoonTab                                                     */
/* ================================================================== */
function ComingSoonTab({
  tab,
}: {
  tab: { id: SettingsTab; label: string; icon: React.ElementType };
}) {
  const Icon = tab.icon;
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="rounded-xl flex flex-col items-center justify-center text-center py-20 px-6"
      style={{
        background: "var(--bg-surface)",
        border: "1px dashed var(--border)",
      }}
    >
      <span
        className="flex items-center justify-center rounded-full mb-4"
        style={{
          width: 56,
          height: 56,
          background: "color-mix(in srgb, var(--text-3) 10%, transparent)",
          color: "var(--text-3)",
        }}
      >
        <Icon size={26} />
      </span>
      <p
        className="text-lg font-bold"
        style={{
          color: "var(--text-1)",
          fontFamily: "'Space Grotesk', sans-serif",
        }}
      >
        {tab.label}
      </p>
      <p className="text-sm mt-1" style={{ color: "var(--text-4)" }}>
        Coming soon
      </p>
    </motion.div>
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
    </div>
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
        <span
          className="inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full flex-shrink-0"
          style={{
            background: `color-mix(in srgb, ${statusCfg.color} 15%, transparent)`,
            border: `1px solid color-mix(in srgb, ${statusCfg.color} 30%, transparent)`,
            color: statusCfg.color,
          }}
        >
          {statusCfg.label}
        </span>
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
