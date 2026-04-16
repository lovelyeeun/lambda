"use client";

import { X } from "lucide-react";
import type { ExternalPrice } from "@/lib/types";

interface PriceCompareModalProps {
  open: boolean;
  onClose: () => void;
  productName: string;
  prices: ExternalPrice[];
  onSelectExternalProduct: (price: ExternalPrice) => void;
  canSelect?: boolean;
}

const platformColors: Record<string, string> = {
  쿠팡: "#e44d2e",
  옥션: "#e61e28",
  G마켓: "#009900",
  "11번가": "#ff0000",
};

export default function PriceCompareModal({
  open,
  onClose,
  productName,
  prices,
  onSelectExternalProduct,
  canSelect = true,
}: PriceCompareModalProps) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[90] flex items-center justify-center bg-[rgba(0,0,0,0.42)] p-4">
      <div
        className="w-full max-w-[460px] overflow-hidden bg-white"
        style={{
          borderRadius: "18px",
          boxShadow: "rgba(0,0,0,0.18) 0px 20px 48px",
          maxHeight: "85vh",
        }}
      >
        <div className="flex items-start justify-between border-b border-[rgba(0,0,0,0.05)] px-5 py-4">
          <div>
            <p className="text-[16px] font-medium text-[#000]" style={{ letterSpacing: "0.16px" }}>가격 비교</p>
            <p className="mt-1 text-[12px] text-[#777169]" style={{ letterSpacing: "0.14px" }}>{productName}</p>
          </div>
          <button onClick={onClose} className="flex h-8 w-8 cursor-pointer items-center justify-center rounded-full bg-[#f6f6f6]">
            <X size={14} />
          </button>
        </div>

        <div className="flex max-h-[calc(85vh-84px)] flex-col gap-3 overflow-y-auto px-5 py-4">
          {prices.map((price) => {
            const isLowest = !!price.isLowest;
            return (
              <div
                key={`${price.platform}-${price.url}`}
                className="rounded-[16px] px-4 py-4"
                style={{
                  backgroundColor: isLowest ? "rgba(34,197,94,0.08)" : "#f6f6f6",
                  boxShadow: isLowest ? "rgba(0,0,0,0.08) 0px 0px 0px 0.5px" : undefined,
                }}
              >
                <div className="flex items-center gap-3">
                  <div
                    className="flex h-8 w-8 items-center justify-center rounded-full text-[11px] font-semibold text-white"
                    style={{ backgroundColor: platformColors[price.platform] ?? "#777169" }}
                  >
                    {price.platform.slice(0, 1)}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <p className="text-[13px] font-medium text-[#000]">{price.platform}</p>
                      {isLowest && (
                        <span className="rounded-full bg-white px-2 py-1 text-[10px] text-[#e44d2e]">최저가</span>
                      )}
                    </div>
                    <p className="mt-1 text-[11px] text-[#4e4e4e]">
                      {price.shippingFee === 0 ? "무료배송" : `배송비 ${price.shippingFee.toLocaleString()}원`}
                    </p>
                  </div>
                  <p className="text-[18px] font-semibold" style={{ color: isLowest ? "#e44d2e" : "#000" }}>
                    {price.price.toLocaleString()}원
                  </p>
                </div>
                {isLowest && canSelect && (
                  <button
                    onClick={() => onSelectExternalProduct(price)}
                    className="mt-3 w-full cursor-pointer rounded-full bg-black px-4 py-3 text-[13px] font-medium text-white"
                  >
                    이 가격으로 선택하기
                  </button>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
