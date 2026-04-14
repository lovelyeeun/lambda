"use client";

import { useState } from "react";
import { X, Mail, FileSpreadsheet, Plus, Trash2, Paperclip } from "lucide-react";
import { PlannedTooltip } from "@/components/ui/Tooltip";
import type { InvitedMember } from "@/lib/settings-store";

/* ═══════════════════════════════════════
   타입
   ═══════════════════════════════════════ */

export type EmailRow = { name: string; email: string; department: string; role: string };

const DEPARTMENTS = ["경영지원", "마케팅", "디자인", "개발"];
const ROLES = ["관리자", "매니저", "구매담당", "일반"];

function emptyRow(): EmailRow {
  return { name: "", email: "", department: DEPARTMENTS[0], role: ROLES[2] };
}

/* 엑셀 업로드 시 사용할 더미 파싱 결과 */
const MOCK_EXCEL_PARSED: EmailRow[] = [
  { name: "최동현", email: "donghyun@rawlabs.io", department: "개발", role: "구매담당" },
  { name: "한예진", email: "yejin@rawlabs.io", department: "마케팅", role: "일반" },
  { name: "정수민", email: "sumin@rawlabs.io", department: "디자인", role: "일반" },
];

/* ═══════════════════════════════════════
   메인 컴포넌트
   ═══════════════════════════════════════ */

interface Props {
  open: boolean;
  onClose: () => void;
  /** 초대 확정 — 입력된 멤버 리스트 반환 */
  onSubmit: (members: Omit<InvitedMember, "id">[]) => void;
}

export default function TeamInviteModal({ open, onClose, onSubmit }: Props) {
  const [tab, setTab] = useState<"email" | "excel">("email");
  const [emailRows, setEmailRows] = useState<EmailRow[]>([emptyRow()]);
  const [uploadedFileName, setUploadedFileName] = useState<string | null>(null);

  if (!open) return null;

  const reset = () => {
    setEmailRows([emptyRow()]);
    setUploadedFileName(null);
    setTab("email");
  };

  const handleClose = () => {
    reset();
    onClose();
  };

  /* 이메일 탭 */
  const updateRow = (i: number, patch: Partial<EmailRow>) => {
    setEmailRows((prev) => prev.map((r, idx) => (idx === i ? { ...r, ...patch } : r)));
  };
  const addRow = () => setEmailRows((prev) => [...prev, emptyRow()]);
  const removeRow = (i: number) => {
    setEmailRows((prev) => (prev.length <= 1 ? prev : prev.filter((_, idx) => idx !== i)));
  };

  const validEmailRows = emailRows.filter(
    (r) => r.name.trim() && r.email.trim() && r.department && r.role
  );
  const emailReady = tab === "email" && validEmailRows.length > 0;
  const excelReady = tab === "excel" && uploadedFileName !== null;
  const ready = emailReady || excelReady;

  const handleSubmit = () => {
    if (tab === "email") {
      const members = validEmailRows.map((r) => ({ ...r, via: "email" as const }));
      if (members.length === 0) return;
      onSubmit(members);
    } else {
      // 더미 파싱 — 실제 엑셀 파싱 대신 고정 데이터
      onSubmit(MOCK_EXCEL_PARSED.map((r) => ({ ...r, via: "excel" as const })));
    }
    reset();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/40" onClick={handleClose} />
      <div
        className="relative bg-white w-[640px] max-h-[88vh] flex flex-col"
        style={{ borderRadius: "16px", boxShadow: "rgba(0,0,0,0.08) 0px 8px 40px" }}
      >
        {/* 헤더 */}
        <div className="flex items-center justify-between px-6 pt-5 pb-3">
          <h3 className="text-[17px] font-semibold">팀원 초대</h3>
          <button onClick={handleClose} className="w-7 h-7 rounded-lg flex items-center justify-center cursor-pointer hover:bg-[#f5f5f5]">
            <X size={18} color="#777" />
          </button>
        </div>

        {/* 탭 */}
        <div className="px-6 flex gap-1 border-b border-[#eee]">
          <TabButton active={tab === "email"} onClick={() => setTab("email")} icon={<Mail size={14} strokeWidth={1.5} />} label="메일로 초대" />
          <TabButton active={tab === "excel"} onClick={() => setTab("excel")} icon={<FileSpreadsheet size={14} strokeWidth={1.5} />} label="엑셀로 초대" />
        </div>

        {/* 본문 */}
        <div className="flex-1 overflow-y-auto px-6 py-5">
          {tab === "email" && (
            <EmailTab
              rows={emailRows}
              onUpdate={updateRow}
              onAdd={addRow}
              onRemove={removeRow}
            />
          )}
          {tab === "excel" && (
            <ExcelTab
              uploadedFileName={uploadedFileName}
              onUpload={(name) => setUploadedFileName(name)}
              onClear={() => setUploadedFileName(null)}
            />
          )}
        </div>

        {/* 푸터 */}
        <div className="px-6 py-4 border-t border-[#eee] flex justify-end gap-2">
          <button
            onClick={handleClose}
            className="px-4 py-2.5 text-[14px] font-medium text-[#4e4e4e] bg-white cursor-pointer hover:bg-[#fafafa]"
            style={{ borderRadius: "10px", boxShadow: "rgba(0,0,0,0.12) 0px 0px 0px 1px" }}
          >
            취소
          </button>
          <button
            disabled={!ready}
            onClick={handleSubmit}
            className="px-5 py-2.5 text-[14px] font-medium text-white rounded-lg transition-opacity"
            style={{
              backgroundColor: ready ? "#000" : "#bdbdbd",
              cursor: ready ? "pointer" : "not-allowed",
              borderRadius: "10px",
            }}
          >
            {tab === "email" ? `초대하기${validEmailRows.length > 1 ? ` (${validEmailRows.length}명)` : ""}` : "초대하기"}
          </button>
        </div>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════
   서브: 탭 버튼
   ═══════════════════════════════════════ */

function TabButton({
  active,
  onClick,
  icon,
  label,
}: {
  active: boolean;
  onClick: () => void;
  icon: React.ReactNode;
  label: string;
}) {
  return (
    <button
      onClick={onClick}
      className="flex items-center gap-1.5 px-4 py-2.5 text-[13px] font-medium cursor-pointer transition-colors"
      style={{
        color: active ? "#000" : "#999",
        borderBottom: active ? "2px solid #000" : "2px solid transparent",
        marginBottom: "-1px",
      }}
    >
      {icon}
      {label}
    </button>
  );
}

/* ═══════════════════════════════════════
   서브: 이메일 탭 (다중 행)
   ═══════════════════════════════════════ */

function EmailTab({
  rows,
  onUpdate,
  onAdd,
  onRemove,
}: {
  rows: EmailRow[];
  onUpdate: (i: number, patch: Partial<EmailRow>) => void;
  onAdd: () => void;
  onRemove: (i: number) => void;
}) {
  return (
    <div>
      <p className="text-[12px] text-[#999] mb-3">초대할 팀원의 이름·이메일·부서·역할을 입력해주세요. 한 번에 여러 명도 가능합니다.</p>

      {/* 헤더 */}
      <div
        className="grid items-center gap-2 px-3 py-2 text-[11px] font-medium text-[#777] bg-[#fafafa] mb-2"
        style={{ gridTemplateColumns: "1fr 1.5fr 1fr 1fr 28px", borderRadius: "8px" }}
      >
        <span>이름 *</span>
        <span>이메일 *</span>
        <span>부서</span>
        <span>역할</span>
        <span />
      </div>

      <div className="flex flex-col gap-2">
        {rows.map((r, i) => (
          <div
            key={i}
            className="grid items-center gap-2"
            style={{ gridTemplateColumns: "1fr 1.5fr 1fr 1fr 28px" }}
          >
            <input
              value={r.name}
              onChange={(e) => onUpdate(i, { name: e.target.value })}
              placeholder="홍길동"
              className="px-2.5 py-2 text-[13px] outline-none"
              style={inputStyle}
            />
            <input
              value={r.email}
              onChange={(e) => onUpdate(i, { email: e.target.value })}
              placeholder="user@company.com"
              type="email"
              className="px-2.5 py-2 text-[13px] outline-none"
              style={inputStyle}
            />
            <select
              value={r.department}
              onChange={(e) => onUpdate(i, { department: e.target.value })}
              className="px-2 py-2 text-[13px] outline-none bg-white cursor-pointer"
              style={inputStyle}
            >
              {DEPARTMENTS.map((d) => <option key={d} value={d}>{d}</option>)}
            </select>
            <select
              value={r.role}
              onChange={(e) => onUpdate(i, { role: e.target.value })}
              className="px-2 py-2 text-[13px] outline-none bg-white cursor-pointer"
              style={inputStyle}
            >
              {ROLES.map((d) => <option key={d} value={d}>{d}</option>)}
            </select>
            <button
              onClick={() => onRemove(i)}
              disabled={rows.length <= 1}
              className="w-7 h-7 rounded-md flex items-center justify-center cursor-pointer hover:bg-[#f5f5f5] disabled:opacity-30 disabled:cursor-not-allowed"
              aria-label="행 삭제"
            >
              <Trash2 size={13} strokeWidth={1.5} color="#999" />
            </button>
          </div>
        ))}
      </div>

      <button
        onClick={onAdd}
        className="mt-3 flex items-center gap-1.5 px-3 py-1.5 text-[12px] font-medium text-[#4e4e4e] bg-[#f5f5f5] rounded-lg cursor-pointer hover:bg-[#ebebeb]"
      >
        <Plus size={13} strokeWidth={1.5} />행 추가
      </button>
    </div>
  );
}

/* ═══════════════════════════════════════
   서브: 엑셀 탭 (다운로드 + 업로드)
   ═══════════════════════════════════════ */

function ExcelTab({
  uploadedFileName,
  onUpload,
  onClear,
}: {
  uploadedFileName: string | null;
  onUpload: (name: string) => void;
  onClear: () => void;
}) {
  return (
    <div className="flex flex-col gap-5">
      {/* 다운로드 */}
      <div>
        <p className="text-[13px] font-semibold text-[#1a1a1a] mb-2">엑셀 초대 파일 다운로드</p>
        <div className="flex gap-2">
          <div
            className="flex-1 flex items-center gap-2 px-3 py-2.5 bg-white"
            style={inputStyle}
          >
            <FileSpreadsheet size={16} strokeWidth={1.5} color="#777" />
            <span className="text-[13px] text-[#444]">lambda_team_invite_template.xlsx</span>
          </div>
          <PlannedTooltip description="엑셀 템플릿 다운로드 (실제 파일 생성 미구현)">
            <button
              type="button"
              className="px-5 py-2.5 text-[13px] font-medium text-white bg-black rounded-lg cursor-pointer hover:opacity-80"
            >
              다운로드
            </button>
          </PlannedTooltip>
        </div>
        <p className="text-[11px] text-[#ef4444] mt-2">
          * 엑셀 파일을 다운로드 한 후, 형식에 맞춰 초대할 구성원의 정보를 기입하고 아래에 업로드 해주세요.
        </p>
      </div>

      <div className="border-t border-[#eee]" />

      {/* 업로드 */}
      <div>
        <p className="text-[13px] font-semibold text-[#1a1a1a] mb-2">엑셀 초대 파일 업로드</p>
        <div className="flex gap-2">
          <div
            className="flex-1 flex items-center gap-2 px-3 py-2.5 bg-white"
            style={inputStyle}
          >
            <Paperclip size={14} strokeWidth={1.5} color="#777" />
            <span className="flex-1 text-[13px]" style={{ color: uploadedFileName ? "#444" : "#bbb" }}>
              {uploadedFileName ?? "파일을 업로드 해주세요."}
            </span>
            {uploadedFileName && (
              <button onClick={onClear} className="text-[#999] hover:text-[#555] cursor-pointer" aria-label="제거">
                <X size={14} />
              </button>
            )}
          </div>
          <label
            className="px-5 py-2.5 text-[13px] font-medium text-[#4e4e4e] bg-white cursor-pointer hover:bg-[#fafafa]"
            style={{ borderRadius: "10px", boxShadow: "rgba(0,0,0,0.12) 0px 0px 0px 1px" }}
          >
            파일 선택
            <input
              type="file"
              accept=".xlsx,.xls,.csv"
              hidden
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) onUpload(f.name);
                e.target.value = "";
              }}
            />
          </label>
        </div>
        <p className="text-[11px] text-[#777] mt-2">
          * 초대할 구성원의 정보가 기입된 파일을 업로드 해주세요.
        </p>
        {uploadedFileName && (
          <p className="text-[11px] text-[#22c55e] mt-2">
            ✓ 업로드 완료. "초대하기" 를 누르면 파일에 기입된 구성원이 일괄 초대됩니다.
          </p>
        )}
      </div>
    </div>
  );
}

const inputStyle = {
  borderRadius: "8px",
  boxShadow: "rgba(0,0,0,0.08) 0px 0px 0px 1px",
  border: "none",
} as const;
