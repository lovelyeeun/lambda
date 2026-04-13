"use client";

import TopBar from "./TopBar";

export default function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex flex-col h-screen bg-[#f5f5f5]">
      {/* Top bar with tabs */}
      <TopBar />

      {/* Main area: sidebar + content + right panel (via children) */}
      <div className="flex flex-1 min-h-0">
        {children}
      </div>
    </div>
  );
}
