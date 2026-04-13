import { MonitorSmartphone, Bell } from "lucide-react";
import { PlannedTooltip } from "@/components/ui/Tooltip";

export default function RentalPage() {
  return <ComingSoon icon={MonitorSmartphone} title="렌탈" description="사무기기, IT장비 렌탈 서비스를 준비하고 있습니다. 월 단위 렌탈로 초기 비용 부담 없이 최신 장비를 사용하세요." />;
}

function ComingSoon({ icon: Icon, title, description }: { icon: React.ComponentType<{ size?: number; strokeWidth?: number; color?: string }>; title: string; description: string }) {
  return (
    <div className="flex items-center justify-center h-full">
      <div className="flex flex-col items-center text-center max-w-[360px]">
        <div className="w-16 h-16 rounded-2xl bg-[#f5f5f5] flex items-center justify-center mb-4">
          <Icon size={28} strokeWidth={1.2} color="#bbb" />
        </div>
        <h2 className="text-[18px] font-semibold mb-2">{title}</h2>
        <p className="text-[14px] text-[#777] leading-[1.6] mb-6" style={{ letterSpacing: "0.14px" }}>{description}</p>
        <PlannedTooltip description="출시 알림">
          <button className="flex items-center gap-2 px-5 py-[9px] text-[14px] font-medium text-[#4e4e4e] bg-[#f5f5f5] rounded-xl cursor-pointer transition-colors hover:bg-[#ebebeb]">
            <Bell size={15} strokeWidth={1.5} />
            알림 받기
          </button>
        </PlannedTooltip>
        <p className="text-[12px] text-[#bbb] mt-3">준비중입니다</p>
      </div>
    </div>
  );
}
