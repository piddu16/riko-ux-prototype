# Riko — Visual System

**Paste this file as your first Lovable message.** Every subsequent section prompt assumes these tokens and patterns.

Riko is a **dark-first finance app** inspired by the visual rigor of Ramp, Mercury, and Linear, adapted to Indian SMB vocabulary (₹, L, Cr, Hinglish where appropriate).

---

## Color tokens (CSS variables)

Use these tokens everywhere — never hardcode hex. Define once in `globals.css`:

```css
:root {
  /* Backgrounds (dark baseline) */
  --bg-primary: #0F1117;      /* page */
  --bg-secondary: #1A1F2E;    /* elevated surface 1 */
  --bg-surface: #242937;      /* card */
  --bg-hover: #2D3548;        /* hover / pressed */
  --border: #334155;          /* hairlines */

  /* Text */
  --text-1: #F8FAFC;          /* headings, primary values */
  --text-2: #CBD5E1;          /* body */
  --text-3: #94A3B8;          /* secondary body */
  --text-4: #64748B;          /* labels, metadata */

  /* Semantic */
  --green: #22C55E;           /* primary brand + positive */
  --green-dark: #16A34A;
  --green-bg: #052E16;
  --red: #EF4444;             /* negative / critical */
  --red-bg: rgba(239,68,68,.12);
  --yellow: #F59E0B;          /* warning / partial */
  --yellow-bg: rgba(245,158,11,.12);
  --blue: #3B82F6;            /* informational / neutral data */
  --blue-bg: rgba(59,130,246,.12);
  --orange: #F97316;          /* alert / missing */
  --purple: #A855F7;          /* admin / owner-only */
}

[data-theme="light"] {
  --bg-primary: #F8FAFB;
  --bg-secondary: #FFFFFF;
  --bg-surface: #F1F5F9;
  --bg-hover: #E2E8F0;
  --border: #E2E8F0;
  --text-1: #0F172A;
  --text-2: #334155;
  --text-3: #64748B;
  --text-4: #94A3B8;
  --green-bg: #F0FDF4;
  --red-bg: #FEF2F2;
  --yellow-bg: #FFFBEB;
  --blue-bg: #EFF6FF;
}
```

**Semantic meanings (strict):**
- **Green** = paid, matched, healthy, positive YoY
- **Red** = overdue, missing, bankrupt, negative
- **Yellow** = partial, attention, warning
- **Orange** = missing from a source (e.g., Not in 2B)
- **Blue** = informational / neutral data
- **Purple** = admin / owner-only surfaces

**Alpha-blended tints** — use `color-mix(in srgb, var(--X) 12%, transparent)` for soft backgrounds. Never opacity the var directly.

---

## Typography

| Purpose | Font | Weight | Use |
|---|---|---|---|
| UI, body | **Inter** | 400/500/600/700 | Everything |
| Numbers | **Space Grotesk** | 500/700 | Currency, percentages, KPIs |
| Mono | system monospace | 400 | SKU codes, GSTINs, HSN codes |

Rule: any `₹` or tabular number gets `fontFamily: "'Space Grotesk', sans-serif"` + `tabular-nums` + `font-semibold` or `font-bold`. Keeps amounts column-aligned and visually distinct from narrative text.

Sizes (Tailwind):
- Page title: `text-lg font-bold` (~18px)
- Section label: `text-xs font-semibold` (12px)
- Card label: `text-[10px] uppercase tracking-wider font-medium` (10px)
- KPI value: `text-2xl` or `text-3xl font-bold`
- Body: `text-xs` (12px) or `text-sm` (14px)
- Table: `text-xs` (12px)
- Metadata / footnote: `text-[11px]` or `text-[10px]`

---

## Spacing & layout

- Base unit: 4px. Stick to Tailwind's scale.
- Card padding: `p-3` (cards) / `p-4` (primary cards).
- Section spacing: `mb-5` between cards.
- Grid gaps: `gap-2` (dense) / `gap-3` (standard) / `gap-5` (loose).
- Border radius: `rounded-lg` (8px) for inputs/chips, `rounded-xl` (12px) for cards, `rounded-full` for pills/tags.
- Page wrapper: `px-4 py-4 max-w-4xl mx-auto w-full`.

**Mobile-first breakpoint:**
- Base styles target 375px.
- `md:` (≥768px) adds desktop density (grids expand, tables show more columns).
- `lg:` sparingly (≥1024px for CA-heavy views only).

---

## Component patterns

### Card
```
className="rounded-xl p-4"
style={{ background: "var(--bg-surface)", border: "1px solid var(--border)" }}
```

### KPI card
Top-to-bottom: tiny uppercase label → big value (Space Grotesk) → delta pill or sublabel.

### Pill / badge
```
className="text-[10px] font-semibold px-1.5 py-0.5 rounded"
style={{ background: "color-mix(in srgb, var(--green) 15%, transparent)", color: "var(--green)" }}
```

### Stacked bar
Horizontal, full-width, segmented by `var(--green|yellow|orange|red)`. Always show a compact legend below with values.

### Filter chips
`rounded-full px-3 py-1.5 min-h-[32px] text-[11px]`. Active chip: tinted background matching semantic (green for "healthy", yellow for "attention").

### Table
- Header row: `bg-[var(--bg-secondary)]`, `text-[10px] font-medium text-[var(--text-4)]`.
- Alternating row tint: `i % 2 === 1 ? "color-mix(in srgb, var(--bg-secondary) 50%, transparent)" : "transparent"`.
- Numeric columns: right-aligned + `tabular-nums` + Space Grotesk for ₹ columns.

### Bottom sheet (mobile detail)
Slides up from bottom. Backdrop opacity 0.6. Drag handle at top. Close button bottom-right. Contents: title → primary action bar → sections.

### Modal (desktop)
Centered, max-width `28rem` for simple, `44rem` for complex (recon preview). Backdrop + ESC close.

### Toast
Fixed at `bottom-20 md:bottom-5`, centered horizontally. Green for success, red for error. Auto-dismiss at 2800ms.

---

## Motion

Library: **Framer Motion**. Always with `whileInView` + `viewport={{ once: true, amount: 0.1 }}` for scroll-triggered reveals.

### Card entrance
```jsx
<motion.div
  initial={{ opacity: 0, y: 12 }}
  whileInView={{ opacity: 1, y: 0 }}
  viewport={{ once: true, amount: 0.1 }}
  transition={{ duration: 0.35 }}
/>
```

### Bar fill
```jsx
<motion.div
  initial={{ width: 0 }}
  whileInView={{ width: `${pct}%` }}
  viewport={{ once: true }}
  transition={{ duration: 0.6, ease: "easeOut" }}
/>
```

### Stagger
Delay children with `delay: i * 0.03`.

### Avoid
- Infinite loops (unless it's a loading spinner).
- Nested `whileInView` with `initial: { height: 0 }` — the intersection observer can stall on zero-size elements. Either animate opacity/scaleY instead, or use plain CSS heights on nested bars and keep `whileInView` only on the outer card.
- Motion on elements that update from user input (keep input → result instant).

**Respect `prefers-reduced-motion`** — wrap motion config in a hook that checks this and disables transitions.

---

## Icons

Library: **Lucide React**. Always `size={14}` inside pills, `size={16}` for buttons, `size={20}` in nav. Color via `style={{ color: "var(--X)" }}` — never set `stroke`/`fill` directly.

Key icons used throughout:
- `CheckCircle2` — matched / paid / healthy
- `AlertTriangle` — warning / attention
- `FileQuestion` — missing (neutral)
- `FileX` — missing (critical)
- `MessageSquare` — WhatsApp action
- `Send` — send / remind
- `Filter` — filter controls
- `ChevronRight` — drill-in affordance
- `Download` / `Upload` — export / import
- `Sparkles` — AI-generated content marker

---

## Currency & number formatting

```ts
// Lakhs / crores (Indian convention)
const fL = (v: number) => (Math.abs(v) / 1e5).toFixed(1);  // ₹1.5L
const fCr = (v: number) => (Math.abs(v) / 1e7).toFixed(2); // ₹1.25Cr

// Smart formatter — picks L/Cr automatically
function formatINR(v: number | null): string {
  if (v === null) return "—";
  const abs = Math.abs(v);
  if (abs >= 1e7) return `₹${(abs / 1e7).toFixed(2)}Cr`;
  if (abs >= 1e5) return `₹${(abs / 1e5).toFixed(1)}L`;
  return `₹${abs.toLocaleString("en-IN")}`;
}
```

Rules:
- **Always prefix ₹** before the number (never suffix).
- **Always show the unit** (L / Cr) — "2.3L" not "2.3".
- **Negative numbers**: minus sign before ₹ (`-₹42.3L`), not parentheses.
- **Zero**: show as `—` (em dash), not `₹0`.
- **Null / missing**: show as `—`.
- **Rate / percentage**: 1 decimal for internal metrics (`32.5%`), 0 decimals for KPI headlines (`32%`).

---

## Indian context cues

- All party names use full legal form (`Nykaa E-Retail Pvt Ltd`, not `Nykaa`).
- Dates: `28 Mar 2026` format, not US MM/DD.
- GSTIN state codes are always shown with label (e.g., "27 · Maharashtra").
- WhatsApp icon (Lucide `MessageSquare`) and Hinglish copy ("ping kar do", "pata chala") are first-class.
- Owner names lead with salutation only when CA is messaging (Yogesh Ji, Snehal Bhai).

---

## Dos & don'ts

**Do**
- Use `tabular-nums` on every number.
- Pair red totals with red semantic context (debts, losses) — not with growth declines if it's just a bar chart comparison.
- Show derivation ("SUM(sales vouchers) by month" in subtle text next to chart titles).
- Give every screen a visible data-freshness pill (e.g., "Last synced 14 min ago").

**Don't**
- Mix purple (admin) with green (brand) on the same card.
- Use emoji for statuses in tables — use Lucide icons with semantic colors.
- Add "AI Insight" blocks with prescriptive advice unless the action is one-click-doable.
- Animate KPI numbers on first mount (distracting and looks like the data is changing).
