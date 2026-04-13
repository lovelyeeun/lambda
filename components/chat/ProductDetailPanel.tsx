"use client";

import { useState } from "react";
import type { Product } from "@/lib/types";
import { FolderPlus, Check, X, Folder, Truck } from "lucide-react";
import { folders } from "@/data/folders";

interface ProductDetailPanelProps {
  product: Product;
  onAddToCart: () => void;
}

function formatPrice(n: number) {
  return n.toLocaleString("ko-KR") + "원";
}

export default function ProductDetailPanel({ product, onAddToCart }: ProductDetailPanelProps) {
  const [showFolderModal, setShowFolderModal] = useState(false);
  const [selectedFolderId, setSelectedFolderId] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  const handleConfirmFolder = () => {
    if (!selectedFolderId) return;
    const folder = folders.find((f) => f.id === selectedFolderId);
    if (folder) {
      setToast(`${folder.name} 폴더에 상품담기 완료`);
      setTimeout(() => setToast(null), 2500);
    }
    setShowFolderModal(false);
    setSelectedFolderId(null);
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

      {/* Add to folder button */}
      <button
        onClick={() => { setShowFolderModal(true); setSelectedFolderId(null); }}
        className="flex items-center justify-center gap-2 w-full py-[11px] text-[14px] font-medium text-white bg-black rounded-xl cursor-pointer transition-opacity hover:opacity-80"
      >
        <FolderPlus size={16} strokeWidth={1.5} />
        폴더에 담기
      </button>

      {/* ── 폴더 선택 모달 ── */}
      {showFolderModal && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center">
          <div className="absolute inset-0 cursor-pointer" style={{ backgroundColor: "rgba(0,0,0,0.35)", backdropFilter: "blur(4px)" }} onClick={() => setShowFolderModal(false)} />
          <div className="relative w-[340px] bg-white" style={{ borderRadius: "18px", boxShadow: "rgba(0,0,0,0.08) 0px 0px 0px 1px, rgba(0,0,0,0.15) 0px 16px 48px" }}>
            {/* Header */}
            <div className="flex items-center justify-between px-5 pt-5 pb-3">
              <h3 className="text-[16px] font-semibold text-[#111]">폴더에 담기</h3>
              <button onClick={() => setShowFolderModal(false)} className="flex items-center justify-center w-7 h-7 rounded-full cursor-pointer hover:bg-[#f0f0f0]">
                <X size={15} strokeWidth={1.5} color="#888" />
              </button>
            </div>

            {/* Product summary */}
            <div className="mx-5 mb-3 p-3 flex items-center gap-3" style={{ borderRadius: "10px", backgroundColor: "#fafafa" }}>
              <div className="w-10 h-10 bg-[#f0f0f0] rounded-lg flex items-center justify-center text-[9px] text-[#999] shrink-0">{product.brand}</div>
              <div className="flex-1 min-w-0">
                <p className="text-[12px] font-medium text-[#333] truncate">{product.name}</p>
                <p className="text-[12px] text-[#777]">{formatPrice(product.price)}</p>
              </div>
            </div>

            {/* Folder list */}
            <div className="px-5 pb-2 max-h-[240px] overflow-y-auto">
              <div className="flex flex-col gap-1">
                {folders.map((folder) => {
                  const isSelected = selectedFolderId === folder.id;
                  return (
                    <button
                      key={folder.id}
                      onClick={() => setSelectedFolderId(folder.id)}
                      className="flex items-center gap-3 w-full px-3 py-2.5 rounded-lg text-left cursor-pointer transition-colors hover:bg-[#f5f5f5]"
                      style={{
                        backgroundColor: isSelected ? "#f0f7ff" : "transparent",
                        boxShadow: isSelected ? "inset 0 0 0 1.5px #4285f4" : "none",
                      }}
                    >
                      <div className="flex items-center justify-center w-8 h-8 rounded-lg shrink-0" style={{ backgroundColor: isSelected ? "#e8f0fe" : "#f5f5f5" }}>
                        <Folder size={14} strokeWidth={1.5} color={isSelected ? "#4285f4" : "#999"} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-[13px] font-medium" style={{ color: isSelected ? "#1a73e8" : "#333" }}>{folder.name}</p>
                        <p className="text-[11px] text-[#999]">{folder.description}</p>
                      </div>
                      {isSelected && <Check size={16} strokeWidth={2} color="#4285f4" />}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Confirm */}
            <div className="px-5 pb-5 pt-3">
              <button
                onClick={handleConfirmFolder}
                disabled={!selectedFolderId}
                className="w-full py-2.5 text-[14px] font-medium text-white rounded-xl cursor-pointer transition-opacity hover:opacity-80"
                style={{ backgroundColor: selectedFolderId ? "#111" : "#ccc" }}
              >
                확인
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Toast */}
      {toast && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[70] flex items-center gap-2 px-4 py-2.5 bg-[#1a1a1a] text-white text-[13px] font-medium" style={{ borderRadius: "10px" }}>
          <Check size={14} strokeWidth={2} />{toast}
        </div>
      )}
    </div>
  );
}
