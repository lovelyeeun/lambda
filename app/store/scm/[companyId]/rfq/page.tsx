"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { ChevronLeft, Send } from "lucide-react";
import { companies } from "@/data/companies";
import { useRightPanel } from "@/lib/right-panel-context";
import { PlannedTooltip } from "@/components/ui/Tooltip";

interface RFQForm {
  itemName: string;
  quantity: string;
  unitPrice: string;
  deliveryDate: string;
  paymentTerms: string;
  note: string;
}

const emptyForm: RFQForm = { itemName: "", quantity: "", unitPrice: "", deliveryDate: "", paymentTerms: "", note: "" };

/* ─── Chat flow steps ─── */

const steps = [
  { key: "itemName", question: "어떤 상품에 대한 견적을 요청하시나요?", placeholder: "예: 시디즈 T50 AIR 사무용 의자" },
  { key: "quantity", question: "필요한 수량은 몇 개인가요?", placeholder: "예: 20" },
  { key: "unitPrice", question: "희망 단가가 있으신가요? (없으면 '없음')", placeholder: "예: 450000 또는 없음" },
  { key: "deliveryDate", question: "희망 납기일은 언제인가요?", placeholder: "예: 2026-05-15" },
  { key: "paymentTerms", question: "결제 조건을 알려주세요.", placeholder: "예: 납품 후 30일 이내" },
  { key: "note", question: "추가 특이사항이 있으신가요? (없으면 '없음')", placeholder: "예: 20대 이상 추가 할인 요청" },
];

export default function RFQPage() {
  const params = useParams();
  const router = useRouter();
  const { openPanel } = useRightPanel();

  const company = companies.find((c) => c.id === params.companyId);
  const [messages, setMessages] = useState<{ role: string; content: string }[]>([]);
  const [stepIdx, setStepIdx] = useState(0);
  const [form, setForm] = useState<RFQForm>({ ...emptyForm });
  const [inputValue, setInputValue] = useState("");
  const [done, setDone] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  // Initial AI message
  useEffect(() => {
    if (messages.length === 0 && company) {
      setMessages([{
        role: "assistant",
        content: `${company.name}에 RFQ를 작성합니다.\n\n${steps[0].question}`,
      }]);
    }
  }, [company, messages.length]);

  // Sync right panel with form
  useEffect(() => {
    openPanel(<RFQFormPanel form={form} done={done} companyName={company?.name ?? ""} />);
  }, [form, done, company?.name, openPanel]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = useCallback(() => {
    const val = inputValue.trim();
    if (!val) return;

    setMessages((prev) => [...prev, { role: "user", content: val }]);
    setInputValue("");

    // Update form
    const key = steps[stepIdx]?.key as keyof RFQForm;
    if (key) {
      setForm((prev) => ({ ...prev, [key]: val === "없음" ? "" : val }));
    }

    // Next step
    const nextIdx = stepIdx + 1;
    if (nextIdx < steps.length) {
      setTimeout(() => {
        setStepIdx(nextIdx);
        setMessages((prev) => [...prev, { role: "assistant", content: steps[nextIdx].question }]);
      }, 400);
    } else {
      setTimeout(() => {
        setDone(true);
        setMessages((prev) => [...prev, {
          role: "assistant",
          content: "RFQ 작성이 완료되었습니다! 우측 패널에서 내용을 확인하고 발송해주세요.",
        }]);
      }, 400);
    }
  }, [inputValue, stepIdx]);

  if (!company) {
    return <div className="flex items-center justify-center h-full"><p className="text-[14px] text-[#777]">기업 정보 없음</p></div>;
  }

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center gap-3 px-6 py-3 bg-white shrink-0" style={{ borderBottom: "1px solid rgba(0,0,0,0.05)" }}>
        <button onClick={() => router.push(`/store/scm/${company.id}`)} className="flex items-center gap-1 text-[13px] text-[#777] cursor-pointer hover:text-[#444]">
          <ChevronLeft size={16} strokeWidth={1.5} />
          {company.name}
        </button>
        <span className="text-[13px] text-[#ccc]">/</span>
        <span className="text-[13px] font-medium">RFQ 작성</span>
      </div>

      {/* Chat */}
      <div className="flex-1 overflow-y-auto px-4 pt-6">
        <div className="max-w-[600px] mx-auto flex flex-col gap-2">
          {messages.map((msg, i) => (
            <div key={i} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
              <div
                className="max-w-[440px] px-3.5 py-2.5 text-[14px] leading-[1.6] whitespace-pre-line"
                style={{
                  borderRadius: msg.role === "user" ? "16px 16px 4px 16px" : "16px 16px 16px 4px",
                  backgroundColor: msg.role === "user" ? "#000" : "#fff",
                  color: msg.role === "user" ? "#fff" : "#000",
                  boxShadow: msg.role === "user" ? undefined : "rgba(0,0,0,0.06) 0px 0px 0px 1px, rgba(0,0,0,0.04) 0px 1px 2px",
                }}
              >
                {msg.content}
              </div>
            </div>
          ))}
          <div ref={bottomRef} />
        </div>
      </div>

      {/* Input */}
      {!done && (
        <div className="max-w-[600px] mx-auto w-full px-4 pb-4 pt-2">
          <div
            className="flex items-center gap-2 bg-white px-4 py-3"
            style={{ borderRadius: "14px", boxShadow: "rgba(0,0,0,0.06) 0px 0px 0px 1px, rgba(0,0,0,0.04) 0px 1px 2px" }}
          >
            <input
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={(e) => {
                if ((e.nativeEvent as KeyboardEvent).isComposing || e.keyCode === 229) return;
                if (e.key === "Enter") handleSend();
              }}
              placeholder={steps[stepIdx]?.placeholder ?? "입력..."}
              className="flex-1 text-[14px] outline-none bg-transparent placeholder:text-[#999]"
            />
            <button
              onClick={handleSend}
              disabled={!inputValue.trim()}
              className="w-8 h-8 rounded-full flex items-center justify-center cursor-pointer transition-opacity disabled:opacity-30"
              style={{ backgroundColor: inputValue.trim() ? "#000" : "#e5e5e5" }}
            >
              <Send size={14} color="#fff" strokeWidth={2} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

/* ─── Right panel: RFQ form ─── */

function RFQFormPanel({ form, done, companyName }: { form: RFQForm; done: boolean; companyName: string }) {
  const fields = [
    { label: "품목명", value: form.itemName },
    { label: "수량", value: form.quantity },
    { label: "희망 단가", value: form.unitPrice || "—" },
    { label: "납기일", value: form.deliveryDate },
    { label: "결제 조건", value: form.paymentTerms },
    { label: "특이사항", value: form.note || "—" },
  ];

  return (
    <div className="flex flex-col h-full">
      <div className="pb-3 mb-3" style={{ borderBottom: "1px solid #e5e5e5" }}>
        <h3 className="text-[15px] font-semibold">RFQ 견적요청서</h3>
        <p className="text-[12px] text-[#777] mt-0.5">대상: {companyName}</p>
      </div>

      <div className="flex-1 flex flex-col gap-3">
        {fields.map((f) => (
          <div key={f.label}>
            <p className="text-[11px] text-[#999] mb-0.5">{f.label}</p>
            <p className="text-[13px] text-[#222] min-h-[20px]" style={{ color: f.value && f.value !== "—" ? "#222" : "#ccc" }}>
              {f.value || "입력 대기..."}
            </p>
          </div>
        ))}
      </div>

      {done && (
        <div className="pt-3" style={{ borderTop: "1px solid #e5e5e5" }}>
          <PlannedTooltip description="실제 발송">
            <button className="w-full py-[10px] text-[14px] font-medium text-white bg-black rounded-xl cursor-pointer transition-opacity hover:opacity-80">
              <Send size={14} strokeWidth={1.5} className="inline mr-1.5 -mt-0.5" />
              RFQ 발송
            </button>
          </PlannedTooltip>
        </div>
      )}
    </div>
  );
}
