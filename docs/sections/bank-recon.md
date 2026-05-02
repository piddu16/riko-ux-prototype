# Bank Reconciliation

Match bank statement lines to Tally vouchers. AI-assisted, human-verified, drafts flow through the Entries approval chain.

**Primary persona**: Accounts staff (monthly), Junior Accounts (daily imports).
**Top JTBD**: "Import last month's bank statement, match every credit/debit to a voucher, close the books."

---

## Layout

### 1. Header row
- "Bank Reconciliation" title
- Right: **"Import statement"** primary button (supports CSV, Excel, MT940)
- Data freshness pill ("Last imported 3 Apr · 147 lines")

### 2. Bank account tabs
Horizontal tab bar with one tab per linked bank account:
- "HDFC · ****1234" (primary)
- "ICICI · ****5678"
- "Kotak · ****9012"

Each tab shows its own current balance (from latest imported statement).

### 3. Summary KPI row (4 cards, per selected account)
- Imported transactions (count)
- Matched (green %)
- Unmatched (count)
- Closing balance (as of last import date)

### 4. Filter + search toolbar
- Tab: Unmatched (default) · Matched · All · Anomalies
- Date range chips
- Amount range
- Search narration/UTR/cheque number

### 5. Main list — bank lines
Each row:
- Date
- Direction arrow (↑ credit, ↓ debit) with color
- Amount (Space Grotesk)
- Narration (truncated)
- UTR / cheque no. (if extractable)
- **Match confidence chip**: Matched (green ✓) · Probable (yellow ~85%) · Possible (orange ~60%) · Unmatched (red)
- **Suggested voucher** (for probable/possible): shows 1-3 candidate vouchers with match score. Tap to confirm.
- Action button: Accept match / Reject / Create voucher

### 6. Match suggestion drawer (on row tap)
Side-by-side view:
- Left: bank line (all fields)
- Right: candidate voucher(s), ranked by confidence

Per candidate shows match factors:
- Amount exact / approx / different
- Date within 3 / 7 days / longer
- Party name partial / fuzzy match
- UTR match / no UTR
- Narration keyword overlap

User actions:
- **Accept match** — links bank_line ↔ voucher, updates voucher state to "reconciled"
- **Reject** — marks not a match, removes from candidates
- **Create new voucher** — opens voucher draft form pre-filled from bank line (goes to Entries queue for approval)
- **Split match** — bank line corresponds to multiple vouchers (rare but real: a lump-sum payment covering 3 invoices)

### 7. Anomalies section
Auto-flagged suspicious lines:
- Duplicate amount + date = possible double-entry
- Reversal pairs (credit + matching debit same day)
- Large round-number transactions without clear match
- Suspected direct-deposit payments not yet invoiced

---

## Data

| Component | Source |
|---|---|
| Bank lines | `bank_stmt_line` table, one row per statement line |
| Match candidates | ranking algorithm over `tally_voucher` (Receipt/Payment types) within date window |
| Match confidence | 0-1 score: `0.4·amount_match + 0.2·date_match + 0.2·party_match + 0.1·utr_match + 0.1·narration_overlap` |
| Anomalies | rules-based scan over bank lines |

Match algorithm (simplified):
1. Exact amount + within ±7 days → "Probable" (85%+)
2. Exact amount + UTR match → "Matched" (99%)
3. Amount ±1% + within 3 days + party in narration → "Possible" (60%)
4. Everything else → "Unmatched"

---

## Interactions

- **Import statement**: upload CSV/Excel/MT940. Preview parsed lines. Confirm → ingests + auto-runs match algorithm. Progress bar while matching.
- **Accept match**: one-click. Links the pair, updates confidence to 100%.
- **Batch accept**: select multiple lines with Matched chip → "Accept all 18 matched". Fast monthly close.
- **Create voucher**: for unmatched, opens Entries-style draft form. On save, creates Receipt/Payment voucher + links to bank line. Draft goes into Entries approval queue.
- **Undo match**: from Matched tab, unlinking is possible (audit-logged).
- **Export unmatched**: CSV download of unmatched lines for CA to review offline.

---

## RBAC

- `entries.view` + `outstanding.edit` required to see Bank Recon tab.
- **Junior Accounts**: can import, can accept "Matched" confidence matches (auto-link), CANNOT accept probable/possible (requires senior review).
- **Accounts+**: full access to all match operations.
- **Viewer**: read-only.

---

## Empty / edge states

- No bank accounts linked: welcome state with "Link a bank account" CTA (manual upload or API like Razorpay/Cashfree/bank Plaid equivalents in India).
- Statement parse error (unknown format): show format list + template download.
- No unmatched: "Everything's reconciled. Next month's import when ready."

---

## Avoid

- **Auto-accepting low-confidence matches** — always require human click except for 99%+ exact matches with UTR.
- **Creating vouchers without Entries approval chain** — even bank-recon-created vouchers must go through the normal approval queue (preserves controls).
- **Deleting bank lines** — they're source-of-truth from the bank. Only link/unlink, never delete.
- **Direct bank API writes** — Riko reads statements. Never initiates transfers.
- **Hiding match factors** — transparency is key. Always show why a match was suggested.

---

## Lovable prompt

```
Build the Bank Reconciliation page for Riko (Indian SMB AI CFO, Tally-backed).

Visual: DESIGN.md. Data per DATA.md (bank_stmt_line ↔ tally_voucher matching). RBAC per RBAC.md.

Header: "Bank Reconciliation" title + "Import statement" primary button (supports CSV/Excel/MT940) + freshness pill ("Last imported 3 Apr · 147 lines")

Bank account tabs: one per linked account (HDFC ****1234 / ICICI ****5678 / etc.), each showing current balance

4 summary KPI cards per account: Imported count / Matched % / Unmatched count / Closing balance

Filter toolbar: status tab (Unmatched default / Matched / All / Anomalies), date range, amount range, search (UTR/cheque/narration)

Main list — each bank line row:
- Date, direction arrow (↑↓ colored), amount (Space Grotesk), narration, UTR/cheque if extractable
- Match confidence chip: Matched ✓ (99%+) / Probable (~85%) / Possible (~60%) / Unmatched
- Suggested voucher for probable/possible: 1-3 candidates ranked
- Action button: Accept / Reject / Create voucher

Match suggestion drawer (on row tap): side-by-side bank line vs candidate voucher(s) with match factors shown (amount / date / party / UTR / narration). Actions: Accept / Reject / Create new voucher / Split match (one bank line to multiple vouchers).

Anomalies section: duplicate transactions, reversal pairs, large round-number unmatched, suspected direct deposits.

Import flow: upload → preview parsed lines → confirm → auto-run match algorithm with progress bar.

Batch accept: select multiple Matched-chip rows → "Accept all 18 matched" button.

Create voucher: opens Entries-style draft form pre-filled from bank line. On save: creates Receipt/Payment draft → routes through Entries approval queue.

RBAC:
- entries.view + outstanding.edit required to see this tab
- junior-accounts: can import + accept Matched (99%) auto, NOT probable/possible
- accounts+: full access
- viewer: read-only

Do NOT: auto-accept low-confidence matches (99%+UTR only), bypass Entries approval for bank-created vouchers, delete bank lines, initiate bank writes, or hide match factors.
```
