# Riko Implementation Plan

**Path from rikoai.in (production today) to riko-ux-prototype (the destination).**
Working document. Owner: founder. Last revised: post-audit, post-architecture-correction.

---

## 0. How to use this document

This is the single planning doc that ties together:

- What's actually live on **rikoai.in** today (audited screen-by-screen as `yogesh@tekhne.nl`)
- What we've designed in **riko-ux-prototype** as the future state
- The **gap** between the two, sliced by feature
- **Audience priority** — SMB owner-operators first, SMB↔CA collaboration second, CA-only flows last
- **Tier-by-tier rollout** with concrete effort, resources, and risk
- **First 90 days** week-by-week
- **Hiring** sequence and costs
- **Tally write-back architecture** (XML now → Bridge agent later → TDL add-on future)

Each prototype feature already has a detailed spec in [`docs/sections/`](./sections/) — this doc stays strategic and references those for the granular UX flows.

---

## 1. Where rikoai.in stands today

### 1.1 Tech stack (confirmed by audit)

- **Frontend**: Vite + React + Tailwind + **shadcn/ui** (build artifact `index-BUuxpOnA.js`, sidebar uses `data-sidebar="menu-button"` from shadcn)
- **Auth**: **Supabase** (project ref `howqybtljjxhipcndicw`), JWT in `localStorage`
- **Multi-tenant**: `?company_id=<n>` URL param, active company stored client-side
- **Pro gating**: live and enforced — locked sections render but click is intercepted unless the company's plan permits
- **Read connection to Tally**: via INFINI API
- **Write connection to Tally**: **not built yet** — current plan is to generate XML files for users to import manually into Tally Prime (see §6)

This is good news for migration — the prototype lifts cleanly. Same Tailwind, same shadcn primitives, same React. Component code from the prototype is ~70% drop-in. Only Next.js-specific scaffolding (App Router, server components, route handlers) needs adaptation.

### 1.2 Live sections — what exists right now (audited screen-by-screen)

10 sections currently rendered, each described with the actual functionality observed.

#### Dashboard — `/dashboard?company_id=N` · Free
- Time-of-day greeting ("Good afternoon, Yogesh") + status line ("Revenue needs attention this month")
- Time-period selector (All Time / Today / MTD / FY) top-right
- **Sales row** — 3 cards (Today / MTD 2 days / FY 2026-27) with delta % vs comparison period, all using tinted backgrounds
- **Ask Riko** floating card with cycling suggested prompts ("Help me file GST returns" / "Generate sales report" / "Track expense categories")
- **Accounts Snapshot** — 6 tinted cards in a row (Sales / Receivables / Purchase / Payables / Receipt / Payment) with full-precision INR amounts. "Show more accounts" link.
- **Quick Actions** — 2 tinted cards (Outstanding Receivables / Supplier Payables) with arrow links to deep dives
- **AI Insight** card — currently shows "Limited Purchase Data" honest-warning state with a "Review Purchase Records" CTA
- **More Actions** — 3 tiles: 2024 Year in Review (Pro lock), GST Status, Stock Value
- **Alerts** column on the right — Overdue Payments, GST Filing Due, Low Stock Alert
- **Full CFO Dashboard** locked card at bottom (Pro upsell)

#### Chat — `/chat/<conversation-id>?company_id=N` · Free
- Conversation history sidebar (collapsible)
- Empty state hero — "AI-Powered Business Assistant" pill + "What can I do for you?" headline + helper line
- **4 starter chips** in a row: Sales / Expenses / Customers / Inventory (all icon + label, hairline border)
- Composer — text input + mic + voice viz (3 vertical bars) + send button (green circle, paper-plane icon)
- Single-layer responses (plain markdown text — no Answer/Calculation/Sources/Action structure yet)
- No file upload affordance visible
- No source-voucher drilldown
- No share / WhatsApp action on assistant messages

#### Items (Inventory) — `/items?company_id=N` · Free
- Title + subtitle ("Manage your stock items and levels")
- Search bar (full width) — "Search items, HSN codes…"
- 3 KPI cards with **icon + label + tinted treatment**: Current Value (₹ amount, item count), In Stock (count, "Good levels"), Need Attention (count, "Low/Out of stock")
- Filter dropdown ("All Items") + sort dropdown ("Name")
- Total summary line ("379 items · Total: ₹20,89,658.99")
- **Stock table** with columns: Product · Quantity · Value · Status. Per row: product name + Avg Purchase Rate + Avg Selling Rate + HSN code, quantity (often negative), ₹0 value for zero-stock rows
- **Status pills** rendered with tinted fills: Negative Stock (purple), Out of Stock (orange), In Stock (green) — varying tints
- Pagination at bottom ("Page 1 of 8" with prev/next)
- No godown column, no FIFO display, no dead-stock detection, no physical-count reconciliation, no margin column

#### Outstanding — `/parties?company_id=N` · Free
- **Two tabs**: Receivables (active) / Payables — rendered as a **filled green button toggle**
- Date snapshot ("as on 21 Feb 26")
- Single big number — Outstanding total (₹13,77,082.94 full precision) + "Across 16 parties" subtitle
- **Sub-tabs**: Ledgers (active) / Groups
- Search bar ("Search ledgers…")
- **Party table** with columns: Party Name (sticky) · Outstanding · On Account · Days · Bills · Oldest Due · Avg. Pay Days · Status
- Days column shows "Current" / number-of-days as plain text
- Status pills: Current (green tint), Overdue (red tint)
- Multi-select checkboxes per row
- No collection insights, no risk-matrix, no contra-settlement callout, no priority (P1/P2/P3) labels, no MSME flag on payables, no density toggle, no aging-bucket filter chips, no per-row WhatsApp Remind button, no bulk action bar, no party-360 drawer on row click

#### Reports — `/reports?company_id=N` · Free
- Title + back arrow + download-all + search bar
- **Accounts Summary** card — "as on May 2026"
  - 11 small rows in a 3-column grid: Sales / Receivables / Purchase / Payables / Receipt / Payment / Bank (—) / Cash (—) / Credit Note / Debit Note / Delivery Note / Receipt Note / Sales Order / Purchase Order
  - Each shows ledger icon + label + ₹ amount
  - Bank and Cash rows are **disabled (ghosted)** — likely awaiting bank statement integration
- Date range pickers (Start date / End date) + Clear filters
- **Financial Reports** expandable list with star + label + download icon per row:
  - Balance Sheet
  - Profit & Loss Statement
  - Cash Flow Statement
  - Trial Balance
- No compliance calendar at top, no MIS template, no investor-update / board-deck templates, no schedule-report flow, no WhatsApp send, no version history

#### Day Book — `/vouchers?company_id=N` · Free
- Title with green icon + record count ("57,522 records")
- Filter dropdown ("All") for voucher type
- Search bar ("Search party or invoice…")
- **Quick date range chips**: This Month / Last Month / This Quarter / Current FY / Last FY / **All** (active, filled green) / Custom
- **Voucher table** with columns: Date · Invoice # · Voucher Type · Party · Amount
- Voucher type column shows colored text (Debit Note red, Purchase blue, etc.)
- No party-filter chip bar (top vendor shortcuts), no grouped-by-date sections with headers, no density toggle, no row annotations, no row-click drill-in to full voucher details

#### Sales — `/sales?company_id=N` · Free
- Title + back arrow + search + download icons
- **Tabs**: Overview (active) / Customers / Products / Insights
- Filters dropdown
- **2 small KPIs**: Sales (₹0) / Return / Credit Note (₹0)
- **Sales Growth Analysis** — empty state ("No sales data available") because the Bandra Soap company has no FY26-27 data
- **Sales Breakdown** card with "Ledger" dropdown filter
- **Ledger** sub-card with search + empty state ("No party-wise data available for the selected period · Date range: 2026-04-01 to 2027-03-31")
- Customers, Products, Insights tabs are placeholder / not deeply populated
- No YoY chart, no ghost bars, no top SKUs, no HSN breakdown, no state-wise sales, no cohort retention, no concentration ladder, no payment velocity, no returns analysis

#### CFO Insights — `/cfo-insights?company_id=N` · **Pro-gated**
- Title + back arrow + time-period selector
- **Tabs at top**: Overview / Cash Flow / Expenses / Sales / Tax
- **Business Health Summary** — full-width tinted callout with prose summary + "Excellent financial performance" verdict
- **Health Score** card — big "95" number + "Financial Health · 4 achievements earned" + 4 achievement icons (gold medal, document, scissors, clock)
- **Sub-tabs**: Key Metrics (active) / Profit Analysis / Health Score / Insights
- **2 KPI cards top row**: Total Sales (₹12,78,02,896.22 + transaction count) / Loss (₹1,07,99,938.16 + "Business showing loss")
- **Advanced Metrics** section — "Analyzing data for: All Time"
- **2 KPI cards bottom**: EBITDA Margin (87.5% + "Strong performance") / Profit Per Transaction (₹1,11,767.17 + "Average per transaction")
- More content below the fold (not screenshotted)
- Mobile bottom nav: Home / Chat / Outstanding / Items / More

#### Settings — `/settings?company_id=N` · **Pro-gated**
- Title + subtitle ("Manage your account preferences and integrations") + back arrow
- **7 tabs**: WhatsApp (active) / Activity / API Keys / Webhooks / Notify / Profile / Company
- **WhatsApp Integration** card — most built-out tab:
  - Phone number input (pre-filled "9082549985") + "Not Verified" status
  - **Verify** button (green primary)
  - 6-digit OTP code input + Confirm button
  - **WhatsApp Notifications** toggle (currently ON)
  - "What you'll receive" list: Morning business summaries, Smart payment reminders, Two-way chat with Riko AI assistant
- Activity / API Keys / Webhooks / Notify / Profile / Company tabs each render their own panel (not deeply audited but exist)
- No Team / RBAC / role-preview tab in any of these — multi-user RBAC is **not built**

#### Credits & Billing — `/credits?company_id=N` · Free (but the credits ARE the metering)
- Title + subtitle + Buy Credits CTA top-right
- **3 tabs**: Overview (active) / Usage / Billing
- **Total Credits** big card — green tinted background, "85.0" big number, coin icons
- **4 credit-type cards** with **colored top stripes** (Daily blue, Monthly purple, Purchased green, Referral orange):
  - Daily 10.0/10 + "Resets in 4h 34m"
  - Monthly 75.0/75
  - Purchased 0.0
  - Referral 0.0 + "Invite friends!"
- **How Credits Work** — 4 explainer cards: Daily Credits / Monthly Bonus / Purchased Credits / Referral Credits
- Mobile bottom nav same as desktop (Home / Chat / Outstanding / Items / More)

### 1.3 Sidebar nav structure (live)

The full sidebar (desktop) shows these items from top to bottom:
- Bandra Soap Pvt Ltd (2020-20…) — **company switcher dropdown**
- Dashboard
- Chat
- Items
- Outstanding
- Reports
- Day Book
- Sales
- CFO Insights 🔒
- Settings 🔒
- Credits & Billing
- More
- ━━━━━━ separator ━━━━━━
- Company Info section: Help & Support · About Us · Contact · API Docs
- yogesh@tekhne.nl
- Sign Out

Mobile bottom nav (5 items): Home · Chat · Outstanding · Items · More.

### 1.3 What's missing entirely on rikoai.in (vs prototype)

These prototype sections have **no equivalent** on the live product:

- **GST Agent** as a dedicated module (2B reconciliation, GSTR-1 / GSTR-3B filing tracker, ITC at risk, build-phase honesty about INFINI dependencies)
- **TDS** (section-wise breakdown, 26AS reconciliation, Form 16A generation)
- **Bank Reconciliation** (statement upload, AI matching, drafts to Entries)
- **Entries** (voucher creation + approval workflow with RBAC)
- **Clients** (CA portfolio view — "I manage 18 clients, here's who needs attention today")
- **Settings → Team** (RBAC with 8 roles, role preview, invite flow)

### 1.4 What's on rikoai.in but **not in prototype**

The reverse direction — production has built things the prototype hasn't covered:

- **Credits & Billing** (the monetization model — credits per AI query, daily/monthly limits, buy credits flow)
- **Settings → API Keys / Webhooks / Activity / Notify / Profile / Company** (we only built the Team tab)
- **CFO Insights** as a Pro upsell with Achievement icons, Health Score, Advanced Metrics
- **More overflow drawer** with Sign Out, Help & Support, About, Contact, API Docs

This means the migration is **bidirectional** — most of the work is lifting prototype patterns to production, but a small amount is documenting production patterns that should be reflected back into the prototype as canonical behaviour.

---

## 2. Where riko-ux-prototype shows we're heading

The prototype is a mockup, not production code — but it codifies the product vision in concrete UX. Six themes:

### 2.1 Linear/Geist visual sobriety

Hairline borders, severity dots, no tinted card surfaces, compact INR formatting (`₹13.7L` not `₹13,77,082.94`), tight typography (`-0.02em letter-spacing`, weight 600 not 700), monospace numbers via `tabular-nums`, single-accent colour. Already shipped as the visual system across the prototype.

**Detailed spec:** [`docs/DESIGN.md`](./DESIGN.md)

### 2.2 Trust layer

System-health strip permanently visible (Tally / GSTN / Bank sync timestamps), source drilldown on every aggregate (tap "View sources" → drawer with the actual underlying vouchers), disagreement surface (when Tally says one thing and GSTR-2B says another, surface the gap, don't hide it).

### 2.3 Daily ritual

Named greeting + time-of-day, weekly streak with grace days (not Snapchat-style guilt), yesterday's-action banner closing the loop ("you said you'd call Nykaa — done?"), top-3 "This Week" Action Queue prioritised by AI.

### 2.4 Chat-first agentic interface

The 4-layer response pattern (**Answer / Calculation / Sources / Action**) — every assistant message is structured, every number cites its source vouchers, every answer ends with a verb-first action ("Ping Nykaa about ₹12.6L"). File auto-detection (drop a PDF → Riko classifies as bank statement vs invoice vs receipt → drafts the right voucher). Multi-step agentic workflows (`reconcile my March 2B` becomes 5 visible steps).

**Detailed spec:** [`docs/sections/chat.md`](./sections/chat.md)

### 2.5 WhatsApp as substrate

Native share sheet on every assistant message. Pre-formatted plain-text per answer type (no markdown — WhatsApp doesn't render it). Morning brief opt-in (delivered 9 a.m. IST). "Send report to my CA" as a one-tap flow.

### 2.6 Multi-user voucher workflow with RBAC

8 roles (admin / accounts-head / accounts / junior-accounts / manager / sales / field-sales / viewer). Approval thresholds (≤₹50k = any approver, ₹50k–₹1L = accounts, >₹1L = accounts head). Audit trail visible on every entry ("Drafted by Kavya · Junior Accounts · Approved by Sneha · Accounts Head"). Role preview ("see what a Sales person sees").

**Detailed specs:**
- [`docs/RBAC.md`](./RBAC.md) — 8 roles × permissions matrix
- [`docs/sections/entries.md`](./sections/entries.md) — voucher workflow
- [`docs/sections/settings.md`](./sections/settings.md) — Team tab

---

## 3. Strategic priorities

### 3.1 Audience priority

| Tier | Audience | Why |
|---|---|---|
| **P0** | SMB owner-operator | Primary. Time-poor, mobile-first, anxious about cash. Won't pay for tools that don't deliver value in the first session. |
| **P1** | SMB ↔ CA collaboration surface | Secondary. Features that make the SMB's data ready for the CA, or that let a CA review without duplicating work. |
| **P2** | CA-only workflows | Tertiary. Filing, Form 16A, TDS returns, Schedule III. Important — but the CA already has tools (Tally, Winman, Cleartax). Riko has to be markedly better, not just present. |

**Implication for sequencing**: build SMB-facing utility before CA workflows. The CA is the *last mile*; the SMB is the front door.

Concrete examples of how this plays out:

- **GST 2B reconciliation** = P1 (SMB does the data prep, CA reviews and files)
- **GST docs prepared by SMB for CA** = P1 (the highest-value SMB↔CA feature)
- **Actual GSTR-1 / GSTR-3B filing** = P2 (CA-only workflow)
- **Reports** (MIS, P&L) = P1 (both audiences value this)
- **Chat-driven entries** = P0 (SMB feature, complex but high SMB demand)
- **Voucher approval chain** = P0 (SMB team workflow)

### 3.2 Brand priority — chat is the differentiator

A second axis worth naming: **what carries the AI-first promise.** "Riko" as a brand only earns its name when chat actually does something agentic — answering with grounded data, processing uploads, drafting entries, prepping documents. Pure dashboard polish doesn't sell the product; chat-driven workflows do.

So even within "SMB low-hanging fruit," prioritise things that put **chat at the centre** of the daily workflow. This means: fix chat's response quality (4-layer pattern) before adding more dashboard widgets.

---

## 4. Master feature inventory

Every prototype feature mapped against audience, complexity, dependency, and effort.

**Resource codes:**
- **FE** — Frontend engineer (React + Tailwind + shadcn, can lift prototype code directly)
- **BE** — Backend / Supabase / INFINI integration engineer
- **AI** — LLM / agentic workflow engineer (Anthropic API, tool use, prompt engineering)
- **CA** — Chartered Accountant partner (compliance review, statutory sign-off)
- **DS** — Designer (motion, flows, edge states)
- **QA** — Tester / customer success
- **DT** — Desktop developer (Windows, .NET / Electron — only for Phase 2 Bridge agent)

| # | Feature | Audience | Complexity | Resources | Effort | Dependencies |
|---|---|---|---|---|---|---|
| **VISUAL TREATMENT** |
| 1 | Linear/Geist visual lift (hairline cards, severity dots, compact INR) | All | Low | 1 FE + 0.5 DS | 1 wk | — |
| 2 | Light/dark theme toggle | All | Low | 1 FE | 2 days | #1 |
| 3 | Mobile scroll fixes (`100svh`, safe-area, body lock) | All | Low | 1 FE | 2 days | — |
| **TRUST LAYER** |
| 4 | System health strip (Tally / GSTN / Bank sync status) | All | Low-Med | 1 FE + 1 BE | 1 wk | sync-status API |
| 5 | Source drilldown ("View sources" drawer) | All | Med | 1 FE + 1 BE | 2 wks | Backend `traceId` on aggregates |
| 6 | Disagreement surface (Tally vs 2B mismatch callout) | All | Med | 1 FE + 1 BE | 1 wk | #5 |
| **DAILY RITUAL** |
| 7 | Named greeting + time-of-day | SMB | Low | 1 FE | 1 day | — |
| 8 | Streak counter (weekly, with grace days) | SMB | Low | 1 FE | 2 days | — |
| 9 | Yesterday's action banner ("you said you'd call Nykaa…") | SMB | Med | 1 FE + 1 BE | 1 wk | persistent action store |
| 10 | "This Week" Action Queue (top 3-5 prioritised actions) | SMB | Med | 1 FE + 1 AI | 2 wks | ranking model |
| 11 | WhatsApp morning brief opt-in | SMB | High | 1 BE + 1 FE | 3 wks | WhatsApp Business API + scheduler |
| **DISTRIBUTION** |
| 12 | Native share button on every answer | SMB | Low | 1 FE | 2 days | — |
| 13 | Pre-formatted WhatsApp text per answer type | SMB | Low | 1 FE | 1 day | — |
| 14 | "Send report to CA via WhatsApp" flow | SMB ↔ CA | Med | 1 FE + 1 BE | 1 wk | WA Business API |
| **CHAT INTELLIGENCE** |
| 15 | 4-layer response pattern (Answer/Calc/Sources/Action) | All | Med | 1 AI + 1 FE + 1 BE | 3 wks | Tool-call schema, response ranker |
| 16 | File auto-detection (PDF/Excel/image → bank stmt / invoice / etc.) | SMB | High | 1 AI + 1 BE | 4 wks | OCR pipeline, classifier |
| 17 | Voice input (Hinglish STT) | SMB | Med | 1 FE + 1 AI | 1 wk | Whisper / Bhashini API |
| 18 | Multi-step agentic workflows ("reconcile my March 2B" → 5-step) | All | High | 2 AI + 1 BE | 6 wks | Tool framework, error recovery |
| 19 | Entries through chat (draft voucher from chat) | SMB | High | 1 AI + 1 BE | 4 wks | XML generators (#41–46) |
| 20 | Reports through chat ("show me March MIS") | SMB ↔ CA | Med | 1 AI + 1 FE | 2 wks | Existing report templates |
| **SECTION-LEVEL** |
| 21 | Dashboard Action Queue + Runway timeline + KPI grid (visual lift) | SMB | Low | 1 FE | 1 wk | #1 |
| 22 | Outstanding: aging buckets, bulk WhatsApp reminders, MSME flag (AP) | SMB | Med | 1 FE + 1 BE | 2 wks | WA send infra |
| 23 | Sales tab: Customers / Products / Insights (Tally-grounded) | SMB | Med | 1 FE + 1 BE | 2 wks | Sales register w/ inventory |
| 24 | Day Book: party filter, grouped-by-date, density toggle | All | Low | 1 FE | 3 days | — |
| 25 | Inventory: godown tabs, FIFO display, dead stock | SMB | Med | 1 FE + 1 BE | 2 wks | Tally godown data |
| 26 | Inventory: physical count reconciliation modal | SMB | High | 1 FE + 1 BE | 3 wks | Stock-journal XML (#46) |
| 27 | Reports: compliance calendar + 6 templates + WhatsApp send + schedule | SMB ↔ CA | Med | 1 FE + 1 BE | 3 wks | Scheduler, template engine |
| **GST / TDS** |
| 28 | GST 2B reconciliation (SMB does the work, CA reviews) | SMB ↔ CA | Med | 1 FE + 1 BE + 0.5 CA | 3 wks | INFINI 2B fetch (existing) |
| 29 | GST docs prep (SMB readies → CA files) | SMB ↔ CA | Med | 1 FE + 1 BE + 0.5 CA | 2 wks | #28 |
| 30 | GSTR-1 filing (CA-driven) | CA | High | 1 BE + 1 CA | 4 wks | INFINI filing API |
| 31 | GSTR-3B filing (CA-driven) | CA | High | 1 BE + 1 CA | 4 wks | INFINI filing API |
| 32 | TDS section-wise + 26AS reconciliation | SMB ↔ CA | Med | 1 FE + 1 BE + 0.5 CA | 3 wks | INFINI 26AS pull |
| 33 | Form 16A generation | CA | Med | 1 BE + 1 CA | 2 wks | TDS data complete |
| **MULTI-USER / TEAM** |
| 34 | Settings → Team (RBAC, 8 roles, invite flow) | All (team plan) | Med | 1 FE + 1 BE | 2 wks | Auth tenanting |
| 35 | Entries voucher workflow (draft → approve → export) | SMB | Med | 1 FE + 1 BE | 2 wks | RBAC, XML generators |
| 36 | Bank Reconciliation (CSV upload, AI match, drafts) | SMB | High | 1 FE + 1 BE + 1 AI | 4 wks | Statement parser, matcher |
| **CA-SPECIFIC** |
| 37 | Clients (CA portfolio grid, bulk actions) | CA | Med | 1 FE + 1 BE | 2 wks | Multi-tenant context |
| 38 | Bulk MIS for N clients | CA | Med | 1 BE + 1 FE | 2 wks | #27 + #37 |
| 39 | Schedule III compliance advisor | CA | High | 1 BE + 1 CA | 4 wks | Domain knowledge encoded |
| 40 | Balance sheet rearrangement helper | CA | High | 1 BE + 1 CA | 3 wks | #39 |
| **TALLY WRITE-BACK (XML PIPELINE)** |
| 41 | XML generator: Sales voucher | SMB | Med | 1 BE + 0.5 CA | 1 wk | Tally TDL schema |
| 42 | XML generator: Purchase voucher | SMB | Med | 1 BE + 0.5 CA | 1 wk | Tally TDL schema |
| 43 | XML generator: Receipt + Payment | SMB | Med | 1 BE | 1 wk | — |
| 44 | XML generator: Journal + Contra | SMB | Med | 1 BE | 4 days | — |
| 45 | XML generator: Credit + Debit Note | SMB | Med | 1 BE | 4 days | — |
| 46 | XML generator: Stock Journal | SMB | Med | 1 BE | 4 days | — |
| 47 | XML schema validator (against Tally TDL) | SMB | Med | 1 BE | 1 wk | — |
| 48 | "Today's vouchers" bundle download | SMB | Low | 1 FE + 1 BE | 1 wk | #41–46 |
| 49 | Post-import status reconciliation flow | SMB | Med | 1 FE + 1 BE | 1 wk | #48 |
| 50 | Phase 2: Riko Bridge agent for Windows | SMB | High | 1 DT | 8–12 wks | Phase 1 stable |

---

## 5. Tier-by-tier rollout

### Tier 1 — Foundations (Weeks 1–6)
*SMB visual + trust + WhatsApp*

The cheapest, biggest-trust-gain work. Pure CSS / component swaps + simple read-only backend. Ships behind a feature flag (`?ui=v2`) and defaults ON after a week of internal dogfooding.

**What ships:** Items #1, #2, #3, #4, #7, #8, #12, #13, #21, #24

**Concrete effect:** rikoai.in starts feeling Linear-grade visually, every aggregate number ties to a sync timestamp, every chat answer can be shared to WhatsApp in one tap, the Dashboard surfaces "this week's actions" instead of generic KPIs.

**Resources:**
- 1 FE engineer (full-time)
- 1 designer (half-time)
- 0.5 BE engineer for the sync-status endpoint

**Risk:** Near-zero. Pure UI. No data mutation.

**Deliverable:** rikoai.in is visually equivalent to the prototype on Dashboard, Day Book, Outstanding (visual layer only — features unchanged).

---

### Tier 2 — Chat as the front door (Weeks 4–14, overlapping with Tier 1)
*The brand promise — chat actually does something*

This is where Riko earns its name. The 4-layer response pattern + source drilldown + WhatsApp share is what makes the product feel intelligent — not just polished data.

**What ships:** Items #5, #6, #15, #20, #22 (parts), #23, #17 (stretch)

**Flow — concrete:**

1. SMB opens app → empty Chat with starter chips (already live)
2. Asks "what's my cash runway?"
3. **Riko returns 4 layers:**
   - **Answer** (bold, one line): `9 days`
   - **Calculation** (label : value table): `Cash on hand ₹5.6L / Daily burn ₹56,667 = Runway 9 days`
   - **Sources** (subtle): `From bank statement (21 Apr) + 90 days of payment vouchers · ▸ Details`
   - **Action** (verb-first button): `Ping Nykaa about ₹12.6L due`
4. SMB taps **"View sources"** → side drawer opens with the actual 5–8 underlying vouchers (voucher no, type, date, party, amount)
5. SMB taps **Share** → native iOS / Android share sheet → WhatsApp pre-loaded with formatted answer → forwards to CA

**Why this first within Tier 2:** every other smart feature (file upload, agentic workflows, entries-via-chat) builds on this same response shape. Get it right once.

**Resources:**
- 1 AI engineer (full-time)
- 1 BE engineer
- 1 FE engineer
- Anthropic API key + token budget (estimate ₹50K–₹2L / month at scale)

**Risk:** Medium. Data layer needs `traceId` + source-row preservation on every aggregate query. Some refactoring of existing report endpoints. Users see structured answers immediately.

**Deliverable:** chat becomes the differentiator. Existing dashboard surfaces still work; chat is where the magic appears.

---

### Tier 3 — File copilot + reports as a system (Weeks 10–22)
*The "drop a file, Riko knows what to do with it" moment*

The headline agentic moment, plus reports as a recurring deliverable, plus the SMB↔CA collaboration surface.

**What ships:** #16 (file auto-detection), #20 (reports through chat), #27 (Reports module with calendar + WhatsApp send + schedule), #14 (send to CA flow), #28 (GST 2B recon), #29 (GST docs prep)

**Flow #1 — File upload (the canonical demo):**

1. SMB drops a PDF into chat (e.g. `hdfc-bank-april.pdf`)
2. Composer chip shows: `hdfc-bank-april.pdf · 84 KB · Detecting…`
3. ~900ms later, chip updates: `Bank statement` (auto-detected via filename + content)
4. Chat answers: *"Bank statement detected · 147 lines. Auto-matched 129 to Tally vouchers. 18 need review."* with a canvas artifact showing the recon table
5. SMB taps "Review the 18" → drawer opens with each unmatched line + suggested voucher matches
6. One-click match → drafts go to Entries queue (Tier 4)

Same flow for purchase invoices (OCR → vendor extracted → draft Purchase voucher), expense receipts (Payment voucher), sales POs (Sales invoice). Classifier runs on filename + extension first; OCR + LLM verification second.

**Flow #2 — Monthly MIS to CA (the SMB↔CA bridge):**

1. SMB asks Riko: *"send March MIS to my CA"*
2. Riko generates the report from existing P&L + receivables aging + GST status
3. Renders preview in canvas
4. Confirms recipient (saved CA contact in Settings)
5. Sends via WhatsApp Business API with PDF attached
6. CA receives it Friday morning — same content they'd manually compile in 2 hours

**Why this first within Tier 3:** SMBs hire CAs to do "the report stuff." If Riko can produce it AND deliver it to the CA, you've automated the most expensive recurring workflow in their relationship. The CA still reviews and files; Riko removes the prep burden.

**Resources:**
- 2 AI engineers (file detection + agentic workflow)
- 1 BE for INFINI 2B fetch (likely already exists) + scheduler infra
- 1 FE
- 1 designer
- **1 CA partner (half-time)** to validate GST docs format + CA-handoff UX
- WhatsApp Business API budget
- OCR API budget (Document AI / Mistral / similar — ₹20–80K / month)

**Risk:** Medium-high. OCR accuracy is the headline failure mode — a misread invoice that ends up as a wrong Purchase voucher costs the SMB real money. **Mitigation:** every OCR draft is held in Entries queue (Tier 4) for human review before exporting; never auto-export.

**Deliverable:** the product is now genuinely agentic. Drop anything → Riko knows what to do with it. The SMB↔CA loop is automated for the 80% case.

---

### Tier 4 — Multi-user + voucher workflow + bank recon (Weeks 16–22)
*Team-plan unlock — accounts staff become users*

Once accounts staff exist as users (not just the owner), the workflow needs RBAC + approval chains. Entry workflow now uses XML export (no INFINI write-back), which **drops effort from 4 weeks to 2 weeks** vs the original plan and makes risk much lower.

**What ships:** #34 (Settings → Team RBAC), #35 (Entries voucher approval workflow), #36 (Bank Reconciliation), #11 (WhatsApp morning brief — needs scheduler from Tier 3), #19 (entries through chat), #41–49 (XML pipeline)

**Flow — Entries with approval chain:**

1. Junior accounts uploads a stack of 40 vendor invoices via OCR or batch CSV
2. Riko classifies + drafts 40 Purchase vouchers, all in `Draft` state
3. Each draft routed to `Accounts` (≤₹1L) or `Accounts Head` (>₹1L) based on amount
4. Approvers see their queue at the top of the Entries tab with the orange "REVIEW" chip
5. Approve → state changes to `Approved`, ready for export
6. End of day, owner clicks "Download today's vouchers" → single XML file with all 40 (`riko-vouchers-2026-04-21.xml`)
7. Owner opens Tally → Import → selects XML → Tally confirms 40 imported
8. Owner clicks "Confirm imported" in Riko → state changes to `Confirmed`
9. Audit trail visible on every voucher: *"Drafted by Kavya · Junior Accounts · 21 Apr 14:18 → Approved by Sneha · Accounts Head · 21 Apr 16:42 → Exported 21 Apr 18:00 → Confirmed in Tally 21 Apr 18:15 by Yogesh · Admin"*

**Why fourth:** the entire voucher-approval workflow assumes RBAC exists, assumes the file-detection pipeline from Tier 3 is producing accurate drafts, assumes XML generators are validated. Building it earlier is putting the cart before the horse.

**Resources:**
- 1 BE engineer focused on **Tally TDL / XML schema** (most complex piece — XML generators that conform to Tally Prime's import schema, with regression testing across all 9 voucher types)
- 1 FE for the approval-queue UI + Settings → Team
- 1 AI for chat-to-voucher tool calls
- 0.5 CA partner for XML schema validation + voucher-type semantics

**Risk:** Medium (was high). With XML export instead of direct write-back, the destructive surface goes away. Worst case of malformed XML: user's import fails with an error → fix and retry. **Mitigation:** regression suite of 200+ representative vouchers tested against a real Tally instance before each release.

**Deliverable:** Riko becomes the team's voucher-entry surface. Real revenue uplift — team plans cost more than solo plans.

---

### Tier 5 — CA-specific workflows (Weeks 24+)
*Filing flows, portfolio management, advanced compliance*

Everything CA-only. Comes last because:
- Existing CA tools (Tally, Cleartax, Winman) already cover filing
- Riko has to be markedly better — the CA's *experience* of using Riko has to be cleaner than what they're used to
- CA's primary value from Riko is *receiving cleaner inputs from the SMB* — so build the inputs (Tier 1–4) first

**What ships:** #30 (GSTR-1 filing), #31 (GSTR-3B filing), #32 (TDS recon), #33 (Form 16A), #37 (Clients portfolio), #38 (bulk MIS), #39 (Schedule III), #40 (BS rearrangement)

**Resources:**
- 1 BE specialist on INFINI filing APIs (most complex — these handle real money, real penalties)
- 1 CA partner (full-time) for product reviews + validation testing
- 1 FE for CA-facing surfaces
- Possibly 1 dedicated QA cycle for filing flows

**Risk:** Very high. Bad GSTR-1 = penalty for the SMB + reputation hit for Riko + potential regulatory action. **Mitigation:** filing flows need a multi-step confirmation gate (preview → consent OTP → submit) and full audit log. Beta with 5 hand-picked CAs for 2 cycles before broad release.

**Deliverable:** Riko replaces the CA's existing filing tooling for any client whose data is already in Riko. CA can manage their full portfolio of 30–50 clients in one app.

---

## 6. Tally write-back architecture

The constraint correction — Tally writes are **not via INFINI**, they're via XML export. This significantly de-risks the roadmap and reshapes the daily workflow.

### 6.1 Phase trajectory

| Phase | Mechanism | Friction | When |
|---|---|---|---|
| **Phase 1 (now)** | XML download → manual import in Tally | High — user has to be at the Tally machine | Tier 4 launch (Q2) |
| **Phase 2 (next)** | Tally Bridge agent — small Windows app on SMB's PC, listens locally on Tally's HTTP gateway port 9000, tunnels to Riko cloud via outbound WebSocket | Low — one-time install, then auto | 6–9 months after Phase 1 |
| **Phase 3 (future)** | Custom TDL add-on running inside Tally for richer two-way sync (live editing, real-time stock queries) | Native | 12+ months |

### 6.2 Why this trajectory and not "skip to Bridge agent"

- Phase 1 is shippable with **zero new code on the SMB's machine.** Validates the workflow, validates that SMBs actually want chat-driven voucher creation, validates that the XML generators are right.
- Phase 2 is a sustaining engineering project. Bridge agent is what every modern Tally integration eventually builds (Suvit, Botkeeper, Refrens etc. all have one). Once Phase 1 has product-market fit signal, you build it.
- Phase 3 is exotic and expensive. Only justified if there are workflows that don't fit XML at all (live editing of vouchers during chat, real-time stock queries).

### 6.3 The asymmetry this creates in daily workflow

```
DAY (mobile, anywhere)            EVENING (desktop, at Tally machine)
───────────────────────────       ──────────────────────────────────
Drop invoice in Riko              Open Tally
Drop bank statement               Open Riko
Approve drafts on phone           Click "Download today's vouchers"
                                  → riko-vouchers-2026-04-21.xml (47 vouchers)
                                  Tally → Import → select XML
                                  Tally confirms 47 imported
                                  Riko shows "47 marked as posted"
```

This isn't a bug; it actually matches how SMBs already work — they live on WhatsApp and mobile during the day, sit at their PC after hours to "do the books." But the UI design needs to reflect this rhythm:

- **Mobile UI** — show drafts piling up, but no "Post to Tally" button. Show "47 ready for evening import"
- **Desktop UI** — when opened from the same network as the Tally machine, surface a "Download today's vouchers" CTA prominently
- **Status reconciliation** — drafts in Riko need a status flow more honest than "posted." Use: `Drafted → Approved → Exported → Confirmed`. The last transition is manual confirmation by the user (or auto-detected when Phase 2 Bridge agent ships)

This becomes Riko's signature daily ritual loop: **draft on mobile during the day → confirm at desk in the evening.** That's a clean product story to tell.

### 6.4 Validation strategy for XML generation

The one engineering risk in Phase 1 is generating malformed XML.

- Each generator written with a TDL-conformant template
- Regression suite: 200+ representative vouchers (all 9 types × edge cases — multi-line items, GST rate variations, party with no GSTIN, journals with cost-centre allocation, contra entries, etc.)
- Each PR runs the suite; failure blocks merge
- Phase 1 ships only after **99%+ of the corpus imports cleanly** into a real Tally Prime instance
- Hire someone who has actually shipped a Tally XML integration in production — there are well-documented gotchas around date formats, GSTIN validation, ledger naming, and party master synchronisation

---

## 7. Resource plan

### 7.1 Minimum viable team (Tiers 1–2, weeks 1–14)

| Role | FTE | Why |
|---|---|---|
| Frontend engineer (React / Tailwind / shadcn) | 1.0 | Drives most visible work. Can lift prototype directly. |
| Backend engineer (Supabase + INFINI) | 0.5 | Sync-status endpoint, source-trace plumbing |
| AI / Agentic engineer | 1.0 | 4-layer response, tool-calling foundation |
| Designer | 0.5 | Visual treatment, mobile flows, edge states |
| QA + customer success | 0.5 | Internal dogfooding, SMB feedback loops |

**Total: 3.5 FTE × 14 weeks ≈ ₹40–50L** in salary depending on seniority (Indian rates), plus Anthropic API + WhatsApp Business + Supabase costs.

### 7.2 Tier 3 add-ons (weeks 10–22)

| Role | FTE add | Why |
|---|---|---|
| AI engineer (file detection + OCR) | +1.0 | OCR is its own subdiscipline |
| Backend engineer | +0.5 | Bumps to 1.0 — scheduler, INFINI extensions |
| CA partner | +0.5 | Compliance review for GST docs + report formats |

**Add ~₹25L over weeks 10–22.**

### 7.3 Tier 4 add-ons (weeks 16–22)

| Role | FTE add | Why |
|---|---|---|
| Senior backend engineer (Tally TDL/XML specialist) | +1.0 | Tally XML pipeline is the most domain-specific engineering surface. **Hire someone who has shipped a Tally integration before** — TDL contractors in India are common, but quality varies wildly. |

### 7.4 Tier 5 add-ons (weeks 24+, CA-specific)

| Role | FTE add | Why |
|---|---|---|
| CA partner | +1.0 | Bumps to 1.5 — filings, Schedule III, BS rearrangement |
| QA | +0.5 | Filing surfaces need extensive regression |

### 7.5 Phase 2 (months 6–9)

| Role | FTE add | Why |
|---|---|---|
| Windows desktop engineer (Electron or .NET) | 1.0 (contract) | Bridge agent — 8–12 weeks, then maintenance only |

### 7.6 Tooling + API costs (running estimate)

| Service | Monthly cost (Tier 2 onwards) |
|---|---|
| Anthropic Claude API (chat + tool-calling) | ₹50K–₹2L depending on usage |
| WhatsApp Business API (Meta) | ₹15–25K + per-message |
| Supabase (Postgres + Auth + Realtime) | ₹10–20K (current usage) |
| INFINI API (statutory) | existing contract |
| OCR (Document AI / Mistral / similar) | ₹20–80K depending on volume |

---

## 8. Concrete first 90 days

### Weeks 1–2: Visual lift PR + sync status

**Frontend:** Clone prototype tokens, Pill, KpiCard patterns into rikoai.in. Single PR, Dashboard only, behind `?ui=v2`. Internal team dogfoods.

**Backend:** Build `/api/sync-status` returning Tally + GSTN + Bank last-sync timestamps.

**Designer:** Review live + prototype side-by-side, finalise the canonical visual treatment (light vs dark default — see open decisions §11).

### Weeks 3–4: Source drilldown + WhatsApp share

**Frontend:** SourceDrawer component lifted from prototype, wired to a new `?trace=...` URL param.

**Backend:** Every Dashboard / Outstanding / Sales aggregate query starts returning `traceId` + raw row sample.

**AI/Frontend:** Native Share API + WhatsApp formatter in chat.

### Weeks 5–6: Default `?ui=v2` ON, propagate to Outstanding + Day Book

Visual lift across Outstanding (kill green-filled tab toggle, hairline status pills, sober Days column).

Visual lift on Day Book (subtle filter chip row, grouped-by-date sections).

Begin design work on 4-layer chat response.

### Weeks 7–9: 4-layer chat response pattern

**AI engineer:** Define the response schema (`answer` / `calculation` / `sources` / `action` / `traceId` / `canvasRef`).

**Backend:** Tool-calling against existing endpoints, structured output validation.

**Frontend:** Render the 4 layers in chat (lift from prototype `riko-chat` directly).

**Internal A/B test:** measure answer satisfaction with real users.

### Weeks 10–12: File upload auto-detection (alpha)

**AI engineer:** Classifier from filename + extension (lift `lib/file-detector.ts` from prototype). Mock OCR initially; real OCR later.

**Frontend:** Composer drag-drop + chip + progress states.

**Backend:** File upload endpoint, OCR pipeline scaffolding.

**Private beta:** 5 hand-picked SMBs.

### Weeks 13–14: Reports as deliverables + WhatsApp send

**Frontend:** Reports module with the prototype's 6 templates.

**Backend:** Scheduler service for recurring sends.

**WhatsApp send flow:** render PDF → upload → forward.

This single feature is what your CA-target users will sign up for.

### End-of-Q1 milestone

- ✅ Dashboard, Outstanding, Day Book look Linear-grade
- ✅ Every aggregate number traces back to its source vouchers
- ✅ Chat answers come in 4 grounded layers
- ✅ Files dropped into chat get auto-classified
- ✅ Reports can be scheduled and sent to CAs via WhatsApp

What's still to come (Q2 onwards): voucher approval workflow, bank reconciliation, full GST agent, CA portfolio, filing flows.

---

## 9. Key risks + dependencies

### 9.1 Risk register

| Risk | Surface | Mitigation |
|---|---|---|
| OCR misreads → wrong voucher data | File auto-detection | Always hold drafts in Entries queue for review; never auto-export. Human-in-the-loop for first 6 months. |
| Malformed XML → import fails in Tally | XML generators | 200+ regression suite, manual import test before each release, hire a TDL specialist |
| GSTR-1 / 3B filing failure | CA filing flows | Triple-confirmation gate, INFINI dry-run mode, CA sign-off before submit |
| WhatsApp Business API rate limits / cost spike | Reports + reminders | Batch sends, delivery throttle, cost caps per company |
| Pro-tier gating regresses for existing customers | Visual lift PR | Feature flag the entire v2 visual layer; never break paying customer flows |
| Source drilldown leaks data across companies | Trust layer | Strict per-tenant query filtering; integration tests on multi-tenant flows |
| OCR cost runaway as user base grows | File auto-detection | Per-company quotas tied to plan tier; cheaper classifier (filename+extension) tries first before invoking OCR |

### 9.2 Dependency graph

```
Tier 1 (visual)        →  ships independently
Tier 2 (chat 4-layer)  →  blocks every other AI feature
Tier 3 (file detect)   →  needs Tier 2 (response shape)
Tier 4 (entries chain) →  needs Tier 3 (file → draft pipeline)
                          + RBAC
                          + XML generators (#41–46)
Tier 5 (CA filings)    →  needs Tier 4 (entries) + INFINI filing API readiness
WhatsApp morning brief →  needs scheduler infra (Tier 3) + WA opt-in (Settings)
Bridge agent (Phase 2) →  needs XML pipeline stable + Tally HTTP gateway investigation
```

---

## 10. Open decisions before kickoff

These need a founder-level call before any work begins:

### 10.1 Theme default

Live runs **light**. Prototype runs **dark**. Three options:

- **a)** Keep light as default, build dark as opt-in toggle
- **b)** Switch default to dark (more "premium finance terminal" feel — Linear, Vercel)
- **c)** System-prefers detection (auto-match user's OS preference)

Recommend **(c)** + ability to override. Maximum signal, minimum friction.

### 10.2 Compact INR vs full precision

`₹13.7L` reads modern but might confuse a CA used to `₹13,77,082.94`. Three options:

- **a)** Compact everywhere
- **b)** Full precision everywhere (current state)
- **c)** Compact in headlines + KPI cards, full precision in tables and tooltips

Recommend **(c)**. CAs get the full precision in detail views; SMBs get scannable summaries on the dashboard.

### 10.3 Repo access

Do you want me to PR directly to the rikoai.in repo, or hand the spec to your dev?

- **PR direct** is faster (I can ship Tier 1 in 4–5 days)
- **Spec to dev** keeps your team in the loop and is more sustainable
- **Hybrid:** I PR Tier 1 to validate the pattern, your team handles Tier 2 onwards with my specs

### 10.4 Mobile bottom nav vs sidebar at <768px

Live has both (sidebar collapses to a 5-tab bottom nav). Prototype has a similar pattern. Worth confirming the bottom-nav 5 items match prototype's 5:

| Live | Prototype |
|---|---|
| Home | Dashboard |
| Chat | Chat |
| Outstanding | Outstanding |
| Items | Inventory |
| More | More |

These align cleanly. No change needed. ✓

### 10.5 Free vs Pro gating boundary

Right now CFO Insights and Settings are Pro-gated; Dashboard, Chat, Items, Outstanding, Reports, Day Book, Sales, Credits are free. As we add features, where do they land?

Suggested rule of thumb:
- **Free tier** — read-only, single-user, single-company: Dashboard, Chat (limited queries/day), Outstanding, Items, basic Reports, Day Book, Sales overview
- **Pro tier** — multi-user (Team), unlimited chat, advanced reports, scheduled reports, GST 2B recon, file uploads, voucher approval workflow, CFO Insights deep-dive
- **CA tier** — Pro + Clients portfolio, bulk MIS, filing flows, multi-company management

This boundary needs founder + commercial alignment, not just engineering opinion.

### 10.6 CA partner identification

You'll need at least one CA reviewing every compliance-touching feature from Tier 3 onward. **Who?**

- Friend / advisor / first-customer CA — informal, free, slow
- Hired CA partner — half-time or full-time consultant rate
- CA agency / firm partnership — they invest time, you build their preferred workflow into the product

Recommend a single named CA partner you can put on retainer for ~10 hrs/week starting Tier 3. Without one, the CA-facing features are guesswork.

---

## 11. Appendix A — feature flow specs

For the granular UX of each feature, refer to the existing section docs in [`docs/sections/`](./sections/):

- [`dashboard.md`](./sections/dashboard.md) — Dashboard
- [`chat.md`](./sections/chat.md) — Chat (4-layer pattern)
- [`clients.md`](./sections/clients.md) — CA portfolio
- [`outstanding.md`](./sections/outstanding.md) — AR / AP
- [`gst.md`](./sections/gst.md) — GST Agent
- [`tds.md`](./sections/tds.md) — TDS
- [`daybook.md`](./sections/daybook.md) — Day Book
- [`sales.md`](./sections/sales.md) — Sales Analytics
- [`inventory.md`](./sections/inventory.md) — Inventory + physical count
- [`reports.md`](./sections/reports.md) — Reports module
- [`settings.md`](./sections/settings.md) — Settings → Team RBAC
- [`entries.md`](./sections/entries.md) — Voucher approval workflow
- [`bank-recon.md`](./sections/bank-recon.md) — Bank Reconciliation

Plus the foundational reference docs:

- [`README.md`](./README.md) — product overview + glossary
- [`DESIGN.md`](./DESIGN.md) — visual system tokens + components
- [`DATA.md`](./DATA.md) — Tally data surface + canonical aggregations
- [`RBAC.md`](./RBAC.md) — 8 roles × permissions matrix

---

## 12. Appendix B — file-by-file lift map

Specific prototype files that port directly to rikoai.in, ordered by impact / effort:

### Drop-in lifts (Tier 1, pure CSS/component)

| Prototype file | Replaces in rikoai.in | Effort |
|---|---|---|
| `app/globals.css` (the `:root` token block) | rikoai.in's existing palette | 30 min — paste variables |
| `src/components/ui/pill.tsx` (subtle variant) | shadcn `Badge` calls — wrap with Pill subtle | 1 hr |
| `src/lib/format.ts` (`fL`, `fCr`, `formatINR`) | Inline `Number.toLocaleString` calls | 30 min |
| `KpiCard` pattern (from `src/components/screens/inventory.tsx` lines 785–823) | rikoai.in's existing KPI cards on Dashboard / Items | 1 hr per page |
| `scripts/sweep-chips.py` (the chip-active-state sed) | Filter chips on every screen | 30 min — runnable sed |

### Structural lifts (Tier 2, copy components, adapt routing)

| Prototype file | What it adds | Effort |
|---|---|---|
| `src/components/ui/action-queue.tsx` | "This Week" prioritized actions on Dashboard | 1 day |
| `src/components/ui/runway-timeline.tsx` | Single hairline track + marker (replaces gradient bar) | 0.5 day |
| `src/components/source-drawer.tsx` (from riko-chat) + `lib/source-trace.ts` | Trust layer — every number gets "View sources" drawer | 2 days (needs backend `traceId`) |
| `src/components/system-health.tsx` (from riko-chat) | Always-visible Tally / GSTN / Bank sync strip | 1 day (needs `/api/sync-status`) |
| `src/components/share-button.tsx` | Native Share API + WhatsApp deep link | 0.5 day |
| `src/components/message.tsx` (riko-chat) — 4-layer pattern | Replaces today's flat Chat answers | 3 days (needs server-side response shape) |

### Net-new screens (Tier 3+, build from prototype as spec)

| Prototype source | Production gap |
|---|---|
| `src/components/screens/gst.tsx` | No GST module on rikoai.in — full 4-tab build (~3 weeks) |
| `src/components/screens/bank-recon.tsx` | Doesn't exist — full build (~4 weeks) |
| `src/components/screens/entries.tsx` | Doesn't exist — full build (~4 weeks) |
| `src/components/screens/clients.tsx` | Doesn't exist — full build (~2 weeks, builds on existing `?company_id` plumbing) |
| `src/components/screens/tds.tsx` | Doesn't exist — full build (~3 weeks) |

---

## 13. Appendix C — Complete prototype feature census

Every feature, sub-feature, and UX detail built into the prototype, organised by section + cross-cutting concern. Each item is mapped to the Tier where it should land in the migration plan. Items not in the master inventory (§4) are flagged with `(+)` so they're not lost.

### C.1 Onboarding & first-run

| # | Feature | Tier | Notes |
|---|---|---|---|
| C-01 | Onboarding modal: name input → Connect Tally / Upload Exports / Demo data picker (+) | Tier 1 | First-time visitor experience. Mocked in prototype; needs real Tally connect flow on rikoai.in |
| C-02 | "Try with sample data" path (+) | Tier 1 | Lets a prospect see the product without any data setup |
| C-03 | First-Insight auto-run on Tally sync completion (+) | Tier 3 | Spotify-Wrapped-on-Day-0 — the activation moment |
| C-04 | Stale-data banner when Tally sync >6h old (+) | Tier 1 | Soft warning at top of any data-driven screen |

### C.2 Cross-cutting visual + theme

| # | Feature | Tier | Notes |
|---|---|---|---|
| C-05 | Linear/Geist token system (`:root` palette + light/dark themes) | Tier 1 | Item #1 in master inventory |
| C-06 | Light / Dark theme toggle | Tier 1 | Item #2 |
| C-07 | Mobile scroll fixes (`100svh`, safe-area, body-lock) | Tier 1 | Item #3 |
| C-08 | Empty state designs per section (+) | Tier 1 | Distinct from "no data" — these are "you haven't connected yet / haven't taken action yet" states |
| C-09 | Loading skeleton screens per section (+) | Tier 1 | Skeleton placeholders during fetch |
| C-10 | Error states with action paths (+) | Tier 1 | "Sync paused 3 days ago — Reconnect" pattern |

### C.3 Trust layer

| # | Feature | Tier | Notes |
|---|---|---|---|
| C-11 | System health strip (Tally / GSTN / Bank dots) | Tier 1 | Item #4 |
| C-12 | Source drilldown drawer ("View sources") | Tier 2 | Item #5 |
| C-13 | Disagreement surface (Tally vs 2B mismatch callout) | Tier 2 | Item #6 |
| C-14 | Per-message "▸ Details" pseudo-SQL expander (+) | Tier 2 | Power-user / CA accountability surface inside source drawer |

### C.4 Daily ritual & engagement

| # | Feature | Tier | Notes |
|---|---|---|---|
| C-15 | Named greeting + time-of-day | Tier 1 | Item #7 |
| C-16 | Weekly streak counter with grace days | Tier 1 | Item #8 |
| C-17 | Yesterday's-action banner ("you said you'd call Nykaa…") | Tier 2 | Item #9 |
| C-18 | "This Week" Action Queue (3-5 prioritised actions) | Tier 2 | Item #10 |
| C-19 | WhatsApp morning brief opt-in | Tier 4 | Item #11 |
| C-20 | "Riko Discovers" daily curiosity push (+) | Tier 4 | Variable-reward Hook Model engagement loop |
| C-21 | Personal Records system ("New PR — fastest GST filing this year") (+) | Tier 4 | Strava-style outcome streaks for SMB-native habits |
| C-22 | Monthly Report Card (graded) (+) | Tier 4 | Recurring narrative artifact — lower-effort version of Wrapped |
| C-23 | FY-End "Closing the Books" tentpole (+) | Tier 5 | Annual flagship event (March 28 – April 5) |

### C.5 Distribution / WhatsApp

| # | Feature | Tier | Notes |
|---|---|---|---|
| C-24 | Native share button on every assistant message | Tier 1 | Item #12 |
| C-25 | Pre-formatted WhatsApp text per answer type | Tier 1 | Item #13 |
| C-26 | "Send report to my CA via WhatsApp" flow | Tier 3 | Item #14 |
| C-27 | WhatsApp Templates modal (gentle / firm / final) (+) | Tier 3 | For payment reminders — three escalation levels |
| C-28 | Hinglish copy as first-class language (+) | Tier 2 | Mirrored in chat answers + WhatsApp messages |
| C-29 | i18n / language switcher (EN / Hi) (+) | Tier 2 | Settings + per-user preference |

### C.6 Chat intelligence

| # | Feature | Tier | Notes |
|---|---|---|---|
| C-30 | 4-layer response pattern (Answer / Calc / Sources / Action) | Tier 2 | Item #15 |
| C-31 | File auto-detection (drop PDF/Excel/image → classify) | Tier 3 | Item #16 |
| C-32 | OCR with per-field confidence chips (+) | Tier 3 | High/Med/Low confidence indicator per extracted field |
| C-33 | Voice input (Hinglish STT) | Tier 3 | Item #17 |
| C-34 | Multi-step agentic workflows | Tier 4 | Item #18 |
| C-35 | Entries through chat (draft voucher from chat) | Tier 4 | Item #19 |
| C-36 | Reports through chat ("show me March MIS") | Tier 3 | Item #20 |
| C-37 | Suggested follow-up chips after each response (+) | Tier 2 | "break it down by month" / "compare to last year" |
| C-38 | Per-message export (PDF / WhatsApp / copy) (+) | Tier 2 | Three actions on every assistant turn |
| C-39 | Dual-panel chat layout on desktop (+) | Tier 2 | Thread on left + canvas pane on right (where artifacts open) |
| C-40 | Mobile canvas takeover (+) | Tier 2 | Full-screen canvas mode on phone with "Chat" back button |
| C-41 | Empty-state cycling starter prompts in Hinglish (+) | Tier 1 | "Cash runway?" / "Nykaa ke paise kab aa rahe hain?" / etc. |

### C.7 Dashboard-specific

| # | Feature | Tier | Notes |
|---|---|---|---|
| C-42 | Action Queue (replaces Quick Actions) | Tier 1 | Item #21 |
| C-43 | Runway Timeline (single hairline track + marker) | Tier 1 | Item #21 sub-component |
| C-44 | Health Score card with breakdown drawer (+) | Tier 2 | Composite score with "what would move this to 85?" explainer |
| C-45 | KPI grid with sparklines (+) | Tier 1 | Item #21 — Revenue / GP / EBITDA / Cash / Burn / OpEx |
| C-46 | Cash Waterfall — signed horizontal bars (+) | Tier 2 | Revenue → COGS → GP → OpEx → EBITDA → Tax → Net |
| C-47 | Causal Chain visualization (+) | Tier 4 | "If receivables drop 20%, runway extends by 14 days" |
| C-48 | "Depth" expand section (collapsed by default on mobile) (+) | Tier 1 | Expense composition donut, channel mix stacked bar, BS snapshot, liquidity gauges, CCC, 12-mo trend |
| C-49 | Composition Treemap (expense / channel) (+) | Tier 2 | Visualization for category breakdowns |

### C.8 Outstanding-specific

| # | Feature | Tier | Notes |
|---|---|---|---|
| C-50 | Aging-bucket KPI cards (0–30 / 30–60 / 61–90 / 90+) | Tier 2 | Item #22 sub-feature |
| C-51 | Aging stacked bar (full-width horizontal) (+) | Tier 2 | Visual summary above the table |
| C-52 | Priority labels (P1/P2/P3) per row (+) | Tier 2 | Derived from amount × days-overdue |
| C-53 | Days-overdue with mini sparkline per party (+) | Tier 2 | Payment-history trend |
| C-54 | Density toggle (Compact / Regular / Relaxed) (+) | Tier 2 | Power-user control |
| C-55 | Reminder list filters: All / Never reminded / Overdue 30d+ / No contact / Reminded this week (+) | Tier 3 | Sub-filtering on top of the main table |
| C-56 | Per-row WhatsApp Remind button | Tier 3 | Item #22 |
| C-57 | Bulk "Remind all overdue" with per-row preview (+) | Tier 3 | Mass action with confirmation list |
| C-58 | Bulk action bar (WhatsApp / Email / SMS sticky bottom) (+) | Tier 3 | Appears when ≥1 row selected |
| C-59 | Import contacts from CSV (+) | Tier 4 | Bulk-load party WhatsApp numbers |
| C-60 | Mark Paid → drafts Receipt voucher (+) | Tier 4 | Cross-section flow into Entries queue |
| C-61 | Disputed flag freezes auto-reminders (+) | Tier 3 | Status that prevents reminder send |
| C-62 | Contra-settlement callout (party in both AR + AP) (+) | Tier 4 | One-tap Journal voucher to net positions |
| C-63 | Collection Insights (3 AI-recommended actions) (+) | Tier 3 | "Reconcile Nykaa accounts — ₹12.6L across 298 bills may include contra-settled amounts" |
| C-64 | Party Risk 2x2 Matrix (high amount × long overdue) (+) | Tier 4 | Visual triage tool |
| C-65 | Party 360 drawer on row click (+) | Tier 3 | Full party history across all surfaces |
| C-66 | Payables: MSME flag (legal 45-day rule) (+) | Tier 4 | Compliance signal on AP |
| C-67 | Payables: Remaining credit days column (+) | Tier 4 | Time until contract breach |
| C-68 | Mobile: swipe-left for quick actions (+) | Tier 2 | Native gesture for Remind / Mark Paid |

### C.9 Sales-specific

| # | Feature | Tier | Notes |
|---|---|---|---|
| C-69 | Total Sales card with YoY delta pill (+) | Tier 1 | Big number + ▲ 12.3% YoY |
| C-70 | Monthly Revenue chart with Ghost Bars (FY24 behind FY25) (+) | Tier 2 | The signature visual pattern |
| C-71 | Sales by Ledger card (+) | Tier 2 | Channel = sales ledger in Tally |
| C-72 | Sales by State card (+) | Tier 2 | Top 6 states from GSTIN state codes |
| C-73 | Returns & Credit Notes section (+) | Tier 2 | Total returns + return rate + by channel |
| C-74 | Top Returned SKUs table (+) | Tier 2 | With loss column |
| C-75 | Customers tab: Top 10 + cohort retention heatmap (+) | Tier 2 | Item #23 |
| C-76 | AOV Trend mini chart (+) | Tier 2 | 12-month AOV with current month highlighted |
| C-77 | Concentration callout ("Top 3 customers = 67% of revenue") (+) | Tier 2 | Risk signal |
| C-78 | Products tab: Top SKUs by revenue + qty + margin % (+) | Tier 2 | New build |
| C-79 | Products tab: HSN-wise sales table (+) | Tier 2 | Same query as GSTR-1 Table 12 |
| C-80 | Insights tab: YoY growth per month (divergent bars) (+) | Tier 2 | Best/worst month callouts |
| C-81 | Insights tab: Customer concentration ladder (Top 1/3/5/10) (+) | Tier 2 | |
| C-82 | Insights tab: State concentration card (+) | Tier 2 | Top 3 states / total |
| C-83 | Insights tab: Repeat vs new split (+) | Tier 2 | Orders > 1 on party ledger |
| C-84 | Insights tab: Payment velocity (DSO) card (+) | Tier 2 | (Debtors / Revenue) × 365 |
| C-85 | Insights tab: Highest return rate channel (+) | Tier 2 | Pure-data, no prescriptive prose |

### C.10 Inventory-specific

| # | Feature | Tier | Notes |
|---|---|---|---|
| C-86 | Godown tabs (Bhiwandi / Chennai / All) (+) | Tier 2 | Multi-warehouse |
| C-87 | "Last counted" status dot per godown (+) | Tier 2 | Green <30d / Yellow 30-60d / Red >60d |
| C-88 | Closing Stock card with FIFO chip (+) | Tier 2 | "FIFO · from Tally" tooltip explaining read-only |
| C-89 | Cost-layer drawer (FIFO purchase layers oldest-first) (+) | Tier 2 | Tap a SKU value cell → drill-in |
| C-90 | Month-end snapshot strip (Opening / Closing / COGS) (+) | Tier 2 | 3-card row above the table |
| C-91 | Stale-count banner (>30 days) (+) | Tier 2 | Soft warning |
| C-92 | Variance column on stock table (+) | Tier 2 | ✓ for matched / ±N for variance / — for never counted |
| C-93 | Physical Count Reconciliation modal (4-step) (+) | Tier 4 | Item #26 — outputs Stock Journal XML |
| C-94 | Variance preview with confidence chips (+) | Tier 4 | Step 3 of recon — Matched / Minor / Major / New SKU buckets |
| C-95 | Routing logic (>5% per-SKU vouchers, ≤5% bulk journal) (+) | Tier 4 | Approval routing intelligence |
| C-96 | Dead Stock Analysis section (+) | Tier 2 | SKUs with zero sales in 90+ days |
| C-97 | Dead Stock Treemap visualization (+) | Tier 2 | Visual breakdown of locked working capital |

### C.11 Day Book-specific

| # | Feature | Tier | Notes |
|---|---|---|---|
| C-98 | 5 KPI cards top (Total / Purchases / Sales / Receipts / Payments) | Tier 1 | Item #24 |
| C-99 | Voucher Type Breakdown card (animated bars) (+) | Tier 2 | Visual summary above the table |
| C-100 | Party filter chip bar (top 5 dynamically generated) (+) | Tier 1 | Critical for spot-checking |
| C-101 | Grouped-by-date sections with "Mon · 28 Mar 2026 · 47 entries · ₹3.42Cr" headers (+) | Tier 1 | Item #24 |
| C-102 | Density toggle (compact/regular/relaxed) (+) | Tier 1 | |
| C-103 | Row click → bottom sheet with line items + tax splits + linked vouchers (+) | Tier 2 | |
| C-104 | Annotation flag ("needs clarification") (+) | Tier 2 | CA workflow hook |
| C-105 | Sticky bottom export bar (CSV / Excel / PDF / WhatsApp) (+) | Tier 2 | |

### C.12 GST Agent-specific

| # | Feature | Tier | Notes |
|---|---|---|---|
| C-106 | Multi-GSTIN selector (top-right pill) (+) | Tier 3 | For companies with multi-state registrations |
| C-107 | Compliance Rating badge (A/B/C/D letter from INFINI GST Advanced API) (+) | Tier 3 | Replaces the home-grown 0–100 score |
| C-108 | Build Phase strip (Phase 1–5 with READY / BLOCKED / FUTURE labels) (+) | Tier 3 | Honest INFINI dependency disclosure |
| C-109 | Pre-filing Triage card (red blockers + yellow warnings) (+) | Tier 3 | "4 invoices missing GSTIN" |
| C-110 | Filing Streak card ("9 months on time") + 12-month dots timeline (+) | Tier 3 | Compliance gamification |
| C-111 | Return Filing Tracker grid (2 rows × 12 cols, ✓/🕓/—/!) (+) | Tier 3 | At-a-glance year view |
| C-112 | 4-tab nav: Reconciliation / GSTR-1 / GSTR-3B / Audit Log | Tier 3 | Item #28 |
| C-113 | Reconciliation: Match-rate big % + stacked status bar (+) | Tier 3 | |
| C-114 | ITC at risk callout with "Remind all N suppliers" WhatsApp batch (+) | Tier 3 | |
| C-115 | View modes: Invoice / Vendor / Month (Suvit-inspired) (+) | Tier 3 | Three different lenses on the same data |
| C-116 | 6 match-status buckets: Matched / Manual matched / Partial / Mismatch / Missing 2B / Missing Tally (+) | Tier 3 | Suvit-grade categorization |
| C-117 | Vendor view: status rollup chips (has-partial / has-mismatch) (+) | Tier 3 | |
| C-118 | Month view: 6-month trend with signed Diff column (+) | Tier 3 | |
| C-119 | Per-row actions: Accept / Remind / Investigate / Record in Tally (+) | Tier 3 | Different action per status |
| C-120 | GSTR-1 tab: Table 12 (HSN) + Table 7 (B2C state) summaries (+) | Tier 5 | |
| C-121 | GSTR-3B tab: Auto-calc liability + Cash vs ITC utilization (+) | Tier 5 | |
| C-122 | Secure OTP modal for INFINI actions (+) | Tier 5 | Compliance-grade — OTP never logged |
| C-123 | "File GSTR-1" button (DISABLED with INFINI-pending chip) | Tier 5 | Item #30 |
| C-124 | "File GSTR-3B" button (DISABLED with INFINI-pending chip) | Tier 5 | Item #31 |
| C-125 | Audit Log tab (filterable by actor / date / action) (+) | Tier 5 | Compliance accountability |

### C.13 TDS-specific

| # | Feature | Tier | Notes |
|---|---|---|---|
| C-126 | 4 sticky deadline cards (Deposit / 24Q-26Q return / Form 16A / 26AS refresh) (+) | Tier 4 | CBDT-aware dates |
| C-127 | 4 KPI cards (Deducted YTD / Deposited / Deductees count / Pending Challan) (+) | Tier 4 | |
| C-128 | Section-wise breakdown table (194C / 194J / 194H / 194I / 194Q) (+) | Tier 4 | Item #32 |
| C-129 | Deductee ledger with PAN verify badge (+) | Tier 4 | |
| C-130 | Form 16A status pills (Issued / Ready / Pending challan) (+) | Tier 4 | |
| C-131 | "Generate Form 16A" → PDF preview + WhatsApp/email send (+) | Tier 5 | Item #33 |
| C-132 | Challan status table (Deposited / Filed / Reconciled with 26AS) (+) | Tier 4 | |
| C-133 | 26AS Reconciliation card with "Fetch 26AS" (INFINI) (+) | Tier 4 | Item #32 sub-feature |
| C-134 | TDS received (inbound) section — when company is the deductee (+) | Tier 4 | Separate UX from deductor flow |
| C-135 | CBDT-aware deadline rules baked in (+) | Tier 4 | TDS deposit: 7th of next month / March = 30 April; Q4 return = 31 May; Form 16A = 15th of month after quarter-end |

### C.14 Reports-specific

| # | Feature | Tier | Notes |
|---|---|---|---|
| C-136 | Compliance Calendar at top (14-day strip) (+) | Tier 3 | Item #27 — CAs open Reports because of a deadline |
| C-137 | 6 report templates (MIS / P&L Deep Dive / Receivables / Investor Update / GST Summary / Board Deck) (+) | Tier 3 | Item #27 |
| C-138 | PDF-style preview pane (+) | Tier 3 | Renders before commit |
| C-139 | Customize: pick sections / date range / comparison period (+) | Tier 3 | |
| C-140 | Export bar: PDF / Excel / WhatsApp / Schedule (+) | Tier 3 | Item #27 + #14 |
| C-141 | Scheduled Reports section (cadence / next run / channel / pause) (+) | Tier 3 | Item #27 |
| C-142 | Version history per template (last 12 versions with timestamp + sent-to) (+) | Tier 3 | Audit trail for CAs |
| C-143 | "Investor Update" + "Board Deck" templates (placeholder in prototype) (+) | Tier 5 | |

### C.15 Clients-specific (CA Portfolio)

| # | Feature | Tier | Notes |
|---|---|---|---|
| C-144 | 4 production KPI cards (Total / Needs Attention / MIS Pending / Combined Revenue) (+) | Tier 5 | Item #37 |
| C-145 | Compliance strip (14-day timeline aggregated across portfolio) (+) | Tier 5 | |
| C-146 | View toggle: Cards / Table / Calendar (+) | Tier 5 | Item #37 |
| C-147 | Filter chips: All / Needs attention / MIS pending / Healthy (+) | Tier 5 | |
| C-148 | Industry filter (derived from client industry strings) (+) | Tier 5 | |
| C-149 | 4-dim sort: Status / Health / Revenue / Name (+) | Tier 5 | |
| C-150 | Industry Mix donut card (+) | Tier 5 | |
| C-151 | Client Card with status dot + issues list + revenue + sparkline + next-action chip (+) | Tier 5 | Item #37 |
| C-152 | Card click → switch company context globally (+) | Tier 5 | The "single demo moment that sells the CA pitch" |
| C-153 | Bulk select + Generate MIS for N clients (+) | Tier 5 | Item #38 |

### C.16 Settings-specific (Team / RBAC)

| # | Feature | Tier | Notes |
|---|---|---|---|
| C-154 | Settings → Team tab (+) | Tier 4 | Item #34 — does not exist in live Settings |
| C-155 | 8 role definitions with descriptions (+) | Tier 4 | RBAC.md spec |
| C-156 | Approval thresholds (≤₹50k / ₹50k–₹1L / >₹1L) (+) | Tier 4 | requiredApproverForAmount() |
| C-157 | Tab visibility per role (which roles see which tabs) (+) | Tier 4 | |
| C-158 | Role-preview mode ("Preview as Sales") with read-only banner (+) | Tier 4 | Killer demo feature |
| C-159 | Invite member: email/phone/copy-link methods + role dropdown (+) | Tier 4 | Item #34 |
| C-160 | Pending invites list with TTL countdown (+) | Tier 4 | |
| C-161 | Activity log with filterable audit trail (+) | Tier 4 | |
| C-162 | Bulk CSV invite (+) | Tier 5 | Lower priority |
| C-163 | Settings sub-tabs (Profile / Billing / Integrations / API Keys / Notifications) | live | These already exist on rikoai.in — reverse direction; consider porting back to prototype |

### C.17 Entries-specific

| # | Feature | Tier | Notes |
|---|---|---|---|
| C-164 | 4 tabs: Drafts / Pending Approval / Posted / Rejected (+) | Tier 4 | Item #35 |
| C-165 | "+ New entry" dropdown (9 voucher types) (+) | Tier 4 | |
| C-166 | "Bulk upload" 4-step modal (+) | Tier 4 | Item #35 |
| C-167 | "OCR from receipt" mobile camera flow (+) | Tier 4 | Item #16 sub-feature |
| C-168 | Approval inbox with batch-approve (within tier) (+) | Tier 4 | |
| C-169 | Entry row card: type pill + state badge + amount + party + approval-trail avatars (+) | Tier 4 | |
| C-170 | Actor info per row ("Drafted by Yogesh · Admin") (+) | Tier 4 | Already shipped in prototype |
| C-171 | Entry detail drawer with line items + ledger impact preview (+) | Tier 4 | |
| C-172 | State machine: Draft → Pending → Approved → **Exported → Confirmed** (XML pipeline) (+) | Tier 4 | Replaces "Posted" with two-step exported+confirmed |
| C-173 | "Today's vouchers" bundle download (+) | Tier 4 | Item #48 |
| C-174 | Post-import status reconciliation flow (+) | Tier 4 | Item #49 |

### C.18 Bank Reconciliation-specific

| # | Feature | Tier | Notes |
|---|---|---|---|
| C-175 | Bank account tabs (HDFC / ICICI / Kotak — multi-account) (+) | Tier 4 | Item #36 |
| C-176 | 4 KPI cards (Imported / Matched / Unmatched / Closing balance) (+) | Tier 4 | |
| C-177 | Match confidence chips: Matched ✓ (99%+) / Probable (~85%) / Possible (~60%) / Unmatched (+) | Tier 4 | Per-line classification |
| C-178 | Match suggestion drawer with side-by-side bank line vs candidate voucher (+) | Tier 4 | |
| C-179 | Match factors (amount / date / party / UTR / narration overlap) (+) | Tier 4 | Transparency about scoring |
| C-180 | Anomalies section (duplicates / reversal pairs / large round numbers) (+) | Tier 4 | AI-flagged suspicious lines |
| C-181 | Batch accept all Matched-chip lines (+) | Tier 4 | Fast monthly close |
| C-182 | Split match (one bank line → multiple vouchers) (+) | Tier 4 | Lump-sum payment covering N invoices |
| C-183 | Statement import: CSV / Excel / MT940 (+) | Tier 4 | Item #36 |

### C.19 Layout & navigation

| # | Feature | Tier | Notes |
|---|---|---|---|
| C-184 | Sidebar with grouped sections (Home / Operations / Analysis / Compliance / CA / Admin) (+) | Tier 2 | Visual separators between sections |
| C-185 | Mobile bottom nav (5 items: Home / Chat / Outstanding / Items / More) | live | Already exists |
| C-186 | More drawer (overflow for sections that don't fit in bottom nav) (+) | Tier 1 | Tier-1 polish |
| C-187 | Global header: Role Switcher + Language Toggle + company pill + theme (mobile) (+) | Tier 2 | |
| C-188 | Company switcher dropdown (multi-tenant) | live | Already exists, just visual lift needed |

### C.20 Components / primitives lifted from prototype

For reference — the actual reusable components that port directly to rikoai.in:

| Component | File | Used by | Tier |
|---|---|---|---|
| `Pill` | `src/components/ui/pill.tsx` | Every screen | Tier 1 |
| `KpiCard` | `src/components/ui/kpi-card.tsx` | Dashboard, Items, Outstanding, Sales | Tier 1 |
| `ActionQueue` | `src/components/ui/action-queue.tsx` | Dashboard | Tier 1 |
| `RunwayTimeline` | `src/components/ui/runway-timeline.tsx` | Dashboard | Tier 1 |
| `Sparkline` | `src/components/ui/sparkline.tsx` | KPI cards, Outstanding row | Tier 1 |
| `Gauge` | `src/components/ui/gauge.tsx` | Dashboard health | Tier 2 |
| `HealthScore` | `src/components/ui/health-score.tsx` | Dashboard | Tier 2 |
| `CausalChain` | `src/components/ui/causal-chain.tsx` | Dashboard | Tier 4 |
| `ChartMatrix` | `src/components/ui/chart-matrix.tsx` | Outstanding risk matrix | Tier 4 |
| `ChartRadar` | `src/components/ui/chart-radar.tsx` | Health Score breakdown | Tier 2 |
| `ChartSankey` | `src/components/ui/chart-sankey.tsx` | Cash flow visualization | Tier 4 |
| `ChartScatter` | `src/components/ui/chart-scatter.tsx` | Customer segmentation | Tier 4 |
| `ChartSwitcher` | `src/components/ui/chart-switcher.tsx` | Chart type selector | Tier 2 |
| `ChartExport` | `src/components/ui/chart-export.tsx` | Every chart | Tier 2 |
| `ChatCharts` | `src/components/ui/chat-charts.tsx` | Chat inline visualizations | Tier 2 |
| `ChatGstRecon` | `src/components/ui/chat-gst-recon.tsx` | Chat-driven 2B recon | Tier 3 |
| `ComplianceCalendar` | `src/components/ui/compliance-calendar.tsx` | Reports + Clients | Tier 3 |
| `CompositionTreemap` | `src/components/ui/composition-treemap.tsx` | Expense composition | Tier 2 |
| `DeadStockTreemap` | `src/components/ui/dead-stock-treemap.tsx` | Inventory dead stock | Tier 2 |
| `EntryDetail` | `src/components/ui/entry-detail.tsx` | Entries detail drawer | Tier 4 |
| `ExportBar` | `src/components/ui/export-bar.tsx` | Day Book / Sales / Reports | Tier 2 |
| `OcrUpload` | `src/components/ui/ocr-upload.tsx` | Entries OCR flow | Tier 3 |
| `Party360Drawer` | `src/components/ui/party-360-drawer.tsx` | Outstanding row click | Tier 3 |
| `PhysicalStockModal` | `src/components/ui/physical-stock-modal.tsx` | Inventory recon | Tier 4 |
| `MessageTemplateModal` | `src/components/ui/message-template-modal.tsx` | WhatsApp templates | Tier 3 |
| `WhatsAppModal` | `src/components/ui/whatsapp-modal.tsx` | Outstanding Remind | Tier 3 |
| `BulkImportModal` | `src/components/ui/bulk-import-modal.tsx` | Entries / Inventory bulk | Tier 4 |
| `EChartBase` | `src/components/ui/echart-base.tsx` | Chart foundation | Tier 2 |
| `GstinSelector` | `src/components/ui/gst/gstin-selector.tsx` | GST multi-GSTIN | Tier 3 |
| `OtpModal` | `src/components/ui/gst/otp-modal.tsx` | INFINI actions | Tier 5 |

### C.21 Cross-cutting infrastructure

| # | Feature | Tier | Notes |
|---|---|---|---|
| C-189 | Centralized formatting utility (`fL`, `fCr`, `formatINR`) (+) | Tier 1 | |
| C-190 | i18n context (EN / Hi) (+) | Tier 2 | |
| C-191 | Company context (`company-context.tsx` — active company switcher) | live | Already in production via `?company_id` |
| C-192 | RBAC context (`rbac-context.tsx`) (+) | Tier 4 | |
| C-193 | Role-preview mode (read-only banner during preview) (+) | Tier 4 | |
| C-194 | Audit log infrastructure (every state change appended) (+) | Tier 4 | |
| C-195 | Feature flag system (`?ui=v2` for visual lift, etc.) (+) | Tier 1 | Required for safe rollout |
| C-196 | Native Web Share API integration (+) | Tier 1 | |
| C-197 | WhatsApp text formatter (markdown-stripped, ₹-aware) (+) | Tier 1 | |

---

## 14. Document changelog

| Date | Change |
|---|---|
| Initial | Audited rikoai.in across 10 sections at desktop + mobile via cookie-injected Supabase session |
| Initial | Confirmed tech stack: Vite + React + Tailwind + shadcn + Supabase |
| Initial | Mapped 50 features across audience / complexity / dependency / effort axes |
| Initial | Tally write-back constraint corrected: XML export, not INFINI write — Tier 4 effort drops 4 wk → 2 wk |
| Initial | Architectural trajectory codified: Phase 1 XML → Phase 2 Bridge agent → Phase 3 TDL add-on |
| Initial | 5-tier rollout sequenced over weeks 1–28 with concrete deliverables per tier |
| Initial | Resource plan: 3.5 FTE minimum viable team for Tiers 1–2, scaling to 6+ for Tier 4–5 |
