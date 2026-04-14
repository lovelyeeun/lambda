/* ============================================
   Lambda — 전체 타입 정의
   ============================================ */

/* ─── 상품 ─── */
export interface Product {
  id: string;
  name: string;
  price: number;
  category: ProductCategory;
  brand: string;
  image: string;
  description: string;
  specs: Record<string, string>;
  inStock: boolean;
  source?: string;           // 소싱처 (쿠팡, SmartStore, 오늘의집 등)
  tags?: string[];           // 배송/프로모션 태그 (무료배송, 로켓배송 등)
}

export type ProductCategory =
  | "용지"
  | "잉크/토너"
  | "사무기기"
  | "가구"
  | "전자기기"
  | "사무용품"
  | "생활용품"
  | "간식";

/* ─── 주문 ─── */
export interface Order {
  id: string;
  productId: string;
  productName: string;
  quantity: number;
  totalPrice: number;
  status: OrderStatus;
  orderedBy: string;
  orderedAt: string;       // ISO date
  deliveryDate: string;    // ISO date (예정/완료)
  approvedBy?: string;
  paymentMethod?: string;
  trackingNumber?: string;
  note?: string;
  isRecurring?: boolean;   // 정기구매 여부
}

export type OrderStatus =
  | "승인대기"
  | "승인완료"
  | "결제완료"
  | "배송준비"
  | "배송중"
  | "배송완료"
  | "구매확정"
  | "반품요청"
  | "반려";

/* ─── 활동 (내 활동 캘린더용) ─── */
export type ActivityType =
  | "order"       // 주문 관련
  | "approval"    // 승인 요청/처리
  | "delivery"    // 배송 도착/변경
  | "payment"     // 결제 관련
  | "cs"          // CS 문의/답변
  | "recurring"   // 정기구매 알림
  | "ai-insight"; // AI 인사이트/추천

export interface Activity {
  id: string;
  type: ActivityType;
  title: string;
  description: string;
  date: string;           // ISO date
  time?: string;          // HH:mm
  relatedOrderId?: string;
  status: "action-needed" | "in-progress" | "done" | "info";
  actionLabel?: string;   // "승인하기", "확인하기" 등
  aiInsight?: string;     // AI가 생성한 한 줄 인사이트
}

/* ─── 채팅 ─── */
export interface Chat {
  id: string;
  title: string;
  lastMessage: string;
  updatedAt: string;       // ISO datetime
  status: ChatStatus;
  tags: string[];
  messages: ChatMessage[];
}

export type ChatStatus = "진행중" | "완료" | "대기";

export interface ChatMessage {
  id: string;
  role: "user" | "assistant" | "system";
  content: string;
  timestamp: string;       // ISO datetime
  agent?: string;          // 자동 호출된 에이전트 (주문, 배송, 권한 등)
  productIds?: string[];   // 상품 추천 시 포함되는 상품 ID 목록
  /** 메시지에 특수 카드를 덧붙일 때 사용 */
  cardType?: "expense-summary" | "snack-recommendation";
}

/* ─── 폴더 ─── */
export interface Folder {
  id: string;
  name: string;
  icon: string;          // lucide icon name hint
  productIds: string[];
  description?: string;
  /** 하위 폴더 (1단계 중첩 가정) */
  children?: Folder[];
}

/* ─── 공급기업 ─── */
export interface Company {
  id: string;
  name: string;
  category: string;
  contact: string;
  email: string;
  phone: string;
  address: string;
  registrationNumber: string;
  contractStatus: ContractStatus;
  rating: number;          // 1-5
  transactionCount: number;
  lastTransaction?: string; // ISO date
  note?: string;
}

export type ContractStatus = "계약중" | "계약만료" | "협상중" | "미계약";

/* ─── 품의 요청 ─── */
export interface ApprovalRequest {
  id: string;
  title: string;
  requestedBy: string;        // user id
  requestedByName: string;
  department: string;
  approverId: string;
  approverName: string;
  items: { productId: string; productName: string; quantity: number; unitPrice: number }[];
  totalPrice: number;
  status: ApprovalStatus;
  urgency: "normal" | "urgent";
  reason: string;             // AI 생성 or 수동 입력 품의 사유
  aiInsights?: string[];      // 에이전트 인사이트
  createdAt: string;          // ISO datetime
  respondedAt?: string;       // 승인/반려 일시
  responseNote?: string;      // 승인자 코멘트
  shippingAddress: string;
  budgetUsagePercent?: number; // 예산 사용률
}

export type ApprovalStatus = "대기중" | "승인" | "반려" | "자동승인" | "취소";

/* ─── 구매 준비 (동기화) ─── */
export interface PurchasePreparation {
  id: string;
  userId: string;
  userName: string;
  department: string;
  intentSummary: string;       // 에이전트가 추상화한 구매 의도 한 줄
  categories: string[];        // 상품 카테고리들
  estimatedTotal: number;
  itemCount: number;
  startedAt: string;           // 최초 장바구니 담기 시점
  lastActivityAt: string;      // 마지막 장바구니 변경 시점
  aiContext?: string;          // 에이전트 부가 맥락 (재주문 주기, 예산 상태 등)
  approverReaction?: "acknowledged" | "discuss" | "caution" | null;
  approverReactionAt?: string;
}

/* ─── 지출 ─── */
export interface Expense {
  id: string;
  date: string;            // ISO date
  category: ProductCategory;
  team: string;
  amount: number;
  productName: string;
  orderId?: string;
}

/* ─── RFQ ─── */
export interface RFQ {
  id: string;
  companyId: string;
  companyName: string;
  items: { name: string; quantity: number; unitPrice?: number }[];
  deliveryDate?: string;
  paymentTerms?: string;
  note?: string;
  status: "작성중" | "발송완료" | "회신대기" | "계약진행";
  createdAt: string;
  sentAt?: string;
}

/* ─── 사용자/팀원 ─── */
export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  department: string;
  avatar?: string;
  permissions: UserPermissions;
  joinedAt: string;        // ISO date
}

export type UserRole = "관리자" | "매니저" | "구매담당" | "일반";

export interface UserPermissions {
  menuAccess: string[];
  canApprove: boolean;
  canPurchase: boolean;
  purchaseLimit: number;   // 원, 0 = 무제한
  aiRestricted: boolean;
}

/* ─── Work Item ───
   한 채팅에서 여러 구매가 동시 진행될 때, 각 구매 여정을 독립 객체로 다룸.
   (design-decision-work-item-separation.md 참조)
   현재는 "구매" type만 first-class. 반품/CS/설정 등은 Phase 3.
*/
export type WorkItemStatus =
  | "idle"        // 의도 감지됨, 아직 검색 전
  | "analyzing"   // 의도 분석 중
  | "searching"   // 상품 검색 중
  | "results"     // 추천 결과 노출
  | "cart"        // 장바구니 담김, 아직 플로우 전
  | "approval"    // 품의 진행 중
  | "payment"     // 결제 중
  | "shipping"    // 배송 중
  | "complete";   // 완료

export interface WorkItem {
  id: string;                    // 예: "wi-245"
  title: string;                 // 사용자에게 보여줄 짧은 제목 — "청소기" / "토너" / "A4용지"
  icon?: string;                 // lucide icon name hint (옵션)
  color: string;                 // chip 색상 (hex)
  status: WorkItemStatus;
  createdAt: string;             // ISO datetime
  /** 파이프라인 snapshot — 이 WI가 활성일 때 ChatContainer의 singleton state로 로드됨 */
  snapshot: WorkItemSnapshot;
}

/** 각 Work Item의 구매 파이프라인 상태 — ChatContainer singleton state를 스냅샷으로 저장 */
export interface WorkItemSnapshot {
  // 검색 단계
  searchPhase: "idle" | "analyzing" | "searching" | "results";
  intentText: string | null;
  // sourcedProducts / candidateProducts / searchRecords 는 any로 두어 ChatContainer 내부 타입 의존 최소화
  // (런타임에서는 실제 형상이 유지되며, 이 문서는 현 시점 MVP용)
  sourcedProducts: unknown[];
  candidateProducts: unknown[];
  searchRecords: unknown[];
  // 카트
  cart: unknown[];
  // 플로우
  flowActive: boolean;
  timelinePhase: "products" | "approval" | "payment" | "shipping" | "complete";
  approvalStep: "요청" | "대기" | "승인" | "반려" | "자동승인";
  isAutoApproved: boolean;
  approvalDate?: string;
  paymentMethod?: string;
  paymentDate?: string;
  shippingStep: "접수" | "준비" | "배송중" | "배송완료" | "구매확정" | "반품요청";
  frozenCart: unknown[];
  frozenTotal: number;
}
