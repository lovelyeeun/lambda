"use client";

import { useSearchParams } from "next/navigation";
import { Suspense } from "react";
import ChatContainer from "@/components/chat/ChatContainer";
import OnboardingChat from "@/components/chat/OnboardingChat";

function ChatContent() {
  const searchParams = useSearchParams();
  const chatType = searchParams.get("type");
  const chatId = searchParams.get("id");
  const initialQuery = searchParams.get("q");

  if (chatType === "onboarding") {
    return <OnboardingChat />;
  }

  return <ChatContainer initialChatId={chatId} initialQuery={initialQuery} />;
}

export default function ChatPage() {
  return (
    <Suspense>
      <ChatContent />
    </Suspense>
  );
}
