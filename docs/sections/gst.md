# GST Agent

GSTR-1 / 2B / 3B reconciliation and filing. Honest about what's live (via INFINI) vs blocked.

**Primary persona**: CA (primary), Accounts role (secondary), Founder (awareness).
**Top JTBD** (CA): "Reconcile 2B, resolve mismatches, file GSTR-1, file GSTR-3B — in under 30 min per client."
**Top JTBD** (founder): "Is my GST healthy? When's the next filing? Any ITC being lost?"

---

## Layout

### 1. Header row
- Title "GST Agent" + multi-GSTIN selector (pill-style if company has >1 GSTIN)
- Right: **Compliance Rating badge** — big letter grade (A, B, C, D) in colored circle. Subtitle: "from INFINI GST Advanced API"
- Tally + 2B data freshness pill ("Tally synced 14 min ago · 2B cut-off: 14 Apr · next refresh 14 May")

### 2. Build Phase strip
Honest capability disclosure:
- ✅ Phase 1: Foundation (GSTIN verification, filing history, INFINI proxy) — READY
- ✅ Phase 2: Reconciliation (2B async recon, Purchase GST summary, OTP) — READY
- 🚧 Phase 3: GSTR-1 Filing (JSON gen, party validation, submit) — AWAITING INFINI FILING API
- 🚧 Phase 4: GSTR-3B Filing (3B gen, challan, ITC cross-check) — AWAITING INFINI FILING API
- 🔜 Phase 5: Hardening — FUTURE

This strip is always visible. Sets expectation.

### 3. Pre-filing Triage card (highest priority)
- **Red blockers**: filings that can't be submitted yet (e.g., "4 invoices missing GSTIN", "Freshworks 2B mismatch ₹12.3k")
- **Yellow warnings**: filings with soft issues (e.g., "Late fees ₹500 will accrue after 20 Apr")
- Per-row action CTA ("Resolve", "Chase supplier", "Accept delta")

### 4. Filing Streak card
- Big green number: `9 months on time` (or red `3 late filings this year`)
- Mini timeline: last 12 months as dots (green = on time, yellow = late, red = missed)

### 5. Return Filing Tracker
2 rows × 12 columns grid:
- Row 1: GSTR-1 (11th of month due)
- Row 2: GSTR-3B (20th of month due)
- Cells: ✓ (filed on time, green) · 🕓 (filed late, yellow) · — (pending, gray) · ! (missed, red)
- Tap cell: drill-in to that month's return (ARN, filed date, late fee if any)

### 6. Main tabs (now the single nav pattern — drop the duplicate workflow cards)
- **Reconciliation** (default)
- **GSTR-1**
- **GSTR-3B**
- **Audit Log**

### Reconciliation tab

**Header row** (on top of tab):
- Period selector (March 2026 default)
- Match rate % (big number, color-coded)
- Stacked status bar: Matched / Manual Matched / Partial / Mismatches / Not in 2B / Not in Tally

**ITC at risk callout** (red): `₹4.2L at risk · 8 suppliers haven't filed GSTR-1 yet` with **"Remind all 8"** WhatsApp batch-remind button.

**View toggle**: Invoice · Vendor · Month
- **Invoice view** (default): per-invoice rows with recon status icon, supplier, invoice#, date, Tally amt, 2B amt, action button (Accept / Remind / Investigate / Record in Tally)
- **Vendor view**: aggregates by supplier with status rollup chip (has-partial / has-mismatch / all-matched)
- **Month view**: 6-month trend with matched / manual / partial / mismatch / missing counts and signed diff

**Filter chips** (7):
- All · Matched · Manual matched · Partial match · Mismatches · Not in 2B · Not in Tally

**Row actions**:
- Matched → Accept
- Missing in 2B → Remind supplier (WhatsApp modal)
- Mismatch → Investigate (opens side-by-side diff: Tally voucher vs 2B line)
- Missing in Tally → Record in Tally (opens voucher draft form)

### GSTR-1 tab
- Period selector
- Summary: total invoices, total taxable, total tax, B2B / B2C split
- Table 12 (HSN-wise) summary card
- Table 7 (B2C Others — state-wise) summary card
- **"File GSTR-1"** button — DISABLED with "INFINI API pending" chip in Phase 3

### GSTR-3B tab
- Auto-calc liability summary (from Sales vouchers - ITC)
- Cash vs ITC utilization breakdown
- Challan section (if liability > 0)
- **"File GSTR-3B"** button — DISABLED with "INFINI API pending" chip in Phase 4

### Audit Log tab
All GST-related actions: who triggered a 2B fetch, who accepted mismatches, who tried to file, OTPs requested. Filter by actor / date / action type.

### 7. Secure OTP modal
Separate, rigorous modal for OTP entry when triggering INFINI actions (file, fetch 2B). 6-digit input + 60-second resend timer. OTP never logged.

---

## Data

| Component | Source |
|---|---|
| Compliance rating | INFINI GST Advanced API |
| Filing tracker | `gst_filing` table (12 months) |
| 2B lines | `gstr_2b_line` table (pulled monthly via INFINI) |
| Recon match | voucher ↔ 2B_line match algorithm (invoice_no + amount + supplier_gstin) |
| ITC at risk | Purchase vouchers not yet matched to any 2B line + supplier hasn't filed GSTR-1 |
| Purchase GST summary | `SUM(cgst+sgst+igst) FROM voucher WHERE type='purchase' GROUP BY month` |

---

## RBAC

- `gst.view` — admin, accounts-head, accounts, junior-accounts, manager, viewer: read full
- `gst.file` — admin, accounts-head ONLY (high-trust action, INFINI cost)

**Sales / Field-sales**: no access to GST tab at all.

---

## Interactions

- **Multi-GSTIN switch**: top-right pill. Click → dropdown of all GSTINs company has (e.g., Maharashtra + Karnataka + Delhi registrations). Switches all tabs scope.
- **2B fetch**: button triggers INFINI call; progress bar (typically 15-30 seconds); shows counts as they come in.
- **Batch remind**: one tap WhatsApps all overdue suppliers with templated Hinglish "please file GSTR-1 soon". Each recipient shown in a review list before confirm.
- **Vendor view → drill-in**: tap vendor → full history of their filings vs our purchases from them, badge them as "reliable" (always on time) or "chronically late".

---

## Copy notes

- "Preview only" (on Phase 3/4 actions) → reframe as **"Design preview — INFINI API launching Q2"** (more aspirational, less deflating).

---

## Avoid

- **Inventing an internal "GST health score"** — the compliance rating comes from INFINI's GST Advanced API as a letter grade. Don't invent a 0-100 composite Riko score.
- **Allowing OTP entry outside the secure modal** (compliance risk).
- **Hiding the INFINI-pending status** behind generic "coming soon" language. Be honest.
- **Chat-based filing** (too risky for statutory) — filing goes through the explicit GST tab flow only.

---

## Lovable prompt

```
Build the GST Agent page for Riko (AI CFO for Indian SMBs). Desktop + mobile.

Visual: DESIGN.md. Data per DATA.md (Tally vouchers + INFINI API + gstr_2b_line + gst_filing tables). RBAC per RBAC.md.

Header:
- "GST Agent" title + multi-GSTIN pill selector (if >1 GSTIN)
- Compliance Rating badge (big letter A/B/C/D in colored circle) from INFINI GST Advanced API
- Freshness pill ("Tally synced 14 min ago · 2B cut-off: 14 Apr · next refresh 14 May")

Below header:
1. Build Phase strip — honest capability disclosure:
   ✅ Phase 1: Foundation | ✅ Phase 2: Recon | 🚧 Phase 3: GSTR-1 Filing (INFINI pending) | 🚧 Phase 4: GSTR-3B Filing (INFINI pending) | 🔜 Phase 5: Hardening
2. Pre-filing Triage: red blockers + yellow warnings with per-row Resolve actions
3. Filing Streak: big on-time streak number + 12-month mini timeline dots
4. Return Filing Tracker: 2 rows × 12 cols grid (GSTR-1, GSTR-3B) with ✓/🕓/—/! cells; tap for drill-in
5. 4 tabs: Reconciliation (default) / GSTR-1 / GSTR-3B / Audit Log

RECONCILIATION TAB:
- Period selector + big match-rate % + stacked status bar
- ITC-at-risk red callout with "Remind all N" WhatsApp batch button
- View toggle: Invoice (default) / Vendor / Month
- 7 filter chips: All / Matched / Manual matched / Partial match / Mismatches / Not in 2B / Not in Tally
- Invoice view: rows with status icon, supplier, inv#, date, Tally amt, 2B amt, action button (Accept / Remind / Investigate / Record in Tally)
- Vendor view: grouped by supplier with status rollup chips
- Month view: 6-month trend with bucket counts and signed diff

GSTR-1 TAB:
- Period + B2B/B2C split + Table 12 HSN summary + Table 7 B2C state summary
- "File GSTR-1" button DISABLED with "INFINI API pending" chip

GSTR-3B TAB:
- Auto-calc liability summary, Cash vs ITC utilization, Challan section
- "File GSTR-3B" button DISABLED with "INFINI API pending" chip

AUDIT LOG TAB:
- Full history of GST actions (2B fetch, match accept, file attempt, OTP)

Secure OTP modal (separate, 6-digit with 60s resend; OTP never logged).

Actions:
- 2B fetch: progress bar (~30s)
- Batch remind: review list → confirm → WhatsApp all overdue suppliers in Hinglish
- Vendor drill-in: their filing history vs our purchases, badge as reliable/chronically-late

RBAC: gst.view all except sales/field-sales; gst.file admin + accounts-head only.

Do NOT: invent an internal 0-100 GST score (use INFINI letter grade only), hide INFINI-pending behind generic "coming soon", or allow filing via chat.
```
