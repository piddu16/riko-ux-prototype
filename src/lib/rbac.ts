/* ============================================================
   RBAC — Role-Based Access Control (per Riko RBAC PRD v1)
   ============================================================ */

export type Role = "admin" | "manager" | "sales" | "accounts" | "viewer";

export type Permission =
  | "dashboard.view"
  | "dashboard.finance"          // P&L, Bank, Cash widgets
  | "dashboard.sales"             // Sales KPIs
  | "chat.full"
  | "chat.scoped"
  | "items.view"
  | "items.cost"                  // See cost/margin data
  | "items.edit"
  | "outstanding.receivables"
  | "outstanding.payables"
  | "outstanding.edit"
  | "reports.financial"           // P&L, Balance Sheet
  | "reports.sales"
  | "reports.inventory"
  | "reports.statutory"
  | "sales.view"
  | "cfo_insights.view"
  | "gst.view"
  | "gst.file"
  | "clients.view"                // CA portfolio
  | "settings.view"
  | "settings.team"               // Team management
  | "settings.billing"
  | "settings.api";

export const ROLES: Record<Role, {
  name: string;
  description: string;
  color: string;
  badgeColor: string;
  icon: string;
  permissions: Permission[];
  homeTab: string;
}> = {
  admin: {
    name: "Admin / Owner",
    description: "Full access to everything. Manages team, billing, settings.",
    color: "var(--purple)",
    badgeColor: "#A855F7",
    icon: "👑",
    permissions: [
      "dashboard.view", "dashboard.finance", "dashboard.sales",
      "chat.full",
      "items.view", "items.cost", "items.edit",
      "outstanding.receivables", "outstanding.payables", "outstanding.edit",
      "reports.financial", "reports.sales", "reports.inventory", "reports.statutory",
      "sales.view", "cfo_insights.view",
      "gst.view", "gst.file",
      "clients.view",
      "settings.view", "settings.team", "settings.billing", "settings.api",
    ],
    homeTab: "dashboard",
  },
  manager: {
    name: "Manager",
    description: "Full operational visibility except team management and billing.",
    color: "var(--blue)",
    badgeColor: "#3B82F6",
    icon: "💼",
    permissions: [
      "dashboard.view", "dashboard.finance", "dashboard.sales",
      "chat.full",
      "items.view", "items.cost", "items.edit",
      "outstanding.receivables", "outstanding.payables", "outstanding.edit",
      "reports.financial", "reports.sales", "reports.inventory",
      "sales.view", "cfo_insights.view",
      "gst.view",
      "settings.view",
    ],
    homeTab: "dashboard",
  },
  sales: {
    name: "Sales",
    description: "Sees sales KPIs, their customers, and receivables. No finance data.",
    color: "var(--green)",
    badgeColor: "#22C55E",
    icon: "📈",
    permissions: [
      "dashboard.view", "dashboard.sales",
      "chat.scoped",
      "items.view",                // No cost data
      "outstanding.receivables",   // No payables
      "reports.sales",
      "sales.view",
    ],
    homeTab: "sales",
  },
  accounts: {
    name: "Accounts",
    description: "Finance operations: reports, receivables, payables, GST. No sales analytics.",
    color: "var(--orange)",
    badgeColor: "#F97316",
    icon: "🧾",
    permissions: [
      "dashboard.view", "dashboard.finance",
      "chat.scoped",
      "items.view",
      "outstanding.receivables", "outstanding.payables",
      "reports.financial",
      "gst.view", "gst.file",
    ],
    homeTab: "outstanding",
  },
  viewer: {
    name: "Viewer",
    description: "Read-only auditor access. Great for CAs and external reviewers.",
    color: "var(--text-3)",
    badgeColor: "#94A3B8",
    icon: "👁️",
    permissions: [
      "dashboard.view",
      "items.view",
      "outstanding.receivables", "outstanding.payables",
      "reports.financial", "reports.sales",
      "sales.view",
      "gst.view",
    ],
    homeTab: "dashboard",
  },
};

export const ROLE_LIST: Role[] = ["admin", "manager", "sales", "accounts", "viewer"];

/* Nav tab → required permission(s) */
export const NAV_PERMISSIONS: Record<string, Permission> = {
  dashboard: "dashboard.view",
  chat: "chat.scoped",         // chat.full covers this too
  clients: "clients.view",
  gst: "gst.view",
  outstanding: "outstanding.receivables",
  daybook: "reports.financial",
  sales: "sales.view",
  inventory: "items.view",
  reports: "reports.sales",    // any report access
  settings: "settings.view",
};

export function hasPerm(role: Role, perm: Permission): boolean {
  return ROLES[role].permissions.includes(perm);
}

export function hasAnyPerm(role: Role, perms: Permission[]): boolean {
  return perms.some((p) => hasPerm(role, p));
}

export function canSeeTab(role: Role, tabId: string): boolean {
  const perm = NAV_PERMISSIONS[tabId];
  if (!perm) return true;
  // chat tab: both chat.full and chat.scoped should show it
  if (tabId === "chat") return hasPerm(role, "chat.full") || hasPerm(role, "chat.scoped");
  return hasPerm(role, perm);
}

/* ============================================================
   Team mock data
   ============================================================ */

export type MemberStatus = "active" | "pending" | "suspended";

export type TeamMember = {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: Role;
  status: MemberStatus;
  invitedBy: string;
  invitedAt: string;
  lastActive: string;
  avatar: string;
};

export const TEAM_MEMBERS: TeamMember[] = [
  {
    id: "u1",
    name: "Yogesh Patel",
    email: "yogesh@bandrasoap.in",
    phone: "+91 98765 43210",
    role: "admin",
    status: "active",
    invitedBy: "—",
    invitedAt: "1 Jan 2024",
    lastActive: "Just now",
    avatar: "Y",
  },
  {
    id: "u2",
    name: "Priya Sharma",
    email: "priya@bandrasoap.in",
    phone: "+91 98201 22334",
    role: "manager",
    status: "active",
    invitedBy: "Yogesh Patel",
    invitedAt: "15 Feb 2025",
    lastActive: "2 hours ago",
    avatar: "P",
  },
  {
    id: "u3",
    name: "Rahul Mehta",
    email: "rahul@bandrasoap.in",
    phone: "+91 98765 55566",
    role: "sales",
    status: "active",
    invitedBy: "Priya Sharma",
    invitedAt: "3 Mar 2025",
    lastActive: "15 min ago",
    avatar: "R",
  },
  {
    id: "u4",
    name: "Anjali Desai",
    email: "anjali@bandrasoap.in",
    phone: "+91 98765 77889",
    role: "sales",
    status: "active",
    invitedBy: "Priya Sharma",
    invitedAt: "12 Mar 2025",
    lastActive: "1 hour ago",
    avatar: "A",
  },
  {
    id: "u5",
    name: "Sunil Shah",
    email: "sunil@bandrasoap.in",
    phone: "+91 98765 99001",
    role: "accounts",
    status: "active",
    invitedBy: "Yogesh Patel",
    invitedAt: "8 Jan 2025",
    lastActive: "4 hours ago",
    avatar: "S",
  },
  {
    id: "u6",
    name: "CA Rajesh Sharma",
    email: "rajesh@nxtlvlca.in",
    phone: "+91 98765 11223",
    role: "viewer",
    status: "active",
    invitedBy: "Yogesh Patel",
    invitedAt: "20 Feb 2025",
    lastActive: "Yesterday",
    avatar: "R",
  },
  {
    id: "u7",
    name: "Vikram Joshi",
    email: "vikram@bandrasoap.in",
    phone: "+91 98765 44556",
    role: "sales",
    status: "pending",
    invitedBy: "Priya Sharma",
    invitedAt: "16 Apr 2026",
    lastActive: "—",
    avatar: "V",
  },
];

export const ACTIVITY_LOG = [
  { id: "a1", actor: "Rahul Mehta", action: "Viewed customer ledger", target: "Nykaa E-Retail", at: "15 min ago", role: "sales" as Role },
  { id: "a2", actor: "Priya Sharma", action: "Exported MIS Report", target: "March 2026", at: "2 hours ago", role: "manager" as Role },
  { id: "a3", actor: "Sunil Shah", action: "Generated GSTR-3B draft", target: "March 2026", at: "4 hours ago", role: "accounts" as Role },
  { id: "a4", actor: "Anjali Desai", action: "Sent WhatsApp reminder", target: "Paytm (One97)", at: "5 hours ago", role: "sales" as Role },
  { id: "a5", actor: "CA Rajesh Sharma", action: "Viewed Balance Sheet", target: "FY 2024-25", at: "Yesterday", role: "viewer" as Role },
];
