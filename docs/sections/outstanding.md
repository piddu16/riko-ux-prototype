# Outstanding (AR / AP)

Receivables and payables. Who owes us, how long, what to do — and who we owe.

**Primary persona**: Founder + accounts staff + sales (AR only).
**Top JTBD** (founder): "Which 3 parties do I call today to unstick cash?"
**Top JTBD** (accounts): "Reconcile today's collections, mark invoices paid."

---

## Layout

### Tab bar
Two tabs: **Receivables** (default) · **Payables**. Count chips on each.

### Top row (both tabs) — aging summary
4 KPI cards:
- Total outstanding (big number, Space Grotesk)
- Current (0-30) · Overdue (30-60) · Critical (60+) — stacked bar below
- Days Sales Outstanding (DSO) with delta vs last month
- Value at risk (90+ days × likelihood factor)

### Filter + density toolbar
- Filter chips: All · Overdue · Critical · Disputed · Paused
- Priority filter: All · P1 · P2 · P3
- Density toggle: Compact / Regular / Relaxed
- Sort dropdown: Days descending / Amount descending / Party A-Z

### Main table (desktop) / cards (mobile)
Columns (desktop):
| Party | Priority | Days overdue | Amount | Aging bar | Next action | Action |

Rows:
- **Party**: name + GSTIN chip + credit-days chip (sticky first column)
- **Priority**: P1/P2/P3 badge with tooltip explaining tier
- **Days**: with small sparkline (payment history trend for this party)
- **Amount**: Space Grotesk, right-aligned, tabular
- **Aging bar**: horizontal stacked (green 0-30, blue 31-60, yellow 61-90, red 90+)
- **Next action**: verb chip ("Call", "WhatsApp reminder", "Escalate", "Disputed")
- **Action button**: "Remind" / "Record receipt" / "Mark paid" / "View"

Mobile cards: party name big, amount bold right, then aging bar, then action row.

### Right side (desktop) or bottom (mobile) — Insights strip
- **Collection Insights** (3 cards): AI-recommended moves, each with party-specific action
- **Party Risk Matrix** (2×2 quadrant): amount × days-overdue, bubble per party
- **Contra-settlement** callout: if any party is both in AR + AP, flag it for netting

---

## Payables tab (mirror of Receivables, flipped)

Differences:
- Top vendors we owe
- **MSME flag**: vendors registered under MSME get a badge — by law they must be paid in 45 days or interest accrues
- Action verbs different: "Schedule payment", "Acknowledge", "Dispute"
- Additional column: "Remaining credit days" (until we hit MSME/contract breach)

---

## Data

| Component | Query |
|---|---|
| Outstanding per party | `SUM(sales + credit_note×-1) - SUM(receipts)` by party_id, debtor groups only |
| Days overdue | `TODAY - (voucher_date + credit_days)` worst-case across their vouchers |
| Aging bucket | `CASE 0-30 / 31-60 / 61-90 / 90+` |
| Priority | tier function: `f(amount, days_overdue)` → P1/P2/P3 |
| DSO | `(total_receivables / total_sales) × 365` |
| Value at risk | `SUM(outstanding) WHERE days > 90 × 0.4 (haircut)` |
| MSME flag | `party.is_msme_registered` from GSTIN lookup |

---

## Interactions

- **Remind** (AR, missing_portal): opens WhatsApp modal with pre-filled message in Hinglish, customizable. Templates: gentle / firm / final.
- **Record receipt**: sheet with amount, date, payment mode, UTR/cheque no, bank account. On save: creates a Receipt voucher draft that goes into the Entries queue.
- **Mark paid**: shortcut when the exact amount matches a bank credit that's already imported. Links the two.
- **Contra-settle**: if party is in both AR + AP, one tap creates a Journal voucher to net.
- **Disputed**: tag party as disputed, moves to bottom of list, freezes reminder auto-send.
- **Bulk "Remind all overdue"**: top-right action button, triggers WhatsApp reminders for all 60+ day rows at once (with individual preview before send).
- **Export**: CSV/Excel (for sharing with CA or sales team).

---

## RBAC

- `outstanding.receivables` — admin, accounts-head, accounts, junior-accounts, manager, sales, field-sales, viewer (all)
- `outstanding.payables` — all except sales + field-sales
- `outstanding.edit` — admin, accounts-head, accounts, junior-accounts, sales, field-sales

**Sales role**: sees AR, not AP. Can record receipts but not modify party credit terms. `Priority` column visible; `Value at risk` hidden.

**Junior Accounts**: can draft Receipt vouchers (they go into approval queue), cannot mark paid directly.

---

## Empty / edge states

- No overdue: empty state says "All clear. Nice work." with a green checkmark.
- Single party owes >50% of total: top-of-page callout "Nykaa is 63% of your receivables. Diversify or lock in terms."
- Party with no GSTIN: small warning icon next to name.
- Negative outstanding (overpayment): show in a separate "Credits" section, CTA to refund or adjust.

---

## Mobile specifics

- Table becomes cards.
- Sticky filter chip row at top.
- Swipe a card left → reveals "Remind" + "Mark paid" quick actions.
- Bottom sheet on card tap: full party history (last 10 vouchers, last payment, current credit terms).

---

## Avoid

- Generic "send reminder" button with no message preview.
- "Risk score" as a single opaque number. Use days + amount directly.
- Auto-sending reminders on a cron without user approval.
- Confusing "outstanding" with "overdue". Outstanding = any unpaid. Overdue = past credit-days window.

---

## Lovable prompt

```
Build the Outstanding (AR + AP) page for Riko. Indian SMB AI CFO app, mobile-first.

Use DESIGN.md tokens (dark theme, green #22C55E). Data per DATA.md (Tally voucher aggregations — AR = debtor party ledger sums; AP = creditor). RBAC per RBAC.md.

Two tabs: Receivables (default) and Payables.

Receivables layout:
1. 4 KPI cards: total outstanding / aging split (stacked bar) / DSO with delta / value at risk
2. Filter toolbar: chips (All / Overdue / Critical / Disputed / Paused), priority dropdown (P1/P2/P3), density toggle, sort dropdown
3. Main table (cards on mobile): party (sticky, with GSTIN chip), priority badge, days overdue + mini sparkline, amount (Space Grotesk), aging bar (green/blue/yellow/red stacked), next-action verb chip, primary action button (Remind / Record receipt / Mark paid)
4. Insights strip: 3 AI collection-insights cards, Party Risk 2×2 matrix, Contra-settlement callout if any party is in both AR+AP

Payables = same shape but for creditors. Add MSME badge (legally paid in 45 days) + "Remaining credit days" column.

Interactions:
- Remind: WhatsApp modal, pre-filled Hinglish (templates: gentle/firm/final)
- Record receipt: sheet with amount/date/mode/UTR/bank → creates Receipt voucher draft in Entries queue
- Mark paid: shortcut when bank credit already matched
- Contra-settle: one-tap Journal voucher for netting
- Bulk "Remind all overdue": triggers WhatsApp for 60+ day rows with per-row preview

Mobile: swipe left on card for quick actions; tap opens full party history sheet.

Sales role: sees AR only, no AP, no Value-at-risk. Junior Accounts: Record Receipt goes to approval queue.

Do NOT: auto-send reminders, show opaque risk scores, or conflate outstanding with overdue.
```
