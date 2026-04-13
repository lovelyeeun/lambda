import type { RFQ } from "@/lib/types";

export const rfqs: RFQ[] = [
  {
    id: "rfq-001",
    companyId: "comp-004",
    companyName: "대한솔루션",
    items: [
      { name: "LG 27인치 4K UHD 모니터 27UP850", quantity: 10, unitPrice: 430000 },
      { name: "삼성 갤럭시탭 S9 FE", quantity: 5, unitPrice: 520000 },
    ],
    deliveryDate: "2026-05-01",
    paymentTerms: "납품 후 30일 이내",
    note: "연간 계약 단가 기준 견적 요청",
    status: "회신대기",
    createdAt: "2026-04-05",
    sentAt: "2026-04-05",
  },
  {
    id: "rfq-002",
    companyId: "comp-005",
    companyName: "그린오피스",
    items: [
      { name: "친환경 A4 복사용지 500매", quantity: 100 },
      { name: "재생 토너 카트리지 (HP 206A 호환)", quantity: 20 },
    ],
    deliveryDate: "2026-04-25",
    paymentTerms: "선결제",
    status: "작성중",
    createdAt: "2026-04-09",
  },
  {
    id: "rfq-003",
    companyId: "comp-003",
    companyName: "시디즈",
    items: [
      { name: "시디즈 T50 AIR 메쉬 사무용 의자", quantity: 20, unitPrice: 470000 },
    ],
    deliveryDate: "2026-05-15",
    paymentTerms: "납품 후 60일 이내",
    note: "20대 이상 추가 할인 요청",
    status: "계약진행",
    createdAt: "2026-03-20",
    sentAt: "2026-03-21",
  },
];
