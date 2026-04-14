"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import {
  Sparkles, Database, Building2, Globe, Zap, Search, Clock,
  Check, Loader2, Package, ShoppingCart, BarChart3, ArrowUpRight,
} from "lucide-react";
import type { ChatMessage, Product, WorkItem, WorkItemSnapshot, WorkItemStatus } from "@/lib/types";
import { products } from "@/data/products";
import { chats } from "@/data/chats";
import { users } from "@/data/users";
import { useCart } from "@/lib/cart-context";
import { useSettingsStore } from "@/lib/settings-store";
import { useRightPanel } from "@/lib/right-panel-context";
import { useSettings } from "@/lib/settings-context";
import { useRouter } from "next/navigation";
import ChatBubble from "./ChatBubble";
import ChatInput from "./ChatInput";
import ProductRecommendCard from "./ProductRecommendCard";
import ExpenseSummaryCard from "./ExpenseSummaryCard";
import SnackRecommendationCard from "./SnackRecommendationCard";
import SourcedProductCard, {
  type SourcedProduct,
  type SourceType,
  type ScrapingStatus,
} from "./SourcedProductCard";
import ProductDetailPanel from "./ProductDetailPanel";
import CartPanel, { type CartItem } from "@/components/commerce/CartPanel";
import ApprovalReviewPanel from "@/components/commerce/ApprovalReviewPanel";
import PaymentSelector from "@/components/commerce/PaymentSelector";
import OrderTimeline, { type TimelinePhase } from "@/components/commerce/OrderTimeline";
import type { ApprovalStep } from "@/components/commerce/ApprovalTracker";
import type { ShippingStep } from "@/components/commerce/ShippingTracker";
import ChatContextSidebar, { type SearchRecord, type ContextInfo } from "./ChatContextSidebar";

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
  // 용지
  "a4": ["prod-001"], "용지": ["prod-001"], "복사용지": ["prod-001"], "복사지": ["prod-001"],
  // 잉크/토너
  "토너": ["prod-002"], "잉크": ["prod-002"], "카트리지": ["prod-002"],
  // 사무기기
  "프린터": ["prod-011", "prod-003"], "복합기": ["prod-003"], "레이저": ["prod-011"],
  // 가구
  "의자": ["prod-004"], "사무용의자": ["prod-004"], "체어": ["prod-004"],
  "데스크": ["prod-010"], "책상": ["prod-010"], "높이조절": ["prod-010"],
  // 전자기기
  "모니터": ["prod-005"], "디스플레이": ["prod-005"],
  "태블릿": ["prod-008"], "갤럭시탭": ["prod-008"], "아이패드": ["prod-008"],
  // 사무용품
  "포스트잇": ["prod-007"], "파인라이너": ["prod-006"], "필기구": ["prod-006"],
  "펜": ["prod-006"], "볼펜": ["prod-006"], "형광펜": ["prod-006"],
  "스테들러": ["prod-006"],
  // 생활용품
  "정수기": ["prod-009"], "티포트": ["prod-012"],
};

function findProductIds(text: string): string[] | null {
  const lower = text.toLowerCase();
  for (const [kw, ids] of Object.entries(keywordMap)) {
    if (lower.includes(kw)) return ids;
  }
  return null;
}

/* ─── Fuzzy product search — keywordMap에 없는 키워드도 products에서 텍스트 매칭 ─── */

/** 카테고리 유의어 — 사용자가 흔히 쓸 만한 키워드 → 카테고리 이름으로 매핑 */
const categoryAlias: Record<string, string[]> = {
  "노트북": ["전자기기"], "컴퓨터": ["전자기기"], "PC": ["전자기기"],
  "마우스": ["전자기기"], "키보드": ["전자기기"], "모니터": ["전자기기"],
  "스피커": ["전자기기"], "헤드셋": ["전자기기"], "충전기": ["전자기기"],
  "사무": ["사무용품", "사무기기"], "문구": ["사무용품"],
  "펜": ["사무용품"], "볼펜": ["사무용품"], "형광펜": ["사무용품"],
  "의자": ["가구"], "테이블": ["가구"], "선반": ["가구"], "책상": ["가구"],
  "음료": ["간식"], "과자": ["간식"], "커피": ["간식"], "차": ["간식", "생활용품"],
  "생수": ["간식"], "견과": ["간식"],
  "세제": ["생활용품"], "휴지": ["생활용품"], "물티슈": ["생활용품"],
  "잉크": ["잉크/토너"], "카트리지": ["잉크/토너"],
  "복사": ["용지"], "종이": ["용지"], "인쇄": ["용지", "사무기기"],
};

function searchProductsFuzzy(text: string): { ids: string[]; method: "text" | "category" } | null {
  const lower = text.toLowerCase();
  const tokens = lower.split(/\s+/).filter((t) => t.length >= 1);

  // 1단계: 이름·브랜드·카테고리·설명에서 직접 텍스트 매칭
  const scored = products.map((p) => {
    const haystack = [p.name, p.category, p.brand, p.description ?? ""].join(" ").toLowerCase();
    // 전체 쿼리 포함
    if (haystack.includes(lower) && lower.length >= 2) return { id: p.id, score: 10 };
    // 토큰별 매칭
    let score = 0;
    for (const t of tokens) {
      if (t.length >= 2 && haystack.includes(t)) score += 3;
    }
    return { id: p.id, score };
  });

  const textMatches = scored
    .filter((s) => s.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, 4)
    .map((s) => s.id);

  if (textMatches.length > 0) return { ids: textMatches, method: "text" };

  // 2단계: 카테고리 유의어로 확장 — "노트북" → ["전자기기"] → 해당 카테고리 상품
  const matchedCategories = new Set<string>();
  for (const t of tokens) {
    const cats = categoryAlias[t];
    if (cats) cats.forEach((c) => matchedCategories.add(c));
  }
  // 전체 쿼리로도 시도
  const fullCats = categoryAlias[lower];
  if (fullCats) fullCats.forEach((c) => matchedCategories.add(c));

  if (matchedCategories.size > 0) {
    const catIds = products
      .filter((p) => matchedCategories.has(p.category))
      .slice(0, 4)
      .map((p) => p.id);
    if (catIds.length > 0) return { ids: catIds, method: "category" };
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

/* ─── Work Item 의도 감지 — 키워드 → {title, color} 매핑 ───
   데모용 하드코딩. 나중에 에이전트 분류기로 대체. */
interface WorkItemIntent {
  title: string;
  color: string;
}

const workItemIntentMap: { keywords: string[]; title: string; color: string }[] = [
  { keywords: ["청소기", "청소"],                               title: "청소기",   color: "#6366f1" },
  { keywords: ["토너", "잉크", "카트리지"],                     title: "토너",     color: "#ea580c" },
  { keywords: ["프린터", "복합기"],                             title: "프린터",   color: "#ea580c" },
  { keywords: ["a4", "용지", "복사용지", "복사지"],             title: "A4용지",   color: "#8b5cf6" },
  { keywords: ["데스크", "책상"],                               title: "사무가구", color: "#059669" },
  { keywords: ["의자", "체어"],                                title: "사무가구", color: "#059669" },
  { keywords: ["정수기"],                                      title: "정수기",   color: "#3b82f6" },
  { keywords: ["포스트잇", "사무용품", "펜", "볼펜", "필기구"], title: "사무용품", color: "#f59e0b" },
  { keywords: ["모니터", "디스플레이"],                         title: "모니터",   color: "#0ea5e9" },
  { keywords: ["태블릿", "갤럭시탭", "아이패드"],               title: "태블릿",   color: "#0ea5e9" },
  { keywords: ["노트북", "랩탑", "컴퓨터"],                     title: "노트북",   color: "#0ea5e9" },
  { keywords: ["마우스", "키보드", "헤드셋"],                   title: "PC주변기기", color: "#0ea5e9" },
  { keywords: ["티포트", "커피", "음료"],                       title: "생활용품", color: "#84cc16" },
];

function detectPurchaseIntent(text: string): WorkItemIntent | null {
  const lower = text.toLowerCase();
  for (const it of workItemIntentMap) {
    if (it.keywords.some((kw) => lower.includes(kw))) {
      return { title: it.title, color: it.color };
    }
  }
  return null;
}

/* ─── 비용 분석 질문 감지 ─── */
const costAnalysisKeywords = [
  "지출", "비용", "예산 분석", "예산 얼마", "얼마 썼",
  "카테고리별", "팀별 지출", "부서별 지출",
  "비용 분석", "지출 분석", "지출 리포트", "지출 현황", "지출 요약",
  "절감", "절약",
  // 분석/인사이트 확장 — AI 추천 카드 프롬프트가 상품 검색으로 빠지지 않도록
  "사용량", "재주문", "패턴 분석", "구매 패턴", "리포트",
  "벤더 추천", "대안 벤더", "배송 지연",
];

/** 분석/인사이트 세부 응답 매칭 — 키워드 기반으로 맞춤 응답 반환 */
const analysisResponses: { keywords: string[]; content: string }[] = [
  {
    keywords: ["사용량", "재주문"],
    content:
      "지난달 대비 토너 사용량이 **30% 증가**했어요.\n\n" +
      "현재 재고 소진 예상: **4월 18일**\n평균 배송 리드타임: **3영업일**\n\n" +
      "**4월 15일**경 재주문하면 재고 공백 없이 수급할 수 있어요.\n비용 인텔리전스에서 상세 사용 추이를 확인할 수 있습니다.",
  },
  {
    keywords: ["대안 벤더", "벤더 추천", "배송 지연"],
    content:
      "A4용지 벤더 B의 최근 3회 배송 지연 이력을 확인했어요.\n\n" +
      "| 벤더 | 평균 납기 | 단가 | 지연율 |\n|---|---|---|---|\n" +
      "| 벤더 A (현재) | 2일 | 12,900원 | 0% |\n| 벤더 B | 5일 | 11,500원 | **60%** |\n| 벤더 C (신규) | 3일 | 12,200원 | 5% |\n\n" +
      "**벤더 C**가 단가·납기 균형이 가장 좋습니다. SCM에서 상세 비교를 진행할 수 있어요.",
  },
  {
    keywords: ["패턴 분석", "구매 패턴", "리포트"],
    content:
      "Q1 마케팅팀 구매 패턴을 분석했어요.\n\n" +
      "- **총 지출**: 14,200,000원 (전분기 대비 -8%)\n" +
      "- **주요 카테고리**: 사무용품 49% · 전자기기 31% · 기타 20%\n" +
      "- **특이사항**: 3월 전자기기 지출 급증 (노트북 3대 일괄 구매)\n\n" +
      "비용 인텔리전스에서 상세 리포트와 내보내기가 가능합니다.",
  },
];

function detectCostAnalysisQuery(text: string): boolean {
  const lower = text.toLowerCase();
  return costAnalysisKeywords.some((kw) => lower.includes(kw));
}

function getCostAnalysisResponse(text: string): string {
  const lower = text.toLowerCase();
  for (const r of analysisResponses) {
    if (r.keywords.some((kw) => lower.includes(kw))) return r.content;
  }
  // 기본 응답
  return "4월 누적 지출이 전월 대비 12% 감소했어요.\n\n카테고리별 · 팀별 상세, 절감 제안은 비용 인텔리전스에서 확인할 수 있어요.";
}

/* ─── 간식 추천 시나리오 감지 ─── */
const snackKeywords = [
  "간식", "스낵", "다과", "간식 추천", "이번달 간식", "이번 달 간식",
  "팀 간식", "간식 구매", "간식 패키지",
];

function detectSnackQuery(text: string): boolean {
  const lower = text.toLowerCase();
  return snackKeywords.some((kw) => lower.includes(kw));
}


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

  // 글로벌 장바구니 (CartProvider)
  const globalCart = useCart();
  const cart = globalCart.items;
  const addToCart = useCallback((product: Product) => { globalCart.addItem(product); }, [globalCart]);
  const updateQty = useCallback((id: string, q: number) => { globalCart.updateQuantity(id, q); }, [globalCart]);
  const removeItem = useCallback((id: string) => { globalCart.removeItem(id); }, [globalCart]);

  // 3-DB 검색 상태
  const [searchPhase, setSearchPhase] = useState<"idle" | "analyzing" | "searching" | "results">("idle");
  const [intentText, setIntentText] = useState<string | null>(null);
  const [dbSteps, setDbSteps] = useState<DbSearchStep[]>([]);
  const [sourcedProducts, setSourcedProducts] = useState<SourcedProduct[]>([]);
  const [lastScenario, setLastScenario] = useState<SearchScenario | null>(null);
  const [scrapingProduct, setScrapingProduct] = useState<SourcedProduct | null>(null);
  const [candidateProducts, setCandidateProducts] = useState<SourcedProduct[]>([]);

  // 검색 기록 (작업 현황 패널에 송출)
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

  /* ── 기존 채팅 메시지에서 플로우 상태 복원 ──
     chat-003 등 이미 진행 중인 시나리오를 열 때, 메시지 히스토리를 파싱하여
     cart / flowActive / timelinePhase 등을 초기화합니다. */
  const didRestoreRef = useRef(false);
  useEffect(() => {
    if (didRestoreRef.current) return;
    didRestoreRef.current = true;

    const msgs = initialChat.messages;
    if (msgs.length === 0) return;

    // 패턴 감지: 메시지 내용에서 플로우 단계 추론
    const hasApprovalRequest = msgs.some((m) => m.role === "assistant" && m.content.includes("품의 요청"));
    const hasApprovalDone = msgs.some((m) =>
      (m.role === "system" && m.content.includes("승인")) ||
      (m.role === "assistant" && m.content.includes("승인 완료")),
    );
    const hasPaymentDone = msgs.some((m) => m.role === "assistant" && (m.content.includes("결제가 완료") || m.content.includes("결제를 진행")));
    const hasShipping = msgs.some((m) => m.role === "assistant" && (m.content.includes("배송 예정") || m.content.includes("배송이 완료")));
    const hasDeliveryComplete = msgs.some((m) => m.role === "assistant" && m.content.includes("배송이 완료"));
    const hasOrderConfirm = msgs.some((m) => m.role === "assistant" && m.content.includes("주문이 확정"));
    const hasReturn = msgs.some((m) => m.role === "assistant" && (m.content.includes("반품 수거") || m.content.includes("반품요청")));

    // 가격·상품·수량 파싱 — 다양한 메시지 패턴 지원
    let restoredCart: CartItem[] = [];
    let restoredTotal = 0;

    // 여러 패턴을 순회하며 매칭 시도
    const pricePatterns = [
      // "89,000원 × 3개 = 267,000원"  (단가 × 수량)
      { re: /([\d,]+)원\s*×\s*(\d+)\s*(?:개|팩|대|세트|박스)?/,       group: { price: 1, qty: 2 } },
      // "5개 × 498,000원 = 2,490,000원"  (수량 × 단가)
      { re: /(\d+)\s*(?:개|팩|대|세트|박스)\s*×\s*([\d,]+)원/,         group: { price: 2, qty: 1 } },
      // "459,000원 × 2 = 918,000원"  (단가 × 숫자)
      { re: /([\d,]+)원\s*×\s*(\d+)\s*=/,                             group: { price: 1, qty: 2 } },
      // "1,890,000원" + 별도 수량 없음 (단품)
      { re: /(?:추천드립니다|주문하겠습니다)[^]*?([\d,]+)원/,            group: { price: 1, qty: 0 } },
      // fallback: "N대를 추천" + "금액원"
      { re: /([\d,]+)원/,                                              group: { price: 1, qty: 0 } },
    ];

    // 수량 별도 추출 (메시지 전체에서)
    const qtyPatterns = [
      /(\d+)\s*(?:개|팩|대|세트|박스)\s*(?:주문|품의|결제)/,
      /(\d+)\s*(?:개|팩|대|세트|박스)\s*×/,
      /×\s*(\d+)\s*(?:개|팩|대|세트|박스)?/,
    ];

    for (const m of msgs) {
      if (m.role !== "assistant") continue;

      // 상품 DB 매칭 — 정확 매칭 → 부분 매칭(브랜드+카테고리 키워드)
      const matched = products.find((p) => m.content.includes(p.name))
        ?? products.find((p) => {
          // "HP 206A 정품 토너(검정)" ↔ "HP 206A 정품 토너 검정" 같은 부분 매칭
          const nameCore = p.name.replace(/\s+/g, "");
          const contentClean = m.content.replace(/[()（）]/g, "").replace(/\s+/g, "");
          return contentClean.includes(nameCore);
        })
        ?? products.find((p) => {
          // 브랜드 + 모델번호 조합 매칭 ("HP 206A", "시디즈 T50")
          if (!p.brand) return false;
          const words = p.name.split(/\s+/).filter((w) => w.length >= 2);
          const brandInContent = m.content.includes(p.brand);
          const modelInContent = words.some((w) => w !== p.brand && m.content.includes(w));
          return brandInContent && modelInContent;
        });
      if (!matched && !restoredCart.length) continue;

      const product = matched ?? restoredCart[0]?.product;
      if (!product) continue;

      // 가격·수량 추출
      let unitPrice = product.price;
      let qty = 1;

      for (const { re, group } of pricePatterns) {
        const match = m.content.match(re);
        if (match) {
          unitPrice = parseInt(match[group.price].replace(/,/g, ""), 10);
          if (group.qty > 0 && match[group.qty]) {
            qty = parseInt(match[group.qty], 10);
          }
          break;
        }
      }

      // 수량이 1이면 별도 패턴으로 재시도
      if (qty === 1) {
        const allText = msgs.map((x) => x.content).join(" ");
        for (const qp of qtyPatterns) {
          const qm = allText.match(qp);
          if (qm) { qty = parseInt(qm[1], 10); break; }
        }
      }

      restoredTotal = unitPrice * qty;
      restoredCart = [{ product: matched ?? product, quantity: qty }];
      break; // 첫 매칭만 사용
    }

    // DB 매칭 안 됐으면 메시지에서 상품명 추출 시도
    if (restoredCart.length === 0) {
      const namePatterns = [
        /\*\*(.+?)\*\*/,                          // **시디즈 T50 AIR**
        /(.+?)\s+(\d+)(?:개|팩|대)\s*(?:품의|주문|결제)/, // "HP 206A 토너 3개 품의"
      ];
      for (const m of msgs) {
        if (m.role !== "assistant") continue;
        for (const np of namePatterns) {
          const nm = m.content.match(np);
          if (nm) {
            const name = nm[1].trim();
            // DB에서 부분 매칭
            const dbMatch = products.find((p) => name.includes(p.name) || p.name.includes(name));
            if (dbMatch) {
              const qty = nm[2] ? parseInt(nm[2], 10) : 1;
              restoredCart = [{ product: dbMatch, quantity: qty }];
              restoredTotal = dbMatch.price * qty;
              break;
            }
          }
        }
        if (restoredCart.length > 0) break;
      }
    }

    // 추천 상품 카드 복원 비활성화 — 상품 정보는 메시지 데이터의 productIds로
    // 인라인 렌더링. 하단 별도 AI 추천 카드를 자동 생성하면 위치 오류 + 중복 발생.
    const matchedProduct = restoredCart[0]?.product;
    if (false && matchedProduct) { // eslint-disable-line no-constant-condition
      // 첫 번째 사용자 메시지에서 검색 키워드 추출
      const firstUserMsg = msgs.find((m) => m.role === "user");
      const queryText = firstUserMsg?.content ?? matchedProduct.name;

      // 선정 상품: DB 매칭된 상품을 SourcedProduct로 변환
      const mainSourced: SourcedProduct = {
        id: `restored-${matchedProduct.id}`,
        name: matchedProduct.name,
        price: matchedProduct.price,
        brand: matchedProduct.brand || "브랜드",
        category: matchedProduct.category || "기타",
        source: "airsupply-db",
        purchaseCount: Math.floor(Math.random() * 40) + 10,
        deliveryFee: 0,
        deliveryDays: 2,
        isRecommended: true,
        aiNote: `사내 구매 이력 기반 추천 상품. ${matchedProduct.name} — 최근 30일 기준 가장 많이 선택된 모델입니다.`,
      };

      // 후보 상품: 같은 카테고리에서 2~3개 + 외부마켓 1개
      const sameCat = products.filter((p) => p.category === matchedProduct.category && p.id !== matchedProduct.id);
      const candidateSourcing: SourcedProduct[] = sameCat.slice(0, 2).map((p, i) => ({
        id: `restored-cand-${p.id}`,
        name: p.name,
        price: p.price,
        brand: p.brand,
        category: p.category,
        source: (i === 0 ? "airsupply-supplier" : "api-external") as SourcedProduct["source"],
        platform: i === 1 ? "쿠팡" : undefined,
        deliveryFee: i === 0 ? 0 : 3000,
        deliveryDays: i + 3,
        purchaseCount: i === 0 ? Math.floor(Math.random() * 20) + 5 : undefined,
        scrapingStatus: (i === 1 ? "done" : undefined) as ScrapingStatus | undefined,
        aiNote: i === 0
          ? "입점 공급사 직거래 — 대량 구매 시 추가 할인 가능."
          : "외부마켓 최저가 — 상세 정보 수집 완료.",
      }));

      setSourcedProducts([mainSourced]);
      setCandidateProducts(candidateSourcing);
      setSearchPhase("results");

      // 검색 기록
      const allProducts = [mainSourced, ...candidateSourcing];
      const restoredRecord: SearchRecord = {
        id: `sr-restored-${Date.now()}`,
        query: queryText.length > 20 ? queryText.slice(0, 20) + "…" : queryText,
        timestamp: new Date(msgs[0].timestamp).toLocaleTimeString("ko-KR", { hour: "2-digit", minute: "2-digit" }),
        resultCount: allProducts.length,
        sources: [
          { name: "에어서플라이", count: allProducts.filter((p) => p.source === "airsupply-db").length, color: "#6366f1" },
          { name: "입점공급사", count: allProducts.filter((p) => p.source === "airsupply-supplier").length, color: "#059669" },
          { name: "외부마켓", count: allProducts.filter((p) => p.source === "api-external").length, color: "#ea580c" },
        ].filter((s) => s.count > 0),
        products: allProducts.map((p) => ({ name: p.name, price: p.price, source: p.source })),
      };
      setSearchRecords([restoredRecord]);
    }

    // 플로우 단계 결정 (가장 진행된 단계 기준)
    if (hasOrderConfirm || hasDeliveryComplete) {
      setFlowActive(true);
      setTimelinePhase("complete");
      setApprovalStep("승인");
      setApprovalDate(msgs.find((m) => m.content.includes("승인"))?.timestamp?.split("T")[0]);
      setShippingStep("배송완료");
      setFrozenCart(restoredCart);
      setFrozenTotal(restoredTotal);
    } else if (hasShipping) {
      setFlowActive(true);
      setTimelinePhase("shipping");
      setApprovalStep("승인");
      setApprovalDate(msgs.find((m) => m.content.includes("승인"))?.timestamp?.split("T")[0]);
      setShippingStep(hasDeliveryComplete ? "배송완료" : "배송중");
      setFrozenCart(restoredCart);
      setFrozenTotal(restoredTotal);
    } else if (hasPaymentDone) {
      setFlowActive(true);
      setTimelinePhase("shipping");
      setApprovalStep("승인");
      setPaymentMethod("하나 법인카드 (****-1234)");
      setShippingStep("접수");
      setFrozenCart(restoredCart);
      setFrozenTotal(restoredTotal);
    } else if (hasApprovalDone) {
      setFlowActive(true);
      setTimelinePhase("shipping");
      setApprovalStep("승인");
      setApprovalDate(msgs.find((m) => m.content.includes("승인"))?.timestamp?.split("T")[0]);
      setShippingStep("접수");
      setFrozenCart(restoredCart);
      setFrozenTotal(restoredTotal);
    } else if (hasApprovalRequest) {
      setFlowActive(true);
      setTimelinePhase("approval");
      setApprovalStep("대기");
      setFrozenCart(restoredCart);
      setFrozenTotal(restoredTotal);
    } else if (hasReturn) {
      // 반품 수거 시나리오 — 배송완료 후 반품요청 상태
      setFlowActive(true);
      setTimelinePhase("complete");
      setApprovalStep("승인");
      setShippingStep("반품요청");
      setFrozenCart(restoredCart);
      setFrozenTotal(restoredTotal);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /* ── Work Item state ──
     한 채팅에서 여러 구매가 동시 진행될 때, 각 구매 여정을 독립 객체로 다룸.
     - singleton state(cart/flowActive/...)는 "현재 활성 WI의 live state"
     - 다른 WI로 전환 시 현재 singleton을 activeId의 snapshot에 저장하고 target의 snapshot을 singleton으로 로드 */
  const [workItems, setWorkItems] = useState<Record<string, WorkItem>>({});
  const [activeWorkItemId, setActiveWorkItemId] = useState<string | null>(null);

  const bottomRef = useRef<HTMLDivElement>(null);
  const { openPanel, closePanel, open: panelOpen, contentKey, setWorkItemStrip, registerDefaultOpener, updateMeta } = useRightPanel();
  const { openSettings } = useSettings();
  const router = useRouter();
  const { budget } = useSettingsStore();

  /* ── 회사 컨텍스트 (간식 추천 시나리오에서 사용) ──
     인원: users.length
     월 간식 예산: 부서 연간 예산 합계에서 월 환산 후 1%를 간식 가이드로 추정 (설정에 간식 전용 필드 없음) */
  const teamSize = users.length;
  const totalAnnualBudget = budget.departments.reduce((s, d) => s + d.annual, 0);
  const estimatedSnackBudget = Math.round((totalAnnualBudget / 12) * 0.01 / 1000) * 1000;

  /* ── 간식 시나리오 단계 ── */
  const [snackStep, setSnackStep] = useState<"idle" | "awaiting-confirm" | "completed">("idle");

  const totalPrice = globalCart.totalPrice;

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

  /* ── Cart (aliases defined above with globalCart) ── */

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

  // SourcedProduct → Product 변환 헬퍼 (장바구니/상품 상세 공용)
  const toProduct = useCallback((product: SourcedProduct): Product => ({
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
  }), []);

  const handleSourcedSelect = useCallback((product: SourcedProduct) => {
    // 1) 채팅에 AI 맥락 응답
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
    // 2) 우측 패널을 "상품 상세" 자식으로 drill-down
    viewProductRef.current(toProduct(product));
  }, [addAI, scrapingProduct, runBackgroundScrape, toProduct]);

  // 장바구니 담기 토스트 (장바구니 보기 액션 포함)
  const [cartToast, setCartToast] = useState<string | null>(null);
  const cartToastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  /** 장바구니 담기 공통 — 토스트 + 작업현황 빨간 점 */
  const showCartToast = useCallback((name: string) => {
    setCartToast(`${name} 장바구니에 담았어요`);
    if (cartToastTimer.current) clearTimeout(cartToastTimer.current);
    cartToastTimer.current = setTimeout(() => setCartToast(null), 3500);
    updateMeta({ backBadge: true });
  }, [updateMeta]);

  const handleSourcedAddToCart = useCallback((product: SourcedProduct) => {
    addToCart(toProduct(product));
    addSys(`${product.name} 이(가) 장바구니에 담겼습니다.`);
    showCartToast(product.name);
  }, [addToCart, addSys, toProduct, showCartToast]);

  /* ═══════════════════════════════════════
     기존 구매 플로우 (approval, payment, shipping)
     ═══════════════════════════════════════ */

  // 토스트 메시지 — 품의 승인 완료 등 짧은 시스템 알림
  const [toastMsg, setToastMsg] = useState<string | null>(null);
  const toastTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const showToast = useCallback((msg: string) => {
    setToastMsg(msg);
    if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
    toastTimerRef.current = setTimeout(() => setToastMsg(null), 3500);
  }, []);

  const advanceFlow = useCallback(() => {
    if (timelinePhase === "approval" && approvalStep === "대기") {
      // 품의 승인 완료 — 구매 요청자에겐 결제 권한이 없는 경우가 대부분이므로 결제 단계 스킵.
      // 토스트 + 주문 접수 메시지 + 배송 단계로 자동 진입.
      setApprovalStep("승인");
      setApprovalDate("2026-04-10");
      addSys("김지현 매니저가 품의를 승인했습니다.");
      addAI(
        `승인이 완료되었어요. 주문이 접수되었습니다.\n\n총 **${frozenTotal.toLocaleString()}원** — 관리자 결제 처리 후 배송이 시작됩니다.`,
        "주문",
      );
      showToast("승인이 완료되었어요. 주문이 접수되었습니다");
      setTimeout(() => {
        // 결제 스킵 → 배송 접수 단계로 진입
        setPaymentMethod("관리자 결제 처리");
        setPaymentDate("2026-04-10");
        setTimelinePhase("shipping");
        setShippingStep("접수");
        globalCart.clearCart();
      }, 600);
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
  }, [timelinePhase, approvalStep, shippingStep, addSys, addAI, frozenTotal, showToast]);

  /* 품의 검토 패널 → 제출 시 실제 플로우 진입.
     승인 완료(자동/수동 모두) → 구매 요청자는 결제 권한 없음을 가정하고 결제 단계 스킵 →
     토스트 알림 + 배송 접수 단계로 직접 진입. */
  const submitApproval = useCallback(() => {
    setFrozenCart([...cart]); setFrozenTotal(totalPrice); setFlowActive(true);
    const isAuto = totalPrice <= AUTO_APPROVE_LIMIT;
    setIsAutoApproved(isAuto);
    if (isAuto) {
      // 자동 승인 → 결제 스킵 → 배송으로 직행
      setApprovalStep("자동승인");
      setApprovalDate("2026-04-10");
      addAI(
        `총 ${totalPrice.toLocaleString()}원은 소액 자동승인 대상입니다. 주문이 접수되었어요 — 관리자 결제 처리 후 배송이 시작됩니다.`,
        "주문",
      );
      showToast("자동 승인되었어요. 주문이 접수되었습니다");
      setTimeout(() => {
        setPaymentMethod("관리자 결제 처리");
        setPaymentDate("2026-04-10");
        setTimelinePhase("shipping");
        setShippingStep("접수");
        globalCart.clearCart();
      }, 600);
    } else {
      // 수동 승인 → 품의 요청 접수 → (김지현 매니저 대기) → advanceFlow에서 승인 후 배송 진입
      setApprovalStep("요청"); setTimelinePhase("approval");
      addAI(`품의 요청을 올렸습니다. 총 ${totalPrice.toLocaleString()}원 — **김지현 매니저**님의 승인을 기다리고 있습니다.`, "주문");
      setTimeout(() => setApprovalStep("대기"), 500);
    }
  }, [cart, totalPrice, addAI, showToast]);

  /* 장바구니에서 "품의 요청" 클릭 → 품의 검토 패널 열기 */
  const startApproval = useCallback(() => {
    openPanel(
      <ApprovalReviewPanel
        items={cart}
        autoApprovalLimit={AUTO_APPROVE_LIMIT}
        onSubmit={() => submitApproval()}
      />,
      "approval-review",
      { label: "품의 요청", onBack: () => openContextRef.current(), backLabel: "작업 현황" },
    );
  }, [cart, openPanel, submitApproval]);

  const startDirectPurchase = useCallback(() => {
    setFrozenCart([...cart]); setFrozenTotal(totalPrice); setFlowActive(true);
    setIsAutoApproved(true); setApprovalStep("자동승인"); setApprovalDate("2026-04-10"); setTimelinePhase("payment");
    addAI("직접 결제 권한이 확인되었습니다. 결제수단을 선택해주세요.", "주문");
  }, [cart, totalPrice, addAI]);

  const confirmPayment = useCallback((methodId: string) => {
    const label = PAYMENT_LABELS[methodId] ?? methodId;
    setPaymentMethod(label); setPaymentDate("2026-04-10"); setTimelinePhase("shipping"); setShippingStep("접수"); globalCart.clearCart();
    addSys(`결제 완료 — ${label}`);
    addAI(`결제가 완료되었습니다!\n\n결제수단: **${label}**\n결제 금액: **${frozenTotal.toLocaleString()}원**`, "주문");
  }, [addSys, addAI, frozenTotal]);

  const confirmPurchase = useCallback(() => { setShippingStep("구매확정"); addSys("구매가 확정되었습니다."); addAI("구매 확정 처리되었습니다!", "주문"); }, [addSys, addAI]);
  const requestReturn = useCallback(() => { setShippingStep("반품요청"); addSys("반품 요청이 접수되었습니다."); addAI("반품 요청이 접수되었습니다.", "주문"); }, [addSys, addAI]);

  /* ── Right panel sync — 계층 내비게이션 모델 ──
     루트: 작업 현황 (chat-context)
     자식: 장바구니 / 품의 진행 / 결제 / 배송 / 상품 상세
     각 자식 페이지 헤더의 "← 작업 현황"로 루트 복귀. */

  // 상호 참조를 위한 ref (createWorkItem → openContext 순환, handleSourcedSelect → viewProduct forward ref)
  const openContextRef = useRef<() => void>(() => {});
  /** 비구매 분기(비용 분석/간식)에서 패널 자동 오픈을 억제하는 플래그 */
  const panelSuppressedRef = useRef(false);
  const openFlowRef = useRef<() => void>(() => {});
  const openCartRef = useRef<() => void>(() => {});
  const viewProductRef = useRef<(p: Product) => void>(() => {});

  const phaseLabel =
    timelinePhase === "approval" ? "품의 진행" :
    timelinePhase === "payment" ? "결제" :
    timelinePhase === "shipping" ? "배송" :
    timelinePhase === "complete" ? "주문 완료" : "주문 진행";

  // 진행 상황 알림 — 확인하지 않은 플로우 변화가 있을 때 true
  const [hasUnviewedProgress, setHasUnviewedProgress] = useState(false);

  // 플로우 진입/재진입 (자식 페이지로 drill-down)
  const openFlow = useCallback(() => {
    if (!flowActive) return;
    const backToContext = () => openContextRef.current();
    if (timelinePhase === "payment" && !paymentMethod) {
      openPanel(
        <PaymentSelector totalPrice={frozenTotal} onConfirm={confirmPayment} />,
        "payment",
        { label: "결제", onBack: backToContext, backLabel: "작업 현황" },
      );
    } else {
      openPanel(
        <OrderTimeline activePhase={timelinePhase} cart={frozenCart} totalPrice={frozenTotal}
          approvalStep={approvalStep} approver="김지현 매니저" approvalDate={approvalDate}
          isAutoApproved={isAutoApproved} paymentMethod={paymentMethod} paymentDate={paymentDate}
          shippingStep={shippingStep} trackingNumber="CJ1234567890" estimatedDate="2026-04-14"
          onAdvance={advanceFlow} onConfirmPurchase={confirmPurchase} onRequestReturn={requestReturn} />,
        "order-timeline",
        { label: phaseLabel, onBack: backToContext, backLabel: "작업 현황" },
      );
    }
    // drill-in = 사용자가 확인함 → 알림 dot 끔
    setHasUnviewedProgress(false);
  }, [flowActive, timelinePhase, frozenCart, frozenTotal, approvalStep, approvalDate, isAutoApproved, paymentMethod, paymentDate, shippingStep, advanceFlow, confirmPurchase, requestReturn, confirmPayment, openPanel, phaseLabel]);

  // 플로우 단계 변화 시:
  //  - cart/order-timeline/payment 페이지에 있으면 → 자동으로 최신 플로우 페이지로 (사용자가 명시적 액션으로 진입한 맥락)
  //  - 루트(chat-context) 또는 product-detail 등에 있으면 → dot 알림만 (drill-down은 사용자가 직접)
  useEffect(() => {
    if (!flowActive || panelSuppressedRef.current) return;
    if (
      contentKey === "cart" ||
      contentKey === "order-timeline" ||
      contentKey === "payment" ||
      contentKey === "approval-review"
    ) {
      openFlow();
      return;
    }
    setHasUnviewedProgress(true);
  }, [flowActive, timelinePhase, paymentMethod, approvalStep, shippingStep, openFlow, contentKey]);

  const openCart = useCallback(() => {
    openPanel(
      <CartPanel items={cart} onUpdateQuantity={updateQty} onRemove={removeItem} onRequestApproval={startApproval} onDirectPurchase={startDirectPurchase} />,
      "cart",
      { label: "장바구니", onBack: () => openContextRef.current(), backLabel: "작업 현황" },
    );
  }, [cart, openPanel, updateQty, removeItem, startApproval, startDirectPurchase]);

  const viewProduct = useCallback((product: Product) => {
    openPanel(
      <ProductDetailPanel
        product={product}
        onAddToCart={() => {
          addToCart(product);
          addSys(`${product.name} 이(가) 장바구니에 담겼습니다.`);
          showCartToast(product.name);
        }}
      />,
      "product-detail",
      { label: "상품 상세", onBack: () => openContextRef.current(), backLabel: "작업 현황" },
    );
  }, [openPanel, addToCart, addSys, showCartToast]);

  const handleAddToCart = useCallback((product: Product) => {
    addToCart(product);
    addSys(`${product.name} 이(가) 장바구니에 담겼습니다.`);
    showCartToast(product.name);
  }, [addToCart, addSys, showCartToast]);

  /* ═══════════════════════════════════════
     Work Item 관리 — snapshot 저장/복원
     ═══════════════════════════════════════ */

  // 현재 singleton state를 snapshot으로 직렬화
  const buildSnapshot = useCallback((): WorkItemSnapshot => ({
    searchPhase, intentText,
    sourcedProducts, candidateProducts, searchRecords,
    cart: [], // cart is now global — snapshot placeholder only
    flowActive, timelinePhase, approvalStep, isAutoApproved,
    approvalDate, paymentMethod, paymentDate, shippingStep,
    frozenCart, frozenTotal,
  }), [searchPhase, intentText, sourcedProducts, candidateProducts, searchRecords, flowActive, timelinePhase, approvalStep, isAutoApproved, approvalDate, paymentMethod, paymentDate, shippingStep, frozenCart, frozenTotal]);

  // 현재 live state에서 Work Item의 상태 도출
  const deriveStatus = useCallback((): WorkItemStatus => {
    if (flowActive) {
      if (timelinePhase === "approval") return "approval";
      if (timelinePhase === "payment") return "payment";
      if (timelinePhase === "shipping") return "shipping";
      if (timelinePhase === "complete") return "complete";
    }
    if (cart.length > 0) return "cart";
    if (searchPhase === "results") return "results";
    if (searchPhase === "searching") return "searching";
    if (searchPhase === "analyzing") return "analyzing";
    return "idle";
  }, [flowActive, timelinePhase, cart, searchPhase]);

  // 빈 snapshot — 새 WI 생성 시 초기값
  const emptySnapshot = useCallback((): WorkItemSnapshot => ({
    searchPhase: "idle",
    intentText: null,
    sourcedProducts: [],
    candidateProducts: [],
    searchRecords: [],
    cart: [],
    flowActive: false,
    timelinePhase: "products",
    approvalStep: "요청",
    isAutoApproved: false,
    approvalDate: undefined,
    paymentMethod: undefined,
    paymentDate: undefined,
    shippingStep: "접수",
    frozenCart: [],
    frozenTotal: 0,
  }), []);

  // snapshot을 singleton state로 로드
  const loadSnapshot = useCallback((snap: WorkItemSnapshot) => {
    setSearchPhase(snap.searchPhase);
    setIntentText(snap.intentText);
    setSourcedProducts(snap.sourcedProducts as SourcedProduct[]);
    setCandidateProducts(snap.candidateProducts as SourcedProduct[]);
    setSearchRecords(snap.searchRecords as SearchRecord[]);
    // cart is now global — skip snap.cart
    setFlowActive(snap.flowActive);
    setTimelinePhase(snap.timelinePhase);
    setApprovalStep(snap.approvalStep);
    setIsAutoApproved(snap.isAutoApproved);
    setApprovalDate(snap.approvalDate);
    setPaymentMethod(snap.paymentMethod);
    setPaymentDate(snap.paymentDate);
    setShippingStep(snap.shippingStep);
    setFrozenCart(snap.frozenCart as CartItem[]);
    setFrozenTotal(snap.frozenTotal);
  }, []);

  // WI 전환
  const switchWorkItem = useCallback((targetId: string) => {
    if (targetId === activeWorkItemId) return;
    const target = workItems[targetId];
    if (!target) return;

    setWorkItems((prev) => {
      const next = { ...prev };
      if (activeWorkItemId && next[activeWorkItemId]) {
        next[activeWorkItemId] = {
          ...next[activeWorkItemId],
          snapshot: buildSnapshot(),
          status: deriveStatus(),
        };
      }
      return next;
    });
    loadSnapshot(target.snapshot);
    setActiveWorkItemId(targetId);
    setHasUnviewedProgress(false);
    // WI 전환 시 루트(작업 현황)로 복귀 — 이전 자식 페이지가 떠있었다면 닫고 새 WI의 루트로
    openContextRef.current();
  }, [activeWorkItemId, workItems, buildSnapshot, deriveStatus, loadSnapshot]);

  // 새 WI 생성 (현재 live state는 이전 active에 저장, 새 WI는 빈 상태로 시작 + 활성화)
  const createWorkItem = useCallback((title: string, color: string): string => {
    const id = `wi-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
    const newWI: WorkItem = {
      id,
      title,
      color,
      status: "idle",
      createdAt: new Date().toISOString(),
      snapshot: emptySnapshot(),
    };
    setWorkItems((prev) => {
      const next = { ...prev };
      if (activeWorkItemId && next[activeWorkItemId]) {
        next[activeWorkItemId] = {
          ...next[activeWorkItemId],
          snapshot: buildSnapshot(),
          status: deriveStatus(),
        };
      }
      next[id] = newWI;
      return next;
    });
    loadSnapshot(emptySnapshot());
    setActiveWorkItemId(id);
    setHasUnviewedProgress(false);
    // 새 WI 생성 = 새 검색 시작 = 루트 복귀
    openContextRef.current();
    return id;
  }, [activeWorkItemId, buildSnapshot, deriveStatus, emptySnapshot, loadSnapshot]);

  /* ═══════════════════════════════════════
     메시지 전송 핸들러
     ═══════════════════════════════════════ */

  const handleSend = useCallback((text: string) => {
    addMsg({ role: "user", content: text });

    /* ── 비용 분석 질문 감지 — 짧은 답 + 비용 인텔리전스 카드 ──
       채팅에서 깊이 다루지 않고 /cost-intel으로 유도. Work Item 생성도 안 함.
       이전 검색 상태를 초기화해 AI 추천 카드/패널이 남지 않도록. */
    if (detectCostAnalysisQuery(text)) {
      setSourcedProducts([]);
      setCandidateProducts([]);
      setSearchPhase("idle");
      panelSuppressedRef.current = true;
      closePanel();
      setIsTyping(true);
      setTimeout(() => {
        addMsg({
          role: "assistant",
          content: getCostAnalysisResponse(text),
          agent: "분석",
          cardType: "cost-intel-link",
        });
        setIsTyping(false);
      }, 600);
      return;
    }

    /* ── 간식 추천 시나리오 — 2단 분기 ──
       턴 1: 키워드 감지 → 설정에서 팀 인원·예산 읽어와 확인 질문
       턴 2: 확인 응답 후 분석 요약 + 추천 카드 (간식 패키지 탭 유도) */
    if (snackStep === "idle" && detectSnackQuery(text)) {
      setSourcedProducts([]);
      setCandidateProducts([]);
      setSearchPhase("idle");
      panelSuppressedRef.current = true;
      closePanel();
      setIsTyping(true);
      setTimeout(() => {
        addMsg({
          role: "assistant",
          agent: "주문",
          content:
            `이번 달 간식 기준을 맞춰볼게요. 회사 설정에서 읽은 값입니다.\n\n- **팀 인원**: ${teamSize}명\n- **월 간식 예산(권장 가이드)**: ${estimatedSnackBudget.toLocaleString()}원\n\n이대로 추천할까요, 아니면 다르게 맞춰드릴까요?`,
        });
        setIsTyping(false);
        setSnackStep("awaiting-confirm");
      }, 700);
      return;
    }
    if (snackStep === "awaiting-confirm") {
      setIsTyping(true);
      setTimeout(() => {
        addMsg({
          role: "assistant",
          agent: "분석",
          content:
            "최근 3개월 간식 주문 패턴을 분석했어요. 견과류 · 초콜릿 · 음료 비중이 안정적으로 나타나고 있어, 비슷한 구성으로 추천드립니다.\n\n한 번에 묶음으로 받고 싶다면 카드 하단의 **간식 패키지**에서 팀 규모·예산에 맞춰 한 번에 구매할 수 있어요.",
          cardType: "snack-recommendation",
        });
        setIsTyping(false);
        setSnackStep("completed");
      }, 900);
      return;
    }

    /* ── Work Item 자동 생성 — 키워드 매칭 ──
       1) 활성 WI가 없으면 → 첫 WI 생성 (타이틀/색은 키워드로 결정, 못 찾으면 "구매 요청")
       2) 활성 WI가 있고, 새 키워드가 현재와 다른 구매 의도면 → 새 WI 생성 후 활성화 */
    panelSuppressedRef.current = false; // 구매 분기 진입 → 패널 억제 해제
    const intentMatch = detectPurchaseIntent(text);
    if (intentMatch) {
      const needsNewWI =
        !activeWorkItemId ||
        (workItems[activeWorkItemId] && workItems[activeWorkItemId].title !== intentMatch.title);
      if (needsNewWI) {
        createWorkItem(intentMatch.title, intentMatch.color);
      }
    } else if (!activeWorkItemId) {
      // 키워드 매칭 실패 + 아직 WI 없음 → 제네릭 WI 생성
      createWorkItem("구매 요청", "#6366f1");
    }

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

    // 3) 키워드 매칭 → fuzzy 검색 → fallback (3단계)
    setIsTyping(true);
    setTimeout(() => {
      // 3a) 정확 키워드 매칭
      const matchedIds = findProductIds(text);
      // 3b) fuzzy 텍스트/카테고리 검색
      const fuzzy = !matchedIds ? searchProductsFuzzy(text) : null;
      const resolvedIds = matchedIds ?? fuzzy?.ids ?? null;

      if (resolvedIds && resolvedIds.length > 0) {
        const matchedProducts = resolvedIds
          .map((id) => products.find((p) => p.id === id))
          .filter((p): p is Product => !!p);

        // 채팅 메시지 — productIds는 넣지 않음 (sourcedProducts → AI 추천 카드로 노출)
        const chatMsg = fuzzy?.method === "category"
          ? `"${text}"에 대한 정확한 상품은 없지만, 관련 카테고리에서 ${matchedProducts.length}개 상품을 찾았습니다.`
          : `검색 결과 ${matchedProducts.length}개 상품을 찾았습니다. 상품을 확인해보시고, 필요하시면 장바구니에 담아주세요.`;
        addMsg({ role: "assistant", content: chatMsg, agent: "주문" });

        // 우측 패널 데이터 갱신 — 3-DB 시나리오와 동일하게 결과 상태로 전환
        const sourced: SourcedProduct[] = matchedProducts.map((p, i) => ({
          id: p.id,
          name: p.name,
          price: p.price,
          brand: p.brand,
          category: p.category,
          source: (i === 0 ? "airsupply-db" : i === 1 ? "airsupply-supplier" : "api-external") as SourceType,
          deliveryDays: p.inStock ? 3 + i : 7 + i,
          deliveryFee: i === 0 ? 0 : 3000,
          purchaseCount: Math.max(0, 30 - i * 12),
          aiNote: p.description,
          isRecommended: i === 0,
        }));
        setSourcedProducts(sourced);
        setCandidateProducts([]);
        setSearchPhase("results");

        // 검색 기록 추가
        const newRecord: SearchRecord = {
          id: `sr-${Date.now()}`,
          query: text,
          timestamp: new Date().toLocaleTimeString("ko-KR", { hour: "2-digit", minute: "2-digit" }),
          resultCount: sourced.length,
          sources: [
            { name: "에어서플라이", count: sourced.filter((s) => s.source === "airsupply-db").length, color: "#6366f1" },
            { name: "입점공급사", count: sourced.filter((s) => s.source === "airsupply-supplier").length, color: "#059669" },
            { name: "외부마켓", count: sourced.filter((s) => s.source === "api-external").length, color: "#ea580c" },
          ].filter((s) => s.count > 0),
          products: sourced.map((s) => ({ name: s.name, price: s.price, source: s.source })),
        };
        setSearchRecords((prev) => [newRecord, ...prev]);
      }
      // 3c) 완전 미매칭
      else {
        addMsg({
          role: "assistant",
          agent: "주문",
          content:
            `"${text}"에 해당하는 상품을 찾지 못했습니다.\n\n현재 등록된 카테고리: **용지 · 잉크/토너 · 사무기기 · 가구 · 전자기기 · 사무용품 · 생활용품 · 간식**\n\n카테고리나 구체적인 상품명으로 다시 검색해보시겠어요?`,
        });
      }
      setIsTyping(false);
    }, 800 + Math.random() * 1000);
  }, [addMsg, searchPhase, lastScenario, handleResearch, startDbSearch, activeWorkItemId, workItems, createWorkItem]);

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

  /* ── 컨텍스트 사이드바 Phase 매핑 ──
     장바구니는 플로팅 아이콘으로 분리됨 → 타임라인에서 제거.
     탐색 단계: searchPhase 그대로.
     구매 단계: flowActive일 때 timelinePhase 매핑. */
  const sidebarPhase = flowActive
    ? (timelinePhase === "approval" ? "approval" as const
      : timelinePhase === "payment" ? "payment" as const
      : timelinePhase === "shipping" ? "shipping" as const
      : timelinePhase === "complete" ? "complete" as const
      : searchPhase)
    : searchPhase;

  const contextInfo: ContextInfo = {
    budget: { monthly: 10000000, used: 5089000, department: "개발팀" },
    shippingAddress: "서울 강남구 테헤란로 152, 7층",
    paymentMethod: "신한 법인카드 (****-1234)",
    agentMode: "오픈 모드",
    agentModeColor: "#22c55e",
    recentOrders: 8,
    approvalPolicy: {
      autoApproveLimit: AUTO_APPROVE_LIMIT,
      canDirectPurchase: true,
      aiRestricted: false,
    },
    agentPolicy: {
      description: "AI가 자율적으로 검색·추천·답변합니다. 정해진 구매 규정 내에서 행동합니다.",
      agents: ["주문", "배송", "권한", "분석"],
    },
  };

  /* ── 작업 현황(루트) 송출 ──
     - 마운트 시 자동 오픈
     - chat-context가 활성 상태면 의존성 변화 시 콘텐츠 갱신
     - 자식 페이지(cart/payment/product-detail/order-timeline)가 떠 있을 땐 덮어쓰지 않음 */
  const openContext = useCallback(() => {
    openPanel(
      <ChatContextSidebar
        currentPhase={sidebarPhase}
        searchRecords={searchRecords}
        extractedProducts={sourcedProducts}
        candidateProducts={candidateProducts}
        cart={cart}
        context={contextInfo}
        onProductClick={handleSourcedSelect}
        onOpenFlow={flowActive ? () => openFlowRef.current() : undefined}
        progressNotification={false}
        onOpenBudget={() => router.push("/cost-intel")}
        onOpenShipping={() => openSettings("company-shipping")}
        onOpenPayment={() => openSettings("accounting-payment")}
        onOpenOrders={() => router.push("/orders")}
      />,
      "chat-context",
      { label: "작업 현황" },  // 루트 — onBack 없음
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [openPanel, sidebarPhase, searchRecords, sourcedProducts, candidateProducts, cart, flowActive, hasUnviewedProgress, router, openSettings]);

  // ref 동기화 (순환 참조 / forward 참조 해소)
  useEffect(() => { openContextRef.current = openContext; }, [openContext]);
  useEffect(() => { openFlowRef.current = openFlow; }, [openFlow]);
  useEffect(() => { openCartRef.current = openCart; }, [openCart]);
  useEffect(() => { viewProductRef.current = viewProduct; }, [viewProduct]);

  /* ── TopBar 우측 패널 토글이 빈 상태에서 열릴 때 루트 컨텍스트로 복구 ── */
  useEffect(() => {
    return registerDefaultOpener(() => openContextRef.current());
  }, [registerDefaultOpener]);

  /* ── Work Item 칩 스위처 등록 ──
     workItems 변화 / activeId 변화 시 우측 패널 최상단 스위처 갱신.
     상태 라벨은 현재 활성 WI는 live state에서 즉시 도출, 다른 WI는 snapshot에서 도출 */
  useEffect(() => {
    const statusLabelMap: Record<WorkItemStatus, string> = {
      idle: "",
      analyzing: "분석중",
      searching: "검색중",
      results: "추천중",
      cart: "담김",
      approval: "품의",
      payment: "결제",
      shipping: "배송",
      complete: "완료",
    };
    const items = Object.values(workItems).map((wi) => {
      const status = wi.id === activeWorkItemId ? deriveStatus() : wi.status;
      return {
        id: wi.id,
        title: wi.title,
        color: wi.color,
        statusLabel: statusLabelMap[status] || undefined,
      };
    });
    setWorkItemStrip({
      items,
      activeId: activeWorkItemId,
      onSwitch: switchWorkItem,
    });
  }, [workItems, activeWorkItemId, deriveStatus, switchWorkItem, setWorkItemStrip]);

  // 언마운트 시 패널 정리 — 다른 페이지로 이동해도 작업 현황이 따라가지 않도록
  useEffect(() => {
    return () => {
      setWorkItemStrip(null);
      closePanel();
    };
  }, [setWorkItemStrip, closePanel]);

  // 패널 자동 오픈 + 데이터 변화 시 갱신
  // panelSuppressedRef: 비구매 분기(비용 분석/간식)에서 true → 패널 열기를 억제
  // 구매 분기 진입 시 false로 리셋됨
  useEffect(() => {
    if (panelSuppressedRef.current) return;
    if (!contentKey || contentKey === "chat-context") {
      openContext();
    }
  }, [openContext, contentKey]);

  return (
    <div className="flex h-full">
      <style dangerouslySetInnerHTML={{ __html: animStyles }} />

      {/* 토스트 — 품의 승인 등 짧은 시스템 알림 */}
      {toastMsg && (
        <div
          className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[60] flex items-center gap-2 px-4 py-2.5 text-[13px] font-medium text-white"
          style={{
            borderRadius: "9999px",
            backgroundColor: "#000",
            boxShadow: "rgba(0,0,0,0.25) 0px 8px 24px",
            letterSpacing: "0.14px",
          }}
        >
          <Check size={14} strokeWidth={2} />
          {toastMsg}
        </div>
      )}

      {/* 장바구니 담기 토스트 — "장바구니 보기" 액션 포함 */}
      {cartToast && (
        <div
          className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[70] flex items-center gap-2 px-4 py-2.5 text-[13px] font-medium text-white"
          style={{
            borderRadius: "10px",
            backgroundColor: "#1a1a1a",
            boxShadow: "rgba(0,0,0,0.25) 0px 8px 24px",
            letterSpacing: "0.14px",
            animation: "cartToastIn 0.25s ease-out",
          }}
        >
          <Check size={14} strokeWidth={2} />
          <span>{cartToast}</span>
          <span className="text-[#666]">·</span>
          <button
            onClick={() => { setCartToast(null); openCartRef.current(); }}
            className="text-[#a78bfa] hover:text-[#c4b5fd] cursor-pointer transition-colors whitespace-nowrap"
          >
            장바구니 보기
          </button>
        </div>
      )}
      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes cartToastIn {
          from { opacity: 0; transform: translate(-50%, 8px); }
          to   { opacity: 1; transform: translate(-50%, 0); }
        }
      ` }} />

      {/* ── 메인 채팅 영역 ── */}
      <div className="flex-1 flex flex-col h-full min-w-0 relative">
        {/* Messages */}
        <div className="flex-1 overflow-y-auto px-4 pt-2" style={{ scrollbarGutter: "stable" }}>
        <div className="max-w-[720px] mx-auto flex flex-col gap-1">
          {messages.map((msg) => (
            <div key={msg.id}>
              <ChatBubble message={msg} />
              {msg.productIds && msg.productIds.length > 0 && (
                <div className="mb-1 mt-1 max-w-full">
                  <ProductRecommendCard productIds={msg.productIds} onViewProduct={viewProduct} onAddToCart={handleAddToCart} />
                </div>
              )}
              {msg.cardType === "expense-summary" && (
                <div className="flex justify-start mb-1 mt-1">
                  <ExpenseSummaryCard />
                </div>
              )}
              {msg.cardType === "cost-intel-link" && (
                <div className="flex justify-start mb-1 mt-1">
                  <button
                    onClick={() => router.push("/cost-intel")}
                    className="inline-flex items-center gap-1.5 px-4 py-2 text-[13px] font-medium text-[#6366f1] cursor-pointer transition-all hover:translate-y-[-0.5px]"
                    style={{
                      borderRadius: "12px",
                      backgroundColor: "rgba(99,102,241,0.06)",
                      boxShadow: "rgba(99,102,241,0.15) 0px 0px 0px 1px",
                      letterSpacing: "0.14px",
                    }}
                  >
                    <BarChart3 size={14} strokeWidth={1.75} />
                    비용 인텔리전스 열기
                    <ArrowUpRight size={12} strokeWidth={2} />
                  </button>
                </div>
              )}
              {msg.cardType === "snack-recommendation" && (
                <div className="flex justify-start mb-1 mt-1">
                  <SnackRecommendationCard teamSize={teamSize} monthlyBudget={estimatedSnackBudget} />
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
            <div className="mb-1 max-w-full" style={{ animation: "fade-in 0.4s ease-out" }}>
              <SourcedProductCard
                products={sourcedProducts.map((p) => {
                  if (p.source === "api-external" && scrapingProduct && scrapingProduct.id === p.id) {
                    return { ...p, scrapingStatus: scrapingProduct.scrapingStatus, scrapingProgress: scrapingProduct.scrapingProgress, scrapingSteps: scrapingProduct.scrapingSteps, scrapedOptions: scrapingProduct.scrapedOptions, scrapedDeliveryFee: scrapingProduct.scrapedDeliveryFee, scrapedDeliveryDays: scrapingProduct.scrapedDeliveryDays };
                  }
                  return p;
                })}
                onSelect={handleSourcedSelect}
                onAddToCart={handleSourcedAddToCart}
              />
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

        {/* 글로벌 장바구니 플로팅 아이콘 */}
        {globalCart.totalItems > 0 && (
          <button
            onClick={() => openCartRef.current()}
            className="absolute bottom-20 right-5 z-20 flex items-center justify-center w-12 h-12 bg-[#000] text-white rounded-full cursor-pointer transition-all hover:scale-105"
            style={{
              boxShadow: "rgba(0,0,0,0.2) 0px 4px 16px, rgba(0,0,0,0.1) 0px 0px 0px 1px",
            }}
            aria-label="장바구니"
          >
            <ShoppingCart size={20} strokeWidth={1.5} />
            <span
              className="absolute -top-1 -right-1 flex items-center justify-center min-w-[20px] h-[20px] px-1 text-[10px] font-bold text-[#000] bg-white rounded-full"
              style={{
                boxShadow: "rgba(0,0,0,0.1) 0px 0px 0px 1px, rgba(0,0,0,0.08) 0px 2px 4px",
                letterSpacing: "0.14px",
              }}
            >
              {globalCart.totalItems}
            </span>
          </button>
        )}
      </div>

    </div>
  );
}
