"use client";

import { useState, useMemo } from "react";
import {
  FileCheck, Clock, Check, X, Zap, ChevronDown, ChevronRight, ChevronUp,
  Sparkles, AlertTriangle, BarChart3, Package, User, Building2,
  MapPin, RefreshCw, TrendingDown, ShieldCheck, Filter, Search,
  ArrowUpDown, MessageSquare, CalendarDays, ShoppingCart, Eye,
} from "lucide-react";
import { approvalRequests } from "@/data/approvals";
import type { ApprovalRequest, ApprovalStatus } from "@/lib/types";

/* ─── 상태 스타일 ─── */
const statusConfig: Record<ApprovalStatus, { label: string; color: string; bg: string; icon: React.ReactNode }> = {
  "대기중": { label: "대기중", color: "#f59e0b", bg: "rgba(245,158,11,0.08)", icon: <Clock size={12} strokeWidth={2} /> },
  "승인": { label: "승인", color: "#22c55e", bg: "rgba(34,197,94,0.08)", icon: <Check size={12} strokeWidth={2} /> },
  "반려": { label: "반려", color: "#ef4444", bg: "rgba(239,68,68,0.08)", icon: <X size={12} strokeWidth={2} /> },
  "자동승인": { label: "자동승인", color: "#6366f1", bg: "rgba(99,102,241,0.08)", icon: <Zap size={12} strokeWidth={2} /> },
  "취소": { label: "취소", color: "#999", bg: "rgba(0,0,0,0.04)", icon: <X size={12} strokeWidth={2} /> },
};

function formatPrice(n: number) {
  return n.toLocaleString("ko-KR") + "원";
}

function formatDate(iso: string) {
  const d = new Date(iso);
  return `${d.getMonth() + 1}/${d.getDate()} ${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
}

function formatDateShort(iso: string) {
  const d = new Date(iso);
  return `${d.getFullYear()}.${d.getMonth() + 1}.${d.getDate()}`;
}

/* ═══════════════════════════════════════
   구매요청서 관리 (C-10)
   ═══════════════════════════════════════ */

/* ─── CSS keyframes (inline style tag) ─── */
const liveStyles = `
@keyframes pulse-dot {
  0%, 100% { opacity: 1; transform: scale(1); }
  50% { opacity: 0.4; transform: scale(0.85); }
}
@keyframes shimmer {
  0% { background-position: -200% 0; }
  100% { background-position: 200% 0; }
}
@keyframes fade-in-up {
  from { opacity: 0; transform: translateY(6px); }
  to { opacity: 1; transform: translateY(0); }
}
`;

export default function OrderMgmtPage() {
  const [filterStatus, setFilterStatus] = useState<ApprovalStatus | "전체">("전체");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState<"latest" | "amount">("latest");
  /* 미완료 인텐트(구매 준비 감지)는 "내 활동" 페이지에서만 노출 */

  /* 필터링 + 정렬 */
  const filteredRequests = useMemo(() => {
    let list = [...approvalRequests];
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

  /* 통계 */
  const stats = useMemo(() => {
    const pending = approvalRequests.filter((r) => r.status === "대기중").length;
    const approved = approvalRequests.filter((r) => r.status === "승인" || r.status === "자동승인").length;
    const rejected = approvalRequests.filter((r) => r.status === "반려").length;
    const totalPending = approvalRequests.filter((r) => r.status === "대기중").reduce((s, r) => s + r.totalPrice, 0);
    return { pending, approved, rejected, totalPending };
  }, []);

  return (
    <div className="h-full flex">
      <style dangerouslySetInnerHTML={{ __html: liveStyles }} />
      {/* ══════ 좌측: 리스트 ══════ */}
      <div className="flex-1 flex flex-col h-full overflow-hidden" style={{ borderRight: selectedRequest ? "1px solid rgba(0,0,0,0.05)" : "none" }}>
        {/* 헤더 */}
        <div className="px-6 pt-6 pb-4 shrink-0">
          <div className="flex items-center gap-3 mb-4">
            <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-[#f5f5f5]">
              <FileCheck size={20} strokeWidth={1.5} color="#333" />
            </div>
            <div>
              <h1 className="text-[20px] font-semibold" style={{ letterSpacing: "-0.3px" }}>구매요청서 관리</h1>
              <p className="text-[13px] text-[#999]">품의 요청 승인 · 반려 · 아카이브</p>
            </div>
          </div>

          {/* 통계 카드 */}
          <div className="grid grid-cols-3 gap-3 mb-4">
            <StatCard
              label="승인 대기"
              value={String(stats.pending)}
              sub={formatPrice(stats.totalPending)}
              color="#f59e0b"
              icon={<Clock size={14} strokeWidth={1.5} />}
            />
            <StatCard
              label="승인 완료"
              value={String(stats.approved)}
              sub="이번 달"
              color="#22c55e"
              icon={<Check size={14} strokeWidth={1.5} />}
            />
            <StatCard
              label="반려"
              value={String(stats.rejected)}
              sub="이번 달"
              color="#ef4444"
              icon={<X size={14} strokeWidth={1.5} />}
            />
          </div>

          {/* ── 준비 중인 구매 (AI 실시간 동기화 레이어) ── */}
          {/* 미완료 인텐트(구매 준비 감지)는 "내 활동" 페이지로 이동됨 */}

          {/* 필터바 */}
          <div className="flex items-center gap-2">
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
        </div>

        {/* 리스트 */}
        <div className="flex-1 overflow-y-auto px-6 pb-6">
          {filteredRequests.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16">
              <FileCheck size={32} strokeWidth={1} color="#ddd" />
              <p className="text-[13px] text-[#999] mt-3">해당 조건의 요청이 없습니다</p>
            </div>
          ) : (
            <div className="flex flex-col gap-2">
              {filteredRequests.map((req) => {
                const sc = statusConfig[req.status];
                const isSelected = selectedId === req.id;
                return (
                  <button
                    key={req.id}
                    onClick={() => setSelectedId(isSelected ? null : req.id)}
                    className="w-full text-left px-4 py-3.5 transition-all cursor-pointer group"
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
                          {/* 상태 뱃지 */}
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
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* ══════ 우측: 상세 패널 ══════ */}
      {selectedRequest && (
        <DetailPanel
          request={selectedRequest}
          onClose={() => setSelectedId(null)}
        />
      )}
    </div>
  );
}

/* ═══════════════════════════════════════
   통계 카드
   ═══════════════════════════════════════ */
function StatCard({ label, value, sub, color, icon }: { label: string; value: string; sub: string; color: string; icon: React.ReactNode }) {
  return (
    <div
      className="px-4 py-3"
      style={{ borderRadius: "12px", boxShadow: "rgba(0,0,0,0.04) 0px 0px 0px 1px" }}
    >
      <div className="flex items-center gap-1.5 mb-1">
        <span style={{ color }}>{icon}</span>
        <span className="text-[11px] text-[#999]">{label}</span>
      </div>
      <p className="text-[22px] font-bold" style={{ color, letterSpacing: "-0.5px" }}>{value}</p>
      <p className="text-[11px] text-[#bbb] mt-0.5">{sub}</p>
    </div>
  );
}

/* ═══════════════════════════════════════
   상세 패널 (우측)
   ═══════════════════════════════════════ */
function DetailPanel({ request, onClose }: { request: ApprovalRequest; onClose: () => void }) {
  const [actionNote, setActionNote] = useState("");
  const [actionDone, setActionDone] = useState<"승인" | "반려" | null>(null);
  const sc = statusConfig[request.status];
  const isPending = request.status === "대기중";

  const handleAction = (action: "승인" | "반려") => {
    setActionDone(action);
  };

  return (
    <div className="w-[400px] shrink-0 h-full overflow-y-auto bg-white">
      <div className="px-6 py-6">
        {/* 헤더 */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <span
              className="inline-flex items-center gap-1 px-2.5 py-1 text-[11px] font-medium rounded-full"
              style={{ backgroundColor: sc.bg, color: sc.color }}
            >
              {sc.icon}{sc.label}
            </span>
            {request.urgency === "urgent" && (
              <span className="inline-flex items-center gap-0.5 px-2 py-1 text-[10px] font-medium rounded-full" style={{ backgroundColor: "rgba(239,68,68,0.08)", color: "#ef4444" }}>
                <AlertTriangle size={10} strokeWidth={2} />긴급
              </span>
            )}
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg cursor-pointer hover:bg-[#f5f5f5] transition-colors">
            <X size={16} strokeWidth={1.5} color="#999" />
          </button>
        </div>

        <h2 className="text-[18px] font-semibold mb-1" style={{ letterSpacing: "-0.3px" }}>{request.title}</h2>
        <p className="text-[12px] text-[#999] mb-5">{formatDateShort(request.createdAt)} 요청</p>

        {/* 요청자 */}
        <DetailSection title="요청자" icon={User}>
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-[#f0f0f0] flex items-center justify-center text-[12px] font-semibold text-[#555]">
              {request.requestedByName.slice(0, 1)}
            </div>
            <div>
              <p className="text-[13px] font-medium text-[#333]">{request.requestedByName}</p>
              <p className="text-[11px] text-[#999]">{request.department}</p>
            </div>
          </div>
        </DetailSection>

        {/* 주문 품목 */}
        <DetailSection title="주문 품목" icon={Package}>
          <div className="flex flex-col gap-2">
            {request.items.map((item, i) => (
              <div key={i} className="flex items-center justify-between py-1.5" style={{ borderBottom: i < request.items.length - 1 ? "1px solid rgba(0,0,0,0.04)" : undefined }}>
                <div className="flex-1 min-w-0">
                  <p className="text-[12px] text-[#333] font-medium truncate">{item.productName}</p>
                  <p className="text-[11px] text-[#999]">{formatPrice(item.unitPrice)} × {item.quantity}</p>
                </div>
                <p className="text-[13px] font-semibold text-[#333] shrink-0">{formatPrice(item.unitPrice * item.quantity)}</p>
              </div>
            ))}
            <div className="flex items-center justify-between pt-2">
              <span className="text-[12px] text-[#777]">합계</span>
              <span className="text-[16px] font-bold" style={{ letterSpacing: "-0.3px" }}>{formatPrice(request.totalPrice)}</span>
            </div>
          </div>
        </DetailSection>

        {/* 배송지 */}
        <DetailSection title="배송지" icon={MapPin}>
          <p className="text-[12px] text-[#555]">{request.shippingAddress}</p>
        </DetailSection>

        {/* AI 인사이트 — 에이전트 가치 핵심 */}
        {request.aiInsights && request.aiInsights.length > 0 && (
          <div
            className="mb-5 px-4 py-4"
            style={{
              borderRadius: "12px",
              background: "linear-gradient(135deg, rgba(99,102,241,0.05) 0%, rgba(139,92,246,0.03) 100%)",
              boxShadow: "rgba(99,102,241,0.1) 0px 0px 0px 1px",
            }}
          >
            <div className="flex items-center gap-2 mb-2.5">
              <div className="flex items-center justify-center w-5 h-5 rounded-md" style={{ backgroundColor: "rgba(99,102,241,0.1)" }}>
                <Sparkles size={11} strokeWidth={1.5} color="#6366f1" />
              </div>
              <span className="text-[12px] font-semibold text-[#6366f1]">에이전트 분석</span>
            </div>

            {/* 품의 사유 */}
            <p className="text-[12px] text-[#333] font-medium leading-[1.6] mb-2.5">{request.reason}</p>

            {/* 인사이트 목록 */}
            <div className="flex flex-col gap-1.5">
              {request.aiInsights.map((insight, i) => (
                <p
                  key={i}
                  className="text-[11px] leading-[1.5] pl-2.5"
                  style={{
                    borderLeft: `2px solid ${insight.startsWith("⚠️") ? "rgba(245,158,11,0.4)" : "rgba(99,102,241,0.2)"}`,
                    color: insight.startsWith("⚠️") ? "#b45309" : "#666",
                  }}
                >
                  {insight}
                </p>
              ))}
            </div>

            {/* 예산 사용률 미니바 */}
            {request.budgetUsagePercent != null && (
              <div className="mt-3 pt-2.5" style={{ borderTop: "1px solid rgba(99,102,241,0.08)" }}>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[10px] text-[#999]">{request.department} 예산 사용률</span>
                  <span className="text-[11px] font-semibold" style={{ color: request.budgetUsagePercent > 80 ? "#f59e0b" : "#6366f1" }}>
                    {request.budgetUsagePercent}%
                  </span>
                </div>
                <div className="w-full h-1.5 bg-[#f0f0f0] overflow-hidden" style={{ borderRadius: "3px" }}>
                  <div
                    className="h-full transition-all"
                    style={{
                      width: `${Math.min(request.budgetUsagePercent, 100)}%`,
                      backgroundColor: request.budgetUsagePercent > 80 ? "#f59e0b" : "#6366f1",
                      borderRadius: "3px",
                    }}
                  />
                </div>
              </div>
            )}
          </div>
        )}

        {/* 승인자 응답 (이미 처리된 건) */}
        {request.respondedAt && (
          <DetailSection title="승인자 응답" icon={MessageSquare}>
            <div className="flex items-center gap-2 mb-1.5">
              <span className="text-[11px] text-[#999]">{request.approverName}</span>
              <span className="text-[11px] text-[#ccc]">·</span>
              <span className="text-[11px] text-[#bbb]">{formatDate(request.respondedAt)}</span>
            </div>
            {request.responseNote && (
              <p className="text-[12px] text-[#555] leading-[1.6] p-3" style={{ borderRadius: "8px", backgroundColor: "#fafafa" }}>
                {request.responseNote}
              </p>
            )}
          </DetailSection>
        )}

        {/* ── 액션 영역 (대기중인 건만) ── */}
        {isPending && !actionDone && (
          <div className="mt-6 pt-5" style={{ borderTop: "1px solid rgba(0,0,0,0.05)" }}>
            <label className="text-[12px] text-[#999] mb-1.5 block">승인자 코멘트 (선택)</label>
            <textarea
              value={actionNote}
              onChange={(e) => setActionNote(e.target.value)}
              placeholder="승인 또는 반려 사유를 입력하세요"
              rows={2}
              className="w-full px-3 py-2.5 text-[12px] outline-none placeholder:text-[#ccc] resize-none leading-[1.6] mb-3"
              style={{ borderRadius: "10px", boxShadow: "rgba(0,0,0,0.06) 0px 0px 0px 1px" }}
            />
            <div className="flex gap-2">
              <button
                onClick={() => handleAction("반려")}
                className="flex-1 flex items-center justify-center gap-1.5 py-[10px] text-[13px] font-medium text-[#ef4444] cursor-pointer transition-colors hover:bg-[rgba(239,68,68,0.04)]"
                style={{ borderRadius: "10px", boxShadow: "rgba(239,68,68,0.2) 0px 0px 0px 1px" }}
              >
                <X size={14} strokeWidth={1.5} />
                반려
              </button>
              <button
                onClick={() => handleAction("승인")}
                className="flex-1 flex items-center justify-center gap-1.5 py-[10px] text-[13px] font-semibold text-white bg-[#1a1a1a] cursor-pointer transition-opacity hover:opacity-80"
                style={{ borderRadius: "10px" }}
              >
                <Check size={14} strokeWidth={2} />
                승인
              </button>
            </div>
          </div>
        )}

        {/* 액션 완료 */}
        {actionDone && (
          <div
            className="mt-6 flex flex-col items-center py-6"
            style={{
              borderRadius: "12px",
              backgroundColor: actionDone === "승인" ? "rgba(34,197,94,0.04)" : "rgba(239,68,68,0.04)",
            }}
          >
            <div
              className="w-12 h-12 rounded-full flex items-center justify-center mb-3"
              style={{ backgroundColor: actionDone === "승인" ? "rgba(34,197,94,0.1)" : "rgba(239,68,68,0.1)" }}
            >
              {actionDone === "승인"
                ? <Check size={22} strokeWidth={2} color="#22c55e" />
                : <X size={22} strokeWidth={2} color="#ef4444" />}
            </div>
            <p className="text-[15px] font-semibold" style={{ color: actionDone === "승인" ? "#16a34a" : "#ef4444" }}>
              {actionDone === "승인" ? "승인 완료" : "반려 완료"}
            </p>
            <p className="text-[12px] text-[#999] mt-1">
              {actionDone === "승인" ? "결제 진행 알림이 요청자에게 전송됩니다" : "반려 사유가 요청자에게 전송됩니다"}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

/* ─── 상세 섹션 래퍼 ─── */
function DetailSection({
  title,
  icon: Icon,
  children,
}: {
  title: string;
  icon: React.ComponentType<{ size?: number; strokeWidth?: number; color?: string }>;
  children: React.ReactNode;
}) {
  return (
    <div className="mb-4">
      <div className="flex items-center gap-1.5 mb-2">
        <Icon size={13} strokeWidth={1.5} color="#999" />
        <span className="text-[11px] font-medium text-[#999]">{title}</span>
      </div>
      <div>{children}</div>
    </div>
  );
}
