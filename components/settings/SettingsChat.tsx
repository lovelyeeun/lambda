"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import {
  Send, Sparkles, ChevronDown, ChevronRight,
  Check, X, AlertTriangle, ArrowRight,
  Brain, Loader2,
} from "lucide-react";
import { useSettings, type SettingsSection } from "@/lib/settings-context";
import { useSettingsEmit, useLastFormEvent, useFocusEmit } from "@/lib/settings-events";
import { useSettingsStore, patchToFocusKey, type SettingsPatch } from "@/lib/settings-store";
import ShippingAddressModal, { type ShippingDraft } from "@/components/settings/ShippingAddressModal";
import { PlannedTooltip } from "@/components/ui/Tooltip";

/* ═══════════════════════════════════════
   타입 정의
   ═══════════════════════════════════════ */

interface ThinkingStep {
  label: string;
  detail?: string;
  /** 이 스텝이 노출될 때 우측 패널에 펄스를 줄 대상 키 */
  focusKey?: string;
}

interface DiffItem {
  field: string;
  before: string;
  after: string;
}

/** Diff 카드에 편집 가능한 입력을 추가하는 설정.
   AI 가 제안한 값을 유저가 한 번 더 조정 후 적용할 수 있게 한다. */
interface DiffEdit {
  fields: Array<{
    key: string;
    label: string;
    /** 입력 초기값 (raw — 천단위 콤마 없이 숫자 문자열) */
    initial: string;
    /** 입력 박스 우측에 표시할 단위 텍스트 */
    suffix?: string;
    placeholder?: string;
    /** 숫자 input mode 힌트 */
    numeric?: boolean;
  }>;
  /** 편집된 값으로부터 화면에 그릴 items 와 적용할 patches 를 재계산 */
  build: (values: Record<string, string>) => { items: DiffItem[]; patches: SettingsPatch[] };
}

interface ChatMessage {
  id: string;
  role: "ai" | "user" | "system";
  content: string;
  suggestions?: string[];
  /** 접히는 추론 블록 */
  thinking?: ThinkingStep[];
  /** 설정 변경 diff 카드 */
  diff?: {
    title: string;
    items: DiffItem[];
    applied?: boolean;
    patches?: SettingsPatch[];
    /** 편집 가능 모드 — 있으면 입력 박스가 카드 안에 노출 */
    edit?: DiffEdit;
  };
  /** 배송지 추가/수정 인라인 폼 카드 (diff 대신 편집 가능한 카드) */
  shippingForm?: { title: string; draft: ShippingDraft; applied?: boolean };
  /** 영향 분석 경고 */
  impact?: { warning: string; details: string[] };
  /** 컨텍스트 힌트 (우측 패널 업데이트용) */
  contextHint?: string;
}

/* ═══════════════════════════════════════
   contextHint → SettingsSection 매핑
   채팅에서 "예산 얘기" 나오면 우측 패널도 자동 전환
   ═══════════════════════════════════════ */

const contextHintToSection: Record<string, SettingsSection> = {
  "budget": "accounting-budget",
  "approval": "approval-rules",
  "team": "company-team",
  "agent-policy": "agent-policy",
  "shipping": "company-shipping",
  "payment": "accounting-payment",
  "description": "accounting-description",
  "company-info": "company-info-edit",
  // "overview" 는 대시보드 유지 (전환 없음)
};

/* ═══════════════════════════════════════
   시나리오 (더미 대화)
   ═══════════════════════════════════════ */

/* ═══════════════════════════════════════
   폼 UI 액션 → 채팅 반응 메시지 생성

   원칙:
   - 추론 블록은 채팅으로 들어온 요청에서만 생성 (실제 의도 분석/영향 계산이 발생할 때)
   - 폼 액션은 우측 패널 토스트로 즉각 피드백되므로 채팅에는 의미 있는 변화만 가벼운 ack
   - input 타이핑·토글·일반 편집은 무음 (null 반환)
   - 저장·추가·삭제처럼 의미 있는 액션만 짧은 ack + follow-up suggestions
   ═══════════════════════════════════════ */

function buildFormActionResponse(_panel: string, action: string, detail: string): ChatMessage | null {
  const d = detail.toLowerCase();
  const cleanDetail = detail.replace(/^\[.*?\]\s*/, "");

  /* 무음: input 타이핑 — 너무 시끄러움 */
  if (action === "input-change") return null;

  /* 무음: 단순 토글·편집·선택 — 우측 토스트로 충분 */
  if (action === "toggle") return null;

  /* 무음: 보조 버튼 — 탭 전환·행 조작 등은 의미 있는 액션 아님 */
  if (
    detail.includes("메일로 초대") || detail.includes("엑셀로 초대") || // 모달 탭 버튼
    detail.includes("행 추가") || detail.includes("행 삭제") ||           // 다중 입력 행 조작
    detail.includes("파일 선택") || detail.includes("다운로드")           // 모달 보조 액션
  ) {
    return null;
  }

  const matchSubmit = d.includes("저장") || d.includes("적용") || d.includes("완료");
  const matchInvite = detail.includes("초대하기");
  const matchAdd = d.includes("추가") || d.includes("생성") || d.includes("등록");
  const matchRemove = d.includes("삭제") || d.includes("제거") || d.includes("해제") || d.includes("회수");
  if (!matchSubmit && !matchInvite && !matchAdd && !matchRemove) return null;

  /* 저장 / 완료 / 적용 — 가벼운 ack + follow-up */
  if (matchSubmit) {
    return {
      id: `ai-form-${Date.now()}`, role: "ai",
      content: "저장했어요. 다른 설정도 도와드릴까요?",
      suggestions: ["전체 현황 알려줘", "다른 설정 보여줘"],
    };
  }

  /* 초대 — 팀원 (단일/다중 모두 처리) */
  if (matchInvite) {
    const countMatch = detail.match(/\((\d+)명\)/);
    const count = countMatch ? parseInt(countMatch[1], 10) : 1;
    return {
      id: `ai-form-${Date.now()}`, role: "ai",
      content: count > 1
        ? `${count}명에게 초대 메일을 발송했어요. 수락하면 활성 멤버로 합류합니다.`
        : "초대 메일을 발송했어요. 수락하면 활성 멤버로 합류합니다.",
      suggestions: ["초대 대기 현황 알려줘", "다른 설정 보여줘"],
    };
  }

  /* 추가 / 등록 */
  if (matchAdd) {
    return {
      id: `ai-form-${Date.now()}`, role: "ai",
      content: `추가했어요. ${cleanDetail ? `(${cleanDetail})` : ""}`.trim(),
    };
  }

  /* 삭제 / 제거 / 해제 */
  if (matchRemove) {
    return {
      id: `ai-form-${Date.now()}`, role: "ai",
      content: "삭제했어요. 관련 설정에 영향이 있다면 알려드릴게요.",
    };
  }

  return null;
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
            { label: "현재 마케팅팀 월 예산 조회", detail: "현재 설정: 월 380만원", focusKey: "budget.dept.마케팅" },
            { label: "최근 3개월 실 지출 분석", detail: "평균 352만원/월 (예산 대비 92.6% 소진)", focusKey: "budget.dept.마케팅" },
            { label: "변경 후 영향 계산", detail: "월 500만원 → 연간 6,000만원 → 전사 예산 대비 12.5%", focusKey: "budget.total" },
            { label: "자동승인 한도 확인", detail: "50만원 이하 자동승인 — 변경 불필요", focusKey: "approval-rules" },
          ],
          diff: {
            title: "마케팅팀 예산 변경",
            items: [
              { field: "월 예산", before: "3,800,000원", after: "5,000,000원" },
              { field: "연간 합계", before: "45,600,000원", after: "60,000,000원" },
              { field: "전사 비중", before: "9.5%", after: "12.5%" },
            ],
            patches: [
              { target: "budget.dept.annual", dept: "마케팅", annual: 60000000 },
            ],
            edit: {
              fields: [
                { key: "monthly", label: "월 예산", initial: "5000000", suffix: "원", numeric: true, placeholder: "월 예산 (원)" },
              ],
              build: ({ monthly }) => {
                const m = Math.max(0, parseInt((monthly ?? "").replace(/\D/g, ""), 10) || 0);
                const annual = m * 12;
                const totalCorporate = 480000000; // 전사 연간 예산 가정
                const ratio = totalCorporate > 0 ? ((annual / totalCorporate) * 100).toFixed(1) : "0.0";
                return {
                  items: [
                    { field: "월 예산", before: "3,800,000원", after: `${m.toLocaleString()}원` },
                    { field: "연간 합계", before: "45,600,000원", after: `${annual.toLocaleString()}원` },
                    { field: "전사 비중", before: "9.5%", after: `${ratio}%` },
                  ],
                  patches: [
                    { target: "budget.dept.annual", dept: "마케팅", annual },
                  ],
                };
              },
            },
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

  /* 적요 — 단일 규칙 추가 (자연어 파싱)
     예: "노트북은 비품 8240으로 매핑해줘"
         "회의실 다과는 복리후생비 8270" */
  if (
    /\b\d{4}\b/.test(text) &&
    (t.includes("적요") || t.includes("매핑") || t.includes("회계") || t.includes("코드") || /로|으로/.test(text))
  ) {
    const codeMatch = text.match(/\b(\d{4})\b/);
    const code = codeMatch?.[1] ?? "";
    const ACCOUNTS: Record<string, string> = {
      "8210": "사무용품비", "8220": "소모품비", "8230": "도서인쇄비",
      "8240": "비품", "8250": "수선비", "8260": "차량유지비",
      "8270": "복리후생비", "8120": "통신비", "8130": "수도광열비",
    };
    const accountName = ACCOUNTS[code] ?? "";
    // 카테고리: "노트북은", "노트북" 같은 패턴에서 첫 명사 추출 (간단히 첫 한글 단어)
    const catMatch = text.match(/^([가-힣A-Za-z][가-힣A-Za-z0-9·\/\s]*?)(?:은|는|을|를|의|에|에서|이라면|이면|는요)/);
    const category = catMatch?.[1]?.trim() ?? "";
    if (category && code) {
      return {
        messages: [
          {
            id: `ai-${Date.now()}`,
            role: "ai",
            content: `'${category}' 키워드를 ${accountName ? `${accountName}(${code})` : code}으로 매핑할게요. 적요 텍스트를 확인하고 적용해주세요.`,
            thinking: [
              { label: "기존 규칙 조회", detail: "현재 7개 규칙 등록 (더존 4자리)", focusKey: "description.list" },
              { label: "코드 유효성 확인", detail: accountName ? `${code} → ${accountName} (정상)` : `${code} (사용자 정의 코드)` },
              { label: "충돌 확인", detail: `'${category}' 카테고리: 신규 등록` },
            ],
            diff: {
              title: "적요 규칙 추가",
              items: [
                { field: "카테고리", before: "—", after: category },
                { field: "계정과목 코드", before: "—", after: code },
                { field: "계정과목명", before: "—", after: accountName || "(사용자 입력 필요)" },
                { field: "기본 적요", before: "—", after: `${category} 관련 지출` },
              ],
              patches: [
                {
                  target: "description.add",
                  rule: { category, code, account: accountName || category, memo: `${category} 관련 지출` },
                  source: "chat",
                },
              ],
              edit: {
                fields: [
                  { key: "memo", label: "적요 텍스트", initial: `${category} 관련 지출`, placeholder: "회계장부 기재용" },
                ],
                build: ({ memo }) => ({
                  items: [
                    { field: "카테고리", before: "—", after: category },
                    { field: "계정과목 코드", before: "—", after: code },
                    { field: "계정과목명", before: "—", after: accountName || "(사용자 입력 필요)" },
                    { field: "기본 적요", before: "—", after: memo || "—" },
                  ],
                  patches: [
                    {
                      target: "description.add",
                      rule: { category, code, account: accountName || category, memo: memo || `${category} 관련 지출` },
                      source: "chat",
                    },
                  ],
                }),
              },
            },
            contextHint: "description",
          },
        ],
      };
    }
  }

  /* 적요 — 일반 안내 */
  if (t.includes("적요") || t.includes("회계") || t.includes("매핑")) {
    return {
      messages: [
        {
          id: `ai-${Date.now()}`,
          role: "ai",
          content: "적요 규칙을 한 번에 알려주시면 바로 추가해드릴게요. (예: \"노트북은 비품 8240으로 매핑해줘\")\n사내 회계 정책을 일괄 반영하려면 우측 패널의 '사내 기준 업로드' 를 사용해주세요.",
          thinking: [
            { label: "현재 적요 규칙", detail: "7개 등록 (더존 4자리 코드 체계)", focusKey: "description.list" },
            { label: "AI 추천 상태", detail: "ON — 주문 시 자동 매핑 시도" },
          ],
          suggestions: [
            "노트북은 비품 8240으로 매핑해줘",
            "회의실 다과는 복리후생비 8270으로 매핑해줘",
            "변경기록 보여줘",
          ],
          contextHint: "description",
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

  /* 배송지 — 추가 (인라인 편집 카드) */
  if (t.includes("배송") && (t.includes("분당") || t.includes("추가"))) {
    return {
      messages: [
        {
          id: `ai-${Date.now()}`,
          role: "ai",
          content: "분당 지사 배송지를 초안으로 준비했어요. 아래 카드에서 내용을 확인·수정하고 적용하세요.",
          thinking: [
            { label: "현재 배송지 조회", detail: "3개 등록 (본사 3층 기본)", focusKey: "shipping.list" },
            { label: "중복 확인", detail: "분당 관련 주소: 물류센터 (판교로 256) 존재 — 별도 지사 등록 가능", focusKey: "shipping.addr-3" },
            { label: "초안 구성", detail: "이름·도로명 주소는 채워뒀고, 수령인·연락처는 직접 입력 필요", focusKey: "shipping.list" },
          ],
          shippingForm: {
            title: "새 배송지 등록",
            draft: {
              name: "분당 지사",
              receiver: "",
              phone: "",
              zipcode: "13529",
              address: "경기도 성남시 분당구 정자일로 45",
              detailAddress: "3층",
              deliveryNote: "",
            },
          },
          contextHint: "shipping",
        },
      ],
    };
  }

  /* 배송지 — 일반 조회 */
  if (t.includes("배송")) {
    return {
      messages: [
        {
          id: `ai-${Date.now()}`,
          role: "ai",
          content: "배송지를 설정해볼게요. 배송지 이름, 주소, 수령인 정보를 알려주세요.",
          thinking: [
            { label: "현재 배송지 조회", detail: "3개 등록 (본사 3층 기본)" },
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

  /* 결제수단 — BNPL 연동 (소모품 구매용 활성화) */
  if ((t.includes("bnpl") || t.includes("후불")) && (t.includes("연동") || t.includes("활성") || t.includes("켜"))) {
    return {
      messages: [
        {
          id: `ai-${Date.now()}`,
          role: "ai",
          content: "BNPL '소모품 구매' 결제수단을 활성화할게요. 적용하면 소모품 카테고리 주문에 우선 사용됩니다.",
          thinking: [
            { label: "현재 결제수단 조회", detail: "법인카드 2개 사용중, BNPL 3개 미연동", focusKey: "payment.list" },
            { label: "사용 패턴 분석", detail: "최근 30일 소모품 주문 비중 38% — BNPL 적합", focusKey: "payment.pm-6" },
            { label: "한도/연체 확인", detail: "현재 미결제 잔액 0원, 가용 한도 충분" },
          ],
          diff: {
            title: "BNPL 결제수단 활성화",
            items: [
              { field: "소모품 구매 BNPL", before: "미사용", after: "사용중" },
              { field: "우선 적용 카테고리", before: "—", after: "소모품" },
            ],
            patches: [
              { target: "payment.setActive", id: "pm-6", active: true },
            ],
          },
          contextHint: "payment",
        },
      ],
    };
  }

  /* 결제수단 — 법인카드 월 한도 변경 */
  if ((t.includes("카드") || t.includes("법인")) && t.includes("한도")) {
    return {
      messages: [
        {
          id: `ai-${Date.now()}`,
          role: "ai",
          content: "법인카드 '종법기명_신한 (1)' 의 월 한도를 200만원으로 올릴게요.",
          thinking: [
            { label: "현재 카드 한도 조회", detail: "월 100만원 (신한 ****-850*)", focusKey: "payment.pm-1" },
            { label: "최근 사용 추이", detail: "최근 2개월 평균 92만원 — 한도 근접" },
            { label: "변경 후 영향", detail: "월 200만원 → 자동승인 한도(50만원)는 별도 유지" },
          ],
          diff: {
            title: "법인카드 월 한도 변경",
            items: [
              { field: "종법기명_신한 (1)", before: "1,000,000원", after: "2,000,000원" },
            ],
            patches: [
              { target: "payment.setLimit", id: "pm-1", monthlyLimit: 2000000 },
            ],
            edit: {
              fields: [
                { key: "limit", label: "월 한도", initial: "2000000", suffix: "원", numeric: true, placeholder: "월 한도 (원)" },
              ],
              build: ({ limit }) => {
                const v = Math.max(0, parseInt((limit ?? "").replace(/\D/g, ""), 10) || 0);
                return {
                  items: [
                    { field: "종법기명_신한 (1)", before: "1,000,000원", after: `${v.toLocaleString()}원` },
                  ],
                  patches: [
                    { target: "payment.setLimit", id: "pm-1", monthlyLimit: v },
                  ],
                };
              },
            },
          },
          contextHint: "payment",
        },
      ],
    };
  }

  /* 결제수단 — 일반 조회 */
  if (t.includes("결제수단") || (t.includes("카드") && (t.includes("등록") || t.includes("추가") || t.includes("연동")))) {
    return {
      messages: [
        {
          id: `ai-${Date.now()}`,
          role: "ai",
          content: "결제수단 현황이에요. 어떤 작업을 도와드릴까요?",
          thinking: [
            { label: "결제수단 현황", detail: "법인카드 3개 (사용중 2), BNPL 3개 (미연동)", focusKey: "payment.list" },
          ],
          suggestions: ["BNPL 연동해줘", "법인카드 월 한도 200만원으로 올려줘"],
          contextHint: "payment",
        },
      ],
    };
  }

  /* 팀원 — 채팅에서 직접 한 명 초대 (자유 형식 파싱)
     이메일 + 한글 이름 패턴이면 "초대" 키워드 없이도 매칭
     예: "최동현 donghyun@rawlabs.io 개발 구매담당" */
  if (/[a-z0-9._%+-]+@[a-z0-9.-]+/i.test(text) && /[가-힣]{2,4}/.test(text)) {
    const emailMatch = text.match(/([a-z0-9._%+-]+@[a-z0-9.-]+)/i);
    const email = emailMatch?.[1] ?? "";
    // 한글 이름 (2~4자) 첫 매칭
    const nameMatch = text.match(/[가-힣]{2,4}/);
    const name = nameMatch?.[0] ?? "(이름 미상)";
    const dept = ["경영지원", "마케팅", "디자인", "개발"].find((d) => text.includes(d)) ?? "개발";
    const role = ["관리자", "매니저", "구매담당", "일반"].find((r) => text.includes(r)) ?? "구매담당";
    return {
      messages: [
        {
          id: `ai-${Date.now()}`,
          role: "ai",
          content: `${name}님(${email})을 ${dept} ${role}으로 초대할게요.`,
          thinking: [
            { label: "현재 팀원 현황", detail: "5명 등록", focusKey: "team.list" },
            { label: "가용 라이선스", detail: "10명 중 5명 사용 — 여유 5석" },
            { label: "중복 확인", detail: "동일 이메일 미존재" },
          ],
          diff: {
            title: "팀원 초대",
            items: [
              { field: "이름", before: "—", after: name },
              { field: "이메일", before: "—", after: email },
              { field: "부서", before: "—", after: dept },
              { field: "역할", before: "—", after: role },
            ],
            patches: [
              {
                target: "team.invite",
                members: [{ name, email, department: dept, role, via: "email" }],
              },
            ],
          },
          contextHint: "team",
        },
      ],
    };
  }

  /* 팀원 — 일반 안내 (다중·엑셀 모달 유도) */
  if (t.includes("팀원") || t.includes("초대")) {
    return {
      messages: [
        {
          id: `ai-${Date.now()}`,
          role: "ai",
          content: "한 명만 초대하시려면 이름·이메일·부서·역할을 함께 알려주세요.\n여러 명을 한 번에 초대하려면 우측 '팀원 초대' 버튼에서 메일/엑셀 탭을 사용할 수 있어요.",
          thinking: [
            { label: "현재 팀원 현황", detail: "5명 등록 (관리자 1, 구매담당 2, 뷰어 2)", focusKey: "team.list" },
            { label: "가용 라이선스", detail: "10명 중 5명 사용 — 여유 5석" },
          ],
          suggestions: [
            "최동현 donghyun@rawlabs.io 개발 구매담당 초대",
            "한예진 yejin@rawlabs.io 마케팅 일반 초대",
            "전체 현황 알려줘",
          ],
          contextHint: "team",
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
            { label: "등록된 회사 정보 조회", detail: "주식회사 로랩스, 사업자번호 142-87-01234", focusKey: "company.field.name" },
            { label: "누락 항목 확인", detail: "업종, 업태 미입력 — 적요 자동생성에 영향 가능", focusKey: "company.field.industry" },
          ],
          diff: {
            title: "회사 정보 보완 제안",
            items: [
              { field: "업종", before: "(미입력)", after: "소프트웨어 개발업" },
              { field: "업태", before: "(미입력)", after: "정보통신업" },
            ],
            patches: [
              { target: "company.field", field: "industry", value: "소프트웨어 개발업" },
              { target: "company.field", field: "businessType", value: "정보통신업" },
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
   카드 클릭 시 시작 메시지 — 짧은 인사 + 다음 액션 제안 (추론 없음)
   ═══════════════════════════════════════ */

function getCardEntryMessage(section: SettingsSection): ChatMessage | null {
  const map: Record<string, ChatMessage> = {
    "company-info-edit": {
      id: `entry-${Date.now()}`, role: "ai",
      content: "회사 정보 화면이에요. 어떤 항목을 수정할까요?",
      suggestions: ["업종/업태 추가해줘", "주소 변경할게", "대표자 정보 수정"],
      contextHint: "company-info",
    },
    "company-team": {
      id: `entry-${Date.now()}`, role: "ai",
      content: "팀원 관리 화면이에요.",
      suggestions: ["새 팀원 추가할게", "권한 변경하고 싶어"],
      contextHint: "team",
    },
    "company-shipping": {
      id: `entry-${Date.now()}`, role: "ai",
      content: "배송지 설정이에요.",
      suggestions: ["분당 지사 배송지 추가해줘", "기본 배송지 바꿔줘"],
      contextHint: "shipping",
    },
    "accounting-payment": {
      id: `entry-${Date.now()}`, role: "ai",
      content: "결제수단 관리에요.",
      suggestions: ["카드 추가 등록할게", "BNPL 연동하고 싶어"],
      contextHint: "payment",
    },
    "accounting-budget": {
      id: `entry-${Date.now()}`, role: "ai",
      content: "예산 설정이에요.",
      suggestions: ["마케팅팀 예산 500만원으로 올려줘", "전체 부서 월별 한도 설정해줘"],
      contextHint: "budget",
    },
    "agent-policy": {
      id: `entry-${Date.now()}`, role: "ai",
      content: "에이전트 정책 설정이에요.",
      suggestions: ["자동구매 모드로 바꿔줘", "등록 상품만 검색하게 해줘"],
      contextHint: "agent-policy",
    },
    "approval-rules": {
      id: `entry-${Date.now()}`, role: "ai",
      content: "승인 체계 설정이에요.",
      suggestions: ["새 결재 라인 추가할게", "자동승인 한도 변경해줘"],
      contextHint: "approval",
    },
    "accounting-description": {
      id: `entry-${Date.now()}`, role: "ai",
      content: "적요 설정이에요.",
      suggestions: ["새 규칙 추가할게", "AI 적요 끄고 싶어"],
      contextHint: "description",
    },
  };
  return map[section] ?? null;
}

/* ═══════════════════════════════════════
   서브 컴포넌트: 추론 블록
   ═══════════════════════════════════════ */

function ThinkingBlock({
  steps,
  initialReveal,
  onStepReveal,
}: {
  steps: ThinkingStep[];
  /** true면 스텝을 한 번에 모두 노출 (이미 완료된 메시지). false면 progressive */
  initialReveal?: boolean;
  /** 각 스텝이 새로 드러날 때 호출 (사이드 이펙트용) */
  onStepReveal?: (step: ThinkingStep, index: number) => void;
}) {
  const initial = initialReveal ? steps.length : 0;
  const [revealed, setRevealed] = useState(initial);
  const [open, setOpen] = useState(!initialReveal); // 스트리밍 중엔 자동 펼침
  const timersRef = useRef<ReturnType<typeof setTimeout>[]>([]);
  const firedRef = useRef(new Set<number>());

  useEffect(() => {
    if (initialReveal) return;
    // 한 스텝당 약 600ms 간격으로 순차 노출
    const PER_STEP_MS = 600;
    const FIRST_DELAY = 150;
    timersRef.current = steps.map((_, i) =>
      setTimeout(() => setRevealed((r) => Math.max(r, i + 1)), FIRST_DELAY + i * PER_STEP_MS)
    );
    return () => {
      timersRef.current.forEach(clearTimeout);
      timersRef.current = [];
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // 스텝이 처음 드러나는 시점에 onStepReveal 호출
  useEffect(() => {
    for (let i = 0; i < revealed; i++) {
      if (!firedRef.current.has(i)) {
        firedRef.current.add(i);
        onStepReveal?.(steps[i], i);
      }
    }
  }, [revealed, steps, onStepReveal]);

  const isStreaming = revealed < steps.length;

  return (
    <div
      className="mt-2 mb-1"
      style={{ borderRadius: "10px", backgroundColor: "rgba(99,102,241,0.04)", border: "1px solid rgba(99,102,241,0.1)" }}
    >
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-2 w-full px-3 py-2 text-left cursor-pointer"
      >
        {isStreaming ? (
          <Loader2 size={13} strokeWidth={1.5} color="#6366f1" className="animate-spin" />
        ) : (
          <Brain size={13} strokeWidth={1.5} color="#6366f1" />
        )}
        <span className="text-[12px] font-medium text-[#6366f1]">
          {isStreaming ? `추론 중 · ${revealed}/${steps.length}단계` : `추론 과정 · ${steps.length}단계`}
        </span>
        <ChevronDown
          size={12} strokeWidth={1.5} color="#6366f1"
          style={{ marginLeft: "auto", transform: open ? "rotate(180deg)" : "rotate(0)", transition: "transform 0.2s" }}
        />
      </button>
      {open && (
        <div className="px-3 pb-3 flex flex-col gap-1.5">
          {steps.slice(0, revealed).map((step, i) => (
            <div
              key={i}
              className="flex items-start gap-2"
              style={{ animation: "thinking-step-in 280ms ease-out both" }}
            >
              <div className="mt-1 w-4 h-4 shrink-0 rounded-full flex items-center justify-center bg-[#6366f1] text-white text-[8px] font-bold">
                {i + 1}
              </div>
              <div>
                <p className="text-[12px] font-medium text-[#333]">{step.label}</p>
                {step.detail && <p className="text-[11px] text-[#888] mt-0.5">{step.detail}</p>}
              </div>
            </div>
          ))}
          {isStreaming && (
            <div className="flex items-center gap-2 pl-6 pt-0.5">
              <span className="inline-block w-1 h-1 rounded-full bg-[#6366f1] opacity-60 animate-pulse" />
              <span className="inline-block w-1 h-1 rounded-full bg-[#6366f1] opacity-40 animate-pulse" style={{ animationDelay: "150ms" }} />
              <span className="inline-block w-1 h-1 rounded-full bg-[#6366f1] opacity-30 animate-pulse" style={{ animationDelay: "300ms" }} />
            </div>
          )}
        </div>
      )}
      <style jsx>{`
        @keyframes thinking-step-in {
          from { opacity: 0; transform: translateY(-3px); }
          to   { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}

/* ═══════════════════════════════════════
   서브 컴포넌트: Diff 카드
   ═══════════════════════════════════════ */

function DiffCard({ diff, onApply, onReject }: {
  diff: NonNullable<ChatMessage["diff"]>;
  /** 편집된 값 기준으로 계산된 patches·items 를 함께 전달 */
  onApply: (resolved: { patches: SettingsPatch[]; items: DiffItem[] }) => void;
  onReject: () => void;
}) {
  // 편집 가능 모드일 때 입력 상태
  const [values, setValues] = useState<Record<string, string>>(() => {
    if (!diff.edit) return {};
    const init: Record<string, string> = {};
    diff.edit.fields.forEach((f) => { init[f.key] = f.initial; });
    return init;
  });

  // 편집된 값으로부터 화면에 그릴 items 와 적용할 patches 를 매 렌더마다 재계산
  const computed = diff.edit
    ? diff.edit.build(values)
    : { items: diff.items, patches: diff.patches ?? [] };

  const setField = (key: string, v: string) => setValues((p) => ({ ...p, [key]: v }));

  return (
    <div
      className="mt-2"
      style={{ borderRadius: "10px", boxShadow: "rgba(0,0,0,0.06) 0px 0px 0px 1px", overflow: "hidden" }}
    >
      <div className="px-3 py-2 flex items-center gap-2" style={{ backgroundColor: "#f9f9f9", borderBottom: "1px solid rgba(0,0,0,0.04)" }}>
        <ArrowRight size={12} strokeWidth={1.5} color="#666" />
        <span className="text-[12px] font-semibold text-[#333]">{diff.title}</span>
        {diff.edit && !diff.applied && (
          <span className="ml-auto text-[10px] text-[#999]">편집 가능</span>
        )}
      </div>

      {/* 편집 입력 — edit 설정이 있고 아직 미적용일 때만 */}
      {diff.edit && !diff.applied && (
        <div className="px-3 py-2.5 flex flex-col gap-2" style={{ backgroundColor: "rgba(99,102,241,0.03)", borderBottom: "1px solid rgba(99,102,241,0.08)" }}>
          {diff.edit.fields.map((f) => (
            <div key={f.key} className="flex items-center gap-2 text-[12px]">
              <span className="text-[#666] w-[80px] shrink-0">{f.label}</span>
              <input
                value={values[f.key] ?? ""}
                onChange={(e) => setField(f.key, e.target.value)}
                placeholder={f.placeholder}
                inputMode={f.numeric ? "numeric" : undefined}
                className="flex-1 px-2 py-1 text-[12px] outline-none bg-white"
                style={{ borderRadius: "6px", boxShadow: "rgba(99,102,241,0.3) 0px 0px 0px 1px" }}
              />
              {f.suffix && <span className="text-[11px] text-[#999] shrink-0">{f.suffix}</span>}
            </div>
          ))}
        </div>
      )}

      {/* 미리보기 items */}
      <div className="px-3 py-2.5 flex flex-col gap-2">
        {computed.items.map((item) => (
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
            onClick={() => onApply(computed)}
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
   서브 컴포넌트: 배송지 인라인 편집 카드
   ═══════════════════════════════════════ */

function ShippingFormCard({
  title,
  draft,
  applied,
  onApply,
  onReject,
}: {
  title: string;
  draft: ShippingDraft;
  applied?: boolean;
  onApply: (d: ShippingDraft) => void;
  onReject: () => void;
}) {
  const [local, setLocal] = useState<ShippingDraft>(draft);
  const [modalOpen, setModalOpen] = useState(false);
  const ready = local.name.trim() && local.receiver.trim() && local.phone.trim() && local.address.trim();

  const field = <K extends keyof ShippingDraft>(k: K, v: ShippingDraft[K]) =>
    setLocal((p) => ({ ...p, [k]: v }));

  return (
    <>
      <div
        className="mt-2"
        style={{
          borderRadius: "12px",
          boxShadow: "rgba(0,0,0,0.06) 0px 0px 0px 1px",
          overflow: "hidden",
          backgroundColor: "#fff",
        }}
      >
        <div
          className="px-3 py-2 flex items-center justify-between"
          style={{ backgroundColor: "#fafafa", borderBottom: "1px solid rgba(0,0,0,0.04)" }}
        >
          <div className="flex items-center gap-2">
            <ArrowRight size={12} strokeWidth={1.5} color="#666" />
            <span className="text-[12px] font-semibold text-[#333]">{title}</span>
          </div>
          {!applied && (
            <button
              onClick={() => setModalOpen(true)}
              className="text-[11px] text-[#6366f1] hover:underline cursor-pointer"
            >
              자세히 수정
            </button>
          )}
        </div>

        <div className="px-3 py-3 flex flex-col gap-2">
          <FormRow label="이름" required>
            <input
              value={local.name}
              onChange={(e) => field("name", e.target.value)}
              disabled={applied}
              placeholder="예: 분당 지사"
              className="w-full px-2.5 py-1.5 text-[12px] outline-none bg-white disabled:bg-[#fafafa]"
              style={inlineInputStyle}
            />
          </FormRow>
          <div className="flex gap-2">
            <FormRow label="수령인" required className="flex-1">
              <input
                value={local.receiver}
                onChange={(e) => field("receiver", e.target.value)}
                disabled={applied}
                placeholder="수령인"
                className="w-full px-2.5 py-1.5 text-[12px] outline-none bg-white disabled:bg-[#fafafa]"
                style={inlineInputStyle}
              />
            </FormRow>
            <FormRow label="연락처" required className="flex-1">
              <input
                value={local.phone}
                onChange={(e) => field("phone", e.target.value)}
                disabled={applied}
                placeholder="010-0000-0000"
                className="w-full px-2.5 py-1.5 text-[12px] outline-none bg-white disabled:bg-[#fafafa]"
                style={inlineInputStyle}
              />
            </FormRow>
          </div>
          <FormRow label="주소" required>
            <div className="flex gap-1.5">
              <input
                value={local.zipcode}
                onChange={(e) => field("zipcode", e.target.value)}
                readOnly
                placeholder="우편번호"
                className="w-[100px] px-2.5 py-1.5 text-[12px] outline-none bg-[#fafafa] text-[#777]"
                style={inlineInputStyle}
              />
              <PlannedTooltip description="우편번호·주소 검색 연동 (다음 주소 API)">
                <button
                  type="button"
                  disabled={applied}
                  className="px-2.5 py-1.5 text-[11px] font-medium text-white bg-black rounded-md cursor-pointer hover:opacity-80 disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  주소 검색
                </button>
              </PlannedTooltip>
            </div>
            <input
              value={local.address}
              onChange={(e) => field("address", e.target.value)}
              disabled={applied}
              placeholder="도로명 주소"
              className="w-full mt-1.5 px-2.5 py-1.5 text-[12px] outline-none bg-white disabled:bg-[#fafafa]"
              style={inlineInputStyle}
            />
            <input
              value={local.detailAddress}
              onChange={(e) => field("detailAddress", e.target.value)}
              disabled={applied}
              placeholder="상세주소 (동, 호수 등)"
              className="w-full mt-1.5 px-2.5 py-1.5 text-[12px] outline-none bg-white disabled:bg-[#fafafa]"
              style={inlineInputStyle}
            />
          </FormRow>
          <FormRow label="요청사항">
            <input
              value={local.deliveryNote}
              onChange={(e) => field("deliveryNote", e.target.value)}
              disabled={applied}
              placeholder="배송시 요청사항 (선택)"
              className="w-full px-2.5 py-1.5 text-[12px] outline-none bg-white disabled:bg-[#fafafa]"
              style={inlineInputStyle}
            />
          </FormRow>
        </div>

        {!applied ? (
          <div className="px-3 py-2 flex items-center gap-2" style={{ borderTop: "1px solid rgba(0,0,0,0.04)" }}>
            <button
              onClick={() => ready && onApply(local)}
              disabled={!ready}
              className="flex items-center gap-1.5 px-3 py-1.5 text-[12px] font-medium text-white rounded-md transition-opacity"
              style={{
                backgroundColor: ready ? "#111" : "#ccc",
                cursor: ready ? "pointer" : "not-allowed",
              }}
            >
              <Check size={12} strokeWidth={2} />적용
            </button>
            <button
              onClick={onReject}
              className="flex items-center gap-1.5 px-3 py-1.5 text-[12px] text-[#999] cursor-pointer hover:text-[#555] hover:bg-[#f5f5f5] transition-colors rounded-md"
            >
              <X size={12} strokeWidth={1.5} />취소
            </button>
          </div>
        ) : (
          <div className="px-3 py-2 flex items-center gap-1.5 text-[12px] text-[#22c55e] font-medium" style={{ borderTop: "1px solid rgba(0,0,0,0.04)" }}>
            <Check size={12} strokeWidth={2} />적용 완료
          </div>
        )}
      </div>

      <ShippingAddressModal
        open={modalOpen}
        mode="add"
        initial={local}
        onClose={() => setModalOpen(false)}
        onSubmit={(d) => { setLocal(d); setModalOpen(false); }}
      />
    </>
  );
}

const inlineInputStyle = {
  borderRadius: "6px",
  boxShadow: "rgba(0,0,0,0.08) 0px 0px 0px 1px",
  border: "none",
} as const;

function FormRow({
  label,
  required,
  className,
  children,
}: {
  label: string;
  required?: boolean;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <div className={className}>
      <label className="block text-[11px] font-medium text-[#555] mb-1">
        {required && <span className="text-[#ef4444] mr-0.5">*</span>}
        {label}
      </label>
      {children}
    </div>
  );
}

/* ═══════════════════════════════════════
   메인 컴포넌트
   ═══════════════════════════════════════ */

export default function SettingsChat() {
  const { section, setSection } = useSettings();
  const emit = useSettingsEmit();
  const focus = useFocusEmit();
  const lastFormEvent = useLastFormEvent();
  const { applyPatches, addShipping, pushVersionHistory } = useSettingsStore();
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
  /** 채팅에서 setSection을 유발한 경우 플래그 — 섹션 useEffect가 진입 메시지를 중복 주입하지 않도록 */
  const chatDrivenSectionRef = useRef(false);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isTyping]);

  /* 폼 UI 이벤트 수신 → 의미 있는 액션만 가벼운 ack 생성
     원칙: 시스템 칩 (🖱) 표시 안 함, 추론 블록 만들지 않음, 무음 액션은 완전 스킵 */
  useEffect(() => {
    if (!lastFormEvent || lastFormEvent.id === lastFormEventIdRef.current) return;
    lastFormEventIdRef.current = lastFormEvent.id;

    const response = buildFormActionResponse(
      lastFormEvent.panel,
      lastFormEvent.action,
      lastFormEvent.detail ?? ""
    );
    if (!response) return; // 무음 액션 — 채팅에 아무 변화 없음

    setIsTyping(true);
    const t = setTimeout(() => {
      setMessages((prev) => [...prev, response]);
      setIsTyping(false);
    }, 400);
    return () => clearTimeout(t);
  }, [lastFormEvent]);

  /* 카드 클릭 → 가벼운 진입 인사 (시스템 칩·추론 없이)
     채팅이 스스로 setSection을 호출한 경우엔 중복 방지 */
  useEffect(() => {
    if (section && section !== "company-info" && section !== prevSectionRef.current) {
      if (chatDrivenSectionRef.current) {
        chatDrivenSectionRef.current = false;
      } else {
        const entryMsg = getCardEntryMessage(section);
        if (entryMsg) {
          setIsTyping(true);
          const t = setTimeout(() => {
            setMessages((prev) => [...prev, entryMsg]);
            setIsTyping(false);
          }, 350);
          return () => clearTimeout(t);
        }
      }
    }
    prevSectionRef.current = section;
  }, [section]);

  /* ── 승인한도 변경 멀티스텝 플로우 ── */
  const [approvalFlow, setApprovalFlow] = useState<"idle" | "selecting-line" | "entering-amount">("idle");
  const [approvalFlowLineName, setApprovalFlowLineName] = useState<string>("");

  const handleSend = useCallback((text: string) => {
    if (!text.trim()) return;

    setMessages((prev) => [...prev, { id: `user-${Date.now()}`, role: "user", content: text }]);
    setInput("");
    setIsTyping(true);
    const t = text.toLowerCase();

    /* ── 승인한도 플로우: Step 2 — 라인 선택 확인 ── */
    if (approvalFlow === "selecting-line") {
      const lineName = text.includes("마케팅") ? "마케팅·운영" : text.includes("전체") ? "전체 라인" : text.trim();
      setApprovalFlowLineName(lineName);
      setApprovalFlow("entering-amount");
      setTimeout(() => {
        setMessages((prev) => [...prev, {
          id: `ai-${Date.now()}`,
          role: "ai" as const,
          content: `**${lineName} 결재 라인**의 현재 자동승인 한도는 **100만원**이에요.\n\n새로운 한도 금액을 얼마로 변경할까요? (예: 200만원, 300만원)`,
          thinking: [
            { label: "현재 금액 조건 확인", detail: `${lineName}: 2차 승인 100만원 이상` },
          ],
          suggestions: ["200만원", "300만원", "500만원"],
          contextHint: "approval",
        }]);
        setIsTyping(false);
      }, 800);
      return;
    }

    /* ── 승인한도 플로우: Step 3 — 금액 입력 → 반영 ── */
    if (approvalFlow === "entering-amount" && approvalFlowLineName) {
      const num = parseInt(text.replace(/[^0-9]/g, ""), 10);
      const amount = num >= 10000 ? num : num * 10000; // "200만원" → 2000000, "200" → 2000000
      const formatted = amount >= 10000 ? `${(amount / 10000).toLocaleString()}만원` : `${amount.toLocaleString()}원`;
      setApprovalFlow("idle");
      setApprovalFlowLineName("");
      setTimeout(() => {
        setMessages((prev) => [...prev, {
          id: `ai-${Date.now()}`,
          role: "ai" as const,
          content: `**${approvalFlowLineName} 결재 라인**의 자동승인 한도를 **${formatted}**으로 변경했어요.\n\n이제 ${formatted} 미만 구매요청은 자동으로 승인됩니다. 변경 내역은 변경기록에서 확인할 수 있어요.`,
          thinking: [
            { label: "금액 조건 업데이트", detail: `100만원 → ${formatted}` },
            { label: "변경기록 등록", detail: `채팅에서 자동승인 한도 변경 (${approvalFlowLineName})` },
            { label: "영향 범위 확인", detail: `${approvalFlowLineName} 소속 조직의 구매요청에 적용` },
          ],
          suggestions: ["승인 체계 전체 보기", "다른 라인도 수정할게", "현재 구조 보여줘"],
          contextHint: "approval",
        }]);
        setIsTyping(false);
        // 변경기록 추가
        pushVersionHistory({
          domain: "approval-rules",
          action: "update",
          userId: "user-001",
          userName: "박은서",
          summary: `${approvalFlowLineName} 자동승인 한도 → ${formatted}`,
          source: "chat",
          before: { autoApproveLimit: 1000000 },
          after: { autoApproveLimit: amount },
        });
      }, 900);
      return;
    }

    /* ── 승인한도 플로우: Step 1 — 키워드 감지 → 현황 안내 ── */
    if ((t.includes("자동승인") || t.includes("자동 승인")) && (t.includes("한도") || t.includes("올려") || t.includes("변경"))) {
      setApprovalFlow("selecting-line");
      setTimeout(() => {
        setMessages((prev) => [...prev, {
          id: `ai-${Date.now()}`,
          role: "ai" as const,
          content: "자동승인 한도를 확인했어요.\n\n현재 금액 조건이 설정된 결재 라인:\n- **마케팅·운영 결재 라인** — 2차 승인: **100만원 이상**일 때만 활성화\n- 기본/영업팀/개발팀 — 금액 조건 없음\n\n어떤 라인의 한도를 변경하시겠어요?",
          thinking: [
            { label: "결재 라인 금액 조건 조회", detail: "마케팅·운영: 2차 승인 100만원 이상" },
            { label: "다른 라인 확인", detail: "기본/영업팀/개발팀: 금액 조건 없음 (전액 승인 필요)" },
          ],
          suggestions: ["마케팅·운영 라인", "전체 라인에 적용"],
          contextHint: "approval",
        }]);
        setIsTyping(false);
      }, 800);
      return;
    }

    /* ── 기존 시나리오 매칭 ── */
    const { messages: aiMsgs } = buildScenarioResponse(text);
    setTimeout(() => {
      setMessages((prev) => [...prev, ...aiMsgs]);
      setIsTyping(false);

      // 채팅 액션 → 폼에 이벤트 발행 + 우측 패널 자동 전환
      const contextHint = aiMsgs[0]?.contextHint;
      if (contextHint) {
        const targetSection = contextHintToSection[contextHint];
        if (targetSection && targetSection !== section) {
          chatDrivenSectionRef.current = true;
          setSection(targetSection);
        }
        emit({
          source: "chat",
          panel: targetSection ?? section ?? "company-info",
          action: text.slice(0, 30),
          detail: text,
        });
      }
    }, 800);
  }, [emit, section, setSection, approvalFlow, approvalFlowLineName, pushVersionHistory]);

  const handleApplyDiff = useCallback((msgId: string, resolved: { patches: SettingsPatch[]; items: DiffItem[] }) => {
    const msg = messages.find((m) => m.id === msgId);
    if (!msg?.diff) return;

    // 편집된 결과로 메시지의 diff 도 업데이트 (이력 보존)
    setMessages((prev) =>
      prev.map((m) =>
        m.id === msgId && m.diff
          ? { ...m, diff: { ...m.diff, applied: true, patches: resolved.patches, items: resolved.items } }
          : m
      )
    );

    if (resolved.patches.length > 0) {
      applyPatches(resolved.patches);
      // 적용 후 200ms 뒤 영향받은 행 펄스 — 유저 시선 유도
      const keys = Array.from(new Set(resolved.patches.map(patchToFocusKey)));
      setTimeout(() => keys.forEach((k) => focus(k)), 200);
    }

    emit({
      source: "chat",
      panel: section ?? "company-info",
      action: msg.diff.title,
      detail: `${msg.diff.title} 적용됨`,
    });

    setMessages((prev) => [...prev, {
      id: `applied-${Date.now()}`, role: "ai" as const,
      content: "적용했어요! 우측 패널에서 변경된 내용을 확인하실 수 있습니다.",
    }]);
  }, [emit, section, messages, applyPatches, focus]);

  const handleApplyShippingForm = useCallback((msgId: string, finalDraft: ShippingDraft) => {
    addShipping({
      name: finalDraft.name.trim(),
      receiver: finalDraft.receiver.trim(),
      phone: finalDraft.phone.trim(),
      address: finalDraft.address.trim(),
      zipcode: finalDraft.zipcode.trim() || undefined,
      detailAddress: finalDraft.detailAddress.trim() || undefined,
      deliveryNote: finalDraft.deliveryNote.trim() || undefined,
    });
    setMessages((prev) =>
      prev.map((m) =>
        m.id === msgId && m.shippingForm
          ? { ...m, shippingForm: { ...m.shippingForm, draft: finalDraft, applied: true } }
          : m
      )
    );
    emit({
      source: "chat",
      panel: "company-shipping",
      action: "배송지 추가",
      detail: `${finalDraft.name} 추가됨`,
    });
    // 적용 후 강조: 새 행은 ID를 알 수 없으니 list 단위로 펄스
    setTimeout(() => focus("shipping.list"), 200);
    setMessages((prev) => [...prev, {
      id: `applied-${Date.now()}`, role: "ai" as const,
      content: `${finalDraft.name}이(가) 추가되었어요. 우측 배송지 관리에서 확인하실 수 있습니다.`,
    }]);
  }, [addShipping, emit, focus]);

  const handleRejectShippingForm = useCallback(() => {
    setMessages((prev) => [...prev, {
      id: `sys-${Date.now()}`, role: "ai" as const,
      content: "배송지 추가를 취소했어요.",
      suggestions: ["다른 배송지 추가할게", "전체 현황 알려줘"],
    }]);
  }, []);

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
        <Sparkles size={16} strokeWidth={1.5} color="#000" />
        <span className="text-[14px] font-medium text-[#000]" style={{ letterSpacing: "0.14px" }}>설정 어시스턴트</span>
        <span className="text-[12px] text-[#777169] ml-1" style={{ letterSpacing: "0.14px" }}>— 대화로 설정하세요</span>
      </div>

      {/* 메시지 영역 */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto px-6 py-5 flex flex-col gap-4">
        {messages.map((msg) => {
          if (msg.role === "system") {
            return (
              <div key={msg.id} className="flex justify-center">
                <span
                  className="text-[11px] text-[#777169] px-3 py-1"
                  style={{
                    borderRadius: "8px",
                    backgroundColor: "#ffffff",
                    boxShadow: "rgba(0,0,0,0.06) 0px 0px 0px 1px",
                    letterSpacing: "0.14px",
                  }}
                >
                  {msg.content}
                </span>
              </div>
            );
          }

          return (
            <div key={msg.id} className={msg.role === "user" ? "flex justify-end" : "flex justify-start"}>
              <div className="max-w-[90%]">
                {/* 추론 블록 — progressive 노출 + 각 스텝에서 우측 패널 펄스 */}
                {msg.thinking && (
                  <ThinkingBlock
                    steps={msg.thinking}
                    onStepReveal={(step) => {
                      if (step.focusKey) focus(step.focusKey);
                    }}
                  />
                )}

                {/* 메시지 버블 */}
                <div
                  style={{
                    padding: "12px 16px",
                    borderRadius: msg.role === "user" ? "16px 16px 4px 16px" : "16px 16px 16px 4px",
                    backgroundColor: msg.role === "user" ? "#000" : "#ffffff",
                    color: msg.role === "user" ? "#fff" : "#4e4e4e",
                    fontSize: "14px",
                    lineHeight: "1.6",
                    letterSpacing: "0.14px",
                    whiteSpace: "pre-line",
                    boxShadow:
                      msg.role === "user"
                        ? "none"
                        : "rgba(0,0,0,0.06) 0px 0px 0px 1px, rgba(0,0,0,0.04) 0px 1px 2px",
                  }}
                >
                  {msg.content}
                </div>

                {/* Diff 카드 */}
                {msg.diff && (
                  <DiffCard
                    diff={msg.diff}
                    onApply={(resolved) => handleApplyDiff(msg.id, resolved)}
                    onReject={() => handleRejectDiff(msg.id)}
                  />
                )}

                {/* 배송지 인라인 폼 */}
                {msg.shippingForm && (
                  <ShippingFormCard
                    title={msg.shippingForm.title}
                    draft={msg.shippingForm.draft}
                    applied={msg.shippingForm.applied}
                    onApply={(d) => handleApplyShippingForm(msg.id, d)}
                    onReject={handleRejectShippingForm}
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
                className="px-3.5 py-[7px] text-[13px] text-[#4e4e4e] cursor-pointer transition-all hover:bg-[rgba(245,242,239,0.8)]"
                style={{
                  borderRadius: "9999px",
                  backgroundColor: "#ffffff",
                  boxShadow: "rgba(0,0,0,0.4) 0px 0px 1px, rgba(0,0,0,0.04) 0px 4px 4px",
                  letterSpacing: "0.14px",
                }}
              >
                {s}
              </button>
            ))}
          </div>
        )}

        {/* 타이핑 인디케이터 */}
        {isTyping && (
          <div className="flex justify-start">
            <div
              className="flex items-center gap-2 px-4 py-3"
              style={{
                borderRadius: "16px 16px 16px 4px",
                backgroundColor: "#ffffff",
                boxShadow: "rgba(0,0,0,0.06) 0px 0px 0px 1px, rgba(0,0,0,0.04) 0px 1px 2px",
              }}
            >
              <Loader2 size={14} strokeWidth={1.5} color="#777169" className="animate-spin" />
              <span className="text-[13px] text-[#777169]" style={{ letterSpacing: "0.14px" }}>분석 중...</span>
            </div>
          </div>
        )}
      </div>

      {/* 입력 영역 */}
      <div className="shrink-0 px-5 pb-5 pt-2">
        <div
          className="flex items-center gap-2 px-4 py-3"
          style={{
            borderRadius: "14px",
            backgroundColor: "#ffffff",
            boxShadow: "rgba(0,0,0,0.06) 0px 0px 0px 1px, rgba(0,0,0,0.04) 0px 1px 2px, rgba(0,0,0,0.04) 0px 2px 4px",
          }}
        >
          <input
            ref={inputRef}
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              // 한글 IME 조합 중 Enter는 무시 (조합 확정 + 전송 이중 발사 방지)
              // nativeEvent.isComposing: 표준 / keyCode 229: Safari·구버전 대응
              if (e.nativeEvent.isComposing || e.keyCode === 229) return;
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
