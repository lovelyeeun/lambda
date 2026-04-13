"use client";

import { useState } from "react";
import {
  Sparkles, Shield, Lock, Globe, Database,
  ShoppingCart, UserPlus, UserCheck, Gauge,
  Eye, Check, Info, ChevronDown, Users, Building2, UserCog,
  Upload, X, RefreshCw, Brain, ArrowLeft,
} from "lucide-react";
import { PlannedTooltip } from "@/components/ui/Tooltip";
import {
  useAgentPolicy,
  modeLabels,
  type AgentMode,
  type SearchScope,
  type ProductRegisterPolicy,
  type PolicyApplyMode,
} from "@/lib/agent-policy-context";
import { users } from "@/data/users";

/* ═══════════════════════════════════════
   모드 카드 데이터
   ═══════════════════════════════════════ */
const modeCards: {
  mode: AgentMode;
  icon: React.ComponentType<{ size?: number; strokeWidth?: number; color?: string }>;
  title: string;
  subtitle: string;
  color: string;
  description: string;
  features: string[];
}[] = [
  {
    mode: "open",
    icon: Sparkles,
    title: "오픈 모드",
    subtitle: "스타트업 · 자율형",
    color: "#22c55e",
    description: "에이전트가 최대 자유도로 작동합니다. 외부 상품 탐색, 채팅 구매, 신규 등록 모두 가능합니다.",
    features: ["외부 API 검색 포함", "채팅 장바구니/구매", "전원 상품 등록"],
  },
  {
    mode: "guided",
    icon: Shield,
    title: "가이드 모드",
    subtitle: "중견기업 · 적정 통제",
    color: "#f59e0b",
    description: "에이전트가 등록 상품 안에서 작동합니다. 채팅 구매는 가능하지만 탐색 범위가 제한됩니다.",
    features: ["등록 상품만 추천", "채팅 장바구니/구매", "관리자만 상품 등록"],
  },
  {
    mode: "locked",
    icon: Lock,
    title: "잠금 모드",
    subtitle: "대기업 · 강한 통제",
    color: "#ef4444",
    description: "구매는 GUI로만 진행됩니다. 에이전트는 인사이트 제공과 CS/안내에 집중합니다.",
    features: ["등록 상품만 표시", "채팅 CS/안내 전용", "관리자만 상품 등록"],
  },
];

const modeColors: Record<AgentMode, string> = { open: "#22c55e", guided: "#f59e0b", locked: "#ef4444" };

/* ═══════════════════════════════════════
   Component
   ═══════════════════════════════════════ */

/* ═══════════════════════════════════════
   회사 지식 기본 데이터
   ═══════════════════════════════════════ */
const initialKnowledgeTags = [
  "친환경 우선", "A4 용지는 Double A", "IT장비 예산 월 500만원",
  "30만원 이하 자동승인", "시디즈 B2B 단가 적용",
];

export default function AgentPolicyPanel() {
  const {
    policy, applyMode, userOverrides,
    updatePolicy, setAgentMode, setApplyMode,
    setUserOverride, removeUserOverride, getEffectivePolicy,
  } = useAgentPolicy();
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [showKnowledge, setShowKnowledge] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const [editingUserId, setEditingUserId] = useState<string | null>(null);

  // 회사 지식 state
  const [knowledgePrompt, setKnowledgePrompt] = useState(
    "우리 회사는 친환경 제품을 우선적으로 선택합니다. 동일 조건이면 가격보다 환경 인증 여부를 우선합니다.\n\nIT장비는 LG/삼성 국내 브랜드를 선호하며, 대한솔루션과의 연간 계약 단가를 먼저 확인해주세요."
  );
  const [knowledgeTags, setKnowledgeTags] = useState(initialKnowledgeTags);
  const [editingTag, setEditingTag] = useState<number | null>(null);

  const showToast = (msg: string) => { setToast(msg); setTimeout(() => setToast(null), 2500); };

  const removeKnowledgeTag = (i: number) => setKnowledgeTags((prev) => prev.filter((_, j) => j !== i));
  const updateKnowledgeTag = (i: number, val: string) => {
    setKnowledgeTags((prev) => prev.map((t, j) => j === i ? val : t));
    setEditingTag(null);
    showToast("설정에 반영됩니다");
  };

  const handleModeSelect = (mode: AgentMode) => {
    setAgentMode(mode);
    showToast(`${modeLabels[mode]} 모드가 적용되었습니다`);
  };

  return (
    <div className="max-w-[720px]">
      {/* 제목 */}
      <div className="mb-6">
        <h2 className="text-[20px] font-semibold mb-1" style={{ letterSpacing: "-0.3px" }}>
          구매 에이전트 정책
        </h2>
        <p className="text-[13px] text-[#777] leading-[1.6]">
          에이전트의 작동 범위와 직원의 구매 권한을 설정합니다.
        </p>
      </div>

      {/* ── 적용 방식 선택 ── */}
      <div className="mb-6">
        <p className="text-[12px] font-medium text-[#999] uppercase tracking-wider mb-3">적용 방식</p>
        <div className="flex gap-3">
          <ApplyModeCard
            active={applyMode === "company"}
            icon={Building2}
            title="회사 일괄 적용"
            description="전 직원에게 동일한 정책 적용"
            onClick={() => { setApplyMode("company"); showToast("회사 일괄 적용으로 변경되었습니다"); }}
          />
          <ApplyModeCard
            active={applyMode === "per-user"}
            icon={UserCog}
            title="유저별 적용"
            description="직원마다 다른 정책 설정 가능"
            onClick={() => { setApplyMode("per-user"); showToast("유저별 적용으로 변경되었습니다"); }}
          />
        </div>
      </div>

      {/* ── 회사 기본 모드 선택 ── */}
      <div className="mb-2">
        <p className="text-[12px] font-medium text-[#999] uppercase tracking-wider mb-3">
          {applyMode === "company" ? "전사 적용 모드" : "회사 기본 모드"}
        </p>
        {applyMode === "per-user" && (
          <p className="text-[11px] text-[#bbb] mb-3 -mt-1">
            개별 설정이 없는 직원에게 적용되는 기본값입니다
          </p>
        )}
      </div>

      <div className="flex flex-col gap-3 mb-8">
        {modeCards.map((card) => {
          const Icon = card.icon;
          const isActive = policy.mode === card.mode;
          return (
            <button
              key={card.mode}
              onClick={() => handleModeSelect(card.mode)}
              className="text-left w-full p-5 transition-all cursor-pointer"
              style={{
                borderRadius: "14px",
                backgroundColor: isActive ? "#fff" : "#fafafa",
                boxShadow: isActive
                  ? `${card.color}33 0px 0px 0px 2px, rgba(0,0,0,0.04) 0px 2px 8px`
                  : "rgba(0,0,0,0.04) 0px 0px 0px 1px",
              }}
            >
              <div className="flex items-start gap-4">
                <div className="mt-0.5">
                  <div
                    className="flex items-center justify-center w-10 h-10 rounded-xl"
                    style={{ backgroundColor: isActive ? `${card.color}14` : "#f0f0f0" }}
                  >
                    <Icon size={20} strokeWidth={1.5} color={isActive ? card.color : "#999"} />
                  </div>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-[15px] font-semibold" style={{ color: isActive ? "#111" : "#555" }}>
                      {card.title}
                    </span>
                    <span
                      className="text-[11px] font-medium px-2 py-0.5 rounded-full"
                      style={{
                        backgroundColor: isActive ? `${card.color}14` : "rgba(0,0,0,0.04)",
                        color: isActive ? card.color : "#999",
                      }}
                    >
                      {card.subtitle}
                    </span>
                    {isActive && (
                      <span className="ml-auto flex items-center gap-1 text-[11px] font-medium" style={{ color: card.color }}>
                        <Check size={12} strokeWidth={2} /> 적용 중
                      </span>
                    )}
                  </div>
                  <p className="text-[12px] text-[#888] leading-[1.6] mb-2.5">{card.description}</p>
                  <div className="flex flex-wrap gap-2">
                    {card.features.map((f) => (
                      <span
                        key={f}
                        className="inline-flex items-center gap-1 px-2 py-[3px] text-[11px] font-medium"
                        style={{
                          borderRadius: "6px",
                          backgroundColor: isActive ? `${card.color}0a` : "rgba(0,0,0,0.03)",
                          color: isActive ? card.color : "#aaa",
                        }}
                      >
                        <Check size={10} strokeWidth={2} />{f}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </button>
          );
        })}
      </div>

      {/* ── 유저별 적용 모드: 팀원 정책 테이블 ── */}
      {applyMode === "per-user" && (
        <div className="mb-8">
          <p className="text-[12px] font-medium text-[#999] uppercase tracking-wider mb-3">팀원별 정책</p>
          <div
            className="overflow-hidden"
            style={{ borderRadius: "14px", boxShadow: "rgba(0,0,0,0.04) 0px 0px 0px 1px" }}
          >
            {/* 테이블 헤더 */}
            <div
              className="grid items-center px-5 py-3 text-[11px] font-medium text-[#999] uppercase tracking-wider"
              style={{ gridTemplateColumns: "1fr 80px 120px 100px 60px", backgroundColor: "#fafafa", borderBottom: "1px solid rgba(0,0,0,0.04)" }}
            >
              <span>이름</span>
              <span>역할</span>
              <span>에이전트 모드</span>
              <span>채팅 구매</span>
              <span></span>
            </div>

            {/* 팀원 행 */}
            {users.map((user) => {
              const override = userOverrides[user.id];
              const effective = getEffectivePolicy(user.id);
              const hasOverride = !!override;
              const effectiveMode = effective.mode;
              const color = modeColors[effectiveMode];

              return (
                <div key={user.id}>
                  <div
                    className="grid items-center px-5 py-3 text-[13px] cursor-pointer hover:bg-[#fafafa] transition-colors"
                    style={{
                      gridTemplateColumns: "1fr 80px 120px 100px 60px",
                      borderBottom: "1px solid rgba(0,0,0,0.03)",
                      backgroundColor: editingUserId === user.id ? "#f8f8ff" : "#fff",
                    }}
                    onClick={() => setEditingUserId(editingUserId === user.id ? null : user.id)}
                  >
                    {/* 이름 */}
                    <div className="flex items-center gap-2.5">
                      <div
                        className="w-7 h-7 rounded-full flex items-center justify-center text-[11px] font-semibold text-white shrink-0"
                        style={{ backgroundColor: hasOverride ? color : "#ccc" }}
                      >
                        {user.name.slice(0, 1)}
                      </div>
                      <div>
                        <span className="text-[#333] font-medium">{user.name}</span>
                        <p className="text-[10px] text-[#bbb]">{user.department}</p>
                      </div>
                    </div>

                    {/* 역할 */}
                    <span className="text-[12px] text-[#888]">{user.role}</span>

                    {/* 모드 뱃지 */}
                    <span
                      className="inline-flex items-center gap-1 px-2 py-[3px] text-[11px] font-medium w-fit"
                      style={{ borderRadius: "6px", backgroundColor: `${color}14`, color }}
                    >
                      {hasOverride ? modeLabels[effectiveMode] : `${modeLabels[effectiveMode]} (기본)`}
                    </span>

                    {/* 채팅 구매 */}
                    <span className="text-[12px]" style={{ color: effective.chatPurchaseEnabled ? "#22c55e" : "#999" }}>
                      {effective.chatPurchaseEnabled ? "허용" : "비활성"}
                    </span>

                    {/* 편집 표시 */}
                    <span className="text-[11px] text-[#bbb]">
                      {hasOverride ? "커스텀" : "기본"}
                    </span>
                  </div>

                  {/* 확장: 개별 설정 패널 */}
                  {editingUserId === user.id && (
                    <UserOverrideEditor
                      userId={user.id}
                      userName={user.name}
                      override={override}
                      companyMode={policy.mode}
                      onSave={(ov) => {
                        setUserOverride(user.id, ov);
                        setEditingUserId(null);
                        showToast(`${user.name}님의 정책이 저장되었습니다`);
                      }}
                      onReset={() => {
                        removeUserOverride(user.id);
                        setEditingUserId(null);
                        showToast(`${user.name}님의 정책이 회사 기본으로 복원되었습니다`);
                      }}
                      onCancel={() => setEditingUserId(null)}
                    />
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ── 상세 설정 ── */}
      <button
        onClick={() => setShowAdvanced(!showAdvanced)}
        className="flex items-center gap-2 mb-4 text-[13px] font-medium text-[#555] cursor-pointer hover:text-[#111] transition-colors"
      >
        <ChevronDown
          size={14} strokeWidth={1.5}
          className="transition-transform"
          style={{ transform: showAdvanced ? "rotate(180deg)" : "rotate(0)" }}
        />
        회사 기본 상세 설정
        <span className="text-[11px] text-[#bbb] font-normal">모드 선택 시 자동 적용 · 개별 조정 가능</span>
      </button>

      {showAdvanced && (
        <div
          className="flex flex-col gap-0 mb-8"
          style={{ borderRadius: "14px", boxShadow: "rgba(0,0,0,0.04) 0px 0px 0px 1px", overflow: "hidden" }}
        >
          <SettingRow icon={policy.searchScope === "all" ? Globe : Database} iconColor={policy.searchScope === "all" ? "#3b82f6" : "#f59e0b"} title="상품 탐색 범위" description="에이전트가 추천할 상품의 범위">
            <SegmentToggle<SearchScope> options={[{ value: "all", label: "외부 포함" }, { value: "internal", label: "등록 상품만" }]} value={policy.searchScope} onChange={(v) => updatePolicy({ searchScope: v })} />
          </SettingRow>
          <SettingRow icon={ShoppingCart} iconColor={policy.chatPurchaseEnabled ? "#22c55e" : "#999"} title="채팅 구매 허용" description="채팅에서 장바구니 담기 및 구매 요청">
            <Toggle value={policy.chatPurchaseEnabled} onChange={(v) => updatePolicy({ chatPurchaseEnabled: v })} />
          </SettingRow>
          <SettingRow icon={policy.productRegisterPolicy === "anyone" ? UserPlus : UserCheck} iconColor={policy.productRegisterPolicy === "anyone" ? "#8b5cf6" : "#f59e0b"} title="상품 등록 권한" description="새 상품을 회사 폴더에 등록할 수 있는 사람">
            <SegmentToggle<ProductRegisterPolicy> options={[{ value: "anyone", label: "전체 직원" }, { value: "manager-only", label: "관리자만" }]} value={policy.productRegisterPolicy} onChange={(v) => updatePolicy({ productRegisterPolicy: v })} />
          </SettingRow>
          <SettingRow icon={Gauge} iconColor="#3b82f6" title="품의 자동승인 한도" description="설정 금액 이하 구매는 품의 없이 자동 승인">
            <AmountInput value={policy.autoApprovalLimit} onChange={(v) => updatePolicy({ autoApprovalLimit: v })} />
          </SettingRow>
          <SettingRow icon={Eye} iconColor={policy.showAgentInsights ? "#22c55e" : "#999"} title="에이전트 인사이트" description="상품 카드에서 구매 패턴, 가격 변동 표시" last>
            <Toggle value={policy.showAgentInsights} onChange={(v) => updatePolicy({ showAgentInsights: v })} />
          </SettingRow>
        </div>
      )}

      {/* ── 회사 지식 (통합) ── */}
      <button
        onClick={() => setShowKnowledge(!showKnowledge)}
        className="flex items-center gap-2 mb-4 text-[13px] font-medium text-[#555] cursor-pointer hover:text-[#111] transition-colors"
      >
        <ChevronDown
          size={14} strokeWidth={1.5}
          className="transition-transform"
          style={{ transform: showKnowledge ? "rotate(180deg)" : "rotate(0)" }}
        />
        <Brain size={14} strokeWidth={1.5} color="#8b5cf6" />
        회사 지식
        <span className="text-[11px] text-[#bbb] font-normal">에이전트가 구매 상담 시 참고하는 회사 정보</span>
      </button>

      {showKnowledge && (
        <div
          className="mb-8 p-5"
          style={{ borderRadius: "14px", boxShadow: "rgba(0,0,0,0.04) 0px 0px 0px 1px", backgroundColor: "#fff" }}
        >
          {/* 프롬프트 */}
          <div className="mb-5">
            <label className="block text-[12px] font-medium text-[#999] uppercase tracking-wider mb-2">맞춤형 프롬프트</label>
            <textarea
              value={knowledgePrompt}
              onChange={(e) => setKnowledgePrompt(e.target.value)}
              rows={5}
              className="w-full px-3.5 py-2.5 text-[13px] outline-none resize-none leading-[1.6]"
              style={{ borderRadius: "10px", boxShadow: "rgba(0,0,0,0.06) 0px 0px 0px 1px" }}
            />
          </div>

          {/* 파일 업로드 */}
          <div className="mb-5">
            <label className="block text-[12px] font-medium text-[#999] uppercase tracking-wider mb-2">내부 데이터 업로드</label>
            <div
              className="flex flex-col items-center py-6 cursor-pointer hover:bg-[#fafafa] transition-colors"
              style={{ borderRadius: "12px", border: "2px dashed #e5e5e5" }}
            >
              <Upload size={20} strokeWidth={1.2} color="#ccc" />
              <p className="text-[12px] text-[#777] mt-2">사내 규정, 구매 정책 문서를 업로드하세요</p>
              <p className="text-[11px] text-[#bbb] mt-0.5">.pdf, .docx, .xlsx</p>
            </div>
          </div>

          {/* 태그 */}
          <div className="mb-5">
            <label className="block text-[12px] font-medium text-[#999] uppercase tracking-wider mb-2">AI 학습 요약</label>
            <div className="flex flex-wrap gap-2">
              {knowledgeTags.map((tag, i) => (
                <div key={i} className="group relative">
                  {editingTag === i ? (
                    <input
                      autoFocus
                      defaultValue={tag}
                      onBlur={(e) => updateKnowledgeTag(i, e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && updateKnowledgeTag(i, e.currentTarget.value)}
                      className="px-3 py-1 text-[12px] outline-none bg-white"
                      style={{ borderRadius: "8px", boxShadow: "rgba(0,0,0,0.15) 0px 0px 0px 1.5px" }}
                    />
                  ) : (
                    <span
                      onClick={() => setEditingTag(i)}
                      className="inline-flex items-center gap-1 px-3 py-1 text-[12px] font-medium text-[#444] bg-[#f5f5f5] cursor-pointer hover:bg-[#ebebeb] transition-colors"
                      style={{ borderRadius: "8px" }}
                    >
                      {tag}
                      <button onClick={(e) => { e.stopPropagation(); removeKnowledgeTag(i); }} className="opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer">
                        <X size={12} strokeWidth={1.5} color="#999" />
                      </button>
                    </span>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* 액션 */}
          <div className="flex gap-2">
            <button onClick={() => showToast("회사 지식이 저장되었습니다")} className="px-4 py-[7px] text-[13px] font-medium text-white bg-black cursor-pointer hover:opacity-80 transition-opacity" style={{ borderRadius: "10px" }}>저장</button>
            <PlannedTooltip description="AI 재학습" position="right">
              <button className="flex items-center gap-1.5 px-3 py-[7px] text-[12px] text-[#777] bg-[#f5f5f5] cursor-pointer hover:bg-[#ebebeb] transition-colors" style={{ borderRadius: "10px" }}>
                <RefreshCw size={13} strokeWidth={1.5} />재학습
              </button>
            </PlannedTooltip>
          </div>
        </div>
      )}

      {/* ── 현재 정책 요약 ── */}
      <div className="px-5 py-4 flex items-start gap-3" style={{ borderRadius: "12px", backgroundColor: "#f9f9f9" }}>
        <Info size={16} strokeWidth={1.5} color="#bbb" className="mt-0.5 shrink-0" />
        <div className="text-[12px] text-[#777] leading-[1.7]">
          <span className="font-medium text-[#555]">현재 정책 요약</span><br />
          {applyMode === "company"
            ? "전사 일괄 적용 중. "
            : `유저별 적용 중 · ${Object.keys(userOverrides).length}명 커스텀 설정. `}
          {policy.mode === "open" && "에이전트가 외부 API 포함 전체 상품을 탐색하며, 채팅을 통한 구매가 가능합니다."}
          {policy.mode === "guided" && "에이전트가 등록 상품 내에서 추천하며, 채팅 구매가 가능합니다."}
          {policy.mode === "locked" && "구매는 GUI 플로우로만 가능하며, 채팅은 CS/안내 용도입니다."}
          {policy.autoApprovalLimit > 0 && ` ${policy.autoApprovalLimit.toLocaleString("ko-KR")}원 이하 품의는 자동승인.`}
        </div>
      </div>

      {/* Toast */}
      {toast && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[70] flex items-center gap-2 px-4 py-2.5 bg-[#1a1a1a] text-white text-[13px] font-medium" style={{ borderRadius: "10px", boxShadow: "rgba(0,0,0,0.2) 0px 4px 12px" }}>
          <Check size={14} strokeWidth={2} />{toast}
        </div>
      )}
    </div>
  );
}

/* ═══════════════════════════════════════
   유저별 오버라이드 편집기
   ═══════════════════════════════════════ */

function UserOverrideEditor({
  userId,
  userName,
  override,
  companyMode,
  onSave,
  onReset,
  onCancel,
}: {
  userId: string;
  userName: string;
  override?: { mode?: AgentMode; searchScope?: SearchScope; chatPurchaseEnabled?: boolean; productRegisterPolicy?: ProductRegisterPolicy; autoApprovalLimit?: number; showAgentInsights?: boolean };
  companyMode: AgentMode;
  onSave: (ov: { mode?: AgentMode; searchScope?: SearchScope; chatPurchaseEnabled?: boolean }) => void;
  onReset: () => void;
  onCancel: () => void;
}) {
  const [mode, setMode] = useState<AgentMode>(override?.mode ?? companyMode);
  const [chatPurchase, setChatPurchase] = useState<boolean | undefined>(override?.chatPurchaseEnabled);
  const [searchScope, setSearchScope] = useState<SearchScope | undefined>(override?.searchScope);

  return (
    <div
      className="px-5 py-4 bg-[#fafafa]"
      style={{ borderBottom: "1px solid rgba(0,0,0,0.04)" }}
    >
      <div className="flex items-center justify-between mb-4">
        <span className="text-[13px] font-semibold text-[#333]">{userName} 개별 정책</span>
        {override && (
          <button
            onClick={onReset}
            className="text-[11px] text-[#ef4444] cursor-pointer hover:underline"
          >
            기본으로 복원
          </button>
        )}
      </div>

      <div className="flex flex-col gap-3 mb-4">
        {/* 모드 */}
        <div className="flex items-center justify-between">
          <span className="text-[12px] text-[#666]">에이전트 모드</span>
          <div className="inline-flex p-[3px]" style={{ borderRadius: "10px", backgroundColor: "#eee" }}>
            {(["open", "guided", "locked"] as AgentMode[]).map((m) => {
              const active = m === mode;
              const c = modeColors[m];
              return (
                <button
                  key={m}
                  onClick={() => setMode(m)}
                  className="px-3 py-[5px] text-[11px] font-medium cursor-pointer transition-all"
                  style={{
                    borderRadius: "8px",
                    backgroundColor: active ? "#fff" : "transparent",
                    color: active ? c : "#999",
                    boxShadow: active ? "rgba(0,0,0,0.06) 0px 1px 3px" : "none",
                  }}
                >
                  {modeLabels[m]}
                </button>
              );
            })}
          </div>
        </div>

        {/* 탐색 범위 */}
        <div className="flex items-center justify-between">
          <span className="text-[12px] text-[#666]">탐색 범위</span>
          <SegmentToggle<SearchScope>
            options={[{ value: "all", label: "외부 포함" }, { value: "internal", label: "등록만" }]}
            value={searchScope ?? (mode === "open" ? "all" : "internal")}
            onChange={(v) => setSearchScope(v)}
          />
        </div>

        {/* 채팅 구매 */}
        <div className="flex items-center justify-between">
          <span className="text-[12px] text-[#666]">채팅 구매</span>
          <Toggle
            value={chatPurchase ?? mode !== "locked"}
            onChange={(v) => setChatPurchase(v)}
          />
        </div>
      </div>

      <div className="flex items-center gap-2 justify-end">
        <button
          onClick={onCancel}
          className="px-3 py-[6px] text-[12px] text-[#777] bg-white cursor-pointer hover:bg-[#f0f0f0] transition-colors"
          style={{ borderRadius: "8px", boxShadow: "rgba(0,0,0,0.06) 0px 0px 0px 1px" }}
        >
          취소
        </button>
        <button
          onClick={() => onSave({ mode, searchScope, chatPurchaseEnabled: chatPurchase })}
          className="px-3 py-[6px] text-[12px] font-medium text-white bg-[#111] cursor-pointer hover:opacity-80 transition-opacity"
          style={{ borderRadius: "8px" }}
        >
          저장
        </button>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════
   Apply Mode Card
   ═══════════════════════════════════════ */

function ApplyModeCard({
  active,
  icon: Icon,
  title,
  description,
  onClick,
}: {
  active: boolean;
  icon: React.ComponentType<{ size?: number; strokeWidth?: number; color?: string }>;
  title: string;
  description: string;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className="flex-1 flex items-center gap-3 p-4 text-left cursor-pointer transition-all"
      style={{
        borderRadius: "12px",
        backgroundColor: active ? "#fff" : "#fafafa",
        boxShadow: active
          ? "rgba(0,0,0,0.1) 0px 0px 0px 1.5px, rgba(0,0,0,0.04) 0px 2px 8px"
          : "rgba(0,0,0,0.04) 0px 0px 0px 1px",
      }}
    >
      <div
        className="flex items-center justify-center w-9 h-9 rounded-lg shrink-0"
        style={{ backgroundColor: active ? "#f0f0f0" : "#eee" }}
      >
        <Icon size={17} strokeWidth={1.5} color={active ? "#111" : "#999"} />
      </div>
      <div>
        <p className="text-[13px] font-semibold" style={{ color: active ? "#111" : "#777" }}>{title}</p>
        <p className="text-[11px] text-[#999] mt-0.5">{description}</p>
      </div>
      {active && (
        <Check size={16} strokeWidth={2} color="#111" className="ml-auto shrink-0" />
      )}
    </button>
  );
}

/* ═══════════════════════════════════════
   Sub-components
   ═══════════════════════════════════════ */

function SettingRow({
  icon: Icon, iconColor, title, description, last, children,
}: {
  icon: React.ComponentType<{ size?: number; strokeWidth?: number; color?: string }>;
  iconColor: string; title: string; description: string; last?: boolean; children: React.ReactNode;
}) {
  return (
    <div className="flex items-center justify-between px-5 py-4" style={{ borderBottom: last ? "none" : "1px solid rgba(0,0,0,0.04)", backgroundColor: "#fff" }}>
      <div className="flex items-center gap-3">
        <div className="flex items-center justify-center w-8 h-8 rounded-lg shrink-0" style={{ backgroundColor: `${iconColor}10` }}>
          <Icon size={15} strokeWidth={1.5} color={iconColor} />
        </div>
        <div>
          <p className="text-[13px] font-medium text-[#333]">{title}</p>
          <p className="text-[11px] text-[#999] mt-0.5">{description}</p>
        </div>
      </div>
      <div className="shrink-0 ml-4">{children}</div>
    </div>
  );
}

function Toggle({ value, onChange }: { value: boolean; onChange: (v: boolean) => void }) {
  return (
    <button onClick={() => onChange(!value)} className="relative w-[44px] h-[24px] rounded-full cursor-pointer transition-colors" style={{ backgroundColor: value ? "#111" : "#ddd" }}>
      <div className="absolute top-[2px] w-[20px] h-[20px] bg-white rounded-full transition-all" style={{ left: value ? "22px" : "2px", boxShadow: "rgba(0,0,0,0.1) 0px 1px 3px" }} />
    </button>
  );
}

function SegmentToggle<T extends string>({ options, value, onChange }: { options: { value: T; label: string }[]; value: T; onChange: (v: T) => void }) {
  return (
    <div className="inline-flex p-[3px]" style={{ borderRadius: "10px", backgroundColor: "#f0f0f0" }}>
      {options.map((opt) => {
        const active = opt.value === value;
        return (
          <button key={opt.value} onClick={() => onChange(opt.value)} className="px-3 py-[5px] text-[12px] font-medium cursor-pointer transition-all" style={{ borderRadius: "8px", backgroundColor: active ? "#fff" : "transparent", color: active ? "#111" : "#999", boxShadow: active ? "rgba(0,0,0,0.06) 0px 1px 3px" : "none" }}>
            {opt.label}
          </button>
        );
      })}
    </div>
  );
}

function AmountInput({ value, onChange }: { value: number; onChange: (v: number) => void }) {
  const presets = [0, 50000, 100000, 300000, 500000];
  return (
    <select value={value} onChange={(e) => onChange(Number(e.target.value))} className="px-3 py-[6px] text-[12px] font-medium bg-white cursor-pointer appearance-none outline-none" style={{ borderRadius: "8px", boxShadow: "rgba(0,0,0,0.06) 0px 0px 0px 1px", minWidth: "140px" }}>
      {presets.map((p) => <option key={p} value={p}>{p === 0 ? "자동승인 없음" : `${p.toLocaleString("ko-KR")}원 이하`}</option>)}
    </select>
  );
}
