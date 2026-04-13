"use client";

import { createContext, useContext, useCallback, useEffect, useRef, useState, useSyncExternalStore } from "react";

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

export interface FocusSignal {
  /** 포커스할 대상 키 (예: "budget.dept.마케팅", "shipping", "company.field.industry") */
  key: string;
  /** 같은 key라도 매번 새 펄스로 인식하게 하는 타임스탬프 */
  ts: number;
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
  /** 포커스 펄스: 채팅 추론 스텝이 특정 필드/행을 강조하게 지시 */
  focus: (key: string) => void;
  /** 마지막 포커스 신호 */
  lastFocus: FocusSignal | null;
}

function createEventBus(): SettingsEventBus {
  let events: SettingsEvent[] = [];
  let lastEvent: SettingsEvent | null = null;
  let lastChatAction: SettingsEvent | null = null;
  let lastFormAction: SettingsEvent | null = null;
  let lastFocus: FocusSignal | null = null;
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
    focus(key) {
      lastFocus = { key, ts: Date.now() };
      listeners.forEach((cb) => cb());
    },
    get lastFocus() { return lastFocus; },
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

/** 포커스 발사 함수 */
export function useFocusEmit() {
  const bus = useContext(EventBusContext);
  if (!bus) throw new Error("SettingsEventProvider 필요");
  return bus.focus;
}

/** 마지막 포커스 신호 구독 (패널에서 사용) */
export function useLastFocus(): FocusSignal | null {
  const bus = useContext(EventBusContext);
  if (!bus) throw new Error("SettingsEventProvider 필요");
  return useSyncExternalStore(
    bus.subscribe,
    () => bus.lastFocus,
    () => null,
  );
}

/**
 * 특정 key 또는 prefix 와 매칭되는 포커스 신호를 받으면 잠깐 true 를 반환.
 * - keyOrPrefix 가 ":" 로 끝나거나 와일드카드면 prefix 매칭
 * - 정확 매칭이 가장 일반적이고, prefix 도 지원
 * @param keyOrPrefix 매칭할 key. 예: "budget.dept.마케팅" 또는 "budget.dept.*"
 * @param durationMs 펄스 지속 시간
 */
export function useFocusPulse(keyOrPrefix: string, durationMs = 1400): boolean {
  const last = useLastFocus();
  const [active, setActive] = useState(false);
  useEffect(() => {
    if (!last) return;
    const matches = keyOrPrefix.endsWith("*")
      ? last.key.startsWith(keyOrPrefix.slice(0, -1))
      : last.key === keyOrPrefix;
    if (!matches) return;
    setActive(true);
    const t = setTimeout(() => setActive(false), durationMs);
    return () => clearTimeout(t);
  }, [last, keyOrPrefix, durationMs]);
  return active;
}
