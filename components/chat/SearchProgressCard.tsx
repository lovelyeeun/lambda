"use client";

import { BriefcaseBusiness, Check, Loader2, Search, Sparkles, Zap } from "lucide-react";
import type { SearchStepState } from "@/lib/types";

interface SearchProgressCardProps {
  currentStep: SearchStepState;
  counts?: number[];
  totalCount?: number;
}

const steps = [
  { label: "검색 키워드 생성 중", countLabel: "추천 키워드", color: "#6366f1", icon: Sparkles },
  { label: "최적 카테고리 탐색 중", countLabel: "카테고리 후보", color: "#059669", icon: Search },
  { label: "회사 구매기준 확인하기", countLabel: "구매 기준 반영", color: "#8b5cf6", icon: BriefcaseBusiness },
] as const;

export default function SearchProgressCard({ currentStep, counts = [0, 0, 0], totalCount = 0 }: SearchProgressCardProps) {
  return (
    <div
      className="w-full max-w-[356px] bg-white px-3 py-2.5"
      style={{
        borderRadius: "16px 16px 16px 4px",
        boxShadow: "rgba(0,0,0,0.06) 0px 0px 0px 1px, rgba(0,0,0,0.04) 0px 1px 2px",
      }}
    >
      <div className="mb-2 flex items-center gap-1.5">
        <Search size={15} strokeWidth={1.75} color="#4e4e4e" />
        <p className="text-[12px] font-medium text-[#000]" style={{ letterSpacing: "0.12px" }}>
          데이터소스 검색
        </p>
      </div>

      <div className="flex flex-col">
        {steps.map((step, idx) => {
          const stepNumber = idx + 1;
          const isDone = currentStep === 3 || stepNumber < currentStep;
          const isActive = currentStep !== 3 && stepNumber === currentStep;
          const Icon = step.icon;

          return (
            <div key={step.label} className="flex items-start gap-2 py-1">
              <div className="flex w-6 flex-col items-center">
                <div
                  className="flex h-[22px] w-[22px] items-center justify-center rounded-full"
                  style={{
                    backgroundColor: isDone
                      ? "rgba(225, 245, 233, 0.95)"
                      : isActive
                        ? "#4e3fb4"
                        : "rgba(245,242,239,0.8)",
                  }}
                >
                  {isDone ? (
                    <Check size={13} strokeWidth={2.4} color="#059669" />
                  ) : isActive ? (
                    <Loader2 size={12} strokeWidth={2.1} color="#ffffff" className="animate-spin" />
                  ) : (
                    <span className="text-[10px] font-medium text-[#777169]">{stepNumber}</span>
                  )}
                </div>

                {idx < steps.length - 1 && (
                  <div className="mt-1 h-4 w-px bg-[rgba(0,0,0,0.06)]" />
                )}
              </div>

              <div className="flex min-h-[22px] flex-1 items-center justify-between pt-[1px]">
                <div className="flex items-center gap-1.5">
                  <Icon
                    size={12}
                    strokeWidth={1.9}
                    color={isDone || isActive ? step.color : "#777169"}
                  />
                  <p
                    className={isActive ? "animate-pulse" : ""}
                    style={{
                      color: isDone || isActive ? "#2f2f2f" : "#777169",
                      fontWeight: 500,
                      letterSpacing: "0.12px",
                      lineHeight: 1.4,
                      fontSize: "11px",
                    }}
                  >
                    {step.label}
                  </p>
                </div>
                {isDone && (
                  <span className="text-[10px] font-medium" style={{ color: step.color, letterSpacing: "0.12px" }}>
                    {counts[idx]?.toLocaleString()}건
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {currentStep === 3 && (
        <div className="mt-2 border-t border-[rgba(0,0,0,0.04)] pt-2">
          <p className="flex items-center gap-1.5 text-[10px] font-medium text-[#6366f1]" style={{ letterSpacing: "0.12px" }}>
            <Zap size={11} strokeWidth={2} />
            총 {totalCount.toLocaleString()}개 상품 발견 — 비교 분석 완료
          </p>
        </div>
      )}
    </div>
  );
}
