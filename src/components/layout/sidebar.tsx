"use client";

import {
  LayoutDashboard,
  MessageSquare,
  ArrowDownToLine,
  BookOpen,
  TrendingUp,
  Package,
  FileText,
  Users,
  Settings,
} from "lucide-react";
import { ThemeToggle } from "../theme-toggle";

const navItems = [
  { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
  { id: "chat", label: "Chat", icon: MessageSquare },
  { id: "clients", label: "Clients", icon: Users },
  { id: "outstanding", label: "Outstanding", icon: ArrowDownToLine },
  { id: "daybook", label: "Day Book", icon: BookOpen },
  { id: "sales", label: "Sales", icon: TrendingUp },
  { id: "inventory", label: "Inventory", icon: Package },
  { id: "reports", label: "Reports", icon: FileText },
  { id: "settings", label: "Settings", icon: Settings },
] as const;

export type TabId = (typeof navItems)[number]["id"];

interface SidebarProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
}

export function Sidebar({ activeTab, onTabChange }: SidebarProps) {
  return (
    <aside
      className="hidden md:flex flex-col items-center py-4 fixed left-0 top-0 h-full z-40"
      style={{
        width: 56,
        background: "var(--bg-secondary)",
        borderRight: "1px solid var(--border)",
      }}
    >
      {/* Logo */}
      <div
        className="w-8 h-8 rounded-lg flex items-center justify-center mb-6 flex-shrink-0"
        style={{
          background: "linear-gradient(135deg, var(--green), var(--green-dark))",
        }}
      >
        <span className="text-white text-sm font-bold">R</span>
      </div>

      {/* Nav items */}
      <nav className="flex-1 flex flex-col items-center gap-1 w-full px-1.5">
        {navItems.map(({ id, label, icon: Icon }) => {
          const active = activeTab === id;
          return (
            <button
              key={id}
              onClick={() => onTabChange(id)}
              className="relative flex flex-col items-center justify-center w-full py-2 rounded-lg transition-colors cursor-pointer group"
              style={{
                background: active
                  ? "color-mix(in srgb, var(--green) 15%, transparent)"
                  : "transparent",
              }}
              title={label}
            >
              {/* Active left border */}
              {active && (
                <div
                  className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-5 rounded-r"
                  style={{ background: "var(--green)" }}
                />
              )}
              <Icon
                size={18}
                style={{ color: active ? "var(--green)" : "var(--text-3)" }}
              />
              <span
                className="text-[9px] mt-0.5 leading-tight"
                style={{ color: active ? "var(--green)" : "var(--text-4)" }}
              >
                {label}
              </span>
            </button>
          );
        })}
      </nav>

      {/* Theme toggle at bottom */}
      <div className="mt-auto pt-2">
        <ThemeToggle />
      </div>
    </aside>
  );
}
