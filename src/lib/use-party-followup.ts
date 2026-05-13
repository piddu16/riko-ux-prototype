"use client";

/* ═══════════════════════════════════════════════════════════════
   usePartyFollowUpMap — overlay per-party follow-up + remark on
   top of the static RECEIVABLES array.

   Why a map hook (not per-party):
   - Outstanding table renders 20+ rows in a .map(). Calling a
     hook inside the loop would violate Rules of Hooks. So we
     expose the full map at the top of the screen, and each row
     looks up its own override inline.

   Storage: localStorage at `riko:party-followup` (JSON map of
   partyName → { nextFollowUpDate?, remark? }).
   Live sync within a tab: CustomEvent `riko:party-followup-changed`.
   Cross-tab sync: native storage event.

   Effective value rule: if the override has the key explicitly
   set (even to empty string), use it. Otherwise fall back to the
   default from RECEIVABLES. Empty string in override = user
   cleared the value, render as if undefined.
   ═══════════════════════════════════════════════════════════════ */

import { useCallback, useEffect, useState } from "react";

const STORAGE_KEY = "riko:party-followup";
const EVENT_NAME = "riko:party-followup-changed";

export interface PartyFollowUp {
  nextFollowUpDate?: string;
  remark?: string;
}

export type PartyFollowUpMap = Record<string, PartyFollowUp>;

function readMap(): PartyFollowUpMap {
  if (typeof window === "undefined") return {};
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw);
    return typeof parsed === "object" && parsed !== null ? parsed : {};
  } catch {
    return {};
  }
}

/** Resolve effective follow-up state for one party by merging the
 *  override (if any) on top of the default from RECEIVABLES.
 *
 *  Empty string in the override means the user explicitly cleared
 *  the value — return undefined so callers can render the "+ Add"
 *  affordance instead of an empty label. */
export function resolveFollowUp(
  defaults: PartyFollowUp,
  override: PartyFollowUp | undefined,
): PartyFollowUp {
  if (!override) return defaults;
  return {
    nextFollowUpDate:
      override.nextFollowUpDate !== undefined
        ? override.nextFollowUpDate || undefined
        : defaults.nextFollowUpDate,
    remark:
      override.remark !== undefined
        ? override.remark || undefined
        : defaults.remark,
  };
}

export function usePartyFollowUpMap(): readonly [
  map: PartyFollowUpMap,
  setFollowUp: (partyName: string, next: PartyFollowUp) => void,
] {
  // SSR-safe: start empty, hydrate after mount.
  const [overrides, setOverrides] = useState<PartyFollowUpMap>({});

  useEffect(() => {
    setOverrides(readMap());
  }, []);

  // Same-tab live sync — any row save reaches every row.
  useEffect(() => {
    const handler = () => setOverrides(readMap());
    window.addEventListener(EVENT_NAME, handler);
    return () => window.removeEventListener(EVENT_NAME, handler);
  }, []);

  // Cross-tab sync.
  useEffect(() => {
    const handler = (e: StorageEvent) => {
      if (e.key === STORAGE_KEY) setOverrides(readMap());
    };
    window.addEventListener("storage", handler);
    return () => window.removeEventListener("storage", handler);
  }, []);

  const setFollowUp = useCallback(
    (partyName: string, next: PartyFollowUp) => {
      const current = readMap();
      const updated: PartyFollowUpMap = { ...current, [partyName]: next };
      setOverrides(updated);
      try {
        window.localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
        window.dispatchEvent(new CustomEvent(EVENT_NAME));
      } catch {
        // localStorage can throw in private mode / quota exceeded — fail
        // silently. In-memory state still updates.
      }
    },
    [],
  );

  return [overrides, setFollowUp] as const;
}
