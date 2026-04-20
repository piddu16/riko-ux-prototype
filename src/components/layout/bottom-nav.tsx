"use client";

import {
  LayoutDashboard,
  MessageSquare,
  ArrowDownToLine,
  FileText,
  MoreHorizontal,
  FileSpreadsheet,
  TrendingUp,
  Package,
  BookOpen,
  Landmark,
  Building,
  Users,
  type LucideIcon,
} from "lucide-react";
import { useRbac } from "@/lib/rbac-context";
import { ROLES } from "@/lib/rbac";

const MORE_TAB_ID = "__more__";

/** Metadata for every tab that can appear in the bottom nav. Shorter
 *  labels work better in the 60px-tall nav — "Home" reads cleaner than
 *  "Dashboard", "AR/AP" cleaner than "Outstanding". */
const TAB_META: Record<string, { label: string; icon: LucideIcon }> = {
  dashboard: { label: "Home", icon: LayoutDashboard },
  chat: { label: "Chat", icon: MessageSquare },
  outstanding: { label: "AR/AP", icon: ArrowDownToLine },
  reports: { label: "Reports", icon: FileText },
  entries: { label: "Entries", icon: FileSpreadsheet },
  sales: { label: "Sales", icon: TrendingUp },
  inventory: { label: "Stock", icon: Package },
  daybook: { label: "Day Book", icon: BookOpen },
  gst: { label: "GST", icon: Landmark },
  bankrecon: { label: "Bank", icon: Building },
  clients: { label: "Clients", icon: Users },
};

/** Role-aware preference order for the quick tabs. The role's
 *  homeTab always comes first so it's always one tap away; remaining
 *  slots pull from the fallback list (most-used workflows by role). */
const FALLBACK_ORDER: Record<string, string[]> = {
  admin:            ["chat", "outstanding", "entries", "reports"],
  "accounts-head":  ["chat", "outstanding", "reports", "dashboard"],
  accounts:         ["chat", "outstanding", "reports", "dashboard"],
  "junior-accounts":["chat", "outstanding", "dashboard", "reports"],
  manager:          ["chat", "outstanding", "sales", "reports"],
  sales:            ["chat", "outstanding", "dashboard", "reports"],
  "field-sales":    ["chat", "outstanding", "sales", "dashboard"],
  viewer:           ["chat", "outstanding", "reports", "dashboard"],
};

/** Pick 4 quick tabs for a role — homeTab first, then fill from the
 *  role's fallback preference (skipping tabs they can't see). */
function pickBottomTabs(role: string, canSee: (id: string) => boolean): string[] {
  const homeTab = ROLES[role as keyof typeof ROLES]?.homeTab ?? "dashboard";
  const picks: string[] = canSee(homeTab) ? [homeTab] : [];
  const fallback = FALLBACK_ORDER[role] ?? FALLBACK_ORDER.admin;
  for (const id of fallback) {
    if (picks.length >= 4) break;
    if (picks.includes(id)) continue;
    if (canSee(id)) picks.push(id);
  }
  // Final safety net: if we're still short, pull from the full meta list.
  if (picks.length < 4) {
    for (const id of Object.keys(TAB_META)) {
      if (picks.length >= 4) break;
      if (picks.includes(id)) continue;
      if (canSee(id)) picks.push(id);
    }
  }
  return picks;
}

interface BottomNavProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
  onOpenMore: () => void;
}

export function BottomNav({ activeTab, onTabChange, onOpenMore }: BottomNavProps) {
  const { canSee, role } = useRbac();
  const quickTabIds = pickBottomTabs(role, canSee);

  /* Highlight "More" only when the active tab isn't one of our 4 quick
     tabs. This way a role whose homeTab IS in the quick tabs gets the
     correct active indicator instead of "More" lighting up. */
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
      {quickTabIds.map((id) => {
        const meta = TAB_META[id] ?? { label: id, icon: LayoutDashboard };
        const Icon = meta.icon;
        const active = activeTab === id;
        return (
          <button
            key={id}
            onClick={() => onTabChange(id)}
            className="flex flex-col items-center justify-center flex-1 py-2 transition-colors cursor-pointer"
            aria-label={meta.label}
            aria-current={active ? "page" : undefined}
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
              {meta.label}
            </span>
          </button>
        );
      })}
      {/* More drawer — always last, always visible. Highlights when the
         active tab isn't one of the 4 quick picks. */}
      <button
        key={MORE_TAB_ID}
        onClick={onOpenMore}
        className="flex flex-col items-center justify-center flex-1 py-2 transition-colors cursor-pointer"
        aria-label="More sections"
      >
        <div
          className="w-1 h-1 rounded-full mb-1"
          style={{ background: !activeInQuick ? "var(--green)" : "transparent" }}
        />
        <MoreHorizontal size={20} style={{ color: !activeInQuick ? "var(--green)" : "var(--text-4)" }} />
        <span
          className="text-[10px] mt-0.5"
          style={{ color: !activeInQuick ? "var(--green)" : "var(--text-4)" }}
        >
          More
        </span>
      </button>
    </nav>
  );
}
