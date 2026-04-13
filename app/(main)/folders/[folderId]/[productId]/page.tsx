"use client";

import { useParams, useRouter } from "next/navigation";
import { useState } from "react";
import {
  ChevronLeft, ShoppingCart, ShoppingBag, Zap, Minus, Plus, Check,
  Users, TrendingDown, Package, Truck, Shield,
} from "lucide-react";
import { products } from "@/data/products";
import { useCart } from "@/lib/cart-context";
import CartSidePanel from "@/components/commerce/CartSidePanel";

/* ─── Source styles ─── */
const sourceStyles: Record<string, { color: string }> = {
  "쿠팡": { color: "#e44d2e" },
  "SmartStore": { color: "#03c75a" },
  "오늘의집": { color: "#35c5f0" },
  "기타 플랫폼": { color: "#999" },
};

const tagStyles: Record<string, { bg: string; color: string }> = {
  "무료배송": { bg: "#f5f5f5", color: "#777" },
  "로켓배송": { bg: "#e8f4fd", color: "#0074e8" },
};

/* ─── Insights ─── */
const insights: Record<string, { team: string; freq: string; benchmark: string }> = {
  "prod-001": { team: "마케팅팀", freq: "월 2회", benchmark: "동종업계 평균 대비 8% 저렴" },
  "prod-002": { team: "마케팅팀", freq: "분기 1회", benchmark: "동종업계 평균 대비 12% 저렴" },
  "prod-003": { team: "경영지원", freq: "연 1회", benchmark: "동종업계 평균가 수준" },
  "prod-004": { team: "디자인팀", freq: "분기 2회", benchmark: "동종업계 평균 대비 5% 저렴" },
  "prod-005": { team: "개발팀", freq: "월 1회", benchmark: "동종업계 평균 대비 15% 저렴" },
  "prod-006": { team: "디자인팀", freq: "월 1회", benchmark: "동종업계 평균가 수준" },
  "prod-007": { team: "전 부서", freq: "월 3회", benchmark: "동종업계 평균 대비 3% 저렴" },
  "prod-008": { team: "개발팀", freq: "분기 1회", benchmark: "동종업계 평균 대비 10% 저렴" },
  "prod-009": { team: "경영지원", freq: "월 렌탈", benchmark: "동종업계 평균 대비 7% 저렴" },
  "prod-010": { team: "개발팀", freq: "분기 1회", benchmark: "동종업계 평균 대비 12% 저렴" },
  "prod-011": { team: "경영지원", freq: "연 2회", benchmark: "동종업계 평균가 수준" },
  "prod-012": { team: "경영지원", freq: "분기 1회", benchmark: "동종업계 평균 대비 5% 저렴" },
};

/* ═══════════════════════════════════════
   Product Detail Page
   ═══════════════════════════════════════ */

export default function ProductDetailPage() {
  const params = useParams();
  const router = useRouter();
  const cart = useCart();
  const productId = params.productId as string;
  const folderId = params.folderId as string;

  const product = products.find((p) => p.id === productId);
  const insight = insights[productId];
  const [qty, setQty] = useState(1);
  const [toast, setToast] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3000);
  };

  const inCart = product ? cart.items.some((i) => i.product.id === product.id) : false;
  const cartItemQty = product
    ? cart.items.find((i) => i.product.id === product.id)?.quantity ?? 0
    : 0;

  if (!product) {
    return (
      <div className="flex items-center justify-center h-full">
        <p className="text-[14px] text-[#777]">상품을 찾을 수 없습니다</p>
      </div>
    );
  }

  const src = sourceStyles[product.source ?? ""] ?? sourceStyles["기타 플랫폼"];
  const totalPrice = product.price * qty;

  return (
    <div className="h-full flex">
      {/* ══ 메인 콘텐츠 ══ */}
      <div className="flex-1 h-full overflow-y-auto min-w-0">
        <div className="max-w-[960px] mx-auto px-6 py-6">
          {/* 상단바: 뒤로가기 + 장바구니 */}
          <div className="flex items-center justify-between mb-5">
            <button
              onClick={() => router.push("/folders")}
              className="flex items-center gap-1.5 text-[13px] text-[#777] cursor-pointer transition-colors hover:text-[#333] group"
            >
              <ChevronLeft size={15} strokeWidth={1.5} className="transition-transform group-hover:-translate-x-0.5" />
              {folderId ? "폴더로 돌아가기" : "뒤로"}
            </button>

            <button
              onClick={cart.toggleCart}
              className="relative flex items-center gap-2 px-3 py-[7px] text-[13px] cursor-pointer transition-colors hover:bg-[#f5f5f5]"
              style={{
                borderRadius: "10px",
                boxShadow: cart.isOpen ? "rgba(0,0,0,0.1) 0px 0px 0px 1.5px" : "rgba(0,0,0,0.06) 0px 0px 0px 1px",
                backgroundColor: cart.isOpen ? "#f8f8f8" : "#fff",
              }}
            >
              <ShoppingBag size={15} strokeWidth={1.5} color={cart.totalItems > 0 ? "#111" : "#999"} />
              <span className="text-[#555]">장바구니</span>
              {cart.totalItems > 0 && (
                <span className="flex items-center justify-center min-w-[18px] h-[18px] px-1 text-[10px] font-bold text-white bg-[#111] rounded-full">
                  {cart.totalItems}
                </span>
              )}
            </button>
          </div>

          {/* 2열 레이아웃: 이미지 + 정보 */}
          <div className="flex gap-8">
            {/* 좌: 이미지 */}
            <div className="w-[400px] shrink-0">
              <div
                className="w-full aspect-square bg-[#f8f8f8] flex items-center justify-center"
                style={{ borderRadius: "14px" }}
              >
                <span className="text-[13px] text-[#ccc]">이미지 준비중입니다</span>
              </div>
            </div>

            {/* 우: 상품 정보 */}
            <div className="flex-1 min-w-0">
              {/* 소싱처 */}
              {product.source && (
                <div className="flex items-center gap-1.5 mb-2">
                  <span className="inline-block w-2 h-2 rounded-full" style={{ backgroundColor: src.color }} />
                  <span className="text-[12px] font-medium" style={{ color: src.color }}>{product.source}</span>
                </div>
              )}

              {/* 상품명 */}
              <h1 className="text-[22px] font-semibold leading-[1.35] mb-2" style={{ letterSpacing: "-0.3px" }}>
                {product.name}
              </h1>

              {/* 태그 */}
              {product.tags && product.tags.length > 0 && (
                <div className="flex items-center gap-1.5 mb-3">
                  {product.tags.map((tag) => {
                    const ts = tagStyles[tag] ?? { bg: "#f5f5f5", color: "#999" };
                    return (
                      <span key={tag} className="px-2 py-[3px] text-[11px] font-medium" style={{ borderRadius: "5px", backgroundColor: ts.bg, color: ts.color }}>
                        {tag}
                      </span>
                    );
                  })}
                </div>
              )}

              {/* 가격 */}
              <p className="text-[28px] font-bold mb-4" style={{ letterSpacing: "-0.5px" }}>
                {product.price.toLocaleString("ko-KR")}
                <span className="text-[16px] font-medium text-[#555]">원</span>
              </p>

              {/* 인사이트 */}
              {insight && (
                <div className="flex items-center gap-4 mb-5 px-4 py-3 bg-[#fafafa]" style={{ borderRadius: "10px" }}>
                  <div className="flex items-center gap-1.5 text-[12px] text-[#666]">
                    <Users size={13} strokeWidth={1.5} color="#999" />
                    <span>{insight.team} {insight.freq} 주문</span>
                  </div>
                  <div className="w-px h-3.5 bg-[#e0e0e0]" />
                  <div className="flex items-center gap-1.5 text-[12px] text-[#22c55e]">
                    <TrendingDown size={13} strokeWidth={1.5} />
                    <span>{insight.benchmark}</span>
                  </div>
                </div>
              )}

              {/* 수량 */}
              <div className="flex items-center gap-4 mb-5">
                <span className="text-[13px] text-[#777]">수량</span>
                <div className="flex items-center" style={{ borderRadius: "8px", boxShadow: "rgba(0,0,0,0.06) 0px 0px 0px 1px" }}>
                  <button
                    onClick={() => setQty(Math.max(1, qty - 1))}
                    className="w-9 h-9 flex items-center justify-center cursor-pointer hover:bg-[#f5f5f5] transition-colors"
                    style={{ borderRadius: "8px 0 0 8px" }}
                  >
                    <Minus size={14} strokeWidth={1.5} color="#777" />
                  </button>
                  <span className="w-12 text-center text-[14px] font-medium">{qty}</span>
                  <button
                    onClick={() => setQty(qty + 1)}
                    className="w-9 h-9 flex items-center justify-center cursor-pointer hover:bg-[#f5f5f5] transition-colors"
                    style={{ borderRadius: "0 8px 8px 0" }}
                  >
                    <Plus size={14} strokeWidth={1.5} color="#777" />
                  </button>
                </div>
                <span className="text-[14px] font-semibold text-[#333] ml-auto">
                  합계 {totalPrice.toLocaleString("ko-KR")}원
                </span>
              </div>

              {/* 액션 버튼 */}
              <div className="flex gap-3 mb-6">
                <button
                  onClick={() => {
                    cart.addItem(product, qty);
                    showToast(inCart ? `장바구니 수량이 ${cartItemQty + qty}개로 변경되었습니다` : "장바구니에 담았습니다");
                  }}
                  className="flex-1 flex items-center justify-center gap-2 py-[13px] text-[14px] font-medium text-[#333] bg-white cursor-pointer transition-colors hover:bg-[#fafafa]"
                  style={{ borderRadius: "12px", boxShadow: "rgba(0,0,0,0.08) 0px 0px 0px 1px" }}
                >
                  <ShoppingCart size={16} strokeWidth={1.5} />
                  {inCart ? `장바구니에 추가 (${cartItemQty}개)` : "장바구니 담기"}
                </button>
                <button
                  onClick={() => {
                    showToast("구매 채팅으로 이동합니다");
                    setTimeout(() => router.push("/chat"), 800);
                  }}
                  className="flex-1 flex items-center justify-center gap-2 py-[13px] text-[14px] font-medium text-white bg-[#1a1a1a] cursor-pointer transition-opacity hover:opacity-80"
                  style={{ borderRadius: "12px" }}
                >
                  <Zap size={16} strokeWidth={1.5} />
                  바로 구매
                </button>
              </div>

              {/* 배송/보증 정보 */}
              <div className="flex flex-col gap-2.5 mb-6">
                <div className="flex items-center gap-2.5 text-[12px] text-[#777]">
                  <Truck size={14} strokeWidth={1.5} color="#bbb" />
                  <span>일반배송 2~3일 소요 · {product.tags?.includes("무료배송") ? "무료배송" : "배송비 별도"}</span>
                </div>
                <div className="flex items-center gap-2.5 text-[12px] text-[#777]">
                  <Shield size={14} strokeWidth={1.5} color="#bbb" />
                  <span>정품 보증 · 교환/반품 7일 이내</span>
                </div>
                <div className="flex items-center gap-2.5 text-[12px] text-[#777]">
                  <Package size={14} strokeWidth={1.5} color="#bbb" />
                  <span>{product.inStock ? "재고 있음" : "일시 품절"}</span>
                </div>
              </div>
            </div>
          </div>

          {/* ── 하단: 상세 정보 ── */}
          <div className="mt-8 pt-6" style={{ borderTop: "1px solid rgba(0,0,0,0.06)" }}>
            <div className="grid grid-cols-2 gap-8">
              <div>
                <h3 className="text-[15px] font-semibold mb-3">상품 설명</h3>
                <p className="text-[13px] text-[#555] leading-[1.7]">{product.description}</p>
              </div>
              <div>
                <h3 className="text-[15px] font-semibold mb-3">상세 스펙</h3>
                <div className="flex flex-col gap-0">
                  {Object.entries(product.specs).map(([key, val], i) => (
                    <div
                      key={key}
                      className="flex items-center py-2.5 text-[13px]"
                      style={{ borderBottom: i < Object.entries(product.specs).length - 1 ? "1px solid rgba(0,0,0,0.04)" : undefined }}
                    >
                      <span className="w-[100px] text-[#999] shrink-0">{key}</span>
                      <span className="text-[#333]">{val}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ══ 우측: 장바구니 사이드 패널 ══ */}
      <CartSidePanel />

      {/* Toast */}
      {toast && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[60] flex items-center gap-2 px-4 py-2.5 bg-[#1a1a1a] text-white text-[13px] font-medium" style={{ borderRadius: "10px", boxShadow: "rgba(0,0,0,0.2) 0px 4px 12px" }}>
          <Check size={14} strokeWidth={2} />{toast}
        </div>
      )}
    </div>
  );
}
