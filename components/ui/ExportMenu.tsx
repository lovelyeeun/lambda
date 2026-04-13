"use client";

import { useState, useRef, useEffect, useLayoutEffect } from "react";
import { createPortal } from "react-dom";

const exportOptions = [
  {
    label: "Excel",
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" />
        <polyline points="14 2 14 8 20 8" />
        <line x1="8" y1="13" x2="16" y2="13" />
        <line x1="8" y1="17" x2="16" y2="17" />
      </svg>
    ),
  },
  {
    label: "PDF",
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" />
        <polyline points="14 2 14 8 20 8" />
      </svg>
    ),
  },
  {
    label: "PNG",
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
        <circle cx="8.5" cy="8.5" r="1.5" />
        <polyline points="21 15 16 10 5 21" />
      </svg>
    ),
  },
  {
    label: "구글 드라이브",
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 2L2 19.5h7.5L12 14l2.5 5.5H22z" />
        <path d="M9.5 19.5h12" />
      </svg>
    ),
  },
];

interface ExportMenuProps {
  onExport?: (format: string) => void;
}

export default function ExportMenu({ onExport }: ExportMenuProps) {
  const [open, setOpen] = useState(false);
  const [coords, setCoords] = useState<{ top: number; left: number } | null>(null);
  const ref = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  // Compute fixed-position coords (open upward, right-aligned to trigger)
  useLayoutEffect(() => {
    if (!open || !triggerRef.current) return;
    const rect = triggerRef.current.getBoundingClientRect();
    const menuWidth = 180;
    const menuHeightEstimate = 4 + 36 * 4; // py-1 + 4 items
    setCoords({
      top: rect.top - menuHeightEstimate - 4,
      left: rect.right - menuWidth,
    });
  }, [open]);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      const target = e.target as Node;
      if (
        ref.current && !ref.current.contains(target) &&
        menuRef.current && !menuRef.current.contains(target)
      ) {
        setOpen(false);
      }
    }
    function handleReposition() {
      setOpen(false);
    }
    if (open) {
      document.addEventListener("mousedown", handleClickOutside);
      window.addEventListener("scroll", handleReposition, true);
      window.addEventListener("resize", handleReposition);
      return () => {
        document.removeEventListener("mousedown", handleClickOutside);
        window.removeEventListener("scroll", handleReposition, true);
        window.removeEventListener("resize", handleReposition);
      };
    }
  }, [open]);

  return (
    <div ref={ref} className="relative inline-flex">
      {/* Trigger */}
      <button
        ref={triggerRef}
        onClick={() => setOpen(!open)}
        className="inline-flex items-center gap-1.5 px-3 py-[6px] text-[13px] font-medium text-[#4e4e4e] bg-white cursor-pointer transition-colors hover:bg-[#f5f5f5]"
        style={{
          borderRadius: "8px",
          boxShadow: "rgba(0,0,0,0.06) 0px 0px 0px 1px",
          letterSpacing: "0.14px",
        }}
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" />
          <polyline points="7 10 12 15 17 10" />
          <line x1="12" y1="15" x2="12" y2="3" />
        </svg>
        내보내기
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M6 9l6 6 6-6" />
        </svg>
      </button>

      {/* Dropdown — portal to escape overflow clipping of right panel */}
      {open && coords && typeof document !== "undefined" && createPortal(
        <div
          ref={menuRef}
          className="fixed w-[180px] bg-white py-1 z-[1000]"
          style={{
            top: coords.top,
            left: coords.left,
            borderRadius: "10px",
            boxShadow:
              "rgba(0,0,0,0.06) 0px 0px 0px 1px, rgba(0,0,0,0.04) 0px 1px 2px, rgba(0,0,0,0.04) 0px 2px 4px, rgba(0,0,0,0.04) 0px 4px 8px",
          }}
        >
          {exportOptions.map((opt) => (
            <button
              key={opt.label}
              onClick={() => {
                onExport?.(opt.label);
                setOpen(false);
              }}
              className="flex items-center gap-2.5 w-full px-3 py-2 text-[13px] text-[#4e4e4e] cursor-pointer transition-colors hover:bg-[#f5f5f5]"
              style={{ letterSpacing: "0.14px" }}
            >
              <span className="opacity-60">{opt.icon}</span>
              {opt.label}
            </button>
          ))}
        </div>,
        document.body,
      )}
    </div>
  );
}
