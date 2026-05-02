# Riko — Lovable Build Prompts

This folder is the single source of truth for rebuilding Riko in Lovable. Every `.md` is written as a **copy-pasteable prompt** — you drop it into Lovable, Lovable generates the page. No editing required.

---

## What is Riko

Riko is an **AI CFO for Indian SMBs** that runs on top of **TallyPrime**. The founder (not an accountant) opens Riko on WhatsApp or the web, asks questions in plain English or Hinglish, and gets grounded answers backed by Tally vouchers + INFINI API (for GST / TDS filings) + bank statements.

**Tagline:** your books, answered.

**Target audiences**
| Persona | Revenue band | Top questions | Device |
|---|---|---|---|
| Founder / owner-operator | ₹1–50 Cr | Am I running out of money? Who owes me? What should I do this week? | Phone, 2–3× a day, between meetings |
| CA / accounting firm | — | Which client needs attention right now? Are all filings on time? | Desktop, multiple clients/session |
| Internal staff (sales, accounts, field-sales) | — | Scoped to their job via RBAC | Phone or desktop |

**Core promise**
1. **Tally data, live** — no CSVs, no copy-paste. Riko reads books directly.
2. **AI that's grounded** — every answer cites the vouchers/filings it used.
3. **One-click actions** — WhatsApp reminders, GSTR-1 file, payment recording. No screen-to-screen hopping.
4. **Honest about what's automated vs blocked** — "File GSTR-3B" is a real button; "apply for LUT" is not.

---

## How to use these docs

Each file is a self-contained Lovable prompt. The order below is how to build the app (safest → riskiest):

### 1. Read first — reference docs
- [`DESIGN.md`](./DESIGN.md) — colors, typography, spacing, motion. **Paste this as your first Lovable message** so every subsequent prompt inherits the visual system.
- [`DATA.md`](./DATA.md) — what Tally actually exposes. Every component is grounded against this surface. No invented fields.
- [`RBAC.md`](./RBAC.md) — 8 roles × permissions × approval thresholds. Paste before building Settings or Entries.

### 2. Build order — sections (simplest → most complex)
1. [`sections/settings.md`](./sections/settings.md) — team + RBAC preview. Foundation for gating everything else.
2. [`sections/dashboard.md`](./sections/dashboard.md) — the home screen. Proves the visual system.
3. [`sections/outstanding.md`](./sections/outstanding.md) — AR + AP. High value, simple data.
4. [`sections/sales.md`](./sections/sales.md) — Overview / Customers / Products / Insights tabs.
5. [`sections/inventory.md`](./sections/inventory.md) — stock + physical count reconciliation.
6. [`sections/daybook.md`](./sections/daybook.md) — raw voucher feed.
7. [`sections/gst.md`](./sections/gst.md) — reconciliation + filings (depends on INFINI).
8. [`sections/tds.md`](./sections/tds.md) — deductions + challans.
9. [`sections/reports.md`](./sections/reports.md) — MIS, P&L, board deck, WhatsApp share.
10. [`sections/clients.md`](./sections/clients.md) — CA portfolio.
11. [`sections/chat.md`](./sections/chat.md) — the 4-layer AI response pattern.
12. [`sections/entries.md`](./sections/entries.md) — bulk voucher creation + approval chain.
13. [`sections/bank-recon.md`](./sections/bank-recon.md) — bank statement matcher.

### 3. Prompt pattern
Every section doc ends with a "Prompt for Lovable" block. Copy that block verbatim. It includes the section spec + pointers to the reference docs.

---

## Tech stack (expected)

- **Framework**: Next.js 16+ (App Router) with TypeScript
- **Styling**: Tailwind CSS + CSS variables (dark theme baseline)
- **Icons**: [Lucide](https://lucide.dev)
- **Motion**: [Framer Motion](https://www.framer.com/motion/)
- **Data**: Supabase (Postgres + RLS) reading from tables synced from Tally via INFINI API
- **Real-time**: Supabase Realtime where needed (AR status updates, reminder sends)
- **Mobile-first**: Primary target is 375px viewport; desktop enriches but never owns

---

## Non-negotiables

1. **Mobile-first.** Every page must work perfectly on a 375px phone. Desktop adds density, never removes mobile features.
2. **No invented fields.** If a number isn't derivable from Tally + INFINI + bank statements, don't show it. (See `DATA.md`.)
3. **No prescriptive AI prose.** "Review listing quality" / "negotiate lock-in contracts" etc. are fluff. Show the numbers; let the user decide.
4. **WhatsApp-first comms.** Every party interaction has a WhatsApp option (reminders, report shares, confirmations). Email is secondary.
5. **Hinglish is a first-class language.** Not in place of English — alongside it. Starter prompts, notifications, and CA-to-owner messages all support Hinglish toggles.
6. **Cite sources.** Chat answers link to specific vouchers. GST numbers link to INFINI response payloads. No unsupported claims.
7. **Honest build-phase chips.** If a feature is blocked on INFINI filing APIs (GSTR-1 submit, GSTR-3B file), say so with a visible "INFINI API pending" chip. Never pretend something works.

---

## What this app is NOT

- **Not a Tally replacement.** Tally is the system of record. Riko reads from Tally; it does not replace voucher entry UX.
- **Not a GST portal alternative.** Filings go via INFINI to the real GSTN portal. Riko is the UX layer.
- **Not a bank.** No fund movement, no payment rails. Riko can mark an invoice paid after matching a bank credit — nothing more.
- **Not for enterprises.** Sweet spot is ₹1–50 Cr revenue. Above that, you need SAP / Zoho Books. Below that, Tally alone is enough.

---

## Glossary (quick)

| Term | Meaning |
|---|---|
| **Voucher** | Tally's term for a transaction (sales, purchase, receipt, payment, journal, stock-journal). |
| **Party** | Customer or vendor (Tally ledger under a debtor/creditor group). |
| **HSN code** | 4–8 digit product classification used on GST invoices. |
| **GSTIN** | 15-char GST registration number. First 2 digits = state code. |
| **2B** | GSTR-2B — monthly auto-generated ITC statement from the GSTN portal. |
| **3B** | GSTR-3B — monthly self-declared summary return. |
| **ITC** | Input Tax Credit — GST you paid on purchases, offsetable against output GST. |
| **MIS** | Management Information System — monthly P&L snapshot CAs send to owners. |
| **TDS** | Tax Deducted at Source — buyer withholds part of payment, remits to govt. |
| **FSI** | Floor Space Index — not applicable here. (Different project.) |
| **INFINI** | Riko's integration partner for statutory filings (GST, TDS, e-way bills). |
