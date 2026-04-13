"use client";

import { useEffect, useState } from "react";
import { X } from "lucide-react";
import { PlannedTooltip } from "@/components/ui/Tooltip";
import type { ShippingAddress } from "@/lib/settings-store";

export interface ShippingDraft {
  name: string;
  receiver: string;
  phone: string;
  zipcode: string;
  address: string;
  detailAddress: string;
  deliveryNote: string;
}

export function emptyShippingDraft(): ShippingDraft {
  return { name: "", receiver: "", phone: "", zipcode: "", address: "", detailAddress: "", deliveryNote: "" };
}

export function addressToDraft(a: Partial<ShippingAddress>): ShippingDraft {
  return {
    name: a.name ?? "",
    receiver: a.receiver ?? "",
    phone: a.phone ?? "",
    zipcode: a.zipcode ?? "",
    address: a.address ?? "",
    detailAddress: a.detailAddress ?? "",
    deliveryNote: a.deliveryNote ?? "",
  };
}

const DELIVERY_NOTE_OPTIONS = [
  "",
  "문 앞에 놓아주세요.",
  "경비실에 맡겨주세요.",
  "배송 전에 미리 연락 바랍니다.",
  "부재시 문 앞에 놓아주세요.",
  "직접 수령하겠습니다.",
];

interface Props {
  open: boolean;
  mode: "add" | "edit";
  initial?: ShippingDraft;
  onClose: () => void;
  onSubmit: (draft: ShippingDraft) => void;
}

export default function ShippingAddressModal({ open, mode, initial, onClose, onSubmit }: Props) {
  const [draft, setDraft] = useState<ShippingDraft>(initial ?? emptyShippingDraft());

  useEffect(() => {
    if (open) setDraft(initial ?? emptyShippingDraft());
  }, [open, initial]);

  if (!open) return null;

  const required = draft.name.trim() && draft.receiver.trim() && draft.phone.trim() && draft.address.trim();
  const title = mode === "edit" ? "배송지 수정" : "배송지 추가";
  const submitLabel = mode === "edit" ? "수정" : "추가";

  const setField = <K extends keyof ShippingDraft>(k: K, v: ShippingDraft[K]) =>
    setDraft((p) => ({ ...p, [k]: v }));

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div
        className="relative bg-white w-[480px] max-h-[85vh] overflow-y-auto"
        style={{ borderRadius: "16px", boxShadow: "rgba(0,0,0,0.08) 0px 8px 40px" }}
      >
        {/* 헤더 */}
        <div className="flex items-center justify-between px-6 pt-5 pb-3">
          <h3 className="text-[17px] font-semibold">{title}</h3>
          <button onClick={onClose} className="w-7 h-7 rounded-lg flex items-center justify-center cursor-pointer hover:bg-[#f5f5f5]">
            <X size={18} color="#777" />
          </button>
        </div>

        <div className="px-6 pb-5 flex flex-col gap-4">
          {/* 배송지 이름 */}
          <Field label="배송지 이름" required>
            <input
              value={draft.name}
              onChange={(e) => setField("name", e.target.value)}
              placeholder="예: 총무팀 (1)"
              className="w-full px-3 py-2.5 text-[13px] outline-none"
              style={inputStyle}
            />
          </Field>

          {/* 수령인 / 연락처 */}
          <div className="flex gap-3">
            <Field label="수령인" required className="flex-1">
              <input
                value={draft.receiver}
                onChange={(e) => setField("receiver", e.target.value)}
                className="w-full px-3 py-2.5 text-[13px] outline-none"
                style={inputStyle}
              />
            </Field>
            <Field label="연락처" required className="flex-1">
              <input
                value={draft.phone}
                onChange={(e) => setField("phone", e.target.value)}
                placeholder="010-0000-0000"
                className="w-full px-3 py-2.5 text-[13px] outline-none"
                style={inputStyle}
              />
            </Field>
          </div>

          {/* 배송지 주소 */}
          <Field label="배송지 주소" required>
            <div className="flex flex-col gap-2">
              <div className="flex gap-2">
                <input
                  value={draft.zipcode}
                  onChange={(e) => setField("zipcode", e.target.value)}
                  placeholder="우편번호"
                  readOnly
                  className="w-[140px] px-3 py-2.5 text-[13px] outline-none bg-[#fafafa] text-[#777]"
                  style={inputStyle}
                />
                <PlannedTooltip description="우편번호·주소 검색 연동 (다음 주소 API)">
                  <button
                    type="button"
                    className="px-4 py-2.5 text-[13px] font-medium text-white bg-black rounded-lg cursor-pointer hover:opacity-80"
                  >
                    주소 검색
                  </button>
                </PlannedTooltip>
              </div>
              <input
                value={draft.address}
                onChange={(e) => setField("address", e.target.value)}
                placeholder="도로명 주소"
                className="w-full px-3 py-2.5 text-[13px] outline-none"
                style={inputStyle}
              />
              <input
                value={draft.detailAddress}
                onChange={(e) => setField("detailAddress", e.target.value)}
                placeholder="상세주소 (동, 호수 등)"
                className="w-full px-3 py-2.5 text-[13px] outline-none"
                style={inputStyle}
              />
            </div>
          </Field>

          {/* 배송시 요청사항 */}
          <Field label="배송시 요청사항 (선택)">
            <select
              value={draft.deliveryNote}
              onChange={(e) => setField("deliveryNote", e.target.value)}
              className="w-full px-3 py-2.5 text-[13px] outline-none bg-white cursor-pointer"
              style={inputStyle}
            >
              <option value="">선택 안함</option>
              {DELIVERY_NOTE_OPTIONS.filter(Boolean).map((opt) => (
                <option key={opt} value={opt}>{opt}</option>
              ))}
            </select>
          </Field>
        </div>

        {/* 액션 */}
        <div className="flex justify-center gap-2 px-6 pb-6 pt-2">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2.5 text-[14px] font-medium text-[#4e4e4e] bg-white cursor-pointer hover:bg-[#fafafa]"
            style={{ borderRadius: "10px", boxShadow: "rgba(0,0,0,0.12) 0px 0px 0px 1px" }}
          >
            취소
          </button>
          <button
            disabled={!required}
            onClick={() => required && onSubmit(draft)}
            className="flex-1 px-4 py-2.5 text-[14px] font-medium text-white rounded-lg cursor-pointer transition-opacity"
            style={{
              backgroundColor: required ? "#000" : "#bdbdbd",
              cursor: required ? "pointer" : "not-allowed",
              borderRadius: "10px",
            }}
          >
            {submitLabel}
          </button>
        </div>
      </div>
    </div>
  );
}

const inputStyle = {
  borderRadius: "10px",
  boxShadow: "rgba(0,0,0,0.08) 0px 0px 0px 1px",
  border: "none",
} as const;

function Field({
  label,
  required,
  children,
  className,
}: {
  label: string;
  required?: boolean;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={className}>
      <label className="block text-[13px] font-semibold text-[#1a1a1a] mb-1.5">
        {required && <span className="text-[#ef4444] mr-1">*</span>}
        {label}
      </label>
      {children}
    </div>
  );
}
