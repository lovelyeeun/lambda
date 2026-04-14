"use client";

import { useState, useEffect } from "react";
import {
  ShoppingCart, FileCheck, CreditCard, Truck, ThumbsUp,
  Check, ChevronDown, Zap, RotateCcw, Package, Home,
} from "lucide-react";
import type { CartItem } from "./CartPanel";
import type { ApprovalStep } from "./ApprovalTracker";
import type { ShippingStep } from "./ShippingTracker";

/* ─── Types ─── */

export type TimelinePhase =
  | "products"    // 상품 선택
  | "approval"    // 품의 승인
  | "payment"     // 결제
  | "shipping"    // 배송 추적
  | "complete";   // 구매확정/반품

export type StepStatus = "done" | "active" | "pending";

export interface OrderTimelineData {
  activePhase: TimelinePhase;
  cart: CartItem[];
  totalPrice: number;
  // Approval
  approvalStep: ApprovalStep;
  approver: string;
  approvalDate?: string;
  isAutoApproved: boolean;
  // Payment
  paymentMethod?: string;
  paymentDate?: string;
  // Shipping
  shippingStep: ShippingStep;
  trackingNumber: string;
  estimatedDate: string;
  // Actions
  onAdvance: () => void;
  onConfirmPurchase: () => void;
  onRequestReturn: () => void;
  /** "주문내역 확인" 버튼 콜백 — 제공되면 타임라인 하단에 링크 표시 */
  onViewOrders?: () => void;
}

/* ─── Helpers ─── */

function formatPrice(n: number) {
  return n.toLocaleString("ko-KR") + "원";
}

const phaseOrder: TimelinePhase[] = ["products", "approval", "payment", "shipping", "complete"];

function getStatus(phase: TimelinePhase, active: TimelinePhase): StepStatus {
  const pi = phaseOrder.indexOf(phase);
  const ai = phaseOrder.indexOf(active);
  if (pi < ai) return "done";
  if (pi === ai) return "active";
  return "pending";
}

/* ─── Status dot ─── */

function StatusDot({ status }: { status: StepStatus }) {
  if (status === "done") {
    return (
      <div className="w-6 h-6 rounded-full bg-[#000] flex items-center justify-center shrink-0">
        <Check size={13} color="#fff" strokeWidth={2.5} />
      </div>
    );
  }
  if (status === "active") {
    return (
      <div
        className="w-6 h-6 rounded-full flex items-center justify-center shrink-0"
        style={{ backgroundColor: "#8a6f3f", boxShadow: "rgba(138,111,63,0.18) 0px 0px 0px 3px" }}
      >
        <span className="w-2 h-2 rounded-full bg-white animate-pulse" />
      </div>
    );
  }
  return (
    <div className="w-6 h-6 rounded-full flex items-center justify-center shrink-0" style={{ backgroundColor: "rgba(0,0,0,0.06)" }}>
      <span className="w-2 h-2 rounded-full" style={{ backgroundColor: "#b8b2a8" }} />
    </div>
  );
}

/* ─── Status label ─── */

function StatusLabel({ status }: { status: StepStatus }) {
  if (status === "done") return <span className="text-[12px] font-medium text-[#000]">완료</span>;
  if (status === "active") return <span className="text-[12px] font-medium text-[#8a6f3f]">진행중</span>;
  return <span className="text-[12px] text-[#b8b2a8]">대기</span>;
}

/* ─── Accordion step wrapper ─── */

function AccordionStep({
  icon: Icon,
  label,
  status,
  expanded,
  onToggle,
  children,
}: {
  icon: React.ComponentType<{ size?: number; strokeWidth?: number }>;
  label: string;
  status: StepStatus;
  expanded: boolean;
  onToggle: () => void;
  children: React.ReactNode;
}) {
  const clickable = status !== "pending";

  return (
    <div className="relative flex gap-3">
      {/* Timeline line + dot */}
      <div className="flex flex-col items-center">
        <StatusDot status={status} />
        <div className="w-[1.5px] flex-1 bg-[#e5e5e5] mt-1" />
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0 pb-4">
        {/* Header — clickable */}
        <button
          onClick={clickable ? onToggle : undefined}
          className="flex items-center justify-between w-full text-left"
          style={{
            cursor: clickable ? "pointer" : "default",
            opacity: status === "pending" ? 0.45 : 1,
          }}
        >
          <div className="flex items-center gap-2">
            <Icon size={14} strokeWidth={1.5} />
            <span className="text-[13px] font-medium">{label}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <StatusLabel status={status} />
            {clickable && (
              <ChevronDown
                size={14}
                strokeWidth={1.5}
                color="#777169"
                style={{
                  transform: expanded ? "rotate(180deg)" : "rotate(0deg)",
                  transition: "transform 150ms ease",
                }}
              />
            )}
          </div>
        </button>

        {/* Expandable body */}
        {expanded && clickable && (
          <div className="mt-2.5">{children}</div>
        )}
      </div>
    </div>
  );
}

/* ─── Mini shipping steps (inline) ─── */

const shipSteps: { key: ShippingStep; label: string; icon: React.ComponentType<{ size?: number; strokeWidth?: number; color?: string }> }[] = [
  { key: "접수", label: "접수", icon: Check },
  { key: "준비", label: "준비", icon: Package },
  { key: "배송중", label: "배송중", icon: Truck },
  { key: "배송완료", label: "완료", icon: Home },
];

const shipOrder = ["접수", "준비", "배송중", "배송완료", "구매확정", "반품요청"];

function ShippingMini({ step, trackingNumber, estimatedDate }: { step: ShippingStep; trackingNumber: string; estimatedDate: string }) {
  const ci = shipOrder.indexOf(step);

  return (
    <div>
      {/* Horizontal step bar */}
      <div className="flex items-center gap-0 mb-3">
        {shipSteps.map((s, i) => {
          const si = shipOrder.indexOf(s.key);
          const done = si < ci || (si === ci && ci >= shipOrder.indexOf("배송완료"));
          const active = si === ci && ci < shipOrder.indexOf("배송완료");
          const Icon = s.icon;
          return (
            <div key={s.key} className="flex items-center">
              <div className="flex flex-col items-center">
                <div
                  className="w-7 h-7 rounded-full flex items-center justify-center"
                  style={{ backgroundColor: done || active ? "#000" : "#f5f5f5" }}
                >
                  <Icon size={13} strokeWidth={1.5} color={done || active ? "#fff" : "#d4d4d4"} />
                </div>
                <span className="text-[11px] text-[#777169] mt-1">{s.label}</span>
              </div>
              {i < shipSteps.length - 1 && (
                <div
                  className="w-6 h-[1.5px] mb-4 mx-0.5"
                  style={{ backgroundColor: si < ci ? "#000" : "#e5e5e5" }}
                />
              )}
            </div>
          );
        })}
      </div>

      {/* Info card */}
      <div
        className="px-3 py-2.5 text-[12px] flex flex-col gap-1"
        style={{ borderRadius: "8px", boxShadow: "rgba(0,0,0,0.06) 0px 0px 0px 1px" }}
      >
        <div className="flex justify-between">
          <span className="text-[#777169]">택배사</span><span>CJ대한통운</span>
        </div>
        <div className="flex justify-between">
          <span className="text-[#777169]">송장번호</span><span className="font-medium">{trackingNumber}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-[#777169]">예상 도착</span><span>{estimatedDate}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-[#777169]">배송지</span><span>본사 3층</span>
        </div>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════
   OrderTimeline (main export)
   ═══════════════════════════════════ */

export default function OrderTimeline(props: OrderTimelineData) {
  const {
    activePhase, cart, totalPrice,
    approvalStep, approver, approvalDate, isAutoApproved,
    paymentMethod, paymentDate,
    shippingStep, trackingNumber, estimatedDate,
    onAdvance, onConfirmPurchase, onRequestReturn, onViewOrders,
  } = props;

  // Track which section is expanded — default to active phase
  const [expandedPhase, setExpandedPhase] = useState<TimelinePhase | null>(activePhase);

  // Auto-expand active phase when it changes
  useEffect(() => {
    setExpandedPhase(activePhase);
  }, [activePhase]);

  const toggle = (phase: TimelinePhase) => {
    setExpandedPhase((prev) => (prev === phase ? null : phase));
  };

  const isDelivered = shippingStep === "배송완료" || shippingStep === "구매확정" || shippingStep === "반품요청";
  const isFinished = shippingStep === "구매확정" || shippingStep === "반품요청";

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="pb-3 mb-3" style={{ borderBottom: "1px solid #e5e5e5" }}>
        <h3 className="text-[15px] font-semibold">주문 진행</h3>
        <p className="text-[12px] text-[#777169] mt-0.5">{formatPrice(totalPrice)}</p>
      </div>

      {/* Accordion timeline */}
      <div className="flex-1 overflow-y-auto">
        {/* 1. 상품 선택 */}
        <AccordionStep
          icon={ShoppingCart}
          label="상품 선택"
          status={getStatus("products", activePhase)}
          expanded={expandedPhase === "products"}
          onToggle={() => toggle("products")}
        >
          <div className="flex flex-col gap-1.5">
            {cart.map((item) => (
              <div key={item.product.id} className="flex items-center justify-between text-[12px]">
                <span className="truncate mr-2">{item.product.name}</span>
                <span className="shrink-0 text-[#4e4e4e]">
                  {item.quantity}개 · {formatPrice(item.product.price * item.quantity)}
                </span>
              </div>
            ))}
            {cart.length === 0 && (
              <p className="text-[12px] text-[#777169]">상품 정보 없음</p>
            )}
          </div>
        </AccordionStep>

        {/* 2. 품의 승인 */}
        <AccordionStep
          icon={FileCheck}
          label="품의 승인"
          status={getStatus("approval", activePhase)}
          expanded={expandedPhase === "approval"}
          onToggle={() => toggle("approval")}
        >
          {isAutoApproved ? (
            <div
              className="flex items-center gap-2 px-2.5 py-2 text-[12px]"
              style={{ borderRadius: "8px", backgroundColor: "rgba(245,242,239,0.8)", color: "#000" }}
            >
              <Zap size={13} strokeWidth={1.5} />
              <span className="font-medium">자동 승인 완료</span>
              <span className="opacity-70">— 소액 품의</span>
            </div>
          ) : (
            <div className="flex flex-col gap-1.5 text-[12px]">
              <div className="flex justify-between">
                <span className="text-[#777169]">승인자</span>
                <span>{approver}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#777169]">상태</span>
                <span className="font-medium">
                  {approvalStep === "승인" ? "승인 완료" : approvalStep === "반려" ? "반려" : approvalStep === "대기" ? "승인 대기중" : "요청됨"}
                </span>
              </div>
              {approvalDate && (
                <div className="flex justify-between">
                  <span className="text-[#777169]">승인일</span>
                  <span>{approvalDate}</span>
                </div>
              )}
              {approvalStep === "대기" && (
                <p className="text-[#777169] mt-1">{approver}의 승인을 기다리고 있습니다</p>
              )}
            </div>
          )}
        </AccordionStep>

        {/* 3. 결제 */}
        <AccordionStep
          icon={CreditCard}
          label="결제"
          status={getStatus("payment", activePhase)}
          expanded={expandedPhase === "payment"}
          onToggle={() => toggle("payment")}
        >
          {getStatus("payment", activePhase) === "done" ? (
            <div className="flex flex-col gap-1.5 text-[12px]">
              <div className="flex justify-between">
                <span className="text-[#777169]">결제수단</span>
                <span>{paymentMethod ?? "—"}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#777169]">결제금액</span>
                <span className="font-medium">{formatPrice(totalPrice)}</span>
              </div>
              {paymentDate && (
                <div className="flex justify-between">
                  <span className="text-[#777169]">결제일</span>
                  <span>{paymentDate}</span>
                </div>
              )}
            </div>
          ) : (
            <p className="text-[12px] text-[#777169]">결제수단을 선택해주세요.</p>
          )}
        </AccordionStep>

        {/* 4. 배송 추적 */}
        <AccordionStep
          icon={Truck}
          label="배송 추적"
          status={getStatus("shipping", activePhase)}
          expanded={expandedPhase === "shipping"}
          onToggle={() => toggle("shipping")}
        >
          <ShippingMini
            step={shippingStep}
            trackingNumber={trackingNumber}
            estimatedDate={estimatedDate}
          />
        </AccordionStep>

        {/* 5. 구매확정/반품 */}
        <AccordionStep
          icon={ThumbsUp}
          label="구매확정"
          status={getStatus("complete", activePhase)}
          expanded={expandedPhase === "complete"}
          onToggle={() => toggle("complete")}
        >
          {isFinished ? (
            shippingStep === "구매확정" ? (
              <div
                className="flex items-center gap-2 px-2.5 py-2 text-[12px]"
                style={{ borderRadius: "8px", backgroundColor: "rgba(245,242,239,0.8)", color: "#000" }}
              >
                <ThumbsUp size={13} strokeWidth={1.5} />
                <span className="font-medium">구매 확정 완료</span>
              </div>
            ) : (
              <div
                className="flex items-center gap-2 px-2.5 py-2 text-[12px]"
                style={{ borderRadius: "8px", backgroundColor: "rgba(245,242,239,0.8)", color: "#777169" }}
              >
                <RotateCcw size={13} strokeWidth={1.5} />
                <span className="font-medium">반품 요청 접수됨</span>
              </div>
            )
          ) : isDelivered ? (
            <div className="flex flex-col gap-2">
              <button
                onClick={onConfirmPurchase}
                className="flex items-center justify-center gap-2 w-full py-[8px] text-[13px] font-medium text-white bg-black rounded-lg cursor-pointer transition-opacity hover:opacity-80"
              >
                <ThumbsUp size={14} strokeWidth={1.5} />
                구매 확정
              </button>
              <button
                onClick={onRequestReturn}
                className="flex items-center justify-center gap-2 w-full py-[8px] text-[13px] font-medium text-[#4e4e4e] bg-[#f5f5f5] rounded-lg cursor-pointer transition-colors hover:bg-[#ebebeb]"
              >
                <RotateCcw size={14} strokeWidth={1.5} />
                반품 요청
              </button>
            </div>
          ) : (
            <p className="text-[12px] text-[#777169]">배송 완료 후 확정할 수 있습니다.</p>
          )}
        </AccordionStep>
      </div>

      {/* Demo: advance button */}
      {!isFinished && (
        <div className="pt-3 mt-1" style={{ borderTop: "1px solid #e5e5e5" }}>
          <button
            onClick={onAdvance}
            className="w-full py-[9px] text-[13px] font-medium text-[#4e4e4e] bg-[#f5f5f5] rounded-xl cursor-pointer transition-colors hover:bg-[#ebebeb]"
          >
            데모: 다음 단계 →
          </button>
        </div>
      )}

      {/* 주문내역 확인 링크 */}
      {onViewOrders && (
        <div className="pt-3 mt-1" style={{ borderTop: !isFinished ? undefined : "1px solid #e5e5e5" }}>
          <button
            onClick={onViewOrders}
            className="w-full py-[9px] text-[13px] font-medium text-[#000] cursor-pointer transition-colors hover:bg-[rgba(245,242,239,0.6)] rounded-xl"
          >
            주문내역 확인 →
          </button>
        </div>
      )}
    </div>
  );
}
