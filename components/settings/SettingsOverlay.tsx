"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import { X, ArrowLeft, Check } from "lucide-react";
import { useSettings, type SettingsSection } from "@/lib/settings-context";
import { SettingsEventProvider, useSettingsEmit, useLastChatEvent } from "@/lib/settings-events";
import ResizableHandle from "@/components/ui/ResizableHandle";
import SettingsNav from "./SettingsNav";
import SettingsChat from "./SettingsChat";
import SettingsDashboard from "./SettingsDashboard";
import PersonalGeneral from "./panels/PersonalGeneral";
import PersonalPlan from "./panels/PersonalPlan";
import PersonalConnectors from "./panels/PersonalConnectors";
import ProductsManagement from "./panels/ProductsManagement";
import AppsManagement from "./panels/AppsManagement";
import NotificationsSettings from "./panels/NotificationsSettings";
import CompanyInfo from "./panels/CompanyInfo";
import CompanyTeam from "./panels/CompanyTeam";
import CompanyKnowledge from "./panels/CompanyKnowledge";
import CompanyShipping from "./panels/CompanyShipping";
import AccountingPayment from "./panels/AccountingPayment";
import AccountingDescription from "./panels/AccountingDescription";
import AccountingBudget from "./panels/AccountingBudget";
import AgentPolicy from "./panels/AgentPolicy";
import ApprovalRules from "./panels/ApprovalRules";

/* 회사설정 카드 상세 → 폼 UI 매핑 */
const companyFormPanels: Record<string, { component: React.ComponentType; title: string }> = {
  "company-info-edit": { component: CompanyInfo, title: "회사 정보" },
  "company-team": { component: CompanyTeam, title: "팀원 관리" },
  "company-knowledge": { component: CompanyKnowledge, title: "회사 지식" },
  "company-shipping": { component: CompanyShipping, title: "배송지" },
  "accounting-payment": { component: AccountingPayment, title: "결제수단 관리" },
  "accounting-description": { component: AccountingDescription, title: "적요설정" },
  "accounting-budget": { component: AccountingBudget, title: "예산 설정" },
  "agent-policy": { component: AgentPolicy, title: "에이전트 정책" },
  "approval-rules": { component: ApprovalRules, title: "승인 체계" },
};

/* 회사설정 영역인지 판별 */
const companySections = new Set([
  "company-info", ...Object.keys(companyFormPanels),
]);

/* 비(非) 회사설정 폼 패널 */
const otherFormPanels: Record<string, React.ComponentType> = {
  "personal-general": PersonalGeneral,
  "personal-plan": PersonalPlan,
  "personal-connectors": PersonalConnectors,
  "products": ProductsManagement,
  "apps": AppsManagement,
  "notifications": NotificationsSettings,
};

export default function SettingsOverlay() {
  const { open } = useSettings();
  if (!open) return null;

  return (
    <SettingsEventProvider>
      <SettingsOverlayInner />
    </SettingsEventProvider>
  );
}

function SettingsOverlayInner() {
  const { closeSettings, section, setSection } = useSettings();
  const containerRef = useRef<HTMLDivElement>(null);
  const [rightWidth, setRightWidth] = useState(480);
  const userResizedRef = useRef(false);

  // 마운트 시 컨테이너 너비 측정 → (전체 - 네비 220) / 2 = 채팅과 우측 GUI 반반
  useEffect(() => {
    if (!containerRef.current || userResizedRef.current) return;
    const total = containerRef.current.getBoundingClientRect().width;
    const NAV_WIDTH = 220;
    const half = Math.round((total - NAV_WIDTH) / 2);
    if (half > 0) setRightWidth(half);
  }, []);

  const handleResize = useCallback((w: number) => {
    userResizedRef.current = true;
    setRightWidth(w);
  }, []);

  const activeCardPanel = section ? companyFormPanels[section] : null;
  const isOtherForm = section ? !!otherFormPanels[section] : false;
  const OtherPanel = section && isOtherForm ? otherFormPanels[section] : null;

  /* 패널별 권장 최소 너비 — 결제수단처럼 컬럼이 많은 표는 760 이상 필요 */
  const PANEL_MIN_WIDTH: Record<string, number> = {
    "accounting-payment": 760,
  };
  const panelMin = section ? PANEL_MIN_WIDTH[section] ?? 440 : 340;
  const dashboardMinWidth = activeCardPanel ? panelMin : 340;
  const dashboardMaxWidth = activeCardPanel ? 920 : 720;
  // 사용자 조정값을 존중하되 패널 최소 너비는 강제 보장
  const expandedWidth = Math.max(rightWidth, dashboardMinWidth);

  return (
    <div className="fixed inset-0 z-50 flex">
      <div
        className="absolute inset-0 cursor-pointer"
        style={{ backgroundColor: "rgba(0,0,0,0.4)", backdropFilter: "blur(4px)" }}
        onClick={closeSettings}
      />
      <div
        ref={containerRef}
        className="relative m-4 flex-1 bg-white overflow-hidden flex"
        style={{
          borderRadius: "16px",
          boxShadow: "rgba(0,0,0,0.06) 0px 0px 0px 1px, rgba(0,0,0,0.08) 0px 8px 40px",
        }}
      >
        <button
          onClick={closeSettings}
          className="absolute top-4 right-4 z-10 flex items-center justify-center w-8 h-8 rounded-lg cursor-pointer transition-colors hover:bg-[#f5f5f5]"
        >
          <X size={18} strokeWidth={1.5} color="#777" />
        </button>

        <SettingsNav />

        {isOtherForm && OtherPanel ? (
          <div className="flex-1 overflow-y-auto px-10 pt-14 pb-8">
            <OtherPanel />
          </div>
        ) : (
          <>
            <div className="flex-1 flex flex-col overflow-hidden bg-[#f5f5f5]">
              <SettingsChat />
            </div>

            <ResizableHandle
              panelWidth={expandedWidth}
              onResize={handleResize}
              minWidth={dashboardMinWidth}
              maxWidth={dashboardMaxWidth}
              side="left"
            />

            <div
              className="shrink-0 overflow-y-auto bg-white transition-all duration-300"
              style={{ width: `${expandedWidth}px` }}
            >
              {activeCardPanel ? (
                <FormPanelWrapper
                  panelKey={section!}
                  title={activeCardPanel.title}
                  Component={activeCardPanel.component}
                  onBack={() => setSection("company-info")}
                />
              ) : (
                <SettingsDashboard />
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════
   폼 패널 래퍼: 클릭 캡처 + 채팅 연동
   ═══════════════════════════════════════ */

function FormPanelWrapper({
  panelKey,
  title,
  Component,
  onBack,
}: {
  panelKey: string;
  title: string;
  Component: React.ComponentType;
  onBack: () => void;
}) {
  const emit = useSettingsEmit();
  const lastChatEvent = useLastChatEvent();
  const [chatPulse, setChatPulse] = useState<string | null>(null);
  const pulseTimerRef = useRef<ReturnType<typeof setTimeout>>(undefined);
  const lastHandledRef = useRef<string | null>(null);

  /* 채팅에서 액션이 발생하면 폼 UI에 시각 피드백 */
  if (lastChatEvent && lastChatEvent.id !== lastHandledRef.current && lastChatEvent.panel === panelKey) {
    lastHandledRef.current = lastChatEvent.id;
    // 비동기로 state 업데이트 (렌더 중 setState 방지)
    setTimeout(() => {
      setChatPulse(lastChatEvent.action);
      if (pulseTimerRef.current) clearTimeout(pulseTimerRef.current);
      pulseTimerRef.current = setTimeout(() => setChatPulse(null), 3000);
    }, 0);
  }

  /* 폼 내부 클릭을 감지하여 채팅에 이벤트 전파 */
  const handleFormClick = useCallback((e: React.MouseEvent) => {
    const target = e.target as HTMLElement;

    // button, input[type=checkbox], select 변경 등을 캡처
    const btn = target.closest("button");
    const toggle = target.closest("[role='switch']") || target.closest("input[type='checkbox']");
    const input = target.closest("input:not([type='checkbox'])");

    if (btn) {
      const text = btn.textContent?.trim() || "";
      // 네비게이션 버튼은 무시 (뒤로가기 등)
      if (text === "카드 목록으로" || text === "" || text.length > 30) return;
      emit({
        source: "form",
        panel: panelKey,
        action: "button-click",
        detail: `[${title}] "${text}" 버튼 클릭`,
      });
    } else if (toggle) {
      const label = target.closest("[data-label]")?.getAttribute("data-label")
        || target.closest("label")?.textContent?.trim()
        || "토글";
      emit({
        source: "form",
        panel: panelKey,
        action: "toggle",
        detail: `[${title}] "${label}" 설정 변경`,
      });
    }
  }, [emit, panelKey, title]);

  /* 폼 내부 input 변경 감지 */
  const handleFormChange = useCallback((e: React.FormEvent) => {
    const target = e.target as HTMLElement;
    if (target.tagName === "INPUT" || target.tagName === "SELECT" || target.tagName === "TEXTAREA") {
      const label = target.closest("label")?.textContent?.trim()
        || (target as HTMLInputElement).placeholder
        || "값";
      const value = (target as HTMLInputElement).value;
      emit({
        source: "form",
        panel: panelKey,
        action: "input-change",
        detail: `[${title}] "${label}" 값 수정: ${value.slice(0, 30)}`,
      });
    }
  }, [emit, panelKey, title]);

  return (
    <div className="px-5 pt-14 pb-5 relative">
      <button
        onClick={onBack}
        className="flex items-center gap-1.5 mb-4 text-[13px] text-[#777169] cursor-pointer transition-colors hover:text-[#000] group"
        style={{ letterSpacing: "0.14px" }}
      >
        <ArrowLeft size={15} strokeWidth={1.5} className="transition-transform group-hover:-translate-x-0.5" />
        카드 목록으로
      </button>

      {/* 채팅에서 액션 발생 시 알림 배너 */}
      {chatPulse && (
        <div
          className="mb-3 flex items-center gap-2 px-3 py-2 text-[12px] font-medium text-[#000] animate-pulse"
          style={{
            borderRadius: "8px",
            backgroundColor: "rgba(245,242,239,0.8)",
            boxShadow: "rgba(0,0,0,0.075) 0px 0px 0px 0.5px inset, rgba(78,50,23,0.04) 0px 6px 16px",
            letterSpacing: "0.14px",
          }}
        >
          <Check size={13} strokeWidth={2} />
          채팅에서 변경됨: {chatPulse}
        </div>
      )}

      <div
        className="bg-white p-5 overflow-hidden"
        style={{
          borderRadius: "16px",
          boxShadow: "rgba(0,0,0,0.06) 0px 0px 0px 1px, rgba(0,0,0,0.04) 0px 1px 2px, rgba(0,0,0,0.04) 0px 2px 4px",
        }}
        onClick={handleFormClick}
        onChange={handleFormChange}
      >
        <Component />
      </div>
    </div>
  );
}
