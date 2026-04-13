"use client";

import { useState, useEffect, useRef } from "react";
import { useSettingsStore, type CompanyField } from "@/lib/settings-store";
import { useScrollOnFocus } from "@/lib/settings-events";

const FIELD_ORDER: { key: CompanyField; label: string }[] = [
  { key: "bizNumber", label: "사업자등록번호" },
  { key: "name", label: "회사명" },
  { key: "ceo", label: "대표자" },
  { key: "address", label: "주소" },
  { key: "industry", label: "업종" },
  { key: "businessType", label: "업태" },
  { key: "foundedAt", label: "설립일" },
];

export default function CompanyInfo() {
  const { company, updateCompanyField } = useSettingsStore();
  const [editing, setEditing] = useState(false);
  const [toast, setToast] = useState(false);
  const [draft, setDraft] = useState(company);

  // store가 외부(채팅 patch 등)에서 바뀌면 draft도 동기화
  useEffect(() => {
    if (!editing) setDraft(company);
  }, [company, editing]);

  const handleSave = () => {
    (Object.keys(draft) as CompanyField[]).forEach((k) => {
      if (draft[k] !== company[k]) updateCompanyField(k, draft[k]);
    });
    setEditing(false);
    setToast(true);
    setTimeout(() => setToast(false), 2000);
  };

  return (
    <div className="max-w-[480px]">
      <h2 className="text-[18px] font-semibold mb-6">우리회사 정보</h2>

      <div className="flex flex-col gap-4">
        {FIELD_ORDER.map((f) => (
          <CompanyFieldRow
            key={f.key}
            fieldKey={f.key}
            label={f.label}
            editing={editing}
            value={editing ? draft[f.key] : company[f.key]}
            onChange={(v) => setDraft((prev) => ({ ...prev, [f.key]: v }))}
          />
        ))}
      </div>

      <div className="flex gap-2 mt-6">
        {editing ? (
          <>
            <button onClick={handleSave} className="px-5 py-[9px] text-[14px] font-medium text-white bg-black rounded-xl cursor-pointer hover:opacity-80">저장</button>
            <button onClick={() => { setDraft(company); setEditing(false); }} className="px-5 py-[9px] text-[14px] font-medium text-[#777] bg-[#f5f5f5] rounded-xl cursor-pointer hover:bg-[#ebebeb]">취소</button>
          </>
        ) : (
          <button onClick={() => setEditing(true)} className="px-5 py-[9px] text-[14px] font-medium text-[#4e4e4e] bg-[#f5f5f5] rounded-xl cursor-pointer hover:bg-[#ebebeb]">수정</button>
        )}
      </div>
      {toast && <p className="text-[13px] text-[#22c55e] mt-3">저장되었습니다</p>}
    </div>
  );
}

function CompanyFieldRow({
  fieldKey,
  label,
  editing,
  value,
  onChange,
}: {
  fieldKey: CompanyField;
  label: string;
  editing: boolean;
  value: string;
  onChange: (v: string) => void;
}) {
  const ref = useRef<HTMLDivElement>(null);
  useScrollOnFocus(`company.field.${fieldKey}`, ref);
  return (
    <div ref={ref} className="scroll-mt-16">
      <label className="block text-[12px] text-[#999] mb-1">{label}</label>
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        readOnly={!editing}
        className="w-full px-3.5 py-2.5 text-[14px] outline-none"
        style={{
          borderRadius: "10px",
          boxShadow: editing
            ? "rgba(0,0,0,0.06) 0px 0px 0px 1px"
            : "rgba(0,0,0,0.04) 0px 0px 0px 1px",
          backgroundColor: editing ? "#fff" : "#fafafa",
          color: editing ? "#000" : "#444",
          cursor: editing ? "text" : "default",
        }}
      />
    </div>
  );
}
