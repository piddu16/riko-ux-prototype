"use client";

import { createContext, useContext, useState, useEffect, ReactNode } from "react";
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

  const setRole = (r: Role) => {
    setRoleState(r);
    if (typeof window !== "undefined") localStorage.setItem("riko-role", r);
  };

  const value: RbacContextValue = {
    role,
    setRole,
    can: (perm) => hasPerm(role, perm),
    canAny: (perms) => hasAnyPerm(role, perms),
    canSee: (tabId) => canSeeTab(role, tabId),
    roleConfig: ROLES[role],
  };

  return <RbacContext.Provider value={value}>{children}</RbacContext.Provider>;
}

export function useRbac() {
  const ctx = useContext(RbacContext);
  if (!ctx) throw new Error("useRbac must be used within RbacProvider");
  return ctx;
}
