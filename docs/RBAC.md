# Riko — Role-Based Access Control

**Paste this file in Lovable before building Settings or Entries.** Every section doc references these roles and permissions.

Riko's RBAC is built for the reality of Indian SMBs: one owner, a small accounts team, sales people who should never see salary ledgers, and an external CA who may manage many client companies.

---

## 8 roles

| Role | Icon | Description | Home tab |
|---|---|---|---|
| **Admin / Owner** | 👑 | Full access. Manages team, billing, settings. Can override approval chains. | Dashboard |
| **Accounts Head** | 🎯 | Senior accounts. Approves high-value entries (>₹1L). Posts to Tally. Owns the books. | Dashboard |
| **Accounts** | 📊 | Day-to-day bookkeeping. Approves mid-value entries. Records vouchers. | Dashboard |
| **Junior Accounts** | 📝 | Drafts entries only. Uploads statements. No approval rights. | Entries |
| **Manager** | 👔 | Reads everything financial. No edit rights. Signs off on MIS. | Dashboard |
| **Sales** | 💼 | Customer-facing. Sees their pipeline + AR follow-ups. Records collections. | Outstanding |
| **Field Sales** | 🚶 | Mobile-only. Records visits + cash receipts. Minimal nav. | Outstanding (mobile-lite) |
| **Viewer** | 👀 | Read-only. Used for CAs, advisors, investors, bankers. | Dashboard |

---

## Permission atoms

Permissions are fine-grained. A permission is a dot-separated string: `resource.action[.qualifier]`.

### Dashboard
- `dashboard.view` — see the dashboard tab at all
- `dashboard.finance` — see runway, cash position, P&L KPIs
- `dashboard.sales` — see revenue / top customers blocks

### Chat
- `chat.full` — full AI chat including financial data
- `chat.sales` — chat scoped to sales-side data only
- `chat.view` — read-only chat history, no new queries

### Items (Inventory)
- `items.view` — see SKU list
- `items.cost` — see cost rates + margins (sensitive)
- `items.edit` — edit item masters

### Outstanding (AR/AP)
- `outstanding.receivables` — see AR
- `outstanding.payables` — see AP
- `outstanding.edit` — edit notes, priority, action status

### Reports
- `reports.financial` — P&L, BS, cash flow
- `reports.sales` — sales-only reports
- `reports.inventory` — stock reports
- `reports.statutory` — GST, TDS return PDFs

### Sales
- `sales.view` — sales analytics tab
- `cfo_insights.view` — AI insights / advisory blocks

### GST
- `gst.view` — read recon, filings
- `gst.file` — trigger filings (INFINI API)

### Clients (CA portfolio)
- `clients.view` — CA portfolio screen + drill into client dashboards

### Settings
- `settings.view`
- `settings.team` — invite/remove members
- `settings.billing` — see & update plan
- `settings.api` — API keys, integrations

### Entries (voucher workflow)
- `entries.view` — see entries queue
- `entries.draft` — create drafts
- `entries.approve` — approve mid-value (≤₹1L)
- `entries.approve.high` — approve high-value (>₹1L)
- `entries.post` — post to Tally (final)
- `entries.override` — override approval chain
- `entries.upload` — bulk CSV/Excel uploads

---

## Role × permission matrix (condensed)

| Permission | Admin | Accts Head | Accts | Jr Accts | Manager | Sales | Field Sales | Viewer |
|---|:---:|:---:|:---:|:---:|:---:|:---:|:---:|:---:|
| `dashboard.view` | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| `dashboard.finance` | ✅ | ✅ | ✅ | — | ✅ | — | — | ✅ |
| `dashboard.sales` | ✅ | ✅ | ✅ | — | ✅ | ✅ | — | ✅ |
| `chat.full` | ✅ | ✅ | ✅ | — | ✅ | — | — | ✅ |
| `chat.sales` | — | — | — | — | — | ✅ | — | — |
| `items.view` | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| `items.cost` | ✅ | ✅ | ✅ | — | ✅ | — | — | — |
| `items.edit` | ✅ | ✅ | ✅ | — | — | — | — | — |
| `outstanding.receivables` | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| `outstanding.payables` | ✅ | ✅ | ✅ | ✅ | ✅ | — | — | ✅ |
| `outstanding.edit` | ✅ | ✅ | ✅ | ✅ | — | ✅ | ✅ | — |
| `reports.financial` | ✅ | ✅ | ✅ | — | ✅ | — | — | ✅ |
| `reports.sales` | ✅ | ✅ | ✅ | — | ✅ | ✅ | — | ✅ |
| `reports.inventory` | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | — | ✅ |
| `reports.statutory` | ✅ | ✅ | ✅ | — | ✅ | — | — | ✅ |
| `sales.view` | ✅ | ✅ | ✅ | — | ✅ | ✅ | — | ✅ |
| `cfo_insights.view` | ✅ | ✅ | — | — | ✅ | — | — | ✅ |
| `gst.view` | ✅ | ✅ | ✅ | ✅ | ✅ | — | — | ✅ |
| `gst.file` | ✅ | ✅ | — | — | — | — | — | — |
| `clients.view` | ✅ | — | — | — | — | — | — | ✅ |
| `settings.view` | ✅ | ✅ | — | — | ✅ | — | — | — |
| `settings.team` | ✅ | — | — | — | — | — | — | — |
| `settings.billing` | ✅ | — | — | — | — | — | — | — |
| `settings.api` | ✅ | — | — | — | — | — | — | — |
| `entries.view` | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| `entries.draft` | ✅ | ✅ | ✅ | ✅ | — | ✅ | ✅ | — |
| `entries.approve` | ✅ | ✅ | ✅ | — | — | — | — | — |
| `entries.approve.high` | ✅ | ✅ | — | — | — | — | — | — |
| `entries.post` | ✅ | ✅ | ✅ | — | — | — | — | — |
| `entries.override` | ✅ | — | — | — | — | — | — | — |
| `entries.upload` | ✅ | ✅ | ✅ | ✅ | — | — | — | — |

---

## Approval thresholds (voucher workflow)

Entries are drafted → approved → posted. Amount determines required approver:

| Amount | Required approver | Rationale |
|---|---|---|
| **≤ ₹50k** | Any approver (Accounts+) | Routine expenses, small receipts |
| **₹50k – ₹1L** | Accounts or higher | Mid-value; owner shouldn't be bothered |
| **> ₹1L** | Accounts Head (or Admin override) | High-value; books-owner accountability |

`requiredApproverForAmount(amount)` → `"any" | "accounts" | "accounts-head" | "admin"`

Implementation note: the approval matrix should be data-driven, not hardcoded in component logic. A single `canEntryAction(role, entryType, action)` function takes role + entry type (e.g. `"purchase"`, `"stock-journal"`) + action (`"draft"`, `"approve"`, `"post"`) and returns boolean.

---

## Tab visibility

Nav tab → minimum required permission:

| Tab | Permission |
|---|---|
| Dashboard | `dashboard.view` |
| Chat | `chat.full` or `chat.sales` |
| Clients (CA only) | `clients.view` |
| Outstanding | `outstanding.receivables` |
| Inventory | `items.view` |
| Day Book | `reports.financial` |
| Sales | `sales.view` |
| GST | `gst.view` |
| TDS | `gst.view` (same) |
| Reports | `reports.financial` OR `reports.sales` |
| Entries | `entries.view` |
| Bank Recon | `entries.view` AND `outstanding.edit` |
| Settings | `settings.view` |

Hide tabs the user has no permission for. Do not render "Access denied" pages as nav items.

---

## Role preview mode

Admin users get a **"Preview as [role]"** action in Settings → Team. Clicking it:
1. Switches the UI to render as that role
2. Shows a sticky banner: "Previewing as [Role]. [End preview]"
3. All actions are read-only during preview (no accidental writes)
4. Ends on logout or explicit "End preview"

This is the #1 demo feature for CAs who want to show their client what a Sales role will see.

---

## CA / multi-company

CAs don't have a separate role — they're **Viewer** (or Admin if the client grants it) across **multiple company contexts**. The Clients tab lets a CA:
- See their 15–50 client companies in one grid
- Switch active company context with one click (all other tabs re-scope to the selected company)
- Run bulk operations (generate MIS for all clients, bulk GST filings)

**When a CA switches company**, the entire app re-renders against that company's data. The CA badge in the header shows the active company name.

---

## Audit log

Every state-changing action writes an audit entry:
```
{ actor_id, actor_role, action, entity_type, entity_id, before, after, timestamp, ip, user_agent }
```

Visible in Settings → Activity Log (admin only) and in per-entity drill-ins (e.g., "Nykaa ledger was edited by Rahul 15 min ago — view diff").

The audit log is append-only. No deletions, no edits. The table gets archived quarterly but never pruned.
