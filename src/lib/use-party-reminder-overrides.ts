"use client";

/* ═══════════════════════════════════════════════════════════════
   usePartyReminderOverridesMap — per-party overrides for the
   global reminder defaults.

   Inspired by Credflow's per-party "Advance Settings" modal which
   lets the operator override payment terms, reminder frequency,
   channel preferences, and account-manager assignment on a single
   party. Riko's global defaults still apply unless an override is
   explicitly set.

   Map shape (localStorage at `riko:party-reminder-overrides`):
   {
     "Nykaa": { paymentTermsDays: 45, frequencyDays: 7, ... },
     "Klub Works": { channels: ["email"], accountManagerId: "u2" }
   }

   Same Rules-of-Hooks-friendly map pattern as usePartyFollowUpMap:
   one hook at the screen root, per-row reads stay synchronous.

   Empty values (undefined / empty array) fall back to the global
   default at read time via `resolvePartyReminderOverrides`.
   ═══════════════════════════════════════════════════════════════ */

import { useCallback, useEffect, useState } from "react";
import type { ReminderChannel } from "@/lib/data";

const STORAGE_KEY = "riko:party-reminder-overrides";
const EVENT_NAME = "riko:party-reminder-overrides-changed";

export interface PartyReminderOverride {
  /** Override the party's payment terms (days). Falls back to
   *  Receivable.paymentTermsDays, then global defaults. */
  paymentTermsDays?: number;
  /** Override the global reminder cadence in days. */
  frequencyDays?: number;
  /** Channel preference for this party. Empty = use global default. */
  channels?: ReminderChannel[];
  /** Team-member id (from TEAM_MEMBERS) who owns this party's
   *  collections. Shows up as the From/Reply-to identity when set. */
  accountManagerId?: string;
}

export type PartyReminderOverridesMap = Record<string, PartyReminderOverride>;

function readMap(): PartyReminderOverridesMap {
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

/** Merge a party's override with its defaults. Empty override values
 *  fall through to defaults. */
export function resolvePartyReminderOverrides(
  defaults: PartyReminderOverride,
  override: PartyReminderOverride | undefined,
): PartyReminderOverride {
  if (!override) return defaults;
  return {
    paymentTermsDays:
      override.paymentTermsDays != null
        ? override.paymentTermsDays
        : defaults.paymentTermsDays,
    frequencyDays:
      override.frequencyDays != null ? override.frequencyDays : defaults.frequencyDays,
    channels:
      override.channels && override.channels.length > 0
        ? override.channels
        : defaults.channels,
    accountManagerId:
      override.accountManagerId !== undefined
        ? override.accountManagerId || undefined
        : defaults.accountManagerId,
  };
}

export function usePartyReminderOverridesMap(): readonly [
  map: PartyReminderOverridesMap,
  setOverride: (partyName: string, next: PartyReminderOverride) => void,
] {
  const [overrides, setOverrides] = useState<PartyReminderOverridesMap>({});

  useEffect(() => {
    setOverrides(readMap());
  }, []);

  useEffect(() => {
    const handler = () => setOverrides(readMap());
    window.addEventListener(EVENT_NAME, handler);
    return () => window.removeEventListener(EVENT_NAME, handler);
  }, []);

  useEffect(() => {
    const handler = (e: StorageEvent) => {
      if (e.key === STORAGE_KEY) setOverrides(readMap());
    };
    window.addEventListener("storage", handler);
    return () => window.removeEventListener("storage", handler);
  }, []);

  const setOverride = useCallback(
    (partyName: string, next: PartyReminderOverride) => {
      const current = readMap();
      const updated: PartyReminderOverridesMap = { ...current, [partyName]: next };
      setOverrides(updated);
      try {
        window.localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
        window.dispatchEvent(new CustomEvent(EVENT_NAME));
      } catch {
        // Silent fail — in-memory state still updates.
      }
    },
    [],
  );

  return [overrides, setOverride] as const;
}
