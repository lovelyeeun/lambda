"use client";

import { useCallback, useEffect, useRef, useState } from "react";

interface ResizableHandleProps {
  /** 리사이즈 대상 패널의 현재 width (px) */
  panelWidth: number;
  /** width 변경 콜백 */
  onResize: (width: number) => void;
  /** 최소 width (기본 280) */
  minWidth?: number;
  /** 최대 width (기본 600) */
  maxWidth?: number;
  /** 드래그 방향: "left"면 오른쪽 패널을 왼쪽으로 넓히는 동작 (기본) */
  side?: "left" | "right";
}

/**
 * 세로 드래그 핸들 — 두 패널 사이에 배치하면 클릭-드래그로 폭 조절 가능
 * hover 시 파란 선이 나타나고, 드래그 중에는 진한 파란색으로 유지
 */
export default function ResizableHandle({
  panelWidth,
  onResize,
  minWidth = 280,
  maxWidth = 600,
  side = "left",
}: ResizableHandleProps) {
  const [dragging, setDragging] = useState(false);
  const startX = useRef(0);
  const startWidth = useRef(0);

  const onMouseDown = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault();
      setDragging(true);
      startX.current = e.clientX;
      startWidth.current = panelWidth;
    },
    [panelWidth],
  );

  useEffect(() => {
    if (!dragging) return;

    const onMouseMove = (e: MouseEvent) => {
      const delta = e.clientX - startX.current;
      // side === "left" → 오른쪽 패널을 리사이즈: 마우스를 왼쪽으로 가면 넓어짐
      const newWidth =
        side === "left"
          ? startWidth.current - delta
          : startWidth.current + delta;
      const clamped = Math.min(maxWidth, Math.max(minWidth, newWidth));
      onResize(clamped);
    };

    const onMouseUp = () => setDragging(false);

    document.addEventListener("mousemove", onMouseMove);
    document.addEventListener("mouseup", onMouseUp);
    // 드래그 중 텍스트 선택 방지
    document.body.style.userSelect = "none";
    document.body.style.cursor = "col-resize";

    return () => {
      document.removeEventListener("mousemove", onMouseMove);
      document.removeEventListener("mouseup", onMouseUp);
      document.body.style.userSelect = "";
      document.body.style.cursor = "";
    };
  }, [dragging, minWidth, maxWidth, onResize, side]);

  return (
    <div
      onMouseDown={onMouseDown}
      className="group relative shrink-0 flex items-center justify-center cursor-col-resize"
      style={{ width: "7px", zIndex: 5 }}
    >
      {/* 기본 가느다란 선 */}
      <div
        className="absolute inset-y-0 left-1/2 -translate-x-1/2 transition-all duration-150"
        style={{
          width: dragging ? "3px" : "1px",
          backgroundColor: dragging
            ? "rgba(59,130,246,0.5)"
            : "rgba(0,0,0,0.06)",
          borderRadius: "2px",
        }}
      />
      {/* hover 시 넓어지는 활성 영역 */}
      <div
        className="absolute inset-y-0 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity duration-150"
        style={{
          width: "3px",
          backgroundColor: dragging
            ? "rgba(59,130,246,0.5)"
            : "rgba(59,130,246,0.3)",
          borderRadius: "2px",
        }}
      />
    </div>
  );
}
