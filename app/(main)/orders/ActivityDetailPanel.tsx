"use client";

import { useState, useRef, useEffect } from "react";
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
  Sparkles,
  AlertCircle,
  ShieldCheck,
  RotateCcw,
  Headphones,
  ChevronRight,
  Bell,
  Send,
  X,
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
  rightAction,
  children,
}: {
  label: string;
  done: boolean;
  active: boolean;
  rightAction?: React.ReactNode;
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
        <div className="flex items-center justify-between">
          <p
            className="text-[13px]"
            style={{
              fontWeight: done || active ? 500 : 400,
              color: done || active ? "#111" : "#999",
            }}
          >
            {label}
          </p>
          {rightAction}
        </div>
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
  const [reminderOpen, setReminderOpen] = useState(false);
  const [reminderMsg, setReminderMsg] = useState("");
  const [reminderSent, setReminderSent] = useState(false);
  const reminderRef = useRef<HTMLDivElement>(null);

  // 외부 클릭 닫기
  useEffect(() => {
    if (!reminderOpen) return;
    const handler = (e: MouseEvent) => {
      if (reminderRef.current && !reminderRef.current.contains(e.target as Node)) {
        setReminderOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [reminderOpen]);

  // 승인 담당자 목록
  const approvers = order?.approvedBy
    ? [users.find((u) => u.id === order.approvedBy)]
    : [users.find((u) => u.role === "매니저"), users.find((u) => u.role === "관리자")];
  const approverList = approvers.filter(Boolean);

  const handleSendReminder = () => {
    setReminderSent(true);
    setTimeout(() => {
      setReminderOpen(false);
      setReminderSent(false);
      setReminderMsg("");
    }, 1500);
  };
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
            {/* 1. Approval + 리마인드 종 아이콘 */}
            <TimelineStep
              label={isRejected ? "품의 반려" : "품의 승인"}
              done={!isRejected && ci >= 1}
              active={isActive(0)}
              rightAction={
                isActive(0) && activity.actionLabel === "리마인드 보내기" ? (
                  <div className="relative" ref={reminderRef}>
                    <button
                      onClick={() => setReminderOpen((v) => !v)}
                      className="group relative flex items-center justify-center w-6 h-6 rounded-md cursor-pointer transition-colors hover:bg-[#fff3e0]"
                      title="리마인드 보내기"
                    >
                      <Bell size={13} strokeWidth={1.5} color={reminderOpen ? "#ea580c" : "#999"} />
                    </button>

                    {/* 리마인드 팝오버 */}
                    {reminderOpen && (
                      <div
                        className="absolute right-0 top-full mt-1.5 w-[260px] bg-white z-50"
                        style={{
                          borderRadius: "12px",
                          boxShadow: "rgba(0,0,0,0.08) 0px 0px 0px 1px, rgba(0,0,0,0.12) 0px 8px 24px",
                        }}
                      >
                        {reminderSent ? (
                          <div className="flex flex-col items-center gap-2 py-6">
                            <div className="w-8 h-8 rounded-full bg-[#22c55e] flex items-center justify-center">
                              <Check size={16} color="#fff" strokeWidth={2} />
                            </div>
                            <p className="text-[13px] font-medium text-[#22c55e]">리마인드를 보냈습니다</p>
                          </div>
                        ) : (
                          <div className="p-3">
                            <div className="flex items-center justify-between mb-2.5">
                              <p className="text-[12px] font-semibold">승인 리마인드</p>
                              <button onClick={() => setReminderOpen(false)} className="cursor-pointer hover:bg-[#f5f5f5] rounded-md p-0.5">
                                <X size={12} strokeWidth={2} color="#999" />
                              </button>
                            </div>

                            {/* 승인 담당자 */}
                            <p className="text-[11px] text-[#999] mb-1.5">승인 담당자</p>
                            <div className="flex flex-col gap-1 mb-3">
                              {approverList.map((u) => u && (
                                <div key={u.id} className="flex items-center gap-2 px-2 py-1.5 rounded-lg bg-[#f9f9f9]">
                                  <div className="w-5 h-5 rounded-full bg-[#e5e5e5] flex items-center justify-center text-[10px] font-medium text-[#666]">
                                    {u.name.charAt(0)}
                                  </div>
                                  <span className="text-[12px] font-medium">{u.name}</span>
                                  <span className="text-[11px] text-[#999]">{u.role}</span>
                                </div>
                              ))}
                            </div>

                            {/* 메시지 입력 */}
                            <p className="text-[11px] text-[#999] mb-1">메시지 (선택)</p>
                            <textarea
                              value={reminderMsg}
                              onChange={(e) => setReminderMsg(e.target.value)}
                              placeholder="승인 부탁드립니다."
                              className="w-full px-2.5 py-2 text-[12px] rounded-lg border-0 resize-none focus:outline-none"
                              style={{ boxShadow: "rgba(0,0,0,0.08) 0px 0px 0px 1px", minHeight: "56px" }}
                              rows={2}
                            />

                            {/* 보내기 */}
                            <button
                              onClick={handleSendReminder}
                              className="flex items-center justify-center gap-1.5 w-full mt-2.5 py-[7px] text-[12px] font-medium text-white bg-[#ea580c] rounded-lg cursor-pointer transition-opacity hover:opacity-80"
                            >
                              <Send size={12} strokeWidth={2} />
                              리마인드 보내기
                            </button>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                ) : undefined
              }
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

      {/* ── Action buttons (리마인드 제외 — 리마인드는 타임라인 종 아이콘으로 이동) ── */}
      {activity.actionLabel && activity.actionLabel !== "리마인드 보내기" && (
        <div
          className="py-3"
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
            <ChevronRight size={14} strokeWidth={2} />
          </button>
        </div>
      )}
    </div>
  );
}
