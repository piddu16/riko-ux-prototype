"use client";

import { useEffect, useState } from "react";
import { Sidebar, type TabId } from "@/components/layout/sidebar";
import { BottomNav } from "@/components/layout/bottom-nav";
import { MoreDrawer } from "@/components/layout/more-drawer";
import Dashboard from "@/components/screens/dashboard";
import { ChatScreen as Chat } from "@/components/screens/chat";
import Outstandings from "@/components/screens/outstandings";
import { DaybookScreen as DayBook } from "@/components/screens/daybook";
import { SalesScreen as Sales } from "@/components/screens/sales";
import { InventoryScreen as Inventory } from "@/components/screens/inventory";
import { ReportsScreen as Reports } from "@/components/screens/reports";
import { ClientsScreen as Clients } from "@/components/screens/clients";
import { GstScreen as Gst } from "@/components/screens/gst";
import { TdsScreen as Tds } from "@/components/screens/tds";
import { BankReconScreen as BankRecon } from "@/components/screens/bank-recon";
import { SettingsScreen as Settings } from "@/components/screens/settings";
import { ThemeToggle } from "@/components/theme-toggle";
import { LanguageToggle } from "@/components/language-toggle";
import { RoleSwitcher } from "@/components/role-switcher";
import { useRbac } from "@/lib/rbac-context";
import { useCompany } from "@/lib/company-context";
import { ArrowLeft } from "lucide-react";

const BOTTOM_MAP: Record<string, TabId> = {
  dashboard: "dashboard",
  chat: "chat",
  clients: "clients",
  outstanding: "outstanding",
  reports: "reports",
};

export default function Home() {
  const [tab, setTab] = useState<TabId>("dashboard");
  const [moreOpen, setMoreOpen] = useState(false);
  // Cross-tab chat handoff: any screen can dispatch a question into Chat.
  // Example: clicking a Causal Chain node on Dashboard opens Chat with
  // "Why am I losing money?" already sent.
  const [pendingChatQuestion, setPendingChatQuestion] = useState<string | null>(null);
  const askRiko = (q: string) => {
    setPendingChatQuestion(q);
    setTab("chat");
  };
  const { role, canSee, roleConfig } = useRbac();
  const { current: COMPANY, resetToDefault, isCustomSelection } = useCompany();

  /* Only redirect when the ROLE changes, not when the tab changes.
     When the user navigates, the sidebar already filters to visible tabs —
     so any tab they can click is one they can see. Re-checking on tab
     change caused a race during hydration that bounced the user back. */
  useEffect(() => {
    if (!canSee(tab)) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setTab(roleConfig.homeTab as TabId);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [role]);

  const handleBottomNav = (id: string) => {
    setTab(BOTTOM_MAP[id] || "dashboard");
  };

  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar activeTab={tab} onTabChange={(id) => setTab(id as TabId)} />

      <main className="flex-1 overflow-y-auto pb-[calc(60px+env(safe-area-inset-bottom,0px))] md:pb-0 md:pl-[72px]">
        <header
          className="sticky top-0 z-40 flex items-center justify-between px-4 py-3 backdrop-blur-lg md:px-6"
          style={{
            background: "color-mix(in srgb, var(--bg-secondary) 80%, transparent)",
            borderBottom: "1px solid var(--border)",
          }}
        >
          <div className="flex items-center gap-3">
            {isCustomSelection && (
              <button
                onClick={() => { resetToDefault(); setTab("clients"); }}
                className="flex items-center gap-1 text-[11px] font-semibold px-2 py-1 rounded-md cursor-pointer transition-colors"
                style={{
                  background: "color-mix(in srgb, var(--purple) 15%, transparent)",
                  color: "var(--purple)",
                  border: "1px solid color-mix(in srgb, var(--purple) 30%, transparent)",
                }}
                title="Back to client portfolio"
              >
                <ArrowLeft size={12} />
                Portfolio
              </button>
            )}
            <div className="flex md:hidden h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-[#22C55E] to-[#15803D] text-xs font-extrabold text-white">
              R
            </div>
            <div>
              <h1 className="text-sm font-bold" style={{ color: "var(--text-1)" }}>
                {COMPANY.shortName}
              </h1>
              <p className="text-[10px]" style={{ color: "var(--text-4)" }}>
                {COMPANY.industry} · {COMPANY.fy}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span
              className="hidden lg:inline rounded-md px-2 py-0.5 text-[10px] font-semibold"
              style={{ background: "var(--bg-surface)", color: "var(--text-3)", border: "1px solid var(--border)" }}
            >
              {COMPANY.tag}
            </span>
            <span
              className="hidden lg:inline rounded-md px-2 py-0.5 text-[10px] font-semibold"
              style={{ background: "var(--bg-surface)", color: "var(--text-3)", border: "1px solid var(--border)" }}
            >
              {COMPANY.fy.replace("FY ", "FY")}
            </span>
            <RoleSwitcher />
            <LanguageToggle />
            <div className="md:hidden">
              <ThemeToggle />
            </div>
          </div>
        </header>

        <div className="p-4 md:p-6">
          {tab === "dashboard" && <Dashboard onAskRiko={askRiko} />}
          {tab === "chat" && (
            <Chat
              initialQuestion={pendingChatQuestion}
              onQuestionConsumed={() => setPendingChatQuestion(null)}
            />
          )}
          {tab === "clients" && <Clients />}
          {tab === "gst" && <Gst />}
          {tab === "tds" && <Tds />}
          {tab === "bankrecon" && <BankRecon />}
          {tab === "outstanding" && <Outstandings />}
          {tab === "daybook" && <DayBook />}
          {tab === "sales" && <Sales />}
          {tab === "inventory" && <Inventory />}
          {tab === "reports" && <Reports />}
          {tab === "settings" && <Settings />}
        </div>
      </main>

      <BottomNav
        activeTab={tab}
        onTabChange={handleBottomNav}
        onOpenMore={() => setMoreOpen(true)}
      />

      <MoreDrawer
        open={moreOpen}
        onClose={() => setMoreOpen(false)}
        activeTab={tab}
        onTabChange={(id) => setTab(id as TabId)}
      />
    </div>
  );
}
