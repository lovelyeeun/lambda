import type { ChatMessage } from "@/lib/types";
import { Info } from "lucide-react";
import AgentIndicator from "./AgentIndicator";

interface ChatBubbleProps {
  message: ChatMessage;
}

function formatTime(ts: string) {
  const d = new Date(ts);
  return d.toLocaleTimeString("ko-KR", { hour: "2-digit", minute: "2-digit", hour12: false });
}

/** Render basic markdown-like formatting: **bold**, \n → <br> */
function renderContent(text: string) {
  const parts = text.split(/(\*\*[^*]+\*\*)/g);
  return parts.map((part, i) => {
    if (part.startsWith("**") && part.endsWith("**")) {
      return <strong key={i} className="font-medium">{part.slice(2, -2)}</strong>;
    }
    // Split by newlines
    const lines = part.split("\n");
    return lines.map((line, j) => (
      <span key={`${i}-${j}`}>
        {j > 0 && <br />}
        {line}
      </span>
    ));
  });
}

export default function ChatBubble({ message }: ChatBubbleProps) {
  const { role, content, timestamp, agent } = message;

  /* ── System message ── */
  if (role === "system") {
    return (
      <div className="flex justify-center py-2">
        <span
          className="inline-flex items-center gap-1.5 px-3 py-1 text-[12px] text-[#777169] rounded-full"
          style={{ backgroundColor: "rgba(0,0,0,0.03)", letterSpacing: "0.14px" }}
        >
          <Info size={12} strokeWidth={1.5} />
          {content}
        </span>
      </div>
    );
  }

  const isUser = role === "user";

  return (
    <div className={`flex ${isUser ? "justify-end" : "justify-start"} mb-1`}>
      <div className={`max-w-[520px] ${isUser ? "items-end" : "items-start"} flex flex-col gap-1`}>
        {/* Agent indicator (AI only) */}
        {!isUser && agent && (
          <AgentIndicator agent={agent} />
        )}

        {/* Bubble */}
        <div
          className="px-3.5 py-2.5 text-[14px] leading-[1.6]"
          style={{
            borderRadius: isUser ? "16px 16px 4px 16px" : "16px 16px 16px 4px",
            backgroundColor: isUser ? "#000" : "#fff",
            color: isUser ? "#fff" : "#000",
            letterSpacing: "0.14px",
            boxShadow: isUser
              ? undefined
              : "rgba(0,0,0,0.06) 0px 0px 0px 1px, rgba(0,0,0,0.04) 0px 1px 2px",
          }}
        >
          {renderContent(content)}
        </div>

        {/* Timestamp */}
        <span className="text-[11px] text-[#777169] px-1">
          {formatTime(timestamp)}
        </span>
      </div>
    </div>
  );
}
