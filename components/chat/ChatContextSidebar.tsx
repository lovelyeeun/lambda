"use client";

import { useState, useRef, useEffect } from "react";
import {
  Search, Package, Check, ChevronDown,
  MapPin, CreditCard, PiggyBank, Bot, Sparkles, FileText,
  TrendingDown, ShoppingCart, Zap, ArrowRight, ArrowUpRight,
  ShieldCheck, Unlock, Info,
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
  /** 승인 정책 — 승인체계 pill 호버 팝오버 내용 */
  approvalPolicy?: {
    autoApproveLimit: number;    // 원
    canDirectPurchase: boolean;
    aiRestricted: boolean;
  };
  /** 에이전트 정책 — 에이전트 정책 pill 호버 팝오버 내용 */
  agentPolicy?: {
    description: string;
    agents: string[];
  };
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
  /** 플로우 진행 상태에 확인하지 않은 변화가 있을 때 "진행 상황" 섹션에 알림 dot 표시 */
  progressNotification?: boolean;
  /** 외부 페이지 점프 핸들러 — 각각 /cost-intel / settings(deep link) 로 연결 */
  onOpenBudget?: () => void;
  onOpenShipping?: () => void;
  onOpenPayment?: () => void;
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

type GroupKey = "ongoing" | "settings";

export default function ChatContextSidebar({
  currentPhase,
  searchRecords,
  extractedProducts,
  candidateProducts,
  cart,
  context,
  onProductClick,
  onOpenFlow,
  progressNotification = false,
  onOpenBudget,
  onOpenShipping,
  onOpenPayment,
}: ChatContextSidebarProps) {
  const [openGroups, setOpenGroups] = useState<Record<GroupKey, boolean>>({
    ongoing: true,
    settings: true,
  });
  const [detailOpen, setDetailOpen] = useState(false);
  /** 과거(완료) 단계의 인라인 상세를 수동으로 펼쳤는지 추적 */
  const [expandedPastSteps, setExpandedPastSteps] = useState<Record<string, boolean>>({});
  const togglePastStep = (key: string) =>
    setExpandedPastSteps((prev) => ({ ...prev, [key]: !prev[key] }));

  const toggle = (key: GroupKey) =>
    setOpenGroups((prev) => ({ ...prev, [key]: !prev[key] }));

  const currentPhaseIdx = phaseOrder.indexOf(currentPhase as string);
  const budgetPct = context.budget.monthly > 0
    ? Math.round((context.budget.used / context.budget.monthly) * 100)
    : 0;
  const budgetRemaining = context.budget.monthly - context.budget.used;
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
            채팅에 구매와 관련된 질문을 입력해보세요. 진행상황이 표시됩니다
          </p>
        ) : (
          <div className="flex flex-col gap-4">
            {/* ── 진행 상황 ── */}
            {currentPhase !== "idle" && (
              <SubGroup
                title="진행 상황"
                titleBadge={
                  progressNotification ? (
                    <span
                      className="w-1.5 h-1.5 shrink-0"
                      style={{
                        borderRadius: "9999px",
                        backgroundColor: "#ef4444",
                        boxShadow: "rgba(239,68,68,0.3) 0px 0px 0px 2px",
                      }}
                      aria-label="확인하지 않은 진행 상황 변화"
                    />
                  ) : undefined
                }
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
                          // 현재 단계를 두꺼운 링으로 강조 (스피너 대체)
                          boxShadow: isActive
                            ? "rgba(99,102,241,0.25) 0px 0px 0px 3px"
                            : undefined,
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
                        {isActive && isClickable && (
                          <span
                            className="ml-auto inline-flex items-center gap-0.5 text-[10px] font-medium text-[#6366f1] opacity-0 group-hover:opacity-100 transition-opacity"
                            style={{ letterSpacing: "0.14px" }}
                          >
                            상세보기
                            <ArrowRight size={10} strokeWidth={2} />
                          </span>
                        )}
                      </>
                    );

                    const stepNode = isClickable ? (
                      <button
                        onClick={onOpenFlow}
                        className="group flex items-center gap-2 py-1.5 px-2 -mx-1 cursor-pointer rounded-[6px] transition-colors w-full"
                        style={{
                          backgroundColor: "rgba(99,102,241,0.06)",
                        }}
                      >
                        {row}
                      </button>
                    ) : (
                      <div
                        className="flex items-center gap-2 py-1.5 px-2 -mx-1 rounded-[6px]"
                        style={{
                          backgroundColor: isActive ? "rgba(99,102,241,0.06)" : undefined,
                        }}
                      >
                        {row}
                      </div>
                    );

                    /* ── 단계별 인라인 상세 블록 ──
                       활성 단계: 기본 펼침
                       과거(완료) 단계: 기본 접힘, 클릭으로 토글 가능 */
                    const hasStepDetail =
                      (step.key === "searching" && hasSearch) ||
                      (step.key === "results" && hasProducts) ||
                      (step.key === "cart" && hasCart);
                    const showDetail = hasStepDetail && (isActive || !!expandedPastSteps[step.key]);
                    // 과거 단계에 접힌 상세가 있으면 요약 한 줄 표시
                    const showCollapsedHint = hasStepDetail && isDone && !expandedPastSteps[step.key];

                    return (
                      <div key={step.key} className="flex flex-col">
                        {stepNode}

                        {/* 접힌 과거 단계 — 클릭으로 펼칠 수 있는 요약 힌트 */}
                        {showCollapsedHint && (
                          <button
                            onClick={() => togglePastStep(step.key)}
                            className="ml-8 mt-0.5 mb-0.5 text-[10px] text-[#b8b2a8] cursor-pointer hover:text-[#777169] transition-colors text-left"
                            style={{ letterSpacing: "0.14px" }}
                          >
                            {step.key === "searching" && `검색 ${searchRecords.length}건 ▾`}
                            {step.key === "results" && `추천 ${extractedProducts.length + candidateProducts.length}건 ▾`}
                            {step.key === "cart" && `${cart.length}종 · ${cart.reduce((s, i) => s + i.quantity, 0)}개 ▾`}
                          </button>
                        )}

                        {/* 펼쳐진 상세 블록 — 활성이거나 수동 펼침 */}
                        {showDetail && (
                          <div className="mt-1 ml-5 mb-1.5">
                            {/* 과거 단계면 접기 버튼 */}
                            {isDone && (
                              <button
                                onClick={() => togglePastStep(step.key)}
                                className="text-[10px] text-[#b8b2a8] cursor-pointer hover:text-[#777169] mb-1.5 transition-colors"
                                style={{ letterSpacing: "0.14px" }}
                              >
                                접기 ▴
                              </button>
                            )}

                            {/* 검색 기록 — "상품 검색" 단계 */}
                            {step.key === "searching" && hasSearch && (
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
                            )}

                            {/* 추천 상품 — "추천 결과" 단계 */}
                            {step.key === "results" && hasProducts && (
                              <div className="flex flex-col gap-2">
                                {extractedProducts.length > 0 && (
                                  <div>
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
                              </div>
                            )}

                            {/* 장바구니 — "장바구니" 단계 */}
                            {step.key === "cart" && hasCart && (
                              <button
                                onClick={onOpenFlow}
                                disabled={!onOpenFlow}
                                className="group/cart text-left w-full px-3 py-2.5 transition-all cursor-pointer hover:bg-[rgba(245,242,239,0.6)] disabled:cursor-default disabled:hover:bg-transparent"
                                style={{
                                  borderRadius: "10px",
                                  backgroundColor: "#fff",
                                  boxShadow: "rgba(0,0,0,0.06) 0px 0px 0px 1px, rgba(0,0,0,0.04) 0px 1px 2px",
                                }}
                              >
                                <div className="flex items-baseline justify-between mb-1.5">
                                  <div className="flex items-baseline gap-1">
                                    <span
                                      className="text-[14px] font-semibold text-[#000]"
                                      style={{ letterSpacing: "-0.2px", lineHeight: 1.1 }}
                                    >
                                      {cart.reduce((s, i) => s + i.product.price * i.quantity, 0).toLocaleString()}
                                    </span>
                                    <span className="text-[10px] text-[#777169]" style={{ letterSpacing: "0.14px" }}>원</span>
                                  </div>
                                  <span className="text-[10px] text-[#777169]" style={{ letterSpacing: "0.14px" }}>
                                    {cart.length}종 · {cart.reduce((s, i) => s + i.quantity, 0)}개
                                  </span>
                                </div>
                                <div className="flex flex-col gap-0.5">
                                  {cart.slice(0, 2).map((item) => (
                                    <div key={item.product.id} className="flex items-center justify-between gap-2">
                                      <span className="text-[11px] text-[#4e4e4e] truncate" style={{ letterSpacing: "0.14px" }}>
                                        {item.product.name}
                                      </span>
                                      <span className="text-[10px] text-[#777169] shrink-0" style={{ letterSpacing: "0.14px" }}>
                                        ×{item.quantity}
                                      </span>
                                    </div>
                                  ))}
                                  {cart.length > 2 && (
                                    <span className="text-[10px] text-[#999] mt-0.5" style={{ letterSpacing: "0.14px" }}>
                                      외 {cart.length - 2}종 더보기
                                    </span>
                                  )}
                                </div>
                              </button>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </SubGroup>
            )}

          </div>
        )}
      </GroupSection>

      {/* ════════════════════════════════════════
          Group 2: 설정값 — 정책 pill + 예산 + 세부 설정
          ════════════════════════════════════════ */}
      <GroupSection
        title="설정값"
        expanded={openGroups.settings}
        onToggle={() => toggle("settings")}
        lastGroup
      >
        <div className="flex flex-col gap-3">
          {/* ── 정책 pills (에이전트 모드 + 승인체계) ── */}
          <div className="flex flex-wrap gap-1.5">
            <PolicyPill
              icon={<Bot size={11} strokeWidth={1.5} color={context.agentModeColor} />}
              label={context.agentMode}
              accentColor={context.agentModeColor}
              popoverTitle="에이전트 정책"
              popoverBody={
                context.agentPolicy ? (
                  <>
                    <p className="text-[11px] text-[#4e4e4e] leading-[1.5]" style={{ letterSpacing: "0.14px" }}>
                      {context.agentPolicy.description}
                    </p>
                    {context.agentPolicy.agents.length > 0 && (
                      <div className="mt-2">
                        <p className="text-[10px] text-[#999] mb-1" style={{ letterSpacing: "0.14px" }}>
                          활성 에이전트
                        </p>
                        <div className="flex flex-wrap gap-1">
                          {context.agentPolicy.agents.map((a) => (
                            <span
                              key={a}
                              className="inline-flex items-center px-1.5 py-[1px] text-[10px] font-medium text-[#4e4e4e]"
                              style={{ borderRadius: "4px", backgroundColor: "#f5f2ef" }}
                            >
                              @{a}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </>
                ) : (
                  <p className="text-[11px] text-[#777169]" style={{ letterSpacing: "0.14px" }}>
                    AI의 답변·행동 자율성 정책
                  </p>
                )
              }
            />
            <PolicyPill
              icon={<ShieldCheck size={11} strokeWidth={1.75} color="#6366f1" />}
              label={
                context.approvalPolicy
                  ? `자동승인 ≤ ${formatShortWon(context.approvalPolicy.autoApproveLimit)}`
                  : "자동승인 미설정"
              }
              accentColor="#6366f1"
              popoverTitle="승인체계 · 내 권한"
              popoverBody={
                context.approvalPolicy ? (
                  <div className="flex flex-col gap-1.5">
                    <PermRow
                      label="자동승인 한도"
                      value={`${formatShortWon(context.approvalPolicy.autoApproveLimit)} 이하`}
                      positive
                    />
                    <PermRow
                      label="직접 결제"
                      value={context.approvalPolicy.canDirectPurchase ? "가능" : "승인 필요"}
                      positive={context.approvalPolicy.canDirectPurchase}
                    />
                    <PermRow
                      label="AI 답변 제한"
                      value={context.approvalPolicy.aiRestricted ? "있음" : "없음"}
                      positive={!context.approvalPolicy.aiRestricted}
                    />
                  </div>
                ) : (
                  <p className="text-[11px] text-[#777169]" style={{ letterSpacing: "0.14px" }}>
                    승인 규정을 설정하면 여기에 표시됩니다
                  </p>
                )
              }
            />
          </div>

          {/* ── 이번 달 예산 — 유지 (AI 의사결정 근거) ── */}
          {(() => {
            const budgetContent = (
              <>
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-1.5">
                    <PiggyBank size={12} strokeWidth={1.5} color="#777169" />
                    <span
                      className="text-[10px] font-semibold uppercase text-[#4e4e4e]"
                      style={{ letterSpacing: "0.7px" }}
                    >
                      이번 달 예산
                    </span>
                    {onOpenBudget && (
                      <span
                        className="inline-flex items-center gap-0.5 text-[10px] font-medium text-[#6366f1] opacity-0 group-hover:opacity-100 transition-opacity ml-0.5"
                        style={{ letterSpacing: "0.14px" }}
                      >
                        분석 <ArrowUpRight size={10} strokeWidth={2} />
                      </span>
                    )}
                  </div>
                  <span className="text-[10px] text-[#999]" style={{ letterSpacing: "0.14px" }}>
                    {context.budget.department}
                  </span>
                </div>

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
                <p className="text-[10px] text-[#999] mt-1.5 text-left" style={{ letterSpacing: "0.14px" }}>
                  {context.budget.used.toLocaleString()} / {context.budget.monthly.toLocaleString()}원
                </p>
              </>
            );
            return onOpenBudget ? (
              <button
                onClick={onOpenBudget}
                className="group w-full text-left cursor-pointer transition-colors hover:bg-[rgba(99,102,241,0.03)] -mx-2 px-2 py-2 rounded-[6px]"
              >
                {budgetContent}
              </button>
            ) : (
              <div>{budgetContent}</div>
            );
          })()}

          {/* ── 세부 설정 (기본 접힘): 배송지, 결제수단 ── */}
          <div className="pt-1" style={{ borderTop: "1px solid rgba(0,0,0,0.05)" }}>
            <button
              onClick={() => setDetailOpen((v) => !v)}
              className="flex items-center gap-1 w-full px-0.5 py-1 cursor-pointer text-left"
            >
              <span
                className="text-[10px] font-medium text-[#999]"
                style={{ letterSpacing: "0.14px" }}
              >
                세부 설정
              </span>
              <ChevronDown
                size={11}
                strokeWidth={1.5}
                color="#bbb"
                className="transition-transform"
                style={{ transform: detailOpen ? "rotate(0)" : "rotate(-90deg)" }}
              />
            </button>
            {detailOpen && (
              <div className="flex flex-col mt-1">
                <ListRow
                  icon={MapPin}
                  label="배송지"
                  value={context.shippingAddress}
                  onClick={onOpenShipping}
                  actionHint="변경"
                />
                <div className="mx-1" style={{ borderTop: "1px solid rgba(0,0,0,0.04)" }} />
                <ListRow
                  icon={CreditCard}
                  label="결제수단"
                  value={context.paymentMethod}
                  onClick={onOpenPayment}
                  actionHint="변경"
                />
              </div>
            )}
          </div>
        </div>
      </GroupSection>
    </div>
  );
}

/* ─── 포맷 헬퍼 ─── */
function formatShortWon(won: number): string {
  if (won >= 10_000_000) return `${(won / 10_000_000).toFixed(0)}천만`;
  if (won >= 10_000) return `${Math.round(won / 10_000)}만원`;
  return `${won.toLocaleString()}원`;
}

/* ─── 권한 행 (팝오버 내부) ─── */
function PermRow({ label, value, positive }: { label: string; value: string; positive: boolean }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-[11px] text-[#777169]" style={{ letterSpacing: "0.14px" }}>
        {label}
      </span>
      <span
        className="text-[11px] font-medium"
        style={{
          color: positive ? "#22c55e" : "#f59e0b",
          letterSpacing: "0.14px",
        }}
      >
        {value}
      </span>
    </div>
  );
}

/* ─── PolicyPill: 배지 + hover 팝오버 ─── */
function PolicyPill({
  icon,
  label,
  accentColor,
  popoverTitle,
  popoverBody,
}: {
  icon: React.ReactNode;
  label: string;
  accentColor: string;
  popoverTitle: string;
  popoverBody: React.ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") setOpen(false); };
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  return (
    <div ref={wrapRef} className="relative inline-flex">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        onMouseEnter={() => setOpen(true)}
        onMouseLeave={() => setOpen(false)}
        aria-expanded={open}
        className="inline-flex items-center gap-1 px-2 py-[4px] text-[11px] font-medium cursor-pointer transition-all"
        style={{
          borderRadius: "9999px",
          backgroundColor: open ? "#fff" : "rgba(245,242,239,0.5)",
          boxShadow: open
            ? `${accentColor}33 0px 0px 0px 1.5px`
            : "rgba(0,0,0,0.06) 0px 0px 0px 1px",
          color: "#1a1a1a",
          letterSpacing: "0.14px",
        }}
      >
        {icon}
        {label}
      </button>

      {open && (
        <div
          onMouseEnter={() => setOpen(true)}
          onMouseLeave={() => setOpen(false)}
          className="absolute left-0 top-full mt-1.5 z-40 w-[220px] bg-white p-3"
          style={{
            borderRadius: "10px",
            boxShadow:
              "rgba(0,0,0,0.06) 0px 0px 0px 1px, rgba(0,0,0,0.04) 0px 2px 8px, rgba(0,0,0,0.04) 0px 8px 20px",
          }}
        >
          <p
            className="text-[10px] font-semibold uppercase text-[#4e4e4e] mb-2"
            style={{ letterSpacing: "0.7px" }}
          >
            {popoverTitle}
          </p>
          {popoverBody}
        </div>
      )}
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
  titleBadge,
  children,
}: {
  title: string;
  count?: number;
  rightAction?: React.ReactNode;
  titleBadge?: React.ReactNode;
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
        {titleBadge}
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

/* 리스트 행 (아이콘 + 라벨 + 값) — 구매 조건·참고 그룹용
   onClick 제공 시 외부 페이지 점프 어포던스(↗) 노출 */
function ListRow({
  icon: Icon,
  label,
  value,
  onClick,
  actionHint = "열기",
}: {
  icon: React.ComponentType<{ size?: number; strokeWidth?: number; color?: string; className?: string }>;
  label: string;
  value: string;
  onClick?: () => void;
  actionHint?: string;
}) {
  const content = (
    <>
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
      {onClick && (
        <span
          className="inline-flex items-center gap-0.5 text-[10px] font-medium text-[#6366f1] shrink-0 mt-[3px] opacity-0 group-hover:opacity-100 transition-opacity"
          style={{ letterSpacing: "0.14px" }}
        >
          {actionHint}
          <ArrowUpRight size={10} strokeWidth={2} />
        </span>
      )}
    </>
  );

  if (onClick) {
    return (
      <button
        onClick={onClick}
        className="group flex items-start gap-2 px-1 py-2 w-full text-left cursor-pointer rounded-[6px] transition-colors hover:bg-[rgba(99,102,241,0.04)]"
      >
        {content}
      </button>
    );
  }
  return (
    <div className="flex items-start gap-2 px-1 py-2">
      {content}
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
