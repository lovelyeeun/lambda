import Link from "next/link";
import { MessageSquare, FileCheck, BarChart3, Building2 } from "lucide-react";

const features = [
  { icon: MessageSquare, title: "AI 구매 상담", desc: "대화 한 번으로 상품 검색부터 주문까지" },
  { icon: FileCheck, title: "품의 자동화", desc: "소액 자동승인, 고액 담당자 알림" },
  { icon: BarChart3, title: "비용 인텔리전스", desc: "지출 분석과 동종업계 벤치마크" },
  { icon: Building2, title: "SCM", desc: "공급기업 관리, RFQ, 계약까지 한 곳에서" },
];

export default function LandingPage() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-[#f5f5f5] px-6">
      {/* Hero */}
      <div className="text-center mb-12">
        <h1
          className="text-[48px] leading-[1.08] mb-4"
          style={{ fontFamily: "var(--font-display, Inter)", fontWeight: 300, letterSpacing: "-0.96px", color: "#000" }}
        >
          cockpit
        </h1>
        <p className="text-[20px] text-[#000] mb-2" style={{ fontWeight: 400 }}>
          기업 구매, AI가 대신합니다
        </p>
        <p className="text-[16px] text-[#777169]" style={{ letterSpacing: "0.16px" }}>
          검색부터 주문, 결제, 배송까지 — 하나의 채팅으로
        </p>
      </div>

      {/* Features */}
      <div className="grid grid-cols-2 gap-4 max-w-[560px] w-full mb-12">
        {features.map((f) => {
          const Icon = f.icon;
          return (
            <div
              key={f.title}
              className="flex items-start gap-3.5 p-5 bg-white"
              style={{
                borderRadius: "16px",
                boxShadow: "rgba(0,0,0,0.06) 0px 0px 0px 1px, rgba(0,0,0,0.04) 0px 1px 2px, rgba(0,0,0,0.04) 0px 2px 4px",
              }}
            >
              <div className="w-10 h-10 rounded-xl bg-[#f5f5f5] flex items-center justify-center shrink-0">
                <Icon size={20} strokeWidth={1.5} color="#4e4e4e" />
              </div>
              <div>
                <p className="text-[14px] font-medium mb-0.5">{f.title}</p>
                <p className="text-[13px] text-[#777169]" style={{ letterSpacing: "0.14px" }}>{f.desc}</p>
              </div>
            </div>
          );
        })}
      </div>

      {/* CTAs */}
      <div className="flex items-center gap-3 mb-16">
        <Link
          href="/onboarding/signup"
          className="px-6 py-[11px] text-[15px] font-medium text-white bg-black cursor-pointer transition-opacity hover:opacity-80"
          style={{ borderRadius: "9999px", boxShadow: "rgba(0,0,0,0.4) 0px 0px 1px, rgba(0,0,0,0.04) 0px 4px 4px" }}
        >
          무료로 시작하기
        </Link>
        <Link
          href="/onboarding/login"
          className="px-6 py-[11px] text-[15px] font-medium text-[#000] bg-white cursor-pointer transition-opacity hover:opacity-80"
          style={{ borderRadius: "9999px", boxShadow: "rgba(0,0,0,0.4) 0px 0px 1px, rgba(0,0,0,0.04) 0px 4px 4px" }}
        >
          로그인
        </Link>
      </div>

      {/* Footer */}
      <p className="text-[12px] text-[#bbb]">cockpit by 로랩스</p>
    </div>
  );
}
