"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { PanelLeft, PanelRight, ChevronLeft, ChevronRight } from "lucide-react";
import { useSidebar } from "@/lib/sidebar-context";
import { useRightPanel } from "@/lib/right-panel-context";

const tabs = [
  { label: "로랩스", href: "/chat", match: (p: string) => !p.startsWith("/store") && !p.startsWith("/onboarding") },
  { label: "스토어", href: "/store", match: (p: string) => p.startsWith("/store") },
];

export default function TopBar() {
  const pathname = usePathname();
  const router = useRouter();
  const { toggle: toggleSidebar } = useSidebar();
  const { togglePanel: toggleRight } = useRightPanel();

  return (
    <header
      className="relative flex items-center h-[48px] px-2 bg-white shrink-0"
      style={{ borderBottom: "1px solid rgba(0,0,0,0.05)" }}
    >
      {/* ─── Left: sidebar toggle + back/forward ─── */}
      <div className="flex items-center gap-0.5">
        <button
          onClick={toggleSidebar}
          className="flex items-center justify-center w-8 h-8 rounded-lg cursor-pointer transition-colors hover:bg-[#f5f5f5]"
          aria-label="사이드바 토글"
        >
          <PanelLeft size={18} color="#4e4e4e" strokeWidth={1.5} />
        </button>

        <button
          onClick={() => router.back()}
          className="flex items-center justify-center w-8 h-8 rounded-lg cursor-pointer transition-colors hover:bg-[#f5f5f5]"
          aria-label="뒤로가기"
        >
          <ChevronLeft size={16} color="#4e4e4e" strokeWidth={1.5} />
        </button>

        <button
          onClick={() => router.forward()}
          className="flex items-center justify-center w-8 h-8 rounded-lg cursor-pointer transition-colors hover:bg-[#f5f5f5]"
          aria-label="앞으로가기"
        >
          <ChevronRight size={16} color="#4e4e4e" strokeWidth={1.5} />
        </button>
      </div>

      {/* ─── Center: mode tabs ─── */}
      <nav
        className="absolute flex items-center gap-1 rounded-full"
        style={{
          left: "50%",
          transform: "translateX(-50%)",
          backgroundColor: "#f5f5f5",
          padding: "3px",
        }}
      >
        {tabs.map((tab) => {
          const active = tab.match(pathname);
          return (
            <Link
              key={tab.href}
              href={tab.href}
              className="px-4 py-[5px] text-[13px] transition-all"
              style={{
                borderRadius: "9999px",
                letterSpacing: "0.14px",
                backgroundColor: active ? "#000" : "transparent",
                color: active ? "#fff" : "#777169",
                fontWeight: active ? 600 : 500,
              }}
            >
              {tab.label}
            </Link>
          );
        })}
      </nav>

      {/* ─── Right: right panel toggle ─── */}
      <div className="ml-auto flex items-center">
        <button
          onClick={toggleRight}
          className="flex items-center justify-center w-8 h-8 rounded-lg cursor-pointer transition-colors hover:bg-[#f5f5f5]"
          aria-label="우측 패널 토글"
        >
          <PanelRight size={18} color="#4e4e4e" strokeWidth={1.5} />
        </button>
      </div>
    </header>
  );
}
