# Inventory

Stock levels, valuation, dead stock, physical count reconciliation. Built to surface the real pain of Indian SMB traders: drift between Tally book qty and actual shelf qty.

**Primary persona**: Founder, ops staff.
**Top JTBD**: "What's about to run out? What's dead stock? Is our book count real?"

---

## Layout

### 1. Header row
- Page title "Inventory" + "As of 31 Mar 2026" (computed from latest voucher date)
- Right: **"Reconcile physical stock"** primary button (opens modal)

### 2. Godown pills
Horizontal chip row: "All · Bhiwandi WH · Chennai WH · ..."
Each pill: name + small status dot showing last-count freshness (green <30d, yellow 30-60d, red >60d).

### 3. KPI row (4 cards)
- Current Value (₹ big, Space Grotesk)
- In Stock (units count)
- Need Attention (low + out of stock count)
- **Closing Stock** with chip `FIFO · from Tally` (tooltip: "Tally is configured for FIFO. Valuation method chosen inside Tally at FY boundary.")

### 4. Month-end snapshot strip (3 compact cards)
Opening / Closing / COGS for current month. Sub-link "View in P&L" scrolls Dashboard Waterfall.

### 5. Stale-count banner (conditional)
If active godown's last count >30 days old:
> "Last physical count 62 days ago. Closing stock may have drifted. [Reconcile →]"

### 6. Search + filter toolbar
- Search box (SKU or name)
- Filter chips: All · Low stock · Out of stock · Dead stock
- Sort: Value / Qty / Reorder alert

### 7. Main stock table
Columns: SKU code, product name, godown badge, qty, book value, reorder progress bar (fills to reorder_level), status pill (ok/low/out), **variance badge** (if reconciled: green ✓ / yellow ⚠ / grey —).

Row tap (if SKU has FIFO cost layers): opens a **cost-layer drawer** showing purchase layers oldest-first with green marker on current FIFO consumption pointer. Purely educational.

### 8. Dead Stock Analysis section
SKUs with zero sales in 90+ days but closing_qty > 0.
Each row: SKU, qty, value, last-sold date, recommended action ("Liquidate at 40% off"). Sum at top: "₹12.8L locked in dead stock".

---

## Physical Stock Reconciliation modal (NEW)

4 steps:

### Step 1 — Template
- Explainer + "Download CSV template" button
- Template pre-filled with all SKUs + current book qty; user fills physical_qty column

### Step 2 — Upload
- Drag-drop zone
- "Try with sample data" link (for demo)

### Step 3 — Variance preview (the heart)
4 summary chips at top:
- **Matched** (green, ±2%)
- **Minor** (yellow, 2–5% — routes as bulk journal)
- **Major** (red, >5% — routes as per-SKU journals)
- **New SKU** (blue, flagged for master creation)

Per-row:
- SKU + name
- Book qty | Physical qty side-by-side
- Variance qty / % + confidence chip
- Adjustment value ₹
- Reason dropdown: Damaged / Pilferage / Count error / Expiry / Inter-godown transit / Other

Footer routing summary: "3 major → 3 Stock Journals to Accounts Head · 8 minor → 1 bulk journal to Accounts".

### Step 4 — Confirm
Toast "4 drafts created · routed to approvers" → navigate to Entries tab (drafts show up).

Each draft:
- `type: stock-journal`
- Major variance: one voucher per SKU, requires Accounts Head approval (>₹1L threshold logic)
- Minor variance: single bulk voucher with line items, routes to Accounts
- Narration: "Physical count variance · [month] · [godown]"

---

## Data

| Metric | Query |
|---|---|
| Book qty/value | `tally_stock_item.closing_qty / closing_value` |
| FIFO cost layers | Purchase line items for this SKU ordered by voucher_date ASC |
| Dead stock | SKUs with no sales voucher line in last 90d + closing_qty > 0 |
| Reorder alert | `closing_qty <= reorder_level` |
| Gross margin | `(last_sale_rate - last_purchase_rate) / last_sale_rate` |
| Godown count | `tally_godown.last_counted_date` |
| Variance | upload.physical_qty - stock_item.closing_qty |
| TALLY_VALUATION.method | From company config (display-only, Tally-managed) |

---

## RBAC

- `items.view` — all roles (including viewer, field-sales)
- `items.cost` — admin, accounts-head, accounts, manager (hides cost rate + margin columns for others)
- `items.edit` — admin, accounts-head, accounts (creates SKU masters, edits reorder levels)
- Reconcile button: requires `entries.upload` + `items.edit`

---

## Avoid

- **Valuation method switcher** — method is configured INSIDE Tally at FY boundary (switching has tax + FY implications). Riko displays it, never changes it.
- **Real-time stock count integration** with barcode scanners / IoT — out of scope for v1.
- **Predictive reorder quantities** — too many confounders (lead time, MOQ, seasonality). Show the reorder alert; let the user decide.
- **Per-batch / expiry tracking** unless Tally is configured for it (not default).

---

## Lovable prompt

```
Build the Inventory page for Riko (AI CFO for Indian SMBs, Tally-backed). Mobile-first.

Visual: DESIGN.md. Data per DATA.md (Tally stock_item + voucher line items). RBAC per RBAC.md.

Layout:
1. Header: "Inventory" + date + "Reconcile physical stock" primary button (top-right)
2. Godown pills row (All + per godown), each with status dot showing last-count freshness (green <30d, yellow 30-60d, red >60d)
3. 4 KPI cards: Current Value / In Stock / Need Attention / Closing Stock (with "FIFO · from Tally" chip + tooltip explaining it's configured inside Tally, not Riko)
4. Month-end snapshot strip: Opening / Closing / COGS mini cards
5. Stale-count yellow banner if last count >30d
6. Search + filter toolbar (All / Low / Out / Dead)
7. Main stock table: SKU code, name, godown badge, qty, value, reorder progress bar, status pill (ok/low/out), variance badge if reconciled. Row tap opens cost-layer drawer showing FIFO purchase layers with green marker on current consumption pointer.
8. Dead Stock Analysis section: SKUs with zero sales 90+ days, showing qty, value, last-sold, suggested action. Summary "₹12.8L locked in dead stock"

Physical Stock Reconciliation modal (4 steps):
- Step 1: download CSV template (pre-filled with SKU + book qty)
- Step 2: drag-drop upload (+ "try with sample data" link)
- Step 3: variance preview — 4 summary chips (Matched ±2% / Minor 2-5% / Major >5% / New SKU). Per-row: SKU, book qty vs physical qty side-by-side, variance %, adjustment ₹, reason dropdown. Footer routing summary ("3 major → 3 per-SKU journals to Accounts Head · 8 minor → 1 bulk journal")
- Step 4: confirm → toast → navigate to Entries tab with drafts

RBAC: items.cost permission gates cost rate/margin columns (hidden for junior-accounts, sales, field-sales, viewer).

Do NOT include: valuation method switcher (Tally-managed), barcode/IoT integrations, predictive reorder qty, per-batch expiry tracking.
```
