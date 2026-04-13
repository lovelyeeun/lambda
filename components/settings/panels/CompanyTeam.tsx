"use client";

import { useState } from "react";
import { users } from "@/data/users";
import type { User } from "@/lib/types";
import Table, { type Column } from "@/components/ui/Table";
import Badge from "@/components/ui/Badge";
import { X, UserPlus, Bot, Mail, FileSpreadsheet, Trash2 } from "lucide-react";
import { useAgentPolicy, modeLabels, type AgentMode } from "@/lib/agent-policy-context";
import { useSettingsStore } from "@/lib/settings-store";
import TeamInviteModal from "@/components/settings/TeamInviteModal";

type BadgeStatus = "완료" | "대기" | "진행중" | "반려";
function roleBadge(r: string): BadgeStatus {
  if (r === "관리자") return "완료";
  if (r === "매니저") return "진행중";
  return "대기";
}

const modeColors: Record<AgentMode, string> = { open: "#22c55e", guided: "#f59e0b", locked: "#ef4444" };

export default function CompanyTeam() {
  const [selected, setSelected] = useState<User | null>(null);
  const [inviteOpen, setInviteOpen] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const { applyMode: policyApplyMode, userOverrides, getEffectivePolicy, setUserOverride } = useAgentPolicy();
  const { invitedMembers, addInvitedMembers, removeInvitedMember } = useSettingsStore();

  const columns: Column<User>[] = [
    { key: "name", header: "이름", render: (r) => <span className="font-medium">{r.name}</span> },
    { key: "email", header: "이메일" },
    { key: "department", header: "부서", width: "80px" },
    { key: "role", header: "역할", width: "80px", render: (r) => <Badge status={roleBadge(r.role)} /> },
  ];

  const showToast = (msg: string) => { setToast(msg); setTimeout(() => setToast(null), 2000); };

  return (
    <div className="max-w-[640px] relative">
      <div className="flex items-center justify-between mb-5">
        <h2 className="text-[18px] font-semibold">팀원 관리</h2>
        <button onClick={() => setInviteOpen(true)} className="flex items-center gap-1.5 px-4 py-[7px] text-[13px] font-medium text-white bg-black rounded-lg cursor-pointer hover:opacity-80">
          <UserPlus size={14} strokeWidth={1.5} />팀원 초대
        </button>
      </div>

      <Table columns={columns} data={users} rowKey={(r) => r.id} onRowClick={(r) => setSelected(r)} />

      {/* 초대 대기 멤버 — store 기반 (채팅 + 새 모달에서 추가됨) */}
      {invitedMembers.length > 0 && (
        <div className="mt-6">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-[13px] font-semibold text-[#1a1a1a]">초대 대기 ({invitedMembers.length})</h3>
            <span className="text-[11px] text-[#999]">초대 메일 발송 후 수락 대기 중</span>
          </div>
          <div className="flex flex-col gap-1.5">
            {invitedMembers.map((m) => (
              <div
                key={m.id}
                className="flex items-center gap-3 px-3 py-2.5"
                style={{ borderRadius: "10px", boxShadow: "rgba(0,0,0,0.06) 0px 0px 0px 1px" }}
              >
                {m.via === "email" ? (
                  <Mail size={13} strokeWidth={1.5} color="#999" />
                ) : (
                  <FileSpreadsheet size={13} strokeWidth={1.5} color="#999" />
                )}
                <span className="text-[13px] font-medium text-[#1a1a1a] w-[80px] shrink-0">{m.name}</span>
                <span className="text-[12px] text-[#777] flex-1 truncate">{m.email}</span>
                <span className="text-[11px] text-[#999] w-[64px] shrink-0">{m.department}</span>
                <span className="text-[11px] text-[#999] w-[64px] shrink-0">{m.role}</span>
                <span className="text-[10px] font-medium text-[#f59e0b] bg-[rgba(245,158,11,0.08)] px-2 py-0.5 rounded">대기</span>
                <button
                  onClick={() => { removeInvitedMember(m.id); showToast("초대를 취소했습니다"); }}
                  className="w-6 h-6 rounded-md flex items-center justify-center cursor-pointer hover:bg-[#f5f5f5]"
                  aria-label="초대 취소"
                >
                  <Trash2 size={12} strokeWidth={1.5} color="#999" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Side panel */}
      {selected && (
        <div className="fixed top-0 right-0 w-[360px] h-full bg-white z-50 overflow-y-auto" style={{ boxShadow: "rgba(0,0,0,0.08) -4px 0 20px" }}>
          <div className="flex items-center justify-between px-5 py-4 border-b border-[#e5e5e5]">
            <h3 className="text-[15px] font-semibold">{selected.name}</h3>
            <button onClick={() => setSelected(null)} className="w-7 h-7 rounded-lg flex items-center justify-center cursor-pointer hover:bg-[#f5f5f5]"><X size={16} strokeWidth={1.5} color="#777" /></button>
          </div>
          <div className="px-5 py-4 flex flex-col gap-5">
            <div><p className="text-[12px] text-[#999] mb-1">이메일</p><p className="text-[13px]">{selected.email}</p></div>
            <div>
              <p className="text-[12px] text-[#999] mb-1.5">부서</p>
              <select defaultValue={selected.department} className="w-full px-3 py-2 text-[13px] bg-white" style={{ borderRadius: "8px", boxShadow: "rgba(0,0,0,0.06) 0px 0px 0px 1px", border: "none", outline: "none" }}>
                <option>경영지원</option><option>마케팅</option><option>디자인</option><option>개발</option>
              </select>
            </div>
            <div>
              <p className="text-[12px] text-[#999] mb-1.5">역할</p>
              <select defaultValue={selected.role} className="w-full px-3 py-2 text-[13px] bg-white" style={{ borderRadius: "8px", boxShadow: "rgba(0,0,0,0.06) 0px 0px 0px 1px", border: "none", outline: "none" }}>
                <option>관리자</option><option>매니저</option><option>구매담당</option><option>일반</option>
              </select>
            </div>
            <div>
              <p className="text-[12px] text-[#999] mb-2">권한 설정</p>
              <div className="flex flex-col gap-2">
                <ToggleRow label="직접 구매 권한" defaultOn={selected.permissions.canPurchase} />
                <ToggleRow label="품의 승인 권한" defaultOn={selected.permissions.canApprove} />
                <ToggleRow label="AI 답변 제한" defaultOn={selected.permissions.aiRestricted} />
                <ToggleRow label="관리자 권한" defaultOn={selected.role === "관리자"} />
              </div>
            </div>
            {selected.permissions.canPurchase && (
              <div>
                <p className="text-[12px] text-[#999] mb-1">결제 한도</p>
                <input type="text" defaultValue={selected.permissions.purchaseLimit === 0 ? "무제한" : `${selected.permissions.purchaseLimit.toLocaleString()}원`} className="w-full px-3 py-2 text-[13px] bg-white outline-none" style={{ borderRadius: "8px", boxShadow: "rgba(0,0,0,0.06) 0px 0px 0px 1px" }} />
              </div>
            )}
            {/* 에이전트 정책 */}
            {policyApplyMode === "per-user" && (() => {
              const effective = getEffectivePolicy(selected.id);
              const hasOverride = !!userOverrides[selected.id];
              const currentMode = effective.mode;
              const color = modeColors[currentMode];
              return (
                <div>
                  <div className="flex items-center gap-1.5 mb-2">
                    <Bot size={13} strokeWidth={1.5} color="#999" />
                    <p className="text-[12px] text-[#999]">에이전트 정책</p>
                    {hasOverride && <span className="text-[10px] text-[#f59e0b] font-medium ml-auto">커스텀</span>}
                  </div>
                  <div className="flex items-center gap-2 mb-2">
                    <span className="inline-flex items-center gap-1 px-2 py-[3px] text-[11px] font-medium" style={{ borderRadius: "6px", backgroundColor: `${color}14`, color }}>
                      {modeLabels[currentMode]} 모드
                    </span>
                    <span className="text-[11px] text-[#999]">
                      채팅 구매: {effective.chatPurchaseEnabled ? "허용" : "비활성"}
                    </span>
                  </div>
                  <select
                    value={currentMode}
                    onChange={(e) => {
                      const mode = e.target.value as AgentMode;
                      setUserOverride(selected.id, { ...userOverrides[selected.id], mode });
                      showToast(`${selected.name}님의 모드가 변경되었습니다`);
                    }}
                    className="w-full px-3 py-2 text-[13px] bg-white cursor-pointer"
                    style={{ borderRadius: "8px", boxShadow: "rgba(0,0,0,0.06) 0px 0px 0px 1px", border: "none", outline: "none" }}
                  >
                    <option value="open">오픈 모드</option>
                    <option value="guided">가이드 모드</option>
                    <option value="locked">잠금 모드</option>
                  </select>
                </div>
              );
            })()}

            <div><p className="text-[12px] text-[#999] mb-1">이번 달 사용량</p><p className="text-[13px]">45 작업</p></div>
            <button onClick={() => { setSelected(null); showToast("저장되었습니다"); }} className="px-5 py-[9px] text-[14px] font-medium text-white bg-black rounded-xl cursor-pointer hover:opacity-80">저장</button>
          </div>
        </div>
      )}

      {/* Invite modal — 메일/엑셀 탭 */}
      <TeamInviteModal
        open={inviteOpen}
        onClose={() => setInviteOpen(false)}
        onSubmit={(members) => {
          addInvitedMembers(members);
          setInviteOpen(false);
          showToast(
            members.length === 1
              ? `${members[0].name}님께 초대 메일을 발송했습니다`
              : `${members.length}명에게 초대 메일을 발송했습니다`
          );
        }}
      />

      {toast && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 px-4 py-2.5 bg-[#1a1a1a] text-white text-[13px] font-medium" style={{ borderRadius: "10px" }}>{toast}</div>
      )}
    </div>
  );
}

function ToggleRow({ label, defaultOn }: { label: string; defaultOn: boolean }) {
  const [on, setOn] = useState(defaultOn);
  return (
    <div className="flex items-center justify-between">
      <span className="text-[13px] text-[#444]">{label}</span>
      <button onClick={() => setOn(!on)} className="w-10 h-5.5 rounded-full cursor-pointer relative" style={{ backgroundColor: on ? "#000" : "#e5e5e5", width: "40px", height: "22px" }}>
        <span className="absolute top-[2px] w-[18px] h-[18px] rounded-full bg-white transition-all" style={{ left: on ? "20px" : "2px", boxShadow: "rgba(0,0,0,0.1) 0px 1px 2px" }} />
      </button>
    </div>
  );
}
