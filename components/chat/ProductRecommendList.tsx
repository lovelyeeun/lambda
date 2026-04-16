"use client";

import { useMemo, useState } from "react";
import { ArrowUpRight, Check, Loader2, ShieldCheck, Sparkles, Star, TrendingDown } from "lucide-react";
import type { RecommendedProduct } from "@/lib/types";
import type { SourcedProduct } from "./SourcedProductCard";

interface ProductRecommendListProps {
  products: RecommendedProduct[];
  onSelectProduct: (product: RecommendedProduct) => void;
  onOpenPriceCompare: (product: RecommendedProduct) => void;
  onOpenReviews: (product: RecommendedProduct) => void;
  scrapingProduct?: SourcedProduct | null;
}

type ViewMode = "recommend" | "compare";

export default function ProductRecommendList({
  products,
  onSelectProduct,
  onOpenPriceCompare,
  onOpenReviews,
  scrapingProduct,
}: ProductRecommendListProps) {
  const [viewMode, setViewMode] = useState<ViewMode>("recommend");
  const [expandedReasonIds, setExpandedReasonIds] = useState<string[]>([]);
  const compareRows = Array.from(
    new Set([
      "가격",
      ...products.flatMap((product) => Object.keys(product.specs ?? {})),
      "출처",
      "별점",
    ]),
  );
  const expandedReasonSet = useMemo(() => new Set(expandedReasonIds), [expandedReasonIds]);

  const toggleReason = (productId: string) => {
    setExpandedReasonIds((prev) =>
      prev.includes(productId) ? prev.filter((id) => id !== productId) : [...prev, productId],
    );
  };

  return (
    <div className="w-full">
      <div className="mb-4 flex items-center justify-between gap-3">
        <div>
          <p className="text-[16px] font-medium text-[#000]" style={{ letterSpacing: "0.16px" }}>
            로랩스에 맞는 추천 결과예요
          </p>
          <p className="text-[11px] text-[#777169]" style={{ letterSpacing: "0.14px" }}>
            추천 이유와 가격 비교를 함께 볼 수 있어요
          </p>
        </div>
        <div className="flex rounded-full bg-[#f6f6f6] p-1">
          {[
            { key: "recommend", label: "추천순" },
            { key: "compare", label: "스펙 비교" },
          ].map((mode) => {
            const active = viewMode === mode.key;
            return (
              <button
                key={mode.key}
                onClick={() => setViewMode(mode.key as ViewMode)}
                className="cursor-pointer rounded-full px-3 py-1.5 text-[12px]"
                style={{
                  backgroundColor: active ? "#fff" : "transparent",
                  boxShadow: active ? "rgba(0,0,0,0.08) 0px 0px 0px 0.5px" : undefined,
                  color: active ? "#000" : "#777169",
                  letterSpacing: "0.14px",
                }}
              >
                {mode.label}
              </button>
            );
          })}
        </div>
      </div>

      {viewMode === "recommend" ? (
        <div className="overflow-x-auto pb-3 pt-1">
          <div className="flex min-w-max gap-3 pl-1 pr-5">
            {products.map((product) => {
              const isTop = product.rank === 1;
              const isScrapingTarget = scrapingProduct?.id === product.id && product.source === "external";
              const isExternal = product.source === "external";
              const isReasonExpanded = expandedReasonSet.has(product.id);
              const compactReason = product.aiReason.split(/[.!?]\s|[.!?]$/)[0] || product.aiReason;
              return (
                <div key={product.id} className="flex shrink-0 flex-col" style={{ width: isTop ? 220 : 196 }}>
                  <div
                    className="flex flex-col overflow-hidden bg-white"
                    style={{
                      borderRadius: "14px",
                      boxShadow: isTop
                        ? "rgba(0,0,0,0.1) 0px 0px 0px 1.5px, rgba(78,50,23,0.04) 0px 4px 12px"
                        : "rgba(0,0,0,0.06) 0px 0px 0px 1px, rgba(0,0,0,0.04) 0px 1px 2px",
                    }}
                  >
                    <div
                      className="relative flex h-[110px] items-center justify-center"
                      style={{ backgroundColor: isTop ? "rgba(245,242,239,0.6)" : "#f5f2ef" }}
                    >
                      <div className="absolute left-3 top-3 flex h-5 w-5 items-center justify-center rounded-full bg-black text-[10px] font-medium text-white">
                        {product.rank}
                      </div>
                      {isTop && (
                        <span
                          className="absolute left-9 top-3 inline-flex items-center gap-1 px-2 py-[2px] text-[9px] font-semibold text-[#000]"
                          style={{ borderRadius: "6px", backgroundColor: "rgba(255,255,255,0.85)" }}
                        >
                          <Sparkles size={9} strokeWidth={2} />
                          AI 추천
                        </span>
                      )}
                      {product.rank <= 2 && (
                        <span
                          className="absolute right-3 top-3 inline-flex items-center gap-0.5 px-1.5 py-[2px] text-[9px] font-medium text-[#000]"
                          style={{ borderRadius: "6px", backgroundColor: "rgba(255,255,255,0.85)" }}
                        >
                          <TrendingDown size={9} strokeWidth={2} />
                          상위권
                        </span>
                      )}
                      <div className="flex h-full items-center justify-center text-[18px] font-medium text-[#777169]">{product.thumbUrl}</div>
                      <div
                        className="absolute bottom-3 right-3 rounded-full px-2 py-1 text-[10px]"
                        style={{
                          backgroundColor: product.source === "internal" ? "rgba(0,0,0,0.06)" : "rgba(78,63,180,0.08)",
                          color: product.source === "internal" ? "#000" : "#4e3fb4",
                          letterSpacing: "0.14px",
                        }}
                      >
                        {product.source === "internal" ? "자체" : "외부"}
                      </div>
                    </div>

                    <div className="flex flex-1 flex-col p-3">
                      <div className="mb-2 flex items-center gap-1.5">
                        <span
                          className="inline-flex items-center gap-1 rounded-full px-1.5 py-[1.5px] text-[9px] font-medium"
                          style={{
                            backgroundColor: isExternal ? "rgba(138,111,63,0.08)" : "rgba(0,0,0,0.04)",
                            color: isExternal ? "#8a6f3f" : "#000",
                          }}
                        >
                          {isExternal ? "외부 마켓" : "자체 추천"}
                        </span>
                        {!isExternal && (
                          <span className="inline-flex items-center gap-0.5 text-[9px] font-medium text-[#000]">
                            <ShieldCheck size={9} strokeWidth={2} />
                            즉시
                          </span>
                        )}
                      </div>
                      <p className="text-[10px] text-[#777169]" style={{ letterSpacing: "0.14px" }}>{product.brand} · {product.category}</p>
                      <p className="mt-1 line-clamp-2 text-[13px] font-medium leading-[1.45] text-[#000]" style={{ letterSpacing: "0.14px" }}>
                        {product.name}
                      </p>
                      <div className="mt-2 flex items-center justify-between gap-2">
                        <p className="text-[16px] font-semibold text-[#000]" style={{ letterSpacing: "-0.2px" }}>
                          {product.price.toLocaleString()}원
                        </p>
                        {isExternal && (
                          <button
                            onClick={() => onOpenPriceCompare(product)}
                            className="inline-flex cursor-pointer items-center gap-1 rounded-full px-2.5 py-1 text-[10px] font-medium text-[#15803d]"
                            style={{ backgroundColor: "rgba(34,197,94,0.08)", letterSpacing: "0.14px" }}
                          >
                            최저가
                            <ArrowUpRight size={10} strokeWidth={2} />
                          </button>
                        )}
                      </div>
                      <button
                        onClick={() => onOpenReviews(product)}
                        className="mt-1 flex items-center gap-1 text-[11px] text-[#777169] underline-offset-2 hover:text-[#000] hover:underline"
                      >
                        <Star size={11} fill="currentColor" />
                        {product.rating.toFixed(1)} · 리뷰 {product.reviewCount.toLocaleString()}
                      </button>
                      <div className="mt-1 flex flex-wrap gap-x-1.5 gap-y-0.5 text-[9.5px] text-[#777169]" style={{ letterSpacing: "0.14px" }}>
                        <span>{isExternal ? "비교가 가능" : "구매 기준 반영"}</span>
                        <span>·</span>
                        <span>{product.aiTags[0] ?? "추천"}</span>
                      </div>
                      <div className="mt-2 rounded-[10px] bg-[#faf8f5] px-2.5 py-2">
                        <div className="flex items-start justify-between gap-2">
                          <div className="min-w-0">
                            <p className="text-[10px] font-medium text-[#777169]" style={{ letterSpacing: "0.14px" }}>
                              추천 포인트
                            </p>
                            <p className="mt-1 text-[11px] leading-[1.5] text-[#4e4e4e]" style={{ letterSpacing: "0.14px" }}>
                              {compactReason}
                            </p>
                          </div>
                          <button
                            onClick={() => toggleReason(product.id)}
                            className="shrink-0 text-[10px] font-medium text-[#4e3fb4] cursor-pointer"
                          >
                            {isReasonExpanded ? "접기" : "더 보기"}
                          </button>
                        </div>
                        <div className="mt-2 flex flex-wrap gap-1">
                          {product.aiTags.slice(0, 2).map((tag) => (
                            <span
                              key={tag}
                              className="rounded-full px-2 py-1 text-[10px] text-[#4e3fb4]"
                              style={{ backgroundColor: "rgba(78,63,180,0.08)", letterSpacing: "0.14px" }}
                            >
                              {tag}
                            </span>
                          ))}
                        </div>
                        {isReasonExpanded && (
                          <div
                            className="mt-2 rounded-[8px] bg-white px-2.5 py-2 text-[11px] leading-[1.6] text-[#4e4e4e]"
                            style={{ boxShadow: "rgba(0,0,0,0.04) 0px 0px 0px 1px" }}
                          >
                            {product.aiReason}
                          </div>
                        )}
                      </div>

                      <button onClick={() => onSelectProduct(product)} className="mt-3 w-full cursor-pointer rounded-full bg-black px-3 py-2.5 text-[12px] text-white">상세 보기</button>
                    </div>
                  </div>

                  {isScrapingTarget && (
                    <div
                      className="mt-2 rounded-[16px] bg-white px-3 py-3"
                      style={{
                        boxShadow: "rgba(234,88,12,0.12) 0px 0px 0px 1px, rgba(78,50,23,0.04) 0px 4px 12px",
                        backgroundColor: "rgba(255,255,255,0.98)",
                      }}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <span
                            className="inline-flex items-center gap-1 rounded-full px-2 py-1 text-[10px] font-medium text-[#ea580c]"
                            style={{ backgroundColor: "rgba(234,88,12,0.08)" }}
                          >
                            외부 마켓
                          </span>
                          <span className="text-[12px] font-medium text-[#ea580c]">
                            {scrapingProduct?.platform ?? "외부"}
                          </span>
                        </div>
                        <span className="text-[11px] text-[#b8b2a8]">
                          {scrapingProduct?.scrapingProgress ?? 0}%
                        </span>
                      </div>

                      {scrapingProduct?.scrapingStatus === "scraping" && (
                        <>
                          <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-[rgba(0,0,0,0.06)]">
                            <div
                              className="h-full transition-all duration-500"
                              style={{
                                width: `${scrapingProduct.scrapingProgress ?? 0}%`,
                                background: "linear-gradient(90deg, #ea580c, #f59e0b)",
                                borderRadius: "9999px",
                              }}
                            />
                          </div>
                          <div className="mt-3 flex flex-col gap-2">
                            {(scrapingProduct.scrapingSteps ?? []).map((step) => (
                              <div key={step.label} className="flex items-center gap-2">
                                {step.done ? (
                                  <Check size={12} strokeWidth={2.5} color="#000" />
                                ) : (
                                  <Loader2 size={12} strokeWidth={2} color="#ea580c" className="animate-spin" />
                                )}
                                <span
                                  className="text-[11px]"
                                  style={{
                                    color: step.done ? "#4e4e4e" : "#ea580c",
                                    fontWeight: step.done ? 400 : 500,
                                    letterSpacing: "0.14px",
                                  }}
                                >
                                  {step.label}
                                </span>
                              </div>
                            ))}
                          </div>
                        </>
                      )}

                      {scrapingProduct?.scrapingStatus === "done" && scrapingProduct.scrapedSpecs && (
                        <>
                          <div className="mt-1 flex items-center gap-2">
                            <Check size={13} strokeWidth={2.5} color="#000" />
                            <span className="text-[12px] font-medium text-[#000]" style={{ letterSpacing: "0.14px" }}>
                              상세 정보 수집 완료
                            </span>
                          </div>
                          <p className="mt-3 text-[11px] text-[#777169]" style={{ letterSpacing: "0.14px" }}>
                            {product.name}
                          </p>
                          <div className="mt-3 grid grid-cols-3 gap-3">
                            {Object.entries(scrapingProduct.scrapedSpecs).slice(0, 3).map(([key, value]) => (
                              <div key={key}>
                                <p className="text-[10px] text-[#b8b2a8]">{key}</p>
                                <p className="mt-0.5 text-[13px] font-medium text-[#000]">{value}</p>
                              </div>
                            ))}
                          </div>
                        </>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-[640px] border-separate border-spacing-0 text-left">
            <thead>
              <tr>
                <th className="sticky left-0 bg-white px-3 py-2 text-[11px] text-[#777169]">항목</th>
                {products.map((product) => (
                  <th key={product.id} className="px-3 py-2 text-[11px] font-medium text-[#000]">{product.name}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {compareRows.map((row) => (
                <tr key={row}>
                  <td className="sticky left-0 bg-white px-3 py-2 text-[11px] text-[#777169]">{row}</td>
                  {products.map((product) => {
                    const specs = product.specs ?? {};
                    const value = row === "가격"
                      ? `${product.price.toLocaleString()}원`
                      : row === "출처"
                        ? product.source === "internal" ? "자체" : "외부"
                        : row === "별점"
                          ? product.rating.toFixed(1)
                          : specs[row] ?? "-";
                    return (
                      <td key={`${product.id}-${row}`} className="px-3 py-2 text-[11px] text-[#4e4e4e]">
                        {value}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
