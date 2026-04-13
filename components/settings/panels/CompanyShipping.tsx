"use client";

import { useState } from "react";
import { Plus, Pencil, Trash2, X } from "lucide-react";

interface Address { id: string; name: string; address: string; receiver: string; phone: string; isDefault: boolean; }

const initial: Address[] = [
  { id: "addr-1", name: "본사 3층", address: "서울시 강남구 테헤란로 152, 7층", receiver: "박은서", phone: "02-555-1234", isDefault: true },
  { id: "addr-2", name: "본사 5층 마케팅팀", address: "서울시 강남구 테헤란로 152, 5층", receiver: "이준호", phone: "02-555-5678", isDefault: false },
  { id: "addr-3", name: "물류센터", address: "경기도 성남시 분당구 판교로 256", receiver: "김태환", phone: "031-789-1000", isDefault: false },
];

export default function CompanyShipping() {
  const [addresses, setAddresses] = useState(initial);
  const [modalOpen, setModalOpen] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  const showToast = (msg: string) => { setToast(msg); setTimeout(() => setToast(null), 2000); };

  return (
    <div className="max-w-[520px]">
      <div className="flex items-center justify-between mb-5">
        <h2 className="text-[18px] font-semibold">배송지 관리</h2>
        <button onClick={() => setModalOpen(true)} className="flex items-center gap-1.5 px-3 py-[6px] text-[13px] font-medium text-[#4e4e4e] bg-[#f5f5f5] rounded-lg cursor-pointer hover:bg-[#ebebeb]">
          <Plus size={14} strokeWidth={1.5} />추가
        </button>
      </div>

      <div className="flex flex-col gap-3">
        {addresses.map((a) => (
          <div key={a.id} className="flex items-start gap-3 p-4" style={{ borderRadius: "12px", boxShadow: "rgba(0,0,0,0.06) 0px 0px 0px 1px" }}>
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <p className="text-[14px] font-medium">{a.name}</p>
                {a.isDefault && <span className="text-[10px] font-medium text-[#3b82f6] bg-[#eff6ff] px-1.5 py-0 rounded">기본</span>}
              </div>
              <p className="text-[13px] text-[#444]">{a.address}</p>
              <p className="text-[12px] text-[#999] mt-1">{a.receiver} · {a.phone}</p>
            </div>
            <div className="flex gap-1 shrink-0">
              <button className="w-7 h-7 rounded-lg flex items-center justify-center cursor-pointer hover:bg-[#f5f5f5]"><Pencil size={13} strokeWidth={1.5} color="#999" /></button>
              <button onClick={() => { setAddresses((p) => p.filter((x) => x.id !== a.id)); showToast("삭제되었습니다"); }} className="w-7 h-7 rounded-lg flex items-center justify-center cursor-pointer hover:bg-[#f5f5f5]"><Trash2 size={13} strokeWidth={1.5} color="#999" /></button>
            </div>
          </div>
        ))}
      </div>

      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/40" onClick={() => setModalOpen(false)} />
          <div className="relative bg-white p-6 w-[420px]" style={{ borderRadius: "16px", boxShadow: "rgba(0,0,0,0.08) 0px 8px 40px" }}>
            <div className="flex justify-between mb-4"><h3 className="text-[16px] font-semibold">배송지 추가</h3><button onClick={() => setModalOpen(false)}><X size={18} color="#777" /></button></div>
            {["주소명", "상세주소", "수령인", "연락처"].map((l) => (
              <div key={l} className="mb-3"><label className="block text-[12px] text-[#999] mb-1">{l}</label><input className="w-full px-3 py-2 text-[13px] outline-none" style={{ borderRadius: "8px", boxShadow: "rgba(0,0,0,0.06) 0px 0px 0px 1px" }} /></div>
            ))}
            <div className="flex justify-end gap-2 mt-4">
              <button onClick={() => setModalOpen(false)} className="px-4 py-2 text-[13px] text-[#777] bg-[#f5f5f5] rounded-lg cursor-pointer">취소</button>
              <button onClick={() => { setModalOpen(false); showToast("추가되었습니다"); }} className="px-4 py-2 text-[13px] text-white bg-black rounded-lg cursor-pointer">추가</button>
            </div>
          </div>
        </div>
      )}

      {toast && <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 px-4 py-2.5 bg-[#1a1a1a] text-white text-[13px] font-medium" style={{ borderRadius: "10px" }}>{toast}</div>}
    </div>
  );
}
