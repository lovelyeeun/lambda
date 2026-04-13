"use client";

import { useState } from "react";
import {
  Search, Database, Building2, Globe, Package, Clock,
  Check, ChevronDown, ChevronRight, MapPin, CreditCard,
  PiggyBank, Bot, Sparkles, FileText, ExternalLink,
  TrendingDown, ShoppingCart, Eye, Loader2, Zap, ArrowRight,
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
  /* 진행상황 */
  currentPhase: "idle" | "analyzing" | "searching" | "results" | "cart" | "approval" | "payment" | "shipping" | "complete";
  /* 검색기록 */
  searchRecords: SearchRecord[];
  /* 채팅에서 추천한 선정 상품 */
  extractedProducts: SourcedProduct[];
  /* 추가 발견된 후보 상품 */
  candidateProducts: SourcedProduct[];
  /* 장바구니 */
  cart: CartItem[];
  /* 컨텍스트 */
  context: ContextInfo;
  /* 콜백 */
  onProductClick?: (product: SourcedProduct) => void;
  /* 플로우 상세 패널 열기 (flowActive일 때만 전달) */
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
   컴포넌트
   ═══════════════════════════════════════ */

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
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
    progress: true,
    search: true,
    extracted: true,
    context: true,
  });

  const toggleSection = (key: string) => {
    setExpandedSections((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const currentPhaseIdx = phaseOrder.indexOf(currentPhase as string);
  const budgetPct = context.budget.monthly > 0 ? Math.round((context.budget.used / context.budget.monthly) * 100) : 0;
  const budgetRemaining = context.budget.monthly - context.budget.used;

  return (
    <div className="flex flex-col">
      <div className="flex flex-col">
        {/* ═══ 1. 진행상황 ═══ */}
        <SectionHeader
          title="진행상황"
          icon={<Zap size={12} strokeWidth={1.5} color="#6366f1" />}
          expanded={expandedSections.progress}
          onToggle={() => toggleSection("progress")}
          rightAction={
            onOpenFlow ? (
              <button
                onClick={(e) => { e.stopPropagation(); onOpenFlow(); }}
                className="inline-flex items-center gap-0.5 px-1.5 py-[2px] text-[10px] font-medium text-[#6366f1] cursor-pointer transition-colors hover:bg-[rgba(99,102,241,0.08)]"
                style={{ borderRadius: "6px", letterSpacing: "0.14px" }}
              >
                상세보기
                <ArrowRight size={10} strokeWidth={2} />
              </button>
            ) : undefined
          }
        />
        {expandedSections.progress && (
          <div className="px-1 pt-2 pb-3">
            {currentPhase === "idle" ? (
              <p className="text-[11px] text-[#bbb] py-2">구매 요청을 시작하면 진행 상태가 여기에 표시됩니다</p>
            ) : (
              <div className="flex flex-col gap-0.5">
                {phaseSteps.map((step, i) => {
                  const stepIdx = phaseOrder.indexOf(step.key);
                  const isActive = step.key === currentPhase;
                  const isDone = stepIdx < currentPhaseIdx;
                  const isFuture = stepIdx > currentPhaseIdx;
                  const Icon = step.icon;
                  const isClickable = isActive && !!onOpenFlow;

                  const rowContent = (
                    <>
                      <div
                        className="w-5 h-5 shrink-0 flex items-center justify-center rounded-full"
                        style={{
                          backgroundColor: isDone ? "#22c55e" : isActive ? "#6366f1" : "rgba(0,0,0,0.04)",
                        }}
                      >
                        {isDone ? (
                          <Check size={10} strokeWidth={2.5} color="#fff" />
                        ) : isActive ? (
                          <Icon size={10} strokeWidth={2} color="#fff" />
                        ) : (
                          <Icon size={10} strokeWidth={1.5} color="#ccc" />
                        )}
                      </div>
                      <span
                        className="text-[11px]"
                        style={{
                          color: isDone ? "#22c55e" : isActive ? "#6366f1" : "#ccc",
                          fontWeight: isActive ? 600 : isDone ? 500 : 400,
                        }}
                      >
                        {step.label}
                      </span>
                      {isActive && !isClickable && (
                        <span className="ml-auto">
                          <Loader2 size={10} strokeWidth={2} color="#6366f1" className="animate-spin" />
                        </span>
                      )}
                      {isClickable && (
                        <span className="ml-auto inline-flex items-center gap-1 text-[10px] font-medium text-[#6366f1] opacity-0 group-hover:opacity-100 transition-opacity">
                          상세보기
                          <ArrowRight size={10} strokeWidth={2} />
                        </span>
                      )}
                    </>
                  );

                  return isClickable ? (
                    <button
                      key={step.key}
                      onClick={onOpenFlow}
                      className="group flex items-center gap-2.5 py-[5px] px-1.5 -mx-1.5 cursor-pointer transition-colors hover:bg-[rgba(99,102,241,0.06)]"
                      style={{ borderRadius: "6px" }}
                    >
                      {rowContent}
                    </button>
                  ) : (
                    <div key={step.key} className="flex items-center gap-2.5 py-[5px]">
                      {rowContent}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* ═══ 2. 검색 기록 ═══ */}
        <SectionHeader
          title="검색 기록"
          icon={<Search size={12} strokeWidth={1.5} color="#ea580c" />}
          expanded={expandedSections.search}
          onToggle={() => toggleSection("search")}
          count={searchRecords.length}
        />
        {expandedSections.search && (
          <div className="px-1 pt-2 pb-3">
            {searchRecords.length === 0 ? (
              <p className="text-[11px] text-[#bbb] py-2">검색 기록이 없습니다</p>
            ) : (
              <div className="flex flex-col gap-2">
                {searchRecords.map((record) => (
                  <div
                    key={record.id}
                    className="p-2.5"
                    style={{ borderRadius: "10px", backgroundColor: "#fff", boxShadow: "rgba(0,0,0,0.04) 0px 0px 0px 1px" }}
                  >
                    <div className="flex items-start justify-between mb-1.5">
                      <span className="text-[12px] font-medium text-[#333] leading-tight">
                        &ldquo;{record.query}&rdquo;
                      </span>
                      <span className="text-[10px] text-[#bbb] shrink-0 ml-2">{record.timestamp}</span>
                    </div>

                    {/* 소스별 결과 */}
                    <div className="flex gap-1 mb-1.5 flex-wrap">
                      {record.sources.map((src) => (
                        <span
                          key={src.name}
                          className="inline-flex items-center gap-0.5 px-1.5 py-[2px] text-[9px] font-medium"
                          style={{ borderRadius: "4px", backgroundColor: `${src.color}10`, color: src.color }}
                        >
                          {src.name} {src.count}건
                        </span>
                      ))}
                    </div>

                    {/* 추출 상품 */}
                    <div className="flex flex-col gap-0.5">
                      {record.products.slice(0, 3).map((p, i) => (
                        <div key={i} className="flex items-center justify-between">
                          <span className="text-[10px] text-[#666] truncate max-w-[140px]">{p.name}</span>
                          <span className="text-[10px] font-medium text-[#333]">{p.price.toLocaleString()}원</span>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ═══ 3. 추출 정보 — 선정 상품 + 후보 상품 ═══ */}
        {(extractedProducts.length > 0 || candidateProducts.length > 0) && (
          <>
            <SectionHeader
              title="추출 정보"
              icon={<Database size={12} strokeWidth={1.5} color="#059669" />}
              expanded={expandedSections.extracted}
              onToggle={() => toggleSection("extracted")}
              count={extractedProducts.length + candidateProducts.length}
            />
            {expandedSections.extracted && (
              <div className="px-1 pt-2 pb-3">
                {/* ── 선정 상품 ── */}
                {extractedProducts.length > 0 && (
                  <div className="mb-3">
                    <div className="flex items-center gap-1.5 mb-2">
                      <span className="w-1 h-3 rounded-full bg-[#6366f1]" />
                      <span className="text-[10px] font-bold text-[#6366f1] uppercase tracking-wider">선정 상품</span>
                      <span className="text-[9px] text-[#bbb]">— 채팅에서 추천</span>
                    </div>
                    <div className="flex flex-col gap-1.5">
                      {extractedProducts.map((product) => (
                        <ProductMiniCard
                          key={product.id}
                          product={product}
                          isSelected
                          onClick={() => onProductClick?.(product)}
                        />
                      ))}
                    </div>
                  </div>
                )}

                {/* ── 후보 상품 ── */}
                {candidateProducts.length > 0 && (
                  <div>
                    <div className="flex items-center gap-1.5 mb-2">
                      <span className="w-1 h-3 rounded-full bg-[#d4d4d4]" />
                      <span className="text-[10px] font-bold text-[#999] uppercase tracking-wider">후보 상품</span>
                      <span className="text-[9px] text-[#bbb]">— 추가 {candidateProducts.length}건 발견</span>
                    </div>
                    <div className="flex flex-col gap-1.5">
                      {candidateProducts.map((product) => (
                        <ProductMiniCard
                          key={product.id}
                          product={product}
                          isSelected={false}
                          onClick={() => onProductClick?.(product)}
                        />
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </>
        )}

        {/* ═══ 4. 채팅 컨텍스트 (Work Item 무관 공통) ═══ */}
        <SectionHeader
          title="채팅 컨텍스트"
          icon={<Bot size={12} strokeWidth={1.5} color="#333" />}
          expanded={expandedSections.context}
          onToggle={() => toggleSection("context")}
        />
        {expandedSections.context && (
          <div className="px-1 pt-2 pb-2">
            <div className="flex flex-col gap-2.5">
              {/* 예산 */}
              <ContextCard icon={<PiggyBank size={13} strokeWidth={1.5} color="#f59e0b" />} title="이번 달 예산">
                <div className="mb-1">
                  <div className="flex items-center justify-between text-[10px] mb-1">
                    <span className="text-[#999]">{context.budget.department}</span>
                    <span className="font-medium text-[#333]">{budgetPct}%</span>
                  </div>
                  <div className="h-[4px] bg-[#f0f0f0] rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all"
                      style={{
                        width: `${Math.min(budgetPct, 100)}%`,
                        backgroundColor: budgetPct > 90 ? "#ef4444" : budgetPct > 70 ? "#f59e0b" : "#22c55e",
                      }}
                    />
                  </div>
                </div>
                <div className="flex justify-between text-[10px]">
                  <span className="text-[#999]">잔여 {budgetRemaining.toLocaleString()}원</span>
                  <span className="text-[#bbb]">/ {context.budget.monthly.toLocaleString()}원</span>
                </div>
              </ContextCard>

              {/* 배송지 */}
              <ContextCard icon={<MapPin size={13} strokeWidth={1.5} color="#3b82f6" />} title="배송지">
                <p className="text-[11px] text-[#555]">{context.shippingAddress}</p>
              </ContextCard>

              {/* 결제수단 */}
              <ContextCard icon={<CreditCard size={13} strokeWidth={1.5} color="#8b5cf6" />} title="결제수단">
                <p className="text-[11px] text-[#555]">{context.paymentMethod}</p>
              </ContextCard>

              {/* 에이전트 모드 */}
              <ContextCard icon={<Bot size={13} strokeWidth={1.5} color={context.agentModeColor} />} title="에이전트 모드">
                <span
                  className="inline-flex items-center gap-1 px-1.5 py-[2px] text-[10px] font-medium"
                  style={{ borderRadius: "4px", backgroundColor: `${context.agentModeColor}14`, color: context.agentModeColor }}
                >
                  {context.agentMode}
                </span>
              </ContextCard>

              {/* 장바구니 요약 */}
              {cart.length > 0 && (
                <ContextCard icon={<ShoppingCart size={13} strokeWidth={1.5} color="#111" />} title="장바구니">
                  <div className="flex flex-col gap-0.5">
                    {cart.map((item) => (
                      <div key={item.product.id} className="flex items-center justify-between">
                        <span className="text-[10px] text-[#666] truncate max-w-[120px]">{item.product.name}</span>
                        <span className="text-[10px] font-medium text-[#333]">×{item.quantity}</span>
                      </div>
                    ))}
                    <div className="mt-1 pt-1 flex items-center justify-between" style={{ borderTop: "1px solid rgba(0,0,0,0.04)" }}>
                      <span className="text-[10px] text-[#999]">합계</span>
                      <span className="text-[11px] font-semibold text-[#111]">
                        {cart.reduce((s, i) => s + i.product.price * i.quantity, 0).toLocaleString()}원
                      </span>
                    </div>
                  </div>
                </ContextCard>
              )}

              {/* 최근 주문 */}
              <ContextCard icon={<Clock size={13} strokeWidth={1.5} color="#999" />} title="최근 주문">
                <p className="text-[11px] text-[#555]">이번 달 {context.recentOrders}건</p>
              </ContextCard>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════
   서브 컴포넌트
   ═══════════════════════════════════════ */

function SectionHeader({
  title,
  icon,
  expanded,
  onToggle,
  count,
  badge,
  badgeColor,
  rightAction,
}: {
  title: string;
  icon: React.ReactNode;
  expanded: boolean;
  onToggle: () => void;
  count?: number;
  badge?: string;
  badgeColor?: string;
  rightAction?: React.ReactNode;
}) {
  return (
    <div
      className="w-full flex items-center gap-2 px-1 py-2.5 transition-colors hover:bg-[#f5f2ef]/40"
      style={{ borderBottom: "1px solid rgba(0,0,0,0.04)", borderRadius: "4px" }}
    >
      <button
        onClick={onToggle}
        className="flex items-center gap-2 flex-1 min-w-0 text-left cursor-pointer"
      >
      {icon}
      <span
        className="text-[12px] font-medium text-[#000]"
        style={{ letterSpacing: "0.14px" }}
      >
        {title}
      </span>
      {count != null && count > 0 && (
        <span className="text-[9px] font-medium px-1.5 py-[1px] bg-[#f0f0f0] text-[#999]" style={{ borderRadius: "4px" }}>
          {count}
        </span>
      )}
      {badge && badgeColor && (
        <span
          className="text-[9px] font-medium px-1.5 py-[1px]"
          style={{ borderRadius: "4px", backgroundColor: `${badgeColor}14`, color: badgeColor }}
        >
          {badge}
        </span>
      )}
      </button>
      {rightAction && <div className="shrink-0">{rightAction}</div>}
      <button
        onClick={onToggle}
        className="shrink-0 flex items-center justify-center cursor-pointer"
        aria-label={expanded ? "접기" : "펼치기"}
      >
        <ChevronDown
          size={12} strokeWidth={1.5} color="#bbb"
          className="transition-transform"
          style={{ transform: expanded ? "rotate(0)" : "rotate(-90deg)" }}
        />
      </button>
    </div>
  );
}

function ContextCard({
  icon,
  title,
  children,
}: {
  icon: React.ReactNode;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div
      className="p-2.5"
      style={{ borderRadius: "10px", backgroundColor: "#fff", boxShadow: "rgba(0,0,0,0.04) 0px 0px 0px 1px" }}
    >
      <div className="flex items-center gap-1.5 mb-1.5">
        {icon}
        <span className="text-[10px] font-semibold text-[#999] uppercase tracking-wider">{title}</span>
      </div>
      {children}
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
          ? "rgba(99,102,241,0.12) 0px 0px 0px 1px"
          : "rgba(0,0,0,0.04) 0px 0px 0px 1px",
        opacity: isSelected ? 1 : 0.85,
      }}
    >
      {/* 소스 라벨 + 뱃지 */}
      <div className="flex items-center gap-1.5 mb-1">
        <span
          className="w-1.5 h-1.5 rounded-full shrink-0"
          style={{ backgroundColor: color }}
        />
        <span className="text-[10px] font-medium" style={{ color }}>
          {sourceLabels[product.source] ?? product.source}
        </span>
        {isSelected && product.isRecommended && (
          <span
            className="text-[8px] px-1 py-[1px] bg-[#6366f1] text-white font-bold"
            style={{ borderRadius: "3px" }}
          >
            추천
          </span>
        )}
        {isSelected && (
          <span
            className="text-[8px] px-1 py-[1px] font-bold ml-auto"
            style={{ borderRadius: "3px", backgroundColor: "rgba(99,102,241,0.08)", color: "#6366f1" }}
          >
            선정
          </span>
        )}
      </div>

      {/* 이름 */}
      <p
        className="text-[11px] font-medium truncate mb-0.5"
        style={{ color: isSelected ? "#333" : "#777" }}
      >
        {product.name}
      </p>

      {/* 가격 행 */}
      <div className="flex items-center gap-2">
        <span
          className="text-[11px] font-semibold"
          style={{ color: isSelected ? "#111" : "#555" }}
        >
          {product.price.toLocaleString()}원
        </span>
        {product.savingsPercent && (
          <span className="flex items-center gap-0.5 text-[9px] text-[#22c55e] font-medium">
            <TrendingDown size={8} strokeWidth={2} />{product.savingsPercent}%↓
          </span>
        )}
      </div>

      {/* 배송 + AI 한줄 */}
      <div className="flex items-center gap-1.5 mt-0.5">
        {product.deliveryDays != null && (
          <span className="text-[9px] text-[#999]">
            {product.deliveryDays}일 · {product.deliveryFee === 0 ? "무료" : `${(product.deliveryFee ?? 0).toLocaleString()}원`}
          </span>
        )}
        {product.purchaseCount != null && product.purchaseCount > 0 && (
          <span className="text-[9px] text-[#bbb]">·{product.purchaseCount}회 구매</span>
        )}
      </div>

      {/* AI 메모 (후보 상품에서는 왜 탈락했는지의 힌트 역할) */}
      {product.aiNote && (
        <p className="text-[9px] text-[#aaa] mt-1 leading-[1.4] line-clamp-2 group-hover:text-[#777] transition-colors">
          {product.aiNote}
        </p>
      )}
    </button>
  );
}
