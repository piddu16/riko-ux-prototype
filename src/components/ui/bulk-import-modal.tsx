"use client";

/* ═══════════════════════════════════════════════════════════════
   BulkImportModal — 4-step CSV contact import flow

   Step 1: Download Template — pre-filled with the Riko party master,
           one row per existing contact + a blank row for parties that
           have no contact yet (long-format CSV, HubSpot/Pipedrive
           convention so it scales to N contacts per party).
   Step 2: Fill & Upload — drag-drop CSV
   Step 3: Match Preview — 5 statuses:
             matched · new-contact · will-update · name-mismatch · skipped
   Step 4: Confirm — bulk upsert toast

   Pure UX demo; no real CSV parse or backend call. The match preview
   uses BULK_IMPORT_SAMPLE rows from data.ts.
   ═══════════════════════════════════════════════════════════════ */

import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  Download,
  Upload as UploadIcon,
  CheckCircle2,
  AlertTriangle,
  X,
  FileSpreadsheet,
  ChevronRight,
  Loader2,
  UserPlus,
  Star,
  BellOff,
} from "lucide-react";
import {
  BULK_IMPORT_SAMPLE,
  CONTACT_ROLE_COLORS,
  CONTACT_ROLE_LABELS,
  computeBulkImportTemplateStats,
  type BulkImportRow,
} from "@/lib/data";

type Stage = "template" | "upload" | "preview" | "done";

export function BulkImportModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [stage, setStage] = useState<Stage>("template");
  const [fileName, setFileName] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    // Reset when closed so next open starts clean.
    if (!open) {
      const t = window.setTimeout(() => {
        setStage("template");
        setFileName(null);
      }, 240);
      return () => window.clearTimeout(t);
    }
  }, [open]);

  const handlePickFile = (f: File) => {
    setFileName(f.name || "contacts.csv");
    setStage("preview");
  };

  const handleDownloadTemplate = () => {
    // Demo: move forward so the user can complete the flow without a
    // real download. In production this pulls a pre-filled CSV.
    setStage("upload");
  };

  const matched      = BULK_IMPORT_SAMPLE.filter((r) => r.status === "matched").length;
  const newContact   = BULK_IMPORT_SAMPLE.filter((r) => r.status === "new-contact").length;
  const willUpdate   = BULK_IMPORT_SAMPLE.filter((r) => r.status === "will-update").length;
  const nameMismatch = BULK_IMPORT_SAMPLE.filter((r) => r.status === "name-mismatch").length;
  const skipped      = BULK_IMPORT_SAMPLE.filter((r) => r.status === "skipped").length;
  // Rows that result in a write to the contact master.
  const importable   = matched + newContact + willUpdate;

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="fixed inset-0 z-[70]"
            style={{ background: "rgba(0,0,0,0.55)", backdropFilter: "blur(2px)" }}
            onClick={onClose}
          />

          <motion.div
            initial={{ opacity: 0, y: 24, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 16, scale: 0.98 }}
            transition={{ duration: 0.18, ease: "easeOut" }}
            className="fixed inset-0 z-[80] flex items-center justify-center p-4 pointer-events-none"
          >
            <div
              className="w-full max-w-2xl rounded-lg overflow-hidden pointer-events-auto"
              style={{
                background: "var(--bg-surface)",
                border: "1px solid var(--border)",
                boxShadow: "0 24px 60px rgba(0,0,0,0.5)",
              }}
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header */}
              <div
                className="flex items-center justify-between px-5 py-3"
                style={{ borderBottom: "1px solid var(--border)" }}
              >
                <div>
                  <h3 className="text-sm font-bold" style={{ color: "var(--text-1)" }}>
                    Import contacts
                  </h3>
                  <p className="text-[10px]" style={{ color: "var(--text-4)" }}>
                    CSV upload · matches against Riko party master · multi-contact
                  </p>
                </div>
                <button
                  onClick={onClose}
                  className="p-1.5 rounded-md cursor-pointer"
                  style={{ color: "var(--text-3)" }}
                  aria-label="Close"
                >
                  <X size={16} />
                </button>
              </div>

              {/* Step indicator */}
              <div className="flex items-center gap-2 px-5 py-3" style={{ borderBottom: "1px solid var(--border)" }}>
                <StepDot label="Template" active={stage === "template"} done={["upload", "preview", "done"].includes(stage)} />
                <div className="flex-1 h-px" style={{ background: "var(--border)" }} />
                <StepDot label="Upload" active={stage === "upload"} done={["preview", "done"].includes(stage)} />
                <div className="flex-1 h-px" style={{ background: "var(--border)" }} />
                <StepDot label="Preview" active={stage === "preview"} done={stage === "done"} />
                <div className="flex-1 h-px" style={{ background: "var(--border)" }} />
                <StepDot label="Confirm" active={stage === "done"} done={false} />
              </div>

              {/* Body */}
              <div className="p-5" style={{ minHeight: 380 }}>
                {stage === "template" && <StepTemplate onContinue={handleDownloadTemplate} />}
                {stage === "upload" && (
                  <StepUpload
                    dragOver={dragOver}
                    setDragOver={setDragOver}
                    onPickFile={handlePickFile}
                    onBack={() => setStage("template")}
                    inputRef={inputRef}
                  />
                )}
                {stage === "preview" && (
                  <StepPreview
                    fileName={fileName ?? "contacts.csv"}
                    matched={matched}
                    newContact={newContact}
                    willUpdate={willUpdate}
                    nameMismatch={nameMismatch}
                    skipped={skipped}
                    importable={importable}
                    rows={BULK_IMPORT_SAMPLE}
                    onConfirm={() => setStage("done")}
                    onBack={() => setStage("upload")}
                  />
                )}
                {stage === "done" && (
                  <StepDone
                    importable={importable}
                    newContact={newContact}
                    willUpdate={willUpdate}
                    onClose={onClose}
                  />
                )}
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

function StepDot({ label, active, done }: { label: string; active: boolean; done: boolean }) {
  return (
    <div className="flex items-center gap-1.5">
      <div
        className="w-5 h-5 rounded-full flex items-center justify-center text-[9px] font-bold"
        style={{
          background: done
            ? "var(--green)"
            : active
            ? "var(--bg-hover)"
            : "var(--bg-hover)",
          color: done ? "#fff" : active ? "var(--green)" : "var(--text-4)",
          border: active ? "1px solid var(--green)" : "1px solid var(--border)",
        }}
      >
        {done ? "✓" : ""}
      </div>
      <span
        className="text-[10px] font-semibold hidden sm:inline"
        style={{ color: active ? "var(--text-1)" : "var(--text-4)" }}
      >
        {label}
      </span>
    </div>
  );
}

function StepTemplate({ onContinue }: { onContinue: () => void }) {
  const stats = computeBulkImportTemplateStats();
  return (
    <div className="flex flex-col gap-4">
      <div>
        <p className="text-sm font-semibold" style={{ color: "var(--text-1)" }}>
          Step 1 · Download the pre-filled template
        </p>
        <p className="text-[11px] mt-1" style={{ color: "var(--text-3)" }}>
          We&apos;ll generate a CSV with your <strong>{stats.totalParties} Riko parties</strong>.
          Existing contacts pre-fill — one row per contact — and parties without
          contact info get a blank row to fill in. Add more rows for the same
          party to capture <em>multiple</em> contacts per party (owner, accounts,
          finance, etc.).
        </p>
      </div>

      <div
        className="rounded-md p-4 flex items-start gap-3"
        style={{
          background: "color-mix(in srgb, var(--blue) 8%, transparent)",
          border: "1px solid color-mix(in srgb, var(--blue) 20%, transparent)",
        }}
      >
        <FileSpreadsheet size={18} style={{ color: "var(--blue)", flexShrink: 0, marginTop: 2 }} />
        <div className="min-w-0 flex-1">
          <p className="text-xs font-semibold" style={{ color: "var(--text-1)" }}>
            riko-contacts-template.csv
          </p>
          <p className="text-[10px] mt-0.5" style={{ color: "var(--text-3)" }}>
            ~{stats.totalRows} rows · 8 columns
          </p>
          <p className="text-[10px] mt-2" style={{ color: "var(--text-4)", fontFamily: "monospace" }}>
            party_name · contact_name · phone · email · designation · role · is_primary · receives_reminders
          </p>
          <p className="text-[10px] mt-2 leading-relaxed" style={{ color: "var(--text-3)" }}>
            <strong>{stats.totalContacts}</strong> existing contacts pre-fill across{" "}
            <strong>{stats.partiesWithContact}</strong> parties · <strong>{stats.blankRows}</strong> parties
            still need their first contact.
          </p>
        </div>
      </div>

      <div
        className="rounded-md p-3 text-[10px] leading-relaxed"
        style={{ background: "var(--bg-primary)", border: "1px solid var(--border)", color: "var(--text-3)" }}
      >
        <strong style={{ color: "var(--text-2)" }}>Format tips</strong>
        <ul className="mt-1 ml-3 list-disc">
          <li><span style={{ fontFamily: "monospace" }}>party_name</span> is locked — must match Riko exactly. Don&apos;t edit column A.</li>
          <li><span style={{ fontFamily: "monospace" }}>role</span> ∈ owner / accounting / finance / purchase / operations / sales / other</li>
          <li><span style={{ fontFamily: "monospace" }}>is_primary</span> = TRUE for the one default contact per party</li>
          <li><span style={{ fontFamily: "monospace" }}>receives_reminders</span> = TRUE if this contact should get auto-reminders</li>
        </ul>
      </div>

      <div className="flex justify-end gap-2 mt-1">
        <button
          onClick={onContinue}
          className="flex items-center gap-2 text-[12px] font-semibold px-4 py-2 rounded-lg cursor-pointer"
          style={{ background: "var(--green)", color: "#fff" }}
        >
          <Download size={14} /> Download &amp; continue
        </button>
      </div>
    </div>
  );
}

function StepUpload({
  dragOver,
  setDragOver,
  onPickFile,
  onBack,
  inputRef,
}: {
  dragOver: boolean;
  setDragOver: (v: boolean) => void;
  onPickFile: (f: File) => void;
  onBack: () => void;
  inputRef: React.RefObject<HTMLInputElement | null>;
}) {
  return (
    <div className="flex flex-col gap-4">
      <div>
        <p className="text-sm font-semibold" style={{ color: "var(--text-1)" }}>
          Step 2 · Upload your filled CSV
        </p>
        <p className="text-[11px] mt-1" style={{ color: "var(--text-3)" }}>
          Drag the file here or click to browse. CSV, XLS, or XLSX accepted.
        </p>
      </div>

      <div
        onDragOver={(e) => {
          e.preventDefault();
          setDragOver(true);
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragOver(false);
          const f = e.dataTransfer.files?.[0];
          if (f) onPickFile(f);
        }}
        onClick={() => inputRef.current?.click()}
        className="rounded-md py-10 flex flex-col items-center justify-center cursor-pointer transition-colors"
        style={{
          background: dragOver ? "color-mix(in srgb, var(--green) 8%, transparent)" : "var(--bg-primary)",
          border: `2px dashed ${dragOver ? "var(--green)" : "var(--border)"}`,
        }}
      >
        <UploadIcon size={28} style={{ color: dragOver ? "var(--green)" : "var(--text-4)", marginBottom: 8 }} />
        <p className="text-[13px] font-semibold" style={{ color: "var(--text-1)" }}>
          {dragOver ? "Release to upload" : "Drop CSV here"}
        </p>
        <p className="text-[10px] mt-0.5" style={{ color: "var(--text-4)" }}>
          or click to browse · .csv / .xls / .xlsx
        </p>
        <input
          ref={inputRef}
          type="file"
          accept=".csv,.xls,.xlsx"
          className="hidden"
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) onPickFile(f);
            e.target.value = "";
          }}
        />
      </div>

      <div className="flex justify-between gap-2 mt-2">
        <button
          onClick={onBack}
          className="text-[12px] font-semibold px-4 py-2 rounded-lg cursor-pointer"
          style={{ color: "var(--text-3)", background: "var(--bg-hover)" }}
        >
          Back
        </button>
        <button
          onClick={() => onPickFile(new File([""], "riko-contacts-sample.csv"))}
          className="text-[11px] font-medium px-3 py-2 rounded-lg cursor-pointer"
          style={{ color: "var(--text-3)", background: "transparent", border: "1px solid var(--border)" }}
          title="Preview with sample data"
        >
          Try with sample data
        </button>
      </div>
    </div>
  );
}

function StepPreview({
  fileName,
  matched,
  newContact,
  willUpdate,
  nameMismatch,
  skipped,
  importable,
  rows,
  onConfirm,
  onBack,
}: {
  fileName: string;
  matched: number;
  newContact: number;
  willUpdate: number;
  nameMismatch: number;
  skipped: number;
  importable: number;
  rows: BulkImportRow[];
  onConfirm: () => void;
  onBack: () => void;
}) {
  const [pending, setPending] = useState(false);
  const handleConfirm = () => {
    setPending(true);
    window.setTimeout(() => {
      setPending(false);
      onConfirm();
    }, 900);
  };

  // Count distinct parties touched (helps the Import button copy honest).
  const partiesTouched = new Set(
    rows.filter((r) => r.status !== "skipped" && r.status !== "name-mismatch").map((r) => r.partyName),
  ).size;

  return (
    <div className="flex flex-col gap-3">
      <div>
        <p className="text-sm font-semibold" style={{ color: "var(--text-1)" }}>
          Step 3 · Review match preview
        </p>
        <p className="text-[11px] mt-0.5" style={{ color: "var(--text-3)" }}>
          <strong>{fileName}</strong> · {rows.length} rows parsed · {partiesTouched} parties touched
        </p>
      </div>

      {/* Summary chips — 5 statuses */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
        <SummaryChip label="Matched"     count={matched}      color="var(--green)" />
        <SummaryChip label="New contact" count={newContact}   color="var(--blue)" />
        <SummaryChip label="Will update" count={willUpdate}   color="var(--purple)" />
        <SummaryChip label="Mismatch"    count={nameMismatch} color="var(--yellow)" />
        <SummaryChip label="Skipped"     count={skipped}      color="var(--red)" />
      </div>

      {/* Row preview */}
      <div
        className="rounded-lg overflow-hidden max-h-[260px] overflow-y-auto"
        style={{ border: "1px solid var(--border)", background: "var(--bg-primary)" }}
      >
        {rows.map((r, i) => (
          <PreviewRow key={i} row={r} isFirst={i === 0} />
        ))}
      </div>

      <div className="flex flex-col-reverse sm:flex-row sm:justify-between gap-2 mt-1">
        <button
          onClick={onBack}
          disabled={pending}
          className="text-[12px] font-semibold px-4 py-2 rounded-lg cursor-pointer"
          style={{ color: "var(--text-3)", background: "var(--bg-hover)" }}
        >
          Back
        </button>
        <button
          onClick={handleConfirm}
          disabled={pending || importable === 0}
          className="flex items-center justify-center gap-2 text-[12px] font-semibold px-4 py-2 rounded-lg cursor-pointer disabled:opacity-50"
          style={{ background: "var(--green)", color: "#fff" }}
        >
          {pending ? (
            <>
              <Loader2 size={14} className="animate-spin" /> Importing…
            </>
          ) : (
            <>
              Import {importable} {importable === 1 ? "row" : "rows"} <ChevronRight size={14} />
            </>
          )}
        </button>
      </div>
    </div>
  );
}

function PreviewRow({ row, isFirst }: { row: BulkImportRow; isFirst: boolean }) {
  const noteColor =
    row.status === "matched"        ? "var(--green)"  :
    row.status === "new-contact"    ? "var(--blue)"   :
    row.status === "will-update"    ? "var(--purple)" :
    row.status === "name-mismatch"  ? "var(--yellow)" :
                                      "var(--red)";

  const hasContact = !!(row.contactName || row.phone || row.email);

  return (
    <div
      className="flex items-start gap-2 px-3 py-2.5"
      style={{ borderTop: isFirst ? "none" : "1px solid var(--border)" }}
    >
      <StatusIcon status={row.status} />
      <div className="flex-1 min-w-0">
        {/* Line 1 — party + role pill + primary star */}
        <div className="flex items-center gap-1.5 flex-wrap">
          <p className="text-[11px] font-semibold truncate" style={{ color: "var(--text-1)" }}>
            {row.partyName}
          </p>
          {row.role && (
            <span
              className="text-[9px] font-semibold px-1.5 py-px rounded"
              style={{
                background: `color-mix(in srgb, ${CONTACT_ROLE_COLORS[row.role]} 14%, transparent)`,
                color: CONTACT_ROLE_COLORS[row.role],
                border: `1px solid color-mix(in srgb, ${CONTACT_ROLE_COLORS[row.role]} 30%, transparent)`,
              }}
            >
              {CONTACT_ROLE_LABELS[row.role]}
            </span>
          )}
          {row.isPrimary && (
            <span title="Primary contact">
              <Star size={10} style={{ color: "var(--yellow)", fill: "var(--yellow)" }} />
            </span>
          )}
          {row.receivesReminders === false && hasContact && (
            <span title="Excluded from auto-reminders">
              <BellOff size={10} style={{ color: "var(--text-4)" }} />
            </span>
          )}
        </div>

        {/* Line 2 — contact + designation */}
        {hasContact ? (
          <p className="text-[10px] mt-0.5" style={{ color: "var(--text-2)" }}>
            <strong>{row.contactName || "—"}</strong>
            {row.designation && (
              <span style={{ color: "var(--text-4)" }}> · {row.designation}</span>
            )}
          </p>
        ) : (
          <p className="text-[10px] mt-0.5 italic" style={{ color: "var(--text-4)" }}>
            no contact details
          </p>
        )}

        {/* Line 3 — phone + email */}
        {hasContact && (row.phone || row.email) && (
          <p className="text-[10px] mt-0.5 truncate" style={{ color: "var(--text-3)" }}>
            {[row.phone, row.email].filter(Boolean).join(" · ")}
          </p>
        )}

        {/* Line 4 — note */}
        {row.note && (
          <p className="text-[10px] mt-1" style={{ color: noteColor }}>
            {row.note}
          </p>
        )}
      </div>
    </div>
  );
}

function StepDone({
  importable,
  newContact,
  willUpdate,
  onClose,
}: {
  importable: number;
  newContact: number;
  willUpdate: number;
  onClose: () => void;
}) {
  // Build a punchy summary line.
  const writeBits: string[] = [];
  if (newContact > 0) writeBits.push(`${newContact} new`);
  if (willUpdate > 0) writeBits.push(`${willUpdate} updated`);
  const summary = writeBits.length ? ` (${writeBits.join(" · ")})` : "";

  return (
    <div className="flex flex-col items-center text-center py-8 gap-3">
      <div
        className="w-14 h-14 rounded-full flex items-center justify-center"
        style={{ background: "color-mix(in srgb, var(--green) 18%, transparent)" }}
      >
        <CheckCircle2 size={28} style={{ color: "var(--green)" }} />
      </div>
      <p className="text-base font-bold" style={{ color: "var(--text-1)" }}>
        {importable} contact{importable === 1 ? "" : "s"} imported
        <span className="text-[12px] font-medium" style={{ color: "var(--text-4)" }}>
          {summary}
        </span>
      </p>
      <p className="text-[12px] max-w-sm" style={{ color: "var(--text-3)" }}>
        Saved to your Riko party master. Reminders can now go to the right
        person — Owner / Accounts / Finance — based on each contact&apos;s role.
      </p>
      <button
        onClick={onClose}
        className="text-[12px] font-semibold px-5 py-2 rounded-lg cursor-pointer mt-2"
        style={{ background: "var(--green)", color: "#fff" }}
      >
        Done
      </button>
    </div>
  );
}

function SummaryChip({ label, count, color }: { label: string; count: number; color: string }) {
  return (
    <div
      className="rounded-lg p-2 text-center"
      style={{ background: `color-mix(in srgb, ${color} 10%, transparent)` }}
    >
      <p className="text-[9px] uppercase tracking-wider font-semibold leading-tight" style={{ color }}>
        {label}
      </p>
      <p
        className="text-lg font-bold tabular-nums"
        style={{ color, fontFamily: "'Space Grotesk', sans-serif" }}
      >
        {count}
      </p>
    </div>
  );
}

function StatusIcon({ status }: { status: BulkImportRow["status"] }) {
  if (status === "matched") {
    return <CheckCircle2 size={14} style={{ color: "var(--green)", flexShrink: 0, marginTop: 1 }} />;
  }
  if (status === "new-contact") {
    return <UserPlus size={14} style={{ color: "var(--blue)", flexShrink: 0, marginTop: 1 }} />;
  }
  if (status === "will-update") {
    return <CheckCircle2 size={14} style={{ color: "var(--purple)", flexShrink: 0, marginTop: 1 }} />;
  }
  if (status === "name-mismatch") {
    return <AlertTriangle size={14} style={{ color: "var(--yellow)", flexShrink: 0, marginTop: 1 }} />;
  }
  return <X size={14} style={{ color: "var(--red)", flexShrink: 0, marginTop: 1 }} />;
}
