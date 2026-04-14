"use client";

import { createContext, useContext, useState, useCallback, useRef, type ReactNode } from "react";

export interface PanelMeta {
  /** 현재 페이지 라벨 — 헤더에 표시 (예: "작업 현황", "장바구니", "품의 진행"). 생략 시 빈 헤더 */
  label?: string;
  /** 루트로 돌아가는 콜백 — 제공되면 자식 페이지로 취급되어 헤더에 "← {backLabel}" 백 버튼 노출 */
  onBack?: () => void;
  /** 백 버튼에 표시할 루트 라벨 (예: "작업 현황"). `onBack`과 함께 사용. 생략 시 "뒤로" */
  backLabel?: string;
  /** 백 버튼 옆에 빨간 알림 점 표시 여부 — 자식 페이지에서 루트에 변화가 있음을 알릴 때 사용 */
  backBadge?: boolean;
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
  updateMeta: (patch: Partial<PanelMeta>) => void;
  setWorkItemStrip: (strip: WorkItemStrip | null) => void;
  /** 페이지별 "루트 콘텐츠 복구" 콜백 등록 — 패널이 콘텐츠 없이 열릴 때 호출됨.
   *  반환된 함수를 cleanup 시 호출하면 해제됨. */
  registerDefaultOpener: (fn: () => void) => () => void;
}

const RightPanelContext = createContext<RightPanelState | null>(null);

export function RightPanelProvider({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false);
  const [content, setContent] = useState<ReactNode | null>(null);
  const [contentKey, setContentKey] = useState<string | null>(null);
  const [meta, setMeta] = useState<PanelMeta | null>(null);
  const [workItemStrip, setWorkItemStripState] = useState<WorkItemStrip | null>(null);
  const defaultOpenerRef = useRef<(() => void) | null>(null);

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
    setOpen((prev) => {
      const willOpen = !prev;
      // 열려고 하는데 아직 콘텐츠가 없으면 등록된 기본 오프너로 루트 복원
      if (willOpen && !content && defaultOpenerRef.current) {
        // state 업데이트 중엔 직접 호출하지 않고 마이크로태스크로 지연
        queueMicrotask(() => defaultOpenerRef.current?.());
      }
      return willOpen;
    });
  }, [content]);

  const updateMeta = useCallback((patch: Partial<PanelMeta>) => {
    setMeta((prev) => prev ? { ...prev, ...patch } : patch);
  }, []);

  const registerDefaultOpener = useCallback((fn: () => void) => {
    defaultOpenerRef.current = fn;
    return () => {
      if (defaultOpenerRef.current === fn) defaultOpenerRef.current = null;
    };
  }, []);

  const setWorkItemStrip = useCallback((strip: WorkItemStrip | null) => {
    setWorkItemStripState(strip);
  }, []);

  return (
    <RightPanelContext.Provider value={{ open, content, contentKey, meta, workItemStrip, openPanel, closePanel, togglePanel, updateMeta, setWorkItemStrip, registerDefaultOpener }}>
      {children}
    </RightPanelContext.Provider>

  );
}

export function useRightPanel() {
  const ctx = useContext(RightPanelContext);
  if (!ctx) throw new Error("useRightPanel must be used within RightPanelProvider");
  return ctx;
}

