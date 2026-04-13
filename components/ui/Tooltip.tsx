"use client";

import { type ReactNode } from "react";

interface TooltipProps {
  /** Text shown on hover. Prefix with "예정: " for unimplemented actions. */
  label: string;
  children: ReactNode;
  position?: "top" | "bottom" | "left" | "right";
}

const positionStyles: Record<string, string> = {
  top: "bottom-full left-1/2 -translate-x-1/2 mb-2",
  bottom: "top-full left-1/2 -translate-x-1/2 mt-2",
  left: "right-full top-1/2 -translate-y-1/2 mr-2",
  right: "left-full top-1/2 -translate-y-1/2 ml-2",
};

export default function Tooltip({ label, children, position = "top" }: TooltipProps) {
  return (
    <span className="group relative inline-flex">
      {children}
      <span
        className={`absolute ${positionStyles[position]} px-2 py-1 text-[12px] font-medium text-white bg-[#1a1a1a] rounded-md whitespace-nowrap opacity-0 pointer-events-none group-hover:opacity-100 transition-opacity z-50`}
      >
        {label}
      </span>
    </span>
  );
}

/**
 * Convenience wrapper for unimplemented features.
 * Usage: <PlannedTooltip description="검색 필터링">
 *          <button disabled>필터</button>
 *        </PlannedTooltip>
 */
export function PlannedTooltip({
  description,
  children,
  position = "top",
}: {
  description: string;
  children: ReactNode;
  position?: "top" | "bottom" | "left" | "right";
}) {
  return (
    <Tooltip label={`예정: ${description}`} position={position}>
      {children}
    </Tooltip>
  );
}
