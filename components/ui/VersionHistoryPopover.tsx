"use client";

import { useState, useEffect, useRef, useMemo } from "react";
import { X } from "lucide-react";
import { useSettingsStore, type VersionDomain, type VersionHistoryEntry } from "@/lib/settings-store";

/* ═══════════════════════════════════════
   VersionHistoryPopover
   AccessBadge popover 스타일 동일 적용
   ═══════════════════════════════════════ */

const AVATAR_COLORS = ["#3a3a3a", "#5b4a3a", "#4a4a4a", "#8a6f3f", "#2f2f2f", "#6b5d4a"];

function hashColor(name: string) {
  const i = name.split("").reduce((acc, c) => acc + c.charCodeAt(0), 0);
  return AVATAR_COLORS[i % AVATAR_COLORS.length];
}

function initials(name: string) {
  const trimmed = name.trim();
  if (/^[가-힣]+$/.test(trimmed)) return trimmed.slice(-2);
  return trimmed.slice(0, 2);
}

const SOURCE_LABELS: Record<string, string> = {
  chat: "채팅",
  manual: "직접 수정",
  "ai-auto": "AI 자동",
};

function relativeTime(ts: number): string {
  const diff = Date.now() - ts;
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "방금 전";
  if (mins < 60) return `${mins}분 전`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}시간 전`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}일 전`;
  const d = new Date(ts);
  return `${d.getMonth() + 1}/${d.getDate()}`;
}

function formatDiffValue(v: unknown): string {
  if (v === null || v === undefined) return "";
  if (typeof v === "boolean") return v ? "ON" : "OFF";
  if (typeof v === "number") {
    if (v >= 10000) return `${(v / 10000).toLocaleString()}만원`;
    return String(v);
  }
  return String(v);
}

interface VersionHistoryPopoverProps {
  /** 특정 도메인만 필터 — undefined면 전체 표시 */
  domain?: VersionDomain;
  children: React.ReactNode;
}

export default function VersionHistoryPopover({ domain, children }: VersionHistoryPopoverProps) {
  const { versionHistory } = useSettingsStore();
  const [open, setOpen] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);

  const entries = useMemo(
    () => (domain ? versionHistory.filter((e) => e.domain === domain) : versionHistory).slice(0, 20),
    [versionHistory, domain],
  );

  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  return (
    <div ref={wrapRef} className="relative inline-flex">
      <div onClick={() => setOpen((v) => !v)}>{children}</div>

      {open && (
        <div
          className="absolute left-0 top-full mt-2 z-[100] bg-white overflow-hidden"
          style={{
            width: 340,
            borderRadius: "16px",
            boxShadow:
              "rgba(0,0,0,0.06) 0px 0px 0px 1px, rgba(0,0,0,0.04) 0px 1px 2px, rgba(0,0,0,0.04) 0px 4px 16px",
          }}
        >
          {/* 헤더 */}
          <div className="flex items-center justify-between px-4 pt-3.5 pb-2.5">
            <span
              className="text-[13px] font-semibold text-[#000]"
              style={{ letterSpacing: "0.14px" }}
            >
              변경기록
            </span>
            <button
              type="button"
              onClick={() => setOpen(false)}
              aria-label="닫기"
              className="flex items-center justify-center w-6 h-6 rounded-md cursor-pointer transition-colors hover:bg-[#f5f5f5]"
            >
              <X size={14} strokeWidth={1.5} color="#777169" />
            </button>
          </div>

          {/* 리스트 */}
          <div
            className="px-4 pb-2 overflow-y-auto"
            style={{ maxHeight: 360 }}
          >
            {entries.length === 0 ? (
              <p
                className="text-[12px] text-[#999] py-4 text-center"
                style={{ letterSpacing: "0.14px" }}
              >
                변경 기록이 없습니다
              </p>
            ) : (
              entries.map((entry) => (
                <HistoryRow key={entry.id} entry={entry} />
              ))
            )}
          </div>

          {/* 푸터 */}
          <div
            className="px-4 py-2.5"
            style={{ borderTop: "1px solid rgba(0,0,0,0.06)" }}
          >
            <p
              className="text-[10px] text-[#999]"
              style={{ letterSpacing: "0.14px" }}
            >
              변경 권한은 관리자 설정에서 관리됩니다
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

/* ── 개별 히스토리 행 ── */

function HistoryRow({ entry }: { entry: VersionHistoryEntry }) {
  const diffKeys = entry.before && entry.after
    ? Object.keys(entry.after).filter(
        (k) => JSON.stringify(entry.before?.[k]) !== JSON.stringify(entry.after?.[k]),
      )
    : [];

  return (
    <div
      className="flex gap-2.5 py-2.5"
      style={{ borderBottom: "1px solid rgba(0,0,0,0.04)" }}
    >
      {/* 아바타 */}
      <div
        className="flex items-center justify-center shrink-0 text-white font-medium"
        style={{
          width: 28,
          height: 28,
          borderRadius: "9999px",
          backgroundColor: hashColor(entry.userName),
          fontSize: "10px",
          letterSpacing: "0.14px",
        }}
      >
        {initials(entry.userName)}
      </div>

      {/* 본문 */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5 mb-0.5">
          <span
            className="text-[13px] font-semibold text-[#000]"
            style={{ letterSpacing: "0.14px" }}
          >
            {entry.userName}
          </span>
          <span
            className="text-[10px] text-[#777169]"
            style={{ letterSpacing: "0.14px" }}
          >
            {relativeTime(entry.ts)}
          </span>
        </div>

        <p
          className="text-[12px] text-[#4e4e4e] leading-[1.5] mb-1"
          style={{ letterSpacing: "0.14px" }}
        >
          {entry.summary}
        </p>

        <div className="flex items-center gap-1.5 flex-wrap">
          {/* 소스 뱃지 */}
          <span
            className="inline-flex items-center px-2 py-[2px] text-[10px] font-medium text-[#777169]"
            style={{
              borderRadius: "9999px",
              backgroundColor: "rgba(245,242,239,0.8)",
              letterSpacing: "0.14px",
            }}
          >
            {SOURCE_LABELS[entry.source] ?? entry.source}
          </span>

          {/* diff 표시 */}
          {diffKeys.length > 0 && diffKeys.map((k) => (
            <span
              key={k}
              className="inline-flex items-center gap-1 px-2 py-[2px] text-[10px] text-[#777169]"
              style={{
                borderRadius: "9999px",
                backgroundColor: "rgba(245,242,239,0.8)",
                letterSpacing: "0.14px",
              }}
            >
              <span style={{ textDecoration: "line-through", opacity: 0.6 }}>
                {formatDiffValue(entry.before?.[k])}
              </span>
              <span style={{ margin: "0 1px" }}>→</span>
              <span>{formatDiffValue(entry.after?.[k])}</span>
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ── 컴팩트 최근 변경 리스트 (SettingsDashboard용) ── */

export function RecentChangesList({ limit = 5 }: { limit?: number }) {
  const { versionHistory } = useSettingsStore();
  const recent = useMemo(() => versionHistory.slice(0, limit), [versionHistory, limit]);

  if (recent.length === 0) return null;

  return (
    <div className="flex flex-col">
      {recent.map((entry) => (
        <div
          key={entry.id}
          className="flex items-center gap-2.5 py-2"
          style={{ borderBottom: "1px solid rgba(0,0,0,0.04)" }}
        >
          <div
            className="flex items-center justify-center shrink-0 text-white font-medium"
            style={{
              width: 24,
              height: 24,
              borderRadius: "9999px",
              backgroundColor: hashColor(entry.userName),
              fontSize: "9px",
              letterSpacing: "0.14px",
            }}
          >
            {initials(entry.userName)}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1.5">
              <span
                className="text-[12px] font-medium text-[#1a1a1a] shrink-0"
                style={{ letterSpacing: "0.14px" }}
              >
                {entry.userName}
              </span>
              <span
                className="text-[11px] text-[#4e4e4e] truncate"
                style={{ letterSpacing: "0.14px" }}
              >
                {entry.summary}
              </span>
            </div>
          </div>
          <span
            className="text-[10px] text-[#999] shrink-0"
            style={{ letterSpacing: "0.14px" }}
          >
            {relativeTime(entry.ts)}
          </span>
        </div>
      ))}
    </div>
  );
}
