"use client";

import { useState, useMemo } from "react";
import {
  FileCheck, Package, BarChart3, User, Building2, MapPin, MessageSquare,
  Sparkles, RefreshCw, TrendingDown, ShieldCheck, AlertTriangle,
  Clock, ChevronDown, Check, Zap,
} from "lucide-react";
import type { CartItem } from "./CartPanel";
import { currentUser, users } from "@/data/users";
import { orders } from "@/data/orders";

/* ─── 배송지 더미 ─── */
const addresses = [
  { id: "addr-1", name: "본사 3층", address: "서울시 강남구 테헤란로 152, 7층", receiver: "박은서", phone: "02-555-1234" },
  { id: "addr-2", name: "본사 5층 마케팅팀", address: "서울시 강남구 테헤란로 152, 5층", receiver: "이준호", phone: "02-555-5678" },
  { id: "addr-3", name: "물류센터", address: "경기도 성남시 분당구 판교로 256", receiver: "김태환", phone: "031-789-1000" },
];

/* ─── 소싱처 스타일 ─── */
const sourceStyles: Record<string, string> = {
  "쿠팡": "#e44d2e",
  "SmartStore": "#03c75a",
  "오늘의집": "#35c5f0",
  "기타 플랫폼": "#999",
};

/* ─── 승인자 자동 판별 ─── */
function getApprover() {
  const approver = users.find((u) => u.id !== currentUser.id && u.permissions.canApprove);
  return approver ?? users[0];
}

function formatPrice(n: number) {
  return n.toLocaleString("ko-KR") + "원";
}

export interface ApprovalReviewPanelProps {
  items: CartItem[];
  autoApprovalLimit: number;
  onSubmit: (payload: {
    isAutoApproval: boolean;
    addressId: string;
    urgency: "normal" | "urgent";
    message: string;
    deliveryMessage: string;
  }) => void;
}

export default function ApprovalReviewPanel({
  items,
  autoApprovalLimit,
  onSubmit,
}: ApprovalReviewPanelProps) {
  const [selectedAddressId, setSelectedAddressId] = useState(addresses[0].id);
  const [addressDropdownOpen, setAddressDropdownOpen] = useState(false);
  const [deliveryMessage, setDeliveryMessage] = useState("");
  const [approvalMessage, setApprovalMessage] = useState("");
  const [urgency, setUrgency] = useState<"normal" | "urgent">("normal");

  const selectedAddress = addresses.find((a) => a.id === selectedAddressId) ?? addresses[0];
  const approver = getApprover();
  const totalPrice = items.reduce((s, i) => s + i.product.price * i.quantity, 0);
  const totalItems = items.reduce((s, i) => s + i.quantity, 0);
  const isAutoApproval = totalPrice <= autoApprovalLimit && autoApprovalLimit > 0;

  /* ─── 예산 체크 ─── */
  const budgetInsight = useMemo(() => {
    const deptBudgets: Record<string, number> = {
      "경영지원": 15_000_000,
      "마케팅": 8_000_000,
      "디자인": 6_000_000,
      "개발": 10_000_000,
    };
    const monthlyBudget = deptBudgets[currentUser.department] ?? 10_000_000;
    const now = new Date();
    const thisMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
    const monthSpent = orders
      .filter((o) => o.orderedAt.startsWith(thisMonth) && o.status !== "반려" && o.orderedBy === currentUser.id)
      .reduce((sum, o) => sum + o.totalPrice, 0);
    const remaining = monthlyBudget - monthSpent;
    const afterPurchase = remaining - totalPrice;
    const usagePercent = Math.round(((monthSpent + totalPrice) / monthlyBudget) * 100);
    const currentPercent = Math.round((monthSpent / monthlyBudget) * 100);
    const isOverBudget = afterPurchase < 0;
    const isWarning = usagePercent > 80;
    return { monthlyBudget, monthSpent, remaining, afterPurchase, usagePercent, currentPercent, isOverBudget, isWarning };
  }, [totalPrice]);

  /* ─── AI 품의 사유 자동 생성 ─── */
  const aiReason = useMemo(() => {
    if (items.length === 0) return null;
    const categories = [...new Set(items.map((i) => i.product.category))];

    const reorderItems = items.filter((item) => orders.some((o) => o.productId === item.product.id));
    const newItems = items.filter((item) => !orders.some((o) => o.productId === item.product.id));

    const reorderAnalysis = reorderItems.map((item) => {
      const pastOrders = orders
        .filter((o) => o.productId === item.product.id)
        .sort((a, b) => new Date(b.orderedAt).getTime() - new Date(a.orderedAt).getTime());
      const lastOrder = pastOrders[0];
      const daysSince = lastOrder
        ? Math.round((Date.now() - new Date(lastOrder.orderedAt).getTime()) / (1000 * 60 * 60 * 24))
        : null;
      const isRecurring = pastOrders.some((o) => o.isRecurring);
      return { product: item.product, daysSince, isRecurring, orderCount: pastOrders.length };
    });

    const benchmarks = items.map((item) => {
      const seed = item.product.id.charCodeAt(item.product.id.length - 1);
      return { diffPercent: (seed % 17) - 12 };
    });
    const avgSaving = benchmarks.reduce((s, b) => s + b.diffPercent, 0) / benchmarks.length;

    const lines: string[] = [];
    lines.push(`${currentUser.department} ${currentUser.name}님의 ${categories.join("·")} 구매 요청입니다.`);
    const recurring = reorderAnalysis.filter((r) => r.isRecurring);
    if (recurring.length > 0) {
      lines.push(`정기 구매 품목 ${recurring.length}건이 포함되어 있으며, 적정 재주문 시점에 해당합니다.`);
    }
    reorderAnalysis.forEach((r) => {
      if (r.daysSince !== null) {
        lines.push(`"${r.product.name}" — 최근 ${r.daysSince}일 전 주문, 총 ${r.orderCount}회 이력.`);
      }
    });
    if (newItems.length > 0) {
      lines.push(`신규 구매 품목 ${newItems.length}건: ${newItems.map((i) => i.product.name).join(", ")}.`);
    }
    if (avgSaving < 0) {
      lines.push(`시장 평균가 대비 약 ${Math.abs(Math.round(avgSaving))}% 절감된 가격으로 소싱되었습니다.`);
    }

    return {
      summary: lines[0],
      details: lines.slice(1),
      avgSaving,
      newItemCount: newItems.length,
      reorderCount: reorderItems.length,
    };
  }, [items]);

  if (items.length === 0) {
    return (
      <div className="h-full flex flex-col items-center justify-center text-center px-4">
        <Package size={32} strokeWidth={1} color="#ddd" />
        <p className="text-[13px] text-[#777169] mt-3" style={{ letterSpacing: "0.14px" }}>
          장바구니가 비어있습니다
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4 pb-2">
      {/* ── 헤더 ── */}
      <div className="flex items-center gap-2.5">
        <div
          className="flex items-center justify-center w-9 h-9 shrink-0"
          style={{ borderRadius: "10px", backgroundColor: "rgba(245,242,239,0.8)", boxShadow: "rgba(0,0,0,0.075) 0px 0px 0px 0.5px inset" }}
        >
          <FileCheck size={17} strokeWidth={1.5} color="#000" />
        </div>
        <div className="min-w-0">
          <h2 className="text-[15px] font-semibold text-[#000]" style={{ letterSpacing: "-0.2px" }}>
            품의 요청 검토
          </h2>
          <p className="text-[11px] text-[#777169]" style={{ letterSpacing: "0.14px" }}>
            {totalItems}개 상품 · {formatPrice(totalPrice)}
          </p>
        </div>
      </div>

      {/* ── 자동 승인 배너 ── */}
      {isAutoApproval && (
        <div
          className="flex items-center gap-2 px-3 py-2.5"
          style={{
            borderRadius: "10px",
            backgroundColor: "rgba(245,242,239,0.8)",
            boxShadow: "rgba(0,0,0,0.075) 0px 0px 0px 0.5px inset",
          }}
        >
          <Zap size={14} strokeWidth={1.5} color="#000" />
          <div className="min-w-0">
            <p className="text-[12px] font-medium text-[#000]" style={{ letterSpacing: "0.14px" }}>
              자동 승인 대상
            </p>
            <p className="text-[10px] text-[#777169]" style={{ letterSpacing: "0.14px" }}>
              {formatPrice(autoApprovalLimit)} 이하 품의는 자동 승인됩니다
            </p>
          </div>
        </div>
      )}

      {/* ── 1. 주문 상품 ── */}
      <Section number={1} title="주문 상품" icon={Package}>
        <div className="flex flex-col">
          {items.map((item, i) => {
            const src = sourceStyles[item.product.source ?? ""] ?? sourceStyles["기타 플랫폼"];
            return (
              <div
                key={item.product.id}
                className="flex items-center gap-2.5 py-2"
                style={{ borderTop: i > 0 ? "1px solid rgba(0,0,0,0.05)" : undefined }}
              >
                <div
                  className="w-10 h-10 shrink-0 flex items-center justify-center text-[8px] text-[#777169]"
                  style={{ borderRadius: "8px", backgroundColor: "#f5f2ef" }}
                >
                  {item.product.brand}
                </div>
                <div className="flex-1 min-w-0">
                  {item.product.source && (
                    <div className="flex items-center gap-1 mb-0.5">
                      <span className="inline-block w-1.5 h-1.5 rounded-full" style={{ backgroundColor: src }} />
                      <span className="text-[9px] font-medium" style={{ color: src, letterSpacing: "0.14px" }}>
                        {item.product.source}
                      </span>
                    </div>
                  )}
                  <p className="text-[12px] font-medium text-[#000] leading-tight truncate" style={{ letterSpacing: "0.14px" }}>
                    {item.product.name}
                  </p>
                </div>
                <div className="text-right shrink-0">
                  <p className="text-[12px] font-semibold text-[#000]" style={{ letterSpacing: "-0.1px" }}>
                    {formatPrice(item.product.price * item.quantity)}
                  </p>
                  <p className="text-[10px] text-[#777169]" style={{ letterSpacing: "0.14px" }}>
                    {item.quantity}개
                  </p>
                </div>
              </div>
            );
          })}
          <div className="flex items-center justify-between pt-2.5 mt-1" style={{ borderTop: "1px solid rgba(0,0,0,0.08)" }}>
            <span className="text-[12px] text-[#4e4e4e]" style={{ letterSpacing: "0.14px" }}>합계</span>
            <span className="text-[15px] font-semibold text-[#000]" style={{ letterSpacing: "-0.2px" }}>
              {formatPrice(totalPrice)}
            </span>
          </div>
        </div>
      </Section>

      {/* ── 예산 실시간 체크 (에이전트 인사이트) ── */}
      <div
        className="px-4 py-3.5"
        style={{
          borderRadius: "14px",
          backgroundColor: "rgba(245,242,239,0.5)",
          boxShadow: "rgba(0,0,0,0.075) 0px 0px 0px 0.5px inset, rgba(78,50,23,0.04) 0px 6px 16px",
        }}
      >
        <div className="flex items-center gap-2 mb-3">
          <BarChart3 size={13} strokeWidth={1.5} color="#000" />
          <span
            className="text-[11px] font-bold uppercase text-[#4e4e4e]"
            style={{ fontFamily: "WaldenburgFH, 'WaldenburgFH Fallback', sans-serif", letterSpacing: "0.7px" }}
          >
            예산 실시간 체크
          </span>
          <span
            className="ml-auto inline-flex items-center gap-1 px-2 py-0.5 text-[10px] font-medium"
            style={{
              borderRadius: "9999px",
              backgroundColor: "#fff",
              color: budgetInsight.isOverBudget ? "#000" : "#4e4e4e",
              boxShadow: "rgba(0,0,0,0.075) 0px 0px 0px 0.5px inset",
              letterSpacing: "0.14px",
            }}
          >
            <Sparkles size={9} strokeWidth={2} />
            {budgetInsight.isOverBudget ? "초과" : budgetInsight.isWarning ? "주의" : "여유"}
          </span>
        </div>

        <div className="grid grid-cols-3 gap-2 mb-2.5">
          <BudgetCell label="월 예산" value={formatPrice(budgetInsight.monthlyBudget)} />
          <BudgetCell label="이번 달" value={formatPrice(budgetInsight.monthSpent)} />
          <BudgetCell
            label="잔여"
            value={formatPrice(budgetInsight.remaining)}
            highlight={budgetInsight.isOverBudget}
          />
        </div>

        {/* 프로그레스 */}
        <div className="mb-2">
          <div className="flex items-center justify-between mb-1">
            <span className="text-[10px] text-[#777169]" style={{ letterSpacing: "0.14px" }}>
              {currentUser.department} 사용률
            </span>
            <span className="text-[11px] font-semibold text-[#000]" style={{ letterSpacing: "0.14px" }}>
              {budgetInsight.usagePercent}%
            </span>
          </div>
          <div className="h-[4px] rounded-full overflow-hidden" style={{ backgroundColor: "rgba(0,0,0,0.08)" }}>
            <div className="h-full relative">
              <div
                className="absolute inset-y-0 left-0 transition-all"
                style={{ width: `${Math.min(budgetInsight.currentPercent, 100)}%`, backgroundColor: "#000" }}
              />
              <div
                className="absolute inset-y-0 transition-all"
                style={{
                  left: `${Math.min(budgetInsight.currentPercent, 100)}%`,
                  width: `${Math.max(0, Math.min(budgetInsight.usagePercent - budgetInsight.currentPercent, 100 - budgetInsight.currentPercent))}%`,
                  backgroundColor: "#777169",
                }}
              />
            </div>
          </div>
          <div className="flex items-center gap-2.5 mt-1.5">
            <LegendDot color="#000" label="기존 지출" />
            <LegendDot color="#777169" label="이번 구매" />
          </div>
        </div>

        <div
          className="flex items-center gap-2 px-2.5 py-2 mt-2"
          style={{
            borderRadius: "8px",
            backgroundColor: "#fff",
            boxShadow: "rgba(0,0,0,0.04) 0px 0px 0px 1px",
          }}
        >
          <p className="text-[11px] text-[#4e4e4e]" style={{ letterSpacing: "0.14px" }}>
            구매 후 잔여:{" "}
            <span className="font-semibold text-[#000]">{formatPrice(budgetInsight.afterPurchase)}</span>
          </p>
        </div>

        {budgetInsight.isOverBudget && (
          <div
            className="flex items-start gap-1.5 mt-2 px-2.5 py-2"
            style={{ borderRadius: "8px", boxShadow: "rgba(0,0,0,0.06) 0px 0px 0px 1px" }}
          >
            <AlertTriangle size={11} strokeWidth={1.5} color="#000" className="mt-0.5 shrink-0" />
            <p className="text-[10.5px] text-[#4e4e4e] leading-[1.5]" style={{ letterSpacing: "0.14px" }}>
              예산을 초과합니다. 승인 담당자의 별도 확인이 필요할 수 있습니다.
            </p>
          </div>
        )}
      </div>

      {/* ── 2. 요청자 / 승인자 ── */}
      <Section number={2} title="요청자 / 승인자" icon={User}>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <p className="text-[10px] text-[#777169] mb-1" style={{ letterSpacing: "0.14px" }}>요청자</p>
            <p className="text-[12px] font-medium text-[#000]" style={{ letterSpacing: "0.14px" }}>
              {currentUser.name}
            </p>
            <p className="text-[10px] text-[#777169]" style={{ letterSpacing: "0.14px" }}>
              {currentUser.department} · {currentUser.role}
            </p>
          </div>
          <div>
            <p className="text-[10px] text-[#777169] mb-1 flex items-center gap-1" style={{ letterSpacing: "0.14px" }}>
              <Building2 size={9} strokeWidth={1.5} /> 승인 담당
            </p>
            <p className="text-[12px] font-medium text-[#000]" style={{ letterSpacing: "0.14px" }}>
              {approver.name}
            </p>
            <p className="text-[10px] text-[#777169]" style={{ letterSpacing: "0.14px" }}>
              {approver.department} · {approver.role}
            </p>
          </div>
        </div>
      </Section>

      {/* ── 3. 배송지 ── */}
      <Section number={3} title="배송 정보" icon={MapPin}>
        <div className="relative mb-2.5">
          <button
            onClick={() => setAddressDropdownOpen((v) => !v)}
            className="w-full flex items-center justify-between px-3 py-2.5 text-left cursor-pointer transition-colors hover:bg-[rgba(245,242,239,0.6)]"
            style={{ borderRadius: "10px", boxShadow: "rgba(0,0,0,0.06) 0px 0px 0px 1px" }}
          >
            <div className="min-w-0">
              <p className="text-[12px] font-medium text-[#000] truncate" style={{ letterSpacing: "0.14px" }}>
                {selectedAddress.name}
              </p>
              <p className="text-[11px] text-[#4e4e4e] truncate mt-0.5" style={{ letterSpacing: "0.14px" }}>
                {selectedAddress.address}
              </p>
              <p className="text-[10px] text-[#777169] mt-0.5" style={{ letterSpacing: "0.14px" }}>
                {selectedAddress.receiver} · {selectedAddress.phone}
              </p>
            </div>
            <ChevronDown size={13} strokeWidth={1.5} color="#777169" className="shrink-0 ml-2" />
          </button>
          {addressDropdownOpen && (
            <div
              className="absolute left-0 top-full mt-1 w-full bg-white py-1 z-20 overflow-hidden"
              style={{
                borderRadius: "10px",
                boxShadow: "rgba(0,0,0,0.06) 0px 0px 0px 1px, rgba(0,0,0,0.08) 0px 8px 24px",
              }}
            >
              {addresses.map((a) => (
                <button
                  key={a.id}
                  onClick={() => { setSelectedAddressId(a.id); setAddressDropdownOpen(false); }}
                  className="w-full text-left px-3 py-2.5 cursor-pointer hover:bg-[rgba(245,242,239,0.6)] transition-colors"
                >
                  <div className="flex items-center gap-1.5">
                    <p className="text-[12px] font-medium text-[#000]" style={{ letterSpacing: "0.14px" }}>
                      {a.name}
                    </p>
                    {a.id === selectedAddressId && <Check size={11} strokeWidth={2} color="#000" />}
                  </div>
                  <p className="text-[11px] text-[#4e4e4e] mt-0.5" style={{ letterSpacing: "0.14px" }}>
                    {a.address}
                  </p>
                </button>
              ))}
            </div>
          )}
        </div>

        <input
          type="text"
          value={deliveryMessage}
          onChange={(e) => setDeliveryMessage(e.target.value)}
          placeholder="배송 메시지 (예: 경비실에 맡겨주세요)"
          className="w-full px-3 py-2.5 text-[12px] outline-none placeholder:text-[#b8b2a8]"
          style={{
            borderRadius: "10px",
            boxShadow: "rgba(0,0,0,0.06) 0px 0px 0px 1px",
            letterSpacing: "0.14px",
          }}
        />
      </Section>

      {/* ── 4. 품의 사유 ── */}
      <Section number={4} title="품의 요청 사유" icon={MessageSquare}>
        {aiReason && (
          <div
            className="px-3 py-3 mb-3"
            style={{
              borderRadius: "10px",
              backgroundColor: "rgba(245,242,239,0.8)",
              boxShadow: "rgba(0,0,0,0.075) 0px 0px 0px 0.5px inset",
            }}
          >
            <div className="flex items-center gap-1.5 mb-2">
              <Sparkles size={11} strokeWidth={1.5} color="#000" />
              <span
                className="text-[10px] font-bold uppercase text-[#4e4e4e]"
                style={{ fontFamily: "WaldenburgFH, 'WaldenburgFH Fallback', sans-serif", letterSpacing: "0.7px" }}
              >
                AI 자동 생성 사유
              </span>
            </div>

            <p className="text-[12px] font-medium text-[#000] leading-[1.6] mb-2" style={{ letterSpacing: "0.14px" }}>
              {aiReason.summary}
            </p>

            {aiReason.details.length > 0 && (
              <div className="flex flex-col gap-1 mb-2.5">
                {aiReason.details.map((line, idx) => (
                  <p
                    key={idx}
                    className="text-[11px] text-[#4e4e4e] leading-[1.5] pl-2"
                    style={{ borderLeft: "2px solid rgba(0,0,0,0.12)", letterSpacing: "0.14px" }}
                  >
                    {line}
                  </p>
                ))}
              </div>
            )}

            <div className="flex flex-wrap gap-1.5">
              {aiReason.reorderCount > 0 && (
                <InsightTag icon={RefreshCw}>재주문 {aiReason.reorderCount}건</InsightTag>
              )}
              {aiReason.newItemCount > 0 && (
                <InsightTag icon={Package}>신규 {aiReason.newItemCount}건</InsightTag>
              )}
              {aiReason.avgSaving < 0 && (
                <InsightTag icon={TrendingDown}>
                  시장가 대비 {Math.abs(Math.round(aiReason.avgSaving))}% 절감
                </InsightTag>
              )}
              {!budgetInsight.isOverBudget && (
                <InsightTag icon={ShieldCheck}>예산 범위 내</InsightTag>
              )}
            </div>
          </div>
        )}

        {/* 긴급도 */}
        <div className="mb-2.5">
          <label className="text-[10px] text-[#777169] mb-1.5 block" style={{ letterSpacing: "0.14px" }}>
            긴급도
          </label>
          <div className="inline-flex p-[3px]" style={{ borderRadius: "9999px", backgroundColor: "rgba(0,0,0,0.04)" }}>
            <UrgencyBtn active={urgency === "normal"} onClick={() => setUrgency("normal")}>
              <Clock size={11} strokeWidth={1.5} /> 일반
            </UrgencyBtn>
            <UrgencyBtn active={urgency === "urgent"} onClick={() => setUrgency("urgent")}>
              <AlertTriangle size={11} strokeWidth={1.5} /> 긴급
            </UrgencyBtn>
          </div>
        </div>

        {/* 메시지 */}
        <textarea
          value={approvalMessage}
          onChange={(e) => setApprovalMessage(e.target.value)}
          placeholder="승인자에게 전달할 메시지 (선택)"
          rows={3}
          className="w-full px-3 py-2.5 text-[12px] outline-none placeholder:text-[#b8b2a8] resize-none leading-[1.5]"
          style={{
            borderRadius: "10px",
            boxShadow: "rgba(0,0,0,0.06) 0px 0px 0px 1px",
            letterSpacing: "0.14px",
          }}
        />
      </Section>

      {/* ── 제출 버튼 ── */}
      <div className="mt-2">
        <button
          onClick={() =>
            onSubmit({
              isAutoApproval,
              addressId: selectedAddressId,
              urgency,
              message: approvalMessage,
              deliveryMessage,
            })
          }
          className="w-full flex items-center justify-center gap-2 py-3 text-[14px] font-semibold text-white bg-[#000] cursor-pointer transition-opacity hover:opacity-85"
          style={{ borderRadius: "12px", letterSpacing: "0.14px" }}
        >
          <FileCheck size={15} strokeWidth={1.5} />
          {isAutoApproval ? "품의 제출 (자동 승인)" : "품의 요청 제출"}
        </button>
        <p className="text-[10.5px] text-[#777169] text-center mt-2" style={{ letterSpacing: "0.14px" }}>
          {isAutoApproval
            ? "자동 승인 후 바로 결제 단계로 진행됩니다"
            : `${approver.name} ${approver.role}에게 승인 요청이 전송됩니다`}
        </p>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════
   Helpers
   ═══════════════════════════════════════ */

function Section({
  number,
  title,
  icon: Icon,
  children,
}: {
  number: number;
  title: string;
  icon: React.ComponentType<{ size?: number; strokeWidth?: number; color?: string }>;
  children: React.ReactNode;
}) {
  return (
    <div>
      <div className="flex items-center gap-2 mb-2 px-0.5">
        <span
          className="flex items-center justify-center w-[18px] h-[18px] rounded-full text-[9px] font-bold text-white bg-[#000]"
          style={{ letterSpacing: "0.14px" }}
        >
          {number}
        </span>
        <Icon size={13} strokeWidth={1.5} color="#4e4e4e" />
        <span className="text-[12px] font-semibold text-[#000]" style={{ letterSpacing: "0.14px" }}>
          {title}
        </span>
      </div>
      <div
        className="px-3.5 py-3"
        style={{
          borderRadius: "12px",
          backgroundColor: "#fff",
          boxShadow: "rgba(0,0,0,0.06) 0px 0px 0px 1px, rgba(0,0,0,0.04) 0px 1px 2px",
        }}
      >
        {children}
      </div>
    </div>
  );
}

function BudgetCell({ label, value, highlight }: { label: string; value: string; highlight?: boolean }) {
  return (
    <div>
      <p className="text-[9px] text-[#777169] mb-0.5" style={{ letterSpacing: "0.14px" }}>
        {label}
      </p>
      <p
        className="text-[12px] font-semibold truncate"
        style={{ color: highlight ? "#000" : "#4e4e4e", letterSpacing: "-0.1px" }}
      >
        {value}
      </p>
    </div>
  );
}

function LegendDot({ color, label }: { color: string; label: string }) {
  return (
    <span className="flex items-center gap-1 text-[9px] text-[#777169]" style={{ letterSpacing: "0.14px" }}>
      <span className="inline-block w-1.5 h-1.5 rounded-sm" style={{ backgroundColor: color }} />
      {label}
    </span>
  );
}

function InsightTag({
  icon: Icon,
  children,
}: {
  icon: React.ComponentType<{ size?: number; strokeWidth?: number; color?: string }>;
  children: React.ReactNode;
}) {
  return (
    <span
      className="inline-flex items-center gap-1 px-2 py-[3px] text-[10px] font-medium text-[#4e4e4e]"
      style={{
        borderRadius: "9999px",
        backgroundColor: "#fff",
        boxShadow: "rgba(0,0,0,0.06) 0px 0px 0px 1px",
        letterSpacing: "0.14px",
      }}
    >
      <Icon size={10} strokeWidth={2} color="#4e4e4e" />
      {children}
    </span>
  );
}

function UrgencyBtn({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className="px-3 py-[5px] text-[11px] font-medium cursor-pointer transition-all flex items-center gap-1"
      style={{
        borderRadius: "9999px",
        backgroundColor: active ? "#fff" : "transparent",
        color: active ? "#000" : "#777169",
        boxShadow: active ? "rgba(0,0,0,0.06) 0px 1px 3px, rgba(0,0,0,0.04) 0px 0px 0px 1px" : "none",
        letterSpacing: "0.14px",
      }}
    >
      {children}
    </button>
  );
}
