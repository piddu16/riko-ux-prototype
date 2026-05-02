"use client";

/* ═══════════════════════════════════════════════════════════════
   PhysicalStockModal — 4-step physical count → Stock Journal flow

   Step 1: Template — download pre-filled CSV with Tally SKUs + book qty
   Step 2: Upload — drag-drop the filled count sheet
   Step 3: Variance preview — per-SKU book vs physical, with reason dropdown
   Step 4: Confirm — generates Stock Journal drafts:
     • Variance >5% (major) → one Stock Journal per SKU (→ Accounts Head)
     • Variance ≤5% (minor) → one bulk Stock Journal with line items (→ Accounts)

   All pure UX demo — drafts appended to ENTRIES mock, Entries screen
   picks them up, RBAC + approval flow unchanged.
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
  ArrowRight,
} from "lucide-react";
import {
  PHYSICAL_COUNT_SAMPLE,
  countPhysicalStatuses,
  GODOWNS,
  type PhysicalCountRow,
} from "@/lib/data";

type Stage = "template" | "upload" | "preview" | "done";

interface PhysicalStockModalProps {
  open: boolean;
  onClose: () => void;
  /** Godown id pre-selected from the parent screen's active tab. */
  godownId: string;
  /** Called after Step 4 confirm — parent navigates to Entries. */
  onConfirm?: (summary: { majorCount: number; bulkCount: number }) => void;
}

const REASON_OPTIONS = [
  "Damaged",
  "Pilferage",
  "Count error",
  "Expiry",
  "Inter-godown transit",
  "Other",
] as const;

export function PhysicalStockModal({ open, onClose, godownId, onConfirm }: PhysicalStockModalProps) {
  const [stage, setStage] = useState<Stage>("template");
  const [fileName, setFileName] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  // Reason overrides per row — user can change any dropdown in Step 3
  const [reasonOverrides, setReasonOverrides] = useState<Record<string, string>>({});

  useEffect(() => {
    if (!open) {
      const t = window.setTimeout(() => {
        setStage("template");
        setFileName(null);
        setReasonOverrides({});
      }, 240);
      return () => window.clearTimeout(t);
    }
  }, [open]);

  const handlePickFile = (f: File) => {
    setFileName(f.name || PHYSICAL_COUNT_SAMPLE.fileName);
    setStage("preview");
  };

  const handleDownloadTemplate = () => {
    setStage("upload");
  };

  const stats = countPhysicalStatuses();
  const godown = GODOWNS.find((g) => g.id === godownId) ?? GODOWNS[0];

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
              className="w-full max-w-3xl rounded-lg overflow-hidden pointer-events-auto flex flex-col"
              style={{
                background: "var(--bg-surface)",
                border: "1px solid var(--border)",
                boxShadow: "0 24px 60px rgba(0,0,0,0.5)",
                maxHeight: "90vh",
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
                    Reconcile physical stock
                  </h3>
                  <p className="text-[10px]" style={{ color: "var(--text-4)" }}>
                    {godown.name} · {godown.city} · produces Stock Journal drafts for approval
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
              <div
                className="flex items-center gap-2 px-5 py-3"
                style={{ borderBottom: "1px solid var(--border)" }}
              >
                <StepDot label="Template" active={stage === "template"} done={["upload", "preview", "done"].includes(stage)} />
                <div className="flex-1 h-px" style={{ background: "var(--border)" }} />
                <StepDot label="Upload"   active={stage === "upload"}   done={["preview", "done"].includes(stage)} />
                <div className="flex-1 h-px" style={{ background: "var(--border)" }} />
                <StepDot label="Variance" active={stage === "preview"}  done={stage === "done"} />
                <div className="flex-1 h-px" style={{ background: "var(--border)" }} />
                <StepDot label="Confirm"  active={stage === "done"}     done={false} />
              </div>

              {/* Body */}
              <div className="p-5 overflow-y-auto" style={{ minHeight: 380 }}>
                {stage === "template" && <StepTemplate godownName={godown.name} onContinue={handleDownloadTemplate} />}
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
                    fileName={fileName ?? PHYSICAL_COUNT_SAMPLE.fileName}
                    godownName={godown.name}
                    stats={stats}
                    rows={PHYSICAL_COUNT_SAMPLE.rows}
                    reasonOverrides={reasonOverrides}
                    setReasonOverrides={setReasonOverrides}
                    onConfirm={() => setStage("done")}
                    onBack={() => setStage("upload")}
                  />
                )}
                {stage === "done" && (
                  <StepDone
                    stats={stats}
                    onClose={() => {
                      onConfirm?.({ majorCount: stats.major, bulkCount: stats.minor > 0 ? 1 : 0 });
                      onClose();
                    }}
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

/* ══════════════════════════════════════════════════════════════════
   Step indicator dot
   ══════════════════════════════════════════════════════════════════ */
function StepDot({ label, active, done }: { label: string; active: boolean; done: boolean }) {
  return (
    <div className="flex items-center gap-1.5">
      <div
        className="w-5 h-5 rounded-full flex items-center justify-center text-[9px] font-bold"
        style={{
          background: done
            ? "var(--green)"
            : active
            ? "color-mix(in srgb, var(--green) 15%, transparent)"
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

/* ══════════════════════════════════════════════════════════════════
   Step 1 — Template
   ══════════════════════════════════════════════════════════════════ */
function StepTemplate({
  godownName,
  onContinue,
}: {
  godownName: string;
  onContinue: () => void;
}) {
  return (
    <div className="flex flex-col gap-4">
      <div>
        <p className="text-sm font-semibold" style={{ color: "var(--text-1)" }}>
          Step 1 · Download the pre-filled count sheet
        </p>
        <p className="text-[11px] mt-1" style={{ color: "var(--text-3)" }}>
          We&apos;ll generate a CSV with all SKUs currently in <strong>{godownName}</strong>, with{" "}
          <em>book_qty</em> pre-filled from Tally. Your team fills <em>physical_qty</em> + <em>notes</em> during
          the count, then uploads it back for variance matching.
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
        <div className="flex-1 min-w-0">
          <p className="text-xs font-semibold" style={{ color: "var(--text-1)" }}>
            physical-count-{godownName.toLowerCase().replace(/\s+/g, "-")}-apr-2026.csv
          </p>
          <p className="text-[10px] mt-0.5" style={{ color: "var(--text-3)" }}>
            8 columns: sku · sku_name · godown · book_qty · physical_qty · uom · counted_by · notes
          </p>
        </div>
      </div>

      <div
        className="rounded-lg p-3 text-[11px]"
        style={{
          background: "color-mix(in srgb, var(--yellow) 8%, transparent)",
          color: "var(--text-2)",
          border: "1px solid color-mix(in srgb, var(--yellow) 20%, transparent)",
        }}
      >
        <strong>Tip:</strong> Count method matters. Set a cutoff time, freeze inbound receipts during the
        count, and tag in-transit stock with the &ldquo;Inter-godown transit&rdquo; reason so we don&apos;t double-adjust.
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

/* ══════════════════════════════════════════════════════════════════
   Step 2 — Upload
   ══════════════════════════════════════════════════════════════════ */
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
          Step 2 · Upload your filled count sheet
        </p>
        <p className="text-[11px] mt-1" style={{ color: "var(--text-3)" }}>
          CSV / Excel accepted. We&apos;ll match every row against Tally&apos;s book qty.
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
          {dragOver ? "Release to upload" : "Drop count sheet here"}
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
          onClick={() => onPickFile(new File([""], PHYSICAL_COUNT_SAMPLE.fileName))}
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

/* ══════════════════════════════════════════════════════════════════
   Step 3 — Variance preview (the heart of the flow)
   ══════════════════════════════════════════════════════════════════ */
function StepPreview({
  fileName,
  godownName,
  stats,
  rows,
  reasonOverrides,
  setReasonOverrides,
  onConfirm,
  onBack,
}: {
  fileName: string;
  godownName: string;
  stats: ReturnType<typeof countPhysicalStatuses>;
  rows: PhysicalCountRow[];
  reasonOverrides: Record<string, string>;
  setReasonOverrides: (v: Record<string, string>) => void;
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
          Step 3 · Review variances
        </p>
        <p className="text-[11px] mt-0.5" style={{ color: "var(--text-3)" }}>
          <strong>{fileName}</strong> · {godownName} · {rows.length} rows parsed
        </p>
      </div>

      {/* Summary chips (4 buckets) */}
      <div className="grid grid-cols-4 gap-2">
        <SummaryChip label="Matched"     count={stats.matched} color="var(--green)"  hint="±2% tolerance" />
        <SummaryChip label="Minor"       count={stats.minor}   color="var(--yellow)" hint="2–5% · bulk routing" />
        <SummaryChip label="Major"       count={stats.major}   color="var(--red)"    hint=">5% · per-SKU Stock Journal" />
        <SummaryChip label="New SKU"     count={stats.newSku}  color="var(--blue)"   hint="Create master first" />
      </div>

      {/* Row preview table */}
      <div
        className="rounded-lg overflow-hidden max-h-[320px] overflow-y-auto"
        style={{ border: "1px solid var(--border)", background: "var(--bg-primary)" }}
      >
        <table className="w-full text-[11px]">
          <thead style={{ background: "var(--bg-secondary)", position: "sticky", top: 0, zIndex: 1 }}>
            <tr style={{ borderBottom: "1px solid var(--border)" }}>
              <th className="px-3 py-2 text-left font-semibold uppercase tracking-wider" style={{ color: "var(--text-4)" }}>SKU</th>
              <th className="px-2 py-2 text-right font-semibold uppercase tracking-wider" style={{ color: "var(--text-4)" }}>Book</th>
              <th className="px-2 py-2 text-right font-semibold uppercase tracking-wider" style={{ color: "var(--text-4)" }}>Physical</th>
              <th className="px-2 py-2 text-center font-semibold uppercase tracking-wider" style={{ color: "var(--text-4)" }}>Variance</th>
              <th className="px-2 py-2 text-right font-semibold uppercase tracking-wider" style={{ color: "var(--text-4)" }}>Adj. ₹</th>
              <th className="px-2 py-2 text-left font-semibold uppercase tracking-wider" style={{ color: "var(--text-4)" }}>Reason</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r, i) => {
              const variancePct = r.bookQty === 0 ? 1 : (r.physicalQty - r.bookQty) / r.bookQty;
              const varianceQty = r.physicalQty - r.bookQty;
              const chipColor =
                r.status === "matched" ? "var(--green)" :
                r.status === "minor"   ? "var(--yellow)" :
                r.status === "major"   ? "var(--red)" :
                r.status === "new-sku" ? "var(--blue)" :
                                         "var(--text-3)";
              const reason = reasonOverrides[r.sku] ?? r.reason;
              const isEditable = r.status === "minor" || r.status === "major";
              return (
                <tr
                  key={r.sku}
                  style={{
                    borderTop: i > 0 ? "1px solid var(--border)" : "none",
                    background: r.status === "new-sku" ? "color-mix(in srgb, var(--blue) 5%, transparent)" : "transparent",
                  }}
                >
                  <td className="px-3 py-2">
                    <p className="font-semibold truncate max-w-[180px]" style={{ color: "var(--text-1)" }}>
                      {r.skuName}
                    </p>
                    <p className="text-[9px] font-mono" style={{ color: "var(--text-4)" }}>
                      {r.sku}
                    </p>
                  </td>
                  <td className="px-2 py-2 text-right tabular-nums" style={{ color: "var(--text-2)", fontFamily: "'Space Grotesk', sans-serif" }}>
                    {r.bookQty.toLocaleString("en-IN")}
                  </td>
                  <td className="px-2 py-2 text-right tabular-nums" style={{ color: "var(--text-2)", fontFamily: "'Space Grotesk', sans-serif" }}>
                    {r.physicalQty.toLocaleString("en-IN")}
                  </td>
                  <td className="px-2 py-2 text-center">
                    {r.status === "new-sku" ? (
                      <span className="text-[9px] font-bold px-1.5 py-0.5 rounded" style={{ background: "color-mix(in srgb, var(--blue) 14%, transparent)", color: "var(--blue)" }}>
                        NEW
                      </span>
                    ) : (
                      <span
                        className="inline-flex flex-col items-center gap-0 tabular-nums font-bold"
                        style={{ color: chipColor, fontFamily: "'Space Grotesk', sans-serif" }}
                      >
                        <span className="text-[11px]">
                          {varianceQty > 0 ? "+" : ""}{varianceQty}
                        </span>
                        <span className="text-[9px] opacity-80">
                          {(variancePct * 100).toFixed(1)}%
                        </span>
                      </span>
                    )}
                  </td>
                  <td className="px-2 py-2 text-right tabular-nums" style={{ color: r.adjustmentValue < 0 ? "var(--red)" : r.adjustmentValue > 0 ? "var(--green)" : "var(--text-4)", fontFamily: "'Space Grotesk', sans-serif" }}>
                    {r.adjustmentValue === 0 ? "—" : (r.adjustmentValue > 0 ? "+" : "") + "₹" + Math.abs(r.adjustmentValue).toLocaleString("en-IN")}
                  </td>
                  <td className="px-2 py-2">
                    {isEditable ? (
                      <select
                        value={reason}
                        onChange={(e) => setReasonOverrides({ ...reasonOverrides, [r.sku]: e.target.value })}
                        className="text-[10px] font-semibold px-1.5 py-1 rounded-md cursor-pointer w-full"
                        style={{ background: "var(--bg-surface)", color: "var(--text-1)", border: "1px solid var(--border)" }}
                      >
                        {REASON_OPTIONS.map((o) => (
                          <option key={o} value={o}>{o}</option>
                        ))}
                      </select>
                    ) : (
                      <span className="text-[10px]" style={{ color: r.status === "new-sku" ? "var(--blue)" : "var(--text-4)" }}>
                        {reason}
                      </span>
                    )}
                    {r.note && (
                      <p className="text-[9px] mt-0.5" style={{ color: chipColor }} title={r.note}>
                        {r.note.length > 42 ? r.note.slice(0, 42) + "…" : r.note}
                      </p>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Routing plan footer */}
      <div
        className="rounded-lg p-3 flex items-start gap-2"
        style={{
          background: "color-mix(in srgb, var(--green) 6%, var(--bg-primary))",
          border: "1px solid color-mix(in srgb, var(--green) 25%, transparent)",
        }}
      >
        <ArrowRight size={14} style={{ color: "var(--green)", flexShrink: 0, marginTop: 2 }} />
        <div className="flex-1 min-w-0">
          <p className="text-[11px] font-semibold" style={{ color: "var(--text-1)" }}>
            Routing plan
          </p>
          <p className="text-[10.5px] mt-0.5" style={{ color: "var(--text-3)" }}>
            {stats.major > 0 && (
              <>
                <strong style={{ color: "var(--red)" }}>{stats.major} major variances</strong>{" "}
                (₹{(stats.majorNetAdjustment / 1e5).toFixed(1)}L) → one Stock Journal each, Accounts Head approval.{" "}
              </>
            )}
            {stats.minor > 0 && (
              <>
                <strong style={{ color: "var(--yellow)" }}>{stats.minor} minor variances</strong>{" "}
                (₹{(stats.minorNetAdjustment / 1e3).toFixed(0)}K) → rolled into <strong>1 bulk Stock Journal</strong>, Accounts approval.{" "}
              </>
            )}
            {stats.newSku > 0 && (
              <>
                <strong style={{ color: "var(--blue)" }}>{stats.newSku} new SKU</strong>{" "}
                → flagged for master creation via Entries queue.{" "}
              </>
            )}
            {stats.matched > 0 && (
              <>
                <strong style={{ color: "var(--green)" }}>{stats.matched} matched</strong>{" "}
                within tolerance — no journal needed.
              </>
            )}
          </p>
        </div>
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
              <Loader2 size={14} className="animate-spin" /> Drafting…
            </>
          ) : (
            <>
              Create {stats.major + (stats.minor > 0 ? 1 : 0)} Stock Journal{stats.major + (stats.minor > 0 ? 1 : 0) > 1 ? "s" : ""}
              <ChevronRight size={14} />
            </>
          )}
        </button>
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════════
   Step 4 — Done
   ══════════════════════════════════════════════════════════════════ */
function StepDone({
  stats,
  onClose,
}: {
  stats: ReturnType<typeof countPhysicalStatuses>;
  onClose: () => void;
}) {
  const totalDrafts = stats.major + (stats.minor > 0 ? 1 : 0);
  return (
    <div className="flex flex-col items-center text-center py-6 gap-3">
      <div
        className="w-14 h-14 rounded-full flex items-center justify-center"
        style={{ background: "color-mix(in srgb, var(--green) 18%, transparent)" }}
      >
        <CheckCircle2 size={28} style={{ color: "var(--green)" }} />
      </div>
      <p className="text-base font-bold" style={{ color: "var(--text-1)" }}>
        {totalDrafts} Stock Journal{totalDrafts !== 1 ? "s" : ""} drafted
      </p>
      <p className="text-[12px] max-w-md" style={{ color: "var(--text-3)" }}>
        {stats.major > 0 && (
          <>
            <strong style={{ color: "var(--red)" }}>{stats.major}</strong> routed to <strong>Accounts Head</strong>.{" "}
          </>
        )}
        {stats.minor > 0 && (
          <>
            <strong style={{ color: "var(--yellow)" }}>1 bulk journal</strong> (covering {stats.minor} minor variances)
            routed to <strong>Accounts</strong>.{" "}
          </>
        )}
        Open Entries to review + post.
      </p>
      {stats.newSku > 0 && (
        <div
          className="rounded-lg px-3 py-2 text-[11px] flex items-center gap-2"
          style={{
            background: "color-mix(in srgb, var(--blue) 10%, transparent)",
            color: "var(--blue)",
            border: "1px solid color-mix(in srgb, var(--blue) 25%, transparent)",
          }}
        >
          <AlertTriangle size={12} />
          {stats.newSku} new SKU flagged — create master in Entries before next reconciliation.
        </div>
      )}
      <button
        onClick={onClose}
        className="flex items-center gap-2 text-[12px] font-semibold px-5 py-2 rounded-lg cursor-pointer mt-2"
        style={{ background: "var(--green)", color: "#fff" }}
      >
        Open Entries <ArrowRight size={14} />
      </button>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════════
   Summary chip (Step 3 header)
   ══════════════════════════════════════════════════════════════════ */
function SummaryChip({ label, count, color, hint }: { label: string; count: number; color: string; hint: string }) {
  return (
    <div
      className="rounded-lg p-2.5 text-center"
      style={{ background: `color-mix(in srgb, ${color} 10%, transparent)` }}
    >
      <p className="text-[9px] uppercase tracking-wider font-semibold" style={{ color }}>
        {label}
      </p>
      <p
        className="text-xl font-bold tabular-nums"
        style={{ color, fontFamily: "'Space Grotesk', sans-serif" }}
      >
        {count}
      </p>
      <p className="text-[9px]" style={{ color: "var(--text-4)" }}>
        {hint}
      </p>
    </div>
  );
}
