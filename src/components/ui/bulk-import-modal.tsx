"use client";

/* ═══════════════════════════════════════════════════════════════
   BulkImportModal — 4-step CSV contact import flow

   Step 1: Download Template — pre-filled with the Riko party master
   Step 2: Fill & Upload — drag-drop CSV
   Step 3: Match Preview — show matched / will-update / mismatches / skipped
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
} from "lucide-react";
import { BULK_IMPORT_SAMPLE, type BulkImportRow } from "@/lib/data";

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

  const matched = BULK_IMPORT_SAMPLE.filter((r) => r.status === "matched").length;
  const willUpdate = BULK_IMPORT_SAMPLE.filter((r) => r.status === "will-update").length;
  const nameMismatch = BULK_IMPORT_SAMPLE.filter((r) => r.status === "name-mismatch").length;
  const skipped = BULK_IMPORT_SAMPLE.filter((r) => r.status === "skipped").length;

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
              className="w-full max-w-xl rounded-lg overflow-hidden pointer-events-auto"
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
                    CSV upload · matches against Riko party master
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
              <div className="p-5" style={{ minHeight: 360 }}>
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
                    willUpdate={willUpdate}
                    nameMismatch={nameMismatch}
                    skipped={skipped}
                    rows={BULK_IMPORT_SAMPLE}
                    onConfirm={() => setStage("done")}
                    onBack={() => setStage("upload")}
                  />
                )}
                {stage === "done" && (
                  <StepDone
                    matched={matched}
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
  return (
    <div className="flex flex-col gap-4">
      <div>
        <p className="text-sm font-semibold" style={{ color: "var(--text-1)" }}>
          Step 1 · Download the pre-filled template
        </p>
        <p className="text-[11px] mt-1" style={{ color: "var(--text-3)" }}>
          We&apos;ll generate a CSV with your <strong>16 Riko party names</strong> in column A
          (locked). Fill Mobile, Email, and Contact Person — parties with existing
          contacts are pre-populated so you only edit what&apos;s new.
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
        <div>
          <p className="text-xs font-semibold" style={{ color: "var(--text-1)" }}>
            riko-contacts-template.csv
          </p>
          <p className="text-[10px] mt-0.5" style={{ color: "var(--text-3)" }}>
            16 rows · 4 columns (Party Name · Mobile · Email · Contact Person)
          </p>
        </div>
      </div>

      <div className="flex justify-end gap-2 mt-2">
        <button
          onClick={onContinue}
          className="flex items-center gap-2 text-[12px] font-semibold px-4 py-2 rounded-lg cursor-pointer"
          style={{ background: "var(--green)", color: "#fff" }}
        >
          <Download size={14} /> Download & continue
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
  willUpdate,
  nameMismatch,
  skipped,
  rows,
  onConfirm,
  onBack,
}: {
  fileName: string;
  matched: number;
  willUpdate: number;
  nameMismatch: number;
  skipped: number;
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

  return (
    <div className="flex flex-col gap-3">
      <div>
        <p className="text-sm font-semibold" style={{ color: "var(--text-1)" }}>
          Step 3 · Review match preview
        </p>
        <p className="text-[11px] mt-0.5" style={{ color: "var(--text-3)" }}>
          <strong>{fileName}</strong> · {rows.length} rows parsed
        </p>
      </div>

      {/* Summary chips */}
      <div className="grid grid-cols-4 gap-2">
        <SummaryChip label="Matched" count={matched} color="var(--green)" />
        <SummaryChip label="Will update" count={willUpdate} color="var(--blue)" />
        <SummaryChip label="Mismatch" count={nameMismatch} color="var(--yellow)" />
        <SummaryChip label="Skipped" count={skipped} color="var(--red)" />
      </div>

      {/* Row preview (compact, 6 rows visible) */}
      <div
        className="rounded-lg overflow-hidden max-h-[230px] overflow-y-auto"
        style={{ border: "1px solid var(--border)", background: "var(--bg-primary)" }}
      >
        {rows.map((r, i) => (
          <div
            key={i}
            className="flex items-start gap-2 px-3 py-2"
            style={{ borderTop: i > 0 ? "1px solid var(--border)" : "none" }}
          >
            <StatusIcon status={r.status} />
            <div className="flex-1 min-w-0">
              <p className="text-[11px] font-semibold truncate" style={{ color: "var(--text-1)" }}>
                {r.partyName}
              </p>
              <p className="text-[10px] truncate" style={{ color: "var(--text-4)" }}>
                {[r.newPhone, r.newEmail, r.newContactPerson].filter(Boolean).join(" · ") || "—"}
              </p>
              {r.note && (
                <p
                  className="text-[10px] mt-0.5"
                  style={{
                    color:
                      r.status === "matched"
                        ? "var(--green)"
                        : r.status === "will-update"
                        ? "var(--blue)"
                        : r.status === "name-mismatch"
                        ? "var(--yellow)"
                        : "var(--red)",
                  }}
                >
                  {r.note}
                </p>
              )}
            </div>
          </div>
        ))}
      </div>

      <div className="flex justify-between gap-2 mt-1">
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
          disabled={pending}
          className="flex items-center gap-2 text-[12px] font-semibold px-4 py-2 rounded-lg cursor-pointer disabled:opacity-50"
          style={{ background: "var(--green)", color: "#fff" }}
        >
          {pending ? (
            <>
              <Loader2 size={14} className="animate-spin" /> Importing…
            </>
          ) : (
            <>
              Import {matched + willUpdate} parties <ChevronRight size={14} />
            </>
          )}
        </button>
      </div>
    </div>
  );
}

function StepDone({
  matched,
  willUpdate,
  onClose,
}: {
  matched: number;
  willUpdate: number;
  onClose: () => void;
}) {
  return (
    <div className="flex flex-col items-center text-center py-8 gap-3">
      <div
        className="w-14 h-14 rounded-full flex items-center justify-center"
        style={{ background: "color-mix(in srgb, var(--green) 18%, transparent)" }}
      >
        <CheckCircle2 size={28} style={{ color: "var(--green)" }} />
      </div>
      <p className="text-base font-bold" style={{ color: "var(--text-1)" }}>
        {matched + willUpdate} parties updated
      </p>
      <p className="text-[12px] max-w-sm" style={{ color: "var(--text-3)" }}>
        Contact info saved to your Riko party master. Reminders can now be
        enabled for parties that have phone or email.
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
      <p className="text-[9px] uppercase tracking-wider font-semibold" style={{ color }}>
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
  if (status === "will-update") {
    return <CheckCircle2 size={14} style={{ color: "var(--blue)", flexShrink: 0, marginTop: 1 }} />;
  }
  if (status === "name-mismatch") {
    return <AlertTriangle size={14} style={{ color: "var(--yellow)", flexShrink: 0, marginTop: 1 }} />;
  }
  return <X size={14} style={{ color: "var(--red)", flexShrink: 0, marginTop: 1 }} />;
}
