"use client";

import { useRouter } from "next/navigation";
import { Cookie, ArrowUpRight, Package } from "lucide-react";
import { products } from "@/data/products";

/* 분석 요약 — 데모용 목업. 실제 데이터 레이어 붙기 전까지 */
const ANALYSIS = {
  avgMonthlySpend: 280_000,
  categoryMix: [
    { name: "견과류", percent: 42 },
    { name: "초콜릿", percent: 28 },
    { name: "음료",   percent: 18 },
  ],
};

/* 추천 5종 — data/products.ts에서 간식 카테고리만 뽑음 */
const RECOMMENDED_IDS = [
  "prod-snack-1", // 우고래빗 하루견과 (견과류)
  "prod-snack-2", // 롯데 빈츠 (달달)
  "prod-snack-3", // 카프리썬 (음료)
  "prod-snack-4", // 오리온 단백질바 (건강)
  "prod-snack-5", // 곰곰 드립백 커피 (카페인)
];

interface Props {
  /** 탭 딥링크 경로. 기본 /store?tab=간식+패키지 */
  packageHref?: string;
  /** 추천 기준 — 데이터 연결 전까지 요약 한 줄로 표시 */
  teamSize?: number;
  monthlyBudget?: number;
}

export default function SnackRecommendationCard({
  packageHref = "/store?tab=%EA%B0%84%EC%8B%9D+%ED%8C%A8%ED%82%A4%EC%A7%80",
  teamSize,
  monthlyBudget,
}: Props) {
  const router = useRouter();
  const recommended = RECOMMENDED_IDS
    .map((id) => products.find((p) => p.id === id))
    .filter(Boolean);

  const totalEstimate = recommended.reduce((s, p) => s + (p?.price ?? 0), 0);

  return (
    <div
      className="flex flex-col w-full max-w-[440px]"
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
          <Cookie size={13} strokeWidth={1.5} color="#777169" />
          <span
            className="text-[11px] font-semibold uppercase text-[#4e4e4e]"
            style={{ letterSpacing: "0.7px" }}
          >
            이번 달 간식 추천
          </span>
        </div>
        {(teamSize != null || monthlyBudget != null) && (
          <span className="text-[10px] text-[#999]" style={{ letterSpacing: "0.14px" }}>
            {teamSize != null ? `${teamSize}명` : ""}
            {teamSize != null && monthlyBudget != null ? " · " : ""}
            {monthlyBudget != null ? `${Math.round(monthlyBudget / 10_000)}만원` : ""}
          </span>
        )}
      </div>

      {/* 분석 요약 — 최근 3개월 카테고리 믹스 */}
      <div className="px-4 py-3" style={{ borderBottom: "1px solid rgba(0,0,0,0.04)" }}>
        <div className="flex items-center justify-between mb-2">
          <span
            className="text-[10px] font-medium text-[#999]"
            style={{ letterSpacing: "0.14px" }}
          >
            최근 3개월 선호 카테고리
          </span>
          <span className="text-[10px] text-[#777169]" style={{ letterSpacing: "0.14px" }}>
            평균 {Math.round(ANALYSIS.avgMonthlySpend / 10_000)}만원/월
          </span>
        </div>
        <div className="flex flex-col gap-1">
          {ANALYSIS.categoryMix.map((c) => (
            <div key={c.name} className="flex items-center gap-2">
              <span
                className="text-[11px] text-[#4e4e4e] w-[48px] shrink-0"
                style={{ letterSpacing: "0.14px" }}
              >
                {c.name}
              </span>
              <div className="flex-1 h-[4px] bg-[rgba(0,0,0,0.04)] rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full transition-all"
                  style={{ width: `${c.percent}%`, backgroundColor: "#111" }}
                />
              </div>
              <span
                className="text-[11px] font-medium text-[#1a1a1a] w-[30px] text-right"
                style={{ letterSpacing: "0.14px" }}
              >
                {c.percent}%
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* 추천 5종 */}
      <div className="px-4 py-3">
        <div className="flex items-center justify-between mb-2">
          <span
            className="text-[10px] font-medium text-[#999]"
            style={{ letterSpacing: "0.14px" }}
          >
            이번 달 추천 구성 {recommended.length}종
          </span>
          <span
            className="text-[10px] font-medium text-[#1a1a1a]"
            style={{ letterSpacing: "0.14px" }}
          >
            예상 {totalEstimate.toLocaleString()}원
          </span>
        </div>
        <ul className="flex flex-col gap-1">
          {recommended.map((p) => (
            <li key={p!.id} className="flex items-center gap-2 py-0.5">
              <span
                className="w-1.5 h-1.5 shrink-0"
                style={{ borderRadius: "9999px", backgroundColor: "#777169" }}
              />
              <span
                className="text-[12px] text-[#1a1a1a] flex-1 truncate"
                style={{ letterSpacing: "0.14px" }}
              >
                {p!.name}
              </span>
              <span
                className="text-[11px] text-[#777169] shrink-0"
                style={{ letterSpacing: "0.14px" }}
              >
                {p!.price.toLocaleString()}원
              </span>
            </li>
          ))}
        </ul>
      </div>

      {/* Footer CTA — 간식 패키지 탭으로 이동 */}
      <button
        onClick={() => router.push(packageHref)}
        className="group flex items-center justify-between px-4 py-2.5 cursor-pointer transition-colors hover:bg-[rgba(99,102,241,0.03)]"
        style={{
          borderTop: "1px solid rgba(0,0,0,0.04)",
          borderBottomLeftRadius: "14px",
          borderBottomRightRadius: "14px",
        }}
      >
        <span className="inline-flex items-center gap-1.5">
          <Package size={12} strokeWidth={1.5} color="#6366f1" />
          <span
            className="text-[11px] text-[#4e4e4e]"
            style={{ letterSpacing: "0.14px" }}
          >
            한 번에 묶음으로 구매하고 싶다면
          </span>
        </span>
        <span
          className="inline-flex items-center gap-0.5 text-[11px] font-medium text-[#000] group-hover:gap-1 transition-all"
          style={{ letterSpacing: "0.14px" }}
        >
          간식 패키지 열기
          <ArrowUpRight size={11} strokeWidth={2} />
        </span>
      </button>
    </div>
  );
}
