"use client";

import type { Product } from "@/lib/types";
import { products } from "@/data/products";
import { Eye, ShoppingCart } from "lucide-react";

interface ProductRecommendCardProps {
  productIds: string[];
  onViewProduct: (product: Product) => void;
  onAddToCart: (product: Product) => void;
}

function formatPrice(n: number) {
  return n.toLocaleString("ko-KR") + "원";
}

export default function ProductRecommendCard({
  productIds,
  onViewProduct,
  onAddToCart,
}: ProductRecommendCardProps) {
  const items = productIds
    .map((id) => products.find((p) => p.id === id))
    .filter((p): p is Product => !!p);

  if (items.length === 0) return null;

  return (
    <div className="flex flex-col gap-2 mt-1">
      {items.map((product) => (
        <div
          key={product.id}
          className="flex gap-3 p-3 bg-white"
          style={{
            borderRadius: "12px",
            boxShadow: "rgba(0,0,0,0.06) 0px 0px 0px 1px, rgba(0,0,0,0.04) 0px 1px 2px",
          }}
        >
          {/* Image placeholder */}
          <div
            className="w-16 h-16 shrink-0 bg-[#f5f5f5] flex items-center justify-center text-[10px] text-[#777169]"
            style={{ borderRadius: "8px" }}
          >
            {product.brand}
          </div>

          {/* Info */}
          <div className="flex-1 min-w-0">
            <p className="text-[11px] text-[#777169]" style={{ letterSpacing: "0.14px" }}>
              {product.brand} · {product.category}
            </p>
            <p className="text-[13px] font-medium leading-tight mt-0.5 line-clamp-1">
              {product.name}
            </p>
            <p className="text-[14px] font-semibold mt-1">
              {formatPrice(product.price)}
            </p>

            {/* Actions */}
            <div className="flex gap-1.5 mt-2">
              <button
                onClick={() => onViewProduct(product)}
                className="flex items-center gap-1 px-2.5 py-1 text-[12px] font-medium text-[#4e4e4e] bg-[#f5f5f5] rounded-md cursor-pointer transition-colors hover:bg-[#ebebeb]"
              >
                <Eye size={12} strokeWidth={1.5} />
                상세보기
              </button>
              <button
                onClick={() => onAddToCart(product)}
                className="flex items-center gap-1 px-2.5 py-1 text-[12px] font-medium text-white bg-black rounded-md cursor-pointer transition-opacity hover:opacity-80"
              >
                <ShoppingCart size={12} strokeWidth={1.5} />
                장바구니
              </button>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
