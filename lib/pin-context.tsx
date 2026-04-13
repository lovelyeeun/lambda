"use client";

import { createContext, useContext, useState, useEffect, useCallback, useMemo } from "react";

/* ═══════════════════════════════════════
   상품 고정(Pin) 전역 상태
   localStorage에 영속화하여 새로고침 후에도 유지
   ═══════════════════════════════════════ */

const STORAGE_KEY = "cockpit:pinned-products";

interface PinContextValue {
  pinnedIds: string[];
  isPinned: (id: string) => boolean;
  togglePin: (id: string) => boolean; // returns new pinned state
}

const PinContext = createContext<PinContextValue | null>(null);

export function PinProvider({ children }: { children: React.ReactNode }) {
  const [pinnedIds, setPinnedIds] = useState<string[]>([]);

  // 마운트 시 1회 복원
  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) setPinnedIds(parsed.filter((v): v is string => typeof v === "string"));
      }
    } catch {
      // ignore
    }
  }, []);

  // 변경 시 저장
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(pinnedIds));
    } catch {
      // ignore
    }
  }, [pinnedIds]);

  const isPinned = useCallback(
    (id: string) => pinnedIds.includes(id),
    [pinnedIds]
  );

  const togglePin = useCallback((id: string) => {
    let nowPinned = false;
    setPinnedIds((prev) => {
      if (prev.includes(id)) {
        nowPinned = false;
        return prev.filter((p) => p !== id);
      }
      nowPinned = true;
      return [id, ...prev];
    });
    return !pinnedIds.includes(id);
  }, [pinnedIds]);

  const value = useMemo<PinContextValue>(() => ({ pinnedIds, isPinned, togglePin }), [pinnedIds, isPinned, togglePin]);

  return <PinContext.Provider value={value}>{children}</PinContext.Provider>;
}

export function usePin(): PinContextValue {
  const ctx = useContext(PinContext);
  if (!ctx) {
    // Provider 미포함 환경(예: 구 라우트) fallback — 동작은 하나 영속화 없음
    return {
      pinnedIds: [],
      isPinned: () => false,
      togglePin: () => false,
    };
  }
  return ctx;
}

/* ── 유틸: 상품 배열을 고정된 것 우선으로 정렬 ── */
export function sortByPinned<T extends { id: string }>(items: T[], pinnedIds: string[]): T[] {
  if (pinnedIds.length === 0) return items;
  const pinnedSet = new Set(pinnedIds);
  const pinned: T[] = [];
  const rest: T[] = [];
  for (const it of items) {
    if (pinnedSet.has(it.id)) pinned.push(it);
    else rest.push(it);
  }
  // 최근 고정 우선 (pinnedIds가 최신순으로 앞에 prepend되므로 그 순서를 따름)
  pinned.sort((a, b) => pinnedIds.indexOf(a.id) - pinnedIds.indexOf(b.id));
  return [...pinned, ...rest];
}
