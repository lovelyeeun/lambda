"use client";

import { Zap } from "lucide-react";
import { PlannedTooltip } from "@/components/ui/Tooltip";

export default function PersonalPlan() {
  const used = 342;
  const total = 500;
  const percent = Math.round((used / total) * 100);

  return (
    <div className="max-w-[480px]">
      <h2 className="text-[18px] font-semibold mb-6" style={{ letterSpacing: "-0.2px" }}>플랜(사용량)</h2>

      {/* Current plan card */}
      <div
        className="p-5 mb-6"
        style={{
          borderRadius: "16px",
          background: "linear-gradient(135deg, #111 0%, #333 100%)",
          color: "#fff",
        }}
      >
        <div className="flex items-center gap-2 mb-2">
          <Zap size={16} strokeWidth={1.5} />
          <span className="text-[13px] font-medium opacity-70">현재 플랜</span>
        </div>
        <p className="text-[22px] font-semibold">Pro Plan</p>
        <p className="text-[13px] opacity-60 mt-1">월 499,000원 · 팀원 무제한 · 500 작업/월</p>
      </div>

      {/* Usage */}
      <div
        className="p-5 mb-6"
        style={{ borderRadius: "14px", boxShadow: "rgba(0,0,0,0.06) 0px 0px 0px 1px" }}
      >
        <p className="text-[13px] text-[#777] mb-3">이번 달 사용량</p>

        <div className="flex items-end justify-between mb-2">
          <p className="text-[28px] font-semibold" style={{ letterSpacing: "-0.5px" }}>
            {used}<span className="text-[16px] text-[#999] font-normal">/{total} 작업</span>
          </p>
          <span className="text-[13px] font-medium" style={{ color: percent > 80 ? "#f59e0b" : "#22c55e" }}>
            {percent}%
          </span>
        </div>

        {/* Progress bar */}
        <div className="h-2.5 bg-[#f5f5f5] rounded-full overflow-hidden mb-3">
          <div
            className="h-full rounded-full transition-all"
            style={{
              width: `${percent}%`,
              backgroundColor: percent > 80 ? "#f59e0b" : "#000",
            }}
          />
        </div>

        <p className="text-[12px] text-[#999] leading-[1.5]">
          작업에는 AI 상담, 주문 처리, 견적 비교, 지출 분석 등이 포함됩니다.
          매월 1일에 초기화됩니다.
        </p>
      </div>

      {/* Usage breakdown */}
      <div
        className="p-4 mb-6"
        style={{ borderRadius: "12px", boxShadow: "rgba(0,0,0,0.06) 0px 0px 0px 1px" }}
      >
        <p className="text-[12px] text-[#999] mb-3">작업 유형별</p>
        <div className="flex flex-col gap-2 text-[13px]">
          <div className="flex justify-between"><span className="text-[#444]">AI 상담</span><span className="text-[#777]">187 작업</span></div>
          <div className="flex justify-between"><span className="text-[#444]">주문 처리</span><span className="text-[#777]">89 작업</span></div>
          <div className="flex justify-between"><span className="text-[#444]">견적/분석</span><span className="text-[#777]">42 작업</span></div>
          <div className="flex justify-between"><span className="text-[#444]">기타</span><span className="text-[#777]">24 작업</span></div>
        </div>
      </div>

      {/* Upgrade */}
      <PlannedTooltip description="플랜 변경" position="right">
        <button className="px-5 py-[9px] text-[14px] font-medium text-[#4e4e4e] bg-[#f5f5f5] rounded-xl cursor-pointer hover:bg-[#ebebeb] transition-colors">
          업그레이드
        </button>
      </PlannedTooltip>
    </div>
  );
}
