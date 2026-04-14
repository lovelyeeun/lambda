"use client";

import { useState } from "react";
import type { Product } from "@/lib/types";
import { Minus, Plus, Trash2, FileCheck, CreditCard } from "lucide-react";

export interface CartItem {
  product: Product;
  quantity: number;
}

interface CartPanelProps {
  items: CartItem[];
  onUpdateQuantity: (productId: string, quantity: number) => void;
  onRemove: (productId: string) => void;
  onRequestApproval: () => void;
  onDirectPurchase: () => void;
}

function formatPrice(n: number) {
  return n.toLocaleString("ko-KR") + "원";
}

export default function CartPanel({
  items,
  onUpdateQuantity,
  onRemove,
  onRequestApproval,
  onDirectPurchase,
}: CartPanelProps) {
  const totalPrice = items.reduce((sum, item) => sum + item.product.price * item.quantity, 0);
  const totalItems = items.reduce((sum, item) => sum + item.quantity, 0);

  if (items.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-center px-4">
        <div className="w-12 h-12 rounded-full bg-[#f5f5f5] flex items-center justify-center mb-3">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#777169" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="9" cy="21" r="1" /><circle cx="20" cy="21" r="1" />
            <path d="M1 1h4l2.68 13.39a2 2 0 002 1.61h9.72a2 2 0 002-1.61L23 6H6" />
          </svg>
        </div>
        <p className="text-[14px] font-medium text-[#4e4e4e]">장바구니가 비어있습니다</p>
        <p className="text-[12px] text-[#777169] mt-1">채팅에서 상품을 추천받거나, <br></br>회사 상품 폴더에서 원하는 상품을 찾아보세요</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="pb-3 mb-3" style={{ borderBottom: "1px solid #e5e5e5" }}>
        <h3 className="text-[15px] font-semibold">장바구니</h3>
        <p className="text-[12px] text-[#777169] mt-0.5">{totalItems}개 상품</p>
      </div>

      {/* Items */}
      <div className="flex-1 overflow-y-auto flex flex-col gap-3">
        {items.map((item) => (
          <div key={item.product.id} className="flex gap-3">
            {/* Image placeholder */}
            <div
              className="w-14 h-14 shrink-0 bg-[#f5f5f5] flex items-center justify-center text-[10px] text-[#777169]"
              style={{ borderRadius: "8px" }}
            >
              {item.product.brand}
            </div>

            <div className="flex-1 min-w-0">
              <p className="text-[13px] font-medium leading-tight line-clamp-2">
                {item.product.name}
              </p>
              <p className="text-[13px] font-semibold mt-1">
                {formatPrice(item.product.price * item.quantity)}
              </p>

              {/* Quantity controls */}
              <div className="flex items-center gap-2 mt-1.5">
                <div
                  className="inline-flex items-center"
                  style={{
                    borderRadius: "8px",
                    boxShadow: "rgba(0,0,0,0.06) 0px 0px 0px 1px",
                  }}
                >
                  <button
                    onClick={() => onUpdateQuantity(item.product.id, Math.max(1, item.quantity - 1))}
                    className="w-7 h-7 flex items-center justify-center cursor-pointer transition-colors hover:bg-[#f5f5f5] rounded-l-lg"
                  >
                    <Minus size={12} strokeWidth={1.5} color="#4e4e4e" />
                  </button>
                  <span className="w-8 text-center text-[13px] font-medium">{item.quantity}</span>
                  <button
                    onClick={() => onUpdateQuantity(item.product.id, item.quantity + 1)}
                    className="w-7 h-7 flex items-center justify-center cursor-pointer transition-colors hover:bg-[#f5f5f5] rounded-r-lg"
                  >
                    <Plus size={12} strokeWidth={1.5} color="#4e4e4e" />
                  </button>
                </div>

                <button
                  onClick={() => onRemove(item.product.id)}
                  className="flex items-center justify-center w-7 h-7 rounded-lg cursor-pointer transition-colors hover:bg-[#f5f5f5]"
                  aria-label="삭제"
                >
                  <Trash2 size={13} strokeWidth={1.5} color="#777169" />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Summary + actions */}
      <div className="pt-3 mt-3" style={{ borderTop: "1px solid #e5e5e5" }}>
        {/* Total */}
        <div className="flex items-center justify-between mb-4">
          <span className="text-[13px] text-[#4e4e4e]">예상 금액</span>
          <span className="text-[18px] font-semibold">{formatPrice(totalPrice)}</span>
        </div>

        {/* Buttons */}
        <div className="flex flex-col gap-2">
          <button
            onClick={onRequestApproval}
            className="flex items-center justify-center gap-2 w-full py-[10px] text-[14px] font-medium text-white bg-black rounded-xl cursor-pointer transition-opacity hover:opacity-80"
          >
            <FileCheck size={16} strokeWidth={1.5} />
            품의 요청
          </button>
          <button
            onClick={onDirectPurchase}
            className="flex items-center justify-center gap-2 w-full py-[10px] text-[14px] font-medium text-[#4e4e4e] bg-[#f5f5f5] rounded-xl cursor-pointer transition-colors hover:bg-[#ebebeb]"
          >
            <CreditCard size={16} strokeWidth={1.5} />
            직접 결제
          </button>
        </div>
      </div>
    </div>
  );
}
