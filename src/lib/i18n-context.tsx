"use client";

import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { I18N, type Lang } from "./data";

type I18nContextValue = {
  lang: Lang;
  setLang: (lang: Lang) => void;
  t: (typeof I18N)[Lang];
};

const I18nContext = createContext<I18nContextValue | null>(null);

export function I18nProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Lang>("en");

  useEffect(() => {
    const stored = typeof window !== "undefined" ? localStorage.getItem("riko-lang") : null;
    if (stored === "hi" || stored === "en") setLangState(stored);
  }, []);

  const setLang = (l: Lang) => {
    setLangState(l);
    if (typeof window !== "undefined") localStorage.setItem("riko-lang", l);
  };

  return (
    <I18nContext.Provider value={{ lang, setLang, t: I18N[lang] }}>
      {children}
    </I18nContext.Provider>
  );
}

export function useI18n() {
  const ctx = useContext(I18nContext);
  if (!ctx) throw new Error("useI18n must be used within I18nProvider");
  return ctx;
}
