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
