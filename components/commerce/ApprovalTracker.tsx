"use client";

import { Check, Clock, X, Zap } from "lucide-react";

export type ApprovalStep = "요청" | "대기" | "승인" | "반려" | "자동승인";

interface ApprovalTrackerProps {
  currentStep: ApprovalStep;
  totalPrice: number;
  approver?: string;
  reason?: string;
  onNext?: () => void;
}

const AUTO_APPROVE_LIMIT = 300000; // 30만원 이하 자동승인

function formatPrice(n: number) {
  return n.toLocaleString("ko-KR") + "원";
}

const steps: { key: ApprovalStep; label: string }[] = [
  { key: "요청", label: "품의 요청" },
  { key: "대기", label: "승인 대기" },
  { key: "승인", label: "승인 완료" },
];

function StepIcon({ step, current }: { step: ApprovalStep; current: ApprovalStep }) {
  const stepOrder = ["요청", "대기", "승인"];
  const si = stepOrder.indexOf(step);
  const ci = stepOrder.indexOf(current === "반려" ? "대기" : current === "자동승인" ? "승인" : current);

  if (current === "반려" && step === "승인") {
    return (
      <div className="w-7 h-7 rounded-full bg-[#fef2f2] flex items-center justify-center">
        <X size={14} color="#ef4444" strokeWidth={2} />
      </div>
    );
  }
  if (si < ci || (si === ci && (current === "승인" || current === "자동승인"))) {
    return (
      <div className="w-7 h-7 rounded-full bg-[#000] flex items-center justify-center">
        <Check size={14} color="#fff" strokeWidth={2} />
      </div>
    );
  }
  if (si === ci) {
    return (
      <div className="w-7 h-7 rounded-full bg-[#f5f5f5] flex items-center justify-center">
        <Clock size={14} color="#4e4e4e" strokeWidth={1.5} />
      </div>
    );
  }
  return (
    <div className="w-7 h-7 rounded-full bg-[#f5f5f5] flex items-center justify-center">
      <span className="w-2 h-2 rounded-full bg-[#d4d4d4]" />
    </div>
  );
}

export default function ApprovalTracker({
  currentStep,
  totalPrice,
  approver = "김지현 매니저",
  reason,
  onNext,
}: ApprovalTrackerProps) {
  const isAutoApproved = currentStep === "자동승인";
  const isRejected = currentStep === "반려";

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="pb-3 mb-4" style={{ borderBottom: "1px solid #e5e5e5" }}>
        <h3 className="text-[15px] font-semibold">품의 승인</h3>
        <p className="text-[12px] text-[#777169] mt-0.5">
          {formatPrice(totalPrice)}
          {totalPrice <= AUTO_APPROVE_LIMIT && " · 소액 자동승인 대상"}
        </p>
      </div>

      {/* Auto-approve banner */}
      {isAutoApproved && (
        <div
          className="flex items-center gap-2 px-3 py-2.5 mb-4 text-[13px]"
          style={{
            borderRadius: "10px",
            backgroundColor: "rgba(34,197,94,0.08)",
            color: "#16a34a",
          }}
        >
          <Zap size={15} strokeWidth={1.5} />
          <span className="font-medium">자동 승인 완료</span>
          <span className="text-[12px] opacity-70">— 소액 품의 ({formatPrice(AUTO_APPROVE_LIMIT)} 이하)</span>
        </div>
      )}

      {/* Steps */}
      <div className="flex flex-col gap-0 mb-6">
        {steps.map((step, i) => {
          const displayLabel = isRejected && step.key === "승인" ? "반려" : step.label;
          return (
            <div key={step.key} className="flex items-start gap-3">
              {/* Icon + line */}
              <div className="flex flex-col items-center">
                <StepIcon step={step.key} current={currentStep} />
                {i < steps.length - 1 && (
                  <div className="w-[1.5px] h-8 bg-[#e5e5e5] my-1" />
                )}
              </div>
              {/* Label */}
              <div className="pt-1">
                <p className="text-[14px] font-medium">{displayLabel}</p>
                {step.key === "대기" && currentStep === "대기" && (
                  <p className="text-[12px] text-[#777169] mt-0.5">{approver}의 승인을 기다리고 있습니다</p>
                )}
                {step.key === "승인" && isRejected && reason && (
                  <p className="text-[12px] text-[#ef4444] mt-0.5">사유: {reason}</p>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Approver info */}
      <div
        className="px-3 py-3 mb-4"
        style={{
          borderRadius: "10px",
          boxShadow: "rgba(0,0,0,0.06) 0px 0px 0px 1px",
        }}
      >
        <p className="text-[11px] text-[#777169] uppercase tracking-wider mb-1.5">승인 담당자</p>
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-full bg-[#f5f5f5] flex items-center justify-center text-[11px] font-medium text-[#4e4e4e]">
            김
          </div>
          <div>
            <p className="text-[13px] font-medium">{approver}</p>
            <p className="text-[11px] text-[#777169]">경영지원 · 구매 승인 권한</p>
          </div>
        </div>
      </div>

      {/* Spacer */}
      <div className="flex-1" />

      {/* Demo: next step button */}
      {onNext && !isAutoApproved && currentStep !== "승인" && currentStep !== "반려" && (
        <button
          onClick={onNext}
          className="w-full py-[10px] text-[13px] font-medium text-[#4e4e4e] bg-[#f5f5f5] rounded-xl cursor-pointer transition-colors hover:bg-[#ebebeb]"
        >
          데모: 다음 단계 →
        </button>
      )}
    </div>
  );
}
