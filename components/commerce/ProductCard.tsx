"use client";

import { useState, useRef, useEffect } from "react";
import type { Product } from "@/lib/types";
import { FolderPlus, Pin, Truck, Check } from "lucide-react";
import { usePin } from "@/lib/pin-context";
import { folders } from "@/data/folders";

interface ProductCardProps {
  product: Product;
  onView?: (product: Product) => void;
  onAddToCart?: (product: Product) => void;
  /** 폴더 담기 완료 콜백 — (productId, folderIds) */
  onFolderAdd?: (productId: string, folderIds: string[]) => void;
  onPin?: (product: Product) => void;
  compact?: boolean;
  /** 구매주기 배지 (예: "월 2회") — 자주 구매 상품용 */
  cycleBadge?: string;
}

function formatPrice(n: number) {
  return n.toLocaleString("ko-KR") + "원";
}

export default function ProductCard({ product, onView, onAddToCart, onFolderAdd, onPin, compact = false, cycleBadge }: ProductCardProps) {
  const { isPinned } = usePin();
  const pinned = isPinned(product.id);

  // 인라인 폴더 드롭다운
  const [folderOpen, setFolderOpen] = useState(false);
  const [pickedIds, setPickedIds] = useState<string[]>([]);
  const folderRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!folderOpen) return;
    const handler = (e: MouseEvent) => {
      if (folderRef.current && !folderRef.current.contains(e.target as Node)) {
        setFolderOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [folderOpen]);

  const handleFolderConfirm = () => {
    if (pickedIds.length === 0) return;
    onFolderAdd?.(product.id, pickedIds);
    setFolderOpen(false);
    setPickedIds([]);
  };

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
      className="bg-white group relative"
      style={{
        borderRadius: "16px",
        boxShadow: pinned
          ? "rgba(0,0,0,0.12) 0px 0px 0px 1px, rgba(78,50,23,0.04) 0px 6px 16px"
          : "rgba(0,0,0,0.06) 0px 0px 0px 1px, rgba(0,0,0,0.04) 0px 1px 2px, rgba(0,0,0,0.04) 0px 2px 4px",
      }}
    >
      {/* Image area — click for detail, hover for folder action */}
      <div
        className="relative w-full h-[140px] flex items-center justify-center text-[12px] text-[#777169] overflow-hidden cursor-pointer group/img"
        style={{ borderRadius: "16px 16px 0 0", backgroundColor: pinned ? "#f5f2ef" : "#f5f5f5" }}
        onClick={() => onView?.(product)}
      >
        {product.brand} · {product.category}

        {/* Pin button (top-left) — always visible */}
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

        {/* 폴더에 담기 — hover overlay */}
        <button
          onClick={(e) => { e.stopPropagation(); setFolderOpen((v) => !v); setPickedIds([]); }}
          className={`absolute bottom-0 left-0 right-0 flex items-center justify-center gap-1.5 py-[8px] text-[12px] font-medium transition-opacity cursor-pointer ${folderOpen ? "opacity-0 pointer-events-none" : "opacity-0 group-hover/img:opacity-100"}`}
          style={{
            backgroundColor: "rgba(245,242,239,0.92)",
            backdropFilter: "blur(8px)",
            color: "#000",
            letterSpacing: "0.14px",
          }}
        >
          <FolderPlus size={13} strokeWidth={1.5} />
          폴더에 담기
        </button>
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

        {/* Delivery badge + cycle badge */}
        <div className="flex items-center gap-1 flex-wrap">
          <span className="flex items-center gap-1 px-2 py-[2px] text-[10px] font-medium text-[#3b82f6] bg-[#eff6ff] rounded" style={{ boxShadow: "rgba(59,130,246,0.12) 0px 0px 0px 1px" }}>
            <Truck size={10} strokeWidth={1.5} />무료배송
          </span>
          <span className="px-2 py-[2px] text-[10px] font-medium text-[#f59e0b] bg-[#fefce8] rounded" style={{ boxShadow: "rgba(245,158,11,0.12) 0px 0px 0px 1px" }}>
            로켓배송
          </span>
          {cycleBadge && (
            <span className="px-2 py-[2px] text-[10px] font-medium text-[#6366f1] bg-[#eef2ff] rounded" style={{ boxShadow: "rgba(99,102,241,0.12) 0px 0px 0px 1px" }}>
              {cycleBadge}
            </span>
          )}
        </div>
      </div>

      {/* 폴더 선택 드롭다운 — 이미지 영역 아래에 떠있음 */}
      {folderOpen && (
        <div
          ref={folderRef}
          className="absolute left-3 right-3 z-50 bg-white"
          style={{
            top: "148px",
            borderRadius: "12px",
            boxShadow: "rgba(0,0,0,0.06) 0px 0px 0px 1px, rgba(0,0,0,0.04) 0px 4px 4px, rgba(78,50,23,0.04) 0px 6px 16px",
          }}
        >
          <p className="px-3 pt-2.5 pb-1 text-[11px] text-[#777169]" style={{ letterSpacing: "0.14px" }}>
            폴더 선택
          </p>
          <div className="max-h-[140px] overflow-y-auto">
            {folders.map((f) => {
              const picked = pickedIds.includes(f.id);
              return (
                <button
                  key={f.id}
                  onClick={(e) => { e.stopPropagation(); setPickedIds((prev) => picked ? prev.filter((x) => x !== f.id) : [...prev, f.id]); }}
                  className="flex items-center gap-2 w-full text-left px-3 py-1.5 text-[12px] cursor-pointer transition-colors"
                  style={{
                    color: picked ? "#000" : "#444",
                    backgroundColor: picked ? "#f5f2ef" : "transparent",
                    fontWeight: picked ? 500 : 400,
                  }}
                  onMouseEnter={(e) => { if (!picked) e.currentTarget.style.backgroundColor = "#fafafa"; }}
                  onMouseLeave={(e) => { if (!picked) e.currentTarget.style.backgroundColor = "transparent"; }}
                >
                  <span
                    className="flex items-center justify-center w-3.5 h-3.5 rounded-[3px] shrink-0"
                    style={{
                      backgroundColor: picked ? "#000" : "transparent",
                      boxShadow: picked ? "none" : "rgba(0,0,0,0.15) 0px 0px 0px 1px inset",
                    }}
                  >
                    {picked && <Check size={9} strokeWidth={3} color="#fff" />}
                  </span>
                  {f.name}
                </button>
              );
            })}
          </div>
          <div className="flex items-center gap-1.5 px-2 pt-1.5 pb-2" style={{ borderTop: "1px solid rgba(0,0,0,0.05)" }}>
            <button
              onClick={(e) => { e.stopPropagation(); setFolderOpen(false); }}
              className="flex-1 px-2 py-1.5 text-[12px] text-[#777169] rounded-[6px] cursor-pointer hover:bg-[#fafafa]"
            >
              취소
            </button>
            <button
              onClick={(e) => { e.stopPropagation(); handleFolderConfirm(); }}
              disabled={pickedIds.length === 0}
              className="flex-1 px-2 py-1.5 text-[12px] font-medium rounded-[6px] cursor-pointer transition-opacity disabled:opacity-40 disabled:cursor-not-allowed"
              style={{
                backgroundColor: pickedIds.length > 0 ? "#000" : "#e5e5e5",
                color: pickedIds.length > 0 ? "#fff" : "#999",
              }}
            >
              담기{pickedIds.length > 0 ? ` (${pickedIds.length})` : ""}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
