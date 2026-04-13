import type { Expense } from "@/lib/types";

export const expenses: Expense[] = [
  // 2025-11
  { id: "exp-001", date: "2025-11-05", category: "용지", team: "경영지원", amount: 129000, productName: "A4 복사용지 80g 500매 ×10" },
  { id: "exp-002", date: "2025-11-12", category: "잉크/토너", team: "마케팅", amount: 178000, productName: "HP 206A 토너 ×2" },
  { id: "exp-003", date: "2025-11-20", category: "사무용품", team: "디자인", amount: 72000, productName: "스테들러 파인라이너 20색 ×3" },
  // 2025-12
  { id: "exp-004", date: "2025-12-03", category: "전자기기", team: "개발", amount: 918000, productName: "LG 27인치 모니터 ×2" },
  { id: "exp-005", date: "2025-12-10", category: "가구", team: "경영지원", amount: 389000, productName: "한화 전동 데스크 ×1" },
  { id: "exp-006", date: "2025-12-18", category: "생활용품", team: "경영지원", amount: 28000, productName: "킨토 티포트 ×1" },
  { id: "exp-007", date: "2025-12-22", category: "사무용품", team: "마케팅", amount: 44500, productName: "3M 포스트잇 5팩 ×5" },
  // 2026-01
  { id: "exp-008", date: "2026-01-08", category: "사무기기", team: "경영지원", amount: 159000, productName: "브라더 프린터 ×1" },
  { id: "exp-009", date: "2026-01-15", category: "용지", team: "마케팅", amount: 258000, productName: "A4 복사용지 ×20" },
  { id: "exp-010", date: "2026-01-22", category: "잉크/토너", team: "경영지원", amount: 89000, productName: "HP 206A 토너 ×1" },
  { id: "exp-011", date: "2026-01-28", category: "전자기기", team: "디자인", amount: 549000, productName: "갤럭시탭 S9 FE ×1" },
  // 2026-02
  { id: "exp-012", date: "2026-02-05", category: "용지", team: "경영지원", amount: 129000, productName: "A4 복사용지 ×10" },
  { id: "exp-013", date: "2026-02-12", category: "가구", team: "디자인", amount: 996000, productName: "시디즈 T50 AIR ×2" },
  { id: "exp-014", date: "2026-02-19", category: "사무용품", team: "개발", amount: 8900, productName: "포스트잇 5팩 ×1" },
  { id: "exp-015", date: "2026-02-25", category: "생활용품", team: "경영지원", amount: 38900, productName: "코웨이 정수기 월렌탈" },
  // 2026-03
  { id: "exp-016", date: "2026-03-04", category: "잉크/토너", team: "마케팅", amount: 267000, productName: "HP 206A 토너 ×3" },
  { id: "exp-017", date: "2026-03-11", category: "사무기기", team: "경영지원", amount: 1890000, productName: "후지제록스 복합기 ×1" },
  { id: "exp-018", date: "2026-03-18", category: "용지", team: "경영지원", amount: 258000, productName: "A4 복사용지 ×20", orderId: "ord-001" },
  { id: "exp-019", date: "2026-03-25", category: "전자기기", team: "개발", amount: 459000, productName: "LG 모니터 ×1" },
  // 2026-04
  { id: "exp-020", date: "2026-04-01", category: "사무용품", team: "디자인", amount: 44500, productName: "포스트잇 정기구매", orderId: "ord-010" },
  { id: "exp-021", date: "2026-04-02", category: "사무용품", team: "경영지원", amount: 89000, productName: "포스트잇 5팩 ×10", orderId: "ord-006" },
  { id: "exp-022", date: "2026-04-03", category: "가구", team: "디자인", amount: 2490000, productName: "시디즈 T50 AIR ×5", orderId: "ord-002" },
  { id: "exp-023", date: "2026-04-07", category: "전자기기", team: "개발", amount: 918000, productName: "LG 모니터 ×2", orderId: "ord-004" },
  { id: "exp-024", date: "2026-04-08", category: "사무기기", team: "경영지원", amount: 1890000, productName: "후지제록스 복합기", orderId: "ord-007" },
  { id: "exp-025", date: "2026-04-09", category: "잉크/토너", team: "마케팅", amount: 267000, productName: "HP 206A 토너 ×3", orderId: "ord-003" },
];
