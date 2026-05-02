# Riko — User Perspective Flow Analysis

A mindmap + workflow + decision-tree analysis of the riko-ux-prototype from the **user's perspective**. Each diagram is rendered with Mermaid (works natively on GitHub, VS Code Markdown preview, Obsidian, Notion).

---

## Table of contents

1. [The product as one mindmap](#1-the-product-as-one-mindmap)
2. [Three personas — three mental models](#2-three-personas--three-mental-models)
3. [First-time user — entering the product](#3-first-time-user--entering-the-product)
4. [Daily ritual — a founder's morning](#4-daily-ritual--a-founders-morning)
5. [Jobs-to-be-done — task flows](#5-jobs-to-be-done--task-flows)
6. [Workflow state machines](#6-workflow-state-machines)
7. [Decision tree — "I need to…"](#7-decision-tree--i-need-to)
8. [Cross-section flows — how features connect](#8-cross-section-flows--how-features-connect)
9. [A typical day — journey map](#9-a-typical-day--journey-map)

---

## 1. The product as one mindmap

The complete product surface as a user perceives it — five concept areas branching from Riko at the center.

```mermaid
mindmap
  root((Riko))
    Daily Ritual
      Morning open
        Time-of-day greeting
        Streak counter
        Yesterday's action banner
      Action Queue
        Top 3-5 priorities
        Verb-first CTAs
        Impact in rupees
      Mobile-first
        Phone during the day
        Desktop in the evening
    Information & Insights
      Dashboard
        Health Score
        Runway timeline
        KPI grid + sparklines
        Cash waterfall
      Sales
        Overview + YoY
        Customers + cohorts
        Products + HSN
        Insights
      Inventory
        Stock list
        Godown tabs
        FIFO display
        Dead stock
      Day Book
        57k voucher feed
        Party filter
        Date grouping
    Communication
      Chat
        4-layer responses
        File auto-detect
        Voice Hinglish
        Source drilldown
      Reports
        6 templates
        WhatsApp send
        Scheduled delivery
        Version history
      WhatsApp
        Native share
        Morning brief
        Reminder templates
        Send to CA
    Compliance
      GST Agent
        2B reconciliation
        Filing tracker
        Multi-GSTIN
        ITC at risk
      TDS
        Section-wise
        26AS recon
        Form 16A
        Deadline cards
      Statutory deadlines
        CBDT rules
        GSTN cycles
    Operations
      Outstanding
        Receivables aging
        Payables MSME
        Bulk WhatsApp
        Risk matrix
      Entries
        Drafts queue
        Approval chain
        XML export
        Audit trail
      Bank Recon
        Statement upload
        AI match scoring
        Voucher drafts
    Governance
      Trust Layer
        Sync status strip
        Source drilldown
        Disagreement surface
      Team RBAC
        8 roles
        Approval thresholds
        Role preview
      CA Portfolio
        Clients grid
        Bulk MIS
        Company switch
        Compliance calendar
```

---

## 2. Three personas — three mental models

The same product surfaces, viewed through three different lenses.

### 2.1 SMB Founder (primary persona)

```mermaid
mindmap
  root((Founder<br/>"Yogesh"))
    Anxieties
      Cash running out
      Customers not paying
      GST deadline missed
      Stock running out
    Daily check
      Phone, between meetings
      "Am I OK?"
      "What do I do today?"
    Primary surfaces
      Dashboard
      Chat
      Outstanding
    Trigger actions
      Call/WhatsApp customer
      Approve MIS for CA
      Reorder stock
    Status checks
      Cash position
      Top 3 actions
      GST status
    Communication
      WhatsApp share
      Voice queries
      Hinglish allowed
```

### 2.2 Chartered Accountant (secondary persona)

```mermaid
mindmap
  root((CA<br/>"Rajesh"))
    Workload
      18 clients
      60+ hrs/month MIS
      Compliance calendar
    Monday morning
      Open Clients tab
      Triage 18 cards
      Pick worst-status first
    Primary surfaces
      Clients portfolio
      GST Agent
      Reports
      Day Book
    Per-client tasks
      Generate MIS
      Reconcile 2B
      File returns
      Send to client
    Bulk operations
      MIS for all 18
      Reminder all overdue
      Schedule reports
    Filing flows
      GSTR-1
      GSTR-3B
      TDS Q4
      Form 16A
```

### 2.3 Accounts staff (tertiary persona)

```mermaid
mindmap
  root((Accounts<br/>"Kavya/Sneha"))
    Daily volume
      40 invoices/day
      Bank statement
      Petty cash
    Junior tasks
      Drafts only
      Upload OCR
      Mark queries
    Senior tasks
      Approve smaller
      Reject with reason
      Post to Tally
    Primary surfaces
      Entries queue
      Bank Recon
      Day Book
    Approval flow
      Junior drafts
      Accounts approves
      Head approves big
      Owner overrides
    Trust signals
      Audit trail
      Per-row actor
      Confidence chips
```

---

## 3. First-time user — entering the product

The journey from the very first visit to the first valuable answer.

```mermaid
flowchart TD
    Start([User lands on rikoai.in]) --> Auth{Has account?}
    Auth -->|No| Signup[Sign up flow]
    Signup --> Verify[Email/phone verify]
    Verify --> OnbModal
    Auth -->|Yes| LoadAuth{Onboarded?}
    LoadAuth -->|No, first time| OnbModal[Onboarding modal]
    LoadAuth -->|Yes| Greeting

    OnbModal --> Name[Enter first name]
    Name --> ConnectChoice{How to connect books?}
    ConnectChoice -->|TallyPrime live| TallyConnect[INFINI sync setup]
    ConnectChoice -->|Upload exports| FileUpload[Drop CSV/XLSX]
    ConnectChoice -->|Demo data| DemoMode[Bandra Soap fixtures]

    TallyConnect --> Sync[Initial sync 30-60s]
    FileUpload --> Sync
    DemoMode --> Greeting

    Sync --> FirstInsight{First insight ready?}
    FirstInsight -->|Yes| Wrapped[Spotify-Wrapped style 6-card story]
    FirstInsight -->|Limited data| LimitedNote[Honest 'limited data' callout]

    Wrapped --> Greeting
    LimitedNote --> Greeting

    Greeting[Greeting: 'Good afternoon, Yogesh'] --> Empty[Empty state with 4 moment cards]
    Empty --> Choice{What do they tap?}
    Choice -->|Cash runway card| Cash[Chat: 'What's my cash runway?']
    Choice -->|Overdue card| Overdue[Outstanding tab]
    Choice -->|GST due card| GST[GST Agent]
    Choice -->|Dead stock card| DeadStock[Inventory dead stock]
    Choice -->|Capability chip| Capability[Generate MIS / Reconcile 2B / etc.]
    Choice -->|WhatsApp opt-in| WAOptIn[Phone number entry]

    Cash --> FirstAnswer[First answer with 4 layers]
    Overdue --> FirstAnswer
    GST --> FirstAnswer
    DeadStock --> FirstAnswer
    Capability --> FirstAnswer
    WAOptIn --> FirstAnswer

    FirstAnswer --> Success([Activated: user has seen value])

    classDef startEnd fill:#22C55E,color:#fff,stroke:#16A34A
    classDef decision fill:#F59E0B,color:#fff,stroke:#D97706
    classDef action fill:#3B82F6,color:#fff,stroke:#2563EB
    class Start,Success startEnd
    class Auth,LoadAuth,ConnectChoice,FirstInsight,Choice decision
```

**Key UX principles in this flow:**
- Onboarding has only **3 paths** (Tally / Upload / Demo) — no decision overload
- The "First Insight" is the activation wedge — Wrapped-style summary the moment data lands
- The empty state isn't generic prompt chips — it's **the user's actual current moment** ("₹17.4L overdue", "GSTR-3B due in 5 days") drawn from their data
- WhatsApp opt-in sits in the empty state, not buried in Settings

---

## 4. Daily ritual — a founder's morning

The most common interaction — opening Riko on a phone with breakfast.

```mermaid
flowchart TD
    Open([Founder opens Riko app]) --> Time{Time of day}
    Time -->|Morning| Hi1[Good morning, Yogesh]
    Time -->|Afternoon| Hi2[Good afternoon, Yogesh]
    Time -->|Evening| Hi3[Good evening, Yogesh]

    Hi1 --> Streak{Streak >= 2 days?}
    Hi2 --> Streak
    Hi3 --> Streak
    Streak -->|Yes| Chip[Show streak chip - 12 day streak]
    Streak -->|No| NoChip[No streak chip yet]

    Chip --> Pending
    NoChip --> Pending
    Pending{Pending action from yesterday?}

    Pending -->|Yes| Banner[Yesterday banner: Call Nykaa]
    Banner --> Resolve{Resolve?}
    Resolve -->|Done| Stash1[Mark resolved + congrats toast]
    Resolve -->|Snooze| Stash2[Re-surface tomorrow]
    Resolve -->|Skip| Stash3[Discard]

    Pending -->|No| AQ
    Stash1 --> AQ
    Stash2 --> AQ
    Stash3 --> AQ

    AQ[Action Queue - 3 to 5 cards] --> Pick{Which action?}

    Pick -->|Call Nykaa - 12.6L| WA[Open WhatsApp template]
    Pick -->|File GSTR-3B| GSTNav[GST Agent tab]
    Pick -->|Reorder Niacinamide| InvNav[Inventory page]
    Pick -->|Approve MIS for CA| RepNav[Reports - MIS preview]
    Pick -->|Review CAC spike| SalesNav[Sales analytics]
    Pick -->|None - explore| Browse[Browse other surfaces]

    WA --> Send[Pre-filled Hinglish message] --> SendDone[Sent - WhatsApp returns to Riko]
    GSTNav --> Recon[2B reconciliation flow]
    InvNav --> PO[Create PO draft]
    RepNav --> Approve[Tap Approve - sends to CA]
    SalesNav --> Investigate[Drill into CAC anomaly]
    Browse --> Explore[Browse Dashboard / Outstanding / Chat]

    SendDone --> NextAction
    Recon --> NextAction
    PO --> NextAction
    Approve --> NextAction
    Investigate --> NextAction
    Explore --> NextAction

    NextAction{Another action?}
    NextAction -->|Yes| Pick
    NextAction -->|Done for now| Close([Close app, will return tomorrow])

    classDef startEnd fill:#22C55E,color:#fff,stroke:#16A34A
    classDef decision fill:#F59E0B,color:#fff,stroke:#D97706
    classDef action fill:#3B82F6,color:#fff,stroke:#2563EB
    class Open,Close startEnd
    class Time,Streak,Pending,Resolve,Pick,NextAction decision
```

**Key UX principles:**
- The app is **task-oriented**, not data-oriented. Every visit ends in an action taken or a decision made.
- The **streak + yesterday's action** create a daily-return loop *without* manipulative dark patterns.
- Each Action Queue item carries an **impact in rupees** so the founder knows which to pick first.
- Almost every action terminates in **WhatsApp** (the substrate where Indian SMBs actually live).

---

## 5. Jobs-to-be-done — task flows

The five most common reasons a founder opens Riko, each as its own flow.

### 5.1 "Am I running out of money?"

```mermaid
flowchart LR
    Worry([Anxiety about cash]) --> Open[Open Riko]
    Open --> Where{Where to check?}
    Where -->|Dashboard| DashRun[Dashboard runway widget]
    Where -->|Chat| ChatAsk[Type: 'cash runway?']

    DashRun --> See[See: 9 days, red zone]
    ChatAsk --> Stream[Streaming 4-layer answer]
    Stream --> See

    See --> Drill{Why so low?}
    Drill --> Source[Tap 'View sources']
    Source --> Vouchers[See 5-8 underlying vouchers]

    See --> Actions{Extension paths}
    Actions --> A1[Collect 12.6L from Nykaa]
    Actions --> A2[Cut marketing 30%]
    Actions --> A3[Claim 4.6L GST refund]

    A1 --> WA[WhatsApp Nykaa with template]
    A2 --> Note[Note for next budget meeting]
    A3 --> GSTRefund[GST Agent → File RFD-01]

    WA --> Calm([Anxiety reduced — clear path])
    Note --> Calm
    GSTRefund --> Calm
    Vouchers --> Calm
```

### 5.2 "Who owes me money?"

```mermaid
flowchart TD
    Open([Founder needs to chase payments]) --> Out[Outstanding tab]
    Out --> Tab{Receivables or Payables?}
    Tab -->|Receivables| Recv[Receivables view]

    Recv --> Sort[Sort: Days overdue desc]
    Sort --> Filter{Filter chips}
    Filter -->|Critical 90 plus| Critical[Top critical parties]
    Filter -->|Never reminded| Never[Parties never contacted]
    Filter -->|All| All[Full list]

    Critical --> Top[Nykaa - 12.6L 62 days]
    Never --> Top
    All --> Top

    Top --> RowAction{Per-row action}
    RowAction -->|Remind individually| WA1[WhatsApp template gentle/firm/final]
    RowAction -->|Mark paid| Receipt[Drafts Receipt voucher to Entries]
    RowAction -->|View party history| P360[Party 360 drawer]
    RowAction -->|Disputed| Dispute[Tag disputed - freeze auto-reminders]

    Top --> Bulk{Need bulk action?}
    Bulk -->|Yes| BulkBar[Select 8 overdue parties]
    BulkBar --> BulkRemind[Bulk WhatsApp - per-row preview]
    BulkRemind --> Confirm[Confirm and send all 8]

    WA1 --> Sent[Reminders sent]
    Receipt --> Approve[Goes to approval queue]
    P360 --> History[Full ledger history]
    Dispute --> Tagged[Party tagged, removed from auto-flow]
    Confirm --> Sent

    Sent --> Done([Followed up - tomorrow check responses])
```

### 5.3 "I need to send my CA the March MIS"

This is the **highest-frequency SMB↔CA interaction**, and the headline collaboration flow.

```mermaid
flowchart TD
    Need([Founder: 'Need to send CA the MIS']) --> Mode{How to start?}
    Mode -->|Reports tab| RepNav[Reports]
    Mode -->|Chat| ChatAsk[Type: 'send March MIS to my CA']

    RepNav --> Pick[Pick MIS template]
    ChatAsk --> AutoGen[Riko auto-generates]
    Pick --> Preview[Preview pane shows PDF render]
    AutoGen --> Preview

    Preview --> Customize{Customize?}
    Customize -->|Default sections| Default[Headline KPIs + P&L + AR aging + commentary]
    Customize -->|Custom| Sections[Pick sections, date range, comparison period]

    Default --> Recipient[Confirm CA recipient from saved contacts]
    Sections --> Recipient

    Recipient --> Channel{Channel}
    Channel -->|WhatsApp| WAFlow[WhatsApp send flow]
    Channel -->|Email| Email[Email send]
    Channel -->|Schedule| Sched[Schedule recurring monthly]

    WAFlow --> WAPreview[Preview Hinglish message + PDF attachment]
    WAPreview --> Confirm{Confirm send?}
    Confirm -->|Yes| Sent[Sent via WhatsApp Business API]
    Confirm -->|No| Edit[Edit message]
    Edit --> WAPreview

    Sent --> Toast[Toast: 'Sent to Rajesh CA']
    Toast --> Track[Tracked in version history]
    Track --> Done([CA receives MIS Friday morning - same content they used to compile in 2 hours])
```

### 5.4 "A vendor invoice arrived — get it into the books"

The canonical **agentic file-upload moment**. This is what makes Riko feel like a copilot.

```mermaid
flowchart TD
    Email([Email arrives with invoice PDF]) --> Forward[Forward to Riko or drag into chat]
    Forward --> Chip[Composer chip: detecting 84KB]

    Chip --> Detect{Auto-detection}
    Detect -->|Filename match| FastClass[Fast classifier: filename + extension]
    Detect -->|Content scan| OCR[OCR pipeline reads content]

    FastClass --> Type{Detected type}
    OCR --> Type

    Type -->|Bank statement| BankFlow[Open recon canvas]
    Type -->|Purchase invoice| PurchaseFlow[OCR extract vendor GSTIN, line items, tax]
    Type -->|Expense receipt| ExpFlow[OCR extract vendor, amount, category]
    Type -->|Sales PO| SalesFlow[Draft Sales invoice from PO]
    Type -->|Spreadsheet batch| BatchFlow[Bulk preview - 284 rows]
    Type -->|Unknown| Ask[Ask user: classify this]

    PurchaseFlow --> Confidence[Per-field confidence chips]
    Confidence --> Review{User reviews}
    Review -->|All looks good| Approve[Approve draft]
    Review -->|One field wrong| Fix[Inline edit field]
    Review -->|Reject| Discard[Discard]

    Fix --> Review
    Approve --> Queue[Goes to Entries queue as Draft]
    Queue --> RBAC{Amount}
    RBAC -->|Less than 1L| ToAccounts[Routes to Accounts approver]
    RBAC -->|More than 1L| ToHead[Routes to Accounts Head]

    ToAccounts --> ApproverReview[Approver reviews]
    ToHead --> ApproverReview
    ApproverReview -->|Approve| ApprovedState[State: Approved]
    ApproverReview -->|Reject| RejectedState[State: Rejected with reason]

    ApprovedState --> EOD[End of day: bundle download]
    EOD --> XML[Today's vouchers XML]
    XML --> Tally[User imports XML in Tally]
    Tally --> Confirm[User clicks 'Confirm imported' in Riko]
    Confirm --> Done([State: Confirmed - audit trail complete])
```

### 5.5 "Reconcile my March 2B" (multi-step agentic workflow)

The most ambitious chat-driven workflow — it unrolls in visible steps.

```mermaid
flowchart LR
    Ask([Type: reconcile March 2B]) --> Plan[Riko plans 5 steps]

    Plan --> S1[Step 1: Fetch GSTR-2B from INFINI]
    S1 --> S1Done[150 lines fetched]
    S1Done --> S2[Step 2: Match against Tally purchase vouchers]
    S2 --> S2Done[129 matched, 12 mismatches, 8 missing 2B, 2 missing Tally]
    S2Done --> S3[Step 3: Flag 4.2L ITC at risk]
    S3 --> S3Done[8 suppliers haven't filed GSTR-1]
    S3Done --> S4[Step 4: Draft Stock Journal corrections for variances]
    S4 --> S4Done[3 corrections drafted]
    S4Done --> S5[Step 5: Open recon canvas for human review]
    S5 --> Canvas[Canvas opens with full recon table]

    Canvas --> Decide{Per-line decisions}
    Decide -->|Accept matched 129| AcceptAll[Bulk accept all 99% confidence matches]
    Decide -->|Investigate mismatch| Inv[Side-by-side diff drawer]
    Decide -->|Remind missing 2B| Remind[Bulk WhatsApp 8 suppliers]
    Decide -->|Record missing Tally| Record[Open voucher draft form]

    AcceptAll --> Status[Update status to matched]
    Inv --> Resolved[Mark resolved with reason]
    Remind --> Reminders[8 reminders queued]
    Record --> NewDraft[New draft to Entries]

    Status --> Final[All 150 lines reconciled]
    Resolved --> Final
    Reminders --> Final
    NewDraft --> Final

    Final --> Done([Recon complete - ITC claim ready for filing])
```

---

## 6. Workflow state machines

### 6.1 Entries lifecycle (with XML write-back)

```mermaid
stateDiagram-v2
    [*] --> Draft: Create new
    Draft --> Pending: Submit for approval
    Draft --> [*]: Discard
    Pending --> Approved: Approver accepts
    Pending --> Rejected: Approver rejects
    Pending --> Draft: Approver returns for edits
    Approved --> Exported: Owner downloads bundle XML
    Exported --> Confirmed: Owner confirms 'imported in Tally'
    Exported --> Approved: Confirmation skipped (re-export later)
    Rejected --> Draft: Drafter resubmits with fixes
    Rejected --> [*]: Drafter abandons
    Confirmed --> [*]: Final state — voucher in Tally

    note right of Draft
        Junior accounts can draft
        any voucher type
    end note
    note right of Pending
        Routing by amount:
        ≤₹50k = any approver
        ₹50k-1L = Accounts
        >1L = Accounts Head
    end note
    note right of Confirmed
        Audit trail visible:
        drafted-by → approved-by →
        exported-by → confirmed-by
    end note
```

### 6.2 GST 2B reconciliation match states

```mermaid
stateDiagram-v2
    [*] --> Untriaged
    Untriaged --> Matched: Auto-match (99%+ confidence)
    Untriaged --> ManualMatched: User confirms a probable match
    Untriaged --> PartialMatch: Amount differs <5%
    Untriaged --> Mismatch: Amount differs >5%
    Untriaged --> MissingPortal: In Tally not in 2B (supplier hasn't filed)
    Untriaged --> MissingTally: In 2B not in Tally (need to record)

    Matched --> [*]: Closed clean
    ManualMatched --> [*]: Closed with note
    PartialMatch --> Resolved: Adjustment recorded
    Mismatch --> Investigated: Side-by-side diff
    Investigated --> Resolved: Decision made
    MissingPortal --> Reminded: WhatsApp supplier
    Reminded --> Matched: Supplier filed
    Reminded --> Disputed: No response after N reminders
    MissingTally --> RecordedTally: New draft created

    Resolved --> [*]
    RecordedTally --> [*]
    Disputed --> [*]: Manual escalation
```

### 6.3 Outstanding reminder escalation

```mermaid
stateDiagram-v2
    [*] --> Current: 0-30 days
    Current --> Overdue: >credit_days passed
    Overdue --> Reminded_Gentle: First WhatsApp
    Reminded_Gentle --> Paid: Payment received
    Reminded_Gentle --> Reminded_Firm: 7 days no response
    Reminded_Firm --> Paid
    Reminded_Firm --> Reminded_Final: 14 days no response
    Reminded_Final --> Paid
    Reminded_Final --> Disputed: 30 days no response or dispute raised
    Disputed --> Paid: Resolved
    Disputed --> WriteOff: Owner gives up
    Paid --> [*]: Receipt voucher created
    WriteOff --> [*]: Bad debt journal entry
```

---

## 7. Decision tree — "I need to…"

What every common user task maps to in Riko.

```mermaid
flowchart TD
    Need([User has a need]) --> Type{What kind?}

    Type -->|Money question| Money{Money sub-type}
    Type -->|Document task| Doc{Document sub-type}
    Type -->|Compliance| Comp{Compliance sub-type}
    Type -->|Operations| Ops{Operations sub-type}
    Type -->|Setup change| Setup{Setup sub-type}

    Money -->|Cash position| Dash1[Dashboard runway]
    Money -->|Top customers| Sales1[Sales > Customers]
    Money -->|Profit/loss| Reports1[Reports > P&L Deep Dive]
    Money -->|Bank balance| BankRecon1[Bank Recon]
    Money -->|Anything else| Chat1[Chat - just ask]

    Doc -->|Generate MIS| Reports2[Reports > MIS]
    Doc -->|Need an invoice| Entries1[Entries > New Sales]
    Doc -->|Got a bill| Entries2[Drag PDF into chat - auto-detect]
    Doc -->|Send to CA| Reports3[Reports > WhatsApp send]
    Doc -->|Bulk import| Entries3[Entries > Bulk upload modal]

    Comp -->|GST status| GST1[GST Agent dashboard]
    Comp -->|2B reconcile| GST2[GST > Reconciliation tab]
    Comp -->|File GSTR-1| GST3[GST > GSTR-1 - CA only]
    Comp -->|TDS workings| TDS1[TDS section-wise]
    Comp -->|Form 16A| TDS2[TDS > Generate Form 16A]
    Comp -->|26AS recon| TDS3[TDS > 26AS reconciliation]

    Ops -->|Who owes me| Out1[Outstanding > Receivables]
    Ops -->|Who I owe| Out2[Outstanding > Payables]
    Ops -->|Stock check| Inv1[Inventory list]
    Ops -->|Dead stock| Inv2[Inventory > Dead Stock]
    Ops -->|Physical count| Inv3[Inventory > Reconcile Physical]
    Ops -->|Voucher search| Day1[Day Book - search]

    Setup -->|Add team| Settings1[Settings > Team > Invite]
    Setup -->|Change role| Settings2[Settings > Team]
    Setup -->|Connect Tally| Settings3[Settings > Integrations]
    Setup -->|API access| Settings4[Settings > API Keys]
    Setup -->|Notifications| Settings5[Settings > Notify]
    Setup -->|WhatsApp number| Settings6[Settings > WhatsApp]

    Chat1 --> Universal[Chat is the universal fallback]
```

**The product principle behind this tree:**
Every task maps to **either a dedicated screen** (when the user knows where to go) **or chat** (when they don't, or it's faster to ask). Chat is the universal fallback — never a dead end.

---

## 8. Cross-section flows — how features connect

The product's value compounds when features chain together. Three canonical chains:

### 8.1 Outstanding → Mark Paid → Entries → Tally

```mermaid
flowchart LR
    Out[Outstanding row: Nykaa 12.6L overdue] --> Mark[Tap 'Mark Paid']
    Mark --> Sheet[Receipt voucher draft sheet]
    Sheet --> Fill[Fill amount, date, mode, UTR, bank]
    Fill --> Save[Save creates Receipt voucher in Entries queue]
    Save --> Entries[Entries > Drafts tab]
    Entries --> Approve[Approver approves]
    Approve --> Bundle[Owner downloads today's XML bundle]
    Bundle --> Tally[Imports into Tally]
    Tally --> Confirm[Confirms in Riko]
    Confirm --> OutUpdate[Outstanding now shows 0 due for Nykaa]
```

### 8.2 Bank Statement upload → AI match → Entries → Tally

```mermaid
flowchart LR
    Drop[Drop HDFC April PDF in chat] --> Detect[Auto-detect: bank statement]
    Detect --> Open[Open Bank Recon canvas]
    Open --> Match[AI matches 129/147 lines]
    Match --> Review[Review 18 unmatched]
    Review --> Action{Per line action}
    Action -->|Match suggestion| Accept[Accept match]
    Action -->|Create voucher| New[Draft Receipt or Payment]
    Action -->|Skip| Skip[Mark as non-business]

    Accept --> Linked[Bank line linked to voucher]
    New --> EntriesQ[Entries Drafts queue]
    Skip --> Out[Out of recon]

    Linked --> Posted[Already posted - no further action]
    EntriesQ --> ApprovalChain[Approval chain]
    ApprovalChain --> ExportXML[XML export]
    ExportXML --> ImportTally[Tally import]
    ImportTally --> ReconClosed[Bank recon closed for April]
```

### 8.3 Inventory Physical Count → Variance → Stock Journal → Tally

```mermaid
flowchart LR
    Recon[Tap 'Reconcile physical stock'] --> Template[Download template CSV]
    Template --> Count[Count stock physically]
    Count --> Upload[Upload back into Riko]
    Upload --> Variance[Variance preview - 4 buckets]
    Variance --> Buckets{Per-row routing}
    Buckets -->|Matched ±2 percent| AutoOK[Auto-confirm no journal]
    Buckets -->|Minor 2-5 percent| BulkJ[Bulk journal to Accounts]
    Buckets -->|Major over 5 percent| PerSKU[Per-SKU vouchers to Accounts Head]
    Buckets -->|New SKU| NewMaster[Flag for SKU master creation]

    BulkJ --> Drafts[Stock Journal drafts in Entries]
    PerSKU --> Drafts
    NewMaster --> Master[Create SKU first]

    Drafts --> Approve[Approve in queue]
    Approve --> XMLExport[XML export]
    XMLExport --> TallyImport[Import in Tally]
    TallyImport --> Reconciled[Inventory closing matches physical]
```

---

## 9. A typical day — journey map

A founder's full day with Riko, plotted on a satisfaction curve.

```mermaid
journey
    title A day in Yogesh's life with Riko
    section Morning (mobile, between meetings)
      Open app, see greeting + streak: 5: Founder
      Action queue surfaces 3 priorities: 5: Founder
      Tap "Call Nykaa about ₹12.6L": 5: Founder
      WhatsApp template auto-fills: 4: Founder
      Send reminder: 5: Founder
    section Afternoon (mobile, vendor meeting)
      Vendor sends invoice via email: 3: Founder
      Forward PDF to Riko: 5: Founder
      Auto-detected as Purchase invoice: 5: Founder, Junior
      OCR extracts vendor + GSTIN + line items: 4: Founder, Junior
      Approve draft on phone: 5: Founder
    section Evening (desktop, at office)
      Open Riko on laptop: 5: Founder
      See "47 vouchers ready for evening import": 4: Founder
      Open Tally Prime: 4: Founder
      Download Riko vouchers XML: 5: Founder
      Tally imports 47 vouchers: 5: Founder
      Confirm imported in Riko: 5: Founder
    section Night (mobile, casual check)
      Open Riko before bed: 5: Founder
      Streak now 13 days: 5: Founder
      No critical alerts: 5: Founder
      Close app: 5: Founder
```

---

## Reading the diagrams

**On GitHub:** all Mermaid diagrams render automatically in the file viewer.

**In VS Code:** install the *"Markdown Preview Mermaid Support"* extension, then `Ctrl+Shift+V` opens the preview.

**In Obsidian / Notion / Bear:** native Mermaid support.

**As images:** if you need static PNG/SVG exports for a deck, paste any individual diagram into [mermaid.live](https://mermaid.live) — it renders + exports.

---

## What this document is for

Three audiences, three uses:

1. **Engineering** — the state machines and cross-section flows are the canonical specs for the workflow features (Entries, Bank Recon, GST recon).
2. **Product / Design** — the persona mindmaps and JTBD flows are the basis for usability testing scripts and onboarding flow design.
3. **Leadership / Investors** — the high-level mindmap and journey map are the simplest way to communicate the product surface in a single image.

Pair this with [`IMPLEMENTATION-PLAN.md`](./IMPLEMENTATION-PLAN.md) (the engineering roadmap) and the section-level specs in [`docs/sections/`](./sections/) (the per-feature UX detail).
