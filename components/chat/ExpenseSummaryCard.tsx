"use client";

import { useRouter } from "next/navigation";
import { BarChart3, TrendingDown, TrendingUp, ArrowUpRight } from "lucide-react";

/* 데모용 목업 수치 — 실제 데이터 레이어가 생기면 교체 */
const MOCK = {
  month: "4월",
  totalSpend: 5_089_000,
  prevMonthChangePercent: -12,  // 음수 = 감소
  budgetBurnPercent: 51,
  topCategories: [
    { name: "가구", percent: 49 },
    { name: "사무기기", percent: 28 },
    { name: "전자기기", percent: 16 },
  ],
};

interface Props {
  /** 카드 클릭 시 이동할 경로 (기본 /cost-intel) */
  href?: string;
}

export default function ExpenseSummaryCard({ href = "/cost-intel" }: Props) {
  const router = useRouter();
  const changePositive = MOCK.prevMonthChangePercent > 0;

  const handleClick = () => {
    router.push(href);
  };

  return (
    <button
      onClick={handleClick}
      className="group flex flex-col w-full max-w-[420px] text-left cursor-pointer transition-all"
      style={{
        borderRadius: "14px",
        backgroundColor: "#fff",
        boxShadow:
          "rgba(0,0,0,0.075) 0px 0px 0px 0.5px inset, rgba(0,0,0,0.04) 0px 4px 10px",
      }}
    >
      {/* Header */}
      <div
        className="flex items-center justify-between px-4 pt-3 pb-2.5"
        style={{ borderBottom: "1px solid rgba(0,0,0,0.04)" }}
      >
        <div className="flex items-center gap-1.5">
          <BarChart3 size={13} strokeWidth={1.5} color="#777169" />
          <span
            className="text-[11px] font-semibold uppercase text-[#4e4e4e]"
            style={{ letterSpacing: "0.7px" }}
          >
            {MOCK.month} 지출 요약
          </span>
        </div>
        <span
          className="inline-flex items-center gap-0.5 text-[11px] font-medium text-[#6366f1] opacity-60 group-hover:opacity-100 transition-opacity"
          style={{ letterSpacing: "0.14px" }}
        >
          자세히
          <ArrowUpRight size={11} strokeWidth={2} />
        </span>
      </div>

      {/* 3개 미니 카드 (수평 배치) */}
      <div className="grid grid-cols-3 gap-0 px-4 py-3">
        <MiniStat
          label="총 지출"
          value={formatManWon(MOCK.totalSpend)}
        />
        <MiniStat
          label="전월 대비"
          value={`${changePositive ? "+" : ""}${MOCK.prevMonthChangePercent}%`}
          valueColor={changePositive ? "#ef4444" : "#22c55e"}
          trailing={
            changePositive ? (
              <TrendingUp size={11} strokeWidth={2} color="#ef4444" />
            ) : (
              <TrendingDown size={11} strokeWidth={2} color="#22c55e" />
            )
          }
        />
        <MiniStat
          label="예산 소진율"
          value={`${MOCK.budgetBurnPercent}%`}
        />
      </div>

      {/* 상위 카테고리 진행바 */}
      <div className="px-4 pb-3">
        <p
          className="text-[10px] font-medium text-[#999] mb-1.5"
          style={{ letterSpacing: "0.14px" }}
        >
          상위 카테고리
        </p>
        <div className="flex flex-col gap-1">
          {MOCK.topCategories.map((cat) => (
            <div key={cat.name} className="flex items-center gap-2">
              <span
                className="text-[11px] text-[#4e4e4e] w-[56px] shrink-0"
                style={{ letterSpacing: "0.14px" }}
              >
                {cat.name}
              </span>
              <div className="flex-1 h-[4px] bg-[rgba(0,0,0,0.04)] rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full transition-all"
                  style={{ width: `${cat.percent}%`, backgroundColor: "#111" }}
                />
              </div>
              <span
                className="text-[11px] font-medium text-[#1a1a1a] w-[32px] text-right"
                style={{ letterSpacing: "0.14px" }}
              >
                {cat.percent}%
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Footer CTA */}
      <div
        className="flex items-center justify-between px-4 py-2.5"
        style={{ borderTop: "1px solid rgba(0,0,0,0.04)" }}
      >
        <span className="text-[11px] text-[#777169]" style={{ letterSpacing: "0.14px" }}>
          팀별 · 카테고리별 · 절감 제안까지
        </span>
        <span
          className="inline-flex items-center gap-0.5 text-[11px] font-medium text-[#000] group-hover:gap-1 transition-all"
          style={{ letterSpacing: "0.14px" }}
        >
          비용 인텔리전스 열기
          <ArrowUpRight size={11} strokeWidth={2} />
        </span>
      </div>
    </button>
  );
}

function MiniStat({
  label,
  value,
  valueColor,
  trailing,
}: {
  label: string;
  value: string;
  valueColor?: string;
  trailing?: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-0.5 px-1">
      <span
        className="text-[10px] text-[#999]"
        style={{ letterSpacing: "0.14px" }}
      >
        {label}
      </span>
      <span className="flex items-center gap-1">
        <span
          className="text-[15px] font-semibold"
          style={{
            color: valueColor ?? "#000",
            letterSpacing: "-0.2px",
          }}
        >
          {value}
        </span>
        {trailing}
      </span>
    </div>
  );
}

function formatManWon(n: number): string {
  // 5_089_000 → "5.09M원"
  if (n >= 1_000_000) {
    return `${(n / 1_000_000).toFixed(2)}M원`;
  }
  if (n >= 10_000) {
    return `${Math.round(n / 10_000)}만원`;
  }
  return `${n.toLocaleString("ko-KR")}원`;
}
