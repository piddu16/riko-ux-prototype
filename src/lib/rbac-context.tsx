"use client";

import { createContext, useContext, useState, useEffect, useCallback, useMemo, ReactNode } from "react";
import { ROLES, type Role, type Permission, hasPerm, hasAnyPerm, canSeeTab } from "./rbac";

type RbacContextValue = {
  role: Role;
  setRole: (r: Role) => void;
  can: (perm: Permission) => boolean;
  canAny: (perms: Permission[]) => boolean;
  canSee: (tabId: string) => boolean;
  roleConfig: (typeof ROLES)[Role];
};

const RbacContext = createContext<RbacContextValue | null>(null);

export function RbacProvider({ children }: { children: ReactNode }) {
  const [role, setRoleState] = useState<Role>("admin");

  useEffect(() => {
    const stored = typeof window !== "undefined" ? localStorage.getItem("riko-role") : null;
    if (stored && stored in ROLES) setRoleState(stored as Role);
  }, []);

  const setRole = useCallback((r: Role) => {
    setRoleState(r);
    if (typeof window !== "undefined") localStorage.setItem("riko-role", r);
  }, []);

  /* Stable callbacks keyed on role — prevents useEffect consumers from
     running on every parent render. */
  const can = useCallback((perm: Permission) => hasPerm(role, perm), [role]);
  const canAny = useCallback((perms: Permission[]) => hasAnyPerm(role, perms), [role]);
  const canSee = useCallback((tabId: string) => canSeeTab(role, tabId), [role]);

  const value = useMemo<RbacContextValue>(() => ({
    role,
    setRole,
    can,
    canAny,
    canSee,
    roleConfig: ROLES[role],
  }), [role, setRole, can, canAny, canSee]);

  return <RbacContext.Provider value={value}>{children}</RbacContext.Provider>;
}

export function useRbac() {
  const ctx = useContext(RbacContext);
  if (!ctx) throw new Error("useRbac must be used within RbacProvider");
  return ctx;
}
