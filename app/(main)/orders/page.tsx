"use client";

import { useState, useMemo, useCallback, useEffect } from "react";
import { activities, dailyBriefings } from "@/data/activities";
import { approvalRequests } from "@/data/approvals";
import { orders } from "@/data/orders";
import type { Activity, ApprovalRequest, ApprovalStatus } from "@/lib/types";
import { useRightPanel } from "@/lib/right-panel-context";
import Calendar from "@/components/ui/Calendar";
import ActivityRightPanel from "./ActivityRightPanel";
import ActivityDetailPanel from "./ActivityDetailPanel";
import {
  Sparkles,
  AlertCircle,
  Clock,
  CheckCircle2,
  CalendarDays,
  Check,
  X,
  Zap,
  AlertTriangle,
  ChevronRight,
  Search,
  ArrowUpDown,
  FileCheck,
  Package,
} from "lucide-react";

/* ─── Helpers ─── */

const statusDotColor: Record<Activity["status"], string> = {
  "action-needed": "#f59e0b",
  "in-progress": "#3b82f6",
  done: "#22c55e",
  info: "#a3a3a3",
};

function formatPrice(n: number) {
  return n.toLocaleString("ko-KR") + "원";
}

function formatDate(iso: string) {
  const d = new Date(iso);
  return `${d.getMonth() + 1}/${d.getDate()} ${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
}

const approvalStatusConfig: Record<ApprovalStatus, { label: string; color: string; bg: string; icon: React.ReactNode }> = {
  "대기중": { label: "대기중", color: "#f59e0b", bg: "rgba(245,158,11,0.08)", icon: <Clock size={12} strokeWidth={2} /> },
  "승인": { label: "승인", color: "#22c55e", bg: "rgba(34,197,94,0.08)", icon: <Check size={12} strokeWidth={2} /> },
  "반려": { label: "반려", color: "#ef4444", bg: "rgba(239,68,68,0.08)", icon: <X size={12} strokeWidth={2} /> },
  "자동승인": { label: "자동승인", color: "#6366f1", bg: "rgba(99,102,241,0.08)", icon: <Zap size={12} strokeWidth={2} /> },
  "취소": { label: "취소", color: "#999", bg: "rgba(0,0,0,0.04)", icon: <X size={12} strokeWidth={2} /> },
};

/* ─── Tabs ─── */
type ViewTab = "내 활동" | "회사 활동";
const viewTabs: ViewTab[] = ["내 활동", "회사 활동"];

/* ─── 내 활동 필터 ─── */
type ActivityFilter = "전체" | "승인 대기" | "결제 완료" | "배송중" | "배송 완료";
const activityFilters: ActivityFilter[] = ["전체", "승인 대기", "결제 완료", "배송중", "배송 완료"];

function matchFilter(a: Activity, f: ActivityFilter): boolean {
  if (f === "전체") return true;
  if (f === "승인 대기") return a.type === "approval" || (a.type === "order" && a.status === "action-needed");
  if (f === "결제 완료") return a.type === "payment" && a.status === "done";
  if (f === "배송중") return a.type === "delivery" && a.status === "in-progress";
  if (f === "배송 완료") return a.type === "delivery" && a.status === "done";
  return true;
}

/* ═══════════════════════════════
   Main Component
   ═══════════════════════════════ */

export default function MyActivityPage() {
  const [viewTab, setViewTab] = useState<ViewTab>("내 활동");
  const [selectedDate, setSelectedDate] = useState<string | null>("2026-04-13");
  const [activityFilter, setActivityFilter] = useState<ActivityFilter>("전체");
  const { openPanel, closePanel } = useRightPanel();

  /* ── 필터 카운트 ── */
  const filterCounts = useMemo(() => {
    const counts: Record<ActivityFilter, number> = {
      "전체": 0, "승인 대기": 0, "결제 완료": 0, "배송중": 0, "배송 완료": 0,
    };
    for (const a of activities) {
      for (const f of activityFilters) {
        if (matchFilter(a, f)) counts[f]++;
      }
    }
    return counts;
  }, []);

  /* ── Calendar events (필터 적용) ── */
  const calendarEvents = useMemo(() => {
    return activities
      .filter((a) => matchFilter(a, activityFilter))
      .map((a) => ({
        date: a.date,
        label: a.title,
        color: statusDotColor[a.status],
      }));
  }, [activityFilter]);

  /* ── Summary counts ── */
  const totalAction = activities.filter((a) => a.status === "action-needed").length;
  const totalProgress = activities.filter((a) => a.status === "in-progress").length;
  const todayBriefing = dailyBriefings["2026-04-13"];

  /* ── Open right panel with activities for a date ── */
  const handleDateClick = useCallback(
    (date: string) => {
      setSelectedDate(date);
      const panelContent = (
        <ActivityRightPanel
          selectedDate={date}
          onActivityClick={(act) => {
            const relatedOrder = act.relatedOrderId
              ? orders.find((o) => o.id === act.relatedOrderId)
              : undefined;
            openPanel(
              <ActivityDetailPanel activity={act} order={relatedOrder} />,
              "activity-detail",
              {
                label: act.title.length > 15 ? act.title.slice(0, 15) + "…" : act.title,
                onBack: () => handleDateClick(date),
                backLabel: "내 활동",
              },
            );
          }}
        />
      );
      openPanel(panelContent, "activity-list", { label: "내 활동" });
    },
    [openPanel]
  );

  /* ── Auto-open right panel on mount, close on unmount ── */
  useEffect(() => {
    if (selectedDate && viewTab === "내 활동") {
      handleDateClick(selectedDate);
    }
    return () => {
      closePanel();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /* ── Close panel when switching to 회사 활동 ── */
  useEffect(() => {
    if (viewTab === "회사 활동") {
      closePanel();
    } else if (viewTab === "내 활동" && selectedDate) {
      handleDateClick(selectedDate);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [viewTab]);

  return (
    <div className="h-full overflow-y-auto">
      <div className="mx-auto px-6 py-8" style={{ maxWidth: viewTab === "내 활동" ? "900px" : "960px" }}>
        {/* ── Header ── */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1
              className="text-[22px] font-semibold mb-1"
              style={{ letterSpacing: "-0.3px" }}
            >
              내 활동
            </h1>
            {/* Summary badges */}
            <div className="flex items-center gap-2.5">
              {totalAction > 0 && (
                <span
                  className="inline-flex items-center gap-1.5 px-2.5 py-[3px] text-[12px] font-medium rounded-full"
                  style={{ backgroundColor: "rgba(245,158,11,0.08)", color: "#d97706" }}
                >
                  <AlertCircle size={12} strokeWidth={2} />
                  할 일 {totalAction}건
                </span>
              )}
              {totalProgress > 0 && (
                <span
                  className="inline-flex items-center gap-1.5 px-2.5 py-[3px] text-[12px] font-medium rounded-full"
                  style={{ backgroundColor: "rgba(59,130,246,0.08)", color: "#2563eb" }}
                >
                  <Clock size={12} strokeWidth={2} />
                  진행 {totalProgress}건
                </span>
              )}
            </div>
          </div>

          {/* View tabs */}
          <div className="flex items-center gap-1">
            {viewTabs.map((tab) => (
              <button
                key={tab}
                onClick={() => setViewTab(tab)}
                className="px-4 py-[6px] text-[13px] font-medium cursor-pointer transition-all"
                style={{
                  borderRadius: "9999px",
                  backgroundColor: viewTab === tab ? "#000" : "#f5f5f5",
                  color: viewTab === tab ? "#fff" : "#777169",
                }}
              >
                {tab}
              </button>
            ))}
          </div>
        </div>

        {/* ── Tab content ── */}
        {viewTab === "내 활동" ? (
          <MyActivityTab
            todayBriefing={todayBriefing}
            calendarEvents={calendarEvents}
            selectedDate={selectedDate}
            onDateClick={handleDateClick}
            activityFilter={activityFilter}
            setActivityFilter={setActivityFilter}
            filterCounts={filterCounts}
          />
        ) : (
          <CompanyActivityTab />
        )}
      </div>
    </div>
  );
}

/* ═══════════════════════════════
   내 활동 탭
   ═══════════════════════════════ */

function MyActivityTab({
  todayBriefing,
  calendarEvents,
  selectedDate,
  onDateClick,
  activityFilter,
  setActivityFilter,
  filterCounts,
}: {
  todayBriefing: (typeof dailyBriefings)[string] | undefined;
  calendarEvents: { date: string; label: string; color: string }[];
  selectedDate: string | null;
  onDateClick: (date: string) => void;
  activityFilter: ActivityFilter;
  setActivityFilter: (f: ActivityFilter) => void;
  filterCounts: Record<ActivityFilter, number>;
}) {
  return (
    <>
      {/* ── AI Quick Brief ── */}
      {todayBriefing && (
        <div
          className="mb-6 px-4 py-3.5 rounded-[16px] cursor-pointer transition-all hover:translate-y-[-1px]"
          style={{
            background: "linear-gradient(135deg, rgba(99,102,241,0.05), rgba(236,72,153,0.03))",
            boxShadow: "rgba(99,102,241,0.08) 0px 0px 0px 1px, rgba(99,102,241,0.04) 0px 2px 8px",
          }}
          onClick={() => onDateClick("2026-04-13")}
        >
          <div className="flex items-center gap-3">
            <div
              className="w-8 h-8 rounded-full flex items-center justify-center shrink-0"
              style={{ background: "linear-gradient(135deg, #6366f1, #ec4899)" }}
            >
              <Sparkles size={14} color="#fff" strokeWidth={2} />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[14px] font-medium text-[#222]">{todayBriefing.greeting}</p>
              <p className="text-[12px] text-[#777169] mt-0.5 truncate">{todayBriefing.summary}</p>
            </div>
            <span className="text-[11px] text-[#999] shrink-0">자세히 →</span>
          </div>
        </div>
      )}

      {/* ── 활동 필터 바 ── */}
      <div className="flex items-center justify-between mb-3 gap-3 flex-wrap">
        {/* Legend (좌측) */}
        <div className="flex items-center gap-4">
          <span className="flex items-center gap-1.5 text-[11px] text-[#999]">
            <span className="w-2 h-2 rounded-full" style={{ backgroundColor: "#f59e0b" }} />할 일
          </span>
          <span className="flex items-center gap-1.5 text-[11px] text-[#999]">
            <span className="w-2 h-2 rounded-full" style={{ backgroundColor: "#3b82f6" }} />진행 중
          </span>
          <span className="flex items-center gap-1.5 text-[11px] text-[#999]">
            <span className="w-2 h-2 rounded-full" style={{ backgroundColor: "#22c55e" }} />완료
          </span>
        </div>

        {/* Filter pills (우측) */}
        <div className="flex items-center p-[4px] shrink-0" style={{ borderRadius: "12px", backgroundColor: "#f5f5f5" }}>
          {activityFilters.map((f) => {
            const active = activityFilter === f;
            const count = filterCounts[f];
            const showCount = f !== "전체";
            return (
              <button
                key={f}
                onClick={() => setActivityFilter(f)}
                className="px-3 py-[6px] text-[12px] font-medium cursor-pointer transition-all"
                style={{
                  borderRadius: "8px",
                  backgroundColor: active ? "#1a1a1a" : "transparent",
                  color: active ? "#fff" : "#777169",
                  boxShadow: active ? "rgba(0,0,0,0.12) 0px 1px 3px" : "none",
                }}
              >
                {f}
                {showCount && (
                  <span
                    className="ml-1"
                    style={{ color: active ? "rgba(255,255,255,0.6)" : "#bbb", fontWeight: 400 }}
                  >
                    ({count})
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* ── Big Calendar ── */}
      <div
        className="bg-white p-6"
        style={{
          borderRadius: "20px",
          boxShadow: "rgba(0,0,0,0.06) 0px 0px 0px 1px, rgba(0,0,0,0.04) 0px 2px 8px, rgba(0,0,0,0.02) 0px 8px 24px",
        }}
      >
        <Calendar
          events={calendarEvents}
          onDateClick={onDateClick}
          selectedDate={selectedDate}
          size="large"
        />
      </div>

      {/* ── Bottom hint ── */}
      <div className="flex items-center justify-center gap-2 mt-6">
        <CalendarDays size={14} color="#ccc" strokeWidth={1.5} />
        <p className="text-[12px] text-[#bbb]">
          {selectedDate
            ? `${selectedDate.replace(/-/g, ".")} 선택됨 — 우측 패널에서 상세 확인`
            : "날짜를 선택하세요"}
        </p>
      </div>
    </>
  );
}

/* ═══════════════════════════════
   회사 활동 탭 (구매요청서 관리 통합)
   ═══════════════════════════════ */

function CompanyActivityTab() {
  const [filterStatus, setFilterStatus] = useState<ApprovalStatus | "전체">("전체");
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState<"latest" | "amount">("latest");
  const [selectedId, setSelectedId] = useState<string | null>(null);

  // 승인/반려 상태 관리 (데모용 로컬 상태)
  const [statusOverrides, setStatusOverrides] = useState<Record<string, { status: ApprovalStatus; note?: string }>>({});
  const [toast, setToast] = useState<string | null>(null);
  const [rejectTarget, setRejectTarget] = useState<ApprovalRequest | null>(null);
  const [rejectReason, setRejectReason] = useState("");
  const [approveConfirm, setApproveConfirm] = useState<ApprovalRequest | null>(null);

  const showToast = useCallback((msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3500);
  }, []);

  // 승인 처리 — 소액(30만 이하)이면 바로 결제 알림, 고액이면 결제 담당자 알림
  const handleApprove = useCallback((req: ApprovalRequest) => {
    setStatusOverrides((prev) => ({ ...prev, [req.id]: { status: "승인" } }));
    setApproveConfirm(null);
    setSelectedId(null);
    if (req.totalPrice <= 300000) {
      showToast(`${req.title} — 승인 완료. 등록된 결제수단으로 자동 결제가 진행됩니다.`);
    } else {
      showToast(`${req.title} — 승인 완료. 결제 담당자(${req.requestedByName})에게 결제 알림을 보냈습니다.`);
    }
  }, [showToast]);

  // 반려 처리
  const handleReject = useCallback(() => {
    if (!rejectTarget || !rejectReason.trim()) return;
    setStatusOverrides((prev) => ({ ...prev, [rejectTarget.id]: { status: "반려", note: rejectReason.trim() } }));
    setSelectedId(null);
    showToast(`${rejectTarget.title} — 반려 처리되었습니다.`);
    setRejectTarget(null);
    setRejectReason("");
  }, [rejectTarget, rejectReason, showToast]);

  // 오버라이드 적용된 데이터
  const requests = useMemo(() =>
    approvalRequests.map((r) => statusOverrides[r.id] ? { ...r, status: statusOverrides[r.id].status, responseNote: statusOverrides[r.id].note ?? r.responseNote } : r),
    [statusOverrides],
  );

  /* 통계 */
  const stats = useMemo(() => {
    const pending = requests.filter((r) => r.status === "대기중").length;
    const approved = requests.filter((r) => r.status === "승인" || r.status === "자동승인").length;
    const rejected = requests.filter((r) => r.status === "반려").length;
    const totalPending = requests.filter((r) => r.status === "대기중").reduce((s, r) => s + r.totalPrice, 0);
    return { pending, approved, rejected, totalPending };
  }, [requests]);

  /* 필터링 + 정렬 */
  const filteredRequests = useMemo(() => {
    let list = [...requests];
    if (filterStatus !== "전체") list = list.filter((r) => r.status === filterStatus);
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      list = list.filter(
        (r) =>
          r.title.toLowerCase().includes(q) ||
          r.requestedByName.toLowerCase().includes(q) ||
          r.department.toLowerCase().includes(q)
      );
    }
    if (sortBy === "latest") list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    else list.sort((a, b) => b.totalPrice - a.totalPrice);
    return list;
  }, [filterStatus, searchQuery, sortBy]);

  const selectedRequest = selectedId ? approvalRequests.find((r) => r.id === selectedId) : null;

  return (
    <>
      {/* ── 상태 대시보드 ── */}
      <div className="grid grid-cols-3 gap-3 mb-5">
        <button
          onClick={() => setFilterStatus(filterStatus === "대기중" ? "전체" : "대기중")}
          className="px-4 py-3.5 text-left cursor-pointer transition-all hover:translate-y-[-1px]"
          style={{
            borderRadius: "14px",
            boxShadow: filterStatus === "대기중"
              ? "rgba(245,158,11,0.2) 0px 0px 0px 1.5px, rgba(245,158,11,0.06) 0px 4px 12px"
              : "rgba(0,0,0,0.04) 0px 0px 0px 1px",
            backgroundColor: filterStatus === "대기중" ? "rgba(245,158,11,0.02)" : "#fff",
          }}
        >
          <div className="flex items-center gap-1.5 mb-1.5">
            <Clock size={14} strokeWidth={1.5} color="#f59e0b" />
            <span className="text-[12px] text-[#999]">승인 대기</span>
          </div>
          <p className="text-[26px] font-bold text-[#f59e0b]" style={{ letterSpacing: "-0.5px" }}>
            {stats.pending}
          </p>
          <p className="text-[11px] text-[#bbb] mt-0.5">{formatPrice(stats.totalPending)}</p>
        </button>

        <button
          onClick={() => setFilterStatus(filterStatus === "승인" ? "전체" : "승인")}
          className="px-4 py-3.5 text-left cursor-pointer transition-all hover:translate-y-[-1px]"
          style={{
            borderRadius: "14px",
            boxShadow: filterStatus === "승인"
              ? "rgba(34,197,94,0.2) 0px 0px 0px 1.5px, rgba(34,197,94,0.06) 0px 4px 12px"
              : "rgba(0,0,0,0.04) 0px 0px 0px 1px",
            backgroundColor: filterStatus === "승인" ? "rgba(34,197,94,0.02)" : "#fff",
          }}
        >
          <div className="flex items-center gap-1.5 mb-1.5">
            <Check size={14} strokeWidth={1.5} color="#22c55e" />
            <span className="text-[12px] text-[#999]">승인 완료</span>
          </div>
          <p className="text-[26px] font-bold text-[#22c55e]" style={{ letterSpacing: "-0.5px" }}>
            {stats.approved}
          </p>
          <p className="text-[11px] text-[#bbb] mt-0.5">이번 달</p>
        </button>

        <button
          onClick={() => setFilterStatus(filterStatus === "반려" ? "전체" : "반려")}
          className="px-4 py-3.5 text-left cursor-pointer transition-all hover:translate-y-[-1px]"
          style={{
            borderRadius: "14px",
            boxShadow: filterStatus === "반려"
              ? "rgba(239,68,68,0.2) 0px 0px 0px 1.5px, rgba(239,68,68,0.06) 0px 4px 12px"
              : "rgba(0,0,0,0.04) 0px 0px 0px 1px",
            backgroundColor: filterStatus === "반려" ? "rgba(239,68,68,0.02)" : "#fff",
          }}
        >
          <div className="flex items-center gap-1.5 mb-1.5">
            <X size={14} strokeWidth={1.5} color="#ef4444" />
            <span className="text-[12px] text-[#999]">반려</span>
          </div>
          <p className="text-[26px] font-bold text-[#ef4444]" style={{ letterSpacing: "-0.5px" }}>
            {stats.rejected}
          </p>
          <p className="text-[11px] text-[#bbb] mt-0.5">이번 달</p>
        </button>
      </div>

      {/* ── 필터 + 검색 ── */}
      <div className="flex items-center gap-2 mb-4">
        {/* 상태 필터 */}
        <div className="flex items-center p-[3px] shrink-0" style={{ borderRadius: "10px", backgroundColor: "#f0f0f0" }}>
          {(["전체", "대기중", "승인", "반려", "자동승인"] as const).map((s) => (
            <button
              key={s}
              onClick={() => setFilterStatus(s)}
              className="px-3 py-[5px] text-[11px] font-medium cursor-pointer transition-all"
              style={{
                borderRadius: "7px",
                backgroundColor: filterStatus === s ? "#fff" : "transparent",
                color: filterStatus === s ? "#333" : "#999",
                boxShadow: filterStatus === s ? "rgba(0,0,0,0.06) 0px 1px 3px" : "none",
              }}
            >
              {s}
            </button>
          ))}
        </div>

        {/* 검색 */}
        <div className="flex items-center flex-1 gap-2 px-3 py-[6px]" style={{ borderRadius: "8px", boxShadow: "rgba(0,0,0,0.06) 0px 0px 0px 1px" }}>
          <Search size={13} strokeWidth={1.5} color="#bbb" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="요청자, 부서, 제목 검색"
            className="flex-1 text-[12px] outline-none placeholder:text-[#ccc]"
          />
        </div>

        {/* 정렬 */}
        <button
          onClick={() => setSortBy(sortBy === "latest" ? "amount" : "latest")}
          className="flex items-center gap-1 px-2.5 py-[6px] text-[11px] text-[#777] cursor-pointer shrink-0 transition-colors hover:text-[#333]"
          style={{ borderRadius: "8px", boxShadow: "rgba(0,0,0,0.06) 0px 0px 0px 1px" }}
        >
          <ArrowUpDown size={12} strokeWidth={1.5} />
          {sortBy === "latest" ? "최신순" : "금액순"}
        </button>
      </div>

      {/* ── 구매요청 리스트 ── */}
      {filteredRequests.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16">
          <FileCheck size={32} strokeWidth={1} color="#ddd" />
          <p className="text-[13px] text-[#999] mt-3">해당 조건의 요청이 없습니다</p>
        </div>
      ) : (
        <div className="flex flex-col gap-2">
          {filteredRequests.map((req) => {
            const sc = approvalStatusConfig[req.status];
            const isSelected = selectedId === req.id;
            return (
              <button
                key={req.id}
                onClick={() => setSelectedId(isSelected ? null : req.id)}
                className="w-full text-left px-4 py-3.5 transition-all cursor-pointer"
                style={{
                  borderRadius: "12px",
                  backgroundColor: isSelected ? "rgba(99,102,241,0.04)" : "#fff",
                  boxShadow: isSelected
                    ? "rgba(99,102,241,0.15) 0px 0px 0px 1px"
                    : "rgba(0,0,0,0.04) 0px 0px 0px 1px",
                }}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span
                        className="inline-flex items-center gap-1 px-2 py-0.5 text-[10px] font-medium rounded-full"
                        style={{ backgroundColor: sc.bg, color: sc.color }}
                      >
                        {sc.icon}{sc.label}
                      </span>
                      {req.urgency === "urgent" && (
                        <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 text-[10px] font-medium rounded-full" style={{ backgroundColor: "rgba(239,68,68,0.08)", color: "#ef4444" }}>
                          <AlertTriangle size={9} strokeWidth={2} />긴급
                        </span>
                      )}
                      <span className="text-[10px] text-[#bbb]">{formatDate(req.createdAt)}</span>
                    </div>
                    <p className="text-[13px] font-medium text-[#333] truncate mb-0.5">{req.title}</p>
                    <div className="flex items-center gap-2 text-[11px] text-[#999]">
                      <span>{req.requestedByName}</span>
                      <span>·</span>
                      <span>{req.department}</span>
                      <span>·</span>
                      <span>{req.items.length}개 품목</span>
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-[14px] font-semibold text-[#333]">{formatPrice(req.totalPrice)}</p>
                    <ChevronRight
                      size={14}
                      strokeWidth={1.5}
                      color="#ccc"
                      className="mt-1 ml-auto transition-transform"
                      style={{ transform: isSelected ? "rotate(90deg)" : undefined }}
                    />
                  </div>
                </div>

                {/* ── 인라인 상세 (접힘/펼침) ── */}
                {isSelected && (
                  <div
                    className="mt-3 pt-3"
                    style={{ borderTop: "1px solid rgba(0,0,0,0.05)" }}
                    onClick={(e) => e.stopPropagation()}
                  >
                    {/* 품목 */}
                    <div className="flex items-center gap-1.5 mb-2">
                      <Package size={12} strokeWidth={1.5} color="#999" />
                      <span className="text-[11px] font-medium text-[#999]">주문 품목</span>
                    </div>
                    <div className="flex flex-col gap-1 mb-3">
                      {req.items.map((item, i) => (
                        <div key={i} className="flex items-center justify-between py-1">
                          <div className="flex-1 min-w-0">
                            <p className="text-[12px] text-[#333] truncate">{item.productName}</p>
                            <p className="text-[10px] text-[#999]">{formatPrice(item.unitPrice)} × {item.quantity}</p>
                          </div>
                          <p className="text-[12px] font-medium text-[#333] shrink-0">{formatPrice(item.unitPrice * item.quantity)}</p>
                        </div>
                      ))}
                    </div>

                    {/* AI 인사이트 */}
                    {req.aiInsights && req.aiInsights.length > 0 && (
                      <div
                        className="px-3 py-2.5 mb-3 rounded-[10px]"
                        style={{ background: "linear-gradient(135deg, rgba(99,102,241,0.05), rgba(139,92,246,0.03))" }}
                      >
                        <div className="flex items-center gap-1.5 mb-1.5">
                          <Sparkles size={10} strokeWidth={1.5} color="#6366f1" />
                          <span className="text-[10px] font-semibold text-[#6366f1]">에이전트 분석</span>
                        </div>
                        <p className="text-[11px] text-[#333] leading-[1.6] mb-1.5">{req.reason}</p>
                        {req.aiInsights.map((ins, i) => (
                          <p
                            key={i}
                            className="text-[10px] leading-[1.5] pl-2 mb-0.5"
                            style={{
                              borderLeft: `2px solid ${ins.startsWith("⚠️") ? "rgba(245,158,11,0.4)" : "rgba(99,102,241,0.2)"}`,
                              color: ins.startsWith("⚠️") ? "#b45309" : "#666",
                            }}
                          >
                            {ins}
                          </p>
                        ))}
                      </div>
                    )}

                    {/* 액션 버튼 (대기중인 건만) */}
                    {req.status === "대기중" && (
                      <div className="flex gap-2">
                        <button
                          onClick={() => setRejectTarget(req)}
                          className="flex-1 flex items-center justify-center gap-1.5 py-[8px] text-[12px] font-medium text-[#ef4444] cursor-pointer transition-colors hover:bg-[rgba(239,68,68,0.04)]"
                          style={{ borderRadius: "8px", boxShadow: "rgba(239,68,68,0.2) 0px 0px 0px 1px" }}
                        >
                          <X size={13} strokeWidth={1.5} />반려
                        </button>
                        <button
                          onClick={() => setApproveConfirm(req)}
                          className="flex-1 flex items-center justify-center gap-1.5 py-[8px] text-[12px] font-semibold text-white bg-[#1a1a1a] cursor-pointer transition-opacity hover:opacity-80"
                          style={{ borderRadius: "8px" }}
                        >
                          <Check size={13} strokeWidth={2} />승인
                        </button>
                      </div>
                    )}

                    {/* 반려 사유 표시 (반려된 건) */}
                    {req.status === "반려" && req.responseNote && (
                      <div className="px-3 py-2.5 rounded-[8px]" style={{ backgroundColor: "rgba(239,68,68,0.04)", boxShadow: "rgba(239,68,68,0.1) 0px 0px 0px 1px" }}>
                        <p className="text-[11px] font-medium text-[#ef4444] mb-0.5">반려 사유</p>
                        <p className="text-[12px] text-[#666] leading-[1.5]">{req.responseNote}</p>
                      </div>
                    )}
                  </div>
                )}
              </button>
            );
          })}
        </div>
      )}

      {/* ── 토스트 ── */}
      {toast && (
        <div
          className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[60] flex items-center gap-2 px-4 py-2.5 text-[13px] font-medium text-white"
          style={{ borderRadius: "9999px", backgroundColor: "#000", boxShadow: "rgba(0,0,0,0.25) 0px 8px 24px", letterSpacing: "0.14px", maxWidth: "500px" }}
        >
          <Check size={14} strokeWidth={2} />
          {toast}
        </div>
      )}

      {/* ── 승인 확인 모달 ── */}
      {approveConfirm && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center">
          <div className="absolute inset-0 cursor-pointer" style={{ backgroundColor: "rgba(0,0,0,0.35)", backdropFilter: "blur(4px)" }} onClick={() => setApproveConfirm(null)} />
          <div className="relative w-[400px] bg-white" style={{ borderRadius: "18px", boxShadow: "rgba(0,0,0,0.06) 0px 0px 0px 1px, rgba(0,0,0,0.15) 0px 16px 48px" }}>
            <div className="px-6 pt-6 pb-2">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-[16px] font-semibold">승인</h3>
                <button onClick={() => setApproveConfirm(null)} className="flex items-center justify-center w-7 h-7 rounded-full cursor-pointer hover:bg-[#f5f2ef] transition-colors">
                  <X size={15} strokeWidth={1.5} color="#777169" />
                </button>
              </div>

              {/* 상품 요약 */}
              <div className="px-3.5 py-3 mb-4" style={{ borderRadius: "12px", backgroundColor: "#fafafa" }}>
                {approveConfirm.items.map((item, i) => (
                  <div key={i} className="flex items-center justify-between py-1">
                    <div>
                      <p className="text-[13px] font-medium">{item.productName}</p>
                      <p className="text-[11px] text-[#777169]">{formatPrice(item.unitPrice)} × {item.quantity}개</p>
                    </div>
                    <p className="text-[13px] font-semibold">{formatPrice(item.unitPrice * item.quantity)}</p>
                  </div>
                ))}
                <div className="flex items-center justify-between pt-2 mt-2" style={{ borderTop: "1px solid rgba(0,0,0,0.06)" }}>
                  <span className="text-[12px] text-[#777169]">총 금액</span>
                  <span className="text-[16px] font-semibold">{formatPrice(approveConfirm.totalPrice)}</span>
                </div>
              </div>

              {/* 시나리오 안내 */}
              <div className="px-3 py-2.5 mb-4" style={{ borderRadius: "10px", backgroundColor: "rgba(245,242,239,0.8)" }}>
                {approveConfirm.totalPrice <= 300000 ? (
                  <p className="text-[12px] text-[#4e4e4e] leading-[1.6]" style={{ letterSpacing: "0.14px" }}>
                    소액 건으로 승인 시 <strong>등록된 결제수단으로 자동 결제</strong>가 진행됩니다.
                  </p>
                ) : (
                  <p className="text-[12px] text-[#4e4e4e] leading-[1.6]" style={{ letterSpacing: "0.14px" }}>
                    승인 시 <strong>결제 담당자({approveConfirm.requestedByName})에게 결제 알림</strong>이 발송됩니다. 결제는 담당자가 직접 진행합니다.
                  </p>
                )}
              </div>
            </div>

            <div className="px-6 pb-6">
              <div className="flex gap-2">
                <button
                  onClick={() => setApproveConfirm(null)}
                  className="flex-1 py-[10px] text-[14px] font-medium text-[#4e4e4e] cursor-pointer transition-colors hover:bg-[#f5f2ef]"
                  style={{ borderRadius: "9999px", boxShadow: "rgba(0,0,0,0.06) 0px 0px 0px 1px" }}
                >
                  취소
                </button>
                <button
                  onClick={() => handleApprove(approveConfirm)}
                  className="flex-1 py-[10px] text-[14px] font-medium text-white bg-black cursor-pointer transition-opacity hover:opacity-80"
                  style={{ borderRadius: "9999px" }}
                >
                  이 상품 승인
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── 반려 사유 입력 모달 ── */}
      {rejectTarget && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center">
          <div className="absolute inset-0 cursor-pointer" style={{ backgroundColor: "rgba(0,0,0,0.35)", backdropFilter: "blur(4px)" }} onClick={() => { setRejectTarget(null); setRejectReason(""); }} />
          <div className="relative w-[400px] bg-white" style={{ borderRadius: "18px", boxShadow: "rgba(0,0,0,0.06) 0px 0px 0px 1px, rgba(0,0,0,0.15) 0px 16px 48px" }}>
            <div className="px-6 pt-6 pb-2">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-[16px] font-semibold">반려</h3>
                <button onClick={() => { setRejectTarget(null); setRejectReason(""); }} className="flex items-center justify-center w-7 h-7 rounded-full cursor-pointer hover:bg-[#f5f2ef] transition-colors">
                  <X size={15} strokeWidth={1.5} color="#777169" />
                </button>
              </div>

              {/* 상품 요약 */}
              <div className="px-3.5 py-3 mb-4" style={{ borderRadius: "12px", backgroundColor: "#fafafa" }}>
                {rejectTarget.items.map((item, i) => (
                  <div key={i} className="flex items-center justify-between py-1">
                    <div>
                      <p className="text-[13px] font-medium">{item.productName}</p>
                      <p className="text-[11px] text-[#777169]">{formatPrice(item.unitPrice)} × {item.quantity}개</p>
                    </div>
                    <p className="text-[13px] font-semibold">{formatPrice(item.unitPrice * item.quantity)}</p>
                  </div>
                ))}
              </div>

              {/* 반려 사유 */}
              <div className="mb-2">
                <p className="text-[13px] font-medium mb-2">반려 사유</p>
                <textarea
                  value={rejectReason}
                  onChange={(e) => setRejectReason(e.target.value)}
                  placeholder="반려 사유를 입력해 주세요. (선택)"
                  className="w-full px-3.5 py-3 text-[13px] resize-none focus:outline-none"
                  style={{
                    borderRadius: "12px",
                    boxShadow: "rgba(0,0,0,0.06) 0px 0px 0px 1px",
                    minHeight: "100px",
                    letterSpacing: "0.14px",
                  }}
                  rows={4}
                />
                <p className="text-[11px] text-[#999] mt-1.5 leading-[1.5]" style={{ letterSpacing: "0.14px" }}>
                  *입력된 반려 사유는 요청한 구성원이 확인할 수 있습니다.<br />
                  *반려 처리는 철회할 수 없습니다.
                </p>
              </div>
            </div>

            <div className="px-6 pb-6">
              <button
                onClick={handleReject}
                className="w-full py-[10px] text-[14px] font-medium text-white cursor-pointer transition-opacity hover:opacity-80"
                style={{ borderRadius: "9999px", backgroundColor: "#000" }}
              >
                이 상품 반려
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
