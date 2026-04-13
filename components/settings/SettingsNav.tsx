"use client";

import {
  User, Link2, Building2, Plug,
  PieChart, Package, Bell,
} from "lucide-react";
import { useSettings, type SettingsSection } from "@/lib/settings-context";

interface NavGroup {
  label: string;
  items: { id: SettingsSection; label: string; icon: React.ComponentType<{ size?: number; strokeWidth?: number }> }[];
}

const groups: NavGroup[] = [
  {
    label: "개인 설정",
    items: [
      { id: "personal-general", label: "일반", icon: User },
      { id: "personal-plan", label: "플랜(사용량)", icon: PieChart },
      { id: "personal-connectors", label: "내 연결", icon: Link2 },
    ],
  },
  {
    label: "관리",
    items: [
      { id: "company-info", label: "회사 설정", icon: Building2 },
      { id: "apps", label: "커넥트 관리", icon: Plug },
      { id: "products", label: "전체 상품 관리", icon: Package },
      { id: "notifications", label: "알림 설정", icon: Bell },
    ],
  },
];

export default function SettingsNav() {
  const { section, setSection } = useSettings();

  return (
    <nav className="w-[220px] shrink-0 bg-[#fafafa] h-full overflow-y-auto py-4 px-3" style={{ borderRight: "1px solid rgba(0,0,0,0.05)" }}>
      {groups.map((group) => (
        <div key={group.label} className="mb-4">
          <p className="px-3 pb-1.5 text-[11px] font-medium text-[#999] uppercase tracking-wider">
            {group.label}
          </p>
          {group.items.map((item) => {
            const Icon = item.icon;
            const active = section === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setSection(item.id)}
                className="flex items-center gap-2.5 w-full px-3 py-[7px] rounded-lg text-[13px] cursor-pointer transition-all hover:bg-[#f0f0f0]"
                style={{
                  backgroundColor: active ? "#fff" : "transparent",
                  color: active ? "#111" : "#555",
                  fontWeight: active ? 500 : 400,
                  boxShadow: active ? "rgba(0,0,0,0.06) 0px 0px 0px 1px" : "none",
                }}
              >
                <span style={{ color: active ? "#333" : "#999" }}><Icon size={15} strokeWidth={1.5} /></span>
                {item.label}
              </button>
            );
          })}
        </div>
      ))}
    </nav>
  );
}
