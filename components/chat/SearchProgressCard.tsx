"use client";

import { Check, Loader2 } from "lucide-react";
import type { SearchStepState } from "@/lib/types";

interface SearchProgressCardProps {
  currentStep: SearchStepState;
  counts?: number[];
  totalCount?: number;
}

const steps = [
  "검색 키워드 생성 중",
  "최적 카테고리 탐색 중",
  "회사 구매기준 확인하기",
] as const;

export default function SearchProgressCard({ currentStep, counts = [0, 0, 0], totalCount = 0 }: SearchProgressCardProps) {
  return (
    <div
      className="w-full max-w-[390px] bg-white px-3.5 py-3.5"
      style={{
        borderRadius: "16px",
        boxShadow: "rgba(0,0,0,0.06) 0px 0px 0px 1px, rgba(0,0,0,0.04) 0px 1px 2px, rgba(0,0,0,0.04) 0px 2px 4px",
      }}
    >
      <div className="mb-3 flex items-center gap-2">
        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[rgba(245,242,239,0.8)]">
          <div className="h-3.5 w-3.5 rounded-full border border-[rgba(0,0,0,0.4)]" />
        </div>
        <p className="text-[15px] font-medium text-[#000]" style={{ letterSpacing: "0.16px" }}>
          데이터소스 검색
        </p>
      </div>

      <div className="flex flex-col">
        {steps.map((label, idx) => {
          const stepNumber = idx + 1;
          const isDone = currentStep === 3 || stepNumber < currentStep;
          const isActive = currentStep !== 3 && stepNumber === currentStep;

          return (
            <div key={label} className="flex items-center gap-3 py-1.5">
              <div className="flex w-7 flex-col items-center">
                <div
                  className="flex h-[22px] w-[22px] items-center justify-center rounded-full"
                  style={{
                    backgroundColor: isDone ? "rgba(34,197,94,0.14)" : isActive ? "#4e3fb4" : "rgba(0,0,0,0.06)",
                    color: isDone ? "#15803d" : isActive ? "#fff" : "#777169",
                  }}
                >
                  {isDone ? (
                    <Check size={12} strokeWidth={2.5} />
                  ) : isActive ? (
                    <Loader2 size={12} strokeWidth={2} className="animate-spin" />
                  ) : (
                    <span className="text-[10px] font-semibold">{stepNumber}</span>
                  )}
                </div>
              </div>

              <div className="flex flex-1 items-center justify-between border-b border-[rgba(0,0,0,0.04)] pb-3 last:border-b-0 last:pb-0">
                <p
                  className={`text-[13px] ${isActive ? "animate-pulse" : ""}`}
                  style={{
                    color: isDone || isActive ? "#000" : "#777169",
                    fontWeight: isDone || isActive ? 500 : 400,
                    letterSpacing: "0.16px",
                    lineHeight: 1.45,
                  }}
                >
                  {label}
                </p>
                {isDone && (
                  <span className="text-[12px] font-medium text-[#4e3fb4]" style={{ letterSpacing: "0.14px" }}>
                    {counts[idx]?.toLocaleString()}건
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {currentStep === 3 && (
        <div className="mt-3 border-t border-[rgba(0,0,0,0.04)] pt-3">
          <p className="text-[12px] font-medium text-[#4e3fb4]" style={{ letterSpacing: "0.16px" }}>
            총 {totalCount.toLocaleString()}개 상품 발견 — 비교 분석 완료
          </p>
        </div>
      )}
    </div>
  );
}
