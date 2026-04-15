"use client";

import { useState, useRef, useCallback } from "react";
import {
  Eye, ShoppingCart, Sparkles, Check, ExternalLink,
  Database, Building2, Globe, Zap, Loader2, ShieldCheck,
  TrendingDown, RefreshCw, Clock, ChevronDown, ChevronUp,
  ChevronLeft, ChevronRight,
} from "lucide-react";

/* ═══════════════════════════════════════
   소싱 출처별 상품 추천 카드
   3가지 DB에서 추출된 상품을 시각적으로 구분
   ═══════════════════════════════════════ */

export type SourceType = "airsupply-db" | "airsupply-supplier" | "api-external";

export type ScrapingStatus = "idle" | "scraping" | "done" | "failed";

export interface SourcedProduct {
  id: string;
  name: string;
  price: number;
  originalPrice?: number;
  brand: string;
  category: string;
  source: SourceType;
  platform?: string;           // 쿠팡, 네이버, 구글쇼핑
  platformUrl?: string;
  // 에어서플라이 DB 전용 필드
  purchaseCount?: number;      // 구매 횟수
  lastPurchasedAt?: string;    // 최근 구매일
  deliveryFee?: number;
  deliveryDays?: number;
  options?: string[];
  rating?: number;
  // 스크래핑 상태 (API 외부 상품용)
  scrapingStatus?: ScrapingStatus;
  scrapingProgress?: number;   // 0~100
  scrapingSteps?: { label: string; done: boolean }[];
  // 스크래핑 완료 후 채워지는 필드
  scrapedOptions?: string[];
  scrapedDeliveryFee?: number;
  scrapedDeliveryDays?: number;
  scrapedSpecs?: Record<string, string>;
  // AI 분석
  aiNote?: string;
  savingsPercent?: number;
  isRecommended?: boolean;
}

const sourceConfig: Record<SourceType, { label: string; color: string; bg: string; icon: React.ReactNode; description: string }> = {
  "airsupply-db": {
    label: "에어서플라이 DB",
    color: "#000",
    bg: "rgba(0,0,0,0.04)",
    icon: <Database size={11} strokeWidth={2} />,
    description: "최근 30일 구매 데이터 기반",
  },
  "airsupply-supplier": {
    label: "입점 공급사",
    color: "#777169",
    bg: "rgba(245,242,239,0.8)",
    icon: <Building2 size={11} strokeWidth={2} />,
    description: "에어서플라이 입점 공급사 직거래",
  },
  "api-external": {
    label: "외부 마켓",
    color: "#8a6f3f",
    bg: "rgba(138,111,63,0.08)",
    icon: <Globe size={11} strokeWidth={2} />,
    description: "네이버·쿠팡·구글쇼핑 API",
  },
};

const platformColors: Record<string, string> = {
  "쿠팡": "#e44d2e",
  "네이버쇼핑": "#03c75a",
  "구글쇼핑": "#4285f4",
};

function formatPrice(n: number) {
  return n.toLocaleString("ko-KR") + "원";
}

/* ─── 메인 카드 ─── */

interface SourcedProductCardProps {
  products: SourcedProduct[];
  onSelect: (product: SourcedProduct) => void;
  onAddToCart: (product: SourcedProduct) => void;
}

export default function SourcedProductCard({ products, onSelect, onAddToCart }: SourcedProductCardProps) {
  const PAGE_SIZE = 3;
  const totalPages = Math.ceil(products.length / PAGE_SIZE);
  const [page, setPage] = useState(0);
  const canPrev = page > 0;
  const canNext = page < totalPages - 1;
  const visible = products.slice(page * PAGE_SIZE, page * PAGE_SIZE + PAGE_SIZE);

  return (
    <div className="flex flex-col gap-2 mt-1">
      {/* AI 검색 헤더 + 페이지네이션 */}
      <div className="flex items-center justify-between">
        <div
          className="flex items-center gap-2 px-3 py-2 flex-1"
          style={{ borderRadius: "10px", backgroundColor: "rgba(245,242,239,0.6)" }}
        >
          <Sparkles size={12} strokeWidth={1.5} color="#6366f1" />
          <span className="text-[11px] font-medium text-[#000]" style={{ letterSpacing: "0.14px" }}>
            AI 추천 — {products.length}개 상품 비교
          </span>
        </div>
        {totalPages > 1 && (
          <div className="flex items-center gap-1 ml-2 shrink-0">
            <button
              onClick={() => setPage((p) => Math.max(0, p - 1))}
              disabled={!canPrev}
              className="flex items-center justify-center w-7 h-7 rounded-lg cursor-pointer transition-colors hover:bg-[#f5f5f5] disabled:opacity-30 disabled:cursor-default"
              aria-label="이전"
            >
              <ChevronLeft size={14} strokeWidth={1.5} color="#4e4e4e" />
            </button>
            <span className="text-[11px] text-[#777169] min-w-[32px] text-center" style={{ letterSpacing: "0.14px" }}>
              {page + 1}/{totalPages}
            </span>
            <button
              onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
              disabled={!canNext}
              className="flex items-center justify-center w-7 h-7 rounded-lg cursor-pointer transition-colors hover:bg-[#f5f5f5] disabled:opacity-30 disabled:cursor-default"
              aria-label="다음"
            >
              <ChevronRight size={14} strokeWidth={1.5} color="#4e4e4e" />
            </button>
          </div>
        )}
      </div>

      {/* 3열 카드 그리드 — 부모 폭에 맞게 유동 */}
      <div className="grid gap-2.5" style={{ gridTemplateColumns: `repeat(${Math.min(visible.length, 3)}, minmax(0, 240px))` }}>
      {visible.map((product) => {
        const sc = sourceConfig[product.source];
        const isApiProduct = product.source === "api-external";
        const isScraping = product.scrapingStatus === "scraping";
        const scrapeDone = product.scrapingStatus === "done";
        const platColor = product.platform ? platformColors[product.platform] ?? "#999" : "#999";

        return (
          <div
            key={product.id}
            className="relative flex flex-col overflow-hidden bg-white transition-all"
            style={{
              borderRadius: "14px",
              boxShadow: product.isRecommended
                ? "rgba(0,0,0,0.1) 0px 0px 0px 1.5px, rgba(78,50,23,0.04) 0px 4px 12px"
                : "rgba(0,0,0,0.06) 0px 0px 0px 1px, rgba(0,0,0,0.04) 0px 1px 2px",
            }}
          >
            {/* 상단 — 이미지 + 추천 뱃지 */}
            <div
              className="relative w-full h-[110px] flex items-center justify-center"
              style={{
                backgroundColor: product.isRecommended ? "rgba(245,242,239,0.6)" : "#f5f2ef",
              }}
            >
              <span className="text-[11px] font-medium text-[#777169]">{product.brand}</span>
              {product.isRecommended && (
                <span
                  className="absolute top-2 left-2 inline-flex items-center gap-1 px-2 py-[2px] text-[9px] font-semibold text-[#000]"
                  style={{ borderRadius: "6px", backgroundColor: "rgba(255,255,255,0.85)" }}
                >
                  <Zap size={9} strokeWidth={2} />AI 추천
                </span>
              )}
              {product.savingsPercent != null && product.savingsPercent > 0 && (
                <span
                  className="absolute top-2 right-2 inline-flex items-center gap-0.5 px-1.5 py-[2px] text-[9px] font-medium text-[#000]"
                  style={{ borderRadius: "6px", backgroundColor: "rgba(255,255,255,0.85)" }}
                >
                  <TrendingDown size={9} strokeWidth={2} />{product.savingsPercent}%
                </span>
              )}
            </div>

            {/* 본문 */}
            <div className="flex flex-col flex-1 p-3">
              {/* 소싱처 뱃지 줄 */}
              <div className="flex items-center gap-1.5 mb-2">
                <span
                  className="inline-flex items-center gap-1 px-1.5 py-[1.5px] text-[9px] font-medium rounded-full"
                  style={{ backgroundColor: sc.bg, color: sc.color }}
                >
                  {sc.icon}{sc.label}
                </span>
                {isApiProduct && product.platform && (
                  <span className="text-[9px] font-medium" style={{ color: platColor }}>{product.platform}</span>
                )}
                {!isApiProduct && (
                  <span className="inline-flex items-center gap-0.5 text-[9px] text-[#000] font-medium">
                    <ShieldCheck size={9} strokeWidth={2} />즉시
                  </span>
                )}
              </div>

              {/* 상품명 + 가격 */}
              <p className="text-[10px] text-[#777169]" style={{ letterSpacing: "0.14px" }}>{product.brand} · {product.category}</p>
              <p className="text-[12.5px] font-medium leading-[1.35] mt-0.5 line-clamp-2 flex-1" style={{ letterSpacing: "0.14px" }}>{product.name}</p>

              <div className="flex items-baseline gap-1.5 mt-1.5">
                <span className="text-[16px] font-bold" style={{ letterSpacing: "-0.3px" }}>{formatPrice(product.price)}</span>
                {product.originalPrice && product.originalPrice > product.price && (
                  <span className="text-[10px] text-[#b8b2a8] line-through">{formatPrice(product.originalPrice)}</span>
                )}
              </div>

              {/* 배송/구매 정보 — 컴팩트 */}
              <div className="flex flex-wrap gap-x-1.5 gap-y-0.5 mt-1.5 text-[9.5px] text-[#777169]" style={{ letterSpacing: "0.14px" }}>
                {!isApiProduct && (
                  <>
                    {product.deliveryFee != null && (
                      <span>배송{product.deliveryFee === 0 ? " 무료" : ` ${formatPrice(product.deliveryFee)}`}</span>
                    )}
                    {product.deliveryDays && <span>· {product.deliveryDays}일</span>}
                    {product.purchaseCount != null && <span>· {product.purchaseCount}회 구매</span>}
                    {product.options && product.options.length > 0 && <span>· 옵션 {product.options.length}종</span>}
                  </>
                )}
                {isApiProduct && !scrapeDone && !isScraping && (
                  <span className="text-[#b8b2a8] italic">선택 시 상세 수집</span>
                )}
                {isApiProduct && scrapeDone && (
                  <>
                    {product.scrapedDeliveryFee != null && (
                      <span>배송{product.scrapedDeliveryFee === 0 ? " 무료" : ` ${formatPrice(product.scrapedDeliveryFee)}`}</span>
                    )}
                    {product.scrapedDeliveryDays && <span>· {product.scrapedDeliveryDays}일</span>}
                    <span className="text-[#000] font-medium">✓ 수집완료</span>
                  </>
                )}
              </div>

              {/* 스크래핑 중 — 카드 내 인라인 프로그레스 */}
              {isApiProduct && isScraping && (
                <ScrapingIndicator
                  progress={product.scrapingProgress ?? 0}
                  steps={product.scrapingSteps ?? []}
                />
              )}

              {/* 스크래핑 완료 — 수집된 스펙 표시 */}
              {isApiProduct && scrapeDone && product.scrapedSpecs && (
                <div
                  className="mt-2 px-2.5 py-2"
                  style={{ borderRadius: "8px", backgroundColor: "rgba(245,242,239,0.6)" }}
                >
                  <div className="flex items-center gap-1 mb-1.5">
                    <Check size={10} strokeWidth={2.5} color="#000" />
                    <span className="text-[10px] font-medium text-[#000]">상세 수집 완료</span>
                  </div>
                  <div className="grid grid-cols-3 gap-1.5">
                    {Object.entries(product.scrapedSpecs).map(([key, val]) => (
                      <div key={key}>
                        <p className="text-[10px] text-[#b8b2a8]">{key}</p>
                        <p className="text-[12px] text-[#000] font-medium">{val}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* AI 코멘트 — 1줄 */}
              {product.aiNote && (
                <p className="text-[10px] text-[#4e4e4e] leading-[1.45] mt-2 line-clamp-2" style={{ letterSpacing: "0.14px" }}>
                  {product.aiNote}
                </p>
              )}

              {/* 액션 — 세로 적합하게 풀폭 */}
              <div className="flex gap-1.5 mt-auto pt-3">
                <button
                  onClick={() => onSelect(product)}
                  className="flex items-center justify-center gap-1 px-2 py-[6px] text-[10.5px] font-medium text-[#4e4e4e] cursor-pointer transition-colors hover:bg-[rgba(245,242,239,0.8)]"
                  style={{
                    borderRadius: "8px",
                    boxShadow: "rgba(0,0,0,0.06) 0px 0px 0px 1px",
                    letterSpacing: "0.14px",
                  }}
                >
                  <Eye size={10} strokeWidth={1.5} />
                  상세
                </button>
                <button
                  onClick={() => onAddToCart(product)}
                  className={`flex-1 flex items-center justify-center gap-1 px-2 py-[6px] text-[10.5px] font-medium cursor-pointer transition-opacity hover:opacity-85 ${
                    isApiProduct && !scrapeDone
                      ? "text-white bg-[#8a6f3f]"
                      : "text-white bg-[#000]"
                  }`}
                  style={{ borderRadius: "8px", letterSpacing: "0.14px" }}
                >
                  <ShoppingCart size={10} strokeWidth={1.5} />
                  {isApiProduct && !scrapeDone ? "선택" : "담기"}
                </button>
              </div>
            </div>
          </div>
        );
      })}
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════
   스크래핑 진행 표시기
   ═══════════════════════════════════════ */

function ScrapingIndicator({
  progress,
  steps,
}: {
  progress: number;
  steps: { label: string; done: boolean }[];
}) {
  return (
    <div className="mt-2">
      {/* 프로그레스 바 */}
      <div className="flex items-center gap-2 mb-1.5">
        <div className="flex-1 h-1.5 overflow-hidden" style={{ borderRadius: "3px", backgroundColor: "rgba(0,0,0,0.06)" }}>
          <div
            className="h-full transition-all duration-500"
            style={{
              width: `${progress}%`,
              backgroundColor: "#8a6f3f",
              borderRadius: "3px",
            }}
          />
        </div>
        <span className="text-[10px] font-medium text-[#8a6f3f] shrink-0">{progress}%</span>
      </div>

      {/* 단계 표시 */}
      <div className="flex flex-col gap-0.5">
        {steps.map((step, i) => (
          <div key={i} className="flex items-center gap-1.5">
            {step.done ? (
              <Check size={9} strokeWidth={2.5} color="#000" />
            ) : (
              <Loader2
                size={9}
                strokeWidth={2}
                color="#8a6f3f"
                className="animate-spin"
              />
            )}
            <span className={`text-[10px] ${step.done ? "text-[#777169]" : "text-[#8a6f3f] font-medium"}`}>
              {step.label}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
