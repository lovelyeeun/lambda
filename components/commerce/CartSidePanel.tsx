"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { ShoppingBag, X, Download, FileSpreadsheet, FileText, Check } from "lucide-react";
import { useCart } from "@/lib/cart-context";
import { useRightPanel } from "@/lib/right-panel-context";
import { exportCartToExcel, exportCartToPDF } from "@/lib/cart-export";
import CartPanel from "@/components/commerce/CartPanel";
import PaymentSelector from "@/components/commerce/PaymentSelector";
import OrderTimeline, { type TimelinePhase } from "@/components/commerce/OrderTimeline";
import type { ApprovalStep } from "@/components/commerce/ApprovalTracker";
import type { ShippingStep } from "@/components/commerce/ShippingTracker";

/**
 * 장바구니 사이드 패널 — 폴더/상품상세 등에서 공통 사용
 * cart context의 isOpen에 따라 슬라이드 인/아웃
 */
const PAYMENT_LABELS: Record<string, string> = {
  "pay-001": "하나 법인카드 (****-1234)",
  "pay-002": "신한 법인카드 (****-5678)",
  "pay-003": "네이버 후불결제",
};

export default function CartSidePanel() {
  const router = useRouter();
  const cart = useCart();
  const { openPanel } = useRightPanel();
  const [exportOpen, setExportOpen] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const exportRef = useRef<HTMLDivElement>(null);

  /* ── 직접 결제 플로우 (RightPanel 활용) ── */
  const [flowCart, setFlowCart] = useState<typeof cart.items>([]);
  const [flowTotal, setFlowTotal] = useState(0);
  const [timelinePhase, setTimelinePhase] = useState<TimelinePhase>("products");
  const [paymentMethod, setPaymentMethod] = useState<string | undefined>();
  const [paymentDate, setPaymentDate] = useState<string | undefined>();
  const [shippingStep, setShippingStep] = useState<ShippingStep>("접수");
  const [approvalStep] = useState<ApprovalStep>("자동승인");

  // 주문 타임라인 열기
  const openTimeline = useCallback(() => {
    openPanel(
      <OrderTimeline
        activePhase={timelinePhase}
        cart={flowCart}
        totalPrice={flowTotal}
        approvalStep={approvalStep}
        approver="직접 결제"
        approvalDate={new Date().toISOString().split("T")[0]}
        isAutoApproved={true}
        paymentMethod={paymentMethod}
        paymentDate={paymentDate}
        shippingStep={shippingStep}
        trackingNumber=""
        estimatedDate=""
        onAdvance={() => {}}
        onConfirmPurchase={() => {}}
        onRequestReturn={() => {}}
        onViewOrders={() => router.push("/orders")}
      />,
      "order-timeline",
      { label: "주문 확인" },
    );
  }, [openPanel, timelinePhase, flowCart, flowTotal, approvalStep, paymentMethod, paymentDate, shippingStep, router]);

  // 결제 확인 콜백
  const confirmPayment = useCallback((methodId: string) => {
    const label = PAYMENT_LABELS[methodId] ?? methodId;
    setPaymentMethod(label);
    setPaymentDate(new Date().toISOString().split("T")[0]);
    setTimelinePhase("shipping");
    setShippingStep("접수");
    cart.clearCart();
    showToastMsg(`결제가 완료되었습니다 — ${label}`);
  }, [cart]);

  // 결제 완료 시 타임라인으로 자동 전환
  useEffect(() => {
    if (paymentMethod && timelinePhase === "shipping") {
      openPanel(
        <OrderTimeline
          activePhase="shipping"
          cart={flowCart}
          totalPrice={flowTotal}
          approvalStep={approvalStep}
          approver="직접 결제"
          approvalDate={new Date().toISOString().split("T")[0]}
          isAutoApproved={true}
          paymentMethod={paymentMethod}
          paymentDate={paymentDate}
          shippingStep={shippingStep}
          trackingNumber=""
          estimatedDate=""
          onAdvance={() => {}}
          onConfirmPurchase={() => {}}
          onRequestReturn={() => {}}
          onViewOrders={() => router.push("/orders")}
        />,
        "order-timeline",
        { label: "주문 완료" },
      );
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [paymentMethod, timelinePhase]);

  // 직접 결제 시작
  const startDirectPurchase = useCallback(() => {
    const frozen = [...cart.items];
    const total = cart.totalPrice;
    setFlowCart(frozen);
    setFlowTotal(total);
    setTimelinePhase("payment");
    setPaymentMethod(undefined);
    setPaymentDate(undefined);
    cart.closeCart();

    openPanel(
      <PaymentSelector totalPrice={total} onConfirm={confirmPayment} />,
      "payment",
      { label: "결제" },
    );
  }, [cart, openPanel, confirmPayment]);

  const showToastMsg = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3500);
  };

  /* 드롭다운 외부 클릭 닫기 */
  useEffect(() => {
    if (!exportOpen) return;
    const handler = (e: MouseEvent) => {
      if (exportRef.current && !exportRef.current.contains(e.target as Node)) {
        setExportOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [exportOpen]);

  const showToast = showToastMsg;

  const handleExcelExport = async () => {
    setExportOpen(false);
    try {
      await exportCartToExcel(cart.items);
      showToast("Excel 파일이 다운로드되었습니다");
    } catch {
      showToast("내보내기에 실패했습니다");
    }
  };

  const handlePDFExport = async () => {
    setExportOpen(false);
    try {
      await exportCartToPDF(cart.items);
      showToast("PDF 파일이 다운로드되었습니다");
    } catch {
      showToast("내보내기에 실패했습니다");
    }
  };

  return (
    <>
      <div
        className="shrink-0 h-full overflow-hidden transition-all duration-200 ease-out"
        style={{
          width: cart.isOpen ? "340px" : "0px",
          minWidth: cart.isOpen ? "340px" : "0px",
          borderLeft: cart.isOpen ? "1px solid rgba(0,0,0,0.06)" : "none",
        }}
      >
        {cart.isOpen && (
          <div className="h-full flex flex-col" style={{ width: "340px" }}>
            {/* ── 헤더 ── */}
            <div
              className="flex items-center justify-between px-4 h-[52px] shrink-0"
              style={{ borderBottom: "1px solid rgba(0,0,0,0.06)" }}
            >
              <div className="flex items-center gap-2">
                <ShoppingBag size={16} strokeWidth={1.5} color="#111" />
                <span className="text-[14px] font-semibold">장바구니</span>
                {cart.totalItems > 0 && (
                  <span className="text-[12px] text-[#999]">{cart.totalItems}개</span>
                )}
              </div>

              <div className="flex items-center gap-1">
                {/* 내보내기 버튼 */}
                {cart.items.length > 0 && (
                  <div className="relative" ref={exportRef}>
                    <button
                      onClick={() => setExportOpen(!exportOpen)}
                      className="flex items-center justify-center w-7 h-7 rounded-lg cursor-pointer transition-colors hover:bg-[#f5f5f5]"
                      title="내보내기"
                    >
                      <Download size={14} strokeWidth={1.5} color={exportOpen ? "#111" : "#999"} />
                    </button>

                    {exportOpen && (
                      <div
                        className="absolute right-0 top-full mt-1 w-[180px] bg-white py-1 z-30"
                        style={{
                          borderRadius: "10px",
                          boxShadow: "rgba(0,0,0,0.08) 0px 0px 0px 1px, rgba(0,0,0,0.08) 0px 4px 16px",
                        }}
                      >
                        <button
                          onClick={handleExcelExport}
                          className="w-full flex items-center gap-2.5 px-3 py-2.5 text-[13px] text-[#333] cursor-pointer hover:bg-[#f8f8f8] transition-colors"
                        >
                          <FileSpreadsheet size={15} strokeWidth={1.5} color="#22c55e" />
                          Excel 다운로드
                        </button>
                        <button
                          onClick={handlePDFExport}
                          className="w-full flex items-center gap-2.5 px-3 py-2.5 text-[13px] text-[#333] cursor-pointer hover:bg-[#f8f8f8] transition-colors"
                        >
                          <FileText size={15} strokeWidth={1.5} color="#ef4444" />
                          PDF 다운로드
                        </button>
                      </div>
                    )}
                  </div>
                )}

                {/* 닫기 */}
                <button
                  onClick={cart.closeCart}
                  className="flex items-center justify-center w-7 h-7 rounded-lg cursor-pointer transition-colors hover:bg-[#f5f5f5]"
                >
                  <X size={14} strokeWidth={1.5} color="#999" />
                </button>
              </div>
            </div>

            {/* ── 장바구니 내용 ── */}
            <div className="flex-1 overflow-y-auto px-4 py-4">
              <CartPanel
                items={cart.items}
                onUpdateQuantity={cart.updateQuantity}
                onRemove={cart.removeItem}
                onRequestApproval={() => { cart.closeCart(); router.push("/folders/approval"); }}
                onDirectPurchase={startDirectPurchase}
              />
            </div>
          </div>
        )}
      </div>

      {/* Toast */}
      {toast && (
        <div
          className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[60] flex items-center gap-2 px-4 py-2.5 bg-[#1a1a1a] text-white text-[13px] font-medium"
          style={{ borderRadius: "10px", boxShadow: "rgba(0,0,0,0.2) 0px 4px 12px" }}
        >
          <Check size={14} strokeWidth={2} />
          {toast}
        </div>
      )}
    </>
  );
}
