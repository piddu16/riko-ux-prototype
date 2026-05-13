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

/* ═══════════════════════════════════════════════════════════════
   usePartyReminderEnrollment — per-party enrollment state.

   The master toggle (above) controls "auto-reminders ON for this
   tenant." Per-party enrollment lets the user say "but skip Klub
   Works" or "include Surat Apparel" within that.

   Default policy: a party is considered enrolled when:
   - The master toggle is ON, AND
   - The party's eligibility verdict is "enabled" (auto-bucket), OR
   - The user explicitly opted them in (via Set auto-reminder modal)

   Locks override everything: a party with verdict "locked" cannot
   be enrolled, no matter what the user clicks. The per-party modal
   shows the lock reason in that case and disables the toggle.

   Storage: a JSON map of partyName → boolean override. Empty map
   means "use eligibility defaults." Explicit entry means "user
   overrode the default."

   ═══════════════════════════════════════════════════════════════ */

const PARTY_STORAGE_KEY = "riko:party-reminder-enrollment";
const PARTY_EVENT_NAME = "riko:party-reminder-changed";

type PartyEnrollmentMap = Record<string, boolean>;

function readPartyEnrollment(): PartyEnrollmentMap {
  if (typeof window === "undefined") return {};
  try {
    const raw = window.localStorage.getItem(PARTY_STORAGE_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw);
    return typeof parsed === "object" && parsed !== null ? parsed : {};
  } catch {
    return {};
  }
}

/** Per-party enrollment override hook.
 *  Returns [enrolled, setEnrolled] where `enrolled` reflects the
 *  effective enrollment state given the master toggle, the party's
 *  eligibility verdict, and any user override stored locally.
 *
 *  Callers pass the partyName + the eligibility verdict so the hook
 *  can apply lock policies before persisting an override. */
export function usePartyReminderEnrollment(
  partyName: string,
  verdict: "enabled" | "needs-review" | "locked",
): readonly [
  enrolled: boolean,
  hasOverride: boolean,
  setEnrolled: (next: boolean) => void,
] {
  const [masterEnabled] = useAutoReminderEnabled();
  const [overrides, setOverrides] = useState<PartyEnrollmentMap>({});

  // Hydrate on mount.
  useEffect(() => {
    setOverrides(readPartyEnrollment());
  }, []);

  // Same-tab live sync.
  useEffect(() => {
    const handler = () => setOverrides(readPartyEnrollment());
    window.addEventListener(PARTY_EVENT_NAME, handler);
    return () => window.removeEventListener(PARTY_EVENT_NAME, handler);
  }, []);

  // Cross-tab sync.
  useEffect(() => {
    const handler = (e: StorageEvent) => {
      if (e.key === PARTY_STORAGE_KEY) setOverrides(readPartyEnrollment());
    };
    window.addEventListener("storage", handler);
    return () => window.removeEventListener("storage", handler);
  }, []);

  const hasOverride = Object.prototype.hasOwnProperty.call(overrides, partyName);
  const overrideValue = overrides[partyName];

  // Effective enrollment: locks always win, then user override, then
  // eligibility-verdict default.
  let enrolled = false;
  if (verdict === "locked") {
    enrolled = false;
  } else if (!masterEnabled) {
    enrolled = false;
  } else if (hasOverride) {
    enrolled = overrideValue;
  } else {
    enrolled = verdict === "enabled";
  }

  const setEnrolled = useCallback(
    (next: boolean) => {
      // Locks cannot be overridden — caller should disable the UI
      // in this case, but defensive guard regardless.
      if (verdict === "locked") return;

      const updated = { ...readPartyEnrollment(), [partyName]: next };
      setOverrides(updated);
      try {
        window.localStorage.setItem(PARTY_STORAGE_KEY, JSON.stringify(updated));
        window.dispatchEvent(new CustomEvent(PARTY_EVENT_NAME));
      } catch {
        // Same as master hook — silent fail, in-memory state still updates.
      }
    },
    [partyName, verdict],
  );

  return [enrolled, hasOverride, setEnrolled] as const;
}

