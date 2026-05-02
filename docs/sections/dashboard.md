# Dashboard

The home screen. Answers "Am I OK?" in 5 seconds, then "What do I do?" in the next 5.

**Primary persona**: Founder (mobile, 2-3× a day).
**Secondary**: CA (desktop, as part of a client review).
**Top JTBD**: Open the app, see cash position + top 3 actions, triage.

---

## Layout (top to bottom, mobile)

### 1. Alert strip (if any critical)
Horizontal red/yellow banner, one-line, dismissable. Examples:
- "Cash runway: 9 days left · [See options]"
- "GSTR-3B due in 3 days · [Open GST]"
Link taps jump to the relevant section.

### 2. Action Queue card (THE star feature)
- Title: "This week's actions" · small chip `3 actions · ₹14.2L at stake`
- List of 3-5 prioritized action cards. Each card:
  - Icon (phone, receipt, warning)
  - Action verb ("Call Nykaa AR team", "File GSTR-1", "Review Amazon returns")
  - Amount impact ("→ +₹12.6L to cash")
  - One-tap CTA: "WhatsApp", "File", "Review"

This block is the single most important surface in Riko. Make it big, obvious, and always above the fold.

### 3. Runway card
- Big number: "**9 days**" (color-coded: red <30, yellow <90, green ≥90)
- Subtext: "₹5.6L cash · ₹17L monthly burn"
- Mini stacked bar showing "cash / weekly burn × 4 weeks"
- Link: "See cash flow forecast →"

### 4. Health Score + KPI grid
- Combined card. Top-left: big circular score (0-100, color-coded)
- Below: 2×3 grid of KPIs (revenue, expenses, GP%, DSO, DPO, inventory days)
- Each KPI shows: label, value (Space Grotesk), MoM delta pill

### 5. Cash Waterfall (desktop: inline; mobile: link)
Revenue → COGS → Gross Profit → OpEx → EBITDA → Tax → Net P&L
Horizontal bars, signed. Hover/tap each for the underlying voucher query ("SUM(purchases) GROUP BY expense ledger").

### 6. Depth (collapsed by default on mobile, expanded on desktop)
Expand/collapse:
- Expense composition (donut)
- Channel revenue mix (stacked bar)
- Balance Sheet snapshot (compact)
- Liquidity gauges (current ratio, quick ratio)
- Cash Conversion Cycle (CCC timeline)
- 12-month revenue trend

---

## Data (grounded per DATA.md)

| Component | Query |
|---|---|
| Action Queue | AI-ranked from AR aging + GST deadlines + cash triggers. Returns 3-5 items per session. |
| Runway days | `(cash + debtors_realistic) / (monthly_burn)` |
| Health score | Weighted composite of: DSO, DPO, GP margin, CCC, filing streak, 2B match rate |
| KPI grid | `SUM(voucher)` aggregations by type |
| Waterfall | Each bar = a ledger-group sum for current FY |
| Expense composition | `SUM(voucher) GROUP BY expense_ledger_group` |
| Channel mix | `SUM(voucher) GROUP BY sales_ledger` |
| BS snapshot | Parent-group sums from tally_ledger |

---

## Interactions

- **Alert strip**: tap → jump to relevant section (Runway → Reports cash flow; GSTR-3B → GST).
- **Action card tap**: opens a sheet with:
  - Supporting context (which vouchers, aging days)
  - Primary CTA (WhatsApp, File, Record Receipt)
  - Dismiss / Snooze for 3 days
- **KPI card tap**: drill into the underlying data (Revenue → Sales tab; DSO → Outstanding)
- **Score tap**: explainer modal with "what would move this to 85?" checklist

---

## RBAC

- `dashboard.view` — all roles (shows tab)
- `dashboard.finance` — shows runway, cash, P&L (admin, accounts-head, accounts, manager, viewer)
- `dashboard.sales` — shows revenue/customers (admin, accounts-head, accounts, manager, sales, viewer)
- **Sales role**: sees dashboard but only Sales KPIs + their own pipeline; no cash/runway/P&L.
- **Junior Accounts**: sees pending-entries queue prominently; finance blocks hidden.

---

## Freshness pill

Top-right of the page (below greeting): "Tally synced 14 min ago · All systems OK" (green). If stale (>6h): "⚠ Tally sync paused 3 days ago · [Reconnect]".

---

## Empty / error states

- **New account, no data**: welcome screen with "Connect your Tally" CTA, 3-step setup checklist.
- **Tally disconnected**: yellow banner at top, CTA to reconnect. Still show last-synced KPIs but with "stale" pill.
- **Score = null** (insufficient data): show score card with "Need 30 days of data" placeholder.

---

## Avoid

- Duplicating KPIs across cards (revenue in 3 places = noise).
- Vanity metrics (# of vouchers, total GB of data, etc.).
- Prescriptive AI advice unless it maps to a one-click action already in the Action Queue.
- Long scrolls on mobile — if it can't fit in 3 phone screens, push it to the "Depth" expand.

---

## Lovable prompt

```
Build the Dashboard for Riko (AI CFO for Indian SMBs). Mobile-first.

Visual system: DESIGN.md (dark theme, green primary, Space Grotesk for numbers).
Data surface: DATA.md (Tally voucher aggregations only).
Roles: RBAC.md (dashboard.view / dashboard.finance / dashboard.sales gates).

Layout top to bottom:
1. Alert strip (conditional, red/yellow) — one-line critical notices with deep-link CTA
2. Action Queue card — "This week's actions", 3-5 prioritized cards with icon + verb + amount-impact + one-tap CTA (WhatsApp/File/Review). This is the hero component — make it the largest and most prominent.
3. Runway card — big color-coded "9 days" number, subtext "₹5.6L cash · ₹17L burn", mini stacked bar
4. Health Score + KPI grid combined card — circular score 0-100 top-left, 2×3 KPI grid (revenue, expenses, GP%, DSO, DPO, inventory days) with MoM delta pills
5. Cash Waterfall — signed horizontal bars Revenue→COGS→GP→OpEx→EBITDA→Tax→Net
6. "Depth" expand section (collapsed on mobile): expense composition donut, channel mix stacked bar, BS snapshot, liquidity gauges, CCC, 12-month trend

Action card tap → sheet with supporting vouchers + primary CTA + dismiss/snooze.
KPI card tap → drill into respective tab.
Freshness pill top-right ("Tally synced 14 min ago").

Role variations:
- Sales role: only Sales KPIs visible, no cash/runway
- Junior Accounts: pending-entries queue prominent

Do NOT: duplicate KPIs, add prescriptive AI text, show vanity metrics, or let mobile scroll beyond ~3 screens before "Depth" expand.
```
