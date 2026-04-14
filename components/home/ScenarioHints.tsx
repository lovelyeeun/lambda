"use client";

import { useState } from "react";
import Link from "next/link";
import { Search, BarChart3, Cookie, ChevronDown } from "lucide-react";

/* ═══════════════════════════════════════
   시나리오 힌트 — 시작 화면에서 테스트 가능한 프롬프트 안내
   ═══════════════════════════════════════ */

interface PromptChip {
  label: string;
  /** 채팅으로 전송할 프롬프트. 없으면 label을 그대로 사용 */
  prompt?: string;
}

interface HintGroup {
  icon: React.ComponentType<{ size?: number; strokeWidth?: number; color?: string }>;
  title: string;
  chips: PromptChip[];
}

const groups: HintGroup[] = [
  {
    icon: Search,
    title: "상품 검색",
    chips: [
      { label: "사무용 의자 추천해줘" },
      { label: "청소기 찾아줘" },
      { label: "모니터" },
      { label: "토너" },
      { label: "A4 용지" },
      { label: "노트북" },
      { label: "데스크" },
      { label: "포스트잇" },
      { label: "태블릿" },
      { label: "정수기" },
    ],
  },
  {
    icon: BarChart3,
    title: "분석 · 리포트",
    chips: [
      { label: "이번 달 지출 현황" },
      { label: "부서별 지출 보여줘" },
      { label: "비용 절감 방법 있어?" },
    ],
  },
  {
    icon: Cookie,
    title: "기타",
    chips: [
      { label: "팀 간식 추천해줘" },
    ],
  },
];

export default function ScenarioHints() {
  const [open, setOpen] = useState(false);

  return (
    <section className="mt-8">
      {/* 토글 버튼 */}
      <button
        onClick={() => setOpen((prev) => !prev)}
        className="flex items-center gap-1.5 px-1 cursor-pointer group"
      >
        <span
          className="text-[12px] font-medium text-[#999] group-hover:text-[#666] transition-colors"
          style={{ letterSpacing: "0.14px" }}
        >
          (시나리오 체크용) 추천 키워드 확인하기
        </span>
        <ChevronDown
          size={13}
          strokeWidth={1.5}
          color="#bbb"
          className="transition-transform"
          style={{ transform: open ? "rotate(180deg)" : "rotate(0deg)" }}
        />
      </button>

      {/* 접힘/펼침 콘텐츠 */}
      {open && (
        <div
          className="mt-3 px-4 py-4"
          style={{
            borderRadius: "12px",
            backgroundColor: "#fafafa",
            boxShadow: "rgba(0,0,0,0.04) 0px 0px 0px 1px",
          }}
        >
          <div className="flex flex-col gap-4">
            {groups.map((group) => {
              const Icon = group.icon;
              return (
                <div key={group.title}>
                  <div className="flex items-center gap-1.5 mb-2">
                    <Icon size={12} strokeWidth={1.5} color="#b8b2a8" />
                    <span
                      className="text-[11px] font-medium text-[#b8b2a8] uppercase"
                      style={{ letterSpacing: "0.5px" }}
                    >
                      {group.title}
                    </span>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {group.chips.map((chip) => (
                      <Link
                        key={chip.label}
                        href={`/chat?q=${encodeURIComponent(chip.prompt ?? chip.label)}`}
                        className="inline-flex items-center px-3 py-[6px] text-[12px] text-[#555] cursor-pointer transition-all hover:text-[#111] hover:bg-white"
                        style={{
                          borderRadius: "9999px",
                          backgroundColor: "#fff",
                          boxShadow: "rgba(0,0,0,0.06) 0px 0px 0px 1px",
                          letterSpacing: "0.14px",
                        }}
                      >
                        {chip.label}
                      </Link>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
          <p
            className="text-[10px] text-[#bbb] mt-4"
            style={{ letterSpacing: "0.14px" }}
          >
            클릭하면 해당 프롬프트가 채팅으로 전송됩니다 · 키워드 기반 데모 시나리오
          </p>
        </div>
      )}
    </section>
  );
}
