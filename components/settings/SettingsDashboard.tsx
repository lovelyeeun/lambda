"use client";

import {
  Building2, Users, MapPin, CreditCard, FileText, PiggyBank,
  Check, Clock, AlertCircle, ChevronRight, Bot, GitBranch,
} from "lucide-react";
import { useSettings, type SettingsSection } from "@/lib/settings-context";
import { useAgentPolicy, modeLabels as agentModeLabels } from "@/lib/agent-policy-context";
import { useSettingsStore } from "@/lib/settings-store";
import { users } from "@/data/users";

interface SettingCard {
  id: SettingsSection;
  icon: React.ComponentType<{ size?: number; strokeWidth?: number; color?: string }>;
  title: string;
  status: "done" | "partial" | "empty";
  statusLabel: string;
  items: { label: string; value: string }[];
}

const statusConfig = {
  done: { color: "#000000", bg: "rgba(245,242,239,0.8)", icon: Check, label: "완료" },
  partial: { color: "#777169", bg: "rgba(245,242,239,0.8)", icon: Clock, label: "진행 중" },
  empty: { color: "#777169", bg: "#ffffff", icon: AlertCircle, label: "미등록" },
};

const cardShadow = {
  rest: "rgba(0,0,0,0.06) 0px 0px 0px 1px, rgba(0,0,0,0.04) 0px 1px 2px, rgba(0,0,0,0.04) 0px 2px 4px",
  active: "rgba(0,0,0,0.075) 0px 0px 0px 0.5px inset, rgba(0,0,0,0.08) 0px 0px 0px 1px, rgba(78,50,23,0.04) 0px 6px 16px",
};

export default function SettingsDashboard() {
  const { section, setSection } = useSettings();
  const { policy, applyMode: policyApplyMode, userOverrides } = useAgentPolicy();

  const scopeLabels = { all: "외부 포함", internal: "등록 상품만" };
  const applyModeLabel = policyApplyMode === "company" ? "전사 일괄" : `유저별 (${Object.keys(userOverrides).length}명 커스텀)`;

  const agentPolicyCard: SettingCard = {
    id: "agent-policy",
    icon: Bot,
    title: "에이전트 정책",
    status: "done",
    statusLabel: `${agentModeLabels[policy.mode]} 모드`,
    items: [
      { label: "적용 방식", value: applyModeLabel },
      { label: "기본 모드", value: `${agentModeLabels[policy.mode]} 모드` },
      { label: "탐색 범위", value: scopeLabels[policy.searchScope] },
      { label: "채팅 구매", value: policy.chatPurchaseEnabled ? "허용" : "비활성" },
    ],
  };

  const { budget, totalAnnual, totalUsed, company, shipping, payments, defaultShipping, activePaymentsCount, invitedMembers, descriptionRules, descriptionRuleHistory, aiDescriptionEnabled } = useSettingsStore();

  const descriptionCard: SettingCard = {
    id: "accounting-description",
    icon: FileText,
    title: "적요설정",
    status: descriptionRules.length > 0 ? "done" : "empty",
    statusLabel: aiDescriptionEnabled ? "AI 추천 ON" : "AI 추천 OFF",
    items: [
      { label: "등록된 규칙", value: `${descriptionRules.length}개` },
      { label: "최근 변경", value: descriptionRuleHistory.length > 0 ? `${descriptionRuleHistory.length}건 기록` : "—" },
      { label: "ERP 연동", value: "더존 4자리" },
    ],
  };

  const activeCount = users.length;
  const pendingCount = invitedMembers.length;
  const teamCard: SettingCard = {
    id: "company-team",
    icon: Users,
    title: "팀원 관리",
    status: pendingCount > 0 ? "partial" : "done",
    statusLabel: pendingCount > 0 ? `${activeCount}명 + 대기 ${pendingCount}` : `${activeCount}명 등록`,
    items: [
      { label: "활성 멤버", value: `${activeCount}명` },
      { label: "초대 대기", value: pendingCount > 0 ? `${pendingCount}명` : "—" },
      { label: "관리자", value: "김원균 (나)" },
    ],
  };

  const companyCard: SettingCard = {
    id: "company-info-edit",
    icon: Building2,
    title: "회사 정보",
    status: "done",
    statusLabel: "등록 완료",
    items: [
      { label: "회사명", value: company.name },
      { label: "사업자번호", value: company.bizNumber },
      { label: "대표자", value: company.ceo },
      { label: "주소", value: company.address },
    ],
  };

  const shippingCard: SettingCard = {
    id: "company-shipping",
    icon: MapPin,
    title: "배송지",
    status: shipping.length > 0 ? "partial" : "empty",
    statusLabel: `${shipping.length}개 등록`,
    items: [
      { label: "기본 배송지", value: defaultShipping?.name ?? "—" },
      { label: "주소", value: defaultShipping?.address ?? "—" },
      { label: "추가 배송지", value: shipping.length > 1 ? `${shipping.length - 1}개` : "—" },
    ],
  };

  const cardBrands = payments.filter((p) => p.type === "카드결제").length;
  const bnplBrands = payments.filter((p) => p.type === "BNPL").length;
  const paymentCard: SettingCard = {
    id: "accounting-payment",
    icon: CreditCard,
    title: "결제수단 관리",
    status: activePaymentsCount > 0 ? "partial" : "empty",
    statusLabel: `${activePaymentsCount}개 사용중`,
    items: [
      { label: "법인카드", value: cardBrands > 0 ? `${cardBrands}개 등록` : "미등록" },
      { label: "BNPL", value: bnplBrands > 0 ? `${bnplBrands}개 등록` : "미연동" },
      { label: "사용중", value: `${activePaymentsCount}개` },
    ],
  };

  const budgetCard: SettingCard = {
    id: "accounting-budget",
    icon: PiggyBank,
    title: "예산 설정",
    status: "partial",
    statusLabel: `${(totalAnnual / 100000000).toFixed(1)}억 설정`,
    items: [
      { label: "연간 예산", value: `${totalAnnual.toLocaleString()}원` },
      { label: "부서별 배분", value: `${budget.departments.length}개 부서` },
      { label: "사용률", value: totalAnnual > 0 ? `${Math.round((totalUsed / totalAnnual) * 100)}%` : "—" },
    ],
  };

  const approvalRulesCard: SettingCard = {
    id: "approval-rules",
    icon: GitBranch,
    title: "승인 체계",
    status: "done",
    statusLabel: "4개 라인",
    items: [
      { label: "기본 승인라인", value: "팀장 → 부서장 → 최종결제" },
      { label: "부서별 분기", value: "4개 부서" },
      { label: "소액 자동승인", value: "50만원 이하" },
      { label: "최종결제자", value: "김원균 (대표)" },
    ],
  };

  const allCards = [
    companyCard,
    teamCard,
    shippingCard,
    paymentCard,
    descriptionCard,
    budgetCard,
    agentPolicyCard,
    approvalRulesCard,
  ];
  const doneCount = allCards.filter((c) => c.status === "done").length;
  const totalCount = allCards.length;
  const progressPct = Math.round((doneCount / totalCount) * 100);

  return (
    <div className="px-5 pt-14 pb-5 flex flex-col gap-4">
      {/* 전체 진행률 — 웜 스톤 시그니처 블록 (카드들과 다른 질감) */}
      <div
        className="p-5"
        style={{
          borderRadius: "20px",
          backgroundColor: "rgba(245,242,239,0.8)",
          boxShadow: "rgba(0,0,0,0.075) 0px 0px 0px 0.5px inset, rgba(78,50,23,0.04) 0px 6px 16px",
        }}
      >
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <span
              className="text-[11px] font-bold uppercase text-[#4e4e4e]"
              style={{
                fontFamily: "WaldenburgFH, 'WaldenburgFH Fallback', sans-serif",
                letterSpacing: "0.7px",
              }}
            >
              설정 진행률
            </span>
            {progressPct === 100 && (
              <span
                className="flex items-center gap-1 px-2 py-0.5 text-[10px] font-medium text-white"
                style={{
                  borderRadius: "9999px",
                  backgroundColor: "#000",
                  letterSpacing: "0.14px",
                }}
              >
                <Check size={10} strokeWidth={2.5} />
                완료
              </span>
            )}
          </div>
        </div>

        <div className="flex items-baseline gap-1.5 mb-3">
          <span
            className="text-[48px] font-light text-[#000]"
            style={{
              fontFamily: "Waldenburg, 'Waldenburg Fallback', sans-serif",
              letterSpacing: "-0.96px",
              lineHeight: 1.08,
            }}
          >
            {progressPct}
          </span>
          <span
            className="text-[16px] font-light text-[#777169]"
            style={{
              fontFamily: "Waldenburg, 'Waldenburg Fallback', sans-serif",
              letterSpacing: "-0.16px",
            }}
          >
            %
          </span>
        </div>

        <div
          className="h-[4px] rounded-full overflow-hidden mb-2"
          style={{ backgroundColor: "rgba(0,0,0,0.08)" }}
        >
          <div
            className="h-full rounded-full transition-all duration-500"
            style={{ width: `${progressPct}%`, backgroundColor: "#000" }}
          />
        </div>
        <p className="text-[12px] text-[#4e4e4e]" style={{ letterSpacing: "0.14px" }}>
          {totalCount}개 중 <span className="font-medium text-[#000]">{doneCount}개 완료</span>
          {progressPct < 100 && <> · {totalCount - doneCount}개 남음</>}
        </p>
      </div>

      {/* 설정 카드들 */}
      {allCards.map((card) => {
        const sc = statusConfig[card.status];
        const StatusIcon = sc.icon;
        const Icon = card.icon;
        const isActive = section === card.id;

        return (
          <button
            key={card.id}
            onClick={() => setSection(card.id)}
            className="text-left w-full p-4 transition-all cursor-pointer"
            style={{
              borderRadius: "16px",
              backgroundColor: "#fff",
              boxShadow: isActive ? cardShadow.active : cardShadow.rest,
              transform: isActive ? "scale(1.01)" : "scale(1)",
            }}
          >
            {/* 카드 헤더 */}
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2.5">
                <div
                  className="flex items-center justify-center w-8 h-8 rounded-lg"
                  style={{ backgroundColor: isActive ? "rgba(245,242,239,0.8)" : "#f5f2ef" }}
                >
                  <Icon size={16} strokeWidth={1.5} color={isActive ? "#000" : "#777169"} />
                </div>
                <span
                  className="text-[14px] font-medium"
                  style={{ color: isActive ? "#000" : "#4e4e4e", letterSpacing: "0.14px" }}
                >
                  {card.title}
                </span>
              </div>
              <div className="flex items-center gap-1.5">
                <div
                  className="flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium"
                  style={{
                    backgroundColor: sc.bg,
                    color: sc.color,
                    boxShadow: "rgba(0,0,0,0.075) 0px 0px 0px 0.5px inset",
                    letterSpacing: "0.14px",
                  }}
                >
                  <StatusIcon size={11} strokeWidth={2} />
                  {card.statusLabel}
                </div>
                <ChevronRight size={14} strokeWidth={1.5} color="#777169" />
              </div>
            </div>

            {/* 카드 내용 */}
            <div className="flex flex-col gap-1.5">
              {card.items.map((item) => (
                <div key={item.label} className="flex items-center justify-between">
                  <span className="text-[12px] text-[#777169]" style={{ letterSpacing: "0.14px" }}>{item.label}</span>
                  <span
                    className="text-[12px] text-right max-w-[200px] truncate"
                    style={{ color: item.value === "—" ? "#b8b2a8" : "#4e4e4e", letterSpacing: "0.14px" }}
                  >
                    {item.value}
                  </span>
                </div>
              ))}
            </div>
          </button>
        );
      })}

      {/* 안내 */}
      <p className="text-[11px] text-[#777169] text-center mt-1" style={{ letterSpacing: "0.14px" }}>
        채팅으로 설정하면 자동으로 반영됩니다
      </p>
    </div>
  );
}
