/* ============================================================
   RBAC — Role-Based Access Control (per Riko RBAC PRD v1 +
   Tally write-back extension)
   ============================================================ */

export type Role =
  | "admin"
  | "accounts-head"
  | "accounts"
  | "junior-accounts"
  | "manager"
  | "sales"
  | "field-sales"
  | "viewer";

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
  | "settings.api"
  // Tally write-back extension
  | "entries.view"                // See Entries tab
  | "entries.draft"               // Can create drafts
  | "entries.approve"             // Can approve pending entries
  | "entries.post"                // Can post approved entries to Tally
  | "entries.override"            // Can bypass approval chain
  | "entries.approve.high"        // Can approve >₹1L entries
  | "entries.upload";             // Can use OCR upload

/** Per-entry-type action a role is allowed to perform. "D" = draft,
 *  "A" = approve, "P" = post. Value thresholds defined separately. */
export type EntryActionSet = ("draft" | "approve" | "post")[];

export type EntryType =
  | "sales"
  | "purchase"
  | "receipt"
  | "payment"
  | "contra"
  | "journal"
  | "credit-note"
  | "debit-note"
  | "stock-journal"
  | "bank-recon";

/** Fine-grained matrix: which voucher types can each role act on, and how.
 *  Used for permission checks inside the Entries screens (e.g. "should
 *  we show the Approve button on this purchase voucher to this role?"). */
export const ENTRY_MATRIX: Record<Role, Partial<Record<EntryType, EntryActionSet>>> = {
  admin: {
    sales: ["draft", "approve", "post"],
    purchase: ["draft", "approve", "post"],
    receipt: ["draft", "approve", "post"],
    payment: ["draft", "approve", "post"],
    contra: ["draft", "approve", "post"],
    journal: ["draft", "approve", "post"],
    "credit-note": ["draft", "approve", "post"],
    "debit-note": ["draft", "approve", "post"],
    "stock-journal": ["draft", "approve", "post"],
    "bank-recon": ["draft", "approve", "post"],
  },
  "accounts-head": {
    sales: ["draft", "approve", "post"],
    purchase: ["draft", "approve", "post"],
    receipt: ["draft", "approve", "post"],
    payment: ["draft", "approve", "post"],
    contra: ["draft", "approve", "post"],
    journal: ["draft", "approve", "post"],
    "credit-note": ["draft", "approve", "post"],
    "debit-note": ["draft", "approve", "post"],
    "stock-journal": ["draft", "approve", "post"],
    "bank-recon": ["draft", "approve", "post"],
  },
  accounts: {
    sales: ["draft", "approve", "post"],
    purchase: ["draft", "approve", "post"],
    receipt: ["draft", "approve", "post"],
    payment: ["draft", "approve", "post"],
    contra: ["draft", "approve", "post"],
    journal: ["draft", "approve", "post"],
    "credit-note": ["draft", "approve", "post"],
    "debit-note": ["draft", "approve", "post"],
    "stock-journal": ["draft", "approve", "post"],
    "bank-recon": ["draft", "approve", "post"],
  },
  "junior-accounts": {
    // Drafts only — no approval or posting. Above threshold routes to
    // accounts-head anyway. Entries from this role always require review.
    sales: ["draft"],
    purchase: ["draft"],
    receipt: ["draft"],
    payment: ["draft"],
    contra: ["draft"],
    "credit-note": ["draft"],
    "debit-note": ["draft"],
    "stock-journal": ["draft"],
    // No journal (sensitive) or bank-recon
  },
  manager: {
    // Managers can post their own domain entries directly (per user decision).
    // Approval threshold still applies: Payment >₹1L still routes to accounts.
    sales: ["draft", "approve", "post"],
    purchase: ["draft", "approve"], // approval only — posting goes to accounts
    receipt: ["draft", "approve", "post"],
    payment: ["draft", "approve"], // approval only, and <₹1L only
    "credit-note": ["draft", "approve"],
    "bank-recon": ["draft", "approve"],
    // No contra, journal, debit-note, stock-journal
  },
  sales: {
    // Sales lead — owns customer relationships. Drafts invoices + receipts
    // from their customers; approvals handled by accounts.
    sales: ["draft", "approve"], // approve small-value only
    receipt: ["draft", "approve"],
    "credit-note": ["draft"],
  },
  "field-sales": {
    // Field sales — draft invoices + receipts from own customers only.
    // No approval authority at all. Customer scope enforced in UI via
    // "own customers only" filter (not modelled in data yet).
    sales: ["draft"],
    receipt: ["draft"],
  },
  viewer: {
    // Read-only. No draft / approve / post anywhere.
  },
};

/** Value bands → required approver seniority. Configurable per company
 *  (this is default). Higher bands short-circuit lower approver roles. */
export const APPROVAL_THRESHOLDS = [
  { maxValue: 10_000, minApprover: "any" as const, label: "< ₹10,000" },
  { maxValue: 100_000, minApprover: "accounts" as const, label: "₹10K – ₹1L" },
  { maxValue: 1_000_000, minApprover: "accounts-head" as const, label: "₹1L – ₹10L" },
  { maxValue: Infinity, minApprover: "admin" as const, label: "> ₹10L" },
] as const;

/** Given an entry amount, what's the minimum role that can approve it? */
export function requiredApproverForAmount(amount: number): "any" | "accounts" | "accounts-head" | "admin" {
  for (const tier of APPROVAL_THRESHOLDS) {
    if (Math.abs(amount) <= tier.maxValue) return tier.minApprover;
  }
  return "admin";
}

/** Does this role have authority to approve an entry of this value?
 *  accounts-head covers accounts' threshold too; admin covers all. */
export function canApproveAmount(role: Role, amount: number): boolean {
  const required = requiredApproverForAmount(amount);
  if (required === "any") return role !== "viewer" && role !== "field-sales" && role !== "junior-accounts";
  if (required === "accounts") {
    return ["admin", "accounts-head", "accounts", "manager"].includes(role);
  }
  if (required === "accounts-head") {
    return ["admin", "accounts-head"].includes(role);
  }
  if (required === "admin") {
    return role === "admin";
  }
  return false;
}

/** Can this role perform action X on entry-type T? */
export function canEntryAction(
  role: Role,
  type: EntryType,
  action: "draft" | "approve" | "post"
): boolean {
  const perms = ENTRY_MATRIX[role]?.[type];
  if (!perms) return false;
  return perms.includes(action);
}

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
    description: "Full access. Manages team, billing, settings. Can override approval chains.",
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
      "entries.view", "entries.draft", "entries.approve", "entries.post",
      "entries.override", "entries.approve.high", "entries.upload",
    ],
    homeTab: "dashboard",
  },
  "accounts-head": {
    name: "Accounts Head",
    description: "Senior accounts. Approves high-value entries (>₹1L). Posts to Tally. Owns the books.",
    color: "var(--orange)",
    badgeColor: "#EA580C",
    icon: "🎯",
    permissions: [
      "dashboard.view", "dashboard.finance",
      "chat.full",
      "items.view", "items.cost",
      "outstanding.receivables", "outstanding.payables", "outstanding.edit",
      "reports.financial", "reports.statutory",
      "gst.view", "gst.file",
      "entries.view", "entries.draft", "entries.approve", "entries.post",
      "entries.approve.high", "entries.upload",
    ],
    homeTab: "entries",
  },
  accounts: {
    name: "Accounts",
    description: "Finance operations. Drafts, approves <₹1L, and posts to Tally. Routes high-value to Accounts Head.",
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
      "entries.view", "entries.draft", "entries.approve", "entries.post",
      "entries.upload",
    ],
    homeTab: "entries",
  },
  "junior-accounts": {
    name: "Junior Accounts",
    description: "Clerical. Drafts entries + OCR uploads. No approval authority — everything routes to senior review.",
    color: "var(--yellow)",
    badgeColor: "#EAB308",
    icon: "📋",
    permissions: [
      "dashboard.view",
      "chat.scoped",
      "items.view",
      "outstanding.receivables", "outstanding.payables",
      "entries.view", "entries.draft", "entries.upload",
    ],
    homeTab: "entries",
  },
  manager: {
    name: "Manager",
    description: "Business unit head. Posts sales + receipts directly. Approves mid-value entries.",
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
      "entries.view", "entries.draft", "entries.approve", "entries.post",
    ],
    homeTab: "dashboard",
  },
  sales: {
    name: "Sales Lead",
    description: "Sales KPIs + customers + receivables. Drafts invoices + receipts from their customers.",
    color: "var(--green)",
    badgeColor: "#22C55E",
    icon: "📈",
    permissions: [
      "dashboard.view", "dashboard.sales",
      "chat.scoped",
      "items.view",
      "outstanding.receivables",
      "reports.sales",
      "sales.view",
      "entries.view", "entries.draft",
    ],
    homeTab: "sales",
  },
  "field-sales": {
    name: "Field Sales",
    description: "On-ground team. Drafts sales invoices + receipts from their assigned customers only. No approvals.",
    color: "var(--green)",
    badgeColor: "#16A34A",
    icon: "🚗",
    permissions: [
      "dashboard.view",
      "chat.scoped",
      "items.view",
      "outstanding.receivables",
      "sales.view",
      "entries.view", "entries.draft", "entries.upload",
    ],
    homeTab: "entries",
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
      "entries.view",
    ],
    homeTab: "dashboard",
  },
};

export const ROLE_LIST: Role[] = [
  "admin",
  "accounts-head",
  "accounts",
  "junior-accounts",
  "manager",
  "sales",
  "field-sales",
  "viewer",
];

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
  entries: "entries.view",
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
    role: "field-sales",
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
    role: "accounts-head",
    status: "active",
    invitedBy: "Yogesh Patel",
    invitedAt: "8 Jan 2025",
    lastActive: "4 hours ago",
    avatar: "S",
  },
  {
    id: "u6",
    name: "Nikhil Kumar",
    email: "nikhil@bandrasoap.in",
    phone: "+91 98765 22113",
    role: "accounts",
    status: "active",
    invitedBy: "Sunil Shah",
    invitedAt: "4 Apr 2025",
    lastActive: "25 min ago",
    avatar: "N",
  },
  {
    id: "u7",
    name: "Kavya Iyer",
    email: "kavya@bandrasoap.in",
    phone: "+91 98765 66770",
    role: "junior-accounts",
    status: "active",
    invitedBy: "Sunil Shah",
    invitedAt: "18 Sep 2025",
    lastActive: "5 min ago",
    avatar: "K",
  },
  {
    id: "u8",
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
    id: "u9",
    name: "Vikram Joshi",
    email: "vikram@bandrasoap.in",
    phone: "+91 98765 44556",
    role: "field-sales",
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
  { id: "a3", actor: "Sunil Shah", action: "Approved purchase voucher", target: "Patel Traders · ₹1.18L", at: "3 hours ago", role: "accounts-head" as Role },
  { id: "a4", actor: "Kavya Iyer", action: "OCR'd bill", target: "Shiprocket · ₹32,100", at: "4 hours ago", role: "junior-accounts" as Role },
  { id: "a5", actor: "Anjali Desai", action: "Sent WhatsApp reminder", target: "Paytm (One97)", at: "5 hours ago", role: "field-sales" as Role },
  { id: "a6", actor: "CA Rajesh Sharma", action: "Viewed Balance Sheet", target: "FY 2024-25", at: "Yesterday", role: "viewer" as Role },
];
