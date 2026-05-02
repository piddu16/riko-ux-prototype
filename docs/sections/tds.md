# TDS

Tax Deducted at Source — working paper + challan status + 26AS reconciliation.

**Primary persona**: CA, Accounts Head.
**Top JTBD**: "Have I deposited all TDS deducted this quarter? Are all 26AS entries matched to my certificates?"

---

## Layout

### 1. Header row
- "TDS Workings" title
- Period selector: "Q4 · FY25-26"
- Freshness pill
- Right: **4 statutory deadline cards** (sticky):
  - TDS deposit due (7th of following month, or 30 Apr for March)
  - 24Q / 26Q return due (31 May for Q4, else 31st of next quarter-end month)
  - Form 16 / 16A issuance (15 Jun for Q4; 15th of next month for others)
  - 26AS refresh status

### 2. Summary KPI row (4 cards)
- TDS Deducted YTD
- TDS Deposited (with % of deducted)
- Deductees count (unique PANs)
- Pending Challan (any deducted but not yet challan-posted)

### 3. Section-wise breakdown table
Rows: TDS sections (194C contractor, 194J professional, 194H commission, 194I rent, 194Q goods, etc.)
Columns: Section | Rate | Deductees | Total paid | TDS deducted | Deposited | Pending

Each row expandable to show party-level detail.

### 4. Deductee ledger
List of all parties we deducted TDS for. Columns: party name, PAN (with verify badge if 10-char validated), section, amount paid, TDS deducted, Form 16A status.

**Form 16A status pills**: Issued (green), Ready to issue (yellow), Pending challan (gray).

Row action: "Generate Form 16A" → PDF preview, send via WhatsApp or email.

### 5. Challan status table
All challans created/filed this period.
Columns: Challan no · Date · BSR code · Amount · Sections covered · Status (Deposited / Filed in 24Q / Reconciled with 26AS).

### 6. 26AS Reconciliation card
Match our deductions (as deductor) against the government 26AS statement (to see if it got credited).

- Match rate %
- Unreconciled count
- **"Fetch 26AS"** button — INFINI call (requires OTP)
- Status: Matched / In 26AS not in books / In books not in 26AS

### 7. TDS received (inbound) — separate section below
Where someone deducted TDS from US (on payments received). Matched against our Form 16A certificates from customers + our own 26AS as deductee.

---

## Data

| Component | Query |
|---|---|
| TDS Deducted | `SUM(tds_amount) FROM tds_certificate WHERE role='deductor' AND quarter=X` |
| Deductees | `COUNT(DISTINCT deductee_pan)` |
| Section breakdown | `GROUP BY section` |
| Challan status | `tds_challan` table (via INFINI CBDT integration) |
| 26AS lines | INFINI API pull from traces.gov.in |
| TDS received | `tds_certificate WHERE role='deductee'` |

---

## Statutory dates (per CBDT rules — hard-coded, not invented)

| Obligation | Date |
|---|---|
| TDS deposit (Apr-Feb) | 7th of next month |
| TDS deposit (March) | 30 April |
| Q1 return (24Q/26Q) | 31 July |
| Q2 return | 31 October |
| Q3 return | 31 January |
| Q4 return | 31 May |
| Form 16 (annual) | 15 June |
| Form 16A (quarterly) | 15th of month after quarter-end (Q4 = 15 June) |

---

## RBAC

- `gst.view` (reuses GST permission): admin, accounts-head, accounts, junior-accounts, manager, viewer
- Filing / challan creation: admin + accounts-head only (same as GST filing)

---

## Interactions

- **Generate Form 16A**: opens preview, sends via WhatsApp (to deductee's mobile from tally_party record) or email.
- **Fetch 26AS**: INFINI call with secure OTP modal, progress bar.
- **Match 26AS line**: drill-in to side-by-side diff of our record vs portal record.
- **Create challan**: form with Section + Amount + Bank account. DISABLED with "INFINI API pending" chip if upstream challan API not live.

---

## Avoid

- **Computing TDS rates ourselves** — rates change with budget; pull from a CBDT-section-rate table that gets updated centrally.
- **Skipping PAN validation** — invalid PANs cause 20% TDS flat (vs normal rate). Always verify.
- **Confusing deductor and deductee flows** — separate them visually. Inbound TDS (where we're the deductee) has totally different UX from outbound (where we deduct).
- **Quarterly-only view**: add monthly + FY totals too (some SMBs budget-track monthly).

---

## Lovable prompt

```
Build the TDS Workings page for Riko (Indian SMB AI CFO, Tally-backed).

Visual: DESIGN.md. Data per DATA.md (tds_certificate table + INFINI 26AS API). RBAC per RBAC.md.

Layout:
1. Header: "TDS Workings" + period selector (quarter) + 4 sticky deadline cards (Deposit / 24Q-26Q return / Form 16A / 26AS refresh)
2. 4 KPI cards: Deducted YTD / Deposited (with % of deducted) / Deductees count (unique PANs) / Pending Challan
3. Section-wise table: 194C/194J/194H/194I/194Q etc. Columns: Section, Rate, Deductees, Total Paid, Deducted, Deposited, Pending. Expandable per section to party-level.
4. Deductee ledger: party + PAN (with verify badge) + section + paid + deducted + Form 16A status pill (Issued/Ready/Pending challan). Row action: Generate Form 16A (PDF preview → WhatsApp/email)
5. Challan status table: challan no / date / BSR / amount / sections / status (Deposited / Filed / Reconciled)
6. 26AS Reconciliation card: match rate %, unreconciled count, "Fetch 26AS" button (INFINI, with OTP), status breakdown
7. TDS Received (inbound) section: separate UX for when we're the deductee

Statutory dates per CBDT rules (hard-coded):
- TDS deposit Apr-Feb: 7th of next month
- TDS deposit March: 30 April
- Q1/Q2/Q3/Q4 returns: 31 Jul / 31 Oct / 31 Jan / 31 May
- Form 16A quarterly: 15th of month after quarter-end (Q4 = 15 June)

Challan creation DISABLED with "INFINI API pending" chip if upstream not ready.

RBAC: gst.view gate for read (all except sales/field-sales); admin + accounts-head only for filing/challan.

Do NOT: invent TDS rates (pull from CBDT rate table), skip PAN validation (invalid = 20% flat rate), or merge deductor/deductee flows visually.
```
