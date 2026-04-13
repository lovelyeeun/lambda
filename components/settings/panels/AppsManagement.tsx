"use client";

import { useState } from "react";
import { X, Download, Trash2, CheckCircle, Search, Star } from "lucide-react";

/* ── 앱 데이터 타입 ── */
interface AppItem {
  id: string;
  name: string;
  provider: string;
  shortDesc: string;
  longDesc: string;
  category: string;
  color: string;
  letter: string;
  rating: number;
  installed: boolean;
  connectedUsers: number;
  totalUsers: number;
}

/* ── 기업 AI 서비스 연동 앱 목록 ── */
const initialApps: AppItem[] = [
  /* ── 업무 협업 ── */
  {
    id: "slack",
    name: "Slack",
    provider: "Salesforce",
    shortDesc: "구매 승인 알림과 주문 상태를 팀 채널로 자동 전송",
    longDesc:
      "Slack 연동을 통해 구매 요청, 승인 알림, 배송 상태 업데이트를 실시간으로 팀 채널에 공유합니다. 특정 금액 이상의 주문은 관리자에게 DM으로 승인 요청이 발송되며, 슬래시 커맨드(/lambda)로 빠르게 주문을 생성할 수 있습니다.",
    category: "협업",
    color: "#4A154B",
    letter: "S",
    rating: 4.8,
    installed: true,
    connectedUsers: 8,
    totalUsers: 12,
  },
  {
    id: "google-workspace",
    name: "Google Workspace",
    provider: "Google",
    shortDesc: "캘린더, 시트, 드라이브와 연동하여 구매 데이터 자동 동기화",
    longDesc:
      "구매 일정을 Google Calendar에 자동 등록하고, 월별 구매 리포트를 Google Sheets로 내보냅니다. 견적서와 영수증은 Google Drive 지정 폴더에 자동 저장됩니다. Gmail과 연동하면 공급업체 이메일을 자동 분류합니다.",
    category: "협업",
    color: "#4285F4",
    letter: "G",
    rating: 4.7,
    installed: true,
    connectedUsers: 10,
    totalUsers: 12,
  },
  {
    id: "notion",
    name: "Notion",
    provider: "Notion Labs",
    shortDesc: "구매 정책, 공급업체 DB를 Notion 위키와 양방향 동기화",
    longDesc:
      "회사의 구매 정책 문서, 공급업체 데이터베이스, 구매 매뉴얼을 Notion과 양방향으로 동기화합니다. Lambda AI가 Notion에 저장된 사내 구매 가이드라인을 참고하여 최적의 구매 제안을 합니다.",
    category: "협업",
    color: "#000000",
    letter: "N",
    rating: 4.5,
    installed: false,
    connectedUsers: 0,
    totalUsers: 12,
  },
  {
    id: "ms365",
    name: "Microsoft 365",
    provider: "Microsoft",
    shortDesc: "Teams 알림, Excel 리포트, Outlook 메일 자동 연동",
    longDesc:
      "Microsoft Teams에 구매 알림을 전송하고, 월간 구매 분석 리포트를 Excel로 자동 생성합니다. Outlook과 연동하면 공급업체 커뮤니케이션을 자동으로 추적하고, SharePoint에 계약서를 체계적으로 관리합니다.",
    category: "협업",
    color: "#D83B01",
    letter: "M",
    rating: 4.6,
    installed: false,
    connectedUsers: 0,
    totalUsers: 12,
  },

  /* ── ERP / 회계 ── */
  {
    id: "sap",
    name: "SAP Business One",
    provider: "SAP",
    shortDesc: "전사자원관리 시스템과 구매 데이터 실시간 연동",
    longDesc:
      "SAP ERP와 실시간 연동하여 구매 주문, 입고, 대금 지급 프로세스를 자동화합니다. 구매 오더가 SAP에 자동 전표 처리되며, 재고 수준에 따른 자동 발주 트리거를 설정할 수 있습니다.",
    category: "ERP/회계",
    color: "#0070F2",
    letter: "S",
    rating: 4.3,
    installed: false,
    connectedUsers: 0,
    totalUsers: 12,
  },
  {
    id: "xero",
    name: "Xero",
    provider: "Xero Limited",
    shortDesc: "구매 비용을 자동 분개하고 세금계산서 자동 매칭",
    longDesc:
      "구매 발생 시 Xero에 자동으로 비용 전표가 생성되고, 세금계산서와 매칭됩니다. 월말 결산 시 구매 카테고리별 비용 분석 리포트를 자동 생성하여 회계팀의 업무 부담을 줄여줍니다.",
    category: "ERP/회계",
    color: "#13B5EA",
    letter: "X",
    rating: 4.4,
    installed: false,
    connectedUsers: 0,
    totalUsers: 12,
  },
  {
    id: "quickbooks",
    name: "QuickBooks",
    provider: "Intuit",
    shortDesc: "중소기업 회계와 구매 비용 자동 동기화",
    longDesc:
      "QuickBooks와 연동하여 모든 구매 거래를 자동으로 기장합니다. 비용 카테고리 자동 분류, 공급업체별 미지급금 관리, 예산 대비 실적 추적을 실시간으로 처리합니다.",
    category: "ERP/회계",
    color: "#2CA01C",
    letter: "Q",
    rating: 4.2,
    installed: false,
    connectedUsers: 0,
    totalUsers: 12,
  },

  /* ── 조달 / 구매 ── */
  {
    id: "coupa",
    name: "Coupa",
    provider: "Coupa Software",
    shortDesc: "글로벌 조달 플랫폼과 연동하여 소싱 자동화",
    longDesc:
      "Coupa BSM 플랫폼과 연동하여 공급업체 발굴, RFQ 발송, 계약 관리를 자동화합니다. Lambda AI가 Coupa의 벤치마크 데이터를 활용해 최적 가격을 제안하고, 컴플라이언스 체크를 자동 수행합니다.",
    category: "구매/조달",
    color: "#0078D4",
    letter: "C",
    rating: 4.1,
    installed: false,
    connectedUsers: 0,
    totalUsers: 12,
  },

  /* ── 자동화 / AI ── */
  {
    id: "zapier",
    name: "Zapier",
    provider: "Zapier Inc.",
    shortDesc: "5,000개 이상의 앱과 구매 워크플로우를 자동 연결",
    longDesc:
      "Zapier를 통해 Lambda의 구매 이벤트를 5,000개 이상의 외부 앱과 연결합니다. 예: 주문 완료 시 Airtable에 기록 → Slack 알림 → Google Sheets 업데이트 → 담당자 이메일 발송 등 복잡한 워크플로우를 코드 없이 구성합니다.",
    category: "자동화",
    color: "#FF4A00",
    letter: "Z",
    rating: 4.5,
    installed: false,
    connectedUsers: 0,
    totalUsers: 12,
  },
  {
    id: "make",
    name: "Make",
    provider: "Celonis",
    shortDesc: "비주얼 워크플로우로 복잡한 구매 승인 프로세스 자동화",
    longDesc:
      "Make(구 Integromat)의 비주얼 빌더로 다단계 구매 승인 워크플로우를 설계합니다. 조건부 분기, 에러 핸들링, 스케줄링을 포함한 엔터프라이즈급 자동화를 시각적으로 구성할 수 있습니다.",
    category: "자동화",
    color: "#6D00CC",
    letter: "M",
    rating: 4.3,
    installed: false,
    connectedUsers: 0,
    totalUsers: 12,
  },

  /* ── 물류 / 배송 ── */
  {
    id: "sweettracker",
    name: "스위트트래커",
    provider: "Sweet Tracker",
    shortDesc: "택배사 통합 배송 조회 및 도착 알림 자동화",
    longDesc:
      "국내 모든 택배사의 배송 상태를 실시간으로 추적합니다. 배송 시작, 도착 예정, 수령 완료 등 주요 단계마다 담당자에게 자동 알림을 발송하고, 대시보드에서 전사 배송 현황을 한눈에 확인합니다.",
    category: "물류",
    color: "#FF6B35",
    letter: "ST",
    rating: 4.0,
    installed: true,
    connectedUsers: 3,
    totalUsers: 12,
  },

  /* ── 분석 / BI ── */
  {
    id: "tableau",
    name: "Tableau",
    provider: "Salesforce",
    shortDesc: "구매 데이터를 인터랙티브 대시보드로 시각화",
    longDesc:
      "Lambda의 구매 데이터를 Tableau에 연동하여 카테고리별 지출 분석, 공급업체 성과 비교, 예산 소진율 추이 등을 인터랙티브 대시보드로 시각화합니다. 경영진 리포팅에 최적화된 프리셋 템플릿을 제공합니다.",
    category: "분석",
    color: "#E97627",
    letter: "T",
    rating: 4.4,
    installed: false,
    connectedUsers: 0,
    totalUsers: 12,
  },
  {
    id: "power-bi",
    name: "Power BI",
    provider: "Microsoft",
    shortDesc: "실시간 구매 분석 리포트와 AI 인사이트 제공",
    longDesc:
      "Microsoft Power BI와 연동하여 구매 패턴 분석, 비용 절감 기회 발굴, 공급업체 리스크 모니터링을 AI 기반으로 수행합니다. 자연어로 데이터를 질의하고 자동 생성 리포트를 팀과 공유합니다.",
    category: "분석",
    color: "#F2C811",
    letter: "P",
    rating: 4.3,
    installed: false,
    connectedUsers: 0,
    totalUsers: 12,
  },
];

/* ── 카테고리 목록 ── */
const categories = ["전체", "협업", "ERP/회계", "구매/조달", "자동화", "물류", "분석"];

/* ── 메인 컴포넌트 ── */
export default function AppsManagement() {
  const [apps, setApps] = useState<AppItem[]>(initialApps);
  const [selectedApp, setSelectedApp] = useState<AppItem | null>(null);
  const [activeCategory, setActiveCategory] = useState("전체");
  const [searchQuery, setSearchQuery] = useState("");

  const filtered = apps.filter((a) => {
    const matchCat = activeCategory === "전체" || a.category === activeCategory;
    const matchQ =
      !searchQuery ||
      a.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      a.shortDesc.includes(searchQuery);
    return matchCat && matchQ;
  });

  const activeApps = filtered.filter((a) => a.installed);
  const availableApps = filtered.filter((a) => !a.installed);

  const toggleActive = (id: string) => {
    setApps((prev) =>
      prev.map((a) => (a.id === id ? { ...a, installed: !a.installed } : a))
    );
    setSelectedApp((prev) =>
      prev && prev.id === id ? { ...prev, installed: !prev.installed } : prev
    );
  };

  return (
    <div className="max-w-[760px] relative">
      {/* 헤더 */}
      <div className="flex items-center justify-between mb-5">
        <div>
          <h2 className="text-[18px] font-semibold text-[#111]">커넥트 관리</h2>
          <p className="text-[13px] text-[#999] mt-0.5">
            Lambda와 연동할 수 있는 외부 서비스를 관리합니다
          </p>
        </div>
        <span className="text-[12px] text-[#999] bg-[#f5f5f5] px-2.5 py-1 rounded-full">
          {apps.filter((a) => a.installed).length}개 활성화됨
        </span>
      </div>

      {/* 검색바 */}
      <div
        className="flex items-center gap-2.5 px-4 py-2.5 mb-4"
        style={{
          borderRadius: "12px",
          backgroundColor: "#f8f8f8",
          boxShadow: "rgba(0,0,0,0.04) 0px 0px 0px 1px",
        }}
      >
        <Search size={15} strokeWidth={1.5} color="#aaa" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="앱 이름 또는 기능으로 검색..."
          className="flex-1 bg-transparent text-[13px] outline-none placeholder:text-[#bbb]"
        />
      </div>

      {/* 카테고리 탭 */}
      <div className="flex gap-1.5 mb-6 overflow-x-auto pb-1">
        {categories.map((cat) => (
          <button
            key={cat}
            onClick={() => setActiveCategory(cat)}
            className="px-3.5 py-[6px] text-[12px] rounded-full whitespace-nowrap cursor-pointer transition-all"
            style={{
              backgroundColor: activeCategory === cat ? "#111" : "#f5f5f5",
              color: activeCategory === cat ? "#fff" : "#666",
              fontWeight: activeCategory === cat ? 500 : 400,
            }}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* 활성화된 서비스 */}
      {activeApps.length > 0 && (
        <div className="mb-6">
          <p className="text-[12px] font-medium text-[#999] mb-3 px-0.5">
            활성화된 서비스
          </p>
          <div className="grid grid-cols-2 gap-3">
            {activeApps.map((app) => (
              <AppCard
                key={app.id}
                app={app}
                onClick={() => setSelectedApp(app)}
              />
            ))}
          </div>
        </div>
      )}

      {/* 추가 가능한 서비스 */}
      {availableApps.length > 0 && (
        <div className="mb-6">
          <p className="text-[12px] font-medium text-[#999] mb-3 px-0.5">
            추가 가능한 서비스
          </p>
          <div className="grid grid-cols-2 gap-3">
            {availableApps.map((app) => (
              <AppCard
                key={app.id}
                app={app}
                onClick={() => setSelectedApp(app)}
              />
            ))}
          </div>
        </div>
      )}

      {filtered.length === 0 && (
        <div className="text-center py-16 text-[#bbb] text-[14px]">
          검색 결과가 없습니다
        </div>
      )}

      {/* 상세 모달 */}
      {selectedApp && (
        <AppDetailModal
          app={selectedApp}
          onClose={() => setSelectedApp(null)}
          onToggleActive={() => toggleActive(selectedApp.id)}
        />
      )}
    </div>
  );
}

/* ── 앱 카드 컴포넌트 ── */
function AppCard({ app, onClick }: { app: AppItem; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="flex flex-col gap-2 p-3.5 text-left w-full cursor-pointer transition-all hover:shadow-md"
      style={{
        borderRadius: "14px",
        backgroundColor: "#fff",
        boxShadow: "rgba(0,0,0,0.05) 0px 0px 0px 1px, rgba(0,0,0,0.03) 0px 2px 8px",
      }}
    >
      {/* 상단: 썸네일과 앱명 */}
      <div className="flex items-start gap-3">
        {/* 썸네일 */}
        <div
          className="w-11 h-11 rounded-xl shrink-0 flex items-center justify-center text-white text-[14px] font-bold"
          style={{ backgroundColor: app.color }}
        >
          {app.letter}
        </div>

        {/* 정보 */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5">
            <span className="text-[13px] font-semibold text-[#111] truncate">
              {app.name}
            </span>
            {app.installed && (
              <CheckCircle size={13} strokeWidth={2} color="#22c55e" />
            )}
          </div>
          <p className="text-[11px] text-[#999] mt-0.5 line-clamp-2 leading-[1.5]">
            {app.shortDesc}
          </p>
        </div>
      </div>

      {/* 하단: 레이팅과 연결 상태 */}
      <div className="flex items-center gap-2 justify-between px-0.5">
        <div className="flex items-center gap-1">
          <Star size={10} strokeWidth={2} color="#f59e0b" fill="#f59e0b" />
          <span className="text-[10px] text-[#999]">{app.rating}</span>
          <span className="text-[10px] text-[#ddd]">·</span>
          <span className="text-[10px] text-[#bbb]">{app.category}</span>
        </div>
        <span className="text-[10px] text-[#999]">
          {app.connectedUsers}/{app.totalUsers}명 연결
        </span>
      </div>
    </button>
  );
}

/* ── 상세 모달 ── */
function AppDetailModal({
  app,
  onClose,
  onToggleActive,
}: {
  app: AppItem;
  onClose: () => void;
  onToggleActive: () => void;
}) {
  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center">
      <div
        className="absolute inset-0 cursor-pointer"
        style={{ backgroundColor: "rgba(0,0,0,0.35)", backdropFilter: "blur(4px)" }}
        onClick={onClose}
      />
      <div
        className="relative w-[440px] max-h-[75vh] overflow-y-auto bg-white"
        style={{
          borderRadius: "18px",
          boxShadow: "rgba(0,0,0,0.08) 0px 0px 0px 1px, rgba(0,0,0,0.15) 0px 16px 48px",
        }}
      >
        {/* 닫기 */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-10 flex items-center justify-center w-8 h-8 rounded-full cursor-pointer transition-colors hover:bg-[#f0f0f0]"
          style={{ backgroundColor: "rgba(255,255,255,0.9)" }}
        >
          <X size={16} strokeWidth={1.5} color="#888" />
        </button>

        {/* 썸네일 배너 */}
        <div
          className="w-full h-[120px] flex items-center justify-center"
          style={{
            backgroundColor: app.color,
            borderRadius: "18px 18px 0 0",
          }}
        >
          <span className="text-white text-[36px] font-bold opacity-90">
            {app.letter}
          </span>
        </div>

        {/* 내용 */}
        <div className="px-6 pb-6">
          {/* 앱 기본 정보 */}
          <div className="flex items-start justify-between mt-5 mb-4">
            <div>
              <h3 className="text-[18px] font-semibold text-[#111]">
                {app.name}
              </h3>
              <p className="text-[13px] text-[#999] mt-0.5">{app.provider}</p>
              <div className="flex items-center gap-1.5 mt-1.5">
                <div className="flex items-center gap-0.5">
                  {[1, 2, 3, 4, 5].map((s) => (
                    <Star
                      key={s}
                      size={12}
                      strokeWidth={0}
                      fill={s <= Math.round(app.rating) ? "#f59e0b" : "#e5e5e5"}
                    />
                  ))}
                </div>
                <span className="text-[12px] text-[#999]">{app.rating}</span>
                <span className="text-[12px] text-[#ddd]">·</span>
                <span className="text-[12px] text-[#bbb]">{app.category}</span>
              </div>
            </div>
          </div>

          {/* 팀 연결 진행률 */}
          <div className="mb-5 pb-5" style={{ borderBottom: "1px solid rgba(0,0,0,0.06)" }}>
            <p className="text-[12px] font-medium text-[#999] mb-2">팀 연결 현황</p>
            <div className="flex items-center gap-2">
              <div className="flex-1">
                <div
                  className="h-2 rounded-full"
                  style={{
                    backgroundColor: "#e5e5e5",
                    overflow: "hidden",
                  }}
                >
                  <div
                    className="h-full rounded-full transition-all"
                    style={{
                      backgroundColor: "#22c55e",
                      width: `${(app.connectedUsers / app.totalUsers) * 100}%`,
                    }}
                  />
                </div>
              </div>
              <span className="text-[12px] text-[#999] whitespace-nowrap">
                {app.connectedUsers}/{app.totalUsers}명
              </span>
            </div>
          </div>

          {/* 활성화 / 비활성화 버튼 */}
          <button
            onClick={onToggleActive}
            className="w-full flex items-center justify-center gap-2 py-3 rounded-xl text-[14px] font-medium cursor-pointer transition-all mb-5"
            style={
              app.installed
                ? {
                    backgroundColor: "#fef2f2",
                    color: "#ef4444",
                    boxShadow: "rgba(239,68,68,0.1) 0px 0px 0px 1px",
                  }
                : {
                    backgroundColor: "#111",
                    color: "#fff",
                  }
            }
          >
            {app.installed ? (
              <>
                <Trash2 size={15} strokeWidth={1.5} />
                비활성화
              </>
            ) : (
              <>
                <Download size={15} strokeWidth={1.5} />
                활성화하기
              </>
            )}
          </button>

          {/* 상세 설명 */}
          <div>
            <p className="text-[12px] font-medium text-[#999] mb-2">설명</p>
            <p className="text-[13px] text-[#444] leading-[1.7]">
              {app.longDesc}
            </p>
          </div>

          {/* 정보 테이블 */}
          <div className="mt-5 pt-4" style={{ borderTop: "1px solid rgba(0,0,0,0.06)" }}>
            <div className="flex flex-col gap-2.5">
              <div className="flex items-center justify-between">
                <span className="text-[12px] text-[#999]">제공사</span>
                <span className="text-[12px] text-[#555]">{app.provider}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-[12px] text-[#999]">카테고리</span>
                <span className="text-[12px] text-[#555]">{app.category}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-[12px] text-[#999]">상태</span>
                <span
                  className="text-[12px] font-medium"
                  style={{ color: app.installed ? "#22c55e" : "#999" }}
                >
                  {app.installed ? "활성화됨" : "비활성화"}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
