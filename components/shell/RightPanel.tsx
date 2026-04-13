"use client";

import { useState } from "react";
import { useRightPanel } from "@/lib/right-panel-context";
import ResizableHandle from "@/components/ui/ResizableHandle";

export default function RightPanel() {
  const { open, content, meta, closePanel } = useRightPanel();
  const [width, setWidth] = useState(480);

  return (
    <>
      {/* 리사이즈 핸들 — 패널이 열려있을 때만 표시 */}
      {open && (
        <ResizableHandle
          panelWidth={width}
          onResize={setWidth}
          minWidth={320}
          maxWidth={680}
          side="left"
        />
      )}

      <aside
        className="shrink-0 bg-white h-full overflow-hidden"
        style={{
          width: open ? `${width}px` : "0px",
          minWidth: open ? `${width}px` : "0px",
          borderLeft: open ? "none" : "none",
          transition: open ? "none" : "width 200ms ease, min-width 200ms ease",
        }}
      >
        {open && (
          <div className="flex flex-col h-full" style={{ width: `${width}px` }}>
            {/* Header — 현재 모드 라벨 + 빠른 전환 chips + 닫기 */}
            <div
              className="flex items-center gap-2 px-3 h-[44px] shrink-0"
              style={{ borderBottom: meta?.label ? "1px solid rgba(0,0,0,0.04)" : "none" }}
            >
              {meta?.label && (
                <span
                  className="text-[13px] font-medium text-[#000]"
                  style={{ letterSpacing: "0.14px" }}
                >
                  {meta.label}
                </span>
              )}

              {meta?.chips && meta.chips.length > 0 && (
                <div className="flex items-center gap-1.5 ml-1">
                  {meta.chips.map((chip, i) => (
                    <button
                      key={i}
                      onClick={chip.onClick}
                      className="inline-flex items-center gap-1 px-2 py-[4px] text-[11px] font-medium text-[#4e4e4e] cursor-pointer transition-colors hover:bg-[#f5f2ef]"
                      style={{
                        borderRadius: "9999px",
                        backgroundColor: "rgba(245,242,239,0.5)",
                        boxShadow: "rgba(0,0,0,0.06) 0px 0px 0px 1px",
                        letterSpacing: "0.14px",
                      }}
                    >
                      {chip.icon}
                      {chip.label}
                    </button>
                  ))}
                </div>
              )}

              <button
                onClick={closePanel}
                className="ml-auto flex items-center justify-center w-7 h-7 rounded-lg cursor-pointer transition-colors hover:bg-[#f5f5f5]"
                aria-label="패널 닫기"
              >
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="#4e4e4e" strokeWidth="1.5" strokeLinecap="round">
                  <path d="M3 3l8 8M11 3l-8 8" />
                </svg>
              </button>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto px-4 pb-4 pt-3">
              {content ?? (
                <p className="text-[13px] text-[#777169]" style={{ letterSpacing: "0.14px" }}>
                  패널 내용이 여기에 표시됩니다
                </p>
              )}
            </div>
          </div>
        )}
      </aside>
    </>
  );
}
