"use client";

import { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import { ChevronLeft, Plus, ArrowUpDown } from "lucide-react";
import { chats } from "@/data/chats";
import type { Chat, ChatStatus } from "@/lib/types";
import Badge from "@/components/ui/Badge";
import { PlannedTooltip } from "@/components/ui/Tooltip";
import { useSidebar } from "@/lib/sidebar-context";

/* ─── Helpers ─── */

type BadgeStatus = "완료" | "대기" | "진행중" | "반려";

function chatStatusToBadge(s: ChatStatus): BadgeStatus {
  if (s === "완료") return "완료";
  if (s === "대기") return "대기";
  return "진행중";
}

function formatDate(d: string) {
  return new Date(d).toLocaleDateString("ko-KR", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" });
}

function formatDateGroup(d: string) {
  const date = new Date(d);
  const now = new Date("2026-04-10T12:00:00");
  const diffD = Math.floor((now.getTime() - date.getTime()) / 86400000);
  if (diffD === 0) return "오늘";
  if (diffD === 1) return "어제";
  if (diffD < 7) return `${diffD}일 전`;
  return date.toLocaleDateString("ko-KR", { year: "numeric", month: "long", day: "numeric" });
}

/* ─── Types ─── */

type ViewMode = "전체" | "날짜별" | "태그별";
type SortMode = "최신순" | "오래된순";

/* ─── Component ─── */

export default function ChatListPage() {
  const router = useRouter();
  const { setHidden } = useSidebar();
  const [view, setView] = useState<ViewMode>("전체");
  const [sort, setSort] = useState<SortMode>("최신순");
  const [statusFilter, setStatusFilter] = useState<string>("전체");

  // Hide sidebar on mount, show on unmount
  useEffect(() => {
    setHidden(true);
    return () => setHidden(false);
  }, [setHidden]);

  const handleBack = () => {
    router.push("/chat");
  };

  // Filtered + sorted
  const filtered = useMemo(() => {
    let list = [...chats];
    if (statusFilter !== "전체") {
      list = list.filter((c) => c.status === statusFilter);
    }
    list.sort((a, b) => {
      const diff = new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
      return sort === "최신순" ? diff : -diff;
    });
    return list;
  }, [statusFilter, sort]);

  // Grouped
  const grouped = useMemo(() => {
    if (view === "날짜별") {
      const map = new Map<string, Chat[]>();
      for (const c of filtered) {
        const key = formatDateGroup(c.updatedAt);
        const arr = map.get(key) ?? [];
        arr.push(c);
        map.set(key, arr);
      }
      return Array.from(map.entries());
    }
    if (view === "태그별") {
      const map = new Map<string, Chat[]>();
      for (const c of filtered) {
        for (const tag of c.tags) {
          const arr = map.get(tag) ?? [];
          arr.push(c);
          map.set(tag, arr);
        }
        if (c.tags.length === 0) {
          const arr = map.get("기타") ?? [];
          arr.push(c);
          map.set("기타", arr);
        }
      }
      return Array.from(map.entries());
    }
    return null;
  }, [view, filtered]);

  return (
    <div className="h-full overflow-y-auto">
      <div className="max-w-[960px] mx-auto px-6 py-8">
        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <button
            onClick={handleBack}
            className="flex items-center justify-center w-8 h-8 rounded-lg cursor-pointer transition-colors hover:bg-[#f5f5f5]"
          >
            <ChevronLeft size={18} strokeWidth={1.5} color="#4e4e4e" />
          </button>
          <h1 className="text-[20px] font-semibold" style={{ letterSpacing: "-0.2px" }}>
            채팅 리스트
          </h1>
        </div>

        {/* Controls */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-4">
            {/* View tabs */}
            <div className="flex items-center gap-1">
              {(["전체", "날짜별", "태그별"] as ViewMode[]).map((v) => (
                <button
                  key={v}
                  onClick={() => setView(v)}
                  className="px-3 py-[5px] text-[12px] font-medium cursor-pointer transition-all"
                  style={{
                    borderRadius: "6px",
                    backgroundColor: view === v ? "#f0f0f0" : "transparent",
                    color: view === v ? "#111" : "#777169",
                  }}
                >
                  {v}
                </button>
              ))}
            </div>

            {/* Sort */}
            <button
              onClick={() => setSort((s) => s === "최신순" ? "오래된순" : "최신순")}
              className="flex items-center gap-1 px-2.5 py-[5px] text-[12px] text-[#777169] cursor-pointer transition-colors hover:bg-[#f5f5f5] rounded-md"
            >
              <ArrowUpDown size={12} strokeWidth={1.5} />
              {sort}
            </button>

            {/* Status filter */}
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="text-[12px] px-2.5 py-[5px] bg-white cursor-pointer"
              style={{ borderRadius: "6px", boxShadow: "rgba(0,0,0,0.06) 0px 0px 0px 1px", border: "none", outline: "none" }}
            >
              <option>전체</option>
              <option>진행중</option>
              <option>완료</option>
              <option>대기</option>
            </select>
          </div>

          <div className="flex items-center gap-2">
            <PlannedTooltip description="아카이브">
              <button className="px-2.5 py-[5px] text-[12px] text-[#999] cursor-pointer transition-colors hover:bg-[#f5f5f5] rounded-md">
                아카이브
              </button>
            </PlannedTooltip>
            <PlannedTooltip description="커스텀 뷰">
              <button className="flex items-center gap-1 px-2.5 py-[5px] text-[12px] text-[#999] cursor-pointer transition-colors hover:bg-[#f5f5f5] rounded-md">
                <Plus size={12} strokeWidth={1.5} />
                새 보기
              </button>
            </PlannedTooltip>
          </div>
        </div>

        {/* Content */}
        {grouped ? (
          /* Grouped view */
          <div className="flex flex-col gap-6">
            {grouped.map(([groupLabel, items]) => (
              <div key={groupLabel}>
                <p className="text-[12px] font-medium text-[#999] uppercase tracking-wider mb-2 px-1">
                  {groupLabel}
                  <span className="ml-1.5 text-[#ccc]">{items.length}</span>
                </p>
                <ChatTable chats={items} onRowClick={(c) => router.push(`/chat?id=${c.id}`)} />
              </div>
            ))}
          </div>
        ) : (
          /* Flat table */
          <ChatTable chats={filtered} onRowClick={(c) => router.push(`/chat?id=${c.id}`)} />
        )}
      </div>
    </div>
  );
}

/* ─── Notion-style table ─── */

function ChatTable({ chats: items, onRowClick }: { chats: Chat[]; onRowClick: (c: Chat) => void }) {
  return (
    <div
      className="overflow-hidden bg-white"
      style={{ borderRadius: "12px", boxShadow: "rgba(0,0,0,0.06) 0px 0px 0px 1px" }}
    >
      {/* Header */}
      <div
        className="grid gap-2 px-4 py-2.5 text-[11px] font-medium text-[#999] uppercase tracking-wider"
        style={{ gridTemplateColumns: "1fr 1.5fr 100px 80px 120px", borderBottom: "1px solid #e5e5e5" }}
      >
        <span>제목</span>
        <span>마지막 메시지</span>
        <span>날짜</span>
        <span>상태</span>
        <span>태그</span>
      </div>

      {/* Rows */}
      {items.length === 0 ? (
        <div className="px-4 py-10 text-center text-[13px] text-[#999]">채팅이 없습니다</div>
      ) : (
        items.map((chat, i) => (
          <button
            key={chat.id}
            onClick={() => onRowClick(chat)}
            className="grid gap-2 w-full px-4 py-3 text-left cursor-pointer transition-colors hover:bg-[#f9f9f9]"
            style={{
              gridTemplateColumns: "1fr 1.5fr 100px 80px 120px",
              borderBottom: i < items.length - 1 ? "1px solid rgba(0,0,0,0.04)" : undefined,
            }}
          >
            <span className="text-[13px] font-medium text-[#111] truncate">{chat.title}</span>
            <span className="text-[13px] text-[#777] truncate">{chat.lastMessage}</span>
            <span className="text-[12px] text-[#999]">{formatDate(chat.updatedAt)}</span>
            <span><Badge status={chatStatusToBadge(chat.status)} /></span>
            <span className="flex items-center gap-1 flex-wrap">
              {chat.tags.slice(0, 2).map((tag) => (
                <span
                  key={tag}
                  className="inline-block px-1.5 py-0 text-[10px] text-[#777] bg-[#f5f5f5] rounded"
                >
                  {tag}
                </span>
              ))}
            </span>
          </button>
        ))
      )}
    </div>
  );
}
