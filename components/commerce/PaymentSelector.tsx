"use client";

import { useState } from "react";
import { CreditCard, Plus, Check } from "lucide-react";

interface PaymentMethod {
  id: string;
  label: string;
  detail: string;
  type: "card" | "bnpl";
}

const registeredMethods: PaymentMethod[] = [
  { id: "pay-001", label: "하나 법인카드", detail: "****-****-****-1234", type: "card" },
  { id: "pay-002", label: "신한 법인카드", detail: "****-****-****-5678", type: "card" },
  { id: "pay-003", label: "네이버 후불결제", detail: "BNPL · 월말 정산", type: "bnpl" },
];

interface PaymentSelectorProps {
  totalPrice: number;
  onConfirm: (methodId: string) => void;
}

function formatPrice(n: number) {
  return n.toLocaleString("ko-KR") + "원";
}

export default function PaymentSelector({ totalPrice, onConfirm }: PaymentSelectorProps) {
  const [selected, setSelected] = useState(registeredMethods[0].id);

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="pb-3 mb-4" style={{ borderBottom: "1px solid #e5e5e5" }}>
        <h3 className="text-[15px] font-semibold">결제수단 선택</h3>
        <p className="text-[12px] text-[#777169] mt-0.5">
          결제 금액: {formatPrice(totalPrice)}
        </p>
      </div>

      {/* Payment methods */}
      <div className="flex flex-col gap-2 mb-4">
        {registeredMethods.map((method) => {
          const isSelected = selected === method.id;
          return (
            <button
              key={method.id}
              onClick={() => setSelected(method.id)}
              className="flex items-center gap-3 px-3 py-3 text-left cursor-pointer transition-colors"
              style={{
                borderRadius: "12px",
                boxShadow: isSelected
                  ? "rgba(0,0,0,0.9) 0px 0px 0px 1.5px"
                  : "rgba(0,0,0,0.06) 0px 0px 0px 1px",
                backgroundColor: isSelected ? "rgba(0,0,0,0.02)" : "#fff",
              }}
            >
              <div
                className="w-10 h-10 rounded-lg flex items-center justify-center shrink-0"
                style={{ backgroundColor: method.type === "bnpl" ? "rgba(245,242,239,0.8)" : "#f5f5f5" }}
              >
                <CreditCard
                  size={18}
                  strokeWidth={1.5}
                  color={method.type === "bnpl" ? "#000" : "#4e4e4e"}
                />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[13px] font-medium">{method.label}</p>
                <p className="text-[12px] text-[#777169]">{method.detail}</p>
              </div>
              {isSelected && (
                <div className="w-5 h-5 rounded-full bg-black flex items-center justify-center shrink-0">
                  <Check size={12} color="#fff" strokeWidth={2} />
                </div>
              )}
            </button>
          );
        })}

        {/* Add new */}
        <button
          className="flex items-center gap-3 px-3 py-3 text-left cursor-pointer transition-colors hover:bg-[#f9f9f9]"
          style={{
            borderRadius: "12px",
            boxShadow: "rgba(0,0,0,0.06) 0px 0px 0px 1px",
          }}
        >
          <div className="w-10 h-10 rounded-lg bg-[#f5f5f5] flex items-center justify-center shrink-0">
            <Plus size={18} strokeWidth={1.5} color="#777169" />
          </div>
          <div>
            <p className="text-[13px] font-medium text-[#4e4e4e]">새 결제수단 등록</p>
            <p className="text-[12px] text-[#777169]">법인카드 또는 BNPL 추가</p>
          </div>
        </button>
      </div>

      {/* Spacer */}
      <div className="flex-1" />

      {/* Confirm */}
      <div className="pt-3" style={{ borderTop: "1px solid #e5e5e5" }}>
        <div className="flex items-center justify-between mb-3">
          <span className="text-[13px] text-[#4e4e4e]">결제 금액</span>
          <span className="text-[18px] font-semibold">{formatPrice(totalPrice)}</span>
        </div>
        <button
          onClick={() => onConfirm(selected)}
          className="w-full py-[10px] text-[14px] font-medium text-white bg-black rounded-xl cursor-pointer transition-opacity hover:opacity-80"
        >
          결제하기
        </button>
      </div>
    </div>
  );
}
