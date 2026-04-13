"use client";

import { createContext, useContext, useState, useCallback, type ReactNode } from "react";

/* ═══════════════════════════════════════
   에이전트 정책 타입
   ═══════════════════════════════════════ */

/** 에이전트 모드 — 3단계 */
export type AgentMode = "open" | "guided" | "locked";

/** 상품 탐색 범위 */
export type SearchScope = "all" | "internal";

/** 신규 상품 등록 권한 */
export type ProductRegisterPolicy = "anyone" | "manager-only";

/** 적용 방식 */
export type PolicyApplyMode = "company" | "per-user";

export interface AgentPolicy {
  /** 에이전트 모드 */
  mode: AgentMode;
  /** 상품 탐색 범위: 외부 포함 vs 등록상품만 */
  searchScope: SearchScope;
  /** 채팅에서 장바구니 담기 허용 */
  chatPurchaseEnabled: boolean;
  /** 직원의 신규 상품 등록 가능 여부 */
  productRegisterPolicy: ProductRegisterPolicy;
  /** 품의 자동승인 한도 (원). 0 = 자동승인 없음 */
  autoApprovalLimit: number;
  /** 에이전트 인사이트 표시 (GUI 위 레이어) */
  showAgentInsights: boolean;
}

/** 유저별 오버라이드 — 회사 정책 위에 덮어쓸 항목만 */
export type UserPolicyOverride = Partial<AgentPolicy> & {
  /** 이 유저에게 적용할 모드 (없으면 회사 기본) */
  mode?: AgentMode;
};

/* ─── 기본값: 오픈 모드 ─── */
const defaultPolicy: AgentPolicy = {
  mode: "open",
  searchScope: "all",
  chatPurchaseEnabled: true,
  productRegisterPolicy: "anyone",
  autoApprovalLimit: 100000,
  showAgentInsights: true,
};

/* ─── 프리셋: 모드별 기본 세팅 ─── */
export const modePresets: Record<AgentMode, Partial<AgentPolicy>> = {
  open: {
    searchScope: "all",
    chatPurchaseEnabled: true,
    productRegisterPolicy: "anyone",
  },
  guided: {
    searchScope: "internal",
    chatPurchaseEnabled: true,
    productRegisterPolicy: "manager-only",
  },
  locked: {
    searchScope: "internal",
    chatPurchaseEnabled: false,
    productRegisterPolicy: "manager-only",
  },
};

/* ─── 모드 한글 라벨 ─── */
export const modeLabels: Record<AgentMode, string> = {
  open: "오픈",
  guided: "가이드",
  locked: "잠금",
};

/* ═══════════════════════════════════════
   Context
   ═══════════════════════════════════════ */

interface AgentPolicyContextValue {
  /** 회사 전체 기본 정책 */
  policy: AgentPolicy;
  /** 적용 방식: 회사 일괄 vs 유저별 */
  applyMode: PolicyApplyMode;
  /** 유저별 오버라이드 맵 (userId → override) */
  userOverrides: Record<string, UserPolicyOverride>;

  setPolicy: (p: AgentPolicy) => void;
  updatePolicy: (partial: Partial<AgentPolicy>) => void;
  setAgentMode: (mode: AgentMode) => void;
  setApplyMode: (mode: PolicyApplyMode) => void;

  /** 특정 유저의 오버라이드 설정 */
  setUserOverride: (userId: string, override: UserPolicyOverride) => void;
  /** 특정 유저의 오버라이드 삭제 (회사 기본으로 복귀) */
  removeUserOverride: (userId: string) => void;
  /** 특정 유저에게 최종 적용되는 정책 계산 */
  getEffectivePolicy: (userId: string) => AgentPolicy;
}

const AgentPolicyContext = createContext<AgentPolicyContextValue | null>(null);

export function AgentPolicyProvider({ children }: { children: ReactNode }) {
  const [policy, setPolicyState] = useState<AgentPolicy>(defaultPolicy);
  const [applyModeState, setApplyModeState] = useState<PolicyApplyMode>("company");
  const [userOverrides, setUserOverrides] = useState<Record<string, UserPolicyOverride>>({});

  const setPolicy = useCallback((p: AgentPolicy) => {
    setPolicyState(p);
  }, []);

  const updatePolicy = useCallback((partial: Partial<AgentPolicy>) => {
    setPolicyState((prev) => ({ ...prev, ...partial }));
  }, []);

  const setAgentMode = useCallback((mode: AgentMode) => {
    setPolicyState((prev) => ({
      ...prev,
      mode,
      ...modePresets[mode],
    }));
  }, []);

  const setApplyMode = useCallback((mode: PolicyApplyMode) => {
    setApplyModeState(mode);
  }, []);

  const setUserOverride = useCallback((userId: string, override: UserPolicyOverride) => {
    setUserOverrides((prev) => ({ ...prev, [userId]: override }));
  }, []);

  const removeUserOverride = useCallback((userId: string) => {
    setUserOverrides((prev) => {
      const next = { ...prev };
      delete next[userId];
      return next;
    });
  }, []);

  const getEffectivePolicy = useCallback(
    (userId: string): AgentPolicy => {
      if (applyModeState === "company") return policy;
      const override = userOverrides[userId];
      if (!override) return policy;
      // 오버라이드 모드가 있으면 프리셋도 적용
      const base = override.mode
        ? { ...policy, ...modePresets[override.mode] }
        : policy;
      return { ...base, ...override };
    },
    [policy, applyModeState, userOverrides]
  );

  return (
    <AgentPolicyContext.Provider
      value={{
        policy,
        applyMode: applyModeState,
        userOverrides,
        setPolicy,
        updatePolicy,
        setAgentMode,
        setApplyMode,
        setUserOverride,
        removeUserOverride,
        getEffectivePolicy,
      }}
    >
      {children}
    </AgentPolicyContext.Provider>
  );
}

export function useAgentPolicy() {
  const ctx = useContext(AgentPolicyContext);
  if (!ctx) throw new Error("useAgentPolicy must be used within <AgentPolicyProvider>");
  return ctx;
}
