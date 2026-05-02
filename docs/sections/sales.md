# Sales

Revenue analytics: trend, customers, products, insights. Every number is grounded in Tally voucher aggregations — no invented fields.

**Primary persona**: Founder (headline numbers), CA (deep dives), Sales (customers tab).
**Top JTBD**: "Is the business growing? Where? Who?"

---

## Tabs

1. **Overview** (default)
2. **Customers**
3. **Products**
4. **Insights**

---

## Overview tab (top to bottom)

### 1. Total Sales card
- Label: "Total Sales (FY 2025-26)"
- Big value: `₹9.25Cr` (Space Grotesk, prefix-₹)
- YoY delta pill: `▲ 12.3% YoY` (or `▼` red if negative), subtext `FY24: ₹8.24Cr`

### 2. Monthly revenue chart
- Title: "Monthly Revenue" + right-side subtitle `SUM(sales vouchers) by month · FY25 vs FY24`
- 12 monthly bars (green, FY25)
- **Ghost bars behind**: semi-transparent + dashed outline = FY24. Where FY24 peeks above FY25 = YoY decline in that month.
- Legend: FY25 (solid green) · FY24 (dashed outline) · "ghost peeks above solid = YoY decline"

### 3. Sales by ledger card
- Title: "Sales by ledger" + subtitle `Channel = sales ledger in Tally · growth vs FY24`
- Rows: channel name (e.g., "Sales – Website D2C"), % share, growth pill (green ▲ or red ▼), horizontal bar
- One row per distinct sales ledger

### 4. Sales by state card
- Title: "Sales by state" + subtitle `Top 6 · from party GSTIN state code · FY25`
- 6 rows: state code chip (e.g., "27"), state name, invoice count, taxable value, % share, horizontal bar

### 5. Returns & Credit Notes card
Header row:
- "Returns & Credit Notes" label
- Big red number: `₹16.2L` + "in returns (14.9% of gross)"
- Trend pill: `▲ +8.3% vs last quarter`

Grid (2 cols mobile, 3 cols desktop): returns by channel. Each card:
- Channel name + return rate (colored by severity)
- Value + credit note count

Table: Top 5 returned SKUs (SKU, name, return count, rate %, loss ₹)

Factual footer (no prescription): "Amazon return rate is 5.7× your Website D2C rate (32.5% vs 5.7%)."

---

## Customers tab

### 1. Top Customers table (10 rows)
Columns: customer, channel chip (D2C/Marketplace/B2B), revenue, orders, AOV, last order, LTV.

LTV = lifetime revenue from this party across all time (Tally keeps full history).

### 2. AOV Trend mini-chart
12 monthly bars. Current month highlighted green. Value labels above each bar (e.g., "9.4k").

### 3. Cohort Retention grid
- Rows: cohorts labeled FY24 Q1, FY24 Q2, etc. (quarter of first voucher).
- Cols: Q0 (100%), Q1, Q2, ... Q8.
- Heat-map cells: red <35%, green shades 35-90%.
- Metadata per row: cohort size (acquired count).

### 4. Concentration callout
Yellow banner: "Top 3 customers = ₹1.87Cr = 67% of revenue. Diversify or negotiate lock-in contracts."

---

## Products tab

### 1. Summary strip (3 cards)
- Active SKUs (count with sales)
- Units sold (total qty FY25)
- Avg margin (revenue-weighted)

### 2. Top SKUs by revenue table
Columns: SKU code, product name, HSN, qty sold, revenue, avg sales rate, avg cost rate, margin %.

Margin color: ≥40% green, 25-40% neutral, 15-25% yellow, <15% red.

If any SKU below 25%: footer callout "N SKU(s) below 25% margin: [list of codes]".

### 3. Top movers by quantity
5-row bar chart ranked by units sold. Purple bars. Just name + qty.

### 4. HSN-wise sales table
Columns: HSN code, description, invoice count, taxable value, tax, total.
Subtitle: "Same aggregation as GSTR-1 Table 12" — signals to devs that this is an existing query reused.

---

## Insights tab

All metrics are factual derivations of Tally data — no prescriptive prose.

### 1. YoY growth by month
Divergent bar chart centered on zero baseline. Positive bars go up (green) from center, negative down (red). Under each bar: explicit `+18%` or `-65%` label + month.

Best/worst months footer: "Best: Apr +18% · Worst: Oct -81%".

### 2. Customer concentration ladder
Horizontal progress bars:
- Top 1: 24%
- Top 3: 68%
- Top 5: 85%
- Top 10: 99%
Red fill if bucket >80%, yellow 60-80%, green below.

### 3. State concentration (small card)
Big number `46.8%` with subtitle "top 3 states / total taxable". List top 3 states + amount below.

### 4. Repeat vs new (small card, next to State concentration)
Big number `82%` with subtitle "revenue from repeat customers" + counts chip "8 repeat · 2 new". Definition note: "orders > 1 on party ledger = repeat".

### 5. Payment velocity (DSO card)
`52 days` + subtitle "(debtors / revenue) × 365" + row for debtors outstanding amount.

### 6. Highest return rate (card)
Big red `32.5%` number + subtitle "Amazon ledger". Right-aligned: "Lowest: Others · 4.4%".

### 7. Footer note
Small gray text: "All metrics are pure aggregations over Tally's existing tables — sales vouchers, credit notes, party ledger, stock items. No derived fields invented outside that surface."

---

## Data

Every number reduces to DATA.md queries. Key ones:
- `SUM(voucher) WHERE type='sales' AND fy=current`
- `GROUP BY month`
- `GROUP BY sales_ledger_id` (= channel)
- `GROUP BY party.state_code` (from GSTIN prefix)
- `GROUP BY line.stock_item_id` (top SKUs)
- `GROUP BY line.hsn` (GSTR-1 Table 12 reuse)
- Credit notes: `SUM(voucher) WHERE type='credit-note'`

---

## RBAC

- `sales.view` + `cfo_insights.view` — admin, accounts-head, manager, viewer: full access.
- Accounts (without cfo_insights): Overview + Customers + Products; Insights tab hidden.
- Sales role: Overview + Customers only; no Products (hides margins), no Insights.
- Field Sales, Viewer, Junior Accounts: no access.

---

## Avoid

- **Return reason categories** (Damaged / Wrong address etc.) — Tally credit-note narration is free text. Cutting this was a deliberate choice.
- **"Forecast revenue"** — no CRM / pipeline data in Tally.
- **Product NPS / reviews** — not in Tally.
- **Marketing attribution** — not in Tally.
- **Vanity metrics** (total orders ever, average invoice size all-time) — stick to FY metrics with YoY deltas.
- **Prescriptive AI prose** in Insights tab. Numbers are the insight. User decides what to do.

---

## Lovable prompt

```
Build the Sales analytics page for Riko (AI CFO for Indian SMBs, Tally-backed). Mobile-first.

Visual: DESIGN.md (dark, green). Data: DATA.md (Tally voucher aggregations only). RBAC: RBAC.md.

4 tabs: Overview (default), Customers, Products, Insights.

OVERVIEW:
1. Total Sales card with YoY delta pill (compare to prior FY)
2. Monthly revenue chart: 12 green FY25 bars + GHOST BARS BEHIND for FY24 (semi-transparent, dashed outline). When FY24 > FY25, ghost peeks above solid = YoY decline visible. Legend: "ghost peeks above solid = YoY decline"
3. Sales by ledger (channels = sales ledgers in Tally): rows with % share, growth pill vs FY24, horizontal bar
4. Sales by state (top 6): GSTIN state code chip, state name, invoice count, taxable value, % share, horizontal bar
5. Returns & Credit Notes: header with total returns ₹, return rate %, trend pill. Grid of channel cards (return rate colored), Top 5 returned SKUs table. Factual footer comparison (no prescription).

CUSTOMERS:
1. Top 10 customers table (name, channel chip, revenue, orders, AOV, last order, LTV)
2. AOV trend mini chart (12 monthly bars, current in green)
3. Cohort retention heat-map grid (quarterly cohorts × 8 quarters)
4. Concentration risk callout (yellow banner, top-3 share)

PRODUCTS:
1. 3-card summary: Active SKUs / Units sold / Avg margin (revenue-weighted)
2. Top SKUs by revenue table: SKU, name, HSN, qty, revenue, sales rate, cost rate, margin % (colored by severity). Footer callout if any <25%.
3. Top movers by qty (5-row horizontal bars)
4. HSN-wise sales table with subtitle "Same aggregation as GSTR-1 Table 12"

INSIGHTS (no prescriptive prose; numbers only):
1. YoY growth by month — divergent bars centered on zero (green up, red down), per-month % labels
2. Customer concentration ladder (Top 1/3/5/10) with color-coded bars
3. State concentration card (top 3 / total %)
4. Repeat vs new split (orders>1 on party ledger)
5. Payment velocity (DSO) = (debtors/revenue)×365
6. Highest return-rate channel
7. Footer note: "All metrics are pure aggregations over Tally's existing tables..."

Do NOT include: return reason categories (not in Tally), forecast/pipeline, NPS, marketing attribution, vanity metrics, or prescriptive AI advice.

Roles: sales role sees Overview + Customers only. Accounts (no cfo_insights) hides Insights tab. Viewer/Junior/Field-sales: no access to this page.
```
