"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { PlannedTooltip } from "@/components/ui/Tooltip";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  return (
    <div className="flex items-center justify-center min-h-screen bg-[#f5f5f5] px-6">
      <div className="w-full max-w-[380px]">
        <h1 className="text-[24px] font-semibold text-center mb-1" style={{ letterSpacing: "-0.3px" }}>로그인</h1>
        <p className="text-[14px] text-[#777] text-center mb-8">cockpit에 돌아오셨군요</p>

        <div className="flex flex-col gap-4">
          <div>
            <label className="block text-[12px] text-[#777] mb-1.5">이메일</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="email@company.com"
              className="w-full px-3.5 py-2.5 text-[14px] bg-white outline-none placeholder:text-[#bbb]"
              style={{ borderRadius: "10px", boxShadow: "rgba(0,0,0,0.06) 0px 0px 0px 1px" }}
            />
          </div>
          <div>
            <label className="block text-[12px] text-[#777] mb-1.5">비밀번호</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="비밀번호 입력"
              className="w-full px-3.5 py-2.5 text-[14px] bg-white outline-none placeholder:text-[#bbb]"
              style={{ borderRadius: "10px", boxShadow: "rgba(0,0,0,0.06) 0px 0px 0px 1px" }}
            />
          </div>
        </div>

        <div className="flex justify-end mt-2">
          <PlannedTooltip description="비밀번호 찾기" position="left">
            <button className="text-[12px] text-[#999] cursor-pointer hover:text-[#444]">비밀번호 찾기</button>
          </PlannedTooltip>
        </div>

        <button
          onClick={() => router.push("/chat")}
          className="w-full mt-4 py-[11px] text-[15px] font-medium text-white bg-black cursor-pointer transition-opacity hover:opacity-80"
          style={{ borderRadius: "9999px" }}
        >
          로그인
        </button>

        {/* Social */}
        <div className="flex items-center gap-3 my-5">
          <div className="flex-1 h-px bg-[#e5e5e5]" />
          <span className="text-[11px] text-[#bbb]">또는</span>
          <div className="flex-1 h-px bg-[#e5e5e5]" />
        </div>

        <div className="flex flex-col gap-2">
          <PlannedTooltip description="소셜 로그인" position="right">
            <button
              className="w-full py-[10px] text-[14px] font-medium text-[#444] bg-white cursor-pointer transition-colors hover:bg-[#fafafa]"
              style={{ borderRadius: "9999px", boxShadow: "rgba(0,0,0,0.06) 0px 0px 0px 1px" }}
            >
              Google로 계속하기
            </button>
          </PlannedTooltip>
          <PlannedTooltip description="소셜 로그인" position="right">
            <button
              className="w-full py-[10px] text-[14px] font-medium text-[#3B1E1E] cursor-pointer transition-colors hover:opacity-90"
              style={{ borderRadius: "9999px", backgroundColor: "#FEE500" }}
            >
              카카오로 계속하기
            </button>
          </PlannedTooltip>
        </div>

        <p className="text-[13px] text-[#777] text-center mt-5">
          계정이 없으신가요?{" "}
          <Link href="/onboarding/signup" className="text-[#000] underline underline-offset-2">회원가입</Link>
        </p>
      </div>
    </div>
  );
}
