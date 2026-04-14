"use client";

import { useState } from "react";
import {
  Building2, Users, MapPin, CreditCard, FileText, PiggyBank,
  ChevronDown, ChevronUp, Bot, GitBranch, Clock,
} from "lucide-react";
import { useSettings, type SettingsSection } from "@/lib/settings-context";
import { useAgentPolicy, modeLabels as agentModeLabels } from "@/lib/agent-policy-context";
import { useSettingsStore } from "@/lib/settings-store";
import { users } from "@/data/users";
import VersionHistoryPopover from "@/components/ui/VersionHistoryPopover";
import { Check } from "lucide-react";

/* ═══════════════════════════════════════
   Utilities
   ═══════════════════════════════════════ */

const AVATAR_COLORS = ["#3a3a3a", "#5b4a3a", "#4a4a4a", "#8a6f3f", "#2f2f2f", "#6b5d4a"];

function hashColor(name: string) {
  const i = name.split("").reduce((acc, c) => acc + c.charCodeAt(0), 0);
  return AVATAR_COLORS[i % AVATAR_COLORS.length];
}

function initials(name: string) {
  // 한글 이름은 끝 2자, 영문은 첫 2자
  const trimmed = name.trim();
  if (/^[가-힣]+$/.test(trimmed)) return trimmed.slice(-2);
  return trimmed.slice(0, 2);
}

function formatMan(n: number) {
  const man = Math.round(n / 10000);
  return `${man.toLocaleString()}만원`;
}

function formatBudgetHero(n: number) {
  if (n >= 100000000) {
    const eok = Math.floor(n / 100000000);
    const man = Math.round((n % 100000000) / 10000);
    return man > 0 ? `${eok}억 ${man.toLocaleString()}만원` : `${eok}억원`;
  }
  return formatMan(n);
}

function rolePermission(role: string) {
  if (role === "관리자") return "전체 접근";
  if (role === "매니저") return "승인 권한";
  if (role === "구매담당") return "구매 요청";
  return "일반";
}

/* ═══════════════════════════════════════
   Avatar
   ═══════════════════════════════════════ */

function Avatar({ name, size = 28 }: { name: string; size?: number }) {
  return (
    <div
      className="flex items-center justify-center text-white font-medium shrink-0"
      style={{
        width: size,
        height: size,
        borderRadius: "9999px",
        backgroundColor: hashColor(name),
        fontSize: size >= 30 ? "11px" : "10px",
        letterSpacing: "0.14px",
      }}
    >
      {initials(name)}
    </div>
  );
}

/* ═══════════════════════════════════════
   Main
   ═══════════════════════════════════════ */

export default function SettingsDashboard() {
  const { setSection } = useSettings();
  const { policy, applyMode: policyApplyMode, userOverrides } = useAgentPolicy();
  const {
    budget, totalAnnual, totalUsed,
    company, shipping, payments, defaultShipping, activePaymentsCount,
    invitedMembers, descriptionRules, aiDescriptionEnabled,
    toggleAiDescription,
    versionHistory,
  } = useSettingsStore();

  // 예산은 기본 펼침 — 이미지 기준
  const [expanded, setExpanded] = useState<Record<string, boolean>>({
    "accounting-budget": true,
  });
  const toggle = (id: string) => setExpanded((p) => ({ ...p, [id]: !p[id] }));

  const teamMembers = users;
  const teamCount = teamMembers.length;
  const activePayments = payments.filter((p) => p.active);
  const primaryPayment = activePayments[0];

  // 월 단위 환산 (annual / 12)
  const monthlyBudget = Math.round(totalAnnual / 12);
  const monthlyUsed = Math.round(totalUsed / 12);

  return (
    <div className="px-5 pt-14 pb-6 flex flex-col gap-2.5">
      {/* ── 헤더 + 변경기록 트리거 ── */}
      <div className="flex items-center justify-between mb-1">
        <h2 className="text-[16px] font-semibold text-[#1a1a1a]" style={{ letterSpacing: "0.14px" }}>
          설정 현황
        </h2>
        <VersionHistoryPopover>
          <button
            className="flex items-center gap-1.5 px-2.5 py-1 text-[11px] font-medium text-[#777169] cursor-pointer transition-colors hover:text-[#000] hover:bg-[rgba(245,242,239,0.6)]"
            style={{
              borderRadius: "9999px",
              boxShadow: "rgba(0,0,0,0.06) 0px 0px 0px 1px",
              letterSpacing: "0.14px",
            }}
          >
            <Clock size={11} strokeWidth={1.5} />
            변경기록 {versionHistory.length > 0 && <span className="text-[#000]">{versionHistory.length}</span>}
          </button>
        </VersionHistoryPopover>
      </div>

      {/* ── 전체 설정 진행률 — 웜 스톤 시그니처 블록 ── */}
      {(() => {
        const totalCards = 8;
        const doneCount = [
          !!company.name,
          teamMembers.length >= 2,
          shipping.length > 0,
          activePaymentsCount > 0,
          descriptionRules.length > 0,
          Object.keys(budget).length > 0,
          true, /* agent policy — always configured */
          true, /* approval rules — always configured */
        ].filter(Boolean).length;
        const progressPct = Math.round((doneCount / totalCards) * 100);

        return (
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
              {totalCards}개 중 <span className="font-medium text-[#000]">{doneCount}개 완료</span>
              {progressPct < 100 && <> · {totalCards - doneCount}개 남음</>}
            </p>
          </div>
        );
      })()}

      {/* ── 회사 정보 ── */}
      <Card
        icon={<Building2 size={16} strokeWidth={1.5} color="#777169" />}
        title="회사 정보"
        subtitle={company.name
          ? `${company.name}${company.bizNumber ? `, ${company.bizNumber}` : ""}`
          : "회사 정보 미입력"}
        expanded={!!expanded["company-info-edit"]}
        onToggle={() => toggle("company-info-edit")}
        onOpen={() => setSection("company-info-edit")}
      >
        <InfoList items={[
          { label: "회사명", value: company.name || "—" },
          { label: "사업자번호", value: company.bizNumber || "—" },
          { label: "대표자", value: company.ceo || "—" },
          { label: "주소", value: company.address || "—" },
          { label: "업종", value: company.industry || "—" },
          { label: "업태", value: company.businessType || "—" },
        ]} />
      </Card>

      {/* ── 팀원 ── */}
      <Card
        icon={<Users size={16} strokeWidth={1.5} color="#777169" />}
        title="팀원"
        customSummary={
          <div className="flex items-center gap-2">
            <div className="flex items-center">
              {teamMembers.slice(0, 3).map((m, i) => (
                <div
                  key={m.id}
                  style={{
                    marginLeft: i === 0 ? 0 : -8,
                    border: "2px solid #fff",
                    borderRadius: "9999px",
                  }}
                >
                  <Avatar name={m.name} size={22} />
                </div>
              ))}
              {teamCount > 3 && (
                <div
                  className="flex items-center justify-center text-[10px] font-medium text-white"
                  style={{
                    width: 22,
                    height: 22,
                    borderRadius: "9999px",
                    backgroundColor: "#b8b2a8",
                    marginLeft: -8,
                    border: "2px solid #fff",
                  }}
                >
                  +{teamCount - 3}
                </div>
              )}
            </div>
            <span className="text-[12px] text-[#777169]">
              {teamCount + invitedMembers.length}명
            </span>
          </div>
        }
        expanded={!!expanded["company-team"]}
        onToggle={() => toggle("company-team")}
        onOpen={() => setSection("company-team")}
      >
        <div className="flex flex-col">
          {teamMembers.map((m, i) => (
            <div
              key={m.id}
              className="flex items-center gap-3 py-2.5"
              style={{ borderTop: i > 0 ? "1px solid rgba(0,0,0,0.06)" : undefined }}
            >
              <Avatar name={m.name} size={32} />
              <div className="flex-1 min-w-0">
                <p className="text-[13px] font-semibold text-[#1a1a1a]" style={{ letterSpacing: "0.14px" }}>
                  {m.name}
                </p>
                <p className="text-[11px] text-[#777169] truncate" style={{ letterSpacing: "0.14px" }}>
                  {m.role} · {rolePermission(m.role)}
                </p>
              </div>
            </div>
          ))}
          {invitedMembers.length > 0 && (
            <div className="mt-2 pt-2" style={{ borderTop: "1px solid rgba(0,0,0,0.06)" }}>
              <p className="text-[10px] text-[#999] mb-1" style={{ letterSpacing: "0.14px" }}>
                초대 대기 · {invitedMembers.length}
              </p>
              {invitedMembers.map((m) => (
                <div key={m.id} className="flex items-center gap-3 py-1.5">
                  <Avatar name={m.name} size={26} />
                  <div className="flex-1 min-w-0">
                    <p className="text-[12px] font-medium text-[#4e4e4e]">{m.name}</p>
                    <p className="text-[10px] text-[#999] truncate">{m.email}</p>
                  </div>
                  <span className="text-[10px] text-[#f59e0b] font-medium">대기</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </Card>

      {/* ── 배송지 ── */}
      <Card
        icon={<MapPin size={16} strokeWidth={1.5} color="#777169" />}
        title="배송지"
        subtitle={
          shipping.length === 0
            ? "등록된 배송지가 없습니다"
            : shipping.length === 1
              ? `${defaultShipping?.name ?? shipping[0].name} (${shortAddr(defaultShipping?.address ?? shipping[0].address)})`
              : `${defaultShipping?.name ?? "기본"} (${shortAddr(defaultShipping?.address ?? "")}) 외 ${shipping.length - 1}개`
        }
        expanded={!!expanded["company-shipping"]}
        onToggle={() => toggle("company-shipping")}
        onOpen={() => setSection("company-shipping")}
      >
        <div className="flex flex-col">
          {shipping.map((s, i) => (
            <div
              key={s.id}
              className="flex items-start gap-2 py-2.5"
              style={{ borderTop: i > 0 ? "1px solid rgba(0,0,0,0.06)" : undefined }}
            >
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5 mb-0.5">
                  <p className="text-[13px] font-semibold text-[#1a1a1a]">{s.name}</p>
                  {s.isDefault && <span className="text-[10px] text-[#3b82f6] font-medium">기본</span>}
                </div>
                <p className="text-[11px] text-[#777169] truncate">{s.address}</p>
              </div>
            </div>
          ))}
        </div>
      </Card>

      {/* ── 결제수단 ── */}
      <Card
        icon={<CreditCard size={16} strokeWidth={1.5} color="#777169" />}
        title="결제수단"
        subtitle={primaryPayment
          ? `${primaryPayment.name}${activePaymentsCount > 1 ? ` 외 ${activePaymentsCount - 1}개` : ""}`
          : payments.length > 0
            ? "사용중인 결제수단 없음"
            : "등록된 결제수단이 없습니다"}
        expanded={!!expanded["accounting-payment"]}
        onToggle={() => toggle("accounting-payment")}
        onOpen={() => setSection("accounting-payment")}
      >
        <div className="flex flex-col">
          {payments.map((p, i) => (
            <div
              key={p.id}
              className="flex items-center justify-between py-2.5"
              style={{ borderTop: i > 0 ? "1px solid rgba(0,0,0,0.06)" : undefined }}
            >
              <div className="flex-1 min-w-0">
                <p className="text-[12px] font-semibold text-[#1a1a1a] truncate">{p.name}</p>
                <p className="text-[10px] text-[#999]">{p.type} · {p.subLabel}</p>
              </div>
              <span
                className="text-[10px] font-medium ml-2 shrink-0"
                style={{ color: p.active ? "#16a34a" : "#bbb" }}
              >
                {p.active ? "사용중" : "미사용"}
              </span>
            </div>
          ))}
        </div>
      </Card>

      {/* ── 예산 (기본 펼침) ── */}
      <Card
        icon={<PiggyBank size={16} strokeWidth={1.5} color="#777169" />}
        title="예산"
        subtitle={totalAnnual > 0
          ? `이번 달 ${formatMan(monthlyBudget)} / ${formatMan(monthlyUsed)}`
          : "예산 미설정"}
        expanded={!!expanded["accounting-budget"]}
        onToggle={() => toggle("accounting-budget")}
        onOpen={() => setSection("accounting-budget")}
      >
        {totalAnnual > 0 ? (
          <div className="flex flex-col gap-4 pt-1">
            {/* 연간 / 이번 달 */}
            <div className="flex items-end justify-between">
              <div>
                <p className="text-[10px] text-[#999] mb-0.5" style={{ letterSpacing: "0.14px" }}>연간 예산</p>
                <p className="text-[17px] font-semibold text-[#1a1a1a]" style={{ letterSpacing: "-0.2px" }}>
                  {formatBudgetHero(totalAnnual)}
                </p>
              </div>
              <div className="text-right">
                <p className="text-[10px] text-[#999] mb-0.5" style={{ letterSpacing: "0.14px" }}>이번 달 사용</p>
                <p className="text-[15px] font-semibold text-[#1a1a1a]" style={{ letterSpacing: "-0.15px" }}>
                  {formatMan(monthlyUsed)}
                </p>
              </div>
            </div>

            {/* 진행바 */}
            <div>
              <div
                className="h-[4px] rounded-full overflow-hidden"
                style={{ backgroundColor: "rgba(0,0,0,0.06)" }}
              >
                <div
                  className="h-full rounded-full bg-[#000] transition-all duration-500"
                  style={{ width: `${Math.min((totalUsed / totalAnnual) * 100, 100)}%` }}
                />
              </div>
              <div className="flex justify-between mt-1.5 text-[10px] text-[#999]" style={{ letterSpacing: "0.14px" }}>
                <span>사용 {formatMan(totalUsed)}</span>
                <span>총 {formatBudgetHero(totalAnnual)}</span>
              </div>
            </div>

            {/* 부서별 */}
            <div
              className="flex flex-col gap-1.5 pt-3"
              style={{ borderTop: "1px solid rgba(0,0,0,0.06)" }}
            >
              {budget.departments.map((d) => {
                const deptMonthly = Math.round(d.annual / 12);
                const deptMonthlyUsed = Math.round(d.used / 12);
                return (
                  <div key={d.name} className="flex items-center justify-between text-[11px]">
                    <span className="text-[#777169]" style={{ letterSpacing: "0.14px" }}>{d.name}팀</span>
                    <span className="text-[#4e4e4e]" style={{ letterSpacing: "0.14px" }}>
                      {formatMan(deptMonthlyUsed)} / {formatMan(deptMonthly)}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        ) : (
          <p className="text-[11px] text-[#999] pt-2">예산이 설정되지 않았습니다.</p>
        )}
      </Card>

      {/* ── 규칙 (적요) ── */}
      <Card
        icon={<FileText size={16} strokeWidth={1.5} color="#777169" />}
        title="규칙"
        subtitle={`적요 자동생성 ${aiDescriptionEnabled ? "ON" : "OFF"} · ${descriptionRules.length}개 규칙`}
        expanded={!!expanded["accounting-description"]}
        onToggle={() => toggle("accounting-description")}
        onOpen={() => setSection("accounting-description")}
      >
        <div className="flex flex-col gap-3 pt-1">
          {/* AI 토글 */}
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[12px] font-semibold text-[#1a1a1a]">적요 자동생성</p>
              <p className="text-[10px] text-[#777169]">AI가 구매 항목에 적요 자동 작성</p>
            </div>
            <button
              onClick={(e) => { e.stopPropagation(); toggleAiDescription(!aiDescriptionEnabled); }}
              className="w-[32px] h-[18px] rounded-full cursor-pointer relative transition-colors shrink-0"
              style={{ backgroundColor: aiDescriptionEnabled ? "#000" : "#e5e5e5" }}
              aria-label="적요 자동생성 토글"
            >
              <span
                className="absolute top-[2px] w-[14px] h-[14px] rounded-full bg-white transition-all"
                style={{ left: aiDescriptionEnabled ? "16px" : "2px", boxShadow: "rgba(0,0,0,0.1) 0px 1px 2px" }}
              />
            </button>
          </div>

          {/* 상위 규칙 4개 */}
          {descriptionRules.length > 0 && (
            <div
              className="flex flex-col pt-3"
              style={{ borderTop: "1px solid rgba(0,0,0,0.06)" }}
            >
              {descriptionRules.slice(0, 4).map((r, i) => (
                <div
                  key={r.id}
                  className="flex items-center justify-between py-1.5"
                  style={{ borderTop: i > 0 ? "1px solid rgba(0,0,0,0.04)" : undefined }}
                >
                  <span className="text-[11px] text-[#4e4e4e]" style={{ letterSpacing: "0.14px" }}>{r.category}</span>
                  <span className="text-[10px] text-[#999] font-mono">
                    {r.code} · {r.account}
                  </span>
                </div>
              ))}
              {descriptionRules.length > 4 && (
                <p className="text-[10px] text-[#999] pt-2 text-center" style={{ letterSpacing: "0.14px" }}>
                  +{descriptionRules.length - 4}개 더
                </p>
              )}
            </div>
          )}
        </div>
      </Card>

      {/* ── 에이전트 정책 ── */}
      <Card
        icon={<Bot size={16} strokeWidth={1.5} color="#777169" />}
        title="에이전트 정책"
        subtitle={`${agentModeLabels[policy.mode]} 모드 · ${policyApplyMode === "company" ? "전사 일괄" : `유저별 (${Object.keys(userOverrides).length}명)`}`}
        expanded={!!expanded["agent-policy"]}
        onToggle={() => toggle("agent-policy")}
        onOpen={() => setSection("agent-policy")}
      >
        <InfoList items={[
          { label: "적용 방식", value: policyApplyMode === "company" ? "전사 일괄" : `유저별 (${Object.keys(userOverrides).length}명 커스텀)` },
          { label: "기본 모드", value: `${agentModeLabels[policy.mode]} 모드` },
          { label: "탐색 범위", value: policy.searchScope === "all" ? "외부 포함" : "등록 상품만" },
          { label: "채팅 구매", value: policy.chatPurchaseEnabled ? "허용" : "비활성" },
        ]} />
      </Card>

      {/* ── 승인 체계 ── */}
      <Card
        icon={<GitBranch size={16} strokeWidth={1.5} color="#777169" />}
        title="승인 체계"
        subtitle="4개 라인 · 소액 자동승인 50만원"
        expanded={!!expanded["approval-rules"]}
        onToggle={() => toggle("approval-rules")}
        onOpen={() => setSection("approval-rules")}
      >
        <InfoList items={[
          { label: "기본 승인라인", value: "팀장 → 부서장 → 최종결제" },
          { label: "부서별 분기", value: "4개 부서" },
          { label: "소액 자동승인", value: "50만원 이하" },
          { label: "최종결제자", value: "김원균 (대표)" },
        ]} />
      </Card>
    </div>
  );
}

/* ═══════════════════════════════════════
   서브: Card (collapsible)
   ═══════════════════════════════════════ */

function Card({
  icon,
  title,
  subtitle,
  customSummary,
  expanded,
  onToggle,
  onOpen,
  children,
}: {
  icon: React.ReactNode;
  title: string;
  subtitle?: string;
  customSummary?: React.ReactNode;
  expanded: boolean;
  onToggle: () => void;
  onOpen: () => void;
  children: React.ReactNode;
}) {
  return (
    <div
      className="bg-white overflow-hidden"
      style={{ borderRadius: "14px", boxShadow: "rgba(0,0,0,0.06) 0px 0px 0px 1px" }}
    >
      <button
        onClick={onToggle}
        className="w-full flex items-center gap-3 px-4 py-3.5 cursor-pointer hover:bg-[#fafafa] transition-colors text-left"
      >
        <div
          className="flex items-center justify-center w-9 h-9 rounded-[10px] shrink-0"
          style={{ backgroundColor: "#f5f2ef" }}
        >
          {icon}
        </div>
        <div className="flex-1 min-w-0">
          <p
            className="text-[13px] font-semibold text-[#1a1a1a] mb-0.5"
            style={{ letterSpacing: "0.14px" }}
          >
            {title}
          </p>
          {customSummary ?? (
            <p
              className="text-[11px] text-[#777169] truncate"
              style={{ letterSpacing: "0.14px" }}
            >
              {subtitle}
            </p>
          )}
        </div>
        {expanded
          ? <ChevronUp size={16} strokeWidth={1.5} color="#bbb" className="shrink-0" />
          : <ChevronDown size={16} strokeWidth={1.5} color="#bbb" className="shrink-0" />}
      </button>

      {expanded && (
        <div
          className="px-4 pb-4"
          style={{ borderTop: "1px solid rgba(0,0,0,0.04)" }}
        >
          {children}
          <button
            onClick={(e) => { e.stopPropagation(); onOpen(); }}
            className="mt-3 text-[11px] font-medium text-[#777169] hover:text-[#000] cursor-pointer transition-colors"
            style={{ letterSpacing: "0.14px" }}
          >
            자세히 편집 →
          </button>
        </div>
      )}
    </div>
  );
}

/* ═══════════════════════════════════════
   서브: InfoList
   ═══════════════════════════════════════ */

function InfoList({ items }: { items: { label: string; value: string }[] }) {
  return (
    <div className="flex flex-col gap-2 pt-2">
      {items.map((item) => (
        <div key={item.label} className="flex items-start justify-between gap-3">
          <span
            className="text-[11px] text-[#777169] shrink-0"
            style={{ letterSpacing: "0.14px" }}
          >
            {item.label}
          </span>
          <span
            className="text-[11px] text-[#4e4e4e] text-right truncate"
            style={{ letterSpacing: "0.14px" }}
          >
            {item.value}
          </span>
        </div>
      ))}
    </div>
  );
}

/* 짧은 주소 (시/구/동까지) */
function shortAddr(addr: string) {
  if (!addr) return "";
  const parts = addr.split(/\s+/);
  return parts.slice(0, 3).join(" ");
}

/* @public: SettingsSection 참조 유지용 (에디터 편의) */
export type { SettingsSection };
