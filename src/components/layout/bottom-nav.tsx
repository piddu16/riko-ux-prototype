"use client";

import {
  LayoutDashboard,
  MessageSquare,
  Users,
  ArrowDownToLine,
  FileText,
} from "lucide-react";

const tabs = [
  { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
  { id: "chat", label: "Chat", icon: MessageSquare },
  { id: "clients", label: "Clients", icon: Users },
  { id: "outstanding", label: "AR/AP", icon: ArrowDownToLine },
  { id: "reports", label: "Reports", icon: FileText },
] as const;

interface BottomNavProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
}

export function BottomNav({ activeTab, onTabChange }: BottomNavProps) {
  return (
    <nav
      className="md:hidden fixed bottom-0 left-0 right-0 z-50 flex items-center justify-around"
      style={{
        background: "var(--bg-secondary)",
        borderTop: "1px solid var(--border)",
        paddingBottom: "env(safe-area-inset-bottom)",
        height: 60,
      }}
    >
      {tabs.map(({ id, label, icon: Icon }) => {
        const active = activeTab === id;
        return (
          <button
            key={id}
            onClick={() => onTabChange(id)}
            className="flex flex-col items-center justify-center flex-1 py-2 transition-colors cursor-pointer"
          >
            {/* Active dot */}
            <div
              className="w-1 h-1 rounded-full mb-1"
              style={{
                background: active ? "var(--green)" : "transparent",
              }}
            />
            <Icon
              size={20}
              style={{ color: active ? "var(--green)" : "var(--text-4)" }}
            />
            <span
              className="text-[10px] mt-0.5"
              style={{ color: active ? "var(--green)" : "var(--text-4)" }}
            >
              {label}
            </span>
          </button>
        );
      })}
    </nav>
  );
}
