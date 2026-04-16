"use client";

import { Search } from "lucide-react";
import type { SearchResultSummaryData } from "@/lib/types";

export default function SearchResultSummary({
  totalCount,
  priceRange,
  categoryPath,
  brands,
  thumbnails,
  remainingCount,
  specHints,
  companyPolicyNote,
}: SearchResultSummaryData) {
  return (
    <div
      className="w-full max-w-[620px] bg-white px-5 py-4"
      style={{
        borderRadius: "20px",
        boxShadow: "rgba(0,0,0,0.06) 0px 0px 0px 1px, rgba(0,0,0,0.04) 0px 1px 2px, rgba(0,0,0,0.04) 0px 2px 4px",
      }}
    >
      <div className="mb-4 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <span
            className="flex h-8 w-8 items-center justify-center rounded-full"
            style={{ backgroundColor: "rgba(245,242,239,0.8)", boxShadow: "rgba(78,50,23,0.04) 0px 6px 16px" }}
          >
            <Search size={14} strokeWidth={1.75} color="#000" />
          </span>
          <div>
            <p className="text-[15px] font-medium text-[#000]" style={{ letterSpacing: "0.16px" }}>
              1차 검색 완료
            </p>
            <p className="text-[11px] text-[#777169]" style={{ letterSpacing: "0.14px" }}>
              결과를 요약해봤어요
            </p>
          </div>
        </div>
        <span
          className="inline-flex items-center rounded-full px-3 py-1 text-[12px] font-medium text-[#4e3fb4]"
          style={{ backgroundColor: "rgba(78,63,180,0.08)", letterSpacing: "0.14px" }}
        >
          {totalCount}개 상품
        </span>
      </div>

      <div className="rounded-[16px] bg-[#f6f6f6] px-4 py-3 text-[13px] leading-[1.65] text-[#4e4e4e]" style={{ letterSpacing: "0.16px" }}>
        <strong className="text-[#000]">{categoryPath}</strong> 카테고리에서 상품을 찾았어요. 총 <strong className="text-[#000]">{totalCount}개</strong>를 확인했고, 가격 범위는 <strong className="text-[#000]">{priceRange.min.toLocaleString()}원 ~ {priceRange.max.toLocaleString()}원</strong>이에요. 리뷰 수와 구매 적합도를 우선으로 정리했어요.
      </div>

      <div className="mt-4 flex items-center gap-2 overflow-hidden">
        {thumbnails.slice(0, 5).map((thumb, idx) => (
          <div
            key={`${thumb}-${idx}`}
            className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-[14px] bg-[#f5f5f5] text-[11px] font-medium uppercase text-[#777169]"
            style={{ boxShadow: "rgba(0,0,0,0.08) 0px 0px 0px 0.5px" }}
          >
            {thumb}
          </div>
        ))}
        {remainingCount > 0 && (
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-[14px] bg-[rgba(245,242,239,0.85)] text-[13px] font-medium text-[#000]">
            +{remainingCount}
          </div>
        )}
      </div>

      <p className="mt-4 text-[12px] text-[#4e4e4e]" style={{ letterSpacing: "0.14px" }}>
        주요 브랜드 : <span className="text-[#000]">{brands.join(", ")}</span>
      </p>

      <div className="mt-3 flex flex-wrap gap-2">
        {specHints.map((hint) => (
          <div
            key={`${hint.label}-${hint.value}`}
            className="rounded-full px-3 py-1.5 text-[11px] text-[#4e4e4e]"
            style={{ backgroundColor: "#f6f6f6", letterSpacing: "0.14px" }}
          >
            <strong className="mr-1 text-[#000]">{hint.label}</strong>
            {hint.value}
          </div>
        ))}
      </div>

      <div
        className="mt-4 rounded-[16px] px-4 py-3"
        style={{
          backgroundColor: "rgba(78,63,180,0.05)",
          boxShadow: "inset 2px 0 0 #4e3fb4",
        }}
      >
        <p className="text-[12px] font-medium text-[#000]" style={{ letterSpacing: "0.14px" }}>
          로랩스 구매기준 적용
        </p>
        <p className="mt-1 text-[12px] leading-[1.55] text-[#4e4e4e]" style={{ letterSpacing: "0.14px" }}>
          {companyPolicyNote}
        </p>
      </div>
    </div>
  );
}
