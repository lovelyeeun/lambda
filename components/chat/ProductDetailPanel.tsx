"use client";

import { useState, useRef, useEffect } from "react";
import type { Product } from "@/lib/types";
import { FolderPlus, Check, Truck, ShoppingCart } from "lucide-react";
import { folders } from "@/data/folders";

interface ProductDetailPanelProps {
  product: Product;
  onAddToCart: () => void;
}

function formatPrice(n: number) {
  return n.toLocaleString("ko-KR") + "원";
}

export default function ProductDetailPanel({ product, onAddToCart }: ProductDetailPanelProps) {
  const [folderDropdownOpen, setFolderDropdownOpen] = useState(false);
  const [pickedFolderIds, setPickedFolderIds] = useState<string[]>([]);
  const [toast, setToast] = useState<string | null>(null);
  const folderWrapRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!folderDropdownOpen) return;
    const onDown = (e: MouseEvent) => {
      if (folderWrapRef.current && !folderWrapRef.current.contains(e.target as Node)) {
        setFolderDropdownOpen(false);
      }
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setFolderDropdownOpen(false);
    };
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [folderDropdownOpen]);

  const toggleFolderPick = (id: string) => {
    setPickedFolderIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
    );
  };

  const handleConfirmFolders = () => {
    if (pickedFolderIds.length === 0) return;
    const names = folders
      .filter((f) => pickedFolderIds.includes(f.id))
      .map((f) => f.name)
      .join(", ");
    setToast(`${names} 폴더에 담았어요`);
    setTimeout(() => setToast(null), 2500);
    setFolderDropdownOpen(false);
    setPickedFolderIds([]);
  };

  const handleAddToCartClick = () => {
    onAddToCart();
    setToast(`${product.name} 장바구니에 담았어요`);
    setTimeout(() => setToast(null), 2500);
  };

  return (
    <div className="flex flex-col gap-4 relative">
      {/* Image placeholder */}
      <div
        className="w-full h-[200px] bg-[#f5f5f5] flex items-center justify-center text-[14px] text-[#777169]"
        style={{ borderRadius: "12px" }}
      >
        {product.brand} · {product.category}
      </div>

      {/* Info */}
      <div>
        <p className="text-[12px] text-[#777169] mb-1" style={{ letterSpacing: "0.14px" }}>
          {product.brand}
        </p>
        <h3 className="text-[16px] font-semibold leading-tight">
          {product.name}
        </h3>
        <p className="text-[20px] font-semibold mt-2">
          {formatPrice(product.price)}
        </p>
      </div>

      {/* Delivery badges */}
      <div className="flex items-center gap-1.5">
        <span className="flex items-center gap-1 px-2 py-[3px] text-[11px] font-medium text-[#3b82f6] bg-[#eff6ff] rounded" style={{ boxShadow: "rgba(59,130,246,0.12) 0px 0px 0px 1px" }}>
          <Truck size={11} strokeWidth={1.5} />무료배송
        </span>
        <span className="px-2 py-[3px] text-[11px] font-medium text-[#f59e0b] bg-[#fefce8] rounded" style={{ boxShadow: "rgba(245,158,11,0.12) 0px 0px 0px 1px" }}>
          로켓배송
        </span>
      </div>

      {/* Description */}
      <p className="text-[14px] text-[#4e4e4e] leading-[1.6]" style={{ letterSpacing: "0.14px" }}>
        {product.description}
      </p>

      {/* Specs */}
      <div>
        <p className="text-[12px] font-medium text-[#777169] uppercase tracking-wider mb-2">
          상세 스펙
        </p>
        <div
          className="overflow-hidden"
          style={{
            borderRadius: "10px",
            boxShadow: "rgba(0,0,0,0.06) 0px 0px 0px 1px",
          }}
        >
          {Object.entries(product.specs).map(([key, value], i) => (
            <div
              key={key}
              className="flex px-3 py-2 text-[13px]"
              style={{
                backgroundColor: i % 2 === 0 ? "#fff" : "#fafafa",
                borderBottom: i < Object.entries(product.specs).length - 1 ? "1px solid rgba(0,0,0,0.05)" : undefined,
              }}
            >
              <span className="w-[90px] shrink-0 text-[#777169]">{key}</span>
              <span className="text-[#000]">{value}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Stock badge */}
      <div className="flex items-center gap-1.5">
        <Check size={14} color="#22c55e" strokeWidth={2} />
        <span className="text-[13px] text-[#22c55e] font-medium">재고 있음</span>
      </div>

      {/* Actions — 장바구니 담기 (primary) + 폴더에 담기 (secondary w/ dropdown) */}
      <div className="flex flex-col gap-2">
        <button
          onClick={handleAddToCartClick}
          className="flex items-center justify-center gap-2 w-full py-[11px] text-[14px] font-medium text-white bg-black rounded-xl cursor-pointer transition-opacity hover:opacity-80"
        >
          <ShoppingCart size={16} strokeWidth={1.5} />
          장바구니 담기
        </button>

        <div ref={folderWrapRef} className="relative">
          <button
            onClick={() => {
              setFolderDropdownOpen((v) => !v);
              setPickedFolderIds([]);
            }}
            className="flex items-center justify-center gap-2 w-full py-[11px] text-[14px] font-medium text-[#1a1a1a] bg-white rounded-xl cursor-pointer transition-colors hover:bg-[#f5f5f5]"
            style={{ boxShadow: "rgba(0,0,0,0.08) 0px 0px 0px 1px" }}
          >
            <FolderPlus size={16} strokeWidth={1.5} />
            폴더에 담기
          </button>

          {folderDropdownOpen && (
            <div
              className="absolute bottom-full mb-1.5 left-0 right-0 bg-white py-1.5 z-50"
              style={{
                borderRadius: "10px",
                boxShadow: "rgba(0,0,0,0.06) 0px 0px 0px 1px, rgba(0,0,0,0.04) 0px 2px 8px, rgba(0,0,0,0.04) 0px 8px 20px",
              }}
            >
              <p className="px-3 pt-1 pb-1.5 text-[11px] text-[#777169]" style={{ letterSpacing: "0.14px" }}>
                여러 폴더를 선택할 수 있어요
              </p>
              <div className="max-h-[200px] overflow-y-auto">
                {folders.map((f) => {
                  const picked = pickedFolderIds.includes(f.id);
                  return (
                    <button
                      key={f.id}
                      onClick={(e) => { e.stopPropagation(); toggleFolderPick(f.id); }}
                      className="flex items-center gap-2 w-full text-left px-3 py-1.5 text-[12px] cursor-pointer transition-colors"
                      style={{
                        color: picked ? "#000" : "#444",
                        backgroundColor: picked ? "#f5f2ef" : "transparent",
                        fontWeight: picked ? 500 : 400,
                      }}
                      onMouseEnter={(e) => {
                        if (!picked) e.currentTarget.style.backgroundColor = "#fafafa";
                      }}
                      onMouseLeave={(e) => {
                        if (!picked) e.currentTarget.style.backgroundColor = "transparent";
                      }}
                    >
                      <span
                        className="flex items-center justify-center w-4 h-4 rounded-[4px] shrink-0"
                        style={{
                          backgroundColor: picked ? "#000" : "transparent",
                          boxShadow: picked ? "none" : "rgba(0,0,0,0.15) 0px 0px 0px 1px inset",
                        }}
                      >
                        {picked && <Check size={10} strokeWidth={3} color="#fff" />}
                      </span>
                      {f.name}
                    </button>
                  );
                })}
              </div>
              <div className="flex items-center gap-1.5 px-2 pt-1.5 pb-1" style={{ borderTop: "1px solid rgba(0,0,0,0.05)" }}>
                <button
                  onClick={(e) => { e.stopPropagation(); setFolderDropdownOpen(false); }}
                  className="flex-1 px-2 py-1.5 text-[12px] text-[#777169] rounded-[6px] cursor-pointer hover:bg-[#fafafa]"
                >
                  취소
                </button>
                <button
                  onClick={(e) => { e.stopPropagation(); handleConfirmFolders(); }}
                  disabled={pickedFolderIds.length === 0}
                  className="flex-1 px-2 py-1.5 text-[12px] font-medium rounded-[6px] cursor-pointer transition-opacity disabled:opacity-40 disabled:cursor-not-allowed"
                  style={{
                    backgroundColor: pickedFolderIds.length > 0 ? "#000" : "#e5e5e5",
                    color: pickedFolderIds.length > 0 ? "#fff" : "#999",
                  }}
                >
                  담기{pickedFolderIds.length > 0 ? ` (${pickedFolderIds.length})` : ""}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Toast */}
      {toast && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[70] flex items-center gap-2 px-4 py-2.5 bg-[#1a1a1a] text-white text-[13px] font-medium" style={{ borderRadius: "10px" }}>
          <Check size={14} strokeWidth={2} />{toast}
        </div>
      )}
    </div>
  );
}
