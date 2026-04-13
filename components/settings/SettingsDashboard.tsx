"use client";

import {
  Building2, Users, MapPin, CreditCard, FileText, PiggyBank,
  Check, Clock, AlertCircle, ChevronRight, Bot, GitBranch,
} from "lucide-react";
import { useSettings, type SettingsSection } from "@/lib/settings-context";
import { useAgentPolicy, modeLabels as agentModeLabels } from "@/lib/agent-policy-context";

interface SettingCard {
  id: SettingsSection;
  icon: React.ComponentType<{ size?: number; strokeWidth?: number; color?: string }>;
  title: string;
  status: "done" | "partial" | "empty";
  statusLabel: string;
  items: { label: string; value: string }[];
}

const cards: SettingCard[] = [
  {
    id: "company-info-edit",
    icon: Building2,
    title: "회사 정보",
    status: "done",
    statusLabel: "등록 완료",
    items: [
      { label: "회사명", value: "주식회사 로랩스" },
      { label: "사업자번호", value: "142-87-01234" },
      { label: "대표자", value: "김원균" },
      { label: "주소", value: "서울 강남구 테헤란로 152, 7층" },
    ],
  },
  {
    id: "company-team",
    icon: Users,
    title: "팀원 관리",
    status: "partial",
    statusLabel: "2명 등록",
    items: [
      { label: "관리자", value: "김원균 (나)" },
      { label: "구매담당", value: "박은서" },
      { label: "미초대", value: "구매담당 추가 권장" },
    ],
  },
  {
    id: "company-shipping",
    icon: MapPin,
    title: "배송지",
    status: "partial",
    statusLabel: "1개 등록",
    items: [
      { label: "본사", value: "서울 강남구 테헤란로 152, 7층" },
      { label: "추가 배송지", value: "—" },
    ],
  },
  {
    id: "accounting-payment",
    icon: CreditCard,
    title: "결제수단 관리",
    status: "partial",
    statusLabel: "1개 등록",
    items: [
      { label: "법인카드", value: "신한 ****-1234" },
      { label: "BNPL", value: "미연동" },
    ],
  },
  {
    id: "accounting-description",
    icon: FileText,
    title: "적요설정",
    status: "done",
    statusLabel: "설정 완료",
    items: [
      { label: "AI 자동적요", value: "ON" },
      { label: "카테고리 매핑", value: "7개 규칙" },
    ],
  },
  {
    id: "accounting-budget",
    icon: PiggyBank,
    title: "예산 설정",
    status: "partial",
    statusLabel: "일부 설정",
    items: [
      { label: "연간 예산", value: "120,000,000원" },
      { label: "부서별 배분", value: "4개 부서" },
      { label: "월별 한도", value: "일부 미설정" },
    ],
  },
];

const statusConfig = {
  done: { color: "#22c55e", bg: "rgba(34,197,94,0.08)", icon: Check, label: "완료" },
  partial: { color: "#f59e0b", bg: "rgba(245,158,11,0.08)", icon: Clock, label: "진행 중" },
  empty: { color: "#ef4444", bg: "rgba(239,68,68,0.08)", icon: AlertCircle, label: "미등록" },
};

export default function SettingsDashboard() {
  const { section, setSection } = useSettings();
  const { policy, applyMode: policyApplyMode, userOverrides } = useAgentPolicy();

  const scopeLabels = { all: "외부 포함", internal: "등록 상품만" };
  const registerLabels = { anyone: "전체 직원", "manager-only": "관리자만" };
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

  const allCards = [...cards, agentPolicyCard, approvalRulesCard];
  const doneCount = allCards.filter((c) => c.status === "done").length;
  const totalCount = allCards.length;
  const progressPct = Math.round((doneCount / totalCount) * 100);

  return (
    <div className="p-5 flex flex-col gap-4">
      {/* 전체 진행률 */}
      <div className="p-4" style={{ borderRadius: "12px", backgroundColor: "#fff", boxShadow: "rgba(0,0,0,0.04) 0px 0px 0px 1px" }}>
        <div className="flex items-center justify-between mb-2">
          <span className="text-[13px] font-medium text-[#333]">전체 설정 진행률</span>
          <span className="text-[13px] font-semibold text-[#111]">{progressPct}%</span>
        </div>
        <div className="h-[6px] rounded-full overflow-hidden" style={{ backgroundColor: "rgba(0,0,0,0.06)" }}>
          <div
            className="h-full rounded-full transition-all duration-500"
            style={{
              width: `${progressPct}%`,
              backgroundColor: progressPct === 100 ? "#22c55e" : "#111",
            }}
          />
        </div>
        <p className="text-[12px] text-[#999] mt-2">
          {totalCount}개 중 {doneCount}개 완료 · {totalCount - doneCount}개 남음
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
              borderRadius: "12px",
              backgroundColor: "#fff",
              boxShadow: isActive
                ? "rgba(0,0,0,0.08) 0px 0px 0px 1.5px"
                : "rgba(0,0,0,0.04) 0px 0px 0px 1px",
              transform: isActive ? "scale(1.01)" : "scale(1)",
            }}
          >
            {/* 카드 헤더 */}
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2.5">
                <div
                  className="flex items-center justify-center w-8 h-8 rounded-lg"
                  style={{ backgroundColor: isActive ? "#f0f0f0" : "#fafafa" }}
                >
                  <Icon size={16} strokeWidth={1.5} color={isActive ? "#111" : "#888"} />
                </div>
                <span
                  className="text-[14px] font-medium"
                  style={{ color: isActive ? "#111" : "#444" }}
                >
                  {card.title}
                </span>
              </div>
              <div className="flex items-center gap-1.5">
                <div
                  className="flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium"
                  style={{ backgroundColor: sc.bg, color: sc.color }}
                >
                  <StatusIcon size={11} strokeWidth={2} />
                  {card.statusLabel}
                </div>
                <ChevronRight size={14} strokeWidth={1.5} color="#ccc" />
              </div>
            </div>

            {/* 카드 내용 */}
            <div className="flex flex-col gap-1.5">
              {card.items.map((item) => (
                <div key={item.label} className="flex items-center justify-between">
                  <span className="text-[12px] text-[#999]">{item.label}</span>
                  <span
                    className="text-[12px] text-right max-w-[200px] truncate"
                    style={{ color: item.value === "—" ? "#ccc" : "#555" }}
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
      <p className="text-[11px] text-[#bbb] text-center mt-1">
        채팅으로 설정하면 자동으로 반영됩니다
      </p>
    </div>
  );
}
