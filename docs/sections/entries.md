# Entries

Voucher creation + approval chain + posting to Tally. The accountability surface.

**Primary persona**: Junior Accounts (drafts), Accounts (approve + post), Accounts Head (high-value approvals).
**Top JTBD**: "Record 40 expenses from today's bills, get them approved, post to Tally by EOD."

---

## Layout

### 1. Tab bar at top
- **Drafts** (default — count chip)
- **Pending approval** (count chip — tinted yellow if you're the required approver)
- **Posted** (last 30 days)
- **Rejected** (if any)

### 2. Action bar (above tab list)
- "+ New entry" dropdown (Sales / Purchase / Receipt / Payment / Journal / Credit Note / Debit Note / Contra / Stock Journal)
- **"Bulk upload"** button — opens 4-step Excel/CSV upload modal
- **"OCR from receipt"** (mobile-first) — camera → extracts vendor/amount/GSTIN/tax
- Filter chips: All / My drafts / Needs my approval / Posted today
- Search

### 3. Entry cards (main list)
Each entry card:
- Voucher type pill (colored)
- State badge: Draft · Pending approval · Approved · Posted · Rejected · Posted-late
- Amount (Space Grotesk)
- Party name + date + narration snippet
- **Approval trail**: avatars for drafted-by → approver-required. State indicator per step.
- Amount-threshold chip: "Requires Accounts" (if ≤₹1L) or "Requires Accounts Head" (if >₹1L)
- Actions: View / Edit / Approve / Reject / Post (context-sensitive per state + role)

### 4. Bulk Upload modal (4-step)
Same skeleton as Physical Stock Reconciliation (reused):

1. **Template** — download CSV per voucher type
2. **Upload** — drag-drop (+ "try with sample data" for demo)
3. **Preview** — OCR confidence chips per field, per-row status (ready / needs review / error). Fix inline. Summary chips at top (N ready / N needs review / N rejected).
4. **Confirm** — drafts created, routed to approver queue. Toast "27 drafts created · 3 pending your approval". Redirect to Drafts tab.

### 5. OCR-from-receipt flow (mobile)
- Camera opens full-screen
- Capture receipt image
- Processing spinner → extracted fields shown with confidence chips:
  - Vendor name (high confidence)
  - GSTIN (high)
  - Invoice no. (high)
  - Date (high)
  - Total (highest — always show)
  - Tax splits (medium)
  - Line items (if visible — often low)
- User reviews/edits → creates a Purchase voucher draft

### 6. Approval inbox (for approvers)
Dedicated view when role has approval rights. Shows:
- "N items need your approval · ₹X.XCr total"
- Batch-approve checkbox (within same amount tier only — ≤₹1L items can be batch-approved)
- Per-item drawer with full voucher details + ledger impact preview (affected ledgers, debit/credit splits)

---

## State machine

```
draft → pending_approval → approved → posted
                        → rejected → draft (can resubmit)
```

- **Junior Accounts**: creates draft. Can edit own drafts. Cannot approve/post.
- **Accounts**: approves ≤₹1L. Can post any approved entry.
- **Accounts Head**: approves ANY amount. Can post.
- **Admin**: can override the chain (force-approve or force-reject) — logged in audit.

---

## Data

| Component | Source |
|---|---|
| Entries list | `entry` table (prefixed by company_id, RLS-scoped by actor role) |
| Ledger impact | Auto-computed from entry type + amount + party_id |
| Required approver | `requiredApproverForAmount(amount)` function (see RBAC.md) |
| Batch upload parser | Template-specific validators per voucher type |
| OCR | INFINI OCR API (for Tally-shape extraction) |

Entry object shape:
```
{
  id, company_id, type, state, amount, party_id, narration,
  line_items: [...],
  ledger_impact: [{ledger, debit|credit}],
  drafted_by, drafted_at,
  approved_by, approved_at, required_approver,
  posted_by, posted_at, tally_voucher_id (set on post),
  rejection_reason, source ('manual' | 'bulk' | 'ocr')
}
```

---

## RBAC (per RBAC.md)

| Action | Amount | Required role |
|---|---|---|
| Draft any type | — | junior-accounts+ (based on ENTRY_MATRIX) |
| Approve | ≤₹50k | any approver (accounts+) |
| Approve | ₹50k–₹1L | accounts or higher |
| Approve | >₹1L | accounts-head or admin |
| Post | any | accounts or higher |
| Override | any | admin only |

Not every role can draft every type. Example:
- Sales role can draft Sales vouchers but not Purchase.
- Junior Accounts can draft any type.
- Field-sales can draft only Receipt vouchers (cash collections).

See RBAC.md ENTRY_MATRIX table.

---

## Interactions

- **Approve**: one-click from approver inbox. Moves to `approved`. Can then be posted by the approver or picked up later.
- **Reject**: requires a reason (text input). Moves back to Drafts with rejection reason visible.
- **Post**: triggers INFINI API call to Tally. Shows progress. On success: entry moves to Posted + tally_voucher_id populated. On failure: stays in Approved state with error flag.
- **Edit** (draft only): opens voucher form. Changes bumps `updated_at`.
- **Duplicate**: one-tap to clone a posted entry as new draft (common for recurring expenses).
- **Ledger-impact preview**: hover/tap chips in approval inbox to see exactly which ledgers get debited/credited — helps approvers catch mis-classifications.

---

## Empty / edge states

- No drafts: "You're caught up. Start a new entry or upload in bulk."
- No pending approval: "Nothing needs your approval right now."
- OCR low confidence: banner "Some fields couldn't be read clearly. Please verify before submitting."
- Post failure: red flag on entry with retry button + error message from INFINI.

---

## Avoid

- **Direct voucher edits in Tally via Riko** — we create new vouchers (or journal corrections), never edit existing ones. Tally's audit trail is non-negotiable.
- **Self-approval** — even if you drafted it, you can't approve your own entry. (Admin override is logged.)
- **Batch-approving across amount tiers** — prevents accidentally approving a ₹5L entry along with 10× ₹20k entries.
- **OCR without field-level confidence** — always show per-field confidence chips so users know what to double-check.
- **Posting without the approval chain** — no shortcuts, even for admin (use override explicitly).

---

## Lovable prompt

```
Build the Entries (voucher workflow) page for Riko (Indian SMB AI CFO, Tally-backed).

Visual: DESIGN.md. Data per DATA.md. RBAC per RBAC.md.

Top bar:
- 4 tabs: Drafts (default, count chip) / Pending Approval (count chip, tinted yellow if you're required approver) / Posted (last 30d) / Rejected
- Action bar: "+ New entry" dropdown (Sales/Purchase/Receipt/Payment/Journal/CreditNote/DebitNote/Contra/StockJournal), "Bulk upload" button, "OCR from receipt" (mobile camera), filter chips (All / My drafts / Needs my approval / Posted today), search

Entry cards:
- Voucher type pill (colored)
- State badge (Draft / Pending approval / Approved / Posted / Rejected / Posted-late)
- Amount (Space Grotesk)
- Party name + date + narration snippet
- Approval trail avatars (drafter → required approver) with per-step state
- Amount-threshold chip ("Requires Accounts" ≤₹1L, "Requires Accounts Head" >₹1L)
- Context-sensitive actions per state × role: View / Edit / Approve / Reject / Post

BULK UPLOAD MODAL (4 steps):
1. Template download per voucher type
2. Upload (drag-drop + "try sample data")
3. Preview — per-row status chips (ready/needs review/error), OCR confidence per field, inline edit; summary chips top
4. Confirm — creates drafts, routes to approvers, toast, redirect to Drafts tab

OCR-FROM-RECEIPT (mobile):
Camera → extract vendor / GSTIN / inv# / date / total / tax / line items. Show per-field confidence chips. User edits → Purchase voucher draft.

APPROVAL INBOX (for approvers):
- Header: "N items need your approval · ₹X.XCr total"
- Batch-approve checkbox (WITHIN same amount tier only, no crossing ≤₹1L/>₹1L)
- Per-item drawer: full voucher + ledger impact preview

State machine: draft → pending_approval → approved → posted (or rejected → back to draft).

Required approver by amount:
- ≤₹50k: any approver
- ₹50k-₹1L: accounts or higher
- >₹1L: accounts-head or admin

Post: triggers INFINI→Tally call with progress. Success: sets tally_voucher_id. Failure: retry button + error visible.

Do NOT allow: direct Tally voucher edits (create new/journal-correct only), self-approval (even for drafter), batch-approval crossing amount tiers, OCR without per-field confidence, bypassing approval chain (admin override logged).
```
