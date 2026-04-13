"use client";

import { useState } from "react";

interface NotifRow { id: string; label: string; desc: string; }

const notifTypes: NotifRow[] = [
  { id: "order-status", label: "주문 상태 변경", desc: "결제완료, 배송중, 배송완료 등" },
  { id: "approval", label: "승인 요청", desc: "품의 승인/반려 알림" },
  { id: "shipping", label: "배송 업데이트", desc: "배송 시작, 도착 예정, 완료" },
  { id: "budget", label: "예산 초과 경고", desc: "부서 예산 80% 이상 소진 시" },
];

const channels = ["인앱", "이메일", "슬랙"];

export default function NotificationsSettings() {
  const [settings, setSettings] = useState<Record<string, Set<string>>>(() => {
    const m: Record<string, Set<string>> = {};
    notifTypes.forEach((n) => { m[n.id] = new Set(["인앱"]); });
    m["approval"] = new Set(["인앱", "이메일", "슬랙"]);
    m["budget"] = new Set(["인앱", "이메일"]);
    return m;
  });
  const [toast, setToast] = useState<string | null>(null);

  // Contact info state
  const [contactEditMode, setContactEditMode] = useState(false);
  const [phone, setPhone] = useState("010-1234-5678");
  const [email, setEmail] = useState("one@rawlabs.io");
  const [tempPhone, setTempPhone] = useState(phone);
  const [tempEmail, setTempEmail] = useState(email);

  const toggle = (typeId: string, channel: string) => {
    setSettings((prev) => {
      const next = { ...prev };
      const s = new Set(prev[typeId]);
      s.has(channel) ? s.delete(channel) : s.add(channel);
      next[typeId] = s;
      return next;
    });
  };

  const handleEditClick = () => {
    setTempPhone(phone);
    setTempEmail(email);
    setContactEditMode(true);
  };

  const handleSaveContact = () => {
    setPhone(tempPhone);
    setEmail(tempEmail);
    setContactEditMode(false);
    setToast("연락처가 저장되었습니다");
    setTimeout(() => setToast(null), 2000);
  };

  const handleCancelContact = () => {
    setContactEditMode(false);
  };

  return (
    <div className="max-w-[520px]">
      <h2 className="text-[18px] font-semibold mb-2">알림 설정</h2>
      <p className="text-[13px] text-[#777] mb-6">알림 종류별 수신 채널을 설정합니다.</p>

      {/* Contact Info Section */}
      <div className="mb-6 p-4 rounded-[10px] border border-[#e5e5e5] bg-[#fafafa] relative">
        {!contactEditMode ? (
          <>
            <div className="flex justify-between items-start">
              <div>
                <p className="text-[12px] font-medium text-[#666] mb-3">연락처</p>
                <div className="space-y-2">
                  <p className="text-[13px] text-[#333]">
                    <span className="font-medium">전화:</span> {phone}
                  </p>
                  <p className="text-[13px] text-[#333]">
                    <span className="font-medium">이메일:</span> {email}
                  </p>
                </div>
              </div>
              <button
                onClick={handleEditClick}
                className="px-3 py-1.5 text-[12px] font-medium text-[#333] bg-white border border-[#d5d5d5] rounded-lg hover:bg-[#f5f5f5] cursor-pointer transition-colors"
              >
                수정
              </button>
            </div>
          </>
        ) : (
          <>
            <p className="text-[12px] font-medium text-[#666] mb-4">연락처</p>
            <div className="space-y-4">
              <div>
                <label className="text-[12px] font-medium text-[#666] block mb-2">전화</label>
                <input
                  type="text"
                  value={tempPhone}
                  onChange={(e) => setTempPhone(e.target.value)}
                  className="w-full px-3 py-2 text-[13px] border border-[#d5d5d5] rounded-lg focus:outline-none focus:border-black transition-colors"
                />
              </div>
              <div>
                <label className="text-[12px] font-medium text-[#666] block mb-2">이메일</label>
                <input
                  type="email"
                  value={tempEmail}
                  onChange={(e) => setTempEmail(e.target.value)}
                  className="w-full px-3 py-2 text-[13px] border border-[#d5d5d5] rounded-lg focus:outline-none focus:border-black transition-colors"
                />
              </div>
            </div>
            <div className="flex gap-2 mt-4 justify-end">
              <button
                onClick={handleCancelContact}
                className="px-3 py-1.5 text-[12px] font-medium text-[#666] bg-white border border-[#d5d5d5] rounded-lg hover:bg-[#f5f5f5] cursor-pointer transition-colors"
              >
                취소
              </button>
              <button
                onClick={handleSaveContact}
                className="px-3 py-1.5 text-[12px] font-medium text-white bg-black rounded-lg hover:opacity-80 cursor-pointer transition-colors"
              >
                저장
              </button>
            </div>
          </>
        )}
      </div>

      {/* Header */}
      <div className="grid gap-2 px-4 pb-2 text-[11px] font-medium text-[#999] uppercase tracking-wider" style={{ gridTemplateColumns: "1fr 70px 70px 70px" }}>
        <span>알림 종류</span>
        {channels.map((c) => <span key={c} className="text-center">{c}</span>)}
      </div>

      {/* Rows */}
      <div className="flex flex-col gap-2">
        {notifTypes.map((n) => (
          <div key={n.id} className="grid gap-2 px-4 py-3 items-center" style={{ gridTemplateColumns: "1fr 70px 70px 70px", borderRadius: "10px", boxShadow: "rgba(0,0,0,0.06) 0px 0px 0px 1px" }}>
            <div>
              <p className="text-[13px] font-medium">{n.label}</p>
              <p className="text-[11px] text-[#999]">{n.desc}</p>
            </div>
            {channels.map((ch) => (
              <div key={ch} className="flex justify-center">
                <button
                  onClick={() => toggle(n.id, ch)}
                  className="w-5 h-5 rounded flex items-center justify-center cursor-pointer transition-colors"
                  style={{
                    backgroundColor: settings[n.id]?.has(ch) ? "#000" : "#f5f5f5",
                    boxShadow: settings[n.id]?.has(ch) ? "none" : "rgba(0,0,0,0.06) 0px 0px 0px 1px",
                  }}
                >
                  {settings[n.id]?.has(ch) && (
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12" /></svg>
                  )}
                </button>
              </div>
            ))}
          </div>
        ))}
      </div>

      <button onClick={() => { setToast("저장되었습니다"); setTimeout(() => setToast(null), 2000); }} className="mt-6 px-5 py-[9px] text-[14px] font-medium text-white bg-black rounded-xl cursor-pointer hover:opacity-80">저장</button>
      {toast && <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 px-4 py-2.5 bg-[#1a1a1a] text-white text-[13px] font-medium" style={{ borderRadius: "10px" }}>{toast}</div>}
    </div>
  );
}
