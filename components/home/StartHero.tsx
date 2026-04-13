"use client";

import { useState, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import { ArrowUp, Building2, Cpu, ChevronDown } from "lucide-react";
import { HOME_CONTEXTS, HOME_MODELS } from "@/data/home-tasks";

export default function StartHero() {
  const router = useRouter();
  const [value, setValue] = useState("");
  const [contextId, setContextId] = useState(HOME_CONTEXTS[0].id);
  const [modelId, setModelId] = useState(HOME_MODELS[0].id);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const handleSend = useCallback(() => {
    const trimmed = value.trim();
    if (!trimmed) return;
    router.push(`/chat?q=${encodeURIComponent(trimmed)}`);
  }, [value, router]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if ((e.nativeEvent as KeyboardEvent).isComposing || e.keyCode === 229) return;
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleInput = () => {
    const el = textareaRef.current;
    if (el) {
      el.style.height = "auto";
      el.style.height = Math.min(el.scrollHeight, 200) + "px";
    }
  };

  return (
    <div className="flex flex-col items-center text-center">
      {/* 인사말 */}
      <h1
        className="text-[28px] font-medium text-[#1a1a1a]"
        style={{ letterSpacing: "-0.2px", lineHeight: "1.3" }}
      >
        오늘 구매 업무, 어디서부터 시작할까요?
      </h1>
      <p
        className="text-[14px] text-[#777169] mt-2"
        style={{ letterSpacing: "0.14px" }}
      >
        cockpit은 구매담당자를 위한 AI 에이전트입니다
      </p>

      {/* 입력 폼 */}
      <div
        className="w-full mt-8 bg-white"
        style={{
          borderRadius: "16px",
          boxShadow:
            "rgba(0,0,0,0.06) 0px 0px 0px 1px, rgba(0,0,0,0.04) 0px 1px 2px, rgba(0,0,0,0.04) 0px 2px 8px",
        }}
      >
        <div className="px-4 pt-3.5 pb-2">
          <textarea
            ref={textareaRef}
            value={value}
            onChange={(e) => setValue(e.target.value)}
            onKeyDown={handleKeyDown}
            onInput={handleInput}
            placeholder="예) 마케팅팀 노트북 3대 견적 받아줘"
            rows={1}
            className="w-full resize-none text-[15px] outline-none bg-transparent placeholder:text-[#a8a29e] text-left"
            style={{
              letterSpacing: "0.14px",
              lineHeight: "1.5",
              maxHeight: "200px",
            }}
          />
        </div>
        <div className="flex items-center justify-between px-3 pb-3 pt-1">
          <div className="flex items-center gap-1.5">
            {/* Context 드롭다운 */}
            <div className="relative">
              <select
                value={contextId}
                onChange={(e) => setContextId(e.target.value)}
                className="appearance-none cursor-pointer pl-7 pr-7 py-1.5 text-[12px] font-medium rounded-[8px] bg-[#f5f5f5] hover:bg-[#ececec] transition-colors text-[#333] outline-none"
                style={{ letterSpacing: "0.12px" }}
              >
                {HOME_CONTEXTS.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.label}
                  </option>
                ))}
              </select>
              <Building2
                size={12}
                strokeWidth={1.75}
                className="absolute left-2 top-1/2 -translate-y-1/2 pointer-events-none text-[#777169]"
              />
              <ChevronDown
                size={12}
                strokeWidth={1.75}
                className="absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none text-[#777169]"
              />
            </div>

            {/* Model 드롭다운 */}
            <div className="relative">
              <select
                value={modelId}
                onChange={(e) => setModelId(e.target.value)}
                className="appearance-none cursor-pointer pl-7 pr-7 py-1.5 text-[12px] font-medium rounded-[8px] bg-[#f5f5f5] hover:bg-[#ececec] transition-colors text-[#333] outline-none"
                style={{ letterSpacing: "0.12px" }}
              >
                {HOME_MODELS.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.label}
                  </option>
                ))}
              </select>
              <Cpu
                size={12}
                strokeWidth={1.75}
                className="absolute left-2 top-1/2 -translate-y-1/2 pointer-events-none text-[#777169]"
              />
              <ChevronDown
                size={12}
                strokeWidth={1.75}
                className="absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none text-[#777169]"
              />
            </div>
          </div>

          <button
            onClick={handleSend}
            disabled={!value.trim()}
            className="flex items-center justify-center w-8 h-8 rounded-full cursor-pointer transition-opacity disabled:opacity-30 disabled:cursor-not-allowed"
            style={{ backgroundColor: value.trim() ? "#000" : "#e5e5e5" }}
            aria-label="시작하기"
          >
            <ArrowUp size={16} color="#fff" strokeWidth={2} />
          </button>
        </div>
      </div>
    </div>
  );
}
