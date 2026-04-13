"use client";

import { useState } from "react";
import { Plus, Pencil, Trash2, Upload, History } from "lucide-react";
import { useSettingsStore, type DescriptionRule, type RuleHistorySource } from "@/lib/settings-store";
import DescriptionRuleModal, { type RuleDraft } from "@/components/settings/DescriptionRuleModal";
import UploadStandardsModal from "@/components/settings/UploadStandardsModal";
import RuleHistoryDrawer from "@/components/settings/RuleHistoryDrawer";

export default function AccountingDescription() {
  const {
    descriptionRules,
    descriptionRuleHistory,
    aiDescriptionEnabled,
    addDescriptionRule,
    updateDescriptionRule,
    removeDescriptionRule,
    applyDescriptionBulk,
    toggleAiDescription,
  } = useSettingsStore();

  const [ruleModal, setRuleModal] = useState<{ open: boolean; mode: "add" | "edit"; editingId: string | null }>({
    open: false, mode: "add", editingId: null,
  });
  const [uploadOpen, setUploadOpen] = useState(false);
  const [historyOpen, setHistoryOpen] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  const showToast = (msg: string) => { setToast(msg); setTimeout(() => setToast(null), 2500); };

  const editingRule = ruleModal.editingId
    ? descriptionRules.find((r) => r.id === ruleModal.editingId)
    : undefined;

  const handleRuleSubmit = (draft: RuleDraft) => {
    if (ruleModal.mode === "edit" && ruleModal.editingId) {
      updateDescriptionRule(ruleModal.editingId, draft, "manual");
      showToast(`'${draft.category}' 규칙이 수정되었어요`);
    } else {
      addDescriptionRule(draft, "manual");
      showToast(`'${draft.category}' 규칙이 추가되었어요`);
    }
    setRuleModal({ open: false, mode: "add", editingId: null });
  };

  const handleBulkApply = (selected: Omit<DescriptionRule, "id">[], source: RuleHistorySource) => {
    const result = applyDescriptionBulk(selected, source);
    setUploadOpen(false);
    showToast(
      `사내 기준이 적용되었어요 — 신규 ${result.added} · 변경 ${result.updated}` +
      (result.skipped > 0 ? ` (${result.skipped}건 무시)` : "")
    );
  };

  return (
    <div className="max-w-[640px]">
      <div className="flex items-center justify-between mb-5">
        <h2 className="text-[18px] font-semibold">적요설정</h2>
        <button
          onClick={() => setHistoryOpen(true)}
          className="flex items-center gap-1.5 px-3 py-[6px] text-[12px] font-medium text-[#4e4e4e] bg-white cursor-pointer hover:bg-[#fafafa]"
          style={{ borderRadius: "8px", boxShadow: "rgba(0,0,0,0.08) 0px 0px 0px 1px" }}
        >
          <History size={13} strokeWidth={1.5} />
          변경기록 ({descriptionRuleHistory.length})
        </button>
      </div>

      {/* AI 추천 토글 */}
      <div className="flex items-center justify-between p-4 mb-5" style={{ borderRadius: "12px", boxShadow: "rgba(0,0,0,0.06) 0px 0px 0px 1px" }}>
        <div>
          <p className="text-[14px] font-medium">AI 적요 추천</p>
          <p className="text-[12px] text-[#777] mt-0.5">주문 시 카테고리 매칭으로 적요 코드를 자동 추천합니다 (더존 ERP 연동)</p>
        </div>
        <button
          onClick={() => { toggleAiDescription(!aiDescriptionEnabled); showToast(`AI 적요 추천을 ${!aiDescriptionEnabled ? "켰습니다" : "껐습니다"}`); }}
          className="w-[40px] h-[22px] rounded-full cursor-pointer relative"
          style={{ backgroundColor: aiDescriptionEnabled ? "#000" : "#e5e5e5" }}
        >
          <span className="absolute top-[2px] w-[18px] h-[18px] rounded-full bg-white transition-all" style={{ left: aiDescriptionEnabled ? "20px" : "2px", boxShadow: "rgba(0,0,0,0.1) 0px 1px 2px" }} />
        </button>
      </div>

      {/* 액션 버튼 */}
      <div className="flex items-center justify-between mb-3">
        <p className="text-[12px] text-[#999]">적요 규칙 매핑 ({descriptionRules.length}개)</p>
        <div className="flex gap-2">
          <button
            onClick={() => setRuleModal({ open: true, mode: "add", editingId: null })}
            className="flex items-center gap-1.5 px-3 py-[6px] text-[12px] font-medium text-[#4e4e4e] bg-[#f5f5f5] rounded-lg cursor-pointer hover:bg-[#ebebeb]"
          >
            <Plus size={13} strokeWidth={1.5} />새 규칙
          </button>
          <button
            onClick={() => setUploadOpen(true)}
            className="flex items-center gap-1.5 px-3 py-[6px] text-[12px] font-medium text-white bg-black rounded-lg cursor-pointer hover:opacity-80"
          >
            <Upload size={13} strokeWidth={1.5} />사내 기준 업로드
          </button>
        </div>
      </div>

      {/* 규칙 표 */}
      <div className="overflow-hidden bg-white" style={{ borderRadius: "12px", boxShadow: "rgba(0,0,0,0.06) 0px 0px 0px 1px" }}>
        <div
          className="grid items-center gap-2 px-4 py-2 text-[11px] font-medium text-[#999] uppercase tracking-wider"
          style={{ gridTemplateColumns: "1.4fr 80px 1fr 1.6fr 32px", borderBottom: "1px solid #e5e5e5" }}
        >
          <span>카테고리</span>
          <span>코드</span>
          <span>계정과목</span>
          <span>적요 텍스트</span>
          <span />
        </div>
        {descriptionRules.length === 0 ? (
          <p className="px-4 py-8 text-center text-[12px] text-[#999]">등록된 규칙이 없습니다. 새 규칙을 추가해주세요.</p>
        ) : (
          descriptionRules.map((r, i) => (
            <div
              key={r.id}
              className="grid items-center gap-2 px-4 py-2.5 text-[13px] hover:bg-[#fafafa] group"
              style={{ gridTemplateColumns: "1.4fr 80px 1fr 1.6fr 32px", borderBottom: i < descriptionRules.length - 1 ? "1px solid rgba(0,0,0,0.04)" : undefined }}
            >
              <span className="font-medium text-[#1a1a1a]">{r.category}</span>
              <span className="text-[#777] font-mono text-[12px]">{r.code}</span>
              <span className="text-[#444]">{r.account}</span>
              <span className="text-[#777] text-[12px] truncate">{r.memo}</span>
              <div className="flex gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                <button
                  onClick={() => setRuleModal({ open: true, mode: "edit", editingId: r.id })}
                  className="w-6 h-6 rounded flex items-center justify-center cursor-pointer hover:bg-[#ebebeb]"
                  aria-label="수정"
                >
                  <Pencil size={11} strokeWidth={1.5} color="#777" />
                </button>
                <button
                  onClick={() => { removeDescriptionRule(r.id, "manual"); showToast(`'${r.category}' 규칙을 삭제했어요`); }}
                  className="w-6 h-6 rounded flex items-center justify-center cursor-pointer hover:bg-[#ebebeb]"
                  aria-label="삭제"
                >
                  <Trash2 size={11} strokeWidth={1.5} color="#777" />
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      <p className="text-[11px] text-[#999] mt-3">
        * 매칭 우선순위: 위에서부터 순차 평가. 카테고리 키워드가 상품명·태그에 포함되면 해당 규칙 적용.
      </p>

      {/* 모달들 */}
      <DescriptionRuleModal
        open={ruleModal.open}
        mode={ruleModal.mode}
        initial={editingRule ? { category: editingRule.category, code: editingRule.code, account: editingRule.account, memo: editingRule.memo } : undefined}
        onClose={() => setRuleModal({ open: false, mode: "add", editingId: null })}
        onSubmit={handleRuleSubmit}
      />
      <UploadStandardsModal
        open={uploadOpen}
        existingRules={descriptionRules}
        onClose={() => setUploadOpen(false)}
        onApply={handleBulkApply}
      />
      <RuleHistoryDrawer
        open={historyOpen}
        history={descriptionRuleHistory}
        onClose={() => setHistoryOpen(false)}
      />

      {toast && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[60] px-4 py-2.5 bg-[#1a1a1a] text-white text-[13px] font-medium" style={{ borderRadius: "10px" }}>
          {toast}
        </div>
      )}
    </div>
  );
}
