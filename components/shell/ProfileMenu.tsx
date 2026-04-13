"use client";

import { useState, useRef, useEffect } from "react";
import { Bell, Settings, LogOut } from "lucide-react";
import { useSettings } from "@/lib/settings-context";

interface ProfileMenuProps {
  collapsed: boolean;
}

export default function ProfileMenu({ collapsed }: ProfileMenuProps) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const { openSettings } = useSettings();

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    if (open) {
      document.addEventListener("mousedown", handleClickOutside);
      return () => document.removeEventListener("mousedown", handleClickOutside);
    }
  }, [open]);

  return (
    <div ref={ref} className="relative">
      {/* ── Trigger ── */}
      {collapsed ? (
        <button
          onClick={() => setOpen(!open)}
          className="group relative flex items-center justify-center w-10 h-10 rounded-lg cursor-pointer transition-colors hover:bg-[#f5f5f5]"
          aria-label="프로필 메뉴"
        >
          <div className="flex items-center justify-center w-7 h-7 rounded-full bg-black text-white text-[11px] font-medium">
            EP
          </div>
          <span className="absolute left-full ml-2 px-2.5 py-1 text-[11px] font-medium text-white bg-[#333] rounded-md whitespace-nowrap opacity-0 pointer-events-none group-hover:opacity-100 transition-opacity z-50">
            박은서
          </span>
        </button>
      ) : (
        <button
          onClick={() => setOpen(!open)}
          className="flex items-center gap-2.5 w-full px-2.5 py-[7px] rounded-lg cursor-pointer transition-colors hover:bg-[#f5f5f5]"
        >
          <div className="flex items-center justify-center w-7 h-7 rounded-full bg-black text-white text-[11px] font-medium shrink-0">
            EP
          </div>
          <div className="flex flex-col items-start min-w-0 flex-1">
            <span className="text-[13px] font-medium text-[#000] leading-tight truncate w-full text-left">
              박은서
            </span>
            <span className="text-[11px] text-[#777169] leading-tight truncate w-full text-left">
              Rawlabs
            </span>
          </div>
          <Bell size={15} color="#777169" strokeWidth={1.5} className="shrink-0" />
        </button>
      )}

      {/* ── Dropdown (opens upward) ── */}
      {open && (
        <div
          className="absolute bottom-full mb-2 w-[200px] bg-white py-1.5 z-50"
          style={{
            left: 0,
            borderRadius: "12px",
            boxShadow:
              "rgba(0,0,0,0.06) 0px 0px 0px 1px, rgba(0,0,0,0.04) 0px 1px 2px, rgba(0,0,0,0.04) 0px 2px 4px, rgba(0,0,0,0.04) 0px 4px 8px",
          }}
        >
          <div className="px-3 py-2 border-b border-[#e5e5e5]">
            <p className="text-[14px] font-medium">박은서</p>
            <p className="text-[12px] text-[#777169]">eunseo@rawlabs.kr</p>
          </div>
          <div className="py-1">
            <button
              onClick={() => {
                setOpen(false);
                openSettings("personal-general");
              }}
              className="flex items-center gap-2.5 w-full px-3 py-1.5 text-[14px] text-[#4e4e4e] hover:bg-[#f5f5f5] cursor-pointer transition-colors"
            >
              <Settings size={14} strokeWidth={1.5} />
              설정
            </button>
            <button
              className="flex items-center gap-2.5 w-full text-left px-3 py-1.5 text-[14px] text-[#4e4e4e] hover:bg-[#f5f5f5] cursor-pointer transition-colors"
              onClick={() => setOpen(false)}
            >
              <LogOut size={14} strokeWidth={1.5} />
              로그아웃
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
