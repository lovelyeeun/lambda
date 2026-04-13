"use client";

import { useState } from "react";
import { PlannedTooltip } from "@/components/ui/Tooltip";

export default function CompanyInfo() {
  const [editing, setEditing] = useState(false);
  const [toast, setToast] = useState(false);

  const fields = [
    { label: "사업자등록번호", value: "142-87-01234" },
    { label: "회사명", value: "주식회사 로랩스" },
    { label: "대표자", value: "김원균" },
    { label: "주소", value: "서울특별시 강남구 테헤란로 152, 7층" },
    { label: "업종", value: "소프트웨어 개발 및 공급" },
    { label: "업태", value: "정보통신업" },
    { label: "설립일", value: "2022-03-15" },
  ];

  return (
    <div className="max-w-[480px]">
      <h2 className="text-[18px] font-semibold mb-6">우리회사 정보</h2>

      <div className="flex flex-col gap-4">
        {fields.map((f) => (
          <div key={f.label}>
            <label className="block text-[12px] text-[#999] mb-1">{f.label}</label>
            <input
              type="text"
              defaultValue={f.value}
              readOnly={!editing}
              className="w-full px-3.5 py-2.5 text-[14px] outline-none"
              style={{
                borderRadius: "10px",
                boxShadow: editing ? "rgba(0,0,0,0.06) 0px 0px 0px 1px" : "rgba(0,0,0,0.04) 0px 0px 0px 1px",
                backgroundColor: editing ? "#fff" : "#fafafa",
                color: editing ? "#000" : "#444",
                cursor: editing ? "text" : "default",
              }}
            />
          </div>
        ))}
      </div>

      <div className="flex gap-2 mt-6">
        {editing ? (
          <>
            <button onClick={() => { setEditing(false); setToast(true); setTimeout(() => setToast(false), 2000); }} className="px-5 py-[9px] text-[14px] font-medium text-white bg-black rounded-xl cursor-pointer hover:opacity-80">저장</button>
            <button onClick={() => setEditing(false)} className="px-5 py-[9px] text-[14px] font-medium text-[#777] bg-[#f5f5f5] rounded-xl cursor-pointer hover:bg-[#ebebeb]">취소</button>
          </>
        ) : (
          <button onClick={() => setEditing(true)} className="px-5 py-[9px] text-[14px] font-medium text-[#4e4e4e] bg-[#f5f5f5] rounded-xl cursor-pointer hover:bg-[#ebebeb]">수정</button>
        )}
      </div>
      {toast && <p className="text-[13px] text-[#22c55e] mt-3">저장되었습니다</p>}
    </div>
  );
}
