"use client";

import { createContext, useContext, useState, useCallback, type ReactNode } from "react";

export interface PanelChip {
  label: string;
  onClick: () => void;
  icon?: ReactNode;
}

export interface PanelMeta {
  /** 패널 헤더에 표시할 현재 모드 라벨 */
  label?: string;
  /** 라벨 옆에 노출할 빠른 전환 chip들 (1~2개 권장) */
  chips?: PanelChip[];
}

interface RightPanelState {
  open: boolean;
  content: ReactNode | null;
  contentKey: string | null;
  meta: PanelMeta | null;
  openPanel: (content: ReactNode, key?: string, meta?: PanelMeta) => void;
  closePanel: () => void;
  togglePanel: () => void;
}

const RightPanelContext = createContext<RightPanelState | null>(null);

export function RightPanelProvider({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false);
  const [content, setContent] = useState<ReactNode | null>(null);
  const [contentKey, setContentKey] = useState<string | null>(null);
  const [meta, setMeta] = useState<PanelMeta | null>(null);

  const openPanel = useCallback((node: ReactNode, key?: string, m?: PanelMeta) => {
    setContent(node);
    setContentKey(key ?? null);
    setMeta(m ?? null);
    setOpen(true);
  }, []);

  const closePanel = useCallback(() => {
    setOpen(false);
  }, []);

  const togglePanel = useCallback(() => {
    setOpen((prev) => !prev);
  }, []);

  return (
    <RightPanelContext.Provider value={{ open, content, contentKey, meta, openPanel, closePanel, togglePanel }}>
      {children}
    </RightPanelContext.Provider>
  );
}

export function useRightPanel() {
  const ctx = useContext(RightPanelContext);
  if (!ctx) throw new Error("useRightPanel must be used within RightPanelProvider");
  return ctx;
}
