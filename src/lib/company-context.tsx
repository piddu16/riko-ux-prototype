"use client";

import { createContext, useContext, useState, ReactNode } from "react";
import { COMPANY as DEFAULT_COMPANY, CLIENTS } from "./data";

type CompanyInfo = {
  name: string;
  shortName: string;
  industry: string;
  fy: string;
  tag: string;
  id: number;
  healthScore?: number;
};

type CompanyContextValue = {
  current: CompanyInfo;
  setCurrent: (c: CompanyInfo) => void;
  resetToDefault: () => void;
  isCustomSelection: boolean;
};

const CompanyContext = createContext<CompanyContextValue | null>(null);

const DEFAULT: CompanyInfo = {
  name: DEFAULT_COMPANY.name,
  shortName: DEFAULT_COMPANY.shortName,
  industry: DEFAULT_COMPANY.industry,
  fy: DEFAULT_COMPANY.fy,
  tag: DEFAULT_COMPANY.tag,
  id: DEFAULT_COMPANY.id,
  healthScore: 48,
};

/** Derive a CompanyInfo from a client row (CA portfolio). */
export function clientToCompany(client: (typeof CLIENTS)[number]): CompanyInfo {
  return {
    name: client.name,
    shortName: client.name.replace(/ (Pvt Ltd|Private Limited|Ltd|Pvt)$/i, ""),
    industry: client.industry,
    fy: "FY 2024-25",
    tag: client.industry.split(" ")[0] ?? "SMB",
    id: client.id,
    healthScore: client.healthScore,
  };
}

export function CompanyProvider({ children }: { children: ReactNode }) {
  const [current, setCurrent] = useState<CompanyInfo>(DEFAULT);

  const resetToDefault = () => setCurrent(DEFAULT);
  const isCustomSelection = current.id !== DEFAULT.id;

  return (
    <CompanyContext.Provider value={{ current, setCurrent, resetToDefault, isCustomSelection }}>
      {children}
    </CompanyContext.Provider>
  );
}

export function useCompany() {
  const ctx = useContext(CompanyContext);
  if (!ctx) throw new Error("useCompany must be used within CompanyProvider");
  return ctx;
}
