"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import {
  Send, Sparkles, ChevronDown, ChevronRight,
  Check, X, AlertTriangle, ArrowRight,
  Brain, Loader2,
} from "lucide-react";
import { useSettings, type SettingsSection } from "@/lib/settings-context";
import { useSettingsEmit, useLastFormEvent } from "@/lib/settings-events";

/* ═══════════════════════════════════════
   타입 정의
   ═══════════════════════════════════════ */

interface ThinkingStep {
  label: string;
  detail?: string;
}

interface DiffItem {
  field: string;
  before: string;
  after: string;
}

interface ChatMessage {
  id: string;
  role: "ai" | "user" | "system";
  content: string;
  suggestions?: string[];
  /** 접히는 추론 블록 */
  thinking?: ThinkingStep[];
  /** 설정 변경 diff 카드 */
  diff?: { title: string; items: DiffItem[]; applied?: boolean };
  /** 영향 분석 경고 */
  impact?: { warning: string; details: string[] };
  /** 컨텍스트 힌트 (우측 패널 업데이트용) */
  contextHint?: string;
}

/* ═══════════════════════════════════════
   시나리오 (더미 대화)
   ═══════════════════════════════════════ */

/* ═══════════════════════════════════════
   폼 UI 액션 → 채팅 반응 메시지 생성
   ═══════════════════════════════════════ */

function buildFormActionResponse(panel: string, action: string, detail: string): ChatMessage {
  const d = detail.toLowerCase();

  /* 토글 변경 */
  if (action === "toggle") {
    return {
      id: `ai-form-${Date.now()}`, role: "ai",
      content: `설정을 변경했어요. ${detail.replace(/^\[.*?\]\s*/, "")}`,
      thinking: [
        { label: "설정 변경 감지", detail },
        { label: "영향 범위 확인", detail: "현재 팀 전체에 적용됩니다" },
      ],
    };
  }

  /* 저장 / 완료 / 적용 */
  if (d.includes("저장") || d.includes("완료") || d.includes("적용") || d.includes("확인")) {
    return {
      id: `ai-form-${Date.now()}`, role: "ai",
      content: "변경사항이 저장되었어요! 다른 설정도 수정할까요?",
      thinking: [
        { label: "저장 처리", detail },
        { label: "데이터 검증", detail: "정상적으로 반영되었습니다" },
      ],
      suggestions: ["다른 설정 볼래", "전체 현황 알려줘", "채팅으로 돌아갈래"],
    };
  }

  /* 추가 / 생성 / 등록 */
  if (d.includes("추가") || d.includes("생성") || d.includes("등록") || d.includes("새")) {
    return {
      id: `ai-form-${Date.now()}`, role: "ai",
      content: `새 항목을 추가하셨네요. ${detail.replace(/^\[.*?\]\s*/, "")}`,
      thinking: [
        { label: "항목 추가 감지", detail },
        { label: "유효성 확인", detail: "정상 추가됨" },
      ],
    };
  }

  /* 삭제 / 제거 */
  if (d.includes("삭제") || d.includes("제거") || d.includes("해제") || d.includes("회수")) {
    return {
      id: `ai-form-${Date.now()}`, role: "ai",
      content: "항목이 제거되었어요. 관련 설정에 영향이 없는지 확인했어요.",
      thinking: [
        { label: "제거 처리", detail },
        { label: "연관 설정 확인", detail: "다른 설정에 영향 없음" },
      ],
    };
  }

  /* 편집 / 수정 / 변경 */
  if (d.includes("편집") || d.includes("수정") || d.includes("변경") || d.includes("선택")) {
    return {
      id: `ai-form-${Date.now()}`, role: "ai",
      content: `수정하셨네요. ${detail.replace(/^\[.*?\]\s*/, "")}`,
      thinking: [
        { label: "변경 감지", detail },
      ],
    };
  }

  /* input 값 변경 (debounce 효과를 위해 간결하게) */
  if (action === "input-change") {
    return {
      id: `ai-form-${Date.now()}`, role: "ai",
      content: `입력값을 확인했어요. ${detail.replace(/^\[.*?\]\s*/, "")}`,
    };
  }

  /* 기본 */
  return {
    id: `ai-form-${Date.now()}`, role: "ai",
    content: `확인했어요. ${detail.replace(/^\[.*?\]\s*/, "")}`,
    thinking: [
      { label: "액션 감지", detail },
    ],
  };
}

function buildScenarioResponse(text: string): { messages: ChatMessage[]; delay?: number } {
  const t = text.toLowerCase();

  /* 예산 변경 */
  if (t.includes("예산") && (t.includes("올려") || t.includes("변경") || t.includes("500") || t.includes("수정"))) {
    return {
      messages: [
        {
          id: `ai-${Date.now()}`,
          role: "ai",
          content: "마케팅팀 월 예산을 500만원으로 변경할게요. 아래 변경사항을 확인해주세요.",
          thinking: [
            { label: "현재 마케팅팀 월 예산 조회", detail: "현재 설정: 월 380만원" },
            { label: "최근 3개월 실 지출 분석", detail: "평균 352만원/월 (예산 대비 92.6% 소진)" },
            { label: "변경 후 영향 계산", detail: "월 500만원 → 연간 6,000만원 → 전사 예산 대비 12.5%" },
            { label: "자동승인 한도 확인", detail: "50만원 이하 자동승인 — 변경 불필요" },
          ],
          diff: {
            title: "마케팅팀 예산 변경",
            items: [
              { field: "월 예산", before: "3,800,000원", after: "5,000,000원" },
              { field: "연간 합계", before: "45,600,000원", after: "60,000,000원" },
              { field: "전사 비중", before: "9.5%", after: "12.5%" },
            ],
          },
          contextHint: "budget",
        },
      ],
    };
  }

  /* 결제권한 해제 */
  if (t.includes("결제") && (t.includes("해제") || t.includes("회수"))) {
    return {
      messages: [
        {
          id: `ai-${Date.now()}`,
          role: "ai",
          content: "김지현님의 결제권한을 해제하기 전에 확인이 필요해요.",
          thinking: [
            { label: "김지현 권한 조회", detail: "현재: 결제권한 보유, 법인카드 A 배정" },
            { label: "결재 라인 영향 확인", detail: "영업팀 결재 라인 → 최종결제자 김지현 → 변경 필요" },
            { label: "진행 중 주문 확인", detail: "미결제 건 2건 발견 — 담당자 재배정 필요" },
          ],
          impact: {
            warning: "영업팀 결재 라인의 최종결제자가 비게 됩니다",
            details: [
              "영업팀 결재 라인 최종결제자 → 공석",
              "미결제 주문 2건 → 담당자 재배정 필요",
              "법인카드 A → 회수됨",
            ],
          },
          suggestions: ["박은서로 대체 지정해줘", "일단 보류할게", "미결제 건만 먼저 처리해줘"],
          contextHint: "approval",
        },
      ],
    };
  }

  /* 팀원 추가 */
  if (t.includes("팀원") || t.includes("초대") || t.includes("추가")) {
    return {
      messages: [
        {
          id: `ai-${Date.now()}`,
          role: "ai",
          content: "팀원을 추가할게요. 이름, 이메일, 부서, 역할을 알려주세요.",
          thinking: [
            { label: "현재 팀원 현황 조회", detail: "5명 등록 (관리자 1, 구매담당 2, 뷰어 2)" },
            { label: "가용 라이선스 확인", detail: "현재 플랜: 10명 중 5명 사용 — 여유 5석" },
          ],
          suggestions: [
            '최동현 donghyun@rawlabs.io 개발 구매담당',
            '한예진 yejin@rawlabs.io 마케팅 뷰어',
          ],
          contextHint: "team",
        },
      ],
    };
  }

  /* 에이전트 정책 */
  if (t.includes("에이전트") || t.includes("정책") || t.includes("모드")) {
    return {
      messages: [
        {
          id: `ai-${Date.now()}`,
          role: "ai",
          content: "에이전트 정책을 설정해볼게요. 현재 설정 상태를 분석했어요.",
          thinking: [
            { label: "현재 정책 조회", detail: "기본 모드: 추천 모드, 탐색: 외부 포함" },
            { label: "팀 사용 패턴 분석", detail: "최근 30일: 자동 구매 3건, 추천 후 구매 12건" },
            { label: "권장사항 도출", detail: "추천 모드 유지 권장 — 팀 규모 대비 적절" },
          ],
          suggestions: ["자동구매 모드로 바꿔줘", "등록 상품만 검색하게 해줘", "현재 설정 유지할게"],
          contextHint: "agent-policy",
        },
      ],
    };
  }

  /* 승인 체계 */
  if (t.includes("승인") || t.includes("결재") || t.includes("품의")) {
    return {
      messages: [
        {
          id: `ai-${Date.now()}`,
          role: "ai",
          content: "승인 체계를 확인할게요. 현재 4개 결재 라인이 설정되어 있어요.",
          thinking: [
            { label: "결재 라인 현황 조회", detail: "기본(1) + 영업팀(1) + 마케팅·운영(1) + 개발팀(1)" },
            { label: "최근 승인 소요시간 분석", detail: "평균 2.3시간, 최대 8시간 (마케팅·운영)" },
            { label: "병목 분석", detail: "2차 승인(100만원 이상) → 박은서 집중 — 분산 권장" },
          ],
          suggestions: ["마케팅팀 승인라인 수정해줘", "자동승인 한도 올려줘", "현재 구조 보여줘"],
          contextHint: "approval",
        },
      ],
    };
  }

  /* 배송지 */
  if (t.includes("배송")) {
    return {
      messages: [
        {
          id: `ai-${Date.now()}`,
          role: "ai",
          content: "배송지를 설정해볼게요. 배송지 이름, 주소, 수령인 정보를 알려주세요.",
          thinking: [
            { label: "현재 배송지 조회", detail: "1개 등록: 본사 (서울 강남구 테헤란로 152)" },
          ],
          suggestions: [
            "본사 주소 변경하고 싶어",
            "분당 지사 배송지 추가해줘",
          ],
          contextHint: "shipping",
        },
      ],
    };
  }

  /* 회사 정보 */
  if (t.includes("회사") && (t.includes("정보") || t.includes("등록"))) {
    return {
      messages: [
        {
          id: `ai-${Date.now()}`,
          role: "ai",
          content: "회사 정보를 확인할게요.",
          thinking: [
            { label: "등록된 회사 정보 조회", detail: "주식회사 로랩스, 사업자번호 142-87-01234" },
            { label: "누락 항목 확인", detail: "업종, 업태 미입력 — 적요 자동생성에 영향 가능" },
          ],
          diff: {
            title: "회사 정보 보완 제안",
            items: [
              { field: "업종", before: "(미입력)", after: "소프트웨어 개발업" },
              { field: "업태", before: "(미입력)", after: "정보통신업" },
            ],
          },
          contextHint: "company-info",
        },
      ],
    };
  }

  /* 전체 상태 */
  if (t.includes("상태") || t.includes("전체") || t.includes("현황")) {
    return {
      messages: [
        {
          id: `ai-${Date.now()}`,
          role: "ai",
          content: "현재 회사 설정 현황을 분석했어요.",
          thinking: [
            { label: "전체 설정 항목 스캔", detail: "8개 항목 중 3개 완료, 5개 진행 중" },
            { label: "우선순위 분석", detail: "팀원 추가 → 결제수단 연동 → 예산 월별 배분 순 권장" },
            { label: "리스크 확인", detail: "배송지 1개만 등록 — 다중 사업장이면 추가 필요" },
          ],
          suggestions: ["팀원부터 추가할게", "결제수단 연동하자", "예산 설정 마저 할게"],
          contextHint: "overview",
        },
      ],
    };
  }

  /* 박은서로 대체 */
  if (t.includes("박은서") && t.includes("대체")) {
    return {
      messages: [
        {
          id: `ai-${Date.now()}`,
          role: "ai",
          content: "영업팀 최종결제자를 박은서님으로 변경할게요.",
          thinking: [
            { label: "박은서 결제 자격 확인", detail: "법인카드 A, B 보유 → 결제 가능" },
            { label: "결재 라인 업데이트", detail: "영업팀: 1차 김지현 → 최종결제 박은서" },
            { label: "미결제 건 재배정", detail: "2건 → 박은서에게 자동 이관" },
          ],
          diff: {
            title: "영업팀 결재 라인 변경",
            items: [
              { field: "최종결제자", before: "김지현", after: "박은서" },
              { field: "미결제 건 담당", before: "김지현 (2건)", after: "박은서 (2건)" },
              { field: "김지현 결제권한", before: "보유", after: "해제됨" },
            ],
          },
          contextHint: "approval",
        },
      ],
    };
  }

  /* 기본 응답 */
  return {
    messages: [
      {
        id: `ai-${Date.now()}`,
        role: "ai",
        content: "어떤 설정을 도와드릴까요? 아래에서 선택하거나 자유롭게 말씀해주세요.",
        suggestions: [
          "마케팅팀 예산 500만원으로 올려줘",
          "김지현 결제권한 해제해줘",
          "승인 체계 확인해줘",
          "전체 설정 상태 알려줘",
        ],
      },
    ],
  };
}

/* ═══════════════════════════════════════
   카드 클릭 시 시작 메시지
   ═══════════════════════════════════════ */

function getCardEntryMessage(section: SettingsSection): ChatMessage | null {
  const map: Record<string, ChatMessage> = {
    "company-info-edit": {
      id: `entry-${Date.now()}`, role: "ai",
      content: "회사 정보를 수정할게요. 변경할 항목을 말씀해주세요.",
      thinking: [
        { label: "현재 회사 정보 로드", detail: "주식회사 로랩스, 142-87-01234, 서울 강남구" },
        { label: "미입력 항목 확인", detail: "업종, 업태 미입력" },
      ],
      suggestions: ["업종/업태 추가해줘", "주소 변경할게", "대표자 정보 수정"],
      contextHint: "company-info",
    },
    "company-team": {
      id: `entry-${Date.now()}`, role: "ai",
      content: "팀원 관리 화면이에요. 현재 5명이 등록되어 있어요.",
      thinking: [
        { label: "팀원 현황 조회", detail: "관리자 1, 구매담당 2, 뷰어 2 — 총 5명" },
        { label: "라이선스 확인", detail: "10명 중 5명 사용, 5석 여유" },
      ],
      suggestions: ["새 팀원 추가할게", "권한 변경하고 싶어", "팀원 목록 보여줘"],
      contextHint: "team",
    },
    "company-shipping": {
      id: `entry-${Date.now()}`, role: "ai",
      content: "배송지 설정이에요. 현재 본사 1곳이 등록되어 있어요.",
      thinking: [
        { label: "배송지 현황", detail: "본사: 서울 강남구 테헤란로 152, 7층" },
      ],
      suggestions: ["새 배송지 추가할게", "본사 주소 변경", "기본 배송지 바꿔줘"],
      contextHint: "shipping",
    },
    "accounting-payment": {
      id: `entry-${Date.now()}`, role: "ai",
      content: "결제수단 관리에요. 현재 법인카드 1개가 등록되어 있어요.",
      thinking: [
        { label: "결제수단 현황", detail: "법인카드 신한 ****-1234 등록" },
        { label: "미연동 항목", detail: "BNPL 미연동, 후불카드 미등록" },
      ],
      suggestions: ["카드 추가 등록할게", "BNPL 연동하고 싶어", "결제수단 목록 보여줘"],
      contextHint: "payment",
    },
    "accounting-budget": {
      id: `entry-${Date.now()}`, role: "ai",
      content: "예산 설정이에요. 연간 1.2억이 설정되어 있고, 일부 부서는 월별 한도가 미설정이에요.",
      thinking: [
        { label: "예산 현황 조회", detail: "연간 120,000,000원, 4개 부서 배분" },
        { label: "미설정 항목", detail: "디자인팀, 개발팀 월별 한도 미설정" },
      ],
      suggestions: ["마케팅팀 예산 수정할게", "전체 부서 월별 한도 설정해줘", "예산 현황 보여줘"],
      contextHint: "budget",
    },
    "agent-policy": {
      id: `entry-${Date.now()}`, role: "ai",
      content: "에이전트 정책 설정이에요. 현재 추천 모드로 운영 중이에요.",
      thinking: [
        { label: "현재 정책 조회", detail: "추천 모드, 외부 포함 탐색, 전사 일괄 적용" },
        { label: "사용 패턴", detail: "최근 30일 추천 후 구매 12건, 자동 구매 3건" },
      ],
      suggestions: ["자동구매 모드로 바꿔줘", "등록 상품만 검색하게 해줘", "유저별 설정할래"],
      contextHint: "agent-policy",
    },
    "approval-rules": {
      id: `entry-${Date.now()}`, role: "ai",
      content: "승인 체계 설정이에요. 현재 4개 결재 라인이 있어요.",
      thinking: [
        { label: "결재 라인 현황", detail: "기본 + 영업팀 + 마케팅·운영 + 개발팀" },
        { label: "승인 소요시간 분석", detail: "평균 2.3시간, 마케팅·운영이 가장 느림 (8시간)" },
      ],
      suggestions: ["새 결재 라인 추가할게", "자동승인 한도 변경해줘", "조직도 보여줘"],
      contextHint: "approval",
    },
    "accounting-description": {
      id: `entry-${Date.now()}`, role: "ai",
      content: "적요 설정이에요. AI 자동적요가 켜져있고 7개 규칙이 설정되어 있어요.",
      thinking: [
        { label: "적요 설정 현황", detail: "AI 자동적요 ON, 카테고리 매핑 7개 규칙" },
      ],
      suggestions: ["새 규칙 추가할게", "AI 적요 끄고 싶어", "규칙 목록 보여줘"],
      contextHint: "description",
    },
  };
  return map[section] ?? null;
}

/* ═══════════════════════════════════════
   서브 컴포넌트: 추론 블록
   ═══════════════════════════════════════ */

function ThinkingBlock({ steps }: { steps: ThinkingStep[] }) {
  const [open, setOpen] = useState(false);

  return (
    <div
      className="mt-2 mb-1"
      style={{ borderRadius: "10px", backgroundColor: "rgba(99,102,241,0.04)", border: "1px solid rgba(99,102,241,0.1)" }}
    >
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-2 w-full px-3 py-2 text-left cursor-pointer"
      >
        <Brain size={13} strokeWidth={1.5} color="#6366f1" />
        <span className="text-[12px] font-medium text-[#6366f1]">
          추론 과정 · {steps.length}단계
        </span>
        <ChevronDown
          size={12} strokeWidth={1.5} color="#6366f1"
          style={{ marginLeft: "auto", transform: open ? "rotate(180deg)" : "rotate(0)", transition: "transform 0.2s" }}
        />
      </button>
      {open && (
        <div className="px-3 pb-3 flex flex-col gap-1.5">
          {steps.map((step, i) => (
            <div key={i} className="flex items-start gap-2">
              <div className="mt-1 w-4 h-4 shrink-0 rounded-full flex items-center justify-center bg-[#6366f1] text-white text-[8px] font-bold">
                {i + 1}
              </div>
              <div>
                <p className="text-[12px] font-medium text-[#333]">{step.label}</p>
                {step.detail && <p className="text-[11px] text-[#888] mt-0.5">{step.detail}</p>}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

/* ═══════════════════════════════════════
   서브 컴포넌트: Diff 카드
   ═══════════════════════════════════════ */

function DiffCard({ diff, onApply, onReject }: {
  diff: NonNullable<ChatMessage["diff"]>;
  onApply: () => void;
  onReject: () => void;
}) {
  return (
    <div
      className="mt-2"
      style={{ borderRadius: "10px", boxShadow: "rgba(0,0,0,0.06) 0px 0px 0px 1px", overflow: "hidden" }}
    >
      <div className="px-3 py-2 flex items-center gap-2" style={{ backgroundColor: "#f9f9f9", borderBottom: "1px solid rgba(0,0,0,0.04)" }}>
        <ArrowRight size={12} strokeWidth={1.5} color="#666" />
        <span className="text-[12px] font-semibold text-[#333]">{diff.title}</span>
      </div>
      <div className="px-3 py-2.5 flex flex-col gap-2">
        {diff.items.map((item) => (
          <div key={item.field} className="flex items-center gap-2 text-[12px]">
            <span className="text-[#999] w-[80px] shrink-0">{item.field}</span>
            <span className="text-[#ef4444] line-through">{item.before}</span>
            <ArrowRight size={10} strokeWidth={1.5} color="#ccc" />
            <span className="text-[#22c55e] font-medium">{item.after}</span>
          </div>
        ))}
      </div>
      {!diff.applied && (
        <div className="px-3 py-2 flex items-center gap-2" style={{ borderTop: "1px solid rgba(0,0,0,0.04)" }}>
          <button
            onClick={onApply}
            className="flex items-center gap-1.5 px-3 py-1.5 text-[12px] font-medium text-white bg-[#111] cursor-pointer hover:opacity-80 transition-opacity"
            style={{ borderRadius: "8px" }}
          >
            <Check size={12} strokeWidth={2} />적용
          </button>
          <button
            onClick={onReject}
            className="flex items-center gap-1.5 px-3 py-1.5 text-[12px] text-[#999] cursor-pointer hover:text-[#555] hover:bg-[#f5f5f5] transition-colors"
            style={{ borderRadius: "8px" }}
          >
            <X size={12} strokeWidth={1.5} />취소
          </button>
        </div>
      )}
      {diff.applied && (
        <div className="px-3 py-2 flex items-center gap-1.5 text-[12px] text-[#22c55e] font-medium" style={{ borderTop: "1px solid rgba(0,0,0,0.04)" }}>
          <Check size={12} strokeWidth={2} />적용 완료
        </div>
      )}
    </div>
  );
}

/* ═══════════════════════════════════════
   서브 컴포넌트: 영향 분석 카드
   ═══════════════════════════════════════ */

function ImpactCard({ impact }: { impact: NonNullable<ChatMessage["impact"]> }) {
  return (
    <div
      className="mt-2 p-3"
      style={{ borderRadius: "10px", backgroundColor: "rgba(245,158,11,0.06)", border: "1px solid rgba(245,158,11,0.15)" }}
    >
      <div className="flex items-center gap-2 mb-2">
        <AlertTriangle size={13} strokeWidth={1.5} color="#f59e0b" />
        <span className="text-[12px] font-semibold text-[#92400e]">{impact.warning}</span>
      </div>
      <div className="flex flex-col gap-1">
        {impact.details.map((d, i) => (
          <div key={i} className="flex items-start gap-2 text-[11px] text-[#78716c]">
            <span className="mt-0.5">•</span>
            <span>{d}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════
   메인 컴포넌트
   ═══════════════════════════════════════ */

export default function SettingsChat() {
  const { section, setSection } = useSettings();
  const emit = useSettingsEmit();
  const lastFormEvent = useLastFormEvent();
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: "welcome",
      role: "ai",
      content: "안녕하세요! 회사 설정을 도와드릴게요.\n오른쪽 카드에서 항목을 선택하거나, 원하시는 설정을 자유롭게 말씀해주세요.",
      suggestions: [
        "전체 설정 상태 알려줘",
        "마케팅팀 예산 500만원으로 올려줘",
        "승인 체계 확인해줘",
        "팀원 추가하고 싶어",
      ],
    },
  ]);
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const prevSectionRef = useRef<SettingsSection | null>(null);
  const lastFormEventIdRef = useRef<string | null>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isTyping]);

  /* 폼 UI 이벤트 수신 → 채팅에 반응 메시지 생성 */
  useEffect(() => {
    if (!lastFormEvent || lastFormEvent.id === lastFormEventIdRef.current) return;
    lastFormEventIdRef.current = lastFormEvent.id;

    const detail = lastFormEvent.detail ?? lastFormEvent.action;

    // 유저 액션을 시스템 메시지로 표시
    setMessages((prev) => [
      ...prev,
      { id: `form-${Date.now()}`, role: "system", content: `🖱 ${detail}` },
    ]);

    // AI가 반응하는 메시지 생성
    setIsTyping(true);
    setTimeout(() => {
      const response = buildFormActionResponse(lastFormEvent.panel, lastFormEvent.action, lastFormEvent.detail ?? "");
      setMessages((prev) => [...prev, response]);
      setIsTyping(false);
    }, 600);
  }, [lastFormEvent]);

  /* 카드 클릭 → 채팅에 시작 메시지 주입 */
  useEffect(() => {
    if (section && section !== "company-info" && section !== prevSectionRef.current) {
      const entryMsg = getCardEntryMessage(section);
      if (entryMsg) {
        setMessages((prev) => [
          ...prev,
          { id: `nav-${Date.now()}`, role: "system", content: `📂 ${section} 열림` },
        ]);
        setIsTyping(true);
        setTimeout(() => {
          setMessages((prev) => [...prev, entryMsg]);
          setIsTyping(false);
        }, 500);
      }
    }
    prevSectionRef.current = section;
  }, [section]);

  const handleSend = useCallback((text: string) => {
    if (!text.trim()) return;

    setMessages((prev) => [...prev, { id: `user-${Date.now()}`, role: "user", content: text }]);
    setInput("");
    setIsTyping(true);

    const { messages: aiMsgs } = buildScenarioResponse(text);
    setTimeout(() => {
      setMessages((prev) => [...prev, ...aiMsgs]);
      setIsTyping(false);

      // 채팅 액션 → 폼에 이벤트 발행
      const contextHint = aiMsgs[0]?.contextHint;
      if (contextHint) {
        emit({
          source: "chat",
          panel: section ?? "company-info",
          action: text.slice(0, 30),
          detail: text,
        });
      }
    }, 800);
  }, [emit, section]);

  const handleApplyDiff = useCallback((msgId: string) => {
    setMessages((prev) =>
      prev.map((m) =>
        m.id === msgId && m.diff ? { ...m, diff: { ...m.diff, applied: true } } : m
      )
    );

    // diff 적용 → 폼에 이벤트 발행
    const msg = messages.find((m) => m.id === msgId);
    if (msg?.diff) {
      emit({
        source: "chat",
        panel: section ?? "company-info",
        action: msg.diff.title,
        detail: `${msg.diff.title} 적용됨`,
      });
    }

    setMessages((prev) => [...prev, {
      id: `applied-${Date.now()}`, role: "ai" as const,
      content: "적용했어요! 우측 패널에서 변경된 내용을 확인하실 수 있습니다.",
    }]);
  }, [emit, section, messages]);

  const handleRejectDiff = useCallback((msgId: string) => {
    setMessages((prev) => [...prev, {
      id: `sys-${Date.now()}`, role: "ai" as const,
      content: "변경을 취소했어요. 다른 설정을 도와드릴까요?",
      suggestions: ["다른 예산 수정할게", "승인 체계 보여줘", "전체 현황 알려줘"],
    }]);
  }, []);

  return (
    <>
      {/* 헤더 */}
      <div className="shrink-0 px-6 py-4 flex items-center gap-2" style={{ borderBottom: "1px solid rgba(0,0,0,0.05)" }}>
        <Sparkles size={16} strokeWidth={1.5} color="#6366f1" />
        <span className="text-[14px] font-medium text-[#333]">설정 어시스턴트</span>
        <span className="text-[12px] text-[#999] ml-1">— 대화로 설정하세요</span>
      </div>

      {/* 메시지 영역 */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto px-6 py-5 flex flex-col gap-4">
        {messages.map((msg) => {
          if (msg.role === "system") {
            return (
              <div key={msg.id} className="flex justify-center">
                <span className="text-[11px] text-[#bbb] px-3 py-1" style={{ borderRadius: "8px", backgroundColor: "#fafafa" }}>
                  {msg.content}
                </span>
              </div>
            );
          }

          return (
            <div key={msg.id} className={msg.role === "user" ? "flex justify-end" : "flex justify-start"}>
              <div className="max-w-[90%]">
                {/* 추론 블록 — 답변 위에 표시 (생각 → 답변 순서) */}
                {msg.thinking && <ThinkingBlock steps={msg.thinking} />}

                {/* 메시지 버블 */}
                <div
                  style={{
                    padding: "12px 16px",
                    borderRadius: msg.role === "user" ? "16px 16px 4px 16px" : "16px 16px 16px 4px",
                    backgroundColor: msg.role === "user" ? "#111" : "#f5f5f5",
                    color: msg.role === "user" ? "#fff" : "#333",
                    fontSize: "14px",
                    lineHeight: "1.6",
                    whiteSpace: "pre-line",
                  }}
                >
                  {msg.content}
                </div>

                {/* Diff 카드 */}
                {msg.diff && (
                  <DiffCard
                    diff={msg.diff}
                    onApply={() => handleApplyDiff(msg.id)}
                    onReject={() => handleRejectDiff(msg.id)}
                  />
                )}

                {/* 영향 분석 */}
                {msg.impact && <ImpactCard impact={msg.impact} />}
              </div>
            </div>
          );
        })}

        {/* 마지막 AI 메시지의 제안 */}
        {!isTyping && messages.length > 0 && messages[messages.length - 1].suggestions && (
          <div className="flex flex-wrap gap-2 ml-1">
            {messages[messages.length - 1].suggestions!.map((s) => (
              <button
                key={s}
                onClick={() => handleSend(s)}
                className="px-3.5 py-[7px] text-[13px] text-[#555] cursor-pointer transition-all hover:bg-[#eee]"
                style={{ borderRadius: "20px", backgroundColor: "#f5f5f5", border: "1px solid rgba(0,0,0,0.06)" }}
              >
                {s}
              </button>
            ))}
          </div>
        )}

        {/* 타이핑 인디케이터 */}
        {isTyping && (
          <div className="flex justify-start">
            <div className="flex items-center gap-2 px-4 py-3" style={{ borderRadius: "16px 16px 16px 4px", backgroundColor: "#f5f5f5" }}>
              <Loader2 size={14} strokeWidth={1.5} color="#999" className="animate-spin" />
              <span className="text-[13px] text-[#999]">분석 중...</span>
            </div>
          </div>
        )}
      </div>

      {/* 입력 영역 */}
      <div className="shrink-0 px-5 pb-5 pt-2">
        <div
          className="flex items-center gap-2 px-4 py-3"
          style={{ borderRadius: "14px", backgroundColor: "#f8f8f8", boxShadow: "rgba(0,0,0,0.04) 0px 0px 0px 1px" }}
        >
          <input
            ref={inputRef}
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                handleSend(input);
              }
            }}
            placeholder="예: 마케팅팀 예산을 500만원으로 올려줘"
            className="flex-1 bg-transparent text-[14px] outline-none placeholder:text-[#bbb]"
          />
          <button
            onClick={() => handleSend(input)}
            className="flex items-center justify-center w-8 h-8 rounded-full cursor-pointer transition-colors"
            style={{
              backgroundColor: input.trim() ? "#111" : "transparent",
              color: input.trim() ? "#fff" : "#ccc",
            }}
          >
            <Send size={15} strokeWidth={1.5} />
          </button>
        </div>
      </div>
    </>
  );
}
