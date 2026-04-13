"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import {
  Sparkles, Database, Building2, Globe, Zap, Search, Clock,
  Check, Loader2, ArrowRight, ShoppingCart, Package, ChevronRight,
} from "lucide-react";
import ChatBubble from "@/components/chat/ChatBubble";
import ChatInput from "@/components/chat/ChatInput";
import SourcedProductCard, {
  type SourcedProduct,
  type ScrapingStatus,
} from "@/components/chat/SourcedProductCard";
import type { ChatMessage } from "@/lib/types";

/* ═══════════════════════════════════════
   데모 시나리오: 구매 의도 → 3-DB 검색 → 추천 → 스크래핑 플로우
   팀원들이 실제 상황처럼 체험할 수 있는 인터랙티브 데모
   ═══════════════════════════════════════ */

/* ─── CSS 애니메이션 ─── */
const styles = `
@keyframes shimmer-bar {
  0% { background-position: -200% 0; }
  100% { background-position: 200% 0; }
}
@keyframes fade-in {
  from { opacity: 0; transform: translateY(8px); }
  to { opacity: 1; transform: translateY(0); }
}
@keyframes pulse-glow {
  0%, 100% { box-shadow: rgba(99,102,241,0.15) 0px 0px 0px 0px; }
  50% { box-shadow: rgba(99,102,241,0.3) 0px 0px 0px 4px; }
}
`;

/* ─── 시나리오 더미 상품 ─── */

const scenarioProducts: SourcedProduct[] = [
  {
    id: "src-001",
    name: "삼성 비스포크 제트 무선 청소기 VS20A95973B",
    price: 698000,
    originalPrice: 799000,
    brand: "삼성전자",
    category: "생활가전",
    source: "airsupply-db",
    purchaseCount: 34,
    lastPurchasedAt: "2026-04-08",
    deliveryFee: 0,
    deliveryDays: 2,
    options: ["미드나이트블루", "코사 핑크", "새틴 그레이"],
    rating: 4.7,
    savingsPercent: 13,
    isRecommended: true,
    aiNote: "최근 30일 동종업계 34회 구매 — 가장 많이 선택된 모델. 배송 2일, 무료배송. 귀사 유사 규모 기업의 82%가 이 제품을 선택했습니다.",
  },
  {
    id: "src-002",
    name: "LG 코드제로 A9S 올인원타워 AS9571GKE",
    price: 729000,
    brand: "LG전자",
    category: "생활가전",
    source: "airsupply-supplier",
    deliveryFee: 0,
    deliveryDays: 3,
    options: ["카밍 그린", "판타지 실버"],
    purchaseCount: 18,
    savingsPercent: 8,
    aiNote: "입점 공급사 직거래 — A/S 직접 연결 가능. LG 선호 기업이라면 이 옵션이 유리합니다.",
  },
  {
    id: "src-003",
    name: "다이슨 V15 디텍트 컴플리트 무선 청소기",
    price: 659000,
    brand: "다이슨",
    category: "생활가전",
    source: "api-external",
    platform: "쿠팡",
    platformUrl: "https://www.coupang.com/...",
    scrapingStatus: "idle",
    scrapingProgress: 0,
    scrapingSteps: [
      { label: "상품 페이지 접속", done: false },
      { label: "가격·옵션 정보 추출", done: false },
      { label: "배송비·배송일 확인", done: false },
      { label: "상세 스펙 수집", done: false },
    ],
    aiNote: "쿠팡 최저가 — 단, 상세 옵션과 배송 조건은 정보 수집 후 확인 가능합니다.",
  },
];

/* ─── 검색 중 단계 표시 ─── */

interface SearchStep {
  db: string;
  icon: React.ReactNode;
  color: string;
  status: "waiting" | "searching" | "done";
  resultCount?: number;
}

/* ─── 데모 단계 ─── */
type DemoStage =
  | "initial"        // 유저 입력 대기
  | "analyzing"      // AI 의도 분석 중
  | "searching"      // 3-DB 검색 중
  | "results"        // 추천 결과 표시
  | "scraping"       // API 상품 스크래핑 중 (유저가 API 상품 선택)
  | "scrape-done"    // 스크래핑 완료
  | "selected-ready" // 에어서플라이 상품 선택 (즉시 진행)
  | "complete";

export default function ChatDemoPage() {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: "init-1",
      role: "assistant",
      content: "안녕하세요! 무엇을 구매하시려는지 말씀해주세요. 간단한 한 줄이면 충분합니다.",
      timestamp: new Date().toISOString(),
      agent: "주문",
    },
  ]);

  const [stage, setStage] = useState<DemoStage>("initial");
  const [isTyping, setIsTyping] = useState(false);
  const [searchSteps, setSearchSteps] = useState<SearchStep[]>([]);
  const [products, setProducts] = useState<SourcedProduct[]>([]);
  const [scrapingProduct, setScrapingProduct] = useState<SourcedProduct | null>(null);
  const [intentAnalysis, setIntentAnalysis] = useState<string | null>(null);

  const bottomRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = useCallback(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, []);

  useEffect(() => { scrollToBottom(); }, [messages, isTyping, stage, searchSteps, scrollToBottom]);

  const addMsg = useCallback((msg: Omit<ChatMessage, "id" | "timestamp">) => {
    setMessages((prev) => [
      ...prev,
      { ...msg, id: `msg-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`, timestamp: new Date().toISOString() },
    ]);
  }, []);

  /* ═══════════════════════════════════════
     시나리오 1: 유저가 구매 의도 입력
     ═══════════════════════════════════════ */

  const handleSend = useCallback((text: string) => {
    if (stage !== "initial" && stage !== "complete") return;

    addMsg({ role: "user", content: text });
    setIsTyping(true);

    // 1단계: 의도 분석 (0.8초)
    setTimeout(() => {
      setIsTyping(false);
      setStage("analyzing");
      setIntentAnalysis(null);

      // 의도 분석 결과 표시 (1.2초 후)
      setTimeout(() => {
        setIntentAnalysis(
          "사무실 청소기 구매 요청으로 판단됩니다. 검색 목표: 기업용 무선 청소기, 예산 80만원 이하, 사무공간 적합 모델."
        );

        // 2단계: 3-DB 검색 시작 (0.5초 후)
        setTimeout(() => {
          setStage("searching");
          startDbSearch();
        }, 500);
      }, 1200);
    }, 800);
  }, [stage, addMsg]);

  /* ═══════════════════════════════════════
     3-DB 순차 검색 애니메이션
     ═══════════════════════════════════════ */

  const startDbSearch = useCallback(() => {
    const initial: SearchStep[] = [
      { db: "에어서플라이 상품 DB", icon: <Database size={12} strokeWidth={2} />, color: "#6366f1", status: "waiting" },
      { db: "입점 공급사 DB", icon: <Building2 size={12} strokeWidth={2} />, color: "#059669", status: "waiting" },
      { db: "외부 마켓 API", icon: <Globe size={12} strokeWidth={2} />, color: "#ea580c", status: "waiting" },
    ];
    setSearchSteps(initial);

    // DB 1 검색 시작 (0.3초)
    setTimeout(() => {
      setSearchSteps((prev) => prev.map((s, i) => i === 0 ? { ...s, status: "searching" } : s));
    }, 300);

    // DB 1 완료 (1.5초)
    setTimeout(() => {
      setSearchSteps((prev) => prev.map((s, i) =>
        i === 0 ? { ...s, status: "done", resultCount: 1 } : i === 1 ? { ...s, status: "searching" } : s
      ));
    }, 1500);

    // DB 2 완료 (2.5초)
    setTimeout(() => {
      setSearchSteps((prev) => prev.map((s, i) =>
        i === 1 ? { ...s, status: "done", resultCount: 1 } : i === 2 ? { ...s, status: "searching" } : s
      ));
    }, 2500);

    // DB 3 완료 → 결과 표시 (3.5초)
    setTimeout(() => {
      setSearchSteps((prev) => prev.map((s, i) =>
        i === 2 ? { ...s, status: "done", resultCount: 1 } : s
      ));

      // 결과 표시
      setTimeout(() => {
        setProducts(scenarioProducts);
        setStage("results");
        addMsg({
          role: "assistant",
          content: "3개 데이터소스에서 조건에 맞는 상품을 찾았습니다. 가격·배송·구매이력을 비교해서 추천 순으로 정렬했어요.",
          agent: "주문",
        });
      }, 400);
    }, 3500);
  }, [addMsg]);

  /* ═══════════════════════════════════════
     상품 선택 핸들러
     ═══════════════════════════════════════ */

  const handleProductSelect = useCallback((product: SourcedProduct) => {
    if (product.source === "api-external" && product.scrapingStatus !== "done") {
      // API 상품 선택 → 스크래핑 시작
      addMsg({ role: "user", content: `"${product.name}" 이 상품으로 할게요` });
      setStage("scraping");
      setScrapingProduct({ ...product, scrapingStatus: "scraping", scrapingProgress: 0 });

      addMsg({
        role: "assistant",
        content: "외부 마켓 상품이라 상세 정보를 수집할게요. 잠시만 기다려주세요 — 다른 질문이 있으시면 먼저 진행하셔도 됩니다.",
        agent: "주문",
      });

      // 스크래핑 시뮬레이션
      simulateScraping();
    } else {
      // 에어서플라이 상품 선택 → 즉시 진행
      addMsg({ role: "user", content: `"${product.name}" 이 상품으로 할게요` });
      setStage("selected-ready");

      setTimeout(() => {
        addMsg({
          role: "assistant",
          content: `**${product.name}** — ${product.price.toLocaleString()}원\n\n모든 정보가 확인되었습니다. 바로 장바구니에 담아드릴까요, 아니면 옵션을 변경하시겠어요?`,
          agent: "주문",
        });
      }, 600);
    }
  }, [addMsg]);

  const handleProductAddToCart = useCallback((product: SourcedProduct) => {
    handleProductSelect(product);
  }, [handleProductSelect]);

  /* ═══════════════════════════════════════
     스크래핑 시뮬레이션
     ═══════════════════════════════════════ */

  const simulateScraping = useCallback(() => {
    const stepTimings = [
      { at: 1000, progress: 20, stepIdx: 0 },    // 페이지 접속
      { at: 3000, progress: 50, stepIdx: 1 },    // 가격·옵션 추출
      { at: 5500, progress: 75, stepIdx: 2 },    // 배송비·배송일
      { at: 8000, progress: 100, stepIdx: 3 },   // 상세 스펙
    ];

    stepTimings.forEach(({ at, progress, stepIdx }) => {
      setTimeout(() => {
        setScrapingProduct((prev) => {
          if (!prev) return prev;
          const newSteps = (prev.scrapingSteps ?? []).map((s, i) => ({
            ...s,
            done: i <= stepIdx,
          }));
          return {
            ...prev,
            scrapingProgress: progress,
            scrapingSteps: newSteps,
            scrapingStatus: progress >= 100 ? "done" as ScrapingStatus : "scraping" as ScrapingStatus,
          };
        });
      }, at);
    });

    // 완료 처리
    setTimeout(() => {
      setScrapingProduct((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          scrapingStatus: "done",
          scrapingProgress: 100,
          scrapedOptions: ["아이언", "블루", "골드"],
          scrapedDeliveryFee: 0,
          scrapedDeliveryDays: 3,
          scrapedSpecs: { "흡입력": "230AW", "배터리": "60분", "무게": "2.74kg" },
        };
      });
      setStage("scrape-done");

      addMsg({
        role: "assistant",
        content: "상세 정보 수집이 완료되었습니다!\n\n**다이슨 V15 디텍트 컴플리트**\n옵션: 아이언 / 블루 / 골드\n배송비: 무료 · 3일 내 도착\n흡입력 230AW · 배터리 60분\n\n장바구니에 담아드릴까요?",
        agent: "주문",
      });
    }, 9000);
  }, [addMsg]);

  /* ─── 렌더 ─── */

  return (
    <div className="flex flex-col h-full">
      <style dangerouslySetInnerHTML={{ __html: styles }} />

      {/* 데모 배너 */}
      <div className="px-4 py-2 text-center shrink-0" style={{ backgroundColor: "rgba(99,102,241,0.04)", borderBottom: "1px solid rgba(99,102,241,0.08)" }}>
        <p className="text-[11px] text-[#6366f1] font-medium">
          데모 시나리오 — "사무실 청소기 구매" 입력으로 3-DB 검색 → 추천 → 스크래핑 플로우 체험
        </p>
      </div>

      {/* 메시지 영역 */}
      <div className="flex-1 overflow-y-auto px-4 pt-4">
        <div className="max-w-[720px] mx-auto flex flex-col gap-1">
          {messages.map((msg) => (
            <div key={msg.id}>
              <ChatBubble message={msg} />
            </div>
          ))}

          {/* ── 의도 분석 단계 ── */}
          {stage === "analyzing" && (
            <div className="flex justify-start mb-1" style={{ animation: "fade-in 0.3s ease-out" }}>
              <div
                className="max-w-[520px] px-4 py-3"
                style={{
                  borderRadius: "16px 16px 16px 4px",
                  background: "linear-gradient(135deg, rgba(99,102,241,0.04) 0%, rgba(139,92,246,0.02) 100%)",
                  boxShadow: "rgba(99,102,241,0.1) 0px 0px 0px 1px",
                }}
              >
                <div className="flex items-center gap-2 mb-2">
                  <Sparkles size={13} strokeWidth={1.5} color="#6366f1" className="animate-pulse" />
                  <span className="text-[12px] font-semibold text-[#6366f1]">구매 의도 분석 중</span>
                </div>
                {intentAnalysis ? (
                  <div style={{ animation: "fade-in 0.4s ease-out" }}>
                    <p className="text-[13px] text-[#333] leading-[1.6]">{intentAnalysis}</p>
                    <div className="flex items-center gap-1 mt-2">
                      <Check size={11} strokeWidth={2} color="#22c55e" />
                      <span className="text-[10px] text-[#22c55e] font-medium">분석 완료 — 검색을 시작합니다</span>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <div
                      className="h-2 flex-1 rounded"
                      style={{
                        background: "linear-gradient(90deg, rgba(99,102,241,0.1) 0%, rgba(99,102,241,0.03) 50%, rgba(99,102,241,0.1) 100%)",
                        backgroundSize: "200% 100%",
                        animation: "shimmer-bar 1.5s linear infinite",
                      }}
                    />
                    <span className="text-[11px] text-[#999]">분석 중...</span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ── 3-DB 검색 단계 ── */}
          {(stage === "searching" || (stage === "results" && searchSteps.length > 0)) && (
            <div className="flex justify-start mb-1" style={{ animation: "fade-in 0.3s ease-out" }}>
              <div
                className="max-w-[520px] px-4 py-3"
                style={{
                  borderRadius: "16px 16px 16px 4px",
                  backgroundColor: "#fff",
                  boxShadow: "rgba(0,0,0,0.06) 0px 0px 0px 1px, rgba(0,0,0,0.04) 0px 1px 2px",
                }}
              >
                <div className="flex items-center gap-2 mb-3">
                  <Search size={13} strokeWidth={1.5} color="#333" />
                  <span className="text-[12px] font-semibold text-[#333]">데이터소스 검색</span>
                </div>

                <div className="flex flex-col gap-2">
                  {searchSteps.map((step, i) => (
                    <div
                      key={step.db}
                      className="flex items-center gap-2.5"
                      style={{ animation: `fade-in 0.3s ease-out ${i * 0.15}s both` }}
                    >
                      {/* 상태 아이콘 */}
                      <div
                        className="w-6 h-6 shrink-0 flex items-center justify-center rounded-md"
                        style={{
                          backgroundColor: step.status === "done"
                            ? `${step.color}15`
                            : step.status === "searching"
                              ? `${step.color}10`
                              : "rgba(0,0,0,0.03)",
                        }}
                      >
                        {step.status === "done" ? (
                          <Check size={11} strokeWidth={2.5} color={step.color} />
                        ) : step.status === "searching" ? (
                          <Loader2 size={11} strokeWidth={2} color={step.color} className="animate-spin" />
                        ) : (
                          <Clock size={11} strokeWidth={1.5} color="#ccc" />
                        )}
                      </div>

                      {/* DB 이름 */}
                      <div className="flex-1">
                        <div className="flex items-center gap-1.5">
                          <span style={{ color: step.color }}>{step.icon}</span>
                          <span
                            className="text-[12px] font-medium"
                            style={{ color: step.status === "waiting" ? "#bbb" : "#333" }}
                          >
                            {step.db}
                          </span>
                        </div>
                        {step.status === "searching" && (
                          <div
                            className="h-1 mt-1 rounded"
                            style={{
                              width: "80%",
                              background: `linear-gradient(90deg, ${step.color}20 0%, ${step.color}08 50%, ${step.color}20 100%)`,
                              backgroundSize: "200% 100%",
                              animation: "shimmer-bar 1.5s linear infinite",
                            }}
                          />
                        )}
                      </div>

                      {/* 결과 수 */}
                      {step.status === "done" && step.resultCount != null && (
                        <span className="text-[11px] font-medium" style={{ color: step.color }}>
                          {step.resultCount}건
                        </span>
                      )}
                    </div>
                  ))}
                </div>

                {searchSteps.every((s) => s.status === "done") && (
                  <div className="flex items-center gap-1.5 mt-2.5 pt-2" style={{ borderTop: "1px solid rgba(0,0,0,0.04)" }}>
                    <Zap size={11} strokeWidth={2} color="#6366f1" />
                    <span className="text-[11px] font-medium text-[#6366f1]">
                      총 {searchSteps.reduce((s, st) => s + (st.resultCount ?? 0), 0)}개 상품 발견 — 비교 분석 완료
                    </span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ── 추천 결과 카드 ── */}
          {stage === "results" && products.length > 0 && (
            <div className="flex justify-start mb-1" style={{ animation: "fade-in 0.4s ease-out" }}>
              <div className="max-w-[560px]">
                <SourcedProductCard
                  products={products}
                  onSelect={handleProductSelect}
                  onAddToCart={handleProductAddToCart}
                />
              </div>
            </div>
          )}

          {/* ── 스크래핑 진행 카드 (채팅 내 실시간) ── */}
          {(stage === "scraping" || stage === "scrape-done") && scrapingProduct && (
            <div className="flex justify-start mb-1" style={{ animation: "fade-in 0.3s ease-out" }}>
              <div
                className="max-w-[520px] px-4 py-3"
                style={{
                  borderRadius: "16px 16px 16px 4px",
                  backgroundColor: "#fff",
                  boxShadow: scrapingProduct.scrapingStatus === "done"
                    ? "rgba(34,197,94,0.15) 0px 0px 0px 1px"
                    : "rgba(234,88,12,0.12) 0px 0px 0px 1px",
                }}
              >
                <div className="flex items-center gap-2 mb-2">
                  {scrapingProduct.scrapingStatus === "done" ? (
                    <>
                      <Check size={13} strokeWidth={2} color="#22c55e" />
                      <span className="text-[12px] font-semibold text-[#22c55e]">상세 정보 수집 완료</span>
                    </>
                  ) : (
                    <>
                      <Loader2 size={13} strokeWidth={2} color="#ea580c" className="animate-spin" />
                      <span className="text-[12px] font-semibold text-[#ea580c]">상품 정보 수집 중</span>
                      <span className="text-[10px] text-[#bbb] ml-auto">다른 질문 가능</span>
                    </>
                  )}
                </div>

                <p className="text-[12px] text-[#555] font-medium mb-2">{scrapingProduct.name}</p>

                {/* 프로그레스 */}
                <div className="flex items-center gap-2 mb-2">
                  <div className="flex-1 h-2 bg-[#f0f0f0] overflow-hidden" style={{ borderRadius: "4px" }}>
                    <div
                      className="h-full transition-all duration-700"
                      style={{
                        width: `${scrapingProduct.scrapingProgress ?? 0}%`,
                        background: scrapingProduct.scrapingStatus === "done"
                          ? "#22c55e"
                          : "linear-gradient(90deg, #ea580c, #f59e0b)",
                        borderRadius: "4px",
                      }}
                    />
                  </div>
                  <span
                    className="text-[11px] font-semibold shrink-0"
                    style={{ color: scrapingProduct.scrapingStatus === "done" ? "#22c55e" : "#ea580c" }}
                  >
                    {scrapingProduct.scrapingProgress}%
                  </span>
                </div>

                {/* 단계 */}
                <div className="flex flex-col gap-1">
                  {(scrapingProduct.scrapingSteps ?? []).map((step, i) => (
                    <div key={i} className="flex items-center gap-2">
                      {step.done ? (
                        <Check size={10} strokeWidth={2.5} color="#22c55e" />
                      ) : (
                        <Loader2 size={10} strokeWidth={2} color="#ea580c" className="animate-spin" />
                      )}
                      <span className={`text-[11px] ${step.done ? "text-[#999]" : "text-[#ea580c] font-medium"}`}>
                        {step.label}
                      </span>
                      {step.done && <Check size={8} strokeWidth={3} color="#22c55e" className="ml-auto" />}
                    </div>
                  ))}
                </div>

                {/* 스크래핑 완료 후 수집된 정보 */}
                {scrapingProduct.scrapingStatus === "done" && scrapingProduct.scrapedSpecs && (
                  <div className="mt-3 pt-2.5" style={{ borderTop: "1px solid rgba(0,0,0,0.04)" }}>
                    <div className="flex items-center gap-1.5 mb-1.5">
                      <Package size={10} strokeWidth={1.5} color="#22c55e" />
                      <span className="text-[10px] font-medium text-[#22c55e]">수집된 정보</span>
                    </div>
                    <div className="grid grid-cols-3 gap-2">
                      {Object.entries(scrapingProduct.scrapedSpecs).map(([key, val]) => (
                        <div key={key}>
                          <p className="text-[9px] text-[#bbb]">{key}</p>
                          <p className="text-[11px] text-[#333] font-medium">{val}</p>
                        </div>
                      ))}
                    </div>
                    {scrapingProduct.scrapedOptions && (
                      <div className="flex items-center gap-1.5 mt-2">
                        <span className="text-[10px] text-[#999]">옵션:</span>
                        {scrapingProduct.scrapedOptions.map((opt) => (
                          <span key={opt} className="text-[10px] text-[#555] px-1.5 py-0.5 rounded" style={{ backgroundColor: "#f5f5f5" }}>{opt}</span>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* 타이핑 인디케이터 */}
          {isTyping && (
            <div className="flex justify-start mb-1">
              <div className="px-3.5 py-2.5 flex items-center gap-1" style={{ borderRadius: "16px 16px 16px 4px", backgroundColor: "#fff", boxShadow: "rgba(0,0,0,0.06) 0px 0px 0px 1px, rgba(0,0,0,0.04) 0px 1px 2px" }}>
                <span className="w-2 h-2 rounded-full bg-[#777169] animate-pulse" />
                <span className="w-2 h-2 rounded-full bg-[#777169] animate-pulse [animation-delay:150ms]" />
                <span className="w-2 h-2 rounded-full bg-[#777169] animate-pulse [animation-delay:300ms]" />
              </div>
            </div>
          )}

          <div ref={bottomRef} />
        </div>
      </div>

      {/* 입력 */}
      <div className="max-w-[720px] mx-auto w-full">
        <ChatInput
          onSend={handleSend}
          disabled={isTyping || (stage !== "initial" && stage !== "scraping" && stage !== "complete")}
          placeholder={
            stage === "initial"
              ? "예: 사무실 청소기 추천해줘"
              : stage === "scraping"
                ? "다른 질문을 입력하셔도 됩니다"
                : "데모 진행 중..."
          }
        />
      </div>
    </div>
  );
}
