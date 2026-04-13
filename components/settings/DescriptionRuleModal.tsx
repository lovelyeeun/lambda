"use client";

import { useEffect, useState } from "react";
import { X } from "lucide-react";
import type { DescriptionRule } from "@/lib/settings-store";

/* 더존 자주 쓰는 계정과목 — 자동완성 힌트 */
const ACCOUNT_PRESETS = [
  { code: "8210", account: "사무용품비" },
  { code: "8220", account: "소모품비" },
  { code: "8230", account: "도서인쇄비" },
  { code: "8240", account: "비품" },
  { code: "8250", account: "수선비" },
  { code: "8260", account: "차량유지비" },
  { code: "8270", account: "복리후생비" },
  { code: "8120", account: "통신비" },
  { code: "8130", account: "수도광열비" },
];

export type RuleDraft = Omit<DescriptionRule, "id">;

interface Props {
  open: boolean;
  mode: "add" | "edit";
  initial?: RuleDraft;
  onClose: () => void;
  onSubmit: (draft: RuleDraft) => void;
}

export default function DescriptionRuleModal({ open, mode, initial, onClose, onSubmit }: Props) {
  const [draft, setDraft] = useState<RuleDraft>(
    initial ?? { category: "", code: "", account: "", memo: "" }
  );

  useEffect(() => {
    if (open) {
      setDraft(initial ?? { category: "", code: "", account: "", memo: "" });
    }
  }, [open, initial]);

  if (!open) return null;

  const required = draft.category.trim() && draft.code.trim() && draft.account.trim();
  const title = mode === "edit" ? "적요 규칙 수정" : "새 적요 규칙 추가";
  const submitLabel = mode === "edit" ? "수정" : "추가";

  // 코드 입력 시 자동완성 — 코드가 PRESETS에 있으면 account 자동 채움
  const handleCodeChange = (v: string) => {
    const preset = ACCOUNT_PRESETS.find((p) => p.code === v);
    setDraft((p) => ({ ...p, code: v, account: preset?.account ?? p.account }));
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div
        className="relative bg-white w-[480px] max-h-[85vh] overflow-y-auto"
        style={{ borderRadius: "16px", boxShadow: "rgba(0,0,0,0.08) 0px 8px 40px" }}
      >
        <div className="flex items-center justify-between px-6 pt-5 pb-3">
          <h3 className="text-[17px] font-semibold">{title}</h3>
          <button onClick={onClose} className="w-7 h-7 rounded-lg flex items-center justify-center cursor-pointer hover:bg-[#f5f5f5]">
            <X size={18} color="#777" />
          </button>
        </div>

        <div className="px-6 pb-5 flex flex-col gap-4">
          <Field label="매칭 키워드 / 카테고리" required>
            <input
              value={draft.category}
              onChange={(e) => setDraft((p) => ({ ...p, category: e.target.value }))}
              placeholder="예: 노트북, 사무용품"
              className="w-full px-3 py-2.5 text-[13px] outline-none"
              style={inputStyle}
            />
            <p className="text-[11px] text-[#999] mt-1">상품명·태그에 이 키워드가 포함되면 이 규칙이 적용됩니다.</p>
          </Field>

          <div className="flex gap-3">
            <Field label="계정과목 코드" required className="w-[140px]">
              <input
                value={draft.code}
                onChange={(e) => handleCodeChange(e.target.value)}
                placeholder="더존 4자리"
                className="w-full px-3 py-2.5 text-[13px] outline-none font-mono"
                style={inputStyle}
                list="account-codes"
              />
              <datalist id="account-codes">
                {ACCOUNT_PRESETS.map((p) => (
                  <option key={p.code} value={p.code}>{p.account}</option>
                ))}
              </datalist>
            </Field>
            <Field label="계정과목명" required className="flex-1">
              <input
                value={draft.account}
                onChange={(e) => setDraft((p) => ({ ...p, account: e.target.value }))}
                placeholder="예: 사무용품비"
                className="w-full px-3 py-2.5 text-[13px] outline-none"
                style={inputStyle}
              />
            </Field>
          </div>

          <Field label="기본 적요 텍스트">
            <input
              value={draft.memo}
              onChange={(e) => setDraft((p) => ({ ...p, memo: e.target.value }))}
              placeholder="회계장부 기재용 (선택)"
              className="w-full px-3 py-2.5 text-[13px] outline-none"
              style={inputStyle}
            />
            <p className="text-[11px] text-[#999] mt-1">ERP 전송 시 적요란에 자동 입력됩니다.</p>
          </Field>

          {/* 자주 쓰는 계정 빠른 선택 */}
          <div>
            <p className="text-[11px] text-[#999] mb-1.5">자주 쓰는 계정</p>
            <div className="flex flex-wrap gap-1.5">
              {ACCOUNT_PRESETS.slice(0, 7).map((p) => (
                <button
                  key={p.code}
                  type="button"
                  onClick={() => setDraft((d) => ({ ...d, code: p.code, account: p.account }))}
                  className="px-2 py-1 text-[11px] text-[#4e4e4e] bg-[#f5f5f5] rounded cursor-pointer hover:bg-[#ebebeb]"
                >
                  <span className="font-mono text-[#777]">{p.code}</span> {p.account}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-2 px-6 pb-6 pt-2">
          <button
            onClick={onClose}
            className="px-4 py-2.5 text-[14px] font-medium text-[#4e4e4e] bg-white cursor-pointer hover:bg-[#fafafa]"
            style={{ borderRadius: "10px", boxShadow: "rgba(0,0,0,0.12) 0px 0px 0px 1px" }}
          >
            취소
          </button>
          <button
            disabled={!required}
            onClick={() => required && onSubmit(draft)}
            className="px-5 py-2.5 text-[14px] font-medium text-white rounded-lg"
            style={{
              backgroundColor: required ? "#000" : "#bdbdbd",
              cursor: required ? "pointer" : "not-allowed",
              borderRadius: "10px",
            }}
          >
            {submitLabel}
          </button>
        </div>
      </div>
    </div>
  );
}

const inputStyle = {
  borderRadius: "8px",
  boxShadow: "rgba(0,0,0,0.08) 0px 0px 0px 1px",
  border: "none",
} as const;

function Field({
  label,
  required,
  children,
  className,
}: {
  label: string;
  required?: boolean;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={className}>
      <label className="block text-[13px] font-semibold text-[#1a1a1a] mb-1.5">
        {required && <span className="text-[#ef4444] mr-1">*</span>}
        {label}
      </label>
      {children}
    </div>
  );
}
