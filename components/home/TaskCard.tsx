"use client";

import Link from "next/link";
import type { LucideIcon } from "lucide-react";

interface TaskCardProps {
  href: string;
  icon: LucideIcon;
  title: string;
  meta: string;
  variant?: "default" | "highlight";
  iconColor?: string;
}

export default function TaskCard({
  href,
  icon: Icon,
  title,
  meta,
  variant = "default",
  iconColor,
}: TaskCardProps) {
  const isHighlight = variant === "highlight";

  return (
    <Link
      href={href}
      className="flex items-start gap-3 px-4 py-3 rounded-[12px] cursor-pointer transition-all group"
      style={{
        border: isHighlight ? "1px solid rgba(99,102,241,0.2)" : "1px solid #e5e5e5",
        backgroundColor: isHighlight ? "rgba(99,102,241,0.04)" : "#fff",
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.backgroundColor = isHighlight
          ? "rgba(99,102,241,0.08)"
          : "#f8f8f8";
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.backgroundColor = isHighlight
          ? "rgba(99,102,241,0.04)"
          : "#fff";
      }}
    >
      <div
        className="flex items-center justify-center w-8 h-8 rounded-[8px] shrink-0 mt-[1px]"
        style={{
          backgroundColor: isHighlight ? "rgba(99,102,241,0.12)" : "#f5f5f5",
          color: iconColor ?? (isHighlight ? "#6366f1" : "#555"),
        }}
      >
        <Icon size={16} strokeWidth={1.75} />
      </div>
      <div className="flex-1 min-w-0">
        <p
          className="text-[14px] font-medium text-[#1a1a1a] truncate"
          style={{ letterSpacing: "0.14px", lineHeight: "1.4" }}
        >
          {title}
        </p>
        <p
          className="text-[12px] text-[#777169] mt-0.5 truncate"
          style={{ letterSpacing: "0.12px" }}
        >
          {meta}
        </p>
      </div>
    </Link>
  );
}
