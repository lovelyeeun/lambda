"use client";

import Link from "next/link";
import type { Activity, Order, OrderStatus } from "@/lib/types";
import { users } from "@/data/users";
import Badge from "@/components/ui/Badge";
import {
  Check,
  Clock,
  Package,
  Truck,
  Home,
  Zap,
  CreditCard,
  MessageSquare,
  Sparkles,
  AlertCircle,
  ShieldCheck,
  RotateCcw,
  Headphones,
  ArrowRight,
  ChevronRight,
  ExternalLink,
} from "lucide-react";

/* ─── Helpers ─── */

function formatPrice(n: number) {
  return n.toLocaleString("ko-KR") + "원";
}

function userName(id: string) {
  return users.find((u) => u.id === id)?.name ?? id;
}

type BadgeStatus = "완료" | "대기" | "진행중" | "반려";

function statusToBadge(s: OrderStatus): BadgeStatus {
  if (s === "구매확정" || s === "배송완료") return "완료";
  if (s === "승인대기") return "대기";
  if (s === "반려" || s === "반품요청") return "반려";
  return "진행중";
}

function activityStatusToBadge(s: Activity["status"]): BadgeStatus {
  if (s === "done") return "완료";
  if (s === "action-needed") return "대기";
  if (s === "in-progress") return "진행중";
  return "완료";
}

const activityTypeLabel: Record<Activity["type"], string> = {
  order: "주문",
  approval: "승인",
  delivery: "배송",
  payment: "결제",
  cs: "고객지원",
  recurring: "정기구매",
  "ai-insight": "AI 인사이트",
};

const activityTypeIcon: Record<Activity["type"], typeof AlertCircle> = {
  order: Package,
  approval: ShieldCheck,
  delivery: Truck,
  payment: CreditCard,
  cs: Headphones,
  recurring: RotateCcw,
  "ai-insight": Sparkles,
};

const activityTypeColor: Record<Activity["type"], string> = {
  order: "#3b82f6",
  approval: "#f59e0b",
  delivery: "#3b82f6",
  payment: "#22c55e",
  cs: "#8b5cf6",
  recurring: "#6366f1",
  "ai-insight": "#ec4899",
};

/* ─── Shipping mini-timeline ─── */

const shipSteps = [
  { key: "접수", label: "접수", icon: Check },
  { key: "준비", label: "준비", icon: Package },
  { key: "배송중", label: "배송중", icon: Truck },
  { key: "완료", label: "완료", icon: Home },
];

const statusToShipIndex: Partial<Record<OrderStatus, number>> = {
  결제완료: 0,
  배송준비: 1,
  배송중: 2,
  배송완료: 3,
  구매확정: 4,
  반품요청: 4,
};

/* ─── Timeline step ─── */

function TimelineStep({
  label,
  done,
  active,
  children,
}: {
  label: string;
  done: boolean;
  active: boolean;
  children?: React.ReactNode;
}) {
  return (
    <div className="flex gap-3">
      <div className="flex flex-col items-center">
        <div
          className="w-6 h-6 rounded-full flex items-center justify-center shrink-0"
          style={{
            backgroundColor: done ? "#22c55e" : active ? "#3b82f6" : "#e5e5e5",
          }}
        >
          {done ? (
            <Check size={13} color="#fff" strokeWidth={2.5} />
          ) : active ? (
            <span className="w-2 h-2 rounded-full bg-white animate-pulse" />
          ) : (
            <span className="w-2 h-2 rounded-full bg-[#d4d4d4]" />
          )}
        </div>
        <div className="w-[1.5px] flex-1 bg-[#e5e5e5] mt-1 min-h-[16px]" />
      </div>
      <div className="flex-1 pb-3">
        <p
          className="text-[13px]"
          style={{
            fontWeight: done || active ? 500 : 400,
            color: done || active ? "#111" : "#999",
          }}
        >
          {label}
        </p>
        {children && <div className="mt-1.5">{children}</div>}
      </div>
    </div>
  );
}

/* ═══════════════════════════════
   Main Component
   ═══════════════════════════════ */

export default function ActivityDetailPanel({
  activity,
  order,
}: {
  activity: Activity;
  order?: Order;
}) {
  const Icon = activityTypeIcon[activity.type];
  const color = activityTypeColor[activity.type];

  /* Order timeline logic */
  const statusOrder: OrderStatus[] = [
    "승인대기",
    "승인완료",
    "결제완료",
    "배송준비",
    "배송중",
    "배송완료",
    "구매확정",
  ];
  const ci = order ? statusOrder.indexOf(order.status) : -1;
  const isDone = (idx: number) => idx < ci;
  const isActive = (idx: number) => idx === ci;
  const isRejected = order?.status === "반려";
  const isReturned = order?.status === "반품요청";
  const shipIdx = order ? (statusToShipIndex[order.status] ?? -1) : -1;

  return (
    <div className="flex flex-col h-full">
      {/* ── Header ── */}
      <div
        className="pb-3 mb-3"
        style={{ borderBottom: "1px solid #e5e5e5" }}
      >
        <div className="flex items-center gap-2.5 mb-2">
          <div
            className="w-8 h-8 rounded-[8px] flex items-center justify-center"
            style={{ backgroundColor: `${color}12` }}
          >
            <Icon size={16} color={color} strokeWidth={1.5} />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <span
                className="text-[11px] font-medium px-2 py-[1px] rounded-full"
                style={{
                  backgroundColor: `${color}12`,
                  color: color,
                }}
              >
                {activityTypeLabel[activity.type]}
              </span>
              <Badge status={activityStatusToBadge(activity.status)} />
            </div>
          </div>
        </div>
        <h3 className="text-[15px] font-semibold">{activity.title}</h3>
        <p className="text-[12px] text-[#777169] mt-0.5">{activity.date}</p>
      </div>

      {/* ── AI Insight ── */}
      {activity.aiInsight && (
        <div
          className="px-3.5 py-3 mb-4 rounded-[12px]"
          style={{
            background:
              "linear-gradient(135deg, rgba(99,102,241,0.06), rgba(236,72,153,0.04))",
          }}
        >
          <div className="flex items-start gap-2.5">
            <div
              className="w-6 h-6 rounded-full flex items-center justify-center shrink-0"
              style={{
                background: "linear-gradient(135deg, #6366f1, #ec4899)",
              }}
            >
              <Sparkles size={11} color="#fff" strokeWidth={2} />
            </div>
            <div>
              <p className="text-[11px] font-semibold text-[#6366f1] mb-0.5">
                AI 인사이트
              </p>
              <p className="text-[12px] text-[#444] leading-[1.6]">
                {activity.aiInsight}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* ── Activity description ── */}
      <div
        className="px-3 py-3 mb-4"
        style={{
          borderRadius: "10px",
          boxShadow: "rgba(0,0,0,0.06) 0px 0px 0px 1px",
        }}
      >
        <p className="text-[13px] text-[#333] leading-[1.6]">
          {activity.description}
        </p>
      </div>

      {/* ── Related order details ── */}
      {order && (
        <>
          <p className="text-[12px] font-semibold text-[#999] uppercase tracking-wider mb-2 px-1">
            연관 주문
          </p>
          <div
            className="px-3 py-3 mb-4"
            style={{
              borderRadius: "10px",
              boxShadow: "rgba(0,0,0,0.06) 0px 0px 0px 1px",
            }}
          >
            <div className="flex items-center justify-between mb-1">
              <p className="text-[14px] font-medium">{order.productName}</p>
              <Badge status={statusToBadge(order.status)} />
            </div>
            <p className="text-[12px] text-[#777169] mt-1">
              {order.quantity}개 · {formatPrice(order.totalPrice)} ·{" "}
              {userName(order.orderedBy)}
            </p>
            {order.note && (
              <p className="text-[12px] text-[#999] mt-1">{order.note}</p>
            )}
            {order.isRecurring && (
              <span className="inline-flex items-center gap-1 mt-1.5 px-2 py-0.5 text-[11px] font-medium text-[#3b82f6] bg-[#eff6ff] rounded-full">
                <Zap size={10} strokeWidth={2} />
                정기구매
              </span>
            )}
          </div>

          {/* ── Order Timeline ── */}
          <p className="text-[12px] font-semibold text-[#999] uppercase tracking-wider mb-2 px-1">
            진행 상태
          </p>
          <div className="flex-1 overflow-y-auto mb-3">
            {/* 1. Approval */}
            <TimelineStep
              label={isRejected ? "품의 반려" : "품의 승인"}
              done={!isRejected && ci >= 1}
              active={isActive(0)}
            >
              {order.approvedBy && (
                <p className="text-[12px] text-[#777169]">
                  승인자: {userName(order.approvedBy)}
                </p>
              )}
              {isRejected && order.note && (
                <p className="text-[12px] text-[#ef4444]">
                  사유: {order.note}
                </p>
              )}
            </TimelineStep>

            {/* 2. Payment */}
            <TimelineStep
              label="결제"
              done={ci >= 2}
              active={isActive(1) && !isRejected}
            >
              {order.paymentMethod && (
                <div className="flex items-center gap-1.5 text-[12px] text-[#777169]">
                  <CreditCard size={12} strokeWidth={1.5} />
                  {order.paymentMethod}
                </div>
              )}
            </TimelineStep>

            {/* 3. Shipping */}
            <TimelineStep
              label="배송"
              done={ci >= 5}
              active={ci >= 3 && ci < 5 && !isRejected}
            >
              {shipIdx >= 0 && (
                <>
                  <div className="flex items-center gap-0 mb-2 mt-1">
                    {shipSteps.map((s, i) => {
                      const SIcon = s.icon;
                      const d =
                        i < shipIdx || (i === shipIdx && shipIdx >= 3);
                      const a = i === shipIdx && shipIdx < 3;
                      return (
                        <div key={s.key} className="flex items-center">
                          <div className="flex flex-col items-center">
                            <div
                              className="w-6 h-6 rounded-full flex items-center justify-center"
                              style={{
                                backgroundColor: d || a ? "#000" : "#f5f5f5",
                              }}
                            >
                              <SIcon
                                size={12}
                                strokeWidth={1.5}
                                color={d || a ? "#fff" : "#d4d4d4"}
                              />
                            </div>
                            <span className="text-[9px] text-[#999] mt-0.5">
                              {s.label}
                            </span>
                          </div>
                          {i < shipSteps.length - 1 && (
                            <div
                              className="w-4 h-[1.5px] mb-3 mx-0.5"
                              style={{
                                backgroundColor:
                                  i < shipIdx ? "#000" : "#e5e5e5",
                              }}
                            />
                          )}
                        </div>
                      );
                    })}
                  </div>
                  {order.trackingNumber && (
                    <p className="text-[12px] text-[#777169]">
                      송장: {order.trackingNumber}
                    </p>
                  )}
                </>
              )}
            </TimelineStep>

            {/* 4. Complete */}
            <TimelineStep
              label={isReturned ? "반품 요청" : "구매확정"}
              done={order.status === "구매확정"}
              active={order.status === "배송완료" || isReturned}
            >
              {isReturned && (
                <p className="text-[12px] text-[#ef4444]">반품 접수됨</p>
              )}
            </TimelineStep>
          </div>
        </>
      )}

      {/* ── Action button ── */}
      {activity.actionLabel && (
        <div
          className="py-3 mb-2"
          style={{ borderTop: "1px solid #e5e5e5" }}
        >
          <button
            className="flex items-center justify-center gap-2 w-full py-[10px] text-[13px] font-medium rounded-xl cursor-pointer transition-all"
            style={{
              backgroundColor: activityTypeColor[activity.type],
              color: "#fff",
            }}
          >
            {activity.actionLabel}
            <ArrowRight size={14} strokeWidth={2} />
          </button>
        </div>
      )}

      {/* ── Chat link ── */}
      <div
        className="pt-3"
        style={{ borderTop: activity.actionLabel ? "none" : "1px solid #e5e5e5" }}
      >
        <Link
          href="/chat"
          className="flex items-center justify-center gap-2 w-full py-[9px] text-[13px] font-medium text-[#4e4e4e] bg-[#f5f5f5] rounded-xl cursor-pointer transition-colors hover:bg-[#ebebeb]"
        >
          <MessageSquare size={15} strokeWidth={1.5} />
          채팅에서 확인하기
        </Link>
      </div>
    </div>
  );
}
