# Reports

Shareable PDFs / Excels / WhatsApp exports of key financial reports. The single highest-ROI surface for CAs who bill hourly.

**Primary persona**: CA (primary), Founder (monthly, self-serve).
**Top JTBD**: "Generate the March MIS for Bandra Soap, send to Yogesh on WhatsApp."

---

## Layout

### 1. Compliance Calendar (top)
Not a report per se — but CAs open Reports because of a filing deadline. Pin this at top.

Horizontal strip of next 14 days: each day cell shows a dot per filing due (green = filed, yellow = due soon, red = overdue). Tap day → list of filings with context.

### 2. Report catalogue (grid of cards)
6 report templates:
1. **MIS Report** (monthly P&L + ratios + AR/AP — the #1 CA deliverable)
2. **P&L Deep Dive** (ledger-level breakdown with YoY)
3. **Receivables Report** (full aging, party-level)
4. **Investor Update** (quarterly highlight deck with KPIs + commentary placeholders)
5. **GST Summary** (2B recon + return filings for the period)
6. **Board Deck** (executive summary: runway, growth, ops metrics)

Each card: icon, title, subtitle (1-line purpose), "Generate" button.

### 3. Preview pane (desktop) / full-screen (mobile)
When a report is selected:
- PDF-style preview with company logo, period, sections
- Top-right action row: **PDF · Excel · WhatsApp · Schedule**

### 4. Scheduled Reports section (desktop only, below main grid)
CAs love this. List of recurring sends:
- "MIS for Bandra Soap · Monthly on the 5th · WhatsApp to Yogesh"
- "Investor Update for Patel Industries · Quarterly · Email to 3 recipients"

Each row: name, cadence, next run, channel, pause / edit / delete.

### 5. Version history (inside each report template)
Past 12 generated versions with timestamp + sent-to. CAs revisit "what did I send last month?".

---

## Data

| Report | Source |
|---|---|
| MIS | P&L view + BS snapshot + AR/AP aging from vouchers |
| P&L Deep Dive | Ledger-group hierarchy + voucher sums by period |
| Receivables | Same as Outstanding tab export |
| GST Summary | gst_filing + gstr_2b_line for the period |
| Investor Update | Selected KPIs: revenue, GP, OpEx, runway, customer concentration — written as narrative |
| Board Deck | High-level: revenue growth, margin trends, cash position, top risks |

---

## Interactions

- **Generate**: PDF renders in ~3s (server-side). Preview updates.
- **Customize** (desktop): expand preview, pick sections to include, date range, comparison period.
- **Export PDF**: downloads.
- **Export Excel**: structured workbook with all underlying data (multiple sheets).
- **WhatsApp**: opens modal — recipient selector (from party/team contacts), message preview in Hinglish, confirm to send. Toast "Sent to Yogesh ✓".
- **Schedule**: modal — cadence (daily/weekly/monthly/quarterly), day/time, recipient, delivery channel.

---

## RBAC

- `reports.financial` — admin, accounts-head, accounts, manager, viewer
- `reports.sales` — adds sales access (sales role can generate sales-only reports)
- `reports.inventory` — for stock reports
- `reports.statutory` — for GST/TDS return PDFs

**Sales role**: only sees Sales Report + Receivables (AR) Report.

**Viewer / CA**: full access but in read + send mode (cannot delete schedules).

---

## Empty / edge states

- First visit: welcome state with one highlighted template ("Start with MIS — most popular").
- No scheduled reports: hide the Scheduled section.
- Tally sync stale: warn at top of Reports ("Data is 3 days stale — report may be outdated").

---

## Avoid

- **Email as primary channel** — WhatsApp first (Indian SMBs live on WhatsApp).
- **Editable free-form reports** — reports are structured outputs, not Word docs. Let CAs attach a one-paragraph commentary, not rewrite the whole report.
- **Branded PDFs with fake logos** — always use the company's actual logo from Profile settings.
- **Report templates beyond these 6** — adding more fractures CA workflow. Keep the list tight.

---

## Lovable prompt

```
Build the Reports page for Riko (Indian SMB AI CFO, Tally-backed).

Visual: DESIGN.md. Data per DATA.md. RBAC per RBAC.md.

Layout:
1. Compliance Calendar strip top — 14-day horizontal, dots per filing (green filed / yellow due / red overdue), tap day → list of filings
2. Report catalogue grid (3 cols desktop, 1 col mobile): 6 cards with icon, title, 1-line subtitle, Generate button:
   - MIS Report (monthly P&L + ratios + AR/AP)
   - P&L Deep Dive (ledger-level YoY)
   - Receivables Report (full aging)
   - Investor Update (quarterly highlights)
   - GST Summary (2B recon + filings)
   - Board Deck (executive summary)
3. Preview pane (desktop) / full-screen (mobile): PDF-style with company logo. Action row: PDF / Excel / WhatsApp / Schedule.
4. Scheduled Reports section (desktop): recurring sends with cadence, next run, channel, pause/edit/delete
5. Version history per template: last 12 generated versions with timestamp + recipient

Actions:
- Generate: PDF renders in ~3s, updates preview
- Customize: expand preview to pick sections, date range, comparison
- WhatsApp: recipient selector from contacts, Hinglish message preview, confirm → toast "Sent to Yogesh ✓"
- Schedule: cadence + day/time + recipient + channel modal

Role gates:
- sales: only Sales + Receivables reports
- viewer/CA: read + send but not delete schedules

Empty state: highlight "Start with MIS" on first visit.

Do NOT: lead with email channel (WhatsApp first), allow free-form Word-style edits, show fake/generic logos, or add more than 6 report templates.
```
