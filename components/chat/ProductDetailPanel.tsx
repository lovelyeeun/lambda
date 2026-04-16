"use client";

import { useState, useRef, useEffect } from "react";
import type { Product, ProductOption } from "@/lib/types";
import {
  FolderPlus, Check, Truck, ShoppingCart, ChevronDown, Minus, Plus, X,
} from "lucide-react";
import { folders } from "@/data/folders";

interface SelectedChip {
  option: ProductOption;
  qty: number;
}

interface ProductDetailPanelProps {
  product: Product;
  onAddToCart: () => void;
  showCartButton?: boolean;
  onViewCart?: () => void;
}

function formatPrice(n: number) {
  return n.toLocaleString("ko-KR") + "원";
}

export default function ProductDetailPanel({
  product,
  onAddToCart,
  showCartButton = true,
}: ProductDetailPanelProps) {
  const hasOptions = product.options && product.options.length > 0;

  // 선택된 옵션 칩 목록
  const [chips, setChips] = useState<SelectedChip[]>([]);
  // 상세 스펙 펼침/접힘
  const [specOpen, setSpecOpen] = useState(false);
  // 폴더 드롭다운
  const [folderOpen, setFolderOpen] = useState(false);
  const [pickedFolderIds, setPickedFolderIds] = useState<string[]>([]);
  const [toast, setToast] = useState<string | null>(null);
  const folderRef = useRef<HTMLDivElement>(null);

  // 폴더 드롭다운 외부 클릭 닫기
  useEffect(() => {
    if (!folderOpen) return;
    const onDown = (e: MouseEvent) => {
      if (folderRef.current && !folderRef.current.contains(e.target as Node))
        setFolderOpen(false);
    };
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, [folderOpen]);

  // 옵션 선택 → 칩 추가 (중복이면 수량 +1)
  const handleSelectOption = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const idx = parseInt(e.target.value, 10);
    if (isNaN(idx)) return;
    const opt = product.options![idx];
    e.target.value = ""; // 드롭다운 리셋

    setChips((prev) => {
      const existing = prev.findIndex((c) => c.option.name === opt.name);
      if (existing >= 0) {
        return prev.map((c, i) =>
          i === existing ? { ...c, qty: c.qty + 1 } : c,
        );
      }
      return [...prev, { option: opt, qty: 1 }];
    });
  };

  // 수량 변경
  const changeQty = (name: string, delta: number) => {
    setChips((prev) =>
      prev
        .map((c) => c.option.name === name ? { ...c, qty: c.qty + delta } : c)
        .filter((c) => c.qty > 0),
    );
  };

  // 칩 제거
  const removeChip = (name: string) => {
    setChips((prev) => prev.filter((c) => c.option.name !== name));
  };

  // 최종 금액 합산
  const totalPrice = chips.reduce((sum, c) => sum + c.option.price * c.qty, 0);
  const hasSelection = chips.length > 0;

  // 가격 헤더 표시 (옵션 있는 상품: 선택 전엔 최저가~, 선택 후엔 선택된 첫 옵션 가격)
  const displayPrice = hasOptions
    ? hasSelection
      ? chips[0].option.price
      : Math.min(...(product.options ?? []).map((o) => o.price))
    : product.price;
  const priceLabel = hasOptions && !hasSelection ? `${formatPrice(displayPrice)}~` : formatPrice(displayPrice);

  // 폴더 관련
  const toggleFolder = (id: string) =>
    setPickedFolderIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
    );

  const confirmFolders = () => {
    if (pickedFolderIds.length === 0) return;
    const names = folders
      .filter((f) => pickedFolderIds.includes(f.id))
      .map((f) => f.name)
      .join(", ");
    setToast(`${names} 폴더에 담았어요`);
    setTimeout(() => setToast(null), 2500);
    setFolderOpen(false);
    setPickedFolderIds([]);
  };

  const hasTags = product.tags && product.tags.length > 0;

  return (
    <div className="flex flex-col relative">
      {/* ── 이미지 ── */}
      {/* DEBUG v2 */}
      <div
        className="w-full bg-[#f5f5f5] flex items-center justify-center text-[13px] text-[#aaa]"
        style={{ height: "192px", borderRadius: "12px", marginBottom: "16px" }}
      >
        {product.brand} · {product.category}
      </div>

      {/* ── 기본 정보 ── */}
      <div style={{ marginBottom: "12px" }}>
        <p className="text-[11px] font-medium text-[#999] uppercase" style={{ letterSpacing: "0.3px", marginBottom: "4px" }}>
          {product.brand}
        </p>
        <h3 className="text-[15px] font-semibold text-[#111] leading-snug" style={{ marginBottom: "10px" }}>
          {product.name}
        </h3>

        {/* 가격 */}
        <div className="flex items-baseline gap-2" style={{ marginBottom: hasOptions && !hasSelection ? "4px" : "0" }}>
          <span className="text-[22px] font-semibold text-[#111]">{priceLabel}</span>
          {hasOptions && hasSelection && (
            <span className="text-[12px] text-[#999]">/월</span>
          )}
        </div>
        {hasOptions && !hasSelection && (
          <p className="text-[11px] text-[#bbb]" style={{ marginBottom: "4px" }}>
            옵션 선택 후 최종 금액이 확정됩니다
          </p>
        )}
      </div>

      {/* ── 배송 배지 ── */}
      {hasTags && (
        <div className="flex items-center gap-1.5" style={{ marginBottom: "16px" }}>
          {product.tags!.map((tag) => {
            const isRocket = tag === "로켓배송";
            return (
              <span
                key={tag}
                className="inline-flex items-center gap-1 px-2 py-[3px] text-[11px] font-medium rounded-full"
                style={
                  isRocket
                    ? { color: "#b45309", background: "#fef9c3", border: "1px solid #fde68a" }
                    : { color: "#1d4ed8", background: "#eff6ff", border: "1px solid #bfdbfe" }
                }
              >
                {!isRocket && <Truck size={10} strokeWidth={1.5} />}
                {isRocket && <span style={{ fontSize: "10px" }}>⚡</span>}
                {tag}
              </span>
            );
          })}
          <span className="text-[11px] text-[#bbb]">내일(목) 도착</span>
        </div>
      )}

      {/* ── 구분선 ── */}
      <div style={{ height: "1px", background: "#f0f0f0", margin: "0 0 14px" }} />

      {/* ── 옵션 선택 ── */}
      {hasOptions && (
        <div style={{ marginBottom: "14px" }}>
          <p className="text-[11px] font-semibold text-[#bbb] uppercase" style={{ letterSpacing: "0.5px", marginBottom: "8px" }}>
            옵션 선택
          </p>

          {/* Select */}
          <div className="relative">
            <select
              onChange={handleSelectOption}
              defaultValue=""
              className="w-full appearance-none bg-[#fafafa] text-[13px] font-medium text-[#111] cursor-pointer"
              style={{
                border: "1.5px solid #e8e8e8",
                borderRadius: "10px",
                padding: "10px 36px 10px 12px",
                fontFamily: "inherit",
                outline: "none",
                transition: "border-color 0.15s",
              }}
              onFocus={(e) => (e.target.style.borderColor = "#111")}
              onBlur={(e) => (e.target.style.borderColor = "#e8e8e8")}
            >
              <option value="" disabled>
                옵션을 선택하세요
              </option>
              {product.options!.map((opt, i) => (
                <option key={opt.name} value={i}>
                  {opt.name} — {formatPrice(opt.price)}{product.category === "생활용품" ? "/월" : ""}
                </option>
              ))}
            </select>
            <ChevronDown
              size={14}
              strokeWidth={1.5}
              className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-[#aaa]"
            />
          </div>

          {/* 선택된 옵션 칩 */}
          {chips.length > 0 && (
            <div className="flex flex-col gap-1.5" style={{ marginTop: "10px" }}>
              {chips.map((chip) => (
                <div
                  key={chip.option.name}
                  className="flex items-center justify-between bg-[#f8f8f8]"
                  style={{ border: "1px solid #ebebeb", borderRadius: "10px", padding: "10px 12px" }}
                >
                  {/* 좌: 옵션명 + 가격 */}
                  <div className="flex flex-col gap-0.5">
                    <span className="text-[12px] font-medium text-[#333]">{chip.option.name}</span>
                    <span className="text-[13px] font-semibold text-[#111]">
                      {formatPrice(chip.option.price)}{product.category === "생활용품" ? "/월" : ""}
                    </span>
                  </div>

                  {/* 우: 수량 + 삭제 */}
                  <div className="flex items-center gap-2">
                    {/* 수량 컨트롤 */}
                    <div
                      className="flex items-center"
                      style={{ background: "#fff", border: "1px solid #e0e0e0", borderRadius: "8px", overflow: "hidden" }}
                    >
                      <button
                        onClick={() => changeQty(chip.option.name, -1)}
                        disabled={chip.qty <= 1}
                        className="flex items-center justify-center cursor-pointer transition-colors hover:bg-[#f5f5f5] disabled:opacity-30 disabled:cursor-not-allowed"
                        style={{ width: "28px", height: "28px", border: "none", background: "transparent" }}
                      >
                        <Minus size={11} strokeWidth={2} />
                      </button>
                      <span className="text-[13px] font-semibold text-[#111]" style={{ width: "24px", textAlign: "center" }}>
                        {chip.qty}
                      </span>
                      <button
                        onClick={() => changeQty(chip.option.name, 1)}
                        className="flex items-center justify-center cursor-pointer transition-colors hover:bg-[#f5f5f5]"
                        style={{ width: "28px", height: "28px", border: "none", background: "transparent" }}
                      >
                        <Plus size={11} strokeWidth={2} />
                      </button>
                    </div>
                    {/* 삭제 */}
                    <button
                      onClick={() => removeChip(chip.option.name)}
                      className="flex items-center justify-center cursor-pointer hover:bg-[#e0e0e0] transition-colors"
                      style={{ width: "22px", height: "22px", background: "#ebebeb", borderRadius: "50%", border: "none", color: "#888" }}
                    >
                      <X size={10} strokeWidth={2.5} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── 최종 금액 ── */}
      {hasOptions && (
        <div
          className="flex items-center justify-between"
          style={{
            background: hasSelection ? "#f8f8f8" : "#f8f8f8",
            borderRadius: "12px",
            padding: "12px 14px",
            marginBottom: "14px",
            opacity: hasSelection ? 1 : 0.45,
            transition: "opacity 0.2s",
          }}
        >
          <div>
            <p className="text-[12px] font-medium text-[#888]">최종 금액</p>
            {hasSelection && (
              <p className="text-[11px] text-[#bbb]" style={{ marginTop: "2px" }}>
                {chips.map((c) => `${c.option.name} × ${c.qty}`).join(", ")}
              </p>
            )}
            {!hasSelection && (
              <p className="text-[11px] text-[#bbb]" style={{ marginTop: "2px" }}>옵션 선택 후 확인 가능</p>
            )}
          </div>
          <span className="text-[20px] font-semibold text-[#111]">
            {hasSelection ? formatPrice(totalPrice) : "—"}
          </span>
        </div>
      )}

      {/* ── 설명 ── */}
      <p className="text-[13px] text-[#555] leading-relaxed" style={{ marginBottom: "12px" }}>
        {product.description}
      </p>

      {/* ── 상세 스펙 (토글) ── */}
      {product.specs && Object.keys(product.specs).length > 0 && (
        <div style={{ marginBottom: "16px" }}>
          <button
            onClick={() => setSpecOpen((v) => !v)}
            className="flex items-center justify-between w-full cursor-pointer"
            style={{ background: "none", border: "none", padding: "0" }}
          >
            <span className="text-[11px] font-semibold text-[#bbb] uppercase" style={{ letterSpacing: "0.5px" }}>
              상세 스펙
            </span>
            <ChevronDown
              size={13}
              strokeWidth={1.5}
              className="text-[#bbb] transition-transform"
              style={{ transform: specOpen ? "rotate(180deg)" : "rotate(0deg)" }}
            />
          </button>

          {specOpen && (
            <div className="flex flex-col gap-1.5" style={{ marginTop: "10px" }}>
              {Object.entries(product.specs).map(([k, v]) => (
                <div key={k} className="flex items-start gap-3 text-[12px]">
                  <span className="text-[#bbb] font-medium shrink-0" style={{ width: "72px" }}>{k}</span>
                  <span className="text-[#444] leading-relaxed">{v}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── 구분선 ── */}
      <div style={{ height: "1px", background: "#f0f0f0", marginBottom: "14px" }} />

      {/* ── 액션 버튼 ── */}
      <div className="flex flex-col gap-2">
        {showCartButton && (
          <button
            onClick={onAddToCart}
            disabled={hasOptions && !hasSelection}
            className="flex items-center justify-center gap-2 w-full text-[14px] font-semibold text-white bg-black rounded-xl cursor-pointer transition-all hover:bg-[#333] disabled:bg-[#d0d0d0] disabled:cursor-not-allowed"
            style={{ padding: "13px", border: "none" }}
          >
            <ShoppingCart size={15} strokeWidth={1.5} />
            장바구니 담기
          </button>
        )}

        {/* 폴더에 담기 */}
        <div ref={folderRef} className="relative">
          <button
            onClick={() => { setFolderOpen((v) => !v); setPickedFolderIds([]); }}
            className="flex items-center justify-center gap-2 w-full text-[14px] font-medium text-[#333] bg-white rounded-xl cursor-pointer transition-colors hover:bg-[#f5f5f5]"
            style={{ padding: "12px", border: "1.5px solid #e8e8e8" }}
          >
            <FolderPlus size={15} strokeWidth={1.5} />
            폴더에 담기
          </button>

          {folderOpen && (
            <div
              className="absolute bottom-full mb-1.5 left-0 right-0 bg-white py-1.5 z-50"
              style={{
                borderRadius: "10px",
                boxShadow: "rgba(0,0,0,0.06) 0px 0px 0px 1px, rgba(0,0,0,0.04) 0px 2px 8px, rgba(0,0,0,0.06) 0px 8px 20px",
              }}
            >
              <p className="px-3 pt-1 pb-1.5 text-[11px] text-[#aaa]">
                여러 폴더를 선택할 수 있어요
              </p>
              <div className="max-h-[180px] overflow-y-auto">
                {folders.map((f) => {
                  const picked = pickedFolderIds.includes(f.id);
                  return (
                    <button
                      key={f.id}
                      onClick={(e) => { e.stopPropagation(); toggleFolder(f.id); }}
                      className="flex items-center gap-2 w-full text-left px-3 py-1.5 text-[12px] cursor-pointer transition-colors"
                      style={{
                        color: picked ? "#000" : "#444",
                        background: picked ? "#f5f2ef" : "transparent",
                        fontWeight: picked ? 500 : 400,
                        border: "none",
                      }}
                      onMouseEnter={(e) => { if (!picked) e.currentTarget.style.background = "#fafafa"; }}
                      onMouseLeave={(e) => { if (!picked) e.currentTarget.style.background = "transparent"; }}
                    >
                      <span
                        className="flex items-center justify-center shrink-0"
                        style={{
                          width: "16px", height: "16px", borderRadius: "4px",
                          background: picked ? "#000" : "transparent",
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
                  onClick={(e) => { e.stopPropagation(); setFolderOpen(false); }}
                  className="flex-1 px-2 py-1.5 text-[12px] text-[#999] rounded-[6px] cursor-pointer hover:bg-[#fafafa]"
                  style={{ border: "none", background: "transparent" }}
                >
                  취소
                </button>
                <button
                  onClick={(e) => { e.stopPropagation(); confirmFolders(); }}
                  disabled={pickedFolderIds.length === 0}
                  className="flex-1 px-2 py-1.5 text-[12px] font-medium rounded-[6px] cursor-pointer transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                  style={{
                    background: pickedFolderIds.length > 0 ? "#000" : "#ebebeb",
                    color: pickedFolderIds.length > 0 ? "#fff" : "#999",
                    border: "none",
                  }}
                >
                  담기{pickedFolderIds.length > 0 ? ` (${pickedFolderIds.length})` : ""}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ── 토스트 ── */}
      {toast && (
        <div
          className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[70] flex items-center gap-2 text-white text-[13px] font-medium"
          style={{ background: "#1a1a1a", borderRadius: "10px", padding: "10px 16px" }}
        >
          <Check size={14} strokeWidth={2} />
          {toast}
        </div>
      )}
    </div>
  );
}
