"use client";

import {
  LayoutDashboard,
  MessageSquare,
  ArrowDownToLine,
  FileText,
  MoreHorizontal,
  type LucideIcon,
} from "lucide-react";
import { useRbac } from "@/lib/rbac-context";

const MORE_TAB_ID = "__more__";

const tabs: { id: string; label: string; icon: LucideIcon }[] = [
  { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
  { id: "chat", label: "Chat", icon: MessageSquare },
  { id: "outstanding", label: "AR/AP", icon: ArrowDownToLine },
  { id: "reports", label: "Reports", icon: FileText },
  { id: MORE_TAB_ID, label: "More", icon: MoreHorizontal },
];

interface BottomNavProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
  onOpenMore: () => void;
}

export function BottomNav({ activeTab, onTabChange, onOpenMore }: BottomNavProps) {
  const { canSee } = useRbac();
  /* Filter by permission, but always keep the "More" drawer entry. */
  const visibleTabs = tabs.filter((t) => t.id === MORE_TAB_ID || canSee(t.id));

  /* Highlight "More" when the user is on any section that isn't one of the
     4 quick-access tabs — so they can visually confirm their place. */
  const quickTabIds = tabs.filter((t) => t.id !== MORE_TAB_ID).map((t) => t.id);
  const activeInQuick = quickTabIds.includes(activeTab);

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
      {visibleTabs.map(({ id, label, icon: Icon }) => {
        const isMore = id === MORE_TAB_ID;
        const active = isMore ? !activeInQuick : activeTab === id;
        return (
          <button
            key={id}
            onClick={() => (isMore ? onOpenMore() : onTabChange(id))}
            className="flex flex-col items-center justify-center flex-1 py-2 transition-colors cursor-pointer"
          >
            <div
              className="w-1 h-1 rounded-full mb-1"
              style={{ background: active ? "var(--green)" : "transparent" }}
            />
            <Icon size={20} style={{ color: active ? "var(--green)" : "var(--text-4)" }} />
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
