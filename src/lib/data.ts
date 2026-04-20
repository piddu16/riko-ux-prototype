// Bandra Soap Pvt Ltd — Real financial data from Supabase
export const COMPANY = {
  name: "Bandra Soap Pvt Ltd",
  shortName: "Bandra Soap",
  id: 31,
  industry: "D2C Skincare",
  fy: "FY 2024-25",
  tag: "D2C",
};

export const R = {
  rev: 92523799.82,
  cogs: 16149566.25,
  gp: 76374233.57,
  indExp: 99822194.91,
  ebit: -21626613.55,
  tax: 746830.34,
  netPL: -22373443.89,
  interest: 4139254,
  ebitda: -17447190.92,
  ful: 7544904.66,
  orc: 2431340.41,
  cac: 16178033.01,
  mkt: 23229388.83,
  emp: 17662822.75,
  ovh: 23959711.22,
  cash: 559740.07,
  debtors: 867461.15,
  stkO: 1682164.24,
  stkC: 7696660.63,
  cred: 3427107.48,
  prov: 166727.82,
  unsec: 5816355.66,
  sCap: 1000000,
  res: 17868514.06,
  ms: [1677132, 1299457, 1107495, 784452, 552102, 427548, 410892, 456291, 466020, 1175899, 416726, 360930],
  fy24: 20130027.95,
  gstDr: 10789269.72,
  gstCr: 10328648.72,
};

const eq = R.sCap + R.res;
const avgI = (R.stkO + R.stkC) / 2;
const ca = R.cash + R.debtors + R.stkC + 38100 + 85434 + 75000 + 3476 + 746830 + 460621;
const cl = R.cred + R.prov;
const fy25 = R.ms.reduce((a, b) => a + b, 0);

export const K = {
  gm: (R.gp / R.rev) * 100,
  cr: ca / cl,
  qr: (ca - R.stkC) / cl,
  de: R.unsec / eq,
  dso: (R.debtors / R.rev) * 365,
  dpo: (R.cred / R.cogs) * 365,
  dio: (avgI / R.cogs) * 365,
  burn: Math.abs(R.netPL) / 12,
  yoy: ((fy25 / R.fy24) - 1) * 100,
  itcEx: R.gstDr - R.gstCr,
  opexR: (R.indExp / R.rev) * 100,
  ccc: 0,
  ca,
  cl,
};
K.ccc = K.dso + K.dio - K.dpo;

export const MONTHS = ["Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec", "Jan", "Feb", "Mar"];

export const fL = (v: number) => (Math.abs(v) / 1e5).toFixed(1);
export const fCr = (v: number) => (Math.abs(v) / 1e7).toFixed(2);

/**
 * Unified Indian currency formatter.
 * Automatically picks lakhs (L) or crores (Cr) based on magnitude.
 * Use this everywhere for consistency — avoids mixing ₹92.52M, ₹9,25,23,800, ₹0.93Cr.
 *
 * Examples:
 *   formatINR(559740)      → "₹5.6L"
 *   formatINR(92523799)    → "₹9.25Cr"
 *   formatINR(12450)       → "₹12,450"
 *   formatINR(-17447190)   → "-₹1.74Cr"
 *   formatINR(1234, {raw:true}) → "₹1,234" (forces Indian notation, no L/Cr)
 */
export function formatINR(
  v: number,
  opts: { raw?: boolean; precision?: number; showSign?: boolean } = {}
): string {
  const { raw = false, precision, showSign = false } = opts;
  const sign = v < 0 ? "-" : showSign && v > 0 ? "+" : "";
  const abs = Math.abs(v);

  if (raw || abs < 1e5) {
    return `${sign}₹${abs.toLocaleString("en-IN", { maximumFractionDigits: 0 })}`;
  }

  if (abs < 1e7) {
    const p = precision ?? (abs < 1e6 ? 1 : 1);
    return `${sign}₹${(abs / 1e5).toFixed(p)}L`;
  }

  const p = precision ?? 2;
  return `${sign}₹${(abs / 1e7).toFixed(p)}Cr`;
}

/** Shortcut: compact lakhs/crores badge without ₹ prefix (for places where ₹ is separate) */
export function compactINR(v: number): string {
  const abs = Math.abs(v);
  const sign = v < 0 ? "-" : "";
  if (abs < 1e5) return `${sign}${abs.toLocaleString("en-IN", { maximumFractionDigits: 0 })}`;
  if (abs < 1e7) return `${sign}${(abs / 1e5).toFixed(1)}L`;
  return `${sign}${(abs / 1e7).toFixed(2)}Cr`;
}

export const RECEIVABLES = [
  { name: "Nykaa E-Retail Pvt Ltd", amount: 1261337, days: 2195, bills: 298, priority: "P1" },
  { name: "Website Debtors", amount: 1251122, days: 1431, bills: 548, priority: "P1" },
  { name: "LLC Olimpiya", amount: 449626, days: 1107, bills: 1, priority: "P2" },
  { name: "One97 Communications (Paytm)", amount: 355000, days: 2132, bills: 180, priority: "P1" },
  { name: "Prodsol Biotech Pvt Ltd", amount: 289756, days: 1593, bills: 17, priority: "P3" },
  { name: "Nykaa E-Retail (2)", amount: 306667, days: 2132, bills: 60, priority: "P2" },
  { name: "Scale Global Debtors", amount: 270334, days: 1078, bills: 9, priority: "P3" },
  { name: "Buy More (Counfreedise)", amount: 257865, days: 954, bills: 63, priority: "P3" },
  { name: "NYKAA Mumbai 2", amount: 292810, days: 2132, bills: 35, priority: "P2" },
  { name: "Bigfoot/Shiprocket", amount: 177730, days: 2166, bills: 173, priority: "P3" },
];

export const DAYBOOK = [
  { date: "30 Apr 2025", invoice: 1, type: "Purchase", name: "Amazon - Creations", amount: 95086 },
  { date: "30 Apr 2025", invoice: 3, type: "Purchase", name: "Amazon - Creations", amount: 19821 },
  { date: "30 Apr 2025", invoice: 5, type: "Purchase", name: "Amazon - Creations", amount: 108621 },
  { date: "30 Apr 2025", invoice: 7, type: "Purchase", name: "Amazon - Creations", amount: 228186 },
  { date: "30 Apr 2025", invoice: 9, type: "Purchase", name: "Amazon - Creations", amount: 86047 },
  { date: "30 Apr 2025", invoice: 10, type: "Purchase", name: "GOOGLE INDIA PVT LTD", amount: 163988 },
  { date: "30 Apr 2025", invoice: 12, type: "Purchase", name: "GOOGLE INDIA PVT LTD", amount: 17148 },
  { date: "30 Apr 2025", invoice: 15, type: "Sales", name: "Website D2C", amount: 342100 },
  { date: "30 Apr 2025", invoice: 16, type: "Sales", name: "Nykaa Marketplace", amount: 198500 },
  { date: "30 Apr 2025", invoice: 17, type: "Receipt", name: "Nykaa E-Retail", amount: 125000 },
  { date: "29 Apr 2025", invoice: 18, type: "Sales", name: "Amazon Seller", amount: 87200 },
  { date: "29 Apr 2025", invoice: 19, type: "Purchase", name: "Raw Material Supplier", amount: 45600 },
  { date: "29 Apr 2025", invoice: 20, type: "Payment", name: "Shiprocket Logistics", amount: 32100 },
  { date: "29 Apr 2025", invoice: 21, type: "Journal", name: "Depreciation Entry", amount: 3400 },
  { date: "28 Apr 2025", invoice: 22, type: "Sales", name: "Flipkart Marketplace", amount: 156800 },
  { date: "28 Apr 2025", invoice: 23, type: "Receipt", name: "Paytm Settlement", amount: 89000 },
];

export const INVENTORY = [
  { name: "100 Gm Riko Jar", sku: "SKU-001", qty: 12042, value: 892100, reorder: 85, status: "ok" },
  { name: "100 Gm Riko Jar Cap", sku: "SKU-002", qty: 0, value: 0, reorder: 0, status: "out" },
  { name: "100 Gm Riko Jar - SF", sku: "SKU-003", qty: 4168, value: 0, reorder: 0, status: "ok" },
  { name: "100 GM BROWN GLASS JAR WITH CAP & LID CHINA", sku: "SKU-004", qty: 0, value: 0, reorder: 0, status: "out" },
  { name: "100 GM CHINA SURAH K TOAN PASTE TUBE", sku: "SKU-005", qty: 0, value: 0, reorder: 0, status: "out" },
  { name: "150 Gm Riko Jar New Tube", sku: "SKU-006", qty: 8520, value: 1245000, reorder: 92, status: "ok" },
  { name: "Niacinamide Serum 30ml", sku: "SKU-007", qty: 3200, value: 480000, reorder: 78, status: "low" },
  { name: "Vitamin C Face Wash 100ml", sku: "SKU-008", qty: 5600, value: 672000, reorder: 88, status: "ok" },
  { name: "Retinol Night Cream 50g", sku: "SKU-009", qty: 1200, value: 360000, reorder: 45, status: "low" },
  { name: "Sunscreen SPF50 60ml", sku: "SKU-010", qty: 7800, value: 936000, reorder: 95, status: "ok" },
];

export const HEALTH_SCORES = [
  { label: "Profitability", score: 85, color: "var(--green)" },
  { label: "Liquidity", score: 62, color: "var(--yellow)" },
  { label: "Efficiency", score: 35, color: "var(--red)" },
  { label: "Growth", score: 15, color: "var(--red)" },
];

export const ALERTS = [
  { type: "danger", icon: "🔴", message: `Net Loss ₹${fL(Math.abs(R.netPL))}L — burn ₹${fL(K.burn)}L/mo` },
  { type: "warning", icon: "🟡", message: `Cash runway: ${(R.cash / K.burn).toFixed(1)} months` },
  { type: "warning", icon: "🟡", message: `Revenue down ${Math.abs(K.yoy).toFixed(0)}% YoY` },
  { type: "info", icon: "🔵", message: `₹${fL(K.itcEx)}L excess GST ITC` },
];

export const WATERFALL = [
  { label: "Revenue", value: R.rev, color: "var(--green)", bold: true },
  { label: "(-) COGS", value: -R.cogs, color: "var(--text-3)", bold: false },
  { label: "= Gross Profit", value: R.gp, color: "var(--green)", bold: true },
  { label: "(-) Fulfilment", value: -R.ful, color: "var(--text-4)", bold: false },
  { label: "(-) ORC", value: -R.orc, color: "var(--text-4)", bold: false },
  { label: "(-) CAC", value: -R.cac, color: "var(--orange)", bold: false },
  { label: "(-) Marketing", value: -R.mkt, color: "var(--red)", bold: false },
  { label: "(-) Employees", value: -R.emp, color: "var(--text-4)", bold: false },
  { label: "(-) Overheads", value: -R.ovh, color: "var(--text-4)", bold: false },
  { label: "(-) Finance", value: -R.interest, color: "var(--text-4)", bold: false },
  { label: "= EBITDA", value: R.ebitda, color: "var(--red)", bold: true },
];

export const CHAT_PROMPTS = [
  { icon: "💸", query: `Why am I losing ₹${fL(K.burn)}L every month?` },
  { icon: "📊", query: "Calculate my current ratio" },
  { icon: "🔄", query: "Where is my cash stuck?" },
  { icon: "📈", query: `Revenue trend this year` },
  { icon: "🏛️", query: `₹${fL(K.itcEx)}L excess ITC — how to claim?` },
  { icon: "📋", query: "Generate board-ready summary" },
];

/* ============================================================
   CA MODE — Multi-client portfolio (NXTLVL & Associates)
   ============================================================ */
export const CA_FIRM = {
  name: "NXTLVL & Associates",
  registrationNo: "FRN 012345W",
  principal: "CA Rajesh Sharma",
  clientCount: 18,
  address: "812 Lodha Supremus, Mumbai 400013",
  panelSize: "Mid-sized · 6 team members",
};

/** Firm-level metrics for the "This month" snapshot hero. */
export const CA_FIRM_METRICS_THIS_MONTH = {
  hoursLogged: 187,
  hoursLoggedLastMonth: 164,
  billed: 2_85_000, // ₹
  billedLastMonth: 2_40_000,
  collected: 2_10_000,
  collectedLastMonth: 2_28_000,
  misDelivered: 9,
  misTotal: 18,
  gstFiled: 12,
  gstTotal: 18,
  tdsFiled: 14,
  tdsTotal: 18,
  filingStreakDays: 47, // days without a missed deadline
};

export type ClientStatus = "critical" | "warning" | "healthy";
export type ComplianceGrade = "A+" | "A" | "B" | "C" | "D";
export type ChurnRisk = "none" | "low" | "medium" | "high";
export type ClientOnboardStatus = "active" | "kyc-pending" | "sync-setup" | "first-mis-pending";

export interface ClientNextAction {
  verb: string;       // "File" / "Call" / "Review" / "Escalate" / "Remind"
  detail: string;     // "GSTR-3B for Bandra Soap"
  deadline?: string;  // ISO date
  priority: "urgent" | "high" | "medium";
}

export interface Client {
  id: number;
  name: string;
  industry: string;
  industryGroup: "Manufacturing" | "Retail" | "D2C" | "Services" | "FMCG" | "Trading" | "Healthcare" | "Food" | "Other";
  location: string;
  revenue: string;
  revenueValue: number;        // numeric for sorting
  revenueYoY: number;          // delta fraction: 0.12 = +12%, -0.18 = -18%
  revenueTrend: number[];      // 12-month rev series (normalised 0–100 for sparkline)
  netPL: string;
  healthScore: number;
  status: ClientStatus;
  complianceScore: number;     // 0–100
  complianceGrade: ComplianceGrade;
  issues: string[];
  nextAction: ClientNextAction;
  misStatus: "Pending" | "In progress" | "Delivered";
  lastSync: string;
  lastSyncVouchers: number;    // how many new vouchers since last sync
  ownerLastLogin: string;      // "2d ago", "6w ago"
  contact: string;
  gstin?: string;
  assignedTo: string;          // team member id
  tags: string[];              // ["Priority", "FY26", "Referred"]
  monthlyHours: number;        // hrs logged this month
  monthlyBilled: number;       // ₹ billed this month
  /** Per-filing coverage this month. Only surfaces filings Riko
   *  actually supports via API — GST (GSTR-1 / 2B / 3B / 9), TDS,
   *  bank recon. State taxes, FSSAI, e-way bills, etc. are
   *  explicitly out of scope for automated coverage. */
  complianceCoverage: {
    gstr1: boolean;
    gstr3b: boolean;
    tds: boolean;
    bankRecon: boolean;  // Bank reconciliation done for the month
  };
  churnRisk: ChurnRisk;
  onboarding?: ClientOnboardStatus;
  notes?: string[];
}

/* ── 18-client portfolio — full shape ── */
export const CLIENTS: Client[] = [
  {
    id: 31, name: "Bandra Soap Pvt Ltd", industry: "D2C Skincare", industryGroup: "D2C",
    location: "Mumbai", revenue: "9.25Cr", revenueValue: 9.25e7, revenueYoY: -0.18,
    revenueTrend: [68, 72, 78, 82, 76, 70, 66, 62, 58, 54, 50, 48],
    netPL: "-2.24Cr", healthScore: 48, status: "critical", complianceScore: 62, complianceGrade: "C",
    issues: ["Runway 0.3mo", "GSTR-3B for March overdue (1d)", "₹4.6L excess ITC"],
    nextAction: { verb: "Call", detail: "Yogesh re: runway + overdue GSTR-3B", deadline: "2026-04-22", priority: "urgent" },
    misStatus: "Pending", lastSync: "2h ago", lastSyncVouchers: 48, ownerLastLogin: "Today",
    contact: "+91 98765 43210", gstin: "27AABCB1234F1Z5",
    assignedTo: "u-rajesh", tags: ["Priority", "FY25 close"],
    monthlyHours: 18.5, monthlyBilled: 42000,
    complianceCoverage: { gstr1: true, gstr3b: false, tds: false, bankRecon: false },
    churnRisk: "low",
  },
  {
    id: 91, name: "Surat Textiles Pvt Ltd", industry: "Manufacturing · Surat", industryGroup: "Manufacturing",
    location: "Surat", revenue: "18.4Cr", revenueValue: 18.4e7, revenueYoY: -0.08,
    revenueTrend: [95, 98, 92, 88, 85, 82, 78, 75, 72, 68, 62, 58],
    netPL: "-1.12Cr", healthScore: 54, status: "critical", complianceScore: 58, complianceGrade: "C",
    issues: ["Burn rate ₹24L/mo", "GSTR-1 for March overdue (10d)"],
    nextAction: { verb: "File", detail: "GSTR-1 for March · 10 days overdue", deadline: "2026-04-11", priority: "urgent" },
    misStatus: "Pending", lastSync: "4h ago", lastSyncVouchers: 112, ownerLastLogin: "3d ago",
    contact: "+91 98765 99001", gstin: "24AABCS5678G1Z2",
    assignedTo: "u-priya", tags: ["FY25 close"],
    monthlyHours: 22.0, monthlyBilled: 48000,
    complianceCoverage: { gstr1: false, gstr3b: true, tds: true, bankRecon: false },
    churnRisk: "medium",
  },
  {
    id: 42, name: "Kothari Traders", industry: "Retail · Ahmedabad", industryGroup: "Retail",
    location: "Ahmedabad", revenue: "4.12Cr", revenueValue: 4.12e7, revenueYoY: 0.11,
    revenueTrend: [62, 64, 66, 68, 72, 70, 74, 72, 76, 78, 80, 82],
    netPL: "+38.2L", healthScore: 76, status: "warning", complianceScore: 84, complianceGrade: "A",
    issues: ["MIS due in 3 days", "TDS payment pending"],
    nextAction: { verb: "Draft", detail: "MIS report for March", deadline: "2026-04-23", priority: "high" },
    misStatus: "In progress", lastSync: "5h ago", lastSyncVouchers: 21, ownerLastLogin: "1d ago",
    contact: "+91 98765 11223", gstin: "24AAACK2345H1Z7",
    assignedTo: "u-rajesh", tags: [],
    monthlyHours: 12.5, monthlyBilled: 28000,
    complianceCoverage: { gstr1: true, gstr3b: true, tds: false, bankRecon: true },
    churnRisk: "none",
  },
  {
    id: 63, name: "Mumbai Distributors", industry: "FMCG · Mumbai", industryGroup: "FMCG",
    location: "Mumbai", revenue: "7.65Cr", revenueValue: 7.65e7, revenueYoY: 0.06,
    revenueTrend: [70, 72, 74, 72, 76, 78, 76, 80, 78, 82, 80, 84],
    netPL: "+52.3L", healthScore: 71, status: "warning", complianceScore: 78, complianceGrade: "B",
    issues: ["Advance Tax Q4 due Apr 15", "High debtor days (67)"],
    nextAction: { verb: "Pay", detail: "Advance Tax Q4 (3 days left)", deadline: "2026-04-23", priority: "high" },
    misStatus: "Pending", lastSync: "3h ago", lastSyncVouchers: 34, ownerLastLogin: "Today",
    contact: "+91 98765 55667", gstin: "27AABCM9876L1Z1",
    assignedTo: "u-vikram", tags: ["Priority"],
    monthlyHours: 15.0, monthlyBilled: 32000,
    complianceCoverage: { gstr1: true, gstr3b: true, tds: true, bankRecon: false },
    churnRisk: "none",
  },
  {
    id: 57, name: "Patel Industries", industry: "Manufacturing · Pune", industryGroup: "Manufacturing",
    location: "Pune", revenue: "12.8Cr", revenueValue: 12.8e7, revenueYoY: 0.15,
    revenueTrend: [78, 80, 82, 84, 86, 88, 86, 90, 88, 92, 94, 96],
    netPL: "+1.42Cr", healthScore: 88, status: "healthy", complianceScore: 94, complianceGrade: "A+",
    issues: [],
    nextAction: { verb: "Review", detail: "Q4 board deck with owner", priority: "medium" },
    misStatus: "Delivered", lastSync: "1h ago", lastSyncVouchers: 17, ownerLastLogin: "Today",
    contact: "+91 98765 33445", gstin: "27AABCP4455K1Z3",
    assignedTo: "u-priya", tags: ["Priority"],
    monthlyHours: 14.0, monthlyBilled: 38000,
    complianceCoverage: { gstr1: true, gstr3b: true, tds: true, bankRecon: true },
    churnRisk: "none",
  },
  {
    id: 78, name: "Sai Enterprises", industry: "Services · Bangalore", industryGroup: "Services",
    location: "Bangalore", revenue: "2.34Cr", revenueValue: 2.34e7, revenueYoY: 0.22,
    revenueTrend: [55, 58, 62, 66, 70, 74, 76, 80, 82, 86, 88, 90],
    netPL: "+18.7L", healthScore: 82, status: "healthy", complianceScore: 90, complianceGrade: "A+",
    issues: [],
    nextAction: { verb: "Review", detail: "FY25 closing P&L with owner", deadline: "2026-04-30", priority: "medium" },
    misStatus: "Delivered", lastSync: "30m ago", lastSyncVouchers: 8, ownerLastLogin: "Today",
    contact: "+91 98765 77889", gstin: "29AABCS2222B1Z5",
    assignedTo: "u-vikram", tags: ["Growth"],
    monthlyHours: 8.0, monthlyBilled: 18000,
    complianceCoverage: { gstr1: true, gstr3b: true, tds: true, bankRecon: true },
    churnRisk: "none",
  },
  {
    id: 102, name: "Krishna Foods Pvt Ltd", industry: "Food · Mumbai", industryGroup: "Food",
    location: "Mumbai", revenue: "6.82Cr", revenueValue: 6.82e7, revenueYoY: 0.04,
    revenueTrend: [72, 74, 72, 76, 74, 78, 76, 80, 78, 82, 80, 84],
    netPL: "+28.4L", healthScore: 74, status: "warning", complianceScore: 80, complianceGrade: "A",
    issues: ["GSTR-3B for March overdue (1d)", "Bank recon pending for March"],
    nextAction: { verb: "File", detail: "GSTR-3B for March · overdue", deadline: "2026-04-20", priority: "urgent" },
    misStatus: "In progress", lastSync: "6h ago", lastSyncVouchers: 22, ownerLastLogin: "2d ago",
    contact: "+91 98765 88220", gstin: "27AABCK3456F1Z9",
    assignedTo: "u-rajesh", tags: [],
    monthlyHours: 11.0, monthlyBilled: 26000,
    complianceCoverage: { gstr1: true, gstr3b: false, tds: true, bankRecon: true },
    churnRisk: "none",
  },
  {
    id: 115, name: "Gupta Hardware Co", industry: "Trading · Delhi", industryGroup: "Trading",
    location: "Delhi", revenue: "5.48Cr", revenueValue: 5.48e7, revenueYoY: -0.03,
    revenueTrend: [80, 78, 76, 74, 76, 72, 70, 68, 72, 70, 68, 66],
    netPL: "+12.8L", healthScore: 68, status: "warning", complianceScore: 72, complianceGrade: "B",
    issues: ["Mar GSTR-2B mismatch ₹1.8L unresolved", "Stock write-off pending"],
    nextAction: { verb: "Reconcile", detail: "Mar GSTR-2B mismatch before May cycle", deadline: "2026-05-14", priority: "high" },
    misStatus: "Pending", lastSync: "8h ago", lastSyncVouchers: 15, ownerLastLogin: "5d ago",
    contact: "+91 98765 22001", gstin: "07AABCG4567M1Z1",
    assignedTo: "u-priya", tags: [],
    monthlyHours: 9.5, monthlyBilled: 22000,
    complianceCoverage: { gstr1: true, gstr3b: false, tds: false, bankRecon: false },
    churnRisk: "low",
  },
  {
    id: 128, name: "Reliance Retail - Bandra", industry: "Retail · Mumbai", industryGroup: "Retail",
    location: "Mumbai", revenue: "24.6Cr", revenueValue: 24.6e7, revenueYoY: 0.09,
    revenueTrend: [82, 84, 85, 86, 88, 88, 90, 92, 90, 94, 92, 96],
    netPL: "+1.88Cr", healthScore: 86, status: "healthy", complianceScore: 92, complianceGrade: "A+",
    issues: [],
    nextAction: { verb: "Finalize", detail: "FY25 closing entries + P&L", deadline: "2026-04-30", priority: "medium" },
    misStatus: "Delivered", lastSync: "45m ago", lastSyncVouchers: 142, ownerLastLogin: "Today",
    contact: "+91 98765 11111", gstin: "27AABCR5432L1Z4",
    assignedTo: "u-rajesh", tags: ["Priority", "FY25 close"],
    monthlyHours: 28.0, monthlyBilled: 75000,
    complianceCoverage: { gstr1: true, gstr3b: true, tds: true, bankRecon: true },
    churnRisk: "none",
  },
  {
    id: 141, name: "Joshi Pharma Traders", industry: "Healthcare · Pune", industryGroup: "Healthcare",
    location: "Pune", revenue: "3.88Cr", revenueValue: 3.88e7, revenueYoY: 0.18,
    revenueTrend: [60, 62, 64, 68, 70, 72, 76, 78, 82, 84, 86, 88],
    netPL: "+42.1L", healthScore: 79, status: "warning", complianceScore: 86, complianceGrade: "A",
    issues: ["Debtors aging 60d+"],
    nextAction: { verb: "Review", detail: "Debtors aging & collection plan", deadline: "2026-04-28", priority: "medium" },
    misStatus: "Delivered", lastSync: "2h ago", lastSyncVouchers: 31, ownerLastLogin: "1d ago",
    contact: "+91 98765 33311", gstin: "27AABCJ6789N1Z2",
    assignedTo: "u-priya", tags: ["Growth"],
    monthlyHours: 10.5, monthlyBilled: 24000,
    complianceCoverage: { gstr1: true, gstr3b: true, tds: true, bankRecon: false },
    churnRisk: "none",
  },
  {
    id: 155, name: "Sri Balaji Exports", industry: "Trading · Chennai", industryGroup: "Trading",
    location: "Chennai", revenue: "11.2Cr", revenueValue: 11.2e7, revenueYoY: 0.21,
    revenueTrend: [65, 68, 72, 74, 78, 82, 84, 86, 88, 92, 94, 98],
    netPL: "+88.6L", healthScore: 81, status: "healthy", complianceScore: 88, complianceGrade: "A",
    issues: [],
    nextAction: { verb: "Review", detail: "FY25 draft with owner", deadline: "2026-04-28", priority: "medium" },
    misStatus: "In progress", lastSync: "1h ago", lastSyncVouchers: 45, ownerLastLogin: "Today",
    contact: "+91 98765 66522", gstin: "33AABCS9876P1Z8",
    assignedTo: "u-vikram", tags: ["Growth"],
    monthlyHours: 13.0, monthlyBilled: 34000,
    complianceCoverage: { gstr1: true, gstr3b: true, tds: true, bankRecon: true },
    churnRisk: "none",
  },
  {
    id: 167, name: "Agarwal Tractors LLP", industry: "Manufacturing · Indore", industryGroup: "Manufacturing",
    location: "Indore", revenue: "14.5Cr", revenueValue: 14.5e7, revenueYoY: -0.12,
    revenueTrend: [88, 86, 84, 82, 80, 78, 76, 74, 72, 70, 68, 66],
    netPL: "-48.2L", healthScore: 58, status: "critical", complianceScore: 68, complianceGrade: "B",
    issues: ["Debtors 95d+", "Advance Tax shortfall"],
    nextAction: { verb: "Escalate", detail: "Advance Tax shortfall to owner", deadline: "2026-04-24", priority: "urgent" },
    misStatus: "Pending", lastSync: "12h ago", lastSyncVouchers: 58, ownerLastLogin: "6d ago",
    contact: "+91 98765 40403", gstin: "23AABCA1122Q1Z9",
    assignedTo: "u-rajesh", tags: ["FY25 close"],
    monthlyHours: 16.0, monthlyBilled: 38000,
    complianceCoverage: { gstr1: true, gstr3b: true, tds: false, bankRecon: false },
    churnRisk: "medium",
  },
  {
    id: 182, name: "Green Leaf Organics", industry: "D2C · Bangalore", industryGroup: "D2C",
    location: "Bangalore", revenue: "1.64Cr", revenueValue: 1.64e7, revenueYoY: 0.35,
    revenueTrend: [40, 44, 48, 52, 58, 62, 66, 70, 74, 78, 82, 86],
    netPL: "+4.2L", healthScore: 72, status: "warning", complianceScore: 82, complianceGrade: "A",
    issues: ["New SKU batch pending valuation"],
    nextAction: { verb: "Value", detail: "New SKU batch (36 items)", priority: "medium" },
    misStatus: "Delivered", lastSync: "15m ago", lastSyncVouchers: 12, ownerLastLogin: "Today",
    contact: "+91 98765 70707", gstin: "29AABCG7788R1Z3",
    assignedTo: "u-vikram", tags: ["Growth", "FY26"],
    monthlyHours: 7.0, monthlyBilled: 16000,
    complianceCoverage: { gstr1: true, gstr3b: true, tds: true, bankRecon: true },
    churnRisk: "none",
    onboarding: "active",
  },
  {
    id: 196, name: "Arora Logistics Pvt Ltd", industry: "Services · Gurgaon", industryGroup: "Services",
    location: "Gurgaon", revenue: "8.9Cr", revenueValue: 8.9e7, revenueYoY: 0.07,
    revenueTrend: [75, 76, 78, 76, 80, 78, 82, 80, 84, 82, 86, 84],
    netPL: "+62.4L", healthScore: 75, status: "warning", complianceScore: 80, complianceGrade: "A",
    issues: ["Vendor advance ₹2.1L un-adjusted"],
    nextAction: { verb: "Adjust", detail: "Vendor advance ₹2.1L entry", priority: "medium" },
    misStatus: "In progress", lastSync: "4h ago", lastSyncVouchers: 38, ownerLastLogin: "2d ago",
    contact: "+91 98765 88877", gstin: "06AABCA3344S1Z5",
    assignedTo: "u-priya", tags: [],
    monthlyHours: 11.5, monthlyBilled: 27000,
    complianceCoverage: { gstr1: true, gstr3b: true, tds: true, bankRecon: false },
    churnRisk: "none",
  },
  {
    id: 208, name: "Mehta Jewels & Co", industry: "Retail · Jaipur", industryGroup: "Retail",
    location: "Jaipur", revenue: "6.3Cr", revenueValue: 6.3e7, revenueYoY: -0.02,
    revenueTrend: [78, 76, 74, 76, 74, 72, 74, 72, 70, 72, 70, 68],
    netPL: "+22.8L", healthScore: 69, status: "warning", complianceScore: 74, complianceGrade: "B",
    issues: ["GSTR-3B for March overdue (1d)", "Closing stock valuation pending"],
    nextAction: { verb: "File", detail: "GSTR-3B for March · overdue", deadline: "2026-04-20", priority: "urgent" },
    misStatus: "Pending", lastSync: "7h ago", lastSyncVouchers: 19, ownerLastLogin: "4d ago",
    contact: "+91 98765 55544", gstin: "08AABCM5566T1Z8",
    assignedTo: "u-rajesh", tags: [],
    monthlyHours: 9.0, monthlyBilled: 21000,
    complianceCoverage: { gstr1: true, gstr3b: false, tds: false, bankRecon: true },
    churnRisk: "low",
  },
  {
    id: 221, name: "Nexus Electronics Pvt Ltd", industry: "Trading · Hyderabad", industryGroup: "Trading",
    location: "Hyderabad", revenue: "16.8Cr", revenueValue: 16.8e7, revenueYoY: 0.14,
    revenueTrend: [72, 74, 76, 78, 80, 82, 84, 86, 88, 90, 92, 94],
    netPL: "+1.12Cr", healthScore: 84, status: "healthy", complianceScore: 90, complianceGrade: "A+",
    issues: [],
    nextAction: { verb: "File", detail: "GSTR-9 annual return prep", deadline: "2026-05-15", priority: "medium" },
    misStatus: "Delivered", lastSync: "1h ago", lastSyncVouchers: 52, ownerLastLogin: "Today",
    contact: "+91 98765 99988", gstin: "36AABCN7788U1Z2",
    assignedTo: "u-priya", tags: ["Priority"],
    monthlyHours: 15.5, monthlyBilled: 42000,
    complianceCoverage: { gstr1: true, gstr3b: true, tds: true, bankRecon: true },
    churnRisk: "none",
  },
  {
    id: 234, name: "Bhatia Exports", industry: "Trading · Ludhiana", industryGroup: "Trading",
    location: "Ludhiana", revenue: "4.9Cr", revenueValue: 4.9e7, revenueYoY: -0.24,
    revenueTrend: [90, 88, 84, 80, 76, 72, 68, 64, 60, 56, 52, 48],
    netPL: "-18.4L", healthScore: 52, status: "critical", complianceScore: 56, complianceGrade: "D",
    issues: ["Sync stopped 18d ago", "3 unfiled returns", "Owner unreachable"],
    nextAction: { verb: "Escalate", detail: "Sync stopped 18d — contact owner", priority: "urgent" },
    misStatus: "Pending", lastSync: "18d ago", lastSyncVouchers: 0, ownerLastLogin: "6w ago",
    contact: "+91 98765 11100", gstin: "03AABCB8899V1Z6",
    assignedTo: "u-vikram", tags: ["FY25 close"],
    monthlyHours: 3.0, monthlyBilled: 8000,
    complianceCoverage: { gstr1: false, gstr3b: false, tds: false, bankRecon: false },
    churnRisk: "high",
  },
  {
    id: 247, name: "Om Infra Builders", industry: "Services · Ahmedabad", industryGroup: "Services",
    location: "Ahmedabad", revenue: "0.0Cr", revenueValue: 0, revenueYoY: 0,
    revenueTrend: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
    netPL: "+0", healthScore: 0, status: "warning", complianceScore: 0, complianceGrade: "C",
    issues: ["Onboarding — Tally sync not set up"],
    nextAction: { verb: "Onboard", detail: "Tally sync setup call", deadline: "2026-04-28", priority: "high" },
    misStatus: "Pending", lastSync: "Never", lastSyncVouchers: 0, ownerLastLogin: "Never",
    contact: "+91 98765 22233", gstin: "24AABCO9900W1Z9",
    assignedTo: "u-rajesh", tags: ["Onboarding", "FY26"],
    monthlyHours: 2.0, monthlyBilled: 0,
    complianceCoverage: { gstr1: false, gstr3b: false, tds: false, bankRecon: false },
    churnRisk: "none",
    onboarding: "sync-setup",
  },
];

/* ── CA Firm team roster ── */
export interface CaTeamMember {
  id: string;
  name: string;
  avatar: string;
  role: "partner" | "senior" | "associate" | "articled";
  color: string;
  /** Approximate hours capacity per month. */
  capacityHours: number;
}

export const CA_TEAM: CaTeamMember[] = [
  { id: "u-rajesh", name: "CA Rajesh Sharma", avatar: "R", role: "partner",    color: "var(--purple)", capacityHours: 180 },
  { id: "u-priya",  name: "CA Priya Mehta",   avatar: "P", role: "senior",     color: "var(--blue)",   capacityHours: 180 },
  { id: "u-vikram", name: "Vikram Bhatt",     avatar: "V", role: "associate",  color: "var(--green)",  capacityHours: 160 },
  { id: "u-anita",  name: "Anita Desai",      avatar: "A", role: "associate",  color: "var(--orange)", capacityHours: 160 },
  { id: "u-sameer", name: "Sameer Rao",       avatar: "S", role: "articled",   color: "var(--yellow)", capacityHours: 140 },
];

export function getTeamMember(id: string): CaTeamMember | undefined {
  return CA_TEAM.find((t) => t.id === id);
}

/** Workload breakdown per team member — derived from CLIENTS.assignedTo +
 *  monthlyHours. Powers the workload sidebar. */
export function computeWorkload() {
  return CA_TEAM.map((t) => {
    const assigned = CLIENTS.filter((c) => c.assignedTo === t.id);
    const hours = assigned.reduce((s, c) => s + c.monthlyHours, 0);
    const pending = assigned.filter((c) => c.misStatus === "Pending").length;
    const billed = assigned.reduce((s, c) => s + c.monthlyBilled, 0);
    return {
      member: t,
      clientCount: assigned.length,
      hours,
      pending,
      billed,
      utilization: hours / t.capacityHours,
    };
  });
}

/** Industry-group revenue mix for the donut. */
export function computeIndustryMix() {
  const mix = new Map<string, number>();
  for (const c of CLIENTS) {
    mix.set(c.industryGroup, (mix.get(c.industryGroup) ?? 0) + c.revenueValue);
  }
  const total = [...mix.values()].reduce((s, v) => s + v, 0);
  const groupColors: Record<string, string> = {
    Manufacturing: "var(--blue)",
    Retail: "var(--purple)",
    D2C: "var(--green)",
    Services: "var(--orange)",
    FMCG: "var(--yellow)",
    Trading: "var(--red)",
    Healthcare: "#06B6D4",
    Food: "#EC4899",
    Other: "var(--text-4)",
  };
  return [...mix.entries()]
    .map(([group, value]) => ({
      group,
      value,
      pct: value / Math.max(total, 1),
      color: groupColors[group] ?? "var(--text-4)",
    }))
    .sort((a, b) => b.value - a.value);
}

/** Compliance calendar — builds per-filing buckets for the next 21
 *  days. Each bucket lists affected clients. Drives the horizontal
 *  timeline strip at the top of Client Portfolio. */
export interface ComplianceDeadline {
  date: string;          // ISO
  dayLabel: string;      // "Mon 20"
  monthLabel: string;    // "Apr"
  items: Array<{
    filing: string;      // "GSTR-3B", "GSTR-1", "TDS Payment", etc.
    section?: string;
    clients: string[];   // client names affected
    severity: "urgent" | "soon" | "upcoming";
  }>;
}

export function computeComplianceCalendar(): ComplianceDeadline[] {
  // Only filings Riko actually automates, dated per CBIC + CBDT
  // statutory rules:
  //
  // GST monthly cycle (for April 2026 data, filed in May):
  //   • GSTR-1: due 11th of following month (CBIC Rule 59)
  //   • GSTR-2B: auto-generates 14th (ITC statement)
  //   • GSTR-2B recon window: 14th → 19th
  //   • GSTR-3B: due 20th of following month (CBIC Rule 61)
  //
  // TDS (CBDT Rules 30 + 31A):
  //   • Monthly deposit: 7th of following month
  //   • March deposit: 30 April (special)
  //   • Q4 return (24Q/26Q): 31 May
  //   • Form 16 / 16A: 15 June of AY
  //
  // Out of scope for Riko: FSSAI, e-way bills, Professional Tax,
  // engagement letters.
  const base: Array<{
    date: string;
    filing: string;
    section?: string;
    severity: "urgent" | "soon" | "upcoming";
    clientNames: string[];
  }> = [
    { date: "2026-04-22", filing: "Advance Tax recon",   section: "FY25 year-end",        severity: "urgent",   clientNames: ["Bandra Soap Pvt Ltd", "Agarwal Tractors LLP", "Mumbai Distributors"] },
    { date: "2026-04-23", filing: "MIS delivery",        section: "CA workflow · March",  severity: "urgent",   clientNames: ["Kothari Traders", "Bandra Soap Pvt Ltd", "Mumbai Distributors"] },
    { date: "2026-04-24", filing: "TDS Q4 return prep",  section: "Form 24Q/26Q",         severity: "urgent",   clientNames: ["Bandra Soap Pvt Ltd", "Surat Textiles Pvt Ltd", "Gupta Hardware Co", "Agarwal Tractors LLP"] },
    { date: "2026-04-28", filing: "FY25 closing review", section: "CA workflow",          severity: "soon",     clientNames: ["Sri Balaji Exports", "Reliance Retail - Bandra", "Sai Enterprises", "Joshi Pharma Traders"] },
    { date: "2026-04-30", filing: "TDS Payment (Mar)",   section: "CBDT Rule 30 · special March deadline", severity: "soon", clientNames: ["Bandra Soap Pvt Ltd", "Surat Textiles Pvt Ltd", "Gupta Hardware Co", "Mehta Jewels & Co", "Agarwal Tractors LLP", "Arora Logistics Pvt Ltd"] },
    { date: "2026-04-30", filing: "Bank reconciliation", section: "Month-end",            severity: "soon",     clientNames: ["Bandra Soap Pvt Ltd", "Surat Textiles Pvt Ltd", "Krishna Foods Pvt Ltd", "Gupta Hardware Co", "Agarwal Tractors LLP", "Arora Logistics Pvt Ltd"] },
    { date: "2026-05-07", filing: "TDS Payment (Apr)",   section: "CBDT Rule 30 · monthly",severity: "upcoming", clientNames: ["Bandra Soap Pvt Ltd", "Surat Textiles Pvt Ltd", "Gupta Hardware Co", "Mehta Jewels & Co"] },
    { date: "2026-05-11", filing: "GSTR-1 (Apr)",        section: "CBIC Rule 59 · file by 11th", severity: "upcoming", clientNames: ["Bandra Soap Pvt Ltd", "Surat Textiles Pvt Ltd", "Bhatia Exports", "Kothari Traders", "Krishna Foods Pvt Ltd", "Gupta Hardware Co", "Om Infra Builders"] },
    { date: "2026-05-14", filing: "GSTR-2B ITC match",   section: "2B drops — recon window 14-19", severity: "upcoming", clientNames: ["Bandra Soap Pvt Ltd", "Surat Textiles Pvt Ltd", "Krishna Foods Pvt Ltd", "Gupta Hardware Co", "Mehta Jewels & Co"] },
    { date: "2026-05-20", filing: "GSTR-3B (Apr)",       section: "CBIC Rule 61 · file by 20th", severity: "upcoming", clientNames: ["Bandra Soap Pvt Ltd", "Surat Textiles Pvt Ltd", "Krishna Foods Pvt Ltd", "Gupta Hardware Co", "Mehta Jewels & Co"] },
    { date: "2026-05-31", filing: "TDS Q4 return",       section: "Form 24Q + 26Q · CBDT Rule 31A", severity: "upcoming", clientNames: ["Bandra Soap Pvt Ltd", "Surat Textiles Pvt Ltd", "Gupta Hardware Co", "Mumbai Distributors", "Agarwal Tractors LLP"] },
    { date: "2026-06-15", filing: "Form 16 / 16A",        section: "CBDT Rule 31 · all deductees", severity: "upcoming", clientNames: ["Bandra Soap Pvt Ltd", "Surat Textiles Pvt Ltd", "Patel Industries", "Mumbai Distributors", "Nexus Electronics Pvt Ltd", "Reliance Retail - Bandra", "Arora Logistics Pvt Ltd"] },
  ];

  // Group by date
  const byDate = new Map<string, ComplianceDeadline>();
  for (const b of base) {
    if (!byDate.has(b.date)) {
      const d = new Date(b.date);
      byDate.set(b.date, {
        date: b.date,
        dayLabel: d.toLocaleDateString("en-IN", { weekday: "short", day: "numeric" }),
        monthLabel: d.toLocaleDateString("en-IN", { month: "short" }),
        items: [],
      });
    }
    byDate.get(b.date)!.items.push({
      filing: b.filing,
      section: b.section,
      clients: b.clientNames,
      severity: b.severity,
    });
  }
  return [...byDate.values()].sort((a, b) => a.date.localeCompare(b.date));
}

/** Compliance grade → color. */
export const COMPLIANCE_GRADE_COLOR: Record<ComplianceGrade, string> = {
  "A+": "var(--green)",
  "A":  "var(--green)",
  "B":  "var(--blue)",
  "C":  "var(--yellow)",
  "D":  "var(--red)",
};

/** Churn risk → color. */
export const CHURN_RISK_META: Record<ChurnRisk, { color: string; label: string }> = {
  none:   { color: "var(--green)",  label: "Stable" },
  low:    { color: "var(--blue)",   label: "Low risk" },
  medium: { color: "var(--yellow)", label: "At risk" },
  high:   { color: "var(--red)",    label: "High risk" },
};

/* ============================================================
   COMPLIANCE CALENDAR — Indian regulatory due dates
   ============================================================ */
export type ComplianceSeverity = "urgent" | "soon" | "upcoming";

export const COMPLIANCE_ITEMS = [
  { date: "10 Apr 2026", dateShort: "10 Apr", title: "TDS Payment", section: "194Q, 194J, 194C", clients: 3, amount: "₹4.82L", severity: "urgent" as ComplianceSeverity, description: "Monthly TDS deposit for March 2026" },
  { date: "13 Apr 2026", dateShort: "13 Apr", title: "GSTR-1 Filing", section: "Outward supplies", clients: 2, amount: "—", severity: "urgent" as ComplianceSeverity, description: "Bandra Soap, Surat Textiles due" },
  { date: "15 Apr 2026", dateShort: "15 Apr", title: "Advance Tax Q4", section: "Income Tax", clients: 4, amount: "₹12.3L", severity: "soon" as ComplianceSeverity, description: "100% advance tax payment for FY25" },
  { date: "18 Apr 2026", dateShort: "18 Apr", title: "CMP-08 Filing", section: "Composition scheme", clients: 1, amount: "—", severity: "soon" as ComplianceSeverity, description: "Q4 payment for composition taxpayer" },
  { date: "20 Apr 2026", dateShort: "20 Apr", title: "GSTR-3B Filing", section: "Monthly return", clients: 5, amount: "ITC ₹4.61L", severity: "soon" as ComplianceSeverity, description: "Bandra Soap ITC refund eligible" },
  { date: "30 Apr 2026", dateShort: "30 Apr", title: "Form 16 Issuance", section: "TDS certificates", clients: 6, amount: "—", severity: "upcoming" as ComplianceSeverity, description: "Employee TDS certificates for FY25" },
  { date: "15 May 2026", dateShort: "15 May", title: "TDS Return (Q4)", section: "24Q, 26Q", clients: 4, amount: "—", severity: "upcoming" as ComplianceSeverity, description: "Quarterly TDS return filing" },
  { date: "31 May 2026", dateShort: "31 May", title: "Form 24Q Filing", section: "Salary TDS", clients: 6, amount: "—", severity: "upcoming" as ComplianceSeverity, description: "Annual salary TDS return" },
];

/* ============================================================
   THIS WEEK — Action queue for founders
   ============================================================ */
export type ActionPriority = "urgent" | "high" | "medium";
export type ActionCategory = "collect" | "compliance" | "cash" | "operations" | "review";

export const THIS_WEEK_ACTIONS = [
  {
    id: "a1",
    priority: "urgent" as ActionPriority,
    category: "collect" as ActionCategory,
    icon: "📞",
    title: "Call Nykaa AR team",
    context: "₹12.6L stuck across 298 bills, 2,195 days overdue",
    cta: "View ledger",
    impact: "+₹12.6L to cash",
  },
  {
    id: "a2",
    priority: "urgent" as ActionPriority,
    category: "compliance" as ActionCategory,
    icon: "🏛️",
    title: "File GSTR-3B by 20 Apr",
    context: "₹4.61L ITC refund eligible — don't leave cash with govt",
    cta: "Generate GSTR-3B",
    impact: "+₹4.61L refund",
  },
  {
    id: "a3",
    priority: "high" as ActionPriority,
    category: "cash" as ActionCategory,
    icon: "💸",
    title: "Review Sep CAC spike",
    context: "₹6.8L spent, ₹2.1L revenue — worst ROAS of the year",
    cta: "Open investigation",
    impact: "Fix burn",
  },
  {
    id: "a4",
    priority: "high" as ActionPriority,
    category: "operations" as ActionCategory,
    icon: "📦",
    title: "Reorder Niacinamide Serum",
    context: "45 days stock left at current run-rate",
    cta: "Create PO",
    impact: "Avoid stockout",
  },
  {
    id: "a5",
    priority: "medium" as ActionPriority,
    category: "review" as ActionCategory,
    icon: "📊",
    title: "Approve March MIS for your CA",
    context: "Rajesh Sharma sent it 2 days ago",
    cta: "Review & approve",
    impact: "Close books",
  },
];

/* ============================================================
   WHATSAPP MESSAGE TEMPLATES
   ============================================================ */
export const WHATSAPP_TEMPLATES = {
  reminder: (partyName: string, amount: string, days: number) => ({
    preview: `Hi ${partyName},\n\nFriendly reminder from Bandra Soap Pvt Ltd: an invoice of ${amount} has been pending for ${days.toLocaleString("en-IN")} days.\n\nPlease share payment status at your earliest convenience.\n\nFor any questions: +91 98765 43210\n\nBest regards,\nBandra Soap team`,
    businessName: "Bandra Soap Pvt Ltd",
    sentTime: new Date().toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" }),
  }),
};

/* ============================================================
   RUNWAY PROJECTION
   ============================================================ */
export const RUNWAY = {
  currentCash: R.cash,
  monthlyBurn: K.burn,
  monthsLeft: R.cash / K.burn,
  zeroDate: (() => {
    const days = Math.floor((R.cash / K.burn) * 30);
    const target = new Date();
    target.setDate(target.getDate() + days);
    return target.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
  })(),
  daysLeft: Math.floor((R.cash / K.burn) * 30),
};

/* ============================================================
   LANGUAGE TRANSLATIONS — minimal Hindi/English pairs
   ============================================================ */
export const I18N = {
  en: {
    thisWeek: "This Week",
    actionQueue: "Priority actions for your business",
    runwayLeft: "Runway",
    daysRemaining: "days left",
    zeroCashOn: "At current burn, cash hits zero around",
    yourDashboard: "Your Dashboard",
    ask: "Ask Riko anything...",
    emptyChat: "What do you want to know?",
    sales: "Sales",
    purchases: "Purchases",
    cash: "Cash",
    overdue: "Overdue",
    healthy: "Healthy",
    critical: "Critical",
    warning: "Needs attention",
  },
  hi: {
    thisWeek: "इस हफ्ते",
    actionQueue: "आपके बिज़नेस के ज़रूरी काम",
    runwayLeft: "कैश रनवे",
    daysRemaining: "दिन बाकी",
    zeroCashOn: "इस रफ्तार से, कैश ख़त्म होगा",
    yourDashboard: "आपका डैशबोर्ड",
    ask: "Riko से कुछ भी पूछो...",
    emptyChat: "क्या जानना है?",
    sales: "बिक्री",
    purchases: "खरीदी",
    cash: "कैश",
    overdue: "बकाया",
    healthy: "ठीक",
    critical: "गंभीर",
    warning: "ध्यान दें",
  },
} as const;

export type Lang = keyof typeof I18N;

/* ============================================================
   GST AGENT — INFINI integration mock data
   ============================================================ */

export const GSTINS = [
  { id: "27AAAAB1234C1Z5", label: "Maharashtra", state: "MH", primary: true, status: "Active" },
  { id: "07AAAAB1234C1Z3", label: "Delhi", state: "DL", primary: false, status: "Active" },
  { id: "24AAAAB1234C1Z1", label: "Gujarat", state: "GJ", primary: false, status: "Suspended" },
];

export const GST_DATA_FRESHNESS = {
  gstr2b: { asOf: "14 Apr 2026", nextRefresh: "14 May 2026", type: "static", period: "March 2026" },
  gstr2a: { asOf: "2 hours ago", type: "live", period: "March 2026" },
  tallySync: { asOf: "2 hours ago", status: "healthy" },
};

export type ReconStatus = "matched" | "mismatch" | "missing_portal" | "missing_tally";

export const RECONCILIATION = {
  period: "March 2026",
  totalTallyInvoices: 147,
  totalPortalInvoices: 143,
  matched: 128,
  mismatches: 7,
  missingFromPortal: 8,
  missingFromTally: 4,
  matchedValue: 4230000, // 42.3L
  mismatchValue: 310000, // 3.1L
  itcAtRiskValue: 570000, // 5.7L
  lastRunAt: "12 Apr 2026, 11:42 AM",
  lines: [
    { id: "r1", supplier: "GOOGLE INDIA PVT LTD", gstin: "29AACCG0527D1Z8", tallyAmt: 163988, portalAmt: 163988, status: "matched" as ReconStatus, invoiceNo: "G-4412", date: "30 Mar 2026" },
    { id: "r2", supplier: "Amazon - Creations", gstin: "29AAHCA9099B1Z4", tallyAmt: 228186, portalAmt: 228186, status: "matched" as ReconStatus, invoiceNo: "AMZ-9921", date: "28 Mar 2026" },
    { id: "r3", supplier: "Shiprocket Logistics", gstin: "07AAGCS5867P1Z9", tallyAmt: 32100, portalAmt: 31500, status: "mismatch" as ReconStatus, invoiceNo: "SR-2301", date: "25 Mar 2026", issue: "Portal shows ₹31,500 vs Tally ₹32,100 — ₹600 tax diff" },
    { id: "r4", supplier: "Nykaa Mumbai 2", gstin: "27AADCN7487G1ZF", tallyAmt: 146500, portalAmt: null, status: "missing_portal" as ReconStatus, invoiceNo: "NYK-MH-1182", date: "22 Mar 2026", issue: "Supplier has not filed GSTR-1 yet" },
    { id: "r5", supplier: "Paytm (One97 Communications)", gstin: "07AAACT2727Q1ZV", tallyAmt: 89000, portalAmt: null, status: "missing_portal" as ReconStatus, invoiceNo: "PYT-2245", date: "20 Mar 2026", issue: "Supplier has not filed GSTR-1 yet" },
    { id: "r6", supplier: "Raw Material Supplier Co", gstin: "24AAACR1234P1Z2", tallyAmt: 145600, portalAmt: null, status: "missing_portal" as ReconStatus, invoiceNo: "RMS-0845", date: "18 Mar 2026", issue: "Supplier has not filed GSTR-1 yet" },
    { id: "r7", supplier: "Mumbai Packaging Ltd", gstin: "27AAACM5555P1Z2", tallyAmt: null, portalAmt: 58400, status: "missing_tally" as ReconStatus, invoiceNo: "MPL-3301", date: "15 Mar 2026", issue: "Invoice in 2B but not recorded in Tally" },
    { id: "r8", supplier: "Flipkart Marketplace", gstin: "29AACCF0123P1Z8", tallyAmt: 156800, portalAmt: 156800, status: "matched" as ReconStatus, invoiceNo: "FLP-8821", date: "28 Mar 2026" },
  ],
};

export const PRE_FILING_TRIAGE = {
  gstr1: {
    total: 4,
    blockers: 2,
    warnings: 2,
    items: [
      { severity: "blocker", icon: "🔴", title: "2 buyer GSTINs cancelled/suspended", detail: "Invoices to Sai Enterprises (cancelled 10 Feb) and LLC Olimpiya (suspended) will be rejected by GST portal", fix: "Remove or amend these invoices" },
      { severity: "blocker", icon: "🔴", title: "3 HSN codes missing on B2B invoices", detail: "HSN required for businesses with turnover > ₹5Cr. Currently missing on 3 Amazon Creations invoices", fix: "Add HSN codes in Tally" },
      { severity: "warning", icon: "🟡", title: "Tax anomaly detected", detail: "Invoice #AMZ-9921 (₹2.28L) shows GST rate of 22% — unusual. Verify rate is correct.", fix: "Review in Tally" },
      { severity: "warning", icon: "🟡", title: "Document series gap", detail: "Invoice series jumps from #42 to #45 — missing 43, 44. Declare cancelled series or re-issue.", fix: "Update DOCISSUED section" },
    ],
  },
  gstr3b: {
    total: 3,
    blockers: 1,
    warnings: 2,
    items: [
      { severity: "blocker", icon: "🔴", title: "₹5.7L ITC at risk — 8 suppliers haven't filed GSTR-1", detail: "If you claim this ITC now and suppliers don't file, you'll have to reverse + pay interest", fix: "Send WhatsApp reminders to suppliers OR defer claim" },
      { severity: "warning", icon: "🟡", title: "Cash payable: ₹12,450", detail: "After ITC utilization, net cash payable. Generate challan before filing.", fix: "Auto-generated in wizard" },
      { severity: "warning", icon: "🟡", title: "₹4.61L excess ITC available for refund", detail: "You have unused ITC sitting idle. File refund application (RFD-01) separately after 3B.", fix: "Reminder will be set" },
    ],
  },
};

export type FilingStatus = "draft" | "generated" | "saved" | "submitted" | "filed" | "verified" | "failed";

export const FILING_STATE = {
  gstr1: {
    period: "March 2026",
    dueDate: "11 Apr 2026",
    daysLeft: -6, // overdue
    status: "generated" as FilingStatus,
    currentStep: 2, // 0: generate, 1: validate, 2: save, 3: submit, 4: file, 5: verify
    summary: {
      b2b: { count: 89, value: 6720000 },
      b2cs: { count: 0, value: 1240000 },
      b2cl: { count: 12, value: 580000 },
      cdnr: { count: 3, value: -45000 },
      exports: { count: 0, value: 0 },
      hsnSummary: 14,
      cgst: 480000,
      sgst: 480000,
      igst: 210000,
      totalTax: 1170000,
    },
  },
  gstr3b: {
    period: "March 2026",
    dueDate: "20 Apr 2026",
    daysLeft: 3,
    status: "draft" as FilingStatus,
    currentStep: 0,
    summary: {
      outwardTaxable: 9252380,
      outputTax: 1170000,
      itcAvailable: 1080000,
      itcUtilized: 1080000,
      netCashPayable: 12450,
      itcExcess: 461000,
      reverseCharge: 0,
    },
  },
};

export const FILING_HISTORY = [
  { id: "f1", period: "Feb 2026", type: "GSTR-3B", status: "filed", filedAt: "18 Mar 2026, 6:42 PM", ackNo: "AA270226892345R", signatory: "Yogesh Patel", cashPaid: 18400, itcUsed: 970000 },
  { id: "f2", period: "Feb 2026", type: "GSTR-1", status: "filed", filedAt: "10 Mar 2026, 2:15 PM", ackNo: "AA270226551234R", signatory: "Yogesh Patel", invoices: 82 },
  { id: "f3", period: "Jan 2026", type: "GSTR-3B", status: "filed", filedAt: "19 Feb 2026, 9:20 AM", ackNo: "AA270126334455R", signatory: "Yogesh Patel", cashPaid: 22100, itcUsed: 890000 },
  { id: "f4", period: "Jan 2026", type: "GSTR-1", status: "filed", filedAt: "11 Feb 2026, 4:30 PM", ackNo: "AA270126112233R", signatory: "Yogesh Patel", invoices: 76 },
  { id: "f5", period: "Dec 2025", type: "GSTR-3B", status: "filed", filedAt: "20 Jan 2026, 8:45 PM", ackNo: "AA271225998877R", signatory: "Yogesh Patel", cashPaid: 0, itcUsed: 1020000 },
];

export const GST_HEALTH = {
  score: 72, // 0-100
  filingStreak: 18, // months in a row
  avgDaysBeforeDue: 3.2,
  missedDeadlines12m: 0,
  itcMatchRate: 87, // %
  excessItcUnclaimed: 461000, // ₹4.61L
};

export const GST_WORKFLOWS = [
  {
    id: "recon",
    icon: "🔍",
    title: "2B Reconciliation",
    subtitle: "Match Tally purchases with GSTR-2B",
    cta: "Run Reconciliation",
    cadence: "Monthly (recommended on 15th)",
    phase: "Phase 2",
    phaseStatus: "ready" as const,
  },
  {
    id: "gstr1",
    icon: "📤",
    title: "File GSTR-1",
    subtitle: "Outward supplies return",
    cta: "Start GSTR-1 Filing",
    cadence: "Monthly, due 11th",
    phase: "Phase 3",
    phaseStatus: "blocked" as const,
    blockReason: "INFINI save/submit/file APIs pending",
  },
  {
    id: "gstr3b",
    icon: "🏛️",
    title: "File GSTR-3B",
    subtitle: "Summary return + tax payment",
    cta: "Start GSTR-3B Filing",
    cadence: "Monthly, due 20th",
    phase: "Phase 4",
    phaseStatus: "blocked" as const,
    blockReason: "INFINI 3B + challan APIs pending",
  },
];

export const BUILD_PHASES = [
  { phase: "Phase 1", label: "Foundation", status: "ready" as const, items: ["GSTIN verification", "Filing history lookup", "INFINI proxy"], weeks: "1-2" },
  { phase: "Phase 2", label: "Reconciliation", status: "ready" as const, items: ["2B async recon engine", "Purchase GST summary RPC", "OTP tools"], weeks: "3-4" },
  { phase: "Phase 3", label: "GSTR-1 Filing", status: "blocked" as const, items: ["Generate JSON", "Validate parties", "Save/submit/file flow"], weeks: "5-6", blocker: "Awaiting INFINI filing API specs" },
  { phase: "Phase 4", label: "GSTR-3B Filing", status: "blocked" as const, items: ["3B generation", "Challan creation", "ITC cross-check"], weeks: "7-8", blocker: "Awaiting INFINI filing API specs" },
  { phase: "Phase 5", label: "Hardening", status: "future" as const, items: ["Production credentials", "MSG91 follow-ups", "Deadline reminders"], weeks: "9-10" },
];

/* ============================================================
   PAYABLES — vendors we owe (item 5)
   ============================================================ */

export const PAYABLES = [
  { name: "Amazon - Creations (Logistics)", gstin: "29AAHCA9099B1Z4", amount: 842300, days: 18, bills: 23, priority: "P3" as const, msme: false, category: "Logistics", contact: "+91 80 1234 5678" },
  { name: "GOOGLE INDIA PVT LTD (Ads)", gstin: "29AACCG0527D1Z8", amount: 614200, days: 12, bills: 8, priority: "P3" as const, msme: false, category: "Marketing", contact: "ads-support@google.com" },
  { name: "Shiprocket Logistics", gstin: "07AAGCS5867P1Z9", amount: 287500, days: 28, bills: 45, priority: "P2" as const, msme: false, category: "Logistics", contact: "+91 98100 22334" },
  { name: "Mumbai Packaging Ltd", gstin: "27AAACM5555P1Z2", amount: 184200, days: 42, bills: 12, priority: "P1" as const, msme: true, category: "Raw Material", contact: "+91 98201 55667", msmeDueDate: "28 Apr 2026" },
  { name: "Kiran Labels & Stickers", gstin: "27AAACK7777P1Z4", amount: 98500, days: 38, bills: 7, priority: "P1" as const, msme: true, category: "Raw Material", contact: "+91 98201 99887", msmeDueDate: "24 Apr 2026" },
  { name: "Raw Material Supplier Co", gstin: "24AAACR1234P1Z2", amount: 156800, days: 22, bills: 9, priority: "P2" as const, msme: false, category: "Raw Material", contact: "+91 98765 44321" },
  { name: "Instamojo Payments", gstin: "29AAACI8901P1Z3", amount: 45200, days: 8, bills: 3, priority: "P3" as const, msme: false, category: "Payment Gateway", contact: "support@instamojo.com" },
  { name: "Facebook India (Ads)", gstin: "29AAACF1111F1Z2", amount: 328900, days: 15, bills: 6, priority: "P2" as const, msme: false, category: "Marketing", contact: "—" },
  { name: "Zoho Corp (Tally licence)", gstin: "33AAACZ4123P1Z7", amount: 35000, days: 5, bills: 1, priority: "P3" as const, msme: false, category: "Software", contact: "+91 44 4996 5000" },
  { name: "Bombay Printers", gstin: "27AAACB3366P1Z5", amount: 67400, days: 44, bills: 4, priority: "P1" as const, msme: true, category: "Raw Material", contact: "+91 98201 77665", msmeDueDate: "22 Apr 2026" },
];

/* ============================================================
   TOP CUSTOMERS — for Sales > Customers tab (item 7)
   ============================================================ */

export const TOP_CUSTOMERS = [
  { name: "Nykaa E-Retail Pvt Ltd", channel: "Marketplace", revenue: 3240000, orders: 142, aov: 22817, lastOrder: "28 Mar 2026", firstOrder: "04 Apr 2024", ltv: 8920000, cohort: "FY24 Q1", repeat: true },
  { name: "Amazon Seller Central", channel: "Marketplace", revenue: 2850000, orders: 298, aov: 9564, lastOrder: "30 Mar 2026", firstOrder: "15 May 2023", ltv: 11240000, cohort: "FY23 Q1", repeat: true },
  { name: "Flipkart Marketplace", channel: "Marketplace", revenue: 1980000, orders: 187, aov: 10588, lastOrder: "29 Mar 2026", firstOrder: "02 Jun 2024", ltv: 4210000, cohort: "FY24 Q2", repeat: true },
  { name: "Website D2C (rikoskin.com)", channel: "D2C", revenue: 3220000, orders: 821, aov: 3922, lastOrder: "31 Mar 2026", firstOrder: "01 Apr 2023", ltv: 9830000, cohort: "FY23 Q1", repeat: true },
  { name: "Paytm Mall (One97)", channel: "Marketplace", revenue: 890000, orders: 62, aov: 14354, lastOrder: "20 Feb 2026", firstOrder: "10 Jan 2025", ltv: 1240000, cohort: "FY24 Q4", repeat: true },
  { name: "LLC Olimpiya", channel: "B2B Offline", revenue: 452000, orders: 8, aov: 56500, lastOrder: "14 Jan 2026", firstOrder: "18 Feb 2024", ltv: 890000, cohort: "FY23 Q4", repeat: false },
  { name: "Meesho Seller", channel: "Marketplace", revenue: 385000, orders: 45, aov: 8555, lastOrder: "22 Mar 2026", firstOrder: "08 Aug 2025", ltv: 420000, cohort: "FY25 Q2", repeat: true },
  { name: "JioMart (Reliance Retail)", channel: "Marketplace", revenue: 285000, orders: 31, aov: 9194, lastOrder: "12 Mar 2026", firstOrder: "19 Nov 2025", ltv: 310000, cohort: "FY25 Q3", repeat: true },
  { name: "Ajio (Reliance)", channel: "Marketplace", revenue: 142000, orders: 18, aov: 7888, lastOrder: "05 Mar 2026", firstOrder: "12 Feb 2026", ltv: 142000, cohort: "FY25 Q4", repeat: false },
  { name: "Scale Global Debtors", channel: "B2B Offline", revenue: 270000, orders: 4, aov: 67500, lastOrder: "28 Jan 2026", firstOrder: "14 Oct 2024", ltv: 650000, cohort: "FY24 Q3", repeat: false },
];

/* Cohort retention — customers acquired in each quarter, % still active */
export const COHORT_RETENTION = [
  { cohort: "FY23 Q1", acquired: 142, retention: [100, 68, 52, 41, 35, 28, 24, 21] }, // 8 quarters
  { cohort: "FY23 Q2", acquired: 98, retention: [100, 72, 54, 43, 36, 30, 26] },
  { cohort: "FY23 Q3", acquired: 167, retention: [100, 75, 58, 48, 39, 32] },
  { cohort: "FY23 Q4", acquired: 215, retention: [100, 78, 61, 50, 41] },
  { cohort: "FY24 Q1", acquired: 289, retention: [100, 80, 63, 52] },
  { cohort: "FY24 Q2", acquired: 312, retention: [100, 82, 65] },
  { cohort: "FY24 Q3", acquired: 401, retention: [100, 78] },
  { cohort: "FY24 Q4", acquired: 356, retention: [100] },
];

/* AOV trend by month */
export const AOV_TREND = [
  { month: "Apr", aov: 8200 },
  { month: "May", aov: 8450 },
  { month: "Jun", aov: 7980 },
  { month: "Jul", aov: 8120 },
  { month: "Aug", aov: 7650 },
  { month: "Sep", aov: 7420 },
  { month: "Oct", aov: 7180 },
  { month: "Nov", aov: 7640 },
  { month: "Dec", aov: 8820 },
  { month: "Jan", aov: 9240 },
  { month: "Feb", aov: 8980 },
  { month: "Mar", aov: 9420 },
];

/* ============================================================
   RETURNS / CREDIT NOTES — item 11
   (Bandra Soap has ₹1.62 Cr in returns = 17.5% of gross)
   ============================================================ */

export const RETURNS_SUMMARY = {
  totalReturns: 16226404, // 1.62 Cr
  grossSales: 108750204, // 10.87 Cr
  returnRate: 14.9, // % of gross
  returnCount: 847,
  avgReturnValue: 19153,
  trendDirection: "up" as const,
  trendPct: 8.3,
};

export const RETURNS_BY_CHANNEL = [
  { channel: "Amazon", returns: 7420000, sales: 22800000, rate: 32.5, count: 298, topReason: "Damaged in transit" },
  { channel: "Flipkart", returns: 3180000, sales: 19800000, rate: 16.1, count: 187, topReason: "Wrong product" },
  { channel: "Nykaa", returns: 2850000, sales: 32400000, rate: 8.8, count: 142, topReason: "Customer not satisfied" },
  { channel: "Website D2C", returns: 1820000, sales: 32200000, rate: 5.7, count: 184, topReason: "Wrong address" },
  { channel: "Meesho", returns: 620000, sales: 3850000, rate: 16.1, count: 31, topReason: "Cash on delivery refused" },
  { channel: "Others", returns: 336404, sales: 7702204, rate: 4.4, count: 5, topReason: "Various" },
];

export const TOP_RETURNED_SKUS = [
  { sku: "SKU-004", name: "100 GM BROWN GLASS JAR", returns: 184, rate: 38.2, loss: 920000 },
  { sku: "SKU-005", name: "100 GM CHINA SURAH K TOAN", returns: 142, rate: 28.9, loss: 710000 },
  { sku: "SKU-007", name: "Niacinamide Serum 30ml", returns: 89, rate: 12.4, loss: 534000 },
  { sku: "SKU-006", name: "150 Gm Riko Jar New Tube", returns: 76, rate: 8.1, loss: 456000 },
  { sku: "SKU-001", name: "100 Gm Riko Jar", returns: 54, rate: 4.2, loss: 324000 },
];

/* ============================================================
   CASH FLOW FORECAST — item 9
   ============================================================ */

export const CASH_FORECAST_WEEKS = [
  { week: "W1 (Apr 18-24)", inflow: 320000, outflow: 580000, net: -260000, endBalance: 299740 },
  { week: "W2 (Apr 25-May 1)", inflow: 450000, outflow: 420000, net: 30000, endBalance: 329740 },
  { week: "W3 (May 2-8)", inflow: 380000, outflow: 650000, net: -270000, endBalance: 59740 },
  { week: "W4 (May 9-15)", inflow: 420000, outflow: 480000, net: -60000, endBalance: -260, alert: "Cash negative" },
  { week: "W5 (May 16-22)", inflow: 380000, outflow: 520000, net: -140000, endBalance: -140260, alert: "Deepening deficit" },
  { week: "W6 (May 23-29)", inflow: 410000, outflow: 580000, net: -170000, endBalance: -310260, alert: "Critical" },
];

export const CASH_FORECAST_SCENARIOS = [
  { label: "Base case", endCash30d: 59740, runwayDays: 9, color: "var(--yellow)" },
  { label: "If Nykaa pays ₹12.6L", endCash30d: 1319740, runwayDays: 68, color: "var(--green)" },
  { label: "If GST refund ₹4.6L lands", endCash30d: 519740, runwayDays: 28, color: "var(--blue)" },
  { label: "If marketing cut 30%", endCash30d: 759740, runwayDays: 41, color: "var(--green)" },
  { label: "Worst case (all delays)", endCash30d: -420260, runwayDays: 0, color: "var(--red)" },
];

/* ============================================================
   DEAD STOCK — item 8
   ============================================================ */

export const DEAD_STOCK = [
  { sku: "SKU-010", name: "100 GM CHINA SURAH K TOAN (old)", qty: 452, value: 1130000, lastSold: "2 years ago", category: "Discontinued", recommendation: "Liquidate at 40% off" },
  { sku: "SKU-015", name: "Peel-off Mask 50g", qty: 289, value: 434000, lastSold: "8 months ago", category: "Slow moving", recommendation: "Bundle with fast movers" },
  { sku: "SKU-004", name: "100 GM BROWN GLASS JAR", qty: 186, value: 372000, lastSold: "6 months ago", category: "Slow moving", recommendation: "Return to supplier if possible" },
  { sku: "SKU-022", name: "Glow Cream 30g (FY23 batch)", qty: 124, value: 248000, lastSold: "14 months ago", category: "Expiring soon", recommendation: "Discount 50% before 30 Jun" },
  { sku: "SKU-028", name: "Herbal Toner 100ml", qty: 156, value: 195000, lastSold: "5 months ago", category: "Slow moving", recommendation: "Review pricing" },
  { sku: "SKU-041", name: "Face Wash Duo Pack", qty: 98, value: 147000, lastSold: "7 months ago", category: "Slow moving", recommendation: "Run bundle promo" },
];

export const DEAD_STOCK_SUMMARY = {
  totalSkus: 47,
  totalValue: 3420000, // 34.2L
  pctOfInventory: 44.4,
  avgAge: 9.2, // months
  categoryBreakdown: [
    { category: "Discontinued", count: 12, value: 1620000 },
    { category: "Slow moving", count: 24, value: 1280000 },
    { category: "Expiring soon", count: 11, value: 520000 },
  ],
};

/* ============================================================
   TDS WORKINGS — item 16
   ============================================================ */

export const TDS_SECTIONS = [
  { section: "194Q", desc: "Purchase of goods (>50L/vendor)", transactions: 14, liability: 182400, rate: 0.1, period: "March 2026" },
  { section: "194J", desc: "Professional / technical fees", transactions: 28, liability: 96800, rate: 10, period: "March 2026" },
  { section: "194C", desc: "Contractor payments", transactions: 45, liability: 54200, rate: 2, period: "March 2026" },
  { section: "192", desc: "Salary TDS", transactions: 12, liability: 148600, rate: 0, period: "March 2026" },
  { section: "194I", desc: "Rent payment", transactions: 3, liability: 24000, rate: 10, period: "March 2026" },
  { section: "194H", desc: "Commission / brokerage", transactions: 8, liability: 18500, rate: 5, period: "March 2026" },
];

/** Accurate CBDT deadlines per Income Tax Act, Rule 30 (TDS payment)
 *  and Rule 31A (TDS returns). Reference: CBDT notifications + Rule 31.
 *
 *  Rule 30 — TDS payment:
 *    • Normal months:  7th of following month
 *    • March TDS:      30 April (special deadline)
 *  Rule 31A — Quarterly returns (Form 24Q salary + 26Q non-salary):
 *    • Q1 Apr-Jun:  31 July
 *    • Q2 Jul-Sep:  31 October
 *    • Q3 Oct-Dec:  31 January
 *    • Q4 Jan-Mar:  31 May
 *  Rule 31 — Certificates:
 *    • Form 16 (salary):     15 June of AY
 *    • Form 16A (non-salary): 15 days after each Q's return deadline
 *                             (so Q4 Form 16A = 15 June as well)
 */
export const TDS_UPCOMING = {
  // Most urgent: March TDS payment — Apr 30 (Rule 30 special March deadline)
  marchDepositDueDate: "30 Apr 2026",
  marchDepositAmount: 524500,
  // Next monthly: April TDS payment — May 7 (normal rule)
  aprilDepositDueDate: "7 May 2026",
  aprilDepositAmount: 198400,
  // Q4 FY25-26 return — 31 May 2026 (Rule 31A)
  quarterlyReturnDueDate: "31 May 2026",
  // Form 16 (salary) + Form 16A (Q4 non-salary) — both 15 June
  form16DueDate: "15 Jun 2026",
};

export const TDS_DEDUCTEES = [
  { name: "Priya Sharma (Manager)", pan: "ABCPS1234D", section: "192", amount: 42500, tdsRate: 15, tdsAmount: 6375 },
  { name: "Sunil Shah (Accounts)", pan: "EFGPS5678E", section: "192", amount: 38000, tdsRate: 10, tdsAmount: 3800 },
  { name: "Digital Lab Consultants", pan: "AAACD1111L", section: "194J", amount: 120000, tdsRate: 10, tdsAmount: 12000 },
  { name: "Kiran Labels & Stickers", pan: "AAACK7777K", section: "194C", amount: 98500, tdsRate: 2, tdsAmount: 1970 },
  { name: "Office Landlord (Ajay Mehta)", pan: "AJYPM4321M", section: "194I", amount: 80000, tdsRate: 10, tdsAmount: 8000 },
];

/* ============================================================
   BANK RECONCILIATION — item 17
   ============================================================ */

export const BANK_ACCOUNTS = [
  { id: "hdfc-oca", bank: "HDFC Bank", accountNumber: "XXXXXX7845", type: "Current", balance: 412500, lastReconciled: "31 Mar 2026", status: "reconciled" as const, statementDate: "17 Apr 2026" },
  { id: "icici-oca", bank: "ICICI Bank", accountNumber: "XXXXXX2201", type: "Current", balance: 147240, lastReconciled: "31 Mar 2026", status: "pending" as const, statementDate: "17 Apr 2026", mismatchCount: 8 },
  { id: "sbi-od", bank: "SBI", accountNumber: "XXXXXX9912", type: "OD/CC", balance: -816420, lastReconciled: "28 Feb 2026", status: "pending" as const, statementDate: "17 Apr 2026", mismatchCount: 14 },
  { id: "kotak-savings", bank: "Kotak Mahindra", accountNumber: "XXXXXX4455", type: "Savings", balance: 23800, lastReconciled: "31 Mar 2026", status: "reconciled" as const, statementDate: "17 Apr 2026" },
];

export const BANK_RECON_LINES = [
  { id: "l1", date: "12 Apr 2026", description: "RAZORPAY SETTLEMENT", bankAmount: 184500, tallyAmount: 184500, status: "matched" as const },
  { id: "l2", date: "12 Apr 2026", description: "NEFT-NYKAA-RETAIL-INV4412", bankAmount: 125000, tallyAmount: null, status: "missing_tally" as const, suggestion: "Record as receipt from Nykaa E-Retail" },
  { id: "l3", date: "11 Apr 2026", description: "CHQ-PAYMENT-KIRAN-LABELS", bankAmount: -48200, tallyAmount: -48200, status: "matched" as const },
  { id: "l4", date: "10 Apr 2026", description: "UPI-CRED-TECH-3442", bankAmount: -12500, tallyAmount: null, status: "missing_tally" as const, suggestion: "Record as CRED card payment" },
  { id: "l5", date: "09 Apr 2026", description: "NEFT-SHIPROCKET", bankAmount: -89000, tallyAmount: -82000, status: "mismatch" as const, diff: -7000, suggestion: "₹7,000 diff — check invoice SR-2301" },
  { id: "l6", date: "08 Apr 2026", description: "BANK CHARGES - SMS", bankAmount: -236, tallyAmount: null, status: "missing_tally" as const, suggestion: "Record as bank charges" },
  { id: "l7", date: "08 Apr 2026", description: "INTEREST CREDITED", bankAmount: 1420, tallyAmount: null, status: "missing_tally" as const, suggestion: "Record as interest income" },
  { id: "l8", date: "07 Apr 2026", description: "IMPS-AMAZON-SELLER", bankAmount: 85200, tallyAmount: 85200, status: "matched" as const },
];

export const BANK_RECON_SUMMARY = {
  openingBalanceBank: 486200,
  openingBalanceTally: 486200,
  closingBalanceBank: 147240,
  closingBalanceTally: 162740,
  difference: 15500,
  matchedCount: 42,
  mismatchCount: 3,
  missingInTally: 8,
  missingInBank: 0,
};

/* ============================================================
   PENDING INVITES — item 13
   ============================================================ */
export const PENDING_INVITE_EXPIRY_DAYS = 7;

/* ============================================================
   GST API DATASETS — structured to mirror the consented GST API's
   output sheets so the mock → real swap is a one-line change later.
   Sheet refs are from "Consented GST Advance Consolidated Excel":
     • Cyclic Transactions sheet → CYCLIC_TRANSACTIONS
     • Related Party Sales / Purchases → RELATED_PARTY_*
     • Comparison Sheet (Recurring Revenue %) → RECURRING_REVENUE
     • HSN-wise Sales → HSN_WISE_SALES
     • State-wise Sales → STATE_WISE_SALES
     • Compliance sheet (filing delay days) → FILING_DELAYS
   ============================================================ */

/** Parties that appear as BOTH customer AND supplier in the same FY.
 *  Flagged by the API as potential round-tripping — always worth a CA's
 *  review. Ratio = min(sales,purchases) / max(sales,purchases). */
export const CYCLIC_TRANSACTIONS = [
  {
    partyName: "Patel Traders Pvt Ltd",
    pan: "AABCP1234R",
    gstin: "29AABCP1234R1Z8",
    totalSales: 4520000,
    totalPurchases: 3180000,
    cycleRatio: 0.70,
    severity: "high" as const,
    flag: "Purchases are 70% of sales — investigate",
  },
  {
    partyName: "Mumbai Packaging Ltd",
    pan: "AACCM5555P",
    gstin: "27AACCM5555P1Z2",
    totalSales: 2850000,
    totalPurchases: 640000,
    cycleRatio: 0.22,
    severity: "medium" as const,
    flag: "Material cyclic volume",
  },
  {
    partyName: "Shiprocket Logistics",
    pan: "AAGCS5867P",
    gstin: "07AAGCS5867P1Z9",
    totalSales: 180000,
    totalPurchases: 1540000,
    cycleRatio: 0.12,
    severity: "low" as const,
    flag: "Freight provider; reverse charge likely",
  },
];

/** Transactions flagged as related-party (same group / sister concern /
 *  shared directors). Section 40A(2) disallowance risk + transfer
 *  pricing scrutiny. */
export const RELATED_PARTY_SALES = [
  {
    partyName: "Bandra Soap Exports (sister concern)",
    pan: "AAECB9998R",
    gstin: "27AAECB9998R1Z5",
    relationship: "Common directors",
    taxableValue: 2500000,
    invoiceValue: 2950000,
    invoiceCount: 18,
    flagged: true,
  },
  {
    partyName: "RIKO Cosmetics Pvt Ltd (group)",
    pan: "AABCR7788K",
    gstin: "27AABCR7788K1Z3",
    relationship: "Common ownership > 20%",
    taxableValue: 1180000,
    invoiceValue: 1392400,
    invoiceCount: 12,
    flagged: true,
  },
];

export const RELATED_PARTY_PURCHASES = [
  {
    partyName: "Patel Raw Materials Ltd (director-owned)",
    pan: "AACCP4432N",
    gstin: "27AACCP4432N1Z9",
    relationship: "Director also holds 30% of this party",
    taxableValue: 3640000,
    invoiceValue: 4295200,
    invoiceCount: 42,
    flagged: true,
  },
];

/** Recurring revenue = revenue from PANs that bought in >= 2 months
 *  across the FY. Higher % = stickier business. This is a quality
 *  metric CAs and investors both care about. */
export const RECURRING_REVENUE = {
  fy: "FY 2024-25",
  recurringRevenue: 78744125,
  totalRevenue: 92523800,
  recurringPct: 85.1,
  recurringPartyCount: 147,
  totalCustomerCount: 294,
  newCustomerCount: 87,
  lostCustomerCount: 61,
  // Per-month split: how much of that month's revenue came from repeat vs new customers
  monthly: [
    { month: "Apr", newPct: 32, repeatPct: 68 },
    { month: "May", newPct: 18, repeatPct: 82 },
    { month: "Jun", newPct: 22, repeatPct: 78 },
    { month: "Jul", newPct: 15, repeatPct: 85 },
    { month: "Aug", newPct: 12, repeatPct: 88 },
    { month: "Sep", newPct: 11, repeatPct: 89 },
    { month: "Oct", newPct: 14, repeatPct: 86 },
    { month: "Nov", newPct: 9, repeatPct: 91 },
    { month: "Dec", newPct: 8, repeatPct: 92 },
    { month: "Jan", newPct: 10, repeatPct: 90 },
    { month: "Feb", newPct: 12, repeatPct: 88 },
    { month: "Mar", newPct: 13, repeatPct: 87 },
  ],
};

/** HSN-wise sales — each product/service code with volume + rate.
 *  GSTR-1 Table 12 requires this summary for businesses > ₹5Cr turnover. */
export const HSN_WISE_SALES = [
  { hsn: "33059011", particulars: "Hair oil preparations", invoiceCount: 1245, taxableValue: 34200000, tax: 6156000, invoiceValue: 40356000, avgRate: 18 },
  { hsn: "34022090", particulars: "Organic surface-active agents (face wash)", invoiceCount: 892, taxableValue: 18500000, tax: 3330000, invoiceValue: 21830000, avgRate: 18 },
  { hsn: "33049990", particulars: "Beauty / make-up preparations (serums)", invoiceCount: 648, taxableValue: 14800000, tax: 2664000, invoiceValue: 17464000, avgRate: 18 },
  { hsn: "33051090", particulars: "Shampoos n.e.s.", invoiceCount: 324, taxableValue: 9800000, tax: 1764000, invoiceValue: 11564000, avgRate: 18 },
  { hsn: "33079090", particulars: "Other perfumery / toilet preparations", invoiceCount: 198, taxableValue: 6300000, tax: 1134000, invoiceValue: 7434000, avgRate: 18 },
  { hsn: "34011900", particulars: "Soaps (bar, organic)", invoiceCount: 156, taxableValue: 3900000, tax: 702000, invoiceValue: 4602000, avgRate: 18 },
  { hsn: "3923", particulars: "Plastic packaging (resale)", invoiceCount: 48, taxableValue: 950000, tax: 171000, invoiceValue: 1121000, avgRate: 18 },
  { hsn: "9983", particulars: "Other professional / technical services", invoiceCount: 24, taxableValue: 280000, tax: 50400, invoiceValue: 330400, avgRate: 18 },
];

/** State-wise sales — invoices to parties in each state code.
 *  29 states + 7 UTs but we only carry the ones with material volume. */
export const STATE_WISE_SALES = [
  { stateCode: "27", state: "Maharashtra", invoiceCount: 428, taxableValue: 22500000, tax: 4050000, invoiceValue: 26550000 },
  { stateCode: "29", state: "Karnataka", invoiceCount: 312, taxableValue: 14200000, tax: 2556000, invoiceValue: 16756000 },
  { stateCode: "07", state: "Delhi", invoiceCount: 198, taxableValue: 9800000, tax: 1764000, invoiceValue: 11564000 },
  { stateCode: "09", state: "Uttar Pradesh", invoiceCount: 178, taxableValue: 8400000, tax: 1512000, invoiceValue: 9912000 },
  { stateCode: "06", state: "Haryana", invoiceCount: 148, taxableValue: 6900000, tax: 1242000, invoiceValue: 8142000 },
  { stateCode: "33", state: "Tamil Nadu", invoiceCount: 132, taxableValue: 6200000, tax: 1116000, invoiceValue: 7316000 },
  { stateCode: "24", state: "Gujarat", invoiceCount: 116, taxableValue: 5400000, tax: 972000, invoiceValue: 6372000 },
  { stateCode: "36", state: "Telangana", invoiceCount: 98, taxableValue: 4500000, tax: 810000, invoiceValue: 5310000 },
  { stateCode: "19", state: "West Bengal", invoiceCount: 92, taxableValue: 4100000, tax: 738000, invoiceValue: 4838000 },
  { stateCode: "32", state: "Kerala", invoiceCount: 64, taxableValue: 2800000, tax: 504000, invoiceValue: 3304000 },
  { stateCode: "08", state: "Rajasthan", invoiceCount: 58, taxableValue: 2400000, tax: 432000, invoiceValue: 2832000 },
  { stateCode: "23", state: "Madhya Pradesh", invoiceCount: 42, taxableValue: 1800000, tax: 324000, invoiceValue: 2124000 },
  { stateCode: "03", state: "Punjab", invoiceCount: 38, taxableValue: 1600000, tax: 288000, invoiceValue: 1888000 },
  { stateCode: "30", state: "Goa", invoiceCount: 22, taxableValue: 850000, tax: 153000, invoiceValue: 1003000 },
];

/** Filing delay matrix — 24 months × 2 return types. Zero = on time,
 *  positive = days late. Source: Compliance sheet in the API output. */
export const FILING_DELAYS = {
  months: [
    "Apr-24", "May-24", "Jun-24", "Jul-24", "Aug-24", "Sep-24",
    "Oct-24", "Nov-24", "Dec-24", "Jan-25", "Feb-25", "Mar-25",
    "Apr-25", "May-25", "Jun-25", "Jul-25", "Aug-25", "Sep-25",
    "Oct-25", "Nov-25", "Dec-25", "Jan-26", "Feb-26", "Mar-26",
  ],
  returnTypes: ["GSTR-1", "GSTR-3B"] as const,
  // [row = return type][col = month]
  // Months April 2024 → March 2026. 0 = on time. Recent months show
  // some slippage consistent with the company being under cash pressure.
  delayDays: [
    // GSTR-1: 11th of following month
    [0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 2, 0, 0, 0, 0, 3, 0, 1, 0, 0],
    // GSTR-3B: 20th of following month
    [0, 0, 0, 0, 0, 0, 0, 2, 0, 0, 0, 1, 0, 0, 0, 0, 3, 0, 0, 4, 2, 0, 1, 0],
  ],
};

/** Derived stats used for GST Health scoring. */
export const FILING_STATS = {
  totalMonthsTracked: 48, // 24 months × 2 returns
  onTimeMonths: FILING_DELAYS.delayDays
    .flat()
    .filter((d) => d === 0).length,
  missedDeadlines: FILING_DELAYS.delayDays.flat().filter((d) => d > 7).length,
  avgDelayWhenLate:
    (() => {
      const late = FILING_DELAYS.delayDays.flat().filter((d) => d > 0);
      return late.length
        ? late.reduce((s, d) => s + d, 0) / late.length
        : 0;
    })(),
  maxStreakMonths: 18, // longest on-time streak in window
};

/* ============================================================
   TALLY WRITE-BACK (Phase 1 UX) — entries, approval workflow,
   and OCR extraction. Everything here is mock data for the demo;
   backend + real Tally XML posting is Phase 2.
   ============================================================ */

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

export type EntryState =
  | "draft"
  | "pending" // awaiting approval
  | "approved" // approved, awaiting post
  | "posted" // successfully in Tally
  | "rejected";

export type EntrySource =
  | "chat"
  | "daybook"
  | "ocr"
  | "bank-recon"
  | "bulk";

export interface EntryHistoryItem {
  at: string; // ISO timestamp
  actor: string;
  actorRole: string;
  action: string; // "Created via chat" | "Submitted for approval" | "Approved" | ...
  note?: string;
}

export interface LedgerImpact {
  ledger: string;
  debit?: number;
  credit?: number;
}

export interface EntryItem {
  name: string;
  hsn?: string;
  qty: number;
  unit?: string;
  rate: number;
  amount: number;
}

export interface TaxComponents {
  cgst?: number;
  sgst?: number;
  igst?: number;
  cess?: number;
}

export interface Entry {
  id: string;
  type: EntryType;
  state: EntryState;
  amount: number; // Total invoice value incl. tax
  partyName: string;
  partyGstin?: string;
  particulars: string;
  createdBy: string;
  createdByRole: string;
  createdAt: string;
  source: EntrySource;
  date: string; // Voucher date (ISO)
  ledgerImpact: LedgerImpact[];
  items?: EntryItem[];
  taxComponents?: TaxComponents;

  // Lifecycle
  voucherNumber?: string; // assigned on post
  postedAt?: string;
  postedBy?: string;
  rejectionReason?: string;
  rejectedBy?: string;
  rejectedAt?: string;

  // Approval routing
  requiredApprover: "any" | "accounts" | "accounts-head" | "admin";
  history: EntryHistoryItem[];

  // OCR metadata (only if source=ocr)
  ocr?: {
    fileName: string;
    confidence: Record<string, number>; // per-field 0-1
    extractedAt: string;
  };
}

export const ENTRIES: Entry[] = [
  /* ── PENDING APPROVAL (approvers' queue) ─────────────────── */
  {
    id: "e101",
    type: "sales",
    state: "pending",
    amount: 1261337,
    partyName: "Nykaa E-Retail Pvt Ltd",
    partyGstin: "27AAACN6153K1Z5",
    particulars: "March settlement invoice",
    createdBy: "Yogesh Patel",
    createdByRole: "admin",
    createdAt: "2026-04-20T14:30:00+05:30",
    source: "chat",
    date: "2026-04-20",
    ledgerImpact: [
      { ledger: "Nykaa E-Retail (Debtors)", debit: 1261337 },
      { ledger: "Sales — Marketplace", credit: 1069777 },
      { ledger: "Output IGST 18%", credit: 191560 },
    ],
    items: [
      { name: "Riko Face Wash 100ml", hsn: "34022090", qty: 420, rate: 285, amount: 119700 },
      { name: "Riko Niacinamide Serum 30ml", hsn: "33049990", qty: 380, rate: 495, amount: 188100 },
      { name: "Riko SPF 50 Sunscreen 60ml", hsn: "33049990", qty: 260, rate: 640, amount: 166400 },
      { name: "Riko Hair Oil 200ml", hsn: "33059011", qty: 1250, rate: 476, amount: 595577 },
    ],
    taxComponents: { igst: 191560 },
    requiredApprover: "accounts-head",
    history: [
      { at: "2026-04-20T14:29:00+05:30", actor: "Yogesh Patel", actorRole: "admin", action: "Drafted via chat", note: "From: 'Create sales invoice to Nykaa for 12.6L'" },
      { at: "2026-04-20T14:30:00+05:30", actor: "Yogesh Patel", actorRole: "admin", action: "Submitted for approval" },
    ],
  },
  {
    id: "e102",
    type: "purchase",
    state: "pending",
    amount: 32100,
    partyName: "Shiprocket Logistics",
    partyGstin: "07AAGCS5867P1Z9",
    particulars: "Freight charges · Mar 2026 · last-mile delivery",
    createdBy: "Kavya Iyer",
    createdByRole: "junior-accounts",
    createdAt: "2026-04-20T12:15:00+05:30",
    source: "ocr",
    date: "2026-03-31",
    ledgerImpact: [
      { ledger: "Freight & Logistics", debit: 27203 },
      { ledger: "Input CGST 9%", debit: 2448.5 },
      { ledger: "Input SGST 9%", debit: 2448.5 },
      { ledger: "Shiprocket Logistics (Creditor)", credit: 32100 },
    ],
    taxComponents: { cgst: 2448.5, sgst: 2448.5 },
    requiredApprover: "accounts",
    history: [
      { at: "2026-04-20T12:10:00+05:30", actor: "Kavya Iyer", actorRole: "junior-accounts", action: "Uploaded bill · Shiprocket-SR-2301.pdf" },
      { at: "2026-04-20T12:12:00+05:30", actor: "Riko OCR", actorRole: "system", action: "Extracted 11 fields · 94% avg confidence" },
      { at: "2026-04-20T12:15:00+05:30", actor: "Kavya Iyer", actorRole: "junior-accounts", action: "Submitted for approval" },
    ],
    ocr: {
      fileName: "Shiprocket-SR-2301.pdf",
      confidence: {
        vendorName: 0.99, gstin: 0.99, invoiceNo: 0.98, date: 0.95,
        total: 0.99, cgst: 0.91, sgst: 0.91, lineItems: 0.87,
      },
      extractedAt: "2026-04-20T12:12:00+05:30",
    },
  },
  {
    id: "e103",
    type: "purchase",
    state: "pending",
    amount: 228186,
    partyName: "Amazon - Creations",
    partyGstin: "29AAHCA9099B1Z4",
    particulars: "Marketplace commission & fulfilment fees · Mar 2026",
    createdBy: "Kavya Iyer",
    createdByRole: "junior-accounts",
    createdAt: "2026-04-20T10:20:00+05:30",
    source: "ocr",
    date: "2026-03-28",
    ledgerImpact: [
      { ledger: "Channel Commission - Amazon", debit: 193378 },
      { ledger: "Input IGST 18%", debit: 34808 },
      { ledger: "Amazon - Creations (Creditor)", credit: 228186 },
    ],
    taxComponents: { igst: 34808 },
    requiredApprover: "accounts-head",
    history: [
      { at: "2026-04-20T10:18:00+05:30", actor: "Kavya Iyer", actorRole: "junior-accounts", action: "Uploaded bill · AMZ-9921.pdf" },
      { at: "2026-04-20T10:19:00+05:30", actor: "Riko OCR", actorRole: "system", action: "Extracted 14 fields · 96% avg confidence" },
      { at: "2026-04-20T10:20:00+05:30", actor: "Kavya Iyer", actorRole: "junior-accounts", action: "Submitted for approval" },
    ],
    ocr: {
      fileName: "AMZ-9921.pdf",
      confidence: { vendorName: 0.99, gstin: 0.99, invoiceNo: 0.99, date: 0.98, total: 0.99, igst: 0.97, lineItems: 0.92 },
      extractedAt: "2026-04-20T10:19:00+05:30",
    },
  },
  {
    id: "e104",
    type: "payment",
    state: "pending",
    amount: 45000,
    partyName: "Shiprocket Logistics",
    partyGstin: "07AAGCS5867P1Z9",
    particulars: "Advance for April freight",
    createdBy: "Kavya Iyer",
    createdByRole: "junior-accounts",
    createdAt: "2026-04-19T17:00:00+05:30",
    source: "daybook",
    date: "2026-04-19",
    ledgerImpact: [
      { ledger: "Shiprocket Logistics (Creditor)", debit: 45000 },
      { ledger: "HDFC Bank - Current A/c", credit: 45000 },
    ],
    requiredApprover: "accounts",
    history: [
      { at: "2026-04-19T16:58:00+05:30", actor: "Kavya Iyer", actorRole: "junior-accounts", action: "Drafted from Day Book" },
      { at: "2026-04-19T17:00:00+05:30", actor: "Kavya Iyer", actorRole: "junior-accounts", action: "Submitted for approval" },
    ],
  },
  {
    id: "e105",
    type: "receipt",
    state: "pending",
    amount: 89000,
    partyName: "Paytm Settlement (One97 Communications)",
    partyGstin: "07AAACT2727Q1ZV",
    particulars: "Daily settlement · 17 Apr 2026",
    createdBy: "Anjali Desai",
    createdByRole: "field-sales",
    createdAt: "2026-04-18T19:45:00+05:30",
    source: "bank-recon",
    date: "2026-04-17",
    ledgerImpact: [
      { ledger: "HDFC Bank - Current A/c", debit: 89000 },
      { ledger: "Paytm Settlement (Debtors)", credit: 89000 },
    ],
    requiredApprover: "any",
    history: [
      { at: "2026-04-18T19:42:00+05:30", actor: "Anjali Desai", actorRole: "field-sales", action: "Drafted from Bank Recon · matched unmatched bank credit" },
      { at: "2026-04-18T19:45:00+05:30", actor: "Anjali Desai", actorRole: "field-sales", action: "Submitted for approval" },
    ],
  },

  /* ── DRAFTS (creator still editing) ──────────────────────── */
  {
    id: "e110",
    type: "purchase",
    state: "draft",
    amount: 58400,
    partyName: "Mumbai Packaging Ltd",
    partyGstin: "27AAACM5555P1Z2",
    particulars: "Secondary packaging bulk order · April",
    createdBy: "Kavya Iyer",
    createdByRole: "junior-accounts",
    createdAt: "2026-04-20T15:30:00+05:30",
    source: "ocr",
    date: "2026-04-18",
    ledgerImpact: [
      { ledger: "Packaging Materials", debit: 49492 },
      { ledger: "Input CGST 9%", debit: 4454 },
      { ledger: "Input SGST 9%", debit: 4454 },
      { ledger: "Mumbai Packaging Ltd (Creditor)", credit: 58400 },
    ],
    taxComponents: { cgst: 4454, sgst: 4454 },
    requiredApprover: "accounts",
    history: [
      { at: "2026-04-20T15:25:00+05:30", actor: "Kavya Iyer", actorRole: "junior-accounts", action: "Uploaded bill · MPL-3301.pdf" },
      { at: "2026-04-20T15:28:00+05:30", actor: "Riko OCR", actorRole: "system", action: "Extracted 12 fields · 89% avg confidence · 2 fields need review" },
    ],
    ocr: {
      fileName: "MPL-3301.pdf",
      confidence: { vendorName: 0.98, gstin: 0.97, invoiceNo: 0.92, date: 0.78, total: 0.99, cgst: 0.85, sgst: 0.85, lineItems: 0.72 },
      extractedAt: "2026-04-20T15:28:00+05:30",
    },
  },
  {
    id: "e111",
    type: "sales",
    state: "draft",
    amount: 342100,
    partyName: "Website D2C (rikoskin.com)",
    particulars: "Website orders · 19 Apr batch",
    createdBy: "Rahul Mehta",
    createdByRole: "sales",
    createdAt: "2026-04-20T11:00:00+05:30",
    source: "daybook",
    date: "2026-04-19",
    ledgerImpact: [
      { ledger: "Website Debtors (Razorpay)", debit: 342100 },
      { ledger: "Sales — D2C", credit: 290000 },
      { ledger: "Output CGST 9%", credit: 26100 },
      { ledger: "Output SGST 9%", credit: 26100 },
    ],
    taxComponents: { cgst: 26100, sgst: 26100 },
    requiredApprover: "accounts",
    history: [
      { at: "2026-04-20T11:00:00+05:30", actor: "Rahul Mehta", actorRole: "sales", action: "Drafted from Day Book" },
    ],
  },

  /* ── POSTED (successfully in Tally) ───────────────────────── */
  {
    id: "e120",
    type: "sales",
    state: "posted",
    amount: 198500,
    partyName: "Nykaa Marketplace",
    partyGstin: "27AADCN7487G1ZF",
    particulars: "Nykaa marketplace · Mar settlement",
    createdBy: "Priya Sharma",
    createdByRole: "manager",
    createdAt: "2026-04-18T09:30:00+05:30",
    source: "chat",
    date: "2026-04-17",
    ledgerImpact: [
      { ledger: "Nykaa Marketplace (Debtors)", debit: 198500 },
      { ledger: "Sales — Marketplace", credit: 168220 },
      { ledger: "Output IGST 18%", credit: 30280 },
    ],
    taxComponents: { igst: 30280 },
    voucherNumber: "VCH/2026-27/0142",
    postedAt: "2026-04-18T10:15:00+05:30",
    postedBy: "Priya Sharma",
    requiredApprover: "accounts",
    history: [
      { at: "2026-04-18T09:25:00+05:30", actor: "Priya Sharma", actorRole: "manager", action: "Drafted via chat" },
      { at: "2026-04-18T09:30:00+05:30", actor: "Priya Sharma", actorRole: "manager", action: "Posted directly (manager auth · sales voucher)" },
      { at: "2026-04-18T10:15:00+05:30", actor: "Riko → Tally", actorRole: "system", action: "Voucher accepted by Tally · VCH/2026-27/0142" },
    ],
  },
  {
    id: "e121",
    type: "receipt",
    state: "posted",
    amount: 125000,
    partyName: "Nykaa E-Retail Pvt Ltd",
    partyGstin: "27AAACN6153K1Z5",
    particulars: "Part payment · against Feb 2026 invoices",
    createdBy: "Nikhil Kumar",
    createdByRole: "accounts",
    createdAt: "2026-04-17T14:20:00+05:30",
    source: "bank-recon",
    date: "2026-04-17",
    ledgerImpact: [
      { ledger: "HDFC Bank - Current A/c", debit: 125000 },
      { ledger: "Nykaa E-Retail (Debtors)", credit: 125000 },
    ],
    voucherNumber: "VCH/2026-27/0138",
    postedAt: "2026-04-17T14:45:00+05:30",
    postedBy: "Sunil Shah",
    requiredApprover: "accounts",
    history: [
      { at: "2026-04-17T14:15:00+05:30", actor: "Nikhil Kumar", actorRole: "accounts", action: "Drafted from Bank Recon" },
      { at: "2026-04-17T14:20:00+05:30", actor: "Nikhil Kumar", actorRole: "accounts", action: "Submitted for approval" },
      { at: "2026-04-17T14:32:00+05:30", actor: "Sunil Shah", actorRole: "accounts-head", action: "Approved" },
      { at: "2026-04-17T14:40:00+05:30", actor: "Sunil Shah", actorRole: "accounts-head", action: "Posted to Tally" },
      { at: "2026-04-17T14:45:00+05:30", actor: "Riko → Tally", actorRole: "system", action: "Voucher accepted · VCH/2026-27/0138" },
    ],
  },
  {
    id: "e122",
    type: "purchase",
    state: "posted",
    amount: 163988,
    partyName: "GOOGLE INDIA PVT LTD",
    partyGstin: "29AACCG0527D1Z8",
    particulars: "Google Ads · Mar 2026",
    createdBy: "Kavya Iyer",
    createdByRole: "junior-accounts",
    createdAt: "2026-04-16T11:00:00+05:30",
    source: "ocr",
    date: "2026-03-30",
    ledgerImpact: [
      { ledger: "Advertising Expenses", debit: 139 * 1000 },
      { ledger: "Input IGST 18%", debit: 25000 },
      { ledger: "GOOGLE INDIA PVT LTD (Creditor)", credit: 163988 },
    ],
    taxComponents: { igst: 25000 },
    voucherNumber: "VCH/2026-27/0131",
    postedAt: "2026-04-16T12:30:00+05:30",
    postedBy: "Nikhil Kumar",
    requiredApprover: "accounts-head",
    history: [
      { at: "2026-04-16T10:50:00+05:30", actor: "Kavya Iyer", actorRole: "junior-accounts", action: "Uploaded bill · Google-G-4412.pdf" },
      { at: "2026-04-16T10:55:00+05:30", actor: "Riko OCR", actorRole: "system", action: "Extracted 10 fields · 98% avg confidence" },
      { at: "2026-04-16T11:00:00+05:30", actor: "Kavya Iyer", actorRole: "junior-accounts", action: "Submitted for approval" },
      { at: "2026-04-16T12:15:00+05:30", actor: "Sunil Shah", actorRole: "accounts-head", action: "Approved" },
      { at: "2026-04-16T12:25:00+05:30", actor: "Nikhil Kumar", actorRole: "accounts", action: "Posted to Tally" },
      { at: "2026-04-16T12:30:00+05:30", actor: "Riko → Tally", actorRole: "system", action: "Voucher accepted · VCH/2026-27/0131" },
    ],
  },
  {
    id: "e123",
    type: "journal",
    state: "posted",
    amount: 3400,
    partyName: "—",
    particulars: "Depreciation entry · Q4 FY25-26 · straight-line",
    createdBy: "Sunil Shah",
    createdByRole: "accounts-head",
    createdAt: "2026-03-31T18:00:00+05:30",
    source: "chat",
    date: "2026-03-31",
    ledgerImpact: [
      { ledger: "Depreciation", debit: 3400 },
      { ledger: "Accumulated Depreciation - Office Eqmt", credit: 3400 },
    ],
    voucherNumber: "VCH/2025-26/0398",
    postedAt: "2026-03-31T18:05:00+05:30",
    postedBy: "Sunil Shah",
    requiredApprover: "admin",
    history: [
      { at: "2026-03-31T17:55:00+05:30", actor: "Sunil Shah", actorRole: "accounts-head", action: "Drafted via chat" },
      { at: "2026-03-31T18:00:00+05:30", actor: "Sunil Shah", actorRole: "accounts-head", action: "Posted directly (override · year-end close)" },
      { at: "2026-03-31T18:05:00+05:30", actor: "Riko → Tally", actorRole: "system", action: "Voucher accepted · VCH/2025-26/0398" },
    ],
  },

  /* ── REJECTED ─────────────────────────────────────────────── */
  {
    id: "e130",
    type: "purchase",
    state: "rejected",
    amount: 128600,
    partyName: "Unknown Vendor",
    particulars: "Unverified invoice · no matching PO",
    createdBy: "Kavya Iyer",
    createdByRole: "junior-accounts",
    createdAt: "2026-04-15T14:00:00+05:30",
    source: "ocr",
    date: "2026-04-10",
    ledgerImpact: [
      { ledger: "Expenses - Uncategorized", debit: 109000 },
      { ledger: "Input GST (pending classification)", debit: 19600 },
      { ledger: "Unknown Vendor (Creditor)", credit: 128600 },
    ],
    requiredApprover: "accounts-head",
    rejectionReason:
      "Vendor not in master · GSTIN failed GSTN lookup · no PO reference on invoice. Please verify source + re-upload with a clear vendor name.",
    rejectedBy: "Sunil Shah",
    rejectedAt: "2026-04-15T15:30:00+05:30",
    history: [
      { at: "2026-04-15T13:55:00+05:30", actor: "Kavya Iyer", actorRole: "junior-accounts", action: "Uploaded bill · unknown-1.pdf" },
      { at: "2026-04-15T13:58:00+05:30", actor: "Riko OCR", actorRole: "system", action: "Extracted 8 fields · 54% avg confidence" },
      { at: "2026-04-15T14:00:00+05:30", actor: "Kavya Iyer", actorRole: "junior-accounts", action: "Submitted for approval" },
      { at: "2026-04-15T15:30:00+05:30", actor: "Sunil Shah", actorRole: "accounts-head", action: "Rejected", note: "Vendor not in master · GSTIN lookup failed · no PO reference" },
    ],
  },
];

/** Lookup: human-readable label + color per entry state. */
export const ENTRY_STATE_META: Record<EntryState, {
  label: string;
  color: string;
  bgColor: string;
}> = {
  draft: { label: "Draft", color: "var(--text-3)", bgColor: "var(--bg-hover)" },
  pending: { label: "Pending approval", color: "var(--yellow)", bgColor: "color-mix(in srgb, var(--yellow) 12%, transparent)" },
  approved: { label: "Approved · awaiting post", color: "var(--blue)", bgColor: "color-mix(in srgb, var(--blue) 12%, transparent)" },
  posted: { label: "Posted to Tally", color: "var(--green)", bgColor: "color-mix(in srgb, var(--green) 12%, transparent)" },
  rejected: { label: "Rejected", color: "var(--red)", bgColor: "color-mix(in srgb, var(--red) 12%, transparent)" },
};

/** Human-readable label per entry type. */
export const ENTRY_TYPE_LABELS: Record<EntryType, string> = {
  sales: "Sales voucher",
  purchase: "Purchase voucher",
  receipt: "Receipt voucher",
  payment: "Payment voucher",
  contra: "Contra voucher",
  journal: "Journal voucher",
  "credit-note": "Credit note",
  "debit-note": "Debit note",
  "stock-journal": "Stock journal",
  "bank-recon": "Bank recon entry",
};

/** Human-readable label per entry source. */
export const ENTRY_SOURCE_LABELS: Record<EntrySource, string> = {
  chat: "Chat",
  daybook: "Day Book",
  ocr: "OCR upload",
  "bank-recon": "Bank recon",
  bulk: "Bulk import",
};

/** Sample OCR extraction for the Upload & OCR screen demo (before the
 *  user clicks "Save as Draft" this represents the AI's extraction in
 *  progress). Fields with confidence < 0.85 get yellow "Verify" highlight. */
export const OCR_SAMPLE = {
  fileName: "Patel-Traders-Invoice-2301.pdf",
  pageCount: 1,
  extractedAt: "just now",
  fields: {
    vendorName: { value: "Patel Raw Materials Ltd", confidence: 0.98 },
    gstin: { value: "27AACCP4432N1Z9", confidence: 0.99 },
    invoiceNumber: { value: "PTL-2301", confidence: 0.95 },
    invoiceDate: { value: "2026-04-15", confidence: 0.88 },
    subtotal: { value: 98500, confidence: 0.99 },
    cgst: { value: 8865, confidence: 0.94 },
    sgst: { value: 8865, confidence: 0.94 },
    total: { value: 116230, confidence: 0.99 },
    category: { value: "Raw Materials", confidence: 0.76 },
    paymentDueDate: { value: "2026-05-30", confidence: 0.72 },
  },
  lineItems: [
    { description: "Shea butter (food grade)", hsn: "15159091", qty: 50, unit: "kg", rate: 1450, amount: 72500, confidence: 0.91 },
    { description: "Essential oil blend — Lavender", hsn: "33012990", qty: 12, unit: "ltr", rate: 2166, amount: 25992, confidence: 0.86 },
  ],
};

/* ═══════════════════════════════════════════════════════════════
   Chat upload samples — drives the "attach file in chat" flow.
   Single PDFs → route to specific Tally voucher types.
   Batch CSV/Excel → route to multiple entries via Entries queue.
   These are DEMO samples: filename-pattern → pre-computed result.
   ═══════════════════════════════════════════════════════════════ */

/** Kind of upload Riko recognized from the filename. Drives the
 *  Exchange card that renders in the chat + the routing to the
 *  right Tally voucher. */
export type UploadKind =
  | "bill" // single PDF invoice/bill → Purchase voucher draft
  | "invoice" // single PDF outward invoice → Sales voucher draft
  | "bank-statement" // PDF bank statement → Receipt/Payment + Bank Recon matches
  | "batch-sales" // CSV/Excel of multiple sales rows
  | "batch-purchase" // CSV/Excel of multiple purchase rows
  | "batch-receipt" // CSV/Excel of collection receipts
  | "batch-expense" // CSV/Excel of expense vouchers
  | "batch-inventory"; // CSV/Excel of stock-journal rows

export interface UploadKindMeta {
  /** Short label shown on the pill (e.g. "Purchase bill"). */
  label: string;
  /** Tally voucher this upload type becomes. */
  voucherType: EntryType;
  /** Emoji icon for the card header. */
  icon: string;
  /** One-liner Riko shows describing what it'll do. */
  description: string;
  /** Filename hints that match this kind. Keep lowercased. */
  hints: string[];
}

export const UPLOAD_KIND_META: Record<UploadKind, UploadKindMeta> = {
  bill: {
    label: "Purchase bill",
    voucherType: "purchase",
    icon: "🧾",
    description: "Extract vendor, GSTIN, line items, and tax → draft a Purchase voucher.",
    hints: ["bill", "invoice-in", "purchase", "vendor", "shiprocket", "amazon", "google"],
  },
  invoice: {
    label: "Outward invoice",
    voucherType: "sales",
    icon: "📄",
    description: "Extract buyer, HSN codes, and tax → draft a Sales voucher.",
    hints: ["sales", "invoice-out", "outward", "tax-invoice"],
  },
  "bank-statement": {
    label: "Bank statement",
    voucherType: "bank-recon",
    icon: "🏦",
    description: "Match debits → Payment vouchers, credits → Receipt vouchers, flag unmatched for review.",
    hints: ["statement", "hdfc", "icici", "axis", "sbi", "passbook", "bank-stmt"],
  },
  "batch-sales": {
    label: "Sales batch",
    voucherType: "sales",
    icon: "📊",
    description: "Every row becomes a Sales voucher. Party-master matched + HSN-coded.",
    hints: ["sales-batch", "invoices", "orders", "website", "shopify", "d2c"],
  },
  "batch-purchase": {
    label: "Purchase batch",
    voucherType: "purchase",
    icon: "📥",
    description: "Every row becomes a Purchase voucher. Flagged if GSTIN fails GSTN lookup.",
    hints: ["purchases", "purchase-batch", "vendor-bills"],
  },
  "batch-receipt": {
    label: "Receipts batch",
    voucherType: "receipt",
    icon: "💰",
    description: "Every row becomes a Receipt voucher against the matching Debtor.",
    hints: ["receipts", "collections", "payments-in", "razorpay", "paytm", "stripe"],
  },
  "batch-expense": {
    label: "Expense batch",
    voucherType: "payment",
    icon: "💸",
    description: "Every row becomes a Payment voucher under the matched expense ledger.",
    hints: ["expense", "expenses", "petty-cash", "reimbursement"],
  },
  "batch-inventory": {
    label: "Inventory update",
    voucherType: "stock-journal",
    icon: "📦",
    description: "Every row becomes a Stock Journal — opening/closing adjustments, transfers, writeoffs.",
    hints: ["inventory", "stock", "sku", "warehouse", "transfer", "wms"],
  },
};

/** Heuristic: given a filename, guess the upload kind. If nothing
 *  matches, fall back to "bill" for PDFs and "batch-sales" for
 *  CSV/Excel (the most common cases). */
export function classifyUpload(fileName: string): UploadKind {
  const name = fileName.toLowerCase();
  const isPdf = name.endsWith(".pdf");
  const isBatch = /\.(csv|xls|xlsx)$/.test(name);

  if (isPdf) {
    if (UPLOAD_KIND_META["bank-statement"].hints.some((h) => name.includes(h)))
      return "bank-statement";
    if (UPLOAD_KIND_META.invoice.hints.some((h) => name.includes(h)))
      return "invoice";
    return "bill";
  }
  if (isBatch) {
    if (UPLOAD_KIND_META["batch-inventory"].hints.some((h) => name.includes(h)))
      return "batch-inventory";
    if (UPLOAD_KIND_META["batch-expense"].hints.some((h) => name.includes(h)))
      return "batch-expense";
    if (UPLOAD_KIND_META["batch-receipt"].hints.some((h) => name.includes(h)))
      return "batch-receipt";
    if (UPLOAD_KIND_META["batch-purchase"].hints.some((h) => name.includes(h)))
      return "batch-purchase";
    return "batch-sales";
  }
  // Unknown extension — default to bill, let user confirm.
  return "bill";
}

/* ── Bank statement upload sample — 14 lines, 9 matched, 5 flagged ── */
export const BANK_STATEMENT_UPLOAD = {
  fileName: "HDFC-Stmt-Mar2026.pdf",
  accountNumber: "HDFC-Current-****6782",
  period: "1 Mar – 31 Mar 2026",
  totalLines: 14,
  matched: 9,
  unmatched: 5,
  openingBalance: 184_500,
  closingBalance: 560_320,
  netFlow: 560_320 - 184_500,
  lines: [
    { date: "2026-03-02", description: "NEFT-Nykaa E-Retail-NEFT/034822", amount: 125_000, type: "credit" as const, match: "Receipt · Nykaa Feb settlement", confidence: 0.98 },
    { date: "2026-03-03", description: "UPI-RZR-Razorpay PGW", amount: 46_250, type: "credit" as const, match: "Receipt · Website D2C batch", confidence: 0.96 },
    { date: "2026-03-05", description: "IMPS-PAYTM-One97 Settle", amount: 89_000, type: "credit" as const, match: "Receipt · Paytm daily settlement", confidence: 0.94 },
    { date: "2026-03-07", description: "RTGS-Amazon-AMZN IN Pay", amount: 182_400, type: "credit" as const, match: "Receipt · Amazon payout batch 12", confidence: 0.97 },
    { date: "2026-03-08", description: "NEFT-Shiprocket-SHIPROCKET", amount: 32_100, type: "debit" as const, match: "Payment · against bill SR-2301", confidence: 0.95 },
    { date: "2026-03-10", description: "UPI-FRESHDESK-Freshworks", amount: 14_850, type: "debit" as const, match: null, confidence: 0.0 },
    { date: "2026-03-12", description: "NEFT-Google India-ADS", amount: 163_988, type: "debit" as const, match: "Payment · Google Ads Mar", confidence: 0.99 },
    { date: "2026-03-14", description: "UPI-RZR-Razorpay PGW", amount: 92_400, type: "credit" as const, match: "Receipt · Website D2C batch", confidence: 0.94 },
    { date: "2026-03-16", description: "Cash DEP-Branch 4422", amount: 50_000, type: "credit" as const, match: null, confidence: 0.0 },
    { date: "2026-03-18", description: "IMPS-MUMBAI PACKAGING", amount: 58_400, type: "debit" as const, match: "Payment · MPL-3301 invoice", confidence: 0.93 },
    { date: "2026-03-22", description: "UPI-UNKNOWN-UPI/932211", amount: 8_200, type: "debit" as const, match: null, confidence: 0.0 },
    { date: "2026-03-25", description: "NEFT-Nykaa E-Retail-NEFT/042918", amount: 142_880, type: "credit" as const, match: "Receipt · Nykaa Mar pt 1", confidence: 0.97 },
    { date: "2026-03-28", description: "Chq-Cleared 002314", amount: 36_500, type: "debit" as const, match: null, confidence: 0.0 },
    { date: "2026-03-30", description: "Bank Charges-QTR", amount: 1_240, type: "debit" as const, match: null, confidence: 0.0 },
  ],
};

/* ── Batch upload samples — show what "42 rows → 42 vouchers" looks like ── */
export interface BatchUploadRow {
  partyName: string;
  particulars: string;
  amount: number;
  status: "ok" | "warning" | "error"; // ok = auto-drafted, warning = needs review, error = skipped
  note?: string; // why warning/error
}

export interface BatchUploadSample {
  kind: UploadKind;
  fileName: string;
  totalRows: number;
  okCount: number; // auto-drafted
  warnCount: number; // drafted but needs review
  errorCount: number; // skipped
  totalValue: number;
  columns: string[]; // what we detected in the file
  rows: BatchUploadRow[]; // preview of first ~6 rows
}

export const BATCH_UPLOAD_SAMPLES: Record<Exclude<UploadKind, "bill" | "invoice" | "bank-statement">, BatchUploadSample> = {
  "batch-sales": {
    kind: "batch-sales",
    fileName: "Website-Orders-Mar-2026.csv",
    totalRows: 184,
    okCount: 176,
    warnCount: 6,
    errorCount: 2,
    totalValue: 18_46_300,
    columns: ["order_id", "customer_name", "customer_pan", "state", "hsn", "qty", "rate", "cgst", "sgst", "igst", "total"],
    rows: [
      { partyName: "Priya Shetty", particulars: "ORD-9821 · Face Wash 100ml ×2", amount: 712, status: "ok" },
      { partyName: "Rahul Sharma", particulars: "ORD-9822 · Serum 30ml ×1, Sunscreen ×1", amount: 1_340, status: "ok" },
      { partyName: "Anjali Menon", particulars: "ORD-9823 · Hair Oil 200ml ×3", amount: 1_428, status: "ok" },
      { partyName: "Sandeep K.", particulars: "ORD-9824 · gift-hamper", amount: 2_890, status: "warning", note: "HSN missing for hamper — defaulted to 33049990" },
      { partyName: "Meera Jain", particulars: "ORD-9825 · Face Wash ×5", amount: 1_780, status: "ok" },
      { partyName: "—", particulars: "ORD-9826 · invalid customer", amount: 980, status: "error", note: "No customer_name in row 84" },
    ],
  },
  "batch-purchase": {
    kind: "batch-purchase",
    fileName: "Vendor-Bills-April.xlsx",
    totalRows: 34,
    okCount: 29,
    warnCount: 4,
    errorCount: 1,
    totalValue: 8_92_450,
    columns: ["vendor", "gstin", "invoice_no", "date", "hsn_or_sac", "taxable", "cgst", "sgst", "igst", "total"],
    rows: [
      { partyName: "Mumbai Packaging Ltd", particulars: "INV-3301 · secondary packaging", amount: 58_400, status: "ok" },
      { partyName: "Shiprocket Logistics", particulars: "SR-2412 · Apr freight pt 1", amount: 18_200, status: "ok" },
      { partyName: "GOOGLE INDIA PVT LTD", particulars: "G-4499 · Ads Apr", amount: 81_720, status: "ok" },
      { partyName: "Raw Supplier Co", particulars: "RSC-22 · essential oils", amount: 43_100, status: "warning", note: "GSTIN failed GSTN lookup — verify before posting" },
      { partyName: "Unknown Vendor", particulars: "—", amount: 12_800, status: "error", note: "Vendor not in master + no GSTIN" },
      { partyName: "Freshworks India", particulars: "FD-88112 · CRM April", amount: 14_850, status: "ok" },
    ],
  },
  "batch-receipt": {
    kind: "batch-receipt",
    fileName: "Razorpay-Settlements-Apr.csv",
    totalRows: 62,
    okCount: 60,
    warnCount: 2,
    errorCount: 0,
    totalValue: 14_86_200,
    columns: ["settlement_id", "utr", "date", "amount", "fees", "tax_on_fees", "net"],
    rows: [
      { partyName: "Razorpay Settlement", particulars: "STL-9012 · 5 Apr · net of fees", amount: 92_400, status: "ok" },
      { partyName: "Razorpay Settlement", particulars: "STL-9023 · 6 Apr", amount: 46_250, status: "ok" },
      { partyName: "Razorpay Settlement", particulars: "STL-9034 · 7 Apr", amount: 1_18_900, status: "ok" },
      { partyName: "Razorpay Settlement", particulars: "STL-9045 · 8 Apr", amount: 84_200, status: "warning", note: "Fees above expected 2% — verify MDR" },
      { partyName: "Razorpay Settlement", particulars: "STL-9056 · 9 Apr", amount: 67_110, status: "ok" },
      { partyName: "Razorpay Settlement", particulars: "STL-9067 · 10 Apr", amount: 1_14_500, status: "ok" },
    ],
  },
  "batch-expense": {
    kind: "batch-expense",
    fileName: "Petty-Cash-March.xlsx",
    totalRows: 48,
    okCount: 42,
    warnCount: 5,
    errorCount: 1,
    totalValue: 1_24_820,
    columns: ["date", "description", "category", "amount", "paid_by", "bill_ref"],
    rows: [
      { partyName: "Cab expenses", particulars: "Ola/Uber · client meetings × 8", amount: 8_420, status: "ok" },
      { partyName: "Tea & coffee", particulars: "Office pantry weekly", amount: 3_100, status: "ok" },
      { partyName: "Courier", particulars: "Outbound samples · Blue Dart", amount: 6_280, status: "ok" },
      { partyName: "Meal · team offsite", particulars: "Lunch · Tribhuvan", amount: 12_400, status: "warning", note: "Above ₹10K — needs bill attached" },
      { partyName: "Misc printing", particulars: "Carton labels · 1200 pcs", amount: 4_200, status: "ok" },
      { partyName: "—", particulars: "Uncategorized", amount: 2_800, status: "error", note: "Category blank on row 33" },
    ],
  },
  "batch-inventory": {
    kind: "batch-inventory",
    fileName: "Warehouse-Closing-Apr.csv",
    totalRows: 211,
    okCount: 203,
    warnCount: 7,
    errorCount: 1,
    totalValue: 18_32_100, // valuation delta, not gross value
    columns: ["sku", "sku_name", "godown", "opening_qty", "closing_qty", "adjustment", "reason", "rate"],
    rows: [
      { partyName: "Riko Face Wash 100ml", particulars: "SKU-FW-001 · Bhiwandi WH · -14 units", amount: -3_990, status: "ok", note: "Write-off · damaged" },
      { partyName: "Riko Serum 30ml", particulars: "SKU-SR-002 · Bhiwandi → Chennai · 40 units", amount: 0, status: "ok", note: "Inter-godown transfer" },
      { partyName: "Riko Hair Oil 200ml", particulars: "SKU-HO-003 · Chennai WH · +60 units", amount: 28_560, status: "ok", note: "Stock receipt from production" },
      { partyName: "Riko Sunscreen 60ml", particulars: "SKU-SS-004 · Bhiwandi · -8 units", amount: -5_120, status: "warning", note: "Expiry writeoff — needs Accounts Head sign-off" },
      { partyName: "Riko Gift Hamper", particulars: "SKU-GH-010 · New SKU", amount: 0, status: "warning", note: "No opening qty — create SKU master first" },
      { partyName: "—", particulars: "—", amount: 0, status: "error", note: "Row 177 has no SKU code" },
    ],
  },
};

/** Single-PDF bill extraction sample (reuses OCR_SAMPLE shape but keeps a
 *  chat-specific filename + vendor so demo doesn't feel repetitive).
 *  Drives ExchangeUploadBill in the chat. */
export const CHAT_BILL_UPLOAD = {
  fileName: "Shiprocket-SR-2412.pdf",
  vendorName: "Shiprocket Logistics",
  gstin: "07AAGCS5867P1Z9",
  invoiceNumber: "SR-2412",
  invoiceDate: "2026-04-18",
  total: 18_200,
  cgst: 1_388,
  sgst: 1_388,
  taxable: 15_424,
  voucherType: "purchase" as EntryType,
  ledgerImpact: [
    { ledger: "Freight & Logistics", debit: 15_424 },
    { ledger: "Input CGST 9%", debit: 1_388 },
    { ledger: "Input SGST 9%", debit: 1_388 },
    { ledger: "Shiprocket Logistics (Creditor)", credit: 18_200 },
  ],
  confidence: 0.94,
  lowConfidenceFields: ["HSN/SAC code"],
};

/** Single outward invoice sample. */
export const CHAT_INVOICE_UPLOAD = {
  fileName: "Invoice-Nykaa-Apr-2026.pdf",
  buyerName: "Nykaa E-Retail Pvt Ltd",
  gstin: "27AAACN6153K1Z5",
  invoiceNumber: "RSK/2026-27/042",
  invoiceDate: "2026-04-19",
  total: 3_42_100,
  igst: 52_185,
  taxable: 2_89_915,
  voucherType: "sales" as EntryType,
  ledgerImpact: [
    { ledger: "Nykaa E-Retail (Debtors)", debit: 3_42_100 },
    { ledger: "Sales — Marketplace", credit: 2_89_915 },
    { ledger: "Output IGST 18%", credit: 52_185 },
  ],
  confidence: 0.97,
  lowConfidenceFields: [],
};

/* ═══════════════════════════════════════════════════════════════
   Payment Reminders — drives the AR/AP Outstanding reminder UX
   (per Payment Reminder PRD v2.0). Mock data only; real send
   path goes through MSG91 + Supabase in the production stack.
   ═══════════════════════════════════════════════════════════════ */

/** Source of a party's contact info. "tally" = synced from Tally
 *  master, "manual" = entered by the user (via side-panel or bulk
 *  import). "none" = we don't have a number yet. */
export type ContactSource = "tally" | "manual" | "none";

export interface PartyContact {
  /** Matches a RECEIVABLES.name — used as the join key. */
  partyName: string;
  phone?: string;
  email?: string;
  contactPerson?: string;
  source: ContactSource;
  /** If the party replied STOP to a WhatsApp reminder, we flag
   *  them and disable future automated sends. */
  optedOut?: boolean;
}

/** The 4-tier tone ladder (PRD §3.2 — the existing 3-tier system
 *  enhanced with a Final tier for 180d+ dues). */
export type ReminderTone = "gentle" | "standard" | "firm" | "final";
export type ReminderChannel = "whatsapp" | "email" | "sms";

export interface ReminderTemplate {
  tone: ReminderTone;
  label: string;
  daysBucket: string; // Human label: "7 days", "8-30 days"…
  channel: ReminderChannel;
  /** The raw template. Replace `{party_name}`, `{invoice_no}`,
   *  `{net_amount}`, `{due_date}`, `{days_overdue}`, `{company_name}`,
   *  `{bill_count}`, `{total_net_amount}`, `{oldest_invoice_no}`,
   *  `{oldest_date}` when rendering preview. */
  body: string;
}

/** All 12 canonical templates (3 tones × 3 channels + 3 extra for
 *  the new Final tier). Channels: WA, Email, SMS. Body uses
 *  PRD-approved wording with the fixes applied (FY suffix stripped,
 *  invoice number included, no "Despite our earlier communications"). */
export const REMINDER_TEMPLATES: ReminderTemplate[] = [
  {
    tone: "gentle", label: "Gentle", daysBucket: "≤ 7 days", channel: "whatsapp",
    body: "Dear {party_name}, a gentle reminder that Invoice #{invoice_no} for {net_amount} was due on {due_date}. Kindly arrange payment at your convenience. — {company_name}",
  },
  {
    tone: "standard", label: "Standard", daysBucket: "8 – 30 days", channel: "whatsapp",
    body: "Dear {party_name}, Invoice #{invoice_no} for {net_amount} remains unpaid since {due_date} ({days_overdue} days). We request you to clear this at the earliest. — {company_name}",
  },
  {
    tone: "firm", label: "Firm", daysBucket: "31 – 180 days", channel: "whatsapp",
    body: "Dear {party_name}, this is a follow-up for {net_amount} outstanding since {due_date}. Please contact us urgently to resolve this. — {company_name}",
  },
  {
    tone: "final", label: "Final", daysBucket: "180+ days", channel: "whatsapp",
    body: "Dear {party_name}, final reminder: {net_amount} has been outstanding since {due_date}. Please clear this urgently or contact us to discuss a payment arrangement. — {company_name}",
  },
  {
    tone: "gentle", label: "Gentle · Email", daysBucket: "≤ 7 days", channel: "email",
    body: "Subject: Payment reminder — Invoice #{invoice_no}\n\nDear {party_name},\n\nThis is a gentle reminder that Invoice #{invoice_no} for {net_amount} was due on {due_date}. We'd appreciate your help in clearing this at your earliest convenience.\n\nPlease let us know if you need a fresh copy of the invoice.\n\nRegards,\n{company_name}",
  },
  {
    tone: "standard", label: "Standard · Email", daysBucket: "8 – 30 days", channel: "email",
    body: "Subject: Outstanding — Invoice #{invoice_no} ({days_overdue} days overdue)\n\nDear {party_name},\n\nInvoice #{invoice_no} for {net_amount} has been unpaid since {due_date} — {days_overdue} days past due. Please arrange payment at the earliest and share the UTR for reconciliation.\n\nRegards,\n{company_name}",
  },
  {
    tone: "firm", label: "Firm · Email", daysBucket: "31 – 180 days", channel: "email",
    body: "Subject: Urgent — {net_amount} outstanding\n\nDear {party_name},\n\n{net_amount} remains outstanding since {due_date}. We've extended our usual payment window and need to resolve this now. Please share an update or payment confirmation by return mail.\n\nRegards,\n{company_name}",
  },
  {
    tone: "final", label: "Final · Email", daysBucket: "180+ days", channel: "email",
    body: "Subject: Final notice — {net_amount} overdue since {due_date}\n\nDear {party_name},\n\nThis is a final notice. {net_amount} has been outstanding for over 180 days from {due_date}. We need either payment or a formal payment arrangement within 7 days to avoid escalation.\n\nRegards,\n{company_name}",
  },
  {
    tone: "gentle", label: "Gentle · SMS", daysBucket: "≤ 7 days", channel: "sms",
    body: "{company_name}: Invoice #{invoice_no} for {net_amount} due {due_date}. Kindly arrange payment.",
  },
  {
    tone: "standard", label: "Standard · SMS", daysBucket: "8 – 30 days", channel: "sms",
    body: "{company_name}: {net_amount} outstanding since {due_date} ({days_overdue}d). Please clear at earliest.",
  },
  {
    tone: "firm", label: "Firm · SMS", daysBucket: "31 – 180 days", channel: "sms",
    body: "{company_name}: Urgent — {net_amount} outstanding since {due_date}. Please contact us.",
  },
  {
    tone: "final", label: "Final · SMS", daysBucket: "180+ days", channel: "sms",
    body: "{company_name}: FINAL — {net_amount} overdue since {due_date}. Clear or contact us within 7 days.",
  },
];

/** Multi-bill variant used when a party has more than one unpaid
 *  invoice. Surfaced by the preview modal when bill_count > 1. */
export const REMINDER_MULTI_BILL_SUFFIX =
  "You have {bill_count} unpaid invoices totalling {total_net_amount}. Oldest: #{oldest_invoice_no} from {oldest_date}.";

/** Recommend a tone based on days overdue (the ladder itself). */
export function recommendTone(daysOverdue: number): ReminderTone {
  if (daysOverdue <= 7) return "gentle";
  if (daysOverdue <= 30) return "standard";
  if (daysOverdue <= 180) return "firm";
  return "final";
}

/** Render a template's body with the given variables replaced. Used
 *  by the Preview modal so the user sees the actual message that'll
 *  go out. */
export function renderTemplate(
  body: string,
  vars: Record<string, string | number>,
): string {
  return body.replace(/\{(\w+)\}/g, (_, key) => {
    const v = vars[key];
    return v === undefined ? `{${key}}` : String(v);
  });
}

/** Clean up a company name for reminder templates — strips the
 *  financial-year suffix like "Bandra Soap Pvt Ltd(2020-2024)".
 *  (PRD §3.1) */
export function cleanCompanyName(raw: string): string {
  return raw.replace(/\s*\(\d{4}-\d{4}\)\s*$/, "").trim();
}

/** Per-party reminder configuration. Mirrors the
 *  reminder_settings table in the PRD. */
export interface ReminderSettings {
  partyName: string;
  /** Master on/off switch. Locked to false if the party has no phone. */
  enabled: boolean;
  /** How often the cron loop fires for this party (in days). */
  frequencyDays: 3 | 5 | 7 | 14 | 30;
  channels: ReminderChannel[];
  /** "auto" lets the tone ladder pick based on overdue days. */
  tone: "auto" | ReminderTone;
  /** If set, cron skips this party until this date. */
  pauseUntil?: string;
  /** Hard cap on automated sends before flagging for manual. */
  maxReminders: number;
  /** Count of sends so far (used against maxReminders). */
  sendsSoFar: number;
  /** Next scheduled reminder date (ISO). */
  nextReminderAt?: string;
  /** Last payment date — used by the stop-on-payment rule. */
  lastPaymentAt?: string;
}

export type ReminderStatus =
  | "sent" // delivered to MSG91
  | "delivered" // WhatsApp double-tick
  | "read" // WhatsApp blue-tick
  | "replied" // customer responded
  | "failed" // MSG91 error
  | "opted-out"; // customer replied STOP

export interface ReminderHistoryItem {
  id: string;
  partyName: string;
  sentAt: string; // ISO
  channel: ReminderChannel;
  tone: ReminderTone;
  status: ReminderStatus;
  /** First 80 chars of the message body for the timeline. */
  messagePreview: string;
  /** Days the bill was overdue at send time — for sorting. */
  daysOverdueAtSend: number;
  /** The bills this reminder covered. */
  billsCovered: number;
  netAmountAtSend: number;
}

/* ── Party contacts — backfilled for the 10 RECEIVABLES parties ── */
export const PARTY_CONTACTS: PartyContact[] = [
  {
    partyName: "Nykaa E-Retail Pvt Ltd",
    phone: "+91 98200 44112",
    email: "ar-mumbai@nykaa.com",
    contactPerson: "Sakshi Rao",
    source: "tally",
  },
  {
    partyName: "Website Debtors",
    // Aggregated ledger — no single phone. Owner flagged manual.
    source: "none",
  },
  {
    partyName: "LLC Olimpiya",
    phone: "+7 495 123 45 67",
    email: "acct@olimpiya.ru",
    contactPerson: "Dmitri Olimpov",
    source: "manual",
  },
  {
    partyName: "One97 Communications (Paytm)",
    phone: "+91 99870 55102",
    email: "vendor-payments@paytm.com",
    contactPerson: "Rahul Kohli",
    source: "tally",
  },
  {
    partyName: "Prodsol Biotech Pvt Ltd",
    phone: "+91 98765 33221",
    email: "accounts@prodsol.in",
    contactPerson: "Meena Shah",
    source: "tally",
    optedOut: true, // replied STOP
  },
  {
    partyName: "Nykaa E-Retail (2)",
    phone: "+91 98200 44112",
    email: "ar-mumbai@nykaa.com",
    contactPerson: "Sakshi Rao",
    source: "tally",
  },
  {
    partyName: "Scale Global Debtors",
    // Known party but missed during Tally sync.
    source: "none",
  },
  {
    partyName: "Buy More (Counfreedise)",
    phone: "+91 87890 11220",
    source: "manual",
  },
  {
    partyName: "NYKAA Mumbai 2",
    phone: "+91 98200 44112",
    source: "tally",
  },
  {
    partyName: "Bigfoot/Shiprocket",
    phone: "+91 90042 00111",
    email: "ar@shiprocket.com",
    contactPerson: "Varun Bhalla",
    source: "tally",
  },
];

/** Helper to fetch a contact for a party (falls back to none). */
export function getPartyContact(partyName: string): PartyContact {
  return (
    PARTY_CONTACTS.find((c) => c.partyName === partyName) ?? {
      partyName,
      source: "none" as ContactSource,
    }
  );
}

/* ── Per-party reminder settings — demo seeds ── */
export const REMINDER_SETTINGS: ReminderSettings[] = [
  {
    partyName: "Nykaa E-Retail Pvt Ltd",
    enabled: true,
    frequencyDays: 7,
    channels: ["whatsapp", "email"],
    tone: "auto",
    maxReminders: 5,
    sendsSoFar: 4,
    nextReminderAt: "2026-04-27",
    lastPaymentAt: "2026-02-18",
  },
  {
    partyName: "One97 Communications (Paytm)",
    enabled: true,
    frequencyDays: 14,
    channels: ["whatsapp"],
    tone: "firm",
    maxReminders: 5,
    sendsSoFar: 3,
    nextReminderAt: "2026-05-04",
    pauseUntil: "2026-05-01", // paused while relationship manager contacts
  },
  {
    partyName: "LLC Olimpiya",
    enabled: false, // 180+ days — flagged for manual action
    frequencyDays: 7,
    channels: ["email"],
    tone: "final",
    maxReminders: 3,
    sendsSoFar: 0,
  },
  {
    partyName: "Bigfoot/Shiprocket",
    enabled: true,
    frequencyDays: 7,
    channels: ["whatsapp", "email"],
    tone: "auto",
    maxReminders: 5,
    sendsSoFar: 2,
    nextReminderAt: "2026-04-25",
  },
  {
    partyName: "Prodsol Biotech Pvt Ltd",
    enabled: false, // opted out — respect STOP reply
    frequencyDays: 7,
    channels: ["whatsapp"],
    tone: "auto",
    maxReminders: 5,
    sendsSoFar: 2,
  },
  {
    partyName: "Buy More (Counfreedise)",
    enabled: true,
    frequencyDays: 14,
    channels: ["whatsapp"],
    tone: "standard",
    maxReminders: 4,
    sendsSoFar: 1,
    nextReminderAt: "2026-04-28",
  },
  {
    partyName: "Nykaa E-Retail (2)",
    enabled: true,
    frequencyDays: 7,
    channels: ["whatsapp"],
    tone: "auto",
    maxReminders: 5,
    sendsSoFar: 2,
    nextReminderAt: "2026-04-26",
  },
  {
    partyName: "NYKAA Mumbai 2",
    enabled: true,
    frequencyDays: 7,
    channels: ["whatsapp"],
    tone: "auto",
    maxReminders: 5,
    sendsSoFar: 1,
    nextReminderAt: "2026-04-27",
  },
];

export function getReminderSettings(partyName: string): ReminderSettings | undefined {
  return REMINDER_SETTINGS.find((r) => r.partyName === partyName);
}

/* ── Reminder history — who got reminded when, with which channel ── */
export const REMINDER_HISTORY: ReminderHistoryItem[] = [
  { id: "rh-1", partyName: "Nykaa E-Retail Pvt Ltd", sentAt: "2026-04-13T10:02:00+05:30", channel: "whatsapp", tone: "firm", status: "read", messagePreview: "Dear Nykaa, this is a follow-up for ₹12.6L outstanding since…", daysOverdueAtSend: 2189, billsCovered: 298, netAmountAtSend: 1261337 },
  { id: "rh-2", partyName: "Nykaa E-Retail Pvt Ltd", sentAt: "2026-04-06T10:02:00+05:30", channel: "whatsapp", tone: "firm", status: "delivered", messagePreview: "Dear Nykaa, this is a follow-up for ₹12.6L outstanding since…", daysOverdueAtSend: 2182, billsCovered: 298, netAmountAtSend: 1261337 },
  { id: "rh-3", partyName: "Nykaa E-Retail Pvt Ltd", sentAt: "2026-03-30T10:02:00+05:30", channel: "email", tone: "firm", status: "replied", messagePreview: "Subject: Urgent — ₹12.6L outstanding. Dear Nykaa, …", daysOverdueAtSend: 2175, billsCovered: 298, netAmountAtSend: 1261337 },
  { id: "rh-4", partyName: "Nykaa E-Retail Pvt Ltd", sentAt: "2026-03-23T10:02:00+05:30", channel: "whatsapp", tone: "standard", status: "read", messagePreview: "Dear Nykaa, Invoice #NYK-2301 for ₹12.6L remains unpaid since…", daysOverdueAtSend: 2168, billsCovered: 298, netAmountAtSend: 1261337 },
  { id: "rh-5", partyName: "Nykaa E-Retail Pvt Ltd", sentAt: "2026-03-16T10:02:00+05:30", channel: "whatsapp", tone: "standard", status: "delivered", messagePreview: "Dear Nykaa, Invoice #NYK-2301 for ₹12.6L remains unpaid since…", daysOverdueAtSend: 2161, billsCovered: 298, netAmountAtSend: 1261337 },

  { id: "rh-6", partyName: "One97 Communications (Paytm)", sentAt: "2026-04-20T10:02:00+05:30", channel: "whatsapp", tone: "firm", status: "delivered", messagePreview: "Dear One97 Communications, this is a follow-up for ₹3.55L outstanding…", daysOverdueAtSend: 2132, billsCovered: 180, netAmountAtSend: 355000 },
  { id: "rh-7", partyName: "One97 Communications (Paytm)", sentAt: "2026-04-06T10:02:00+05:30", channel: "whatsapp", tone: "firm", status: "sent", messagePreview: "Dear One97 Communications, this is a follow-up for ₹3.55L outstanding…", daysOverdueAtSend: 2118, billsCovered: 180, netAmountAtSend: 355000 },
  { id: "rh-8", partyName: "One97 Communications (Paytm)", sentAt: "2026-03-23T10:02:00+05:30", channel: "whatsapp", tone: "firm", status: "read", messagePreview: "Dear One97 Communications, this is a follow-up for ₹3.55L outstanding…", daysOverdueAtSend: 2104, billsCovered: 180, netAmountAtSend: 355000 },

  { id: "rh-9", partyName: "Bigfoot/Shiprocket", sentAt: "2026-04-18T10:02:00+05:30", channel: "email", tone: "final", status: "delivered", messagePreview: "Subject: Final notice — ₹1.78L overdue since…", daysOverdueAtSend: 2166, billsCovered: 173, netAmountAtSend: 177730 },
  { id: "rh-10", partyName: "Bigfoot/Shiprocket", sentAt: "2026-04-11T10:02:00+05:30", channel: "whatsapp", tone: "final", status: "read", messagePreview: "Dear Bigfoot, final reminder: ₹1.78L has been outstanding since…", daysOverdueAtSend: 2159, billsCovered: 173, netAmountAtSend: 177730 },

  { id: "rh-11", partyName: "Nykaa E-Retail (2)", sentAt: "2026-04-19T10:02:00+05:30", channel: "whatsapp", tone: "firm", status: "sent", messagePreview: "Dear Nykaa, this is a follow-up for ₹3.06L outstanding since…", daysOverdueAtSend: 2132, billsCovered: 60, netAmountAtSend: 306667 },
  { id: "rh-12", partyName: "NYKAA Mumbai 2", sentAt: "2026-04-20T10:02:00+05:30", channel: "whatsapp", tone: "firm", status: "delivered", messagePreview: "Dear NYKAA Mumbai 2, this is a follow-up for ₹2.93L outstanding since…", daysOverdueAtSend: 2132, billsCovered: 35, netAmountAtSend: 292810 },

  { id: "rh-13", partyName: "Prodsol Biotech Pvt Ltd", sentAt: "2026-03-01T10:02:00+05:30", channel: "whatsapp", tone: "standard", status: "opted-out", messagePreview: "Dear Prodsol, Invoice #PSB-2201 for ₹2.90L remains unpaid since…", daysOverdueAtSend: 1575, billsCovered: 17, netAmountAtSend: 289756 },

  { id: "rh-14", partyName: "Buy More (Counfreedise)", sentAt: "2026-04-14T10:02:00+05:30", channel: "whatsapp", tone: "firm", status: "read", messagePreview: "Dear Buy More, this is a follow-up for ₹2.58L outstanding since…", daysOverdueAtSend: 954, billsCovered: 63, netAmountAtSend: 257865 },
];

/** Fetch the last N history items for a party, newest first. */
export function getPartyReminderHistory(
  partyName: string,
  limit?: number,
): ReminderHistoryItem[] {
  const hits = REMINDER_HISTORY.filter((h) => h.partyName === partyName).sort(
    (a, b) => b.sentAt.localeCompare(a.sentAt),
  );
  return limit ? hits.slice(0, limit) : hits;
}

/** Summary: when was this party last reminded? Used by the list
 *  "Last Reminded" column. Returns "Never" when no history. */
export function lastRemindedLabel(partyName: string): string {
  const last = getPartyReminderHistory(partyName, 1)[0];
  if (!last) return "Never";
  const sentAt = new Date(last.sentAt).getTime();
  const today = new Date("2026-04-20T23:59:59+05:30").getTime(); // align with demo "today"
  const diffMs = today - sentAt;
  const days = Math.max(0, Math.floor(diffMs / (1000 * 60 * 60 * 24)));
  if (days === 0) return "Today";
  if (days === 1) return "1d ago";
  if (days < 7) return `${days}d ago`;
  if (days < 14) return "1w ago";
  if (days < 28) return `${Math.floor(days / 7)}w ago`;
  return `${Math.floor(days / 30)}mo ago`;
}

/** 5-tier aging color per the PRD (Green current, Amber 1-30d,
 *  Orange 31-90d, Red 91-180d, Deep-Red 180d+). Centralised so
 *  the list, chip, and card all agree. */
export function agingColor5(days: number): {
  bg: string;
  fg: string;
  label: string;
} {
  if (days <= 0)
    return { bg: "color-mix(in srgb, var(--green) 15%, transparent)", fg: "var(--green)", label: "Current" };
  if (days <= 30)
    return { bg: "color-mix(in srgb, var(--yellow) 18%, transparent)", fg: "var(--yellow)", label: "1-30d" };
  if (days <= 90)
    return { bg: "color-mix(in srgb, var(--orange) 20%, transparent)", fg: "var(--orange)", label: "31-90d" };
  if (days <= 180)
    return { bg: "color-mix(in srgb, var(--red) 22%, transparent)", fg: "var(--red)", label: "91-180d" };
  return { bg: "color-mix(in srgb, #9F1239 28%, transparent)", fg: "#BE123C", label: "180d+" };
}

/** Filter chips for the Outstanding list — these are the exact
 *  buckets called out in the PRD §Priority 2. */
export type ReminderListFilter =
  | "all"
  | "never-reminded"
  | "overdue-30"
  | "no-contact"
  | "reminded-this-week";

export const REMINDER_LIST_FILTERS: Array<{
  id: ReminderListFilter;
  label: string;
}> = [
  { id: "all", label: "All" },
  { id: "never-reminded", label: "Never reminded" },
  { id: "overdue-30", label: "Overdue 30d+" },
  { id: "no-contact", label: "No contact" },
  { id: "reminded-this-week", label: "Reminded this week" },
];

/* ── Bulk Contact Import — sample rows for the 4-step modal ── */

export interface BulkImportRow {
  partyName: string;
  existingPhone?: string;
  existingEmail?: string;
  newPhone?: string;
  newEmail?: string;
  newContactPerson?: string;
  /** Resolution status after match preview. */
  status: "matched" | "will-update" | "name-mismatch" | "skipped";
  note?: string;
}

export const BULK_IMPORT_SAMPLE: BulkImportRow[] = [
  { partyName: "Nykaa E-Retail Pvt Ltd", existingPhone: "+91 98200 44112", existingEmail: "ar-mumbai@nykaa.com", newPhone: "+91 98200 44112", newEmail: "ar-mumbai@nykaa.com", newContactPerson: "Sakshi Rao", status: "matched" },
  { partyName: "Website Debtors", newPhone: "", newEmail: "", status: "skipped", note: "No phone/email in row" },
  { partyName: "LLC Olimpiya", existingPhone: "+7 495 123 45 67", newPhone: "+7 495 123 45 80", newEmail: "finance@olimpiya.ru", newContactPerson: "Anna Volkova", status: "will-update", note: "Phone + contact person changed" },
  { partyName: "One97 Communications (Paytm)", existingPhone: "+91 99870 55102", newPhone: "+91 99870 55102", newEmail: "vendor-payments@paytm.com", status: "matched" },
  { partyName: "Prodsol Biotech Pvt Ltd", existingPhone: "+91 98765 33221", newPhone: "+91 98765 33221", newEmail: "accounts@prodsol.in", status: "matched" },
  { partyName: "Nykaa E-Retail (2)", existingPhone: "+91 98200 44112", newPhone: "+91 98200 44112", newEmail: "ar-mumbai@nykaa.com", status: "matched" },
  { partyName: "Scale Global Debtors", newPhone: "+91 88220 44556", newEmail: "accounts@scaleglobal.in", newContactPerson: "Kiran Patel", status: "will-update", note: "First-time contact added" },
  { partyName: "Buy More (Counfreedise)", existingPhone: "+91 87890 11220", newPhone: "+91 87890 11220", newEmail: "ar@counfreedise.com", status: "will-update", note: "Email added" },
  { partyName: "NYKAA Mumbai 2", existingPhone: "+91 98200 44112", newPhone: "+91 98200 44112", status: "matched" },
  { partyName: "BIGFOOT SHIPROCKET", existingPhone: "+91 90042 00111", newPhone: "+91 90042 00111", newEmail: "ar@shiprocket.com", status: "name-mismatch", note: "Closest: Bigfoot/Shiprocket (91% match)" },
  { partyName: "Sales & Marketing Agencies", newPhone: "+91 99112 23344", status: "skipped", note: "Party not in Riko receivables master" },
];

/* ── Global reminder automation rules (Settings → Reminders) ── */
export interface ReminderAutomationRules {
  // ── Schedule & frequency ──────────────────────────────────────
  /** Cron schedule (IST) — 10:00 AM daily per PRD. */
  cronTimeIst: string;
  /** Batch cron: daily max sends across the whole portfolio. */
  dailyBatchLimit: number;
  /** Hard cap on total sends before we stop automated reminders
   *  for a party. */
  maxRemindersPerParty: number;
  /** Parties overdue > this number of days are flagged for manual
   *  outreach (no automated sends). */
  maxOverdueThresholdDays: number;
  /** Quiet-hours window — cron won't fire outside this range. */
  quietHoursStart: string;
  quietHoursEnd: string;
  /** Skip weekends (Sat + Sun) entirely. */
  skipWeekends: boolean;
  /** Skip known Indian public holidays (hardcoded list for demo). */
  skipHolidays: boolean;
  /** Don't auto-remind for outstanding < this value. Prevents
   *  nagging customers for a ₹50 postage bill. */
  minOutstandingAmount: number;
  /** Subtract on_account credits from outstanding before urgency
   *  scoring (PRD §4.3). A party owing 5.7L with 5.1L on account
   *  ranks lower than one owing 1L fresh. */
  onAccountDeduction: boolean;

  // ── Exclusions ────────────────────────────────────────────────
  /** Party names that should NEVER receive automated reminders.
   *  Owner still has the option to send manually via the drawer. */
  blacklistedParties: string[];
  /** Parties marked as "key accounts" — automated channel is forced
   *  to "phone call" only (reminder becomes a to-do, not a WA send). */
  keyAccountParties: string[];

  // ── Escalation ────────────────────────────────────────────────
  /** After this many days with no reply, escalate to a human. */
  escalateAfterDays: number;
  /** Role that gets assigned the escalated party as a to-do. */
  escalateTo: "accounts" | "sales" | "accounts-head" | "admin";
  /** When a party crosses into Final tier, notify the owner on
   *  WhatsApp so they can intervene directly. */
  finalTierAlert: boolean;
  /** Days after final-tier send to keep trying before flagging for
   *  legal / formal recovery. */
  slaAfterFinalDays: number;

  // ── Auto-stop rules ───────────────────────────────────────────
  /** Stop reminders when a receipt voucher lands for the party. */
  stopOnPaymentReceived: boolean;
  /** Honor WhatsApp STOP replies by auto-disabling. */
  stopOnOptOut: boolean;
  /** Detect "paying soon", "will clear", "promise" in replies and
   *  pause reminders for 7 days to avoid nagging. */
  stopOnPromiseToPay: boolean;
  /** Stop once the party has paid more than this fraction of the
   *  outstanding. 0.8 = stop after 80% paid. */
  stopOnPartialPayment: boolean;
  partialPaymentThreshold: number;

  // ── WABA approval status per tone ─────────────────────────────
  /** Per-tone approval state at MSG91 / Meta. Automated WA sends
   *  require "approved" templates; others fall back to email. */
  wabaApproved: boolean;
  wabaApprovalByTone: Record<ReminderTone, "approved" | "pending" | "rejected">;

  // ── Channel-specific health ───────────────────────────────────
  /** MSG91 credit balance in rupees. Drops as reminders send. */
  msg91Credits: number;
  /** Cost per WA message in rupees (MSG91 utility template rate). */
  msg91CostPerMessage: number;
  /** SMS cost per message (DLT + carrier). */
  smsCostPerMessage: number;
  /** Display name attached to outbound emails. */
  emailFromAddress: string;
  emailReplyTo: string;
  emailSignature: string;
  /** DLT-registered header for SMS compliance. */
  smsDltHeader: string;
  smsSenderId: string;
}

export const REMINDER_AUTOMATION_DEFAULTS: ReminderAutomationRules = {
  // Schedule
  cronTimeIst: "10:00",
  dailyBatchLimit: 5,
  maxRemindersPerParty: 5,
  maxOverdueThresholdDays: 180,
  quietHoursStart: "09:00",
  quietHoursEnd: "18:00",
  skipWeekends: true,
  skipHolidays: true,
  minOutstandingAmount: 500,
  onAccountDeduction: true,
  // Exclusions
  blacklistedParties: ["Scale Global Debtors"],
  keyAccountParties: ["Website Debtors"],
  // Escalation
  escalateAfterDays: 14,
  escalateTo: "accounts",
  finalTierAlert: true,
  slaAfterFinalDays: 30,
  // Auto-stop
  stopOnPaymentReceived: true,
  stopOnOptOut: true,
  stopOnPromiseToPay: true,
  stopOnPartialPayment: true,
  partialPaymentThreshold: 0.8,
  // WABA
  wabaApproved: true,
  wabaApprovalByTone: {
    gentle: "approved",
    standard: "approved",
    firm: "approved",
    final: "pending",
  },
  // Channel health
  msg91Credits: 14_20, // credits, not rupees — 1 credit ≈ ₹0.20
  msg91CostPerMessage: 0.2,
  smsCostPerMessage: 0.18,
  emailFromAddress: "yogesh@bandrasoap.in",
  emailReplyTo: "accounts@bandrasoap.in",
  emailSignature: "Yogesh Patel\nBandra Soap Pvt Ltd\n+91 98765 43210",
  smsDltHeader: "BNDSOP",
  smsSenderId: "BNDSOP",
};

/* ── Reminder analytics — demo data for the 30-day strip ── */

export interface ReminderDaySend {
  date: string; // ISO
  dayLabel: string; // "Mon 15"
  gentle: number;
  standard: number;
  firm: number;
  final: number;
}

/** Last 30 days of batch sends by tier — used by the analytics
 *  strip on Settings → Reminders. Pattern: Mon-Fri heavy, weekend
 *  light (honoring skipWeekends rule), gradual ramp as rules tuned. */
export const REMINDER_ANALYTICS_30D: {
  dailySends: ReminderDaySend[];
  replyRateByChannel: Record<ReminderChannel, number>;
  paymentCorrelation: Record<ReminderTone, { reminded: number; paidWithin7d: number; pct: number }>;
  totalSent: number;
  totalReplies: number;
  totalCollected: number;
  totalCost: number;
  creditsBurnRate: number; // credits per day
} = (() => {
  const days: ReminderDaySend[] = [];
  const end = new Date("2026-04-20");
  let totalSent = 0;
  for (let i = 29; i >= 0; i--) {
    const d = new Date(end);
    d.setDate(d.getDate() - i);
    const dow = d.getDay(); // 0=Sun, 6=Sat
    const weekend = dow === 0 || dow === 6;
    // Demo pattern: ramp up over 30d, weekend = 0
    const base = weekend ? 0 : 2 + Math.round((i < 10 ? 4 : i < 20 ? 3 : 2));
    // Tier mix: older dues = more firm/final
    const gentle = weekend ? 0 : Math.max(0, base - 1);
    const standard = weekend ? 0 : base;
    const firm = weekend ? 0 : Math.max(0, Math.round(base * 0.6));
    const final = weekend ? 0 : Math.max(0, Math.round(base * 0.3));
    const daySum = gentle + standard + firm + final;
    totalSent += daySum;
    days.push({
      date: d.toISOString().slice(0, 10),
      dayLabel: d.toLocaleDateString("en-IN", { weekday: "short", day: "numeric" }),
      gentle,
      standard,
      firm,
      final,
    });
  }
  const totalReplies = Math.round(totalSent * 0.28);
  return {
    dailySends: days,
    replyRateByChannel: {
      whatsapp: 0.42,
      email: 0.18,
      sms: 0.09,
    },
    paymentCorrelation: {
      gentle:   { reminded: 38, paidWithin7d: 26, pct: 0.68 },
      standard: { reminded: 44, paidWithin7d: 23, pct: 0.52 },
      firm:     { reminded: 31, paidWithin7d: 12, pct: 0.39 },
      final:    { reminded: 14, paidWithin7d: 3,  pct: 0.21 },
    },
    totalSent,
    totalReplies,
    totalCollected: 8_40_000,
    totalCost: 280,
    creditsBurnRate: 15,
  };
})();

/** Live state for the Live State hero at the top of Settings →
 *  Reminders. Computed from REMINDER_SETTINGS + REMINDER_HISTORY. */
export function computeReminderLiveState() {
  const active = REMINDER_SETTINGS.filter((s) => s.enabled).length;
  const paused = REMINDER_SETTINGS.filter((s) => !!s.pauseUntil).length;
  const optedOut = PARTY_CONTACTS.filter((c) => c.optedOut).length;
  // Queued for next batch = parties whose nextReminderAt <= today+1
  const tomorrow = new Date("2026-04-21").getTime();
  const queued = REMINDER_SETTINGS.filter((s) => {
    if (!s.enabled) return false;
    if (!s.nextReminderAt) return false;
    return new Date(s.nextReminderAt).getTime() <= tomorrow;
  }).length;
  const sentThisMonth = REMINDER_HISTORY.filter((h) => {
    const d = new Date(h.sentAt);
    return d.getFullYear() === 2026 && d.getMonth() === 3; // April 2026
  }).length;
  return {
    active,
    paused,
    optedOut,
    queued,
    sentThisMonth,
    replyRate: 0.34,
    collectedThisMonth: 8_40_000,
  };
}

