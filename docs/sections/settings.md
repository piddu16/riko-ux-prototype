# Settings

Team management + account configuration. Where the owner invites staff, assigns roles, and previews what each role sees.

**Primary persona**: Admin / owner (only role that sees Settings in the nav).
**Top JTBD**: Invite my accountant. Give my sales person read-only access. See who did what last week.

---

## Tabs

1. **Team** (default) — active members, pending invites, role preview
2. **Profile** — company details, GSTIN, address, logo
3. **Billing** — current plan, seat usage, invoices, upgrade
4. **Integrations** — Tally sync status, INFINI API connection, WhatsApp Business, bank feeds
5. **API Keys** — for owners who have their own dev team
6. **Notifications** — what triggers alerts, delivery channels (WhatsApp/email/in-app)

Only build **Team** to production quality in v1. Other tabs: render as skeleton placeholder cards with a "Coming soon" state.

---

## Team tab layout (top to bottom)

### 1. Seat usage card
- "**7 of 10 seats used**"
- Progress bar (green < 70%, yellow 70-90%, red 90%+)
- CTA button: "Upgrade plan" (links to Billing tab)

### 2. Invite member card
Primary card, prominently placed. Fields:
- **Method** (segmented control): Email · Phone (WhatsApp) · Copy link
- **Recipient** (text input, type matches method)
- **Role** (dropdown, shows 8 options with icon + short description)
- **Message** (optional, textarea) — auto-generated in Hinglish based on method

Send button copies invite link (if method=link) or triggers WhatsApp/email (placeholder in demo — shows a toast "Invite sent to +91...").

### 3. Active members table
Columns: avatar/name, role chip, last active, status dot, actions menu (···).

Actions per row: "Change role", "Preview as this role", "Suspend", "Remove".

### 4. Pending invites
Separate list below active. Each shows: email/phone, role, invited date, **"expires in N days"** (7-day TTL), resend button, cancel button.

### 5. Role preview cards
5 cards (1 per main role), each with:
- Role name + icon
- Plain-English description ("Sees only their AR pipeline. Can record collections but not approve")
- "Preview as [Role]" button → switches the whole UI to that role's view

### 6. Activity log (compact)
Last 10 activity entries: "Rahul viewed Nykaa ledger · 15 min ago"
"See all" link → full audit log modal (admin-only, filterable by actor/date/action).

---

## Interactions

- **Preview mode**: when active, top of screen shows a sticky banner `"Previewing as Sales. [End preview]"`. All write actions silently disabled (buttons visible but toasts say "Read-only in preview"). Exit via button or `Esc`.
- **Remove member modal**: confirm with summary: "Rahul (sales) will lose access. Their last 5 activities: [list]. Assigned items: 3 AR follow-ups (will reassign to unassigned)."
- **Resend invite**: one-click, toast confirms.
- **Copy link**: one-click copy, toast "Link copied. Expires in 7 days."

---

## RBAC

- Only `admin` sees the Settings nav tab at all.
- `accounts-head` and `manager` can see Profile tab only (for their own profile edits) — but NOT Team/Billing/Integrations/API.
- Everyone else: no Settings access.

---

## Empty states

- No team members: show a welcome card with "Invite your first teammate" CTA.
- No pending invites: hide that section entirely.
- No activity: hide activity log.

---

## Avoid

- Bulk CSV invite in v1 (most SMBs hire one person at a time).
- Custom role creation — 8 predefined roles cover all real scenarios. Custom roles become a config nightmare.
- "Organization tree" / reporting hierarchy — flat membership is enough for the target audience size.
- SSO, SAML, MFA settings in v1 — save for enterprise upsell.
- Email digest configuration — punt to Notifications tab placeholder.

---

## Lovable prompt

```
Build the Settings → Team page for Riko (an AI CFO for Indian SMBs).

Visual system: use tokens defined in DESIGN.md (dark-first, green primary #22C55E, Inter body, Space Grotesk for numbers).
Data: see RBAC.md for the 8-role definitions and permission atoms.
Persona: admin / owner only — other roles never see this page.

Top to bottom:
1. Seat usage card ("7 of 10 seats", progress bar color-coded, upgrade CTA)
2. Invite member card — segmented control (Email / Phone / Copy Link), role dropdown showing all 8 roles with icons and plain-English descriptions, optional message textarea, Send button
3. Active members table — avatar, name, role chip, last active, status dot, actions menu with Change role / Preview as / Suspend / Remove
4. Pending invites list — each with expires-in-N-days, Resend + Cancel actions
5. Role preview cards — 5 cards, each with "Preview as [Role]" button that switches the entire app into that role's view with a sticky "Previewing as [X]. End preview" banner and all write actions read-only
6. Activity log (compact) — last 10 actions like "Rahul viewed Nykaa ledger · 15 min ago", with "See all" modal

Include Remove Member confirmation modal summarizing impact (lost access + reassignments).

Mobile: stack everything in single column. Table becomes cards at <768px. Invite card uses full-width modal on mobile.

Do NOT build: Bulk CSV invite, custom role creation, SSO/SAML, org hierarchy. Other tabs (Profile/Billing/Integrations/API/Notifications) should render as "Coming soon" placeholder cards.
```
