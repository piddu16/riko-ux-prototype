"use client";

import React from "react";
import { AnimatePresence, motion } from "framer-motion";
import { MessageCircle, X, Send, Check } from "lucide-react";
import { WHATSAPP_TEMPLATES } from "@/lib/data";

const WA_GREEN = "#25D366";
const WA_DARK_TEAL = "#075E54";
const WA_BUBBLE = "#DCF8C6";

interface WhatsAppModalProps {
  open: boolean;
  onClose: () => void;
  partyName: string;
  amount: string;
  days: number;
}

/* ------------------------------------------------------------------ */
/*  Inner body — lives only while the modal is open.                   */
/*  Mounting/unmounting naturally resets the sent/sentTime state,      */
/*  which avoids calling setState inside an effect.                    */
/* ------------------------------------------------------------------ */
interface ModalBodyProps {
  onClose: () => void;
  partyName: string;
  amount: string;
  days: number;
}

function ModalBody({ onClose, partyName, amount, days }: ModalBodyProps) {
  const [sent, setSent] = React.useState(false);
  const [sentTime, setSentTime] = React.useState<string>("");

  // Auto-close after success
  React.useEffect(() => {
    if (!sent) return;
    const id = setTimeout(() => {
      onClose();
    }, 2000);
    return () => clearTimeout(id);
  }, [sent, onClose]);

  const template = WHATSAPP_TEMPLATES.reminder(partyName, amount, days);

  const handleSend = () => {
    setSentTime(
      new Date().toLocaleTimeString("en-IN", {
        hour: "2-digit",
        minute: "2-digit",
      })
    );
    setSent(true);
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
        boxShadow: "0 20px 50px rgba(0,0,0,0.35)",
      }}
      onClick={(e) => e.stopPropagation()}
      role="dialog"
      aria-modal="true"
      aria-label="Send payment reminder via WhatsApp"
    >
      {/* Header ---------------------------------------------- */}
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
              background: WA_GREEN,
              color: "#fff",
            }}
            aria-hidden
          >
            <MessageCircle size={18} strokeWidth={2.25} />
          </span>
          <div className="min-w-0">
            <h3
              className="text-sm font-semibold leading-tight truncate"
              style={{ color: "var(--text-1)" }}
            >
              Send Payment Reminder
            </h3>
            <p
              className="text-[11px] leading-tight truncate"
              style={{ color: "var(--text-3)" }}
            >
              via WhatsApp Business
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={onClose}
          aria-label="Close"
          className="flex items-center justify-center rounded-md transition-colors flex-shrink-0"
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

      {/* Body ------------------------------------------------ */}
      <div className="px-4 py-4">
        {!sent ? (
          <>
            {/* Preview card mimicking WhatsApp */}
            <div
              className="rounded-lg p-3"
              style={{
                background: "#fff",
                border: `1px solid ${WA_GREEN}`,
              }}
            >
              <p
                className="text-[11px] mb-2 font-medium"
                style={{ color: WA_DARK_TEAL }}
              >
                To: +91 98765 43210
              </p>

              <div className="flex justify-end">
                <div
                  className="max-w-[92%] rounded-lg px-3 py-2 relative"
                  style={{
                    background: WA_BUBBLE,
                    color: "#111b21",
                  }}
                >
                  <p
                    className="text-[12px] leading-relaxed whitespace-pre-line"
                    style={{
                      fontFamily:
                        "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
                    }}
                  >
                    {template.preview}
                  </p>
                  <p
                    className="text-[10px] mt-1 text-right"
                    style={{ color: "#667781" }}
                  >
                    {template.sentTime}
                  </p>
                </div>
              </div>
            </div>

            {/* Actions row ------------------------------------ */}
            <div className="flex items-center justify-end gap-2 mt-4">
              <button
                type="button"
                onClick={onClose}
                className="text-xs font-semibold px-3 py-2 rounded-md transition-colors"
                style={{
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
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSend}
                className="inline-flex items-center gap-1.5 text-xs font-semibold px-3.5 py-2 rounded-md transition-opacity"
                style={{
                  color: "#fff",
                  background: WA_GREEN,
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.opacity = "0.9";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.opacity = "1";
                }}
              >
                <Send size={13} strokeWidth={2.25} />
                Send via WhatsApp
              </button>
            </div>
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
                background: WA_GREEN,
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
              Reminder sent
            </p>
            <p
              className="text-xs mt-0.5"
              style={{ color: "var(--text-3)" }}
            >
              Sent at {sentTime}
            </p>
          </motion.div>
        )}
      </div>
    </motion.div>
  );
}

export function WhatsAppModal({
  open,
  onClose,
  partyName,
  amount,
  days,
}: WhatsAppModalProps) {
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
          style={{ background: "rgba(0,0,0,0.5)", backdropFilter: "blur(2px)" }}
          onClick={onClose}
        >
          <ModalBody
            onClose={onClose}
            partyName={partyName}
            amount={amount}
            days={days}
          />
        </motion.div>
      )}
    </AnimatePresence>
  );
}
