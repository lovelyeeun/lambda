"use client";

import { useState, useRef, useCallback } from "react";
import { ArrowUp } from "lucide-react";

interface ChatInputProps {
  onSend: (text: string) => void;
  disabled?: boolean;
  placeholder?: string;
}

export default function ChatInput({ onSend, disabled = false, placeholder }: ChatInputProps) {
  const [value, setValue] = useState("");
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const handleSend = useCallback(() => {
    const trimmed = value.trim();
    if (!trimmed || disabled) return;
    onSend(trimmed);
    setValue("");
    // Reset height
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
    }
  }, [value, disabled, onSend]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleInput = () => {
    const el = textareaRef.current;
    if (el) {
      el.style.height = "auto";
      el.style.height = Math.min(el.scrollHeight, 160) + "px";
    }
  };

  return (
    <div className="px-4 pb-4 pt-2">
      <div
        className="flex items-end gap-2 bg-white px-4 py-3"
        style={{
          borderRadius: "16px",
          boxShadow:
            "rgba(0,0,0,0.06) 0px 0px 0px 1px, rgba(0,0,0,0.04) 0px 1px 2px, rgba(0,0,0,0.04) 0px 2px 4px",
        }}
      >
        <textarea
          ref={textareaRef}
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={handleKeyDown}
          onInput={handleInput}
          placeholder={placeholder ?? "메시지를 입력하세요..."}
          disabled={disabled}
          rows={1}
          className="flex-1 resize-none text-[14px] outline-none bg-transparent placeholder:text-[#777169]"
          style={{
            letterSpacing: "0.14px",
            lineHeight: "1.5",
            maxHeight: "160px",
          }}
        />
        <button
          onClick={handleSend}
          disabled={!value.trim() || disabled}
          className="flex items-center justify-center w-8 h-8 rounded-full cursor-pointer transition-opacity shrink-0 disabled:opacity-30 disabled:cursor-not-allowed"
          style={{
            backgroundColor: value.trim() ? "#000" : "#e5e5e5",
          }}
          aria-label="전송"
        >
          <ArrowUp size={16} color="#fff" strokeWidth={2} />
        </button>
      </div>
      <p className="text-center text-[11px] text-[#777169] mt-2" style={{ letterSpacing: "0.14px" }}>
        AI 응답은 참고용이며, 중요한 결정은 직접 확인해주세요.
      </p>
    </div>
  );
}
