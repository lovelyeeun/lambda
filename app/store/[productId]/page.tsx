"use client";

import { useParams, useRouter } from "next/navigation";
import { useState, useCallback } from "react";
import { ChevronLeft, FolderPlus, Check, X, Folder, Truck } from "lucide-react";
import { products } from "@/data/products";
import { folders } from "@/data/folders";

function formatPrice(n: number) {
  return n.toLocaleString("ko-KR") + "원";
}

export default function ProductDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [toast, setToast] = useState<string | null>(null);
  const [showFolderModal, setShowFolderModal] = useState(false);
  const [selectedFolderIds, setSelectedFolderIds] = useState<string[]>([]);

  const product = products.find((p) => p.id === params.productId);

  const showToast = useCallback((msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 2500);
  }, []);

  const toggleFolder = (folderId: string) => {
    setSelectedFolderIds((prev) =>
      prev.includes(folderId) ? prev.filter((id) => id !== folderId) : [...prev, folderId]
    );
  };

  const handleConfirmFolder = () => {
    if (selectedFolderIds.length === 0) return;
    const names = selectedFolderIds
      .map((id) => folders.find((f) => f.id === id)?.name)
      .filter(Boolean);
    if (names.length === 1) {
      showToast(`${names[0]} 폴더에 담기 완료`);
    } else {
      showToast(`${names.length}개 폴더(${names.join(", ")})에 담기 완료`);
    }
    setShowFolderModal(false);
    setSelectedFolderIds([]);
  };

  if (!product) {
    return (
      <div className="flex items-center justify-center h-full">
        <p className="text-[14px] text-[#777]">상품을 찾을 수 없습니다</p>
      </div>
    );
  }

  return (
    <div className="h-full overflow-y-auto relative">
      {/* Toast */}
      {toast && (
        <div
          className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2 px-4 py-2.5 bg-[#1a1a1a] text-white text-[13px] font-medium"
          style={{ borderRadius: "10px", boxShadow: "rgba(0,0,0,0.2) 0px 4px 12px" }}
        >
          <Check size={14} strokeWidth={2} />
          {toast}
        </div>
      )}

      <div className="max-w-[720px] mx-auto px-6 py-8">
        {/* Back — 이전 경로로 돌아가기 */}
        <button
          onClick={() => router.back()}
          className="flex items-center gap-1 text-[13px] text-[#777] cursor-pointer hover:text-[#444] transition-colors mb-6"
        >
          <ChevronLeft size={16} strokeWidth={1.5} />
          뒤로가기
        </button>

        <div className="flex gap-8">
          {/* Image */}
          <div
            className="w-[320px] h-[320px] shrink-0 bg-[#f5f5f5] flex items-center justify-center text-[14px] text-[#999]"
            style={{ borderRadius: "16px" }}
          >
            {product.brand} · {product.category}
          </div>

          {/* Info */}
          <div className="flex-1 min-w-0">
            <p className="text-[12px] text-[#999] mb-1">{product.brand}</p>
            <h1 className="text-[20px] font-semibold mb-2" style={{ letterSpacing: "-0.2px" }}>
              {product.name}
            </h1>
            <p className="text-[24px] font-semibold mb-4">{formatPrice(product.price)}</p>

            <p className="text-[14px] text-[#4e4e4e] leading-[1.7] mb-4" style={{ letterSpacing: "0.14px" }}>
              {product.description}
            </p>

            {/* Delivery badges */}
            <div className="flex items-center gap-1.5 mb-6">
              <span className="flex items-center gap-1 px-2 py-[3px] text-[11px] font-medium text-[#3b82f6] bg-[#eff6ff] rounded" style={{ boxShadow: "rgba(59,130,246,0.12) 0px 0px 0px 1px" }}>
                <Truck size={11} strokeWidth={1.5} />무료배송
              </span>
              <span className="px-2 py-[3px] text-[11px] font-medium text-[#f59e0b] bg-[#fefce8] rounded" style={{ boxShadow: "rgba(245,158,11,0.12) 0px 0px 0px 1px" }}>
                로켓배송
              </span>
            </div>

            {/* Folder button only */}
            <button
              onClick={() => { setShowFolderModal(true); setSelectedFolderIds([]); }}
              className="flex items-center justify-center gap-2 w-full py-[10px] text-[14px] font-medium text-white bg-black rounded-xl cursor-pointer transition-opacity hover:opacity-80"
            >
              <FolderPlus size={16} strokeWidth={1.5} />
              폴더에 담기
            </button>
          </div>
        </div>

        {/* Specs table */}
        <div className="mt-8">
          <h2 className="text-[15px] font-semibold mb-3">상세 스펙</h2>
          <div
            className="overflow-hidden"
            style={{ borderRadius: "12px", boxShadow: "rgba(0,0,0,0.06) 0px 0px 0px 1px" }}
          >
            {Object.entries(product.specs).map(([key, value], i) => (
              <div
                key={key}
                className="flex px-4 py-3 text-[14px]"
                style={{
                  backgroundColor: i % 2 === 0 ? "#fff" : "#fafafa",
                  borderBottom: i < Object.entries(product.specs).length - 1 ? "1px solid rgba(0,0,0,0.04)" : undefined,
                }}
              >
                <span className="w-[120px] shrink-0 text-[#777]">{key}</span>
                <span>{value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── 폴더 선택 모달 ── */}
      {showFolderModal && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center">
          <div className="absolute inset-0 cursor-pointer" style={{ backgroundColor: "rgba(0,0,0,0.35)", backdropFilter: "blur(4px)" }} onClick={() => setShowFolderModal(false)} />
          <div className="relative w-[340px] bg-white" style={{ borderRadius: "18px", boxShadow: "rgba(0,0,0,0.08) 0px 0px 0px 1px, rgba(0,0,0,0.15) 0px 16px 48px" }}>
            {/* Header */}
            <div className="flex items-center justify-between px-5 pt-5 pb-1">
              <h3 className="text-[16px] font-semibold text-[#111]">폴더에 담기</h3>
              <button onClick={() => setShowFolderModal(false)} className="flex items-center justify-center w-7 h-7 rounded-full cursor-pointer hover:bg-[#f0f0f0]">
                <X size={15} strokeWidth={1.5} color="#888" />
              </button>
            </div>
            <p className="px-5 pb-3 text-[12px] text-[#777169]" style={{ letterSpacing: "0.14px" }}>
              여러 폴더를 동시에 선택할 수 있어요
            </p>

            {/* Product summary */}
            <div className="mx-5 mb-3 p-3 flex items-center gap-3" style={{ borderRadius: "10px", backgroundColor: "#fafafa" }}>
              <div className="w-10 h-10 bg-[#f0f0f0] rounded-lg flex items-center justify-center text-[9px] text-[#999] shrink-0">{product.brand}</div>
              <div className="flex-1 min-w-0">
                <p className="text-[12px] font-medium text-[#333] truncate">{product.name}</p>
                <p className="text-[12px] text-[#777]">{formatPrice(product.price)}</p>
              </div>
            </div>

            {/* Folder list — warm tone, multi-select */}
            <div className="px-5 pb-2 max-h-[240px] overflow-y-auto">
              <div className="flex flex-col gap-1">
                {folders.map((folder) => {
                  const isSelected = selectedFolderIds.includes(folder.id);
                  return (
                    <button
                      key={folder.id}
                      onClick={() => toggleFolder(folder.id)}
                      className="flex items-center gap-3 w-full px-3 py-2.5 rounded-lg text-left cursor-pointer transition-colors"
                      style={{
                        backgroundColor: isSelected ? "#f5f2ef" : "transparent",
                        boxShadow: isSelected
                          ? "rgba(0,0,0,0.12) 0px 0px 0px 1px inset"
                          : "none",
                      }}
                      onMouseEnter={(e) => {
                        if (!isSelected) e.currentTarget.style.backgroundColor = "#fafafa";
                      }}
                      onMouseLeave={(e) => {
                        if (!isSelected) e.currentTarget.style.backgroundColor = "transparent";
                      }}
                    >
                      {/* Checkbox */}
                      <span
                        className="flex items-center justify-center w-[18px] h-[18px] rounded-[5px] shrink-0"
                        style={{
                          backgroundColor: isSelected ? "#000" : "transparent",
                          boxShadow: isSelected ? "none" : "rgba(0,0,0,0.15) 0px 0px 0px 1px inset",
                        }}
                      >
                        {isSelected && <Check size={11} strokeWidth={3} color="#fff" />}
                      </span>

                      <div
                        className="flex items-center justify-center w-8 h-8 rounded-lg shrink-0"
                        style={{ backgroundColor: isSelected ? "#ebe6e1" : "#f5f5f5" }}
                      >
                        <Folder size={14} strokeWidth={1.5} color={isSelected ? "#000" : "#999"} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-[13px] font-medium" style={{ color: isSelected ? "#000" : "#333" }}>{folder.name}</p>
                        <p className="text-[11px] text-[#999]">{folder.description}</p>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Confirm */}
            <div className="px-5 pb-5 pt-3">
              <button
                onClick={handleConfirmFolder}
                disabled={selectedFolderIds.length === 0}
                className="w-full py-2.5 text-[14px] font-medium text-white rounded-xl cursor-pointer transition-opacity hover:opacity-80 disabled:cursor-not-allowed"
                style={{ backgroundColor: selectedFolderIds.length > 0 ? "#111" : "#ccc" }}
              >
                {selectedFolderIds.length > 0 ? `${selectedFolderIds.length}개 폴더에 담기` : "폴더 선택"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
