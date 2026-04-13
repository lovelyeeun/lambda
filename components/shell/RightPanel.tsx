"use client";

import { useState } from "react";
import { useRightPanel } from "@/lib/right-panel-context";
import ResizableHandle from "@/components/ui/ResizableHandle";

export default function RightPanel() {
  const { open, content, meta, workItemStrip, closePanel } = useRightPanel();
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
            {/* Work Item 칩 스위처 — 2개 이상일 때만 노출 (모드와 무관하게 최상단 고정) */}
            {workItemStrip && workItemStrip.items.length >= 2 && (
              <div
                className="flex items-center gap-1.5 px-3 py-2 shrink-0 overflow-x-auto"
                style={{ borderBottom: "1px solid rgba(0,0,0,0.04)" }}
              >
                {workItemStrip.items.map((wi) => {
                  const active = wi.id === workItemStrip.activeId;
                  return (
                    <button
                      key={wi.id}
                      onClick={() => workItemStrip.onSwitch(wi.id)}
                      className="inline-flex items-center gap-1.5 px-2.5 py-[5px] cursor-pointer transition-all shrink-0"
                      style={{
                        borderRadius: "9999px",
                        backgroundColor: active ? "#fff" : "rgba(245,242,239,0.4)",
                        boxShadow: active
                          ? `${wi.color}33 0px 0px 0px 1.5px, rgba(78,50,23,0.04) 0px 4px 10px`
                          : "rgba(0,0,0,0.06) 0px 0px 0px 1px",
                        letterSpacing: "0.14px",
                      }}
                    >
                      <span
                        className="w-1.5 h-1.5 shrink-0"
                        style={{ borderRadius: "9999px", backgroundColor: wi.color }}
                      />
                      <span
                        className="text-[12px]"
                        style={{
                          color: active ? "#000" : "#4e4e4e",
                          fontWeight: active ? 600 : 500,
                        }}
                      >
                        {wi.title}
                      </span>
                      {wi.statusLabel && (
                        <span
                          className="text-[10px] font-medium px-1.5 py-[1px]"
                          style={{
                            borderRadius: "4px",
                            backgroundColor: `${wi.color}14`,
                            color: wi.color,
                          }}
                        >
                          {wi.statusLabel}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            )}

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
            <div className="flex-1 overflow-y-auto px-4 pb-4 pt-3" style={{ scrollbarGutter: "stable" }}>
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
