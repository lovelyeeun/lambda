"use client";

import { useState, useRef, useEffect } from "react";
import {
  CreditCard, Plus, X, Check, Clock, MoreHorizontal, Settings,
} from "lucide-react";

/* ═══════════════════════════════════════
   Dummy Data
   ═══════════════════════════════════════ */

interface PaymentMethod {
  id: string;
  type: "카드결제" | "BNPL";
  name: string;
  subLabel: string;
  budgetStatus: "사용중" | "미사용";
  budgetAmount: string;
  spent: string;
  usagePercent: string;
  resetCycle: string;
}

const initialMethods: PaymentMethod[] = [
  {
    id: "pm-1", type: "카드결제", name: "종법기명_신한 (1)",
    subLabel: "[신한카드법인] 5525-76**-****-850*",
    budgetStatus: "사용중", budgetAmount: "1,000,000원", spent: "-", usagePercent: "0%", resetCycle: "매월 1일",
  },
  {
    id: "pm-2", type: "카드결제", name: "종법기명_신한",
    subLabel: "[신한카드법인] 5525-76**-****-850*",
    budgetStatus: "사용중", budgetAmount: "1,000,000원", spent: "-", usagePercent: "0%", resetCycle: "매월 1일",
  },
  {
    id: "pm-3", type: "카드결제", name: "김원균 (1) (1)",
    subLabel: "[신한카드법인] 5525-76**-****-586*",
    budgetStatus: "미사용", budgetAmount: "-", spent: "-", usagePercent: "-", resetCycle: "-",
  },
  {
    id: "pm-4", type: "카드결제", name: "김원균 (1)",
    subLabel: "[신한카드법인] 5525-76**-****-586*",
    budgetStatus: "미사용", budgetAmount: "-", spent: "-", usagePercent: "-", resetCycle: "-",
  },
  {
    id: "pm-5", type: "카드결제", name: "김원균",
    subLabel: "[신한카드법인] 5525-76**-****-586*",
    budgetStatus: "미사용", budgetAmount: "-", spent: "-", usagePercent: "-", resetCycle: "-",
  },
  {
    id: "pm-6", type: "BNPL", name: "소모품 구매",
    subLabel: "[로랩스] 2948701037",
    budgetStatus: "미사용", budgetAmount: "-", spent: "-", usagePercent: "-", resetCycle: "-",
  },
  {
    id: "pm-7", type: "BNPL", name: "자산 구매용",
    subLabel: "[로랩스] 2948701037",
    budgetStatus: "미사용", budgetAmount: "-", spent: "-", usagePercent: "-", resetCycle: "-",
  },
  {
    id: "pm-8", type: "BNPL", name: "간식 결제용",
    subLabel: "[로랩스] 2948701037",
    budgetStatus: "미사용", budgetAmount: "-", spent: "-", usagePercent: "-", resetCycle: "-",
  },
];

const businessInfo = {
  ceo: "김원균",
  bizNumber: "2948701037",
  address: "(04147) 서울 마포구 백범로31길 21 본관 7층, 726호",
  bizType: "IT/IT",
};

/* ═══════════════════════════════════════
   Main Component
   ═══════════════════════════════════════ */

export default function AccountingPayment() {
  const [methods] = useState<PaymentMethod[]>(initialMethods);
  const [addMenuOpen, setAddMenuOpen] = useState(false);
  const [cardModalOpen, setCardModalOpen] = useState(false);
  const [bnplAddModalOpen, setBnplAddModalOpen] = useState(false);
  const [bnplApplyModalOpen, setBnplApplyModalOpen] = useState(false);
  const [bnplApplied, setBnplApplied] = useState(false);
  const [bnplApproved, setBnplApproved] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const [menuOpen, setMenuOpen] = useState<string | null>(null);
  const addBtnRef = useRef<HTMLDivElement>(null);

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3000);
  };

  /* 드롭다운 외부 클릭 닫기 */
  useEffect(() => {
    if (!addMenuOpen) return;
    const handler = (e: MouseEvent) => {
      if (addBtnRef.current && !addBtnRef.current.contains(e.target as Node)) {
        setAddMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [addMenuOpen]);

  return (
    <div>
      <h2 className="text-[18px] font-semibold mb-5">결제수단 관리</h2>

      {/* ── Top actions ── */}
      <div className="flex items-center gap-3 mb-5">
        {/* 결제수단 추가 + 드롭다운 */}
        <div className="relative" ref={addBtnRef}>
          <button
            onClick={() => setAddMenuOpen(!addMenuOpen)}
            className="flex items-center gap-2 px-5 py-[9px] text-[13px] font-medium text-white bg-[#1a1a1a] rounded-lg cursor-pointer transition-opacity hover:opacity-80"
          >
            <CreditCard size={15} strokeWidth={1.5} />
            결제수단 추가
          </button>

          {addMenuOpen && (
            <div
              className="absolute left-0 top-full mt-2 w-[180px] bg-white py-1.5 z-30"
              style={{ borderRadius: "10px", boxShadow: "rgba(0,0,0,0.06) 0px 0px 0px 1px, rgba(0,0,0,0.08) 0px 4px 16px" }}
            >
              <button
                onClick={() => { setAddMenuOpen(false); setCardModalOpen(true); }}
                className="w-full text-left px-4 py-2.5 text-[13px] text-[#333] cursor-pointer hover:bg-[#f5f5f5] flex items-center gap-2.5 transition-colors"
              >
                <Plus size={14} strokeWidth={1.5} color="#999" />
                카드
              </button>
              <button
                onClick={() => {
                  setAddMenuOpen(false);
                  if (bnplApproved) {
                    setBnplAddModalOpen(true);
                  } else {
                    showToast("BNPL 승인 후 추가할 수 있습니다");
                  }
                }}
                className="w-full text-left px-4 py-2.5 text-[13px] text-[#333] cursor-pointer hover:bg-[#f5f5f5] flex items-center gap-2.5 transition-colors"
              >
                <Plus size={14} strokeWidth={1.5} color="#999" />
                BNPL
              </button>
              <button
                onClick={() => { setAddMenuOpen(false); showToast("예정: 계좌이체 등록"); }}
                className="w-full text-left px-4 py-2.5 text-[13px] text-[#333] cursor-pointer hover:bg-[#f5f5f5] flex items-center gap-2.5 transition-colors"
              >
                <Plus size={14} strokeWidth={1.5} color="#999" />
                계좌이체
              </button>
            </div>
          )}
        </div>

        {/* BNPL 상태에 따른 추가 버튼 */}
        {!bnplApplied && !bnplApproved && (
          <button
            onClick={() => setBnplApplyModalOpen(true)}
            className="flex items-center gap-2 px-4 py-[9px] text-[13px] font-medium text-[#777169] bg-[rgba(245,242,239,0.8)] rounded-lg cursor-pointer transition-colors hover:bg-[#efe9e3]"
            style={{ boxShadow: "rgba(78,50,23,0.04) 0px 2px 8px" }}
          >
            BNPL 신청
          </button>
        )}
        {bnplApplied && !bnplApproved && (
          <div className="flex items-center gap-2">
            <span className="flex items-center gap-1 px-3 py-[7px] text-[12px] font-medium text-[#f59e0b] bg-[rgba(245,158,11,0.08)] rounded-lg">
              <Clock size={12} strokeWidth={2} />
              BNPL 신청 대기중
            </span>
            {/* 프로토타입 전용 */}
            <button
              onClick={() => { setBnplApproved(true); showToast("BNPL이 승인되었습니다"); }}
              className="px-3 py-[7px] text-[11px] font-medium text-[#777] bg-[#f5f5f5] rounded-lg cursor-pointer hover:bg-[#eee]"
              style={{ border: "1px dashed #ddd" }}
            >
              ⚙ 승인 처리
            </button>
          </div>
        )}
      </div>

      {/* ── Table ── */}
      <div
        className="bg-white overflow-hidden"
        style={{ borderRadius: "12px", boxShadow: "rgba(0,0,0,0.06) 0px 0px 0px 1px" }}
      >
        {/* Table header */}
        <div
          className="grid items-center px-5 py-3 text-[12px] font-medium text-[#777] bg-[#fafafa] select-none"
          style={{
            gridTemplateColumns: "100px 1fr 110px 130px 100px 110px 110px 40px",
            borderBottom: "1px solid rgba(0,0,0,0.06)",
          }}
        >
          <span className="flex items-center gap-1 cursor-pointer">유형 <SortIcon /></span>
          <span className="flex items-center gap-1 cursor-pointer">결제수단명 <SortIcon /></span>
          <span>예산 사용 여부</span>
          <span>예산 (배정) 여부</span>
          <span>집행 금액</span>
          <span>예산 사용량(%)</span>
          <span>예산 리셋 주기</span>
          <span />
        </div>

        {/* Table rows */}
        {methods.map((m) => (
          <div
            key={m.id}
            className="grid items-center px-5 py-3.5 text-[13px] transition-colors hover:bg-[#fafafa] relative"
            style={{
              gridTemplateColumns: "100px 1fr 110px 130px 100px 110px 110px 40px",
              borderBottom: "1px solid rgba(0,0,0,0.04)",
            }}
          >
            <span className="text-[12px] text-[#999]">{m.type}</span>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-medium text-[#222]">{m.name}</span>
                <span className="w-4 h-4 rounded-full bg-[#f5f5f5] flex items-center justify-center text-[10px] text-[#bbb] cursor-pointer">i</span>
              </div>
              <p className="text-[12px] text-[#bbb] mt-0.5">{m.subLabel}</p>
            </div>
            <div className="flex items-center gap-1.5">
              <span
                className="w-2 h-2 rounded-full"
                style={{ backgroundColor: m.budgetStatus === "사용중" ? "#f59e0b" : "#ddd" }}
              />
              <span style={{ color: m.budgetStatus === "사용중" ? "#444" : "#bbb" }}>{m.budgetStatus}</span>
            </div>
            <span style={{ color: m.budgetAmount === "-" ? "#ddd" : "#444" }}>{m.budgetAmount}</span>
            <span style={{ color: m.spent === "-" ? "#ddd" : "#444" }}>{m.spent}</span>
            <span style={{ color: m.usagePercent === "-" ? "#ddd" : "#444" }}>{m.usagePercent}</span>
            <span style={{ color: m.resetCycle === "-" ? "#ddd" : "#444" }}>{m.resetCycle}</span>
            <div className="relative">
              <button
                onClick={() => setMenuOpen(menuOpen === m.id ? null : m.id)}
                className="w-7 h-7 rounded-md flex items-center justify-center cursor-pointer hover:bg-[#f0f0f0] transition-colors"
              >
                <MoreHorizontal size={16} strokeWidth={1.5} color="#bbb" />
              </button>
              {menuOpen === m.id && (
                <div
                  className="absolute right-0 top-full mt-1 w-[140px] bg-white py-1 z-20"
                  style={{ borderRadius: "8px", boxShadow: "rgba(0,0,0,0.06) 0px 0px 0px 1px, rgba(0,0,0,0.06) 0px 4px 12px" }}
                >
                  <button
                    onClick={() => { setMenuOpen(null); showToast("설정이 열렸습니다"); }}
                    className="w-full text-left px-3 py-2 text-[12px] text-[#444] cursor-pointer hover:bg-[#f5f5f5] flex items-center gap-2"
                  >
                    <Settings size={13} strokeWidth={1.5} /> 설정
                  </button>
                  <button
                    onClick={() => { setMenuOpen(null); showToast("삭제되었습니다"); }}
                    className="w-full text-left px-3 py-2 text-[12px] text-[#ef4444] cursor-pointer hover:bg-[#f5f5f5] flex items-center gap-2"
                  >
                    <X size={13} strokeWidth={1.5} /> 삭제
                  </button>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* ── 카드 등록 모달 ── */}
      {cardModalOpen && (
        <CardRegistrationModal
          onClose={() => setCardModalOpen(false)}
          onComplete={() => { setCardModalOpen(false); showToast("카드가 등록되었습니다"); }}
        />
      )}

      {/* ── BNPL 추가 모달 (승인 후) ── */}
      {bnplAddModalOpen && (
        <BNPLAddModal
          onClose={() => setBnplAddModalOpen(false)}
          onComplete={() => { setBnplAddModalOpen(false); showToast("BNPL 결제수단이 추가되었습니다"); }}
        />
      )}

      {/* ── BNPL 신청 모달 ── */}
      {bnplApplyModalOpen && (
        <BNPLApplicationModal
          onClose={() => setBnplApplyModalOpen(false)}
          onComplete={() => {
            setBnplApplyModalOpen(false);
            setBnplApplied(true);
            showToast("BNPL 신청이 완료되었습니다");
          }}
        />
      )}

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
   Sort Icon
   ═══════════════════════════════════════ */

function SortIcon() {
  return (
    <svg width="10" height="14" viewBox="0 0 10 14" fill="none" className="opacity-40">
      <path d="M5 1L8 5H2L5 1Z" fill="#999" />
      <path d="M5 13L2 9H8L5 13Z" fill="#999" />
    </svg>
  );
}

/* ═══════════════════════════════════════
   Card Registration Modal (레퍼런스 매칭)
   ═══════════════════════════════════════ */

function CardRegistrationModal({ onClose, onComplete }: { onClose: () => void; onComplete: () => void }) {
  const [allChecked, setAllChecked] = useState(false);
  const [checks, setChecks] = useState([false, false, false, false]);

  const toggleAll = () => {
    const next = !allChecked;
    setAllChecked(next);
    setChecks([next, next, next, next]);
  };
  const toggleOne = (i: number) => {
    const next = [...checks];
    next[i] = !next[i];
    setChecks(next);
    setAllChecked(next.every(Boolean));
  };

  const terms = [
    "전자금융거래 기본약관",
    "개인정보의 수집 및 이용에 대한 동의",
    "개인정보의 제3자 제공 동의",
    "개인정보의 취급위탁 동의",
  ];

  return (
    <ModalBackdrop onClose={onClose}>
      <div
        className="relative bg-white w-[560px] max-h-[90vh] overflow-y-auto"
        style={{ borderRadius: "20px", boxShadow: "rgba(0,0,0,0.08) 0px 8px 40px" }}
      >
        <button
          onClick={onClose}
          className="absolute top-5 right-5 z-10 w-8 h-8 rounded-lg flex items-center justify-center cursor-pointer hover:bg-[#f5f5f5] transition-colors"
        >
          <X size={18} strokeWidth={1.5} color="#777" />
        </button>

        <div className="px-8 pt-8 pb-8">
          <h3 className="text-[22px] font-bold leading-[1.4] mb-1">새로운 카드를 추가합니다.</h3>
          <p className="text-[22px] font-bold leading-[1.4] mb-8 text-[#222]">정보를 입력해주세요.</p>

          {/* 결제수단 이름 */}
          <div className="mb-5">
            <label className="block text-[13px] font-semibold mb-1.5">
              <span className="text-[#ef4444] mr-0.5">*</span>결제수단 이름
            </label>
            <input
              placeholder="결제수단 이름을 입력해 주세요."
              className="w-full px-4 py-3 text-[14px] outline-none bg-white transition-colors focus:ring-1 focus:ring-[#ddd]"
              style={{ borderRadius: "10px", boxShadow: "rgba(0,0,0,0.06) 0px 0px 0px 1px" }}
            />
          </div>

          {/* 2열: 생년월일/사업자 + 카드번호 */}
          <div className="grid grid-cols-2 gap-4 mb-5">
            <div>
              <label className="block text-[13px] font-semibold mb-1.5">
                <span className="text-[#ef4444] mr-0.5">*</span>카드 소유자 생년월일(6자) 또는 사업자번호
              </label>
              <input
                placeholder="YYMMDD 또는 10자리 사업자번호"
                className="w-full px-4 py-3 text-[14px] outline-none bg-white"
                style={{ borderRadius: "10px", boxShadow: "rgba(0,0,0,0.06) 0px 0px 0px 1px" }}
              />
            </div>
            <div>
              <label className="block text-[13px] font-semibold mb-1.5">
                <span className="text-[#ef4444] mr-0.5">*</span>카드번호
              </label>
              <input
                placeholder="카드번호 입력"
                className="w-full px-4 py-3 text-[14px] outline-none bg-white"
                style={{ borderRadius: "10px", boxShadow: "rgba(0,0,0,0.06) 0px 0px 0px 1px" }}
              />
            </div>
          </div>

          {/* 2열: 유효기간 월 + 년 */}
          <div className="grid grid-cols-2 gap-4 mb-5">
            <div>
              <label className="block text-[13px] font-semibold mb-1.5">
                <span className="text-[#ef4444] mr-0.5">*</span>유효기간 월 (MM)
              </label>
              <input
                placeholder="MM"
                className="w-full px-4 py-3 text-[14px] outline-none bg-white"
                style={{ borderRadius: "10px", boxShadow: "rgba(0,0,0,0.06) 0px 0px 0px 1px" }}
              />
            </div>
            <div>
              <label className="block text-[13px] font-semibold mb-1.5">
                <span className="text-[#ef4444] mr-0.5">*</span>유효기간 년 (YY)
              </label>
              <input
                placeholder="YY"
                className="w-full px-4 py-3 text-[14px] outline-none bg-white"
                style={{ borderRadius: "10px", boxShadow: "rgba(0,0,0,0.06) 0px 0px 0px 1px" }}
              />
            </div>
          </div>

          {/* 2열: 비밀번호 + 이메일 */}
          <div className="grid grid-cols-2 gap-4 mb-5">
            <div>
              <label className="block text-[13px] font-semibold mb-1.5">
                <span className="text-[#ef4444] mr-0.5">*</span>카드 비밀번호 (앞 2자리)
              </label>
              <input
                placeholder="카드 비밀번호 앞 두자리"
                type="password"
                className="w-full px-4 py-3 text-[14px] outline-none bg-white"
                style={{ borderRadius: "10px", boxShadow: "rgba(0,0,0,0.06) 0px 0px 0px 1px" }}
              />
            </div>
            <div>
              <label className="block text-[13px] font-semibold mb-1.5">이메일</label>
              <input
                placeholder="결제 결과 발송을 위한 이메일"
                className="w-full px-4 py-3 text-[14px] outline-none bg-white"
                style={{ borderRadius: "10px", boxShadow: "rgba(0,0,0,0.06) 0px 0px 0px 1px" }}
              />
            </div>
          </div>

          {/* 휴대폰 번호 */}
          <div className="mb-7">
            <label className="block text-[13px] font-semibold mb-1.5">휴대폰 번호</label>
            <input
              placeholder="- 를 제외한 휴대폰 번호"
              className="w-full px-4 py-3 text-[14px] outline-none bg-white"
              style={{ borderRadius: "10px", boxShadow: "rgba(0,0,0,0.06) 0px 0px 0px 1px", maxWidth: "calc(50% - 8px)" }}
            />
          </div>

          {/* 약관 동의 */}
          <div className="mb-8">
            <label
              className="flex items-center gap-2.5 cursor-pointer mb-3"
              onClick={toggleAll}
            >
              <span
                className="w-5 h-5 rounded-full flex items-center justify-center shrink-0 transition-colors"
                style={{
                  backgroundColor: allChecked ? "#1a1a1a" : "#fff",
                  boxShadow: allChecked ? "none" : "rgba(0,0,0,0.12) 0px 0px 0px 1.5px",
                }}
              >
                {allChecked && <Check size={12} strokeWidth={2.5} color="#fff" />}
              </span>
              <span className="text-[14px] font-semibold">
                전자결제 서비스 이용약관에 모두 동의합니다. <span className="text-[#ef4444]">*</span>
              </span>
            </label>
            <div className="ml-7 flex flex-col gap-2">
              {terms.map((t, i) => (
                <label
                  key={t}
                  className="flex items-center gap-2.5 cursor-pointer"
                  onClick={() => toggleOne(i)}
                >
                  <span
                    className="w-4 h-4 rounded-full flex items-center justify-center shrink-0 transition-colors"
                    style={{
                      backgroundColor: checks[i] ? "#1a1a1a" : "#fff",
                      boxShadow: checks[i] ? "none" : "rgba(0,0,0,0.12) 0px 0px 0px 1.5px",
                    }}
                  >
                    {checks[i] && <Check size={10} strokeWidth={2.5} color="#fff" />}
                  </span>
                  <span className="text-[13px] text-[#555]">{t}</span>
                  <span className="text-[12px] text-[#2563eb] cursor-pointer hover:underline ml-auto">상세보기 &gt;</span>
                </label>
              ))}
            </div>
          </div>

          {/* 입력 완료 버튼 */}
          <button
            onClick={onComplete}
            className="w-full py-[13px] text-[15px] font-semibold text-white bg-[#1a1a1a] rounded-xl cursor-pointer transition-opacity hover:opacity-80"
          >
            입력 완료
          </button>
        </div>
      </div>
    </ModalBackdrop>
  );
}

/* ═══════════════════════════════════════
   BNPL Add Modal (승인 후 BNPL 결제수단 추가)
   ═══════════════════════════════════════ */

function BNPLAddModal({ onClose, onComplete }: { onClose: () => void; onComplete: () => void }) {
  return (
    <ModalBackdrop onClose={onClose}>
      <div
        className="relative bg-white w-[480px] max-h-[85vh] overflow-y-auto"
        style={{ borderRadius: "20px", boxShadow: "rgba(0,0,0,0.08) 0px 8px 40px" }}
      >
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-10 w-8 h-8 rounded-lg flex items-center justify-center cursor-pointer hover:bg-[#f5f5f5] transition-colors"
        >
          <X size={18} strokeWidth={1.5} color="#777" />
        </button>

        <div className="px-8 pt-8 pb-8">
          <h3 className="text-[20px] font-semibold mb-1">BNPL 결제수단 추가</h3>
          <p className="text-[14px] text-[#777] mb-7">후불결제에 사용할 결제수단 정보를 입력해주세요.</p>

          <div className="mb-4">
            <label className="block text-[13px] font-semibold mb-1.5">
              <span className="text-[#ef4444] mr-0.5">*</span>결제수단 이름
            </label>
            <input
              placeholder="예: 소모품 구매용"
              className="w-full px-4 py-3 text-[14px] outline-none bg-white"
              style={{ borderRadius: "10px", boxShadow: "rgba(0,0,0,0.06) 0px 0px 0px 1px" }}
            />
          </div>

          <div className="mb-4">
            <label className="block text-[13px] font-semibold mb-1.5">정산 주기</label>
            <select
              className="w-full px-4 py-3 text-[14px] outline-none bg-white cursor-pointer"
              style={{ borderRadius: "10px", boxShadow: "rgba(0,0,0,0.06) 0px 0px 0px 1px" }}
            >
              <option>월 1회 (익월 말일)</option>
              <option>월 2회 (15일, 말일)</option>
            </select>
          </div>

          <div className="mb-4">
            <label className="block text-[13px] font-semibold mb-1.5">이메일</label>
            <input
              placeholder="결제 결과 발송을 위한 이메일"
              className="w-full px-4 py-3 text-[14px] outline-none bg-white"
              style={{ borderRadius: "10px", boxShadow: "rgba(0,0,0,0.06) 0px 0px 0px 1px" }}
            />
          </div>

          <div className="mb-6">
            <label className="block text-[13px] font-semibold mb-1.5">담당자</label>
            <input
              placeholder="담당자 이름"
              className="w-full px-4 py-3 text-[14px] outline-none bg-white"
              style={{ borderRadius: "10px", boxShadow: "rgba(0,0,0,0.06) 0px 0px 0px 1px" }}
            />
          </div>

          {/* 사업자 정보 요약 */}
          <div className="mb-7 p-4 bg-[#fafafa]" style={{ borderRadius: "10px" }}>
            <p className="text-[12px] font-medium text-[#999] mb-2">연결된 사업자정보</p>
            <div className="grid grid-cols-[80px_1fr] gap-y-1.5 text-[13px]">
              <span className="text-[#999]">사업자</span>
              <span className="font-medium text-[#333]">{businessInfo.bizNumber}</span>
              <span className="text-[#999]">대표자</span>
              <span className="font-medium text-[#333]">{businessInfo.ceo}</span>
            </div>
          </div>

          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="flex-1 py-[12px] text-[14px] font-medium text-[#777] bg-[#f5f5f5] rounded-xl cursor-pointer hover:bg-[#eee] transition-colors"
            >
              취소
            </button>
            <button
              onClick={onComplete}
              className="flex-1 py-[12px] text-[14px] font-medium text-white bg-[#1a1a1a] rounded-xl cursor-pointer transition-opacity hover:opacity-80"
            >
              추가하기
            </button>
          </div>
        </div>
      </div>
    </ModalBackdrop>
  );
}

/* ═══════════════════════════════════════
   BNPL Application Modal (최초 신청)
   ═══════════════════════════════════════ */

function BNPLApplicationModal({ onClose, onComplete }: { onClose: () => void; onComplete: () => void }) {
  const [done, setDone] = useState(false);

  if (done) {
    return (
      <ModalBackdrop onClose={onComplete}>
        <div className="relative bg-white w-[520px] p-10 text-center" style={{ borderRadius: "20px", boxShadow: "rgba(0,0,0,0.08) 0px 8px 40px" }}>
          <div className="w-16 h-16 rounded-full bg-[#f0fdf4] flex items-center justify-center mx-auto mb-5">
            <Check size={28} strokeWidth={2} color="#22c55e" />
          </div>
          <h2 className="text-[20px] font-semibold mb-2">신청이 완료되었습니다</h2>
          <p className="text-[14px] text-[#777] leading-[1.6] mb-6">
            사업자 신용정보 확인 후<br />승인여부를 알려드리겠습니다.
          </p>
          <button
            onClick={onComplete}
            className="px-8 py-[10px] text-[14px] font-medium text-white bg-black rounded-xl cursor-pointer transition-opacity hover:opacity-80"
          >
            확인
          </button>
        </div>
      </ModalBackdrop>
    );
  }

  return (
    <ModalBackdrop onClose={onClose}>
      <div
        className="relative bg-white w-[520px] max-h-[85vh] overflow-y-auto"
        style={{ borderRadius: "20px", boxShadow: "rgba(0,0,0,0.08) 0px 8px 40px" }}
      >
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-10 w-8 h-8 rounded-lg flex items-center justify-center cursor-pointer hover:bg-[#f5f5f5] transition-colors"
        >
          <X size={18} strokeWidth={1.5} color="#777" />
        </button>

        <div className="px-8 pt-8 pb-8">
          <h3 className="text-[20px] font-semibold mb-1">BNPL(후불결제) 신청</h3>
          <p className="text-[14px] text-[#777] mb-8">사업자정보를 확인하고 신청해주세요.</p>

          <div className="mb-8">
            <div className="flex items-center justify-between mb-3">
              <label className="text-[15px] font-semibold">증빙정보(사업자정보)</label>
              <button className="px-4 py-[6px] text-[13px] font-medium text-[#444] bg-white cursor-pointer transition-colors hover:bg-[#f5f5f5]" style={{ borderRadius: "8px", boxShadow: "rgba(0,0,0,0.06) 0px 0px 0px 1px" }}>
                사업자정보 선택
              </button>
            </div>
            <div className="p-4" style={{ borderRadius: "10px", boxShadow: "rgba(0,0,0,0.06) 0px 0px 0px 1px" }}>
              <div className="grid grid-cols-[100px_1fr] gap-y-2.5 text-[13px]">
                <span className="text-[#999]">대표자명</span>
                <span className="font-medium">{businessInfo.ceo}</span>
                <span className="text-[#999]">사업자 번호</span>
                <span className="font-medium">{businessInfo.bizNumber}</span>
                <span className="text-[#999]">사업장 주소</span>
                <span className="font-medium">{businessInfo.address}</span>
                <span className="text-[#999]">업태/업종</span>
                <span className="font-medium">{businessInfo.bizType}</span>
              </div>
            </div>
          </div>

          <button
            onClick={() => setDone(true)}
            className="w-full py-[12px] text-[15px] font-medium text-white bg-[#1a1a1a] rounded-xl cursor-pointer transition-opacity hover:opacity-80"
          >
            신청하기
          </button>
        </div>
      </div>
    </ModalBackdrop>
  );
}

/* ═══════════════════════════════════════
   Shared: Modal Backdrop
   ═══════════════════════════════════════ */

function ModalBackdrop({ children, onClose }: { children: React.ReactNode; onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative">{children}</div>
    </div>
  );
}
