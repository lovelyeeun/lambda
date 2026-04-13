"use client";

import { createContext, useContext, useState, useCallback, type ReactNode } from "react";

export interface PanelMeta {
  /** 현재 페이지 라벨 — 자식 페이지일 때 표시 (예: "장바구니", "품의 진행") */
  label?: string;
  /** 루트로 돌아가는 콜백 — 제공되면 자식 페이지로 취급되어 헤더에 "← 구매 컨텍스트" 백 버튼 노출 */
  onBack?: () => void;
}

/** Work Item 칩 스위처 — 패널 최상단에 모드와 무관하게 항상 떠 있음 */
export interface WorkItemStripItem {
  id: string;
  title: string;
  color: string;
  /** 상태 나타내는 짧은 라벨 (예: "배송중", "완료") — 옵션 */
  statusLabel?: string;
}

export interface WorkItemStrip {
  items: WorkItemStripItem[];
  activeId: string | null;
  onSwitch: (id: string) => void;
}

interface RightPanelState {
  open: boolean;
  content: ReactNode | null;
  contentKey: string | null;
  meta: PanelMeta | null;
  workItemStrip: WorkItemStrip | null;
  openPanel: (content: ReactNode, key?: string, meta?: PanelMeta) => void;
  closePanel: () => void;
  togglePanel: () => void;
  setWorkItemStrip: (strip: WorkItemStrip | null) => void;
}

const RightPanelContext = createContext<RightPanelState | null>(null);

export function RightPanelProvider({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false);
  const [content, setContent] = useState<ReactNode | null>(null);
  const [contentKey, setContentKey] = useState<string | null>(null);
  const [meta, setMeta] = useState<PanelMeta | null>(null);
  const [workItemStrip, setWorkItemStripState] = useState<WorkItemStrip | null>(null);

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

  const setWorkItemStrip = useCallback((strip: WorkItemStrip | null) => {
    setWorkItemStripState(strip);
  }, []);

  return (
    <RightPanelContext.Provider value={{ open, content, contentKey, meta, workItemStrip, openPanel, closePanel, togglePanel, setWorkItemStrip }}>
      {children}
    </RightPanelContext.Provider>
  );
}

export function useRightPanel() {
  const ctx = useContext(RightPanelContext);
  if (!ctx) throw new Error("useRightPanel must be used within RightPanelProvider");
  return ctx;
}

