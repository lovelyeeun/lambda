"use client";

import { useState, useCallback, useRef, useEffect, useMemo } from "react";
import {
  ArrowUp, TrendingUp, TrendingDown, Wallet, BarChart3,
  Lock, X, Download, Sparkles, ChevronRight,
} from "lucide-react";
import { expenses } from "@/data/expenses";
import type { Expense } from "@/lib/types";
import ExportMenu from "@/components/ui/ExportMenu";
import { useRightPanel } from "@/lib/right-panel-context";

/* ─── Helpers ─── */
function formatPrice(n: number) { return n.toLocaleString("ko-KR") + "원"; }
function sum(arr: Expense[]) { return arr.reduce((s, e) => s + e.amount, 0); }
function getMonth(d: string) { return d.slice(0, 7); }

/* ─── Precomputed data ─── */
const thisMonth = expenses.filter((e) => getMonth(e.date) === "2026-04");
const lastMonth = expenses.filter((e) => getMonth(e.date) === "2026-03");
const thisTotal = sum(thisMonth);
const lastTotal = sum(lastMonth);
const changePercent = lastTotal > 0 ? Math.round(((thisTotal - lastTotal) / lastTotal) * 100) : 0;
const budget = 10_000_000;
const burnRate = Math.round((thisTotal / budget) * 100);

const months = ["2025-11", "2025-12", "2026-01", "2026-02", "2026-03", "2026-04"];
const monthlyTotals = months.map((m) => ({
  month: m.slice(5) + "월",
  total: sum(expenses.filter((e) => getMonth(e.date) === m)),
}));
const maxMonthly = Math.max(...monthlyTotals.map((m) => m.total));

const categories = [...new Set(thisMonth.map((e) => e.category))];
const categoryTotals = categories
  .map((cat) => ({ category: cat, total: sum(thisMonth.filter((e) => e.category === cat)) }))
  .sort((a, b) => b.total - a.total);
const categoryMax = categoryTotals[0]?.total ?? 1;

const teams = [...new Set(thisMonth.map((e) => e.team))];
const teamTotals = teams
  .map((t) => ({ team: t, total: sum(thisMonth.filter((e) => e.team === t)) }))
  .sort((a, b) => b.total - a.total);
const teamMax = teamTotals[0]?.total ?? 1;

/* ─── Access members ─── */
const accessMembers = [
  { name: "박은서", role: "관리자", initials: "은" },
  { name: "김지현", role: "매니저", initials: "지" },
  { name: "이정호", role: "매니저", initials: "정" },
];

/* ─── Dummy AI responses ─── */
type GUIPanel = "summary" | "monthly" | "category" | "team" | "budget" | "saving";

const guiLabels: Record<GUIPanel, string> = {
  summary: "지출 요약",
  monthly: "월별 추이",
  category: "카테고리별",
  team: "팀별",
  budget: "예산 현황",
  saving: "절감 제안",
};

interface AIResponse {
  text: string;
  gui: GUIPanel | null;
}

const responseMap: { keywords: string[]; response: AIResponse }[] = [
  {
    keywords: ["이번 달", "총 지출", "얼마"],
    response: {
      text: `4월 현재까지 총 지출은 ${formatPrice(thisTotal)}입니다.\n\n전월(${formatPrice(lastTotal)}) 대비 ${changePercent > 0 ? "+" : ""}${changePercent}% ${changePercent > 0 ? "증가" : "감소"}했습니다. 주요 원인은 가구 카테고리에서 시디즈 T50 의자 5대 대량 구매(2,490,000원)가 있었기 때문입니다.`,
      gui: "summary",
    },
  },
  {
    keywords: ["월별", "추이", "트렌드", "변화"],
    response: {
      text: "최근 6개월 월별 지출 추이를 보여드립니다.\n\n4월 지출이 급증한 것은 가구(시디즈 의자 5대)와 사무기기(후지제록스 복합기) 대량 구매 때문입니다. 이 두 건을 제외하면 일반 소모품 지출은 전월과 비슷한 수준입니다.",
      gui: "monthly",
    },
  },
  {
    keywords: ["카테고리", "비중", "어디에", "항목"],
    response: {
      text: "4월 카테고리별 지출 비중입니다.\n\n가구가 전체의 43.7%로 가장 높고, 사무기기(33.2%), 전자기기(16.1%) 순입니다. 상위 3개 카테고리가 전체 지출의 93%를 차지합니다.\n\n소모품(용지, 잉크, 사무용품)은 비교적 안정적인 수준입니다.",
      gui: "category",
    },
  },
  {
    keywords: ["팀별", "부서", "팀", "비교"],
    response: {
      text: "4월 팀별 지출 비교 결과입니다.\n\n디자인팀이 2,534,500원으로 가장 높은데, 이는 시디즈 의자 대량 구매 건 때문입니다. 경영지원팀은 사무기기 포함 1,979,000원, 개발팀은 모니터 구매로 918,000원입니다.\n\n마케팅팀은 토너 구매만 있어 267,000원으로 가장 낮습니다.",
      gui: "team",
    },
  },
  {
    keywords: ["예산", "소진", "남은", "잔여"],
    response: {
      text: `4월 예산 현황입니다.\n\n총 예산: ${formatPrice(budget)}\n사용액: ${formatPrice(thisTotal)} (${burnRate}%)\n잔여액: ${formatPrice(budget - thisTotal)}\n\n4월 12일 기준으로 예산의 57%가 소진되었습니다. 남은 18일 동안 일 평균 ${formatPrice(Math.round((budget - thisTotal) / 18))} 이내로 지출하면 예산 내 운영이 가능합니다.`,
      gui: "budget",
    },
  },
  {
    keywords: ["절감", "줄이", "아끼", "절약", "비용 절감"],
    response: {
      text: "비용 절감 제안 3가지입니다.\n\n1. **잉크/토너**: HP 206A 호환 토너로 전환 시 건당 약 40% 절감 → 연간 약 640,000원 절약\n2. **용지**: 50박스 이상 대량 구매 시 팩당 11% 할인 + 양면 인쇄 정책 도입으로 사용량 30% 감소\n3. **가구**: 분기별 일괄 구매로 전환 시 협상력 확보, 예상 절감률 10~15%\n\n총 연간 예상 절감액: 약 1,200,000원",
      gui: "saving",
    },
  },
];

function findResponse(text: string): AIResponse {
  for (const entry of responseMap) {
    if (entry.keywords.some((kw) => text.includes(kw))) return entry.response;
  }
  return {
    text: `분석 결과를 확인하겠습니다.\n\n4월 누적 지출: ${formatPrice(thisTotal)}\n전월 대비: ${changePercent > 0 ? "+" : ""}${changePercent}%\n예산 소진율: ${burnRate}%\n\n더 구체적인 질문을 해주시면 상세 분석을 제공해드릴게요. 예를 들어 "팀별 비교해줘" 또는 "비용 절감 방법 알려줘"와 같이 질문해보세요.`,
    gui: "summary",
  };
}

/* ═══════════════════════════════════════
   Suggestion Chips
   ═══════════════════════════════════════ */

const suggestionChips = [
  "이번 달 총 지출 얼마야?",
  "카테고리별 비중 보여줘",
  "팀별 지출 비교해줘",
  "예산 소진율은?",
  "비용 절감 방법 알려줘",
  "월별 추이 보여줘",
];

/* ═══════════════════════════════════════
   Main Page Component
   ═══════════════════════════════════════ */

interface ChatMessage {
  role: "user" | "assistant";
  content: string;
  gui?: GUIPanel | null;
}

export default function CostIntelPage() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputValue, setInputValue] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [activeGUIs, setActiveGUIs] = useState<GUIPanel[]>([]);
  const chatEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const { openPanel, closePanel } = useRightPanel();

  // Initial AI greeting
  const hasGreeted = useRef(false);
  useEffect(() => {
    if (!hasGreeted.current) {
      hasGreeted.current = true;
      const greeting: ChatMessage = {
        role: "assistant",
        content: `이번 달 지출이 전월 대비 ${changePercent > 0 ? "+" : ""}${changePercent}% ${changePercent > 0 ? "증가" : "감소"}했어요. 어떤 데이터가 궁금하세요?`,
        gui: null,
      };
      setMessages([greeting]);
      setActiveGUIs(["summary"]);
    }
  }, []);

  // Auto scroll
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isTyping]);

  const handleSend = useCallback((text: string) => {
    if (!text.trim() || isTyping) return;

    const userMsg: ChatMessage = { role: "user", content: text.trim() };
    setMessages((prev) => [...prev, userMsg]);
    setInputValue("");
    setIsTyping(true);

    // Reset textarea height
    if (textareaRef.current) textareaRef.current.style.height = "auto";

    // Simulate AI response
    setTimeout(() => {
      const response = findResponse(text);
      const aiMsg: ChatMessage = { role: "assistant", content: response.text, gui: response.gui };
      setMessages((prev) => [...prev, aiMsg]);
      if (response.gui) {
        setActiveGUIs((prev) => prev.includes(response.gui!) ? prev : [...prev, response.gui!]);
      }
      setIsTyping(false);
    }, 600 + Math.random() * 400);
  }, [isTyping]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if ((e.nativeEvent as KeyboardEvent).isComposing || e.keyCode === 229) return;
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend(inputValue);
    }
  };

  const handleInput = () => {
    const el = textareaRef.current;
    if (el) {
      el.style.height = "auto";
      el.style.height = Math.min(el.scrollHeight, 120) + "px";
    }
  };

  /* ── 우측 분석 패널을 RightPanel context로 송출 ──
     마운트 시 자동 오픈, activeGUIs 변화 시 갱신, 언마운트 시 닫기.
     이 페이지 루트 패널이므로 onBack 없음. */
  useEffect(() => {
    openPanel(
      <CostIntelAnalysisPanel
        activeGUIs={activeGUIs}
        onRemoveGUI={(g) => setActiveGUIs((prev) => prev.length > 1 ? prev.filter((p) => p !== g) : prev)}
        onReset={() => setActiveGUIs(["summary"])}
        onDrill={handleSend}
      />,
      "cost-intel-analysis",
      { label: "비용 분석" },
    );
  }, [activeGUIs, openPanel, handleSend]);

  useEffect(() => {
    return () => { closePanel(); };
  }, [closePanel]);

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div
        className="flex items-center justify-between px-6 py-3 shrink-0"
        style={{ borderBottom: "1px solid rgba(0,0,0,0.06)" }}
      >
        <div className="flex items-center gap-3">
          <BarChart3 size={18} strokeWidth={1.5} color="#444" />
          <h1 className="text-[15px] font-semibold" style={{ letterSpacing: "-0.2px" }}>
            비용 인텔리전스
          </h1>
        </div>
        <AccessBadge members={accessMembers} />
      </div>

      {/* Main content: Chat + GUI split */}
      <div className="flex-1 flex min-h-0">
        {/* ── Left: Chat ── */}
        <div className="flex-1 flex flex-col min-w-0">
          {/* Messages */}
          <div className="flex-1 overflow-y-auto px-5 py-5">
            {messages.length <= 1 && (
              <div className="mb-6">
                {/* Initial state — summary mini card */}
                <div className="flex items-start gap-3 mb-4">
                  <div className="w-7 h-7 rounded-full bg-[#000] flex items-center justify-center shrink-0 mt-0.5">
                    <Sparkles size={13} strokeWidth={1.5} color="#fff" />
                  </div>
                  <div className="flex-1">
                    <p className="text-[13px] font-medium text-[#444] mb-3">
                      {messages[0]?.content || "비용 데이터를 분석해드릴게요."}
                    </p>
                    {/* Mini summary cards */}
                    <div className="grid grid-cols-3 gap-2 mb-4">
                      <MiniCard label="이번 달 총 지출" value={formatPrice(thisTotal)} />
                      <MiniCard
                        label="전월 대비"
                        value={`${changePercent > 0 ? "+" : ""}${changePercent}%`}
                        valueColor={changePercent > 0 ? "#ef4444" : "#22c55e"}
                      />
                      <MiniCard label="예산 소진율" value={`${burnRate}%`} />
                    </div>
                  </div>
                </div>

                {/* Suggestion chips */}
                <div className="pl-10">
                  <p className="text-[11px] text-[#999] font-medium mb-2">이런 것들을 물어보세요</p>
                  <div className="flex flex-wrap gap-1.5">
                    {suggestionChips.map((chip) => (
                      <button
                        key={chip}
                        onClick={() => handleSend(chip)}
                        className="px-3 py-[6px] text-[12px] text-[#555] bg-[#f8f8f8] cursor-pointer transition-all hover:bg-[#f0f0f0] hover:text-[#222]"
                        style={{ borderRadius: "9999px", boxShadow: "rgba(0,0,0,0.04) 0px 0px 0px 1px" }}
                      >
                        {chip}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Chat messages (skip first greeting if in initial state) */}
            {messages.slice(messages.length <= 1 ? messages.length : 0).map((msg, i) => (
              <div key={i} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"} mb-3`}>
                {msg.role === "assistant" && (
                  <div className="w-7 h-7 rounded-full bg-[#000] flex items-center justify-center shrink-0 mt-0.5 mr-2.5">
                    <Sparkles size={13} strokeWidth={1.5} color="#fff" />
                  </div>
                )}
                <div
                  className="max-w-[85%] px-3.5 py-2.5 text-[13px] leading-[1.65]"
                  style={{
                    borderRadius: msg.role === "user" ? "14px 14px 4px 14px" : "14px 14px 14px 4px",
                    backgroundColor: msg.role === "user" ? "#000" : "#f8f8f8",
                    color: msg.role === "user" ? "#fff" : "#222",
                    letterSpacing: "0.14px",
                    whiteSpace: "pre-line",
                  }}
                >
                  {msg.content}
                  {/* Drilldown buttons for assistant */}
                  {msg.role === "assistant" && msg.gui && (
                    <div className="flex flex-wrap gap-1 mt-2.5 pt-2.5" style={{ borderTop: "1px solid rgba(0,0,0,0.06)" }}>
                      {msg.gui === "summary" && (
                        <>
                          <DrillButton label="카테고리별 상세" onClick={() => handleSend("카테고리별 비중 보여줘")} />
                          <DrillButton label="팀별 비교" onClick={() => handleSend("팀별 지출 비교해줘")} />
                        </>
                      )}
                      {msg.gui === "monthly" && (
                        <>
                          <DrillButton label="4월 상세 보기" onClick={() => handleSend("이번 달 총 지출 얼마야?")} />
                          <DrillButton label="비용 절감 제안" onClick={() => handleSend("비용 절감 방법 알려줘")} />
                        </>
                      )}
                      {msg.gui === "category" && (
                        <>
                          <DrillButton label="팀별 비교" onClick={() => handleSend("팀별 지출 비교해줘")} />
                          <DrillButton label="절감 방법" onClick={() => handleSend("비용 절감 방법 알려줘")} />
                        </>
                      )}
                      {msg.gui === "team" && (
                        <>
                          <DrillButton label="예산 현황" onClick={() => handleSend("예산 소진율은?")} />
                          <DrillButton label="월별 추이" onClick={() => handleSend("월별 추이 보여줘")} />
                        </>
                      )}
                      {msg.gui === "budget" && (
                        <>
                          <DrillButton label="절감 제안" onClick={() => handleSend("비용 절감 방법 알려줘")} />
                          <DrillButton label="카테고리 상세" onClick={() => handleSend("카테고리별 비중 보여줘")} />
                        </>
                      )}
                      {msg.gui === "saving" && (
                        <>
                          <DrillButton label="현재 지출 현황" onClick={() => handleSend("이번 달 총 지출 얼마야?")} />
                          <DrillButton label="팀별 비교" onClick={() => handleSend("팀별 지출 비교해줘")} />
                        </>
                      )}
                    </div>
                  )}
                </div>
              </div>
            ))}

            {/* Typing indicator */}
            {isTyping && (
              <div className="flex items-start gap-2.5 mb-3">
                <div className="w-7 h-7 rounded-full bg-[#000] flex items-center justify-center shrink-0">
                  <Sparkles size={13} strokeWidth={1.5} color="#fff" />
                </div>
                <div
                  className="px-3.5 py-2.5 text-[13px] text-[#999]"
                  style={{ borderRadius: "14px", backgroundColor: "#f8f8f8" }}
                >
                  <span className="inline-flex gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#999] animate-bounce" style={{ animationDelay: "0ms" }} />
                    <span className="w-1.5 h-1.5 rounded-full bg-[#999] animate-bounce" style={{ animationDelay: "150ms" }} />
                    <span className="w-1.5 h-1.5 rounded-full bg-[#999] animate-bounce" style={{ animationDelay: "300ms" }} />
                  </span>
                </div>
              </div>
            )}

            <div ref={chatEndRef} />
          </div>

          {/* Chat input */}
          <div className="px-4 pb-4 pt-2 shrink-0">
            <div
              className="flex items-end gap-2 bg-white px-4 py-3"
              style={{
                borderRadius: "16px",
                boxShadow: "rgba(0,0,0,0.06) 0px 0px 0px 1px, rgba(0,0,0,0.04) 0px 1px 2px, rgba(0,0,0,0.04) 0px 2px 4px",
              }}
            >
              <textarea
                ref={textareaRef}
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyDown={handleKeyDown}
                onInput={handleInput}
                placeholder="지출 데이터에 대해 물어보세요..."
                rows={1}
                className="flex-1 resize-none text-[13px] outline-none bg-transparent placeholder:text-[#bbb]"
                style={{ letterSpacing: "0.14px", lineHeight: "1.5", maxHeight: "120px" }}
              />
              <button
                onClick={() => handleSend(inputValue)}
                disabled={!inputValue.trim() || isTyping}
                className="flex items-center justify-center w-7 h-7 rounded-full cursor-pointer transition-opacity shrink-0 disabled:opacity-30 disabled:cursor-not-allowed"
                style={{ backgroundColor: inputValue.trim() ? "#000" : "#e5e5e5" }}
              >
                <ArrowUp size={14} color="#fff" strokeWidth={2} />
              </button>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}

/* ═══════════════════════════════════════
   Right Panel — 분석 GUI 집합
   ═══════════════════════════════════════ */

function CostIntelAnalysisPanel({
  activeGUIs,
  onRemoveGUI,
  onReset,
  onDrill,
}: {
  activeGUIs: GUIPanel[];
  onRemoveGUI: (g: GUIPanel) => void;
  onReset: () => void;
  onDrill: (text: string) => void;
}) {
  return (
    <div>
      {/* 활성 조건 태그 */}
      {activeGUIs.length > 0 && (
        <div className="mb-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-medium text-[#999]">
              분석 조건 ({activeGUIs.length}개 조합)
            </span>
            <button
              onClick={onReset}
              className="text-[11px] text-[#999] cursor-pointer hover:text-[#444] transition-colors"
            >
              초기화
            </button>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {activeGUIs.map((g) => (
              <span
                key={g}
                className="inline-flex items-center gap-1 px-2.5 py-[4px] text-[11px] font-medium text-[#444] bg-white cursor-pointer transition-colors hover:bg-[#f0f0f0] group"
                style={{ borderRadius: "9999px", boxShadow: "rgba(0,0,0,0.06) 0px 0px 0px 1px" }}
                onClick={() => onRemoveGUI(g)}
              >
                {guiLabels[g]}
                {activeGUIs.length > 1 && (
                  <X size={10} strokeWidth={2} className="text-[#bbb] group-hover:text-[#666] transition-colors" />
                )}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* 누적된 GUI 패널들 */}
      {activeGUIs.length === 0 && <GUIEmpty />}
      <div className="flex flex-col gap-5">
        {activeGUIs.includes("summary") && <GUISummary onDrill={onDrill} />}
        {activeGUIs.includes("monthly") && <GUIMonthly onDrill={onDrill} />}
        {activeGUIs.includes("category") && <GUICategory onDrill={onDrill} />}
        {activeGUIs.includes("team") && <GUITeam onDrill={onDrill} />}
        {activeGUIs.includes("budget") && <GUIBudget />}
        {activeGUIs.includes("saving") && <GUISaving />}
      </div>

      {/* Export always at bottom */}
      {activeGUIs.length > 0 && (
        <div className="mt-4 pt-4" style={{ borderTop: "1px solid rgba(0,0,0,0.06)" }}>
          <ExportMenu />
        </div>
      )}
    </div>
  );
}

/* ═══════════════════════════════════════
   Sub Components
   ═══════════════════════════════════════ */

function MiniCard({ label, value, valueColor }: { label: string; value: string; valueColor?: string }) {
  return (
    <div
      className="px-3 py-2.5 bg-white"
      style={{ borderRadius: "10px", boxShadow: "rgba(0,0,0,0.04) 0px 0px 0px 1px" }}
    >
      <p className="text-[10px] text-[#999] mb-0.5">{label}</p>
      <p className="text-[15px] font-semibold" style={{ color: valueColor ?? "#000", letterSpacing: "-0.2px" }}>{value}</p>
    </div>
  );
}

function DrillButton({ label, onClick }: { label: string; onClick: () => void }) {
  return (
    <button
      onClick={(e) => { e.stopPropagation(); onClick(); }}
      className="flex items-center gap-1 px-2.5 py-[4px] text-[11px] text-[#666] bg-white cursor-pointer transition-all hover:bg-[#f5f5f5] hover:text-[#222]"
      style={{ borderRadius: "9999px", boxShadow: "rgba(0,0,0,0.06) 0px 0px 0px 1px" }}
    >
      {label} <ChevronRight size={10} strokeWidth={1.5} />
    </button>
  );
}

function AccessBadge({ members }: { members: { name: string; role: string; initials: string }[] }) {
  const colors = ["#000", "#4e4e4e", "#777169"];
  const [open, setOpen] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") setOpen(false); };
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  return (
    <div ref={wrapRef} className="relative flex items-center gap-2.5">
      <span className="flex items-center gap-1 px-2 py-0.5 text-[11px] font-medium text-[#777169] bg-[#f5f5f5] rounded-full" style={{ letterSpacing: "0.14px" }}>
        <Lock size={10} strokeWidth={2} />관리자 전용
      </span>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-label="접근 가능한 멤버 보기"
        className="flex items-center cursor-pointer transition-opacity hover:opacity-80"
      >
        {members.slice(0, 3).map((m, i) => (
          <div
            key={m.name}
            className="flex items-center justify-center w-7 h-7 rounded-full text-[10px] font-medium text-white border-2 border-white"
            style={{
              backgroundColor: colors[i % colors.length],
              marginLeft: i > 0 ? "-6px" : "0",
              zIndex: 3 - i,
              position: "relative",
              letterSpacing: "0.14px",
            }}
          >
            {m.initials}
          </div>
        ))}
      </button>

      {open && (
        <div
          className="absolute right-0 top-full mt-2 z-20 bg-white overflow-hidden"
          style={{
            width: 280,
            borderRadius: "16px",
            boxShadow: "rgba(0,0,0,0.06) 0px 0px 0px 1px, rgba(0,0,0,0.04) 0px 1px 2px, rgba(0,0,0,0.04) 0px 4px 16px",
          }}
        >
          {/* 헤더 */}
          <div className="flex items-center justify-between px-4 pt-3.5 pb-2.5">
            <span className="text-[13px] font-semibold text-[#000]" style={{ letterSpacing: "0.14px" }}>
              접근 가능한 멤버
            </span>
            <button
              type="button"
              onClick={() => setOpen(false)}
              aria-label="닫기"
              className="flex items-center justify-center w-6 h-6 rounded-md cursor-pointer transition-colors hover:bg-[#f5f5f5]"
            >
              <X size={14} strokeWidth={1.5} color="#777169" />
            </button>
          </div>

          {/* 멤버 리스트 */}
          <div className="px-2 pb-2">
            {members.map((m, i) => (
              <div
                key={m.name}
                className="flex items-center gap-3 px-2 py-2 rounded-lg"
              >
                <div
                  className="flex items-center justify-center w-8 h-8 rounded-full text-[11px] font-medium text-white shrink-0"
                  style={{ backgroundColor: colors[i % colors.length], letterSpacing: "0.14px" }}
                >
                  {m.initials}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[13px] font-semibold text-[#000]" style={{ letterSpacing: "0.14px" }}>
                    {m.name}
                  </p>
                  <p className="text-[11px] text-[#777169]" style={{ letterSpacing: "0.14px" }}>
                    {m.role}
                  </p>
                </div>
              </div>
            ))}
          </div>

          {/* 푸터 */}
          <div className="px-4 py-2.5" style={{ borderTop: "1px solid rgba(0,0,0,0.05)" }}>
            <p className="text-[11px] text-[#777169]" style={{ letterSpacing: "0.14px" }}>
              접근 권한은 조직 설정에서 관리됩니다
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

/* ═══════════════════════════════════════
   GUI Panels
   ═══════════════════════════════════════ */

function GUIEmpty() {
  return (
    <div className="flex flex-col items-center justify-center h-full text-center py-20">
      <BarChart3 size={32} strokeWidth={1.2} color="#ddd" />
      <p className="text-[13px] text-[#bbb] mt-3">채팅으로 질문하면<br />여기에 분석 결과가 표시됩니다</p>
    </div>
  );
}

function GUISummary({ onDrill }: { onDrill: (q: string) => void }) {
  return (
    <div className="flex flex-col gap-3">
      <GUIHeader title="4월 지출 요약" />

      <GUICard>
        <div className="flex items-center gap-2 mb-1">
          <Wallet size={15} strokeWidth={1.5} color="#777" />
          <span className="text-[11px] text-[#999]">이번 달 총 지출</span>
        </div>
        <p className="text-[24px] font-semibold" style={{ letterSpacing: "-0.3px" }}>{formatPrice(thisTotal)}</p>
      </GUICard>

      <div className="grid grid-cols-2 gap-3">
        <GUICard>
          <span className="text-[11px] text-[#999]">전월 대비</span>
          <p className="text-[20px] font-semibold mt-0.5" style={{ color: changePercent > 0 ? "#ef4444" : "#22c55e" }}>
            {changePercent > 0 ? "+" : ""}{changePercent}%
          </p>
        </GUICard>
        <GUICard>
          <span className="text-[11px] text-[#999]">예산 소진율</span>
          <p className="text-[20px] font-semibold mt-0.5">{burnRate}%</p>
          <div className="w-full h-1.5 bg-[#f0f0f0] rounded-full mt-1.5 overflow-hidden">
            <div className="h-full bg-[#000] rounded-full" style={{ width: `${burnRate}%` }} />
          </div>
        </GUICard>
      </div>

      {/* Quick category preview */}
      <GUICard>
        <div className="flex items-center justify-between mb-2">
          <span className="text-[12px] font-medium text-[#444]">카테고리 상위 3</span>
          <button
            onClick={() => onDrill("카테고리별 비중 보여줘")}
            className="text-[11px] text-[#999] cursor-pointer hover:text-[#444] transition-colors flex items-center gap-0.5"
          >
            전체 보기 <ChevronRight size={10} strokeWidth={1.5} />
          </button>
        </div>
        {categoryTotals.slice(0, 3).map((c) => (
          <div key={c.category} className="flex items-center justify-between text-[12px] py-1">
            <span className="text-[#555]">{c.category}</span>
            <span className="font-medium">{formatPrice(c.total)}</span>
          </div>
        ))}
      </GUICard>
    </div>
  );
}

function GUIMonthly({ onDrill }: { onDrill: (q: string) => void }) {
  return (
    <div className="flex flex-col gap-3">
      <GUIHeader title="월별 지출 추이" />
      <GUICard>
        <div className="flex items-end gap-2 h-[160px] pt-2">
          {monthlyTotals.map((m) => (
            <div key={m.month} className="flex-1 flex flex-col items-center gap-1.5">
              <span className="text-[9px] text-[#999]">{formatPrice(m.total).replace("원", "")}</span>
              <button
                onClick={() => onDrill(`${m.month} 상세 지출 보여줘`)}
                className="w-full rounded-t-md transition-all cursor-pointer hover:opacity-80"
                style={{
                  height: `${Math.max((m.total / maxMonthly) * 120, 4)}px`,
                  backgroundColor: m.month === "04월" ? "#000" : "#ddd",
                }}
              />
              <span className="text-[10px] text-[#777] font-medium">{m.month}</span>
            </div>
          ))}
        </div>
      </GUICard>

      {/* Month-over-month delta */}
      <GUICard>
        <span className="text-[12px] font-medium text-[#444] block mb-2">전월 대비 변화</span>
        <div className="flex items-center gap-2">
          {changePercent > 0
            ? <TrendingUp size={16} strokeWidth={1.5} color="#ef4444" />
            : <TrendingDown size={16} strokeWidth={1.5} color="#22c55e" />
          }
          <span className="text-[16px] font-semibold" style={{ color: changePercent > 0 ? "#ef4444" : "#22c55e" }}>
            {changePercent > 0 ? "+" : ""}{changePercent}%
          </span>
          <span className="text-[12px] text-[#999]">({formatPrice(lastTotal)} → {formatPrice(thisTotal)})</span>
        </div>
      </GUICard>
    </div>
  );
}

function GUICategory({ onDrill }: { onDrill: (q: string) => void }) {
  return (
    <div className="flex flex-col gap-3">
      <GUIHeader title="카테고리별 비중 (4월)" />
      <GUICard>
        <div className="flex flex-col gap-3">
          {categoryTotals.map((c) => (
            <button
              key={c.category}
              onClick={() => onDrill(`${c.category} 카테고리 상세 내역 보여줘`)}
              className="text-left cursor-pointer group"
            >
              <div className="flex items-center justify-between text-[12px] mb-1">
                <span className="text-[#444] group-hover:text-[#000] transition-colors">{c.category}</span>
                <div className="flex items-center gap-2">
                  <span className="text-[#777] font-medium">{formatPrice(c.total)}</span>
                  <span className="text-[10px] text-[#bbb]">{Math.round((c.total / thisTotal) * 100)}%</span>
                </div>
              </div>
              <div className="h-2 bg-[#f0f0f0] rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full bg-[#000] transition-all group-hover:bg-[#333]"
                  style={{ width: `${(c.total / categoryMax) * 100}%` }}
                />
              </div>
            </button>
          ))}
        </div>
      </GUICard>

      {/* Total */}
      <GUICard>
        <div className="flex items-center justify-between">
          <span className="text-[12px] text-[#999]">4월 총 지출</span>
          <span className="text-[14px] font-semibold">{formatPrice(thisTotal)}</span>
        </div>
      </GUICard>
    </div>
  );
}

function GUITeam({ onDrill }: { onDrill: (q: string) => void }) {
  return (
    <div className="flex flex-col gap-3">
      <GUIHeader title="팀별 지출 비교 (4월)" />
      <GUICard>
        <div className="flex items-end gap-3 h-[140px] pt-2">
          {teamTotals.map((t) => (
            <div key={t.team} className="flex-1 flex flex-col items-center gap-1.5">
              <span className="text-[9px] text-[#999]">{formatPrice(t.total).replace("원", "")}</span>
              <button
                onClick={() => onDrill(`${t.team} 팀 지출 상세 보여줘`)}
                className="w-full rounded-t-md cursor-pointer transition-opacity hover:opacity-80"
                style={{
                  height: `${Math.max((t.total / teamMax) * 100, 4)}px`,
                  backgroundColor: "#000",
                  opacity: 0.2 + (t.total / teamMax) * 0.8,
                }}
              />
              <span className="text-[11px] text-[#444] font-medium">{t.team}</span>
            </div>
          ))}
        </div>
      </GUICard>

      {/* Team table */}
      <GUICard>
        <span className="text-[12px] font-medium text-[#444] block mb-2">상세 순위</span>
        {teamTotals.map((t, i) => (
          <div key={t.team} className="flex items-center justify-between py-1.5 text-[12px]" style={{ borderBottom: i < teamTotals.length - 1 ? "1px solid rgba(0,0,0,0.04)" : undefined }}>
            <div className="flex items-center gap-2">
              <span className="w-5 text-[#bbb] font-medium">{i + 1}</span>
              <span className="text-[#444]">{t.team}</span>
            </div>
            <span className="font-medium">{formatPrice(t.total)}</span>
          </div>
        ))}
      </GUICard>
    </div>
  );
}

function GUIBudget() {
  const remaining = budget - thisTotal;
  const daysLeft = 18; // remaining days in April
  const dailyBudget = Math.round(remaining / daysLeft);

  return (
    <div className="flex flex-col gap-3">
      <GUIHeader title="4월 예산 현황" />
      <GUICard>
        <div className="relative h-4 bg-[#f0f0f0] rounded-full overflow-hidden mb-3">
          <div
            className="h-full rounded-full transition-all"
            style={{
              width: `${burnRate}%`,
              backgroundColor: burnRate > 80 ? "#ef4444" : burnRate > 60 ? "#f59e0b" : "#000",
            }}
          />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-[10px] text-[#999]">총 예산</p>
            <p className="text-[16px] font-semibold">{formatPrice(budget)}</p>
          </div>
          <div>
            <p className="text-[10px] text-[#999]">사용액</p>
            <p className="text-[16px] font-semibold">{formatPrice(thisTotal)}</p>
          </div>
          <div>
            <p className="text-[10px] text-[#999]">잔여</p>
            <p className="text-[16px] font-semibold" style={{ color: "#22c55e" }}>{formatPrice(remaining)}</p>
          </div>
          <div>
            <p className="text-[10px] text-[#999]">소진율</p>
            <p className="text-[16px] font-semibold">{burnRate}%</p>
          </div>
        </div>
      </GUICard>

      <GUICard>
        <span className="text-[12px] font-medium text-[#444] block mb-1">남은 기간 일일 예산</span>
        <p className="text-[11px] text-[#777] mb-2">{daysLeft}일 남음 기준</p>
        <p className="text-[20px] font-semibold">{formatPrice(dailyBudget)}<span className="text-[12px] text-[#999] font-normal"> /일</span></p>
      </GUICard>
    </div>
  );
}

function GUISaving() {
  const savings = [
    { item: "호환 토너 전환", current: "267,000원/분기", saving: "~160,000원", percent: "40%" },
    { item: "용지 대량구매 + 양면인쇄", current: "193,500원/월", saving: "~85,000원", percent: "44%" },
    { item: "가구 분기별 일괄구매", current: "개별 구매", saving: "10~15%", percent: "12%" },
  ];

  return (
    <div className="flex flex-col gap-3">
      <GUIHeader title="비용 절감 제안" />
      {savings.map((s, i) => (
        <GUICard key={i}>
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-[13px] font-medium text-[#222]">{s.item}</span>
            <span className="text-[11px] font-medium text-[#22c55e] bg-[#f0fdf4] px-2 py-0.5 rounded-full">-{s.percent}</span>
          </div>
          <div className="flex items-center justify-between text-[11px] text-[#777]">
            <span>현재: {s.current}</span>
            <span>절감: {s.saving}</span>
          </div>
        </GUICard>
      ))}
      <GUICard>
        <div className="flex items-center justify-between">
          <span className="text-[12px] text-[#444]">연간 예상 총 절감액</span>
          <span className="text-[16px] font-semibold text-[#22c55e]">~1,200,000원</span>
        </div>
      </GUICard>
    </div>
  );
}

/* ─── Shared GUI helpers ─── */

function GUIHeader({ title }: { title: string }) {
  return (
    <div className="flex items-center justify-between mb-1">
      <h3 className="text-[14px] font-semibold text-[#222]">{title}</h3>
    </div>
  );
}

function GUICard({ children }: { children: React.ReactNode }) {
  return (
    <div
      className="p-4 bg-white"
      style={{ borderRadius: "12px", boxShadow: "rgba(0,0,0,0.04) 0px 0px 0px 1px, rgba(0,0,0,0.03) 0px 1px 2px" }}
    >
      {children}
    </div>
  );
}
