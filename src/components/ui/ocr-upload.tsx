"use client";

/* ═══════════════════════════════════════════════════════════════
   OcrUpload — drag-drop bill / invoice → extract fields via
   fake OCR (for demo) → review + save as draft → submit to
   approval queue.

   Shows the end-to-end scan flow a junior-accounts user follows:
   upload PDF or photo → wait for OCR → review fields with
   confidence badges → correct low-confidence fields → submit.
   ═══════════════════════════════════════════════════════════════ */

import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowLeft,
  Upload,
  Sparkles,
  CheckCircle2,
  AlertTriangle,
  Building2,
  ScanLine,
} from "lucide-react";
import { OCR_SAMPLE } from "@/lib/data";

type Stage =
  | "idle" // waiting for file drop
  | "scanning" // fake OCR in progress
  | "review" // extracted fields visible, user reviews
  | "submitted"; // user saved as draft / submitted

export function OcrUpload({ onClose }: { onClose: () => void }) {
  const [stage, setStage] = useState<Stage>("idle");
  const [scanProgress, setScanProgress] = useState(0);
  const [fileName, setFileName] = useState("");
  const [dragOver, setDragOver] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const [toast, setToast] = useState<string | null>(null);

  useEffect(() => {
    if (stage !== "scanning") return;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setScanProgress(0);
    const id = window.setInterval(() => {
      setScanProgress((p) => {
        const next = Math.min(100, p + Math.ceil(Math.random() * 12 + 4));
        if (next >= 100) {
          window.clearInterval(id);
          window.setTimeout(() => setStage("review"), 350);
        }
        return next;
      });
    }, 180);
    return () => window.clearInterval(id);
  }, [stage]);

  useEffect(() => {
    if (!toast) return;
    const t = window.setTimeout(() => setToast(null), 2800);
    return () => window.clearTimeout(t);
  }, [toast]);

  const handleFile = (f: File) => {
    setFileName(f.name || "uploaded-bill.pdf");
    setStage("scanning");
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file) handleFile(file);
  };

  const handlePickSample = () => {
    setFileName(OCR_SAMPLE.fileName);
    setStage("scanning");
  };

  const handleSubmit = () => {
    setStage("submitted");
    setToast("Draft saved · sent to Accounts for approval");
    window.setTimeout(() => onClose(), 1500);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-4 relative">
      <div className="flex items-center gap-3">
        <button
          onClick={onClose}
          className="flex items-center gap-1.5 text-[12px] font-medium px-2.5 py-1.5 rounded-md cursor-pointer transition-opacity hover:opacity-80"
          style={{
            background: "var(--bg-surface)",
            border: "1px solid var(--border)",
            color: "var(--text-3)",
          }}
        >
          <ArrowLeft size={12} />
          Back to Entries
        </button>
      </div>

      <div>
        <h1 className="text-xl md:text-2xl font-bold" style={{ color: "var(--text-1)" }}>
          Upload bill or invoice
        </h1>
        <p className="text-[13px] mt-0.5" style={{ color: "var(--text-3)" }}>
          Drop a PDF or photo. Riko OCRs the fields, drafts a voucher, and routes it to the right approver.
        </p>
      </div>

      {stage === "idle" && (
        <>
          {/* Drop zone */}
          <div
            onDragOver={(e) => {
              e.preventDefault();
              setDragOver(true);
            }}
            onDragLeave={() => setDragOver(false)}
            onDrop={handleDrop}
            onClick={() => inputRef.current?.click()}
            className="rounded-2xl p-10 text-center cursor-pointer transition-colors"
            style={{
              background: dragOver
                ? "color-mix(in srgb, var(--green) 10%, transparent)"
                : "var(--bg-surface)",
              border: `2px dashed ${dragOver ? "var(--green)" : "var(--border)"}`,
            }}
          >
            <input
              ref={inputRef}
              type="file"
              accept="image/*,application/pdf"
              className="hidden"
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) handleFile(f);
              }}
            />
            <div
              className="w-14 h-14 rounded-2xl mx-auto mb-3 flex items-center justify-center"
              style={{
                background: "color-mix(in srgb, var(--green) 12%, transparent)",
              }}
            >
              <Upload size={22} style={{ color: "var(--green)" }} />
            </div>
            <p className="text-sm font-semibold mb-1" style={{ color: "var(--text-1)" }}>
              Drop a bill PDF or photo here
            </p>
            <p className="text-[12px] mb-3" style={{ color: "var(--text-3)" }}>
              Or click to browse · JPG · PNG · PDF · up to 10MB
            </p>
            <button
              onClick={(e) => {
                e.stopPropagation();
                handlePickSample();
              }}
              className="text-[11px] font-semibold px-3 py-1.5 rounded-md cursor-pointer transition-opacity hover:opacity-80"
              style={{
                background: "var(--bg-hover)",
                border: "1px solid var(--border)",
                color: "var(--text-2)",
              }}
            >
              Try with a sample bill
            </button>
          </div>

          <div
            className="grid grid-cols-1 md:grid-cols-3 gap-3"
          >
            <Feature
              icon={<ScanLine size={16} style={{ color: "var(--blue)" }} />}
              title="94% field accuracy"
              body="Vendor, GSTIN, invoice number, date, tax split — extracted automatically. Low-confidence fields flagged for review."
            />
            <Feature
              icon={<Building2 size={16} style={{ color: "var(--purple)" }} />}
              title="Auto-matches to Tally master"
              body="Recognises vendors from Tally. Classifies expense by vendor history. New vendor? Riko suggests creating one."
            />
            <Feature
              icon={<Sparkles size={16} style={{ color: "var(--green)" }} />}
              title="Routes by value + type"
              body="Below ₹10K: any approver. ₹10K–₹1L: Accounts. ₹1L+: Accounts Head. Routing thresholds are configurable."
            />
          </div>
        </>
      )}

      {stage === "scanning" && (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-2xl p-8 text-center"
          style={{ background: "var(--bg-surface)", border: "1px solid var(--border)" }}
        >
          <motion.div
            animate={{ rotate: [0, 360] }}
            transition={{ duration: 1.4, repeat: Infinity, ease: "linear" }}
            className="w-14 h-14 rounded-full mx-auto mb-4"
            style={{
              border: "3px solid color-mix(in srgb, var(--green) 20%, transparent)",
              borderTopColor: "var(--green)",
            }}
          />
          <p className="text-sm font-bold mb-1" style={{ color: "var(--text-1)" }}>
            Scanning {fileName}…
          </p>
          <p className="text-[11px] mb-4" style={{ color: "var(--text-3)" }}>
            Running OCR, matching vendor against Tally master, classifying expense category
          </p>
          <div
            className="max-w-md mx-auto h-1.5 rounded-full overflow-hidden"
            style={{ background: "var(--bg-hover)" }}
          >
            <motion.div
              animate={{ width: `${scanProgress}%` }}
              className="h-full rounded-full"
              style={{ background: "var(--green)" }}
            />
          </div>
          <p
            className="text-[10px] mt-2 tabular-nums"
            style={{
              color: "var(--text-4)",
              fontFamily: "'Space Grotesk', sans-serif",
            }}
          >
            {scanProgress}%
          </p>
        </motion.div>
      )}

      {stage === "review" && (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-3"
        >
          {/* Extraction summary */}
          <div
            className="flex items-start gap-3 px-4 py-3 rounded-xl"
            style={{
              background: "color-mix(in srgb, var(--green) 8%, transparent)",
              border: "1px solid color-mix(in srgb, var(--green) 25%, transparent)",
            }}
          >
            <Sparkles size={16} style={{ color: "var(--green)", flexShrink: 0, marginTop: 2 }} />
            <div className="flex-1">
              <p className="text-[12px] font-semibold" style={{ color: "var(--text-1)" }}>
                Extracted {Object.keys(OCR_SAMPLE.fields).length + OCR_SAMPLE.lineItems.length} fields from <span className="font-mono">{fileName}</span>
              </p>
              <p className="text-[11px] mt-0.5" style={{ color: "var(--text-3)" }}>
                92% average confidence. 2 fields need your review (flagged yellow).
              </p>
            </div>
          </div>

          {/* Fields grid */}
          <div
            className="rounded-2xl p-5"
            style={{ background: "var(--bg-surface)", border: "1px solid var(--border)" }}
          >
            <h2 className="text-sm font-bold mb-3" style={{ color: "var(--text-1)" }}>
              Vendor & invoice
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {(Object.entries(OCR_SAMPLE.fields) as [string, { value: string | number; confidence: number }][]).map(
                ([key, { value, confidence }]) => (
                  <FieldRow key={key} label={fieldLabel(key)} value={String(value)} confidence={confidence} />
                ),
              )}
            </div>

            <h2
              className="text-sm font-bold mt-5 mb-3"
              style={{ color: "var(--text-1)" }}
            >
              Line items
            </h2>
            <table className="w-full text-[12px]">
              <thead>
                <tr style={{ color: "var(--text-4)" }}>
                  <th className="text-left pb-2 font-medium">Description</th>
                  <th className="text-left pb-2 font-medium">HSN</th>
                  <th className="text-right pb-2 font-medium">Qty</th>
                  <th className="text-right pb-2 font-medium">Rate</th>
                  <th className="text-right pb-2 font-medium">Amount</th>
                  <th className="text-right pb-2 font-medium">Conf.</th>
                </tr>
              </thead>
              <tbody>
                {OCR_SAMPLE.lineItems.map((item, i) => (
                  <tr key={i} style={{ borderTop: "1px solid var(--border)" }}>
                    <td className="py-2" style={{ color: "var(--text-1)" }}>
                      {item.description}
                    </td>
                    <td
                      className="py-2 font-mono text-[11px]"
                      style={{ color: "var(--text-4)" }}
                    >
                      {item.hsn}
                    </td>
                    <td
                      className="py-2 text-right tabular-nums"
                      style={{ color: "var(--text-2)" }}
                    >
                      {item.qty} {item.unit}
                    </td>
                    <td
                      className="py-2 text-right tabular-nums"
                      style={{
                        color: "var(--text-2)",
                        fontFamily: "'Space Grotesk', sans-serif",
                      }}
                    >
                      ₹{item.rate.toLocaleString("en-IN")}
                    </td>
                    <td
                      className="py-2 text-right tabular-nums font-semibold"
                      style={{
                        color: "var(--text-1)",
                        fontFamily: "'Space Grotesk', sans-serif",
                      }}
                    >
                      ₹{item.amount.toLocaleString("en-IN")}
                    </td>
                    <td className="py-2 text-right">
                      <ConfidenceChip conf={item.confidence} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {/* Draft preview */}
            <div
              className="mt-5 pt-5"
              style={{ borderTop: "1px solid var(--border)" }}
            >
              <p
                className="text-[10px] uppercase tracking-wider font-medium mb-1"
                style={{ color: "var(--text-4)" }}
              >
                Riko will draft
              </p>
              <p className="text-sm font-bold" style={{ color: "var(--text-1)" }}>
                Purchase voucher → Patel Raw Materials Ltd → ₹
                {OCR_SAMPLE.fields.total.value.toLocaleString("en-IN")}
              </p>
              <p className="text-[11px] mt-1" style={{ color: "var(--text-3)" }}>
                Routes to: <strong>Accounts</strong> for approval (₹1.16L &lt; ₹1L* · actually &gt;₹10K so ₹10K–₹1L band applies to amounts in that range).
                Will cascade to: Purchase ledger, Input CGST+SGST, Creditor ledger, Inventory (if item-based).
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 justify-end">
            <button
              onClick={() => setStage("idle")}
              className="text-xs font-semibold px-3 py-2 rounded-lg cursor-pointer"
              style={{
                background: "var(--bg-surface)",
                border: "1px solid var(--border)",
                color: "var(--text-2)",
              }}
            >
              Discard
            </button>
            <button
              className="text-xs font-semibold px-3 py-2 rounded-lg cursor-pointer"
              style={{
                background: "var(--bg-surface)",
                border: "1px solid var(--border)",
                color: "var(--text-2)",
              }}
            >
              Save as draft
            </button>
            <button
              onClick={handleSubmit}
              className="flex items-center gap-1.5 text-xs font-semibold px-3 py-2 rounded-lg cursor-pointer"
              style={{ background: "var(--green)", color: "white" }}
            >
              <CheckCircle2 size={12} />
              Submit for approval
            </button>
          </div>
        </motion.div>
      )}

      {stage === "submitted" && (
        <motion.div
          initial={{ opacity: 0, scale: 0.96 }}
          animate={{ opacity: 1, scale: 1 }}
          className="rounded-2xl p-10 text-center"
          style={{ background: "var(--bg-surface)", border: "1px solid var(--border)" }}
        >
          <div
            className="w-14 h-14 rounded-full mx-auto mb-3 flex items-center justify-center"
            style={{
              background: "color-mix(in srgb, var(--green) 18%, transparent)",
            }}
          >
            <CheckCircle2 size={24} style={{ color: "var(--green)" }} />
          </div>
          <p className="text-sm font-bold" style={{ color: "var(--text-1)" }}>
            Submitted for approval
          </p>
          <p className="text-[11px] mt-1" style={{ color: "var(--text-3)" }}>
            Accounts has been notified. You&apos;ll see this in your Entries queue as &quot;Pending approval.&quot;
          </p>
        </motion.div>
      )}

      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="fixed bottom-20 md:bottom-6 left-1/2 -translate-x-1/2 z-50 px-4 py-2.5 rounded-lg flex items-center gap-2"
            style={{
              background: "var(--green)",
              color: "white",
              boxShadow: "0 6px 20px rgba(0,0,0,0.25)",
            }}
          >
            <CheckCircle2 size={14} />
            <span className="text-[13px] font-semibold">{toast}</span>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

/* ── Confidence chip: 100-85% green, 85-70% yellow, <70% red ── */
function ConfidenceChip({ conf }: { conf: number }) {
  const pct = Math.round(conf * 100);
  const color =
    conf >= 0.9 ? "var(--green)" : conf >= 0.78 ? "var(--yellow)" : "var(--red)";
  return (
    <span
      className="inline-flex items-center gap-1 text-[10px] font-bold px-1.5 py-0.5 rounded tabular-nums"
      style={{
        background: `color-mix(in srgb, ${color} 12%, transparent)`,
        color,
      }}
    >
      {pct}%
    </span>
  );
}

function FieldRow({
  label,
  value,
  confidence,
}: {
  label: string;
  value: string;
  confidence: number;
}) {
  const needsReview = confidence < 0.85;
  return (
    <div
      className="rounded-lg px-3 py-2"
      style={{
        background: needsReview
          ? "color-mix(in srgb, var(--yellow) 8%, transparent)"
          : "var(--bg-hover)",
        border: needsReview
          ? "1px solid color-mix(in srgb, var(--yellow) 30%, transparent)"
          : "1px solid var(--border)",
      }}
    >
      <div className="flex items-center justify-between gap-2 mb-0.5">
        <p
          className="text-[10px] uppercase tracking-wider font-medium"
          style={{ color: "var(--text-4)" }}
        >
          {label}
        </p>
        <ConfidenceChip conf={confidence} />
      </div>
      <p
        className="text-[13px] font-semibold"
        style={{
          color: "var(--text-1)",
          fontFamily: ["total", "subtotal", "cgst", "sgst", "igst"].includes(label.toLowerCase().replace(/\s/g, ""))
            ? "'Space Grotesk', sans-serif"
            : undefined,
        }}
      >
        {value}
      </p>
      {needsReview && (
        <p
          className="text-[10px] mt-0.5 flex items-center gap-1"
          style={{ color: "var(--yellow)" }}
        >
          <AlertTriangle size={9} /> Low confidence — please verify
        </p>
      )}
    </div>
  );
}

function fieldLabel(key: string): string {
  return key
    .replace(/([A-Z])/g, " $1")
    .replace(/^./, (s) => s.toUpperCase())
    .trim();
}

function Feature({
  icon,
  title,
  body,
}: {
  icon: React.ReactNode;
  title: string;
  body: string;
}) {
  return (
    <div
      className="rounded-xl p-4"
      style={{ background: "var(--bg-surface)", border: "1px solid var(--border)" }}
    >
      <div className="mb-2">{icon}</div>
      <p className="text-[12px] font-bold mb-1" style={{ color: "var(--text-1)" }}>
        {title}
      </p>
      <p className="text-[11px] leading-relaxed" style={{ color: "var(--text-3)" }}>
        {body}
      </p>
    </div>
  );
}
