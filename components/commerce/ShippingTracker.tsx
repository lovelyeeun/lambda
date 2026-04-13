"use client";

import { Check, Package, Truck, Home, RotateCcw, ThumbsUp } from "lucide-react";

export type ShippingStep = "접수" | "준비" | "배송중" | "배송완료" | "구매확정" | "반품요청";

interface ShippingTrackerProps {
  currentStep: ShippingStep;
  trackingNumber?: string;
  estimatedDate?: string;
  onConfirmPurchase?: () => void;
  onRequestReturn?: () => void;
  onNext?: () => void;
}

const steps: { key: ShippingStep; label: string; icon: React.ComponentType<{ size?: number; strokeWidth?: number; color?: string }> }[] = [
  { key: "접수", label: "주문 접수", icon: Check },
  { key: "준비", label: "배송 준비", icon: Package },
  { key: "배송중", label: "배송중", icon: Truck },
  { key: "배송완료", label: "배송 완료", icon: Home },
];

const stepOrder = ["접수", "준비", "배송중", "배송완료", "구매확정", "반품요청"];

function getStepIndex(step: ShippingStep) {
  return stepOrder.indexOf(step);
}

export default function ShippingTracker({
  currentStep,
  trackingNumber = "CJ1234567890",
  estimatedDate = "2026-04-14",
  onConfirmPurchase,
  onRequestReturn,
  onNext,
}: ShippingTrackerProps) {
  const ci = getStepIndex(currentStep);
  const isConfirmed = currentStep === "구매확정";
  const isReturning = currentStep === "반품요청";

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="pb-3 mb-4" style={{ borderBottom: "1px solid #e5e5e5" }}>
        <h3 className="text-[15px] font-semibold">배송 추적</h3>
        <p className="text-[12px] text-[#777169] mt-0.5">
          송장번호: {trackingNumber}
        </p>
      </div>

      {/* Steps */}
      <div className="flex flex-col gap-0 mb-6">
        {steps.map((step, i) => {
          const si = getStepIndex(step.key);
          const done = si < ci || (si === ci && ci >= getStepIndex("배송완료"));
          const active = si === ci && ci < getStepIndex("배송완료");
          const Icon = step.icon;

          return (
            <div key={step.key} className="flex items-start gap-3">
              <div className="flex flex-col items-center">
                <div
                  className="w-8 h-8 rounded-full flex items-center justify-center"
                  style={{
                    backgroundColor: done || active ? "#000" : "#f5f5f5",
                  }}
                >
                  <Icon
                    size={15}
                    strokeWidth={1.5}
                    color={done || active ? "#fff" : "#d4d4d4"}
                  />
                </div>
                {i < steps.length - 1 && (
                  <div
                    className="w-[1.5px] h-8 my-1"
                    style={{
                      backgroundColor: si < ci ? "#000" : "#e5e5e5",
                    }}
                  />
                )}
              </div>
              <div className="pt-1.5">
                <p
                  className="text-[14px]"
                  style={{
                    fontWeight: active ? 600 : 400,
                    color: done || active ? "#000" : "#777169",
                  }}
                >
                  {step.label}
                </p>
                {step.key === "배송중" && active && (
                  <p className="text-[12px] text-[#777169] mt-0.5">
                    예상 도착: {estimatedDate}
                  </p>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Confirmed / Return badge */}
      {isConfirmed && (
        <div
          className="flex items-center gap-2 px-3 py-2.5 mb-4"
          style={{ borderRadius: "10px", backgroundColor: "rgba(34,197,94,0.08)", color: "#16a34a" }}
        >
          <ThumbsUp size={15} strokeWidth={1.5} />
          <span className="text-[13px] font-medium">구매 확정 완료</span>
        </div>
      )}
      {isReturning && (
        <div
          className="flex items-center gap-2 px-3 py-2.5 mb-4"
          style={{ borderRadius: "10px", backgroundColor: "rgba(239,68,68,0.08)", color: "#ef4444" }}
        >
          <RotateCcw size={15} strokeWidth={1.5} />
          <span className="text-[13px] font-medium">반품 요청이 접수되었습니다</span>
        </div>
      )}

      {/* Tracking details */}
      <div
        className="px-3 py-3 mb-4"
        style={{ borderRadius: "10px", boxShadow: "rgba(0,0,0,0.06) 0px 0px 0px 1px" }}
      >
        <p className="text-[11px] text-[#777169] uppercase tracking-wider mb-2">배송 정보</p>
        <div className="flex flex-col gap-1.5 text-[13px]">
          <div className="flex justify-between">
            <span className="text-[#777169]">택배사</span>
            <span>CJ대한통운</span>
          </div>
          <div className="flex justify-between">
            <span className="text-[#777169]">송장번호</span>
            <span className="font-medium">{trackingNumber}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-[#777169]">예상 도착</span>
            <span>{estimatedDate}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-[#777169]">배송지</span>
            <span>본사 3층</span>
          </div>
        </div>
      </div>

      {/* Spacer */}
      <div className="flex-1" />

      {/* Actions for 배송완료 state */}
      {currentStep === "배송완료" && (
        <div className="flex flex-col gap-2 pt-3" style={{ borderTop: "1px solid #e5e5e5" }}>
          <button
            onClick={onConfirmPurchase}
            className="flex items-center justify-center gap-2 w-full py-[10px] text-[14px] font-medium text-white bg-black rounded-xl cursor-pointer transition-opacity hover:opacity-80"
          >
            <ThumbsUp size={16} strokeWidth={1.5} />
            구매 확정
          </button>
          <button
            onClick={onRequestReturn}
            className="flex items-center justify-center gap-2 w-full py-[10px] text-[14px] font-medium text-[#4e4e4e] bg-[#f5f5f5] rounded-xl cursor-pointer transition-colors hover:bg-[#ebebeb]"
          >
            <RotateCcw size={16} strokeWidth={1.5} />
            반품 요청
          </button>
        </div>
      )}

      {/* Demo: next step */}
      {onNext && !isConfirmed && !isReturning && currentStep !== "배송완료" && (
        <button
          onClick={onNext}
          className="w-full py-[10px] text-[13px] font-medium text-[#4e4e4e] bg-[#f5f5f5] rounded-xl cursor-pointer transition-colors hover:bg-[#ebebeb] mt-2"
        >
          데모: 다음 단계 →
        </button>
      )}
    </div>
  );
}
