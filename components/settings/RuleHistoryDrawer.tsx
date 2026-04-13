"use client";

import { X, Plus, Pencil, Trash2, Upload, MessageSquare, FileSpreadsheet, FileText, History } from "lucide-react";
import type { RuleHistoryEntry, RuleHistoryAction, RuleHistorySource } from "@/lib/settings-store";

const ACTION_META: Record<RuleHistoryAction, { label: string; icon: React.ReactNode; color: string; bg: string }> = {
  add: { label: "추가", icon: <Plus size={11} strokeWidth={2} />, color: "#16a34a", bg: "rgba(22,163,74,0.08)" },
  update: { label: "변경", icon: <Pencil size={11} strokeWidth={2} />, color: "#f59e0b", bg: "rgba(245,158,11,0.08)" },
  delete: { label: "삭제", icon: <Trash2 size={11} strokeWidth={2} />, color: "#ef4444", bg: "rgba(239,68,68,0.08)" },
  "bulk-add": { label: "일괄", icon: <Upload size={11} strokeWidth={2} />, color: "#6366f1", bg: "rgba(99,102,241,0.08)" },
};

const SOURCE_META: Record<RuleHistorySource, { label: string; icon: React.ReactNode }> = {
  chat: { label: "채팅", icon: <MessageSquare size={11} strokeWidth={1.5} /> },
  manual: { label: "직접 입력", icon: <Pencil size={11} strokeWidth={1.5} /> },
  "upload-excel": { label: "엑셀 업로드", icon: <FileSpreadsheet size={11} strokeWidth={1.5} /> },
  "upload-doc": { label: "문서 업로드", icon: <FileText size={11} strokeWidth={1.5} /> },
  "upload-prompt": { label: "프롬프트", icon: <MessageSquare size={11} strokeWidth={1.5} /> },
};

function formatTime(ts: number) {
  const d = new Date(ts);
  const now = new Date();
  const diffMs = now.getTime() - ts;
  const diffMin = Math.floor(diffMs / 60000);
  if (diffMin < 1) return "방금";
  if (diffMin < 60) return `${diffMin}분 전`;
  if (diffMin < 60 * 24) return `${Math.floor(diffMin / 60)}시간 전`;
  return `${d.getMonth() + 1}월 ${d.getDate()}일 ${d.getHours()}:${String(d.getMinutes()).padStart(2, "0")}`;
}

interface Props {
  open: boolean;
  history: RuleHistoryEntry[];
  onClose: () => void;
}

export default function RuleHistoryDrawer({ open, history, onClose }: Props) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50">
      <div className="absolute inset-0 bg-black/30" onClick={onClose} />
      <div
        className="absolute right-0 top-0 h-full w-[420px] bg-white flex flex-col"
        style={{ boxShadow: "rgba(0,0,0,0.1) -8px 0 32px" }}
      >
        {/* 헤더 */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-[#eee]">
          <div className="flex items-center gap-2">
            <History size={16} strokeWidth={1.5} color="#000" />
            <h3 className="text-[15px] font-semibold">변경기록</h3>
            <span className="text-[11px] text-[#999]">{history.length}건</span>
          </div>
          <button onClick={onClose} className="w-7 h-7 rounded-lg flex items-center justify-center cursor-pointer hover:bg-[#f5f5f5]">
            <X size={16} color="#777" />
          </button>
        </div>

        {/* 본문 */}
        <div className="flex-1 overflow-y-auto px-5 py-4">
          {history.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 gap-2">
              <History size={28} strokeWidth={1.2} color="#ccc" />
              <p className="text-[13px] text-[#999]">아직 변경 기록이 없어요</p>
              <p className="text-[11px] text-[#bbb]">규칙을 추가·수정·삭제하면 여기에 기록됩니다.</p>
            </div>
          ) : (
            <ol className="flex flex-col gap-3">
              {history.map((h) => {
                const action = ACTION_META[h.action];
                const source = SOURCE_META[h.source];
                return (
                  <li key={h.id} className="relative">
                    {/* 타임라인 점 */}
                    <div className="flex items-start gap-3">
                      <div className="flex flex-col items-center pt-1">
                        <div className="w-6 h-6 rounded-full flex items-center justify-center" style={{ color: action.color, backgroundColor: action.bg }}>
                          {action.icon}
                        </div>
                      </div>
                      <div className="flex-1 pb-2">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-[11px] font-medium px-1.5 py-0.5 rounded" style={{ color: action.color, backgroundColor: action.bg }}>
                            {action.label}
                          </span>
                          <span className="flex items-center gap-1 text-[11px] text-[#999]">
                            {source.icon}{source.label}
                          </span>
                          <span className="text-[11px] text-[#bbb] ml-auto">{formatTime(h.ts)}</span>
                        </div>

                        {h.action === "bulk-add" && (
                          <p className="text-[12px] text-[#1a1a1a]">
                            <strong>{h.count}개</strong> 규칙 일괄 적용 — {h.summary}
                          </p>
                        )}

                        {h.action === "add" && h.after && (
                          <RuleSummary rule={h.after} />
                        )}

                        {h.action === "delete" && h.before && (
                          <div className="opacity-60">
                            <RuleSummary rule={h.before} striked />
                          </div>
                        )}

                        {h.action === "update" && h.before && h.after && (
                          <div className="flex flex-col gap-1">
                            <RuleSummary rule={h.before} striked dim />
                            <RuleSummary rule={h.after} />
                          </div>
                        )}
                      </div>
                    </div>
                  </li>
                );
              })}
            </ol>
          )}
        </div>
      </div>
    </div>
  );
}

function RuleSummary({
  rule,
  striked,
  dim,
}: {
  rule: { category: string; code: string; account: string; memo: string };
  striked?: boolean;
  dim?: boolean;
}) {
  return (
    <div
      className="flex items-center gap-2 px-2.5 py-1.5"
      style={{
        borderRadius: "6px",
        backgroundColor: dim ? "transparent" : "#fafafa",
        textDecoration: striked ? "line-through" : undefined,
        opacity: dim ? 0.6 : 1,
      }}
    >
      <span className="text-[12px] font-medium text-[#1a1a1a]">{rule.category}</span>
      <span className="text-[11px] text-[#777] font-mono">{rule.code}</span>
      <span className="text-[11px] text-[#777]">{rule.account}</span>
      {rule.memo && <span className="text-[11px] text-[#999] ml-auto truncate max-w-[140px]">{rule.memo}</span>}
    </div>
  );
}
