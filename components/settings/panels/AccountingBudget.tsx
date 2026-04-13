"use client";

import { useEffect, useState } from "react";
import { ChevronDown } from "lucide-react";
import { useSettingsStore } from "@/lib/settings-store";
import { useFocusPulse, useLastFocus } from "@/lib/settings-events";

function formatPrice(n: number) { return (n / 10000).toLocaleString() + "만원"; }

const PULSE_SHADOW = "rgba(99,102,241,0.5) 0px 0px 0px 2px, rgba(99,102,241,0.15) 0px 6px 20px";

export default function AccountingBudget() {
  const { budget, setCarryOver, setRenewPeriod, totalAnnual, totalUsed } = useSettingsStore();
  const [expanded, setExpanded] = useState<string | null>("경영지원");
  const [toast, setToast] = useState<string | null>(null);
  const showToast = (msg: string) => { setToast(msg); setTimeout(() => setToast(null), 2000); };
  const totalPulse = useFocusPulse("budget.total");
  const lastFocus = useLastFocus();

  // focus 가 budget.dept.{name} 으로 들어오면 해당 행 자동 펼침
  useEffect(() => {
    if (!lastFocus) return;
    const m = lastFocus.key.match(/^budget\.dept\.(.+)$/);
    if (m) setExpanded(m[1]);
  }, [lastFocus]);

  return (
    <div className="max-w-[520px]">
      <h2 className="text-[18px] font-semibold mb-5">예산 설정</h2>

      {/* Total */}
      <div
        className="p-4 mb-4 transition-all duration-300"
        style={{
          borderRadius: "14px",
          boxShadow: totalPulse ? PULSE_SHADOW : "rgba(0,0,0,0.06) 0px 0px 0px 1px",
        }}
      >
        <div className="flex justify-between text-[13px] mb-2"><span className="text-[#777]">연간 총 예산</span><span className="font-semibold text-[16px]">{formatPrice(totalAnnual)}</span></div>
        <div className="h-2.5 bg-[#f5f5f5] rounded-full overflow-hidden mb-1">
          <div className="h-full rounded-full bg-[#000]" style={{ width: `${totalAnnual > 0 ? (totalUsed / totalAnnual) * 100 : 0}%` }} />
        </div>
        <div className="flex justify-between text-[11px] text-[#999]"><span>사용 {formatPrice(totalUsed)}</span><span>잔여 {formatPrice(totalAnnual - totalUsed)}</span></div>
      </div>

      {/* Departments tree */}
      <p className="text-[12px] text-[#999] mb-2">부서별 예산</p>
      <div className="flex flex-col gap-2 mb-5">
        {budget.departments.map((d) => (
          <DepartmentRow
            key={d.name}
            dept={d}
            isExpanded={expanded === d.name}
            onToggle={() => setExpanded(expanded === d.name ? null : d.name)}
          />
        ))}
      </div>

      {/* Settings */}
      <div className="flex gap-4 mb-5">
        <div className="flex-1">
          <p className="text-[12px] text-[#999] mb-1">이월 규칙</p>
          <div className="flex items-center justify-between p-3" style={{ borderRadius: "10px", boxShadow: "rgba(0,0,0,0.06) 0px 0px 0px 1px" }}>
            <span className="text-[13px] text-[#444]">미사용 예산 이월</span>
            <button onClick={() => setCarryOver(!budget.carryOver)} className="w-[40px] h-[22px] rounded-full cursor-pointer relative" style={{ backgroundColor: budget.carryOver ? "#000" : "#e5e5e5" }}>
              <span className="absolute top-[2px] w-[18px] h-[18px] rounded-full bg-white transition-all" style={{ left: budget.carryOver ? "20px" : "2px", boxShadow: "rgba(0,0,0,0.1) 0px 1px 2px" }} />
            </button>
          </div>
        </div>
        <div className="flex-1">
          <p className="text-[12px] text-[#999] mb-1">갱신 시점</p>
          <select value={budget.renewPeriod} onChange={(e) => setRenewPeriod(e.target.value)} className="w-full px-3 py-2.5 text-[13px] bg-white cursor-pointer" style={{ borderRadius: "10px", boxShadow: "rgba(0,0,0,0.06) 0px 0px 0px 1px", border: "none", outline: "none" }}>
            <option>매월 1일</option><option>매분기</option><option>매년</option>
          </select>
        </div>
      </div>

      <button onClick={() => showToast("저장되었습니다")} className="px-5 py-[9px] text-[14px] font-medium text-white bg-black rounded-xl cursor-pointer hover:opacity-80">저장</button>
      {toast && <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 px-4 py-2.5 bg-[#1a1a1a] text-white text-[13px] font-medium" style={{ borderRadius: "10px" }}>{toast}</div>}

      {/* 디버그용 — 필요할 때만 보기 위해 주석 */}
      {/* {lastFocus && <p className="mt-2 text-[10px] text-[#bbb]">focus: {lastFocus.key}</p>} */}
    </div>
  );
}

function DepartmentRow({
  dept,
  isExpanded,
  onToggle,
}: {
  dept: { name: string; annual: number; used: number };
  isExpanded: boolean;
  onToggle: () => void;
}) {
  const pulse = useFocusPulse(`budget.dept.${dept.name}`);
  const pct = dept.annual > 0 ? Math.round((dept.used / dept.annual) * 100) : 0;

  return (
    <div
      className="overflow-hidden transition-all duration-300"
      style={{
        borderRadius: "12px",
        boxShadow: pulse ? PULSE_SHADOW : "rgba(0,0,0,0.06) 0px 0px 0px 1px",
        transform: pulse ? "scale(1.01)" : "scale(1)",
      }}
    >
      <button
        onClick={onToggle}
        className="flex items-center justify-between w-full px-4 py-3 cursor-pointer hover:bg-[#fafafa] transition-colors"
      >
        <div className="flex items-center gap-3">
          <ChevronDown
            size={14}
            strokeWidth={1.5}
            color="#999"
            style={{ transform: isExpanded ? "rotate(180deg)" : "rotate(0deg)", transition: "transform 150ms" }}
          />
          <span className="text-[14px] font-medium">{dept.name}</span>
        </div>
        <div className="text-right">
          <span className="text-[13px] font-medium">{formatPrice(dept.annual)}</span>
          <span className="text-[12px] text-[#999] ml-2">{pct}% 사용</span>
        </div>
      </button>
      {isExpanded && (
        <div className="px-4 pb-3">
          <div className="h-2 bg-[#f5f5f5] rounded-full overflow-hidden mb-2">
            <div
              className="h-full rounded-full transition-all"
              style={{ width: `${pct}%`, backgroundColor: pct > 80 ? "#f59e0b" : "#000" }}
            />
          </div>
          <div className="flex justify-between text-[11px] text-[#999] mb-2">
            <span>사용 {formatPrice(dept.used)}</span>
            <span>잔여 {formatPrice(dept.annual - dept.used)}</span>
          </div>
          <p className="text-[11px] text-[#bbb]">월 {formatPrice(Math.round(dept.annual / 12))} 배정</p>
        </div>
      )}
    </div>
  );
}
