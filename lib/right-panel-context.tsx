"use client";

import { createContext, useContext, useState, useCallback, type ReactNode } from "react";

interface RightPanelState {
  open: boolean;
  content: ReactNode | null;
  openPanel: (content: ReactNode) => void;
  closePanel: () => void;
  togglePanel: () => void;
}

const RightPanelContext = createContext<RightPanelState | null>(null);

export function RightPanelProvider({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false);
  const [content, setContent] = useState<ReactNode | null>(null);

  const openPanel = useCallback((node: ReactNode) => {
    setContent(node);
    setOpen(true);
  }, []);

  const closePanel = useCallback(() => {
    setOpen(false);
  }, []);

  const togglePanel = useCallback(() => {
    setOpen((prev) => !prev);
  }, []);

  return (
    <RightPanelContext.Provider value={{ open, content, openPanel, closePanel, togglePanel }}>
      {children}
    </RightPanelContext.Provider>
  );
}

export function useRightPanel() {
  const ctx = useContext(RightPanelContext);
  if (!ctx) throw new Error("useRightPanel must be used within RightPanelProvider");
  return ctx;
}
