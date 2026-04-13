"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import {
  ChevronLeft, FileCheck, User, Building2, MapPin, MessageSquare,
  ChevronDown, Check, Zap, Clock, AlertTriangle, Truck, Package,
  Sparkles, TrendingDown, BarChart3, RefreshCw, ShieldCheck, ArrowRight,
} from "lucide-react";
import { useCart } from "@/lib/cart-context";
import { useAgentPolicy } from "@/lib/agent-policy-context";
import { currentUser, users } from "@/data/users";
import { orders } from "@/data/orders";

/* ─── 배송지 더미 ─── */
const addresses = [
  { id: "addr-1", name: "본사 3층", address: "서울시 강남구 테헤란로 152, 7층", receiver: "박은서", phone: "02-555-1234" },
  { id: "addr-2", name: "본사 5층 마케팅팀", address: "서울시 강남구 테헤란로 152, 5층", receiver: "이준호", phone: "02-555-5678" },
  { id: "addr-3", name: "물류센터", address: "경기도 성남시 분당구 판교로 256", receiver: "김태환", phone: "031-789-1000" },
];

/* ─── 소싱처 스타일 ─── */
const sourceStyles: Record<string, { color: string }> = {
  "쿠팡": { color: "#e44d2e" },
  "SmartStore": { color: "#03c75a" },
  "오늘의집": { color: "#35c5f0" },
  "기타 플랫폼": { color: "#999" },
};

/* ─── 승인자 자동 판별 ─── */
function getApprover() {
  const approver = users.find(
    (u) => u.id !== currentUser.id && u.permissions.canApprove
  );
  return approver ?? users[0];
}

function formatPrice(n: number) {
  return n.toLocaleString("ko-KR") + "원";
}

/* ═══════════════════════════════════════
   품의 요청 페이지
   ═══════════════════════════════════════ */

export default function ApprovalRequestPage() {
  const router = useRouter();
  const cart = useCart();
  const { policy } = useAgentPolicy();

  /* 폼 상태 */
  const [selectedAddressId, setSelectedAddressId] = useState(addresses[0].id);
  const [addressDropdownOpen, setAddressDropdownOpen] = useState(false);
  const [deliveryMessage, setDeliveryMessage] = useState("");
  const [approvalMessage, setApprovalMessage] = useState("");
  const [urgency, setUrgency] = useState<"normal" | "urgent">("normal");
  const [submitted, setSubmitted] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  const selectedAddress = addresses.find((a) => a.id === selectedAddressId) ?? addresses[0];
  const approver = getApprover();
  const totalPrice = cart.totalPrice;
  const totalItems = cart.totalItems;
  const isAutoApproval = totalPrice <= policy.autoApprovalLimit && policy.autoApprovalLimit > 0;

  /* ─── 예산 실시간 체크 ─── */
  const budgetInsight = useMemo(() => {
    // 부서별 월 예산 (더미 — 실제는 설정에서 관리)
    const deptBudgets: Record<string, number> = {
      "경영지원": 15000000,
      "마케팅": 8000000,
      "디자인": 6000000,
      "개발": 10000000,
    };
    const monthlyBudget = deptBudgets[currentUser.department] ?? 10000000;

    // 이번 달 지출 계산 (orders 기준, 반려 제외)
    const now = new Date();
    const thisMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
    const monthSpent = orders
      .filter(
        (o) =>
          o.orderedAt.startsWith(thisMonth) &&
          o.status !== "반려" &&
          o.orderedBy === currentUser.id
      )
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
    if (cart.items.length === 0) return null;

    const categories = [...new Set(cart.items.map((i) => i.product.category))];

    // 재주문 분석: 기존 주문과 매칭
    const reorderItems = cart.items.filter((item) =>
      orders.some((o) => o.productId === item.product.id)
    );
    const newItems = cart.items.filter(
      (item) => !orders.some((o) => o.productId === item.product.id)
    );

    // 재주문 주기 분석
    const reorderAnalysis = reorderItems.map((item) => {
      const pastOrders = orders
        .filter((o) => o.productId === item.product.id)
        .sort((a, b) => new Date(b.orderedAt).getTime() - new Date(a.orderedAt).getTime());
      const lastOrder = pastOrders[0];
      const daysSince = lastOrder
        ? Math.round((Date.now() - new Date(lastOrder.orderedAt).getTime()) / (1000 * 60 * 60 * 24))
        : null;
      const isRecurring = pastOrders.some((o) => o.isRecurring);
      return { product: item.product, quantity: item.quantity, lastOrder, daysSince, isRecurring, orderCount: pastOrders.length };
    });

    // 가격 벤치마크 (더미: 시장 평균 대비 %)
    const benchmarks = cart.items.map((item) => {
      // 시뮬레이션: -12% ~ +5% 범위로 시장가 대비 평가
      const seed = item.product.id.charCodeAt(item.product.id.length - 1);
      const diff = ((seed % 17) - 12); // -12 ~ +4
      return { product: item.product, diffPercent: diff };
    });
    const avgSaving = benchmarks.reduce((s, b) => s + b.diffPercent, 0) / benchmarks.length;

    // 사유 문장 생성
    const lines: string[] = [];

    // 1) 요약 헤드라인
    lines.push(`${currentUser.department} ${currentUser.name}님의 ${categories.join("·")} 구매 요청입니다.`);

    // 2) 재주문 분석
    if (reorderAnalysis.length > 0) {
      const recurring = reorderAnalysis.filter((r) => r.isRecurring);
      if (recurring.length > 0) {
        lines.push(`정기 구매 품목 ${recurring.length}건이 포함되어 있으며, 적정 재주문 시점에 해당합니다.`);
      }
      reorderAnalysis.forEach((r) => {
        if (r.daysSince !== null) {
          lines.push(`"${r.product.name}" — 최근 ${r.daysSince}일 전 주문, 총 ${r.orderCount}회 구매 이력.`);
        }
      });
    }

    // 3) 신규 품목
    if (newItems.length > 0) {
      lines.push(`신규 구매 품목 ${newItems.length}건: ${newItems.map((i) => i.product.name).join(", ")}.`);
    }

    // 4) 가격 경쟁력
    if (avgSaving < 0) {
      lines.push(`시장 평균가 대비 약 ${Math.abs(Math.round(avgSaving))}% 절감된 가격으로 소싱되었습니다.`);
    }

    return {
      summary: lines[0],
      details: lines.slice(1),
      reorderAnalysis,
      benchmarks,
      avgSaving,
      newItemCount: newItems.length,
      reorderCount: reorderItems.length,
    };
  }, [cart.items]);

  const showToast = (msg: string) => { setToast(msg); setTimeout(() => setToast(null), 3000); };

  const handleSubmit = () => {
    setSubmitted(true);
    showToast(isAutoApproval ? "자동 승인되었습니다" : "품의가 요청되었습니다");
  };

  /* 빈 장바구니 */
  if (cart.items.length === 0 && !submitted) {
    return (
      <div className="h-full flex flex-col items-center justify-center">
        <Package size={40} strokeWidth={1} color="#ddd" />
        <p className="text-[14px] text-[#999] mt-3">장바구니가 비어있습니다</p>
        <button
          onClick={() => router.push("/folders")}
          className="mt-4 px-4 py-2 text-[13px] font-medium text-[#555] bg-[#f5f5f5] rounded-lg cursor-pointer hover:bg-[#eee]"
        >
          상품 폴더로 이동
        </button>
      </div>
    );
  }

  return (
    <div className="h-full overflow-y-auto">
      <div className="max-w-[680px] mx-auto px-6 py-6">

        {/* 뒤로가기 */}
        <button
          onClick={() => router.push("/folders")}
          className="flex items-center gap-1.5 mb-5 text-[13px] text-[#777] cursor-pointer transition-colors hover:text-[#333] group"
        >
          <ChevronLeft size={15} strokeWidth={1.5} className="transition-transform group-hover:-translate-x-0.5" />
          장바구니로 돌아가기
        </button>

        {/* 제목 */}
        <div className="flex items-center gap-3 mb-6">
          <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-[#f5f5f5]">
            <FileCheck size={20} strokeWidth={1.5} color="#333" />
          </div>
          <div>
            <h1 className="text-[20px] font-semibold" style={{ letterSpacing: "-0.3px" }}>품의 요청</h1>
            <p className="text-[13px] text-[#999]">{totalItems}개 상품 · {formatPrice(totalPrice)}</p>
          </div>
        </div>

        {/* ── 자동승인 배너 ── */}
        {isAutoApproval && !submitted && (
          <div
            className="flex items-center gap-2.5 px-4 py-3 mb-6"
            style={{ borderRadius: "12px", backgroundColor: "rgba(34,197,94,0.06)" }}
          >
            <Zap size={16} strokeWidth={1.5} color="#22c55e" />
            <div>
              <p className="text-[13px] font-medium text-[#16a34a]">자동 승인 대상</p>
              <p className="text-[11px] text-[#22c55e] opacity-70">
                {formatPrice(policy.autoApprovalLimit)} 이하 품의는 자동으로 승인됩니다
              </p>
            </div>
          </div>
        )}

        {/* ── 제출 완료 상태 ── */}
        {submitted ? (
          <SubmittedView
            isAutoApproval={isAutoApproval}
            approverName={`${approver.name} ${approver.role}`}
            totalPrice={totalPrice}
            onGoToOrders={() => router.push("/orders")}
            onGoToChat={() => router.push("/chat")}
          />
        ) : (
          <>
            {/* ── 1. 주문 상품 ── */}
            <Section number={1} title="주문 상품" icon={Package}>
              <div className="flex flex-col gap-0">
                {cart.items.map((item, i) => {
                  const src = sourceStyles[item.product.source ?? ""] ?? sourceStyles["기타 플랫폼"];
                  return (
                    <div
                      key={item.product.id}
                      className="flex items-center gap-3 py-3"
                      style={{ borderBottom: i < cart.items.length - 1 ? "1px solid rgba(0,0,0,0.04)" : undefined }}
                    >
                      <div
                        className="w-12 h-12 shrink-0 bg-[#f8f8f8] rounded-lg flex items-center justify-center text-[9px] text-[#bbb]"
                      >
                        {item.product.brand}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5 mb-0.5">
                          {item.product.source && (
                            <>
                              <span className="inline-block w-1.5 h-1.5 rounded-full" style={{ backgroundColor: src.color }} />
                              <span className="text-[10px] font-medium" style={{ color: src.color }}>{item.product.source}</span>
                            </>
                          )}
                        </div>
                        <p className="text-[13px] text-[#333] font-medium leading-tight truncate">{item.product.name}</p>
                      </div>
                      <div className="text-right shrink-0">
                        <p className="text-[13px] font-semibold">{formatPrice(item.product.price * item.quantity)}</p>
                        <p className="text-[11px] text-[#999]">{item.quantity}개</p>
                      </div>
                    </div>
                  );
                })}
                {/* 합계 */}
                <div className="flex items-center justify-between pt-3 mt-1">
                  <span className="text-[13px] text-[#777]">합계</span>
                  <span className="text-[17px] font-bold" style={{ letterSpacing: "-0.3px" }}>{formatPrice(totalPrice)}</span>
                </div>
              </div>
            </Section>

            {/* ── 예산 실시간 체크 (에이전트 인사이트) ── */}
            <div
              className="mb-6 px-5 py-4"
              style={{
                borderRadius: "14px",
                background: budgetInsight.isOverBudget
                  ? "linear-gradient(135deg, rgba(239,68,68,0.04) 0%, rgba(239,68,68,0.02) 100%)"
                  : budgetInsight.isWarning
                    ? "linear-gradient(135deg, rgba(245,158,11,0.04) 0%, rgba(245,158,11,0.02) 100%)"
                    : "linear-gradient(135deg, rgba(99,102,241,0.04) 0%, rgba(99,102,241,0.02) 100%)",
                boxShadow: budgetInsight.isOverBudget
                  ? "rgba(239,68,68,0.12) 0px 0px 0px 1px"
                  : budgetInsight.isWarning
                    ? "rgba(245,158,11,0.12) 0px 0px 0px 1px"
                    : "rgba(99,102,241,0.08) 0px 0px 0px 1px",
              }}
            >
              {/* 헤더 */}
              <div className="flex items-center gap-2 mb-3">
                <div
                  className="flex items-center justify-center w-6 h-6 rounded-lg"
                  style={{
                    backgroundColor: budgetInsight.isOverBudget ? "rgba(239,68,68,0.1)" : budgetInsight.isWarning ? "rgba(245,158,11,0.1)" : "rgba(99,102,241,0.1)",
                  }}
                >
                  <BarChart3
                    size={13}
                    strokeWidth={1.5}
                    color={budgetInsight.isOverBudget ? "#ef4444" : budgetInsight.isWarning ? "#f59e0b" : "#6366f1"}
                  />
                </div>
                <span className="text-[13px] font-semibold text-[#333]">예산 실시간 체크</span>
                <span
                  className="ml-auto text-[10px] font-medium px-2 py-0.5 rounded-full flex items-center gap-1"
                  style={{
                    backgroundColor: budgetInsight.isOverBudget ? "rgba(239,68,68,0.08)" : budgetInsight.isWarning ? "rgba(245,158,11,0.08)" : "rgba(34,197,94,0.08)",
                    color: budgetInsight.isOverBudget ? "#ef4444" : budgetInsight.isWarning ? "#f59e0b" : "#22c55e",
                  }}
                >
                  <Sparkles size={10} strokeWidth={2} />
                  {budgetInsight.isOverBudget ? "예산 초과" : budgetInsight.isWarning ? "예산 주의" : "예산 여유"}
                </span>
              </div>

              {/* 예산 수치 */}
              <div className="grid grid-cols-3 gap-3 mb-3">
                <div>
                  <p className="text-[10px] text-[#999] mb-0.5">월 예산</p>
                  <p className="text-[14px] font-semibold text-[#333]">{formatPrice(budgetInsight.monthlyBudget)}</p>
                </div>
                <div>
                  <p className="text-[10px] text-[#999] mb-0.5">이번 달 지출</p>
                  <p className="text-[14px] font-semibold text-[#333]">{formatPrice(budgetInsight.monthSpent)}</p>
                </div>
                <div>
                  <p className="text-[10px] text-[#999] mb-0.5">잔여 예산</p>
                  <p
                    className="text-[14px] font-semibold"
                    style={{ color: budgetInsight.isOverBudget ? "#ef4444" : budgetInsight.isWarning ? "#f59e0b" : "#333" }}
                  >
                    {formatPrice(budgetInsight.remaining)}
                  </p>
                </div>
              </div>

              {/* 프로그레스 바 */}
              <div className="mb-2">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[10px] text-[#999]">{currentUser.department} 4월 예산 사용률</span>
                  <span
                    className="text-[11px] font-semibold"
                    style={{ color: budgetInsight.isOverBudget ? "#ef4444" : budgetInsight.isWarning ? "#f59e0b" : "#6366f1" }}
                  >
                    {budgetInsight.usagePercent}%
                  </span>
                </div>
                <div className="w-full h-2 bg-[#f0f0f0] overflow-hidden" style={{ borderRadius: "4px" }}>
                  {/* 기존 지출 */}
                  <div className="h-full relative">
                    <div
                      className="absolute inset-y-0 left-0 transition-all"
                      style={{
                        width: `${Math.min(budgetInsight.currentPercent, 100)}%`,
                        backgroundColor: budgetInsight.isWarning ? "#f59e0b" : "#6366f1",
                        borderRadius: "4px 0 0 4px",
                      }}
                    />
                    {/* 이번 구매분 */}
                    <div
                      className="absolute inset-y-0 transition-all"
                      style={{
                        left: `${Math.min(budgetInsight.currentPercent, 100)}%`,
                        width: `${Math.min(budgetInsight.usagePercent - budgetInsight.currentPercent, 100 - budgetInsight.currentPercent)}%`,
                        backgroundColor: budgetInsight.isOverBudget ? "#ef4444" : budgetInsight.isWarning ? "#fbbf24" : "#818cf8",
                        borderRadius: budgetInsight.usagePercent >= 100 ? "0 4px 4px 0" : "0",
                        opacity: 0.6,
                      }}
                    />
                  </div>
                </div>
                <div className="flex items-center gap-3 mt-1.5">
                  <span className="flex items-center gap-1 text-[10px] text-[#999]">
                    <span className="inline-block w-2 h-2 rounded-sm" style={{ backgroundColor: budgetInsight.isWarning ? "#f59e0b" : "#6366f1" }} />
                    기존 지출
                  </span>
                  <span className="flex items-center gap-1 text-[10px] text-[#999]">
                    <span className="inline-block w-2 h-2 rounded-sm" style={{ backgroundColor: budgetInsight.isOverBudget ? "#ef4444" : "#818cf8", opacity: 0.6 }} />
                    이번 구매
                  </span>
                </div>
              </div>

              {/* 구매 후 잔여 */}
              <div
                className="flex items-center gap-2.5 px-3 py-2.5 mt-3"
                style={{
                  borderRadius: "8px",
                  backgroundColor: budgetInsight.isOverBudget ? "rgba(239,68,68,0.06)" : "rgba(0,0,0,0.02)",
                }}
              >
                <ArrowRight size={12} strokeWidth={1.5} color={budgetInsight.isOverBudget ? "#ef4444" : "#999"} />
                <p className="text-[12px] text-[#555]">
                  이번 구매({formatPrice(totalPrice)}) 후 잔여 예산:{" "}
                  <span className="font-semibold" style={{ color: budgetInsight.isOverBudget ? "#ef4444" : budgetInsight.isWarning ? "#f59e0b" : "#333" }}>
                    {formatPrice(budgetInsight.afterPurchase)}
                  </span>
                </p>
              </div>

              {budgetInsight.isOverBudget && (
                <div className="flex items-start gap-2 mt-2.5 px-3 py-2" style={{ borderRadius: "8px", backgroundColor: "rgba(239,68,68,0.04)" }}>
                  <AlertTriangle size={12} strokeWidth={1.5} color="#ef4444" className="mt-0.5 shrink-0" />
                  <p className="text-[11px] text-[#ef4444] leading-[1.5]">
                    예산을 초과합니다. 승인 담당자의 별도 확인이 필요할 수 있습니다.
                  </p>
                </div>
              )}
            </div>

            {/* ── 2. 요청자 정보 ── */}
            <Section number={2} title="요청자 정보" icon={User}>
              <div className="grid grid-cols-2 gap-x-6 gap-y-3">
                <InfoField label="이름" value={currentUser.name} />
                <InfoField label="이메일" value={currentUser.email} />
                <InfoField label="부서" value={currentUser.department} />
                <InfoField label="역할" value={currentUser.role} />
              </div>
            </Section>

            {/* ── 3. 승인자 정보 ── */}
            <Section number={3} title="승인 담당자" icon={Building2}>
              <div className="flex items-center gap-3 p-3" style={{ borderRadius: "10px", backgroundColor: "#fafafa" }}>
                <div className="w-9 h-9 rounded-full bg-[#eee] flex items-center justify-center text-[12px] font-semibold text-[#555]">
                  {approver.name.slice(0, 1)}
                </div>
                <div className="flex-1">
                  <p className="text-[13px] font-medium text-[#333]">{approver.name}</p>
                  <p className="text-[11px] text-[#999]">{approver.department} · {approver.role}</p>
                </div>
                {isAutoApproval && (
                  <span className="text-[11px] font-medium text-[#22c55e] bg-[rgba(34,197,94,0.08)] px-2 py-0.5 rounded-full">
                    자동승인
                  </span>
                )}
              </div>
            </Section>

            {/* ── 4. 배송 정보 ── */}
            <Section number={4} title="배송 정보" icon={MapPin}>
              {/* 배송지 선택 */}
              <div className="mb-4">
                <label className="text-[12px] text-[#999] mb-1.5 block">배송지</label>
                <div className="relative">
                  <button
                    onClick={() => setAddressDropdownOpen(!addressDropdownOpen)}
                    className="w-full flex items-center justify-between px-4 py-3 text-left cursor-pointer transition-colors hover:bg-[#fafafa]"
                    style={{ borderRadius: "10px", boxShadow: "rgba(0,0,0,0.06) 0px 0px 0px 1px" }}
                  >
                    <div>
                      <p className="text-[13px] font-medium text-[#333]">{selectedAddress.name}</p>
                      <p className="text-[12px] text-[#777] mt-0.5">{selectedAddress.address}</p>
                      <p className="text-[11px] text-[#bbb] mt-0.5">{selectedAddress.receiver} · {selectedAddress.phone}</p>
                    </div>
                    <ChevronDown size={14} strokeWidth={1.5} color="#999" className="shrink-0" />
                  </button>
                  {addressDropdownOpen && (
                    <div
                      className="absolute left-0 top-full mt-1 w-full bg-white py-1 z-20"
                      style={{ borderRadius: "10px", boxShadow: "rgba(0,0,0,0.06) 0px 0px 0px 1px, rgba(0,0,0,0.08) 0px 4px 16px" }}
                    >
                      {addresses.map((a) => (
                        <button
                          key={a.id}
                          onClick={() => { setSelectedAddressId(a.id); setAddressDropdownOpen(false); }}
                          className="w-full text-left px-4 py-3 cursor-pointer hover:bg-[#f8f8f8] transition-colors"
                          style={{ borderBottom: "1px solid rgba(0,0,0,0.03)" }}
                        >
                          <div className="flex items-center gap-2">
                            <p className="text-[13px] font-medium text-[#333]">{a.name}</p>
                            {a.id === selectedAddressId && <Check size={13} strokeWidth={2} color="#22c55e" />}
                          </div>
                          <p className="text-[12px] text-[#777] mt-0.5">{a.address}</p>
                          <p className="text-[11px] text-[#bbb] mt-0.5">{a.receiver} · {a.phone}</p>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* 배송 메시지 */}
              <div>
                <label className="text-[12px] text-[#999] mb-1.5 block">배송 메시지</label>
                <input
                  type="text"
                  value={deliveryMessage}
                  onChange={(e) => setDeliveryMessage(e.target.value)}
                  placeholder="예: 경비실에 맡겨주세요"
                  className="w-full px-4 py-3 text-[13px] outline-none placeholder:text-[#ccc]"
                  style={{ borderRadius: "10px", boxShadow: "rgba(0,0,0,0.06) 0px 0px 0px 1px" }}
                />
              </div>
            </Section>

            {/* ── 5. 품의 요청 사유 ── */}
            <Section number={5} title="품의 요청 사유" icon={MessageSquare}>
              {/* AI 자동 생성 품의 사유 */}
              {aiReason && (
                <div
                  className="mb-4 px-4 py-4"
                  style={{
                    borderRadius: "12px",
                    background: "linear-gradient(135deg, rgba(99,102,241,0.05) 0%, rgba(139,92,246,0.03) 100%)",
                    boxShadow: "rgba(99,102,241,0.08) 0px 0px 0px 1px",
                  }}
                >
                  {/* 헤더 */}
                  <div className="flex items-center gap-2 mb-3">
                    <div className="flex items-center justify-center w-5 h-5 rounded-md" style={{ backgroundColor: "rgba(99,102,241,0.1)" }}>
                      <Sparkles size={11} strokeWidth={1.5} color="#6366f1" />
                    </div>
                    <span className="text-[12px] font-semibold text-[#6366f1]">AI 자동 생성 품의 사유</span>
                  </div>

                  {/* 요약 */}
                  <p className="text-[13px] text-[#333] font-medium leading-[1.6] mb-2.5">
                    {aiReason.summary}
                  </p>

                  {/* 상세 근거 */}
                  <div className="flex flex-col gap-1.5 mb-3">
                    {aiReason.details.map((line, idx) => (
                      <p key={idx} className="text-[12px] text-[#555] leading-[1.6] pl-2" style={{ borderLeft: "2px solid rgba(99,102,241,0.15)" }}>
                        {line}
                      </p>
                    ))}
                  </div>

                  {/* 인사이트 뱃지들 */}
                  <div className="flex flex-wrap gap-2 mt-2">
                    {aiReason.reorderCount > 0 && (
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 text-[10px] font-medium rounded-full" style={{ backgroundColor: "rgba(34,197,94,0.08)", color: "#16a34a" }}>
                        <RefreshCw size={10} strokeWidth={2} />
                        재주문 {aiReason.reorderCount}건
                      </span>
                    )}
                    {aiReason.newItemCount > 0 && (
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 text-[10px] font-medium rounded-full" style={{ backgroundColor: "rgba(59,130,246,0.08)", color: "#3b82f6" }}>
                        <Package size={10} strokeWidth={2} />
                        신규 {aiReason.newItemCount}건
                      </span>
                    )}
                    {aiReason.avgSaving < 0 && (
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 text-[10px] font-medium rounded-full" style={{ backgroundColor: "rgba(99,102,241,0.08)", color: "#6366f1" }}>
                        <TrendingDown size={10} strokeWidth={2} />
                        시장가 대비 {Math.abs(Math.round(aiReason.avgSaving))}% 절감
                      </span>
                    )}
                    {!budgetInsight.isOverBudget && (
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 text-[10px] font-medium rounded-full" style={{ backgroundColor: "rgba(34,197,94,0.08)", color: "#16a34a" }}>
                        <ShieldCheck size={10} strokeWidth={2} />
                        예산 범위 내
                      </span>
                    )}
                  </div>
                </div>
              )}

              {/* 긴급도 */}
              <div className="mb-3">
                <label className="text-[12px] text-[#999] mb-1.5 block">긴급도</label>
                <div className="inline-flex p-[3px]" style={{ borderRadius: "10px", backgroundColor: "#f0f0f0" }}>
                  <button
                    onClick={() => setUrgency("normal")}
                    className="px-4 py-[6px] text-[12px] font-medium cursor-pointer transition-all flex items-center gap-1.5"
                    style={{
                      borderRadius: "8px",
                      backgroundColor: urgency === "normal" ? "#fff" : "transparent",
                      color: urgency === "normal" ? "#333" : "#999",
                      boxShadow: urgency === "normal" ? "rgba(0,0,0,0.06) 0px 1px 3px" : "none",
                    }}
                  >
                    <Clock size={12} strokeWidth={1.5} /> 일반
                  </button>
                  <button
                    onClick={() => setUrgency("urgent")}
                    className="px-4 py-[6px] text-[12px] font-medium cursor-pointer transition-all flex items-center gap-1.5"
                    style={{
                      borderRadius: "8px",
                      backgroundColor: urgency === "urgent" ? "#fff" : "transparent",
                      color: urgency === "urgent" ? "#ef4444" : "#999",
                      boxShadow: urgency === "urgent" ? "rgba(0,0,0,0.06) 0px 1px 3px" : "none",
                    }}
                  >
                    <AlertTriangle size={12} strokeWidth={1.5} /> 긴급
                  </button>
                </div>
              </div>

              {/* 메시지 */}
              <div>
                <label className="text-[12px] text-[#999] mb-1.5 block">추가 메시지 (선택)</label>
                <textarea
                  value={approvalMessage}
                  onChange={(e) => setApprovalMessage(e.target.value)}
                  placeholder="승인자에게 전달할 사유나 참고사항을 입력하세요"
                  rows={3}
                  className="w-full px-4 py-3 text-[13px] outline-none placeholder:text-[#ccc] resize-none leading-[1.6]"
                  style={{ borderRadius: "10px", boxShadow: "rgba(0,0,0,0.06) 0px 0px 0px 1px" }}
                />
              </div>
            </Section>

            {/* ── 제출 버튼 ── */}
            <div className="mt-8 mb-6">
              <button
                onClick={handleSubmit}
                className="w-full flex items-center justify-center gap-2 py-[14px] text-[15px] font-semibold text-white bg-[#1a1a1a] cursor-pointer transition-opacity hover:opacity-80"
                style={{ borderRadius: "14px" }}
              >
                <FileCheck size={18} strokeWidth={1.5} />
                {isAutoApproval ? "품의 제출 (자동 승인)" : "품의 요청 제출"}
              </button>
              <p className="text-[11px] text-[#bbb] text-center mt-2.5">
                {isAutoApproval
                  ? "자동 승인 후 바로 결제 단계로 진행됩니다"
                  : `${approver.name} ${approver.role}에게 승인 요청이 전송됩니다`}
              </p>
            </div>
          </>
        )}
      </div>

      {/* Toast */}
      {toast && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[60] flex items-center gap-2 px-4 py-2.5 bg-[#1a1a1a] text-white text-[13px] font-medium" style={{ borderRadius: "10px", boxShadow: "rgba(0,0,0,0.2) 0px 4px 12px" }}>
          <Check size={14} strokeWidth={2} />{toast}
        </div>
      )}
    </div>
  );
}

/* ═══════════════════════════════════════
   섹션 래퍼
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
    <div className="mb-6">
      <div className="flex items-center gap-2.5 mb-3">
        <span
          className="flex items-center justify-center w-5 h-5 rounded-full text-[10px] font-bold text-white bg-[#111]"
        >
          {number}
        </span>
        <Icon size={15} strokeWidth={1.5} color="#555" />
        <span className="text-[14px] font-semibold text-[#333]">{title}</span>
      </div>
      <div
        className="px-5 py-4"
        style={{ borderRadius: "14px", boxShadow: "rgba(0,0,0,0.04) 0px 0px 0px 1px", backgroundColor: "#fff" }}
      >
        {children}
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════
   정보 필드
   ═══════════════════════════════════════ */

function InfoField({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-[11px] text-[#999] mb-0.5">{label}</p>
      <p className="text-[13px] text-[#333] font-medium">{value}</p>
    </div>
  );
}

/* ═══════════════════════════════════════
   제출 완료 뷰
   ═══════════════════════════════════════ */

function SubmittedView({
  isAutoApproval,
  approverName,
  totalPrice,
  onGoToOrders,
  onGoToChat,
}: {
  isAutoApproval: boolean;
  approverName: string;
  totalPrice: number;
  onGoToOrders: () => void;
  onGoToChat: () => void;
}) {
  return (
    <div className="flex flex-col items-center text-center py-10">
      <div
        className="w-16 h-16 rounded-full flex items-center justify-center mb-5"
        style={{ backgroundColor: isAutoApproval ? "rgba(34,197,94,0.1)" : "rgba(0,0,0,0.04)" }}
      >
        {isAutoApproval ? (
          <Zap size={28} strokeWidth={1.5} color="#22c55e" />
        ) : (
          <Clock size={28} strokeWidth={1.5} color="#555" />
        )}
      </div>

      <h2 className="text-[20px] font-semibold mb-2" style={{ letterSpacing: "-0.3px" }}>
        {isAutoApproval ? "자동 승인 완료" : "품의 요청 완료"}
      </h2>
      <p className="text-[14px] text-[#777] leading-[1.6] mb-1">
        {isAutoApproval
          ? `${formatPrice(totalPrice)} 구매가 자동 승인되었습니다.`
          : `${approverName}에게 승인 요청이 전송되었습니다.`}
      </p>
      <p className="text-[13px] text-[#bbb] mb-8">
        {isAutoApproval
          ? "결제 단계로 진행할 수 있습니다."
          : "승인 결과는 알림으로 안내드립니다."}
      </p>

      <div className="flex items-center gap-3">
        <button
          onClick={onGoToOrders}
          className="px-5 py-[10px] text-[13px] font-medium text-[#555] bg-[#f5f5f5] rounded-xl cursor-pointer hover:bg-[#eee] transition-colors"
        >
          주문 내역 보기
        </button>
        <button
          onClick={onGoToChat}
          className="px-5 py-[10px] text-[13px] font-medium text-white bg-[#1a1a1a] rounded-xl cursor-pointer hover:opacity-80 transition-opacity"
        >
          {isAutoApproval ? "결제 진행하기" : "채팅으로 이동"}
        </button>
      </div>
    </div>
  );
}
