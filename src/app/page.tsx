"use client";

import { useState } from "react";
import { Sidebar, type TabId } from "@/components/layout/sidebar";
import { BottomNav } from "@/components/layout/bottom-nav";
import Dashboard from "@/components/screens/dashboard";
import { ChatScreen as Chat } from "@/components/screens/chat";
import Outstandings from "@/components/screens/outstandings";
import { DaybookScreen as DayBook } from "@/components/screens/daybook";
import { SalesScreen as Sales } from "@/components/screens/sales";
import { InventoryScreen as Inventory } from "@/components/screens/inventory";
import { ThemeToggle } from "@/components/theme-toggle";
import { COMPANY } from "@/lib/data";

const BOTTOM_MAP: Record<string, TabId> = {
  dashboard: "dashboard",
  chat: "chat",
  outstanding: "outstanding",
  insights: "sales",
  more: "dashboard",
};

export default function Home() {
  const [tab, setTab] = useState<TabId>("dashboard");

  const handleBottomNav = (id: string) => {
    setTab(BOTTOM_MAP[id] || "dashboard");
  };

  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar activeTab={tab} onTabChange={(id) => setTab(id as TabId)} />

      <main className="flex-1 overflow-y-auto pb-16 md:pb-0">
        <header
          className="sticky top-0 z-40 flex items-center justify-between px-4 py-3 backdrop-blur-lg md:px-6"
          style={{
            background: "color-mix(in srgb, var(--bg-secondary) 80%, transparent)",
            borderBottom: "1px solid var(--border)",
          }}
        >
          <div className="flex items-center gap-3">
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
              className="hidden sm:inline rounded-md px-2 py-0.5 text-[10px] font-semibold"
              style={{ background: "var(--bg-surface)", color: "var(--text-3)", border: "1px solid var(--border)" }}
            >
              {COMPANY.tag}
            </span>
            <span
              className="hidden sm:inline rounded-md px-2 py-0.5 text-[10px] font-semibold"
              style={{ background: "var(--bg-surface)", color: "var(--text-3)", border: "1px solid var(--border)" }}
            >
              {COMPANY.fy.replace("FY ", "FY")}
            </span>
            <div className="md:hidden">
              <ThemeToggle />
            </div>
          </div>
        </header>

        <div className="p-4 md:p-6">
          {tab === "dashboard" && <Dashboard />}
          {tab === "chat" && <Chat />}
          {tab === "outstanding" && <Outstandings />}
          {tab === "daybook" && <DayBook />}
          {tab === "sales" && <Sales />}
          {tab === "inventory" && <Inventory />}
          {tab === "reports" && (
            <div className="flex flex-col items-center justify-center py-20" style={{ color: "var(--text-3)" }}>
              <span className="text-4xl mb-4">📋</span>
              <p className="text-lg font-semibold">Reports</p>
              <p className="text-sm mt-1">Coming soon</p>
            </div>
          )}
          {tab === "settings" && (
            <div className="flex flex-col items-center justify-center py-20" style={{ color: "var(--text-3)" }}>
              <span className="text-4xl mb-4">⚙️</span>
              <p className="text-lg font-semibold">Settings</p>
              <p className="text-sm mt-1">Coming soon</p>
            </div>
          )}
        </div>
      </main>

      <BottomNav activeTab={tab === "sales" ? "insights" : tab} onTabChange={handleBottomNav} />
    </div>
  );
}
