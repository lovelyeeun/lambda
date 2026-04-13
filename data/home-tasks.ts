/* ═══════════════════════════════════════
   시작 화면 (Start Screen) Mock 데이터
   role 기반 필터 구조 — 추후 API 연결 시 이 파일만 교체
   ═══════════════════════════════════════ */

export type HomeRole = "purchaser" | "requester";

export type TaskStatus = "approval" | "quote" | "shipping" | "schedule" | "renewal" | "review" | "insight";

export interface HomeTask {
  id: string;
  status: TaskStatus;
  title: string;
  meta: string;          // 보조 한 줄 (시간/상태/카운트)
  prompt: string;        // 카드 클릭 시 /chat?q= 로 넘길 프롬프트
  role: HomeRole[];      // 어떤 role에서 노출
}

/* ── Active Tasks ── */
const ACTIVE_TASKS: HomeTask[] = [
  {
    id: "active-001",
    status: "approval",
    title: "마케팅팀 노트북 3대 (₩4,200,000) 결재 대기",
    meta: "이진우 팀장 결재 대기 · 2시간 전",
    prompt: "마케팅팀 노트북 3대 결재 진행 상태를 확인해줘",
    role: ["purchaser"],
  },
  {
    id: "active-002",
    status: "quote",
    title: "A4용지 대량 발주 견적 비교",
    meta: "3개 벤더 견적 수신 완료",
    prompt: "A4용지 대량 발주 견적 3건 비교해줘",
    role: ["purchaser"],
  },
  {
    id: "active-003",
    status: "shipping",
    title: "프린터 토너 20개 배송 추적",
    meta: "내일 도착 예정 · CJ대한통운",
    prompt: "프린터 토너 20개 배송 상태 확인",
    role: ["purchaser"],
  },
];

/* ── Upcoming ── */
const UPCOMING_TASKS: HomeTask[] = [
  {
    id: "upcoming-001",
    status: "schedule",
    title: "사무용품 월간 정기 재주문",
    meta: "4월 20일(월) 예정",
    prompt: "사무용품 월간 정기 재주문 준비해줘",
    role: ["purchaser"],
  },
  {
    id: "upcoming-002",
    status: "renewal",
    title: "Adobe Creative Cloud 연간 라이선스 갱신",
    meta: "D-14 · 4월 27일",
    prompt: "Adobe Creative Cloud 연간 라이선스 갱신 진행",
    role: ["purchaser"],
  },
  {
    id: "upcoming-003",
    status: "review",
    title: "Q2 구매 예산 리뷰",
    meta: "4월 28일(화)",
    prompt: "Q2 구매 예산 리뷰 자료 정리해줘",
    role: ["purchaser"],
  },
];

/* ── Recommended (AI 인사이트) ── */
const RECOMMENDED_TASKS: HomeTask[] = [
  {
    id: "rec-001",
    status: "insight",
    title: "지난달 대비 토너 사용량 30% 증가",
    meta: "재주문 타이밍을 앞당기시겠어요?",
    prompt: "지난달 토너 사용량 분석하고 재주문 시점 추천해줘",
    role: ["purchaser"],
  },
  {
    id: "rec-002",
    status: "insight",
    title: "A4용지 벤더 B, 최근 3회 배송 지연",
    meta: "대안 벤더 추천받기",
    prompt: "A4용지 대안 벤더 추천해줘 — 벤더 B 최근 배송 지연 있음",
    role: ["purchaser"],
  },
  {
    id: "rec-003",
    status: "insight",
    title: "Q1 마케팅팀 구매 패턴 분석 리포트",
    meta: "지출 추이·카테고리 비중 자동 정리",
    prompt: "Q1 마케팅팀 구매 패턴 분석 리포트 만들어줘",
    role: ["purchaser"],
  },
];

/* ── Context (드롭다운) ── */
export interface HomeContext {
  id: string;
  label: string;
}

export const HOME_CONTEXTS: HomeContext[] = [
  { id: "company", label: "전사 구매" },
  { id: "marketing", label: "마케팅팀" },
  { id: "dev", label: "개발팀" },
  { id: "project-spring", label: "프로젝트 · Spring 캠페인" },
];

export const HOME_MODELS: HomeContext[] = [
  { id: "auto", label: "자동 (권장)" },
  { id: "fast", label: "빠른 응답" },
  { id: "deep", label: "심층 분석" },
];

/* ── Selectors ── */
export function getActiveTasks(role: HomeRole): HomeTask[] {
  return ACTIVE_TASKS.filter((t) => t.role.includes(role));
}

export function getUpcomingTasks(role: HomeRole): HomeTask[] {
  return UPCOMING_TASKS.filter((t) => t.role.includes(role));
}

export function getRecommendedTasks(role: HomeRole): HomeTask[] {
  return RECOMMENDED_TASKS.filter((t) => t.role.includes(role));
}
