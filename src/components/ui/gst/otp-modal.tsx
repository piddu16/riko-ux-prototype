"use client";

import React, { useState, useRef, useEffect } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { X, Lock, Check, ShieldAlert, RotateCw } from "lucide-react";

interface OtpModalProps {
  open: boolean;
  onClose: () => void;
  purpose: string; // e.g. "GST consent" | "File GSTR-1" | "File GSTR-3B"
  mobile: string; // masked e.g. "XXX-XXX-2121"
  onSubmit?: (otp: string) => void;
}

/* ------------------------------------------------------------------ */
/*  ModalBody — mount/unmount resets state; no effectful resets needed. */
/* ------------------------------------------------------------------ */
interface ModalBodyProps {
  onClose: () => void;
  purpose: string;
  mobile: string;
  onSubmit?: (otp: string) => void;
}

function ModalBody({ onClose, purpose, mobile, onSubmit }: ModalBodyProps) {
  const [digits, setDigits] = useState<string[]>(["", "", "", "", "", ""]);
  const [verified, setVerified] = useState(false);
  const inputsRef = useRef<Array<HTMLInputElement | null>>([]);

  // Auto-focus the first input on mount.
  useEffect(() => {
    inputsRef.current[0]?.focus();
  }, []);

  // Auto-close after verification.
  useEffect(() => {
    if (!verified) return;
    const id = setTimeout(() => onClose(), 1000);
    return () => clearTimeout(id);
  }, [verified, onClose]);

  const otp = digits.join("");
  const isComplete = otp.length === 6 && digits.every((d) => d !== "");

  const handleChange = (index: number, value: string) => {
    // Only digits, single char.
    const digit = value.replace(/\D/g, "").slice(-1);
    const next = [...digits];
    next[index] = digit;
    setDigits(next);
    if (digit && index < 5) {
      inputsRef.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (
    index: number,
    e: React.KeyboardEvent<HTMLInputElement>
  ) => {
    if (e.key === "Backspace" && !digits[index] && index > 0) {
      inputsRef.current[index - 1]?.focus();
    } else if (e.key === "ArrowLeft" && index > 0) {
      inputsRef.current[index - 1]?.focus();
    } else if (e.key === "ArrowRight" && index < 5) {
      inputsRef.current[index + 1]?.focus();
    }
  };

  const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    const pasted = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
    if (!pasted) return;
    e.preventDefault();
    const next = ["", "", "", "", "", ""];
    for (let i = 0; i < pasted.length; i++) next[i] = pasted[i];
    setDigits(next);
    const focusIdx = Math.min(pasted.length, 5);
    inputsRef.current[focusIdx]?.focus();
  };

  const handleVerify = () => {
    if (!isComplete) return;
    onSubmit?.(otp);
    setVerified(true);
  };

  return (
    <motion.div
      key="card"
      initial={{ opacity: 0, scale: 0.92, y: 8 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95, y: 4 }}
      transition={{ duration: 0.22, ease: "easeOut" }}
      className="w-full max-w-md rounded-md overflow-hidden"
      style={{
        background: "var(--bg-surface)",
        border: "1px solid var(--border)",
        boxShadow: "0 20px 50px rgba(0,0,0,0.45)",
      }}
      onClick={(e) => e.stopPropagation()}
      role="dialog"
      aria-modal="true"
      aria-label={`Secure OTP verification for ${purpose}`}
    >
      {/* Header */}
      <div
        className="flex items-center justify-between px-4 py-3"
        style={{ borderBottom: "1px solid var(--border)" }}
      >
        <div className="flex items-center gap-2.5 min-w-0">
          <span
            className="flex items-center justify-center rounded-full flex-shrink-0"
            style={{
              width: 32,
              height: 32,
              background: "color-mix(in srgb, var(--green) 18%, transparent)",
              color: "var(--green)",
            }}
            aria-hidden
          >
            <Lock size={16} strokeWidth={2.25} />
          </span>
          <div className="min-w-0">
            <h3
              className="text-sm font-semibold leading-tight truncate"
              style={{ color: "var(--text-1)" }}
            >
              Secure OTP Verification
            </h3>
            <p
              className="text-[11px] leading-tight truncate"
              style={{ color: "var(--text-3)" }}
            >
              {purpose}
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={onClose}
          aria-label="Close"
          className="flex items-center justify-center rounded-md transition-colors flex-shrink-0 cursor-pointer"
          style={{
            width: 30,
            height: 30,
            color: "var(--text-3)",
            background: "transparent",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = "var(--bg-hover)";
            e.currentTarget.style.color = "var(--text-1)";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = "transparent";
            e.currentTarget.style.color = "var(--text-3)";
          }}
        >
          <X size={16} />
        </button>
      </div>

      {/* Body */}
      <div className="px-5 py-5">
        {!verified ? (
          <>
            {/* Warning banner */}
            <div
              className="flex items-start gap-2 rounded-lg px-3 py-2.5 mb-4"
              style={{
                background: "color-mix(in srgb, var(--yellow) 10%, transparent)",
                border: "1px solid color-mix(in srgb, var(--yellow) 30%, transparent)",
              }}
            >
              <ShieldAlert
                size={14}
                className="flex-shrink-0 mt-0.5"
                style={{ color: "var(--yellow)" }}
              />
              <p
                className="text-[11px] leading-relaxed"
                style={{ color: "var(--text-2)" }}
              >
                OTPs are <span className="font-semibold">NOT stored in chat history</span>. Sent to signatory mobile only.
              </p>
            </div>

            {/* Mobile label */}
            <p
              className="text-xs mb-3"
              style={{ color: "var(--text-3)" }}
            >
              Sent to <span className="font-semibold" style={{ color: "var(--text-1)" }}>{mobile}</span>
            </p>

            {/* OTP boxes */}
            <div className="flex items-center justify-between gap-2 mb-3">
              {digits.map((d, i) => (
                <input
                  key={i}
                  ref={(el) => {
                    inputsRef.current[i] = el;
                  }}
                  value={d}
                  onChange={(e) => handleChange(i, e.target.value)}
                  onKeyDown={(e) => handleKeyDown(i, e)}
                  onPaste={handlePaste}
                  inputMode="numeric"
                  autoComplete="one-time-code"
                  maxLength={1}
                  aria-label={`OTP digit ${i + 1}`}
                  className="text-center text-lg font-bold tabular-nums rounded-lg outline-none transition-colors"
                  style={{
                    width: 44,
                    height: 52,
                    background: "var(--bg-secondary)",
                    border: d
                      ? "1.5px solid var(--green)"
                      : "1.5px solid var(--border)",
                    color: "var(--text-1)",
                    fontFamily: "'Space Grotesk', sans-serif",
                  }}
                  onFocus={(e) => {
                    if (!d) e.currentTarget.style.borderColor = "var(--green)";
                  }}
                  onBlur={(e) => {
                    if (!d) e.currentTarget.style.borderColor = "var(--border)";
                  }}
                />
              ))}
            </div>

            {/* Timer + resend row */}
            <div className="flex items-center justify-between mb-5">
              <span
                className="text-[11px] tabular-nums"
                style={{ color: "var(--text-4)" }}
              >
                Valid for <span className="font-semibold" style={{ color: "var(--text-2)" }}>2:43</span>
              </span>
              <button
                type="button"
                onClick={() => console.log("resend otp")}
                className="inline-flex items-center gap-1 text-[11px] font-semibold cursor-pointer transition-opacity hover:opacity-80"
                style={{ color: "var(--green)" }}
              >
                <RotateCw size={11} />
                Resend OTP
              </button>
            </div>

            {/* Submit button */}
            <button
              type="button"
              onClick={handleVerify}
              disabled={!isComplete}
              className="w-full inline-flex items-center justify-center gap-1.5 text-sm font-semibold px-4 py-2.5 rounded-lg transition-all"
              style={{
                background: isComplete ? "var(--green)" : "color-mix(in srgb, var(--green) 30%, transparent)",
                color: isComplete ? "#052E16" : "var(--text-4)",
                cursor: isComplete ? "pointer" : "not-allowed",
                opacity: isComplete ? 1 : 0.6,
              }}
            >
              <Lock size={13} strokeWidth={2.5} />
              Verify OTP
            </button>
          </>
        ) : (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.25, ease: "easeOut" }}
            className="flex flex-col items-center justify-center py-6"
          >
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{
                type: "spring",
                stiffness: 320,
                damping: 18,
                delay: 0.05,
              }}
              className="flex items-center justify-center rounded-full mb-3"
              style={{
                width: 56,
                height: 56,
                background: "var(--green)",
                color: "#fff",
              }}
              aria-hidden
            >
              <Check size={30} strokeWidth={3} />
            </motion.div>
            <p
              className="text-sm font-semibold"
              style={{ color: "var(--text-1)" }}
            >
              Verified
            </p>
            <p
              className="text-xs mt-0.5"
              style={{ color: "var(--text-3)" }}
            >
              Proceeding with {purpose.toLowerCase()}
            </p>
          </motion.div>
        )}
      </div>
    </motion.div>
  );
}

/* ------------------------------------------------------------------ */
/*  Public wrapper                                                    */
/* ------------------------------------------------------------------ */
export function OtpModal({
  open,
  onClose,
  purpose,
  mobile,
  onSubmit,
}: OtpModalProps) {
  return (
    <AnimatePresence>
      {open && (
        <motion.div
          key="overlay"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: "rgba(0,0,0,0.6)", backdropFilter: "blur(3px)" }}
          onClick={onClose}
        >
          <ModalBody
            onClose={onClose}
            purpose={purpose}
            mobile={mobile}
            onSubmit={onSubmit}
          />
        </motion.div>
      )}
    </AnimatePresence>
  );
}
