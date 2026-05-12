"use client";

/* ═══════════════════════════════════════════════════════════════
   useAutoReminderEnabled — shared on/off state for the Auto
   Reminder feature across the app.

   Why a custom hook (not just useState):
   - The Outstanding screen's AutoReminderHero has its own toggle
     switch, and the Settings → Reminders master toggle also flips
     the same flag. Both should reflect the same value live.
   - Persist across reloads (founder turns it on, refreshes, stays
     on) without needing a backend.

   Storage: localStorage (key `riko:auto-reminder-enabled`).
   Live sync within a tab: window CustomEvent (`riko:auto-reminder-changed`).
   Cross-tab sync: native `storage` event.

   In production this would be a server-side flag persisted per
   tenant. The hook keeps the same call shape, so swapping the
   implementation later is one file change.
   ═══════════════════════════════════════════════════════════════ */

import { useCallback, useEffect, useState } from "react";
import { REMINDER_AUTOMATION_DEFAULTS } from "@/lib/data";

const STORAGE_KEY = "riko:auto-reminder-enabled";
const EVENT_NAME = "riko:auto-reminder-changed";

/** Read the persisted value, falling back to the data-layer default. */
function readInitial(): boolean {
  if (typeof window === "undefined") return REMINDER_AUTOMATION_DEFAULTS.enabled;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (raw === null) return REMINDER_AUTOMATION_DEFAULTS.enabled;
    return raw === "true";
  } catch {
    return REMINDER_AUTOMATION_DEFAULTS.enabled;
  }
}

export function useAutoReminderEnabled(): readonly [boolean, (next: boolean) => void] {
  // SSR-safe: defer reading localStorage until after mount.
  const [enabled, setEnabledState] = useState<boolean>(REMINDER_AUTOMATION_DEFAULTS.enabled);

  // Hydrate from localStorage on mount (avoids hydration mismatch).
  useEffect(() => {
    setEnabledState(readInitial());
  }, []);

  // Same-tab live sync: listen for the custom event.
  useEffect(() => {
    const handler = (e: Event) => {
      const ce = e as CustomEvent<boolean>;
      if (typeof ce.detail === "boolean") setEnabledState(ce.detail);
    };
    window.addEventListener(EVENT_NAME, handler);
    return () => window.removeEventListener(EVENT_NAME, handler);
  }, []);

  // Cross-tab sync: native storage event.
  useEffect(() => {
    const handler = (e: StorageEvent) => {
      if (e.key === STORAGE_KEY && e.newValue !== null) {
        setEnabledState(e.newValue === "true");
      }
    };
    window.addEventListener("storage", handler);
    return () => window.removeEventListener("storage", handler);
  }, []);

  const setEnabled = useCallback((next: boolean) => {
    setEnabledState(next);
    try {
      window.localStorage.setItem(STORAGE_KEY, String(next));
      window.dispatchEvent(new CustomEvent(EVENT_NAME, { detail: next }));
    } catch {
      // localStorage can throw in private mode / quota exceeded — fail
      // silently. The local React state is still updated so the current
      // screen reflects the change; just won't survive a refresh.
    }
  }, []);

  return [enabled, setEnabled] as const;
}
