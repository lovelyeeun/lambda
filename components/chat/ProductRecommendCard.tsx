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
    <div className="flex gap-2.5 mt-1 overflow-x-auto pb-1" style={{ scrollbarWidth: "none" }}>
      {items.map((product) => (
        <div
          key={product.id}
          className="flex flex-col bg-white shrink-0"
          style={{
            width: "220px",
            borderRadius: "12px",
            boxShadow: "rgba(0,0,0,0.06) 0px 0px 0px 1px, rgba(0,0,0,0.04) 0px 1px 2px",
          }}
        >
          {/* Image placeholder */}
          <div
            className="w-full h-[100px] bg-[#f5f2ef] flex items-center justify-center text-[11px] font-medium text-[#777169]"
            style={{ borderRadius: "12px 12px 0 0", letterSpacing: "0.14px" }}
          >
            {product.brand}
          </div>

          {/* Info */}
          <div className="flex flex-col flex-1 px-3 pt-2.5 pb-3">
            <p className="text-[10px] text-[#777169]" style={{ letterSpacing: "0.14px" }}>
              {product.brand} · {product.category}
            </p>
            <p
              className="text-[12.5px] font-medium leading-[1.35] mt-0.5 line-clamp-2 flex-1"
              style={{ letterSpacing: "0.14px" }}
            >
              {product.name}
            </p>
            <p className="text-[15px] font-semibold mt-1.5" style={{ letterSpacing: "-0.2px" }}>
              {formatPrice(product.price)}
            </p>

            {/* Tags */}
            {product.tags && product.tags.length > 0 && (
              <div className="flex flex-wrap gap-1 mt-1.5">
                {product.tags.map((tag) => (
                  <span
                    key={tag}
                    className="text-[9.5px] font-medium text-[#777169] px-1.5 py-[1px]"
                    style={{
                      borderRadius: "4px",
                      backgroundColor: "rgba(245,242,239,0.8)",
                      letterSpacing: "0.14px",
                    }}
                  >
                    {tag}
                  </span>
                ))}
              </div>
            )}

            {/* Actions */}
            <div className="flex gap-1.5 mt-2.5">
              <button
                onClick={() => onViewProduct(product)}
                className="flex items-center gap-1 px-2 py-[5px] text-[11px] font-medium text-[#4e4e4e] cursor-pointer transition-colors hover:bg-[rgba(245,242,239,0.8)]"
                style={{
                  borderRadius: "8px",
                  boxShadow: "rgba(0,0,0,0.06) 0px 0px 0px 1px",
                  letterSpacing: "0.14px",
                }}
              >
                <Eye size={11} strokeWidth={1.5} />
                상세
              </button>
              <button
                onClick={() => onAddToCart(product)}
                className="flex-1 flex items-center justify-center gap-1 px-2 py-[5px] text-[11px] font-medium text-white bg-[#000] cursor-pointer transition-opacity hover:opacity-85"
                style={{ borderRadius: "8px", letterSpacing: "0.14px" }}
              >
                <ShoppingCart size={11} strokeWidth={1.5} />
                담기
              </button>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
