"use client";

import { useMemo } from "react";
import { activities, dailyBriefings, type DailyBriefing } from "@/data/activities";
import { orders } from "@/data/orders";
import type { Activity } from "@/lib/types";
import Badge from "@/components/ui/Badge";
import {
  Sparkles,
  AlertCircle,
  Truck,
  TrendingUp,
  CreditCard,
  ArrowRight,
  ChevronDown,
  ChevronUp,
  Clock,
  RotateCcw,
  Headphones,
  Package,
  ShieldCheck,
  Zap,
} from "lucide-react";

/* ─── Helpers ─── */

type BadgeStatus = "완료" | "대기" | "진행중" | "반려";

function activityStatusToBadge(s: Activity["status"]): BadgeStatus {
  if (s === "done") return "완료";
  if (s === "action-needed") return "대기";
  if (s === "in-progress") return "진행중";
  return "완료";
}

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

const briefingIcon: Record<string, typeof AlertCircle> = {
  action: AlertCircle,
  delivery: Truck,
  insight: TrendingUp,
  payment: CreditCard,
};

const briefingIconColor: Record<string, string> = {
  action: "#f59e0b",
  delivery: "#3b82f6",
  insight: "#22c55e",
  payment: "#8b5cf6",
};

/* ═══════════════════════════════
   Right Panel for Activity Page
   ═══════════════════════════════ */

export default function ActivityRightPanel({
  selectedDate,
  onActivityClick,
}: {
  selectedDate: string | null;
  onActivityClick?: (activity: Activity) => void;
}) {
  const dateStr = selectedDate ?? "2026-04-13";
  const briefing = dailyBriefings[dateStr];

  const dateActivities = useMemo(() => {
    const list = activities.filter((a) => a.date === dateStr);
    const priority: Record<string, number> = {
      "action-needed": 0,
      "in-progress": 1,
      info: 2,
      done: 3,
    };
    return list.sort((a, b) => (priority[a.status] ?? 2) - (priority[b.status] ?? 2));
  }, [dateStr]);

  const actionNeeded = dateActivities.filter((a) => a.status === "action-needed");
  const inProgress = dateActivities.filter(
    (a) => a.status === "in-progress" || a.status === "info"
  );
  const done = dateActivities.filter((a) => a.status === "done");

  return (
    <div className="flex flex-col h-full">
      {/* ── Header ── */}
      <div className="pb-3 mb-3" style={{ borderBottom: "1px solid #f0f0f0" }}>
        <p className="text-[15px] font-semibold">
          {dateStr.replace(/-/g, ".")}
        </p>
        <div className="flex gap-2 mt-1.5">
          {actionNeeded.length > 0 && (
            <span
              className="inline-flex items-center gap-1 px-2 py-0.5 text-[11px] font-medium rounded-full"
              style={{ backgroundColor: "rgba(245,158,11,0.1)", color: "#d97706" }}
            >
              <AlertCircle size={10} strokeWidth={2} />
              할 일 {actionNeeded.length}
            </span>
          )}
          {inProgress.length > 0 && (
            <span
              className="inline-flex items-center gap-1 px-2 py-0.5 text-[11px] font-medium rounded-full"
              style={{ backgroundColor: "rgba(59,130,246,0.1)", color: "#2563eb" }}
            >
              <Clock size={10} strokeWidth={2} />
              진행 {inProgress.length}
            </span>
          )}
          {dateActivities.length === 0 && (
            <span className="text-[12px] text-[#999]">예정된 활동 없음</span>
          )}
        </div>
      </div>

      {/* Scrollable content */}
      <div className="flex-1 overflow-y-auto">
        {/* ── AI Briefing ── */}
        {briefing && (
          <div className="mb-4">
            <div
              className="rounded-[14px] overflow-hidden"
              style={{
                background:
                  "linear-gradient(135deg, rgba(99,102,241,0.06), rgba(236,72,153,0.04))",
              }}
            >
              <div className="px-3.5 py-3">
                <div className="flex items-center gap-2 mb-2.5">
                  <div
                    className="w-5 h-5 rounded-full flex items-center justify-center"
                    style={{
                      background: "linear-gradient(135deg, #6366f1, #ec4899)",
                    }}
                  >
                    <Sparkles size={10} color="#fff" strokeWidth={2} />
                  </div>
                  <span className="text-[12px] font-semibold text-[#333]">
                    AI 브리핑
                  </span>
                </div>

                <p className="text-[13px] font-medium mb-1">{briefing.greeting}</p>
                <p className="text-[11px] text-[#777169] leading-relaxed mb-2.5">
                  {briefing.summary}
                </p>

                <div className="flex flex-col gap-1.5">
                  {briefing.highlights.map((h, i) => {
                    const Icon = briefingIcon[h.icon] ?? Sparkles;
                    const color = briefingIconColor[h.icon] ?? "#999";
                    return (
                      <div
                        key={i}
                        className="flex items-start gap-2 px-2.5 py-2 rounded-[8px]"
                        style={{ backgroundColor: "rgba(255,255,255,0.7)" }}
                      >
                        <span
                          className="w-4 h-4 rounded-full flex items-center justify-center shrink-0 mt-0.5"
                          style={{ backgroundColor: `${color}15` }}
                        >
                          <Icon size={9} color={color} strokeWidth={2} />
                        </span>
                        <p className="text-[11px] text-[#444] leading-[1.5]">
                          {h.text}
                        </p>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ── Action Needed ── */}
        {actionNeeded.length > 0 && (
          <div className="mb-4">
            <p className="text-[11px] font-semibold text-[#d97706] uppercase tracking-wider mb-2 px-1">
              내가 할 일
            </p>
            <div className="flex flex-col gap-2">
              {actionNeeded.map((a) => (
                <MiniActivityCard
                  key={a.id}
                  activity={a}
                  onClick={() => onActivityClick?.(a)}
                />
              ))}
            </div>
          </div>
        )}

        {/* ── In Progress ── */}
        {inProgress.length > 0 && (
          <div className="mb-4">
            <p className="text-[11px] font-semibold text-[#2563eb] uppercase tracking-wider mb-2 px-1">
              진행 중
            </p>
            <div className="flex flex-col gap-2">
              {inProgress.map((a) => (
                <MiniActivityCard
                  key={a.id}
                  activity={a}
                  onClick={() => onActivityClick?.(a)}
                />
              ))}
            </div>
          </div>
        )}

        {/* ── Done ── */}
        {done.length > 0 && (
          <div className="mb-4">
            <p className="text-[11px] font-semibold text-[#999] uppercase tracking-wider mb-2 px-1">
              완료
            </p>
            <div className="flex flex-col gap-2">
              {done.map((a) => (
                <MiniActivityCard
                  key={a.id}
                  activity={a}
                  onClick={() => onActivityClick?.(a)}
                  muted
                />
              ))}
            </div>
          </div>
        )}

        {/* ── Empty ── */}
        {dateActivities.length === 0 && (
          <div className="flex flex-col items-center justify-center py-10">
            <p className="text-[12px] text-[#bbb]">이 날짜에 활동이 없어요</p>
          </div>
        )}
      </div>
    </div>
  );
}

/* ═══════════════════════════════
   Mini Activity Card (for right panel)
   ═══════════════════════════════ */

function MiniActivityCard({
  activity,
  onClick,
  muted,
}: {
  activity: Activity;
  onClick?: () => void;
  muted?: boolean;
}) {
  const Icon = activityTypeIcon[activity.type];
  const color = activityTypeColor[activity.type];
  const isAction = activity.status === "action-needed";

  return (
    <button
      onClick={onClick}
      className="flex items-start gap-2 w-full px-2.5 py-2.5 text-left cursor-pointer transition-all hover:translate-y-[-0.5px]"
      style={{
        borderRadius: "10px",
        backgroundColor: muted ? "#fafafa" : "#fff",
        boxShadow: isAction
          ? "rgba(245,158,11,0.1) 0px 0px 0px 1px, rgba(245,158,11,0.04) 0px 2px 6px"
          : "rgba(0,0,0,0.06) 0px 0px 0px 1px",
        opacity: muted ? 0.7 : 1,
      }}
    >
      {/* Icon */}
      <div
        className="w-7 h-7 rounded-[7px] flex items-center justify-center shrink-0"
        style={{ backgroundColor: `${color}10` }}
      >
        <Icon size={13} color={color} strokeWidth={1.5} />
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <p className="text-[12px] font-medium text-[#111] truncate mb-0.5">
          {activity.title}
        </p>
        <p className="text-[11px] text-[#999] truncate">{activity.description}</p>

        {/* AI Insight (compact) */}
        {activity.aiInsight && !muted && (
          <div className="flex items-center gap-1.5 mt-1.5">
            <Sparkles size={9} color="#6366f1" strokeWidth={2} className="shrink-0" />
            <p className="text-[10px] text-[#6366f1] truncate">
              {activity.aiInsight}
            </p>
          </div>
        )}

        {/* Action */}
        {activity.actionLabel && !muted && (
          <span
            className="inline-flex items-center gap-1 mt-1.5 px-2 py-[2px] text-[10px] font-medium rounded-full"
            style={{
              backgroundColor: isAction ? `${color}12` : "#f5f5f5",
              color: isAction ? color : "#777",
            }}
          >
            {activity.actionLabel}
            <ArrowRight size={8} strokeWidth={2} />
          </span>
        )}
      </div>
    </button>
  );
}
