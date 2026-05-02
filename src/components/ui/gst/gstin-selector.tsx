"use client";

import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown, Check, Building2 } from "lucide-react";
import { GSTINS } from "@/lib/data";

interface GstinSelectorProps {
  selected: string; // GSTIN id
  onChange: (id: string) => void;
}

const statusColor: Record<string, string> = {
  Active: "var(--green)",
  Suspended: "var(--red)",
};

export function GstinSelector({ selected, onChange }: GstinSelectorProps) {
  const [open, setOpen] = useState(false);
  const wrapperRef = useRef<HTMLDivElement | null>(null);

  const current = GSTINS.find((g) => g.id === selected) ?? GSTINS[0];

  // Close on outside click.
  useEffect(() => {
    if (!open) return;
    const onDocClick = (e: MouseEvent) => {
      if (!wrapperRef.current) return;
      if (!wrapperRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", onDocClick);
    return () => document.removeEventListener("mousedown", onDocClick);
  }, [open]);

  const currentColor = statusColor[current.status] ?? "var(--text-4)";

  return (
    <div ref={wrapperRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="inline-flex items-center gap-2 text-xs font-semibold px-3 py-1.5 rounded-full transition-colors cursor-pointer"
        style={{
          background: "var(--bg-surface)",
          border: "1px solid var(--border)",
          color: "var(--text-1)",
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.background = "var(--bg-hover)";
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.background = "var(--bg-surface)";
        }}
        aria-haspopup="listbox"
        aria-expanded={open}
      >
        <Building2 size={12} style={{ color: "var(--text-3)" }} />
        <span
          className="text-[10px] font-bold px-1.5 py-0.5 rounded"
          style={{
            background: "color-mix(in srgb, var(--blue) 15%, transparent)",
            color: "var(--blue)",
          }}
        >
          {current.state}
        </span>
        <span
          className="tabular-nums truncate max-w-[160px]"
          style={{ fontFamily: "'Space Grotesk', sans-serif" }}
        >
          {current.id}
        </span>
        <span
          className="inline-flex items-center gap-1 text-[10px] font-semibold"
          style={{ color: currentColor }}
        >
          <span
            className="w-1.5 h-1.5 rounded-full"
            style={{ background: currentColor }}
          />
          {current.status}
        </span>
        <ChevronDown
          size={12}
          style={{
            color: "var(--text-3)",
            transform: open ? "rotate(180deg)" : "rotate(0)",
            transition: "transform 0.2s",
          }}
        />
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            key="dropdown"
            initial={{ opacity: 0, y: -4, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -4, scale: 0.98 }}
            transition={{ duration: 0.15, ease: "easeOut" }}
            role="listbox"
            className="absolute right-0 top-full mt-1.5 rounded-md overflow-hidden z-50"
            style={{
              background: "var(--bg-surface)",
              border: "1px solid var(--border)",
              boxShadow: "0 12px 36px rgba(0,0,0,0.35)",
              minWidth: 320,
            }}
          >
            <div
              className="px-3 py-2 text-[10px] font-bold uppercase tracking-wider"
              style={{
                color: "var(--text-4)",
                borderBottom: "1px solid var(--border)",
                background: "var(--bg-secondary)",
              }}
            >
              Select GSTIN
            </div>
            <div className="flex flex-col py-1">
              {GSTINS.map((g) => {
                const isSelected = g.id === current.id;
                const color = statusColor[g.status] ?? "var(--text-4)";
                return (
                  <button
                    key={g.id}
                    type="button"
                    role="option"
                    aria-selected={isSelected}
                    onClick={() => {
                      onChange(g.id);
                      setOpen(false);
                    }}
                    className="flex items-center gap-3 px-3 py-2.5 text-left transition-colors cursor-pointer"
                    style={{
                      background: isSelected
                        ? "color-mix(in srgb, var(--green) 8%, transparent)"
                        : "transparent",
                    }}
                    onMouseEnter={(e) => {
                      if (!isSelected) {
                        e.currentTarget.style.background = "var(--bg-hover)";
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (!isSelected) {
                        e.currentTarget.style.background = "transparent";
                      }
                    }}
                  >
                    <span
                      className="flex items-center justify-center w-8 h-8 rounded-lg text-[10px] font-bold flex-shrink-0"
                      style={{
                        background: "color-mix(in srgb, var(--blue) 15%, transparent)",
                        color: "var(--blue)",
                        fontFamily: "'Space Grotesk', sans-serif",
                      }}
                    >
                      {g.state}
                    </span>
                    <div className="flex-1 min-w-0">
                      <p
                        className="text-xs font-semibold tabular-nums truncate"
                        style={{
                          color: "var(--text-1)",
                          fontFamily: "'Space Grotesk', sans-serif",
                        }}
                      >
                        {g.id}
                      </p>
                      <p
                        className="text-[10px] truncate"
                        style={{ color: "var(--text-3)" }}
                      >
                        {g.label}
                        {g.primary && <span className="ml-1" style={{ color: "var(--text-4)" }}>· Primary</span>}
                      </p>
                    </div>
                    <span
                      className="inline-flex items-center gap-1 text-[10px] font-semibold px-1.5 py-0.5 rounded flex-shrink-0"
                      style={{
                        background: `color-mix(in srgb, ${color} 14%, transparent)`,
                        color,
                      }}
                    >
                      <span
                        className="w-1.5 h-1.5 rounded-full"
                        style={{ background: color }}
                      />
                      {g.status}
                    </span>
                    {isSelected && (
                      <Check
                        size={14}
                        style={{ color: "var(--green)" }}
                        className="flex-shrink-0"
                      />
                    )}
                  </button>
                );
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
