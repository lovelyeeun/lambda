"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Upload } from "lucide-react";
import { SERVICE_NAME } from "@/lib/constants";

export default function SignupPage() {
  const router = useRouter();
  const [form, setForm] = useState({ email: "", password: "", passwordConfirm: "", name: "", company: "" });
  const [errors, setErrors] = useState<Record<string, boolean>>({});
  const [uploaded, setUploaded] = useState(false);

  const update = (key: string, val: string) => {
    setForm((p) => ({ ...p, [key]: val }));
    setErrors((p) => ({ ...p, [key]: false }));
  };

  const handleSubmit = () => {
    const e: Record<string, boolean> = {};
    if (!form.email) e.email = true;
    if (!form.password) e.password = true;
    if (!form.passwordConfirm) e.passwordConfirm = true;
    if (form.password !== form.passwordConfirm) e.passwordConfirm = true;
    if (!form.name) e.name = true;
    if (!form.company) e.company = true;
    setErrors(e);
    if (Object.keys(e).length === 0) router.push("/chat?type=onboarding");
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-[#f5f5f5] px-6">
      <div className="w-full max-w-[420px]">
        <h1 className="text-[24px] font-semibold text-center mb-1" style={{ letterSpacing: "-0.3px" }}>회원가입</h1>
        <p className="text-[14px] text-[#777] text-center mb-8">{`${SERVICE_NAME}과 함께 시작하세요`}</p>

        <div className="flex flex-col gap-4">
          <Field label="이메일" type="email" value={form.email} onChange={(v) => update("email", v)} error={errors.email} placeholder="email@company.com" />
          <Field label="비밀번호" type="password" value={form.password} onChange={(v) => update("password", v)} error={errors.password} placeholder="8자 이상" />
          <Field
            label="비밀번호 확인"
            type="password"
            value={form.passwordConfirm}
            onChange={(v) => update("passwordConfirm", v)}
            error={errors.passwordConfirm}
            placeholder="비밀번호를 다시 입력"
            hint={errors.passwordConfirm && form.passwordConfirm ? "비밀번호가 일치하지 않습니다" : undefined}
          />
          <Field label="이름" value={form.name} onChange={(v) => update("name", v)} error={errors.name} placeholder="홍길동" />
          <Field label="회사명" value={form.company} onChange={(v) => update("company", v)} error={errors.company} placeholder="주식회사 로랩스" />

          {/* Business registration upload */}
          <div>
            <label className="block text-[12px] text-[#777] mb-1.5">사업자등록증</label>
            <div
              onClick={() => setUploaded(true)}
              className="flex flex-col items-center py-6 cursor-pointer transition-colors hover:bg-[#fafafa]"
              style={{ borderRadius: "12px", border: uploaded ? "1px solid #22c55e" : "2px dashed #e5e5e5", backgroundColor: uploaded ? "#f0fdf4" : "#fff" }}
            >
              <Upload size={20} strokeWidth={1.2} color={uploaded ? "#22c55e" : "#ccc"} />
              <p className="text-[13px] mt-2" style={{ color: uploaded ? "#22c55e" : "#777" }}>
                {uploaded ? "사업자등록증.pdf 업로드 완료" : "클릭하여 업로드"}
              </p>
            </div>
          </div>
        </div>

        <button
          onClick={handleSubmit}
          className="w-full mt-6 py-[11px] text-[15px] font-medium text-white bg-black cursor-pointer transition-opacity hover:opacity-80"
          style={{ borderRadius: "9999px" }}
        >
          회원가입
        </button>

        <p className="text-[13px] text-[#777] text-center mt-4">
          이미 계정이 있으신가요?{" "}
          <Link href="/onboarding/login" className="text-[#000] underline underline-offset-2">로그인</Link>
        </p>
      </div>
    </div>
  );
}

function Field({ label, type = "text", value, onChange, error, placeholder, hint }: {
  label: string; type?: string; value: string; onChange: (v: string) => void; error?: boolean; placeholder?: string; hint?: string;
}) {
  return (
    <div>
      <label className="block text-[12px] text-[#777] mb-1.5">{label}</label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full px-3.5 py-2.5 text-[14px] outline-none placeholder:text-[#bbb]"
        style={{
          borderRadius: "10px",
          boxShadow: error ? "rgba(239,68,68,0.5) 0px 0px 0px 1.5px" : "rgba(0,0,0,0.06) 0px 0px 0px 1px",
          backgroundColor: "#fff",
        }}
      />
      {hint && <p className="text-[11px] text-[#ef4444] mt-1">{hint}</p>}
    </div>
  );
}
