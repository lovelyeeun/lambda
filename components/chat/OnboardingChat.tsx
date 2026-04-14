"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import type { ChatMessage } from "@/lib/types";
import ChatBubble from "./ChatBubble";
import { Sparkles } from "lucide-react";
import { SERVICE_NAME } from "@/lib/constants";

/* ─── Onboarding steps ─── */

interface Step {
  question: string;
  options: string[];
  multi?: boolean;
}

const steps: Step[] = [
  { question: "어떤 업종이신가요?", options: ["IT", "제조", "서비스", "금융", "기타"] },
  { question: "주로 구매하시는 품목은? (복수 선택 가능)", options: ["사무용품", "IT장비", "가구", "소모품", "기타"], multi: true },
  { question: "월 평균 구매 금액은?", options: ["100만원 이하", "100~500만원", "500~1000만원", "1000만원 이상"] },
  { question: "직원 수는?", options: ["1~10명", "11~50명", "51~200명", "200명 이상"] },
];

export default function OnboardingChat() {
  const router = useRouter();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [stepIdx, setStepIdx] = useState(0);
  const [multiSelected, setMultiSelected] = useState<Set<string>>(new Set());
  const [done, setDone] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, stepIdx, done]);

  useEffect(() => {
    if (messages.length === 0) {
      setMessages([
        { id: "ob-welcome", role: "assistant", content: `${SERVICE_NAME}에 오신 것을 환영합니다! 몇 가지 질문을 통해 최적의 환경을 설정해드리겠습니다.`, timestamp: new Date().toISOString() },
        { id: "ob-q0", role: "assistant", content: steps[0].question, timestamp: new Date().toISOString() },
      ]);
    }
  }, [messages.length]);

  const addMsg = useCallback((msg: Omit<ChatMessage, "id" | "timestamp">) => {
    setMessages((prev) => [...prev, {
      ...msg,
      id: `ob-${Date.now()}-${Math.random().toString(36).slice(2, 5)}`,
      timestamp: new Date().toISOString(),
    }]);
  }, []);

  const advanceStep = useCallback(() => {
    const nextIdx = stepIdx + 1;
    if (nextIdx < steps.length) {
      setTimeout(() => {
        setStepIdx(nextIdx);
        addMsg({ role: "assistant", content: steps[nextIdx].question });
      }, 500);
    } else {
      setTimeout(() => {
        setDone(true);
        addMsg({
          role: "assistant",
          content: "설정이 완료되었습니다!\n\nAI가 회사에 맞는 구매 환경을 준비했습니다. 지금 바로 구매를 시작해보세요.",
        });
      }, 500);
    }
  }, [stepIdx, addMsg]);

  const handleSelect = useCallback((option: string) => {
    const step = steps[stepIdx];
    if (step.multi) {
      setMultiSelected((prev) => {
        const next = new Set(prev);
        next.has(option) ? next.delete(option) : next.add(option);
        return next;
      });
      return;
    }
    addMsg({ role: "user", content: option });
    advanceStep();
  }, [stepIdx, addMsg, advanceStep]);

  const confirmMulti = useCallback(() => {
    addMsg({ role: "user", content: Array.from(multiSelected).join(", ") });
    setMultiSelected(new Set());
    advanceStep();
  }, [multiSelected, addMsg, advanceStep]);

  const currentStep = stepIdx < steps.length ? steps[stepIdx] : null;

  return (
    <div className="flex flex-col h-full">
      {/* Banner */}
      <div
        className="flex items-center justify-center gap-2 px-4 py-2 shrink-0"
        style={{ backgroundColor: "rgba(245,242,239,0.6)", borderBottom: "1px solid rgba(0,0,0,0.04)" }}
      >
        <Sparkles size={14} strokeWidth={1.5} color="#777169" />
        <span className="text-[13px] text-[#777169]">시작 가이드 — 건너뛰려면</span>
        <button
          onClick={() => router.push("/chat")}
          className="text-[13px] text-[#444] font-medium underline underline-offset-2 cursor-pointer hover:text-[#000]"
        >
          여기를 클릭
        </button>
      </div>

      {/* Chat area — warm background */}
      <div
        className="flex-1 overflow-y-auto px-4 pt-4"
        style={{ backgroundColor: "rgba(245,242,239,0.35)" }}
      >
        <div className="max-w-[640px] mx-auto flex flex-col gap-1">
          {messages.map((msg) => (
            <ChatBubble key={msg.id} message={msg} />
          ))}

          {/* Selection chips */}
          {!done && currentStep && (
            <div className="flex justify-start mt-2 mb-1">
              <div className="flex flex-wrap gap-2 max-w-[480px]">
                {currentStep.options.map((opt) => {
                  const isSelected = currentStep.multi && multiSelected.has(opt);
                  return (
                    <button
                      key={opt}
                      onClick={() => handleSelect(opt)}
                      className="px-4 py-[7px] text-[13px] font-medium cursor-pointer transition-all"
                      style={{
                        borderRadius: "9999px",
                        backgroundColor: isSelected ? "#000" : "#fff",
                        color: isSelected ? "#fff" : "#444",
                        boxShadow: isSelected ? "none" : "rgba(0,0,0,0.06) 0px 0px 0px 1px, rgba(0,0,0,0.04) 0px 1px 2px",
                      }}
                    >
                      {opt}
                    </button>
                  );
                })}
                {currentStep.multi && multiSelected.size > 0 && (
                  <button
                    onClick={confirmMulti}
                    className="px-4 py-[7px] text-[13px] font-medium text-white bg-black cursor-pointer transition-opacity hover:opacity-80"
                    style={{ borderRadius: "9999px" }}
                  >
                    확인 ({multiSelected.size}개)
                  </button>
                )}
              </div>
            </div>
          )}

          {/* Done CTA */}
          {done && (
            <div className="flex justify-center mt-4 mb-8">
              <button
                onClick={() => router.push("/chat")}
                className="px-6 py-[10px] text-[14px] font-medium text-white bg-black cursor-pointer transition-opacity hover:opacity-80"
                style={{ borderRadius: "9999px", boxShadow: "rgba(0,0,0,0.15) 0px 4px 12px" }}
              >
                시작하기 →
              </button>
            </div>
          )}

          <div ref={bottomRef} />
        </div>
      </div>
    </div>
  );
}
