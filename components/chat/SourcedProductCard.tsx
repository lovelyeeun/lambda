"use client";

import { useState, useEffect } from "react";
import {
  Eye, ShoppingCart, Sparkles, Check, ExternalLink,
  Database, Building2, Globe, Zap, Loader2, ShieldCheck,
  TrendingDown, RefreshCw, Clock, ChevronDown, ChevronUp,
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
    color: "#6366f1",
    bg: "rgba(99,102,241,0.06)",
    icon: <Database size={11} strokeWidth={2} />,
    description: "최근 30일 구매 데이터 기반",
  },
  "airsupply-supplier": {
    label: "입점 공급사",
    color: "#059669",
    bg: "rgba(5,150,105,0.06)",
    icon: <Building2 size={11} strokeWidth={2} />,
    description: "에어서플라이 입점 공급사 직거래",
  },
  "api-external": {
    label: "외부 마켓",
    color: "#ea580c",
    bg: "rgba(234,88,12,0.06)",
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
  const [expandedId, setExpandedId] = useState<string | null>(null);

  return (
    <div className="flex flex-col gap-2 mt-1">
      {/* AI 검색 헤더 */}
      <div
        className="flex items-center gap-2 px-3 py-2"
        style={{ borderRadius: "10px", backgroundColor: "rgba(99,102,241,0.04)" }}
      >
        <Sparkles size={12} strokeWidth={1.5} color="#6366f1" />
        <span className="text-[11px] font-medium text-[#6366f1]">3개 데이터소스에서 {products.length}개 상품을 찾았습니다</span>
      </div>

      {products.map((product) => {
        const sc = sourceConfig[product.source];
        const isExpanded = expandedId === product.id;
        const isApiProduct = product.source === "api-external";
        const isScraping = product.scrapingStatus === "scraping";
        const scrapeDone = product.scrapingStatus === "done";
        const platColor = product.platform ? platformColors[product.platform] ?? "#999" : "#999";

        return (
          <div
            key={product.id}
            className="relative overflow-hidden bg-white transition-all"
            style={{
              borderRadius: "14px",
              boxShadow: product.isRecommended
                ? "rgba(99,102,241,0.15) 0px 0px 0px 1.5px, rgba(99,102,241,0.06) 0px 4px 12px"
                : "rgba(0,0,0,0.06) 0px 0px 0px 1px, rgba(0,0,0,0.04) 0px 1px 2px",
            }}
          >
            {/* 추천 뱃지 */}
            {product.isRecommended && (
              <div className="flex items-center gap-1 px-3 py-1.5" style={{ backgroundColor: "rgba(99,102,241,0.04)" }}>
                <Zap size={10} strokeWidth={2} color="#6366f1" />
                <span className="text-[10px] font-semibold text-[#6366f1]">AI 추천</span>
              </div>
            )}

            <div className="p-3">
              {/* 소싱처 뱃지 */}
              <div className="flex items-center gap-2 mb-2">
                <span
                  className="inline-flex items-center gap-1 px-2 py-[2px] text-[10px] font-medium rounded-full"
                  style={{ backgroundColor: sc.bg, color: sc.color }}
                >
                  {sc.icon}{sc.label}
                </span>
                {isApiProduct && product.platform && (
                  <span
                    className="inline-flex items-center gap-1 px-1.5 py-[2px] text-[10px] font-medium rounded"
                    style={{ color: platColor, backgroundColor: `${platColor}10` }}
                  >
                    {product.platform}
                  </span>
                )}
                {!isApiProduct && (
                  <span className="inline-flex items-center gap-1 text-[10px] text-[#22c55e] font-medium">
                    <ShieldCheck size={10} strokeWidth={2} />즉시 구매
                  </span>
                )}
                {product.savingsPercent != null && product.savingsPercent > 0 && (
                  <span className="inline-flex items-center gap-0.5 text-[10px] font-medium text-[#6366f1] ml-auto">
                    <TrendingDown size={10} strokeWidth={2} />{product.savingsPercent}% 절감
                  </span>
                )}
              </div>

              {/* 상품 정보 */}
              <div className="flex gap-3">
                <div
                  className="w-14 h-14 shrink-0 bg-[#f8f8f8] flex items-center justify-center text-[9px] text-[#bbb]"
                  style={{ borderRadius: "8px" }}
                >
                  {product.brand}
                </div>

                <div className="flex-1 min-w-0">
                  <p className="text-[11px] text-[#999]">{product.brand} · {product.category}</p>
                  <p className="text-[13px] font-medium leading-tight mt-0.5 line-clamp-2">{product.name}</p>

                  <div className="flex items-baseline gap-2 mt-1">
                    <p className="text-[15px] font-bold">{formatPrice(product.price)}</p>
                    {product.originalPrice && product.originalPrice > product.price && (
                      <p className="text-[11px] text-[#bbb] line-through">{formatPrice(product.originalPrice)}</p>
                    )}
                  </div>

                  {/* 에어서플라이 DB 추가 정보 */}
                  {!isApiProduct && (
                    <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                      {product.deliveryFee != null && (
                        <span className="text-[10px] text-[#999]">
                          배송비 {product.deliveryFee === 0 ? "무료" : formatPrice(product.deliveryFee)}
                        </span>
                      )}
                      {product.deliveryDays && (
                        <span className="text-[10px] text-[#999]">· {product.deliveryDays}일 내 도착</span>
                      )}
                      {product.purchaseCount != null && (
                        <span className="text-[10px] text-[#999]">· 최근 {product.purchaseCount}회 구매</span>
                      )}
                      {product.options && product.options.length > 0 && (
                        <span className="text-[10px] text-[#999]">· 옵션 {product.options.length}종</span>
                      )}
                    </div>
                  )}

                  {/* API 상품 — 스크래핑 전 제한 정보 표시 */}
                  {isApiProduct && !scrapeDone && !isScraping && (
                    <div className="mt-1.5">
                      <div className="flex items-center gap-3 text-[10px] text-[#bbb]">
                        <span>배송비 —</span>
                        <span>옵션 —</span>
                        <span>상세 —</span>
                      </div>
                      <p className="text-[10px] text-[#ccc] mt-1 italic">상품 선택 시 상세 정보를 수집합니다</p>
                    </div>
                  )}

                  {/* API 상품 — 스크래핑 중 */}
                  {isApiProduct && isScraping && (
                    <ScrapingIndicator
                      progress={product.scrapingProgress ?? 0}
                      steps={product.scrapingSteps ?? []}
                    />
                  )}

                  {/* API 상품 — 스크래핑 완료 */}
                  {isApiProduct && scrapeDone && (
                    <div className="mt-1.5">
                      <div className="flex items-center gap-2 flex-wrap text-[10px] text-[#999]">
                        {product.scrapedDeliveryFee != null && (
                          <span>배송비 {product.scrapedDeliveryFee === 0 ? "무료" : formatPrice(product.scrapedDeliveryFee)}</span>
                        )}
                        {product.scrapedDeliveryDays && <span>· {product.scrapedDeliveryDays}일 내 도착</span>}
                        {product.scrapedOptions && <span>· 옵션 {product.scrapedOptions.length}종</span>}
                      </div>
                      <div className="flex items-center gap-1 mt-1">
                        <Check size={10} strokeWidth={2} color="#22c55e" />
                        <span className="text-[10px] text-[#22c55e] font-medium">상세 정보 수집 완료</span>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* AI 코멘트 */}
              {product.aiNote && (
                <div className="flex items-start gap-1.5 mt-2.5 px-2.5 py-2" style={{ borderRadius: "8px", backgroundColor: "rgba(99,102,241,0.03)" }}>
                  <Sparkles size={10} strokeWidth={1.5} color="#6366f1" className="mt-[1px] shrink-0" />
                  <p className="text-[11px] text-[#666] leading-[1.5]">{product.aiNote}</p>
                </div>
              )}

              {/* 액션 */}
              <div className="flex gap-1.5 mt-2.5">
                {isApiProduct && product.platformUrl && !scrapeDone && (
                  <button
                    className="flex items-center gap-1 px-2.5 py-1.5 text-[11px] font-medium text-[#555] bg-[#f5f5f5] rounded-lg cursor-pointer transition-colors hover:bg-[#eee]"
                  >
                    <ExternalLink size={11} strokeWidth={1.5} />
                    원본 링크
                  </button>
                )}
                <button
                  onClick={() => onSelect(product)}
                  className="flex items-center gap-1 px-2.5 py-1.5 text-[11px] font-medium text-[#555] bg-[#f5f5f5] rounded-lg cursor-pointer transition-colors hover:bg-[#eee]"
                >
                  <Eye size={11} strokeWidth={1.5} />
                  상세보기
                </button>
                <button
                  onClick={() => onAddToCart(product)}
                  className={`flex items-center gap-1 px-3 py-1.5 text-[11px] font-medium rounded-lg cursor-pointer transition-opacity hover:opacity-80 ${
                    isApiProduct && !scrapeDone
                      ? "text-white bg-[#ea580c]"
                      : "text-white bg-[#1a1a1a]"
                  }`}
                >
                  <ShoppingCart size={11} strokeWidth={1.5} />
                  {isApiProduct && !scrapeDone ? "선택하기" : "장바구니"}
                </button>
              </div>
            </div>
          </div>
        );
      })}
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
        <div className="flex-1 h-1.5 bg-[#f0f0f0] overflow-hidden" style={{ borderRadius: "3px" }}>
          <div
            className="h-full transition-all duration-500"
            style={{
              width: `${progress}%`,
              background: "linear-gradient(90deg, #ea580c, #f59e0b)",
              borderRadius: "3px",
            }}
          />
        </div>
        <span className="text-[10px] font-medium text-[#ea580c] shrink-0">{progress}%</span>
      </div>

      {/* 단계 표시 */}
      <div className="flex flex-col gap-0.5">
        {steps.map((step, i) => (
          <div key={i} className="flex items-center gap-1.5">
            {step.done ? (
              <Check size={9} strokeWidth={2.5} color="#22c55e" />
            ) : (
              <Loader2
                size={9}
                strokeWidth={2}
                color="#ea580c"
                className="animate-spin"
              />
            )}
            <span className={`text-[10px] ${step.done ? "text-[#999]" : "text-[#ea580c] font-medium"}`}>
              {step.label}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
