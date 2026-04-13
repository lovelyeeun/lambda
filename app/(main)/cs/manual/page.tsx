"use client";

import { useState } from "react";
import { ChevronDown, Search } from "lucide-react";
import { PlannedTooltip } from "@/components/ui/Tooltip";

/* ─── Manual sections ─── */

interface ManualItem {
  id: string;
  title: string;
  children: { id: string; title: string; content: string }[];
}

const sections: ManualItem[] = [
  {
    id: "start",
    title: "시작하기",
    children: [
      {
        id: "start-account",
        title: "계정 설정",
        content:
          "cockpit에 처음 가입하면 사업자등록증을 업로드하고, 회사 정보를 입력합니다.\n\n1. 이메일로 회원가입\n2. 사업자등록증 업로드 (자동 인식)\n3. 회사명, 주소, 대표자 확인\n4. 관리자 계정 생성 완료\n\n가입 후 '설정 > 회사 정보'에서 언제든 수정할 수 있습니다.",
      },
      {
        id: "start-team",
        title: "팀원 초대",
        content:
          "팀원을 초대하여 함께 구매를 관리하세요.\n\n1. 설정 > 팀원 관리로 이동\n2. '팀원 초대' 버튼 클릭\n3. 이메일 주소 입력\n4. 역할 선택: 관리자 / 매니저 / 구매담당 / 일반\n5. 초대 메일 발송\n\n역할별 권한:\n- 관리자: 모든 기능 접근, 설정 변경 가능\n- 매니저: 품의 승인, 예산 조회\n- 구매담당: 주문 생성, 장바구니 사용\n- 일반: 요청만 가능, AI 기능 제한",
      },
    ],
  },
  {
    id: "purchase",
    title: "구매하기",
    children: [
      {
        id: "purchase-search",
        title: "상품 검색",
        content:
          "채팅에서 자연어로 상품을 검색할 수 있습니다.\n\n예시:\n- \"A4 용지 추천해줘\"\n- \"50만원 이하 사무용 의자\"\n- \"HP 프린터 토너\"\n\nAI가 상품을 추천하면 '상세보기'와 '장바구니' 버튼이 표시됩니다.\n\n스토어 탭에서 직접 상품을 탐색할 수도 있습니다.",
      },
      {
        id: "purchase-cart",
        title: "장바구니 & 결제",
        content:
          "장바구니에 상품을 담으면 우측 패널에서 수량 조절이 가능합니다.\n\n결제 흐름:\n1. 장바구니에서 '품의 요청' 또는 '직접 결제' 선택\n2. 품의 요청: 30만원 이하 자동승인, 초과 시 매니저 승인 필요\n3. 직접 결제: 결제 권한이 있는 경우 바로 결제수단 선택\n4. 등록된 법인카드 또는 BNPL로 결제\n5. 결제 완료 후 자동으로 배송 추적 시작",
      },
    ],
  },
  {
    id: "orders",
    title: "주문 관리",
    children: [
      {
        id: "orders-check",
        title: "주문 조회",
        content:
          "좌측 사이드바의 '주문내역'에서 모든 주문을 확인할 수 있습니다.\n\n- 내 주문: 캘린더 뷰로 배송 예정일 확인\n- 회사 주문: 전체 주문 테이블 (일반/정기구매)\n- 구매요청: 승인 대기 중인 요청 목록\n\n주문 카드를 클릭하면 우측 패널에서 상세 타임라인을 확인합니다.",
      },
      {
        id: "orders-tracking",
        title: "배송 추적",
        content:
          "배송 추적은 두 가지 방법으로 확인할 수 있습니다.\n\n1. 채팅에서 \"배송 어디쯤 왔어?\" 질문\n2. 주문내역에서 주문 선택 → 배송 타임라인 확인\n\n배송 상태:\n접수 → 준비 → 배송중 → 배송완료\n\n배송 완료 후 '구매확정' 또는 '반품 요청'을 할 수 있습니다.",
      },
    ],
  },
  {
    id: "cost",
    title: "비용 관리",
    children: [
      {
        id: "cost-stats",
        title: "지출 통계",
        content:
          "비용인텔리전스에서 월별/분기별 지출을 분석합니다.\n\n- 카테고리별 지출 비중\n- 전월 대비 증감\n- 부서별 사용량\n- 동종업계 벤치마크 비교\n\nExcel, PDF, PNG, 구글 드라이브로 내보내기가 가능합니다.",
      },
      {
        id: "cost-upload",
        title: "데이터 업로드",
        content:
          "외부 지출 데이터를 업로드하여 통합 분석할 수 있습니다.\n\n지원 형식: Excel (.xlsx), CSV\n\n업로드 방법:\n1. 비용인텔리전스 > 맞춤정보 탭\n2. '데이터 업로드' 버튼 클릭\n3. 파일 선택 후 컬럼 매핑\n4. 분석 결과 자동 반영",
      },
    ],
  },
  {
    id: "settings",
    title: "설정",
    children: [
      {
        id: "settings-rules",
        title: "회사 규정",
        content:
          "구매 규정은 설정 > 회사 > 회사 지식에서 관리합니다.\n\n설정 가능 항목:\n- 자동 승인 금액 기준 (기본 30만원)\n- 부서별 월 예산 한도\n- 구매 카테고리 제한\n- AI 응답에 포함할 규정 프롬프트\n\n규정 변경 시 채팅에서 확인 후 반영됩니다.",
      },
      {
        id: "settings-budget",
        title: "예산 & 결제수단",
        content:
          "예산과 결제수단은 설정에서만 관리합니다.\n\n예산 설정:\n- 연간 총 예산 → 부서별 배분 → 월별 한도\n- 초과 시 알림 + 추가 승인 필요\n\n결제수단:\n- 법인카드 등록 (카드번호, 유효기간)\n- BNPL (후불결제) 연동\n- 복수 결제수단 등록 가능",
      },
    ],
  },
];

/* ─── Component ─── */

export default function ManualPage() {
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set(["start"]));
  const [selectedItem, setSelectedItem] = useState(sections[0].children[0]);

  const toggleSection = (id: string) => {
    setExpandedSections((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  return (
    <div className="flex h-full">
      {/* Left: Table of contents */}
      <div
        className="w-[260px] shrink-0 bg-white h-full overflow-y-auto py-4"
        style={{ borderRight: "1px solid rgba(0,0,0,0.05)" }}
      >
        {/* Search bar */}
        <div className="px-4 mb-4">
          <PlannedTooltip description="검색 기능" position="bottom">
            <div
              className="flex items-center gap-2 px-3 py-2 w-full text-[13px] text-[#999] cursor-pointer"
              style={{
                borderRadius: "8px",
                boxShadow: "rgba(0,0,0,0.06) 0px 0px 0px 1px",
              }}
            >
              <Search size={14} strokeWidth={1.5} />
              매뉴얼 검색...
            </div>
          </PlannedTooltip>
        </div>

        {/* Sections */}
        {sections.map((section) => {
          const isExpanded = expandedSections.has(section.id);
          return (
            <div key={section.id} className="mb-0.5">
              {/* Section header */}
              <button
                onClick={() => toggleSection(section.id)}
                className="flex items-center justify-between w-full px-4 py-2 text-[13px] font-medium text-[#333] cursor-pointer transition-colors hover:bg-[#f9f9f9]"
              >
                {section.title}
                <ChevronDown
                  size={14}
                  strokeWidth={1.5}
                  color="#999"
                  style={{
                    transform: isExpanded ? "rotate(180deg)" : "rotate(0deg)",
                    transition: "transform 150ms ease",
                  }}
                />
              </button>

              {/* Children */}
              {isExpanded && (
                <div className="pb-1">
                  {section.children.map((child) => {
                    const isSelected = selectedItem.id === child.id;
                    return (
                      <button
                        key={child.id}
                        onClick={() => setSelectedItem(child)}
                        className="block w-full text-left pl-8 pr-4 py-[6px] text-[13px] cursor-pointer transition-colors"
                        style={{
                          color: isSelected ? "#000" : "#777",
                          fontWeight: isSelected ? 500 : 400,
                          backgroundColor: isSelected ? "#f5f5f5" : "transparent",
                        }}
                      >
                        {child.title}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Right: Content */}
      <div className="flex-1 overflow-y-auto px-8 py-8">
        <div className="max-w-[600px]">
          <h2 className="text-[20px] font-semibold mb-4" style={{ letterSpacing: "-0.2px" }}>
            {selectedItem.title}
          </h2>
          <div className="text-[14px] text-[#4e4e4e] leading-[1.8] whitespace-pre-line" style={{ letterSpacing: "0.14px" }}>
            {selectedItem.content}
          </div>
        </div>
      </div>
    </div>
  );
}
