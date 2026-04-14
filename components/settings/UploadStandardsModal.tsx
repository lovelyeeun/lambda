"use client";

import { useState } from "react";
import {
  X, FileSpreadsheet, FileText, MessageSquare, Paperclip, Sparkles, Loader2, Check,
} from "lucide-react";
import { PlannedTooltip } from "@/components/ui/Tooltip";
import type { DescriptionRule, RuleHistorySource } from "@/lib/settings-store";

type Tab = "excel" | "doc" | "prompt";
type Phase = "input" | "analyzing" | "preview";

export interface ParsedItem {
  rule: Omit<DescriptionRule, "id">;
  /** 신규 / 변경 / 무시 */
  status: "new" | "update" | "skip";
  /** 변경 시 기존 규칙 */
  before?: DescriptionRule;
  /** 적용 여부 (체크박스) */
  selected: boolean;
}

/* 엑셀/문서/프롬프트 모두 더미 파싱 — 아래 데이터로 시뮬레이션 */
const MOCK_PARSED_RAW: Omit<DescriptionRule, "id">[] = [
  { category: "노트북", code: "8240", account: "비품", memo: "업무용 노트북 (15만원 이상 자산화)" },
  { category: "모니터", code: "8240", account: "비품", memo: "외부 모니터" },
  { category: "키보드/마우스", code: "8220", account: "소모품비", memo: "주변기기 소모품" },
  { category: "사무가구", code: "8240", account: "비품", memo: "책상·의자·캐비닛" },
  { category: "도서구입", code: "8230", account: "도서인쇄비", memo: "업무 관련 서적" },
  { category: "교통비", code: "8260", account: "차량유지비", memo: "출장·외근 교통비" },
  { category: "인쇄/명함", code: "8230", account: "도서인쇄비", memo: "명함·브로셔 인쇄" },
  { category: "간식/다과", code: "8270", account: "복리후생비", memo: "사무실 간식·음료" },
  { category: "잉크/토너", code: "8220", account: "소모품비", memo: "프린터 소모품" }, // 기존과 완전 동일 (skip)
  { category: "사무용품", code: "8210", account: "사무용품비", memo: "문구류 (펜·노트·파일)" }, // 기존 memo 만 다름 (update)
];

interface Props {
  open: boolean;
  /** 현재 store 의 규칙들 (충돌 분류용) */
  existingRules: DescriptionRule[];
  onClose: () => void;
  onApply: (selected: Omit<DescriptionRule, "id">[], source: RuleHistorySource) => void;
}

export default function UploadStandardsModal({ open, existingRules, onClose, onApply }: Props) {
  const [tab, setTab] = useState<Tab>("excel");
  const [phase, setPhase] = useState<Phase>("input");
  const [excelFileName, setExcelFileName] = useState<string | null>(null);
  const [docFileName, setDocFileName] = useState<string | null>(null);
  const [promptText, setPromptText] = useState("");
  const [parsed, setParsed] = useState<ParsedItem[]>([]);

  if (!open) return null;

  const reset = () => {
    setPhase("input");
    setExcelFileName(null);
    setDocFileName(null);
    setPromptText("");
    setParsed([]);
    setTab("excel");
  };

  const handleClose = () => { reset(); onClose(); };

  /** 입력 → 분석 단계로 전환 + 더미 분류 */
  const handleAnalyze = () => {
    setPhase("analyzing");
    setTimeout(() => {
      const items: ParsedItem[] = MOCK_PARSED_RAW.map((r) => {
        const existing = existingRules.find((x) => x.category === r.category);
        if (!existing) return { rule: r, status: "new", selected: true };
        if (existing.code === r.code && existing.account === r.account && existing.memo === r.memo) {
          return { rule: r, status: "skip", before: existing, selected: false };
        }
        return { rule: r, status: "update", before: existing, selected: true };
      });
      setParsed(items);
      setPhase("preview");
    }, 1100);
  };

  const ready =
    (tab === "excel" && excelFileName !== null) ||
    (tab === "doc" && docFileName !== null) ||
    (tab === "prompt" && promptText.trim().length >= 10);

  const sourceForTab = (): RuleHistorySource =>
    tab === "excel" ? "upload-excel" : tab === "doc" ? "upload-doc" : "upload-prompt";

  const toggleItem = (i: number) =>
    setParsed((prev) => prev.map((p, idx) => (idx === i ? { ...p, selected: !p.selected } : p)));

  const selectedCount = parsed.filter((p) => p.selected).length;
  const newCount = parsed.filter((p) => p.status === "new").length;
  const updateCount = parsed.filter((p) => p.status === "update").length;
  const skipCount = parsed.filter((p) => p.status === "skip").length;

  const handleApply = () => {
    const toApply = parsed.filter((p) => p.selected).map((p) => p.rule);
    if (toApply.length === 0) return;
    onApply(toApply, sourceForTab());
    reset();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/40" onClick={handleClose} />
      <div
        className="relative bg-white w-[720px] max-h-[88vh] flex flex-col"
        style={{ borderRadius: "16px", boxShadow: "rgba(0,0,0,0.08) 0px 8px 40px" }}
      >
        {/* 헤더 */}
        <div className="flex items-center justify-between px-6 pt-5 pb-3">
          <div>
            <h3 className="text-[17px] font-semibold">사내 회계 기준 업로드</h3>
            <p className="text-[12px] text-[#999] mt-0.5">엑셀·문서·프롬프트 중 한 가지로 사내 적요 규칙을 일괄 적용합니다.</p>
          </div>
          <button onClick={handleClose} className="w-7 h-7 rounded-lg flex items-center justify-center cursor-pointer hover:bg-[#f5f5f5]">
            <X size={18} color="#777" />
          </button>
        </div>

        {/* 탭 */}
        {phase === "input" && (
          <div className="px-6 flex gap-1 border-b border-[#eee]">
            <TabBtn active={tab === "excel"} onClick={() => setTab("excel")} icon={<FileSpreadsheet size={14} strokeWidth={1.5} />} label="엑셀로 업로드" />
            <TabBtn active={tab === "doc"} onClick={() => setTab("doc")} icon={<FileText size={14} strokeWidth={1.5} />} label="문서로 업로드" />
            <TabBtn active={tab === "prompt"} onClick={() => setTab("prompt")} icon={<MessageSquare size={14} strokeWidth={1.5} />} label="프롬프트로 입력" />
          </div>
        )}

        {/* 본문 */}
        <div className="flex-1 overflow-y-auto px-6 py-5">
          {phase === "input" && tab === "excel" && (
            <ExcelInput fileName={excelFileName} onUpload={setExcelFileName} onClear={() => setExcelFileName(null)} />
          )}
          {phase === "input" && tab === "doc" && (
            <DocInput fileName={docFileName} onUpload={setDocFileName} onClear={() => setDocFileName(null)} />
          )}
          {phase === "input" && tab === "prompt" && (
            <PromptInput value={promptText} onChange={setPromptText} />
          )}
          {phase === "analyzing" && <AnalyzingView />}
          {phase === "preview" && (
            <PreviewView
              items={parsed}
              onToggle={toggleItem}
              counts={{ new: newCount, update: updateCount, skip: skipCount }}
            />
          )}
        </div>

        {/* 푸터 */}
        <div className="px-6 py-4 border-t border-[#eee] flex justify-between items-center">
          {phase === "preview" ? (
            <span className="text-[12px] text-[#777]">{selectedCount}개 선택됨 (전체 {parsed.length}개)</span>
          ) : <span />}
          <div className="flex gap-2">
            <button
              onClick={handleClose}
              className="px-4 py-2.5 text-[14px] font-medium text-[#4e4e4e] bg-white cursor-pointer hover:bg-[#fafafa]"
              style={{ borderRadius: "10px", boxShadow: "rgba(0,0,0,0.12) 0px 0px 0px 1px" }}
            >
              {phase === "preview" ? "닫기" : "취소"}
            </button>
            {phase === "input" && (
              <button
                disabled={!ready}
                onClick={handleAnalyze}
                className="flex items-center gap-1.5 px-5 py-2.5 text-[14px] font-medium text-white rounded-lg"
                style={{
                  backgroundColor: ready ? "#000" : "#bdbdbd",
                  cursor: ready ? "pointer" : "not-allowed",
                  borderRadius: "10px",
                }}
              >
                <Sparkles size={14} strokeWidth={2} />
                AI 분석 시작
              </button>
            )}
            {phase === "preview" && (
              <button
                disabled={selectedCount === 0}
                onClick={handleApply}
                className="flex items-center gap-1.5 px-5 py-2.5 text-[14px] font-medium text-white rounded-lg"
                style={{
                  backgroundColor: selectedCount > 0 ? "#000" : "#bdbdbd",
                  cursor: selectedCount > 0 ? "pointer" : "not-allowed",
                  borderRadius: "10px",
                }}
              >
                <Check size={14} strokeWidth={2} />
                선택 항목 적용
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

/* ─── 탭 버튼 ─── */
function TabBtn({ active, onClick, icon, label }: { active: boolean; onClick: () => void; icon: React.ReactNode; label: string }) {
  return (
    <button
      onClick={onClick}
      className="flex items-center gap-1.5 px-4 py-2.5 text-[13px] font-medium cursor-pointer"
      style={{
        color: active ? "#000" : "#999",
        borderBottom: active ? "2px solid #000" : "2px solid transparent",
        marginBottom: "-1px",
      }}
    >
      {icon}{label}
    </button>
  );
}

/* ─── 엑셀 입력 ─── */
function ExcelInput({ fileName, onUpload, onClear }: { fileName: string | null; onUpload: (n: string) => void; onClear: () => void }) {
  return (
    <div className="flex flex-col gap-5">
      <div>
        <p className="text-[13px] font-semibold text-[#1a1a1a] mb-2">템플릿 다운로드</p>
        <div className="flex gap-2">
          <div className="flex-1 flex items-center gap-2 px-3 py-2.5 bg-white" style={inputStyle}>
            <FileSpreadsheet size={16} strokeWidth={1.5} color="#777" />
            <span className="text-[13px] text-[#444]">lambda_description_rules_template.xlsx</span>
          </div>
          <PlannedTooltip description="더존 회계코드 매핑 템플릿 다운로드 (실파일 미생성)">
            <button className="px-5 py-2.5 text-[13px] font-medium text-white bg-black rounded-lg cursor-pointer hover:opacity-80">다운로드</button>
          </PlannedTooltip>
        </div>
        <p className="text-[11px] text-[#777] mt-2">
          * 컬럼: 카테고리 / 계정과목 코드 / 계정과목명 / 적요 텍스트 (4열).
        </p>
      </div>

      <div className="border-t border-[#eee]" />

      <div>
        <p className="text-[13px] font-semibold text-[#1a1a1a] mb-2">파일 업로드</p>
        <div className="flex gap-2">
          <div className="flex-1 flex items-center gap-2 px-3 py-2.5 bg-white" style={inputStyle}>
            <Paperclip size={14} strokeWidth={1.5} color="#777" />
            <span className="flex-1 text-[13px]" style={{ color: fileName ? "#444" : "#bbb" }}>
              {fileName ?? "엑셀 파일을 업로드해주세요."}
            </span>
            {fileName && <button onClick={onClear} className="text-[#999] hover:text-[#555]"><X size={14} /></button>}
          </div>
          <label className="px-5 py-2.5 text-[13px] font-medium text-[#4e4e4e] bg-white cursor-pointer hover:bg-[#fafafa]" style={{ borderRadius: "10px", boxShadow: "rgba(0,0,0,0.12) 0px 0px 0px 1px" }}>
            파일 선택
            <input type="file" accept=".xlsx,.xls,.csv" hidden onChange={(e) => { const f = e.target.files?.[0]; if (f) onUpload(f.name); e.target.value = ""; }} />
          </label>
        </div>
      </div>
    </div>
  );
}

/* ─── 문서 입력 (PDF/Word) ─── */
function DocInput({ fileName, onUpload, onClear }: { fileName: string | null; onUpload: (n: string) => void; onClear: () => void }) {
  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-start gap-2 px-3 py-2.5 bg-[rgba(99,102,241,0.06)]" style={{ borderRadius: "10px" }}>
        <Sparkles size={14} strokeWidth={1.5} color="#6366f1" className="mt-0.5 shrink-0" />
        <p className="text-[12px] text-[#4338ca]">
          회계 정책 문서를 업로드하면 AI 가 본문에서 카테고리·계정과목 매핑 규칙을 추출합니다.
          (사내 회계 규정 PDF, 매뉴얼 등)
        </p>
      </div>
      <div className="flex gap-2">
        <div className="flex-1 flex items-center gap-2 px-3 py-2.5 bg-white" style={inputStyle}>
          <Paperclip size={14} strokeWidth={1.5} color="#777" />
          <span className="flex-1 text-[13px]" style={{ color: fileName ? "#444" : "#bbb" }}>
            {fileName ?? "PDF 또는 Word 파일을 업로드해주세요."}
          </span>
          {fileName && <button onClick={onClear} className="text-[#999] hover:text-[#555]"><X size={14} /></button>}
        </div>
        <label className="px-5 py-2.5 text-[13px] font-medium text-[#4e4e4e] bg-white cursor-pointer hover:bg-[#fafafa]" style={{ borderRadius: "10px", boxShadow: "rgba(0,0,0,0.12) 0px 0px 0px 1px" }}>
          파일 선택
          <input type="file" accept=".pdf,.doc,.docx" hidden onChange={(e) => { const f = e.target.files?.[0]; if (f) onUpload(f.name); e.target.value = ""; }} />
        </label>
      </div>
      <p className="text-[11px] text-[#999]">* 프로토타입에서는 더미 파싱 결과를 사용합니다 (실제 문서 분석 미구현).</p>
    </div>
  );
}

/* ─── 프롬프트 입력 ─── */
function PromptInput({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-start gap-2 px-3 py-2.5 bg-[rgba(99,102,241,0.06)]" style={{ borderRadius: "10px" }}>
        <Sparkles size={14} strokeWidth={1.5} color="#6366f1" className="mt-0.5 shrink-0" />
        <p className="text-[12px] text-[#4338ca]">
          사내 회계 정책을 자연어로 설명하면 AI 가 카테고리·계정과목 매핑 규칙으로 변환합니다.
        </p>
      </div>
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        rows={8}
        placeholder={"예) 노트북·모니터 등 IT 기기는 비품(8240)으로 분류해주세요. 잉크·토너·키보드 등 주변기기는 소모품비(8220)로 처리하고, 명함·인쇄물은 도서인쇄비(8230)로 잡아주세요."}
        className="w-full px-3 py-2.5 text-[13px] outline-none resize-none"
        style={{ ...inputStyle, lineHeight: "1.6" }}
      />
      <p className="text-[11px] text-[#999]">* 최소 10자 이상 입력하면 분석이 시작됩니다. (프로토타입은 더미 결과 표시)</p>
    </div>
  );
}

/* ─── 분석 중 ─── */
function AnalyzingView() {
  const steps = ["내용 파싱 중", "기존 규칙과 비교 중", "신규/변경/무시 분류 중"];
  return (
    <div className="flex flex-col items-center justify-center py-12 gap-4">
      <Loader2 size={28} strokeWidth={1.5} color="#6366f1" className="animate-spin" />
      <p className="text-[14px] font-medium text-[#1a1a1a]">AI 가 사내 기준을 분석 중이에요</p>
      <div className="flex flex-col gap-1.5">
        {steps.map((s, i) => (
          <p key={i} className="text-[12px] text-[#999]" style={{ animationDelay: `${i * 200}ms` }}>· {s}</p>
        ))}
      </div>
    </div>
  );
}

/* ─── 미리보기 (분류 + 체크박스) ─── */
function PreviewView({ items, onToggle, counts }: { items: ParsedItem[]; onToggle: (i: number) => void; counts: { new: number; update: number; skip: number } }) {
  const sections: { status: ParsedItem["status"]; label: string; color: string; bg: string }[] = [
    { status: "new", label: `신규 (${counts.new})`, color: "#16a34a", bg: "rgba(22,163,74,0.08)" },
    { status: "update", label: `변경 — 덮어쓰기 (${counts.update})`, color: "#f59e0b", bg: "rgba(245,158,11,0.08)" },
    { status: "skip", label: `무시 — 동일 (${counts.skip})`, color: "#999", bg: "rgba(0,0,0,0.04)" },
  ];

  return (
    <div className="flex flex-col gap-4">
      {/* 요약 */}
      <div className="flex items-center gap-2 px-3 py-2.5 bg-[#fafafa]" style={{ borderRadius: "10px" }}>
        <Sparkles size={13} strokeWidth={1.5} color="#000" />
        <p className="text-[12px] text-[#444]">
          총 <strong>{items.length}개</strong> 규칙을 추출했어요. 신규 <strong>{counts.new}</strong> · 변경 <strong>{counts.update}</strong> · 무시 <strong>{counts.skip}</strong>
        </p>
      </div>

      {sections.map((sec) => {
        const list = items.map((it, i) => ({ it, i })).filter(({ it }) => it.status === sec.status);
        if (list.length === 0) return null;
        return (
          <div key={sec.status}>
            <div className="flex items-center gap-2 mb-2">
              <span className="text-[11px] font-semibold px-2 py-0.5 rounded" style={{ color: sec.color, backgroundColor: sec.bg }}>{sec.label}</span>
            </div>
            <div className="flex flex-col gap-1">
              {list.map(({ it, i }) => (
                <label
                  key={i}
                  className="flex items-center gap-3 px-3 py-2.5 cursor-pointer hover:bg-[#fafafa]"
                  style={{ borderRadius: "8px", boxShadow: "rgba(0,0,0,0.06) 0px 0px 0px 1px" }}
                >
                  <input
                    type="checkbox"
                    checked={it.selected}
                    onChange={() => onToggle(i)}
                    disabled={it.status === "skip"}
                    className="w-4 h-4 cursor-pointer"
                  />
                  <div className="flex-1 grid items-center gap-2" style={{ gridTemplateColumns: "120px 60px 1fr" }}>
                    <span className="text-[13px] font-medium">{it.rule.category}</span>
                    <span className="text-[12px] text-[#777] font-mono">{it.rule.code}</span>
                    <div>
                      <p className="text-[12px] text-[#444]">{it.rule.account}</p>
                      <p className="text-[11px] text-[#999]">{it.rule.memo}</p>
                    </div>
                  </div>
                  {it.status === "update" && it.before && (
                    <div className="text-[10px] text-[#999] text-right shrink-0">
                      <p className="line-through">{it.before.code} {it.before.account}</p>
                      <p className="text-[#f59e0b]">→ 덮어쓰기</p>
                    </div>
                  )}
                </label>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}

const inputStyle = {
  borderRadius: "8px",
  boxShadow: "rgba(0,0,0,0.08) 0px 0px 0px 1px",
  border: "none",
} as const;
