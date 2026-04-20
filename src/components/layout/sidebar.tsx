"use client";

import type { LucideIcon } from "lucide-react";
import {
  LayoutDashboard,
  MessageSquare,
  ArrowDownToLine,
  BookOpen,
  TrendingUp,
  Package,
  FileText,
  Users,
  Landmark,
  Receipt,
  Building,
  Settings,
  FileSpreadsheet,
} from "lucide-react";
import { ThemeToggle } from "../theme-toggle";
import { useRbac } from "@/lib/rbac-context";
import { ENTRIES } from "@/lib/data";
import { canApproveAmount, canEntryAction } from "@/lib/rbac";

type NavItem = { id: string; label: string; icon: LucideIcon };

/*
 * Grouped navigation — a subtle separator appears between groups.
 */
const navGroups: NavItem[][] = [
  // Home
  [
    { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
    { id: "chat", label: "Chat", icon: MessageSquare },
  ],
  // Operations
  [
    { id: "entries", label: "Entries", icon: FileSpreadsheet },
    { id: "outstanding", label: "Outstanding", icon: ArrowDownToLine },
    { id: "inventory", label: "Inventory", icon: Package },
    { id: "daybook", label: "Day Book", icon: BookOpen },
  ],
  // Analysis
  [
    { id: "sales", label: "Sales", icon: TrendingUp },
    { id: "reports", label: "Reports", icon: FileText },
  ],
  // Compliance
  [
    { id: "gst", label: "GST", icon: Landmark },
    { id: "tds", label: "TDS", icon: Receipt },
    { id: "bankrecon", label: "Bank Recon", icon: Building },
  ],
  // CA
  [
    { id: "clients", label: "Clients", icon: Users },
  ],
  // Admin
  [
    { id: "settings", label: "Settings", icon: Settings },
  ],
];

const navItems: readonly NavItem[] = navGroups.flat();

export type TabId = (typeof navItems)[number]["id"];

interface SidebarProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
}

export function Sidebar({ activeTab, onTabChange }: SidebarProps) {
  const { canSee, role, roleConfig } = useRbac();

  /* Filter each group, then drop empty groups */
  const visibleGroups = navGroups
    .map((g) => g.filter((n) => canSee(n.id)))
    .filter((g) => g.length > 0);

  /* Count of entries pending my approval — drives the red Entries badge. */
  const pendingApprovalCount = ENTRIES.filter(
    (e) =>
      e.state === "pending" &&
      canApproveAmount(role, e.amount) &&
      canEntryAction(role, e.type, "approve") &&
      e.createdByRole !== role,
  ).length;

  return (
    <aside
      className="hidden md:flex flex-col items-center py-4 fixed left-0 top-0 h-full z-40"
      style={{
        width: 72,
        background: "var(--bg-secondary)",
        borderRight: "1px solid var(--border)",
      }}
    >
      {/* Logo */}
      <div
        className="w-9 h-9 rounded-lg flex items-center justify-center mb-5 flex-shrink-0"
        style={{
          background: "linear-gradient(135deg, var(--green), var(--green-dark))",
        }}
      >
        <span className="text-white text-base font-extrabold">R</span>
      </div>

      {/* Nav items */}
      <nav className="flex-1 flex flex-col items-center gap-0.5 w-full px-2">
        {visibleGroups.map((group, gi) => (
          <div key={gi} className="w-full flex flex-col items-center gap-0.5">
            {group.map(({ id, label, icon: Icon }) => {
              const active = activeTab === id;
              return (
                <button
                  key={id}
                  onClick={() => onTabChange(id)}
                  className="relative flex flex-col items-center justify-center w-full py-2.5 rounded-lg transition-colors cursor-pointer"
                  style={{
                    background: active
                      ? "color-mix(in srgb, var(--green) 15%, transparent)"
                      : "transparent",
                  }}
                  title={label}
                  onMouseEnter={(e) => {
                    if (!active)
                      (e.currentTarget as HTMLElement).style.background =
                        "var(--bg-hover)";
                  }}
                  onMouseLeave={(e) => {
                    if (!active)
                      (e.currentTarget as HTMLElement).style.background =
                        "transparent";
                  }}
                >
                  {active && (
                    <div
                      className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-6 rounded-r"
                      style={{ background: "var(--green)" }}
                    />
                  )}
                  <div className="relative">
                    <Icon
                      size={20}
                      style={{ color: active ? "var(--green)" : "var(--text-3)" }}
                    />
                    {id === "entries" && pendingApprovalCount > 0 && (
                      <span
                        className="absolute -top-1.5 -right-2 min-w-[16px] h-[16px] px-1 rounded-full flex items-center justify-center text-[9px] font-bold"
                        style={{
                          background: "var(--red)",
                          color: "white",
                          fontFamily: "'Space Grotesk', sans-serif",
                        }}
                        aria-label={`${pendingApprovalCount} entries pending your approval`}
                      >
                        {pendingApprovalCount}
                      </span>
                    )}
                  </div>
                  <span
                    className="text-[10px] mt-1 leading-none font-medium"
                    style={{ color: active ? "var(--green)" : "var(--text-4)" }}
                  >
                    {label}
                  </span>
                </button>
              );
            })}
            {gi < visibleGroups.length - 1 && (
              <div
                className="my-1.5"
                style={{
                  width: "70%",
                  height: 1,
                  background: "var(--border)",
                }}
                aria-hidden
              />
            )}
          </div>
        ))}
      </nav>

      {/* Role badge */}
      <div className="mt-auto flex flex-col items-center gap-2">
        <span
          className="flex items-center justify-center rounded-full text-[12px] leading-none cursor-help transition-transform hover:scale-110"
          style={{
            width: 24,
            height: 24,
            background: `color-mix(in srgb, ${roleConfig.color} 15%, transparent)`,
            border: `1px solid color-mix(in srgb, ${roleConfig.color} 35%, transparent)`,
          }}
          title={`Viewing as ${roleConfig.name}`}
          aria-label={`Current role: ${roleConfig.name}`}
          data-role={role}
        >
          {roleConfig.icon}
        </span>
        {/* Theme toggle at bottom */}
        <div className="pt-1">
          <ThemeToggle />
        </div>
      </div>
    </aside>
  );
}
