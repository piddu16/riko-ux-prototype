# Riko Chat — The Universal Access Layer

A deep map of chat as Riko's primary interface — every feature reachable, every input modality, every output shape, every conversation pattern.

---

## The thesis

Chat in Riko isn't *a feature alongside the dashboard*. It's a **parallel product surface** that mirrors and extends the entire product. Every screen has a chat-side equivalent. Some things are *only* accessible through chat (asking arbitrary questions, dropping files, voice, cross-feature composition).

The founder shouldn't need to know which tab to open. They just say what they need.

```mermaid
flowchart LR
    User([Founder / CA / Accounts]) --> Choice{How do I want to work?}
    Choice -->|"I know where to look"| Surface[Navigate to a screen]
    Choice -->|"I have a question"| Chat[Ask in chat]
    Choice -->|"I have a file"| Drop[Drop into chat]
    Choice -->|"I'm walking"| Voice[Hold mic in chat]
    Choice -->|"I want it composed"| Compose[Multi-feature chat workflow]

    Surface --> Goal((Outcome))
    Chat --> Goal
    Drop --> Goal
    Voice --> Goal
    Compose --> Goal

    classDef chat fill:#22C55E,color:#fff,stroke:#16A34A
    class Chat,Drop,Voice,Compose chat
```

The four green paths all flow through one chat interface. The grey "surface" path remains for power users and intensive review, but it's the **secondary** path.

---

## Table of contents

1. [The chat universe — master mindmap](#1-the-chat-universe--master-mindmap)
2. [Input modalities — six ways to talk to Riko](#2-input-modalities--six-ways-to-talk-to-riko)
3. [Query intent — taxonomy of what users ask](#3-query-intent--taxonomy-of-what-users-ask)
4. [Output catalog — how Riko responds](#4-output-catalog--how-riko-responds)
5. [Feature access map — every Riko capability via chat](#5-feature-access-map--every-riko-capability-via-chat)
6. [Agentic workflow patterns](#6-agentic-workflow-patterns)
7. [Conversation lifecycle](#7-conversation-lifecycle)
8. [Trust & control layer](#8-trust--control-layer)
9. [Memory & personalization](#9-memory--personalization)
10. [Cross-feature composition — the chat-only superpower](#10-cross-feature-composition--the-chat-only-superpower)
11. [Surface vs chat — when each wins](#11-surface-vs-chat--when-each-wins)

---

## 1. The chat universe — master mindmap

Every dimension of chat as a product surface.

```mermaid
mindmap
  root((Riko Chat))
    Input Methods
      Text typed
      Voice Hinglish STT
      File drop PDF Excel image
      Paste from WhatsApp
      Quick-reply chips
      "@" mentions for entities
      Slash commands
      Deep links from notifications
    Query Intent
      Information question
      Single action
      Document creation
      Multi-step workflow
      Navigation request
      Exploration discovery
      Cross-feature composition
      Configuration change
    Output Types
      Inline 4-layer answer
      Inline data table
      Inline chart
      Canvas artifact full-page
      File download PDF Excel XML
      One-tap action button
      Navigation link
      Inline form fill-in
      Multi-step progress plan
      Voice playback optional
    Agentic Capabilities
      Single-turn answer
      Multi-step workflow
      File auto-detection
      Tool-calling Tally INFINI bank
      Confirmation gates
      Background scheduling
      Autonomous monitoring
      Human-in-loop checkpoints
    Trust Layer
      Source vouchers cited
      "View sources" drill
      Disagreement surface
      Undo last action
      Consent before destructive
      Audit trail per user
      Confidence per field
    Memory Context
      Within-session full
      Cross-session recent
      Per-user prefs
      Named entities frequent
      Recent topics
      Active company
      Never PII passwords
    Universal Access
      Every screen reachable
      Every action triggerable
      Every report generatable
      Every export downloadable
      Every config changeable
```

---

## 2. Input modalities — six ways to talk to Riko

```mermaid
mindmap
  root((Inputs))
    Text typed
      Plain English
      Hinglish mix
      Slash commands
      "@" mentions
      Multi-line questions
    Voice
      Hold-to-speak
      Hinglish STT
      Real-time transcription
      Common while driving
      Best for short questions
    File drop
      PDF
        Bank statement
        Purchase invoice
        Expense receipt
        Sales PO
      Excel CSV
        Tally export
        Bulk vouchers
        Contact lists
      Images
        Scanned receipt
        Photo of invoice
        Whiteboard snapshot
      ZIP archive
        Multiple files
    Quick-reply chips
      After every answer
      "Break by month"
      "Compare to last year"
      "Show in chart"
    Deep links
      From WhatsApp morning brief
      From email reminder
      From in-app notification
      Pre-loaded with context
    Smart paste
      Long text from WhatsApp
      JSON / CSV chunks
      URLs
```

### When each modality wins

| Situation | Best input |
|---|---|
| At desk, deep query | Typed text |
| Walking / driving | Voice |
| Reviewing emailed invoice | File drop |
| Following up an answer | Quick-reply chip |
| Coming from a notification | Deep link with pre-context |
| Sharing data from another tool | Smart paste |

---

## 3. Query intent — taxonomy of what users ask

What kinds of things does a user say? Eight intent classes:

```mermaid
flowchart TD
    Input[User message arrives] --> Classify{Intent?}

    Classify -->|"What's my cash?"| Q1[INFORMATION<br/>Read-only data lookup]
    Classify -->|"Send Nykaa a reminder"| Q2[ACTION<br/>Single tool call with side effect]
    Classify -->|"Create invoice for Nykaa 12.6L"| Q3[DOCUMENT<br/>Generate a deliverable]
    Classify -->|"Reconcile March 2B"| Q4[WORKFLOW<br/>Multi-step orchestration]
    Classify -->|"Show me Day Book"| Q5[NAVIGATION<br/>Take user to a surface]
    Classify -->|"What's unusual this week?"| Q6[EXPLORATION<br/>Pattern detection]
    Classify -->|"Find overdue, remind, schedule"| Q7[COMPOSITION<br/>Chain features]
    Classify -->|"Change my CA to Rajesh"| Q8[CONFIGURATION<br/>Settings change]

    Q1 --> Read[Read endpoint, return 4-layer answer]
    Q2 --> Confirm[Confirmation gate, then write]
    Q3 --> Canvas[Open canvas, render artifact]
    Q4 --> Steps[Plan + visible step progression]
    Q5 --> Open[Deep-link to screen with context]
    Q6 --> Discover[Run anomaly detection across data]
    Q7 --> Orchestrate[Chain N tool calls with checkpoints]
    Q8 --> ConfigGate[Settings change with consent]

    classDef intent fill:#3B82F6,color:#fff,stroke:#2563EB
    class Q1,Q2,Q3,Q4,Q5,Q6,Q7,Q8 intent
```

The intent classifier is the **first decision** Riko makes on every message. The downstream tool routing, output shape, and confirmation requirements all branch from this classification.

---

## 4. Output catalog — how Riko responds

Nine output shapes, each with distinct UX.

```mermaid
mindmap
  root((Outputs))
    Inline 4-layer answer
      Bold one-line answer
      Calculation table
      Sources cited subtle
      Action button verb-first
    Inline data table
      Up to 5 rows visible
      Expand for more
      Sortable in place
      Per-row mini actions
    Inline chart
      200-300px tall
      Same visual language
      Tap to expand to canvas
    Canvas artifact
      Full-page render
      Right pane on desktop
      Full screen on mobile
      Reusable across messages
      Examples MIS recon invoice
    File download
      PDF for sharing
      Excel for analysis
      XML for Tally import
      ZIP for batches
    One-tap action
      Send WhatsApp
      Approve
      Post to Tally
      Schedule
      Subscribe
    Navigation link
      "Open in Day Book"
      "Show in Outstanding"
      Pre-filtered surface
    Inline form
      "Need amount + date"
      Quick fill in chat
      Submits without leaving
    Multi-step plan
      "I'll do 5 things"
      Visible progress per step
      Pause / resume / skip
```

### Output decision logic

```mermaid
flowchart TD
    Answer[Generated answer] --> Big{Is it big?}
    Big -->|Single number / sentence| Inline1[Inline 4-layer]
    Big -->|2-5 rows of data| Inline2[Inline table]
    Big -->|A chart| Inline3[Inline chart]
    Big -->|Full report / multi-section| Canvas[Open canvas]
    Big -->|File output| Download[Trigger download]

    Inline1 --> Action{Has action?}
    Inline2 --> Action
    Inline3 --> Action
    Canvas --> Action
    Action -->|Yes| Verb[Verb-first button]
    Action -->|No| Skip[Skip action layer]

    Verb --> Source{Has data citation?}
    Skip --> Source
    Source -->|Yes| Drill["View sources" link]
    Source -->|No| Plain[Plain prose only]
```

---

## 5. Feature access map — every Riko capability via chat

Every screen + section, with example natural-language phrasings that reach it.

```mermaid
mindmap
  root((Feature Access<br/>via Chat))
    Dashboard data
      "What's my cash runway?"
      "Show me revenue this month"
      "How am I doing today?"
      "Health score?"
    Outstanding AR
      "Who owes me?"
      "List overdue 60+ days"
      "Remind Nykaa"
      "How much is Paytm overdue?"
      "Bulk remind everyone overdue"
    Outstanding AP
      "Who do I owe?"
      "What's due this week?"
      "MSME flagged payables"
    Sales
      "Top customers FY25"
      "Revenue by month"
      "Compare March vs Feb"
      "Show me cohort retention"
      "Which channel is shrinking?"
    Inventory
      "What's running out?"
      "Dead stock list"
      "Margin under 25%?"
      "Last counted 60+ days"
      "Reorder Niacinamide"
    Day Book
      "Yesterday's vouchers"
      "Find 2.4L receipt"
      "Show me Nykaa receipts"
      "Last 50 entries"
    GST 2B reconciliation
      "March 2B status"
      "ITC at risk?"
      "Suppliers not filed"
      "Reconcile March 2B" (multi-step)
    GST filing CA-only
      "Generate GSTR-1 March"
      "File GSTR-3B" (with OTP)
      "ITC available March"
    TDS
      "TDS pending challan"
      "194C deductees"
      "Generate Form 16A for Rajesh"
      "Fetch 26AS"
    Reports
      "Generate March MIS"
      "Send MIS to my CA"
      "Schedule monthly to Yogesh"
      "Investor update Q4"
    Entries voucher creation
      "Draft Sales invoice Nykaa 12.6L"
      "Create Payment for Shiprocket 32k"
      "Bulk upload these 40 invoices" + drop file
    Bank reconciliation
      Drop statement file
      "Reconcile HDFC April"
      "What's unmatched?"
    Clients CA only
      "Switch to Patel Industries"
      "MIS for all 18 clients"
      "Who needs attention today?"
    Settings
      "Invite my CA as Viewer"
      "Turn on WhatsApp morning brief"
      "Change reporting language to Hindi"
      "Pause notifications this week"
    Cross-feature compose
      "Find overdue, draft reminders, schedule send"
      "Close my March books"
      "Get me ready for bank meeting"
```

### Access decision matrix

| If user says... | Riko reaches into... | Output |
|---|---|---|
| "cash runway" | Dashboard runway calculation | 4-layer answer + traceId |
| "who owes me" | Outstanding receivables aggregate | Action-list of parties with Remind buttons |
| "remind Nykaa" | Outstanding + WhatsApp templates | Confirmation gate → WhatsApp send |
| "create invoice for X" | Entries voucher creation | Inline form for missing fields → draft + canvas preview |
| "drop a bank statement" | Bank reconciliation | Auto-recon, canvas with matched/unmatched |
| "March MIS to CA" | Reports + WhatsApp send + saved CA contact | Canvas preview → confirm → send toast |
| "reconcile 2B" | GST Agent + INFINI 2B fetch | Multi-step workflow with visible steps |
| "switch to Patel" | Clients context switcher | Whole app re-renders for that company |

---

## 6. Agentic workflow patterns

Six shapes of agentic work, from simplest to most complex.

```mermaid
flowchart TD
    Input([User message]) --> Pattern{Workflow shape?}

    Pattern -->|Direct lookup| P1[Single-turn]
    Pattern -->|One write| P2[Single-turn with consent]
    Pattern -->|Many steps| P3[Multi-step]
    Pattern -->|File upload| P4[File-driven]
    Pattern -->|Recurring| P5[Scheduled]
    Pattern -->|Watch + alert| P6[Autonomous monitoring]

    P1 --> P1Flow[Tool call -> answer]
    P2 --> P2Flow[Show preview -> consent gate -> tool call -> result]
    P3 --> P3Flow[Plan visible steps -> execute each -> human approve at gates]
    P4 --> P4Flow[Detect type -> OCR if needed -> propose action -> human approve]
    P5 --> P5Flow[Set cron -> run at time -> deliver via channel]
    P6 --> P6Flow[Watch threshold -> alert when crossed -> propose action]

    classDef simple fill:#22C55E,color:#fff
    classDef medium fill:#F59E0B,color:#fff
    classDef complex fill:#EF4444,color:#fff
    class P1,P5 simple
    class P2,P4 medium
    class P3,P6 complex
```

### Pattern examples

| Pattern | Example user query | Riko's behavior |
|---|---|---|
| **Single-turn** | "What's my cash?" | One tool call, one answer |
| **Single-turn with consent** | "Send Nykaa a reminder" | Show preview of message → user confirms → WhatsApp send |
| **Multi-step** | "Reconcile March 2B" | 5 visible steps unfold (fetch 2B → match → flag at-risk → draft corrections → open canvas) |
| **File-driven** | drop `hdfc-april.pdf` | Detect bank statement → OCR/parse 147 lines → match 129 → present 18 unmatched for review |
| **Scheduled** | "Send me MIS every 5th of month" | Save schedule → cron fires → MIS generated → WhatsApp delivered |
| **Autonomous** | "Tell me if Nykaa pays" | Watch ledger → trigger when receipt voucher arrives → push notification + WhatsApp |

---

## 7. Conversation lifecycle

How a chat thread evolves over time.

```mermaid
stateDiagram-v2
    [*] --> Empty: New chat opened
    Empty --> FirstAnswer: First user message
    FirstAnswer --> WithinContext: Follow-up query in same thread
    WithinContext --> WithinContext: More follow-ups (context preserved)
    WithinContext --> ContextSwitch: User asks about a different topic
    ContextSwitch --> WithinContext: Riko silently spawns sub-context
    WithinContext --> Paused: User leaves app
    Paused --> Resumed: User returns same day
    Paused --> StaleResumed: User returns next day
    Resumed --> WithinContext
    StaleResumed --> WithinContext: Old context still loaded
    StaleResumed --> [*]: Or starts fresh thread
    WithinContext --> Archived: User starts new chat

    note right of WithinContext
        Riko remembers:
        - Active entities (Nykaa, March, etc.)
        - User preferences applied this session
        - Last 10 turns
    end note

    note right of ContextSwitch
        No "are you sure?" prompt
        — silent context swap
        like a human conversation
    end note
```

**Design principle**: never interrupt the user with "start a new chat?" prompts. The conversation is whatever they're talking about right now. Context switches happen silently.

---

## 8. Trust & control layer

How Riko earns trust without being defensive.

```mermaid
flowchart LR
    Answer[Riko produces an answer] --> Trust{Trust signal type?}

    Trust --> T1[Source citation]
    Trust --> T2[Confidence indicator]
    Trust --> T3[Disagreement surface]
    Trust --> T4[Consent gate]
    Trust --> T5[Undo support]
    Trust --> T6[Audit trail]

    T1 --> T1Detail[Subtle 'From 847 vouchers · last 90d' line<br/>+ tappable 'View sources' drill]
    T2 --> T2Detail[Per-field OCR confidence chips<br/>or 'based on 12 data points' qualifier]
    T3 --> T3Detail[When Tally says X but 2B says Y<br/>surface the gap, don't hide it]
    T4 --> T4Detail[Before any write, show preview<br/>'Send WhatsApp to 8 suppliers - Confirm?']
    T5 --> T5Detail[Per-message Undo button for 5 minutes<br/>after destructive action]
    T6 --> T6Detail[Every action logged with actor + timestamp<br/>visible in Settings → Activity]

    classDef good fill:#22C55E,color:#fff
    class T1,T2,T3,T4,T5,T6 good
```

### Anti-patterns to avoid

```mermaid
flowchart TD
    A[Bad chat behavior] --> A1[Hidden errors]
    A --> A2[Confident hallucination]
    A --> A3[Auto-actions without consent]
    A --> A4[Buried sources]
    A --> A5[No undo on destructive]
    A --> A6[Notification spam]
    A --> A7[Decorative AI claims]

    A1 --> Fix1[Always surface failures with reason]
    A2 --> Fix2[Cite vouchers — if can't, say "I don't have this"]
    A3 --> Fix3[Consent gate before writes]
    A4 --> Fix4[Source line always rendered subtle]
    A5 --> Fix5[5-minute undo window after writes]
    A6 --> Fix6[One push/day cap]
    A7 --> Fix7["Riko found something" only when actually surprising]

    classDef bad fill:#EF4444,color:#fff
    classDef fix fill:#22C55E,color:#fff
    class A1,A2,A3,A4,A5,A6,A7 bad
    class Fix1,Fix2,Fix3,Fix4,Fix5,Fix6,Fix7 fix
```

---

## 9. Memory & personalization

What Riko remembers, scoped by lifetime.

```mermaid
mindmap
  root((Memory))
    Within session
      Full thread history
      Active entities mentioned
      Preferences applied this session
      Multi-step workflow progress
    Cross session same day
      Last 10 conversations preview
      Recent named entities
      Active company context
    Cross session multi-day
      Pinned topics
      Saved queries
      Recurring patterns observed
    Per user always
      Display name
      Language preference EN Hi
      WhatsApp number opt-in
      Default report cadence
      Streak counter
      Yesterday's pending action
    Per company always
      Active company id
      Frequent parties
      Frequent SKUs
      Saved CA contact
      INFINI credentials
      Tally sync schedule
    Never persisted
      Passwords
      Banking PINs
      Specific PII beyond what's in books
      Voice recordings beyond STT
      Location
```

### Memory hierarchy

```mermaid
flowchart TD
    M[Memory query] --> Where{What's the lifetime?}

    Where -->|Last 5 minutes| Cache[In-memory cache]
    Where -->|This session| Session[Session storage]
    Where -->|This day| Daily[Daily store]
    Where -->|Forever| Persistent[Persistent DB - Supabase]
    Where -->|Never| Reject[Don't store]

    Cache -->|Examples| C1[Multi-step plan progress, partial OCR results]
    Session -->|Examples| S1[Conversation thread, active entities]
    Daily -->|Examples| D1[Streak day mark, today's notifications sent]
    Persistent -->|Examples| P1[Name, prefs, saved contacts, audit log]
    Reject -->|Examples| R1[Voice waveforms, raw passwords, PINs]
```

---

## 10. Cross-feature composition — the chat-only superpower

The thing chat enables that no surface can: chaining features in one breath. Six worked examples.

### 10.1 "Get me ready for the bank meeting tomorrow"

```mermaid
flowchart TD
    Q[User: 'Get me ready for the bank meeting tomorrow'] --> Plan
    Plan[Riko plans] --> S1[1. Pull 6-month revenue trend]
    S1 --> S2[2. Pull current cash + receivables aging]
    S2 --> S3[3. Compute projected runway]
    S3 --> S4[4. Identify top 3 customers + concentration risk]
    S4 --> S5[5. Generate 5-slide PDF in canvas]
    S5 --> Ask[Riko: 'Want all 5 or just runway + customers?']
    Ask --> Refine[User: 'Just runway and top 3']
    Refine --> S6[6. Re-render 3-slide PDF]
    S6 --> Final[Open in canvas]
    Final --> Share[User taps Share -> WhatsApp to bank manager]
```

### 10.2 "Why was September CAC so high?"

```mermaid
flowchart TD
    Q[User: 'Why was September CAC so high?'] --> Anomaly[Riko detects anomaly]
    Anomaly --> Pull[Pull Sep marketing spend by channel]
    Pull --> Find[Found: Amazon 6.8L spent vs 2.1L revenue]
    Find --> Ask1[Riko: 'Want me to find the root cause?']
    Ask1 --> Yes1[User: yes]
    Yes1 --> Drill[Drill into Sep Amazon campaign data]
    Drill --> Cause[CAC budget reallocated mid-month]
    Cause --> Suggest[Riko: 'Cap Amazon at 4L/month for ROAS 1.5x']
    Suggest --> Decide{User decides}
    Decide -->|Set alert| Alert[Schedule monthly CAC alert]
    Decide -->|Note for budget| Note[Add to next budget meeting prep]
    Decide -->|Ignore| Done[Done]
```

### 10.3 "Close my March books"

```mermaid
flowchart LR
    Q[User: 'Close my March books'] --> Plan[Riko: 6-step plan]
    Plan --> S1[1. Bundle approved Entries XML]
    S1 --> S2[2. Reconcile March bank statement]
    S2 --> S3[3. Reconcile GST 2B March]
    S3 --> S4[4. Draft Stock Journal for variance]
    S4 --> S5[5. Generate March MIS]
    S5 --> S6[6. Send MIS to CA]
    S6 --> Closed[Books closed - CA notified]

    S1 --> Gate1{Confirm?}
    Gate1 -->|Yes| Continue1[Proceed]
    Gate1 -->|Pause| Pause1[Resume later]

    S5 --> Gate2{Review MIS?}
    Gate2 -->|Approve| Continue2[Proceed]
    Gate2 -->|Edit| Edit[User edits sections]
    Edit --> S5
```

### 10.4 "Clean up dead stock"

```mermaid
flowchart TD
    Q[User: 'Clean up dead stock'] --> Find[Riko: 12 SKUs, no sales 90+ days, 17L locked]
    Find --> Show[Open canvas with table sorted by value]
    Show --> Ask[Riko: 'Want clearance-sale invoices for top 5?']
    Ask --> Yes[User: 'yes for top 5']
    Yes --> Draft[Draft 5 Sales invoices at 40% discount]
    Draft --> Canvas[Open canvas with all 5 drafts]
    Canvas --> Review{User reviews}
    Review -->|All good| Approve[Approve all 5]
    Review -->|Edit prices| Edit[Inline edit each]
    Approve --> Queue[Goes to Entries Drafts queue]
    Edit --> Approve
    Queue --> Owner[Owner approves -> XML export -> Tally]
```

### 10.5 "Set up daily morning brief on WhatsApp"

```mermaid
flowchart TD
    Q[User: 'Send me a morning brief every day on WhatsApp'] --> Confirm[Riko: 'When and what?']
    Confirm --> Time[User: '9 AM']
    Time --> Content[Riko: 'Top 3 actions, runway, GST status?']
    Content --> Yes[User: yes]
    Yes --> Setup[Schedule + WhatsApp opt-in]
    Setup --> Done[Done — first delivery tomorrow 9 AM]
    Done --> NextDay[Next day 9 AM]
    NextDay --> Send[WhatsApp delivers brief]
    Send --> Tap[User taps any item -> opens Riko at that surface]
```

### 10.6 "Find me a pattern I'm missing"

The discovery pattern — Riko surfaces what the user didn't ask for.

```mermaid
flowchart TD
    Q[User: 'Find me a pattern I'm missing'] --> Scan[Riko scans 90 days]
    Scan --> Detect[Anomaly detection across:]
    Detect --> A1[Customer concentration]
    Detect --> A2[Vendor cost spikes]
    Detect --> A3[Inventory turn anomalies]
    Detect --> A4[GST mismatch trends]
    Detect --> A5[Receivable slow-pay patterns]

    A1 --> Surface[Surface 1-3 most surprising findings]
    A2 --> Surface
    A3 --> Surface
    A4 --> Surface
    A5 --> Surface

    Surface --> Show[Inline cards with findings + 'tell me more' option]
    Show --> Pick[User picks one to explore]
    Pick --> Drill[Drill into that finding]
```

---

## 11. Surface vs chat — when each wins

A decision matrix for the user.

```mermaid
flowchart TD
    Need([User has a need]) --> Where{Where to go?}

    Where -->|"Quick number check"| Direct{Know the number?}
    Direct -->|"On dashboard"| Surface1[Open Dashboard]
    Direct -->|"Anywhere"| Chat1[Just ask]

    Where -->|"Bulk review"| Bulk{How much?}
    Bulk -->|"Many items"| Surface2[Open the table - Outstanding/Day Book]
    Bulk -->|"Targeted"| Chat2[Ask 'show me X']

    Where -->|"Action take"| Act{Single or bulk?}
    Act -->|"One action"| Chat3[Chat - faster]
    Act -->|"50 items"| Surface3[Surface - bulk select]

    Where -->|"On the move"| Mobile{Hands free?}
    Mobile -->|"Yes"| Voice[Chat voice]
    Mobile -->|"Typing OK"| Chat4[Chat text]

    Where -->|"Composition"| Composed[Always chat — surfaces can't compose]

    Where -->|"Don't know where"| Universal[Chat — universal fallback]

    classDef chat fill:#22C55E,color:#fff,stroke:#16A34A
    classDef surface fill:#94A3B8,color:#fff,stroke:#64748B
    class Chat1,Chat2,Chat3,Chat4,Voice,Composed,Universal chat
    class Surface1,Surface2,Surface3 surface
```

### Quick reference

| Situation | Use surface | Use chat |
|---|---|---|
| Single quick lookup | If you remember which screen | Always works |
| Bulk review of many rows | ✓ — tables shine | Awkward |
| Single action on one item | OK | Faster |
| Bulk action across many | ✓ — multi-select bar | Possible but typing-heavy |
| On mobile, on the move | Cramped | ✓ voice + chat |
| Cross-feature composition | Impossible | ✓ only path |
| First-time exploration | Hard to know where | ✓ ask anything |
| Recurring scheduled task | Manual every time | ✓ "every Monday do X" |
| Deep analytical drill | ✓ — multi-pane | Possible if you know how to ask |
| Compliance / regulated action | ✓ — audit-friendly visible flow | Use chat to draft, surface to approve |

---

## Final principle

**Chat is the front door. Surfaces are the rooms.**

A new user's first dozen interactions should all be chat-driven. Once they know what they want and where it lives, they may navigate to surfaces directly for power-user efficiency. But chat remains the universal access layer — every action, every report, every export, every config change reachable through natural language.

Pair this map with:
- [`USER-FLOWS.md`](./USER-FLOWS.md) — overall user journeys including chat
- [`sections/chat.md`](./sections/chat.md) — the per-screen UX spec
- [`IMPLEMENTATION-PLAN.md`](./IMPLEMENTATION-PLAN.md) — engineering roadmap with chat as the highest-leverage Tier 2 work
