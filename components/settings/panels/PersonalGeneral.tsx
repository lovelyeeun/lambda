"use client";

import { useState } from "react";
import { currentUser } from "@/data/users";
import { PlannedTooltip } from "@/components/ui/Tooltip";
import { Check } from "lucide-react";

export default function PersonalGeneral() {
  const [name, setName] = useState(currentUser.name);
  const [toast, setToast] = useState<string | null>(null);
  const showToast = (msg: string) => { setToast(msg); setTimeout(() => setToast(null), 2000); };

  return (
    <div className="max-w-[480px]">
      <h2 className="text-[18px] font-semibold mb-6" style={{ letterSpacing: "-0.2px" }}>일반</h2>

      {/* Avatar + info */}
      <div className="flex items-center gap-4 mb-8">
        <div className="w-16 h-16 rounded-full bg-black text-white flex items-center justify-center text-[20px] font-medium shrink-0">
          {name.slice(-2)}
        </div>
        <div>
          <p className="text-[15px] font-medium">{name}</p>
          <p className="text-[13px] text-[#777]">{currentUser.email}</p>
          <p className="text-[12px] text-[#999] mt-0.5">{currentUser.role} · {currentUser.department}</p>
        </div>
      </div>

      {/* Name edit */}
      <div className="mb-6">
        <label className="block text-[12px] text-[#777] mb-1.5">이름</label>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="w-full px-3.5 py-2.5 text-[14px] bg-white outline-none"
          style={{ borderRadius: "10px", boxShadow: "rgba(0,0,0,0.06) 0px 0px 0px 1px" }}
        />
      </div>

      {/* Email (read-only) */}
      <div className="mb-6">
        <label className="block text-[12px] text-[#777] mb-1.5">이메일</label>
        <input
          type="email"
          value={currentUser.email}
          readOnly
          className="w-full px-3.5 py-2.5 text-[14px] text-[#999] bg-[#fafafa] outline-none cursor-not-allowed"
          style={{ borderRadius: "10px", boxShadow: "rgba(0,0,0,0.04) 0px 0px 0px 1px" }}
        />
      </div>

      {/* Password */}
      <div className="mb-6">
        <label className="block text-[12px] text-[#777] mb-1.5">비밀번호</label>
        <PlannedTooltip description="비밀번호 변경" position="right">
          <button className="px-4 py-2 text-[13px] text-[#4e4e4e] bg-[#f5f5f5] rounded-lg cursor-pointer hover:bg-[#ebebeb] transition-colors">
            비밀번호 변경
          </button>
        </PlannedTooltip>
      </div>

      {/* Language / Timezone */}
      <div className="flex gap-4">
        <div className="flex-1">
          <label className="block text-[12px] text-[#777] mb-1.5">언어</label>
          <PlannedTooltip description="언어 설정" position="bottom">
            <select
              className="w-full px-3.5 py-2.5 text-[14px] bg-white cursor-pointer"
              style={{ borderRadius: "10px", boxShadow: "rgba(0,0,0,0.06) 0px 0px 0px 1px", border: "none", outline: "none" }}
              defaultValue="ko"
            >
              <option value="ko">한국어</option>
              <option value="en">English</option>
            </select>
          </PlannedTooltip>
        </div>
        <div className="flex-1">
          <label className="block text-[12px] text-[#777] mb-1.5">시간대</label>
          <PlannedTooltip description="시간대 설정" position="bottom">
            <select
              className="w-full px-3.5 py-2.5 text-[14px] bg-white cursor-pointer"
              style={{ borderRadius: "10px", boxShadow: "rgba(0,0,0,0.06) 0px 0px 0px 1px", border: "none", outline: "none" }}
              defaultValue="Asia/Seoul"
            >
              <option value="Asia/Seoul">Asia/Seoul (KST)</option>
              <option value="UTC">UTC</option>
            </select>
          </PlannedTooltip>
        </div>
      </div>

      {/* Save */}
      <div className="mt-8">
        <button
          className="px-5 py-[9px] text-[14px] font-medium text-white bg-black rounded-xl cursor-pointer transition-opacity hover:opacity-80"
          onClick={() => showToast("저장되었습니다")}
        >
          저장
        </button>
      </div>

      {toast && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2 px-4 py-2.5 bg-[#1a1a1a] text-white text-[13px] font-medium" style={{ borderRadius: "10px" }}>
          <Check size={14} strokeWidth={2} />{toast}
        </div>
      )}
    </div>
  );
}
