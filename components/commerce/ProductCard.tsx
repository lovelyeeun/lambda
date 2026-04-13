"use client";

import type { Product } from "@/lib/types";
import { ShoppingCart, Pin, Truck } from "lucide-react";
import { usePin } from "@/lib/pin-context";

interface ProductCardProps {
  product: Product;
  onView?: (product: Product) => void;
  onAddToCart?: (product: Product) => void;
  onPin?: (product: Product) => void;
  compact?: boolean;
}

function formatPrice(n: number) {
  return n.toLocaleString("ko-KR") + "원";
}

export default function ProductCard({ product, onView, onAddToCart, onPin, compact = false }: ProductCardProps) {
  const { isPinned } = usePin();
  const pinned = isPinned(product.id);

  if (compact) {
    return (
      <div
        className="flex items-center gap-3 p-3 bg-white cursor-pointer transition-colors hover:bg-[#f9f9f9]"
        style={{
          borderRadius: "12px",
          boxShadow: "rgba(0,0,0,0.06) 0px 0px 0px 1px",
        }}
        onClick={() => onView?.(product)}
      >
        <div
          className="w-12 h-12 shrink-0 bg-[#f5f5f5] flex items-center justify-center text-[10px] text-[#777169]"
          style={{ borderRadius: "8px" }}
        >
          {product.category}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-[13px] font-medium truncate">{product.name}</p>
          <p className="text-[13px] text-[#4e4e4e]">{formatPrice(product.price)}</p>
        </div>
      </div>
    );
  }

  return (
    <div
      className="bg-white overflow-hidden group relative"
      style={{
        borderRadius: "16px",
        boxShadow: pinned
          ? "rgba(0,0,0,0.12) 0px 0px 0px 1px, rgba(78,50,23,0.04) 0px 6px 16px"
          : "rgba(0,0,0,0.06) 0px 0px 0px 1px, rgba(0,0,0,0.04) 0px 1px 2px, rgba(0,0,0,0.04) 0px 2px 4px",
      }}
    >
      {/* Image area — click for detail */}
      <div
        className="relative w-full h-[140px] flex items-center justify-center text-[12px] text-[#777169] overflow-hidden cursor-pointer"
        style={{ backgroundColor: pinned ? "#f5f2ef" : "#f5f5f5" }}
        onClick={() => onView?.(product)}
      >
        {product.brand} · {product.category}

        {/* Pin button (top-left) — always visible, filled when pinned */}
        <button
          onClick={(e) => { e.stopPropagation(); onPin?.(product); }}
          className="absolute top-2 left-2 flex items-center justify-center w-7 h-7 rounded-lg cursor-pointer transition-colors"
          style={{
            backgroundColor: pinned ? "#000" : "#fff",
            boxShadow: pinned
              ? "rgba(78,50,23,0.12) 0px 2px 6px"
              : "rgba(0,0,0,0.08) 0px 1px 4px",
          }}
          onMouseEnter={(e) => {
            if (!pinned) e.currentTarget.style.backgroundColor = "#f0f0f0";
          }}
          onMouseLeave={(e) => {
            if (!pinned) e.currentTarget.style.backgroundColor = "#fff";
          }}
          title={pinned ? "고정 해제" : "상품 고정"}
        >
          <Pin
            size={13}
            strokeWidth={pinned ? 2 : 1.5}
            color={pinned ? "#fff" : "#999"}
            fill={pinned ? "#fff" : "none"}
          />
        </button>

        {/* Pinned badge */}
        {pinned && (
          <div
            className="absolute top-2 right-2 flex items-center gap-1 px-2 py-[2px] text-[10px] font-medium text-white bg-black rounded-full"
            style={{ letterSpacing: "0.14px" }}
          >
            고정됨
          </div>
        )}
      </div>

      {/* Info area — click for detail */}
      <div className="p-3.5 cursor-pointer" onClick={() => onView?.(product)}>
        <p className="text-[11px] text-[#777169] mb-0.5" style={{ letterSpacing: "0.14px" }}>
          {product.brand}
        </p>
        <p className="text-[14px] font-medium leading-tight mb-1.5 line-clamp-2">
          {product.name}
        </p>
        <p className="text-[16px] font-semibold mb-2">
          {formatPrice(product.price)}
        </p>

        {/* Delivery badge */}
        <div className="flex items-center gap-1 mb-3">
          <span className="flex items-center gap-1 px-2 py-[2px] text-[10px] font-medium text-[#3b82f6] bg-[#eff6ff] rounded" style={{ boxShadow: "rgba(59,130,246,0.12) 0px 0px 0px 1px" }}>
            <Truck size={10} strokeWidth={1.5} />무료배송
          </span>
          <span className="px-2 py-[2px] text-[10px] font-medium text-[#f59e0b] bg-[#fefce8] rounded" style={{ boxShadow: "rgba(245,158,11,0.12) 0px 0px 0px 1px" }}>
            로켓배송
          </span>
        </div>
      </div>

      {/* Cart button — separate click zone */}
      <div className="px-3.5 pb-3.5">
        <button
          onClick={(e) => { e.stopPropagation(); onAddToCart?.(product); }}
          className="w-full flex items-center justify-center gap-1.5 py-[7px] text-[13px] font-medium text-white bg-black rounded-lg cursor-pointer transition-opacity hover:opacity-80"
        >
          <ShoppingCart size={14} strokeWidth={1.5} />
          담기
        </button>
      </div>
    </div>
  );
}
