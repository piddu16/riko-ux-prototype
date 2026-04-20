"use client";

import { motion, AnimatePresence } from "framer-motion";
import {
  LayoutDashboard,
  MessageSquare,
  Users,
  ArrowDownToLine,
  Landmark,
  Receipt,
  Building,
  BookOpen,
  TrendingUp,
  Package,
  FileText,
  FileSpreadsheet,
  Settings,
  X,
  type LucideIcon,
} from "lucide-react";
import { useRbac } from "@/lib/rbac-context";
import { ThemeToggle } from "../theme-toggle";
import { LanguageToggle } from "../language-toggle";

const allSections: { id: string; label: string; icon: LucideIcon; description: string }[] = [
  { id: "dashboard", label: "Dashboard", icon: LayoutDashboard, description: "KPIs, health score, this week" },
  { id: "chat", label: "Chat", icon: MessageSquare, description: "Ask Riko anything" },
  { id: "clients", label: "Clients", icon: Users, description: "Multi-client portfolio" },
  { id: "entries", label: "Entries", icon: FileSpreadsheet, description: "Tally entries · draft, approve, post" },
  { id: "outstanding", label: "Outstanding", icon: ArrowDownToLine, description: "Receivables & payables" },
  { id: "gst", label: "GST Agent", icon: Landmark, description: "Reconciliation & filing" },
  { id: "tds", label: "TDS Workings", icon: Receipt, description: "Sections, deductees, due dates" },
  { id: "bankrecon", label: "Bank Recon", icon: Building, description: "Match bank with Tally" },
  { id: "daybook", label: "Day Book", icon: BookOpen, description: "All voucher entries" },
  { id: "sales", label: "Sales Analytics", icon: TrendingUp, description: "Growth & channel mix" },
  { id: "inventory", label: "Inventory", icon: Package, description: "Stock & reorder alerts" },
  { id: "reports", label: "Reports", icon: FileText, description: "MIS, P&L, exports" },
  { id: "settings", label: "Settings", icon: Settings, description: "Team, profile, billing" },
];

interface MoreDrawerProps {
  open: boolean;
  onClose: () => void;
  activeTab: string;
  onTabChange: (tabId: string) => void;
}

export function MoreDrawer({ open, onClose, activeTab, onTabChange }: MoreDrawerProps) {
  const { canSee, roleConfig, role } = useRbac();
  const visible = allSections.filter((s) => canSee(s.id));

  const handleSelect = (id: string) => {
    onTabChange(id);
    onClose();
  };

  return (
    <AnimatePresence>
      {open && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={onClose}
            className="fixed inset-0 z-[60]"
            style={{ background: "rgba(0,0,0,0.5)", backdropFilter: "blur(2px)" }}
          />

          {/* Bottom sheet */}
          <motion.div
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ type: "spring", damping: 30, stiffness: 300 }}
            className="fixed bottom-0 left-0 right-0 z-[70] rounded-t-2xl md:hidden"
            style={{
              background: "var(--bg-secondary)",
              borderTop: "1px solid var(--border)",
              maxHeight: "85vh",
              paddingBottom: "env(safe-area-inset-bottom, 0px)",
            }}
          >
            {/* Handle */}
            <div className="flex justify-center pt-2 pb-1">
              <div className="w-10 h-1 rounded-full" style={{ background: "var(--border)" }} />
            </div>

            {/* Header */}
            <div className="flex items-center justify-between px-5 py-3" style={{ borderBottom: "1px solid var(--border)" }}>
              <div>
                <h3 className="text-base font-bold" style={{ color: "var(--text-1)" }}>
                  All sections
                </h3>
                <p className="text-[10px]" style={{ color: "var(--text-4)" }}>
                  {visible.length} available as {roleConfig.name}
                </p>
              </div>
              <button
                onClick={onClose}
                className="p-2 rounded-lg cursor-pointer transition-colors"
                style={{ color: "var(--text-3)" }}
                aria-label="Close"
              >
                <X size={20} />
              </button>
            </div>

            {/* Grid of sections */}
            <div className="grid grid-cols-2 gap-2 p-4 overflow-y-auto" style={{ maxHeight: "60vh" }}>
              {visible.map((section, i) => {
                const Icon = section.icon;
                const isActive = activeTab === section.id;
                return (
                  <motion.button
                    key={section.id}
                    onClick={() => handleSelect(section.id)}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.03 }}
                    className="flex flex-col items-start p-3 rounded-xl cursor-pointer transition-colors"
                    style={{
                      background: isActive
                        ? "color-mix(in srgb, var(--green) 12%, var(--bg-surface))"
                        : "var(--bg-surface)",
                      border: `1px solid ${isActive ? "color-mix(in srgb, var(--green) 30%, transparent)" : "var(--border)"}`,
                    }}
                  >
                    <div
                      className="w-9 h-9 rounded-lg flex items-center justify-center mb-2"
                      style={{
                        background: isActive
                          ? "var(--green)"
                          : "color-mix(in srgb, var(--text-1) 8%, transparent)",
                      }}
                    >
                      <Icon size={18} style={{ color: isActive ? "#fff" : "var(--text-2)" }} />
                    </div>
                    <span
                      className="text-sm font-semibold mb-0.5"
                      style={{ color: isActive ? "var(--green)" : "var(--text-1)" }}
                    >
                      {section.label}
                    </span>
                    <span
                      className="text-[10px] text-left leading-tight"
                      style={{ color: "var(--text-4)" }}
                    >
                      {section.description}
                    </span>
                  </motion.button>
                );
              })}
            </div>

            {/* Footer: quick toggles */}
            <div
              className="flex items-center justify-between px-4 py-3"
              style={{ borderTop: "1px solid var(--border)" }}
            >
              <span
                className="text-[10px] font-semibold uppercase tracking-wider"
                style={{ color: "var(--text-4)" }}
              >
                Viewing as {roleConfig.icon} {role}
              </span>
              <div className="flex items-center gap-2">
                <LanguageToggle />
                <ThemeToggle />
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
