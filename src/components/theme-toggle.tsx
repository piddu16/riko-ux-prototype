"use client";

import { useEffect, useState } from "react";
import { Sun, Moon } from "lucide-react";

export function ThemeToggle() {
  const [isDark, setIsDark] = useState(true);

  useEffect(() => {
    const stored = localStorage.getItem("riko-theme");
    if (stored === "light") {
      document.documentElement.setAttribute("data-theme", "light");
      setIsDark(false);
    } else {
      document.documentElement.removeAttribute("data-theme");
      setIsDark(true);
    }
  }, []);

  const toggle = () => {
    const next = isDark ? "light" : "dark";
    if (next === "light") {
      document.documentElement.setAttribute("data-theme", "light");
    } else {
      document.documentElement.removeAttribute("data-theme");
    }
    localStorage.setItem("riko-theme", next);
    setIsDark(!isDark);
  };

  return (
    <button
      onClick={toggle}
      className="flex items-center justify-center w-8 h-8 rounded-lg transition-colors cursor-pointer"
      style={{ color: "var(--text-3)", background: "var(--bg-hover)" }}
      aria-label="Toggle theme"
    >
      {isDark ? <Sun size={16} /> : <Moon size={16} />}
    </button>
  );
}
