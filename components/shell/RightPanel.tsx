"use client";

import { useState } from "react";
import { useRightPanel } from "@/lib/right-panel-context";
import ResizableHandle from "@/components/ui/ResizableHandle";

export default function RightPanel() {
  const { open, content, closePanel } = useRightPanel();
  const [width, setWidth] = useState(360);

  return (
    <>
      {/* 리사이즈 핸들 — 패널이 열려있을 때만 표시 */}
      {open && (
        <ResizableHandle
          panelWidth={width}
          onResize={setWidth}
          minWidth={280}
          maxWidth={560}
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
            {/* Header with close */}
            <div className="flex items-center justify-end px-3 h-[44px] shrink-0">
              <button
                onClick={closePanel}
                className="flex items-center justify-center w-7 h-7 rounded-lg cursor-pointer transition-colors hover:bg-[#f5f5f5]"
                aria-label="패널 닫기"
              >
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="#4e4e4e" strokeWidth="1.5" strokeLinecap="round">
                  <path d="M3 3l8 8M11 3l-8 8" />
                </svg>
              </button>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto px-4 pb-4">
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
