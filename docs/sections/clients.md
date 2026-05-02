# Clients (CA Portfolio)

CA-only view: all client companies in one grid. Switch active-company context with one click.

**Primary persona**: CA managing 15-50 SMB clients.
**Top JTBD**: "Which of my 18 clients needs attention today?"

---

## Layout

### 1. Header row
- "Clients" title + active CA firm name pill
- 4 production KPI cards:
  - Total Clients
  - Needs Attention (red/yellow status count)
  - MIS Pending (count of clients where this month's MIS isn't sent yet)
  - Combined Revenue (YTD across portfolio)

### 2. Compliance strip
Horizontal 14-day timeline of next statutory filings aggregated across portfolio. Each day: dots per filing with client names. Tap day → drawer listing which clients have what due.

### 3. Toolbar
- View toggle: **Cards** (default) · **Table** · **Calendar**
- Filter chips: All · Needs attention · MIS pending · Healthy
- Industry filter dropdown (derived from client.industry free-text, grouped client-side)
- Sort: Status / Health / Revenue / Name
- Bulk select checkbox column (in table view) or corner checkboxes (in cards)

### 4. Cards view (default)
3-col desktop grid / 1-col mobile. Each card:
- Client name + industry chip
- **Status dot**: red / yellow / green (derived from issues: pending filings, low cash, MIS pending)
- Issues list (3 max, truncated): "GSTR-1 due in 3 days", "MIS pending", "Cash runway 12 days"
- Revenue + YoY pill
- 12-month sparkline (revenue trend)
- **Next action** verb chip (derived from issues)
- Card tap → switches company context (entire app re-renders as if that client is current company)

### 5. Industry Mix donut card (right side desktop / inline mobile)
SVG donut with slice per industry (derived). Hover slice → client count + total revenue.

### 6. Bulk action bar
Floating when ≥1 selected:
- "Generate MIS for 18 clients" primary button
- "Schedule reminders for 3 clients" secondary
- "Export portfolio snapshot"

---

## Calendar view
Monthly calendar grid. Each day cell shows filings due across clients. Tap day → list of clients with that day's obligations.

## Table view
Dense: client, industry, status, revenue, YoY, health signals, next action, assigned CA team member.
Sortable headers. Bulk-select column on left.

---

## Data

| Component | Source |
|---|---|
| Client list | `clients` table (one row per client company the CA manages) |
| Status derivation | f(pending_filings, cash_runway_days, mis_pending_days) → red/yellow/green |
| Revenue | Aggregate across client's Tally sync |
| Industry mix | `GROUP BY industryGroup` (derived from free-text) |
| Compliance calendar | `computeComplianceCalendar()` across all clients |

**Important**: do NOT invent fields like:
- Location (CA workflow doesn't track per-client location)
- Assignee (not always structured — some firms assign informally)
- Hours-worked / billing-hours (not in prototype scope)
- Compliance grade (0-100 score) — use status dots + concrete issues instead

---

## Interactions

- **Card tap**: switches COMPANY_ID context globally. Entire app re-renders for that client. Breadcrumb at top shows "Portfolio › Bandra Soap".
- **Bulk Generate MIS**: opens a modal showing all selected clients in a list, with estimated time ("18 MISes · ~3 min total"). Progress bar as each generates. Toast per completion.
- **Card → calendar issue**: tap an issue chip → deep-links into the relevant tab of that client's context.

---

## RBAC

- `clients.view` — admin, viewer (for this prototype, "CA" = viewer with multi-company access)
- All other roles: Clients tab hidden.

---

## Empty / edge states

- New CA, no clients linked: welcome state with "Add your first client" CTA + CSV import option.
- Clients tagged as "paused" (CA relationship on hold): separate section below active.

---

## Avoid

- **Location per client** — not tracked in the real CA workflow.
- **Churn risk score** — too subjective; surface the concrete signals (MIS late, filings late, not paying fees).
- **Client profitability to the firm** — scope creep; save for later.
- **Auto-generated "AI recommendations per client"** — if it's not actionable in 1 click, don't show it.

---

## Lovable prompt

```
Build the Clients (CA Portfolio) page for Riko. Desktop-first but mobile-usable.

Visual: DESIGN.md. Data per DATA.md (clients table + per-client Tally aggregates). RBAC per RBAC.md (clients.view — admin + viewer only).

Layout:
1. Header: "Clients" title + CA firm name pill + 4 KPI cards (Total Clients / Needs Attention / MIS Pending / Combined Revenue)
2. Compliance strip: 14-day timeline with filing dots aggregated across portfolio; tap day → drawer with client list
3. Toolbar: view toggle (Cards / Table / Calendar), filter chips (All / Needs attention / MIS pending / Healthy), industry filter dropdown (derived client-side from free-text industry), sort dropdown (Status / Health / Revenue / Name), bulk-select
4. CARDS VIEW (default): 3-col desktop grid. Card: client name, industry chip, status dot (red/yellow/green), issues list (3 max), revenue + YoY pill, 12-month sparkline, next-action verb chip. Card tap switches entire app's company context.
5. Industry Mix donut card
6. Bulk action bar (floating when selection active): Generate MIS for N clients / Schedule reminders / Export portfolio snapshot

CALENDAR VIEW: monthly grid with filings per day, tap day → client list
TABLE VIEW: dense sortable table with assigned team member column

Card tap → switch COMPANY_ID global context, breadcrumb shows "Portfolio › Bandra Soap", entire app re-renders for that client.
Bulk Generate MIS → modal with progress bar per client, toast per completion.

Do NOT include: location field, churn-risk-score, billing-hours-per-client, client-profitability, or auto-AI recommendations. These aren't in the real CA workflow and clutter the UX.

RBAC: clients.view — admin + viewer (= CA) only. Hidden for all other roles.
```
