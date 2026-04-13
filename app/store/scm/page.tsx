"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { Search, Star } from "lucide-react";
import { companies } from "@/data/companies";
import { rfqs } from "@/data/rfqs";
import type { Company } from "@/lib/types";
import Table, { type Column } from "@/components/ui/Table";
import Badge from "@/components/ui/Badge";
import { PlannedTooltip } from "@/components/ui/Tooltip";

type BadgeStatus = "완료" | "대기" | "진행중" | "반려";

function contractBadge(s: string): BadgeStatus {
  if (s === "계약중") return "완료";
  if (s === "협상중") return "진행중";
  if (s === "미계약") return "대기";
  return "반려";
}

type Tab = "공급기업 탐색" | "공급기업 관리";

export default function SCMPage() {
  const [tab, setTab] = useState<Tab>("공급기업 탐색");
  const [search, setSearch] = useState("");
  const [catFilter, setCatFilter] = useState("전체");
  const router = useRouter();

  const categories = [...new Set(companies.map((c) => c.category))];

  const filtered = useMemo(() => {
    let list = tab === "공급기업 관리"
      ? companies.filter((c) => c.contractStatus === "계약중")
      : companies;
    if (search) {
      const q = search.toLowerCase();
      list = list.filter((c) => c.name.toLowerCase().includes(q) || c.category.toLowerCase().includes(q));
    }
    if (catFilter !== "전체") {
      list = list.filter((c) => c.category === catFilter);
    }
    return list;
  }, [tab, search, catFilter]);

  const columns: Column<Company>[] = [
    { key: "name", header: "기업명", render: (r) => <span className="font-medium">{r.name}</span> },
    { key: "category", header: "카테고리", width: "120px" },
    { key: "contact", header: "담당자", width: "80px" },
    { key: "contractStatus", header: "계약상태", width: "90px", render: (r) => <Badge status={contractBadge(r.contractStatus)} /> },
    { key: "rating", header: "평점", width: "70px", render: (r) => (
      <span className="flex items-center gap-1 text-[13px]">
        <Star size={12} strokeWidth={1.5} color="#f59e0b" fill="#f59e0b" />
        {r.rating}
      </span>
    )},
    { key: "transactionCount", header: "거래", width: "60px", render: (r) => `${r.transactionCount}건` },
  ];

  return (
    <div className="h-full overflow-y-auto">
      <div className="max-w-[880px] mx-auto px-6 py-8">
        <h1 className="text-[20px] font-semibold mb-5" style={{ letterSpacing: "-0.2px" }}>SCM</h1>

        {/* Tabs */}
        <div className="flex items-center gap-1 mb-5">
          {(["공급기업 탐색", "공급기업 관리"] as Tab[]).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className="px-4 py-[6px] text-[13px] font-medium cursor-pointer transition-all"
              style={{
                borderRadius: "9999px",
                backgroundColor: tab === t ? "#000" : "#f5f5f5",
                color: tab === t ? "#fff" : "#777",
              }}
            >
              {t}
            </button>
          ))}
        </div>

        {/* Search + filter */}
        <div className="flex items-center gap-3 mb-4">
          <div
            className="flex items-center gap-2 w-[240px] px-3 py-2 bg-white"
            style={{ borderRadius: "8px", boxShadow: "rgba(0,0,0,0.06) 0px 0px 0px 1px" }}
          >
            <Search size={14} strokeWidth={1.5} color="#999" />
            <input
              type="text"
              placeholder="기업명, 카테고리 검색..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="flex-1 text-[13px] outline-none bg-transparent placeholder:text-[#999]"
            />
          </div>
          <select
            value={catFilter}
            onChange={(e) => setCatFilter(e.target.value)}
            className="text-[12px] px-3 py-[6px] bg-white cursor-pointer"
            style={{ borderRadius: "6px", boxShadow: "rgba(0,0,0,0.06) 0px 0px 0px 1px", border: "none", outline: "none" }}
          >
            <option>전체</option>
            {categories.map((c) => <option key={c}>{c}</option>)}
          </select>
        </div>

        {/* Table */}
        <Table
          columns={columns}
          data={filtered}
          rowKey={(r) => r.id}
          onRowClick={(r) => router.push(`/store/scm/${r.id}`)}
          emptyMessage="기업이 없습니다"
        />

        {/* RFQ summary */}
        <div className="mt-6">
          <PlannedTooltip description="RFQ 내역 통합 뷰" position="right">
            <button className="text-[13px] text-[#777] underline underline-offset-2 cursor-pointer hover:text-[#444]">
              RFQ 내역 모아보기 ({rfqs.length}건)
            </button>
          </PlannedTooltip>
        </div>
      </div>
    </div>
  );
}
