# Riko — Tally Data Surface

**Paste this file in Lovable after DESIGN.md.** Every section prompt grounds its numbers against the surface defined here. No invented fields. Fluff = anything not listed below.

Riko's backend is a Supabase Postgres populated by INFINI API from a company's TallyPrime. The tables below mirror Tally's own object model — anything you want to show must map to one of these queries.

---

## Canonical Tally entities

### 1. Voucher (`tally_voucher`)
The atomic unit of Tally. Every transaction is a voucher.

```sql
CREATE TABLE tally_voucher (
  id           uuid PRIMARY KEY,
  company_id   uuid NOT NULL,
  voucher_no   text NOT NULL,           -- 'INV-2025-0142'
  voucher_type text NOT NULL,           -- 'sales' | 'purchase' | 'receipt' | 'payment' | 'journal' | 'stock-journal' | 'credit-note' | 'debit-note' | 'contra'
  voucher_date date NOT NULL,
  party_id     uuid REFERENCES tally_party(id),  -- null for journal/contra
  sales_ledger_id uuid REFERENCES tally_ledger(id),  -- for sales: which sales ledger (= channel)
  narration    text,                    -- free-form; DO NOT parse for categories
  amount       numeric(14,2) NOT NULL,  -- total including tax
  taxable      numeric(14,2),
  cgst         numeric(14,2),
  sgst         numeric(14,2),
  igst         numeric(14,2),
  cess         numeric(14,2),
  is_cancelled boolean DEFAULT false,
  created_at   timestamptz,
  updated_at   timestamptz
);
```

### 2. Voucher line item (`tally_voucher_line`)
Each voucher has N line items (inventory + ledger rows).

```sql
CREATE TABLE tally_voucher_line (
  id           uuid PRIMARY KEY,
  voucher_id   uuid REFERENCES tally_voucher(id) ON DELETE CASCADE,
  line_no      int NOT NULL,
  stock_item_id uuid REFERENCES tally_stock_item(id),  -- null for non-inventory lines (discounts, freight, etc.)
  ledger_id    uuid REFERENCES tally_ledger(id),
  description  text,
  qty          numeric(14,3),
  uom          text,                    -- 'PCS', 'KG', 'LTR', 'BOX'
  rate         numeric(14,2),
  amount       numeric(14,2) NOT NULL,
  tax_rate     numeric(5,2),            -- 0, 5, 12, 18, 28
  hsn          text                     -- '33079090'; from stock_item master
);
```

### 3. Party (`tally_party`)
Customer or vendor. In Tally it's just a Ledger under a Debtor/Creditor group.

```sql
CREATE TABLE tally_party (
  id           uuid PRIMARY KEY,
  company_id   uuid NOT NULL,
  name         text NOT NULL,           -- 'Nykaa E-Retail Pvt Ltd'
  group_name   text NOT NULL,           -- 'Sundry Debtors' | 'Sundry Creditors' | etc.
  gstin        text,                    -- '27AABCN4567D1Z5' — 15 chars
  state_code   text,                    -- derived: first 2 chars of GSTIN
  state_name   text,                    -- derived from state_code lookup
  mobile       text,                    -- WhatsApp number
  email        text,
  address      text,
  opening_balance numeric(14,2),
  credit_days  int,                     -- Tally field
  credit_limit numeric(14,2)
);
```

### 4. Ledger (`tally_ledger`)
Every accounting head. Sales ledgers, expense ledgers, tax ledgers, party ledgers (inherit from here).

```sql
CREATE TABLE tally_ledger (
  id         uuid PRIMARY KEY,
  company_id uuid NOT NULL,
  name       text NOT NULL,             -- 'Sales – Nykaa', 'Input CGST', 'Rent'
  group_name text NOT NULL,             -- 'Sales Accounts', 'Duties & Taxes', 'Indirect Expenses'
  type       text,                      -- 'sales' | 'purchase' | 'tax' | 'expense' | 'asset' | 'liability'
  is_party   boolean DEFAULT false      -- true if this is a party ledger
);
```

### 5. Stock item (`tally_stock_item`)
Every SKU / product.

```sql
CREATE TABLE tally_stock_item (
  id              uuid PRIMARY KEY,
  company_id      uuid NOT NULL,
  sku             text NOT NULL,        -- 'SKU-007'
  name            text NOT NULL,        -- 'Niacinamide Serum 30ml'
  hsn             text,                 -- '33049990'
  uom             text,                 -- 'PCS', 'BOX', 'KG'
  group_name      text,                 -- 'Finished Goods – Serums'
  opening_qty     numeric(14,3),
  opening_value   numeric(14,2),
  closing_qty     numeric(14,3),
  closing_value   numeric(14,2),
  last_sale_rate  numeric(14,2),        -- Tally-maintained
  last_purchase_rate numeric(14,2),     -- Tally-maintained (= cost rate)
  reorder_level   numeric(14,3),
  godown_id       uuid REFERENCES tally_godown(id)
);
```

### 6. Godown (`tally_godown`)
Warehouse / storage location.

```sql
CREATE TABLE tally_godown (
  id         uuid PRIMARY KEY,
  company_id uuid NOT NULL,
  name       text NOT NULL,             -- 'Bhiwandi WH'
  city       text,
  last_counted_date date                -- for physical-count staleness
);
```

### 7. GST returns (`gst_filing`)
Cached snapshot of GSTR-1 / 3B filings per month from INFINI.

```sql
CREATE TABLE gst_filing (
  id            uuid PRIMARY KEY,
  company_id    uuid NOT NULL,
  gstin         text NOT NULL,
  period_month  date NOT NULL,          -- first of month
  return_type   text NOT NULL,          -- 'GSTR-1' | 'GSTR-3B'
  status        text NOT NULL,          -- 'filed' | 'due' | 'late' | 'filed-late'
  filed_on      timestamptz,
  filing_ref    text,                   -- ARN from GSTN
  total_liability numeric(14,2),
  raw_response  jsonb                   -- full INFINI response for audit
);
```

### 8. GSTR-2B line (`gstr_2b_line`)
Per-invoice ITC from the GSTN portal (monthly pull via INFINI).

```sql
CREATE TABLE gstr_2b_line (
  id            uuid PRIMARY KEY,
  company_id    uuid NOT NULL,
  period_month  date NOT NULL,
  supplier_gstin text NOT NULL,
  supplier_name  text,
  invoice_no    text NOT NULL,
  invoice_date  date NOT NULL,
  taxable_value numeric(14,2),
  cgst          numeric(14,2),
  sgst          numeric(14,2),
  igst          numeric(14,2),
  cess          numeric(14,2),
  recon_status  text,                   -- 'matched' | 'manual_matched' | 'partial_match' | 'mismatch' | 'missing_tally' | 'missing_portal'
  matched_voucher_id uuid REFERENCES tally_voucher(id)
);
```

### 9. Bank statement line (`bank_stmt_line`)
Parsed bank CSV / MT940 feed.

```sql
CREATE TABLE bank_stmt_line (
  id          uuid PRIMARY KEY,
  bank_account_id uuid NOT NULL,
  txn_date    date NOT NULL,
  description text,
  debit       numeric(14,2),
  credit      numeric(14,2),
  balance     numeric(14,2),
  matched_voucher_id uuid REFERENCES tally_voucher(id),
  match_confidence numeric(3,2)         -- 0..1; AI-assisted
);
```

### 10. TDS certificate (`tds_certificate`)
Form 16A issued/received.

```sql
CREATE TABLE tds_certificate (
  id            uuid PRIMARY KEY,
  company_id    uuid NOT NULL,
  quarter       text NOT NULL,          -- 'FY25-Q4'
  deductee_pan  text NOT NULL,
  deductee_name text,
  section       text,                   -- '194C', '194J', '194H'
  amount_paid   numeric(14,2),
  tds_amount    numeric(14,2),
  rate          numeric(5,2),
  challan_no    text,
  status        text                    -- 'deposited' | 'filed' | 'issued'
);
```

---

## Derived aggregations (what every screen uses)

Every number on every screen must reduce to one of these aggregations. If yours doesn't, it's fluff.

### Sales side
| Metric | Query |
|---|---|
| Total sales FY | `SUM(amount) FROM voucher WHERE type='sales' AND date BETWEEN fy_start AND fy_end` |
| Sales by month | `SUM(amount) GROUP BY month(date)` |
| Sales by channel | `SUM(amount) GROUP BY sales_ledger_id` — ledger name = channel |
| Sales by state | `SUM(amount) GROUP BY party.state_code` |
| Sales by HSN | `SUM(amount), SUM(tax), COUNT(voucher) GROUP BY line.hsn` (= GSTR-1 Table 12) |
| Sales by SKU | `SUM(amount), SUM(qty) GROUP BY line.stock_item_id` |
| Top customers | `SUM(amount), COUNT(voucher), MAX(date) GROUP BY party_id ORDER BY sum DESC LIMIT 10` |
| AOV by month | `SUM(amount)/COUNT(voucher) GROUP BY month` |
| Cohort retention | `GROUP BY quarter(first_voucher_date) party_id`, track active per subsequent quarter |
| Credit notes total | `SUM(amount) FROM voucher WHERE type='credit-note'` |
| Returns by channel | `SUM(credit_note.amount) GROUP BY party.channel_ledger` |
| YoY % | `(current_fy_sum / prior_fy_sum - 1) * 100` |

### Receivables
| Metric | Query |
|---|---|
| Outstanding balance per party | `SUM(sales + credit_note * -1) - SUM(receipts) GROUP BY party_id` (debtors only) |
| Days overdue | `TODAY() - (voucher_date + credit_days)` per voucher |
| Aging bucket | `CASE: 0–30, 31–60, 61–90, 91–180, 180+` |
| Priority (P1/P2/P3) | derived from amount × days overdue tiers |

### Inventory
| Metric | Query |
|---|---|
| Book qty | `stock_item.closing_qty` |
| Book value | `stock_item.closing_value` |
| Dead stock | SKUs with zero sales in 90+ days + closing_qty > 0 |
| Reorder alert | `closing_qty <= reorder_level` |
| Gross margin per SKU | `(last_sale_rate - last_purchase_rate) / last_sale_rate` |
| Days of stock | `closing_qty / avg_daily_sales_qty_last_30d` |

### GST
| Metric | Query |
|---|---|
| Output tax liability | `SUM(cgst + sgst + igst + cess) FROM voucher WHERE type='sales' AND month=X` |
| ITC available | `SUM(cgst + sgst + igst) FROM voucher WHERE type='purchase' AND month=X` |
| ITC in 2B | `SUM(taxes) FROM gstr_2b_line WHERE month=X AND recon_status IN ('matched','manual_matched')` |
| ITC at risk | `SUM(taxes) FROM voucher WHERE purchase AND NOT IN matched 2B lines` |
| 2B recon match rate | `count(matched + manual_matched) / count(total) * 100` |
| Filing streak | consecutive months with `status IN ('filed')` |

### TDS
| Metric | Query |
|---|---|
| TDS deducted YTD | `SUM(tds_amount) FROM tds_certificate WHERE fy=current` |
| Deductees count | `COUNT(DISTINCT deductee_pan)` |
| Pending challan | `tds_amount WHERE status='deposited' AND status!='filed'` |

### Bank
| Metric | Query |
|---|---|
| Bank balance | `MAX(balance) FROM bank_stmt_line GROUP BY bank_account_id` |
| Unreconciled | `COUNT(*) FROM bank_stmt_line WHERE matched_voucher_id IS NULL` |

---

## What Tally does NOT give you

Common fluff that looks tempting but isn't real data:
- **Return reason category** — Tally's credit-note narration is free text. Don't parse it into structured categories unless you build a manual tagging UI.
- **Customer cohort by "channel affinity"** — unless you define cohort = first sales-ledger used, and then it's circular. Stick to quarter-of-first-purchase cohorts.
- **Sales pipeline / leads / opportunities** — Tally is post-sale. No CRM data. Don't show "forecast revenue" unless you're pulling from a different source.
- **Employee wages breakdown** — Payroll ledgers exist but are often combined at month-end. Don't show "top salaries" without explicit payroll-module integration.
- **Product-level NPS / reviews** — not in Tally. Ever.
- **Competitor pricing** — not in Tally. Ever.
- **Marketing spend ROI** — unless you connect an ads API, it's fiction.

---

## INFINI API (for statutory)

When a screen needs to "file" something (GSTR-1, GSTR-3B, TDS challan), it goes through INFINI, not direct to GSTN. Build-phase flags:
- **Ready now**: GSTIN lookup, filing history, GSTR-2B fetch, purchase GST summary, OTP generation
- **Pending spec**: GSTR-1/3B file submission, challan creation
- **Future**: MSG91 reminders, auto-deadline nudges

Every action blocked on "pending spec" must show a visible pill/chip ("INFINI API pending") — never pretend it works.

---

## Data freshness

Every screen that shows Tally or GSTN data needs a **freshness pill** in the header:
- Tally sync: "Tally synced 14 min ago" (green if <1hr, yellow 1–6hr, red >6hr)
- GSTR-2B: "2B cut-off: 14 Apr · next refresh 14 May" (static; 2B refreshes monthly)
- Bank: "Bank statement imported 3 Apr" (yellow if >30 days)

This is a trust signal — users must know what epoch they're reading.
