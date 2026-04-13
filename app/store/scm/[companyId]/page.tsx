"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { ChevronLeft, Star, FileText, Phone, Mail, MapPin, Building2 } from "lucide-react";
import { companies } from "@/data/companies";
import { rfqs } from "@/data/rfqs";
import { orders } from "@/data/orders";
import Badge from "@/components/ui/Badge";
import { PlannedTooltip } from "@/components/ui/Tooltip";

type Tab = "기업정보" | "거래기록" | "상품";

function formatPrice(n: number) { return n.toLocaleString("ko-KR") + "원"; }

export default function CompanyDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [tab, setTab] = useState<Tab>("기업정보");

  const company = companies.find((c) => c.id === params.companyId);
  const companyRfqs = rfqs.filter((r) => r.companyId === params.companyId);

  if (!company) {
    return (
      <div className="flex items-center justify-center h-full">
        <p className="text-[14px] text-[#777]">기업을 찾을 수 없습니다</p>
      </div>
    );
  }

  // Dummy transactions
  const transactions = [
    { date: "2026-04-03", product: "시디즈 T50 AIR 의자 5개", amount: 2490000 },
    { date: "2026-03-15", product: "시디즈 T25 의자 3개", amount: 897000 },
    { date: "2026-02-10", product: "시디즈 T50 AIR 의자 2개", amount: 996000 },
  ];

  const companyProducts = [
    { name: "시디즈 T50 AIR 메쉬 사무용 의자", price: 498000 },
    { name: "시디즈 T25 사무용 의자", price: 299000 },
    { name: "시디즈 T80 프리미엄 의자", price: 720000 },
  ];

  return (
    <div className="h-full overflow-y-auto">
      <div className="max-w-[800px] mx-auto px-6 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <button onClick={() => router.push("/store/scm")} className="flex items-center justify-center w-8 h-8 rounded-lg cursor-pointer hover:bg-[#f5f5f5]">
              <ChevronLeft size={18} strokeWidth={1.5} color="#4e4e4e" />
            </button>
            <div>
              <h1 className="text-[20px] font-semibold" style={{ letterSpacing: "-0.2px" }}>{company.name}</h1>
              <div className="flex items-center gap-2 mt-0.5">
                <span className="text-[13px] text-[#777]">{company.category}</span>
                <span className="flex items-center gap-0.5 text-[13px]">
                  <Star size={12} fill="#f59e0b" color="#f59e0b" />{company.rating}
                </span>
                <Badge status={company.contractStatus === "계약중" ? "완료" : company.contractStatus === "협상중" ? "진행중" : "대기"} />
              </div>
            </div>
          </div>
          <button
            onClick={() => router.push(`/store/scm/${company.id}/rfq`)}
            className="px-4 py-[8px] text-[13px] font-medium text-white bg-black rounded-lg cursor-pointer transition-opacity hover:opacity-80"
          >
            <FileText size={14} strokeWidth={1.5} className="inline mr-1.5 -mt-0.5" />
            RFQ 작성
          </button>
        </div>

        {/* Info card */}
        <div
          className="flex items-center gap-6 px-5 py-4 mb-6"
          style={{ borderRadius: "14px", boxShadow: "rgba(0,0,0,0.06) 0px 0px 0px 1px" }}
        >
          <div className="flex items-center gap-2 text-[13px] text-[#4e4e4e]">
            <Phone size={14} strokeWidth={1.5} color="#999" />{company.phone}
          </div>
          <div className="flex items-center gap-2 text-[13px] text-[#4e4e4e]">
            <Mail size={14} strokeWidth={1.5} color="#999" />{company.email}
          </div>
          <div className="flex items-center gap-2 text-[13px] text-[#4e4e4e]">
            <Building2 size={14} strokeWidth={1.5} color="#999" />{company.registrationNumber}
          </div>
        </div>

        {/* Tabs */}
        <div className="flex items-center gap-1 mb-5">
          {(["기업정보", "거래기록", "상품"] as Tab[]).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className="px-3 py-[5px] text-[12px] font-medium cursor-pointer transition-all"
              style={{
                borderRadius: "6px",
                backgroundColor: tab === t ? "#f0f0f0" : "transparent",
                color: tab === t ? "#111" : "#777",
              }}
            >
              {t}
            </button>
          ))}
        </div>

        {/* Tab content */}
        {tab === "기업정보" && (
          <div className="flex flex-col gap-4">
            <InfoRow label="주소"><MapPin size={13} strokeWidth={1.5} color="#999" className="inline mr-1" />{company.address}</InfoRow>
            <InfoRow label="담당자">{company.contact}</InfoRow>
            <InfoRow label="거래 횟수">{company.transactionCount}건</InfoRow>
            <InfoRow label="최근 거래">{company.lastTransaction ?? "—"}</InfoRow>
            {company.note && (
              <div>
                <p className="text-[12px] text-[#999] mb-1">특이사항</p>
                <div
                  className="px-4 py-3 text-[13px] text-[#444] leading-[1.6]"
                  style={{ borderRadius: "10px", backgroundColor: "#fafafa", boxShadow: "rgba(0,0,0,0.04) 0px 0px 0px 1px" }}
                >
                  {company.note}
                </div>
              </div>
            )}
            {companyRfqs.length > 0 && (
              <div>
                <p className="text-[12px] text-[#999] mb-2">RFQ 이력</p>
                {companyRfqs.map((r) => (
                  <div key={r.id} className="flex items-center justify-between px-3 py-2 text-[13px]" style={{ borderBottom: "1px solid rgba(0,0,0,0.04)" }}>
                    <span>{r.items.map((i) => i.name).join(", ")}</span>
                    <div className="flex items-center gap-2">
                      <Badge status={r.status === "계약진행" ? "진행중" : r.status === "발송완료" || r.status === "회신대기" ? "대기" : "진행중"} />
                      <PlannedTooltip description="전자 계약"><span className="text-[11px] text-[#bbb]">{r.status}</span></PlannedTooltip>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {tab === "거래기록" && (
          <div className="flex flex-col">
            {transactions.map((t, i) => (
              <div
                key={i}
                className="flex items-center justify-between px-4 py-3 text-[13px]"
                style={{ borderBottom: i < transactions.length - 1 ? "1px solid rgba(0,0,0,0.04)" : undefined }}
              >
                <span className="text-[#777] w-[90px]">{t.date}</span>
                <span className="flex-1">{t.product}</span>
                <span className="font-medium">{formatPrice(t.amount)}</span>
              </div>
            ))}
          </div>
        )}

        {tab === "상품" && (
          <div className="flex flex-col gap-2">
            {companyProducts.map((p, i) => (
              <div
                key={i}
                className="flex items-center justify-between px-4 py-3 bg-white"
                style={{ borderRadius: "10px", boxShadow: "rgba(0,0,0,0.06) 0px 0px 0px 1px" }}
              >
                <span className="text-[14px]">{p.name}</span>
                <span className="text-[14px] font-medium">{formatPrice(p.price)}</span>
              </div>
            ))}
            <PlannedTooltip description="상품 등록">
              <button className="mt-2 px-4 py-[8px] text-[13px] text-[#777] bg-[#f5f5f5] rounded-lg cursor-pointer hover:bg-[#ebebeb] transition-colors">
                + 상품 등록하기
              </button>
            </PlannedTooltip>
          </div>
        )}
      </div>
    </div>
  );
}

function InfoRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex">
      <span className="w-[90px] text-[12px] text-[#999] pt-0.5 shrink-0">{label}</span>
      <span className="text-[13px] text-[#444]">{children}</span>
    </div>
  );
}
