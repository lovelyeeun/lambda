"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import {
  Sparkles, Database, Building2, Globe, Zap, Search, Clock,
  Check, Loader2, Package, Eye,
} from "lucide-react";
import type { ChatMessage, Product } from "@/lib/types";
import { products } from "@/data/products";
import { chats } from "@/data/chats";
import { useRightPanel } from "@/lib/right-panel-context";
import ChatBubble from "./ChatBubble";
import ChatInput from "./ChatInput";
import ProductRecommendCard from "./ProductRecommendCard";
import SourcedProductCard, {
  type SourcedProduct,
  type ScrapingStatus,
} from "./SourcedProductCard";
import ProductDetailPanel from "./ProductDetailPanel";
import CartPanel, { type CartItem } from "@/components/commerce/CartPanel";
import PaymentSelector from "@/components/commerce/PaymentSelector";
import OrderTimeline, { type TimelinePhase } from "@/components/commerce/OrderTimeline";
import type { ApprovalStep } from "@/components/commerce/ApprovalTracker";
import type { ShippingStep } from "@/components/commerce/ShippingTracker";
import ChatContextSidebar, { type SearchRecord, type ContextInfo } from "./ChatContextSidebar";
import ResizableHandle from "@/components/ui/ResizableHandle";

/* ═══════════════════════════════════════
   CSS 애니메이션
   ═══════════════════════════════════════ */

const animStyles = `
@keyframes shimmer-bar {
  0% { background-position: -200% 0; }
  100% { background-position: 200% 0; }
}
@keyframes fade-in {
  from { opacity: 0; transform: translateY(8px); }
  to { opacity: 1; transform: translateY(0); }
}
`;

/* ═══════════════════════════════════════
   3-DB 검색 시나리오 데이터
   키워드별로 다른 상품 세트 제공
   ═══════════════════════════════════════ */

interface SearchScenario {
  keywords: string[];
  intent: string;
  products: SourcedProduct[];      // 채팅에서 보여줄 선정 상품 (1~3개)
  candidates: SourcedProduct[];    // 검색에서 추가로 발견된 후보 상품
}

const searchScenarios: SearchScenario[] = [
  {
    keywords: ["청소기", "청소"],
    intent: "사무실 청소기 구매 요청 — 기업용 무선 청소기, 사무공간 적합 모델 중심으로 검색합니다.",
    products: [
      {
        id: "src-v01", name: "삼성 비스포크 제트 무선 청소기 VS20A95973B", price: 698000, originalPrice: 799000,
        brand: "삼성전자", category: "생활가전", source: "airsupply-db",
        purchaseCount: 34, deliveryFee: 0, deliveryDays: 2, options: ["미드나이트블루", "코사 핑크", "새틴 그레이"],
        savingsPercent: 13, isRecommended: true,
        aiNote: "최근 30일 동종업계 34회 구매 — 가장 많이 선택된 모델. 귀사 유사 규모 기업의 82%가 이 제품을 선택했습니다.",
      },
      {
        id: "src-v02", name: "LG 코드제로 A9S 올인원타워 AS9571GKE", price: 729000,
        brand: "LG전자", category: "생활가전", source: "airsupply-supplier",
        deliveryFee: 0, deliveryDays: 3, options: ["카밍 그린", "판타지 실버"], purchaseCount: 18, savingsPercent: 8,
        aiNote: "입점 공급사 직거래 — A/S 직접 연결 가능. LG 선호 기업이라면 유리합니다.",
      },
      {
        id: "src-v03", name: "다이슨 V15 디텍트 컴플리트 무선 청소기", price: 659000,
        brand: "다이슨", category: "생활가전", source: "api-external", platform: "쿠팡",
        platformUrl: "https://www.coupang.com/...",
        scrapingStatus: "idle", scrapingProgress: 0,
        scrapingSteps: [
          { label: "상품 페이지 접속", done: false }, { label: "가격·옵션 정보 추출", done: false },
          { label: "배송비·배송일 확인", done: false }, { label: "상세 스펙 수집", done: false },
        ],
        aiNote: "쿠팡 최저가 — 상세 옵션과 배송 조건은 정보 수집 후 확인 가능합니다.",
      },
    ],
    candidates: [
      {
        id: "src-v04", name: "일렉트로룩스 에르고라피도 ZB3320P", price: 289000,
        brand: "일렉트로룩스", category: "생활가전", source: "airsupply-db",
        purchaseCount: 5, deliveryFee: 3000, deliveryDays: 3, savingsPercent: 6,
        aiNote: "가성비 옵션 — 소규모 사무실용. 저소음 모드 탑재.",
      },
      {
        id: "src-v05", name: "샤오미 미지아 무선 청소기 프로", price: 198000,
        brand: "샤오미", category: "생활가전", source: "api-external", platform: "11번가",
        scrapingStatus: "idle" as const, scrapingProgress: 0,
        aiNote: "초저가 옵션 — 기업 구매 이력 없음. 브랜드 신뢰도 확인 필요.",
      },
      {
        id: "src-v06", name: "보쉬 Unlimited Serie 8 BBS812PCK", price: 879000,
        brand: "보쉬", category: "생활가전", source: "airsupply-supplier",
        purchaseCount: 2, deliveryFee: 0, deliveryDays: 5, savingsPercent: 4,
        aiNote: "프리미엄 옵션 — 교체형 배터리 시스템. 넓은 공간에 적합.",
      },
      {
        id: "src-v07", name: "테팔 에어포스 360 TY5516", price: 349000,
        brand: "테팔", category: "생활가전", source: "api-external", platform: "쿠팡",
        scrapingStatus: "idle" as const, scrapingProgress: 0,
        aiNote: "중가 옵션 — 가격 대비 흡입력 우수. 기업 구매 이력 3건.",
      },
    ],
  },
  {
    keywords: ["모니터", "디스플레이"],
    intent: "모니터 구매 요청 — 27인치 이상 4K 사무용 모니터 중심으로 비교 검색합니다.",
    products: [
      {
        id: "src-m01", name: "LG 27인치 4K UHD 모니터 27UP850", price: 459000,
        brand: "LG전자", category: "전자기기", source: "airsupply-db",
        purchaseCount: 52, deliveryFee: 0, deliveryDays: 2, options: ["실버", "블랙"],
        savingsPercent: 11, isRecommended: true,
        aiNote: "사내 52회 구매 이력 — 개발팀·디자인팀 표준 모니터. USB-C PD 지원으로 노트북 충전 가능.",
      },
      {
        id: "src-m02", name: "삼성 ViewFinity S8 27인치 S80UA", price: 489000,
        brand: "삼성전자", category: "전자기기", source: "airsupply-supplier",
        deliveryFee: 0, deliveryDays: 3, options: ["블랙"], purchaseCount: 28, savingsPercent: 7,
        aiNote: "입점 공급사 직거래가. HDR10+ 지원, 컬러 작업에 유리.",
      },
      {
        id: "src-m03", name: "Dell UltraSharp U2723QE 27인치 4K", price: 519000,
        brand: "Dell", category: "전자기기", source: "api-external", platform: "네이버쇼핑",
        platformUrl: "https://shopping.naver.com/...",
        scrapingStatus: "idle", scrapingProgress: 0,
        scrapingSteps: [
          { label: "상품 페이지 접속", done: false }, { label: "가격·옵션 정보 추출", done: false },
          { label: "배송비·배송일 확인", done: false }, { label: "상세 스펙 수집", done: false },
        ],
        aiNote: "네이버쇼핑 최저가 — IPS Black 패널, 색재현율 98% DCI-P3.",
      },
    ],
    candidates: [
      {
        id: "src-m04", name: "BenQ PD2705U 27인치 4K 디자이너 모니터", price: 689000,
        brand: "BenQ", category: "전자기기", source: "airsupply-supplier",
        purchaseCount: 8, deliveryFee: 0, deliveryDays: 4, savingsPercent: 5,
        aiNote: "디자인팀 특화 — Pantone 인증. 가격대가 높으나 색 정확도 최상.",
      },
      {
        id: "src-m05", name: "LG 27GP850 27인치 QHD 게이밍 모니터", price: 389000,
        brand: "LG전자", category: "전자기기", source: "airsupply-db",
        purchaseCount: 3, deliveryFee: 0, deliveryDays: 2,
        aiNote: "QHD(비4K) — 해상도 요건 미달 가능. 가격 절감 옵션으로 참고.",
      },
      {
        id: "src-m06", name: "HP Z27k G3 27인치 4K USB-C", price: 579000,
        brand: "HP", category: "전자기기", source: "api-external", platform: "11번가",
        scrapingStatus: "idle" as const, scrapingProgress: 0,
        aiNote: "HP 생태계 사용 기업에 적합. Thunderbolt 4 지원.",
      },
    ],
  },
  {
    keywords: ["의자", "사무용의자", "체어"],
    intent: "사무용 의자 구매 요청 — 인체공학 메쉬 사무용 의자, 장시간 착석 기준으로 검색합니다.",
    products: [
      {
        id: "src-c01", name: "시디즈 T50 AIR 메쉬 사무용 의자", price: 498000,
        brand: "시디즈", category: "가구", source: "airsupply-db",
        purchaseCount: 67, deliveryFee: 0, deliveryDays: 5, options: ["블랙 메쉬", "그레이 메쉬"],
        savingsPercent: 15, isRecommended: true,
        aiNote: "사내 67회 구매 — 가장 많이 선택된 사무용 의자. 10년 A/S 보장.",
      },
      {
        id: "src-c02", name: "퍼시스 CHN4300A 메쉬 의자", price: 380000,
        brand: "퍼시스", category: "가구", source: "airsupply-supplier",
        deliveryFee: 30000, deliveryDays: 7, options: ["블랙"], purchaseCount: 23,
        aiNote: "입점 공급사 직거래. 대량 구매 시 추가 할인 가능.",
      },
      {
        id: "src-c03", name: "허먼밀러 에어론 리마스터드 풀옵션", price: 1890000,
        brand: "허먼밀러", category: "가구", source: "api-external", platform: "구글쇼핑",
        platformUrl: "https://shopping.google.com/...",
        scrapingStatus: "idle", scrapingProgress: 0,
        scrapingSteps: [
          { label: "상품 페이지 접속", done: false }, { label: "가격·옵션 정보 추출", done: false },
          { label: "배송비·배송일 확인", done: false }, { label: "상세 스펙 수집", done: false },
        ],
        aiNote: "프리미엄 옵션 — 12년 보증. 예산 범위 확인 필요.",
      },
    ],
    candidates: [
      {
        id: "src-c04", name: "듀오백 D2 메쉬 의자 DK-2500", price: 259000,
        brand: "듀오백", category: "가구", source: "airsupply-db",
        purchaseCount: 41, deliveryFee: 0, deliveryDays: 4, savingsPercent: 10,
        aiNote: "가성비 1위 — 사내 41회 구매. 기본 기능 충실.",
      },
      {
        id: "src-c05", name: "이케아 MARKUS 사무용 의자", price: 199000,
        brand: "이케아", category: "가구", source: "api-external", platform: "이케아코리아",
        scrapingStatus: "idle" as const, scrapingProgress: 0,
        aiNote: "최저가 옵션 — 기업 구매 시 배송비 별도. 조립 필요.",
      },
      {
        id: "src-c06", name: "스틸케이스 Leap V2 풀옵션", price: 1590000,
        brand: "스틸케이스", category: "가구", source: "airsupply-supplier",
        purchaseCount: 1, deliveryFee: 0, deliveryDays: 10,
        aiNote: "프리미엄 대안 — 허먼밀러와 비교 대상. 납품 10일 소요.",
      },
      {
        id: "src-c07", name: "코아스 CKF1060 메쉬 의자", price: 169000,
        brand: "코아스", category: "가구", source: "airsupply-db",
        purchaseCount: 15, deliveryFee: 5000, deliveryDays: 3,
        aiNote: "대량 구매 최적 — 10개 이상 시 개당 15만원. 사내 15회 구매.",
      },
    ],
  },
];

/* ─── 재검색 키워드 감지 ─── */

interface ResearchCondition {
  keywords: string[];
  label: string;
  modifier: (products: SourcedProduct[]) => SourcedProduct[];
  response: string;
}

const researchConditions: ResearchCondition[] = [
  {
    keywords: ["저렴", "싼", "가격", "비용", "절감", "예산"],
    label: "가격 우선",
    modifier: (prods) => {
      const sorted = [...prods].sort((a, b) => a.price - b.price);
      return sorted.map((p, i) => ({
        ...p,
        isRecommended: i === 0,
        aiNote: i === 0
          ? `최저가 옵션 — ${p.price.toLocaleString()}원. ${p.aiNote ?? ""}`
          : p.aiNote,
      }));
    },
    response: "가격 우선으로 재정렬했습니다. 최저가 기준으로 다시 추천해드릴게요.",
  },
  {
    keywords: ["빠른", "급한", "빨리", "배송", "당일", "내일"],
    label: "배송 우선",
    modifier: (prods) => {
      const sorted = [...prods].sort((a, b) => (a.deliveryDays ?? 99) - (b.deliveryDays ?? 99));
      return sorted.map((p, i) => ({
        ...p,
        isRecommended: i === 0,
        aiNote: i === 0
          ? `최단 배송 — ${p.deliveryDays ?? "확인 필요"}일 내 도착. ${p.aiNote ?? ""}`
          : p.aiNote,
      }));
    },
    response: "배송 속도 우선으로 재정렬했습니다. 가장 빠른 배송 옵션부터 보여드릴게요.",
  },
  {
    keywords: ["인기", "많이", "추천", "좋은", "베스트", "인기있는"],
    label: "인기도 우선",
    modifier: (prods) => {
      const sorted = [...prods].sort((a, b) => (b.purchaseCount ?? 0) - (a.purchaseCount ?? 0));
      return sorted.map((p, i) => ({
        ...p,
        isRecommended: i === 0,
        aiNote: i === 0
          ? `구매 인기 1위 — 최근 ${p.purchaseCount ?? 0}회 구매. ${p.aiNote ?? ""}`
          : p.aiNote,
      }));
    },
    response: "구매 인기도 기준으로 재정렬했습니다. 동종업계에서 가장 많이 선택한 순서입니다.",
  },
  {
    keywords: ["다른", "대안", "그외", "더 보여줘", "추가"],
    label: "추가 옵션",
    modifier: (prods) => prods, // 동일 상품 유지, 응답만 다름
    response: "현재 조건에서 추가 검색했습니다. 더 넓은 범위의 상품을 포함합니다.",
  },
];

/* ─── 기존 키워드 매칭 (레거시 호환) ─── */

const keywordMap: Record<string, string[]> = {
  "a4": ["prod-001"], "용지": ["prod-001"], "토너": ["prod-002"],
  "프린터": ["prod-011", "prod-003"], "복합기": ["prod-003"],
  "데스크": ["prod-010"], "포스트잇": ["prod-007"],
  "태블릿": ["prod-008"], "정수기": ["prod-009"],
};

function findProductIds(text: string): string[] | null {
  const lower = text.toLowerCase();
  for (const [kw, ids] of Object.entries(keywordMap)) {
    if (lower.includes(kw)) return ids;
  }
  return null;
}

/* ─── 검색 단계 타입 ─── */

interface DbSearchStep {
  db: string;
  icon: React.ReactNode;
  color: string;
  status: "waiting" | "searching" | "done";
  resultCount?: number;
}

/* ─── 3-DB 검색 시나리오 매칭 ─── */

function findScenario(text: string): SearchScenario | null {
  const lower = text.toLowerCase();
  for (const sc of searchScenarios) {
    if (sc.keywords.some((kw) => lower.includes(kw))) return sc;
  }
  return null;
}

function findResearchCondition(text: string): ResearchCondition | null {
  const lower = text.toLowerCase();
  for (const rc of researchConditions) {
    if (rc.keywords.some((kw) => lower.includes(kw))) return rc;
  }
  return null;
}

/* ─── Fallback responses ─── */

const dummyResponses: { content: string; agent?: string }[] = [
  { content: "확인했습니다. 어떤 상품을 찾고 계신가요? 카테고리나 구체적인 품명을 알려주시면 바로 검색해드리겠습니다.", agent: "주문" },
  { content: "현재 등록된 배송지는 **본사 3층 (서울 강남구 테헤란로 152)**입니다.\n\n다른 주소로 변경하시겠어요?", agent: "배송" },
  { content: "이번 달 예산 잔여액을 확인해볼게요.\n\n4월 부서 예산: 10,000,000원\n사용액: 5,089,000원\n**잔여: 4,911,000원 (49.1%)**\n\n여유가 있습니다.", agent: "주문" },
];

const AUTO_APPROVE_LIMIT = 300000;

const PAYMENT_LABELS: Record<string, string> = {
  "pay-001": "하나 법인카드 (****-1234)",
  "pay-002": "신한 법인카드 (****-5678)",
  "pay-003": "네이버 후불결제",
};

/* ═══════════════════════════════════════
   메인 컴포넌트
   ═══════════════════════════════════════ */

interface ChatContainerProps {
  initialChatId?: string | null;
  initialQuery?: string | null;
}

export default function ChatContainer({ initialChatId, initialQuery }: ChatContainerProps) {
  const selectedChat = initialChatId
    ? chats.find((c) => c.id === initialChatId)
    : chats.find((c) => c.id === "chat-002");
  const initialChat = selectedChat ?? chats[0];

  const [messages, setMessages] = useState<ChatMessage[]>(initialChat.messages);
  const [isTyping, setIsTyping] = useState(false);
  const [cart, setCart] = useState<CartItem[]>([]);

  // 3-DB 검색 상태
  const [searchPhase, setSearchPhase] = useState<"idle" | "analyzing" | "searching" | "results">("idle");
  const [intentText, setIntentText] = useState<string | null>(null);
  const [dbSteps, setDbSteps] = useState<DbSearchStep[]>([]);
  const [sourcedProducts, setSourcedProducts] = useState<SourcedProduct[]>([]);
  const [lastScenario, setLastScenario] = useState<SearchScenario | null>(null);
  const [scrapingProduct, setScrapingProduct] = useState<SourcedProduct | null>(null);
  const [candidateProducts, setCandidateProducts] = useState<SourcedProduct[]>([]);

  // 컨텍스트 사이드바
  const [contextSidebarOpen, setContextSidebarOpen] = useState(true);
  const [contextSidebarWidth, setContextSidebarWidth] = useState(280);
  const [searchRecords, setSearchRecords] = useState<SearchRecord[]>([]);

  // Purchase flow state (기존)
  const [flowActive, setFlowActive] = useState(false);
  const [timelinePhase, setTimelinePhase] = useState<TimelinePhase>("products");
  const [approvalStep, setApprovalStep] = useState<ApprovalStep>("요청");
  const [isAutoApproved, setIsAutoApproved] = useState(false);
  const [approvalDate, setApprovalDate] = useState<string | undefined>();
  const [paymentMethod, setPaymentMethod] = useState<string | undefined>();
  const [paymentDate, setPaymentDate] = useState<string | undefined>();
  const [shippingStep, setShippingStep] = useState<ShippingStep>("접수");
  const [frozenCart, setFrozenCart] = useState<CartItem[]>([]);
  const [frozenTotal, setFrozenTotal] = useState(0);

  const bottomRef = useRef<HTMLDivElement>(null);
  const responseIdx = useRef(0);
  const { openPanel } = useRightPanel();

  const totalPrice = cart.reduce((s, i) => s + i.product.price * i.quantity, 0);

  /* ── Helpers ── */

  const scrollToBottom = useCallback(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, []);

  useEffect(() => { scrollToBottom(); }, [messages, isTyping, searchPhase, dbSteps, scrapingProduct, scrollToBottom]);

  const addMsg = useCallback((msg: Omit<ChatMessage, "id" | "timestamp">) => {
    setMessages((prev) => [
      ...prev,
      { ...msg, id: `msg-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`, timestamp: new Date().toISOString() },
    ]);
  }, []);

  const addSys = useCallback((text: string) => addMsg({ role: "system", content: text }), [addMsg]);
  const addAI = useCallback((text: string, agent?: string) => addMsg({ role: "assistant", content: text, agent }), [addMsg]);

  /* ── Cart ── */

  const addToCart = useCallback((product: Product) => {
    setCart((prev) => {
      const ex = prev.find((i) => i.product.id === product.id);
      if (ex) return prev.map((i) => i.product.id === product.id ? { ...i, quantity: i.quantity + 1 } : i);
      return [...prev, { product, quantity: 1 }];
    });
  }, []);

  const updateQty = useCallback((id: string, q: number) => {
    setCart((prev) => prev.map((i) => i.product.id === id ? { ...i, quantity: q } : i));
  }, []);

  const removeItem = useCallback((id: string) => {
    setCart((prev) => prev.filter((i) => i.product.id !== id));
  }, []);

  /* ═══════════════════════════════════════
     3-DB 검색 플로우
     ═══════════════════════════════════════ */

  const startDbSearch = useCallback((scenario: SearchScenario) => {
    setLastScenario(scenario);
    setSearchPhase("searching");

    const initial: DbSearchStep[] = [
      { db: "에어서플라이 상품 DB", icon: <Database size={12} strokeWidth={2} />, color: "#6366f1", status: "waiting" },
      { db: "입점 공급사 DB", icon: <Building2 size={12} strokeWidth={2} />, color: "#059669", status: "waiting" },
      { db: "외부 마켓 API", icon: <Globe size={12} strokeWidth={2} />, color: "#ea580c", status: "waiting" },
    ];
    setDbSteps(initial);

    setTimeout(() => {
      setDbSteps((prev) => prev.map((s, i) => i === 0 ? { ...s, status: "searching" } : s));
    }, 300);

    setTimeout(() => {
      const db1Count = scenario.products.filter((p) => p.source === "airsupply-db").length;
      setDbSteps((prev) => prev.map((s, i) =>
        i === 0 ? { ...s, status: "done", resultCount: db1Count } : i === 1 ? { ...s, status: "searching" } : s
      ));
    }, 1400);

    setTimeout(() => {
      const db2Count = scenario.products.filter((p) => p.source === "airsupply-supplier").length;
      setDbSteps((prev) => prev.map((s, i) =>
        i === 1 ? { ...s, status: "done", resultCount: db2Count } : i === 2 ? { ...s, status: "searching" } : s
      ));
    }, 2400);

    setTimeout(() => {
      const db3Count = scenario.products.filter((p) => p.source === "api-external").length;
      setDbSteps((prev) => prev.map((s, i) =>
        i === 2 ? { ...s, status: "done", resultCount: db3Count } : s
      ));

      // API 상품 백그라운드 프리스크래핑 시작
      const apiProduct = scenario.products.find((p) => p.source === "api-external");
      if (apiProduct) {
        setScrapingProduct({
          ...apiProduct,
          scrapingStatus: "scraping" as ScrapingStatus,
          scrapingProgress: 0,
        });
        runBackgroundScrape();
      }

      setTimeout(() => {
        setSourcedProducts(scenario.products);
        setCandidateProducts(scenario.candidates ?? []);
        setSearchPhase("results");

        // 검색 기록 추가
        const allFound = [...scenario.products, ...(scenario.candidates ?? [])];
        const newRecord: SearchRecord = {
          id: `sr-${Date.now()}`,
          query: scenario.keywords[0],
          timestamp: new Date().toLocaleTimeString("ko-KR", { hour: "2-digit", minute: "2-digit" }),
          resultCount: allFound.length,
          sources: [
            { name: "에어서플라이", count: allFound.filter((p) => p.source === "airsupply-db").length, color: "#6366f1" },
            { name: "입점공급사", count: allFound.filter((p) => p.source === "airsupply-supplier").length, color: "#059669" },
            { name: "외부마켓", count: allFound.filter((p) => p.source === "api-external").length, color: "#ea580c" },
          ].filter((s) => s.count > 0),
          products: allFound.map((p) => ({ name: p.name, price: p.price, source: p.source })),
        };
        setSearchRecords((prev) => [newRecord, ...prev]);

        addAI("3개 데이터소스에서 조건에 맞는 상품을 찾았습니다. 가격·배송·구매이력을 비교해서 추천 순으로 정렬했어요.\n\n조건을 추가하시면 재검색도 가능합니다. (예: \"더 저렴한 걸로\", \"배송 빠른 걸로\")", "주문");
      }, 400);
    }, 3400);
  }, [addAI]);

  /* ── 백그라운드 프리스크래핑 ── */

  const runBackgroundScrape = useCallback(() => {
    const timings = [
      { at: 2000, progress: 25, stepIdx: 0 },
      { at: 5000, progress: 50, stepIdx: 1 },
      { at: 8000, progress: 75, stepIdx: 2 },
      { at: 12000, progress: 100, stepIdx: 3 },
    ];

    timings.forEach(({ at, progress, stepIdx }) => {
      setTimeout(() => {
        setScrapingProduct((prev) => {
          if (!prev) return prev;
          const newSteps = (prev.scrapingSteps ?? []).map((s, i) => ({ ...s, done: i <= stepIdx }));
          return {
            ...prev,
            scrapingProgress: progress,
            scrapingSteps: newSteps,
            scrapingStatus: (progress >= 100 ? "done" : "scraping") as ScrapingStatus,
            ...(progress >= 100 ? {
              scrapedOptions: ["아이언", "블루", "골드"],
              scrapedDeliveryFee: 0,
              scrapedDeliveryDays: 3,
              scrapedSpecs: { "흡입력": "230AW", "배터리": "60분", "무게": "2.74kg" },
            } : {}),
          };
        });
      }, at);
    });
  }, []);

  /* ── 재검색 ── */

  const handleResearch = useCallback((condition: ResearchCondition) => {
    if (!lastScenario) return;
    setSearchPhase("idle");
    setIsTyping(true);

    setTimeout(() => {
      setIsTyping(false);
      const reordered = condition.modifier(lastScenario.products);
      setSourcedProducts(reordered);
      setSearchPhase("results");
      addAI(condition.response + `\n\n**적용 조건:** ${condition.label}`, "주문");
    }, 1200);
  }, [lastScenario, addAI]);

  /* ── 소싱 상품 선택/장바구니 ── */

  const handleSourcedSelect = useCallback((product: SourcedProduct) => {
    if (product.source === "api-external") {
      const isScraping = scrapingProduct?.scrapingStatus === "scraping";
      const isDone = scrapingProduct?.scrapingStatus === "done" || product.scrapingStatus === "done";

      if (isDone) {
        addAI(`**${product.name}** — ${product.price.toLocaleString()}원\n\n상세 정보 수집이 완료되어 있습니다. 옵션: ${scrapingProduct?.scrapedOptions?.join(", ") ?? "확인 완료"}\n배송: 무료, 3일 내 도착\n\n장바구니에 담아드릴까요?`, "주문");
      } else if (isScraping) {
        addAI(`**${product.name}**을 선택하셨습니다.\n\n현재 상세 정보를 수집 중이에요 (${scrapingProduct?.scrapingProgress ?? 0}% 완료). 수집이 끝나면 바로 알려드릴게요.\n\n다른 질문이 있으시면 먼저 진행하셔도 됩니다.`, "주문");
      } else {
        // 프리스크래핑 안 됐으면 지금 시작
        setScrapingProduct({
          ...product,
          scrapingStatus: "scraping" as ScrapingStatus,
          scrapingProgress: 0,
        });
        runBackgroundScrape();
        addAI(`**${product.name}** — 외부 마켓 상품이라 상세 정보를 수집할게요.\n\n잠시만 기다려주세요. 다른 질문이 있으시면 먼저 진행하셔도 됩니다.`, "주문");
      }
    } else {
      addAI(`**${product.name}** — ${product.price.toLocaleString()}원\n\n모든 정보가 확인되었습니다.\n배송비: ${product.deliveryFee === 0 ? "무료" : (product.deliveryFee?.toLocaleString() ?? "—") + "원"}\n도착: ${product.deliveryDays ?? "—"}일 내\n옵션: ${product.options?.join(", ") ?? "—"}\n\n장바구니에 담을까요?`, "주문");
    }
  }, [addAI, scrapingProduct, runBackgroundScrape]);

  const handleSourcedAddToCart = useCallback((product: SourcedProduct) => {
    // SourcedProduct → Product 변환하여 장바구니에 추가
    const asProduct: Product = {
      id: product.id,
      name: product.name,
      price: product.price,
      category: (product.category as any) ?? "생활용품",
      brand: product.brand,
      image: "",
      description: product.aiNote ?? "",
      specs: product.scrapedSpecs ?? {},
      inStock: true,
      source: product.platform ?? (product.source === "airsupply-db" ? "에어서플라이" : product.source === "airsupply-supplier" ? "입점공급사" : "외부마켓"),
    };
    addToCart(asProduct);
    addSys(`${product.name} 이(가) 장바구니에 담겼습니다.`);
  }, [addToCart, addSys]);

  /* ═══════════════════════════════════════
     기존 구매 플로우 (approval, payment, shipping)
     ═══════════════════════════════════════ */

  const advanceFlow = useCallback(() => {
    if (timelinePhase === "approval" && approvalStep === "대기") {
      setApprovalStep("승인");
      setApprovalDate("2026-04-10");
      addSys("김지현 매니저가 품의를 승인했습니다.");
      addAI("승인 완료! 결제를 진행합니다.", "주문");
      setTimeout(() => { setTimelinePhase("payment"); }, 600);
    } else if (timelinePhase === "shipping") {
      const order: ShippingStep[] = ["접수", "준비", "배송중", "배송완료"];
      const ci = order.indexOf(shippingStep);
      if (ci < order.length - 1) {
        const next = order[ci + 1];
        setShippingStep(next);
        const msgs: Record<string, string> = {
          "준비": "상품이 배송 준비 중입니다.",
          "배송중": "배송이 시작되었습니다! CJ대한통운 송장번호: CJ1234567890",
          "배송완료": "배송이 완료되었습니다! 수령 확인 후 구매확정 부탁드립니다.",
        };
        addAI(msgs[next] ?? `배송 상태: ${next}`, "배송");
        if (next === "배송완료") setTimelinePhase("complete");
      }
    }
  }, [timelinePhase, approvalStep, shippingStep, addSys, addAI]);

  const startApproval = useCallback(() => {
    setFrozenCart([...cart]); setFrozenTotal(totalPrice); setFlowActive(true);
    const isAuto = totalPrice <= AUTO_APPROVE_LIMIT;
    setIsAutoApproved(isAuto);
    if (isAuto) {
      setApprovalStep("자동승인"); setApprovalDate("2026-04-10"); setTimelinePhase("payment");
      addAI(`총 ${totalPrice.toLocaleString()}원은 소액 자동승인 대상입니다.`, "주문");
    } else {
      setApprovalStep("요청"); setTimelinePhase("approval");
      addAI(`품의 요청을 올렸습니다. 총 ${totalPrice.toLocaleString()}원 — **김지현 매니저**님의 승인을 기다리고 있습니다.`, "주문");
      setTimeout(() => setApprovalStep("대기"), 500);
    }
  }, [cart, totalPrice, addAI]);

  const startDirectPurchase = useCallback(() => {
    setFrozenCart([...cart]); setFrozenTotal(totalPrice); setFlowActive(true);
    setIsAutoApproved(true); setApprovalStep("자동승인"); setApprovalDate("2026-04-10"); setTimelinePhase("payment");
    addAI("직접 결제 권한이 확인되었습니다. 결제수단을 선택해주세요.", "주문");
  }, [cart, totalPrice, addAI]);

  const confirmPayment = useCallback((methodId: string) => {
    const label = PAYMENT_LABELS[methodId] ?? methodId;
    setPaymentMethod(label); setPaymentDate("2026-04-10"); setTimelinePhase("shipping"); setShippingStep("접수"); setCart([]);
    addSys(`결제 완료 — ${label}`);
    addAI(`결제가 완료되었습니다!\n\n결제수단: **${label}**\n결제 금액: **${frozenTotal.toLocaleString()}원**`, "주문");
  }, [addSys, addAI, frozenTotal]);

  const confirmPurchase = useCallback(() => { setShippingStep("구매확정"); addSys("구매가 확정되었습니다."); addAI("구매 확정 처리되었습니다!", "주문"); }, [addSys, addAI]);
  const requestReturn = useCallback(() => { setShippingStep("반품요청"); addSys("반품 요청이 접수되었습니다."); addAI("반품 요청이 접수되었습니다.", "주문"); }, [addSys, addAI]);

  /* ── Right panel sync ── */

  useEffect(() => {
    if (!flowActive) return;
    if (timelinePhase === "payment" && !paymentMethod) {
      openPanel(<PaymentSelector totalPrice={frozenTotal} onConfirm={confirmPayment} />);
      return;
    }
    openPanel(
      <OrderTimeline activePhase={timelinePhase} cart={frozenCart} totalPrice={frozenTotal}
        approvalStep={approvalStep} approver="김지현 매니저" approvalDate={approvalDate}
        isAutoApproved={isAutoApproved} paymentMethod={paymentMethod} paymentDate={paymentDate}
        shippingStep={shippingStep} trackingNumber="CJ1234567890" estimatedDate="2026-04-14"
        onAdvance={advanceFlow} onConfirmPurchase={confirmPurchase} onRequestReturn={requestReturn} />
    );
  }, [flowActive, timelinePhase, frozenCart, frozenTotal, approvalStep, approvalDate, isAutoApproved, paymentMethod, paymentDate, shippingStep, advanceFlow, confirmPurchase, requestReturn, confirmPayment, openPanel]);

  const openCart = useCallback(() => {
    openPanel(
      <CartPanel items={cart} onUpdateQuantity={updateQty} onRemove={removeItem} onRequestApproval={startApproval} onDirectPurchase={startDirectPurchase} />
    );
  }, [cart, openPanel, updateQty, removeItem, startApproval, startDirectPurchase]);

  const viewProduct = useCallback((product: Product) => {
    openPanel(<ProductDetailPanel product={product} onAddToCart={() => { addToCart(product); addSys(`${product.name} 이(가) 장바구니에 담겼습니다.`); }} />);
  }, [openPanel, addToCart, addSys]);

  const handleAddToCart = useCallback((product: Product) => { addToCart(product); addSys(`${product.name} 이(가) 장바구니에 담겼습니다.`); }, [addToCart, addSys]);

  /* ═══════════════════════════════════════
     메시지 전송 핸들러
     ═══════════════════════════════════════ */

  const handleSend = useCallback((text: string) => {
    addMsg({ role: "user", content: text });

    // 1) 재검색 조건 감지 (이미 검색 결과가 있는 상태에서)
    if (searchPhase === "results" && lastScenario) {
      const condition = findResearchCondition(text);
      if (condition) {
        handleResearch(condition);
        return;
      }
    }

    // 2) 3-DB 검색 시나리오 매칭
    const scenario = findScenario(text);
    if (scenario) {
      setIsTyping(true);
      setSearchPhase("idle");
      setSourcedProducts([]);
      setCandidateProducts([]);
      setScrapingProduct(null);

      setTimeout(() => {
        setIsTyping(false);
        setSearchPhase("analyzing");
        setIntentText(null);

        setTimeout(() => {
          setIntentText(scenario.intent);
          setTimeout(() => { startDbSearch(scenario); }, 600);
        }, 1000);
      }, 600);
      return;
    }

    // 3) 기존 키워드 매칭 (레거시)
    setIsTyping(true);
    setTimeout(() => {
      const matchedIds = findProductIds(text);
      if (matchedIds) {
        const count = matchedIds.filter((id) => products.find((p) => p.id === id)).length;
        addMsg({ role: "assistant", content: `검색 결과 ${count}개 상품을 찾았습니다. 상품을 확인해보시고, 필요하시면 장바구니에 담아주세요.`, agent: "주문", productIds: matchedIds });
      } else {
        const resp = dummyResponses[responseIdx.current % dummyResponses.length];
        responseIdx.current++;
        addMsg({ role: "assistant", content: resp.content, agent: resp.agent });
      }
      setIsTyping(false);
    }, 800 + Math.random() * 1000);
  }, [addMsg, searchPhase, lastScenario, handleResearch, startDbSearch]);

  /* ── 시작 화면에서 넘어온 초기 쿼리 자동 전송 (마운트 1회) ── */
  const initialQuerySent = useRef(false);
  useEffect(() => {
    if (initialQuerySent.current) return;
    const q = initialQuery?.trim();
    if (!q) return;
    initialQuerySent.current = true;
    handleSend(q);
  }, [initialQuery, handleSend]);

  /* ═══════════════════════════════════════
     렌더
     ═══════════════════════════════════════ */

  /* ── 컨텍스트 사이드바 Phase 매핑 ── */
  const sidebarPhase = flowActive
    ? (timelinePhase === "products" ? "cart" as const
      : timelinePhase === "approval" ? "approval" as const
      : timelinePhase === "payment" ? "payment" as const
      : timelinePhase === "shipping" ? "shipping" as const
      : timelinePhase === "complete" ? "complete" as const
      : "idle" as const)
    : (searchPhase === "idle" ? (cart.length > 0 ? "cart" as const : "idle" as const) : searchPhase);

  const contextInfo: ContextInfo = {
    budget: { monthly: 10000000, used: 5089000, department: "개발팀" },
    shippingAddress: "서울 강남구 테헤란로 152, 7층",
    paymentMethod: "신한 법인카드 (****-1234)",
    agentMode: "오픈 모드",
    agentModeColor: "#22c55e",
    recentOrders: 8,
  };

  return (
    <div className="flex h-full">
      <style dangerouslySetInnerHTML={{ __html: animStyles }} />

      {/* ── 메인 채팅 영역 ── */}
      <div className="flex-1 flex flex-col h-full min-w-0">
        {/* Cart floating badge */}
        {cart.length > 0 && !flowActive && (
          <button
            onClick={openCart}
            className="fixed bottom-24 z-20 flex items-center gap-2 px-4 py-2.5 bg-black text-white text-[13px] font-medium cursor-pointer transition-opacity hover:opacity-80"
            style={{ borderRadius: "9999px", boxShadow: "rgba(0,0,0,0.2) 0px 4px 12px", right: contextSidebarOpen ? `${contextSidebarWidth + 40}px` : "24px" }}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="9" cy="21" r="1" /><circle cx="20" cy="21" r="1" />
              <path d="M1 1h4l2.68 13.39a2 2 0 002 1.61h9.72a2 2 0 002-1.61L23 6H6" />
            </svg>
            장바구니 ({cart.reduce((s, i) => s + i.quantity, 0)})
          </button>
        )}

        {/* 사이드바 토글 버튼 */}
        <div className="flex items-center justify-end px-3 pt-2 shrink-0">
          <button
            onClick={() => setContextSidebarOpen(!contextSidebarOpen)}
            className="flex items-center gap-1.5 px-2.5 py-1.5 text-[11px] font-medium cursor-pointer transition-all hover:bg-[#f0f0f0]"
            style={{
              borderRadius: "8px",
              color: contextSidebarOpen ? "#6366f1" : "#999",
              backgroundColor: contextSidebarOpen ? "rgba(99,102,241,0.06)" : "transparent",
            }}
          >
            <Eye size={13} strokeWidth={1.5} />
            컨텍스트
          </button>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto px-4 pt-2">
        <div className="max-w-[720px] mx-auto flex flex-col gap-1">
          {messages.map((msg) => (
            <div key={msg.id}>
              <ChatBubble message={msg} />
              {msg.productIds && msg.productIds.length > 0 && (
                <div className="flex justify-start mb-1 mt-1">
                  <div className="max-w-[520px]">
                    <ProductRecommendCard productIds={msg.productIds} onViewProduct={viewProduct} onAddToCart={handleAddToCart} />
                  </div>
                </div>
              )}
            </div>
          ))}

          {/* ── 의도 분석 카드 ── */}
          {searchPhase === "analyzing" && (
            <div className="flex justify-start mb-1" style={{ animation: "fade-in 0.3s ease-out" }}>
              <div
                className="max-w-[520px] px-4 py-3"
                style={{
                  borderRadius: "16px 16px 16px 4px",
                  background: "linear-gradient(135deg, rgba(99,102,241,0.04) 0%, rgba(139,92,246,0.02) 100%)",
                  boxShadow: "rgba(99,102,241,0.1) 0px 0px 0px 1px",
                }}
              >
                <div className="flex items-center gap-2 mb-2">
                  <Sparkles size={13} strokeWidth={1.5} color="#6366f1" className="animate-pulse" />
                  <span className="text-[12px] font-semibold text-[#6366f1]">구매 의도 분석 중</span>
                </div>
                {intentText ? (
                  <div style={{ animation: "fade-in 0.4s ease-out" }}>
                    <p className="text-[13px] text-[#333] leading-[1.6]">{intentText}</p>
                    <div className="flex items-center gap-1 mt-2">
                      <Check size={11} strokeWidth={2} color="#22c55e" />
                      <span className="text-[10px] text-[#22c55e] font-medium">분석 완료 — 검색을 시작합니다</span>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <div
                      className="h-2 flex-1 rounded"
                      style={{
                        background: "linear-gradient(90deg, rgba(99,102,241,0.1) 0%, rgba(99,102,241,0.03) 50%, rgba(99,102,241,0.1) 100%)",
                        backgroundSize: "200% 100%", animation: "shimmer-bar 1.5s linear infinite",
                      }}
                    />
                    <span className="text-[11px] text-[#999]">분석 중...</span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ── 3-DB 검색 진행 ── */}
          {(searchPhase === "searching" || (searchPhase === "results" && dbSteps.length > 0)) && (
            <div className="flex justify-start mb-1" style={{ animation: "fade-in 0.3s ease-out" }}>
              <div
                className="max-w-[520px] px-4 py-3"
                style={{ borderRadius: "16px 16px 16px 4px", backgroundColor: "#fff", boxShadow: "rgba(0,0,0,0.06) 0px 0px 0px 1px, rgba(0,0,0,0.04) 0px 1px 2px" }}
              >
                <div className="flex items-center gap-2 mb-3">
                  <Search size={13} strokeWidth={1.5} color="#333" />
                  <span className="text-[12px] font-semibold text-[#333]">데이터소스 검색</span>
                </div>
                <div className="flex flex-col gap-2">
                  {dbSteps.map((step, i) => (
                    <div key={step.db} className="flex items-center gap-2.5" style={{ animation: `fade-in 0.3s ease-out ${i * 0.15}s both` }}>
                      <div
                        className="w-6 h-6 shrink-0 flex items-center justify-center rounded-md"
                        style={{ backgroundColor: step.status === "done" ? `${step.color}15` : step.status === "searching" ? `${step.color}10` : "rgba(0,0,0,0.03)" }}
                      >
                        {step.status === "done" ? <Check size={11} strokeWidth={2.5} color={step.color} />
                          : step.status === "searching" ? <Loader2 size={11} strokeWidth={2} color={step.color} className="animate-spin" />
                          : <Clock size={11} strokeWidth={1.5} color="#ccc" />}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-1.5">
                          <span style={{ color: step.color }}>{step.icon}</span>
                          <span className="text-[12px] font-medium" style={{ color: step.status === "waiting" ? "#bbb" : "#333" }}>{step.db}</span>
                        </div>
                        {step.status === "searching" && (
                          <div className="h-1 mt-1 rounded" style={{ width: "80%", background: `linear-gradient(90deg, ${step.color}20 0%, ${step.color}08 50%, ${step.color}20 100%)`, backgroundSize: "200% 100%", animation: "shimmer-bar 1.5s linear infinite" }} />
                        )}
                      </div>
                      {step.status === "done" && step.resultCount != null && (
                        <span className="text-[11px] font-medium" style={{ color: step.color }}>{step.resultCount}건</span>
                      )}
                    </div>
                  ))}
                </div>
                {dbSteps.every((s) => s.status === "done") && (
                  <div className="flex items-center gap-1.5 mt-2.5 pt-2" style={{ borderTop: "1px solid rgba(0,0,0,0.04)" }}>
                    <Zap size={11} strokeWidth={2} color="#6366f1" />
                    <span className="text-[11px] font-medium text-[#6366f1]">총 {dbSteps.reduce((s, st) => s + (st.resultCount ?? 0), 0)}개 상품 발견 — 비교 분석 완료</span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ── 추천 결과 카드 ── */}
          {searchPhase === "results" && sourcedProducts.length > 0 && (
            <div className="flex justify-start mb-1" style={{ animation: "fade-in 0.4s ease-out" }}>
              <div className="max-w-[560px]">
                <SourcedProductCard
                  products={sourcedProducts.map((p) => {
                    // API 상품의 스크래핑 상태를 실시간 반영
                    if (p.source === "api-external" && scrapingProduct && scrapingProduct.id === p.id) {
                      return { ...p, scrapingStatus: scrapingProduct.scrapingStatus, scrapingProgress: scrapingProduct.scrapingProgress, scrapingSteps: scrapingProduct.scrapingSteps, scrapedOptions: scrapingProduct.scrapedOptions, scrapedDeliveryFee: scrapingProduct.scrapedDeliveryFee, scrapedDeliveryDays: scrapingProduct.scrapedDeliveryDays };
                    }
                    return p;
                  })}
                  onSelect={handleSourcedSelect}
                  onAddToCart={handleSourcedAddToCart}
                />
              </div>
            </div>
          )}

          {/* ── 스크래핑 진행 카드 (API 상품 선택 후, 아직 수집 중일 때) ── */}
          {scrapingProduct && scrapingProduct.scrapingStatus === "scraping" && searchPhase === "results" && (
            <div className="flex justify-start mb-1" style={{ animation: "fade-in 0.3s ease-out" }}>
              <div
                className="max-w-[480px] px-4 py-3"
                style={{ borderRadius: "16px 16px 16px 4px", backgroundColor: "#fff", boxShadow: "rgba(234,88,12,0.12) 0px 0px 0px 1px" }}
              >
                <div className="flex items-center gap-2 mb-2">
                  <Loader2 size={12} strokeWidth={2} color="#ea580c" className="animate-spin" />
                  <span className="text-[11px] font-semibold text-[#ea580c]">
                    {scrapingProduct.platform ?? "외부"} 상품 정보 백그라운드 수집 중
                  </span>
                  <span className="text-[10px] text-[#bbb] ml-auto">{scrapingProduct.scrapingProgress}%</span>
                </div>
                <div className="h-1.5 bg-[#f0f0f0] overflow-hidden mb-1.5" style={{ borderRadius: "3px" }}>
                  <div className="h-full transition-all duration-500" style={{ width: `${scrapingProduct.scrapingProgress}%`, background: "linear-gradient(90deg, #ea580c, #f59e0b)", borderRadius: "3px" }} />
                </div>
                <div className="flex flex-col gap-0.5">
                  {(scrapingProduct.scrapingSteps ?? []).map((step, i) => (
                    <div key={i} className="flex items-center gap-1.5">
                      {step.done ? <Check size={9} strokeWidth={2.5} color="#22c55e" /> : <Loader2 size={9} strokeWidth={2} color="#ea580c" className="animate-spin" />}
                      <span className={`text-[10px] ${step.done ? "text-[#999]" : "text-[#ea580c] font-medium"}`}>{step.label}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* ── 스크래핑 완료 알림 ── */}
          {scrapingProduct && scrapingProduct.scrapingStatus === "done" && scrapingProduct.scrapedSpecs && searchPhase === "results" && (
            <div className="flex justify-start mb-1" style={{ animation: "fade-in 0.3s ease-out" }}>
              <div
                className="max-w-[480px] px-4 py-3"
                style={{ borderRadius: "16px 16px 16px 4px", backgroundColor: "#fff", boxShadow: "rgba(34,197,94,0.12) 0px 0px 0px 1px" }}
              >
                <div className="flex items-center gap-2 mb-2">
                  <Check size={12} strokeWidth={2} color="#22c55e" />
                  <span className="text-[11px] font-semibold text-[#22c55e]">상세 정보 수집 완료</span>
                  <span className="text-[10px] text-[#bbb]">— {scrapingProduct.name}</span>
                </div>
                <div className="grid grid-cols-3 gap-2">
                  {Object.entries(scrapingProduct.scrapedSpecs).map(([key, val]) => (
                    <div key={key}>
                      <p className="text-[9px] text-[#bbb]">{key}</p>
                      <p className="text-[11px] text-[#333] font-medium">{val}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {isTyping && (
            <div className="flex justify-start mb-1">
              <div className="px-3.5 py-2.5 flex items-center gap-1" style={{ borderRadius: "16px 16px 16px 4px", backgroundColor: "#fff", boxShadow: "rgba(0,0,0,0.06) 0px 0px 0px 1px, rgba(0,0,0,0.04) 0px 1px 2px" }}>
                <span className="w-2 h-2 rounded-full bg-[#777169] animate-pulse" />
                <span className="w-2 h-2 rounded-full bg-[#777169] animate-pulse [animation-delay:150ms]" />
                <span className="w-2 h-2 rounded-full bg-[#777169] animate-pulse [animation-delay:300ms]" />
              </div>
            </div>
          )}

          <div ref={bottomRef} />
        </div>
      </div>

        {/* Input */}
        <div className="max-w-[720px] mx-auto w-full">
          <ChatInput
            onSend={handleSend}
            disabled={isTyping || searchPhase === "analyzing" || searchPhase === "searching"}
            placeholder={
              searchPhase === "results"
                ? "조건 추가 (예: 더 저렴한 걸로, 배송 빠른 걸로) 또는 새 검색..."
                : undefined
            }
          />
        </div>
      </div>

      {/* ── 리사이즈 핸들 + 컨텍스트 사이드바 ── */}
      {contextSidebarOpen && (
        <>
          <ResizableHandle
            panelWidth={contextSidebarWidth}
            onResize={setContextSidebarWidth}
            minWidth={220}
            maxWidth={420}
            side="left"
          />
          <div className="shrink-0 h-full" style={{ width: `${contextSidebarWidth}px` }}>
          <ChatContextSidebar
            currentPhase={sidebarPhase}
            searchRecords={searchRecords}
            extractedProducts={sourcedProducts}
            candidateProducts={candidateProducts}
            cart={cart}
            context={contextInfo}
            onProductClick={handleSourcedSelect}
          />
          </div>
        </>
      )}
    </div>
  );
}
