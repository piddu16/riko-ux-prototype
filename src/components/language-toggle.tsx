"use client";

import { useI18n } from "@/lib/i18n-context";

export function LanguageToggle() {
  const { lang, setLang } = useI18n();

  return (
    <div
      className="flex items-center rounded-lg overflow-hidden text-[10px] font-bold cursor-pointer"
      style={{
        background: "var(--bg-surface)",
        border: "1px solid var(--border)",
      }}
    >
      {(["en", "hi"] as const).map((l) => {
        const active = lang === l;
        return (
          <button
            key={l}
            onClick={() => setLang(l)}
            className="px-2 py-1 transition-colors"
            style={{
              background: active ? "var(--green)" : "transparent",
              color: active ? "#fff" : "var(--text-3)",
            }}
          >
            {l === "en" ? "EN" : "हिं"}
          </button>
        );
      })}
    </div>
  );
}
