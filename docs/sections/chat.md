# Chat

The AI conversational layer. Every answer is grounded in Tally vouchers + INFINI filings + bank statements. **Every answer cites sources.**

**Primary persona**: Founder (mobile, quick questions), CA (desktop, deep queries).
**Top JTBD**: "Answer a financial question accurately in under 10 seconds, Hinglish OK."

---

## Layout

### Mobile (primary)
Full-screen chat thread.
- Top bar: conversation title (auto-generated from first user message) + menu (New chat, Export, Share to WhatsApp).
- Message feed (scrollable).
- Input bar at bottom: attachment (Excel/PDF for context), mic (voice → Hinglish STT), text input, send button.

### Desktop (dual panel)
- Left: chat feed.
- Right: **contextual panel** that reacts to the conversation — shows the tables/charts referenced in the latest answer. Tabs at top of panel for "recent topics in this conversation" (NOT fixed categories).

---

## The 4-layer response pattern

Every Riko AI response has 4 stacked blocks:

### Layer 1: ANSWER
Plain, direct, one-sentence answer. Bold, large text.
Example: "**Your cash runway is 9 days.**"

### Layer 2: CALCULATION
Show the math. Labels + values in a compact table.
```
Cash on hand:     ₹5.6L
Monthly burn:     ₹17L / 30 days = ₹56,667/day
Runway:           ₹5.6L / ₹56,667 ≈ 9.9 days
```

### Layer 3: SOURCES
Link/citations to the underlying vouchers + filings.
- "Cash on hand — from latest Bank Reconciliation (21 Apr)"
- "Monthly burn — avg of last 90 days of Payment + Journal vouchers (Sheet 12 in MIS)"
- "[Open source vouchers →]" opens a sheet with the full query + voucher list.

### Layer 4: AI INSIGHT (only when actionable)
Short, action-oriented. Either a one-click CTA or nothing. Avoid prescriptive prose.
Example: "If Nykaa pays ₹12.6L as promised, runway extends to 68 days. [Ping Nykaa →]"

---

## Empty state

Show starter prompts (cycling pills) in Hinglish + English:
- "Cash runway?"
- "Nykaa ke paise kab aa rahe hain?"
- "Top 5 SKUs is month?"
- "GSTR-3B ready hai?"
- "Dead stock liquidate karna chahiye?"

First-time visitors: show a 3-card welcome explaining the 4-layer pattern + that every answer cites sources.

---

## Interactions

- **Tap message**: expands to show Layer 2+3 (collapse by default on mobile to save space).
- **Export response**: each assistant message has a small export icon. Options: PDF, WhatsApp, copy as text.
- **Share thread**: entire conversation exported as PDF (preserves sources).
- **Attach Excel/PDF**: user uploads context (e.g., a bank statement). Riko parses it and adds it to the conversation context for follow-ups.
- **Voice input**: mic → Hinglish-aware STT → text; Riko responds in text (toggle for voice response in settings).
- **Regenerate**: per-message regen button if the answer missed the intent.

### Suggested follow-ups
After each response, show 2-3 suggested follow-up chips:
- "Break it down by month"
- "Who's the biggest contributor?"
- "Compare to last year"

---

## Source grounding rules (non-negotiable)

Every factual claim must:
1. Cite a specific voucher / filing / bank transaction
2. Show the query (Layer 2)
3. Timestamp the data ("as of 14 Apr")

If Riko can't ground a claim, it must say so: "I don't have data for this. Connect your [X] or ask a different question."

NO hallucination of:
- Amounts ("Your sales are roughly ₹10 Cr" without showing the SUM query — nope)
- Recommendations that aren't 1-click doable ("You should renegotiate with your bank" — nope)
- Comparisons to "industry benchmarks" (we don't have them)
- Personal financial advice (we're not a CFA)

---

## Context panel (desktop)

Right panel shows:
- The actual table/chart referenced in the answer
- Interactive: user can drill into a specific row, filter, re-sort
- "Pin this" → keeps the view open while asking follow-ups
- Topic tabs at top: auto-generated from conversation (e.g., "Runway", "Nykaa receivables", "GSTR-1") — NOT fixed categories

---

## RBAC

- `chat.full` — admin, accounts-head, accounts, manager, viewer
- `chat.sales` — sales role (scoped to sales data only; can't ask about expenses, salaries, runway)
- `chat.view` — read-only history (for auditors)

---

## Copy tone

- Riko is **direct and respectful**. Not chatty. Not overly formal.
- Mirrors user's language: English query → English response. Hinglish query → Hinglish response.
- Uses units naturally: "₹12.6L" not "Rs. 1,260,000".
- Addresses user by first name if known.
- Never apologetic unless Riko made an actual mistake.

---

## Avoid

- **Emoji spam** (none in answers, one at most per message).
- **Multiple paragraphs of intro** before the actual answer — Layer 1 is the first thing.
- **"As an AI..."** self-references.
- **Markdown formatting** in the answer itself — we render structured layers, not raw markdown.
- **Streaming character-by-character** for computed answers — makes the wait longer. Stream for LONG narrative answers only.

---

## Lovable prompt

```
Build the Chat page for Riko (Indian SMB AI CFO, Tally-grounded). Mobile-first, dual-panel on desktop.

Visual: DESIGN.md. Data per DATA.md. RBAC per RBAC.md.

Mobile: full-screen thread with top bar (conversation title + menu), scrollable feed, bottom input bar (attachment / mic / text / send).

Desktop dual-panel:
- Left: chat feed
- Right: contextual panel showing tables/charts referenced in latest answer, with "recent topics in conversation" tabs at top (auto-generated, NOT fixed categories). Each table/chart in panel is interactive.

EVERY AI RESPONSE HAS 4 STACKED LAYERS:
1. ANSWER — bold one-sentence direct answer
2. CALCULATION — show the math (label + value table)
3. SOURCES — cited vouchers / filings / bank transactions with timestamps + "Open source vouchers →" link
4. AI INSIGHT — only when actionable, one-click CTA only (e.g. "[Ping Nykaa →]"). Skip if nothing actionable.

Empty state:
- Cycling Hinglish + English starter prompt pills ("Cash runway?", "Nykaa ke paise kab aa rahe hain?", "GSTR-3B ready hai?", etc.)
- First-visit welcome cards explaining 4-layer pattern + source grounding

Interactions:
- Tap message → expand/collapse layers 2+3
- Per-message export (PDF / WhatsApp / copy)
- Attach Excel/PDF for context
- Voice input (Hinglish STT)
- Regenerate button
- Suggested follow-up chips after each response (2-3)

Source grounding is non-negotiable. Every factual claim cites voucher(s). If Riko can't ground, it says so — no hallucination.

RBAC:
- chat.full: admin, accounts-head, accounts, manager, viewer
- chat.sales: sales role — scoped to sales data only, blocks expense/salary/runway questions
- chat.view: read-only history (auditors)

Tone: direct, respectful, Hinglish-mirroring. ₹12.6L not Rs.1,260,000. No emoji spam, no "as an AI", no apologies without cause, no markdown in answers.

Do NOT: character-stream computed answers (feels slow), use fixed context-panel categories (they become stale), or allow unsourced claims.
```
