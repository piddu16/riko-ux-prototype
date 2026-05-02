# Day Book

Raw voucher feed — every transaction for a period, grouped by date. Tally parity surface.

**Primary persona**: Accounts staff, CA (review). Founders rarely visit.
**Top JTBD**: "Find the ₹2.4L receipt I posted on 15th April."

---

## Layout

### 1. Top summary row (5 KPI cards)
- Total entries (count)
- Purchases (₹ sum for Purchase vouchers)
- Sales (₹ sum for Sales vouchers)
- Receipts (₹ sum)
- Payments (₹ sum)

### 2. Voucher Type Breakdown card
Animated horizontal bars per voucher type: Sales, Purchase, Receipt, Payment, Journal, Credit Note, Debit Note, Contra, Stock Journal.

Each bar: colored pill (type), count + value, % of total.

### 3. Date range + filters
- Quick range chips: This Month (default) · Last Month · Current FY · Custom
- Voucher type multi-select
- **Party filter chip bar**: top 5 parties dynamically generated (Amazon, Nykaa, Flipkart, etc.) — tap to filter. Essential for spot-checking.
- Amount range slider (min/max)
- Search box (voucher number, narration keyword)

### 4. Main table grouped by date
For each date, a section header: "Mon · 28 Mar 2026 · 47 entries · ₹3.42Cr"

Rows (mobile cards):
- Voucher type pill (colored: Sales green, Purchase orange, Receipt blue, Payment red, Journal gray)
- Voucher number + narration (truncated)
- Party name
- Amount (Space Grotesk, right-aligned)

Row tap → bottom sheet with full voucher details: line items (if any), tax splits, narration, linked vouchers (e.g., a Sales voucher linked to its payment Receipt).

### 5. Export bar (sticky bottom on desktop)
- Total for filtered range
- Export buttons: CSV · Excel · PDF · WhatsApp (send to CA)

---

## Data

| Component | Query |
|---|---|
| Main list | `SELECT * FROM tally_voucher WHERE date BETWEEN X AND Y AND NOT is_cancelled` |
| Type breakdown | `SUM(amount) GROUP BY voucher_type` |
| Party filter options | `SELECT party_id, SUM(amount) FROM vouchers GROUP BY party ORDER BY sum DESC LIMIT 5` |
| Grouping | `GROUP BY voucher_date ORDER BY date DESC` |

---

## Interactions

- **Row tap**: full voucher sheet with all line items, linked docs (sales↔receipt pairs), ability to annotate ("needs clarification"), print PDF.
- **Party chip**: one-tap filter. Chip goes green when active.
- **Export**: CSV/Excel exports are full flat table. PDF generates a formal day book format with company header, period, totals.
- **Add annotation** (inside voucher sheet): CA-only. Adds a flag visible to all team; shows up in activity log.

---

## RBAC

- `reports.financial` — admin, accounts-head, accounts, manager, viewer: full access.
- `entries.view` only: sees Day Book but only voucher types they can draft (junior-accounts sees Receipt/Payment drafts; sales sees their sales vouchers).

**Junior Accounts**: can see Day Book, but sensitive expense ledgers (salaries, director remuneration) are masked unless they have `items.cost` permission.

---

## Empty states

- No entries in selected range: "No vouchers in this window. Change date range?"
- Tally not synced recently: show stale banner.

---

## Avoid

- **Editing vouchers in-place** — Day Book is a read/audit surface. Edits happen via Entries tab which creates a modification voucher (audit-safe).
- **Computed / derived rows** — show exactly what's in Tally, nothing else. The value of this tab is fidelity.
- **Bulk delete** — never. Tally vouchers should be cancelled, not deleted.

---

## Lovable prompt

```
Build the Day Book page for Riko. Indian SMB AI CFO app, Tally-backed, mobile-first.

Visual: DESIGN.md. Data per DATA.md. RBAC per RBAC.md.

Layout:
1. 5 KPI stat cards: total entries / purchases / sales / receipts / payments
2. Voucher Type Breakdown card — horizontal animated bars per voucher type (Sales / Purchase / Receipt / Payment / Journal / Credit Note / Debit Note / Contra / Stock Journal), each with colored pill, count + value, % of total
3. Date range quick-chips (This Month / Last Month / Current FY / Custom) + voucher type multi-select + party filter chip bar (top 5 parties dynamically generated) + amount range slider + search (voucher # or narration)
4. Main table grouped by date — section header per date "Mon · 28 Mar 2026 · 47 entries · ₹3.42Cr". Rows show voucher type pill (colored), voucher number + narration, party name, amount right-aligned. Tap row → bottom sheet with line items, tax splits, linked vouchers (sales↔receipt), annotation controls, print PDF.
5. Sticky bottom export bar (desktop): Total for filtered range + CSV/Excel/PDF/WhatsApp buttons.

Party chip filter is critical — single-tap filter by top vendor/customer.

Role gating:
- junior-accounts: sensitive expense ledgers (salary / director remuneration) masked
- only sees voucher types their role can draft

Do NOT: allow in-place voucher editing (edits go via Entries tab), show computed/derived rows, or allow bulk delete. Tally fidelity is the value of this screen.
```
