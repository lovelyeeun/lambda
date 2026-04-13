import type { Activity } from "@/lib/types";

/* ─── AI 데일리 브리핑 ─── */
export interface DailyBriefing {
  date: string;
  greeting: string;
  summary: string;
  highlights: { icon: "action" | "delivery" | "insight" | "payment"; text: string }[];
}

export const dailyBriefings: Record<string, DailyBriefing> = {
  "2026-04-13": {
    date: "2026-04-13",
    greeting: "좋은 월요일 아침이에요, 원균님 👋",
    summary: "이번 주 배송 2건이 예정되어 있고, 승인 대기 1건이 있어요.",
    highlights: [
      { icon: "action", text: "토너 구매요청 승인이 4일째 대기 중이에요 — 팀장님께 리마인드 드릴까요?" },
      { icon: "delivery", text: "사무용 의자 5개가 내일 도착 예정이에요" },
      { icon: "insight", text: "이번 달 사무용품 지출이 지난달 대비 12% 감소했어요" },
    ],
  },
  "2026-04-14": {
    date: "2026-04-14",
    greeting: "원균님, 오늘 배송이 도착해요 📦",
    summary: "사무용 의자 배송 도착 예정이에요. 수령 확인을 잊지 마세요.",
    highlights: [
      { icon: "delivery", text: "시디즈 T50 의자 5개 — 오늘 오후 도착 예정" },
      { icon: "action", text: "포스트잇 주문이 승인 완료됐어요, 결제를 진행할까요?" },
    ],
  },
  "2026-04-11": {
    date: "2026-04-11",
    greeting: "원균님, 금요일이에요 ☀️",
    summary: "이번 주 처리한 활동 5건, 다음 주 배송 예정 2건이에요.",
    highlights: [
      { icon: "insight", text: "이번 주 구매 3건 처리 완료 — 평균 처리 시간 2.3일이에요" },
      { icon: "delivery", text: "다음 주 월요일 모니터 배송 예정" },
    ],
  },
};

/* ─── 활동 데이터 ─── */
export const activities: Activity[] = [
  /* === 4월 13일 (오늘) === */
  {
    id: "act-001",
    type: "approval",
    title: "토너 구매요청 승인 대기",
    description: "HP 206A 정품 토너 3개 — 마케팅팀 프린터 토너 교체",
    date: "2026-04-13",
    time: "09:00",
    relatedOrderId: "ord-003",
    status: "action-needed",
    actionLabel: "리마인드 보내기",
    aiInsight: "4일째 대기 중이에요. 평소 승인까지 평균 1.5일이 걸려요.",
  },
  {
    id: "act-002",
    type: "delivery",
    title: "모니터 배송 예정",
    description: "LG 27인치 4K UHD 모니터 2대 — 개발팀 듀얼 모니터 세팅",
    date: "2026-04-13",
    relatedOrderId: "ord-004",
    status: "in-progress",
    aiInsight: "배송이 하루 지연되고 있어요. 예상 도착일이 내일로 변경됐어요.",
  },
  {
    id: "act-003",
    type: "ai-insight",
    title: "정기구매 리마인드",
    description: "A4 복사용지 — 지난달 10일에 주문, 이번 달도 재주문 시점이에요",
    date: "2026-04-13",
    status: "info",
    actionLabel: "재주문하기",
    aiInsight: "월 평균 소비량 기준 이번 주 내 주문하면 재고 끊김 없이 사용 가능해요.",
  },

  /* === 4월 14일 === */
  {
    id: "act-004",
    type: "delivery",
    title: "사무용 의자 도착 예정",
    description: "시디즈 T50 AIR 메쉬 사무용 의자 5개 — 디자인팀 신규 입사자분",
    date: "2026-04-14",
    relatedOrderId: "ord-002",
    status: "in-progress",
    actionLabel: "수령 확인",
  },
  {
    id: "act-005",
    type: "payment",
    title: "포스트잇 결제 진행 가능",
    description: "3M 포스트잇 5팩 — 승인 완료, 결제 대기 중",
    date: "2026-04-14",
    relatedOrderId: "ord-010",
    status: "action-needed",
    actionLabel: "결제하기",
    aiInsight: "법인카드 (하나)로 자동 결제될 예정이에요.",
  },

  /* === 4월 16일 === */
  {
    id: "act-006",
    type: "delivery",
    title: "복합기 배송 예정",
    description: "후지제록스 DocuCentre S2520 복합기 — 3층 사무실 교체",
    date: "2026-04-16",
    relatedOrderId: "ord-007",
    status: "in-progress",
  },

  /* === 과거 활동들 === */
  {
    id: "act-007",
    type: "order",
    title: "반려: 전동 데스크 구매요청",
    description: "한화 전동 높이조절 데스크 3대 — 예산 초과로 반려",
    date: "2026-04-05",
    relatedOrderId: "ord-005",
    status: "action-needed",
    actionLabel: "재요청하기",
    aiInsight: "차분기 예산에 포함하면 승인 가능성이 높아요. 재요청 시 금액 분할을 추천해요.",
  },
  {
    id: "act-008",
    type: "delivery",
    title: "포스트잇 배송 완료",
    description: "3M 포스트잇 10팩 수령 완료",
    date: "2026-04-04",
    relatedOrderId: "ord-006",
    status: "done",
  },
  {
    id: "act-009",
    type: "order",
    title: "복사용지 주문 확정",
    description: "더블에이 A4 복사용지 20박스 — 구매확정",
    date: "2026-04-01",
    relatedOrderId: "ord-001",
    status: "done",
  },
  {
    id: "act-010",
    type: "cs",
    title: "토너 호환성 문의 답변 완료",
    description: "HP 206A 토너가 우리 프린터와 호환되는지 확인 → 호환 확인됨",
    date: "2026-04-02",
    status: "done",
  },
  {
    id: "act-011",
    type: "recurring",
    title: "토너 정기구매 자동 주문",
    description: "HP 206A 정품 토너 2개 — 월간 정기구매 자동 발주",
    date: "2026-04-01",
    relatedOrderId: "ord-009",
    status: "done",
    aiInsight: "정기구매 주기가 잘 맞고 있어요. 다음 발주는 5월 1일이에요.",
  },
  {
    id: "act-012",
    type: "payment",
    title: "의자 결제 완료",
    description: "시디즈 T50 의자 5개 — 법인카드 결제 완료",
    date: "2026-04-03",
    relatedOrderId: "ord-002",
    status: "done",
  },
  /* === 3월 === */
  {
    id: "act-013",
    type: "delivery",
    title: "복사용지 배송 완료",
    description: "더블에이 A4 복사용지 10박스 — 정기구매 배송 완료",
    date: "2026-03-13",
    relatedOrderId: "ord-008",
    status: "done",
  },
];
