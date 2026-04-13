"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import Link from "next/link";
import type { ChatMessage } from "@/lib/types";
import { Package, Truck, Shield, BookOpen } from "lucide-react";
import ChatBubble from "@/components/chat/ChatBubble";
import ChatInput from "@/components/chat/ChatInput";

/* ─── Quick actions ─── */

const quickActions = [
  { label: "주문 문의", desc: "주문 상태, 변경, 취소", icon: Package, agent: "주문", color: "#3b82f6" },
  { label: "배송 문의", desc: "배송 추적, 일정 확인", icon: Truck, agent: "배송", color: "#22c55e" },
  { label: "권한/승인 문의", desc: "승인 상태, 권한 요청", icon: Shield, agent: "권한", color: "#f59e0b" },
  { label: "회사 규정 조회", desc: "구매 정책, 예산 규정", icon: BookOpen, agent: "주문", color: "#8b5cf6" },
];

/* ─── CS dummy responses ─── */

const csResponses: Record<string, { content: string; agent: string }> = {
  주문: {
    content: "주문 관련 문의를 도와드리겠습니다.\n\n현재 진행 중인 주문이 3건 있습니다:\n- **시디즈 T50 AIR 의자** — 배송중 (4/11 도착 예정)\n- **LG 27인치 모니터** — 결제완료\n- **후지제록스 복합기** — 배송준비\n\n어떤 주문에 대해 알려드릴까요?",
    agent: "주문",
  },
  배송: {
    content: "배송 추적을 도와드리겠습니다.\n\n현재 배송중인 상품:\n📦 **시디즈 T50 AIR 메쉬 사무용 의자** (5개)\n- CJ대한통운 HJ9876543210\n- 4/10 11:30 — 강남 서브터미널 도착\n- 예상 도착: 4/11 오전\n\n상세 배송 이력을 확인하시겠어요?",
    agent: "배송",
  },
  권한: {
    content: "권한/승인 현황을 확인하겠습니다.\n\n**대기 중인 승인 요청: 1건**\n- HP 206A 토너 3개 (267,000원) — 이준호 님 요청\n- 승인 담당: 김지현 매니저\n\n승인 처리를 도와드릴까요?",
    agent: "권한",
  },
  규정: {
    content: "로랩스 구매 규정을 안내드립니다.\n\n**주요 규정:**\n- 30만원 이하: 자동 승인 (담당자 알림)\n- 30만원 초과: 매니저 승인 필요\n- 200만원 초과: 대표이사 승인 필요\n\n**예산 현황:**\n- 4월 부서 예산: 10,000,000원\n- 사용액: 5,089,000원\n- 잔여: 4,911,000원 (49.1%)\n\n다른 규정에 대해 알아볼까요?",
    agent: "주문",
  },
};

const fallbackResponses = [
  { content: "네, 말씀하신 내용 확인했습니다. 좀 더 자세히 알려주시면 정확하게 도와드리겠습니다.", agent: "주문" },
  { content: "해당 건에 대해 확인해보겠습니다. 잠시만 기다려주세요.\n\n추가로 궁금하신 점이 있으시면 말씀해주세요.", agent: "주문" },
];

/* ─── Component ─── */

export default function CSPage() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isTyping, setIsTyping] = useState(false);
  const [started, setStarted] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const fallbackIdx = useRef(0);

  const scrollToBottom = useCallback(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, []);

  useEffect(() => { scrollToBottom(); }, [messages, isTyping, scrollToBottom]);

  const addMsg = useCallback((msg: Omit<ChatMessage, "id" | "timestamp">) => {
    setMessages((prev) => [
      ...prev,
      { ...msg, id: `cs-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`, timestamp: new Date().toISOString() },
    ]);
  }, []);

  const handleQuickAction = useCallback((action: typeof quickActions[number]) => {
    setStarted(true);
    addMsg({ role: "user", content: action.label });
    setIsTyping(true);

    setTimeout(() => {
      const key = action.label === "회사 규정 조회" ? "규정" : action.agent;
      const resp = csResponses[key] ?? fallbackResponses[0];
      addMsg({ role: "assistant", content: resp.content, agent: resp.agent });
      setIsTyping(false);
    }, 600 + Math.random() * 800);
  }, [addMsg]);

  const handleSend = useCallback((text: string) => {
    setStarted(true);
    addMsg({ role: "user", content: text });
    setIsTyping(true);

    setTimeout(() => {
      const lower = text.toLowerCase();
      let resp;
      if (lower.includes("주문") || lower.includes("취소")) resp = csResponses["주문"];
      else if (lower.includes("배송") || lower.includes("택배")) resp = csResponses["배송"];
      else if (lower.includes("승인") || lower.includes("권한")) resp = csResponses["권한"];
      else if (lower.includes("규정") || lower.includes("예산") || lower.includes("정책")) resp = csResponses["규정"];
      else {
        resp = fallbackResponses[fallbackIdx.current % fallbackResponses.length];
        fallbackIdx.current++;
      }
      addMsg({ role: "assistant", content: resp.content, agent: resp.agent });
      setIsTyping(false);
    }, 600 + Math.random() * 800);
  }, [addMsg]);

  return (
    <div className="flex flex-col h-full">
      {/* Messages area */}
      <div className="flex-1 overflow-y-auto px-4 pt-4">
        <div className="max-w-[720px] mx-auto flex flex-col gap-1">
          {!started ? (
            /* ── Welcome screen ── */
            <div className="flex flex-col items-center pt-16">
              <h2 className="text-[22px] font-semibold mb-2" style={{ letterSpacing: "-0.3px" }}>
                무엇을 도와드릴까요?
              </h2>
              <p className="text-[14px] text-[#777169] mb-8" style={{ letterSpacing: "0.14px" }}>
                질문을 입력하거나 아래 항목을 선택해주세요
              </p>

              <div className="grid grid-cols-2 gap-3 w-full max-w-[480px]">
                {quickActions.map((action) => {
                  const Icon = action.icon;
                  return (
                    <button
                      key={action.label}
                      onClick={() => handleQuickAction(action)}
                      className="flex items-start gap-3 p-4 bg-white text-left cursor-pointer transition-all hover:translate-y-[-1px]"
                      style={{
                        borderRadius: "14px",
                        boxShadow: "rgba(0,0,0,0.06) 0px 0px 0px 1px, rgba(0,0,0,0.04) 0px 1px 2px, rgba(0,0,0,0.04) 0px 2px 4px",
                      }}
                    >
                      <div
                        className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0"
                        style={{ backgroundColor: `${action.color}12` }}
                      >
                        <Icon size={18} strokeWidth={1.5} color={action.color} />
                      </div>
                      <div>
                        <p className="text-[14px] font-medium">{action.label}</p>
                        <p className="text-[12px] text-[#777169] mt-0.5">{action.desc}</p>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          ) : (
            /* ── Chat messages ── */
            <>
              {messages.map((msg) => (
                <ChatBubble key={msg.id} message={msg} />
              ))}

              {isTyping && (
                <div className="flex justify-start mb-1">
                  <div className="px-3.5 py-2.5 flex items-center gap-1" style={{ borderRadius: "16px 16px 16px 4px", backgroundColor: "#fff", boxShadow: "rgba(0,0,0,0.06) 0px 0px 0px 1px, rgba(0,0,0,0.04) 0px 1px 2px" }}>
                    <span className="w-2 h-2 rounded-full bg-[#777169] animate-pulse" />
                    <span className="w-2 h-2 rounded-full bg-[#777169] animate-pulse [animation-delay:150ms]" />
                    <span className="w-2 h-2 rounded-full bg-[#777169] animate-pulse [animation-delay:300ms]" />
                  </div>
                </div>
              )}
            </>
          )}

          <div ref={bottomRef} />
        </div>
      </div>

      {/* Input + manual link */}
      <div className="max-w-[720px] mx-auto w-full">
        <ChatInput onSend={handleSend} disabled={isTyping} />
        <div className="flex justify-center pb-2">
          <Link
            href="/cs/manual"
            className="text-[12px] text-[#777169] underline underline-offset-2 cursor-pointer hover:text-[#4e4e4e] transition-colors"
          >
            사용법/매뉴얼 보기
          </Link>
        </div>
      </div>
    </div>
  );
}
