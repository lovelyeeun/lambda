"use client";

import { useState, useCallback, useMemo } from "react";
import {
  GitBranch, Plus, ArrowLeft, X, ChevronDown,
  User as UserIcon, CreditCard, Check, AlertCircle,
  Trash2, Users, Repeat, PlusCircle, Wallet, Clock,
} from "lucide-react";
import { users } from "@/data/users";
import VersionHistoryPopover from "@/components/ui/VersionHistoryPopover";

/* ═══════════════════════════════════════
   타입 & 더미 데이터
   ═══════════════════════════════════════ */

interface ApprovalStep {
  id: string;
  type: "approval" | "final-payment";
  label: string;        // "1차 승인", "2차 승인", "최종결제"
  assigneeId?: string;  // user id
  amountCondition?: number;  // 금액 조건 (이상일 때만 이 단계 필요)
  paymentType?: "anyone-with-permission" | "specific-person";
}

interface ApprovalLine {
  id: string;
  name: string;
  departments: string[];  // 적용 조직
  steps: ApprovalStep[];
}

interface Department {
  id: string;
  name: string;
  members: string[];   // user ids
}

const departments: Department[] = [
  { id: "dept-all", name: "기본 조직", members: users.map((u) => u.id) },
  { id: "dept-mgmt", name: "경영지원", members: ["user-001", "user-002"] },
  { id: "dept-marketing", name: "마케팅", members: ["user-003"] },
  { id: "dept-design", name: "디자인", members: ["user-004"] },
  { id: "dept-dev", name: "개발", members: ["user-005"] },
];

const initialPaymentMethods: Record<string, string[]> = {
  "user-001": ["법인카드 A", "법인카드 B"],
  "user-002": ["법인카드 A"],
  "user-003": ["후불카드"],
  "user-004": [],
  "user-005": [],
};

/* 전체 등록 가능한 결제수단 풀 (회계→결제수단 등록에서 관리) */
const allAvailableMethods = ["법인카드 A", "법인카드 B", "후불카드", "BNPL", "네이버페이"];

const initialLines: ApprovalLine[] = [
  {
    id: "line-default",
    name: "기본 결재 라인",
    departments: [],
    steps: [
      { id: "step-d1", type: "final-payment", label: "최종결제", paymentType: "anyone-with-permission" },
    ],
  },
  {
    id: "line-sales",
    name: "영업팀 결재 라인",
    departments: ["경영지원"],
    steps: [
      { id: "step-s1", type: "approval", label: "1차 승인", assigneeId: "user-002" },
      { id: "step-s2", type: "final-payment", label: "최종결제", assigneeId: "user-001", paymentType: "specific-person" },
    ],
  },
  {
    id: "line-mkt",
    name: "마케팅·운영 결재 라인",
    departments: ["마케팅", "디자인"],
    steps: [
      { id: "step-m1", type: "approval", label: "1차 승인", assigneeId: "user-002" },
      { id: "step-m2", type: "approval", label: "2차 승인", assigneeId: "user-001", amountCondition: 1000000 },
      { id: "step-m3", type: "final-payment", label: "최종결제", assigneeId: "user-001", paymentType: "specific-person" },
    ],
  },
  {
    id: "line-dev",
    name: "개발팀 결재 라인",
    departments: ["개발"],
    steps: [
      { id: "step-v1", type: "approval", label: "1차 승인", assigneeId: "user-005" },
      { id: "step-v2", type: "final-payment", label: "최종결제", paymentType: "anyone-with-permission" },
    ],
  },
];

const getUserName = (id?: string) => users.find((u) => u.id === id)?.name ?? "미지정";
const getUserDept = (id?: string) => users.find((u) => u.id === id)?.department ?? "";

/* ═══════════════════════════════════════
   메인 컴포넌트
   ═══════════════════════════════════════ */

type ViewMode = "visual" | "list";
type EditView = null | { lineId: string };

export default function ApprovalRulesPanel() {
  const [viewMode, setViewMode] = useState<ViewMode>("visual");
  const [lines, setLines] = useState<ApprovalLine[]>(initialLines);
  const [editView, setEditView] = useState<EditView>(null);
  const [selectedStepId, setSelectedStepId] = useState<string | null>(null);
  const [rightPanel, setRightPanel] = useState<"step" | "member" | "final" | "payment-manage" | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const [paymentMethods, setPaymentMethods] = useState<Record<string, string[]>>(initialPaymentMethods);
  const [paymentEditUserId, setPaymentEditUserId] = useState<string | null>(null);

  const showToast = (msg: string) => { setToast(msg); setTimeout(() => setToast(null), 2500); };

  const editingLine = editView ? lines.find((l) => l.id === editView.lineId) : null;
  const selectedStep = editingLine?.steps.find((s) => s.id === selectedStepId) ?? null;

  /* ── 라인 조작 ── */

  const addLine = useCallback(() => {
    const newLine: ApprovalLine = {
      id: `line-${Date.now()}`,
      name: "새 결재 라인",
      departments: [],
      steps: [
        { id: `step-${Date.now()}`, type: "final-payment", label: "최종결제", paymentType: "anyone-with-permission" },
      ],
    };
    setLines((prev) => [...prev, newLine]);
    setEditView({ lineId: newLine.id });
    showToast("새 결재 라인이 추가되었습니다");
  }, []);

  /* ── 단계 조작 ── */

  const addStep = useCallback((lineId: string, afterIdx: number) => {
    setLines((prev) => prev.map((l) => {
      if (l.id !== lineId) return l;
      const newStep: ApprovalStep = {
        id: `step-${Date.now()}`,
        type: "approval",
        label: "새 승인 단계",
      };
      const steps = [...l.steps];
      steps.splice(afterIdx + 1, 0, newStep);
      return { ...l, steps };
    }));
  }, []);

  const updateStep = useCallback((lineId: string, stepId: string, updates: Partial<ApprovalStep>) => {
    setLines((prev) => prev.map((l) => {
      if (l.id !== lineId) return l;
      return { ...l, steps: l.steps.map((s) => s.id === stepId ? { ...s, ...updates } : s) };
    }));
  }, []);

  const deleteStep = useCallback((lineId: string, stepId: string) => {
    setLines((prev) => prev.map((l) => {
      if (l.id !== lineId) return l;
      // 최종결제 단계는 삭제 불가
      const step = l.steps.find((s) => s.id === stepId);
      if (step?.type === "final-payment") return l;
      return { ...l, steps: l.steps.filter((s) => s.id !== stepId) };
    }));
    setSelectedStepId(null);
    setRightPanel(null);
    showToast("단계가 삭제되었습니다");
  }, []);

  const deleteLine = useCallback((lineId: string) => {
    setLines((prev) => prev.filter((l) => l.id !== lineId));
    setEditView(null);
    setSelectedStepId(null);
    setRightPanel(null);
    showToast("결재 라인이 삭제되었습니다");
  }, []);

  const updateLineName = useCallback((lineId: string, name: string) => {
    setLines((prev) => prev.map((l) => l.id === lineId ? { ...l, name } : l));
  }, []);

  const updateLineDepts = useCallback((lineId: string, depts: string[]) => {
    setLines((prev) => prev.map((l) => l.id === lineId ? { ...l, departments: depts } : l));
  }, []);

  const selectStep = useCallback((stepId: string) => {
    setSelectedStepId(stepId);
    const step = editingLine?.steps.find((s) => s.id === stepId);
    setRightPanel(step?.type === "final-payment" ? "final" : "step");
  }, [editingLine]);

  /* ── 결제수단 조작 ── */

  const assignPaymentMethod = useCallback((userId: string, method: string) => {
    setPaymentMethods((prev) => {
      const current = prev[userId] ?? [];
      if (current.includes(method)) return prev;
      return { ...prev, [userId]: [...current, method] };
    });
    showToast(`${getUserName(userId)}에게 ${method} 배정됨`);
  }, []);

  const removePaymentMethod = useCallback((userId: string, method: string) => {
    setPaymentMethods((prev) => {
      const current = prev[userId] ?? [];
      return { ...prev, [userId]: current.filter((m) => m !== method) };
    });
    showToast(`${method} 회수됨`);
  }, []);

  const openPaymentManager = useCallback((userId: string) => {
    setPaymentEditUserId(userId);
    setRightPanel("payment-manage");
  }, []);

  /* ═══════════════════════════════════════
     렌더: 편집 모드
     ═══════════════════════════════════════ */

  if (editView && editingLine) {
    return (
      <div className="flex h-full -m-8 -mx-10">
        {/* 좌측: 편집 영역 */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* 헤더 */}
          <div className="flex items-center gap-3 px-6 py-4 shrink-0" style={{ borderBottom: "1px solid rgba(0,0,0,0.06)" }}>
            <button
              onClick={() => { setEditView(null); setSelectedStepId(null); setRightPanel(null); }}
              className="flex items-center gap-1.5 px-3 py-1.5 text-[13px] text-[#555] cursor-pointer hover:bg-[#f0f0f0] transition-colors"
              style={{ borderRadius: "8px", boxShadow: "rgba(0,0,0,0.06) 0px 0px 0px 1px" }}
            >
              <ArrowLeft size={14} strokeWidth={1.5} />
              목록으로
            </button>
            <span className="text-[15px] font-semibold text-[#111]">{editingLine.name} 편집</span>
            {/* 기본 라인이 아닐 때만 삭제 가능 */}
            {editingLine.departments.length > 0 && (
              <button
                onClick={() => deleteLine(editingLine.id)}
                className="px-3 py-1.5 text-[12px] text-[#ef4444] cursor-pointer hover:bg-red-50 transition-colors"
                style={{ borderRadius: "8px", border: "1px solid rgba(239,68,68,0.15)" }}
              >
                <Trash2 size={13} strokeWidth={1.5} className="inline mr-1" />
                라인 삭제
              </button>
            )}
            <button
              onClick={() => { setEditView(null); setSelectedStepId(null); setRightPanel(null); showToast("저장되었습니다"); }}
              className="ml-auto px-4 py-1.5 text-[13px] font-medium text-white bg-[#111] cursor-pointer hover:opacity-80 transition-opacity"
              style={{ borderRadius: "8px" }}
            >
              저장
            </button>
          </div>

          {/* 편집 폼 */}
          <div className="flex-1 overflow-y-auto px-6 py-5">
            {/* 라인 이름 */}
            <div className="mb-4">
              <label className="block text-[12px] text-[#999] mb-1">결재 라인 이름</label>
              <input
                value={editingLine.name}
                onChange={(e) => updateLineName(editingLine.id, e.target.value)}
                className="w-full max-w-[480px] px-3 py-2 text-[14px] outline-none"
                style={{ borderRadius: "8px", boxShadow: "rgba(0,0,0,0.06) 0px 0px 0px 1px" }}
              />
            </div>

            {/* 적용 조직 */}
            <div className="mb-6">
              <label className="block text-[12px] text-[#999] mb-1">적용 조직 · 이 라인을 따를 조직 선택</label>
              <DepartmentPicker
                selected={editingLine.departments}
                onChange={(d) => updateLineDepts(editingLine.id, d)}
              />
            </div>

            {/* 결재 흐름 */}
            <div className="flex flex-col items-center max-w-[480px] mx-auto">
              <p className="text-[12px] text-[#999] mb-4">결재 흐름</p>

              {/* 시작: 구매요청 */}
              <FlowCard
                label="시작"
                title="구매요청"
                active={false}
                onClick={() => {}}
              />

              {editingLine.steps.map((step, idx) => (
                <div key={step.id} className="flex flex-col items-center w-full">
                  {/* 연결선 + 단계 추가 */}
                  <div className="flex flex-col items-center py-1">
                    <div className="w-px h-4 bg-[#ddd]" />
                    <button
                      onClick={() => addStep(editingLine.id, idx - 1)}
                      className="px-3 py-1.5 text-[11px] text-[#bbb] cursor-pointer hover:text-[#666] hover:bg-[#f5f5f5] transition-colors"
                      style={{ borderRadius: "8px", border: "1px dashed #ddd" }}
                    >
                      + 단계 추가
                    </button>
                    <div className="w-px h-4 bg-[#ddd]" />
                  </div>

                  {/* 단계 카드 */}
                  <FlowCard
                    label={step.type === "final-payment" ? "최종결제" : "승인 단계"}
                    title={step.label}
                    assignee={step.assigneeId ? getUserName(step.assigneeId) : undefined}
                    amountCondition={step.amountCondition}
                    warning={!step.assigneeId && step.type === "approval" ? "담당자 미지정" : undefined}
                    active={selectedStepId === step.id}
                    isFinal={step.type === "final-payment"}
                    onClick={() => selectStep(step.id)}
                  />
                </div>
              ))}

              {/* 마지막 단계 추가 (최종결제 앞) */}
              {editingLine.steps.length > 0 && editingLine.steps[editingLine.steps.length - 1].type === "final-payment" && (
                <div className="flex flex-col items-center py-1">
                  <div className="w-px h-4 bg-[#ddd]" />
                  <button
                    onClick={() => addStep(editingLine.id, editingLine.steps.length - 2)}
                    className="px-3 py-1.5 text-[11px] text-[#bbb] cursor-pointer hover:text-[#666] hover:bg-[#f5f5f5] transition-colors"
                    style={{ borderRadius: "8px", border: "1px dashed #ddd" }}
                  >
                    + 단계 추가
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* 우측: 단계 설정 패널 */}
        {rightPanel && (rightPanel === "payment-manage" || selectedStep) && (
          <div className="w-[300px] shrink-0 bg-white overflow-y-auto" style={{ borderLeft: "1px solid rgba(0,0,0,0.06)" }}>
            {rightPanel === "payment-manage" && paymentEditUserId ? (
              /* 결제수단 관리 */
              <PaymentManagePanel
                userId={paymentEditUserId}
                methods={paymentMethods[paymentEditUserId] ?? []}
                allMethods={allAvailableMethods}
                onAssign={(method) => assignPaymentMethod(paymentEditUserId, method)}
                onRemove={(method) => removePaymentMethod(paymentEditUserId, method)}
                onBack={() => {
                  setPaymentEditUserId(null);
                  if (selectedStep) setRightPanel(selectedStep.type === "final-payment" ? "final" : "step");
                  else setRightPanel(null);
                }}
              />
            ) : rightPanel === "member" && selectedStep ? (
              /* 구성원 선택 */
              <MemberPickerPanel
                onSelect={(userId) => {
                  updateStep(editingLine!.id, selectedStep.id, { assigneeId: userId });
                  setRightPanel(selectedStep.type === "final-payment" ? "final" : "step");
                  showToast(`${getUserName(userId)}님이 지정되었습니다`);
                }}
                onBack={() => setRightPanel(selectedStep.type === "final-payment" ? "final" : "step")}
                paymentMethods={paymentMethods}
              />
            ) : rightPanel === "final" && selectedStep ? (
              /* 최종결제 설정 */
              <FinalPaymentPanel
                step={selectedStep}
                paymentMethods={paymentMethods}
                onUpdate={(updates) => updateStep(editingLine!.id, selectedStep.id, updates)}
                onSelectMember={() => setRightPanel("member")}
                onManagePayment={(userId) => openPaymentManager(userId)}
                onClose={() => { setSelectedStepId(null); setRightPanel(null); }}
              />
            ) : selectedStep ? (
              /* 승인 단계 설정 */
              <StepSettingPanel
                step={selectedStep}
                onUpdate={(updates) => updateStep(editingLine!.id, selectedStep.id, updates)}
                onSelectMember={() => setRightPanel("member")}
                onClose={() => { setSelectedStepId(null); setRightPanel(null); }}
                onDelete={() => deleteStep(editingLine!.id, selectedStep.id)}
              />
            ) : null}
          </div>
        )}
      </div>
    );
  }

  /* ═══════════════════════════════════════
     렌더: 시각화 뷰 (기본)
     ═══════════════════════════════════════ */

  const defaultLine = lines.find((l) => l.departments.length === 0);
  const customLines = lines.filter((l) => l.departments.length > 0);
  const totalCols = (defaultLine ? 1 : 0) + customLines.length;
  const allVisualLines = [...(defaultLine ? [defaultLine] : []), ...customLines];

  return (
    <div className="max-w-full">
      {/* 헤더 */}
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <div>
            <h2 className="text-[20px] font-semibold" style={{ letterSpacing: "-0.3px" }}>승인 체계</h2>
            <p className="text-[13px] text-[#777] mt-1">구매요청이 처리되는 결재 절차를 설정합니다.</p>
          </div>
          <VersionHistoryPopover domain="approval-rules">
            <button
              type="button"
              aria-label="변경기록"
              className="flex items-center justify-center w-7 h-7 rounded-lg cursor-pointer transition-colors hover:bg-[#f5f5f5]"
            >
              <Clock size={15} strokeWidth={1.5} color="#999" />
            </button>
          </VersionHistoryPopover>
        </div>
        <div className="flex items-center gap-2">
          {/* 뷰 토글 */}
          <div className="inline-flex p-[3px]" style={{ borderRadius: "10px", backgroundColor: "#f0f0f0" }}>
            {(["list", "visual"] as ViewMode[]).map((m) => (
              <button
                key={m}
                onClick={() => setViewMode(m)}
                className="px-3 py-[5px] text-[12px] font-medium cursor-pointer transition-all"
                style={{
                  borderRadius: "8px",
                  backgroundColor: viewMode === m ? "#fff" : "transparent",
                  color: viewMode === m ? "#111" : "#999",
                  boxShadow: viewMode === m ? "rgba(0,0,0,0.06) 0px 1px 3px" : "none",
                }}
              >
                {m === "list" ? "리스트" : "시각화"}
              </button>
            ))}
          </div>
          <button
            onClick={addLine}
            className="flex items-center gap-1.5 px-4 py-[7px] text-[13px] font-medium text-white bg-[#111] cursor-pointer hover:opacity-80 transition-opacity"
            style={{ borderRadius: "8px" }}
          >
            <Plus size={14} strokeWidth={2} /> 결재 라인 추가
          </button>
        </div>
      </div>

      {/* 안내 박스 */}
      <div className="p-4 mb-6" style={{ borderRadius: "12px", backgroundColor: "#fffbe6", boxShadow: "rgba(0,0,0,0.04) 0px 0px 0px 1px" }}>
        <div className="flex items-start gap-3">
          <span className="text-[18px] mt-0.5">💡</span>
          <div>
            <p className="text-[14px] font-semibold text-[#333] mb-1.5">구성원이 구매요청을 올리면 어떻게 되나요?</p>
            <p className="text-[13px] text-[#666] leading-[1.7] mb-3">
              구매요청이 제출되면 아래에 설정된 결재 라인에 따라 순서대로 처리됩니다. 지금은 <strong>기본 결재 라인</strong>이 적용되어, 구매요청이 바로 결재 관리자에게 전달됩니다.
            </p>
            <div className="flex items-center gap-2 text-[12px] text-[#888]">
              <span className="px-2.5 py-1 bg-white" style={{ borderRadius: "6px", boxShadow: "rgba(0,0,0,0.06) 0px 0px 0px 1px" }}>구매요청 제출</span>
              <span>→</span>
              <span className="px-2.5 py-1 bg-white" style={{ borderRadius: "6px", boxShadow: "rgba(0,0,0,0.06) 0px 0px 0px 1px" }}>결재 관리자 확인 및 결재</span>
              <span>→</span>
              <span className="px-2.5 py-1 bg-white" style={{ borderRadius: "6px", boxShadow: "rgba(0,0,0,0.06) 0px 0px 0px 1px" }}>구매 완료</span>
            </div>
            <p className="text-[12px] text-[#aaa] mt-3">
              <strong>조직마다 다른 결재 흐름이 필요하다면?</strong> 결재 라인을 추가해 조직별로 승인 단계와 담당자를 다르게 설정할 수 있습니다. 결재 라인이 없는 조직은 기본 결재 라인으로 자동 처리됩니다.
            </p>
          </div>
        </div>
      </div>

      {viewMode === "visual" ? (
        <div className="flex flex-col items-center">
          {/* 구매요청 시작 */}
          <div className="px-6 py-3 bg-[#111] text-white text-[14px] font-semibold" style={{ borderRadius: "10px" }}>
            구매요청
          </div>

          {/* 분기 연결선 */}
          {totalCols > 1 ? (
            <div className="relative w-full" style={{ height: "40px" }}>
              <div className="absolute left-1/2 top-0 w-px bg-[#ddd] -translate-x-1/2" style={{ height: "20px" }} />
              <div className="absolute bg-[#ddd]" style={{
                top: "20px",
                height: "1px",
                left: `${(100 / totalCols) / 2}%`,
                right: `${(100 / totalCols) / 2}%`,
              }} />
              {allVisualLines.map((_, i) => (
                <div
                  key={i}
                  className="absolute w-px bg-[#ddd]"
                  style={{
                    top: "20px",
                    height: "20px",
                    left: `${((100 / totalCols) * i) + (100 / totalCols) / 2}%`,
                  }}
                />
              ))}
            </div>
          ) : (
            <div className="w-px h-8 bg-[#ddd]" />
          )}

          {/* 조직별 라인 카드 */}
          <div className="grid w-full mb-6" style={{ gridTemplateColumns: `repeat(${totalCols}, 1fr)`, gap: "16px" }}>
            {defaultLine && (
              <OrgLineColumn
                line={defaultLine}
                isDefault
                paymentMethods={paymentMethods}
                onClick={() => setEditView({ lineId: defaultLine.id })}
                onManagePayment={openPaymentManager}
              />
            )}
            {customLines.map((line) => (
              <OrgLineColumn
                key={line.id}
                line={line}
                isDefault={false}
                paymentMethods={paymentMethods}
                onClick={() => setEditView({ lineId: line.id })}
                onManagePayment={openPaymentManager}
              />
            ))}
          </div>
        </div>
      ) : (
        /* ── 리스트 뷰 ── */
        <div className="flex flex-col gap-2">
          {lines.map((line) => (
            <button
              key={line.id}
              onClick={() => setEditView({ lineId: line.id })}
              className="text-left w-full p-4 cursor-pointer transition-all hover:bg-[#fafafa]"
              style={{ borderRadius: "12px", boxShadow: "rgba(0,0,0,0.04) 0px 0px 0px 1px" }}
            >
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <GitBranch size={15} strokeWidth={1.5} color="#6366f1" />
                  <span className="text-[14px] font-semibold text-[#111]">{line.name}</span>
                  {line.departments.length === 0 && (
                    <span className="text-[10px] px-1.5 py-[2px] bg-[#111] text-white font-medium" style={{ borderRadius: "4px" }}>기본</span>
                  )}
                </div>
                <span className="text-[12px] text-[#999]">{line.steps.length}단계</span>
              </div>
              <div className="flex items-center gap-1.5 flex-wrap">
                {line.departments.length > 0
                  ? line.departments.map((d) => (
                      <span key={d} className="text-[11px] px-2 py-[2px] bg-[#f5f5f5] text-[#666]" style={{ borderRadius: "4px" }}>{d}</span>
                    ))
                  : <span className="text-[11px] text-[#bbb]">(전체)</span>
                }
              </div>
              <div className="flex items-center gap-1.5 mt-2 text-[11px] text-[#999]">
                {line.steps.map((s, i) => (
                  <span key={s.id} className="flex items-center gap-1">
                    {i > 0 && <span className="text-[#ddd]">→</span>}
                    {s.label}
                    {s.assigneeId && <span className="text-[#bbb]">({getUserName(s.assigneeId)})</span>}
                  </span>
                ))}
              </div>
            </button>
          ))}
        </div>
      )}

      {toast && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[70] flex items-center gap-2 px-4 py-2.5 bg-[#1a1a1a] text-white text-[13px] font-medium" style={{ borderRadius: "10px", boxShadow: "rgba(0,0,0,0.2) 0px 4px 12px" }}>
          <Check size={14} strokeWidth={2} />{toast}
        </div>
      )}
    </div>
  );
}

/* ═══════════════════════════════════════
   시각화 뷰: 조직별 라인 컬럼
   ═══════════════════════════════════════ */

function OrgLineColumn({ line, isDefault, paymentMethods, onClick, onManagePayment }: {
  line: ApprovalLine;
  isDefault: boolean;
  paymentMethods: Record<string, string[]>;
  onClick: () => void;
  onManagePayment: (userId: string) => void;
}) {
  const lastStep = line.steps[line.steps.length - 1];
  const isFinalShared = lastStep?.type === "final-payment" && lastStep.paymentType === "anyone-with-permission";

  return (
    <div className="flex flex-col items-center" style={{ minWidth: 0 }}>
      {/* 조직 박스 */}
      <button
        onClick={onClick}
        className="w-full p-3 text-left cursor-pointer transition-all hover:shadow-md"
        style={{
          borderRadius: "10px",
          boxShadow: isDefault
            ? "rgba(0,0,0,0.1) 0px 0px 0px 2px"
            : "rgba(0,0,0,0.06) 0px 0px 0px 1px",
          backgroundColor: "#fff",
        }}
      >
        <div className="flex items-center gap-1.5 mb-1.5">
          {isDefault && (
            <span className="text-[9px] px-1.5 py-[1px] bg-[#111] text-white font-bold" style={{ borderRadius: "3px" }}>기본</span>
          )}
          <span className="text-[13px] font-semibold text-[#111]">{line.name.replace(" 결재 라인", "")}</span>
        </div>
        <div className="flex items-center gap-1 flex-wrap">
          {line.departments.length > 0
            ? line.departments.map((d) => (
                <span key={d} className="text-[10px] px-1.5 py-[1px] bg-[#f5f5f5] text-[#888]" style={{ borderRadius: "3px" }}>{d}</span>
              ))
            : <span className="text-[10px] text-[#bbb]">(전체)</span>
          }
        </div>
      </button>

      {/* 단계들 */}
      {line.steps.map((step, idx) => (
        <div key={step.id} className="flex flex-col items-center w-full">
          {/* 연결선 + 추가 버튼 */}
          <div className="flex flex-col items-center py-0.5">
            <div className="w-px h-3 bg-[#ddd]" />
            <button
              onClick={onClick}
              className="text-[9px] text-[#ccc] px-2 py-0.5 cursor-pointer hover:text-[#888] transition-colors"
              style={{ borderRadius: "4px", border: "1px dashed #e5e5e5" }}
            >
              + 단계 추가
            </button>
            <div className="w-px h-3 bg-[#ddd]" />
          </div>

          {/* 단계 카드 — div로 래핑하여 내부 button 중첩 방지 */}
          <div
            onClick={onClick}
            className="w-full p-3 text-left cursor-pointer transition-all hover:shadow-md"
            style={{
              borderRadius: "10px",
              boxShadow: step.type === "final-payment"
                ? "rgba(34,197,94,0.15) 0px 0px 0px 1.5px"
                : "rgba(0,0,0,0.06) 0px 0px 0px 1px",
              backgroundColor: step.type === "final-payment" ? "rgba(34,197,94,0.04)" : "#fff",
            }}
          >
            <p className="text-[10px] text-[#999] mb-0.5">{step.type === "final-payment" ? "최종결제" : "승인 단계"}</p>
            <p className="text-[13px] font-semibold text-[#111] mb-1">{step.label}</p>

            {step.assigneeId ? (
              <div className="flex items-center gap-1.5">
                <div className="w-5 h-5 rounded-full bg-[#eee] flex items-center justify-center text-[9px] font-bold text-[#666]">
                  {getUserName(step.assigneeId).slice(0, 1)}
                </div>
                <span className="text-[11px] text-[#555]">{getUserName(step.assigneeId)}</span>
              </div>
            ) : step.type === "final-payment" && step.paymentType === "anyone-with-permission" ? (
              <div className="flex items-center gap-1.5">
                <Users size={12} strokeWidth={1.5} color="#22c55e" />
                <span className="text-[11px] text-[#22c55e] font-medium">결재 관리자</span>
              </div>
            ) : (
              <span className="text-[11px] text-[#ef4444] font-medium">담당자 미지정</span>
            )}

            {step.amountCondition && (
              <span className="inline-block mt-1.5 text-[10px] px-1.5 py-[2px] text-[#6366f1] font-medium" style={{ borderRadius: "4px", backgroundColor: "rgba(99,102,241,0.06)", border: "1px solid rgba(99,102,241,0.1)" }}>
                {step.amountCondition.toLocaleString()}원 이상
              </span>
            )}

            {step.type === "final-payment" && step.assigneeId && (
              <div className="mt-1.5">
                {(paymentMethods[step.assigneeId] ?? []).length > 0 ? (
                  <div className="flex items-center gap-1 flex-wrap">
                    {(paymentMethods[step.assigneeId] ?? []).map((m) => (
                      <span key={m} className="inline-flex items-center gap-0.5 text-[9px] px-1.5 py-[1px] bg-[#f5f5f5] text-[#666]" style={{ borderRadius: "3px" }}>
                        <CreditCard size={8} strokeWidth={1.5} />{m}
                      </span>
                    ))}
                  </div>
                ) : (
                  <span className="text-[9px] text-[#ef4444]">결제수단 없음</span>
                )}
                <button
                  onClick={(e) => { e.stopPropagation(); onManagePayment(step.assigneeId!); }}
                  className="flex items-center gap-0.5 mt-1 text-[9px] text-[#6366f1] cursor-pointer hover:text-[#4f46e5] font-medium"
                >
                  <Wallet size={9} strokeWidth={1.5} />관리
                </button>
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}

/* ═══════════════════════════════════════
   편집 뷰: 플로우 카드
   ═══════════════════════════════════════ */

function FlowCard({
  label,
  title,
  assignee,
  amountCondition,
  warning,
  active,
  isFinal,
  onClick,
}: {
  label: string;
  title: string;
  assignee?: string;
  amountCondition?: number;
  warning?: string;
  active: boolean;
  isFinal?: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className="w-full max-w-[480px] p-4 text-left cursor-pointer transition-all"
      style={{
        borderRadius: "12px",
        boxShadow: active
          ? "rgba(0,0,0,0.15) 0px 0px 0px 2px"
          : isFinal
            ? "rgba(34,197,94,0.15) 0px 0px 0px 1.5px"
            : "rgba(0,0,0,0.06) 0px 0px 0px 1px",
        backgroundColor: isFinal ? "rgba(34,197,94,0.02)" : "#fff",
      }}
    >
      <p className="text-[11px] text-[#999] mb-0.5">{label}</p>
      <p className="text-[16px] font-semibold text-[#111]">{title}</p>
      {assignee && (
        <div className="flex items-center gap-2 mt-1.5">
          <UserIcon size={13} strokeWidth={1.5} color="#6366f1" />
          <span className="text-[13px] text-[#555]">{assignee}</span>
        </div>
      )}
      {amountCondition && (
        <span className="inline-block mt-1.5 text-[11px] px-2 py-[3px] text-[#6366f1] font-medium" style={{ borderRadius: "6px", backgroundColor: "rgba(99,102,241,0.06)", border: "1px solid rgba(99,102,241,0.1)" }}>
          {amountCondition.toLocaleString()}원 이상
        </span>
      )}
      {warning && (
        <div className="flex items-center gap-1 mt-1.5">
          <AlertCircle size={12} strokeWidth={1.5} color="#ef4444" />
          <span className="text-[11px] text-[#ef4444] font-medium">{warning}</span>
        </div>
      )}
    </button>
  );
}

/* ═══════════════════════════════════════
   우측 패널: 승인 단계 설정
   ═══════════════════════════════════════ */

function StepSettingPanel({
  step,
  onUpdate,
  onSelectMember,
  onClose,
  onDelete,
}: {
  step: ApprovalStep;
  onUpdate: (updates: Partial<ApprovalStep>) => void;
  onSelectMember: () => void;
  onClose: () => void;
  onDelete: () => void;
}) {
  const [amountEnabled, setAmountEnabled] = useState(!!step.amountCondition);
  const [amountValue, setAmountValue] = useState(step.amountCondition ?? 500000);

  return (
    <div className="p-5 flex flex-col h-full">
      <div className="flex items-center justify-between mb-5">
        <span className="text-[15px] font-semibold text-[#111]">단계 설정</span>
        <button onClick={onClose} className="w-7 h-7 flex items-center justify-center rounded-lg cursor-pointer hover:bg-[#f5f5f5]">
          <X size={15} strokeWidth={1.5} color="#999" />
        </button>
      </div>

      {/* 단계 이름 */}
      <div className="mb-5">
        <label className="block text-[12px] text-[#999] mb-1.5">단계 이름</label>
        <input
          value={step.label}
          onChange={(e) => onUpdate({ label: e.target.value })}
          className="w-full px-3 py-2 text-[14px] outline-none"
          style={{ borderRadius: "8px", boxShadow: "rgba(0,0,0,0.06) 0px 0px 0px 1px" }}
        />
      </div>

      {/* 승인 담당자 */}
      <div className="mb-5">
        <label className="block text-[12px] text-[#999] mb-1.5">승인 담당자</label>
        {step.assigneeId ? (
          <div className="flex items-center justify-between p-3" style={{ borderRadius: "10px", boxShadow: "rgba(0,0,0,0.06) 0px 0px 0px 1px" }}>
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-full bg-[#eee] flex items-center justify-center text-[12px] font-bold text-[#555]">
                {getUserName(step.assigneeId).slice(0, 1)}
              </div>
              <span className="text-[14px] font-medium text-[#111]">{getUserName(step.assigneeId)}</span>
            </div>
            <button onClick={onSelectMember} className="text-[12px] text-[#999] cursor-pointer hover:text-[#555]">변경</button>
          </div>
        ) : (
          <button
            onClick={onSelectMember}
            className="w-full p-3 text-left text-[13px] text-[#bbb] cursor-pointer hover:bg-[#fafafa] transition-colors"
            style={{ borderRadius: "10px", boxShadow: "rgba(0,0,0,0.06) 0px 0px 0px 1px" }}
          >
            + 구성원 선택
          </button>
        )}
        <p className="text-[11px] text-[#bbb] mt-1.5">지정 시 구매요청서 열람 권한이 자동 부여됩니다.</p>
      </div>

      {/* 금액 조건 */}
      <div className="mb-5">
        <div className="flex items-center justify-between mb-2">
          <label className="text-[12px] text-[#999]">금액 조건</label>
          <button
            onClick={() => {
              setAmountEnabled(!amountEnabled);
              onUpdate({ amountCondition: !amountEnabled ? amountValue : undefined });
            }}
            className="relative w-[40px] h-[22px] rounded-full cursor-pointer transition-colors"
            style={{ backgroundColor: amountEnabled ? "#111" : "#ddd" }}
          >
            <div className="absolute top-[2px] w-[18px] h-[18px] bg-white rounded-full transition-all" style={{ left: amountEnabled ? "20px" : "2px", boxShadow: "rgba(0,0,0,0.1) 0px 1px 3px" }} />
          </button>
        </div>
        {amountEnabled && (
          <div className="flex items-center gap-2">
            <input
              type="number"
              value={amountValue}
              onChange={(e) => {
                const v = Number(e.target.value);
                setAmountValue(v);
                onUpdate({ amountCondition: v });
              }}
              className="flex-1 px-3 py-2 text-[13px] outline-none"
              style={{ borderRadius: "8px", boxShadow: "rgba(0,0,0,0.06) 0px 0px 0px 1px" }}
            />
            <span className="text-[12px] text-[#999]">원 이상</span>
          </div>
        )}
      </div>

      <div className="mt-auto">
        <button
          onClick={onDelete}
          className="w-full py-2.5 text-[13px] text-[#ef4444] font-medium cursor-pointer hover:bg-red-50 transition-colors"
          style={{ borderRadius: "10px", border: "1px solid rgba(239,68,68,0.2)" }}
        >
          이 단계 삭제
        </button>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════
   우측 패널: 최종결제 설정
   ═══════════════════════════════════════ */

function FinalPaymentPanel({
  step,
  paymentMethods,
  onUpdate,
  onSelectMember,
  onManagePayment,
  onClose,
}: {
  step: ApprovalStep;
  paymentMethods: Record<string, string[]>;
  onUpdate: (updates: Partial<ApprovalStep>) => void;
  onSelectMember: () => void;
  onManagePayment: (userId: string) => void;
  onClose: () => void;
}) {
  return (
    <div className="p-5 flex flex-col h-full">
      <div className="flex items-center justify-between mb-5">
        <span className="text-[15px] font-semibold text-[#111]">최종결제 설정</span>
        <button onClick={onClose} className="w-7 h-7 flex items-center justify-center rounded-lg cursor-pointer hover:bg-[#f5f5f5]">
          <X size={15} strokeWidth={1.5} color="#999" />
        </button>
      </div>

      {/* 결제 담당자 방식 */}
      <label className="block text-[12px] text-[#999] mb-3">결제 담당자</label>

      <div className="flex flex-col gap-2 mb-5">
        <button
          onClick={() => onUpdate({ paymentType: "anyone-with-permission", assigneeId: undefined })}
          className="w-full p-3.5 text-left cursor-pointer transition-all"
          style={{
            borderRadius: "10px",
            boxShadow: step.paymentType === "anyone-with-permission"
              ? "rgba(0,0,0,0.1) 0px 0px 0px 2px"
              : "rgba(0,0,0,0.06) 0px 0px 0px 1px",
          }}
        >
          <div className="flex items-center gap-2 mb-1">
            <div className="w-4 h-4 rounded-full flex items-center justify-center" style={{ border: step.paymentType === "anyone-with-permission" ? "5px solid #111" : "2px solid #ddd" }} />
            <span className="text-[13px] font-semibold text-[#111]">결제권한 있는 사람 누구나</span>
          </div>
          <p className="text-[11px] text-[#999] ml-6">결제권한이 있는 구성원 중 누구든 먼저 처리하면 완료됩니다.</p>
        </button>

        <button
          onClick={() => onUpdate({ paymentType: "specific-person" })}
          className="w-full p-3.5 text-left cursor-pointer transition-all"
          style={{
            borderRadius: "10px",
            boxShadow: step.paymentType === "specific-person"
              ? "rgba(0,0,0,0.1) 0px 0px 0px 2px"
              : "rgba(0,0,0,0.06) 0px 0px 0px 1px",
          }}
        >
          <div className="flex items-center gap-2 mb-1">
            <div className="w-4 h-4 rounded-full flex items-center justify-center" style={{ border: step.paymentType === "specific-person" ? "5px solid #111" : "2px solid #ddd" }} />
            <span className="text-[13px] font-semibold text-[#111]">특정인 지정</span>
          </div>
          <p className="text-[11px] text-[#999] ml-6">지정된 담당자만 결제를 처리할 수 있습니다.</p>
        </button>
      </div>

      {step.paymentType === "specific-person" && (
        <div className="mb-5">
          {step.assigneeId ? (
            <div className="flex items-center justify-between p-3" style={{ borderRadius: "10px", boxShadow: "rgba(0,0,0,0.06) 0px 0px 0px 1px" }}>
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-full bg-[#22c55e] flex items-center justify-center text-[12px] font-bold text-white">
                  {getUserName(step.assigneeId).slice(0, 1)}
                </div>
                <div className="flex-1 min-w-0">
                  <span className="text-[14px] font-medium text-[#111]">{getUserName(step.assigneeId)}</span>
                  {(paymentMethods[step.assigneeId] ?? []).length > 0 ? (
                    <div className="flex items-center gap-1 mt-0.5 flex-wrap">
                      {(paymentMethods[step.assigneeId] ?? []).map((m) => (
                        <span key={m} className="inline-flex items-center gap-0.5 text-[9px] px-1.5 py-[2px] bg-[#f5f5f5] text-[#666]" style={{ borderRadius: "4px" }}>
                          <CreditCard size={8} strokeWidth={1.5} />{m}
                        </span>
                      ))}
                    </div>
                  ) : (
                    <p className="text-[10px] text-[#ef4444]">결제수단 없음</p>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-2 mt-2 ml-[42px]">
                <button onClick={onSelectMember} className="text-[11px] text-[#999] cursor-pointer hover:text-[#555]">담당자 변경</button>
                <span className="text-[#ddd]">·</span>
                <button onClick={() => onManagePayment(step.assigneeId!)} className="flex items-center gap-1 text-[11px] text-[#6366f1] cursor-pointer hover:text-[#4f46e5] font-medium">
                  <Wallet size={11} strokeWidth={1.5} />결제수단 관리
                </button>
              </div>
            </div>
          ) : (
            <button
              onClick={onSelectMember}
              className="w-full p-3 text-left text-[13px] text-[#bbb] cursor-pointer hover:bg-[#fafafa] transition-colors"
              style={{ borderRadius: "10px", boxShadow: "rgba(0,0,0,0.06) 0px 0px 0px 1px" }}
            >
              + 구성원 선택
            </button>
          )}
        </div>
      )}

      <p className="text-[11px] text-[#999] leading-[1.6] mb-4">
        각 구성원에게 배정된 결제수단으로 결제합니다.<br />
        담당자 선택 후 <strong>결제수단 관리</strong>를 통해 결제수단을 배정/회수할 수 있습니다.
      </p>

      <div className="mt-auto">
        <p className="text-[11px] text-[#bbb] text-center py-2">최종결제 단계는 삭제할 수 없습니다.</p>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════
   우측 패널: 구성원 선택
   ═══════════════════════════════════════ */

function MemberPickerPanel({ onSelect, onBack, paymentMethods }: { onSelect: (userId: string) => void; onBack: () => void; paymentMethods: Record<string, string[]> }) {
  return (
    <div className="p-5">
      <div className="flex items-center gap-2 mb-4">
        <button onClick={onBack} className="cursor-pointer hover:text-[#333] text-[#999] transition-colors">
          <ArrowLeft size={16} strokeWidth={1.5} />
        </button>
        <span className="text-[15px] font-semibold text-[#111]">구성원 선택</span>
      </div>

      <div className="flex flex-col gap-2">
        {users.map((user) => {
          const methods = paymentMethods[user.id] ?? [];
          return (
            <button
              key={user.id}
              onClick={() => onSelect(user.id)}
              className="w-full p-3 text-left cursor-pointer transition-all hover:bg-[#fafafa]"
              style={{ borderRadius: "10px", boxShadow: "rgba(0,0,0,0.06) 0px 0px 0px 1px" }}
            >
              <div className="flex items-center gap-2.5 mb-1.5">
                <div className="w-8 h-8 rounded-full bg-[#eee] flex items-center justify-center text-[12px] font-bold text-[#555]">
                  {user.name.slice(0, 1)}
                </div>
                <div>
                  <p className="text-[13px] font-medium text-[#111]">{user.name}</p>
                  <p className="text-[10px] text-[#999]">{user.department}</p>
                </div>
              </div>
              {methods.length > 0 ? (
                <div className="flex items-center gap-1 ml-[42px]">
                  {methods.map((m) => (
                    <span key={m} className="flex items-center gap-0.5 text-[10px] px-1.5 py-[2px] bg-[#f5f5f5] text-[#666]" style={{ borderRadius: "4px" }}>
                      <CreditCard size={9} strokeWidth={1.5} />{m}
                    </span>
                  ))}
                </div>
              ) : (
                <div className="flex items-center gap-1 ml-[42px]">
                  <AlertCircle size={10} strokeWidth={1.5} color="#ef4444" />
                  <span className="text-[10px] text-[#ef4444] font-medium">결제수단 없음</span>
                </div>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════
   우측 패널: 결제수단 관리
   ═══════════════════════════════════════ */

function PaymentManagePanel({
  userId,
  methods,
  allMethods,
  onAssign,
  onRemove,
  onBack,
}: {
  userId: string;
  methods: string[];
  allMethods: string[];
  onAssign: (method: string) => void;
  onRemove: (method: string) => void;
  onBack: () => void;
}) {
  const available = allMethods.filter((m) => !methods.includes(m));

  return (
    <div className="p-5 flex flex-col h-full">
      <div className="flex items-center gap-2 mb-5">
        <button onClick={onBack} className="cursor-pointer hover:text-[#333] text-[#999] transition-colors">
          <ArrowLeft size={16} strokeWidth={1.5} />
        </button>
        <span className="text-[15px] font-semibold text-[#111]">결제수단 관리</span>
      </div>

      {/* 대상 사용자 */}
      <div className="flex items-center gap-2.5 p-3 mb-5" style={{ borderRadius: "10px", backgroundColor: "#f9f9f9" }}>
        <div className="w-9 h-9 rounded-full bg-[#eee] flex items-center justify-center text-[13px] font-bold text-[#555]">
          {getUserName(userId).slice(0, 1)}
        </div>
        <div>
          <p className="text-[14px] font-medium text-[#111]">{getUserName(userId)}</p>
          <p className="text-[11px] text-[#999]">{getUserDept(userId)}</p>
        </div>
      </div>

      {/* 현재 배정된 결제수단 */}
      <label className="block text-[12px] text-[#999] mb-2">배정된 결제수단</label>
      {methods.length > 0 ? (
        <div className="flex flex-col gap-1.5 mb-5">
          {methods.map((m) => (
            <div
              key={m}
              className="flex items-center justify-between p-2.5"
              style={{ borderRadius: "8px", boxShadow: "rgba(0,0,0,0.06) 0px 0px 0px 1px" }}
            >
              <div className="flex items-center gap-2">
                <CreditCard size={14} strokeWidth={1.5} color="#22c55e" />
                <span className="text-[13px] font-medium text-[#111]">{m}</span>
              </div>
              <button
                onClick={() => onRemove(m)}
                className="flex items-center gap-1 px-2 py-1 text-[11px] text-[#ef4444] cursor-pointer hover:bg-red-50 transition-colors"
                style={{ borderRadius: "6px" }}
              >
                <X size={11} strokeWidth={1.5} />회수
              </button>
            </div>
          ))}
        </div>
      ) : (
        <div className="flex items-center gap-2 p-3 mb-5 text-[12px] text-[#999]" style={{ borderRadius: "8px", backgroundColor: "#fef2f2" }}>
          <AlertCircle size={13} strokeWidth={1.5} color="#ef4444" />
          배정된 결제수단이 없습니다.
        </div>
      )}

      {/* 배정 가능한 결제수단 */}
      {available.length > 0 && (
        <>
          <label className="block text-[12px] text-[#999] mb-2">배정 가능한 결제수단</label>
          <div className="flex flex-col gap-1.5">
            {available.map((m) => (
              <button
                key={m}
                onClick={() => onAssign(m)}
                className="flex items-center justify-between p-2.5 text-left cursor-pointer hover:bg-[#f9f9f9] transition-colors"
                style={{ borderRadius: "8px", boxShadow: "rgba(0,0,0,0.06) 0px 0px 0px 1px" }}
              >
                <div className="flex items-center gap-2">
                  <CreditCard size={14} strokeWidth={1.5} color="#ccc" />
                  <span className="text-[13px] text-[#666]">{m}</span>
                </div>
                <span className="flex items-center gap-1 text-[11px] text-[#6366f1] font-medium">
                  <PlusCircle size={12} strokeWidth={1.5} />배정
                </span>
              </button>
            ))}
          </div>
        </>
      )}

      <p className="text-[11px] text-[#bbb] leading-[1.6] mt-5">
        회사에 등록된 결제수단 중 이 구성원에게 배정하거나 회수할 수 있습니다. 새 결제수단은 <strong>회계 → 결제수단 등록</strong>에서 추가합니다.
      </p>
    </div>
  );
}

/* ═══════════════════════════════════════
   적용 조직 선택
   ═══════════════════════════════════════ */

function DepartmentPicker({ selected, onChange }: { selected: string[]; onChange: (d: string[]) => void }) {
  const [open, setOpen] = useState(false);
  const deptNames = departments.filter((d) => d.id !== "dept-all").map((d) => d.name);

  const toggle = (name: string) => {
    onChange(selected.includes(name) ? selected.filter((d) => d !== name) : [...selected, name]);
  };

  return (
    <div className="max-w-[480px]">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between px-3 py-2 text-[13px] text-[#999] cursor-pointer hover:bg-[#fafafa] transition-colors"
        style={{ borderRadius: "8px", boxShadow: "rgba(0,0,0,0.06) 0px 0px 0px 1px" }}
      >
        + 조직 선택
        <ChevronDown size={14} strokeWidth={1.5} style={{ transform: open ? "rotate(180deg)" : "rotate(0)", transition: "transform 0.2s" }} />
      </button>
      {open && (
        <div className="mt-1 p-2 flex flex-col gap-0.5" style={{ borderRadius: "8px", boxShadow: "rgba(0,0,0,0.08) 0px 4px 16px, rgba(0,0,0,0.04) 0px 0px 0px 1px", backgroundColor: "#fff" }}>
          {deptNames.map((name) => {
            const active = selected.includes(name);
            return (
              <button
                key={name}
                onClick={() => toggle(name)}
                className="flex items-center gap-2 px-2.5 py-1.5 text-[13px] cursor-pointer hover:bg-[#f5f5f5] transition-colors"
                style={{ borderRadius: "6px", color: active ? "#111" : "#666", fontWeight: active ? 500 : 400 }}
              >
                <div className="w-4 h-4 rounded flex items-center justify-center" style={{ backgroundColor: active ? "#111" : "#eee" }}>
                  {active && <Check size={10} strokeWidth={2.5} color="#fff" />}
                </div>
                {name}
              </button>
            );
          })}
        </div>
      )}
      {selected.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mt-2">
          {selected.map((d) => (
            <span key={d} className="inline-flex items-center gap-1 px-2 py-1 text-[12px] bg-[#f5f5f5] text-[#555]" style={{ borderRadius: "6px" }}>
              {d}
              <button onClick={() => onChange(selected.filter((x) => x !== d))} className="cursor-pointer hover:text-[#ef4444]">
                <X size={10} strokeWidth={1.5} />
              </button>
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
