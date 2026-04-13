"use client";

import { createContext, useContext, useCallback, useRef, useSyncExternalStore } from "react";

/* ═══════════════════════════════════════
   설정 이벤트 버스
   폼 UI ⟷ 채팅 양방향 연동
   ═══════════════════════════════════════ */

export interface SettingsEvent {
  id: string;
  source: "form" | "chat";
  /** 어떤 패널에서 발생했는지 */
  panel: string;
  /** 어떤 액션인지 */
  action: string;
  /** 부가 데이터 */
  detail?: string;
  timestamp: number;
}

interface SettingsEventBus {
  /** 이벤트 발행 */
  emit: (event: Omit<SettingsEvent, "id" | "timestamp">) => void;
  /** 마지막 이벤트 */
  lastEvent: SettingsEvent | null;
  /** 최근 이벤트 목록 */
  events: SettingsEvent[];
  /** 구독 (외부 스토어 패턴) */
  subscribe: (cb: () => void) => () => void;
  /** 채팅→폼: 마지막 채팅 액션 (폼이 반응할 수 있도록) */
  lastChatAction: SettingsEvent | null;
  /** 폼→채팅: 마지막 폼 액션 (채팅이 반응할 수 있도록) */
  lastFormAction: SettingsEvent | null;
}

function createEventBus(): SettingsEventBus {
  let events: SettingsEvent[] = [];
  let lastEvent: SettingsEvent | null = null;
  let lastChatAction: SettingsEvent | null = null;
  let lastFormAction: SettingsEvent | null = null;
  const listeners = new Set<() => void>();

  return {
    emit(ev) {
      const event: SettingsEvent = {
        ...ev,
        id: `evt-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        timestamp: Date.now(),
      };
      events = [...events.slice(-50), event]; // 최근 50개만 유지
      lastEvent = event;
      if (ev.source === "chat") lastChatAction = event;
      if (ev.source === "form") lastFormAction = event;
      listeners.forEach((cb) => cb());
    },
    get lastEvent() { return lastEvent; },
    get events() { return events; },
    get lastChatAction() { return lastChatAction; },
    get lastFormAction() { return lastFormAction; },
    subscribe(cb) {
      listeners.add(cb);
      return () => listeners.delete(cb);
    },
  };
}

const EventBusContext = createContext<SettingsEventBus | null>(null);

export function SettingsEventProvider({ children }: { children: React.ReactNode }) {
  const busRef = useRef<SettingsEventBus | null>(null);
  if (!busRef.current) busRef.current = createEventBus();

  return (
    <EventBusContext.Provider value={busRef.current}>
      {children}
    </EventBusContext.Provider>
  );
}

/** 이벤트 발행 함수만 가져오기 */
export function useSettingsEmit() {
  const bus = useContext(EventBusContext);
  if (!bus) throw new Error("SettingsEventProvider 필요");
  return bus.emit;
}

/** 마지막 폼 이벤트 구독 (채팅에서 사용) */
export function useLastFormEvent(): SettingsEvent | null {
  const bus = useContext(EventBusContext);
  if (!bus) throw new Error("SettingsEventProvider 필요");
  return useSyncExternalStore(
    bus.subscribe,
    () => bus.lastFormAction,
    () => null,
  );
}

/** 마지막 채팅 이벤트 구독 (폼에서 사용) */
export function useLastChatEvent(): SettingsEvent | null {
  const bus = useContext(EventBusContext);
  if (!bus) throw new Error("SettingsEventProvider 필요");
  return useSyncExternalStore(
    bus.subscribe,
    () => bus.lastChatAction,
    () => null,
  );
}
