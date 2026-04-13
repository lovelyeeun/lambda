"use client";

import { useState } from "react";
import { PlannedTooltip } from "@/components/ui/Tooltip";

const rules = [
  { category: "용지", code: "사무용품-001", desc: "복사용지/문서용지" },
  { category: "잉크/토너", code: "사무용품-002", desc: "프린터 소모품" },
  { category: "사무기기", code: "설비-001", desc: "프린터/복합기" },
  { category: "가구", code: "설비-002", desc: "사무가구" },
  { category: "전자기기", code: "설비-003", desc: "IT기기" },
  { category: "사무용품", code: "사무용품-003", desc: "문구/소모품" },
  { category: "생활용품", code: "복리후생-001", desc: "사무실 생활용품" },
];

export default function AccountingDescription() {
  const [aiEnabled, setAiEnabled] = useState(true);
  const [toast, setToast] = useState<string | null>(null);
  const showToast = (msg: string) => { setToast(msg); setTimeout(() => setToast(null), 2000); };

  return (
    <div className="max-w-[520px]">
      <h2 className="text-[18px] font-semibold mb-5">적요설정</h2>

      {/* AI toggle */}
      <div className="flex items-center justify-between p-4 mb-5" style={{ borderRadius: "12px", boxShadow: "rgba(0,0,0,0.06) 0px 0px 0px 1px" }}>
        <div>
          <p className="text-[14px] font-medium">AI 적요 추천</p>
          <p className="text-[12px] text-[#777] mt-0.5">주문 시 적요 코드를 자동 추천합니다</p>
        </div>
        <button onClick={() => setAiEnabled(!aiEnabled)} className="w-[40px] h-[22px] rounded-full cursor-pointer relative" style={{ backgroundColor: aiEnabled ? "#000" : "#e5e5e5" }}>
          <span className="absolute top-[2px] w-[18px] h-[18px] rounded-full bg-white transition-all" style={{ left: aiEnabled ? "20px" : "2px", boxShadow: "rgba(0,0,0,0.1) 0px 1px 2px" }} />
        </button>
      </div>

      {/* Rules table */}
      <p className="text-[12px] text-[#999] mb-2">적요 규칙 매핑</p>
      <div className="overflow-hidden bg-white mb-4" style={{ borderRadius: "12px", boxShadow: "rgba(0,0,0,0.06) 0px 0px 0px 1px" }}>
        <div className="grid grid-cols-3 gap-2 px-4 py-2 text-[11px] font-medium text-[#999] uppercase tracking-wider" style={{ borderBottom: "1px solid #e5e5e5" }}>
          <span>카테고리</span><span>적요 코드</span><span>설명</span>
        </div>
        {rules.map((r, i) => (
          <div key={r.category} className="grid grid-cols-3 gap-2 px-4 py-2.5 text-[13px]" style={{ borderBottom: i < rules.length - 1 ? "1px solid rgba(0,0,0,0.04)" : undefined }}>
            <span className="font-medium">{r.category}</span>
            <span className="text-[#777] font-mono text-[12px]">{r.code}</span>
            <span className="text-[#777]">{r.desc}</span>
          </div>
        ))}
      </div>

      <div className="flex gap-2">
        <button onClick={() => showToast("저장되었습니다")} className="px-5 py-[9px] text-[14px] font-medium text-white bg-black rounded-xl cursor-pointer hover:opacity-80">저장</button>
        <PlannedTooltip description="자동 매핑" position="right">
          <button className="px-4 py-[9px] text-[13px] text-[#777] bg-[#f5f5f5] rounded-xl cursor-pointer hover:bg-[#ebebeb]">사내 기준 업로드</button>
        </PlannedTooltip>
      </div>
      {toast && <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 px-4 py-2.5 bg-[#1a1a1a] text-white text-[13px] font-medium" style={{ borderRadius: "10px" }}>{toast}</div>}
    </div>
  );
}
