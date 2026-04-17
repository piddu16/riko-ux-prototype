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

