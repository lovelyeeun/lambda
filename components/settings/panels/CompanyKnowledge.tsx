"use client";

import { useState } from "react";
import { Upload, X, RefreshCw } from "lucide-react";
import { PlannedTooltip } from "@/components/ui/Tooltip";

const initialTags = ["친환경 우선", "A4 용지는 Double A", "IT장비 예산 월 500만원", "30만원 이하 자동승인", "시디즈 B2B 단가 적용"];

export default function CompanyKnowledge() {
  const [prompt, setPrompt] = useState("우리 회사는 친환경 제품을 우선적으로 선택합니다. 동일 조건이면 가격보다 환경 인증 여부를 우선합니다.\n\nIT장비는 LG/삼성 국내 브랜드를 선호하며, 대한솔루션과의 연간 계약 단가를 먼저 확인해주세요.");
  const [tags, setTags] = useState(initialTags);
  const [editingTag, setEditingTag] = useState<number | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  const showToast = (msg: string) => { setToast(msg); setTimeout(() => setToast(null), 2000); };

  const removeTag = (i: number) => setTags((prev) => prev.filter((_, j) => j !== i));
  const updateTag = (i: number, val: string) => {
    setTags((prev) => prev.map((t, j) => j === i ? val : t));
    setEditingTag(null);
    showToast("설정에 반영됩니다");
  };

  return (
    <div className="max-w-[520px]">
      <h2 className="text-[18px] font-semibold mb-2">회사 지식 추가</h2>
      <p className="text-[13px] text-[#777] mb-6">AI가 구매 상담 시 참고할 회사 정보와 규칙을 설정합니다.</p>

      {/* Prompt */}
      <div className="mb-6">
        <label className="block text-[12px] text-[#999] mb-1.5">맞춤형 프롬프트</label>
        <textarea
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          rows={5}
          className="w-full px-3.5 py-2.5 text-[13px] outline-none resize-none leading-[1.6]"
          style={{ borderRadius: "10px", boxShadow: "rgba(0,0,0,0.06) 0px 0px 0px 1px" }}
        />
      </div>

      {/* File upload */}
      <div className="mb-6">
        <label className="block text-[12px] text-[#999] mb-1.5">내부 데이터 업로드</label>
        <div
          className="flex flex-col items-center py-8 cursor-pointer hover:bg-[#fafafa] transition-colors"
          style={{ borderRadius: "12px", border: "2px dashed #e5e5e5" }}
        >
          <Upload size={24} strokeWidth={1.2} color="#ccc" />
          <p className="text-[13px] text-[#777] mt-2">사내 규정, 구매 정책 문서를 업로드하세요</p>
          <p className="text-[11px] text-[#bbb] mt-0.5">.pdf, .docx, .xlsx</p>
        </div>
      </div>

      {/* Tags */}
      <div className="mb-6">
        <label className="block text-[12px] text-[#999] mb-1.5">AI 학습 요약</label>
        <div className="flex flex-wrap gap-2">
          {tags.map((tag, i) => (
            <div key={i} className="group relative">
              {editingTag === i ? (
                <input
                  autoFocus
                  defaultValue={tag}
                  onBlur={(e) => updateTag(i, e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && updateTag(i, e.currentTarget.value)}
                  className="px-3 py-1 text-[12px] outline-none bg-white"
                  style={{ borderRadius: "8px", boxShadow: "rgba(0,0,0,0.15) 0px 0px 0px 1.5px" }}
                />
              ) : (
                <span
                  onClick={() => setEditingTag(i)}
                  className="inline-flex items-center gap-1 px-3 py-1 text-[12px] font-medium text-[#444] bg-[#f5f5f5] cursor-pointer hover:bg-[#ebebeb] transition-colors"
                  style={{ borderRadius: "8px" }}
                >
                  {tag}
                  <button onClick={(e) => { e.stopPropagation(); removeTag(i); }} className="opacity-0 group-hover:opacity-100 transition-opacity">
                    <X size={12} strokeWidth={1.5} color="#999" />
                  </button>
                </span>
              )}
            </div>
          ))}
        </div>
      </div>

      <div className="flex gap-2">
        <button onClick={() => showToast("저장되었습니다")} className="px-5 py-[9px] text-[14px] font-medium text-white bg-black rounded-xl cursor-pointer hover:opacity-80">저장</button>
        <PlannedTooltip description="AI 재학습" position="right">
          <button className="flex items-center gap-1.5 px-4 py-[9px] text-[13px] text-[#777] bg-[#f5f5f5] rounded-xl cursor-pointer hover:bg-[#ebebeb]">
            <RefreshCw size={14} strokeWidth={1.5} />재학습
          </button>
        </PlannedTooltip>
      </div>

      {toast && <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 px-4 py-2.5 bg-[#1a1a1a] text-white text-[13px] font-medium" style={{ borderRadius: "10px" }}>{toast}</div>}
    </div>
  );
}
