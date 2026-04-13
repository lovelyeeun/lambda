import { Flower2, Bell } from "lucide-react";
import { PlannedTooltip } from "@/components/ui/Tooltip";

export default function FlowersPage() {
  return (
    <div className="flex items-center justify-center h-full">
      <div className="flex flex-col items-center text-center max-w-[360px]">
        <div className="w-16 h-16 rounded-2xl bg-[#f5f5f5] flex items-center justify-center mb-4">
          <Flower2 size={28} strokeWidth={1.2} color="#bbb" />
        </div>
        <h2 className="text-[18px] font-semibold mb-2">화환</h2>
        <p className="text-[14px] text-[#777] leading-[1.6] mb-6" style={{ letterSpacing: "0.14px" }}>
          축하/조의 화환 주문 서비스를 준비하고 있습니다. 전국 당일 배송으로 간편하게 화환을 보내세요.
        </p>
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
