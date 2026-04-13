"use client";

import { useState } from "react";
import {
  Search, Package, Clock, Check, ChevronDown,
  MapPin, CreditCard, PiggyBank, Bot, Sparkles, FileText,
  TrendingDown, ShoppingCart, Loader2, Zap, ArrowRight,
} from "lucide-react";
import type { SourcedProduct } from "./SourcedProductCard";
import type { CartItem } from "@/components/commerce/CartPanel";

/* ═══════════════════════════════════════
   타입
   ═══════════════════════════════════════ */

export interface SearchRecord {
  id: string;
  query: string;
  timestamp: string;
  resultCount: number;
  sources: { name: string; count: number; color: string }[];
  products: { name: string; price: number; source: string }[];
}

export interface ContextInfo {
  budget: { monthly: number; used: number; department: string };
  shippingAddress: string;
  paymentMethod: string;
  agentMode: string;
  agentModeColor: string;
  recentOrders: number;
}

interface ChatContextSidebarProps {
  currentPhase: "idle" | "analyzing" | "searching" | "results" | "cart" | "approval" | "payment" | "shipping" | "complete";
  searchRecords: SearchRecord[];
  extractedProducts: SourcedProduct[];
  candidateProducts: SourcedProduct[];
  cart: CartItem[];
  context: ContextInfo;
  onProductClick?: (product: SourcedProduct) => void;
  onOpenFlow?: () => void;
}

/* ═══════════════════════════════════════
   진행 단계 정의
   ═══════════════════════════════════════ */

const phaseSteps = [
  { key: "analyzing", label: "의도 분석", icon: Sparkles },
  { key: "searching", label: "상품 검색", icon: Search },
  { key: "results", label: "추천 결과", icon: Package },
  { key: "cart", label: "장바구니", icon: ShoppingCart },
  { key: "approval", label: "품의 승인", icon: FileText },
  { key: "payment", label: "결제", icon: CreditCard },
  { key: "shipping", label: "배송", icon: MapPin },
  { key: "complete", label: "완료", icon: Check },
] as const;

const phaseOrder: string[] = phaseSteps.map((s) => s.key);

/* ═══════════════════════════════════════
   메인 컴포넌트 — 3개 상위 그룹
   ═══════════════════════════════════════ */

type GroupKey = "ongoing" | "conditions" | "reference";

export default function ChatContextSidebar({
  currentPhase,
  searchRecords,
  extractedProducts,
  candidateProducts,
  cart,
  context,
  onProductClick,
  onOpenFlow,
}: ChatContextSidebarProps) {
  const [openGroups, setOpenGroups] = useState<Record<GroupKey, boolean>>({
    ongoing: true,
    conditions: true,
    reference: false,
  });

  const toggle = (key: GroupKey) =>
    setOpenGroups((prev) => ({ ...prev, [key]: !prev[key] }));

  const currentPhaseIdx = phaseOrder.indexOf(currentPhase as string);
  const budgetPct = context.budget.monthly > 0
    ? Math.round((context.budget.used / context.budget.monthly) * 100)
    : 0;
  const budgetRemaining = context.budget.monthly - context.budget.used;
  const cartTotal = cart.reduce((s, i) => s + i.product.price * i.quantity, 0);
  const cartCount = cart.reduce((s, i) => s + i.quantity, 0);

  const hasSearch = searchRecords.length > 0;
  const hasProducts = extractedProducts.length > 0 || candidateProducts.length > 0;
  const hasCart = cart.length > 0;
  const showOngoingEmpty =
    currentPhase === "idle" && !hasSearch && !hasProducts && !hasCart;

  return (
    <div className="flex flex-col">
      {/* ════════════════════════════════════════
          Group 1: 진행 중 (휘발성) — 약한 보라 틴트
          ════════════════════════════════════════ */}
      <GroupSection
        title="진행 중"
        accent
        expanded={openGroups.ongoing}
        onToggle={() => toggle("ongoing")}
      >
        {showOngoingEmpty ? (
          <p className="text-[11px] text-[#aaa] py-2 px-1" style={{ letterSpacing: "0.14px" }}>
            구매 요청을 시작하면 여기에 표시됩니다
          </p>
        ) : (
          <div className="flex flex-col gap-4">
            {/* ── 진행 상황 ── */}
            {currentPhase !== "idle" && (
              <SubGroup
                title="진행 상황"
                rightAction={
                  onOpenFlow && (
                    <button
                      onClick={onOpenFlow}
                      className="inline-flex items-center gap-0.5 text-[10px] font-medium text-[#6366f1] cursor-pointer hover:underline"
                      style={{ letterSpacing: "0.14px" }}
                    >
                      상세보기
                      <ArrowRight size={10} strokeWidth={2} />
                    </button>
                  )
                }
              >
                <div className="flex flex-col gap-0.5">
                  {phaseSteps.map((step) => {
                    const stepIdx = phaseOrder.indexOf(step.key);
                    const isActive = step.key === currentPhase;
                    const isDone = stepIdx < currentPhaseIdx;
                    const Icon = step.icon;
                    const isClickable = isActive && !!onOpenFlow;

                    const dot = (
                      <div
                        className="w-4 h-4 shrink-0 flex items-center justify-center rounded-full"
                        style={{
                          backgroundColor: isDone
                            ? "#6366f1"
                            : isActive
                            ? "#6366f1"
                            : "rgba(0,0,0,0.05)",
                        }}
                      >
                        {isDone ? (
                          <Check size={9} strokeWidth={2.5} color="#fff" />
                        ) : isActive ? (
                          <Icon size={9} strokeWidth={2} color="#fff" />
                        ) : (
                          <Icon size={9} strokeWidth={1.5} color="#bbb" />
                        )}
                      </div>
                    );

                    const row = (
                      <>
                        {dot}
                        <span
                          className="text-[11px]"
                          style={{
                            color: isDone
                              ? "#6366f1"
                              : isActive
                              ? "#111"
                              : "#bbb",
                            fontWeight: isActive ? 600 : 400,
                            letterSpacing: "0.14px",
                          }}
                        >
                          {step.label}
                        </span>
                        {isActive && !isClickable && (
                          <Loader2
                            size={10}
                            strokeWidth={2}
                            color="#6366f1"
                            className="ml-auto animate-spin"
                          />
                        )}
                      </>
                    );

                    return isClickable ? (
                      <button
                        key={step.key}
                        onClick={onOpenFlow}
                        className="group flex items-center gap-2 py-1 px-1 -mx-1 cursor-pointer rounded-[6px] transition-colors hover:bg-[rgba(99,102,241,0.06)]"
                      >
                        {row}
                      </button>
                    ) : (
                      <div key={step.key} className="flex items-center gap-2 py-1">
                        {row}
                      </div>
                    );
                  })}
                </div>
              </SubGroup>
            )}

            {/* ── 추천 상품 ── */}
            {hasProducts && (
              <SubGroup
                title="추천 상품"
                count={extractedProducts.length + candidateProducts.length}
              >
                {extractedProducts.length > 0 && (
                  <div className={candidateProducts.length > 0 ? "mb-2" : ""}>
                    <MicroLabel>선정 · 채팅에서 추천</MicroLabel>
                    <div className="flex flex-col gap-1.5 mt-1.5">
                      {extractedProducts.map((p) => (
                        <ProductMiniCard
                          key={p.id}
                          product={p}
                          isSelected
                          onClick={() => onProductClick?.(p)}
                        />
                      ))}
                    </div>
                  </div>
                )}
                {candidateProducts.length > 0 && (
                  <div>
                    <MicroLabel>후보 · 추가 {candidateProducts.length}건 발견</MicroLabel>
                    <div className="flex flex-col gap-1.5 mt-1.5">
                      {candidateProducts.map((p) => (
                        <ProductMiniCard
                          key={p.id}
                          product={p}
                          isSelected={false}
                          onClick={() => onProductClick?.(p)}
                        />
                      ))}
                    </div>
                  </div>
                )}
              </SubGroup>
            )}

            {/* ── 검색 기록 ── */}
            {hasSearch && (
              <SubGroup title="검색 기록" count={searchRecords.length}>
                <div className="flex flex-col gap-1.5">
                  {searchRecords.map((record) => (
                    <div
                      key={record.id}
                      className="py-1.5 px-2"
                      style={{
                        borderRadius: "6px",
                        boxShadow: "rgba(0,0,0,0.04) 0px 0px 0px 1px",
                        backgroundColor: "#fff",
                      }}
                    >
                      <div className="flex items-start justify-between gap-2 mb-1">
                        <span
                          className="text-[11px] font-medium text-[#1a1a1a] leading-tight"
                          style={{ letterSpacing: "0.14px" }}
                        >
                          &ldquo;{record.query}&rdquo;
                        </span>
                        <span className="text-[10px] text-[#bbb] shrink-0">
                          {record.timestamp}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 text-[10px] text-[#999]">
                        <span>{record.resultCount}건</span>
                        <span className="text-[#e5e5e5]">·</span>
                        <span>
                          {record.sources.map((s) => `${s.name} ${s.count}`).join(" / ")}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </SubGroup>
            )}

            {/* ── 장바구니 (휘발성) ── */}
            {hasCart && (
              <SubGroup title="장바구니" count={cartCount}>
                <div className="flex flex-col gap-0.5">
                  {cart.map((item) => (
                    <div key={item.product.id} className="flex items-center justify-between py-0.5">
                      <span className="text-[11px] text-[#4e4e4e] truncate max-w-[150px]" style={{ letterSpacing: "0.14px" }}>
                        {item.product.name}
                      </span>
                      <span className="text-[11px] text-[#999] shrink-0 ml-2">×{item.quantity}</span>
                    </div>
                  ))}
                  <div className="flex items-center justify-between pt-1.5 mt-0.5"
                    style={{ borderTop: "1px solid rgba(0,0,0,0.05)" }}
                  >
                    <span className="text-[10px] text-[#999]" style={{ letterSpacing: "0.14px" }}>
                      합계
                    </span>
                    <span className="text-[12px] font-semibold text-[#111]" style={{ letterSpacing: "0.14px" }}>
                      {cartTotal.toLocaleString()}원
                    </span>
                  </div>
                </div>
              </SubGroup>
            )}
          </div>
        )}
      </GroupSection>

      {/* ════════════════════════════════════════
          Group 2: 구매 조건 (고정 전제)
          그룹 카드 내부에서 subtle divider로 분리된 flow
          ════════════════════════════════════════ */}
      <GroupSection
        title="구매 조건"
        expanded={openGroups.conditions}
        onToggle={() => toggle("conditions")}
      >
        <div className="flex flex-col">
          {/* ── 이번 달 예산 — 그룹 카드 내부 상단, 강조 블록 (자체 카드 아님) ── */}
          <div className="pb-3 mb-1" style={{ borderBottom: "1px solid rgba(0,0,0,0.05)" }}>
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-1.5">
                <PiggyBank size={12} strokeWidth={1.5} color="#777169" />
                <span
                  className="text-[10px] font-semibold uppercase text-[#4e4e4e]"
                  style={{ letterSpacing: "0.7px" }}
                >
                  이번 달 예산
                </span>
              </div>
              <span className="text-[10px] text-[#999]" style={{ letterSpacing: "0.14px" }}>
                {context.budget.department}
              </span>
            </div>

            {/* 큰 숫자 */}
            <div className="flex items-baseline gap-1 mb-2">
              <span
                className="text-[22px] font-semibold text-[#111]"
                style={{ letterSpacing: "-0.2px", lineHeight: 1 }}
              >
                {budgetPct}
              </span>
              <span className="text-[12px] text-[#777169]" style={{ letterSpacing: "0.14px" }}>
                %
              </span>
              <span className="ml-auto text-[11px] text-[#777169]" style={{ letterSpacing: "0.14px" }}>
                잔여 <span className="font-medium text-[#1a1a1a]">{budgetRemaining.toLocaleString()}원</span>
              </span>
            </div>

            {/* 진행바 */}
            <div className="h-[4px] bg-[rgba(0,0,0,0.06)] rounded-full overflow-hidden">
              <div
                className="h-full rounded-full transition-all"
                style={{
                  width: `${Math.min(budgetPct, 100)}%`,
                  backgroundColor:
                    budgetPct > 90 ? "#ef4444" : budgetPct > 70 ? "#f59e0b" : "#111",
                }}
              />
            </div>
            <p className="text-[10px] text-[#999] mt-1.5" style={{ letterSpacing: "0.14px" }}>
              {context.budget.used.toLocaleString()} / {context.budget.monthly.toLocaleString()}원
            </p>
          </div>

          {/* ── 배송지 · 결제수단 — 리스트 행 (사이 subtle divider) ── */}
          <ListRow icon={MapPin} label="배송지" value={context.shippingAddress} />
          <div className="mx-1" style={{ borderTop: "1px solid rgba(0,0,0,0.04)" }} />
          <ListRow icon={CreditCard} label="결제수단" value={context.paymentMethod} />

          {/* ── 에이전트 모드 — 카드 하단 메타 영역 ── */}
          <div
            className="flex items-center gap-1.5 px-1 pt-2.5 mt-1"
            style={{ borderTop: "1px solid rgba(0,0,0,0.05)" }}
          >
            <Bot size={11} strokeWidth={1.5} color="#999" />
            <span className="text-[10px] text-[#999]" style={{ letterSpacing: "0.14px" }}>
              에이전트 모드
            </span>
            <span
              className="ml-auto text-[10px] font-medium text-[#4e4e4e]"
              style={{ letterSpacing: "0.14px" }}
            >
              {context.agentMode}
            </span>
          </div>
        </div>
      </GroupSection>

      {/* ════════════════════════════════════════
          Group 3: 참고 (과거 기록)
          ════════════════════════════════════════ */}
      <GroupSection
        title="참고"
        expanded={openGroups.reference}
        onToggle={() => toggle("reference")}
        lastGroup
      >
        <ListRow
          icon={Clock}
          label="이번 달 주문"
          value={`${context.recentOrders}건`}
        />
      </GroupSection>
    </div>
  );
}

/* ═══════════════════════════════════════
   서브 컴포넌트
   ═══════════════════════════════════════ */

/* 상위 그룹 (3개): 헤더 + 접힘 가능 본문 카드
   — Claude Code 스타일: 본문 전체를 하나의 rounded 카드(shadow-as-border)로 묶어
     그룹이 "한 덩어리"로 인지되도록 함 */
function GroupSection({
  title,
  accent = false,
  expanded,
  onToggle,
  children,
  lastGroup = false,
}: {
  title: string;
  accent?: boolean;
  expanded: boolean;
  onToggle: () => void;
  children: React.ReactNode;
  lastGroup?: boolean;
}) {
  return (
    <section className={lastGroup ? "" : "mb-2.5"}>
      <button
        onClick={onToggle}
        className="w-full flex items-center gap-2 px-1 py-2 cursor-pointer text-left"
      >
        {accent && <Zap size={11} strokeWidth={1.75} color="#6366f1" />}
        <span
          className="text-[11px] font-semibold uppercase"
          style={{
            letterSpacing: "0.7px",
            color: accent ? "#6366f1" : "#4e4e4e",
          }}
        >
          {title}
        </span>
        <ChevronDown
          size={12}
          strokeWidth={1.5}
          color="#bbb"
          className="ml-auto transition-transform"
          style={{ transform: expanded ? "rotate(0)" : "rotate(-90deg)" }}
        />
      </button>

      {expanded && (
        <div
          className="px-3.5 py-3"
          style={{
            borderRadius: "12px",
            backgroundColor: accent ? "rgba(99,102,241,0.025)" : "#fff",
            boxShadow: accent
              ? "rgba(99,102,241,0.12) 0px 0px 0px 1px"
              : "rgba(0,0,0,0.06) 0px 0px 0px 1px",
          }}
        >
          {children}
        </div>
      )}
    </section>
  );
}

/* 그룹 내부 서브섹션 — 헤더만 있는 라벨 */
function SubGroup({
  title,
  count,
  rightAction,
  children,
}: {
  title: string;
  count?: number;
  rightAction?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div>
      <div className="flex items-center gap-1.5 mb-2 px-0.5">
        <span
          className="text-[10px] font-semibold uppercase text-[#777169]"
          style={{ letterSpacing: "0.7px" }}
        >
          {title}
        </span>
        {count != null && count > 0 && (
          <span
            className="text-[9px] font-medium text-[#999]"
            style={{ letterSpacing: "0.14px" }}
          >
            {count}
          </span>
        )}
        {rightAction && <span className="ml-auto">{rightAction}</span>}
      </div>
      {children}
    </div>
  );
}

/* 마이크로 라벨 (상품 선정/후보 구분용) */
function MicroLabel({ children }: { children: React.ReactNode }) {
  return (
    <span
      className="text-[9px] font-medium text-[#999] uppercase"
      style={{ letterSpacing: "0.7px" }}
    >
      {children}
    </span>
  );
}

/* 리스트 행 (아이콘 + 라벨 + 값) — 구매 조건·참고 그룹용 */
function ListRow({
  icon: Icon,
  label,
  value,
}: {
  icon: React.ComponentType<{ size?: number; strokeWidth?: number; color?: string; className?: string }>;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-start gap-2 px-1 py-2">
      <Icon size={13} strokeWidth={1.5} color="#777169" className="mt-[2px] shrink-0" />
      <div className="flex-1 min-w-0">
        <p className="text-[10px] text-[#999] mb-0.5" style={{ letterSpacing: "0.14px" }}>
          {label}
        </p>
        <p
          className="text-[12px] text-[#1a1a1a] leading-[1.4]"
          style={{ letterSpacing: "0.14px" }}
        >
          {value}
        </p>
      </div>
    </div>
  );
}

/* ── 상품 미니 카드 (선정/후보 공용) ── */

const sourceColors: Record<string, string> = {
  "airsupply-db": "#6366f1",
  "airsupply-supplier": "#059669",
  "api-external": "#ea580c",
};
const sourceLabels: Record<string, string> = {
  "airsupply-db": "에어서플라이",
  "airsupply-supplier": "입점 공급사",
  "api-external": "외부 마켓",
};

function ProductMiniCard({
  product,
  isSelected,
  onClick,
}: {
  product: SourcedProduct;
  isSelected: boolean;
  onClick: () => void;
}) {
  const color = sourceColors[product.source] ?? "#999";

  return (
    <button
      onClick={onClick}
      className="text-left p-2 cursor-pointer transition-all group"
      style={{
        borderRadius: "8px",
        backgroundColor: "#fff",
        boxShadow: isSelected
          ? "rgba(99,102,241,0.2) 0px 0px 0px 1px"
          : "rgba(0,0,0,0.05) 0px 0px 0px 1px",
        opacity: isSelected ? 1 : 0.88,
      }}
    >
      <div className="flex items-center gap-1.5 mb-1">
        <span
          className="w-1.5 h-1.5 rounded-full shrink-0"
          style={{ backgroundColor: color }}
        />
        <span className="text-[10px] font-medium" style={{ color, letterSpacing: "0.14px" }}>
          {sourceLabels[product.source] ?? product.source}
        </span>
        {isSelected && product.isRecommended && (
          <span
            className="text-[8px] px-1 py-[1px] bg-[#6366f1] text-white font-bold"
            style={{ borderRadius: "3px", letterSpacing: "0.14px" }}
          >
            추천
          </span>
        )}
      </div>

      <p
        className="text-[11px] font-medium truncate mb-0.5"
        style={{ color: isSelected ? "#1a1a1a" : "#777169", letterSpacing: "0.14px" }}
      >
        {product.name}
      </p>

      <div className="flex items-center gap-2">
        <span
          className="text-[11px] font-semibold"
          style={{ color: isSelected ? "#111" : "#555", letterSpacing: "0.14px" }}
        >
          {product.price.toLocaleString()}원
        </span>
        {product.savingsPercent && (
          <span className="flex items-center gap-0.5 text-[9px] text-[#4e4e4e] font-medium">
            <TrendingDown size={8} strokeWidth={2} />{product.savingsPercent}%↓
          </span>
        )}
      </div>

      <div className="flex items-center gap-1.5 mt-0.5">
        {product.deliveryDays != null && (
          <span className="text-[9px] text-[#999]" style={{ letterSpacing: "0.14px" }}>
            {product.deliveryDays}일 · {product.deliveryFee === 0 ? "무료" : `${(product.deliveryFee ?? 0).toLocaleString()}원`}
          </span>
        )}
        {product.purchaseCount != null && product.purchaseCount > 0 && (
          <span className="text-[9px] text-[#bbb]">·{product.purchaseCount}회 구매</span>
        )}
      </div>

      {product.aiNote && (
        <p
          className="text-[9px] text-[#aaa] mt-1 leading-[1.4] line-clamp-2 group-hover:text-[#777169] transition-colors"
          style={{ letterSpacing: "0.14px" }}
        >
          {product.aiNote}
        </p>
      )}
    </button>
  );
}
