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
};

export type ClientStatus = "critical" | "warning" | "healthy";

export const CLIENTS = [
  {
    id: 31, name: "Bandra Soap Pvt Ltd", industry: "D2C Skincare",
    revenue: "9.25Cr", netPL: "-2.24Cr", healthScore: 48, status: "critical" as ClientStatus,
    issues: ["Runway 0.3mo", "GSTR-3B due in 3 days", "₹4.6L excess ITC"],
    misStatus: "Pending", lastSync: "2h ago", contact: "+91 98765 43210",
  },
  {
    id: 42, name: "Kothari Traders", industry: "Retail · Ahmedabad",
    revenue: "4.12Cr", netPL: "+38.2L", healthScore: 76, status: "warning" as ClientStatus,
    issues: ["MIS due in 3 days", "TDS payment pending"],
    misStatus: "In progress", lastSync: "5h ago", contact: "+91 98765 11223",
  },
  {
    id: 57, name: "Patel Industries", industry: "Manufacturing · Pune",
    revenue: "12.8Cr", netPL: "+1.42Cr", healthScore: 88, status: "healthy" as ClientStatus,
    issues: [],
    misStatus: "Delivered", lastSync: "1h ago", contact: "+91 98765 33445",
  },
  {
    id: 63, name: "Mumbai Distributors", industry: "FMCG · Mumbai",
    revenue: "7.65Cr", netPL: "+52.3L", healthScore: 71, status: "warning" as ClientStatus,
    issues: ["Advance Tax Q4 due Apr 15", "High debtor days (67)"],
    misStatus: "Pending", lastSync: "3h ago", contact: "+91 98765 55667",
  },
  {
    id: 78, name: "Sai Enterprises", industry: "Services · Bangalore",
    revenue: "2.34Cr", netPL: "+18.7L", healthScore: 82, status: "healthy" as ClientStatus,
    issues: [],
    misStatus: "Delivered", lastSync: "30m ago", contact: "+91 98765 77889",
  },
  {
    id: 91, name: "Surat Textiles Pvt Ltd", industry: "Manufacturing · Surat",
    revenue: "18.4Cr", netPL: "-1.12Cr", healthScore: 54, status: "critical" as ClientStatus,
    issues: ["Burn rate ₹24L/mo", "GSTR-1 late filing"],
    misStatus: "Pending", lastSync: "4h ago", contact: "+91 98765 99001",
  },
];

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

export const TDS_UPCOMING = {
  depositDueDate: "7 May 2026",
  depositAmount: 524500, // 5.24L
  quarterlyReturnDueDate: "15 May 2026", // 24Q/26Q
  form16DueDate: "31 May 2026", // annual for employees
  salaryTdsDueDate: "30 Jun 2026", // Form 24Q Q4
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



