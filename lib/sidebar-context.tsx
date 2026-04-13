"use client";

import { createContext, useContext, useState, useCallback } from "react";

interface SidebarState {
  expanded: boolean;
  hidden: boolean;
  toggle: () => void;
  setHidden: (v: boolean) => void;
}

const SidebarContext = createContext<SidebarState | null>(null);

export function SidebarProvider({ children }: { children: React.ReactNode }) {
  const [expanded, setExpanded] = useState(true);
  const [hidden, setHidden] = useState(false);
  const toggle = useCallback(() => setExpanded((v) => !v), []);

  return (
    <SidebarContext.Provider value={{ expanded, hidden, toggle, setHidden }}>
      {children}
    </SidebarContext.Provider>
  );
}

export function useSidebar() {
  const ctx = useContext(SidebarContext);
  if (!ctx) throw new Error("useSidebar must be used within SidebarProvider");
  return ctx;
}
