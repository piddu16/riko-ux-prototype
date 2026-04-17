"use client";

import { useState, useRef, useEffect } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Check, ChevronDown } from "lucide-react";
import { useRbac } from "@/lib/rbac-context";
import { ROLES, ROLE_LIST, type Role } from "@/lib/rbac";

export function RoleSwitcher() {
  const { role, setRole } = useRbac();
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  const current = ROLES[role];

  /* Close on outside click */
  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (!rootRef.current) return;
      if (!rootRef.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  /* Close on Escape */
  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [open]);

  const handlePick = (r: Role) => {
    setRole(r);
    setOpen(false);
  };

  return (
    <div ref={rootRef} className="relative">
      {/* Pill trigger */}
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-semibold transition-opacity cursor-pointer hover:opacity-90"
        style={{
          background: `color-mix(in srgb, ${current.color} 15%, transparent)`,
          border: `1px solid color-mix(in srgb, ${current.color} 30%, transparent)`,
          color: current.color,
        }}
        aria-haspopup="menu"
        aria-expanded={open}
        title={`Viewing as ${current.name}`}
      >
        <span className="text-[13px] leading-none" aria-hidden>
          {current.icon}
        </span>
        <span className="hidden sm:inline leading-none">{current.name}</span>
        <ChevronDown
          size={12}
          style={{
            transform: open ? "rotate(180deg)" : "rotate(0)",
            transition: "transform 150ms ease",
          }}
        />
      </button>

      {/* Dropdown */}
      <AnimatePresence>
        {open && (
          <motion.div
            key="dropdown"
            initial={{ opacity: 0, y: -4, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -4, scale: 0.98 }}
            transition={{ duration: 0.16, ease: "easeOut" }}
            className="absolute right-0 mt-2 w-80 rounded-xl overflow-hidden"
            style={{
              background: "var(--bg-surface)",
              border: "1px solid var(--border)",
              boxShadow: "0 20px 50px rgba(0,0,0,0.45)",
              zIndex: 60,
            }}
            role="menu"
          >
            {/* Header label */}
            <div
              className="px-3 pt-3 pb-2 text-[10px] uppercase tracking-wider font-bold"
              style={{ color: "var(--text-4)" }}
            >
              DEV MODE — VIEW AS
            </div>

            {/* Role list */}
            <div className="flex flex-col py-1">
              {ROLE_LIST.map((r) => {
                const cfg = ROLES[r];
                const active = r === role;
                return (
                  <button
                    key={r}
                    type="button"
                    onClick={() => handlePick(r)}
                    className="flex items-center gap-3 px-3 py-2 text-left transition-colors cursor-pointer"
                    role="menuitem"
                    onMouseEnter={(e) => {
                      (e.currentTarget as HTMLElement).style.background =
                        "var(--bg-hover)";
                    }}
                    onMouseLeave={(e) => {
                      (e.currentTarget as HTMLElement).style.background =
                        "transparent";
                    }}
                  >
                    {/* Icon disc */}
                    <span
                      className="flex items-center justify-center rounded-lg flex-shrink-0 text-[14px]"
                      style={{
                        width: 32,
                        height: 32,
                        background: `color-mix(in srgb, ${cfg.color} 15%, transparent)`,
                        border: `1px solid color-mix(in srgb, ${cfg.color} 30%, transparent)`,
                      }}
                      aria-hidden
                    >
                      {cfg.icon}
                    </span>

                    {/* Text */}
                    <div className="flex-1 min-w-0">
                      <p
                        className="text-xs font-semibold leading-tight"
                        style={{ color: "var(--text-1)" }}
                      >
                        {cfg.name}
                      </p>
                      <p
                        className="text-[10px] mt-0.5 leading-snug line-clamp-2"
                        style={{ color: "var(--text-4)" }}
                      >
                        {cfg.description}
                      </p>
                    </div>

                    {/* Right indicator */}
                    <span
                      className="flex-shrink-0 text-[10px] font-semibold"
                      style={{
                        color: active ? cfg.color : "var(--text-4)",
                      }}
                    >
                      {active ? (
                        <span
                          className="inline-flex items-center justify-center rounded-full"
                          style={{
                            width: 18,
                            height: 18,
                            background: `color-mix(in srgb, ${cfg.color} 20%, transparent)`,
                            color: cfg.color,
                          }}
                          aria-label="Currently active"
                        >
                          <Check size={11} strokeWidth={3} />
                        </span>
                      ) : (
                        <span style={{ color: cfg.color }}>Switch →</span>
                      )}
                    </span>
                  </button>
                );
              })}
            </div>

            {/* Footer help text */}
            <div
              className="px-3 py-2.5 text-[10px] leading-snug"
              style={{
                color: "var(--text-4)",
                borderTop: "1px solid var(--border)",
                background:
                  "color-mix(in srgb, var(--bg-secondary) 50%, transparent)",
              }}
            >
              Demo only. Production will use invite-based access.
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
