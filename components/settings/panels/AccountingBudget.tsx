"use client";

import { useState } from "react";
import { ChevronDown } from "lucide-react";

const departments = [
  { name: "경영지원", annual: 36000000, used: 14200000 },
  { name: "마케팅", annual: 48000000, used: 22800000 },
  { name: "디자인", annual: 24000000, used: 11500000 },
  { name: "개발", annual: 12000000, used: 5100000 },
];

function formatPrice(n: number) { return (n / 10000).toLocaleString() + "만원"; }

export default function AccountingBudget() {
  const [expanded, setExpanded] = useState<string | null>("경영지원");
  const [carryOver, setCarryOver] = useState(false);
  const [renewPeriod, setRenewPeriod] = useState("매월 1일");
  const [toast, setToast] = useState<string | null>(null);
  const showToast = (msg: string) => { setToast(msg); setTimeout(() => setToast(null), 2000); };

  const totalAnnual = 120000000;
  const totalUsed = departments.reduce((s, d) => s + d.used, 0);

  return (
    <div className="max-w-[520px]">
      <h2 className="text-[18px] font-semibold mb-5">예산 설정</h2>

      {/* Total */}
      <div className="p-4 mb-4" style={{ borderRadius: "14px", boxShadow: "rgba(0,0,0,0.06) 0px 0px 0px 1px" }}>
        <div className="flex justify-between text-[13px] mb-2"><span className="text-[#777]">연간 총 예산</span><span className="font-semibold text-[16px]">{formatPrice(totalAnnual)}</span></div>
        <div className="h-2.5 bg-[#f5f5f5] rounded-full overflow-hidden mb-1">
          <div className="h-full rounded-full bg-[#000]" style={{ width: `${(totalUsed / totalAnnual) * 100}%` }} />
        </div>
        <div className="flex justify-between text-[11px] text-[#999]"><span>사용 {formatPrice(totalUsed)}</span><span>잔여 {formatPrice(totalAnnual - totalUsed)}</span></div>
      </div>

      {/* Departments tree */}
      <p className="text-[12px] text-[#999] mb-2">부서별 예산</p>
      <div className="flex flex-col gap-2 mb-5">
        {departments.map((d) => {
          const pct = Math.round((d.used / d.annual) * 100);
          const isExpanded = expanded === d.name;
          return (
            <div key={d.name} className="overflow-hidden" style={{ borderRadius: "12px", boxShadow: "rgba(0,0,0,0.06) 0px 0px 0px 1px" }}>
              <button onClick={() => setExpanded(isExpanded ? null : d.name)} className="flex items-center justify-between w-full px-4 py-3 cursor-pointer hover:bg-[#fafafa] transition-colors">
                <div className="flex items-center gap-3">
                  <ChevronDown size={14} strokeWidth={1.5} color="#999" style={{ transform: isExpanded ? "rotate(180deg)" : "rotate(0deg)", transition: "transform 150ms" }} />
                  <span className="text-[14px] font-medium">{d.name}</span>
                </div>
                <div className="text-right">
                  <span className="text-[13px] font-medium">{formatPrice(d.annual)}</span>
                  <span className="text-[12px] text-[#999] ml-2">{pct}% 사용</span>
                </div>
              </button>
              {isExpanded && (
                <div className="px-4 pb-3">
                  <div className="h-2 bg-[#f5f5f5] rounded-full overflow-hidden mb-2">
                    <div className="h-full rounded-full transition-all" style={{ width: `${pct}%`, backgroundColor: pct > 80 ? "#f59e0b" : "#000" }} />
                  </div>
                  <div className="flex justify-between text-[11px] text-[#999] mb-2"><span>사용 {formatPrice(d.used)}</span><span>잔여 {formatPrice(d.annual - d.used)}</span></div>
                  <p className="text-[11px] text-[#bbb]">월 {formatPrice(Math.round(d.annual / 12))} 배정</p>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Settings */}
      <div className="flex gap-4 mb-5">
        <div className="flex-1">
          <p className="text-[12px] text-[#999] mb-1">이월 규칙</p>
          <div className="flex items-center justify-between p-3" style={{ borderRadius: "10px", boxShadow: "rgba(0,0,0,0.06) 0px 0px 0px 1px" }}>
            <span className="text-[13px] text-[#444]">미사용 예산 이월</span>
            <button onClick={() => setCarryOver(!carryOver)} className="w-[40px] h-[22px] rounded-full cursor-pointer relative" style={{ backgroundColor: carryOver ? "#000" : "#e5e5e5" }}>
              <span className="absolute top-[2px] w-[18px] h-[18px] rounded-full bg-white transition-all" style={{ left: carryOver ? "20px" : "2px", boxShadow: "rgba(0,0,0,0.1) 0px 1px 2px" }} />
            </button>
          </div>
        </div>
        <div className="flex-1">
          <p className="text-[12px] text-[#999] mb-1">갱신 시점</p>
          <select value={renewPeriod} onChange={(e) => setRenewPeriod(e.target.value)} className="w-full px-3 py-2.5 text-[13px] bg-white cursor-pointer" style={{ borderRadius: "10px", boxShadow: "rgba(0,0,0,0.06) 0px 0px 0px 1px", border: "none", outline: "none" }}>
            <option>매월 1일</option><option>매분기</option><option>매년</option>
          </select>
        </div>
      </div>

      <button onClick={() => showToast("저장되었습니다")} className="px-5 py-[9px] text-[14px] font-medium text-white bg-black rounded-xl cursor-pointer hover:opacity-80">저장</button>
      {toast && <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 px-4 py-2.5 bg-[#1a1a1a] text-white text-[13px] font-medium" style={{ borderRadius: "10px" }}>{toast}</div>}
    </div>
  );
}
